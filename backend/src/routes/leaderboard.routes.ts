import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { getLeaderboardCache, updateLeaderboardCache } from '../utils/leaderboardCache';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/leaderboard - serves straight from the in-memory cache
 * (Boss Level Add-On #11), <5ms response time. Cache is refreshed on badge/
 * XP changes, every 5 minutes via cron, and once at server boot.
 */
router.get('/', async (_req, res) => {
  const { leaderboard, lastUpdated } = getLeaderboardCache();

  // Cold-start safety net: if the server just booted and the cache is
  // somehow still empty, populate it on-demand this one time.
  if (leaderboard.length === 0) {
    await updateLeaderboardCache();
    return res.json(getLeaderboardCache());
  }

  res.json({ leaderboard, lastUpdated });
});

export default router;
