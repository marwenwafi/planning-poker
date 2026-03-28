import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../core/services/session.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, AvatarComponent],
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.scss',
})
export class LobbyComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly sessionSvc = inject(SessionService);

  sessionId = '';
  shareUrl = signal('');
  copied = signal(false);

  readonly session = this.sessionSvc.session;
  readonly isHost = this.sessionSvc.isHost;
  readonly connectionStatus = this.sessionSvc.connectionStatus;

  ngOnInit() {
    this.sessionId = this.route.snapshot.params['id'];
    const userId = sessionStorage.getItem('userId') ?? '';
    const displayName = sessionStorage.getItem('displayName') ?? 'Guest';

    this.shareUrl.set(`${window.location.origin}/session/${this.sessionId}/join`);
    this.sessionSvc.connect(this.sessionId, userId, displayName);

    // Navigate to voting when session becomes active
    this.sessionSvc.session;  // subscribe via effect elsewhere — handled by template check
  }

  ngOnDestroy() {
    // don't disconnect — user is navigating to voting
  }

  get connectedCount(): number {
    return this.session()?.participants.filter(p => p.isConnected).length ?? 0;
  }

  copyLink() {
    navigator.clipboard.writeText(this.shareUrl()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  startVoting() {
    this.sessionSvc.startSession(this.sessionId);
    this.router.navigate(['/session', this.sessionId, 'vote']);
  }

  joinAsGuest() {
    this.router.navigate(['/session', this.sessionId, 'vote']);
  }
}
