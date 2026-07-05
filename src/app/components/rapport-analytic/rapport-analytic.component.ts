import { Component, AfterViewInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// ── Interfaces ────────────────────────────────────────────────────────────────
export interface KpiCard {
  label:   string;
  value:   string;
  trend:   string;
  trendUp: boolean;
}

export interface StatusItem {
  status: string;
  count:  number;
}

export interface ServicePerf {
  service: string;
  cases:   number;
  revenue: number;
  avgTime: string;
}

export interface Prediction {
  label:      string;
  value:      string;
  note:       string;
  noteUp:     boolean;
  colorClass: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-rapport-analytic',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, TranslatePipe],
  templateUrl: './rapport-analytic.component.html',
  styleUrl: './rapport-analytic.component.scss',
})
export class RapportAnalyticComponent implements AfterViewInit, OnDestroy {

  private translate = inject(TranslateService);

  // ── Chart instances ────────────────────────────────────────────
  private lineChart?: Chart;
  private pieChart?:  Chart;
  private barChart?:  Chart;

  // ── State ─────────────────────────────────────────────────────
  selectedPeriod = '6';

  // ── Colors ────────────────────────────────────────────────────
  readonly chartColors = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  // ── KPI Cards ─────────────────────────────────────────────────
  readonly kpiCards: KpiCard[] = [
    { label: 'RAPPORT_ANALYTIC.KPI_TOTAL_REVENUE',   value: '$1,245K', trend: '↑ 23% vs période précédente', trendUp: true  },
    { label: 'RAPPORT_ANALYTIC.KPI_TOTAL_DOSSIERS',  value: '148',     trend: '↑ 15% vs période précédente', trendUp: true  },
    { label: 'RAPPORT_ANALYTIC.KPI_TOTAL_CLIENTS',   value: '64',      trend: '↑ 12% vs période précédente', trendUp: true  },
    { label: 'RAPPORT_ANALYTIC.KPI_AVG_PROCESSING',  value: '52 jours',trend: '↓ 8% d\'amélioration',        trendUp: false },
  ];

  // ── Revenue data (monthly) ─────────────────────────────────────
  readonly revenueData = [
    { monthKey: 'RAPPORT_ANALYTIC.MONTH_JAN', visa: 42000, education: 28000, trade: 18000, realEstate: 35000 },
    { monthKey: 'RAPPORT_ANALYTIC.MONTH_FEB', visa: 48000, education: 31000, trade: 22000, realEstate: 40000 },
    { monthKey: 'RAPPORT_ANALYTIC.MONTH_MAR', visa: 55000, education: 36000, trade: 19000, realEstate: 45000 },
    { monthKey: 'RAPPORT_ANALYTIC.MONTH_APR', visa: 52000, education: 33000, trade: 25000, realEstate: 50000 },
    { monthKey: 'RAPPORT_ANALYTIC.MONTH_MAY', visa: 61000, education: 40000, trade: 28000, realEstate: 55000 },
    { monthKey: 'RAPPORT_ANALYTIC.MONTH_JUN', visa: 58000, education: 38000, trade: 30000, realEstate: 60000 },
  ];

  // ── Cases by status ────────────────────────────────────────────
  readonly statusData: StatusItem[] = [
    { status: 'RAPPORT_ANALYTIC.STATUS_IN_PROGRESS', count: 45 },
    { status: 'RAPPORT_ANALYTIC.STATUS_APPROVED',    count: 62 },
    { status: 'RAPPORT_ANALYTIC.STATUS_PENDING',     count: 28 },
    { status: 'RAPPORT_ANALYTIC.STATUS_REJECTED',    count: 13 },
  ];

  // ── Service performance ────────────────────────────────────────
  readonly servicePerformance: ServicePerf[] = [
    { service: 'RAPPORT_ANALYTIC.SERVICE_VISA',       cases: 48, revenue: 58000,  avgTime: '45 jours' },
    { service: 'RAPPORT_ANALYTIC.SERVICE_EDUCATION',  cases: 35, revenue: 38000,  avgTime: '60 jours' },
    { service: 'RAPPORT_ANALYTIC.SERVICE_COMMERCE',   cases: 30, revenue: 30000,  avgTime: '30 jours' },
    { service: 'RAPPORT_ANALYTIC.SERVICE_REAL_ESTATE', cases: 22, revenue: 60000,  avgTime: '90 jours' },
  ];

  // ── Predictive insights ────────────────────────────────────────
  readonly predictions: Prediction[] = [
    {
      label:      'RAPPORT_ANALYTIC.PRED_REVENUE_FORECAST',
      value:      '$315K',
      note:       '↑ 8% croissance projetée',
      noteUp:     true,
      colorClass: 'blue',
    },
    {
      label:      'RAPPORT_ANALYTIC.PRED_COMPLETED_CASES',
      value:      '12 dossiers',
      note:       'Dans les 30 prochains jours',
      noteUp:     false,
      colorClass: 'green',
    },
    {
      label:      'RAPPORT_ANALYTIC.PRED_SATISFACTION',
      value:      '4.7 / 5.0',
      note:       '↑ +0.3 d\'amélioration',
      noteUp:     true,
      colorClass: 'purple',
    },
  ];

  // ── Lifecycle ──────────────────────────────────────────────────
  ngAfterViewInit(): void {
    this.buildLineChart();
    this.buildPieChart();
    this.buildBarChart();
  }

  ngOnDestroy(): void {
    this.lineChart?.destroy();
    this.pieChart?.destroy();
    this.barChart?.destroy();
  }

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

  private buildLineChart(): void {
    const ctx = document.getElementById('lineChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.revenueData.map(d => this.translate.instant(d.monthKey)),
        datasets: [
          { label: this.translate.instant('RAPPORT_ANALYTIC.SERVICE_VISA'),       data: this.revenueData.map(d => d.visa),       borderColor: '#2563EB', backgroundColor: 'rgba(37,99,235,.07)',  borderWidth: 2, tension: .4, pointRadius: 3, fill: true },
          { label: this.translate.instant('RAPPORT_ANALYTIC.SERVICE_EDUCATION'),  data: this.revenueData.map(d => d.education),  borderColor: '#10B981', backgroundColor: 'rgba(16,185,129,.07)', borderWidth: 2, tension: .4, pointRadius: 3, fill: true },
          { label: this.translate.instant('RAPPORT_ANALYTIC.SERVICE_COMMERCE'),   data: this.revenueData.map(d => d.trade),      borderColor: '#F59E0B', backgroundColor: 'rgba(245,158,11,.07)', borderWidth: 2, tension: .4, pointRadius: 3, fill: true },
          { label: this.translate.instant('RAPPORT_ANALYTIC.SERVICE_REAL_ESTATE'), data: this.revenueData.map(d => d.realEstate), borderColor: '#8B5CF6', backgroundColor: 'rgba(139,92,246,.07)', borderWidth: 2, tension: .4, pointRadius: 3, fill: true },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top', labels: { boxWidth: 10, font: { size: 11 } } },
          tooltip: this.tooltipStyle,
        },
        scales: {
          x: { grid: { color: '#f3f4f6' }, ticks: { color: '#6b7280', font: { size: 11 } } },
          y: { grid: { color: '#f3f4f6' }, ticks: { color: '#6b7280', font: { size: 11 } } },
        },
      },
    });
  }

  private buildPieChart(): void {
    const ctx = document.getElementById('pieChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.pieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.statusData.map(s => this.translate.instant(s.status)),
        datasets: [{
          data: this.statusData.map(s => s.count),
          backgroundColor: this.chartColors,
          borderWidth: 2,
          borderColor: '#fff',
          hoverOffset: 5,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '58%',
        plugins: {
          legend: { display: false },
          tooltip: {
            ...this.tooltipStyle,
            callbacks: { label: c => ` ${c.label}: ${c.parsed}` },
          },
        },
      },
    });
  }

  private buildBarChart(): void {
    const ctx = document.getElementById('barChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.barChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.servicePerformance.map(s => this.translate.instant(s.service)),
        datasets: [{
          label: this.translate.instant('RAPPORT_ANALYTIC.TABLE_ACTIVE_CASES'),
          data: this.servicePerformance.map(s => s.cases),
          backgroundColor: ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6'],
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: this.tooltipStyle,
        },
        scales: {
          x: { grid: { display: false },    ticks: { color: '#6b7280', font: { size: 11 } } },
          y: { grid: { color: '#f3f4f6' },  ticks: { color: '#6b7280', font: { size: 11 } } },
        },
      },
    });
  }

  // ── Actions ───────────────────────────────────────────────────
  exportPDF(): void   { console.log('Export PDF'); }
  exportExcel(): void { console.log('Export Excel'); }
}