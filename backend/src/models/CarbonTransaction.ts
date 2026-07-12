import mongoose, { Schema, model, Document, Types } from 'mongoose';
import { computeHash, GENESIS_HASH } from '../utils/hashChain';
import { detectAnomaly } from '../utils/anomalyDetection';
import { applyConfirmedEmissionToGoals } from '../utils/goalTracking';

/**
 * ============================================================================
 * CarbonTransaction
 * ============================================================================
 * Stores calculated emissions from ERP operations (Purchase, Manufacturing,
 * Expense, Fleet, or Manual entry).
 *
 * --- HORIZONTAL SCALING / SHARDING NOTE (Architectural Mandate A) ---
 * At real production scale, this is by far the highest-write-volume
 * collection in the platform (every ERP transaction can spawn one). If you
 * were to shard this collection in MongoDB, `departmentId` is the right shard
 * key because:
 *   1. Nearly every read pattern in this app (dashboards, reports, goal
 *      tracking) filters BY department first -> a department-keyed shard
 *      means those queries get routed (targeted) to a single shard instead
 *      of triggering a cluster-wide scatter-gather query across every shard.
 *   2. Write load is naturally distributed across departments in most orgs,
 *      so you avoid a "hot shard" as long as no single department dominates
 *      write volume (if it did, you'd use a compound shard key like
 *      { department: 1, timestamp: 1 } to spread that department's own writes
 *      across more chunks).
 *   3. The one trade-off: the hash-chain below (`previousHash`/`currentHash`)
 *      is currently a GLOBAL chain across all departments, which requires a
 *      cross-shard read for the "latest transaction" lookup on every insert.
 *      At extreme scale you'd switch to a PER-DEPARTMENT chain (each shard
 *      maintains its own chain) with a periodic Merkle-root reconciliation
 *      job that combines all per-department chain heads into one root hash
 *      for the Algorand anchor - fully sharding-compatible, no cross-shard
 *      writes needed. We kept a single global chain here for a hackathon
 *      demo because it's simpler to explain/verify end-to-end.
 * ==========================================================================*/
export interface ICarbonTransaction extends Document {
  department: Types.ObjectId;
  emissionFactor: Types.ObjectId;
  source: 'Purchase' | 'Manufacturing' | 'Expense' | 'Fleet' | 'Manual';
  quantity: number;
  calculatedCO2e: number;
  timestamp: Date;
  status: 'Confirmed' | 'Flagged' | 'Rejected';
  anomalyFlag: boolean;
  anomalyReason?: string;
  previousHash: string;
  currentHash: string;
  createdBy: Types.ObjectId;
}

const CarbonTransactionSchema = new Schema<ICarbonTransaction>({
  // index: true directly on heavily-filtered fields (Architectural Mandate C)
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
  emissionFactor: { type: Schema.Types.ObjectId, ref: 'EmissionFactor', required: true },
  source: {
    type: String,
    enum: ['Purchase', 'Manufacturing', 'Expense', 'Fleet', 'Manual'],
    required: true,
  },
  quantity: { type: Number, required: true },
  calculatedCO2e: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now, index: true },
  status: {
    type: String,
    enum: ['Confirmed', 'Flagged', 'Rejected'],
    default: 'Confirmed',
    index: true,
  },
  anomalyFlag: { type: Boolean, default: false },
  anomalyReason: { type: String },
  previousHash: { type: String, required: true },
  currentHash: { type: String, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'Employee' },
});

/**
 * ============================================================================
 * pre('save') hook: Anomaly Detection (#9) + Cryptographic Hash Chain (#4)
 * ============================================================================
 * Ledger entries are immutable once created - this hook only runs `isNew`
 * documents through the chain, and routes should never allow editing an
 * existing CarbonTransaction's core fields (only its `status`, via the admin
 * review endpoint, is ever mutated after creation).
 * ==========================================================================*/
CarbonTransactionSchema.pre('save', async function (next) {
  if (!this.isNew) return next();

  try {
    // 1) Anomaly detection against this department's history
    const { isAnomalous, departmentAverage } = await detectAnomaly(
      this.department as Types.ObjectId,
      this.calculatedCO2e
    );
    this.anomalyFlag = isAnomalous;
    this.status = isAnomalous ? 'Flagged' : 'Confirmed';
    if (isAnomalous) {
      this.anomalyReason = `Value ${this.calculatedCO2e.toFixed(
        2
      )} kg CO2e is >= 10x this department's historical average (${departmentAverage.toFixed(2)})`;
    }

    // 2) Cryptographic hash-chain link
    const CarbonTransactionModel = mongoose.model('CarbonTransaction');
    const previous: any = await CarbonTransactionModel.findOne().sort({ timestamp: -1, _id: -1 });
    this.previousHash = previous ? previous.currentHash : GENESIS_HASH;
    this.currentHash = computeHash(
      {
        department: this.department,
        source: this.source,
        quantity: this.quantity,
        calculatedCO2e: this.calculatedCO2e,
        timestamp: this.timestamp,
      },
      this.previousHash
    );

    next();
  } catch (err) {
    next(err as Error);
  }
});

/**
 * post('save') - only fires the goal-progress linkage for transactions that
 * were CONFIRMED on creation (the common case: normal, non-anomalous entries).
 * Transactions that come out of pre('save') as 'Flagged' are NOT counted here -
 * see the /review endpoint in routes/carbonTransaction.routes.ts, which
 * applies this same linkage at the moment an admin confirms a flagged entry,
 * so nothing gets double-counted and nothing rejected ever counts.
 */
CarbonTransactionSchema.post('save', async function (doc) {
  if (doc.status !== 'Confirmed') return;
  try {
    await applyConfirmedEmissionToGoals(doc.department as Types.ObjectId, doc.calculatedCO2e);
  } catch (err) {
    console.error('Goal progress linkage failed:', err);
  }
});

export default model<ICarbonTransaction>('CarbonTransaction', CarbonTransactionSchema);
