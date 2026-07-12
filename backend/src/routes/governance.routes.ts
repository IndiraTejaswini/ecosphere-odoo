import { Router } from 'express';
import { Audit, ComplianceIssue, PolicyAcknowledgement } from '../models/Governance';
import { ESGPolicy } from '../models/MasterData';
import Employee from '../models/Employee';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { sendLiveNotification } from '../utils/sse';
import { getSettings } from '../utils/settingsCache';

const router = Router();
router.use(authenticateToken);

/* --------------------------------- Audits --------------------------------- */
// Admins manage audits fully; users have no audit access per the spec
// ("Note for Governance: they can view compliance issues they own, not audits").

router.get('/audits', requireAdmin, async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    Audit.find().populate('department', 'name code').skip(skip).limit(limit).sort({ date: -1 }),
    Audit.countDocuments(),
  ]);

  res.json({ data: items, page, limit, total, totalPages: Math.ceil(total / limit) });
});

router.post('/audits', requireAdmin, async (req, res) => {
  try {
    const audit = await Audit.create(req.body);
    res.status(201).json(audit);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/audits/:id', requireAdmin, async (req, res) => {
  const audit = await Audit.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!audit) return res.status(404).json({ message: 'Audit not found' });
  res.json(audit);
});

/* ---------------------------- Compliance Issues ---------------------------- */

/**
 * GET /api/governance/compliance-issues
 * Admin: sees everything (with optional filters).
 * User: can only VIEW issues where they are the assigned `owner` (RBAC note:
 * "they can still be assigned as Owner... but will only be able to view it").
 */
router.get('/compliance-issues', async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};
  if (req.user!.role === 'admin') {
    if (req.query.department) filter.department = req.query.department;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.severity) filter.severity = req.query.severity;
  } else {
    filter.owner = req.user!.id; // users only ever see issues they own
  }

  const [items, total] = await Promise.all([
    ComplianceIssue.find(filter)
      .populate('department', 'name code')
      .populate('owner', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ dueDate: 1 }),
    ComplianceIssue.countDocuments(filter),
  ]);

  res.json({ data: items, page, limit, total, totalPages: Math.ceil(total / limit) });
});

/** POST - Admin only: raise a compliance issue and assign an owner + due date. */
router.post('/compliance-issues', requireAdmin, async (req, res) => {
  try {
    const issue = await ComplianceIssue.create(req.body);

    const settings = await getSettings();
    if (settings.notifyOnComplianceIssue) {
      sendLiveNotification(String(issue.owner), {
        type: 'COMPLIANCE_ISSUE_RAISED',
        message: `A new compliance issue has been assigned to you: "${issue.description.slice(0, 60)}"`,
        issueId: issue._id,
      });
    }

    res.status(201).json(issue);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

/** PUT - Admin only: update/resolve. Owners can view but NOT edit (RBAC note). */
router.put('/compliance-issues/:id', requireAdmin, async (req, res) => {
  const issue = await ComplianceIssue.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!issue) return res.status(404).json({ message: 'Compliance issue not found' });
  res.json(issue);
});

/* ----------------------------- Policy Acknowledgements ---------------------------- */

/** POST /api/governance/policies/:id/acknowledge - any employee acknowledges a policy. */
router.post('/policies/:id/acknowledge', async (req: AuthRequest, res) => {
  const policy = await ESGPolicy.findById(req.params.id);
  if (!policy) return res.status(404).json({ message: 'Policy not found' });

  const employee = await Employee.findById(req.user!.id);
  if (!employee) return res.status(404).json({ message: 'Employee not found' });

  try {
    const ack = await PolicyAcknowledgement.create({
      employee: req.user!.id,
      department: employee.department, // denormalized for Governance score aggregation
      policy: policy._id,
      version: policy.version,
    });
    res.status(201).json(ack);
  } catch (err: any) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'You have already acknowledged this policy version' });
    }
    res.status(400).json({ message: err.message });
  }
});

/** GET /api/governance/policies/:id/acknowledgements - Admin only, who has/hasn't acknowledged. */
router.get('/policies/:id/acknowledgements', requireAdmin, async (req, res) => {
  const acks = await PolicyAcknowledgement.find({ policy: req.params.id }).populate('employee', 'name email');
  res.json(acks);
});

export default router;
