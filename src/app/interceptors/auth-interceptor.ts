import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';

let isRefreshing = false;
let refreshToken$ = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = authService.getToken();

  const withAuth = (accessToken: string | null) =>
    accessToken
      ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
      : req;

  const handle401 = (err: HttpErrorResponse) => {
    // Éviter une boucle sur les endpoints d'authentification
    if (
      req.url.includes('auth/login') ||
      req.url.includes('auth/token/refresh')
    ) {
      return throwError(() => err);
    }

    if (!isRefreshing) {
      isRefreshing = true;
      refreshToken$.next(null);

      authService.refreshToken().subscribe({
        next: (res) => {
          isRefreshing = false;
          refreshToken$.next(res.access);
        },
        error: () => {
          isRefreshing = false;
          refreshToken$.next(null);
          authService.logout();
          router.navigate(['/login']);
        }
      });
    }

    return refreshToken$.pipe(
      filter(access => access !== null),
      take(1),
      switchMap(access => next(withAuth(access))),
      catchError(() => throwError(() => err))
    );
  };

  return next(withAuth(token)).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401) {
        return handle401(err);
      }
      return throwError(() => err);
    })
  );
};