import { Router } from 'express';
import { TrainingProgram, TrainingCompletion } from '../models/Training';
import Employee from '../models/Employee';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import { sendLiveNotification } from '../utils/sse';

const router = Router();
router.use(authenticateToken);

/* ----------------------------- Training Programs --------------------------- */

router.get('/programs', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const skip = (page - 1) * limit;

  const [items, total] = await Promise.all([
    TrainingProgram.find().populate('department', 'name code').skip(skip).limit(limit).sort({ createdAt: -1 }),
    TrainingProgram.countDocuments(),
  ]);

  res.json({ data: items, page, limit, total, totalPages: Math.ceil(total / limit) });
});

/**
 * POST /api/training/programs - Admin only. Creates a program AND
 * auto-assigns a "Assigned" TrainingCompletion record to every active
 * employee (org-wide) or every active employee in the given department.
 */
router.post('/programs', requireAdmin, async (req, res) => {
  try {
    const program = await TrainingProgram.create(req.body);

    const employeeFilter: Record<string, any> = {};
    if (program.department) employeeFilter.department = program.department;
    const targetEmployees = await Employee.find(employeeFilter).select('_id department');

    await TrainingCompletion.insertMany(
      targetEmployees.map((emp) => ({
        employee: emp._id,
        department: emp.department,
        trainingProgram: program._id,
        status: 'Assigned',
      })),
      { ordered: false } // don't abort the whole batch if one duplicate slips in
    );

    res.status(201).json({ program, assignedTo: targetEmployees.length });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

router.put('/programs/:id', requireAdmin, async (req, res) => {
  const program = await TrainingProgram.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!program) return res.status(404).json({ message: 'Training program not found' });
  res.json(program);
});

/* --------------------------- Training Completion --------------------------- */

/**
 * GET /api/training/completions - Admin sees all; a standard user only sees
 * their own assignments (same RBAC pattern as CSR/Challenge participation).
 */
router.get('/completions', async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};
  if (req.user!.role === 'admin') {
    if (req.query.employee) filter.employee = req.query.employee;
    if (req.query.status) filter.status = req.query.status;
  } else {
    filter.employee = req.user!.id;
  }

  const [items, total] = await Promise.all([
    TrainingCompletion.find(filter)
      .populate('trainingProgram', 'title dueDate mandatory')
      .populate('employee', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    TrainingCompletion.countDocuments(filter),
  ]);

  res.json({ data: items, page, limit, total, totalPages: Math.ceil(total / limit) });
});

/** PUT /api/training/completions/:id/complete - employee marks their own training done. */
router.put('/completions/:id/complete', async (req: AuthRequest, res) => {
  const completion: any = await TrainingCompletion.findById(req.params.id);
  if (!completion) return res.status(404).json({ message: 'Training assignment not found' });
  if (req.user!.role !== 'admin' && String(completion.employee) !== req.user!.id) {
    return res.status(403).json({ message: 'You can only complete your own training assignments' });
  }

  completion.status = 'Completed';
  completion.completedAt = new Date();
  await completion.save();

  sendLiveNotification(String(completion.employee), {
    type: 'TRAINING_COMPLETED',
    message: 'Training marked as completed.',
    completionId: completion._id,
  });

  res.json(completion);
});

export default router;
