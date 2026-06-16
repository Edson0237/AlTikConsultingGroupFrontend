import {
  AfterViewInit,
  Component,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

// ── Interfaces ────────────────────────────────────────────────────────────────
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

// ── Component ─────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-acceuil',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './acceuil.component.html',
  styleUrl:'./acceuil.component.scss',
})
export class AcceuilComponent implements AfterViewInit, OnDestroy {

  // ── Chart instances (kept for cleanup) ────────────────────────
  private lineChart?: Chart;
  private pieChart?: Chart;
  private barChart?: Chart;

  // ── Data ───────────────────────────────────────────────────────
  readonly monthlyLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai'];

  readonly monthlyData = {
    bourses: [28, 32, 35, 42, 38],
    visas: [15, 18, 22, 19, 24],
    commandes: [12, 15, 18, 21, 24],
  };

  readonly serviceData: ServiceSlice[] = [
    { name: 'Bourses Chine', value: 48, color: '#2563EB' },
    { name: 'Visas Affaires', value: 28, color: '#6366F1' },
    { name: 'Import-Export', value: 24, color: '#10B981' },
  ];

  readonly topUniversities = [
    { name: 'Beijing', value: 45 },
    { name: 'Shanghai', value: 38 },
    { name: 'Guangzhou', value: 28 },
    { name: 'Shenzhen', value: 22 },
    { name: 'Hangzhou', value: 18 },
  ];

  readonly universityColors = ['#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE'];

  readonly recentActivities: Activity[] = [
    { id: 1, text: 'Nouvelle demande de bourse', user: 'Konan Anderson', time: 'Il y a 5 min', color: '#2563EB' },
    { id: 2, text: 'Visa approuvé', user: 'Jean Kouadio', time: 'Il y a 15 min', color: '#6366F1' },
    { id: 3, text: 'Commande passée', user: 'Marie Kouassi', time: 'Il y a 32 min', color: '#10B981' },
    { id: 4, text: 'Document validé', user: 'Ibrahim Traoré', time: 'Il y a 1h', color: '#0EA5E9' },
    { id: 5, text: "Lettre d'admission reçue", user: 'Fatou Sow', time: 'Il y a 2h', color: '#22C55E' },
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
  private buildLineChart(): void {
    const ctx = document.getElementById('lineChart') as HTMLCanvasElement;
    if (!ctx) return;

    this.lineChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.monthlyLabels,
        datasets: [
          {
            label: 'Bourses',
            data: this.monthlyData.bourses,
            borderColor: '#2563EB',
            backgroundColor: 'rgba(37,99,235,.08)',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
          },
          {
            label: 'Visas',
            data: this.monthlyData.visas,
            borderColor: '#6366F1',
            backgroundColor: 'rgba(99,102,241,.08)',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
          },
          {
            label: 'Commandes',
            data: this.monthlyData.commandes,
            borderColor: '#10B981',
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

    this.pieChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: this.serviceData.map(s => s.name),
        datasets: [{
          data: this.serviceData.map(s => s.value),
          backgroundColor: this.serviceData.map(s => s.color),
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
            callbacks: {
              label: ctx => ` ${ctx.label}: ${ctx.parsed}%`,
            },
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
        labels: this.topUniversities.map(u => u.name),
        datasets: [{
          label: 'Étudiants',
          data: this.topUniversities.map(u => u.value),
          backgroundColor: this.universityColors,
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
}