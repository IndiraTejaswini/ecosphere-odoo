import { Schema, model, Document, Types } from 'mongoose';

/**
 * DepartmentScore - a periodic SNAPSHOT of aggregated ESG performance per
 * department. The live/real-time score is always computed on-demand via the
 * aggregation pipeline in routes/reports.routes.ts (GET /api/reports/esg-score),
 * but storing snapshots here lets you show trend lines ("how has our ESG
 * score moved month over month") without re-running the full aggregation
 * over historical data every time.
 */
export interface IDepartmentScore extends Document {
  department: Types.ObjectId;
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  totalScore: number;
  period: string; // e.g. "2026-07"
  computedAt: Date;
}

const DepartmentScoreSchema = new Schema<IDepartmentScore>({
  department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
  environmentalScore: { type: Number, required: true },
  socialScore: { type: Number, required: true },
  governanceScore: { type: Number, required: true },
  totalScore: { type: Number, required: true },
  period: { type: String, required: true, index: true },
  computedAt: { type: Date, default: Date.now },
});
DepartmentScoreSchema.index({ department: 1, period: 1 }, { unique: true });

export default model<IDepartmentScore>('DepartmentScore', DepartmentScoreSchema);
