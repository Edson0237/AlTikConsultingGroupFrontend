import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { RapportAnalyseService, RapportAnalyse, StatsRapports } from '../../services/rapport-analyse/rapport-analyse.service';

Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
  standalone: true,
  imports: [CommonModule, TranslatePipe],
})
export class AnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('niveauChartRef') niveauChartRef!: ElementRef<HTMLCanvasElement>;

  private rapportService = inject(RapportAnalyseService);
  private router = inject(Router);
  private translate = inject(TranslateService);

  private niveauChart!: Chart;

  // ── State ─────────────────────────────────────────────────────
  rapports = signal<RapportAnalyse[]>([]);
  stats = signal<StatsRapports | null>(null);
  loading = signal(true);
  error = signal('');
  selectedRapport = signal<RapportAnalyse | null>(null);



  ngOnInit(): void {
    this.loadRapports();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.niveauChart?.destroy();
  }

  // ── Chargement des rapports ───────────────────────────────────
  loadRapports(): void {
    this.loading.set(true);
    this.rapportService.getRapports().subscribe({
      next: (res) => {
        if (res.success) {
          this.rapports.set(res.rapports);
          this.stats.set(this.rapportService.getStatsRapports(res.rapports));
          // Construire le graphique des niveaux après chargement
          setTimeout(() => this.buildNiveauChart(), 100);
        } else {
          this.error.set(this.translate.instant('ANALYTICS.LOAD_ERROR'));
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.translate.instant('ANALYTICS.CONNECTION_ERROR'));
        this.loading.set(false);
      }
    });
  }

  // ── Navigation & Modal ────────────────────────────────────────
  openDetail(rapport: RapportAnalyse): void {
    this.selectedRapport.set(rapport);
    document.body.style.overflow = 'hidden';
  }

  closeDetail(): void {
    this.selectedRapport.set(null);
    document.body.style.overflow = '';
  }

  viewRapport(rapport: RapportAnalyse): void {
    this.closeDetail();
    this.router.navigate(['/dashboard-admin/rapports', rapport.id]);
  }

  // ── Helpers ───────────────────────────────────────────────────
  getNiveauColor(niveau: string): string {
    const colors: { [key: string]: string } = {
      'excellent': '#22C55E',
      'tres_bon': '#3B82F6',
      'bon': '#06B6D4',
      'moyen': '#F59E0B',
      'faible': '#EF4444',
    };
    return colors[niveau] || '#6B7280';
  }

  getNoteColor(note: number | null): string {
    if (note === null) return '#6B7280';
    if (note >= 16) return '#22C55E';
    if (note >= 14) return '#3B82F6';
    if (note >= 12) return '#06B6D4';
    if (note >= 10) return '#F59E0B';
    return '#EF4444';
  }

  getNiveauLabel(niveau: string): string {
    const key = `ANALYTICS.LEVEL_${niveau.toUpperCase()}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : niveau;
  }

  getTypeDocumentIcon(type: string): string {
    const icons: { [key: string]: string } = {
      'releve_probatoire': 'description',
      'releve_bac': 'school',
      'releve_notes': 'assignment',
    };
    return icons[type] || 'insert_drive_file';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  formatRelativeTime(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return this.formatDate(dateStr);
  }

  // ── Charts ────────────────────────────────────────────────────
  private buildNiveauChart(): void {
    if (!this.niveauChartRef) return;
    
    const s = this.stats();
    if (!s) return;

    const ctx = this.niveauChartRef.nativeElement.getContext('2d')!;
    
    this.niveauChart?.destroy();
    this.niveauChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: [
          this.translate.instant('ANALYTICS.LEVEL_EXCELLENT'),
          this.translate.instant('ANALYTICS.LEVEL_TRES_BON'),
          this.translate.instant('ANALYTICS.LEVEL_BON'),
          this.translate.instant('ANALYTICS.LEVEL_MOYEN'),
          this.translate.instant('ANALYTICS.LEVEL_FAIBLE'),
        ],
        datasets: [{
          label: this.translate.instant('ANALYTICS.CHART_STUDENTS'),
          data: [
            s.repartition_niveaux['excellent'] || 0,
            s.repartition_niveaux['tres_bon'] || 0,
            s.repartition_niveaux['bon'] || 0,
            s.repartition_niveaux['moyen'] || 0,
            s.repartition_niveaux['faible'] || 0,
          ],
          backgroundColor: ['#22C55E', '#3B82F6', '#06B6D4', '#F59E0B', '#EF4444'],
          borderRadius: 8,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#ffffff',
            borderColor: '#E5E7EB',
            borderWidth: 1,
            titleColor: '#111827',
            bodyColor: '#374151',
          },
        },
        scales: {
          x: { ticks: { color: '#6B7280' }, grid: { display: false } },
          y: { ticks: { color: '#6B7280', stepSize: 1 }, grid: { color: '#F3F4F6' } },
        },
      },
    });
  }
}