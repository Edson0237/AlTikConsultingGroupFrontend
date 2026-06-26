import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
  signal,
  computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { RapportAnalyseService, RapportAnalyse, StatsRapports } from '../../services/rapport-analyse/rapport-analyse.service';

Chart.register(...registerables);

interface KpiCard {
  icon: string;
  value: string;
  label: string;
  color: string;
  bgColor: string;
  trend?: string;
}

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class AnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('lineChartRef') lineChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChartRef') pieChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('niveauChartRef') niveauChartRef!: ElementRef<HTMLCanvasElement>;

  private rapportService = inject(RapportAnalyseService);
  private router = inject(Router);

  private lineChart!: Chart;
  private pieChart!: Chart;
  private niveauChart!: Chart;

  // ── State ─────────────────────────────────────────────────────
  rapports = signal<RapportAnalyse[]>([]);
  stats = signal<StatsRapports | null>(null);
  loading = signal(true);
  error = signal('');

  // ── KPI Cards (dynamiques) ────────────────────────────────────
  kpiCards = computed<KpiCard[]>(() => {
    const s = this.stats();
    const rapportsList = this.rapports();
    
    return [
      {
        icon: 'group',
        value: '1 247',
        label: 'Total Candidatures',
        color: '#3B82F6',
        bgColor: 'rgba(59,130,246,0.10)',
      },
      {
        icon: 'auto_awesome',
        value: s ? s.total_analyses.toString() : '—',
        label: 'Analyses IA',
        color: '#8B5CF6',
        bgColor: 'rgba(139,92,246,0.10)',
        trend: s ? `${s.analyses_reussies} réussies` : undefined,
      },
      {
        icon: 'trending_up',
        value: s ? `${s.score_moyen_ia}/20` : '—',
        label: 'Score moyen',
        color: '#22C55E',
        bgColor: 'rgba(34,197,94,0.10)',
      },
      {
        icon: 'emoji_events',
        value: s ? `${s.repartition_niveaux['excellent'] || 0}` : '—',
        label: 'Niveau Excellent',
        color: '#F59E0B',
        bgColor: 'rgba(245,158,11,0.10)',
      },
      {
        icon: 'public',
        value: '45',
        label: 'Destinations',
        color: '#06B6D4',
        bgColor: 'rgba(6,182,212,0.10)',
      },
    ];
  });

  // ── Données graphiques ────────────────────────────────────────
  private monthlyData = [
    { month: 'Jan', applications: 45, accepted: 38 },
    { month: 'Fév', applications: 52, accepted: 44 },
    { month: 'Mar', applications: 48, accepted: 40 },
    { month: 'Avr', applications: 61, accepted: 53 },
    { month: 'Mai', applications: 55, accepted: 48 },
  ];

  private countryData = [
    { name: 'Chine', value: 35 },
    { name: 'Dubaï', value: 28 },
    { name: 'Turquie', value: 20 },
    { name: 'Canada', value: 12 },
    { name: 'N-Z', value: 5 },
  ];

  private colors = ['#3B82F6', '#06B6D4', '#22C55E', '#F59E0B', '#8B5CF6'];

  ngOnInit(): void {
    this.loadRapports();
  }

  ngAfterViewInit(): void {
    this.buildLineChart();
    this.buildPieChart();
  }

  ngOnDestroy(): void {
    this.lineChart?.destroy();
    this.pieChart?.destroy();
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
          this.error.set('Impossible de charger les rapports');
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Erreur de connexion');
        this.loading.set(false);
      }
    });
  }

  // ── Navigation ────────────────────────────────────────────────
  viewRapport(rapport: RapportAnalyse): void {
    this.router.navigate(['/analytics/rapports', rapport.id]);
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

  getNiveauLabel(niveau: string): string {
    const labels: { [key: string]: string } = {
      'excellent': 'Excellent',
      'tres_bon': 'Très bon',
      'bon': 'Bon',
      'moyen': 'Moyen',
      'faible': 'Faible',
    };
    return labels[niveau] || niveau;
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
  private buildLineChart(): void {
    const ctx = this.lineChartRef.nativeElement.getContext('2d')!;
    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.monthlyData.map(d => d.month),
        datasets: [
          {
            label: 'Candidatures',
            data: this.monthlyData.map(d => d.applications),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59,130,246,0.10)',
            borderWidth: 3,
            pointRadius: 5,
            pointBackgroundColor: '#3B82F6',
            tension: 0.4,
            fill: true,
          },
          {
            label: 'Acceptées',
            data: this.monthlyData.map(d => d.accepted),
            borderColor: '#22C55E',
            backgroundColor: 'rgba(34,197,94,0.10)',
            borderWidth: 3,
            pointRadius: 5,
            pointBackgroundColor: '#22C55E',
            tension: 0.4,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#6B7280', font: { size: 12 } } },
          tooltip: {
            backgroundColor: '#ffffff',
            borderColor: '#E5E7EB',
            borderWidth: 1,
            titleColor: '#111827',
            bodyColor: '#374151',
          },
        },
        scales: {
          x: { ticks: { color: '#6B7280' }, grid: { color: '#F3F4F6' } },
          y: { ticks: { color: '#6B7280' }, grid: { color: '#F3F4F6' } },
        },
      },
    });
  }

  private buildPieChart(): void {
    const ctx = this.pieChartRef.nativeElement.getContext('2d')!;
    this.pieChart = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: this.countryData.map(d => d.name),
        datasets: [{
          data: this.countryData.map(d => d.value),
          backgroundColor: this.colors,
          borderColor: '#ffffff',
          borderWidth: 3,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#6B7280', font: { size: 12 }, padding: 16, usePointStyle: true },
          },
          tooltip: {
            backgroundColor: '#ffffff',
            borderColor: '#E5E7EB',
            borderWidth: 1,
            titleColor: '#111827',
            bodyColor: '#374151',
            callbacks: { label: (ctx) => ` ${ctx.label} : ${ctx.parsed}%` },
          },
        },
      },
    });
  }

  private buildNiveauChart(): void {
    if (!this.niveauChartRef) return;
    
    const s = this.stats();
    if (!s) return;

    const ctx = this.niveauChartRef.nativeElement.getContext('2d')!;
    
    this.niveauChart?.destroy();
    this.niveauChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Excellent', 'Très bon', 'Bon', 'Moyen', 'Faible'],
        datasets: [{
          label: 'Étudiants',
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