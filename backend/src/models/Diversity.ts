import { Schema, model, Document, Types } from 'mongoose';

/**
 * DiversityMetric  (Gap Fix: Section 6 Expected Features lists "Diversity
 * Metrics" under Social - the original build had no model for this at all.
 * The spec doesn't give exact fields (Key Fields "-" throughout that section),
 * so this is a reasonable, commonly-used shape: headcount broken down by
 * gender, tracked per department per reporting period.
 */
export interface IDiversityMetric extends Document {
  department: Types.ObjectId;
  period: string; // e.g. "2026-07" or "2026-Q3"
  headcountTotal: number;
  headcountFemale: number;
  headcountMale: number;
  headcountOther: number;
  femalePercentage: number; // derived, stored for fast dashboard reads
  notes?: string;
}

const DiversityMetricSchema = new Schema<IDiversityMetric>(
  {
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true, index: true },
    period: { type: String, required: true, index: true },
    headcountTotal: { type: Number, required: true },
    headcountFemale: { type: Number, default: 0 },
    headcountMale: { type: Number, default: 0 },
    headcountOther: { type: Number, default: 0 },
    femalePercentage: { type: Number, default: 0 },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
);

DiversityMetricSchema.index({ department: 1, period: 1 }, { unique: true });

// Keep femalePercentage in sync whenever headcounts are set/changed
DiversityMetricSchema.pre('save', function (next) {
  if (this.headcountTotal > 0) {
    this.femalePercentage = Math.round((this.headcountFemale / this.headcountTotal) * 1000) / 10;
  }
  next();
});

export default model<IDiversityMetric>('DiversityMetric', DiversityMetricSchema);
