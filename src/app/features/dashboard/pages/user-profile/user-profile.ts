import { CommonModule } from '@angular/common';
import { Component, computed, effect, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import Swal from 'sweetalert2';
import { currentUser } from '../../../../core/stores/auth.store';
import { AbstractControl, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Auth } from '../../../../core/services/auth';
import { ErrorMessagesComponent } from '../../../../shared/components/error-messages/error-messages.component';
import { switchMap, take, timeout, TimeoutError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { UsersService } from '../../../../core/services/users';

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule, ErrorMessagesComponent],
  templateUrl: './user-profile.html',
  styleUrl: './user-profile.css',
  standalone: true,
})
export class UserProfile {
  isModalOpen = signal(false);
  public user = computed(() => currentUser());
  updateInfoForm: FormGroup;
  changePasswordForm: FormGroup;
  passwordVisible = signal(false);
  passwordConfirmationVisible = signal(false);

  constructor(private fb: FormBuilder, private authService: Auth, private userService: UsersService) {
    this.updateInfoForm = this.fb.group({
      user_name: ['',  [Validators.minLength(3), Validators.maxLength(50), Validators.pattern('^[A-Za-z][A-Za-z0-9._]{2,19}$')]],
      name: ['', [Validators.maxLength(55), Validators.pattern("^[A-Za-zÑñÁÉÍÓÚáéíóú\\s']{1,55}$")]],
      last_name: ['', [Validators.maxLength(55), Validators.pattern("^[A-Za-zÑñÁÉÍÓÚáéíóú\\s']{1,55}$")]],
      gender: ['', [Validators.required]],
      email: ['', [Validators.email, Validators.pattern('.+@[A-Za-z]+[.][A-Za-z]+(?:\.[A-Za-z]{2,})*'), Validators.maxLength(254)]],
    });

    this.changePasswordForm = this.fb.group({
      password: ['', [Validators.required, Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d])[A-Za-z\\d\\W_]{8,}$'), Validators.maxLength(250), Validators.minLength(8)]],
      password_confirmation: ['', [Validators.required, Validators.pattern('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z\\d])[A-Za-z\\d\\W_]{8,}$'), Validators.maxLength(250), Validators.minLength(8)]],
    });

    effect(() => {
      const currentUser = this.user();

      if (currentUser) {
        this.updateInfoForm.patchValue({
          user_name: currentUser.user_name,
          name: currentUser.name,
          last_name: currentUser.last_name,
          gender: currentUser.gender,
          email: currentUser.email
        });
      }
    });
  }

  ngOnInit() {}

  getControl(name: string): AbstractControl {
    return this.updateInfoForm.controls[name];
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

  confirmChanges() {
    Swal.fire({
      title: "¿Estas seguro de actualizar la información?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#a2aadb",
      cancelButtonColor: "#a53f3f",
      confirmButtonText: "Si, actualizar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        this.onSubmit();
      }
    });
  }

  confirmPasswordChange() {
    Swal.fire({
      title: "¿Estas seguro de actualizar la contraseña?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#a2aadb",
      cancelButtonColor: "#a53f3f",
      confirmButtonText: "Si, actualizar",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        this.changePasswordSubmit();
      }
    });
  }

  openModal(): void {
    this.isModalOpen.set(true);
  }

  closeModal(): void {
   this.isModalOpen.set(false);
  }

  onSubmit() {
    if (this.updateInfoForm.invalid) {
      this.updateInfoForm.markAllAsTouched();
      return;
    }

    const changedData: any = {};
    
    Object.keys(this.updateInfoForm.controls).forEach(key => {
      const control = this.updateInfoForm.get(key);
      if (control?.dirty) {
        changedData[key] = control.value;
      }
    });

    this.userService.updateUser(changedData).pipe(timeout(15000), take(1), 
      switchMap((response) => {
          if (response.result) {
              return this.authService.getUserInfo().pipe(take(1)); 
          }
          throw new Error(response.msg || 'Fallo la actualizacion de datos.'); 
      })
    ).subscribe({
      next: (response) => {
        if (response.result) {
          Swal.fire({
            title: "Datos actualizados!",
            icon: "success",
            timer: 1500,
            confirmButtonColor: "#a2aadb"
          });
        }
      },
      error: (error: HttpErrorResponse | TimeoutError | Error) => {
        if (error instanceof TimeoutError) {
          this.onSubmit();
          return;
        }

        let msg = 'Ha ocurrido un error inesperado';
        if (error instanceof HttpErrorResponse) {
            msg = error.error?.msg || msg;
        } else if (error instanceof Error) {
            msg = error.message;
        }

        Swal.fire({
            title: "Error",
            text: msg,
            icon: "error",
            confirmButtonColor: "#a2aadb"
        });
 
        console.log(error);
      }
    });
  }

  changePasswordSubmit() {
    if (this.changePasswordForm.invalid) {
      this.changePasswordForm.markAllAsTouched();
      return;
    }

    const data = this.changePasswordForm.value;
    
    this.userService.updateUser(data).pipe(timeout(15000), take(1)).subscribe({
      next: (response) => {
        if (response.result) {
          this.authService.getUserInfo();
          this.changePasswordForm.reset();
        }
      },
      error: (error: HttpErrorResponse | TimeoutError) => {
        if (error instanceof TimeoutError) {
          this.onSubmit();
          return;
        }

        const msg = (error as HttpErrorResponse).error?.msg || 'Ha ocurrido un error inesperado';

        console.log(error);
      }
    });
  }
}
