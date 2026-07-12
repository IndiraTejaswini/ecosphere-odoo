import { Router } from 'express';
import Settings, { SETTINGS_SINGLETON_ID } from '../models/Settings';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { refreshSettingsCache, getSettings } from '../utils/settingsCache';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/settings - any authenticated user can READ settings (the frontend
 * needs to know e.g. whether evidence is required before rendering an
 * "Approve" button as disabled). Only Admins can WRITE.
 */
router.get('/', async (_req, res) => {
  const settings = await getSettings();
  res.json(settings);
});

/**
 * PUT /api/settings - Admin only. Partial updates supported - only send the
 * fields you want to change. If `esgWeighting` is included, its three values
 * must sum to (approximately) 1, matching the business rule that Environmental
 * + Social + Governance weighting is configurable per organization but must
 * still total 100%.
 */
router.put('/', requireAdmin, async (req, res) => {
  const { esgWeighting, ...rest } = req.body;

  if (esgWeighting) {
    const sum = (esgWeighting.environmental ?? 0) + (esgWeighting.social ?? 0) + (esgWeighting.governance ?? 0);
    if (Math.abs(sum - 1) > 0.01) {
      return res.status(400).json({
        message: `esgWeighting values must sum to 1 (got ${sum.toFixed(2)}). e.g. { environmental: 0.4, social: 0.3, governance: 0.3 }`,
      });
    }
  }

  const updated = await Settings.findByIdAndUpdate(
    SETTINGS_SINGLETON_ID,
    { ...rest, ...(esgWeighting ? { esgWeighting } : {}) },
    { new: true, upsert: true, runValidators: true }
  );

  refreshSettingsCache(updated as any);
  res.json(updated);
});

export default router;
