import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Auth } from '../services/auth';

export const tokenHandlerInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(Auth);
  let token = authService.getToken();
  //console.log('Interceptor adding token for URL:', req.url);
  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${token}`)
  });
  return next(authReq);
};
