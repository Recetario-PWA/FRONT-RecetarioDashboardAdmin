import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, signal, ViewChildren } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { codeEmail, entryPoint } from '../../../../core/stores/auth.store';
import { Auth } from '../../../../core/services/auth';
import { HttpErrorResponse } from '@angular/common/http';
import Swal from 'sweetalert2';
import { take, TimeoutError } from 'rxjs';
import { PushService } from '../../../../core/services/push';

@Component({
  selector: 'app-auth-code',
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './auth-code.html',
  styleUrl: './auth-code.css',
  standalone: true,
})
export class AuthCode {
  email!: any;
  isLogin: boolean = false;
  code: string[] = ['', '', '', '', '']; 
  codeDigits = Array(5).fill(0);
  loading = signal(false);
  sending = signal(false);
  @ViewChildren('inputField') inputFields!: QueryList<ElementRef>; 

  constructor(private authService: Auth, private router: Router, private pushNotifications: PushService) {}

  ngOnInit(): void {
    const email = codeEmail();
    this.email = email;

    if(entryPoint() !== 'recovery-account'){
      this.isLogin = true;
      codeEmail.set(null);
    } else {
      this.isLogin = false;
    }
    entryPoint.set(null);
  }

  onInputChange(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;
    
    if (value.length > 1) {
      value = value.charAt(0);
    }
    
    input.value = value;
    this.code[index] = value;
    
    if (value && index < this.code.length - 1) {
      this.focusNextInput(index);
    }
  }

  onBackspace(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.value && index > 0) {
      this.focusPrevInput(index);
    } else if (input.value) {
        this.code[index] = '';
    }
  
  }

  private focusNextInput(currentIndex: number): void {
    const nextInput = this.inputFields.get(currentIndex + 1);
    if (nextInput) {
      nextInput.nativeElement.focus();
    }
  }

  private focusPrevInput(currentIndex: number): void {
    const prevInput = this.inputFields.get(currentIndex - 1);
    if (prevInput) {
      prevInput.nativeElement.focus();
    }
  }

  onSubmit(): void {
    const fullCode = this.code.join('');
    this.loading.set(true);

    if (fullCode.length === this.code.length){
      if(this.isLogin){
        this.authService.verifyCode(this.email, fullCode).subscribe({
        next: (response) => {
          if (response.result) {
            this.authService.saveToken(response.data.token);
          
            this.authService.getUserInfo().subscribe(user => {
              if (user.data.rol.role === "admin") {
                if (user?.data?.id) {
                  this.pushNotifications.init(user.data.id.toString());
                }
                setTimeout(() => {
                  this.clearCodeInputs();
                  this.router.navigate(['/']);
                });
              } else {
                localStorage.removeItem('auth_token');

                this.clearCodeInputs();
                Swal.fire({
                  title: 'Error',
                  html: 'No tienes permiso para ingresar',
                  icon: 'error',
                  confirmButtonColor: "#a2aadb",
                  confirmButtonText: 'Aceptar'
                }).then(() => {
                  this.loading.set(false);
                  this.router.navigate(['/login']);
                });
              }
            });
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

          this.clearCodeInputs();
          this.loading.set(false);
        }
        });
      } else {
        
        this.authService.verifyCodeWithOutEmail(this.email, fullCode).subscribe({
        next: (response) => {
          if (response.result) {
            setTimeout(() => {
              this.clearCodeInputs();
              this.router.navigate(['/change-password']);
            });
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

          this.clearCodeInputs();
          this.loading.set(false);
        }
        });
      }

    } else {
      Swal.fire({
          title: 'Error',
          html: 'Código incompleto',
          icon: 'error',
          confirmButtonColor: "#a2aadb",
          confirmButtonText: 'Aceptar'
      });
    }
    this.loading.set(false);

  }

  resendCode() { 
    this.sending.set(true);

    this.authService.resendCode(this.email).pipe(take(1)).subscribe({
      next: (response) => { 
        Swal.fire({
          title: '¡Código Reenviado!',
          text: 'Hemos enviado un nuevo código de verificación a tu correo electrónico. Recuerda revisar la bandeja de entrada o spam.',
          icon: 'success',
          confirmButtonColor: "#a2aadb",
          confirmButtonText: 'Aceptar'
        }).then(() => {
          this.sending.set(false);
          this.clearCodeInputs();
        });
      },
      error: (error: HttpErrorResponse) => {
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

        this.sending.set(false);
      }
    });
  }

  clearCodeInputs(): void {
    this.code = ['', '', '', '', ''];
    
    if (this.inputFields) {
      this.inputFields.forEach(inputRef => {
        inputRef.nativeElement.value = '';
      });
      
      this.inputFields.first.nativeElement.focus();
    }
  }

  
  ngOnDestroy(): void {
    
  }
}
