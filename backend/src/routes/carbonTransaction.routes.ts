import { Router } from 'express';
import CarbonTransaction from '../models/CarbonTransaction';
import { EmissionFactor } from '../models/MasterData';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { getSettings } from '../utils/settingsCache';
import { applyConfirmedEmissionToGoals } from '../utils/goalTracking';

const router = Router();
router.use(authenticateToken);

/**
 * POST /api/carbon-transactions
 * Body: { department, emissionFactor, source, quantity }
 * calculatedCO2e = quantity * emissionFactor.factorValue
 * Anomaly detection + hash-chaining happen automatically in the model's
 * pre('save') hook.
 */
router.post('/', async (req: AuthRequest, res) => {
  try {
    const { department, emissionFactor, source, quantity } = req.body;
    if (!department || !emissionFactor || !source || quantity === undefined) {
      return res.status(400).json({ message: 'department, emissionFactor, source and quantity are required' });
    }

    const factor = await EmissionFactor.findById(emissionFactor);
    if (!factor) return res.status(404).json({ message: 'Emission factor not found' });

    const calculatedCO2e = Number(quantity) * factor.factorValue;

    const transaction = await CarbonTransaction.create({
      department,
      emissionFactor,
      source,
      quantity,
      calculatedCO2e,
      createdBy: req.user!.id,
    });

    res.status(201).json(transaction);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * ============================================================================
 * POST /api/carbon-transactions/erp-webhook  (Gap Fix: Section 8's "Auto
 * Emission Calculation" - "When enabled (Settings toggle), Carbon
 * Transactions are calculated automatically from linked Purchase/
 * Manufacturing/Expense/Fleet records ... no manual entry required.")
 * ============================================================================
 * HONEST SCOPE NOTE: this is the INTEGRATION POINT where your actual ERP
 * (Odoo, per the challenge brief) would call in via a webhook whenever a
 * Purchase/Manufacturing/Expense/Fleet record is created - not a full Odoo
 * integration itself, since that requires access to a real Odoo instance's
 * webhook/automation config that's outside this codebase's reach. This route
 * accepts the same shape of payload Odoo's automation rules would POST, does
 * the identical calculation + anomaly + hash-chain work as the manual POST /
 * endpoint above, and is a no-op (rejected) unless the Settings toggle is on -
 * so flipping "Auto Emission Calculation" ON in Settings is what you'd wire
 * your Odoo webhook to call once you have a live Odoo instance to point here.
 * ==========================================================================*/
router.post('/erp-webhook', requireAdmin, async (req: AuthRequest, res) => {
  const settings = await getSettings();
  if (!settings.autoEmissionCalculationEnabled) {
    return res.status(403).json({
      message: 'Auto Emission Calculation is disabled in Settings. Enable it via PUT /api/settings first.',
    });
  }

  try {
    const { department, emissionFactor, source, quantity } = req.body;
    if (!department || !emissionFactor || !source || quantity === undefined) {
      return res.status(400).json({ message: 'department, emissionFactor, source and quantity are required' });
    }

    const factor = await EmissionFactor.findById(emissionFactor);
    if (!factor) return res.status(404).json({ message: 'Emission factor not found' });

    const transaction = await CarbonTransaction.create({
      department,
      emissionFactor,
      source,
      quantity,
      calculatedCO2e: Number(quantity) * factor.factorValue,
      createdBy: req.user!.id, // the system/integration account making the call
    });

    res.status(201).json({ message: 'Auto-calculated from ERP record', transaction });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

/**
 * GET /api/carbon-transactions - paginated (Mandate D), filterable by
 * department + date range, with .select() excluding internal ledger fields
 * on normal list views (Mandate E) unless ?includeChain=true is passed.
 */
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};
  if (req.query.department) filter.department = req.query.department;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.dateFrom || req.query.dateTo) {
    filter.timestamp = {};
    if (req.query.dateFrom) filter.timestamp.$gte = new Date(req.query.dateFrom as string);
    if (req.query.dateTo) filter.timestamp.$lte = new Date(req.query.dateTo as string);
  }

  const excludeChainFields = req.query.includeChain === 'true' ? '' : '-previousHash -currentHash';

  const [items, total] = await Promise.all([
    CarbonTransaction.find(filter)
      .select(excludeChainFields)
      .populate('department', 'name code')
      .populate('emissionFactor', 'name unit factorValue')
      .skip(skip)
      .limit(limit)
      .sort({ timestamp: -1 }),
    CarbonTransaction.countDocuments(filter),
  ]);

  res.json({ data: items, page, limit, total, totalPages: Math.ceil(total / limit) });
});

router.get('/:id', async (req, res) => {
  const tx = await CarbonTransaction.findById(req.params.id)
    .populate('department', 'name code')
    .populate('emissionFactor', 'name unit factorValue');
  if (!tx) return res.status(404).json({ message: 'Transaction not found' });
  res.json(tx);
});

/**
 * PUT /api/carbon-transactions/:id/review - Admin only.
 * Resolves a flagged anomaly: either confirm it as legitimate or reject it.
 */
router.put('/:id/review', requireAdmin, async (req, res) => {
  const { decision } = req.body; // 'Confirmed' | 'Rejected'
  if (!['Confirmed', 'Rejected'].includes(decision)) {
    return res.status(400).json({ message: 'decision must be "Confirmed" or "Rejected"' });
  }

  const existing = await CarbonTransaction.findById(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Transaction not found' });

  const wasAlreadyCounted = existing.status === 'Confirmed';

  const tx = await CarbonTransaction.findByIdAndUpdate(
    req.params.id,
    { status: decision },
    { new: true }
  );
  if (!tx) return res.status(404).json({ message: 'Transaction not found' });

  // A Flagged transaction being Confirmed for the first time wasn't counted
  // toward EnvironmentalGoal progress at creation time (see the model's
  // post-save hook) - apply that linkage now. Rejected transactions, and
  // transactions that were already Confirmed, never/already got counted.
  if (decision === 'Confirmed' && !wasAlreadyCounted) {
    await applyConfirmedEmissionToGoals(tx.department as any, tx.calculatedCO2e);
  }

  res.json(tx);
});

export default router;
