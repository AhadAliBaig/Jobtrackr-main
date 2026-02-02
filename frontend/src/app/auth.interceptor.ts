import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const userJson = localStorage.getItem('markhor_user');
  
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      // Make sure user has an id before sending header
      if (user && user.id) {
        const newReq = req.clone({
          setHeaders: { 
            'X-User-Id': String(user.id),
            'Content-Type': 'application/json'
          }
        });
        // Debug log (remove in production)
        console.log('[AuthInterceptor] Sending X-User-Id:', user.id, 'for URL:', req.url);
        return next(newReq);
      } else {
        console.error('[AuthInterceptor] User object missing id. User object:', user);
        console.error('[AuthInterceptor] Please log out and log back in to fix this issue.');
      }
    } catch (error) {
      console.error('[AuthInterceptor] Failed to parse user:', error);
    }
  } else {
    console.warn('[AuthInterceptor] No user found in localStorage');
  }
  
  return next(req);
};