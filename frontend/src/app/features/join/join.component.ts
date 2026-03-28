import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';

@Component({
  selector: 'app-join',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './join.component.html',
  styleUrl: './join.component.scss',
})
export class JoinComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  displayName = sessionStorage.getItem('displayName') ?? '';

  get canJoin(): boolean {
    return this.displayName.trim().length > 0;
  }

  join() {
    if (!this.canJoin) return;
    const sessionId = this.route.snapshot.params['id'];
    sessionStorage.setItem('displayName', this.displayName.trim());
    if (!sessionStorage.getItem('userId')) {
      sessionStorage.setItem('userId', uuidv4());
    }
    this.router.navigate(['/session', sessionId, 'lobby']);
  }
}
