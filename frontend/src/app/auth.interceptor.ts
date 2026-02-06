import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Get JWT token from localStorage
  const token = localStorage.getItem('markhor_token');
  
  if (token) {
    // Clone request and add Authorization header with Bearer token
    const newReq = req.clone({
      setHeaders: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    return next(newReq);
  }
  
  // No token - send request without auth header (for login/register endpoints)
  return next(req);
};