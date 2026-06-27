import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

// ── Interfaces ────────────────────────────────────────────────────────────────

export type DossierStatus = 'brouillon' | 'en_cours' | 'complete' | 'valide' | 'rejete';
export type TypeDossier = 'bourse_chine' | 'bourse_allemagne' | 'bourse_canada' | 'visa_affaires';

export interface DocumentDossier {
  id: number;
  type_document: string;
  type_document_display: string;
  nom_fichier: string;
  url_fichier: string;
  taille_fichier: number;
  type_mime: string;
  statut_verification: string;
  statut_verification_display: string;
  commentaire_verification: string | null;
  date_upload: string;
  date_modification: string;

  is_pdf: boolean;
  is_image: boolean;
  preview_url: string;
  download_url: string;
}

export interface DossierAdmin {
  id: number;
  utilisateur: number;
  utilisateur_email: string;
  utilisateur_nom: string;
  type_dossier: TypeDossier;
  type_dossier_display: string;
  status: DossierStatus;
  status_display: string;
  prenom: string;
  nom: string;
  date_naissance: string | null;
  nationalite: string | null;
  email: string;
  telephone: string | null;
  adresse: string | null;
  niveau_etudes: string | null;
  domaine_etudes: string | null;
  moyenne_generale: number | null;
  etablissement_actuel: string | null;
  entreprise: string | null;
  poste: string | null;
  secteur_activite: string | null;
  numero_passeport: string | null;
  date_expiration_passeport: string | null;
  notes_internes: string | null;
  conseiller_assigne: number | null;
  conseiller_nom: string | null;
  date_creation: string;
  date_modification: string;
  nombre_documents: number;
  est_bourse: boolean;
  documents: DocumentDossier[];
}

export interface DossierList {
  id: number;
  type_dossier: TypeDossier;
  type_dossier_display: string;
  status: DossierStatus;
  status_display: string;
  prenom: string;
  nom: string;
  email: string;
  nombre_documents: number;
  date_creation: string;
  date_modification: string;
}

export interface DossierFilters {
  status?: DossierStatus | '';
  type_dossier?: TypeDossier | '';
  utilisateur_id?: number;
  search?: string;
}

export interface StatusUpdatePayload {
  status: DossierStatus;
  notes_internes?: string;
  conseiller_assigne?: number | null;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class DossierService {
  private http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}dossiers/`;

  /**
   * GET /api/dossiers/admin/
   * Liste tous les dossiers (admin/conseiller)
   */
  getAllDossiers(filters: DossierFilters = {}): Observable<DossierAdmin[]> {
    let params = new HttpParams();

    if (filters.status) {
      params = params.set('status', filters.status);
    }
    if (filters.type_dossier) {
      params = params.set('type_dossier', filters.type_dossier);
    }
    if (filters.utilisateur_id) {
      params = params.set('utilisateur_id', String(filters.utilisateur_id));
    }
    if (filters.search) {
      params = params.set('search', filters.search);
    }

    return this.http.get<DossierAdmin[]>(`${this.BASE}admin/`, { params });
  }

  /**
   * GET /api/dossiers/admin/{id}/
   * Détail complet d'un dossier
   */
  getDossierById(id: number): Observable<DossierAdmin> {
    return this.http.get<DossierAdmin>(`${this.BASE}admin/${id}/`);
  }

  /**
   * PATCH /api/dossiers/admin/{id}/status/
   * Changer le statut d'un dossier
   */
  updateStatus(id: number, payload: StatusUpdatePayload): Observable<DossierAdmin> {
    return this.http.patch<DossierAdmin>(`${this.BASE}admin/${id}/status/`, payload);
  }

  /**
   * PATCH /api/dossiers/admin/{id}/documents/{doc_id}/verify/
   * Vérifier un document
   */
  verifyDocument(
    dossierId: number,
    docId: number,
    payload: { statut_verification: string; commentaire_verification?: string }
  ): Observable<DocumentDossier> {
    return this.http.patch<DocumentDossier>(
      `${this.BASE}admin/${dossierId}/documents/${docId}/verify/`,
      payload
    );
  }
}