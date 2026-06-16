import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

// ── Interfaces ────────────────────────────────────────────────────────────────

export type EtablissementStatut = 'actif' | 'inactif' | 'suspendu';
export type EtablissementType =
  | 'universite' | 'grande_ecole' | 'institut' | 'ecole_superieure';

export interface Filiere {
  id: number;
  nom: string;
  domaine: string;
  domaine_display: string;
  niveau: string;
  niveau_display: string;
  duree: number;
  description: string;
  debouches: string;
}

export interface EtablissementFiliere {
  id: number;
  filiere: number;
  filiere_detail: Filiere;
  score_minimal: number | null;
  frais_scolarite: string | null;
  devise: string;
  langue: string;
  places_disponibles: number | null;
  actif: boolean;
  bourses: Bourse[];
}

export interface Bourse {
  id: number;
  nom: string;
  type_bourse: string;
  type_bourse_display: string;
  statut: string;
  statut_display: string;
  montant: string | null;
  pourcentage_couverture: number | null;
  nombre_bourses: number;
  nationalite_eligible: string;
  conditions_eligibilite: string;
}

/** Modèle léger — liste */
export interface EtablissementListItem {
  id: number;
  nom: string;
  type_etablissement: EtablissementType;
  type_display: string;
  pays: string;
  ville: string;
  logo: string | null;
  classement: number | null;
  classement_source: string;
  langue_enseignement: string;
  statut: EtablissementStatut;
  statut_display: string;
  site_web: string;
  nb_filieres: number;
  nb_bourses: number;
  date_creation: string;
}

/** Modèle complet — détail */
export interface EtablissementDetail extends EtablissementListItem {
  description: string;
  adresse: string;
  code_postal: string;
  email_contact: string;
  telephone: string;
  annee_fondation: number | null;
  partenaire_depuis: string | null;
  date_modification: string;
  filieres: EtablissementFiliere[];
}

/** Payload création / édition */
export interface EtablissementPayload {
  nom: string;
  type_etablissement?: EtablissementType;
  description?: string;
  pays: string;
  ville: string;
  adresse?: string;
  code_postal?: string;
  site_web?: string;
  email_contact?: string;
  telephone?: string;
  classement?: number | null;
  classement_source?: string;
  annee_fondation?: number | null;
  langue_enseignement?: string;
  statut?: EtablissementStatut;
  partenaire_depuis?: string | null;
}

/** Réponse paginée du backend */
interface ListResponse {
  success: boolean;
  count: number;
  results: EtablissementListItem[];
}

interface DetailResponse {
  success: boolean;
  data: EtablissementDetail;
}

interface WriteResponse {
  success: boolean;
  message: string;
  data: EtablissementDetail;
}

// ── Filtres ───────────────────────────────────────────────────────────────────
export interface EtablissementFilters {
  pays?: string;
  statut?: EtablissementStatut | '';
  search?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class EtablissementService {
  private http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}etablissements/`;

  /** GET /api/etablissements/ */
  getAll(filters: EtablissementFilters = {}): Observable<EtablissementListItem[]> {
    let params = new HttpParams();
    if (filters.pays) params = params.set('pays', filters.pays);
    if (filters.statut) params = params.set('statut', filters.statut);
    if (filters.search) params = params.set('search', filters.search);

    return this.http
      .get<ListResponse>(this.BASE, { params })
      .pipe(map(res => res.results));
  }

  /** GET /api/etablissements/{id}/ */
  getById(id: number): Observable<EtablissementDetail> {
    return this.http
      .get<DetailResponse>(`${this.BASE}${id}/`)
      .pipe(map(res => res.data));
  }

  /** POST /api/etablissements/ */
  create(payload: EtablissementPayload): Observable<EtablissementDetail> {
    return this.http
      .post<WriteResponse>(this.BASE, payload)
      .pipe(map(res => res.data));
  }

  /** PATCH /api/etablissements/{id}/ */
  update(id: number, payload: Partial<EtablissementPayload>): Observable<EtablissementDetail> {
    return this.http
      .patch<WriteResponse>(`${this.BASE}${id}/`, payload)
      .pipe(map(res => res.data));
  }

  /** DELETE /api/etablissements/{id}/ */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}${id}/`);
  }
}