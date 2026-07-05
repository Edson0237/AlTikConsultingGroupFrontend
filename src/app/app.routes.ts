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
    canActivate: [authGuard],
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
      {
        path: 'visa-business',
        loadComponent: () =>
          import('./components/bussiness-visa/bussiness-visa.component')
            .then(m => m.BussinessVisaComponent)
      },
      {
        path: 'analytics',
        loadComponent: () =>
          import('./components/analytics/analytics.component')
            .then(m => m.AnalyticsComponent)
      },
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
      },

      {
        path: 'notifications',
        loadComponent: () =>
          import('./components/notification/notification.component')
            .then(m => m.NotificationComponent)
      },
      {
        path: 'messagerie',
        loadComponent: () =>
          import('./components/messaging/messaging.component')
            .then(m => m.MessagingComponent),
      },
      {
        path: 'rapports',
        loadComponent: () =>
          import('./components/rapport-analytic/rapport-analytic.component')
            .then(m => m.RapportAnalyticComponent)
      },
      {
        path: 'rapports/:id',
        loadComponent: () =>
          import('./components/rapport-detail/rapport-detail.component')
            .then(m => m.RapportDetailComponent),
      },
      {
        path: 'parametres',
        loadComponent: () =>
          import('./components/parametres/parametres.component')
            .then(m => m.ParametresComponent)
      },
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