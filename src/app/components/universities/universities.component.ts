import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  EtablissementService,
  EtablissementListItem,
  EtablissementDetail,
  EtablissementPayload,
  EtablissementStatut,
  EtablissementFilters,
} from '../../services/etablissement/etablissement.service';
import { AuthService } from '../../services/auth/auth.service';
import { TranslateService, TranslatePipe } from '@ngx-translate/core';

// ── Types locaux ──────────────────────────────────────────────────────────────

type ModalMode = 'create' | 'edit';

interface Toast { message: string; type: 'success' | 'error'; }

// ── Constantes ────────────────────────────────────────────────────────────────

export const TYPE_OPTIONS = [
  { value: 'universite', labelKey: 'UNIVERSITIES.TYPE_UNIVERSITE' },
  { value: 'grande_ecole', labelKey: 'UNIVERSITIES.TYPE_GRANDE_ECOLE' },
  { value: 'institut', labelKey: 'UNIVERSITIES.TYPE_INSTITUT' },
  { value: 'ecole_superieure', labelKey: 'UNIVERSITIES.TYPE_ECOLE_SUPERIEURE' },
];

export const STATUT_OPTIONS: { value: EtablissementStatut; labelKey: string }[] = [
  { value: 'actif', labelKey: 'UNIVERSITE_DETAIL.STATUT_ACTIF' },
  { value: 'inactif', labelKey: 'UNIVERSITE_DETAIL.STATUT_INACTIF' },
  { value: 'suspendu', labelKey: 'UNIVERSITE_DETAIL.STATUT_SUSPENDU' },
];

// ── Component ─────────────────────────────────────────────────────────────────
@Component({
  selector: 'app-universities',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './universities.component.html',
  styleUrl: './universities.component.scss',
})
export class UniversitiesComponent implements OnInit {

  private readonly svc = inject(EtablissementService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly translate = inject(TranslateService);

  // ── Auth ──────────────────────────────────────────────────────
  isAdmin = this.authService.isAdmin;

  // ── Data state ─────────────────────────────────────────────────
  etablissements = signal<EtablissementListItem[]>([]);
  loading = signal(false);
  error = signal('');

  // ── Filters ───────────────────────────────────────────────────
  searchQuery = '';
  filterStatut = '';
  filterPays = '';

  // ── Filtered list ─────────────────────────────────────────────
  filtered = computed(() => {
    const q = this.searchQuery.toLowerCase().trim();
    return this.etablissements().filter(e => {
      const matchSearch = !q ||
        e.nom.toLowerCase().includes(q) ||
        e.pays.toLowerCase().includes(q) ||
        e.ville.toLowerCase().includes(q);
      const matchStatut = !this.filterStatut || e.statut === this.filterStatut;
      const matchPays = !this.filterPays || e.pays.toLowerCase().includes(this.filterPays.toLowerCase());
      return matchSearch && matchStatut && matchPays;
    });
  });

  // ── Unique pays for filter dropdown ───────────────────────────
  get paysList(): string[] {
    return [...new Set(this.etablissements().map(e => e.pays))].sort();
  }

  // ── Modal ─────────────────────────────────────────────────────
  showModal = false;
  modalMode: ModalMode = 'create';
  editTarget: EtablissementListItem | null = null;
  modalLoading = false;
  modalError = '';
  modalSuccess = false;

  readonly typeOptions = TYPE_OPTIONS;
  readonly statutOptions = STATUT_OPTIONS;

  // ── Computed options with translations ─────────────────────────────
  get typeOptionsWithLabels() {
    return this.typeOptions.map(opt => ({
      value: opt.value,
      label: this.translate.instant(opt.labelKey)
    }));
  }

  get statutOptionsWithLabels() {
    return this.statutOptions.map(opt => ({
      value: opt.value,
      label: this.translate.instant(opt.labelKey)
    }));
  }

  form!: FormGroup;

  // ── Delete confirm ────────────────────────────────────────────
  showDeleteConfirm = false;
  deleteTarget: EtablissementListItem | null = null;
  deleteLoading = false;

  // ── Toast ─────────────────────────────────────────────────────
  toast: Toast | null = null;
  private toastTimer: any;

  // ── Lifecycle ──────────────────────────────────────────────────
  ngOnInit(): void {
    this._buildForm();
    this.load();
  }

  // ── Load ──────────────────────────────────────────────────────
  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.svc.getAll().subscribe({
      next: list => { this.etablissements.set(list); this.loading.set(false); },
      error: err => {
        this.error.set(err?.error?.detail ?? this.translate.instant('UNIVERSITIES.LOAD_ERROR'));
        this.loading.set(false);
      },
    });
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
    const opt = STATUT_OPTIONS.find(s => s.value === statut);
    return opt ? this.translate.instant(opt.labelKey) : statut;
  }

  // ── Navigation ────────────────────────────────────────────────
  openDetails(uni: EtablissementListItem): void {
    this.router.navigate(['/dashboard-admin/universites', uni.id]);
  }

  // ── Modal ─────────────────────────────────────────────────────
  openCreate(): void {
    this.modalMode = 'create';
    this.editTarget = null;
    this.modalError = '';
    this.modalSuccess = false;
    this.form.reset({ type_etablissement: 'universite', statut: 'actif' });
    this.showModal = true;
  }

  openEdit(e: EtablissementListItem, event: Event): void {
    event.stopPropagation();
    this.modalMode = 'edit';
    this.editTarget = e;
    this.modalError = '';
    this.modalSuccess = false;
    this.form.patchValue({
      nom: e.nom,
      type_etablissement: e.type_etablissement,
      pays: e.pays,
      ville: e.ville,
      langue_enseignement: e.langue_enseignement,
      classement: e.classement,
      classement_source: e.classement_source,
      site_web: e.site_web,
      statut: e.statut,
    });
    this.showModal = true;
  }

  closeModal(): void {
    if (this.modalLoading) return;
    this.showModal = false;
  }

  isInvalid(field: string): boolean {
    const c = this.form.get(field);
    return !!c && c.invalid && c.touched;
  }

  submitForm(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.modalLoading = true;
    this.modalError = '';

    const raw = this.form.value;
    const payload: EtablissementPayload = {
      nom: raw.nom,
      type_etablissement: raw.type_etablissement || undefined,
      pays: raw.pays,
      ville: raw.ville,
      adresse: raw.adresse || undefined,
      code_postal: raw.code_postal || undefined,
      description: raw.description || undefined,
      site_web: raw.site_web || undefined,
      email_contact: raw.email_contact || undefined,
      telephone: raw.telephone || undefined,
      classement: raw.classement ? +raw.classement : null,
      classement_source: raw.classement_source || undefined,
      annee_fondation: raw.annee_fondation ? +raw.annee_fondation : null,
      langue_enseignement: raw.langue_enseignement || undefined,
      statut: raw.statut || 'actif',
      partenaire_depuis: raw.partenaire_depuis || null,
    };

    const op$ = this.modalMode === 'create'
      ? this.svc.create(payload)
      : this.svc.update(this.editTarget!.id, payload);

    op$.subscribe({
      next: (saved) => {
        this.modalLoading = false;
        this.modalSuccess = true;
        this.load();
        this._showToast(
          this.modalMode === 'create'
            ? this.translate.instant('UNIVERSITIES.TOAST_CREATED', { name: saved.nom })
            : this.translate.instant('UNIVERSITIES.TOAST_UPDATED', { name: saved.nom }),
          'success'
        );
        setTimeout(() => this.closeModal(), 1200);
      },
      error: (err) => {
        this.modalLoading = false;
        const body = err?.error;

        // Le backend enveloppe les erreurs dans body.errors
        const errors = body?.errors ?? body;

        if (errors && typeof errors === 'object' && !errors.detail) {
          this.modalError = Object.entries(errors)
            .map(([f, msgs]) => {
              if (Array.isArray(msgs)) {
                return `${f} : ${msgs.join(', ')}`;
              }
              return `${f} : ${msgs}`;
            })
            .join(' | ');
        } else {
          this.modalError = body?.detail ?? body?.message ?? this.translate.instant('UNIVERSITIES.ERROR_OCCURRED');
        }
      },
    });
  }

  // ── Delete ─────────────────────────────────────────────────────
  confirmDelete(e: EtablissementListItem, event: Event): void {
    event.stopPropagation();
    this.deleteTarget = e;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deleteTarget = null;
  }

  doDelete(): void {
    if (!this.deleteTarget) return;
    this.deleteLoading = true;
    this.svc.delete(this.deleteTarget.id).subscribe({
      next: () => {
        this._showToast(this.translate.instant('UNIVERSITIES.TOAST_DELETED', { name: this.deleteTarget!.nom }), 'success');
        this.deleteLoading = false;
        this.showDeleteConfirm = false;
        this.deleteTarget = null;
        this.load();
      },
      error: (err) => {
        this.deleteLoading = false;
        this._showToast(err?.error?.detail ?? this.translate.instant('UNIVERSITIES.TOAST_DELETE_ERROR'), 'error');
      },
    });
  }

  // ── Toast ─────────────────────────────────────────────────────
  private _showToast(message: string, type: 'success' | 'error'): void {
    clearTimeout(this.toastTimer);
    this.toast = { message, type };
    this.toastTimer = setTimeout(() => { this.toast = null; }, 3800);
  }

  // ── Form builder ──────────────────────────────────────────────
  private _buildForm(): void {
    this.form = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      type_etablissement: ['universite'],
      pays: ['', Validators.required],
      ville: ['', Validators.required],
      adresse: [''],
      code_postal: [''],
      description: [''],
      site_web: [''],
      email_contact: ['', Validators.email],
      telephone: [''],
      classement: [null],
      classement_source: [''],
      annee_fondation: [null],
      langue_enseignement: [''],
      statut: ['actif'],
      partenaire_depuis: [null],
    });
  }
}