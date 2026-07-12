import { Router } from 'express';
import { CSRActivity, EmployeeParticipation } from '../models/CSR';
import Employee from '../models/Employee';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { upload, toPublicPath } from '../middleware/upload';
import { sendLiveNotification } from '../utils/sse';
import { getSettings } from '../utils/settingsCache';

const router = Router();
router.use(authenticateToken);

/* ---------------------------- CSR Activities ----------------------------- */

router.get('/activities', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    CSRActivity.find().populate('category', 'name').skip(skip).limit(limit).sort({ date: -1 }),
    CSRActivity.countDocuments(),
  ]);

  res.json({ data: items, page, limit, total, totalPages: Math.ceil(total / limit) });
});

router.post('/activities', requireAdmin, async (req, res) => {
  try {
    const activity = await CSRActivity.create(req.body);
    res.status(201).json(activity);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/activities/:id', requireAdmin, async (req, res) => {
  const activity = await CSRActivity.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!activity) return res.status(404).json({ message: 'CSR activity not found' });
  res.json(activity);
});

router.delete('/activities/:id', requireAdmin, async (req, res) => {
  const activity: any = await CSRActivity.findById(req.params.id);
  if (!activity) return res.status(404).json({ message: 'CSR activity not found' });
  await activity.softDelete();
  res.json({ message: 'CSR activity soft-deleted' });
});

/* ------------------------ Employee Participation -------------------------- */

/** POST /api/csr/activities/:id/join - employee joins a CSR activity. */
router.post('/activities/:id/join', async (req: AuthRequest, res) => {
  const activity = await CSRActivity.findById(req.params.id);
  if (!activity) return res.status(404).json({ message: 'CSR activity not found' });

  const employee = await Employee.findById(req.user!.id);
  if (!employee) return res.status(404).json({ message: 'Employee not found' });

  const participation = await EmployeeParticipation.create({
    employee: employee._id,
    department: employee.department, // denormalized for fast ESG aggregation
    activity: activity._id,
    approvalStatus: 'Pending',
  });

  res.status(201).json(participation);
});

/** POST /api/csr/participations/:id/proof - upload evidence file (multipart/form-data, field "file"). */
router.post('/participations/:id/proof', upload.single('file'), async (req: AuthRequest, res) => {
  const participation: any = await EmployeeParticipation.findById(req.params.id);
  if (!participation) return res.status(404).json({ message: 'Participation not found' });
  if (String(participation.employee) !== req.user!.id) {
    return res.status(403).json({ message: 'You can only upload proof for your own participation' });
  }
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  participation.proofUrl = toPublicPath(req.file.filename);
  await participation.save();
  res.json(participation);
});

/**
 * GET /api/csr/participations - Admin sees all (with filters); a standard
 * user only ever sees their own (RBAC: "restricted strictly to their own data").
 */
router.get('/participations', async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};
  if (req.user!.role === 'admin') {
    if (req.query.employee) filter.employee = req.query.employee;
    if (req.query.status) filter.approvalStatus = req.query.status;
  } else {
    filter.employee = req.user!.id;
  }

  const [items, total] = await Promise.all([
    EmployeeParticipation.find(filter)
      .populate('activity', 'title date')
      .populate('employee', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    EmployeeParticipation.countDocuments(filter),
  ]);

  res.json({ data: items, page, limit, total, totalPages: Math.ceil(total / limit) });
});

/**
 * PUT /api/csr/participations/:id/review - Admin only. Approve/reject.
 * On approval: awards points/XP to the employee via employee.save() so the
 * Auto-Award Badge Engine post-save hook fires, then sends a live notification.
 */
router.put('/participations/:id/review', requireAdmin, async (req, res) => {
  const { decision, pointsEarned } = req.body; // decision: 'Approved' | 'Rejected'
  if (!['Approved', 'Rejected'].includes(decision)) {
    return res.status(400).json({ message: 'decision must be "Approved" or "Rejected"' });
  }

  const participation: any = await EmployeeParticipation.findById(req.params.id);
  if (!participation) return res.status(404).json({ message: 'Participation not found' });

  const settings = await getSettings();
  if (decision === 'Approved' && settings.evidenceRequirementEnabled && !participation.proofUrl) {
    return res.status(400).json({
      message: 'Evidence Requirement is enabled in Settings: cannot approve without an attached proof file',
    });
  }

  participation.approvalStatus = decision;
  participation.completionDate = new Date();
  if (decision === 'Approved') {
    participation.pointsEarned = pointsEarned ?? participation.pointsEarned ?? 10;
  }
  await participation.save();

  if (decision === 'Approved') {
    const employee: any = await Employee.findById(participation.employee);
    if (employee) {
      employee.points += participation.pointsEarned;
      employee.xp += participation.pointsEarned;
      await employee.save(); // triggers Auto-Award Badge Engine post-save hook
    }
  }

  if (settings.notifyOnCSRChallengeApproval) {
    sendLiveNotification(String(participation.employee), {
      type: 'CSR_REVIEW',
      message: `Your CSR participation was ${decision.toLowerCase()}.`,
      participationId: participation._id,
    });
  }

  res.json(participation);
});

export default router;
