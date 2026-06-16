import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface AppUser {
  id:            number;
  username:      string;
  email:         string;
  first_name:    string;
  last_name:     string;
  role:          'etudiant' | 'responsable' | 'conseiller' | 'admin';
  telephone:     string | null;
  adresse:       string | null;
  actif:         boolean;
  is_active:     boolean;
  date_creation: string;
}

export interface UserFilters {
  role?:   string;
  statut?: 'actif' | 'inactif' | '';
  search?: string;
}

interface ListResponse {
  success: boolean;
  count:   number;
  results: AppUser[];
}

interface ActionResponse {
  success: boolean;
  message: string;
  user?:   AppUser;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private readonly API = environment.apiUrl;

  /**
   * GET /api/auth/users/
   * Liste uniquement les étudiants et responsables.
   * Si un rôle précis est demandé (etudiant ou responsable), on l'envoie tel quel.
   * Sinon on envoie roles=etudiant,responsable pour exclure conseillers et admins côté serveur.
   */
  getUsers(filters: UserFilters = {}): Observable<{ count: number; results: AppUser[] }> {
    let params = new HttpParams();

    if (filters.role) {
      // Rôle précis sélectionné dans le filtre (etudiant ou responsable)
      params = params.set('role', filters.role);
    } else {
      // Aucun rôle précis : restreindre aux deux rôles autorisés côté serveur
      params = params.set('roles', 'etudiant,responsable');
    }

    if (filters.statut) params = params.set('statut', filters.statut);
    if (filters.search) params = params.set('search', filters.search);

    return this.http
      .get<ListResponse>(`${this.API}auth/users/`, { params })
      .pipe(map(res => ({ count: res.count, results: res.results })));
  }

  /**
   * PATCH /api/auth/users/{id}/
   * Activer ou désactiver un compte — admins et conseillers.
   */
  toggleActive(id: number, isActive: boolean): Observable<AppUser> {
    return this.http
      .patch<ActionResponse>(`${this.API}auth/users/${id}/`, { is_active: isActive })
      .pipe(map(res => res.user!));
  }

  /**
   * DELETE /api/auth/users/{id}/
   * Supprimer un compte — admins uniquement.
   */
  deleteUser(id: number): Observable<ActionResponse> {
    return this.http.delete<ActionResponse>(`${this.API}auth/users/${id}/`);
  }
}