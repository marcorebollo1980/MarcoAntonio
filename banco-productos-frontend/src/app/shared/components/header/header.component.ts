import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="header">
      <div class="brand" (click)="goHome()">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#1e3a8a" stroke-width="2">
          <rect x="2" y="6" width="16" height="12" rx="2"></rect>
          <path d="M6 2h14a2 2 0 0 1 2 2v10"></path>
          <circle cx="10" cy="12" r="2"></circle>
        </svg>
        <span class="brand-text">BANCO</span>
      </div>
    </header>
  `,
  styles: [`
    .header {
      background-color: #ffffff;
      height: 68px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-bottom: 1px solid #e5e7eb;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
    }
    .brand-text {
      font-size: 20px;
      font-weight: 800;
      color: #1e3a8a;
      letter-spacing: 1.5px;
    }
  `]
})
export class HeaderComponent {
  constructor(private router: Router) {}
  goHome(): void {
    this.router.navigate(['/products']);
  }
}