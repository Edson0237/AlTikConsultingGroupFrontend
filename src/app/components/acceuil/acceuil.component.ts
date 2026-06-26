import { AfterViewInit, Component, OnDestroy, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Chart, registerables } from 'chart.js';
import { DashboardService, DashboardStats } from '../../services/dashboard/dashboard.service';
Chart.register(...registerables);

export interface ServiceSlice {
  name: string;
  value: number;
  color: string;
}

export interface Activity {
  id: number;
  text: string;
  user: string;
  time: string;
  color: string;
}

@Component({
  selector: 'app-acceuil',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './acceuil.component.html',
  styleUrl: './acceuil.component.scss',
})
export class AcceuilComponent implements AfterViewInit, OnDestroy, OnInit {

  private dashboardService = inject(DashboardService);

  private lineChart?: Chart;
  private pieChart?: Chart;
  private barChart?: Chart;

  // ✅ Données dynamiques
  stats = signal<DashboardStats['data'] | null>(null);
  loading = signal(true);
  error = signal(false);

  // Labels des mois
  monthLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  // ✅ Couleurs pour les graphiques (public pour accès depuis le template)
  readonly COLORS = {
    bourses: '#2563EB',
    visas: '#6366F1',
    documents: '#10B981',
    users: '#F59E0B',
  };

  // ✅ PUBLIC - accessible depuis le template
  readonly TYPE_COLORS: { [key: string]: string } = {
    'bourse_chine': '#2563EB',
    'bourse_allemagne': '#F59E0B',
    'bourse_canada': '#EF4444',
    'visa_affaires': '#6366F1',
  };

  // ✅ PUBLIC - accessible depuis le template
  readonly TYPE_LABELS: { [key: string]: string } = {
    'bourse_chine': 'Bourses Chine',
    'bourse_allemagne': 'Bourses Allemagne',
    'bourse_canada': 'Bourses Canada',
    'visa_affaires': 'Visas Affaires',
  };

  ngOnInit(): void {
    this.loadStats();
  }

  ngAfterViewInit(): void {
    // Les charts seront construits après chargement des données
  }

  ngOnDestroy(): void {
    this.lineChart?.destroy();
    this.pieChart?.destroy();
    this.barChart?.destroy();
  }

  // ═══════════════════════════════════════════════════════════════
  // CHARGEMENT DES DONNÉES
  // ═══════════════════════════════════════════════════════════════

  loadStats(): void {
    this.loading.set(true);
    this.error.set(false);

    this.dashboardService.getDashboardStats().subscribe({
      next: (res) => {
        this.loading.set(false);

        if (res.success && res.data) {
          this.stats.set(res.data);
          this.error.set(false);
          setTimeout(() => {
            this.buildAllCharts();
          }, 100);
        } else {
          // L'API n'a pas renvoyé de données exploitables
          this.stats.set(null);
          this.error.set(true);
        }
      },
      error: (err) => {
        console.error('Erreur chargement stats:', err);
        this.loading.set(false);
        this.stats.set(null);
        this.error.set(true);
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // CONSTRUCTION DES CHARTS
  // ═══════════════════════════════════════════════════════════════

  private buildAllCharts(): void {
    if (!this.stats()) return;
    this.buildLineChart();
    this.buildPieChart();
    this.buildBarChart();
  }

  private buildLineChart(): void {
    const ctx = document.getElementById('lineChart') as HTMLCanvasElement;
    if (!ctx) return;

    const data = this.stats()!;
    const charts = data.charts;

    const months = charts.evolution_dossiers.map((e: { month: string; count: number }) => {
      const date = new Date(e.month);
      return this.monthLabels[date.getMonth()];
    });

    this.lineChart?.destroy();
    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Dossiers',
            data: charts.evolution_dossiers.map((e: { month: string; count: number }) => e.count),
            borderColor: this.COLORS.bourses,
            backgroundColor: 'rgba(37,99,235,.08)',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
          },
          {
            label: 'Utilisateurs',
            data: charts.evolution_users.map((e: { month: string; count: number }) => e.count),
            borderColor: this.COLORS.users,
            backgroundColor: 'rgba(245,158,11,.08)',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
          },
          {
            label: 'Documents',
            data: charts.evolution_documents.map((e: { month: string; count: number }) => e.count),
            borderColor: this.COLORS.documents,
            backgroundColor: 'rgba(16,185,129,.08)',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 10, font: { size: 12 } } },
          tooltip: {
            backgroundColor: '#fff',
            titleColor: '#111827',
            bodyColor: '#374151',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            padding: 10,
          },
        },
        scales: {
          x: { grid: { color: '#f3f4f6' }, ticks: { color: '#6b7280' } },
          y: { grid: { color: '#f3f4f6' }, ticks: { color: '#6b7280' } },
        },
      },
    });
  }

  private buildPieChart(): void {
    const ctx = document.getElementById('pieChart') as HTMLCanvasElement;
    if (!ctx) return;

    const data = this.stats()!;
    const repartition = data.charts.repartition_dossiers;

    this.pieChart?.destroy();
    this.pieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: repartition.map((r: { type_dossier: string; count: number }) => this.TYPE_LABELS[r.type_dossier] || r.type_dossier),
        datasets: [{
          data: repartition.map((r: { type_dossier: string; count: number }) => r.count),
          backgroundColor: repartition.map((r: { type_dossier: string; count: number }) => this.TYPE_COLORS[r.type_dossier] || '#94A3B8'),
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#fff',
            titleColor: '#111827',
            bodyColor: '#374151',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            padding: 10,
          },
        },
      },
    });
  }

  // ✅ UNE SEULE MÉTHODE buildBarChart
  private buildBarChart(): void {
    const ctx = document.getElementById('barChart') as HTMLCanvasElement;
    if (!ctx) return;

    const data = this.stats()!;
    const top = data.charts.top_filieres;  // ✅ Utilise top_filieres

    const colors = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE'];

    this.barChart?.destroy();
    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: top.map((f: { nom_filiere: string; count: number }) => f.nom_filiere || 'Inconnu'),
        datasets: [{
          label: 'Candidatures',
          data: top.map((f: { nom_filiere: string; count: number }) => f.count),
          backgroundColor: colors,
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
            backgroundColor: '#fff',
            titleColor: '#111827',
            bodyColor: '#374151',
            borderColor: '#e5e7eb',
            borderWidth: 1,
            padding: 10,
          },
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#6b7280', font: { size: 11 } } },
          y: { grid: { color: '#f3f4f6' }, ticks: { color: '#6b7280' } },
        },
      },
    });
  }

  // ═══════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════

  formatRelativeTime(isoDate: string): string {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return "À l'instant";
    if (diffMin < 60) return `Il y a ${diffMin} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    return date.toLocaleDateString('fr-FR');
  }

  getStatutPercent(statut: string): number {
    const data = this.stats();
    if (!data) return 0;
    const total = data.kpis.total_dossiers;
    if (total === 0) return 0;
    const count = data.kpis.dossiers_par_statut[statut] || 0;
    return (count / total) * 100;
  }

  getDocumentPercent(count: number): number {
    const data = this.stats();
    if (!data) return 0;
    const max = Math.max(...data.charts.documents_par_type.map((d: { type_document: string; count: number }) => d.count));
    return max > 0 ? (count / max) * 100 : 0;
  }

  getDocumentLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'releve_notes': 'Relevés de notes',
      'releve_probatoire': 'Relevé probatoire',
      'releve_bac': 'Relevé bac',
      'diplome': 'Diplômes',
      'passeport': 'Passeports',
      'photo_identite': 'Photos identité',
      'casier_judiciaire': 'Casiers judiciaires',
      'certificat_medical': 'Certificats médicaux',
      'cv': 'CV',
      'lettre_motivation': 'Lettres motivation',
    };
    return labels[type] || type;
  }
}