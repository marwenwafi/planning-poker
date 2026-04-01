import { Router, Request, Response } from 'express';
import { sessionStore } from '../services/session.store';

export const sessionRouter = Router();

sessionRouter.post('/', (req: Request, res: Response) => {
  const { hostUserId, hostDisplayName, hostSocketId, sessionName, issues } = req.body;
  if (!hostUserId || !hostDisplayName || !sessionName || !Array.isArray(issues) || issues.length === 0) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  const session = sessionStore.create({
    hostUserId,
    hostDisplayName,
    hostSocketId: hostSocketId ?? '',
    sessionName,
    issues,
  });
  res.status(201).json(session);
});

sessionRouter.get('/:id', (req: Request, res: Response) => {
  const session = sessionStore.get(req.params['id']!);
  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
  res.json(session);
});
