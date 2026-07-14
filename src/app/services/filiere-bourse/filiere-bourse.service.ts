import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../environments/environment';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface Filiere {
  id:                  number;
  nom:                 string;
  domaine:             string;
  domaine_display:     string;
  niveau:              string;
  niveau_display:      string;
  type_choix:          'obligatoire' | 'optionnel' | 'chinese_language';
  type_choix_display:  string;
  duree:               number;
  description:         string;
  debouches:           string;
}

export interface PeriodeBourse {
  id:                     number;
  bourse:                 number;
  annee:                  number;
  date_ouverture:         string;
  date_cloture:           string;
  date_annonce_resultats: string | null;
  places_cette_periode:   number | null;
  notes:                  string;
}

export interface DocumentRequis {
  id:             number;
  bourse:         number;
  type_document:  string;
  nom_document:   string;
  obligatoire:    boolean;
  description:    string;
  format_accepte: string;
}

export interface Bourse {
  id:                     number;
  etablissement_filiere:  number;
  nom:                    string;
  type_bourse:            string;
  type_bourse_display:    string;
  description:            string;
  montant:                string | null;
  pourcentage_couverture: number | null;
  devise:                 string;
  nombre_bourses:         number;
  statut:                 string;
  statut_display:         string;
  conditions_eligibilite: string;
  niveau_requis:          string;
  nationalite_eligible:   string;
  periodes:               PeriodeBourse[];
  documents_requis:       DocumentRequis[];
}

export interface EtablissementFiliere {
  id:                 number;
  etablissement:      number;
  filiere:            number;
  filiere_detail:     Filiere;
  score_minimal:      number | null;
  frais_scolarite:    string | null;
  devise:             string;
  langue:             string;
  places_disponibles: number | null;
  actif:              boolean;
  bourses:            Bourse[];
}

// ── Payloads ──────────────────────────────────────────────────────────────────

export interface FilierePayload {
  nom:          string;
  domaine:      string;
  niveau:       string;
  type_choix?:  'obligatoire' | 'optionnel' | 'chinese_language';
  duree:        number;
  description?: string;
  debouches?:   string;
}

export interface EtablissementFilierePayload {
  filiere:             number;
  score_minimal?:      number | null;
  frais_scolarite?:    number | null;
  devise?:             string;
  langue?:             string;
  places_disponibles?: number | null;
  actif?:              boolean;
}

export interface EtablissementFiliereUpdatePayload {
  score_minimal?:      number | null;
  frais_scolarite?:    number | null;
  devise?:             string;
  langue?:             string;
  places_disponibles?: number | null;
  actif?:              boolean;
}

export interface BoursePayload {
  etablissement_filiere:   number;
  nom:                     string;
  type_bourse:             string;
  description?:            string;
  montant?:                number | null;
  pourcentage_couverture?: number | null;
  devise?:                 string;
  nombre_bourses?:         number;
  statut?:                 string;
  conditions_eligibilite?: string;
  niveau_requis?:          string;
  nationalite_eligible?:   string;
}

export interface PeriodeBoursePayload {
  annee:                   number;
  date_ouverture:          string;
  date_cloture:            string;
  date_annonce_resultats?: string | null;
  places_cette_periode?:   number | null;
  notes?:                  string;
}

export interface DocumentRequisPayload {
  type_document:   string;
  nom_document:    string;
  obligatoire?:    boolean;
  description?:    string;
  format_accepte?: string;
}

export interface FiliereFilters {
  domaine?: string;
  niveau?:  string;
}

export interface BourseFilters {
  type?:          string;
  statut?:        string;
  etablissement?: number;
}

// ── Réponses backend ──────────────────────────────────────────────────────────

interface ListResponse<T> {
  success: boolean;
  count?:  number;
  results: T[];
}

interface DetailResponse<T> {
  success: boolean;
  data:    T;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class FiliereBourseService {
  private readonly http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl}etablissements/`;

  // ── Filières — référentiel global ─────────────────────────────

  getFilieres(filters: FiliereFilters = {}): Observable<Filiere[]> {
    let params = new HttpParams();
    if (filters.domaine) params = params.set('domaine', filters.domaine);
    if (filters.niveau)  params = params.set('niveau',  filters.niveau);
    return this.http
      .get<ListResponse<Filiere>>(`${this.BASE}filieres/`, { params })
      .pipe(map(res => res.results));
  }

  getFiliereById(id: number): Observable<Filiere> {
    return this.http
      .get<DetailResponse<Filiere>>(`${this.BASE}filieres/${id}/`)
      .pipe(map(res => res.data));
  }

  /** POST /api/etablissements/filieres/ — Crée une filière dans le référentiel global */
  createFiliere(payload: FilierePayload): Observable<Filiere> {
    return this.http
      .post<DetailResponse<Filiere>>(`${this.BASE}filieres/`, payload)
      .pipe(map(res => res.data));
  }

  updateFiliere(id: number, payload: Partial<FilierePayload>): Observable<Filiere> {
    return this.http
      .patch<DetailResponse<Filiere>>(`${this.BASE}filieres/${id}/`, payload)
      .pipe(map(res => res.data));
  }

  deleteFiliere(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}filieres/${id}/`);
  }

  // ── Filières — par établissement ──────────────────────────────

  getEtablissementFilieres(etabId: number): Observable<EtablissementFiliere[]> {
    return this.http
      .get<ListResponse<EtablissementFiliere>>(`${this.BASE}${etabId}/filieres/`)
      .pipe(map(res => res.results));
  }

  associerFiliere(etabId: number, payload: EtablissementFilierePayload): Observable<EtablissementFiliere> {
    return this.http
      .post<DetailResponse<EtablissementFiliere>>(`${this.BASE}${etabId}/filieres/`, payload)
      .pipe(map(res => res.data));
  }

  updateEtablissementFiliere(
    efId: number,
    payload: EtablissementFiliereUpdatePayload,
  ): Observable<EtablissementFiliere> {
    return this.http
      .patch<DetailResponse<EtablissementFiliere>>(
        `${this.BASE}filieres-etab/${efId}/`,
        payload,
      )
      .pipe(map(res => res.data));
  }

  deleteEtablissementFiliere(efId: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}filieres-etab/${efId}/`);
  }

  // ── Bourses ───────────────────────────────────────────────────

  getBourses(filters: BourseFilters = {}): Observable<Bourse[]> {
    let params = new HttpParams();
    if (filters.type)          params = params.set('type',          filters.type);
    if (filters.statut)        params = params.set('statut',        filters.statut);
    if (filters.etablissement) params = params.set('etablissement', String(filters.etablissement));
    return this.http
      .get<ListResponse<Bourse>>(`${this.BASE}bourses/`, { params })
      .pipe(map(res => res.results));
  }

  getBourseById(id: number): Observable<Bourse> {
    return this.http
      .get<DetailResponse<Bourse>>(`${this.BASE}bourses/${id}/`)
      .pipe(map(res => res.data));
  }

  createBourse(payload: BoursePayload): Observable<Bourse> {
    return this.http
      .post<DetailResponse<Bourse>>(`${this.BASE}bourses/`, payload)
      .pipe(map(res => res.data));
  }

  updateBourse(id: number, payload: Partial<BoursePayload>): Observable<Bourse> {
    return this.http
      .patch<DetailResponse<Bourse>>(`${this.BASE}bourses/${id}/`, payload)
      .pipe(map(res => res.data));
  }

  deleteBourse(id: number): Observable<void> {
    return this.http.delete<void>(`${this.BASE}bourses/${id}/`);
  }

  // ── Périodes de bourse ────────────────────────────────────────

  getPeriodes(bourseId: number): Observable<PeriodeBourse[]> {
    return this.http
      .get<ListResponse<PeriodeBourse>>(`${this.BASE}bourses/${bourseId}/periodes/`)
      .pipe(map(res => res.results));
  }

  createPeriode(bourseId: number, payload: PeriodeBoursePayload): Observable<PeriodeBourse> {
    return this.http
      .post<DetailResponse<PeriodeBourse>>(`${this.BASE}bourses/${bourseId}/periodes/`, payload)
      .pipe(map(res => res.data));
  }

  // ── Documents requis ──────────────────────────────────────────

  getDocuments(bourseId: number): Observable<DocumentRequis[]> {
    return this.http
      .get<ListResponse<DocumentRequis>>(`${this.BASE}bourses/${bourseId}/documents/`)
      .pipe(map(res => res.results));
  }

  createDocument(bourseId: number, payload: DocumentRequisPayload): Observable<DocumentRequis> {
    return this.http
      .post<DetailResponse<DocumentRequis>>(`${this.BASE}bourses/${bourseId}/documents/`, payload)
      .pipe(map(res => res.data));
  }
}