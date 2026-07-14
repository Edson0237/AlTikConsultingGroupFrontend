import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SystemLog {
  id: number;
  action: string;
  action_display: string;
  target_type: string;
  target_id: string;
  message: string;
  metadata: Record<string, any>;
  utilisateur: number | null;
  utilisateur_email: string | null;
  utilisateur_nom: string | null;
  date_creation: string;
}

export interface SystemLogResponse {
  success: boolean;
  count: number;
  logs: SystemLog[];
}

@Injectable({
  providedIn: 'root',
})
export class SystemLogService {
  private http = inject(HttpClient);
  private readonly BASE = `${environment.apiUrl.replace(/\/$/, '')}/dossiers/admin/`;

  getLogs(limit = 200): Observable<SystemLogResponse> {
    return this.http.get<SystemLogResponse>(`${this.BASE}logs/`, {
      params: { limit: limit.toString() },
    });
  }
}
