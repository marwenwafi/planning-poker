import { Router, Request, Response } from 'express';
import { sessionStore } from '../services/session.store.js';
import { jiraService } from '../services/jira.service.js';

export const sessionRouter = Router();

sessionRouter.post('/', async (req: Request, res: Response) => {
  const { hostUserId, hostDisplayName, hostSocketId, jiraProjectKey, sprintId, sprintName } = req.body;
  if (!hostUserId || !hostDisplayName || !jiraProjectKey || !sprintId) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  try {
    const issues = await jiraService.getIssues(sprintId);
    const session = sessionStore.create({
      hostUserId,
      hostDisplayName,
      hostSocketId: hostSocketId ?? '',
      jiraProjectKey,
      sprintId,
      sprintName: sprintName ?? `Sprint ${sprintId}`,
      issues,
    });
    res.status(201).json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

sessionRouter.get('/:id', (req: Request, res: Response) => {
  const session = sessionStore.get(req.params['id']!);
  if (!session) { res.status(404).json({ error: 'Session not found' }); return; }
  res.json(session);
});
