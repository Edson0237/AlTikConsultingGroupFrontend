import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Observer, Subscription, interval, startWith, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class NotificationCounterService implements OnDestroy {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  private readonly BASE_URL = environment.apiUrl + 'notifications/';

  //Signal pour le compteur de notifications non lues
  unreadCount = signal<number>(0);

  private refreshIntervalMs = 30000;
  private subscription?: Subscription;

  constructor() {
    this.startPolling();
  }

  /**
   * Démarre le polling automatique pour rafraîchir le compteur
   */
  private startPolling(): void {
    this.subscription = interval(this.refreshIntervalMs)
      .pipe(
        startWith(0),
        switchMap(() => this.fetchUnreadCount())
      )
      .subscribe();
  }

  /**
   * Récupère le compteur de notifications non lues
   */
  private fetchUnreadCount(): Observable<void> {
    //Typage explicite de l'observer
    return new Observable<void>((observer: Observer<void>) => {
      const token = this.authService.getToken();
      if (!token) {
        observer.complete();
        return;
      }

      this.http.get<any>(
        `${this.BASE_URL}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      ).subscribe({
        next: (res) => {
          const totalUnread = res.unread_count ?? 0;
          this.unreadCount.set(totalUnread);
          observer.next();
          observer.complete();
        },
        error: (err) => {
          console.error('[NotificationCounter] Erreur fetch:', err);
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

  /**
   * Arrête le polling à la destruction du service
   */
  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}