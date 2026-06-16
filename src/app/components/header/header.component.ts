import { Component, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleCasePipe],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {

  private readonly router      = inject(Router);
  private readonly authService = inject(AuthService);

  // ── UI state ─────────────────────────────────────────────────────
  showUserMenu = false;
  currentLang  = 'FR';
  searchQuery  = '';
  unreadCount  = 3;

  // ── User info (réactif via signals) ──────────────────────────────
  get userFullName(): string {
    return this.authService.userFullName() || this.authService.currentUser()?.email || 'Utilisateur';
  }

  get userEmail(): string {
    return this.authService.currentUser()?.email ?? '';
  }

  get userRole(): string {
    return this.authService.currentUser()?.role ?? 'admin';
  }

  get userInitials(): string {
    const u = this.authService.currentUser();
    if (!u) return 'AU';
    const first = u.firstName?.charAt(0) ?? '';
    const last  = u.lastName?.charAt(0)  ?? '';
    return (first + last).toUpperCase() || u.email.charAt(0).toUpperCase();
  }

  // ── Actions ───────────────────────────────────────────────────────
  toggleLanguage(): void {
    this.currentLang = this.currentLang === 'FR' ? 'EN' : 'FR';
    // this.translateService.use(this.currentLang.toLowerCase());
  }

  toggleNotifications(): void {
    this.router.navigate(['/dashboard-admin/notifications']);
  }

  toggleUserMenu(): void  { this.showUserMenu = !this.showUserMenu; }
  closeUserMenu(): void   { this.showUserMenu = false; }

  goToProfile(): void {
    this.closeUserMenu();
    this.router.navigate(['/dashboard-admin/parametres']);
  }

  handleLogout(): void {
    this.closeUserMenu();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}