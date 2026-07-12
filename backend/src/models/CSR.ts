import { Schema, model, Document, Types } from 'mongoose';
import { softDeletePlugin } from '../utils/softDeletePlugin';

/* ============================================================================
 * CSRActivity - social initiatives organized by the company
 * ==========================================================================*/
export interface ICSRActivity extends Document {
  title: string;
  category: Types.ObjectId;
  description?: string;
  date: Date;
  location?: string;
  expectedParticipants?: number;
  status: 'Draft' | 'Active' | 'Completed' | 'Archived';
  isActive: boolean;
}

const CSRActivitySchema = new Schema<ICSRActivity>(
  {
    title: { type: String, required: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    description: { type: String, trim: true },
    date: { type: Date, required: true, index: true },
    location: { type: String, trim: true },
    expectedParticipants: { type: Number },
    status: {
      type: String,
      enum: ['Draft', 'Active', 'Completed', 'Archived'],
      default: 'Draft',
      index: true,
    },
  },
  { timestamps: true }
);
CSRActivitySchema.plugin(softDeletePlugin);
export const CSRActivity = model<ICSRActivity>('CSRActivity', CSRActivitySchema);

/**
 * ============================================================================
 * EmployeeParticipation - tracks employee involvement in CSR Activities only
 * ============================================================================
 * --- SHARDING NOTE (Architectural Mandate A) ---
 * `employeeId` is the natural shard key for this collection: nearly every
 * read here is either "give me MY participation history" (employee-facing
 * gamification screens) or aggregated per-employee for leaderboard/XP
 * calculations. Sharding on employeeId means those lookups target a single
 * shard instead of a cluster-wide scatter-gather. The one query pattern that
 * DOESN'T benefit - "all participation for department X, for ESG scoring" -
 * is handled instead via the denormalized `department` field below (copied
 * from the employee's department at write time), which lets that aggregation
 * run as an indexed equality match without needing a $lookup join back to
 * Employee first.
 * ==========================================================================*/
export interface IEmployeeParticipation extends Document {
  employee: Types.ObjectId;
  department: Types.ObjectId; // denormalized for fast department-level ESG aggregation
  activity: Types.ObjectId;
  proofUrl?: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  pointsEarned: number;
  completionDate?: Date;
}

const EmployeeParticipationSchema = new Schema<IEmployeeParticipation>(
  {
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
    activity: { type: Schema.Types.ObjectId, ref: 'CSRActivity', required: true },
    proofUrl: { type: String },
    approvalStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    pointsEarned: { type: Number, default: 0 },
    completionDate: { type: Date },
  },
  { timestamps: true }
);

export const EmployeeParticipation = model<IEmployeeParticipation>(
  'EmployeeParticipation',
  EmployeeParticipationSchema
);
