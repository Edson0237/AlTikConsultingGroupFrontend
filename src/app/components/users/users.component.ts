import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { UserService, AppUser, UserFilters } from '../../services/users/user.service';
import { AuthService } from '../../services/auth/auth.service';

// ── Constantes ────────────────────────────────────────────────────────────────

const ROLE_LABEL_KEYS: Record<string, string> = {
  etudiant: 'USERS.ROLE_ETUDIANT',
  responsable: 'USERS.ROLE_RESPONSABLE',
  conseiller: 'USERS.ROLE_CONSEILLER',
  admin: 'USERS.ROLE_ADMIN',
};

const ROLE_OPTIONS_RESTRICTED = [
  { value: '', labelKey: 'USERS.FILTER_ALL_ROLES' },
  { value: 'etudiant', labelKey: 'USERS.FILTER_ETUDIANTS_ONLY' },
  { value: 'responsable', labelKey: 'USERS.FILTER_RESPONSABLES_ONLY' },
];

const STATUT_OPTIONS = [
  { value: '', labelKey: 'USERS.FILTER_ALL_STATUSES' },
  { value: 'actif', labelKey: 'USERS.FILTER_ACTIVE' },
  { value: 'inactif', labelKey: 'USERS.FILTER_INACTIVE' },
];

/** Rôles exclus de l'affichage (filtre côté client en filet de sécurité) */
const EXCLUDED_ROLES = new Set(['conseiller', 'admin']);

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe, TranslatePipe],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {

  private userService = inject(UserService);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  // ── Auth ──────────────────────────────────────────────────────
  get isAdmin(): boolean { return this.authService.isAdmin(); }
  get isConseiller(): boolean {
    const role = this.authService.currentUser()?.role;
    return role === 'conseiller' || role === 'admin' || this.isAdmin;
  }

  // ── State ─────────────────────────────────────────────────────
  users = signal<AppUser[]>([]);
  totalCount = signal(0);
  loading = signal(false);
  error = signal('');

  // ── Filtres ───────────────────────────────────────────────────
  searchQuery = '';
  filterRole = '';
  filterStatut = '';
  showFilters = false;

  readonly roleOptions = ROLE_OPTIONS_RESTRICTED;
  readonly statutOptions = STATUT_OPTIONS;

  get roleOptionsWithLabels() {
    return this.roleOptions.map(opt => ({ value: opt.value, label: this.translate.instant(opt.labelKey) }));
  }
  get statutOptionsWithLabels() {
    return this.statutOptions.map(opt => ({ value: opt.value, label: this.translate.instant(opt.labelKey) }));
  }

  // ── Actions en cours ──────────────────────────────────────────
  togglingId: number | null = null;
  archivingId: number | null = null;

  // ── Modale détails utilisateur ───────────────────────────────
  showDetailsModal = false;
  detailsTarget: AppUser | null = null;

  // ── Confirm archivage ─────────────────────────────────────────
  showArchiveConfirm = false;
  archiveTarget: AppUser | null = null;
  archiveLoading = false;

  // ── Toast ─────────────────────────────────────────────────────
  toast: { message: string; type: 'success' | 'error' } | null = null;
  private toastTimer: any;

  // ── Lifecycle ─────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadUsers();
  }

  // ── Chargement ────────────────────────────────────────────────
  loadUsers(): void {
    this.loading.set(true);
    this.error.set('');

    const filters: UserFilters = {
      // Si filterRole est vide, on ne passe pas de rôle précis :
      // le service enverra roles=etudiant,responsable au serveur
      role: this.filterRole || undefined,
      statut: (this.filterStatut as any) || undefined,
      search: this.searchQuery.trim() || undefined,
    };

    this.userService.getUsers(filters).subscribe({
      next: ({ count, results }) => {
        // Filet de sécurité côté client : exclure conseillers et admins
        const filtered = results.filter(u => !EXCLUDED_ROLES.has(u.role));
        this.users.set(filtered);
        this.totalCount.set(filtered.length);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? this.translate.instant('USERS.LOAD_ERROR'));
        this.loading.set(false);
      },
    });
  }

  // ── Recherche avec debounce ───────────────────────────────────
  private searchTimer: any;
  onSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.loadUsers(), 350);
  }

  onFilterChange(): void {
    this.loadUsers();
  }

  toggleFilter(): void {
    this.showFilters = !this.showFilters;
  }

  resetFilters(): void {
    this.searchQuery = '';
    this.filterRole = '';
    this.filterStatut = '';
    this.loadUsers();
  }

  // ── Toggle activer / désactiver ───────────────────────────────
  toggleActive(user: AppUser): void {
    if (this.togglingId === user.id) return;
    const newState = !user.is_active;
    this.togglingId = user.id;

    // Optimistic update
    this.users.update(list =>
      list.map(u => u.id === user.id ? { ...u, is_active: newState, actif: newState } : u)
    );

    this.userService.toggleActive(user.id, newState).subscribe({
      next: (updated) => {
        this.users.update(list =>
          list.map(u => u.id === updated.id ? updated : u)
        );
        this.togglingId = null;
        this._showToast(
          newState
            ? this.translate.instant('USERS.ACCOUNT_ACTIVATED', { name: this.getFullName(user) })
            : this.translate.instant('USERS.ACCOUNT_DEACTIVATED', { name: this.getFullName(user) }),
          'success'
        );
      },
      error: (err) => {
        // Rollback
        this.users.update(list =>
          list.map(u => u.id === user.id ? { ...u, is_active: !newState, actif: !newState } : u)
        );
        this.togglingId = null;
        this._showToast(err?.error?.message ?? this.translate.instant('USERS.TOGGLE_ERROR'), 'error');
      },
    });
  }

  // ── Modale détails ─────────────────────────────────────────
  openDetails(user: AppUser): void {
    this.detailsTarget = user;
    this.showDetailsModal = true;
  }

  closeDetails(): void {
    this.showDetailsModal = false;
    this.detailsTarget = null;
  }

  // ── Archivage ─────────────────────────────────────────────────
  confirmArchive(user: AppUser): void {
    this.archiveTarget = user;
    this.showArchiveConfirm = true;
  }

  cancelArchive(): void {
    this.showArchiveConfirm = false;
    this.archiveTarget = null;
  }

  doArchive(): void {
    if (!this.archiveTarget || this.archiveLoading) return;
    this.archiveLoading = true;
    const isCurrentlyArchived = this.archiveTarget.est_archive;

    this.userService.archiveUser(this.archiveTarget.id, !isCurrentlyArchived).subscribe({
      next: (updated) => {
        this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
        this.archiveLoading = false;
        this.showArchiveConfirm = false;
        const nom = this.getFullName(this.archiveTarget!);
        const msg = isCurrentlyArchived
          ? `${nom} a été désarchivé avec succès.`
          : `${nom} a été archivé avec succès.`;
        this.archiveTarget = null;
        this._showToast(msg, 'success');
      },
      error: (err) => {
        this.archiveLoading = false;
        this._showToast(err?.error?.message ?? 'Erreur lors de l’archivage.', 'error');
      },
    });
  }

  toggleArchive(user: AppUser): void {
    if (this.archivingId === user.id) return;
    this.archivingId = user.id;
    this.userService.archiveUser(user.id, !user.est_archive).subscribe({
      next: (updated) => {
        this.users.update(list => list.map(u => u.id === updated.id ? updated : u));
        this.archivingId = null;
        const msg = updated.est_archive
          ? `${this.getFullName(updated)} archivé.`
          : `${this.getFullName(updated)} désarchivé.`;
        this._showToast(msg, 'success');
      },
      error: (err) => {
        this.archivingId = null;
        this._showToast(err?.error?.message ?? 'Erreur archivage.', 'error');
      },
    });
  }

  // ── Helpers ───────────────────────────────────────────────────
  getInitials(user: AppUser): string {
    const f = (user.first_name || user.username).charAt(0).toUpperCase();
    const l = (user.last_name || '').charAt(0).toUpperCase();
    return f + l;
  }

  getFullName(user: AppUser): string {
    const name = `${user.first_name} ${user.last_name}`.trim();
    return name || user.username;
  }

  getRoleLabel(role: string): string {
    const key = ROLE_LABEL_KEYS[role];
    return key ? this.translate.instant(key) : role;
  }

  canToggle(user: AppUser): boolean {
    if (!this.isConseiller) return false;
    if (!this.isAdmin && (user.role === 'admin' || user.role === 'conseiller')) return false;
    return true;
  }

  canArchive(user: AppUser): boolean {
    return this.isAdmin;
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }


  // ── Toast ─────────────────────────────────────────────────────
  private _showToast(message: string, type: 'success' | 'error'): void {
    clearTimeout(this.toastTimer);
    this.toast = { message, type };
    this.toastTimer = setTimeout(() => { this.toast = null; }, 3800);
  }
}