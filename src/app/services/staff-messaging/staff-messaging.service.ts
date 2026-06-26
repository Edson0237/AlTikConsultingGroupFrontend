import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, startWith, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface StaffConversation {
  id: number;
  subject: string;
  is_archived: boolean;
  other_user_id: number;
  other_user_name: string;
  other_user_email: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

@Injectable({ providedIn: 'root' })
export class StaffMessagingService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private readonly BASE_URL = environment.apiUrl + 'notifications/';

  // ✅ Signal pour le compteur total de messages non lus
  unreadCount = signal<number>(0);

  // ✅ Signal pour la liste des conversations (optionnel, utile pour d'autres composants)
  conversations = signal<StaffConversation[]>([]);

  private refreshIntervalMs = 30000; // 30 secondes

  constructor() {
    // Démarrer le polling automatique
    this.startPolling();
  }

  /**
   * Démarre le polling automatique pour rafraîchir le compteur
   */
  private startPolling(): void {
    interval(this.refreshIntervalMs)
      .pipe(startWith(0))
      .pipe(
        switchMap(() => this.fetchUnreadCount())
      )
      .subscribe();
  }

  /**
   * Récupère le compteur de messages non lus
   */
  private fetchUnreadCount(): Observable<any> {
    return new Observable(observer => {
      const token = this.authService.getToken();
      if (!token) {
        observer.complete();
        return;
      }

      this.http.get<any>(
        `${this.BASE_URL}staff/conversations/`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      ).subscribe({
        next: (res) => {
          const totalUnread = res.total_unread || 0;
          this.unreadCount.set(totalUnread);
          this.conversations.set(res.results || []);
          observer.complete();
        },
        error: (err) => {
          console.error('[StaffMessaging] Erreur fetch:', err);
          observer.complete();
        }
      });
    });
  }

  /**
   * Force un rafraîchissement immédiat du compteur
   */
  refresh(): void {
    this.fetchUnreadCount().subscribe();
  }
}