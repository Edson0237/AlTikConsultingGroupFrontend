import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { NotificationAdminService, NotificationItem, Conseiller } from '../../services/notification-admin/notification-admin.service';
import { AuthService } from '../../services/auth/auth.service';
import { NotificationCounterService } from '../../services/notification/notification-counter.service';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss',
})
export class NotificationComponent implements OnInit {
  private notificationService = inject(NotificationAdminService);
  private authService = inject(AuthService);
  private notificationCounterService = inject(NotificationCounterService);
  private translate = inject(TranslateService);

  // ── State ───────────────────────────────────────────────────────
  notifications = signal<NotificationItem[]>([]);
  loading = signal(true);

  // ── Filtres ─────────────────────────────────────────────────────
  filterType: 'all' | NotificationType = 'all';
  showUnreadOnly = false;

  // ── Modal admin ─────────────────────────────────────────────────
  showModal = signal(false);
  conseillers = signal<Conseiller[]>([]);
  selectedConseillers = signal<number[]>([]);
  newNotifTitle = signal('');
  newNotifMessage = signal('');
  newNotifType = signal<NotificationType>('info');
  sending = signal(false);
  sendSuccess = signal(false);
  sendError = signal('');
  searchConseiller = signal('');

  // ── Permissions ─────────────────────────────────────────────────
  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  // ── Computed properties ─────────────────────────────────────────
  filteredNotifications = computed(() => {
    return this.notifications().filter(n => {
      if (this.showUnreadOnly && n.is_read) return false;
      if (this.filterType !== 'all' && n.notification_type !== this.filterType) return false;
      return true;
    });
  });

  unreadCount = computed(() => {
    return this.notifications().filter(n => !n.is_read).length;
  });

  // ── Lifecycle ───────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadNotifications();
  }

  // ── Chargement des notifications ────────────────────────────────
  loadNotifications(): void {
    this.loading.set(true);
    this.notificationService.getNotifications().subscribe({
      next: (res) => {
        this.notifications.set(res.results || []);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement notifications:', err);
        this.loading.set(false);
      }
    });
  }

  // ── Compteurs par type ──────────────────────────────────────────
  countByType(type: NotificationType): number {
    return this.notifications().filter(n => n.notification_type === type).length;
  }

  // ── Actions notifications ───────────────────────────────────────
  markAsRead(notification: NotificationItem): void {
    if (notification.is_read) return;

    this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.is_read = true;
      },
      error: (err) => {
        console.error('Erreur marquage comme lu:', err);
      }
    });
    this.notificationCounterService.refresh();
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.update(notifs =>
          notifs.map(n => ({ ...n, is_read: true }))
        );
      },
      error: (err) => {
        console.error('Erreur marquage tout comme lu:', err);
      }
    });
    this.notificationCounterService.refresh();
  }

  // ── Formatage date ──────────────────────────────────────────────
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // ── Modal admin : ouverture/fermeture ───────────────────────────
  openModal(): void {
    this.showModal.set(true);
    this.resetModal();
    this.loadConseillers();
  }

  closeModal(): void {
    this.showModal.set(false);
    this.resetModal();
  }

  resetModal(): void {
    this.selectedConseillers.set([]);
    this.newNotifTitle.set('');
    this.newNotifMessage.set('');
    this.newNotifType.set('info');
    this.sendSuccess.set(false);
    this.sendError.set('');
    this.searchConseiller.set('');
  }

  // ── Modal admin : chargement conseillers ────────────────────────
  loadConseillers(): void {
    this.notificationService.getConseillers().subscribe({
      next: (res) => {
        this.conseillers.set(res.results || []);
      },
      error: (err) => {
        console.error('Erreur chargement conseillers:', err);
      }
    });
  }

  get filteredConseillers(): Conseiller[] {
    const query = this.searchConseiller().toLowerCase().trim();
    if (!query) return this.conseillers();

    return this.conseillers().filter(c =>
      c.full_name.toLowerCase().includes(query) ||
      c.email.toLowerCase().includes(query)
    );
  }

  toggleConseiller(id: number): void {
    const current = [...this.selectedConseillers()];
    const index = current.indexOf(id);

    if (index >= 0) {
      current.splice(index, 1);
    } else {
      current.push(id);
    }

    this.selectedConseillers.set(current);
  }

  isSelected(id: number): boolean {
    return this.selectedConseillers().includes(id);
  }

  selectAll(): void {
    const allIds = this.conseillers().map(c => c.id);
    this.selectedConseillers.set(allIds);
  }

  deselectAll(): void {
    this.selectedConseillers.set([]);
  }

  // ── Modal admin : envoi notification ────────────────────────────
  sendNotification(): void {
    if (this.selectedConseillers().length === 0) {
      this.sendError.set(this.translate.instant('NOTIFICATION.ERROR_SELECT_RECIPIENT'));
      return;
    }

    if (!this.newNotifTitle().trim()) {
      this.sendError.set(this.translate.instant('NOTIFICATION.ERROR_TITLE_REQUIRED'));
      return;
    }

    if (!this.newNotifMessage().trim()) {
      this.sendError.set(this.translate.instant('NOTIFICATION.ERROR_MESSAGE_REQUIRED'));
      return;
    }

    this.sending.set(true);
    this.sendError.set('');

    const payload = {
      recipient_ids: this.selectedConseillers(),
      title: this.newNotifTitle(),
      message: this.newNotifMessage(),
      notification_type: this.newNotifType(),
    };

    this.notificationService.sendNotification(payload).subscribe({
      next: () => {
        this.sending.set(false);
        this.sendSuccess.set(true);

        setTimeout(() => {
          this.closeModal();
          this.loadNotifications();
        }, 1500);
      },
      error: (err) => {
        this.sending.set(false);
        this.sendError.set(err.error?.message || this.translate.instant('NOTIFICATION.ERROR_SEND'));
      }
    });
  }

  getTypeLabel(type: string): string {
    const key = `NOTIFICATION.TYPE_${type.toUpperCase()}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : type;
  }
}