import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface NotificationMessage {
  text: string;
  type: 'error' | 'success';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notificationSubject = new BehaviorSubject<NotificationMessage | null>(null);
  notification$ = this.notificationSubject.asObservable();

  showError(text: string): void {
    this.notificationSubject.next({ text, type: 'error' });
    this.autoHide();
  }

  showSuccess(text: string): void {
    this.notificationSubject.next({ text, type: 'success' });
    this.autoHide();
  }

  clear(): void {
    this.notificationSubject.next(null);
  }

  private autoHide(): void {
    setTimeout(() => this.clear(), 4500);
  }
}