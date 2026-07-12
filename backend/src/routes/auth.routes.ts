import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Employee from '../models/Employee';
import { authenticateToken, AuthRequest, JWT_SECRET } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Returns a JWT containing { id, role, department } (Boss Level Add-On #1).
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // passwordHash has select:false on the schema, so we must opt back in here
    const employee = await Employee.findOne({ email: String(email).toLowerCase() }).select('+passwordHash');
    if (!employee) return res.status(401).json({ message: 'Invalid credentials' });

    const valid = await employee.comparePassword(password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign(
      { id: employee._id, role: employee.role, department: employee.department },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        department: employee.department,
        xp: employee.xp,
        points: employee.points,
      },
    });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

/**
 * GET /api/auth/me
 * Returns the currently logged-in employee's own profile (badges populated).
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  const employee = await Employee.findById(req.user!.id).populate('department', 'name code').populate('badges');
  if (!employee) return res.status(404).json({ message: 'Employee not found' });
  res.json(employee);
});

export default router;
