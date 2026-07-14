import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';
import { RapportAnalyseService, RapportAnalyse, FiliereSuggeree } from '../../services/rapport-analyse/rapport-analyse.service';

@Component({
  selector: 'app-rapport-detail',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  templateUrl: './rapport-detail.component.html',
  styleUrls: ['./rapport-detail.component.scss'],
})
export class RapportDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private rapportService = inject(RapportAnalyseService);
  private translate = inject(TranslateService);

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
          this.error.set(this.translate.instant('RAPPORT_DETAIL.NOT_FOUND'));
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.translate.instant('RAPPORT_DETAIL.LOAD_ERROR'));
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
    const key = `RAPPORT_DETAIL.NIVEAU_${niveau.toUpperCase()}`;
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

  getDistributionItems(distribution: { [key: string]: number }): any[] {
    const labels: { [key: string]: { labelKey: string; color: string } } = {
      'excellent': { labelKey: 'RAPPORT_DETAIL.DIST_EXCELLENT', color: '#22C55E' },
      'tres_bon': { labelKey: 'RAPPORT_DETAIL.DIST_TRES_BON', color: '#3B82F6' },
      'bon': { labelKey: 'RAPPORT_DETAIL.DIST_BON', color: '#06B6D4' },
      'moyen': { labelKey: 'RAPPORT_DETAIL.DIST_MOYEN', color: '#F59E0B' },
      'insuffisant': { labelKey: 'RAPPORT_DETAIL.DIST_INSUFFISANT', color: '#EF4444' },
    };

    const total = Object.values(distribution).reduce((a, b) => a + b, 0);

    return Object.entries(distribution).map(([key, count]) => ({
      key,
      label: this.translate.instant(labels[key]?.labelKey || key),
      color: labels[key]?.color || '#6B7280',
      count,
      percent: total > 0 ? (count / total) * 100 : 0,
    }));
  }

  getEcartLabel(ecart: number): string {
    if (Math.abs(ecart) < 0.01) return this.translate.instant('RAPPORT_DETAIL_EXTRA.ECART_EXACT');
    if (ecart > 0) return this.translate.instant('RAPPORT_DETAIL_EXTRA.ECART_ABOVE', { value: `+${ecart.toFixed(1)}` });
    return this.translate.instant('RAPPORT_DETAIL_EXTRA.ECART_BELOW', { value: ecart.toFixed(1) });
  }

  getEcartColor(ecart: number): string {
    const abs = Math.abs(ecart);
    if (abs <= 0.5) return '#22C55E';
    if (abs <= 1) return '#3B82F6';
    if (abs <= 1.5) return '#F59E0B';
    return '#EF4444';
  }

  getNiveauDisplay(niveau: string): string {
    const key = `RAPPORT_DETAIL_EXTRA.NIVEAU_${niveau.toUpperCase()}`;
    const translated = this.translate.instant(key);
    return translated !== key ? translated : niveau;
  }

  goBack(): void {
    this.router.navigate(['/analytics']);
  }
}