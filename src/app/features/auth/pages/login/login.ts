import { Component, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators  } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ErrorMessagesComponent } from '../../../../shared/components/error-messages/error-messages.component';
import { Auth } from '../../../../core/services/auth';
import { codeEmail } from '../../../../core/stores/auth.store';
import { timeout, TimeoutError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, ErrorMessagesComponent],
  templateUrl: './login.html',
  styleUrl: './login.css',
  standalone: true,
})
export class Login {
  loginForm: FormGroup;
  loading = signal(false);
  passwordVisible = signal(false);
  passwordConfirmationVisible = signal(false);

  constructor(private fb: FormBuilder, private router: Router, private authService: Auth) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.pattern('.+@[A-Za-z]+[.][A-Za-z]+(?:\.[A-Za-z]{2,})*'), Validators.maxLength(254)]],
      password: ['', [Validators.required]]      
    });
  }

  ngOnInit(): void {}

  getControl(name: string): AbstractControl {
    return this.loginForm.controls[name];
  }

  togglePasswordVisibility() {
    this.passwordVisible.update(currentValue => !currentValue);
  }

  togglePasswordConfirmationVisibility() {
    this.passwordConfirmationVisible.update(currentValue => !currentValue);
  }

  onSubmit() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    
    const userData = this.loginForm.value;

    this.loading.set(true);
    
    this.authService.login(userData).pipe(timeout(15000)).subscribe({
      next: async (response) => {
        codeEmail.set(userData.email);
        
        if (response.result) {
          Swal.fire({
            title: '¡Inicio de sesión exitoso!',
            text: 'Para completar el acceso, hemos enviado un código de verificación a tu correo electrónico. Revisa tu bandeja de entrada o spam.',
            icon: 'success',
            confirmButtonColor: "#a2aadb",
            confirmButtonText: 'Aceptar'
          }).then((result) => {
            if (result.isConfirmed) {
              this.router.navigate(['/auth-code']);
            }
          });
          this.loading.set(false);
          this.loginForm.reset();
        }
      },
      error: (error: HttpErrorResponse | TimeoutError) => {
        if (error instanceof TimeoutError) {
          this.onSubmit();
          return;
        }

        const httpError = error as HttpErrorResponse;

        const serverMsg = httpError.error?.msg || 'Ha ocurrido un error inesperado. (Error 404/500)';
        const data = httpError.error?.data as Record<string, any> | undefined;

        let htmlMsg = '';

        if (data) {
          const validationMessages = ([] as string[]).concat(
            ...Object.values(data)
          );

          if (validationMessages.length > 0) {
            htmlMsg = validationMessages.map(err => `* ${err}`).join('<br>');
          }
        }

        Swal.fire({
          title: 'Error',
          html: htmlMsg || serverMsg,
          icon: 'error',
          confirmButtonColor: "#a2aadb",
          confirmButtonText: 'Aceptar'
        });

        this.loading.set(false);
      },
    });
  }
}
