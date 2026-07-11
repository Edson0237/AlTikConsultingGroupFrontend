import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notification_type: 'info' | 'success' | 'warning' | 'error';
  category: string;
  is_read: boolean;
  created_at: string;
  sender_name: string;
  recipient_email: string;
}

export interface Conseiller {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

export interface NotificationUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationAdminService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly BASE_URL = environment.apiUrl + 'notifications/';

  private getHeaders() {
    const token = this.authService.getToken();
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    };
  }

  getNotifications(): Observable<{ success: boolean; count: number; unread_count: number; results: NotificationItem[] }> {
    return this.http.get<any>(this.BASE_URL, this.getHeaders());
  }

  markAsRead(id: number): Observable<any> {
    return this.http.patch(
      `${this.BASE_URL}${id}/`,
      { is_read: true },
      this.getHeaders()
    );
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch(
      `${this.BASE_URL}mark-all-read/`,
      {},
      this.getHeaders()
    );
  }

  getConseillers(): Observable<{ success: boolean; count: number; results: Conseiller[] }> {
    return this.http.get<any>(`${this.BASE_URL}conseillers/`, this.getHeaders());
  }

  getUsers(): Observable<{ success: boolean; count: number; results: NotificationUser[] }> {
    return this.http.get<any>(`${this.BASE_URL}staff/users/`, this.getHeaders());
  }

  sendNotification(payload: { recipient_ids: number[]; title: string; message: string; notification_type: string }): Observable<any> {
    return this.http.post(this.BASE_URL, payload, this.getHeaders());
  }
}