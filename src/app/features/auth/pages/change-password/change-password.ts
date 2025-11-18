import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ErrorMessagesComponent } from '../../../../shared/components/error-messages/error-messages.component';
import { Auth } from '../../../../core/services/auth';
import { take, timeout, TimeoutError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import { codeEmail } from '../../../../core/stores/auth.store';

@Component({
  selector: 'app-change-password',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, ErrorMessagesComponent],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
  standalone: true,
})
export class ChangePassword {
    email!: any;
    passwordForm: FormGroup;
    loading = signal(false);
    passwordVisible = signal(false);
    passwordConfirmationVisible = signal(false);
  
    constructor(private router: Router, private fb: FormBuilder, private authService: Auth) {
      this.passwordForm = this.fb.group({
        password: ['', [Validators.required, Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d])[A-Za-z\\d\\W_]{8,}$'), Validators.maxLength(250), Validators.minLength(8)]],
        password_confirmation: ['', [Validators.required, Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d])[A-Za-z\\d\\W_]{8,}$'), Validators.maxLength(250), Validators.minLength(8)]],
        email: [''],
      },
      { validators: this.passwordsMatchValidator }
    );
    }
  
    ngOnInit() {
      const email = codeEmail();
      this.email = email;

      this.passwordForm.patchValue({
      email: this.email
  });

    }
  
    getControl(name: string): AbstractControl {
      return this.passwordForm.controls[name];
    }
  
    private passwordsMatchValidator: ValidatorFn = (group: AbstractControl): ValidationErrors | null => {
      const password = group.get('password')?.value;
      const confirm = group.get('password_confirmation')?.value;
      return password === confirm ? null : { noMatch: true };
    };
  
    togglePasswordVisibility() {
      this.passwordVisible.update(currentValue => !currentValue);
    }
  
    togglePasswordConfirmationVisibility() {
      this.passwordConfirmationVisible.update(currentValue => !currentValue);
    }
  
    onSubmit() {
      if (this.passwordForm.invalid) {
        this.passwordForm.markAllAsTouched();
        return;
      }

      const userData = this.passwordForm.value;

      console.log(userData);
      
      this.loading.set(true);
      
      this.authService.recoveryAccount(userData).pipe(timeout(15000), take(1)).subscribe({
        next: (response) => {
          if (response.result) {
            Swal.fire({
              title: '¡Contraseña cambiada!',
              text: '¡Bienvenido de nuevo a la comunidad! Ahora solo necesitas iniciar sesión.',
              icon: 'success',
              confirmButtonColor: "#a2aadb",
              confirmButtonText: 'Aceptar'
            }).then((result) => {
              if (result.isConfirmed) {
                this.router.navigate(['/login']);
              }
            });
            this.loading.set(false);
            this.passwordForm.reset();
          }
        },
        error: (error: HttpErrorResponse | TimeoutError) => {
          if (error instanceof TimeoutError) {
            this.onSubmit();
            return;
          }
  
          const httpError = error as HttpErrorResponse;
          const data = httpError.error?.data as Record<string, any> | undefined;
  
          let htmlMsg = '';
          let fallbackMsg = 'Algo salió mal. Por favor intenta de nuevo más tarde.';
  
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
            html: htmlMsg || fallbackMsg,
            icon: 'error',
            confirmButtonColor: "#a2aadb",
            confirmButtonText: 'Aceptar'
          });
          
          this.loading.set(false);
        }
      });
    }
  }
  