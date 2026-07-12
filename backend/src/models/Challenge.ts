import { Schema, model, Document, Types } from 'mongoose';
import { softDeletePlugin } from '../utils/softDeletePlugin';

/* ============================================================================
 * Challenge - sustainability challenges with a full lifecycle
 * Draft -> Active -> Under Review -> Completed  (or Archived at any point)
 * ==========================================================================*/
export interface IChallenge extends Document {
  title: string;
  category: Types.ObjectId;
  description?: string;
  xp: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  evidenceRequired: boolean;
  deadline: Date;
  status: 'Draft' | 'Active' | 'Under Review' | 'Completed' | 'Archived';
  isActive: boolean;
}

const CHALLENGE_STATUSES = ['Draft', 'Active', 'Under Review', 'Completed', 'Archived'] as const;

// Allowed forward transitions - enforced in routes/challenge.routes.ts
export const CHALLENGE_TRANSITIONS: Record<string, string[]> = {
  Draft: ['Active', 'Archived'],
  Active: ['Under Review', 'Archived'],
  'Under Review': ['Completed', 'Active', 'Archived'],
  Completed: ['Archived'],
  Archived: [],
};

const ChallengeSchema = new Schema<IChallenge>(
  {
    title: { type: String, required: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    description: { type: String, trim: true },
    xp: { type: Number, required: true, default: 0 },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], default: 'Medium' },
    evidenceRequired: { type: Boolean, default: true },
    deadline: { type: Date, required: true, index: true },
    status: { type: String, enum: CHALLENGE_STATUSES, default: 'Draft', index: true },
  },
  { timestamps: true }
);
ChallengeSchema.plugin(softDeletePlugin);
export const Challenge = model<IChallenge>('Challenge', ChallengeSchema);

/* ============================================================================
 * ChallengeParticipation - tracks employee progress within Challenges only
 * (same employeeId sharding rationale as EmployeeParticipation - see CSR.ts)
 * ==========================================================================*/
export interface IChallengeParticipation extends Document {
  challenge: Types.ObjectId;
  employee: Types.ObjectId;
  department: Types.ObjectId; // denormalized, same rationale as CSR.ts
  progress: number; // 0-100
  proofUrl?: string;
  approvalStatus: 'Pending' | 'Approved' | 'Rejected';
  xpAwarded: number;
}

const ChallengeParticipationSchema = new Schema<IChallengeParticipation>(
  {
    challenge: { type: Schema.Types.ObjectId, ref: 'Challenge', required: true, index: true },
    employee: { type: Schema.Types.ObjectId, ref: 'Employee', required: true, index: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
    progress: { type: Number, default: 0, min: 0, max: 100 },
    proofUrl: { type: String },
    approvalStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
      index: true,
    },
    xpAwarded: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const ChallengeParticipation = model<IChallengeParticipation>(
  'ChallengeParticipation',
  ChallengeParticipationSchema
);
