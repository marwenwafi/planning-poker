import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { JiraProject, JiraSprint, JiraIssue } from '../models';

@Injectable({ providedIn: 'root' })
export class JiraService {
  readonly projects = signal<JiraProject[]>([]);
  readonly boards = signal<{ id: number; name: string }[]>([]);
  readonly sprints = signal<JiraSprint[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  private base = environment.apiUrl + '/jira';

  constructor(private http: HttpClient) {}

  async loadProjects(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(this.http.get<JiraProject[]>(`${this.base}/projects`));
      this.projects.set(data);
    } catch (e: any) {
      this.error.set(e?.error?.error ?? 'Failed to load projects');
    } finally {
      this.loading.set(false);
    }
  }

  async loadBoards(projectKey: string): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(
        this.http.get<{ id: number; name: string }[]>(`${this.base}/boards`, { params: { projectKey } })
      );
      this.boards.set(data);
    } catch (e: any) {
      this.error.set(e?.error?.error ?? 'Failed to load boards');
    } finally {
      this.loading.set(false);
    }
  }

  async loadSprints(boardId: number): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(
        this.http.get<JiraSprint[]>(`${this.base}/sprints`, { params: { boardId: boardId.toString() } })
      );
      this.sprints.set(data);
    } catch (e: any) {
      this.error.set(e?.error?.error ?? 'Failed to load sprints');
    } finally {
      this.loading.set(false);
    }
  }

  async saveEstimate(issueKey: string, hours: number): Promise<void> {
    await firstValueFrom(this.http.put(`${this.base}/estimate`, { issueKey, hours }));
  }

  async createSession(payload: {
    hostUserId: string;
    hostDisplayName: string;
    jiraProjectKey: string;
    sprintId: number;
    sprintName: string;
  }): Promise<{ id: string }> {
    return firstValueFrom(
      this.http.post<{ id: string }>(`${environment.apiUrl}/sessions`, payload)
    );
  }

  getIssues(sprintId: number) {
    return firstValueFrom(
      this.http.get<JiraIssue[]>(`${this.base}/issues`, { params: { sprintId: sprintId.toString() } })
    );
  }
}
