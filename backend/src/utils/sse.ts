import { Response } from 'express';

/**
 * ============================================================================
 * Live Notification Engine (Server-Sent Events)  (Boss Level Add-On #13)
 * ============================================================================
 * A minimal in-memory SSE hub - no Redis pub/sub needed for a hackathon.
 * Each connected client's `res` object is kept open and held in `clients`.
 * `sendLiveNotification(userId, payload)` pushes an event to:
 *   - a specific user, if `userId` is provided
 *   - EVERY connected client, if `userId` is null (system-wide broadcast,
 *     e.g. "a compliance issue just went overdue org-wide")
 *
 * Wired up in routes/notifications.routes.ts as GET /api/notifications/stream
 * ============================================================================
 */
interface SSEClient {
  userId: string;
  res: Response;
}

const clients: SSEClient[] = [];

export function registerSSEClient(userId: string, res: Response): void {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // disables nginx buffering if you deploy behind it later
  });
  res.write('retry: 3000\n\n');
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'Live notifications connected' })}\n\n`);

  const client: SSEClient = { userId, res };
  clients.push(client);

  // Heartbeat every 25s so proxies / browsers don't silently time out the connection
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 25000);

  res.on('close', () => {
    clearInterval(heartbeat);
    const idx = clients.indexOf(client);
    if (idx !== -1) clients.splice(idx, 1);
  });
}

export function sendLiveNotification(userId: string | null, payload: Record<string, any>): void {
  const data = `data: ${JSON.stringify({ ...payload, timestamp: new Date().toISOString() })}\n\n`;

  clients.forEach((c) => {
    if (userId === null || c.userId === userId) {
      c.res.write(data);
    }
  });
}

export function connectedClientCount(): number {
  return clients.length;
}
