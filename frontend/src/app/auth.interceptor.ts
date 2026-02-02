import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const userJson = localStorage.getItem('markhor_user');
  
  if (userJson) {
    const user = JSON.parse(userJson);
    const newReq = req.clone({
      setHeaders: { 'X-User-Id': String(user.id) }
    });
    return next(newReq);
  }
  
  return next(req);
};