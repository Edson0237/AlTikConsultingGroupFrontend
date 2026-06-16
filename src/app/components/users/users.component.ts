import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService, AppUser, UserFilters } from '../../services/users/user.service';
import { AuthService } from '../../services/auth/auth.service';

// ── Constantes ────────────────────────────────────────────────────────────────

const ROLE_LABELS: Record<string, string> = {
  etudiant: 'Étudiant',
  responsable: 'Responsable',
  conseiller: 'Conseiller',
  admin: 'Admin',
};

const ROLE_OPTIONS_RESTRICTED = [
  { value: '', label: 'Étudiants & Responsables' },
  { value: 'etudiant', label: 'Étudiants uniquement' },
  { value: 'responsable', label: 'Responsables uniquement' },
];

const STATUT_OPTIONS = [
  { value: '', label: 'Tous les statuts' },
  { value: 'actif', label: 'Actifs' },
  { value: 'inactif', label: 'Inactifs' },
];

/** Rôles exclus de l'affichage (filtre côté client en filet de sécurité) */
const EXCLUDED_ROLES = new Set(['conseiller', 'admin']);

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {

  private userService = inject(UserService);
  private authService = inject(AuthService);

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

  // ── Actions en cours ──────────────────────────────────────────
  togglingId: number | null = null;
  deletingId: number | null = null;

  // ── Confirm suppression ───────────────────────────────────────
  showDeleteConfirm = false;
  deleteTarget: AppUser | null = null;
  deleteLoading = false;

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
        this.error.set(err?.error?.message ?? 'Impossible de charger les utilisateurs.');
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
            ? `Compte de ${this.getFullName(user)} activé avec succès.`
            : `Compte de ${this.getFullName(user)} désactivé avec succès.`,
          'success'
        );
      },
      error: (err) => {
        // Rollback
        this.users.update(list =>
          list.map(u => u.id === user.id ? { ...u, is_active: !newState, actif: !newState } : u)
        );
        this.togglingId = null;
        this._showToast(err?.error?.message ?? 'Erreur lors de la modification.', 'error');
      },
    });
  }

  // ── Suppression ───────────────────────────────────────────────
  confirmDelete(user: AppUser): void {
    this.deleteTarget = user;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deleteTarget = null;
  }

  doDelete(): void {
    if (!this.deleteTarget || this.deleteLoading) return;
    this.deleteLoading = true;

    this.userService.deleteUser(this.deleteTarget.id).subscribe({
      next: () => {
        const nom = this.getFullName(this.deleteTarget!);
        this.users.update(list => list.filter(u => u.id !== this.deleteTarget!.id));
        this.totalCount.update(n => n - 1);
        this.deleteLoading = false;
        this.showDeleteConfirm = false;
        this.deleteTarget = null;
        this._showToast(`Compte de ${nom} supprimé avec succès.`, 'success');
      },
      error: (err) => {
        this.deleteLoading = false;
        this._showToast(err?.error?.message ?? 'Erreur lors de la suppression.', 'error');
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
    return ROLE_LABELS[role] ?? role;
  }

  canToggle(user: AppUser): boolean {
    if (!this.isConseiller) return false;
    if (!this.isAdmin && (user.role === 'admin' || user.role === 'conseiller')) return false;
    return true;
  }

  canDelete(user: AppUser): boolean {
    return this.isAdmin || this.isConseiller;
  }


  // ── Toast ─────────────────────────────────────────────────────
  private _showToast(message: string, type: 'success' | 'error'): void {
    clearTimeout(this.toastTimer);
    this.toast = { message, type };
    this.toastTimer = setTimeout(() => { this.toast = null; }, 3800);
  }
}