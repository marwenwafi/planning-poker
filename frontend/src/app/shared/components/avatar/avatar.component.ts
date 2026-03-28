import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

const COLORS = [
  '#4f46e5', '#0891b2', '#059669', '#d97706',
  '#dc2626', '#7c3aed', '#db2777', '#2563eb',
];

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="avatar"
      [style.width.px]="size"
      [style.height.px]="size"
      [style.background]="color"
      [style.font-size.px]="size * 0.38"
    >{{ initials }}</div>
  `,
  styles: [`
    .avatar {
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      flex-shrink: 0;
      user-select: none;
    }
  `],
})
export class AvatarComponent {
  @Input() name = '';
  @Input() size = 36;

  get initials(): string {
    const parts = this.name.trim().split(/\s+/);
    return parts.length >= 2
      ? (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
      : (this.name.slice(0, 2)).toUpperCase();
  }

  get color(): string {
    let hash = 0;
    for (let i = 0; i < this.name.length; i++) {
      hash = this.name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length]!;
  }
}
