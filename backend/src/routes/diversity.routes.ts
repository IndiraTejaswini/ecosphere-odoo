import { Router } from 'express';
import DiversityMetric from '../models/Diversity';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/diversity - paginated, optionally filtered by department/period.
 * Reads open to any logged-in user (dashboard display); writes Admin-only.
 */
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};
  if (req.query.department) filter.department = req.query.department;
  if (req.query.period) filter.period = req.query.period;

  const [items, total] = await Promise.all([
    DiversityMetric.find(filter).populate('department', 'name code').skip(skip).limit(limit).sort({ period: -1 }),
    DiversityMetric.countDocuments(filter),
  ]);

  res.json({ data: items, page, limit, total, totalPages: Math.ceil(total / limit) });
});

/** POST /api/diversity - Admin only. Upserts one record per department+period. */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { department, period, headcountTotal, headcountFemale, headcountMale, headcountOther, notes } = req.body;
    if (!department || !period || headcountTotal === undefined) {
      return res.status(400).json({ message: 'department, period and headcountTotal are required' });
    }

    const updated = await DiversityMetric.findOneAndUpdate(
      { department, period },
      { department, period, headcountTotal, headcountFemale, headcountMale, headcountOther, notes },
      { new: true, upsert: true, runValidators: true }
    );

    // findOneAndUpdate bypasses the pre('save') hook that computes femalePercentage,
    // so we re-save the returned doc once to keep the derived field in sync.
    await updated.save();

    res.status(201).json(updated);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const deleted = await DiversityMetric.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: 'Diversity metric not found' });
  res.json({ message: 'Diversity metric deleted' });
});

export default router;
