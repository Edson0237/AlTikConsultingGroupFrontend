import { Component, EventEmitter, Output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import {
  NotificationSettingsService,
  ServiceFee,
  WelcomeMessage,
} from '../../services/notification-settings/notification-settings.service';

export type NotificationType = 'info' | 'success' | 'warning' | 'error';

@Component({
  selector: 'app-notification-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslatePipe],
  templateUrl: './notification-settings.component.html',
  styleUrl: './notification-settings.component.scss',
})
export class NotificationSettingsComponent implements OnInit {
  private settingsService = inject(NotificationSettingsService);
  private translate = inject(TranslateService);

  @Output() closed = new EventEmitter<void>();

  activeTab = signal<'welcome' | 'fees'>('welcome');
  loading = signal(false);
  saving = signal(false);
  error = signal('');
  success = signal(false);

  welcome = signal<WelcomeMessage | null>(null);
  welcomeTitle = signal('');
  welcomeMessage = signal('');
  welcomeType = signal<NotificationType>('success');

  fees = signal<ServiceFee[]>([]);
  editingFee = signal<ServiceFee | null>(null);
  feeForm = {
    title: signal(''),
    amount: signal<number | null>(null),
    currency: signal('FCFA'),
    description: signal(''),
    order: signal<number>(0),
    is_active: signal(true),
  };

  ngOnInit(): void {
    this.loadWelcome();
    this.loadFees();
  }

  close(): void {
    this.closed.emit();
  }

  setTab(tab: 'welcome' | 'fees'): void {
    this.activeTab.set(tab);
  }

  loadWelcome(): void {
    this.loading.set(true);
    this.settingsService.getWelcomeMessage().subscribe({
      next: (res) => {
        const w = res.welcome_message;
        this.welcome.set(w);
        this.welcomeTitle.set(w.title);
        this.welcomeMessage.set(w.message);
        this.welcomeType.set(w.notification_type as NotificationType);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.translate.instant('NOTIFICATION_SETTINGS.ERROR'));
        this.loading.set(false);
      },
    });
  }

  loadFees(): void {
    this.settingsService.getServiceFees().subscribe({
      next: (res) => {
        this.fees.set(res.results || []);
      },
      error: () => {
        this.error.set(this.translate.instant('NOTIFICATION_SETTINGS.ERROR'));
      },
    });
  }

  saveWelcome(): void {
    this.saving.set(true);
    this.error.set('');
    this.success.set(false);

    this.settingsService
      .updateWelcomeMessage({
        title: this.welcomeTitle(),
        message: this.welcomeMessage(),
        notification_type: this.welcomeType(),
      })
      .subscribe({
        next: (res) => {
          this.welcome.set(res.welcome_message);
          this.saving.set(false);
          this.success.set(true);
          setTimeout(() => this.success.set(false), 3000);
        },
        error: (err) => {
          this.saving.set(false);
          this.error.set(err.error?.message || this.translate.instant('NOTIFICATION_SETTINGS.ERROR'));
        },
      });
  }

  startNewFee(): void {
    this.editingFee.set({
      id: 0,
      title: '',
      amount: 0,
      currency: 'FCFA',
      description: '',
      order: 0,
      is_active: true,
      formatted_amount: '',
      created_at: '',
      updated_at: '',
    } as ServiceFee);
  }

  editFee(fee: ServiceFee): void {
    this.editingFee.set(fee);
    this.feeForm.title.set(fee.title);
    this.feeForm.amount.set(fee.amount);
    this.feeForm.currency.set(fee.currency);
    this.feeForm.description.set(fee.description);
    this.feeForm.order.set(fee.order);
    this.feeForm.is_active.set(fee.is_active);
  }

  cancelFeeEdit(): void {
    this.editingFee.set(null);
  }

  saveFee(): void {
    const title = this.feeForm.title().trim();
    const amount = this.feeForm.amount();
    if (!title || amount === null || amount === undefined) {
      this.error.set(this.translate.instant('NOTIFICATION_SETTINGS.ERROR'));
      return;
    }

    const payload = {
      title,
      amount,
      currency: this.feeForm.currency().trim() || 'FCFA',
      description: this.feeForm.description().trim(),
      order: this.feeForm.order(),
      is_active: this.feeForm.is_active(),
    };

    this.saving.set(true);
    this.error.set('');
    this.success.set(false);

    const existing = this.editingFee();
    const operation = existing
      ? this.settingsService.updateServiceFee(existing.id, payload)
      : this.settingsService.createServiceFee(payload);

    operation.subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set(true);
        this.editingFee.set(null);
        this.loadFees();
        setTimeout(() => this.success.set(false), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err.error?.message || this.translate.instant('NOTIFICATION_SETTINGS.ERROR'));
      },
    });
  }

  deleteFee(fee: ServiceFee): void {
    if (!confirm(this.translate.instant('NOTIFICATION_SETTINGS.DELETE_FEE') + ' ?')) return;
    this.settingsService.deleteServiceFee(fee.id).subscribe({
      next: () => this.loadFees(),
      error: () => this.error.set(this.translate.instant('NOTIFICATION_SETTINGS.ERROR')),
    });
  }

  getTypeLabel(type: string): string {
    const key = `NOTIFICATION.TYPE_${type.toUpperCase()}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : type;
  }
}
