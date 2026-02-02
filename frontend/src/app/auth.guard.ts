import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);
  
  // Check if user is logged in (stored in localStorage)
  const user = localStorage.getItem('markhor_user');
  
  if (user) {
    return true; // User is logged in, allow access
  } else {
    router.navigate(['/login']); // Redirect to login
    return false;
  }
};



