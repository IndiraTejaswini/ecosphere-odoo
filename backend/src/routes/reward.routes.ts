import { Router } from 'express';
import { Reward } from '../models/MasterData';
import Employee from '../models/Employee';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { sendLiveNotification } from '../utils/sse';

const router = Router();
router.use(authenticateToken);

/**
 * ============================================================================
 * POST /api/rewards/:id/redeem  (Boss Level Add-On #6: Atomic Transactions)
 * ============================================================================
 * Uses conditional `findOneAndUpdate` with `$inc` + a query guard
 * (`stockCount: { $gt: 0 }`) so the stock decrement is atomic at the MongoDB
 * document level - two concurrent requests can never both succeed in
 * redeeming the very last unit of stock (a classic race condition).
 *
 * The points deduction is a second atomic conditional update
 * (`points: { $gte: reward.pointsRequired }`). If the employee turns out not
 * to have enough points, we compensate by rolling back the stock decrement.
 *
 * PRODUCTION UPGRADE NOTE: on a MongoDB replica set (e.g. Atlas, which is a
 * replica set even on the free tier), you could instead wrap both updates in
 * a real multi-document ACID transaction via `mongoose.startSession()` +
 * `session.withTransaction()`. We used the two-step conditional-update +
 * compensating-rollback approach here instead because it works identically
 * on a bare-metal standalone `mongod` too (transactions require a replica
 * set), which matters if your local hackathon dev DB isn't one.
 * ==========================================================================*/
router.post('/:id/redeem', async (req: AuthRequest, res) => {
  const reward: any = await Reward.findOneAndUpdate(
    { _id: req.params.id, stockCount: { $gt: 0 } },
    { $inc: { stockCount: -1 } },
    { new: true }
  );

  if (!reward) {
    return res.status(400).json({ message: 'Reward is out of stock or does not exist' });
  }

  const employee: any = await Employee.findOneAndUpdate(
    { _id: req.user!.id, points: { $gte: reward.pointsRequired } },
    { $inc: { points: -reward.pointsRequired } },
    { new: true }
  );

  if (!employee) {
    // Compensating rollback: give the stock unit back since the employee
    // didn't actually have enough points to complete the redemption.
    await Reward.findByIdAndUpdate(req.params.id, { $inc: { stockCount: 1 } });
    return res.status(400).json({ message: 'Insufficient points to redeem this reward' });
  }

  sendLiveNotification(req.user!.id, {
    type: 'REWARD_REDEEMED',
    message: `You redeemed "${reward.name}" for ${reward.pointsRequired} points.`,
    rewardId: reward._id,
  });

  res.json({
    message: 'Reward redeemed successfully',
    reward: { id: reward._id, name: reward.name, remainingStock: reward.stockCount },
    remainingPoints: employee.points,
  });
});

export default router;
