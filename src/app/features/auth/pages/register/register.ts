import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ErrorMessagesComponent } from '../../../../shared/components/error-messages/error-messages.component';
import { Auth } from '../../../../core/services/auth';
import { take, timeout, TimeoutError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule, ErrorMessagesComponent],
  templateUrl: './register.html',
  styleUrl: './register.css',
  standalone: true,
})
export class Register {
  registerForm: FormGroup;
  loading = signal(false);
  passwordVisible = signal(false);
  passwordConfirmationVisible = signal(false);

  constructor(private router: Router, private fb: FormBuilder, private authService: Auth) {
    this.registerForm = this.fb.group({
      user_name: ['',  [Validators.required, Validators.minLength(3), Validators.maxLength(50), Validators.pattern('^[A-Za-z][A-Za-z0-9._]{2,19}$')]],
      name: ['', [Validators.required, Validators.maxLength(55), Validators.pattern("^[A-Za-zÑñÁÉÍÓÚáéíóú\\s']{1,55}$")]],
      last_name: ['', [Validators.required, Validators.maxLength(55), Validators.pattern("^[A-Za-zÑñÁÉÍÓÚáéíóú\\s']{1,55}$")]],
      gender: ['', [Validators.required]],
      rol_id: [1],
      email: ['', [Validators.required, Validators.email, Validators.pattern('.+@[A-Za-z]+[.][A-Za-z]+(?:\.[A-Za-z]{2,})*'), Validators.maxLength(254)]],
      password: ['', [Validators.required, Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d])[A-Za-z\\d\\W_]{8,}$'), Validators.maxLength(250), Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required, Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d])[A-Za-z\\d\\W_]{8,}$'), Validators.maxLength(250), Validators.minLength(8)]],
    },
    { validators: this.passwordsMatchValidator }
  );
  }

  ngOnInit() {}

  getControl(name: string): AbstractControl {
    return this.registerForm.controls[name];
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
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    
    const userData = this.registerForm.value;
    this.loading.set(true);

    this.authService.register(userData).pipe(timeout(15000), take(1)).subscribe({
      next: (response) => {
        if (response.result) {
          Swal.fire({
            title: '¡Registro completo!',
            text: '¡Bienvenido a la comunidad! Ahora solo necesitas verificar tu correo electrónico para empezar.',
            icon: 'success',
            confirmButtonColor: "#a2aadb",
            confirmButtonText: 'Aceptar'
          }).then((result) => {
            if (result.isConfirmed) {
              this.router.navigate(['/login']);
            }
          });
          this.loading.set(false);
          this.registerForm.reset();
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
