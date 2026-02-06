import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Get JWT token from localStorage
  const token = localStorage.getItem('markhor_token');
  
  console.log('[AuthInterceptor] Intercepting request to:', req.url);
  console.log('[AuthInterceptor] Token found:', !!token);
  console.log('[AuthInterceptor] Token value:', token ? token.substring(0, 20) + '...' : 'null');
  
  if (token) {
    // Clone request and add Authorization header with Bearer token
    const newReq = req.clone({
      setHeaders: { 
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('[AuthInterceptor] ✅ Adding Authorization header');
    console.log('[AuthInterceptor] Request headers:', newReq.headers.keys());
    return next(newReq);
  }
  
  console.log('[AuthInterceptor] ⚠️ No token found - sending request without auth header');
  // No token - send request without auth header (for login/register endpoints)
  return next(req);
};