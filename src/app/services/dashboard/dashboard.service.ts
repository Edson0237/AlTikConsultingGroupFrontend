import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

export interface DashboardStats {
  success: boolean;
  data: {
    kpis: {
      total_users: number;
      active_users: number;
      new_users_this_month: number;
      etudiants_count: number;
      responsables_count: number;
      total_dossiers: number;
      new_dossiers_this_month: number;
      dossiers_par_statut: { [key: string]: number };
      dossiers_par_type: { [key: string]: number };
      total_documents: number;
      total_analyses: number;
      analyses_reussies: number;
      score_moyen_ia: number;
      total_conversations: number;
      total_messages: number;
      unread_notifications: number;
    };
    charts: {
      evolution_dossiers: Array<{ month: string; count: number }>;
      evolution_users: Array<{ month: string; count: number }>;
      evolution_documents: Array<{ month: string; count: number }>;
      repartition_dossiers: Array<{ type_dossier: string; count: number }>;
      top_filieres: Array<{ nom_filiere: string; count: number }>;
      documents_par_type: Array<{ type_document: string; count: number }>;
      analyses_par_statut: { [key: string]: number };
    };
    recent_activities: Array<{
      type: string;
      text: string;
      user: string;
      time: string;
      color: string;
    }>;
    generated_at: string;
  };
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly BASE_URL = environment.apiUrl;

  /**
   * Récupère les statistiques du dashboard depuis l'API.
   * Aucune donnée mockée n'est utilisée : si la requête échoue
   * (token absent, erreur réseau, erreur serveur...), l'erreur
   * remonte à l'appelant pour afficher un véritable état d'erreur.
   */
  getDashboardStats(): Observable<DashboardStats> {
    const token = this.authService.getToken();

    if (!token) {
      return throwError(() => new Error('Utilisateur non authentifié'));
    }

    return this.http.get<DashboardStats>(
      `${this.BASE_URL}stats/dashboard/`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      }
    );
  }
}