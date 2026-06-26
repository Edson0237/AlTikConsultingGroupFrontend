import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

// ── Interfaces ────────────────────────────────────────────────────────────────

export interface Matiere {
  id: number;
  nom_matiere: string;
  note: number | null;
  note_sur: number;
  coefficient: number;
  mention: string | null;
  semestre: string | null;
  note_sur_20: number | null;
  score_pondere: number | null;
}

export interface RapportAnalyse {
  id: number;
  analyse: number;
  dossier: number;
  type_document: string;
  type_document_display: string;
  nom_fichier: string;
  // Infos étudiant
  nom_complet: string;
  matricule: string;
  etablissement: string;
  filiere: string;
  niveau_etudes: string;
  session: string;
  // Résultats
  moyenne_generale: number | null;
  moyenne_probatoire: number | null;
  moyenne_bac: number | null;
  score_combine: number | null;
  rang: number | null;
  total_matieres: number;
  matieres_validees: number;
  matieres_echouees: number;
  // Analyse qualitative
  niveau_performance: string;
  points_forts: string[];
  points_faibles: string[];
  recommandations: string[];
  distribution_notes: { [key: string]: number };
  // Méta
  score_confiance_extraction: number;
  date_generation: string;
  // Matières détaillées
  matieres: Matiere[];
}

export interface StatsRapports {
  total_analyses: number;
  analyses_reussies: number;
  score_moyen_ia: number;
  repartition_niveaux: { [key: string]: number };
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class RapportAnalyseService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly BASE_URL = environment.apiUrl;

  /**
   * GET /api/ai/rapports/
   * Liste tous les rapports (admin/conseiller) ou ceux de l'utilisateur.
   */
  getRapports(
    dossierId?: number,
    niveau?: string,
    limit: number = 50
  ): Observable<{ success: boolean; count: number; rapports: RapportAnalyse[] }> {
    const token = this.authService.getToken();
    if (!token) {
      return of({ success: false, count: 0, rapports: [] });
    }

    let params = new HttpParams();
    if (dossierId) params = params.set('dossier_id', dossierId.toString());
    if (niveau) params = params.set('niveau', niveau);

    return this.http.get<any>(
      `${this.BASE_URL}ai/rapports/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        },
        params
      }
    ).pipe(
      map(res => ({
        success: res.success ?? true,
        count: res.count ?? res.rapports?.length ?? 0,
        rapports: res.rapports || []
      })),
      catchError(err => {
        console.error('[RapportAnalyseService] Erreur:', err);
        return of({ success: false, count: 0, rapports: [] });
      })
    );
  }

  /**
   * GET /api/ai/rapports/{id}/
   * Détail d'un rapport spécifique.
   */
  getRapportDetail(rapportId: number): Observable<RapportAnalyse | null> {
    const token = this.authService.getToken();
    if (!token) return of(null);

    return this.http.get<any>(
      `${this.BASE_URL}ai/rapports/${rapportId}/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    ).pipe(
      map(res => res.success ? res.rapport : null),
      catchError(err => {
        console.error('[RapportAnalyseService] Erreur détail:', err);
        return of(null);
      })
    );
  }

  /**
   * GET /api/dossiers/{id}/rapports/
   * Liste les rapports d'un dossier spécifique.
   */
  getRapportsByDossier(dossierId: number): Observable<RapportAnalyse[]> {
    const token = this.authService.getToken();
    if (!token) return of([]);

    return this.http.get<any>(
      `${this.BASE_URL}dossiers/${dossierId}/rapports/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    ).pipe(
      map(res => res.success ? res.rapports : []),
      catchError(err => {
        console.error('[RapportAnalyseService] Erreur rapports dossier:', err);
        return of([]);
      })
    );
  }

  /**
   * POST /api/ai/analyses/{id}/generer-rapport/
   * Génère (ou régénère) un rapport.
   */
  genererRapport(analyseId: number): Observable<{ success: boolean; rapport?: RapportAnalyse }> {
    const token = this.authService.getToken();
    if (!token) return of({ success: false });

    return this.http.post<any>(
      `${this.BASE_URL}ai/analyses/${analyseId}/generer-rapport/`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      }
    ).pipe(
      map(res => ({
        success: res.success ?? false,
        rapport: res.rapport
      })),
      catchError(err => {
        console.error('[RapportAnalyseService] Erreur génération:', err);
        return of({ success: false });
      })
    );
  }

  /**
   * Calcule les statistiques globales sur les rapports.
   */
  getStatsRapports(rapports: RapportAnalyse[]): StatsRapports {
    const total = rapports.length;
    const analysesReussies = rapports.filter(r => r.moyenne_generale !== null).length;
    
    const moyennes = rapports
      .filter(r => r.score_combine !== null)
      .map(r => r.score_combine as number);
    
    const scoreMoyen = moyennes.length > 0
      ? moyennes.reduce((a, b) => a + b, 0) / moyennes.length
      : 0;

    // Répartition des niveaux
    const repartition: { [key: string]: number } = {
      'excellent': 0,
      'tres_bon': 0,
      'bon': 0,
      'moyen': 0,
      'faible': 0,
    };
    
    rapports.forEach(r => {
      if (r.niveau_performance && repartition.hasOwnProperty(r.niveau_performance)) {
        repartition[r.niveau_performance]++;
      }
    });

    return {
      total_analyses: total,
      analyses_reussies: analysesReussies,
      score_moyen_ia: Math.round(scoreMoyen * 100) / 100,
      repartition_niveaux: repartition
    };
  }
}