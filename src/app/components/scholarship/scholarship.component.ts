import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { DossierService, DossierAdmin, DossierStatus, DossierFilters, TypeDossier } from '../../services/dossier/dossier.service';
import { Router } from '@angular/router';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

// ── Interfaces ──────────────────────────────────────────────────────────────

export interface KanbanColumn {
  id: DossierStatus;
  label: string;
  color: string;
}

export interface Notification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
}

// ── Options pour les filtres ────────────────────────────────────────────────

export const STATUS_OPTIONS: { value: DossierStatus | ''; label: string }[] = [
  { value: '', label: 'SCHOLARSHIP.ALL_STATUSES' },
  { value: 'en_attente_de_traitement', label: 'SCHOLARSHIP.COLUMN_EN_ATTENTE_DE_TRAITEMENT' },
  { value: 'en_cours', label: 'SCHOLARSHIP.COLUMN_EN_COURS' },
  { value: 'complete', label: 'SCHOLARSHIP.COLUMN_COMPLETE' },
  { value: 'valide', label: 'SCHOLARSHIP.COLUMN_VALIDE' },
  { value: 'rejete', label: 'SCHOLARSHIP.COLUMN_REJETE' },
];

export const TYPE_DOSSIER_OPTIONS: { value: TypeDossier | ''; label: string }[] = [
  { value: '', label: 'SCHOLARSHIP.ALL_TYPES' },
  { value: 'bourse_chine', label: 'SCHOLARSHIP.TYPE_BOURSE_CHINE' },
  { value: 'bourse_allemagne', label: 'SCHOLARSHIP.TYPE_BOURSE_ALLEMAGNE' },
  { value: 'bourse_canada', label: 'SCHOLARSHIP.TYPE_BOURSE_CANADA' },
];

const BOURSE_TYPES: TypeDossier[] = ['bourse_chine', 'bourse_allemagne', 'bourse_canada'];

// ── Composant ───────────────────────────────────────────────────────────────

@Component({
  selector: 'app-scholarship-china',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './scholarship.component.html',
  styleUrl: './scholarship.component.scss',
})
export class ScholarshipComponent implements OnInit {

  private dossierService = inject(DossierService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private translate = inject(TranslateService);
  // ── State ────────────────────────────────────────────────────
  searchQuery = signal<string>('');
  isLoading = signal<boolean>(true);
  dossiers = signal<DossierAdmin[]>([]);
  draggedDossier: DossierAdmin | null = null;
  notifications = signal<Notification[]>([]);

  // ── Filtres ───────────────────────────────────────────────────
  filterForm!: FormGroup;
  showFilterModal = false;
  currentFilters: DossierFilters = {};

  // ── Colonnes ──────────────────────────────────────────────────
  readonly columns: KanbanColumn[] = [
    { id: 'en_attente_de_traitement', label: 'En attente de traitement', color: '#94A3B8' },
    { id: 'en_cours', label: 'En cours', color: '#3B82F6' },
    { id: 'complete', label: 'Complet', color: '#0EA5E9' },
    { id: 'valide', label: 'Validé', color: '#10B981' },
    { id: 'rejete', label: 'Rejeté', color: '#EF4444' },
  ];

  // ── Options pour les templates ───────────────────────────────
  readonly statusOptions = STATUS_OPTIONS;
  readonly typeDossierOptions = TYPE_DOSSIER_OPTIONS;

  // ── Computed ──────────────────────────────────────────────────
  filteredDossiers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const allDossiers = this.dossiers();

    if (!query) return allDossiers;

    return allDossiers.filter(d =>
      d.nom.toLowerCase().includes(query) ||
      d.prenom.toLowerCase().includes(query) ||
      d.email.toLowerCase().includes(query) ||
      d.utilisateur_nom.toLowerCase().includes(query)
    );
  });

  // openDossierDetail(dossier: DossierAdmin): void {
  //   this.router.navigate(['/admin/dossiers', dossier.id]);
  // }

  openDossierDetail(dossier: DossierAdmin): void {
    this.router.navigate(['/dashboard-admin/admin/dossiers', dossier.id]);
  }

  // ── Lifecycle ────────────────────────────────────────────────

  ngOnInit(): void {
    this._buildFilterForm();
    this.loadDossiers();
  }

  // ── Chargement des données ────────────────────────────────────

  loadDossiers(): void {
    this.isLoading.set(true);

    // Sauvegarder les filtres actuels
    this.currentFilters = this.filterForm.value;

    this.dossierService.getAllDossiers(this.currentFilters).subscribe({
      next: (dossiers) => {
        const typeFilter = this.currentFilters.type_dossier as TypeDossier | '';
        const bourses = typeFilter
          ? dossiers.filter(d => d.type_dossier === typeFilter)
          : dossiers.filter(d => BOURSE_TYPES.includes(d.type_dossier as TypeDossier));
        this.dossiers.set(bourses);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement dossiers:', err);
        this.isLoading.set(false);
        this.showNotification(this.translate.instant('SCHOLARSHIP.LOAD_ERROR'), 'error');
      }
    });
  }

  // ── Recherche ───────────────────────────────────────────────

  onSearch(): void {
    // Le filtrage se fait côté client via computed
  }

  // ── Helper: dossiers par colonne ──────────────────────────────

  getColumnDossiers(columnId: DossierStatus): DossierAdmin[] {
    return this.filteredDossiers().filter(d => d.status === columnId);
  }

  // ── Drag & Drop ───────────────────────────────────────────────

  onDragStart(event: DragEvent, dossier: DossierAdmin): void {
    this.draggedDossier = dossier;
    event.dataTransfer?.setData('text/plain', String(dossier.id));

    const el = event.target as HTMLElement;
    event.dataTransfer?.setDragImage(el, el.offsetWidth / 2, el.offsetHeight / 2);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    const col = event.currentTarget as HTMLElement;
    col.classList.add('drag-over');
  }

  onDragLeave(event: DragEvent): void {
    const col = event.currentTarget as HTMLElement;
    col.classList.remove('drag-over');
  }

  onDrop(event: DragEvent, targetStatus: DossierStatus): void {
    event.preventDefault();
    const col = event.currentTarget as HTMLElement;
    col.classList.remove('drag-over');

    if (!this.draggedDossier || this.draggedDossier.status === targetStatus) {
      this.draggedDossier = null;
      return;
    }

    const dossier = this.draggedDossier;
    this.draggedDossier = null;

    // Confirmation avant changement de statut
    const confirmChange = window.confirm(
      this.translate.instant('SCHOLARSHIP.CONFIRM_STATUS_CHANGE', {
        prenom: dossier.prenom,
        nom: dossier.nom,
        oldStatus: dossier.status_display,
        newStatus: this.getColumnLabel(targetStatus)
      })
    );

    if (confirmChange) {
      this.updateDossierStatus(dossier.id, targetStatus);
    }
  }

  // ── Mise à jour du statut ─────────────────────────────────────

  private updateDossierStatus(dossierId: number, newStatus: DossierStatus): void {
    const payload = { status: newStatus };

    this.dossierService.updateStatus(dossierId, payload).subscribe({
      next: (updatedDossier) => {
        // Mettre à jour le signal
        this.dossiers.update(dossiers =>
          dossiers.map(d => d.id === updatedDossier.id ? updatedDossier : d)
        );
        this.showNotification(this.translate.instant('SCHOLARSHIP.STATUS_UPDATED'), 'success');
      },
      error: (err) => {
        console.error('Erreur mise à jour statut:', err);
        this.showNotification(this.translate.instant('SCHOLARSHIP.STATUS_UPDATE_ERROR'), 'error');
      }
    });
  }

  // ── Helpers ──────────────────────────────────────────────────

  private getColumnLabel(statusId: DossierStatus): string {
    return this.columns.find(c => c.id === statusId)?.label || statusId;
  }

  // ── Système de notification personnalisé ─────────────────────

  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const id = Date.now();
    const notification: Notification = {
      id,
      message,
      type,
      show: true,
    };

    // Ajouter la notification
    this.notifications.update(notifs => [...notifs, notification]);

    // Auto-dismiss après 5 secondes
    setTimeout(() => {
      this.dismissNotification(id);
    }, 5000);
  }

  dismissNotification(id: number): void {
    this.notifications.update(notifs =>
      notifs.map(n => n.id === id ? { ...n, show: false } : n)
    );

    // Retirer complètement après l'animation
    setTimeout(() => {
      this.notifications.update(notifs => notifs.filter(n => n.id !== id));
    }, 300);
  }

  // ── Filtres ───────────────────────────────────────────────────

  openFilterModal(): void {
    // Pré-remplir le formulaire avec les filtres actuels
    this.filterForm.patchValue(this.currentFilters);
    this.showFilterModal = true;
  }

  closeFilterModal(): void {
    this.showFilterModal = false;
  }

  applyFilters(): void {
    // Sauvegarder les filtres actuels
    this.currentFilters = this.filterForm.value;
    this.loadDossiers();
    this.closeFilterModal();
    this.showNotification(this.translate.instant('SCHOLARSHIP.FILTERS_APPLIED'), 'success');
  }

  resetFilters(): void {
    this.filterForm.reset({
      status: '',
      type_dossier: '',
      search: '',
    });
    this.currentFilters = {};
    this.loadDossiers();
    this.showNotification(this.translate.instant('SCHOLARSHIP.FILTERS_RESET'), 'info');
  }

  // ── Utilitaires ───────────────────────────────────────────────

  getInitials(dossier: DossierAdmin): string {
    return `${dossier.prenom.charAt(0)}${dossier.nom.charAt(0)}`.toUpperCase();
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  // ── Form builder ──────────────────────────────────────────────

  private _buildFilterForm(): void {
    this.filterForm = this.fb.group({
      status: [''],
      type_dossier: [''],
      search: [''],
    });
  }
}