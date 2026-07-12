import { Router } from 'express';
import { Challenge, ChallengeParticipation, CHALLENGE_TRANSITIONS } from '../models/Challenge';
import Employee from '../models/Employee';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { upload, toPublicPath } from '../middleware/upload';
import { sendLiveNotification } from '../utils/sse';
import { getSettings } from '../utils/settingsCache';

const router = Router();
router.use(authenticateToken);

/* ------------------------------- Challenges ------------------------------- */

router.get('/', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};
  if (req.query.status) filter.status = req.query.status;

  const [items, total] = await Promise.all([
    Challenge.find(filter).populate('category', 'name').skip(skip).limit(limit).sort({ createdAt: -1 }),
    Challenge.countDocuments(filter),
  ]);

  res.json({ data: items, page, limit, total, totalPages: Math.ceil(total / limit) });
});

router.post('/', requireAdmin, async (req, res) => {
  try {
    const challenge = await Challenge.create({ ...req.body, status: 'Draft' });
    res.status(201).json(challenge);
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  const challenge = await Challenge.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
  res.json(challenge);
});

/**
 * PUT /api/challenges/:id/status - Admin only.
 * Enforces the lifecycle: Draft -> Active -> Under Review -> Completed,
 * with Archived reachable from any non-terminal state.
 */
router.put('/:id/status', requireAdmin, async (req, res) => {
  const { status } = req.body;
  const challenge = await Challenge.findById(req.params.id);
  if (!challenge) return res.status(404).json({ message: 'Challenge not found' });

  const allowed = CHALLENGE_TRANSITIONS[challenge.status] || [];
  if (!allowed.includes(status)) {
    return res.status(400).json({
      message: `Cannot transition from "${challenge.status}" to "${status}". Allowed: ${allowed.join(', ') || 'none'}`,
    });
  }

  challenge.status = status;
  await challenge.save();
  res.json(challenge);
});

router.delete('/:id', requireAdmin, async (req, res) => {
  const challenge: any = await Challenge.findById(req.params.id);
  if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
  await challenge.softDelete();
  res.json({ message: 'Challenge soft-deleted' });
});

/* --------------------------- Challenge Participation ----------------------- */

router.post('/:id/join', async (req: AuthRequest, res) => {
  const challenge = await Challenge.findById(req.params.id);
  if (!challenge) return res.status(404).json({ message: 'Challenge not found' });
  if (challenge.status !== 'Active') {
    return res.status(400).json({ message: 'Can only join challenges that are Active' });
  }

  const employee = await Employee.findById(req.user!.id);
  if (!employee) return res.status(404).json({ message: 'Employee not found' });

  const participation = await ChallengeParticipation.create({
    challenge: challenge._id,
    employee: employee._id,
    department: employee.department,
  });

  res.status(201).json(participation);
});

router.put('/participations/:id/progress', async (req: AuthRequest, res) => {
  const participation: any = await ChallengeParticipation.findById(req.params.id);
  if (!participation) return res.status(404).json({ message: 'Participation not found' });
  if (String(participation.employee) !== req.user!.id) {
    return res.status(403).json({ message: 'You can only update your own progress' });
  }
  participation.progress = Math.min(100, Math.max(0, req.body.progress ?? participation.progress));
  await participation.save();
  res.json(participation);
});

router.post('/participations/:id/proof', upload.single('file'), async (req: AuthRequest, res) => {
  const participation: any = await ChallengeParticipation.findById(req.params.id);
  if (!participation) return res.status(404).json({ message: 'Participation not found' });
  if (String(participation.employee) !== req.user!.id) {
    return res.status(403).json({ message: 'You can only upload proof for your own participation' });
  }
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  participation.proofUrl = toPublicPath(req.file.filename);
  await participation.save();
  res.json(participation);
});

router.get('/participations', async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};
  if (req.user!.role === 'admin') {
    if (req.query.employee) filter.employee = req.query.employee;
    if (req.query.challenge) filter.challenge = req.query.challenge;
  } else {
    filter.employee = req.user!.id;
  }

  const [items, total] = await Promise.all([
    ChallengeParticipation.find(filter)
      .populate('challenge', 'title xp deadline')
      .populate('employee', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    ChallengeParticipation.countDocuments(filter),
  ]);

  res.json({ data: items, page, limit, total, totalPages: Math.ceil(total / limit) });
});

/**
 * PUT /api/challenges/participations/:id/review - Admin only.
 * On approval: awards the Challenge's XP, bumps completedChallenges, and
 * saves the employee (triggering the Auto-Award Badge Engine).
 */
router.put('/participations/:id/review', requireAdmin, async (req, res) => {
  const { decision } = req.body; // 'Approved' | 'Rejected'
  if (!['Approved', 'Rejected'].includes(decision)) {
    return res.status(400).json({ message: 'decision must be "Approved" or "Rejected"' });
  }

  const participation: any = await ChallengeParticipation.findById(req.params.id).populate('challenge');
  if (!participation) return res.status(404).json({ message: 'Participation not found' });

  participation.approvalStatus = decision;

  if (decision === 'Approved') {
    participation.xpAwarded = participation.challenge.xp;
    participation.progress = 100;
  }
  await participation.save();

  if (decision === 'Approved') {
    const employee: any = await Employee.findById(participation.employee);
    if (employee) {
      employee.xp += participation.xpAwarded;
      employee.completedChallenges += 1;
      await employee.save(); // triggers Auto-Award Badge Engine post-save hook
    }
  }

  const settings = await getSettings();
  if (settings.notifyOnCSRChallengeApproval) {
    sendLiveNotification(String(participation.employee), {
      type: 'CHALLENGE_REVIEW',
      message: `Your challenge submission was ${decision.toLowerCase()}.`,
      participationId: participation._id,
    });
  }

  res.json(participation);
});

export default router;
