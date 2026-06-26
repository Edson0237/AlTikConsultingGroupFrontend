import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../services/auth/auth.service';
import { StaffMessagingService } from '../../services/staff-messaging/staff-messaging.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, TranslateModule, TitleCasePipe],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent implements OnInit, OnDestroy {

  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly messagingService = inject(StaffMessagingService);

  readonly appName = 'ScholarTik';
  readonly appTagline = 'Bourses · Visas · Commerce';

  // ✅ Compteur de messages non lus
  unreadMessagesCount = this.messagingService.unreadCount;
  
  private subscription?: Subscription;

  ngOnInit(): void {
    // Forcer un refresh au chargement
    this.messagingService.refresh();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  handleLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}