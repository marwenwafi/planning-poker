import { Router, Request, Response } from 'express';
import { jiraService } from '../services/jira.service.js';

export const jiraRouter = Router();

jiraRouter.get('/projects', async (_req: Request, res: Response) => {
  try {
    res.json(await jiraService.getProjects());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

jiraRouter.get('/boards', async (req: Request, res: Response) => {
  const projectKey = req.query['projectKey'] as string;
  if (!projectKey) { res.status(400).json({ error: 'projectKey required' }); return; }
  try {
    res.json(await jiraService.getBoards(projectKey));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

jiraRouter.get('/sprints', async (req: Request, res: Response) => {
  const boardId = parseInt(req.query['boardId'] as string, 10);
  if (isNaN(boardId)) { res.status(400).json({ error: 'boardId required' }); return; }
  try {
    res.json(await jiraService.getSprints(boardId));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

jiraRouter.get('/issues', async (req: Request, res: Response) => {
  const sprintId = parseInt(req.query['sprintId'] as string, 10);
  if (isNaN(sprintId)) { res.status(400).json({ error: 'sprintId required' }); return; }
  try {
    res.json(await jiraService.getIssues(sprintId));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

jiraRouter.put('/estimate', async (req: Request, res: Response) => {
  const { issueKey, hours } = req.body as { issueKey: string; hours: number };
  if (!issueKey || hours == null) { res.status(400).json({ error: 'issueKey and hours required' }); return; }
  try {
    await jiraService.saveEstimate(issueKey, hours);
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
