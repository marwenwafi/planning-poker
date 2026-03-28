import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { JiraService } from '../../core/services/jira.service';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './setup.component.html',
  styleUrl: './setup.component.scss',
})
export class SetupComponent implements OnInit {
  private jira = inject(JiraService);
  private router = inject(Router);

  readonly projects = this.jira.projects;
  readonly boards = this.jira.boards;
  readonly sprints = this.jira.sprints;
  readonly loading = this.jira.loading;
  readonly error = this.jira.error;

  displayName = '';
  selectedProjectKey = '';
  selectedBoardId: number | null = null;
  selectedSprintId: number | null = null;
  selectedSprintName = '';
  creating = signal(false);

  readonly canStart = computed(() =>
    this.displayName.trim().length > 0 &&
    this.selectedSprintId !== null &&
    !this.creating()
  );

  async ngOnInit() {
    await this.jira.loadProjects();
  }

  async onProjectChange(key: string) {
    this.selectedProjectKey = key;
    this.selectedBoardId = null;
    this.selectedSprintId = null;
    this.jira.boards.set([]);
    this.jira.sprints.set([]);
    if (key) await this.jira.loadBoards(key);
  }

  async onBoardChange(boardId: string) {
    this.selectedBoardId = parseInt(boardId, 10);
    this.selectedSprintId = null;
    this.jira.sprints.set([]);
    if (this.selectedBoardId) await this.jira.loadSprints(this.selectedBoardId);
  }

  onSprintChange(sprintId: string) {
    this.selectedSprintId = parseInt(sprintId, 10);
    const sprint = this.sprints().find(s => s.id === this.selectedSprintId);
    this.selectedSprintName = sprint?.name ?? '';
  }

  async startSession() {
    if (!this.canStart()) return;
    this.creating.set(true);
    try {
      const userId = this.getOrCreateUserId();
      const result = await this.jira.createSession({
        hostUserId: userId,
        hostDisplayName: this.displayName.trim(),
        jiraProjectKey: this.selectedProjectKey,
        sprintId: this.selectedSprintId!,
        sprintName: this.selectedSprintName,
      });
      sessionStorage.setItem('userId', userId);
      sessionStorage.setItem('displayName', this.displayName.trim());
      await this.router.navigate(['/session', result.id, 'lobby']);
    } catch {
      this.jira.error.set('Failed to create session');
    } finally {
      this.creating.set(false);
    }
  }

  private getOrCreateUserId(): string {
    return sessionStorage.getItem('userId') ?? uuidv4();
  }
}
