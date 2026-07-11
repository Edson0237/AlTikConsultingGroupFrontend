import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DossierTraiteService, DossierTraite, StatutDossierTraite } from '../../services/dossier-traite/dossier-traite.service';
import { DossierService, DossierAdmin } from '../../services/dossier/dossier.service';

@Component({
  selector: 'app-dossiers-traites',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dossiers-traites.component.html',
  styleUrls: ['./dossiers-traites.component.scss'],
})
export class DossiersTraitesComponent implements OnInit {
  private dtService   = inject(DossierTraiteService);
  private dossierSvc  = inject(DossierService);

  // ── State listes ───────────────────────────────────────────────
  dossiers      = signal<DossierTraite[]>([]);
  filteredList  = signal<DossierTraite[]>([]);
  loading       = signal(true);
  filterStatut  = signal<string>('');

  // ── Dossiers candidats éligibles (complet/validé) pour la sélection ──
  candidatsEligibles = signal<DossierAdmin[]>([]);

  // ── Modal création ─────────────────────────────────────────────
  showCreateModal  = signal(false);
  createLoading    = signal(false);
  createError      = signal('');
  createForm = {
    dossier_candidat: 0,
    titre: '',
    description: '',
    etablissement_cible: '',
  };

  // ── Modal détail / upload ──────────────────────────────────────
  showDetailModal   = signal(false);
  selectedDT        = signal<DossierTraite | null>(null);
  detailLoading     = signal(false);

  // Upload pièce jointe
  uploadLibelle     = '';
  uploadFile: File | null = null;
  uploadLoading     = signal(false);
  uploadError       = signal('');

  // ── Modal admin update statut ──────────────────────────────────
  showStatusModal   = signal(false);
  statusForm = { statut: '' as StatutDossierTraite, notes_admin: '', etablissement_cible: '' };
  statusLoading     = signal(false);

  // ── Statuts disponibles ────────────────────────────────────────
  readonly statuts: { value: StatutDossierTraite; label: string }[] = [
    { value: 'en_attente', label: 'En attente' },
    { value: 'valide',     label: 'Validé' },
    { value: 'transfere',  label: 'Transféré' },
    { value: 'rejete',     label: 'Rejeté' },
  ];

  ngOnInit(): void {
    this.loadDossiersTraites();
    this.loadCandidatsEligibles();
  }

  // ── Chargement ────────────────────────────────────────────────

  loadDossiersTraites(): void {
    this.loading.set(true);
    this.dtService.getAll().subscribe(res => {
      this.dossiers.set(res.results);
      this.applyFilter();
      this.loading.set(false);
    });
  }

  loadCandidatsEligibles(): void {
    this.dossierSvc.getAllDossiers({ status: 'complete' }).subscribe(list => {
      this.candidatsEligibles.set(list);
    });
    this.dossierSvc.getAllDossiers({ status: 'valide' }).subscribe(list => {
      this.candidatsEligibles.update(existing => [...existing, ...list]);
    });
  }

  applyFilter(): void {
    const statut = this.filterStatut();
    const all = this.dossiers();
    this.filteredList.set(statut ? all.filter(d => d.statut === statut) : all);
  }

  onFilterChange(statut: string): void {
    this.filterStatut.set(statut);
    this.applyFilter();
  }

  // ── Création ──────────────────────────────────────────────────

  openCreateModal(): void {
    this.createForm = { dossier_candidat: 0, titre: '', description: '', etablissement_cible: '' };
    this.createError.set('');
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void { this.showCreateModal.set(false); }

  submitCreate(): void {
    if (!this.createForm.dossier_candidat || !this.createForm.titre.trim()) {
      this.createError.set('Veuillez sélectionner un dossier et saisir un titre.');
      return;
    }
    this.createLoading.set(true);
    this.createError.set('');
    this.dtService.create({
      dossier_candidat: this.createForm.dossier_candidat,
      titre: this.createForm.titre,
      description: this.createForm.description,
      etablissement_cible: this.createForm.etablissement_cible,
    }).subscribe(res => {
      this.createLoading.set(false);
      if (res.success && res.dossier_traite) {
        this.dossiers.update(list => [res.dossier_traite!, ...list]);
        this.applyFilter();
        this.closeCreateModal();
        this.openDetail(res.dossier_traite);
      } else {
        this.createError.set(res.message || 'Erreur lors de la création.');
      }
    });
  }

  // ── Détail / Upload ───────────────────────────────────────────

  openDetail(dt: DossierTraite): void {
    this.selectedDT.set(dt);
    this.uploadLibelle = '';
    this.uploadFile = null;
    this.uploadError.set('');
    this.showDetailModal.set(true);
  }

  closeDetailModal(): void { this.showDetailModal.set(false); }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.uploadFile = input.files?.[0] ?? null;
  }

  uploadPiece(): void {
    const dt = this.selectedDT();
    if (!dt || !this.uploadFile) {
      this.uploadError.set('Sélectionnez un fichier.');
      return;
    }
    if (!this.uploadLibelle.trim()) {
      this.uploadError.set('Saisissez un libellé pour ce document.');
      return;
    }
    this.uploadLoading.set(true);
    this.uploadError.set('');

    this.dtService.uploadPiece(dt.id, this.uploadFile, this.uploadLibelle).subscribe(res => {
      this.uploadLoading.set(false);
      if (res.success && res.piece) {
        const updated: DossierTraite = {
          ...dt,
          pieces_jointes: [...dt.pieces_jointes, res.piece],
          nombre_pieces: dt.nombre_pieces + 1,
        };
        this.selectedDT.set(updated);
        this.dossiers.update(list => list.map(d => d.id === updated.id ? updated : d));
        this.applyFilter();
        this.uploadLibelle = '';
        this.uploadFile = null;
      } else {
        this.uploadError.set('Erreur lors de l\'upload.');
      }
    });
  }

  deletePiece(pieceId: number): void {
    const dt = this.selectedDT();
    if (!dt) return;
    if (!confirm('Supprimer ce document ?')) return;

    this.dtService.deletePiece(dt.id, pieceId).subscribe(ok => {
      if (ok) {
        const updated: DossierTraite = {
          ...dt,
          pieces_jointes: dt.pieces_jointes.filter(p => p.id !== pieceId),
          nombre_pieces: Math.max(0, dt.nombre_pieces - 1),
        };
        this.selectedDT.set(updated);
        this.dossiers.update(list => list.map(d => d.id === updated.id ? updated : d));
        this.applyFilter();
      }
    });
  }

  // ── Mise à jour statut (admin) ────────────────────────────────

  openStatusModal(dt: DossierTraite): void {
    this.selectedDT.set(dt);
    this.statusForm = {
      statut: dt.statut,
      notes_admin: dt.notes_admin,
      etablissement_cible: dt.etablissement_cible,
    };
    this.showStatusModal.set(true);
  }

  closeStatusModal(): void { this.showStatusModal.set(false); }

  submitStatus(): void {
    const dt = this.selectedDT();
    if (!dt) return;
    this.statusLoading.set(true);
    this.dtService.update(dt.id, {
      statut: this.statusForm.statut,
      notes_admin: this.statusForm.notes_admin,
      etablissement_cible: this.statusForm.etablissement_cible,
    }).subscribe(res => {
      this.statusLoading.set(false);
      if (res.success && res.dossier_traite) {
        this.dossiers.update(list => list.map(d => d.id === res.dossier_traite!.id ? res.dossier_traite! : d));
        this.applyFilter();
        this.closeStatusModal();
      }
    });
  }

  // ── Suppression ───────────────────────────────────────────────

  deleteDT(dt: DossierTraite): void {
    if (!confirm(`Supprimer le dossier traité "${dt.titre}" ?`)) return;
    this.dtService.delete(dt.id).subscribe(ok => {
      if (ok) {
        this.dossiers.update(list => list.filter(d => d.id !== dt.id));
        this.applyFilter();
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────

  getBadgeClass(statut: string): string {
    return this.dtService.getStatutBadgeClass(statut);
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  }
}
