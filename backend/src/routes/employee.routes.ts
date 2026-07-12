import { Router } from 'express';
import Employee from '../models/Employee';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

/**
 * GET /api/employees - Admin only. Paginated (Memory Optimization Mandate D),
 * passwordHash excluded (Projection/Security Mandate E - though it's already
 * select:false on the schema, this is belt-and-suspenders).
 */
router.get('/', requireAdmin, async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const skip = (page - 1) * limit;

  const filter: Record<string, any> = {};
  if (req.query.department) filter.department = req.query.department;
  if (req.query.role) filter.role = req.query.role;

  const [items, total] = await Promise.all([
    Employee.find(filter)
      .select('-passwordHash')
      .populate('department', 'name code')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Employee.countDocuments(filter),
  ]);

  res.json({ data: items, page, limit, total, totalPages: Math.ceil(total / limit) });
});

/**
 * POST /api/employees - Admin only. Creates a new employee/admin account.
 * Body: { name, email, password, role, department }
 */
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role, department } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email and password are required' });
    }

    const employee = await Employee.create({
      name,
      email: String(email).toLowerCase(),
      passwordHash: password, // hashed automatically by the pre('save') hook
      role: role === 'admin' ? 'admin' : 'user',
      department: department || null,
    });

    const { passwordHash, ...safe } = employee.toObject();
    res.status(201).json(safe);
  } catch (err: any) {
    if (err.code === 11000) return res.status(409).json({ message: 'Email already in use' });
    res.status(400).json({ message: err.message });
  }
});

/** GET /api/employees/me - any authenticated user, their own profile. */
router.get('/me', async (req: AuthRequest, res) => {
  const employee = await Employee.findById(req.user!.id)
    .populate('department', 'name code')
    .populate('badges');
  if (!employee) return res.status(404).json({ message: 'Employee not found' });
  res.json(employee);
});

/** GET /api/employees/:id - Admin, or the employee viewing their own profile. */
router.get('/:id', async (req: AuthRequest, res) => {
  if (req.user!.role !== 'admin' && req.user!.id !== req.params.id) {
    return res.status(403).json({ message: 'You can only view your own profile' });
  }
  const employee = await Employee.findById(req.params.id)
    .select('-passwordHash')
    .populate('department', 'name code')
    .populate('badges');
  if (!employee) return res.status(404).json({ message: 'Employee not found' });
  res.json(employee);
});

export default router;
