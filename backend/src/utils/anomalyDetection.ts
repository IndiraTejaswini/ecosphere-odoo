import mongoose, { Types } from 'mongoose';

/**
 * ============================================================================
 * Lightweight Anomaly Detection  (Boss Level Add-On #9)
 * ============================================================================
 * Compares an incoming CarbonTransaction's CO2e value against the department's
 * historical average (of previously CONFIRMED transactions). Flags spikes
 * >= ANOMALY_MULTIPLIER as "Flagged" so an admin reviews before the number
 * feeds into official ESG reports and department scores.
 *
 * Intentionally a simple mean-based check (not full z-score/stddev) to stay
 * fast and dependency-free on a hackathon clock. Upgrade path noted below.
 *
 * NOTE: uses `mongoose.model('CarbonTransaction')` instead of a static import
 * to avoid a circular import (CarbonTransaction.ts's pre-save hook imports
 * THIS file, so this file can't import CarbonTransaction.ts back statically).
 * ============================================================================
 */
const ANOMALY_MULTIPLIER = 10;
const MIN_HISTORY_FOR_COMPARISON = 5;

export async function detectAnomaly(
  departmentId: Types.ObjectId,
  calculatedCO2e: number
): Promise<{ isAnomalous: boolean; departmentAverage: number; sampleSize: number }> {
  const CarbonTransaction = mongoose.model('CarbonTransaction');

  const stats = await CarbonTransaction.aggregate([
    { $match: { department: departmentId, status: 'Confirmed' } },
    { $group: { _id: null, avgCO2e: { $avg: '$calculatedCO2e' }, count: { $sum: 1 } } },
  ]);

  const avg: number = stats[0]?.avgCO2e ?? 0;
  const count: number = stats[0]?.count ?? 0;

  if (count < MIN_HISTORY_FOR_COMPARISON || avg === 0) {
    return { isAnomalous: false, departmentAverage: avg, sampleSize: count };
  }

  const isAnomalous = calculatedCO2e >= avg * ANOMALY_MULTIPLIER;
  return { isAnomalous, departmentAverage: avg, sampleSize: count };

  // UPGRADE PATH (post-hackathon): replace the flat multiplier with a z-score,
  // e.g. $stdDevPop in the $group stage, then flag when
  // (calculatedCO2e - avg) / stdDev > 3.
}
