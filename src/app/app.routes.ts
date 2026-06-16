import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard'; // Importation de notre guard

export const routes: Routes = [

  // ── Auth ────────────────────────────────────────────────────────────────────
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component')
        .then(m => m.LoginComponent)
  },

  // ── Admin Dashboard (Protégé) ───────────────────────────────────────────────
  {
    path: 'dashboard-admin',
    canActivate: [authGuard], // Protège cette route et tous ses enfants
    loadComponent: () =>
      import('./pages/dashboard-acceuil/dashboard-acceuil.component')
        .then(m => m.DashboardAcceuilComponent),
    children: [

      // Page d'accueil → /dashboard-admin
      {
        path: '',
        loadComponent: () =>
          import('./components/acceuil/acceuil.component')
            .then(m => m.AcceuilComponent)
      },

      // Bourses & Visas
      {
        path: 'bourses-chine',
        loadComponent: () =>
          import('./components/scholarship/scholarship.component')
            .then(m => m.ScholarshipComponent)
      },
      // {
      //   path: 'visa-business',
      //   loadComponent: () =>
      //     import('./pages/business-visa/business-visa.component')
      //       .then(m => m.BusinessVisaComponent)
      // },
      // {
      //   path: 'documents-ia',
      //   loadComponent: () =>
      //     import('./pages/ai-documents/ai-documents.component')
      //       .then(m => m.AiDocumentsComponent)
      // },

      // Import-Export
      // {
      //   path: 'import-export',
      //   loadComponent: () =>
      //     import('./pages/import-export/import-export.component')
      //       .then(m => m.ImportExportComponent)
      // },
      // {
      //   path: 'catalogue',
      //   loadComponent: () =>
      //     import('./pages/product-catalog/product-catalog.component')
      //       .then(m => m.ProductCatalogComponent)
      // },
      // {
      //   path: 'commandes',
      //   loadComponent: () =>
      //     import('./pages/orders/orders.component')
      //       .then(m => m.OrdersComponent)
      // },

      // Gestion
      {
        path: 'utilisateurs',
        loadComponent: () =>
          import('./components/users/users.component')
            .then(m => m.UsersComponent)
      },
      {
        path: 'universites',
        loadComponent: () =>
          import('./components/universities/universities.component')
            .then(m => m.UniversitiesComponent)
      },
      {
        path: 'universites/:id',
        loadComponent: () =>
          import('./components/universite-detail/universite-detail.component')
            .then(m => m.UniversiteDetailComponent)
      },
      {
        path: 'admin/dossiers/:id',
        loadComponent: () => import('./components/dossier-detail/dossier-detail.component')
          .then(m => m.DossierDetailComponent),
        canActivate: [authGuard],
      },
      // {
      //   path: 'messagerie',
      //   loadComponent: () =>
      //     import('./pages/messaging/messaging.component')
      //       .then(m => m.MessagingComponent)
      // },
      // {
      //   path: 'notifications',
      //   loadComponent: () =>
      //     import('./pages/notifications/notifications.component')
      //       .then(m => m.NotificationsComponent)
      // },
      {
        path: 'rapports',
        loadComponent: () =>
          import('./components/rapport-analytic/rapport-analytic.component')
            .then(m => m.RapportAnalyticComponent)
      },
      {
        path: 'parametres',
        loadComponent: () =>
          import('./components/parametres/parametres.component')
            .then(m => m.ParametresComponent)
      },

      // Wildcard enfant → page d'accueil du dashboard
      {
        path: '**',
        redirectTo: ''
      }
    ]
  },

  // ── Racine & wildcard global ────────────────────────────────────────────────
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];