import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { environment } from '../../environments/environment';

export interface WelcomeMessage {
  id: number;
  title: string;
  message: string;
  notification_type: 'info' | 'success' | 'warning' | 'error';
  is_active: boolean;
  updated_at: string;
}

export interface ServiceFee {
  id: number;
  title: string;
  amount: number;
  currency: string;
  formatted_amount: string;
  description: string;
  order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WelcomeMessageResponse {
  success: boolean;
  welcome_message: WelcomeMessage;
}

export interface ServiceFeesResponse {
  success: boolean;
  count: number;
  results: ServiceFee[];
}

@Injectable({
  providedIn: 'root'
})
export class NotificationSettingsService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private readonly BASE_URL = environment.apiUrl;

  private headers() {
    const token = this.authService.getToken();
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    };
  }

  getWelcomeMessage(): Observable<WelcomeMessageResponse> {
    return this.http.get<WelcomeMessageResponse>(
      `${this.BASE_URL}notifications/welcome-message/`,
      { headers: this.headers() }
    );
  }

  updateWelcomeMessage(payload: Partial<WelcomeMessage>): Observable<WelcomeMessageResponse> {
    return this.http.patch<WelcomeMessageResponse>(
      `${this.BASE_URL}notifications/welcome-message/`,
      payload,
      { headers: this.headers() }
    );
  }

  getServiceFees(): Observable<ServiceFeesResponse> {
    return this.http.get<ServiceFeesResponse>(
      `${this.BASE_URL}notifications/service-fees/`,
      { headers: this.headers() }
    );
  }

  createServiceFee(payload: Partial<ServiceFee>): Observable<{ success: boolean; fee: ServiceFee }> {
    return this.http.post<{ success: boolean; fee: ServiceFee }>(
      `${this.BASE_URL}notifications/service-fees/`,
      payload,
      { headers: this.headers() }
    );
  }

  updateServiceFee(id: number, payload: Partial<ServiceFee>): Observable<{ success: boolean; fee: ServiceFee }> {
    return this.http.patch<{ success: boolean; fee: ServiceFee }>(
      `${this.BASE_URL}notifications/service-fees/${id}/`,
      payload,
      { headers: this.headers() }
    );
  }

  deleteServiceFee(id: number): Observable<void> {
    return this.http.delete<void>(
      `${this.BASE_URL}notifications/service-fees/${id}/`,
      { headers: this.headers() }
    );
  }
}
