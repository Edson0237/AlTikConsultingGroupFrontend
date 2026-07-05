import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { DossierService, DossierAdmin, DossierStatus, DossierFilters } from '../../services/dossier/dossier.service';

export interface KanbanColumn {
  id: DossierStatus;
  label: string;
  color: string;
}

export interface VisaNotification {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  show: boolean;
}

const STATUS_OPTIONS: { value: DossierStatus | ''; label: string }[] = [
  { value: '',          label: 'Tous les statuts' },
  { value: 'brouillon', label: 'Brouillon' },
  { value: 'en_cours',  label: 'En cours' },
  { value: 'complete',  label: 'Complet' },
  { value: 'valide',    label: 'Validé' },
  { value: 'rejete',    label: 'Rejeté' },
];

@Component({
  selector: 'app-bussiness-visa',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './bussiness-visa.component.html',
  styleUrl: './bussiness-visa.component.scss'
})
export class BussinessVisaComponent implements OnInit {

  private dossierService = inject(DossierService);
  private fb             = inject(FormBuilder);
  private router         = inject(Router);
  private translate      = inject(TranslateService);

  searchQuery   = signal<string>('');
  isLoading     = signal<boolean>(true);
  dossiers      = signal<DossierAdmin[]>([]);
  notifications = signal<VisaNotification[]>([]);

  filterForm!: FormGroup;
  showFilterModal  = false;
  currentFilters: DossierFilters = { type_dossier: 'visa_affaires' };
  draggedDossier: DossierAdmin | null = null;

  readonly columns: KanbanColumn[] = [
    { id: 'brouillon', label: 'Brouillon', color: '#94A3B8' },
    { id: 'en_cours',  label: 'En cours',  color: '#6366F1' },
    { id: 'complete',  label: 'Complet',   color: '#0EA5E9' },
    { id: 'valide',    label: 'Validé',    color: '#10B981' },
    { id: 'rejete',    label: 'Rejeté',    color: '#EF4444' },
  ];

  readonly statusOptions = STATUS_OPTIONS;

  filteredDossiers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const all   = this.dossiers();
    if (!query) return all;
    return all.filter(d =>
      d.nom.toLowerCase().includes(query)     ||
      d.prenom.toLowerCase().includes(query)  ||
      d.email.toLowerCase().includes(query)   ||
      (d.entreprise || '').toLowerCase().includes(query)
    );
  });

  ngOnInit(): void {
    this._buildFilterForm();
    this.loadDossiers();
  }

  loadDossiers(): void {
    this.isLoading.set(true);
    this.currentFilters = { ...this.filterForm.value, type_dossier: 'visa_affaires' };

    this.dossierService.getAllDossiers(this.currentFilters).subscribe({
      next: (dossiers) => {
        this.dossiers.set(dossiers.filter(d => d.type_dossier === 'visa_affaires'));
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement dossiers visa:', err);
        this.isLoading.set(false);
        this.showNotification('Erreur lors du chargement des dossiers visa', 'error');
      }
    });
  }

  getColumnDossiers(columnId: DossierStatus): DossierAdmin[] {
    return this.filteredDossiers().filter(d => d.status === columnId);
  }

  openDossierDetail(dossier: DossierAdmin): void {
    this.router.navigate(['/dashboard-admin/admin/dossiers', dossier.id]);
  }

  onDragStart(event: DragEvent, dossier: DossierAdmin): void {
    this.draggedDossier = dossier;
    event.dataTransfer?.setData('text/plain', String(dossier.id));
    const el = event.target as HTMLElement;
    event.dataTransfer?.setDragImage(el, el.offsetWidth / 2, el.offsetHeight / 2);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.add('drag-over');
  }

  onDragLeave(event: DragEvent): void {
    (event.currentTarget as HTMLElement).classList.remove('drag-over');
  }

  onDrop(event: DragEvent, targetStatus: DossierStatus): void {
    event.preventDefault();
    (event.currentTarget as HTMLElement).classList.remove('drag-over');
    if (!this.draggedDossier || this.draggedDossier.status === targetStatus) {
      this.draggedDossier = null;
      return;
    }
    const dossier = this.draggedDossier;
    this.draggedDossier = null;
    const col = this.columns.find(c => c.id === targetStatus)?.label || targetStatus;
    if (window.confirm(`Changer le statut de ${dossier.prenom} ${dossier.nom} vers "${col}" ?`)) {
      this.dossierService.updateStatus(dossier.id, { status: targetStatus }).subscribe({
        next: (updated) => {
          this.dossiers.update(list => list.map(d => d.id === updated.id ? updated : d));
          this.showNotification('Statut mis à jour avec succès', 'success');
        },
        error: () => this.showNotification('Erreur lors de la mise à jour du statut', 'error'),
      });
    }
  }

  openFilterModal(): void {
    this.filterForm.patchValue(this.currentFilters);
    this.showFilterModal = true;
  }

  closeFilterModal(): void { this.showFilterModal = false; }

  applyFilters(): void {
    this.loadDossiers();
    this.closeFilterModal();
    this.showNotification('Filtres appliqués', 'success');
  }

  resetFilters(): void {
    this.filterForm.reset({ status: '' });
    this.currentFilters = { type_dossier: 'visa_affaires' };
    this.loadDossiers();
  }

  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const id = Date.now();
    this.notifications.update(n => [...n, { id, message, type, show: true }]);
    setTimeout(() => this.dismissNotification(id), 5000);
  }

  dismissNotification(id: number): void {
    this.notifications.update(n => n.map(x => x.id === id ? { ...x, show: false } : x));
    setTimeout(() => this.notifications.update(n => n.filter(x => x.id !== id)), 300);
  }

  getInitials(d: DossierAdmin): string {
    return `${d.prenom.charAt(0)}${d.nom.charAt(0)}`.toUpperCase();
  }

  formatDate(ds: string): string {
    if (!ds) return '';
    return new Date(ds).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private _buildFilterForm(): void {
    this.filterForm = this.fb.group({ status: [''] });
  }
}