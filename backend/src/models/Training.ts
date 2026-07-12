import { Schema, model, Document, Types } from 'mongoose';
import { softDeletePlugin } from '../utils/softDeletePlugin';

/**
 * TrainingProgram + TrainingCompletion  (Gap Fix: Section 6 Expected Features
 * lists "Training Completion" under Social - missing from the original build.
 * Mirrors the CSRActivity/EmployeeParticipation pattern: a master "program"
 * plus a per-employee completion record.
 */
export interface ITrainingProgram extends Document {
  title: string;
  description?: string;
  department?: Types.ObjectId; // optional - null means org-wide/mandatory for everyone
  mandatory: boolean;
  dueDate?: Date;
  isActive: boolean;
}

const TrainingProgramSchema = new Schema<ITrainingProgram>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', default: null },
    mandatory: { type: Boolean, default: true },
    dueDate: { type: Date },
  },
  { timestamps: true }
);
TrainingProgramSchema.plugin(softDeletePlugin);
export const TrainingProgram = model<ITrainingProgram>('TrainingProgram', TrainingProgramSchema);

/**
 * `department` is denormalized from the employee at assignment time - same
 * read-speed rationale used throughout (see CSR.ts / Challenge.ts / Governance.ts)
 * so the Social score aggregation ($lookup on `department`) doesn't need an
 * extra hop through Employee.
 */
export interface ITrainingCompletion extends Document {
  employee: Types.ObjectId;
  department: Types.ObjectId;
  trainingProgram: Types.ObjectId;
  status: 'Assigned' | 'Completed';
  completedAt?: Date;
}

const TrainingCompletionSchema = new Schema<ITrainingCompletion>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
    trainingProgram: { type: Schema.Types.ObjectId, ref: 'TrainingProgram', required: true, index: true },
    status: { type: String, enum: ['Assigned', 'Completed'], default: 'Assigned', index: true },
    completedAt: { type: Date },
  },
  { timestamps: true }
);
TrainingCompletionSchema.index({ employee: 1, trainingProgram: 1 }, { unique: true });

export const TrainingCompletion = model<ITrainingCompletion>('TrainingCompletion', TrainingCompletionSchema);
