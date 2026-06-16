import { Component, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule, TitleCasePipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {

  private readonly router      = inject(Router);
  private readonly authService = inject(AuthService);

  readonly appName    = 'ScholarTik';
  readonly appTagline = 'Bourses · Visas · Commerce';

  handleLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}