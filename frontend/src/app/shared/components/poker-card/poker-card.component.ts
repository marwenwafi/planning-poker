import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardValue } from '../../../core/models';

@Component({
  selector: 'app-poker-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './poker-card.component.html',
  styleUrl: './poker-card.component.scss',
})
export class PokerCardComponent {
  @Input() value!: CardValue;
  @Input() selected = false;
  @Input() revealed = false;
  @Input() disabled = false;
  @Output() clicked = new EventEmitter<CardValue>();

  onClick() {
    if (!this.disabled) this.clicked.emit(this.value);
  }
}
