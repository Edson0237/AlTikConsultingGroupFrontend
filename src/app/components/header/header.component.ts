import { Component, inject } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { AuthService } from '../../services/auth/auth.service';
import { LanguageService, AppLanguage, LanguageOption } from '../../services/language/language.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, FormsModule, TitleCasePipe, TranslatePipe],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly languageService = inject(LanguageService);

  constructor() {
    // Le header n'est rendu que sur les pages déjà authentifiées : on est
    // donc certain que authService.currentUser() est déjà disponible ici.
    this.languageService.init(this.authService.currentUser()?.id ?? null);
  }

  // ── UI state ─────────────────────────────────────────────────────
  showUserMenu = false;
  showLangMenu = false;
  searchQuery = '';
  unreadCount = 3;

  // ── Langue ───────────────────────────────────────────────────────
  readonly languageOptions: LanguageOption[] = this.languageService.options;

  get currentLang(): string {
    return this.languageService.currentShortLabel;
  }

  isActiveLang(code: AppLanguage): boolean {
    return this.languageService.currentLang() === code;
  }

  selectLanguage(code: AppLanguage): void {
    this.languageService.setLanguage(code, this.authService.currentUser()?.id ?? null);
    this.showLangMenu = false;
  }

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

  get roleClass(): string {
    return `header__dropdown-role--${this.userRole || 'admin'}`;
  }

  get userInitials(): string {
    const u = this.authService.currentUser();
    if (!u) return 'AU';
    const first = u.firstName?.charAt(0) ?? '';
    const last = u.lastName?.charAt(0) ?? '';
    return (first + last).toUpperCase() || u.email.charAt(0).toUpperCase();
  }

  // ── Actions ───────────────────────────────────────────────────────
  toggleLangMenu(): void { this.showLangMenu = !this.showLangMenu; }
  closeLangMenu(): void { this.showLangMenu = false; }

  toggleNotifications(): void {
    this.router.navigate(['/dashboard-admin/notifications']);
  }

  toggleUserMenu(): void { this.showUserMenu = !this.showUserMenu; }
  closeUserMenu(): void { this.showUserMenu = false; }

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