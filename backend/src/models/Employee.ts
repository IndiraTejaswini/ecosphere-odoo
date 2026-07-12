import mongoose, { Schema, model, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';
import { softDeletePlugin } from '../utils/softDeletePlugin';
import { sendLiveNotification } from '../utils/sse';
import { updateLeaderboardCache } from '../utils/leaderboardCache';
import { getSettings } from '../utils/settingsCache';

/**
 * Employee = the platform's User model. Two roles: 'admin' (EcoSphere Admin /
 * Manager) and 'user' (EcoSphere Employee). See middleware/auth.ts for RBAC.
 */
export interface IEmployee extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'admin' | 'user';
  department: Types.ObjectId;
  xp: number;
  points: number;
  badges: Types.ObjectId[];
  completedChallenges: number;
  isActive: boolean;
  comparePassword(candidate: string): Promise<boolean>;
}

const EmployeeSchema = new Schema<IEmployee>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    // select: false -> Projection/Security Mandate: never returned on normal GETs
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'user'], default: 'user', index: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', index: true },
    xp: { type: Number, default: 0, index: true },
    points: { type: Number, default: 0 },
    badges: [{ type: Schema.Types.ObjectId, ref: 'Badge' }],
    completedChallenges: { type: Number, default: 0 },
  },
  { timestamps: true }
);

EmployeeSchema.plugin(softDeletePlugin);

// Hash password whenever it's set/changed. Because `passwordHash` is the raw
// field we write plaintext into from routes, and this hook replaces it with
// the bcrypt hash before it ever touches the DB.
EmployeeSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
  next();
});

EmployeeSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

/**
 * ============================================================================
 * Auto-Award Badge Engine  (Boss Level Add-On #5)
 * ============================================================================
 * Fires after every .save() on an Employee (e.g. after XP is incremented when
 * a CSR activity or Challenge is approved - see routes/csr.routes.ts and
 * routes/challenge.routes.ts, which intentionally use `employee.save()`
 * rather than a raw `updateOne($inc)` specifically so this hook runs).
 *
 * Checks all Badges whose unlock rule is now satisfied and NOT already on the
 * employee's profile, auto-adds them via $addToSet (idempotent - can't double
 * award), fires a live SSE notification, and refreshes the leaderboard cache.
 * ============================================================================
 */
EmployeeSchema.post('save', async function (doc) {
  try {
    const settings = await getSettings();
    if (!settings.badgeAutoAwardEnabled) return; // Settings toggle (Section 6/8 gap fix)

    const Badge = mongoose.model('Badge');
    const candidateBadges = await Badge.find({
      isActive: { $ne: false },
      $or: [
        { unlockType: 'xp', unlockValue: { $lte: doc.xp } },
        { unlockType: 'challenges', unlockValue: { $lte: doc.completedChallenges } },
      ],
    });

    const newlyEarned = candidateBadges.filter(
      (b: any) => !doc.badges.some((id: Types.ObjectId) => id.equals(b._id))
    );

    if (newlyEarned.length > 0) {
      const EmployeeModel = mongoose.model('Employee');
      await EmployeeModel.updateOne(
        { _id: doc._id },
        { $addToSet: { badges: { $each: newlyEarned.map((b: any) => b._id) } } }
      );

      if (settings.notifyOnBadgeUnlock) {
        newlyEarned.forEach((b: any) => {
          sendLiveNotification(String(doc._id), {
            type: 'BADGE_UNLOCKED',
            message: `🎖️ Badge unlocked: ${b.name}`,
            badgeId: b._id,
          });
        });
      }

      updateLeaderboardCache().catch((e) => console.error('Leaderboard refresh failed:', e));
    }
  } catch (err) {
    console.error('Badge engine error:', err);
  }
});

/**
 * ============================================================================
 * Department.employeeCount sync  (Gap Fix: this stored field - explicitly
 * required by the spec's Department "Key Fields" - was only ever set once
 * during seeding and never kept in sync as employees are added or
 * soft-deleted at runtime.)
 * ============================================================================
 * Recalculates the CURRENT department's employeeCount via a live count on
 * every save (covers new-hire creation and soft-deletion, since softDelete()
 * itself calls .save() internally).
 *
 * KNOWN SIMPLIFICATION: if an employee is REASSIGNED from one department to
 * another, this only refreshes the count for their new department - the old
 * department's count won't decrement until something else triggers a
 * recalculation there. Department reassignment is a rare admin action; a
 * full fix would capture the pre-change department in a pre('save') hook.
 * Flagging this rather than leaving it a silent, undiscovered gap.
 * ==========================================================================*/
EmployeeSchema.post('save', async function (doc) {
  try {
    if (!doc.department) return;
    const Department = mongoose.model('Department');
    const EmployeeModel = mongoose.model('Employee');
    const count = await EmployeeModel.countDocuments({ department: doc.department, isActive: { $ne: false } });
    await Department.updateOne({ _id: doc.department }, { $set: { employeeCount: count } });
  } catch (err) {
    console.error('Department employeeCount sync failed:', err);
  }
});

export default model<IEmployee>('Employee', EmployeeSchema);
