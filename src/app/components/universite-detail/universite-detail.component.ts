import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  EtablissementService,
  EtablissementDetail,
} from '../../services/etablissement/etablissement.service';
import { AuthService } from '../../services/auth/auth.service';
import { FiliereBourseManagerComponent } from '../filiere-bourse-manager/filiere-bourse-manager.component';

@Component({
  selector: 'app-universite-detail',
  standalone: true,
  imports: [CommonModule, FiliereBourseManagerComponent],
  templateUrl: './universite-detail.component.html',
  styleUrl: './universite-detail.component.scss',
})
export class UniversiteDetailComponent implements OnInit {

  private readonly route     = inject(ActivatedRoute);
  private readonly router    = inject(Router);
  private readonly svc       = inject(EtablissementService);
  private readonly authService = inject(AuthService);

  isAdmin      = this.authService.isAdmin;
  etablissement = signal<EtablissementDetail | null>(null);
  loading      = signal(true);
  error        = signal('');
  etabId       = signal<number | null>(null);

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.router.navigate(['/dashboard-admin/universites']); return; }

    this.etabId.set(id);

    this.svc.getById(id).subscribe({
      next: data => { this.etablissement.set(data); this.loading.set(false); },
      error: err  => {
        this.error.set(err?.error?.detail ?? 'Impossible de charger cet établissement.');
        this.loading.set(false);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard-admin/universites']);
  }

  // ── Helpers ────────────────────────────────────────────────────
  getLogoText(nom: string): string {
    return nom.split(' ').slice(0, 2).map(w => w.charAt(0).toUpperCase()).join('');
  }

  getStatutClass(statut: string): string {
    const map: Record<string, string> = {
      actif: 'badge--actif', inactif: 'badge--inactif', suspendu: 'badge--suspendu',
    };
    return map[statut] ?? '';
  }

  getStatutLabel(statut: string): string {
    const map: Record<string, string> = { actif: 'Actif', inactif: 'Inactif', suspendu: 'Suspendu' };
    return map[statut] ?? statut;
  }

  openSite(url: string): void {
    if (!url) return;
    const full = url.startsWith('http') ? url : `https://${url}`;
    window.open(full, '_blank', 'noopener');
  }

  getTotalBourses(e: EtablissementDetail): number {
    return e.filieres.reduce((acc, f) => acc + f.bourses.length, 0);
  }
}