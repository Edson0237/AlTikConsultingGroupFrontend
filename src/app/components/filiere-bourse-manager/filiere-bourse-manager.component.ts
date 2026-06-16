import {
  Component, Input, OnInit, inject, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, Validators,
} from '@angular/forms';
import {
  FiliereBourseService,
  Filiere,
  EtablissementFiliere,
  Bourse,
  BoursePayload,
  EtablissementFilierePayload,
  EtablissementFiliereUpdatePayload,
  PeriodeBoursePayload,
  DocumentRequisPayload,
  FilierePayload,
} from '../../services/filiere-bourse/filiere-bourse.service';
import { AuthService } from '../../services/auth/auth.service';

// ── Types ─────────────────────────────────────────────────────────────────────

type ModalType =
  | 'create-filiere'       // ← NOUVEAU : créer dans le référentiel
  | 'associer-filiere'
  | 'edit-filiere'
  | 'bourse-create'
  | 'bourse-edit'
  | 'periode-create'
  | 'document-create';

interface Toast { message: string; type: 'success' | 'error'; }

// ── Constantes ────────────────────────────────────────────────────────────────

export const TYPE_BOURSE_OPTIONS = [
  { value: 'totale',    label: 'Bourse totale'    },
  { value: 'partielle', label: 'Bourse partielle' },
  { value: 'logement',  label: 'Bourse logement'  },
  { value: 'transport', label: 'Bourse transport' },
  { value: 'mixte',     label: 'Mixte'            },
];

export const STATUT_BOURSE_OPTIONS = [
  { value: 'ouverte', label: 'Ouverte'  },
  { value: 'fermee',  label: 'Fermée'   },
  { value: 'a_venir', label: 'À venir'  },
  { value: 'expiree', label: 'Expirée'  },
];

export const TYPE_DOC_OPTIONS = [
  { value: 'cv',                label: 'CV'                       },
  { value: 'lettre_motivation', label: 'Lettre de motivation'     },
  { value: 'releve_notes',      label: 'Relevé de notes'          },
  { value: 'diplome',           label: 'Diplôme'                  },
  { value: 'passeport',         label: "Passeport / Pièce d'id"   },
  { value: 'photo',             label: "Photo d'identité"         },
  { value: 'recommandation',    label: 'Lettre de recommandation' },
  { value: 'autre',             label: 'Autre'                    },
];

export const DOMAINE_OPTIONS = [
  { value: 'informatique',      label: 'Informatique & Numérique'   },
  { value: 'gestion',           label: 'Gestion & Management'       },
  { value: 'droit',             label: 'Droit & Sciences Politiques'},
  { value: 'medecine',          label: 'Médecine & Santé'           },
  { value: 'ingenierie',        label: 'Ingénierie & Sciences'      },
  { value: 'lettres',           label: 'Lettres & Langues'          },
  { value: 'arts',              label: 'Arts & Design'              },
  { value: 'economie',          label: 'Économie & Finance'         },
  { value: 'sciences_sociales', label: 'Sciences Sociales'          },
  { value: 'autre',             label: 'Autre'                      },
];

export const NIVEAU_OPTIONS = [
  { value: 'bts',      label: 'BTS / DUT (Bac+2)'  },
  { value: 'licence',  label: 'Licence (Bac+3)'    },
  { value: 'master',   label: 'Master (Bac+5)'     },
  { value: 'doctorat', label: 'Doctorat (Bac+8)'   },
  { value: 'autre',    label: 'Autre'               },
];

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector:    'app-filiere-bourse-manager',
  standalone:  true,
  imports:     [CommonModule, ReactiveFormsModule],
  templateUrl: './filiere-bourse-manager.component.html',
  styleUrl:    './filiere-bourse-manager.component.scss',
})
export class FiliereBourseManagerComponent implements OnInit {

  @Input({ required: true }) etabId!: number;

  private readonly svc     = inject(FiliereBourseService);
  private readonly authSvc = inject(AuthService);
  private readonly fb      = inject(FormBuilder);

  // ── Auth ──────────────────────────────────────────────────────
  // Wrapping défensif : fonctionne que authSvc.isAdmin soit un Signal,
  // un boolean, un getter ou un computed.
  isAdmin = computed(() => {
    const v = this.authSvc.isAdmin;
    if (typeof v === 'function') return (v as () => boolean)();
    return !!v;
  });

  // ── Data ──────────────────────────────────────────────────────
  filieres        = signal<EtablissementFiliere[]>([]);
  filieresCatalog = signal<Filiere[]>([]);
  loading         = signal(false);
  error           = signal('');

  loadingCatalog = signal(false);
  errorCatalog   = signal('');

  // ── Accordion ─────────────────────────────────────────────────
  expandedFiliereId = signal<number | null>(null);

  // ── Modal ─────────────────────────────────────────────────────
  modalType    = signal<ModalType | null>(null);
  modalLoading = signal(false);
  modalError   = signal('');
  modalSuccess = signal(false);

  currentEtabFiliere = signal<EtablissementFiliere | null>(null);
  currentBourse      = signal<Bourse | null>(null);

  // ── Confirm delete filière ────────────────────────────────────
  showDeleteFiliere   = false;
  deleteFilierTarget: EtablissementFiliere | null = null;
  deleteFilierLoading = false;

  // ── Forms ─────────────────────────────────────────────────────
  createFiliereForm!: FormGroup;   // ← NOUVEAU
  filiereForm!:       FormGroup;
  editFiliereForm!:   FormGroup;
  bourseForm!:        FormGroup;
  periodeForm!:       FormGroup;
  documentForm!:      FormGroup;

  // ── Options ───────────────────────────────────────────────────
  readonly typeBourseOptions   = TYPE_BOURSE_OPTIONS;
  readonly statutBourseOptions = STATUT_BOURSE_OPTIONS;
  readonly typeDocOptions      = TYPE_DOC_OPTIONS;
  readonly domaineOptions      = DOMAINE_OPTIONS;
  readonly niveauOptions       = NIVEAU_OPTIONS;

  // ── Computed : filières du catalogue non encore associées ─────
  catalogAvailable = computed(() => {
    const associatedIds = new Set(this.filieres().map(ef => ef.filiere));
    return this.filieresCatalog().filter(f => !associatedIds.has(f.id));
  });

  // ── Toast ─────────────────────────────────────────────────────
  toast = signal<Toast | null>(null);
  private toastTimer: ReturnType<typeof setTimeout> | null = null;

  // ── Lifecycle ─────────────────────────────────────────────────
  ngOnInit(): void {
    this._buildForms();
    this.loadFilieres();
    this._loadCatalog();
  }

  // ── Chargement des filières associées ─────────────────────────
  loadFilieres(): void {
    this.loading.set(true);
    this.error.set('');
    this.svc.getEtablissementFilieres(this.etabId).subscribe({
      next:  data => { this.filieres.set(data); this.loading.set(false); },
      error: err  => {
        this.error.set(err?.error?.detail ?? 'Impossible de charger les filières.');
        this.loading.set(false);
      },
    });
  }

  // ── Chargement du catalogue global ────────────────────────────
  private _loadCatalog(): void {
    console.log('[FiliereBourseManager] _loadCatalog() → GET filieres/');
    this.loadingCatalog.set(true);
    this.errorCatalog.set('');
    this.svc.getFilieres().subscribe({
      next:  data => {
        console.log('[FiliereBourseManager] catalogue chargé:', data.length, 'filières', data);
        this.filieresCatalog.set(data);
        this.loadingCatalog.set(false);
      },
      error: err  => {
        console.error('[FiliereBourseManager] erreur catalogue:', err);
        this.errorCatalog.set(err?.error?.detail ?? 'Impossible de charger le catalogue.');
        this.loadingCatalog.set(false);
      },
    });
  }

  // ── Accordion ─────────────────────────────────────────────────
  toggleFiliere(id: number): void {
    this.expandedFiliereId.update(cur => cur === id ? null : id);
  }

  isExpanded(id: number): boolean {
    return this.expandedFiliereId() === id;
  }

  // ── Modal helpers ─────────────────────────────────────────────
  private openModal(type: ModalType): void {
    this.modalType.set(type);
    this.modalError.set('');
    this.modalSuccess.set(false);
    this.modalLoading.set(false);
  }

  closeModal(): void {
    if (this.modalLoading()) return;
    this.modalType.set(null);
    this.currentEtabFiliere.set(null);
    this.currentBourse.set(null);
  }

  isInvalid(form: FormGroup, field: string): boolean {
    const c = form.get(field);
    return !!c && c.invalid && c.touched;
  }

  // ── NOUVEAU : Créer une filière dans le référentiel ───────────
  openCreateFiliere(): void {
    this.createFiliereForm.reset({ duree: 2 });
    this.openModal('create-filiere');
  }

  submitCreateFiliereForm(): void {
    if (this.createFiliereForm.invalid) {
      this.createFiliereForm.markAllAsTouched();
      return;
    }
    this.modalLoading.set(true);

    const raw = this.createFiliereForm.value;
    const payload: FilierePayload = {
      nom:         raw.nom.trim(),
      domaine:     raw.domaine,
      niveau:      raw.niveau,
      duree:       +raw.duree,
      description: raw.description || '',
      debouches:   raw.debouches   || '',
    };

    this.svc.createFiliere(payload).subscribe({
      next: (filiere) => {
        this.modalLoading.set(false);
        this.modalSuccess.set(true);
        this._loadCatalog();
        this._showToast(`Filière « ${filiere.nom} » créée avec succès.`, 'success');
        setTimeout(() => {
          this.closeModal();
          this._openAssocierWithFiliere(filiere.id);
        }, 1000);
      },
      error: err => {
        this.modalLoading.set(false);
        this.modalError.set(this._extractError(err));
      },
    });
  }

  // ── Ouvre le modal "Associer" et pré-sélectionne une filière ──
  private _openAssocierWithFiliere(filiereId: number): void {
    this.filiereForm.reset({ devise: 'EUR', actif: true });
    // On attend que le catalogue soit rechargé pour pré-sélectionner
    const trySelect = () => {
      const found = this.filieresCatalog().find(f => f.id === filiereId);
      if (found) {
        this.filiereForm.patchValue({ filiere: filiereId });
      }
    };
    setTimeout(trySelect, 300);
    this.openModal('associer-filiere');
  }

  // ── Debug select ──────────────────────────────────────────────
  onFiliereChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    console.log('[FiliereBourseManager] select changé, valeur DOM:', val, typeof val);
    console.log('  → FormControl filiere:', this.filiereForm.get('filiere')?.value, this.filiereForm.get('filiere')?.valid);
  }

  // ── Associer une filière ──────────────────────────────────────
  openAssocierFiliere(): void {
    console.log('[FiliereBourseManager] openAssocierFiliere() appelé');
    console.log('  → isAdmin:', this.isAdmin());
    console.log('  → filieresCatalog:', this.filieresCatalog().length, 'filières');
    console.log('  → loadingCatalog:', this.loadingCatalog());
    console.log('  → catalogAvailable:', this.catalogAvailable().length, 'disponibles');

    if (this.filieresCatalog().length === 0 && !this.loadingCatalog()) {
      console.log('  → Catalogue vide, rechargement…');
      this._loadCatalog();
    }
    this.filiereForm.reset({ devise: 'EUR', actif: true });
    this.openModal('associer-filiere');
    console.log('  → modalType après ouverture:', this.modalType());
  }

  submitFiliereForm(): void {
    console.log('[FiliereBourseManager] submitFiliereForm() appelé');
    console.log('  → form valide:', this.filiereForm.valid);
    console.log('  → form valeur:', this.filiereForm.value);

    // Log de tous les contrôles invalides pour diagnostiquer
    Object.keys(this.filiereForm.controls).forEach(key => {
      const ctrl = this.filiereForm.get(key);
      if (ctrl && ctrl.invalid) {
        console.log(`  → Champ invalide: "${key}"`, ctrl.value, ctrl.errors);
      }
    });

    if (this.filiereForm.invalid) { this.filiereForm.markAllAsTouched(); return; }
    this.modalLoading.set(true);

    const raw = this.filiereForm.value;
    const payload: EtablissementFilierePayload = {
      filiere:            raw.filiere,   // déjà un number grâce à [ngValue]
      score_minimal:      raw.score_minimal      || null,
      frais_scolarite:    raw.frais_scolarite     || null,
      devise:             raw.devise              || 'EUR',
      langue:             raw.langue              || '',
      places_disponibles: raw.places_disponibles  || null,
      actif:              raw.actif ?? true,
    };

    this.svc.associerFiliere(this.etabId, payload).subscribe({
      next: () => {
        this.modalLoading.set(false);   // ← remettre à false AVANT closeModal
        this.modalSuccess.set(true);
        this.loadFilieres();
        this._showToast('Filière associée avec succès.', 'success');
        setTimeout(() => this.closeModal(), 1200);
      },
      error: err => {
        this.modalLoading.set(false);
        this.modalError.set(this._extractError(err));
      },
    });
  }

  // ── Modifier les conditions d'une filière associée ────────────
  openEditFiliere(ef: EtablissementFiliere, event: Event): void {
    event.stopPropagation();
    this.currentEtabFiliere.set(ef);
    this.editFiliereForm.patchValue({
      score_minimal:      ef.score_minimal,
      frais_scolarite:    ef.frais_scolarite,
      devise:             ef.devise || 'EUR',
      langue:             ef.langue,
      places_disponibles: ef.places_disponibles,
      actif:              ef.actif,
    });
    this.openModal('edit-filiere');
  }

  submitEditFiliereForm(): void {
    if (this.editFiliereForm.invalid) { this.editFiliereForm.markAllAsTouched(); return; }
    this.modalLoading.set(true);

    const raw = this.editFiliereForm.value;
    const payload: EtablissementFiliereUpdatePayload = {
      score_minimal:      raw.score_minimal      ?? null,
      frais_scolarite:    raw.frais_scolarite     ?? null,
      devise:             raw.devise              || 'EUR',
      langue:             raw.langue              || '',
      places_disponibles: raw.places_disponibles  ?? null,
      actif:              raw.actif ?? true,
    };

    this.svc.updateEtablissementFiliere(this.currentEtabFiliere()!.id, payload).subscribe({
      next: () => {
        this.modalLoading.set(false);
        this.modalSuccess.set(true);
        this.loadFilieres();
        this._showToast('Conditions de la filière mises à jour.', 'success');
        setTimeout(() => this.closeModal(), 1200);
      },
      error: err => {
        this.modalLoading.set(false);
        this.modalError.set(this._extractError(err));
      },
    });
  }

  // ── Supprimer une filière associée ────────────────────────────
  confirmDeleteFiliere(ef: EtablissementFiliere, event: Event): void {
    event.stopPropagation();
    this.deleteFilierTarget = ef;
    this.showDeleteFiliere  = true;
  }

  cancelDeleteFiliere(): void {
    this.showDeleteFiliere  = false;
    this.deleteFilierTarget = null;
  }

  doDeleteFiliere(): void {
    if (!this.deleteFilierTarget) return;
    this.deleteFilierLoading = true;
    this.svc.deleteEtablissementFiliere(this.deleteFilierTarget.id).subscribe({
      next: () => {
        const nom = this.deleteFilierTarget!.filiere_detail.nom;
        this._showToast(`Filière « ${nom} » dissociée.`, 'success');
        this.deleteFilierLoading = false;
        this.showDeleteFiliere   = false;
        this.deleteFilierTarget  = null;
        this.loadFilieres();
      },
      error: err => {
        this.deleteFilierLoading = false;
        this._showToast(this._extractError(err), 'error');
      },
    });
  }

  // ── Créer / Modifier une bourse ───────────────────────────────
  openCreateBourse(ef: EtablissementFiliere): void {
    this.currentEtabFiliere.set(ef);
    this.bourseForm.reset({ statut: 'a_venir', devise: 'EUR', nombre_bourses: 1 });
    this.openModal('bourse-create');
  }

  openEditBourse(bourse: Bourse): void {
    this.currentBourse.set(bourse);
    this.bourseForm.patchValue({
      nom:                    bourse.nom,
      type_bourse:            bourse.type_bourse,
      description:            bourse.description,
      montant:                bourse.montant,
      pourcentage_couverture: bourse.pourcentage_couverture,
      devise:                 bourse.devise,
      nombre_bourses:         bourse.nombre_bourses,
      statut:                 bourse.statut,
      conditions_eligibilite: bourse.conditions_eligibilite,
      niveau_requis:          bourse.niveau_requis,
      nationalite_eligible:   bourse.nationalite_eligible,
    });
    this.openModal('bourse-edit');
  }

  submitBourseForm(): void {
    if (this.bourseForm.invalid) { this.bourseForm.markAllAsTouched(); return; }
    this.modalLoading.set(true);

    const raw    = this.bourseForm.value;
    const isEdit = this.modalType() === 'bourse-edit';

    const payload: BoursePayload = {
      etablissement_filiere:  this.currentEtabFiliere()?.id
                              ?? this.currentBourse()!.etablissement_filiere,
      nom:                    raw.nom,
      type_bourse:            raw.type_bourse,
      description:            raw.description            || '',
      montant:                raw.montant                || null,
      pourcentage_couverture: raw.pourcentage_couverture || null,
      devise:                 raw.devise                 || 'EUR',
      nombre_bourses:         raw.nombre_bourses         || 1,
      statut:                 raw.statut                 || 'a_venir',
      conditions_eligibilite: raw.conditions_eligibilite || '',
      niveau_requis:          raw.niveau_requis          || '',
      nationalite_eligible:   raw.nationalite_eligible   || '',
    };

    const op$ = isEdit
      ? this.svc.updateBourse(this.currentBourse()!.id, payload)
      : this.svc.createBourse(payload);

    op$.subscribe({
      next: () => {
        this.modalLoading.set(false);
        this.modalSuccess.set(true);
        this.loadFilieres();
        this._showToast(
          isEdit ? 'Bourse mise à jour.' : 'Bourse créée avec succès.',
          'success',
        );
        setTimeout(() => this.closeModal(), 1200);
      },
      error: err => {
        this.modalLoading.set(false);
        this.modalError.set(this._extractError(err));
      },
    });
  }

  deleteBourse(bourse: Bourse): void {
    if (!confirm(`Supprimer la bourse « ${bourse.nom} » ?`)) return;
    this.svc.deleteBourse(bourse.id).subscribe({
      next:  () => { this._showToast('Bourse supprimée.', 'success'); this.loadFilieres(); },
      error: () => this._showToast('Erreur lors de la suppression.', 'error'),
    });
  }

  // ── Ajouter une période ───────────────────────────────────────
  openCreatePeriode(bourse: Bourse): void {
    this.currentBourse.set(bourse);
    this.periodeForm.reset({ annee: new Date().getFullYear() });
    this.openModal('periode-create');
  }

  submitPeriodeForm(): void {
    if (this.periodeForm.invalid) { this.periodeForm.markAllAsTouched(); return; }
    this.modalLoading.set(true);

    const raw = this.periodeForm.value;

    // Validation croisée dates
    if (raw.date_cloture && raw.date_ouverture && raw.date_cloture <= raw.date_ouverture) {
      this.modalLoading.set(false);
      this.modalError.set('La date de clôture doit être postérieure à la date d\'ouverture.');
      return;
    }

    if (raw.date_annonce_resultats && raw.date_cloture && raw.date_annonce_resultats <= raw.date_cloture) {
      this.modalLoading.set(false);
      this.modalError.set('La date d\'annonce des résultats doit être postérieure à la date de clôture.');
      return;
    }

    const payload: PeriodeBoursePayload = {
      annee:                  +raw.annee,
      date_ouverture:         raw.date_ouverture,
      date_cloture:           raw.date_cloture,
      date_annonce_resultats: raw.date_annonce_resultats || null,
      places_cette_periode:   raw.places_cette_periode   || null,
      notes:                  raw.notes                  || '',
    };

    this.svc.createPeriode(this.currentBourse()!.id, payload).subscribe({
      next: () => {
        this.modalLoading.set(false);
        this.modalSuccess.set(true);
        this.loadFilieres();
        this._showToast('Période ajoutée.', 'success');
        setTimeout(() => this.closeModal(), 1200);
      },
      error: err => {
        this.modalLoading.set(false);
        this.modalError.set(this._extractError(err));
      },
    });
  }

  // ── Ajouter un document requis ────────────────────────────────
  openCreateDocument(bourse: Bourse): void {
    this.currentBourse.set(bourse);
    this.documentForm.reset({ obligatoire: true });
    this.openModal('document-create');
  }

  submitDocumentForm(): void {
    if (this.documentForm.invalid) { this.documentForm.markAllAsTouched(); return; }
    this.modalLoading.set(true);

    const raw = this.documentForm.value;
    const payload: DocumentRequisPayload = {
      type_document:  raw.type_document,
      nom_document:   raw.nom_document,
      obligatoire:    raw.obligatoire ?? true,
      description:    raw.description    || '',
      format_accepte: raw.format_accepte || '',
    };

    this.svc.createDocument(this.currentBourse()!.id, payload).subscribe({
      next: () => {
        this.modalLoading.set(false);
        this.modalSuccess.set(true);
        this.loadFilieres();
        this._showToast('Document ajouté.', 'success');
        setTimeout(() => this.closeModal(), 1200);
      },
      error: err => {
        this.modalLoading.set(false);
        this.modalError.set(this._extractError(err));
      },
    });
  }

  // ── UI helpers ────────────────────────────────────────────────
  getBourseStatutClass(statut: string): string {
    const map: Record<string, string> = {
      ouverte: 'badge--ouverte',
      fermee:  'badge--fermee',
      a_venir: 'badge--a-venir',
      expiree: 'badge--expiree',
    };
    return map[statut] ?? '';
  }

  // ── Toast ─────────────────────────────────────────────────────
  private _showToast(message: string, type: 'success' | 'error'): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toast.set({ message, type });
    this.toastTimer = setTimeout(() => this.toast.set(null), 3800);
  }

  // ── Extracteur d'erreurs backend ──────────────────────────────
  private _extractError(err: any): string {
    const body   = err?.error;
    const errors = body?.errors ?? body;
    if (errors && typeof errors === 'object' && !errors.detail) {
      return Object.entries(errors)
        .map(([f, msgs]) =>
          `${f} : ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`,
        )
        .join(' | ');
    }
    return body?.detail ?? body?.message ?? 'Une erreur est survenue.';
  }

  // ── Form builders ─────────────────────────────────────────────
  private _buildForms(): void {

    // ── NOUVEAU : Créer une filière dans le référentiel ──────────
    this.createFiliereForm = this.fb.group({
      nom:         ['', [Validators.required, Validators.minLength(2)]],
      domaine:     ['', Validators.required],
      niveau:      ['', Validators.required],
      duree:       [2,  [Validators.required, Validators.min(1), Validators.max(10)]],
      description: [''],
      debouches:   [''],
    });

    this.filiereForm = this.fb.group({
      filiere:            [null, [Validators.required, Validators.min(1)]],
      score_minimal:      [null],
      frais_scolarite:    [null],
      devise:             ['EUR'],
      langue:             [''],
      places_disponibles: [null],
      actif:              [true],
    });

    this.editFiliereForm = this.fb.group({
      score_minimal:      [null],
      frais_scolarite:    [null],
      devise:             ['EUR'],
      langue:             [''],
      places_disponibles: [null],
      actif:              [true],
    });

    this.bourseForm = this.fb.group({
      nom:                    ['', [Validators.required, Validators.minLength(2)]],
      type_bourse:            ['', Validators.required],
      description:            [''],
      montant:                [null],
      pourcentage_couverture: [null],
      devise:                 ['EUR'],
      nombre_bourses:         [1],
      statut:                 ['a_venir'],
      conditions_eligibilite: [''],
      niveau_requis:          [''],
      nationalite_eligible:   [''],
    });

    this.periodeForm = this.fb.group({
      annee:                  [new Date().getFullYear(), Validators.required],
      date_ouverture:         ['', Validators.required],
      date_cloture:           ['', Validators.required],
      date_annonce_resultats: [null],
      places_cette_periode:   [null],
      notes:                  [''],
    });

    this.documentForm = this.fb.group({
      type_document:  ['', Validators.required],
      nom_document:   ['', Validators.required],
      obligatoire:    [true],
      description:    [''],
      format_accepte: [''],
    });
  }
}