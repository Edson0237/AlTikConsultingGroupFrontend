import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  // Injections modernes avec "inject" à côté de ton AuthService
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');
  showPassword = signal(false);

  stats = [
    { value: '2,400+', label: 'Étudiants Placés' },
    { value: '98%',    label: 'Taux de Réussite' },
    { value: '150+',   label: 'Universités' },
    { value: '12 ans', label: "D'Expérience" }
  ];

  services = [
    {
      icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
      label: 'Bourses Chine'
    },
    {
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      label: 'Visas Affaires'
    },
    {
      icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      label: 'Import-Export'
    },
    {
      icon: 'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18',
      label: 'Documents IA'
    }
  ];

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  // Getters pour faciliter la validation dans le fichier HTML
  get emailControl() { return this.loginForm.get('email'); }
  get passwordControl() { return this.loginForm.get('password'); }

  togglePassword() { 
    this.showPassword.update(v => !v); 
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const credentials = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        // Redirection vers ton tableau de bord d'administration
        this.router.navigate(['/dashboard-admin']);
      },
      error: (err) => {
        this.isLoading.set(false);
        // Gestion propre de l'erreur renvoyée par Django
        if (err.status === 401 || err.status === 400) {
          this.errorMessage.set('Email ou mot de passe incorrect. Vérifiez vos identifiants.');
        } else {
          this.errorMessage.set('Une erreur réseau ou serveur est survenue. Veuillez réessayer plus tard.');
        }
      }
    });
  }
}