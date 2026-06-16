import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface LoginResponse {
  access:  string;
  refresh: string;
  user:    ApiUser;
}

/** Utilisateur retourné par l'API Django */
export interface ApiUser {
  id:            number;
  username:      string;
  email:         string;
  first_name:    string;
  last_name:     string;
  role:          'admin' | 'conseiller' | 'responsable' | 'etudiant';
  telephone:     string | null;
  adresse:       string | null;
  actif:         boolean;
  is_active:     boolean;
  date_creation: string;
}

/** Représentation locale dans les signals Angular */
export interface UserInfo {
  id:        number;
  email:     string;
  username:  string;
  firstName: string;
  lastName:  string;
  role:      'admin' | 'conseiller' | 'responsable' | 'etudiant';
  telephone: string | null;
  adresse:   string | null;
}

/** Payload PATCH /api/auth/me/ */
export interface UpdateProfilePayload {
  first_name?: string;
  last_name?:  string;
  email?:      string;
  username?:   string;
  telephone?:  string;
  adresse?:    string;
}

interface JwtPayload {
  user_id:    number;
  email:      string;
  first_name: string;
  last_name:  string;
  role:       'admin' | 'conseiller' | 'responsable' | 'etudiant';
  is_staff:   boolean;
  exp:        number;
}

// Payload envoyé à POST /api/auth/conseillers/create/
export interface CreateConseillerPayload {
  username:    string;
  email:       string;
  password:    string;
  password2:   string;
  role:        'conseiller' | 'responsable';
  first_name?: string;
  last_name?:  string;
  telephone?:  string;
  adresse?:    string;
}

export interface CreateConseillerResponse {
  id:         number;
  username:   string;
  email:      string;
  first_name: string;
  last_name:  string;
  role:       string;
  telephone:  string;
  adresse:    string;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  // ── Signals ───────────────────────────────────────────────────
  isAuthenticated = signal<boolean>(!!this.getToken());
  currentUser     = signal<UserInfo | null>(this._loadUserFromToken());

  // ── Computed ──────────────────────────────────────────────────
  isAdmin = computed(() => this.currentUser()?.role === 'admin');

  userFullName = computed(() => {
    const u = this.currentUser();
    if (!u) return '';
    return `${u.firstName} ${u.lastName}`.trim();
  });

  // ── Token management ──────────────────────────────────────────
  saveTokens(access: string, refresh: string): void {
    localStorage.setItem('access_token',  access);
    localStorage.setItem('refresh_token', refresh);
    this.isAuthenticated.set(true);
    this.currentUser.set(this._decodeUser(access));
  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refresh_token');
  }

  private get authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.getToken()}` });
  }

  // ── Auth requests ─────────────────────────────────────────────

  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.API_URL}auth/login/`, credentials)
      .pipe(
        tap(res => {
          if (res?.access) {
            this.saveTokens(res.access, res.refresh);
            // Enrichir le signal avec les données complètes de l'API (telephone, adresse…)
            if (res.user) this._applyApiUser(res.user, res.access);
          }
        })
      );
  }

  refreshToken(): Observable<{ access: string }> {
    return this.http
      .post<{ access: string }>(`${this.API_URL}auth/token/refresh/`, { refresh: this.getRefreshToken() })
      .pipe(
        tap(res => {
          if (res?.access) {
            localStorage.setItem('access_token', res.access);
            this.currentUser.set(this._decodeUser(res.access));
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    this.isAuthenticated.set(false);
    this.currentUser.set(null);
  }

  // ── Profil utilisateur connecté ───────────────────────────────

  /**
   * GET /api/auth/me/
   * Récupère les données complètes du profil (telephone, adresse…)
   * et met à jour le signal currentUser.
   */
  fetchProfile(): Observable<ApiUser> {
    return this.http
      .get<ApiUser>(`${this.API_URL}auth/me/`, { headers: this.authHeaders })
      .pipe(
        tap(apiUser => this._applyApiUser(apiUser))
      );
  }

  /**
   * PATCH /api/auth/me/
   * Met à jour le profil de l'utilisateur connecté.
   * Retourne { success, message, user } côté Django.
   */
  updateProfile(payload: UpdateProfilePayload): Observable<{ success: boolean; message: string; user: ApiUser }> {
    return this.http
      .patch<{ success: boolean; message: string; user: ApiUser }>(
        `${this.API_URL}auth/me/`,
        payload,
        { headers: this.authHeaders }
      )
      .pipe(
        tap(res => {
          if (res?.user) {
            // Mettre à jour le signal avec les nouvelles données
            this._applyApiUser(res.user);
            // Mettre à jour le localStorage pour que les initiales soient correctes
            const token = this.getToken();
            if (token) {
              // On recrée le UserInfo depuis les données API (plus complètes que le JWT)
              this._applyApiUser(res.user);
            }
          }
        })
      );
  }

  // ── Admin : créer conseiller ──────────────────────────────────

  createConseiller(payload: CreateConseillerPayload): Observable<CreateConseillerResponse> {
    return this.http.post<CreateConseillerResponse>(
      `${this.API_URL}auth/conseillers/create/`,
      payload,
      { headers: this.authHeaders }
    );
  }

  fetchUserProfile(): Observable<ApiUser> {
    return this.fetchProfile();
  }

  // ── Private helpers ───────────────────────────────────────────

  /**
   * Applique les données d'un ApiUser au signal currentUser.
   * Préserve les champs JWT (role) si non fournis par l'API.
   */
  private _applyApiUser(apiUser: ApiUser, token?: string): void {
    const fromJwt = token ? this._decodeUser(token) : this.currentUser();
    this.currentUser.set({
      id:        apiUser.id,
      email:     apiUser.email,
      username:  apiUser.username,
      firstName: apiUser.first_name  ?? fromJwt?.firstName ?? '',
      lastName:  apiUser.last_name   ?? fromJwt?.lastName  ?? '',
      role:      (apiUser.role as UserInfo['role']) ?? fromJwt?.role ?? 'etudiant',
      telephone: apiUser.telephone ?? null,
      adresse:   apiUser.adresse   ?? null,
    });
  }

  private _decodeUser(token: string): UserInfo | null {
    try {
      const p = jwtDecode<JwtPayload>(token);
      return {
        id:        p.user_id,
        email:     p.email,
        username:  '',          // pas dans le JWT — sera complété par fetchProfile
        firstName: p.first_name ?? '',
        lastName:  p.last_name  ?? '',
        role:      p.is_staff ? 'admin' : (p.role ?? 'etudiant'),
        telephone: null,        // pas dans le JWT — sera complété par fetchProfile
        adresse:   null,
      };
    } catch {
      return null;
    }
  }

  private _loadUserFromToken(): UserInfo | null {
    const token = this.getToken();
    return token ? this._decodeUser(token) : null;
  }
}