import mongoose, { Types } from 'mongoose';

/**
 * ============================================================================
 * Goal Progress Tracking  (Gap Fix: the Business Workflow diagram explicitly
 * shows Carbon Transactions -> Environmental Score as a live data flow, but
 * the original build left EnvironmentalGoal.currentCO2 as a value only ever
 * set manually through the master-data CRUD endpoint - with zero actual
 * linkage to real CarbonTransaction records. This closes that gap.)
 * ============================================================================
 * Whenever a CarbonTransaction is CONFIRMED (never for Flagged/Rejected -
 * unconfirmed or rejected anomalies must not pollute official tracking), every
 * non-Completed EnvironmentalGoal for that department gets its `currentCO2`
 * incremented by the transaction's calculatedCO2e. This keeps goal progress -
 * and therefore the Environmental score and the predictive trajectory
 * endpoint - genuinely driven by the transaction ledger, not a static number.
 *
 * SIMPLIFYING ASSUMPTION (documented, not hidden): if a department has
 * multiple concurrent active goals, ALL of them get incremented by the same
 * transaction. Real-world ESG tooling might scope a goal to a specific
 * emission-factor category or time window; that's a reasonable v2 refinement
 * once you know which goals are actually concurrent for your demo departments.
 * ==========================================================================*/
export async function applyConfirmedEmissionToGoals(departmentId: Types.ObjectId, calculatedCO2e: number): Promise<void> {
  const EnvironmentalGoal = mongoose.model('EnvironmentalGoal');
  await EnvironmentalGoal.updateMany(
    { department: departmentId, status: { $ne: 'Completed' }, isActive: { $ne: false } },
    { $inc: { currentCO2: calculatedCO2e } }
  );
}
