import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { environment } from '../../../environments/environment';
import { JiraIssue } from '../../core/models';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.scss',
})
export class SetupComponent {
  private router = inject(Router);
  private http = inject(HttpClient);

  displayName = signal('');
  sessionName = signal('');
  issues = signal<JiraIssue[]>([]);
  parseError = signal<string | null>(null);
  creating = signal(false);

  readonly canStart = computed(() =>
    this.displayName().trim().length > 0 &&
    this.sessionName().trim().length > 0 &&
    this.issues().length > 0 &&
    !this.creating()
  );

  onFileChange(event: Event) {
    this.parseError.set(null);
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        this.issues.set(this.parseCsv(text));
      } catch (err: any) {
        this.parseError.set(err.message);
        this.issues.set([]);
      }
    };
    reader.readAsText(file);
  }

  private parseCsv(text: string): JiraIssue[] {
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) throw new Error('CSV must have a header row and at least one ticket');

    const headers = lines[0]!.split(',').map(h => h.trim().toLowerCase());
    const keyIdx = headers.indexOf('key');
    const summaryIdx = headers.indexOf('summary');

    if (keyIdx === -1 || summaryIdx === -1) {
      throw new Error('CSV must have at least "Key" and "Summary" columns');
    }

    const descIdx = headers.indexOf('description');
    const typeIdx = headers.indexOf('issuetype');
    const priorityIdx = headers.indexOf('priority');
    const assigneeIdx = headers.indexOf('assignee');

    return lines.slice(1).map((line, i) => {
      const cols = this.splitCsvLine(line);
      const key = cols[keyIdx]?.trim();
      const summary = cols[summaryIdx]?.trim();
      if (!key || !summary) throw new Error(`Row ${i + 2}: "Key" and "Summary" are required`);
      return {
        id: key,
        key,
        summary,
        description: descIdx !== -1 ? (cols[descIdx]?.trim() || null) : null,
        issueType: typeIdx !== -1 ? (cols[typeIdx]?.trim() || 'Task') : 'Task',
        currentEstimate: null,
        priority: priorityIdx !== -1 ? (cols[priorityIdx]?.trim() || 'Medium') : 'Medium',
        assignee: assigneeIdx !== -1 ? (cols[assigneeIdx]?.trim() || null) : null,
        url: '#',
      };
    });
  }

  // Handles quoted fields with commas inside
  private splitCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  async startSession() {
    if (!this.canStart()) return;
    this.creating.set(true);
    try {
      const userId = sessionStorage.getItem('userId') ?? uuidv4();
      const name = this.displayName().trim();
      const result = await firstValueFrom(
        this.http.post<{ id: string }>(`${environment.apiUrl}/sessions`, {
          hostUserId: userId,
          hostDisplayName: name,
          sessionName: this.sessionName().trim(),
          issues: this.issues(),
        })
      );
      sessionStorage.setItem('userId', userId);
      sessionStorage.setItem('displayName', name);
      await this.router.navigate(['/session', result.id, 'lobby']);
    } catch {
      this.parseError.set('Failed to create session. Is the backend running?');
    } finally {
      this.creating.set(false);
    }
  }
}
