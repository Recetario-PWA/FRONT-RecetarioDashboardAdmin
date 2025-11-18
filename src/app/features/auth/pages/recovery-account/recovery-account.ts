import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, signal, ViewChildren } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { codeEmail, entryPoint } from '../../../../core/stores/auth.store';
import { Auth } from '../../../../core/services/auth';
import { ErrorMessagesComponent } from '../../../../shared/components/error-messages/error-messages.component';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import { take, timeout, TimeoutError } from 'rxjs';
import { PushService } from '../../../../core/services/push';

@Component({
  selector: 'app-recovery-account',
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, ErrorMessagesComponent],
  templateUrl: './recovery-account.html',
  styleUrl: './recovery-account.css',
  standalone: true,
})

export class RecoveryAccount {
  emailForm: FormGroup;

  email!: any;
  loading = signal(false);
  sending = signal(false);

  constructor(private authService: Auth, private fb: FormBuilder, private router: Router, private pushNotifications: PushService) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, Validators.pattern('.+@[A-Za-z]+[.][A-Za-z]+(?:\.[A-Za-z]{2,})*'), Validators.maxLength(254)]],
    });
  }

  ngOnInit(): void {
    const email = codeEmail();

    this.email = email;
    codeEmail.set(null);
  }

  getControl(name: string): AbstractControl {
    return this.emailForm.controls[name];
  }

  onSubmit() {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }
    
    const userData = this.emailForm.value;

    this.loading.set(true);
    
    this.authService.resendCode(userData).pipe(timeout(15000)).subscribe({
      next: async (response) => {
        codeEmail.set(userData.email);
        entryPoint.set('recovery-account');
        
        if (response.result) {
          Swal.fire({
            title: '¡Cuenta encontrada!',
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
          this.emailForm.reset();
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

  ngOnDestroy(): void {
    
  }
}
