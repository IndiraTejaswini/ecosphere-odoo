import { Schema, model, Document } from 'mongoose';

/**
 * ============================================================================
 * Settings  (Gap Fix: Section 6 "Settings & Administration -> ESG
 * Configuration" + Section 8 "Configurable via Settings -> Notification
 * Settings" + the checkbox toggles visible in the Settings screenshot)
 * ============================================================================
 * A SINGLETON document - there is only ever one Settings row in the whole
 * platform (enforced by always querying/upserting a fixed, well-known _id).
 * This replaces the earlier .env-variable-only toggles with something an
 * Admin can flip live via PUT /api/settings, with zero server restart.
 *
 * See utils/settingsCache.ts for the in-memory cache wrapping this model
 * (same "read hot path, refresh on write" pattern as the leaderboard cache -
 * these settings get read on nearly every CSR approval, badge check, and
 * carbon transaction, so we don't want a DB round-trip every time).
 * ==========================================================================*/
export interface IEsgWeighting {
  environmental: number;
  social: number;
  governance: number;
}

export interface ISettings extends Document {
  autoEmissionCalculationEnabled: boolean;
  evidenceRequirementEnabled: boolean;
  badgeAutoAwardEnabled: boolean;
  notifyOnComplianceIssue: boolean;
  notifyOnCSRChallengeApproval: boolean;
  notifyOnPolicyAcknowledgementReminder: boolean;
  notifyOnBadgeUnlock: boolean;
  esgWeighting: IEsgWeighting;
}

// Fixed, well-known ID so there is always exactly one Settings document.
export const SETTINGS_SINGLETON_ID = '000000000000000000000001';

const SettingsSchema = new Schema<ISettings>(
  {
    _id: { type: Schema.Types.ObjectId, default: SETTINGS_SINGLETON_ID },
    autoEmissionCalculationEnabled: { type: Boolean, default: false },
    evidenceRequirementEnabled: { type: Boolean, default: true },
    badgeAutoAwardEnabled: { type: Boolean, default: true },
    notifyOnComplianceIssue: { type: Boolean, default: true },
    notifyOnCSRChallengeApproval: { type: Boolean, default: true },
    notifyOnPolicyAcknowledgementReminder: { type: Boolean, default: true },
    notifyOnBadgeUnlock: { type: Boolean, default: true },
    esgWeighting: {
      environmental: { type: Number, default: 0.4 },
      social: { type: Number, default: 0.3 },
      governance: { type: Number, default: 0.3 },
    },
  },
  { timestamps: true }
);

export default model<ISettings>('Settings', SettingsSchema);
