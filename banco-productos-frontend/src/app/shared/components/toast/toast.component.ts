import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="notificationService.notification$ | async as msg" 
         class="toast" 
         [ngClass]="msg.type">
      <span>{{ msg.text }}</span>
      <button (click)="notificationService.clear()">✕</button>
    </div>
  `,
  styles: [`
    .toast {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 14px 20px;
      border-radius: 6px;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 2000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      font-size: 14px;
    }
    .toast.error { background-color: #d9534f; }
    .toast.success { background-color: #2e7d32; }
    button {
      background: transparent;
      border: none;
      color: white;
      font-weight: bold;
      cursor: pointer;
    }
  `]
})
export class ToastComponent {
  constructor(public notificationService: NotificationService) {}
}