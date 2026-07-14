import { Component, AfterViewInit, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Chart, registerables } from 'chart.js';
import { RapportAnalyseService, RapportAnalyse, StatsRapports } from '../../services/rapport-analyse/rapport-analyse.service';
Chart.register(...registerables);

// ── Component ─────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-rapport-analytic',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, TranslateModule],
  templateUrl: './rapport-analytic.component.html',
  styleUrl: './rapport-analytic.component.scss',
})
export class RapportAnalyticComponent implements OnInit, AfterViewInit, OnDestroy {

  private rapportService = inject(RapportAnalyseService);
  private translate        = inject(TranslateService);

  // ── Chart instances ────────────────────────────────────────────
  private pieChart?: Chart;
  private barChart?: Chart;

  // ── State données réelles ─────────────────────────────────────
  rapports      = signal<RapportAnalyse[]>([]);
  filteredList  = signal<RapportAnalyse[]>([]);
  stats         = signal<StatsRapports | null>(null);
  loading       = signal(true);
  searchText    = signal('');
  filterNiveau  = signal('');

  // ── Modal détail ──────────────────────────────────────────────
  showModal     = signal(false);
  selectedRapport = signal<RapportAnalyse | null>(null);

  // ── Colors ────────────────────────────────────────────────────
  readonly chartColors = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  readonly niveaux = [
    { value: '', label: 'RAPPORT_ANALYTIC.FILTER_ALL_LEVELS' },
    { value: 'excellent', label: 'RAPPORT_ANALYTIC.LEVEL_EXCELLENT' },
    { value: 'tres_bon',  label: 'RAPPORT_ANALYTIC.LEVEL_TRES_BON' },
    { value: 'bon',       label: 'RAPPORT_ANALYTIC.LEVEL_BON' },
    { value: 'moyen',     label: 'RAPPORT_ANALYTIC.LEVEL_MOYEN' },
    { value: 'faible',    label: 'RAPPORT_ANALYTIC.LEVEL_FAIBLE' },
  ];

  // ── Lifecycle ──────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadRapports();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.pieChart?.destroy();
    this.barChart?.destroy();
  }

  // ── Chargement ────────────────────────────────────────────────
  loadRapports(): void {
    this.loading.set(true);
    this.rapportService.getRapports().subscribe(res => {
      this.rapports.set(res.rapports);
      this.filteredList.set(res.rapports);
      this.stats.set(this.rapportService.getStatsRapports(res.rapports));
      this.loading.set(false);
      setTimeout(() => this.buildCharts(), 100);
    });
  }

  applyFilters(): void {
    let list = this.rapports();
    const s = this.searchText().toLowerCase().trim();
    const n = this.filterNiveau();
    if (s) list = list.filter(r =>
      r.nom_complet.toLowerCase().includes(s) ||
      r.etablissement.toLowerCase().includes(s)
    );
    if (n) list = list.filter(r => r.niveau_performance === n);
    this.filteredList.set(list);
  }

  onSearchChange(val: string): void { this.searchText.set(val); this.applyFilters(); }
  onNiveauChange(val: string): void { this.filterNiveau.set(val); this.applyFilters(); }

  // ── Modal ─────────────────────────────────────────────────────
  openModal(rapport: RapportAnalyse): void {
    this.selectedRapport.set(rapport);
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); }

  // ── Chart builders ─────────────────────────────────────────────
  private get tooltipStyle() {
    return {
      backgroundColor: '#fff',
      titleColor: '#111827',
      bodyColor: '#374151',
      borderColor: '#e5e7eb',
      borderWidth: 1,
      padding: 10,
    };
  }

  private buildCharts(): void {
    this.buildPieChart();
    this.buildBarChart();
  }

  private buildPieChart(): void {
    const ctx = document.getElementById('pieChart') as HTMLCanvasElement;
    if (!ctx) return;
    this.pieChart?.destroy();

    const s = this.stats();
    const rep = s?.repartition_niveaux ?? {};
    const labels = [
      this.translate.instant('RAPPORT_ANALYTIC.LEVEL_EXCELLENT'),
      this.translate.instant('RAPPORT_ANALYTIC.LEVEL_TRES_BON'),
      this.translate.instant('RAPPORT_ANALYTIC.LEVEL_BON'),
      this.translate.instant('RAPPORT_ANALYTIC.LEVEL_MOYEN'),
      this.translate.instant('RAPPORT_ANALYTIC.LEVEL_FAIBLE'),
    ];
    const data   = [rep['excellent'] ?? 0, rep['tres_bon'] ?? 0, rep['bon'] ?? 0, rep['moyen'] ?? 0, rep['faible'] ?? 0];

    this.pieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: this.chartColors, borderWidth: 2, borderColor: '#fff', hoverOffset: 5 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '58%',
        plugins: {
          legend: { display: false },
          tooltip: { ...this.tooltipStyle, callbacks: { label: c => ` ${c.label}: ${c.parsed}` } },
        },
      },
    });
  }

  private buildBarChart(): void {
    const ctx = document.getElementById('barChart') as HTMLCanvasElement;
    if (!ctx) return;
    this.barChart?.destroy();

    const s = this.stats();
    const rep = s?.repartition_niveaux ?? {};
    const labels = [
      this.translate.instant('RAPPORT_ANALYTIC.LEVEL_EXCELLENT'),
      this.translate.instant('RAPPORT_ANALYTIC.LEVEL_TRES_BON'),
      this.translate.instant('RAPPORT_ANALYTIC.LEVEL_BON'),
      this.translate.instant('RAPPORT_ANALYTIC.LEVEL_MOYEN'),
      this.translate.instant('RAPPORT_ANALYTIC.LEVEL_FAIBLE'),
    ];
    const data   = [rep['excellent'] ?? 0, rep['tres_bon'] ?? 0, rep['bon'] ?? 0, rep['moyen'] ?? 0, rep['faible'] ?? 0];

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: this.translate.instant('RAPPORT_ANALYTIC.CHART_DATA_ANALYSES'), data, backgroundColor: this.chartColors, borderRadius: 6, borderSkipped: false }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false }, tooltip: this.tooltipStyle },
        scales: {
          x: { grid: { display: false }, ticks: { color: '#6b7280', font: { size: 11 } } },
          y: { grid: { color: '#f3f4f6' }, ticks: { color: '#6b7280', font: { size: 11 }, stepSize: 1 } },
        },
      },
    });
  }

  // ── Helpers affichage ─────────────────────────────────────────
  getNiveauColor(niveau: string): string {
    const c: Record<string,string> = { excellent:'#22C55E', tres_bon:'#3B82F6', bon:'#06B6D4', moyen:'#F59E0B', faible:'#EF4444' };
    return c[niveau] || '#6B7280';
  }

  getNiveauLabel(niveau: string): string {
    const key = `RAPPORT_ANALYTIC.LEVEL_${niveau.toUpperCase()}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : niveau;
  }

  getNoteColor(note: number | null): string {
    if (note === null) return '#6B7280';
    if (note >= 16) return '#22C55E';
    if (note >= 14) return '#3B82F6';
    if (note >= 12) return '#06B6D4';
    if (note >= 10) return '#F59E0B';
    return '#EF4444';
  }

  getDistributionItems(dist: Record<string,number>): any[] {
    const map: Record<string, { labelKey: string; color: string }> = {
      excellent:   { labelKey: 'RAPPORT_DETAIL.DIST_EXCELLENT', color: '#22C55E' },
      tres_bon:    { labelKey: 'RAPPORT_DETAIL.DIST_TRES_BON',  color: '#3B82F6' },
      bon:         { labelKey: 'RAPPORT_DETAIL.DIST_BON',       color: '#06B6D4' },
      moyen:       { labelKey: 'RAPPORT_DETAIL.DIST_MOYEN',       color: '#F59E0B' },
      insuffisant: { labelKey: 'RAPPORT_DETAIL.DIST_INSUFFISANT', color: '#EF4444' },
    };
    const total = Object.values(dist).reduce((a, b) => a + b, 0);
    return Object.entries(dist).map(([k, count]) => ({
      label: this.translate.instant(map[k]?.labelKey || k),
      color: map[k]?.color || '#6B7280',
      count,
      percent: total > 0 ? (count / total) * 100 : 0,
    }));
  }

  exportPDF(): void   { console.log('Export PDF'); }
  exportExcel(): void { console.log('Export Excel'); }
}