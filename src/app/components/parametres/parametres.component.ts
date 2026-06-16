import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';
import {
  FormsModule, ReactiveFormsModule,
  FormBuilder, FormGroup, Validators, AbstractControl,
} from '@angular/forms';
import { AuthService, UserInfo, UpdateProfilePayload } from '../../services/auth/auth.service';
import { ConseillerService, Conseiller, ConseillerUpdatePayload } from '../../services/conseiller/conseiller.service';

// ── SVG icons ─────────────────────────────────────────────────────────────────
const ICON = {
  user:    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`,
  shield:  `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  bell:    `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  globe:   `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  palette: `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>`,
};

export interface Tab       { id: string; label: string; icon: string; }
export interface NotifPref { key: string; label: string; desc: string; enabled: boolean; }

@Component({
  selector:   'app-parametres',
  standalone: true,
  imports:    [CommonModule, FormsModule, ReactiveFormsModule, TitleCasePipe],
  templateUrl: './parametres.component.html',
  styleUrls:  ['./parametres.component.scss'],
})
export class ParametresComponent implements OnInit {

  private fb               = inject(FormBuilder);
  private authService      = inject(AuthService);
  private conseillerService = inject(ConseillerService);

  // ── Auth shortcuts ────────────────────────────────────────────
  get currentUser():  UserInfo | null { return this.authService.currentUser(); }
  get isAdmin():      boolean         { return this.authService.isAdmin(); }
  get userFullName(): string          { return this.authService.userFullName(); }

  get userInitials(): string {
    const u = this.currentUser;
    if (!u) return 'AD';
    const f = u.firstName?.charAt(0) ?? '';
    const l = u.lastName?.charAt(0)  ?? '';
    return (f + l).toUpperCase() || u.email.charAt(0).toUpperCase();
  }

  // ── Tabs ──────────────────────────────────────────────────────
  activeTab = 'profile';

  readonly tabs: Tab[] = [
    { id: 'profile',       label: 'Profil',        icon: ICON.user    },
    { id: 'security',      label: 'Sécurité',      icon: ICON.shield  },
    { id: 'notifications', label: 'Notifications', icon: ICON.bell    },
    { id: 'system',        label: 'Système',        icon: ICON.globe   },
    { id: 'appearance',    label: 'Apparence',      icon: ICON.palette },
  ];

  // ── Forms ─────────────────────────────────────────────────────
  profileForm!:    FormGroup;
  passwordForm!:   FormGroup;
  systemForm!:     FormGroup;
  appearanceForm!: FormGroup;
  advisorForm!:    FormGroup;
  editForm!:       FormGroup;

  // ── Profil state ──────────────────────────────────────────────
  profileLoading  = false;
  profileSuccess  = false;
  profileError    = '';

  constructor() {
    this.profileForm = this.fb.group({
      firstName: [''],
      lastName:  [''],
      email:     ['', [Validators.required, Validators.email]],
      phone:     [''],
      adresse:   [''],
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword:     ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
    });

    this.systemForm = this.fb.group({
      language:   ['fr'],
      timezone:   ['utc1'],
      dateFormat: ['DD/MM/YYYY'],
    });

    this.appearanceForm = this.fb.group({
      theme:           ['light'],
      sidebarPosition: ['left'],
    });

    this.advisorForm = this.fb.group({
      username:  ['', Validators.required],
      firstName: [''],
      lastName:  [''],
      email:     ['', [Validators.required, Validators.email]],
      phone:     [''],
      adresse:   [''],
      password:  ['', [Validators.required, Validators.minLength(8)]],
      password2: ['', Validators.required],
    }, { validators: this._passwordsMatch });

    this.editForm = this.fb.group({
      firstName: [''],
      lastName:  [''],
      email:     ['', [Validators.required, Validators.email]],
      telephone: [''],
      adresse:   [''],
      role:      ['conseiller'],
    });
  }

  // ── Lifecycle ─────────────────────────────────────────────────
  ngOnInit(): void {
    // 1. Pré-remplir depuis le signal (données JWT)
    this._patchProfileForm(this.currentUser);

    // 2. Récupérer les données complètes depuis l'API (telephone, adresse non stockés dans JWT)
    this.authService.fetchProfile().subscribe({
      next:  (apiUser) => {
        // fetchProfile met à jour le signal → on re-patche le form avec les données complètes
        this._patchProfileFormFromApi(apiUser);
      },
      error: () => { /* non bloquant : le form reste pré-rempli depuis le JWT */ },
    });

    if (this.isAdmin) this.loadConseillers();
  }

  // ── Profile ───────────────────────────────────────────────────

  /** Pré-remplit le formulaire depuis le signal UserInfo */
  private _patchProfileForm(u: UserInfo | null): void {
    if (!u) return;
    this.profileForm.patchValue({
      firstName: u.firstName ?? '',
      lastName:  u.lastName  ?? '',
      email:     u.email     ?? '',
      phone:     u.telephone ?? '',
      adresse:   u.adresse   ?? '',
    });
  }

  /** Pré-remplit le formulaire depuis l'objet ApiUser complet */
  private _patchProfileFormFromApi(apiUser: {
    first_name: string; last_name: string; email: string;
    telephone: string | null; adresse: string | null;
  }): void {
    this.profileForm.patchValue({
      firstName: apiUser.first_name ?? '',
      lastName:  apiUser.last_name  ?? '',
      email:     apiUser.email      ?? '',
      phone:     apiUser.telephone  ?? '',
      adresse:   apiUser.adresse    ?? '',
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.profileLoading = true;
    this.profileSuccess = false;
    this.profileError   = '';

    const v = this.profileForm.value;
    const payload: UpdateProfilePayload = {};

    // N'envoyer que les champs modifiés (évite les 400 inutiles)
    if (v.firstName !== undefined) payload.first_name = v.firstName;
    if (v.lastName  !== undefined) payload.last_name  = v.lastName;
    if (v.email     !== undefined) payload.email      = v.email;
    if (v.phone     !== undefined) payload.telephone  = v.phone;
    if (v.adresse   !== undefined) payload.adresse    = v.adresse;

    this.authService.updateProfile(payload).subscribe({
      next: (res) => {
        this.profileLoading = false;
        this.profileSuccess = true;
        // Le signal currentUser est mis à jour automatiquement dans updateProfile()
        this._showProfileToast('Profil mis à jour avec succès.', 'success');
        // Réinitialiser le statut succès après 3 sec
        setTimeout(() => { this.profileSuccess = false; }, 3000);
      },
      error: (err) => {
        this.profileLoading = false;
        const body = err?.error;
        if (body && typeof body === 'object' && !body.detail) {
          this.profileError = Object.entries(body.errors ?? body)
            .map(([f, msgs]) => `${f} : ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(' | ');
        } else {
          this.profileError = body?.detail ?? body?.message ?? 'Une erreur est survenue.';
        }
        this._showProfileToast(this.profileError, 'error');
      },
    });
  }

  resetProfile(): void {
    this.profileSuccess = false;
    this.profileError   = '';
    const u = this.currentUser;
    if (u) this._patchProfileForm(u);
    else this.profileForm.reset();
  }

  isProfileInvalid(field: string): boolean {
    const c = this.profileForm.get(field);
    return !!c && c.invalid && c.touched;
  }

  // ── Profile toast (séparé du toast conseillers) ───────────────
  profileToast: { message: string; type: 'success' | 'error' } | null = null;
  private profileToastTimer: any;

  private _showProfileToast(message: string, type: 'success' | 'error'): void {
    clearTimeout(this.profileToastTimer);
    this.profileToast      = { message, type };
    this.profileToastTimer = setTimeout(() => { this.profileToast = null; }, 3800);
  }

  // ── Password ──────────────────────────────────────────────────
  updatePassword(): void {
    if (this.passwordForm.valid) console.log('Mot de passe mis à jour');
    else this.passwordForm.markAllAsTouched();
  }

  // ── Conseillers list ──────────────────────────────────────────
  conseillers:        Conseiller[] = [];
  conseillersLoading  = false;
  conseillersError    = '';
  togglingId:         number | null = null;
  toggleToast:        { message: string; type: 'success' | 'error' } | null = null;
  private toastTimer: any;

  loadConseillers(): void {
    this.conseillersLoading = true;
    this.conseillersError   = '';
    this.conseillerService.getConseillers().subscribe({
      next: (data) => {
        this.conseillers        = (Array.isArray(data) ? data : [])
          .filter(u => ['conseiller', 'admin', 'responsable'].includes(u.role));
        this.conseillersLoading = false;
      },
      error: (err) => {
        this.conseillersError   = err?.error?.detail ?? `Erreur ${err.status}.`;
        this.conseillersLoading = false;
      },
    });
  }

  // ── Toggle activer / désactiver conseiller ────────────────────
  toggleActive(conseiller: Conseiller): void {
    if (!this.isAdmin || this.togglingId === conseiller.id) return;
    const newState = !conseiller.is_active;
    this.togglingId = conseiller.id;

    const idx = this.conseillers.findIndex(c => c.id === conseiller.id);
    if (idx !== -1)
      this.conseillers[idx] = { ...this.conseillers[idx], is_active: newState, actif: newState };

    this.conseillerService.toggleActive(conseiller.id, newState).subscribe({
      next: (updated) => {
        const i = this.conseillers.findIndex(c => c.id === updated.id);
        if (i !== -1) this.conseillers[i] = updated;
        this.togglingId = null;
        this._showToast(
          newState
            ? `Compte de ${this.getFullName(updated)} activé`
            : `Compte de ${this.getFullName(updated)} désactivé`,
          'success'
        );
      },
      error: (err) => {
        if (idx !== -1)
          this.conseillers[idx] = { ...this.conseillers[idx], is_active: !newState, actif: !newState };
        this.togglingId = null;
        this._showToast(err?.error?.detail ?? 'Erreur lors de la modification.', 'error');
      },
    });
  }

  // ── Suppression conseiller ────────────────────────────────────
  showDeleteConfirm  = false;
  deleteTarget:      Conseiller | null = null;
  deleteLoading      = false;

  confirmDelete(c: Conseiller): void {
    this.deleteTarget      = c;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deleteTarget      = null;
  }

  doDelete(): void {
    if (!this.deleteTarget || this.deleteLoading) return;
    this.deleteLoading = true;

    this.conseillerService.deleteConseiller(this.deleteTarget.id).subscribe({
      next: () => {
        const nom = this.getFullName(this.deleteTarget!);
        this.conseillers       = this.conseillers.filter(c => c.id !== this.deleteTarget!.id);
        this.deleteLoading     = false;
        this.showDeleteConfirm = false;
        this.deleteTarget      = null;
        this._showToast(`Compte de ${nom} supprimé avec succès.`, 'success');
      },
      error: (err) => {
        this.deleteLoading = false;
        this._showToast(err?.error?.message ?? 'Erreur lors de la suppression.', 'error');
      },
    });
  }

  // ── Modification profil conseiller ────────────────────────────
  showEditModal   = false;
  editTarget:     Conseiller | null = null;
  editLoading     = false;
  editSuccess     = false;
  editError       = '';

  readonly roleOptions = [
    { value: 'conseiller',  label: 'Conseiller'     },
    { value: 'responsable', label: 'Responsable'    },
    { value: 'admin',       label: 'Administrateur' },
  ];

  openEditModal(c: Conseiller): void {
    this.editTarget  = c;
    this.editSuccess = false;
    this.editError   = '';
    this.editForm.patchValue({
      firstName: c.first_name,
      lastName:  c.last_name,
      email:     c.email,
      telephone: c.telephone ?? '',
      adresse:   c.adresse   ?? '',
      role:      c.role,
    });
    this.showEditModal = true;
  }

  closeEditModal(): void {
    if (this.editLoading) return;
    this.showEditModal = false;
    this.editTarget    = null;
  }

  isEditInvalid(field: string): boolean {
    const ctrl = this.editForm.get(field);
    return !!ctrl && ctrl.invalid && ctrl.touched;
  }

  submitEdit(): void {
    if (this.editForm.invalid) { this.editForm.markAllAsTouched(); return; }
    if (!this.editTarget) return;

    this.editLoading = true;
    this.editError   = '';
    this.editSuccess = false;

    const v = this.editForm.value;
    const payload: ConseillerUpdatePayload = {
      first_name: v.firstName  || undefined,
      last_name:  v.lastName   || undefined,
      email:      v.email,
      telephone:  v.telephone  || undefined,
      adresse:    v.adresse    || undefined,
      role:       v.role,
    };

    this.conseillerService.updateConseiller(this.editTarget.id, payload).subscribe({
      next: (updated) => {
        const i = this.conseillers.findIndex(c => c.id === updated.id);
        if (i !== -1) this.conseillers[i] = updated;
        this.editLoading = false;
        this.editSuccess = true;
        this._showToast(`Profil de ${this.getFullName(updated)} mis à jour.`, 'success');
        setTimeout(() => this.closeEditModal(), 1200);
      },
      error: (err) => {
        this.editLoading = false;
        const body = err?.error;
        if (body?.errors && typeof body.errors === 'object') {
          this.editError = Object.entries(body.errors)
            .map(([f, msgs]) => `${f} : ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(' | ');
        } else {
          this.editError = body?.detail ?? body?.message ?? 'Une erreur est survenue.';
        }
      },
    });
  }

  // ── Toast conseillers ─────────────────────────────────────────
  private _showToast(message: string, type: 'success' | 'error'): void {
    clearTimeout(this.toastTimer);
    this.toggleToast = { message, type };
    this.toastTimer  = setTimeout(() => { this.toggleToast = null; }, 3500);
  }

  getFullName(c: Conseiller): string {
    const name = `${c.first_name} ${c.last_name}`.trim();
    return name || c.username;
  }

  // ── Notifications ─────────────────────────────────────────────
  notifPrefs: NotifPref[] = [
    { key: 'email', label: 'Notifications Email',    desc: 'Recevoir les alertes par email',              enabled: true  },
    { key: 'sms',   label: 'Notifications SMS',      desc: 'Recevoir les alertes par SMS',                enabled: true  },
    { key: 'cases', label: 'Mises à jour dossiers',  desc: 'Notifications sur les changements de statut', enabled: true  },
    { key: 'docs',  label: 'Approbations documents', desc: 'Alertes lors de la validation de documents',  enabled: true  },
    { key: 'tasks', label: 'Affectation de tâches',  desc: 'Notifications lors de nouvelles tâches',      enabled: false },
  ];

  // ── System ────────────────────────────────────────────────────
  saveSystem(): void { console.log('Système', this.systemForm.value); }

  // ── Appearance ────────────────────────────────────────────────
  readonly accentColors = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
  selectedAccent = '#2563EB';
  saveAppearance(): void { console.log('Apparence', { ...this.appearanceForm.value, accent: this.selectedAccent }); }

  // ── Advisor modal (créer conseiller) ──────────────────────────
  showAdvisorModal    = false;
  advisorLoading      = false;
  advisorSuccess      = false;
  advisorError        = '';
  showAdvisorPassword = false;

  openAdvisorModal(): void {
    this.advisorForm.reset();
    this.advisorSuccess = false;
    this.advisorError   = '';
    this.showAdvisorModal = true;
  }

  closeAdvisorModal(): void {
    if (this.advisorLoading) return;
    this.showAdvisorModal = false;
  }

  isInvalid(field: string): boolean {
    const ctrl = this.advisorForm.get(field);
    return !!ctrl && ctrl.invalid && ctrl.touched;
  }

  private _passwordsMatch(group: FormGroup) {
    const pwd  = group.get('password')?.value;
    const pwd2 = group.get('password2')?.value;
    return pwd && pwd2 && pwd !== pwd2 ? { passwordsMismatch: true } : null;
  }

  get passwordsMismatch(): boolean {
    return !!(this.advisorForm.errors?.['passwordsMismatch'] && this.advisorForm.get('password2')?.touched);
  }

  submitAdvisor(): void {
    if (this.advisorForm.invalid) { this.advisorForm.markAllAsTouched(); return; }
    this.advisorLoading = true;
    this.advisorError   = '';
    this.advisorSuccess = false;

    const v = this.advisorForm.value;
    this.authService.createConseiller({
      username:   v.username,
      email:      v.email,
      password:   v.password,
      password2:  v.password2,
      role:       'conseiller',
      first_name: v.firstName || undefined,
      last_name:  v.lastName  || undefined,
      telephone:  v.phone     || undefined,
      adresse:    v.adresse   || undefined,
    }).subscribe({
      next: () => {
        this.advisorLoading = false;
        this.advisorSuccess = true;
        this.advisorForm.reset();
        this.loadConseillers();
        setTimeout(() => this.closeAdvisorModal(), 1500);
      },
      error: (err) => {
        this.advisorLoading = false;
        const errBody = err?.error;
        if (typeof errBody === 'object' && errBody !== null) {
          this.advisorError = Object.entries(errBody)
            .map(([field, msgs]) => `${field} : ${(msgs as string[]).join(', ')}`)
            .join(' | ');
        } else {
          this.advisorError = errBody?.detail ?? 'Une erreur est survenue.';
        }
      },
    });
  }
}