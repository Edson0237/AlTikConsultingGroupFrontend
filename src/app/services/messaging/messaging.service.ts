import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ConversationStaff {
  id: number;
  subject: string;
  is_archived: boolean;
  other_user_id: number;
  other_user_name: string;
  other_user_email: string;
  other_user_avatar: string | null;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  conversation: number;
  sender: number;
  sender_name: string;
  sender_role: 'staff' | 'client';
  sender_avatar: string | null;
  content: string;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface ConversationDetail {
  id: number;
  subject: string;
  is_archived: boolean;
  user: number;
  user_name: string;
  user_email: string;
  user_avatar: string | null;
  staff: number;
  staff_name: string;
  staff_email: string;
  staff_avatar: string | null;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export interface UserForConversation {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: string;
  avatar_url: string | null;
}

@Injectable({ providedIn: 'root' })
export class MessagingService {
  private http = inject(HttpClient);
  private readonly BASE_URL = environment.apiUrl + 'notifications/';

  private getHeaders() {
    const token = localStorage.getItem('access_token');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    };
  }

  getConversations(search?: string, archived?: boolean): Observable<{
    success: boolean;
    count: number;
    total_unread: number;
    results: ConversationStaff[];
  }> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);
    if (archived !== undefined) params = params.set('archived', archived.toString());

    return this.http.get<any>(
      `${this.BASE_URL}staff/conversations/`,
      { ...this.getHeaders(), params }
    );
  }

  getConversationDetail(conversationId: number): Observable<{
    success: boolean;
    conversation: ConversationDetail;
  }> {
    return this.http.get<any>(
      `${this.BASE_URL}conversations/${conversationId}/`,
      this.getHeaders()
    );
  }

  sendMessage(conversationId: number, content: string): Observable<{
    success: boolean;
    message: Message;
  }> {
    return this.http.post<any>(
      `${this.BASE_URL}conversations/${conversationId}/messages/`,
      { content },
      this.getHeaders()
    );
  }

  startConversation(userId: number, subject: string, initialMessage: string): Observable<{
    success: boolean;
    message: string;
    conversation: ConversationDetail;
    created: boolean;
  }> {
    return this.http.post<any>(
      `${this.BASE_URL}staff/start-conversation/`,
      { user_id: userId, subject, initial_message: initialMessage },
      this.getHeaders()
    );
  }

  getUsersForConversation(search?: string): Observable<{
    success: boolean;
    count: number;
    results: UserForConversation[];
  }> {
    let params = new HttpParams();
    if (search) params = params.set('search', search);

    return this.http.get<any>(
      `${this.BASE_URL}staff/users/`,
      { ...this.getHeaders(), params }
    );
  }

  archiveConversation(conversationId: number, isArchived: boolean): Observable<{
    success: boolean;
    message: string;
    is_archived: boolean;
  }> {
    return this.http.patch<any>(
      `${this.BASE_URL}conversations/${conversationId}/archive/`,
      { is_archived: isArchived },
      this.getHeaders()
    );
  }
}