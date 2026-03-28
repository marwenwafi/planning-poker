import { Server, Socket } from 'socket.io';
import { sessionStore } from '../services/session.store';
import {
  JoinSessionPayload,
  SubmitVotePayload,
  RevealVotesPayload,
  NextIssuePayload,
  EndSessionPayload,
  SetEstimatePayload,
} from '../types/index';

export function registerSessionHandlers(io: Server, socket: Socket): void {
  socket.on('join_session', (payload: JoinSessionPayload) => {
    const { sessionId, userId, displayName } = payload;
    const session = sessionStore.get(sessionId);
    if (!session) {
      socket.emit('error', { message: 'Session not found' });
      return;
    }

    socket.join(sessionId);

    const existing = session.participants.find(p => p.userId === userId);
    if (existing) {
      // Reconnect: update socketId and mark connected
      const updated = sessionStore.update(sessionId, {
        participants: session.participants.map(p =>
          p.userId === userId ? { ...p, socketId: socket.id, isConnected: true } : p
        ),
      });
      socket.emit('session_updated', updated);
      socket.to(sessionId).emit('participant_reconnected', { userId });
    } else {
      // New participant
      const newParticipant = {
        socketId: socket.id,
        userId,
        displayName,
        isHost: false,
        hasVoted: false,
        vote: null,
        isConnected: true,
      };
      const updated = sessionStore.update(sessionId, {
        participants: [...session.participants, newParticipant],
      });
      socket.emit('session_updated', updated);
      socket.to(sessionId).emit('participant_joined', newParticipant);
    }
  });

  socket.on('start_session', (payload: { sessionId: string }) => {
    const session = sessionStore.startRound(payload.sessionId);
    if (session) {
      io.to(payload.sessionId).emit('session_updated', session);
    }
  });

  socket.on('submit_vote', (payload: SubmitVotePayload) => {
    const { sessionId, userId, value } = payload;
    const session = sessionStore.submitVote(sessionId, userId, value);
    if (!session) return;

    // Broadcast that this user voted (no value revealed)
    io.to(sessionId).emit('vote_submitted', { userId, hasVoted: true });

    // Check if all connected participants have voted
    const connectedCount = session.participants.filter(p => p.isConnected).length;
    const votedCount = session.currentRound?.votedUserIds.length ?? 0;
    if (connectedCount > 0 && votedCount >= connectedCount) {
      io.to(sessionId).emit('all_voted');
    }
  });

  socket.on('reveal_votes', (payload: RevealVotesPayload) => {
    const session = sessionStore.revealVotes(payload.sessionId);
    if (session) {
      io.to(payload.sessionId).emit('session_updated', session);
    }
  });

  socket.on('request_revote', (payload: RevealVotesPayload) => {
    const session = sessionStore.resetVotes(payload.sessionId);
    if (session) {
      io.to(payload.sessionId).emit('session_updated', session);
    }
  });

  socket.on('next_issue', (payload: NextIssuePayload) => {
    const { sessionId, finalEstimate } = payload;
    // Save completed round with final estimate
    sessionStore.completeRound(sessionId, finalEstimate);
    // Start next round
    const session = sessionStore.startRound(sessionId);
    if (session) {
      io.to(sessionId).emit('session_updated', session);
    } else {
      // No more issues
      const completed = sessionStore.update(sessionId, { status: 'completed' });
      io.to(sessionId).emit('session_updated', completed);
      io.to(sessionId).emit('session_completed');
    }
  });

  socket.on('end_session', (payload: EndSessionPayload) => {
    const session = sessionStore.update(payload.sessionId, { status: 'completed' });
    io.to(payload.sessionId).emit('session_updated', session);
    io.to(payload.sessionId).emit('session_completed');
  });

  socket.on('disconnecting', () => {
    for (const room of socket.rooms) {
      if (room === socket.id) continue; // skip default room

      const session = sessionStore.get(room);
      if (!session) continue;

      const participant = session.participants.find(p => p.socketId === socket.id);
      if (!participant) continue;

      const updated = sessionStore.update(room, {
        participants: session.participants.map(p =>
          p.socketId === socket.id ? { ...p, isConnected: false } : p
        ),
      });

      if (participant.isHost) {
        // Transfer host to next connected participant
        const transferred = sessionStore.transferHost(room, participant.userId);
        socket.to(room).emit('session_updated', transferred);
        socket.to(room).emit('host_transferred', { newHostUserId: transferred?.hostUserId });
      } else {
        socket.to(room).emit('session_updated', updated);
        socket.to(room).emit('participant_left', { userId: participant.userId });
      }
    }
  });
}
