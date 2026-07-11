import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { DossierAdmin, DocumentDossier } from './dossier.service';

export interface Conseiller {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

export interface NoteInterne {
  id?: number;
  contenu: string;
  auteur: string;
  date_creation: string;
}

@Injectable({ providedIn: 'root' })
export class DossierDetailService {
  private http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}dossiers/`;

  /**
   * GET /api/dossiers/admin/{id}/
   * Détail complet d'un dossier
   */
  getDossierDetail(id: number): Observable<DossierAdmin> {
    return this.http.get<DossierAdmin>(`${this.BASE}admin/${id}/`);
  }

  /**
   * PATCH /api/dossiers/admin/{id}/status/
   * Changer le statut + notes internes + conseiller assigné
   */
  updateDossierStatus(
    id: number,
    payload: {
      status?: string;
      notes_internes?: string;
      conseiller_assigne?: number | null;
    }
  ): Observable<DossierAdmin> {
    return this.http.patch<DossierAdmin>(`${this.BASE}admin/${id}/status/`, payload);
  }

  /**
   * PATCH /api/dossiers/admin/{id}/documents/{doc_id}/verify/
   * Vérifier un document
   */
  verifyDocument(
    dossierId: number,
    docId: number,
    payload: {
      statut_verification: string;
      commentaire_verification?: string;
    }
  ): Observable<DocumentDossier> {
    return this.http.patch<DocumentDossier>(
      `${this.BASE}admin/${dossierId}/documents/${docId}/verify/`,
      payload
    );
  }

  /**
   * GET /api/auth/conseillers/
   * Liste des conseillers pour l'assignation
   */
  getConseillers(): Observable<Conseiller[]> {
    return this.http.get<Conseiller[]>(`${environment.apiUrl}auth/conseillers/`);
  }

  /**
   * POST /api/dossiers/admin/{id}/lancer-analyse/
   * Lancer l'analyse IA des relevés du dossier
   */
  lancerAnalyse(id: number): Observable<{ success: boolean; message: string; analyse_en_cours: boolean }> {
    return this.http.post<{ success: boolean; message: string; analyse_en_cours: boolean }>(
      `${this.BASE}admin/${id}/lancer-analyse/`,
      {}
    );
  }
}