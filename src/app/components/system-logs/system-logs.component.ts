import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslatePipe } from '@ngx-translate/core';
import { SystemLog, SystemLogService } from '../../services/system-log/system-log.service';

@Component({
  selector: 'app-system-logs',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './system-logs.component.html',
  styleUrl: './system-logs.component.scss',
})
export class SystemLogsComponent implements OnInit {
  private systemLogService = inject(SystemLogService);

  logs = signal<SystemLog[]>([]);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);
  activeFilter = signal<string>('all');

  filteredLogs = computed(() => {
    const f = this.activeFilter();
    if (f === 'all') return this.logs();
    return this.logs().filter(l => this.getActionColor(l.action) === f);
  });

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    this.error.set(null);
    this.systemLogService.getLogs(200).subscribe({
      next: (response) => {
        this.loading.set(false);
        if (response.success) {
          this.logs.set(response.logs);
        } else {
          this.error.set('Impossible de charger le journal.');
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err.error?.message || err.message || 'Erreur de chargement.');
      },
    });
  }

  setFilter(filter: string): void {
    this.activeFilter.set(filter);
  }

  getActionColor(action: string): string {
    if (action.includes('created') || action.includes('uploaded') || action.includes('registered')) return 'blue';
    if (action.includes('verified') || action.includes('completed')) return 'green';
    if (action.includes('rejected') || action.includes('failed')) return 'red';
    if (action.includes('changed')) return 'orange';
    if (action.includes('sent')) return 'purple';
    return 'gray';
  }

  getActionSvgPath(action: string): string {
    const map: Record<string, string> = {
      dossier_created:       '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>',
      dossier_updated:       '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
      dossier_status_changed:'<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
      document_uploaded:     '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>',
      document_verified:     '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
      document_rejected:     '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
      analyse_completed:     '<path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
      analyse_failed:        '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
      message_sent:          '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
      notification_sent:     '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
      user_registered:       '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>',
      filiere_selected:      '<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    };
    return map[action] || '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>';
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleString('fr-FR');
  }

  trackByLog(index: number, log: SystemLog): number {
    return log.id;
  }
}
