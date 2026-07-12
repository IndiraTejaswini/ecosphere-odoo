import cron from 'node-cron';
import { ComplianceIssue, PolicyAcknowledgement } from '../models/Governance';
import { ESGPolicy } from '../models/MasterData';
import Employee from '../models/Employee';
import { sendLiveNotification } from '../utils/sse';
import { updateLeaderboardCache } from '../utils/leaderboardCache';
import { anchorDailyRootHash } from '../utils/algorandAnchor';
import { getSettings } from '../utils/settingsCache';
import { snapshotDepartmentScores } from '../utils/esgScoring';

/**
 * ============================================================================
 * Automated Cron Jobs  (Boss Level Add-On #7 + supporting jobs)
 * ==========================================================================*/
export function startCronJobs(): void {
  // Every hour, on the hour: escalate overdue Open compliance issues to High
  // severity and push a live SSE notification to the assigned owner.
  cron.schedule('0 * * * *', async () => {
    try {
      const overdue = await ComplianceIssue.find({
        status: 'Open',
        dueDate: { $lt: new Date() },
        severity: { $ne: 'High' },
      });

      if (overdue.length === 0) return;

      await ComplianceIssue.updateMany(
        { _id: { $in: overdue.map((i) => i._id) } },
        { $set: { severity: 'High' } }
      );

      const settings = await getSettings();
      if (settings.notifyOnComplianceIssue) {
        overdue.forEach((issue) => {
          sendLiveNotification(issue.owner ? String(issue.owner) : null, {
            type: 'COMPLIANCE_OVERDUE',
            message: `Compliance issue "${issue.description.slice(0, 60)}" is overdue and was escalated to High severity.`,
            issueId: issue._id,
          });
        });
      }

      console.log(`[Cron] Escalated ${overdue.length} overdue compliance issue(s) to High severity.`);
    } catch (err) {
      console.error('[Cron] Compliance escalation job failed:', err);
    }
  });

  // Every 5 minutes: safety-net refresh of the in-memory leaderboard cache,
  // in case any XP change happened via a raw $inc that bypassed .save().
  cron.schedule('*/5 * * * *', () => {
    updateLeaderboardCache().catch((e) => console.error('[Cron] Leaderboard refresh failed:', e));
  });

  // Once a day at midnight: anchor the current root hash to Algorand TestNet
  // (no-op unless ALGORAND_ENABLED=true - see utils/algorandAnchor.ts).
  cron.schedule('0 0 * * *', () => {
    anchorDailyRootHash().catch((e) => console.error('[Cron] Algorand anchor job failed:', e));
  });

  /**
   * Once a day at 9am: Policy Acknowledgement Reminders (Gap Fix - Section 8
   * Notification System explicitly lists "policy acknowledgement reminders"
   * as a required notification type, which the original build was missing).
   * For every mandatory ESGPolicy, finds active employees who have NOT
   * acknowledged the current version and nudges them via SSE.
   */
  cron.schedule('0 9 * * *', async () => {
    try {
      const settings = await getSettings();
      if (!settings.notifyOnPolicyAcknowledgementReminder) return;

      const mandatoryPolicies = await ESGPolicy.find({ mandatoryAcknowledgement: true });
      if (mandatoryPolicies.length === 0) return;

      const allEmployees = await Employee.find({}).select('_id');
      let remindersSent = 0;

      for (const policy of mandatoryPolicies) {
        const acknowledged = await PolicyAcknowledgement.find({
          policy: policy._id,
          version: policy.version,
        }).select('employee');
        const acknowledgedIds = new Set(acknowledged.map((a) => String(a.employee)));

        const pending = allEmployees.filter((e) => !acknowledgedIds.has(String(e._id)));

        pending.forEach((emp) => {
          sendLiveNotification(String(emp._id), {
            type: 'POLICY_ACKNOWLEDGEMENT_REMINDER',
            message: `Reminder: please acknowledge "${policy.title}" (v${policy.version})`,
            policyId: policy._id,
          });
          remindersSent++;
        });
      }

      if (remindersSent > 0) {
        console.log(`[Cron] Sent ${remindersSent} policy acknowledgement reminder(s).`);
      }
    } catch (err) {
      console.error('[Cron] Policy reminder job failed:', err);
    }
  });

  /**
   * On the 1st of every month at 00:30: snapshot the current live ESG score
   * (see utils/esgScoring.ts) into DepartmentScore, one document per
   * department per period (e.g. "2026-07"). This is what powers a genuine
   * "Emission Trend (12 mo)" style chart over time, rather than only ever
   * having a single live snapshot with no history.
   */
  cron.schedule('30 0 1 * *', async () => {
    try {
      const count = await snapshotDepartmentScores();
      console.log(`[Cron] Snapshotted ESG scores for ${count} department(s) into DepartmentScore.`);
    } catch (err) {
      console.error('[Cron] Monthly score snapshot job failed:', err);
    }
  });

  console.log(
    '⏰ Cron jobs scheduled: compliance escalation (hourly), leaderboard refresh (5 min), policy reminders (daily), score snapshot (monthly), Algorand anchor (daily)'
  );
}
