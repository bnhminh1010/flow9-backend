import { Router, Request, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

interface SSEResponse extends Response {
  flush?: () => void;
}

const clients: Map<string, Set<SSEResponse>> = new Map();

export function sendNotification(userId: string, notification: object): void {
  const userClients = clients.get(userId);
  
  if (userClients) {
    const data = JSON.stringify(notification);
    userClients.forEach(client => {
      client.write(`data: ${data}\n\n`);
    });
  }
}

router.get('/stream', authMiddleware, (req: AuthRequest, res: SSEResponse) => {
  const userId = req.userId!;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (!clients.has(userId)) {
    clients.set(userId, new Set());
  }

  clients.get(userId)!.add(res);

  const clientId = Date.now();
  console.log(`SSE client connected: ${userId}`);

  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

  req.on('close', () => {
    const userClients = clients.get(userId);
    if (userClients) {
      userClients.delete(res);
      if (userClients.size === 0) {
        clients.delete(userId);
      }
    }
    console.log(`SSE client disconnected: ${userId}`);
  });
});

export default router;
