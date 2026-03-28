import { JiraProject, JiraSprint, JiraIssue } from '../types/index.js';

const MOCK_PROJECTS: JiraProject[] = [
  { id: '1', key: 'SHOP', name: 'Shop Platform', avatarUrl: '' },
  { id: '2', key: 'MOB', name: 'Mobile App', avatarUrl: '' },
];

const MOCK_BOARDS: Record<string, { id: number; name: string }[]> = {
  SHOP: [{ id: 10, name: 'Shop Board' }],
  MOB:  [{ id: 20, name: 'Mobile Board' }],
};

const MOCK_SPRINTS: Record<number, JiraSprint[]> = {
  10: [
    { id: 101, name: 'Sprint 12', state: 'active', startDate: '2026-03-24', endDate: '2026-04-07' },
    { id: 102, name: 'Sprint 13', state: 'future' },
  ],
  20: [
    { id: 201, name: 'Sprint 5', state: 'active', startDate: '2026-03-24', endDate: '2026-04-07' },
  ],
};

const MOCK_ISSUES: Record<number, JiraIssue[]> = {
  101: [
    { id: '1001', key: 'SHOP-42', summary: 'Add product search with filters', description: 'Users should be able to filter by category, price range and rating.', issueType: 'Story', currentEstimate: null, priority: 'High', assignee: 'Alice', url: '#' },
    { id: '1002', key: 'SHOP-43', summary: 'Fix checkout crash on mobile Safari', description: 'Reproducible when applying a promo code while on a slow connection.', issueType: 'Bug', currentEstimate: '4h', priority: 'Critical', assignee: 'Bob', url: '#' },
    { id: '1003', key: 'SHOP-44', summary: 'Migrate product images to CDN', description: null, issueType: 'Task', currentEstimate: '8h', priority: 'Medium', assignee: null, url: '#' },
    { id: '1004', key: 'SHOP-45', summary: 'Implement wishlist feature', description: 'Allow users to save products to a wishlist across devices.', issueType: 'Story', currentEstimate: null, priority: 'Medium', assignee: 'Alice', url: '#' },
    { id: '1005', key: 'SHOP-46', summary: 'Update payment gateway SDK to v3', description: null, issueType: 'Task', currentEstimate: '2h', priority: 'High', assignee: 'Carol', url: '#' },
  ],
  102: [
    { id: '1010', key: 'SHOP-50', summary: 'Redesign homepage hero section', description: null, issueType: 'Story', currentEstimate: null, priority: 'Medium', assignee: null, url: '#' },
    { id: '1011', key: 'SHOP-51', summary: 'Add A/B test framework', description: null, issueType: 'Task', currentEstimate: null, priority: 'Low', assignee: null, url: '#' },
  ],
  201: [
    { id: '2001', key: 'MOB-18', summary: 'Push notifications for order status', description: 'Send notifications on order confirmed, shipped and delivered events.', issueType: 'Story', currentEstimate: null, priority: 'High', assignee: 'Dave', url: '#' },
    { id: '2002', key: 'MOB-19', summary: 'Offline mode for browsing', description: null, issueType: 'Story', currentEstimate: null, priority: 'Medium', assignee: null, url: '#' },
    { id: '2003', key: 'MOB-20', summary: 'Fix ANR on Android 12 during login', description: null, issueType: 'Bug', currentEstimate: '8h', priority: 'Critical', assignee: 'Eve', url: '#' },
  ],
};

class JiraService {
  async getProjects(): Promise<JiraProject[]> {
    return MOCK_PROJECTS;
  }

  async getBoards(projectKey: string): Promise<{ id: number; name: string }[]> {
    return MOCK_BOARDS[projectKey] ?? [];
  }

  async getSprints(boardId: number): Promise<JiraSprint[]> {
    return MOCK_SPRINTS[boardId] ?? [];
  }

  async getIssues(sprintId: number): Promise<JiraIssue[]> {
    return MOCK_ISSUES[sprintId] ?? [];
  }

  async saveEstimate(issueKey: string, hours: number): Promise<void> {
    console.log(`[mock] saveEstimate ${issueKey} = ${hours}h`);
  }
}

export const jiraService = new JiraService();
