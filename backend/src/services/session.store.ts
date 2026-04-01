import { v4 as uuidv4 } from 'uuid';
import { PlanningSession, JiraIssue, VotingRound } from '../types/index';

interface CreateSessionDTO {
  hostUserId: string;
  hostDisplayName: string;
  hostSocketId: string;
  sessionName: string;
  issues: JiraIssue[];
}

class SessionStore {
  private sessions = new Map<string, PlanningSession>();

  create(dto: CreateSessionDTO): PlanningSession {
    const id = uuidv4().slice(0, 8);
    const session: PlanningSession = {
      id,
      name: dto.sessionName,
      jiraProjectKey: '',
      sprintId: 0,
      sprintName: '',
      issues: dto.issues,
      currentIssueIndex: -1,
      currentRound: null,
      completedRounds: [],
      participants: [
        {
          socketId: dto.hostSocketId,
          userId: dto.hostUserId,
          displayName: dto.hostDisplayName,
          isHost: true,
          hasVoted: false,
          vote: null,
          isConnected: true,
        },
      ],
      status: 'lobby',
      createdAt: new Date().toISOString(),
      hostUserId: dto.hostUserId,
    };
    this.sessions.set(id, session);
    return session;
  }

  get(id: string): PlanningSession | undefined {
    return this.sessions.get(id);
  }

  update(id: string, patch: Partial<PlanningSession>): PlanningSession | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;
    const updated = { ...session, ...patch };
    this.sessions.set(id, updated);
    return updated;
  }

  delete(id: string): void {
    this.sessions.delete(id);
  }

  startRound(sessionId: string): PlanningSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const idx = session.currentIssueIndex + 1;
    if (idx >= session.issues.length) return undefined;

    const issue = session.issues[idx]!;
    const round: VotingRound = {
      issueId: issue.id,
      issueKey: issue.key,
      issueSummary: issue.summary,
      phase: 'voting',
      votes: {},
      votedUserIds: [],
      finalEstimate: null,
    };

    return this.update(sessionId, {
      status: 'active',
      currentIssueIndex: idx,
      currentRound: round,
      // reset participant votes
      participants: session.participants.map(p => ({ ...p, hasVoted: false, vote: null })),
    });
  }

  submitVote(sessionId: string, userId: string, value: import('../types/index.js').CardValue): PlanningSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session || !session.currentRound) return undefined;

    const round = session.currentRound;
    const alreadyVoted = round.votedUserIds.includes(userId);
    const updatedRound: VotingRound = {
      ...round,
      votes: { ...round.votes, [userId]: value },
      votedUserIds: alreadyVoted ? round.votedUserIds : [...round.votedUserIds, userId],
    };

    const updatedParticipants = session.participants.map(p =>
      p.userId === userId ? { ...p, hasVoted: true, vote: null } : p
    );

    return this.update(sessionId, {
      currentRound: updatedRound,
      participants: updatedParticipants,
    });
  }

  revealVotes(sessionId: string): PlanningSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session || !session.currentRound) return undefined;

    const round = session.currentRound;
    const updatedParticipants = session.participants.map(p => ({
      ...p,
      vote: round.votes[p.userId] ?? null,
    }));

    return this.update(sessionId, {
      currentRound: { ...round, phase: 'revealed' },
      participants: updatedParticipants,
    });
  }

  resetVotes(sessionId: string): PlanningSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session || !session.currentRound) return undefined;

    const round = session.currentRound;
    const updatedRound: VotingRound = {
      ...round,
      phase: 'voting',
      votes: {},
      votedUserIds: [],
      finalEstimate: null,
    };

    return this.update(sessionId, {
      currentRound: updatedRound,
      participants: session.participants.map(p => ({ ...p, hasVoted: false, vote: null })),
    });
  }

  completeRound(sessionId: string, finalEstimate: import('../types/index.js').CardValue): PlanningSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session || !session.currentRound) return undefined;

    const completedRound: VotingRound = {
      ...session.currentRound,
      finalEstimate,
      phase: 'revealed',
    };

    const isLast = session.currentIssueIndex >= session.issues.length - 1;

    return this.update(sessionId, {
      completedRounds: [...session.completedRounds, completedRound],
      currentRound: null,
      status: isLast ? 'completed' : 'active',
    });
  }

  transferHost(sessionId: string, excludeUserId: string): PlanningSession | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const nextHost = session.participants.find(p => p.isConnected && p.userId !== excludeUserId);
    if (!nextHost) return session;

    return this.update(sessionId, {
      hostUserId: nextHost.userId,
      participants: session.participants.map(p => ({
        ...p,
        isHost: p.userId === nextHost.userId,
      })),
    });
  }
}

export const sessionStore = new SessionStore();
