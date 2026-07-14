import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Location } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { DossierDetailService, Conseiller } from '../../services/dossier/dossier-detail.service';
import { DossierAdmin, DocumentDossier } from '../../services/dossier/dossier.service';

@Component({
  selector: 'app-dossier-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  templateUrl: './dossier-detail.component.html',
  styleUrls: ['./dossier-detail.component.scss'],
})
export class DossierDetailComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private dossierDetailService = inject(DossierDetailService);
  private translate = inject(TranslateService);

  // ── State ─────────────────────────────────────────────────────
  dossier = signal<DossierAdmin | null>(null);
  isLoading = signal<boolean>(true);
  error = signal<string>('');

  // ── Modals ────────────────────────────────────────────────────
  showStatusModal = signal<boolean>(false);
  showVerificationModal = signal<boolean>(false);
  selectedDocument = signal<DocumentDossier | null>(null);

  // ── Forms ─────────────────────────────────────────────────────
  newStatus = '';
  notesInternes = '';
  conseillerAssigne: number | null = null;
  conseillers = signal<Conseiller[]>([]);

  // Document verification
  documentStatut = '';
  documentCommentaire = '';

  // ── Notifications ─────────────────────────────────────────────
  notifications = signal<any[]>([]);

  // ── Analyse IA ────────────────────────────────────────────────
  analyseEnCours = signal<boolean>(false);
  analyseLoading = signal<boolean>(false);

  // ── Status options ────────────────────────────────────────────
  readonly statusOptions = [
    { value: 'en_attente_de_traitement', label: 'En attente de traitement', color: '#94A3B8' },
    { value: 'en_cours', label: 'En cours', color: '#3B82F6' },
    { value: 'complete', label: 'Complet', color: '#0EA5E9' },
    { value: 'valide', label: 'Validé', color: '#10B981' },
    { value: 'rejete', label: 'Rejeté', color: '#EF4444' },
  ];

  readonly documentStatutOptions = [
    { value: 'en_attente', label: 'En attente', color: '#F59E0B' },
    { value: 'verifie', label: 'Vérifié', color: '#10B981' },
    { value: 'rejete', label: 'Rejeté', color: '#EF4444' },
  ];

  // ── Lifecycle ─────────────────────────────────────────────────

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadDossier(+id);
      this.loadConseillers();
    }
  }

  // ── Data loading ──────────────────────────────────────────────

  refreshDossier(): void {
    const id = this.dossier()?.id;
    if (id) {
      this.loadDossier(id);
    }
  }

  loadDossier(id: number): void {
    this.isLoading.set(true);
    this.error.set('');

    this.dossierDetailService.getDossierDetail(id).subscribe({
      next: (dossier) => {
        console.log('Dossier chargé:', dossier);
        console.log('Documents:', dossier.documents);
        dossier.documents.forEach((doc, index) => {
          console.log(`Document ${index}:`, {
            id: doc.id,
            nom_fichier: doc.nom_fichier,
            url_fichier: doc.url_fichier,
            preview_url: doc.preview_url,
            download_url: doc.download_url,
            is_image: doc.is_image,
            is_pdf: doc.is_pdf
          });
        });
        this.dossier.set(dossier);
        this.newStatus = dossier.status;
        this.notesInternes = dossier.notes_internes || '';
        this.conseillerAssigne = dossier.conseiller_assigne;
        this.analyseEnCours.set(dossier.analyse_en_cours);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('Impossible de charger le dossier.');
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  loadConseillers(): void {
    this.dossierDetailService.getConseillers().subscribe({
      next: (conseillers) => {
        this.conseillers.set(conseillers);
      },
      error: (err) => {
        console.error('Erreur chargement conseillers:', err);
      }
    });
  }

  // ── Status update ─────────────────────────────────────────────

  openStatusModal(): void {
    if (!this.dossier()) return;
    this.newStatus = this.dossier()!.status;
    this.notesInternes = this.dossier()!.notes_internes || '';
    this.conseillerAssigne = this.dossier()!.conseiller_assigne;
    this.showStatusModal.set(true);
  }

  closeStatusModal(): void {
    this.showStatusModal.set(false);
  }

  updateStatus(): void {
    if (!this.dossier()) return;

    const payload: any = {};

    if (this.newStatus !== this.dossier()!.status) {
      payload.status = this.newStatus;
    }

    if (this.notesInternes !== (this.dossier()!.notes_internes || '')) {
      payload.notes_internes = this.notesInternes;
    }

    if (this.conseillerAssigne !== this.dossier()!.conseiller_assigne) {
      payload.conseiller_assigne = this.conseillerAssigne;
    }

    if (Object.keys(payload).length === 0) {
      this.showNotification(this.translate.instant('DOSSIER_DETAIL.NO_CHANGES'), 'info');
      this.closeStatusModal();
      return;
    }

    this.dossierDetailService.updateDossierStatus(this.dossier()!.id, payload).subscribe({
      next: (updated) => {
        this.dossier.set(updated);
        this.closeStatusModal();
        this.showNotification(this.translate.instant('DOSSIER_DETAIL.DOSSIER_UPDATED'), 'success');
      },
      error: (err) => {
        console.error(err);
        this.showNotification(this.translate.instant('DOSSIER_DETAIL.UPDATE_ERROR'), 'error');
      }
    });
  }

  // ── Analyse IA ────────────────────────────────────────────────

  lancerAnalyse(): void {
    if (!this.dossier() || this.analyseEnCours() || this.analyseLoading()) return;

    const releves = this.dossier()!.documents.filter(d =>
      d.type_document === 'releve_probatoire' || d.type_document === 'releve_bac'
    );
    if (releves.length === 0) {
      this.showNotification('Aucun relevé de notes à analyser.', 'error');
      return;
    }

    this.analyseLoading.set(true);
    this.dossierDetailService.lancerAnalyse(this.dossier()!.id).subscribe({
      next: (res) => {
        this.analyseEnCours.set(true);
        this.analyseLoading.set(false);
        this.showNotification(res.message || 'Analyse IA lancée.', 'success');
        this.router.navigate(['/rapports']);
      },
      error: (err) => {
        this.analyseLoading.set(false);
        const msg = err?.error?.detail || "Impossible de lancer l'analyse";
        this.showNotification(msg, 'error');
      }
    });
  }

  // ── Document handling ───────────────────────────────────────

  openDocument(doc: DocumentDossier): void {
    window.open(doc.preview_url, '_blank');
  }

  downloadDocument(): void {
    const doc = this.selectedDocument();
    if (!doc || !doc.download_url) return;

    window.open(doc.download_url, '_blank');
  }

  // ── Document verification ─────────────────────────────────────

  openVerificationModal(doc: DocumentDossier): void {
    this.selectedDocument.set(doc);
    this.documentStatut = doc.statut_verification;
    this.documentCommentaire = doc.commentaire_verification || '';
    this.showVerificationModal.set(true);
  }

  closeVerificationModal(): void {
    this.showVerificationModal.set(false);
    this.selectedDocument.set(null);
  }

  verifyDocument(): void {
    if (!this.dossier() || !this.selectedDocument()) return;

    const payload = {
      statut_verification: this.documentStatut,
      commentaire_verification: this.documentCommentaire || undefined,
    };

    this.dossierDetailService.verifyDocument(
      this.dossier()!.id,
      this.selectedDocument()!.id,
      payload
    ).subscribe({
      next: (updatedDoc) => {
        const dossier = this.dossier()!;
        const docs = dossier.documents.map(d =>
          d.id === updatedDoc.id ? updatedDoc : d
        );
        this.dossier.set({ ...dossier, documents: docs });

        this.closeVerificationModal();
        this.showNotification(this.translate.instant('DOSSIER_DETAIL.DOCUMENT_VERIFIED'), 'success');
      },
      error: (err) => {
        console.error(err);
        this.showNotification(this.translate.instant('DOSSIER_DETAIL.VERIFICATION_ERROR'), 'error');
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────

  getStatusColor(status: string): string {
    return this.statusOptions.find(s => s.value === status)?.color || '#94A3B8';
  }

  getStatusLabel(status: string): string {
    return this.statusOptions.find(s => s.value === status)?.label || status;
  }

  getDocumentStatutColor(statut: string): string {
    return this.documentStatutOptions.find(s => s.value === statut)?.color || '#F59E0B';
  }

  getDocumentStatutLabel(statut: string): string {
    return this.documentStatutOptions.find(s => s.value === statut)?.label || statut;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  getInitials(): string {
    const d = this.dossier();
    if (!d) return '';
    return `${d.prenom.charAt(0)}${d.nom.charAt(0)}`.toUpperCase();
  }

  goBack(): void {
    this.location.back();
  }

  // ── Notifications ─────────────────────────────────────────────

  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    const id = Date.now();
    const notification = { id, message, type, show: true };

    this.notifications.update(notifs => [...notifs, notification]);

    setTimeout(() => {
      this.dismissNotification(id);
    }, 5000);
  }

  dismissNotification(id: number): void {
    this.notifications.update(notifs =>
      notifs.map(n => n.id === id ? { ...n, show: false } : n)
    );

    setTimeout(() => {
      this.notifications.update(notifs => notifs.filter(n => n.id !== id));
    }, 300);
  }
}