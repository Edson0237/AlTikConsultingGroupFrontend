import { Injectable, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLanguage = 'fr' | 'en' | 'zh';

export interface LanguageOption {
  code: AppLanguage;
  label: string;   // nom affiché dans le menu déroulant
  short: string;   // affiché dans le bouton (FR / EN / 中文)
}

/**
 * Service central de gestion de la langue de l'interface.
 *
 * Pourquoi un service séparé plutôt que d'appeler TranslateService partout ?
 * - Un seul endroit qui connaît la liste des langues disponibles.
 * - Un seul endroit qui gère la persistance (localStorage) — voir plus bas.
 * - Si on veut un jour sauvegarder la langue côté backend (sur le profil
 *   utilisateur), c'est le seul fichier à modifier.
 *
 * Persistance "par utilisateur" (et pas globale) :
 * -------------------------------------------------
 * On enregistre la langue dans le localStorage avec une clé qui contient
 * l'ID de l'utilisateur connecté : `altik_lang_42`. Comme ça, même si deux
 * personnes (un admin et un conseiller) utilisent le MÊME navigateur en se
 * connectant/déconnectant chacun avec son propre compte, chacun retrouve SA
 * propre langue — la préférence de l'un n'écrase jamais celle de l'autre.
 * Si aucun utilisateur n'est connu (avant connexion), on utilise la clé
 * "guest".
 */
@Injectable({ providedIn: 'root' })
export class LanguageService {

  private readonly translate = inject(TranslateService);
  private readonly STORAGE_PREFIX = 'altik_lang_';
  private readonly DEFAULT_LANG: AppLanguage = 'fr';

  readonly options: LanguageOption[] = [
    { code: 'fr', label: 'Français', short: 'FR' },
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'zh', label: '中文', short: '中文' },
  ];

  /** Langue actuellement appliquée — un signal pour que les composants réagissent automatiquement. */
  readonly currentLang = signal<AppLanguage>(this.DEFAULT_LANG);

  /** Raccourci pour afficher le libellé court (FR/EN/中文) dans le bouton du header. */
  get currentShortLabel(): string {
    return this.options.find(o => o.code === this.currentLang())?.short ?? 'FR';
  }

  /**
   * À appeler UNE FOIS qu'on connaît l'utilisateur connecté (ex: dans le
   * header, qui n'est affiché que sur les pages déjà authentifiées).
   * Relit la langue sauvegardée pour cet utilisateur (ou 'fr' par défaut)
   * et l'applique.
   */
  init(userId: number | null): void {
    const saved = this.readStoredLang(userId);
    this.applyLanguage(saved ?? this.DEFAULT_LANG, userId, false);
  }

  /**
   * Change la langue de l'application + la sauvegarde pour cet utilisateur.
   * Utilisé par le bouton du header ET par le select dans Paramètres.
   */
  setLanguage(lang: AppLanguage, userId: number | null): void {
    this.applyLanguage(lang, userId, true);
  }

  // ── Interne ──────────────────────────────────────────────────────

  private applyLanguage(lang: AppLanguage, userId: number | null, persist: boolean): void {
    this.currentLang.set(lang);
    this.translate.use(lang);
    if (persist) {
      localStorage.setItem(this.storageKey(userId), lang);
    }
  }

  private readStoredLang(userId: number | null): AppLanguage | null {
    const value = localStorage.getItem(this.storageKey(userId));
    return value === 'fr' || value === 'en' || value === 'zh' ? value : null;
  }

  private storageKey(userId: number | null): string {
    return `${this.STORAGE_PREFIX}${userId ?? 'guest'}`;
  }
}