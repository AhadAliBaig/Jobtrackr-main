import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const userJson = localStorage.getItem('markhor_user');
  
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      // Make sure user has an id before sending header
      if (user && user.id) {
        const newReq = req.clone({
          setHeaders: { 'X-User-Id': String(user.id) }
        });
        return next(newReq);
      } else {
        console.warn('[AuthInterceptor] User object missing id:', user);
      }
    } catch (error) {
      console.error('[AuthInterceptor] Failed to parse user:', error);
    }
  }
  
  return next(req);
};