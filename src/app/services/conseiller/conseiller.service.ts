import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface Conseiller {
  id:            number;
  username:      string;
  email:         string;
  first_name:    string;
  last_name:     string;
  role:          'conseiller' | 'admin' | 'responsable';
  telephone:     string | null;
  adresse:       string | null;
  actif:         boolean;
  is_active:     boolean;
  date_creation: string;
}

export interface ConseillerUpdatePayload {
  first_name?:  string;
  last_name?:   string;
  email?:       string;
  telephone?:   string;
  adresse?:     string;
  role?:        'conseiller' | 'responsable' | 'admin';
}

interface PatchResponse {
  success: boolean;
  message: string;
  user:    Conseiller;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ConseillerService {
  private http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  /**
   * GET /api/auth/conseillers/
   * Retourne un tableau direct : [ { id, role, ... }, ... ]
   */
  getConseillers(): Observable<Conseiller[]> {
    return this.http.get<Conseiller[]>(`${this.API}auth/conseillers/`);
  }

  /**
   * PATCH /api/auth/conseillers/{id}/
   * Toggle is_active uniquement (payload : { is_active: boolean })
   */
  toggleActive(id: number, isActive: boolean): Observable<Conseiller> {
    return this.http
      .patch<PatchResponse>(
        `${this.API}auth/conseillers/${id}/`,
        { is_active: isActive }
      )
      .pipe(map(res => res.user));
  }

  /**
   * PATCH /api/auth/conseillers/{id}/
   * Mise à jour du profil (first_name, last_name, email, telephone, adresse, role)
   */
  updateConseiller(id: number, payload: ConseillerUpdatePayload): Observable<Conseiller> {
    return this.http
      .patch<PatchResponse>(
        `${this.API}auth/conseillers/${id}/`,
        payload
      )
      .pipe(map(res => res.user));
  }

  /**
   * DELETE /api/auth/conseillers/{id}/
   * Supprime définitivement le compte
   */
  deleteConseiller(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.API}auth/conseillers/${id}/`
    );
  }
}

