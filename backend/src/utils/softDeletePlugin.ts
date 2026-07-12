import { Schema } from 'mongoose';

/**
 * ============================================================================
 * Soft Delete Ledger Plugin  (Boss Level Add-On #3)
 * ============================================================================
 * Attaches an `isActive` flag to any schema and transparently filters out
 * "deleted" (isActive: false) documents from every find-style query, so data
 * is NEVER permanently destroyed - it's just hidden from normal reads. This
 * gives you a full audit trail / undo-history for free, which matters a lot
 * for an ESG compliance tool where regulators may ask "what did this record
 * used to say?".
 *
 * Usage:  MySchema.plugin(softDeletePlugin);
 *
 * IMPORTANT GOTCHA: this only patches `find`-style queries (find, findOne,
 * findById, findOneAndUpdate, countDocuments, etc. all match the /^find/
 * regex). It does NOT automatically apply to `.aggregate()` pipelines -
 * aggregation has its own execution path in MongoDB. Any aggregate() pipeline
 * you write against a soft-deletable model MUST include an explicit
 * `{ $match: { isActive: { $ne: false } } }` stage as its first stage.
 * (You'll see this done explicitly in routes/reports.routes.ts.)
 * ============================================================================
 */
export function softDeletePlugin(schema: Schema) {
  schema.add({
    isActive: { type: Boolean, default: true, index: true },
  });

  schema.pre(/^find/, function (this: any, next) {
    // Allow explicit overrides, e.g. Model.find({ isActive: false }) for an
    // admin "recently deleted" / trash view.
    if (this.getFilter().isActive === undefined) {
      this.where({ isActive: { $ne: false } });
    }
    next();
  });

  schema.methods.softDelete = function () {
    this.isActive = false;
    return this.save();
  };

  schema.methods.restore = function () {
    this.isActive = true;
    return this.save();
  };
}
