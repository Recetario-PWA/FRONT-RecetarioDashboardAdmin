import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { environment } from '../../../environments/environment';
import { from, Observable, switchMap, tap } from 'rxjs';
import { currentUser, userInfoLoading } from '../stores/auth.store';
import { isPlatformBrowser } from '@angular/common';
import { PushService } from './push';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  private baseUrl: string;
  private token: string | null = null;
  private role: string | null = null;
  private isBrowser: boolean;

  constructor(private httpClient: HttpClient, @Inject(PLATFORM_ID) private platformId: Object, private push: PushService){
    this.baseUrl = `${environment.apiUrlBase}auth/`;
    this.isBrowser = isPlatformBrowser(this.platformId);
  }

  login(loginData: any): Observable<any>{
    return this.httpClient.post(`${this.baseUrl}login`, loginData);
  }

  register(registerData: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}register`, registerData);
  }

  verifyCode(email: any, code: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}code`, { email: email, code: code });
  }

  verifyCodeWithOutEmail(email: any, code: any): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}verify-code`, { email: email, code: code });
  }

  recoveryAccount(recoveryData: any): Observable<any> {
    return this.httpClient.put(`${this.baseUrl}change-password`, recoveryData);
  }

  saveToken(token: string) {
    if (this.isBrowser) {
      localStorage.setItem('auth_token', token);
    }
  }

  getToken() {
    if (this.isBrowser) {
      this.token = localStorage.getItem('auth_token');
    } else {
      this.token = null;
    }

    return this.token;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getUserInfo(): Observable<any> {
    userInfoLoading.set(true);
    return this.httpClient.get<any>(`${this.baseUrl}about-me`).pipe(
      tap({
        next: (response) => {
          if (response.result) {
            this.role = response.data.rol.role;
            currentUser.set(response.data);
          } else {
            this.role = null
            currentUser.set(null);
          }
          userInfoLoading.set(false);
        },
        error: () => {
          currentUser.set(null);
          this.role = null;
          userInfoLoading.set(false);
        }
      })
    );
  }

  getRole() {
    return this.role;
  }

  resendCode(email: any): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}resend-code`, {email: email});
  }

  logout(): Observable<any> {
    return this.httpClient.post(`${this.baseUrl}logout`, '').pipe(
      switchMap(() =>
        from(this.push.clear())
      ),
      tap(() => {
        if (this.isBrowser) {
          localStorage.removeItem('auth_token');
          this.token = null;
          currentUser.set(null);
        }
      })
    );
  }  
}
