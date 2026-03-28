import { Component, OnInit, OnDestroy, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../core/services/session.service';
import { CARD_VALUES, CardValue } from '../../core/models';
import { PokerCardComponent } from '../../shared/components/poker-card/poker-card.component';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-voting',
  standalone: true,
  imports: [CommonModule, PokerCardComponent, AvatarComponent],
  templateUrl: './voting.component.html',
  styleUrl: './voting.component.scss',
})
export class VotingComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly sessionSvc = inject(SessionService);

  readonly CARD_VALUES = CARD_VALUES;
  sessionId = '';

  readonly session = this.sessionSvc.session;
  readonly currentIssue = this.sessionSvc.currentIssue;
  readonly currentRound = this.sessionSvc.currentRound;
  readonly myVote = this.sessionSvc.myVote;
  readonly isHost = this.sessionSvc.isHost;
  readonly allVoted = this.sessionSvc.allVoted;
  readonly iHaveVoted = this.sessionSvc.iHaveVoted;

  selectedEstimate = signal<CardValue | null>(null);
  saving = signal(false);

  constructor() {
    effect(() => {
      const s = this.session();
      if (s?.status === 'completed') {
        this.router.navigate(['/session', this.sessionId, 'summary']);
      }
    });
  }

  ngOnInit() {
    this.sessionId = this.route.snapshot.params['id'];
    // Reconnect if navigated directly (e.g. page refresh)
    if (!this.sessionSvc.connectionStatus() || this.sessionSvc.connectionStatus() === 'disconnected') {
      const userId = sessionStorage.getItem('userId') ?? '';
      const displayName = sessionStorage.getItem('displayName') ?? 'Guest';
      this.sessionSvc.connect(this.sessionId, userId, displayName);
    }
    this.sessionSvc.onSessionCompleted(() => {
      this.router.navigate(['/session', this.sessionId, 'summary']);
    });
  }

  ngOnDestroy() {}

  vote(value: CardValue) {
    this.selectedEstimate.set(value);
    this.sessionSvc.submitVote(this.sessionId, value);
  }

  reveal() {
    this.sessionSvc.revealVotes(this.sessionId);
  }

  revote() {
    this.selectedEstimate.set(null);
    this.sessionSvc.requestRevote(this.sessionId);
  }

  confirmAndNext(estimate: CardValue) {
    this.selectedEstimate.set(null);
    this.sessionSvc.nextIssue(this.sessionId, estimate);
  }

  get ticketProgress(): string {
    const s = this.session();
    if (!s) return '';
    return `${s.currentIssueIndex + 1} / ${s.issues.length}`;
  }

  get voteValues(): CardValue[] {
    const round = this.currentRound();
    if (!round) return [];
    return Object.values(round.votes) as CardValue[];
  }

  get suggestedEstimate(): CardValue | null {
    const votes = this.voteValues;
    if (votes.length === 0) return null;
    const numericVotes = votes.filter(v => typeof v === 'number') as number[];
    if (numericVotes.length === 0) return null;
    const avg = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length;
    // Find nearest card value
    return CARD_VALUES.reduce((nearest, v) =>
      Math.abs(v - avg) < Math.abs(nearest - avg) ? v : nearest
    );
  }

  getParticipantVote(userId: string): CardValue | null {
    return this.currentRound()?.votes[userId] ?? null;
  }
}
