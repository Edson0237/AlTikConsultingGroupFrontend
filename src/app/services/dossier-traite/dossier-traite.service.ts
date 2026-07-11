import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

// ── Interfaces ────────────────────────────────────────────────────────────────

export type StatutDossierTraite = 'en_attente' | 'valide' | 'transfere' | 'rejete';

export interface PieceJointe {
  id: number;
  ordre: number;
  libelle: string;
  nom_fichier: string;
  taille_fichier: number;
  type_mime: string | null;
  url_fichier: string | null;
  is_pdf: boolean;
  date_upload: string;
}

export interface DossierTraite {
  id: number;
  dossier_candidat: number;
  candidat_nom: string;
  candidat_type: string;
  conseiller: number | null;
  conseiller_nom: string | null;
  titre: string;
  description: string;
  statut: StatutDossierTraite;
  statut_display: string;
  etablissement_cible: string;
  notes_admin: string;
  nombre_pieces: number;
  pieces_jointes: PieceJointe[];
  date_creation: string;
  date_modification: string;
  date_transfert: string | null;
}

export interface DossierTraiteCreate {
  dossier_candidat: number;
  titre: string;
  description?: string;
  etablissement_cible?: string;
}

export interface DossierTraiteUpdate {
  statut?: StatutDossierTraite;
  notes_admin?: string;
  etablissement_cible?: string;
  date_transfert?: string | null;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class DossierTraiteService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly BASE = `${environment.apiUrl}dossiers/traites/`;

  private get headers() {
    const token = this.authService.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    };
  }

  private get jsonHeaders() {
    return { ...this.headers, 'Content-Type': 'application/json' };
  }

  /** GET /api/dossiers/traites/ */
  getAll(statut?: StatutDossierTraite): Observable<{ success: boolean; count: number; results: DossierTraite[] }> {
    let params = new HttpParams();
    if (statut) params = params.set('statut', statut);

    return this.http.get<any>(this.BASE, { headers: this.headers, params }).pipe(
      map(res => ({ success: true, count: res.count ?? 0, results: res.results ?? [] })),
      catchError(err => {
        console.error('[DossierTraiteService] getAll:', err);
        return of({ success: false, count: 0, results: [] });
      })
    );
  }

  /** GET /api/dossiers/traites/{id}/ */
  getById(id: number): Observable<DossierTraite | null> {
    return this.http.get<any>(`${this.BASE}${id}/`, { headers: this.headers }).pipe(
      map(res => res.dossier_traite ?? null),
      catchError(err => {
        console.error('[DossierTraiteService] getById:', err);
        return of(null);
      })
    );
  }

  /** POST /api/dossiers/traites/ */
  create(data: DossierTraiteCreate): Observable<{ success: boolean; dossier_traite?: DossierTraite; message?: string }> {
    return this.http.post<any>(this.BASE, data, { headers: this.jsonHeaders }).pipe(
      map(res => ({ success: true, dossier_traite: res.dossier_traite, message: res.message })),
      catchError(err => {
        console.error('[DossierTraiteService] create:', err);
        return of({ success: false, message: err?.error?.message || 'Erreur de création.' });
      })
    );
  }

  /** PATCH /api/dossiers/traites/{id}/ — admin update statut/notes */
  update(id: number, data: DossierTraiteUpdate): Observable<{ success: boolean; dossier_traite?: DossierTraite }> {
    return this.http.patch<any>(`${this.BASE}${id}/`, data, { headers: this.jsonHeaders }).pipe(
      map(res => ({ success: true, dossier_traite: res.dossier_traite })),
      catchError(err => {
        console.error('[DossierTraiteService] update:', err);
        return of({ success: false });
      })
    );
  }

  /** DELETE /api/dossiers/traites/{id}/ */
  delete(id: number): Observable<boolean> {
    return this.http.delete<any>(`${this.BASE}${id}/`, { headers: this.headers }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  /** POST /api/dossiers/traites/{id}/pieces/ */
  uploadPiece(dossierTraiteId: number, file: File, libelle: string): Observable<{ success: boolean; piece?: PieceJointe }> {
    const formData = new FormData();
    formData.append('fichier', file, file.name);
    formData.append('libelle', libelle);

    const token = this.authService.getToken();
    return this.http.post<any>(
      `${this.BASE}${dossierTraiteId}/pieces/`,
      formData,
      { headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/json' } }
    ).pipe(
      map(res => ({ success: true, piece: res.piece })),
      catchError(err => {
        console.error('[DossierTraiteService] uploadPiece:', err);
        return of({ success: false });
      })
    );
  }

  /** DELETE /api/dossiers/traites/{id}/pieces/{pid}/ */
  deletePiece(dossierTraiteId: number, pieceId: number): Observable<boolean> {
    const token = this.authService.getToken();
    return this.http.delete<any>(
      `${this.BASE}${dossierTraiteId}/pieces/${pieceId}/`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    ).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  /** Labels lisibles pour les statuts */
  getStatutLabel(statut: string): string {
    const labels: Record<string, string> = {
      en_attente: 'En attente',
      valide: 'Validé',
      transfere: 'Transféré',
      rejete: 'Rejeté',
    };
    return labels[statut] || statut;
  }

  getStatutBadgeClass(statut: string): string {
    const classes: Record<string, string> = {
      en_attente: 'badge--warning',
      valide: 'badge--success',
      transfere: 'badge--info',
      rejete: 'badge--danger',
    };
    return classes[statut] || 'badge--default';
  }
}
