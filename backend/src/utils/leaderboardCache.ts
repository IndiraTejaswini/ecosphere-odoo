import mongoose from 'mongoose';

/**
 * ============================================================================
 * In-Memory Leaderboard Cache  (Boss Level Add-On #11)
 * ============================================================================
 * A plain JS array acting as a poor-man's Redis cache. Rebuilt whenever:
 *   1. XP or badges change (Employee post-save hook calls updateLeaderboardCache)
 *   2. Every 5 minutes via cron (safety net / catches any $inc-based XP updates
 *      that bypass .save())
 *   3. Once at server boot
 *
 * The GET /api/leaderboard route reads straight from this array - zero DB
 * round-trip on the read path, <5ms response times even under load.
 *
 * CAVEAT (documented on purpose): this cache lives in ONE Node process's
 * memory. If you ever run this behind a multi-instance/cluster deployment,
 * you'd swap this module's internals for real Redis (`ZADD` / `ZREVRANGE`)
 * without touching any route code, since routes only call the two exported
 * functions below.
 * ============================================================================
 */
interface LeaderboardEntry {
  employeeId: string;
  name: string;
  department?: string;
  xp: number;
  points: number;
  rank: number;
}

let leaderboardCache: LeaderboardEntry[] = [];
let lastUpdated: Date | null = null;

export async function updateLeaderboardCache(): Promise<void> {
  const Employee = mongoose.model('Employee');

  const top: any[] = await Employee.find({})
    .select('name xp points department')
    .populate('department', 'name')
    .sort({ xp: -1 })
    .limit(100)
    .lean();

  leaderboardCache = top.map((emp, idx) => ({
    employeeId: String(emp._id),
    name: emp.name,
    department: emp.department?.name,
    xp: emp.xp,
    points: emp.points,
    rank: idx + 1,
  }));

  lastUpdated = new Date();
}

export function getLeaderboardCache() {
  return { leaderboard: leaderboardCache, lastUpdated };
}
