import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SessionService } from '../../core/services/session.service';
import { JiraService } from '../../core/services/jira.service';
import { VotingRound } from '../../core/models';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.scss',
})
export class SummaryComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private jira = inject(JiraService);
  readonly sessionSvc = inject(SessionService);

  readonly session = this.sessionSvc.session;

  saving = signal(false);
  saveProgress = signal(0);
  saveTotal = signal(0);
  saveError = signal<string | null>(null);
  saved = signal(false);

  ngOnInit() {
    const sessionId = this.route.snapshot.params['id'];
    if (!this.session() && this.sessionSvc.connectionStatus() === 'disconnected') {
      const userId = sessionStorage.getItem('userId') ?? '';
      const displayName = sessionStorage.getItem('displayName') ?? 'Guest';
      this.sessionSvc.connect(sessionId, userId, displayName);
    }
  }

  get completedRounds(): VotingRound[] {
    return this.session()?.completedRounds ?? [];
  }

  totalEstimatedHours(): number {
    return this.completedRounds
      .filter(r => r.finalEstimate !== null)
      .reduce((sum, r) => sum + (r.finalEstimate as number), 0);
  }

  async saveToJira() {
    const rounds = this.completedRounds.filter(r => r.finalEstimate !== null);
    this.saving.set(true);
    this.saveTotal.set(rounds.length);
    this.saveProgress.set(0);
    this.saveError.set(null);

    for (const round of rounds) {
      try {
        await this.jira.saveEstimate(round.issueKey, round.finalEstimate as number);
        this.saveProgress.update(n => n + 1);
      } catch {
        this.saveError.set(`Failed to save estimate for ${round.issueKey}`);
        this.saving.set(false);
        return;
      }
    }

    this.saving.set(false);
    this.saved.set(true);
  }

  exportCsv() {
    const rows = [['Issue Key', 'Summary', 'Estimate (h)']];
    for (const r of this.completedRounds) {
      rows.push([r.issueKey, `"${r.issueSummary.replace(/"/g, '""')}"`, String(r.finalEstimate ?? '')]);
    }
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.session()?.name ?? 'session'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  newSession() {
    this.sessionSvc.disconnect();
    this.router.navigate(['/setup']);
  }
}
