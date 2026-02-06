import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Get JWT token from localStorage
  const token = localStorage.getItem('markhor_token');
  
  console.log('[AuthInterceptor] Token found:', !!token); // Debug log
  
  if (token) {
    // Clone request and add Authorization header with Bearer token
    const newReq = req.clone({
      setHeaders: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('[AuthInterceptor] Adding Authorization header'); // Debug log
    return next(newReq);
  }
  
  console.log('[AuthInterceptor] No token found'); // Debug log
  // No token - send request without auth header (for login/register endpoints)
  return next(req);
};