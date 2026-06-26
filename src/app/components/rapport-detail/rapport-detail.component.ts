import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { RapportAnalyseService, RapportAnalyse } from '../../services/rapport-analyse/rapport-analyse.service';

@Component({
  selector: 'app-rapport-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rapport-detail.component.html',
  styleUrls: ['./rapport-detail.component.scss'],
})
export class RapportDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private rapportService = inject(RapportAnalyseService);

  rapport = signal<RapportAnalyse | null>(null);
  loading = signal(true);
  error = signal('');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadRapport(+id);
    }
  }

  private loadRapport(id: number): void {
    this.loading.set(true);
    this.rapportService.getRapportDetail(id).subscribe({
      next: (rapport) => {
        if (rapport) {
          this.rapport.set(rapport);
        } else {
          this.error.set('Rapport non trouvé');
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Erreur de chargement');
        this.loading.set(false);
      }
    });
  }

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

  getNoteColor(note: number | null): string {
    if (note === null) return '#6B7280';
    if (note >= 16) return '#22C55E';
    if (note >= 14) return '#3B82F6';
    if (note >= 12) return '#06B6D4';
    if (note >= 10) return '#F59E0B';
    return '#EF4444';
  }

  getDistributionItems(distribution: { [key: string]: number }): any[] {
    const labels: { [key: string]: { label: string; color: string } } = {
      'excellent': { label: 'Excellent (≥16)', color: '#22C55E' },
      'tres_bon': { label: 'Très bon (14-16)', color: '#3B82F6' },
      'bon': { label: 'Bon (12-14)', color: '#06B6D4' },
      'moyen': { label: 'Moyen (10-12)', color: '#F59E0B' },
      'insuffisant': { label: 'Insuffisant (<10)', color: '#EF4444' },
    };

    const total = Object.values(distribution).reduce((a, b) => a + b, 0);
    
    return Object.entries(distribution).map(([key, count]) => ({
      key,
      label: labels[key]?.label || key,
      color: labels[key]?.color || '#6B7280',
      count,
      percent: total > 0 ? (count / total) * 100 : 0,
    }));
  }

  goBack(): void {
    this.router.navigate(['/analytics']);
  }
}