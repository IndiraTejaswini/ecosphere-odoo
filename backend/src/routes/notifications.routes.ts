import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/auth';
import { registerSSEClient, connectedClientCount } from '../utils/sse';

const router = Router();

/**
 * GET /api/notifications/stream?token=<jwt>
 *
 * NOTE: this deliberately does NOT use the standard `authenticateToken`
 * middleware. The browser's native `EventSource` API (used to consume SSE)
 * cannot set custom request headers, so it can't send `Authorization: Bearer`.
 * We accept the JWT as a query parameter instead and verify it manually here.
 *
 * Frontend usage:
 *   new EventSource(`${API_URL}/api/notifications/stream?token=${jwt}`)
 */
router.get('/stream', (req, res) => {
  const token = req.query.token as string;
  if (!token) return res.status(401).json({ message: 'Token required as ?token= query param' });

  jwt.verify(token, JWT_SECRET, (err, payload: any) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    registerSSEClient(payload.id, res);
  });
});

/** GET /api/notifications/debug/clients - quick sanity check while demoing. */
router.get('/debug/clients', (_req, res) => {
  res.json({ connectedClients: connectedClientCount() });
});

export default router;
