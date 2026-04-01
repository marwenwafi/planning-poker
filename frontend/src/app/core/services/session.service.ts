import { Injectable, signal, computed } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import {
  PlanningSession,
  Participant,
  CardValue,
  VotingRound,
} from '../models';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private socket: Socket | null = null;

  readonly session = signal<PlanningSession | null>(null);
  readonly localUser = signal<{ userId: string; displayName: string } | null>(null);
  readonly connectionStatus = signal<ConnectionStatus>('disconnected');

  readonly currentIssue = computed(() => {
    const s = this.session();
    if (!s || s.currentIssueIndex < 0) return null;
    return s.issues[s.currentIssueIndex] ?? null;
  });

  readonly currentRound = computed((): VotingRound | null => this.session()?.currentRound ?? null);

  readonly myVote = computed((): CardValue | null => {
    const round = this.currentRound();
    const user = this.localUser();
    if (!round || !user) return null;
    return round.votes[user.userId] ?? null;
  });

  readonly isHost = computed(() => {
    const s = this.session();
    const u = this.localUser();
    return !!s && !!u && s.hostUserId === u.userId;
  });

  readonly allVoted = computed(() => {
    const round = this.currentRound();
    const participants = this.session()?.participants.filter(p => p.isConnected) ?? [];
    if (participants.length === 0) return false;
    return participants.every(p => round?.votedUserIds.includes(p.userId));
  });

  readonly iHaveVoted = computed(() => {
    const round = this.currentRound();
    const user = this.localUser();
    if (!round || !user) return false;
    return round.votedUserIds.includes(user.userId);
  });

  connect(sessionId: string, userId: string, displayName: string): void {
    this.localUser.set({ userId, displayName });
    this.connectionStatus.set('connecting');

    const socketUrl = (window as any).__env?.SOCKET_URL || environment.socketUrl || window.location.origin;
    console.log('[socket] connecting to', socketUrl);

    this.socket = io(socketUrl, { transports: ['polling', 'websocket'] });

    this.socket.on('connect', () => {
      console.log('[socket] connected');
      this.connectionStatus.set('connected');
      this.socket!.emit('join_session', { sessionId, userId, displayName });
    });

    this.socket.on('connect_error', (err) => {
      console.error('[socket] connect_error', err.message);
      this.connectionStatus.set('error');
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[socket] disconnected', reason);
      this.connectionStatus.set('disconnected');
    });

    this.socket.on('session_updated', (s: PlanningSession) => this.session.set(s));

    this.socket.on('vote_submitted', ({ userId: uid, hasVoted }: { userId: string; hasVoted: boolean }) => {
      const s = this.session();
      if (!s) return;
      const round = s.currentRound;
      this.session.set({
        ...s,
        participants: s.participants.map(p =>
          p.userId === uid ? { ...p, hasVoted } : p
        ),
        currentRound: round && !round.votedUserIds.includes(uid)
          ? { ...round, votedUserIds: [...round.votedUserIds, uid] }
          : round,
      });
    });

    this.socket.on('participant_joined', (p: Participant) => {
      const s = this.session();
      if (!s) return;
      this.session.set({ ...s, participants: [...s.participants, p] });
    });

    this.socket.on('participant_left', ({ userId: uid }: { userId: string }) => {
      const s = this.session();
      if (!s) return;
      this.session.set({
        ...s,
        participants: s.participants.map(p =>
          p.userId === uid ? { ...p, isConnected: false } : p
        ),
      });
    });

    this.socket.on('participant_reconnected', ({ userId: uid }: { userId: string }) => {
      const s = this.session();
      if (!s) return;
      this.session.set({
        ...s,
        participants: s.participants.map(p =>
          p.userId === uid ? { ...p, isConnected: true } : p
        ),
      });
    });

    this.socket.on('host_transferred', ({ newHostUserId }: { newHostUserId: string }) => {
      const s = this.session();
      if (!s) return;
      this.session.set({
        ...s,
        hostUserId: newHostUserId,
        participants: s.participants.map(p => ({ ...p, isHost: p.userId === newHostUserId })),
      });
    });
  }

  startSession(sessionId: string): void {
    this.socket?.emit('start_session', { sessionId });
  }

  submitVote(sessionId: string, value: CardValue): void {
    const user = this.localUser();
    if (!user) return;
    this.socket?.emit('submit_vote', { sessionId, userId: user.userId, value });
  }

  revealVotes(sessionId: string): void {
    this.socket?.emit('reveal_votes', { sessionId });
  }

  requestRevote(sessionId: string): void {
    this.socket?.emit('request_revote', { sessionId });
  }

  nextIssue(sessionId: string, finalEstimate: CardValue): void {
    this.socket?.emit('next_issue', { sessionId, finalEstimate });
  }

  endSession(sessionId: string): void {
    this.socket?.emit('end_session', { sessionId });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.session.set(null);
    this.connectionStatus.set('disconnected');
  }

  onSessionCompleted(callback: () => void): void {
    this.socket?.on('session_completed', callback);
  }
}
