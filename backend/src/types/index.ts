// ---------------------------------------------------------------------------
// Jira
// ---------------------------------------------------------------------------

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  avatarUrl: string;
}

export interface JiraSprint {
  id: number;
  name: string;
  state: 'active' | 'future' | 'closed';
  startDate?: string;
  endDate?: string;
}

export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  description: string | null;
  issueType: string;
  currentEstimate: string | null; // e.g. "8h", "2d"
  priority: string;
  assignee: string | null;
  url: string;
}

// ---------------------------------------------------------------------------
// Planning session
// ---------------------------------------------------------------------------

export type CardValue = 1 | 2 | 4 | 8 | 12 | 16 | 24 | 32 | 40;

export const CARD_VALUES: CardValue[] = [1, 2, 4, 8, 12, 16, 24, 32, 40];

export interface Participant {
  socketId: string;
  userId: string;
  displayName: string;
  isHost: boolean;
  hasVoted: boolean;
  vote: CardValue | null;
  isConnected: boolean;
}

export type VotingPhase = 'waiting' | 'voting' | 'revealed';

export interface VotingRound {
  issueId: string;
  issueKey: string;
  issueSummary: string;
  phase: VotingPhase;
  votes: Record<string, CardValue>;
  votedUserIds: string[];
  finalEstimate: CardValue | null;
}

export interface PlanningSession {
  id: string;
  name: string;
  jiraProjectKey: string;
  sprintId: number;
  sprintName: string;
  issues: JiraIssue[];
  currentIssueIndex: number;
  currentRound: VotingRound | null;
  completedRounds: VotingRound[];
  participants: Participant[];
  status: 'lobby' | 'active' | 'completed';
  createdAt: string;
  hostUserId: string;
}

// ---------------------------------------------------------------------------
// Socket event payloads (client → server)
// ---------------------------------------------------------------------------

export interface JoinSessionPayload {
  sessionId: string;
  userId: string;
  displayName: string;
}

export interface SubmitVotePayload {
  sessionId: string;
  userId: string;
  value: CardValue;
}

export interface RevealVotesPayload {
  sessionId: string;
}

export interface SetEstimatePayload {
  sessionId: string;
  finalEstimate: CardValue;
}

export interface NextIssuePayload {
  sessionId: string;
  finalEstimate: CardValue;
}

export interface EndSessionPayload {
  sessionId: string;
}
