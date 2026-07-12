import { Router } from 'express';
import { Model } from 'mongoose';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';
import {
  Department,
  Category,
  EmissionFactor,
  EnvironmentalGoal,
  ESGPolicy,
  Badge,
  Reward,
  ProductESGProfile,
} from '../models/MasterData';

const router = Router();
router.use(authenticateToken);

/**
 * Generic CRUD factory for the 8 largely-identical master data entities.
 * Cuts ~90% of repeated boilerplate - exactly the kind of shortcut worth
 * taking with an 8-hour clock running. RBAC: reads open to any logged-in
 * user, writes (create/update/soft-delete) restricted to Admins.
 */
function mountCrud(path: string, model: Model<any>, populateFields?: string) {
  // LIST - paginated via skip/limit (Memory Optimization Mandate D)
  router.get(`/${path}`, async (req, res) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const skip = (page - 1) * limit;

    let query = model.find();
    if (populateFields) query = query.populate(populateFields);

    const [items, total] = await Promise.all([
      query.skip(skip).limit(limit).sort({ createdAt: -1 }),
      model.countDocuments(),
    ]);

    res.json({ data: items, page, limit, total, totalPages: Math.ceil(total / limit) });
  });

  // GET ONE
  router.get(`/${path}/:id`, async (req, res) => {
    let query = model.findById(req.params.id);
    if (populateFields) query = query.populate(populateFields);
    const item = await query;
    if (!item) return res.status(404).json({ message: `${path} not found` });
    res.json(item);
  });

  // CREATE - admin only
  router.post(`/${path}`, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const created = await model.create(req.body);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // UPDATE - admin only
  router.put(`/${path}/:id`, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const updated = await model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!updated) return res.status(404).json({ message: `${path} not found` });
      res.json(updated);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  });

  // SOFT DELETE - admin only. Never hard-deletes (Boss Level Add-On #3).
  router.delete(`/${path}/:id`, requireAdmin, async (req: AuthRequest, res) => {
    const doc: any = await model.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: `${path} not found` });
    await doc.softDelete();
    res.json({ message: `${path} soft-deleted`, id: req.params.id });
  });
}

mountCrud('departments', Department);
mountCrud('categories', Category);
mountCrud('emission-factors', EmissionFactor);
mountCrud('environmental-goals', EnvironmentalGoal, 'department');
mountCrud('policies', ESGPolicy);
mountCrud('badges', Badge);
mountCrud('rewards', Reward);
mountCrud('product-esg-profiles', ProductESGProfile);

export default router;
