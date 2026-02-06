import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../api.service'; // <-- Import ApiService

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  isLoginMode = true; // Start in Login Mode
  errorMessage = ''; // Store error message to display
  
  // Password requirements for display
  passwordRequirements = {
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  };

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private apiService: ApiService // Inject Service
  ) {
    // Initialize form - name is NOT required in login mode
    this.loginForm = this.fb.group({
      name: [''], // No validators - will be added in toggleMode for register
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)]],
      password: ['', [Validators.required]],
      rememberMe: [false]
    });
    
    // Watch password changes to update requirements display
    this.loginForm.get('password')?.valueChanges.subscribe(value => {
      if (value) {
        this.passwordRequirements = {
          minLength: value.length >= 8,
          hasUpperCase: /[A-Z]/.test(value),
          hasLowerCase: /[a-z]/.test(value),
          hasNumber: /[0-9]/.test(value),
          hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(value)
        };
      } else {
        this.passwordRequirements = {
          minLength: false,
          hasUpperCase: false,
          hasLowerCase: false,
          hasNumber: false,
          hasSpecialChar: false
        };
      }
    });
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    
    // Update name validator based on mode
    const nameControl = this.loginForm.get('name');
    if (this.isLoginMode) {
      // Login mode: name not required
      nameControl?.clearValidators();
    } else {
      // Register mode: name is required
      nameControl?.setValidators([Validators.required]);
    }
    nameControl?.updateValueAndValidity({ emitEvent: false });
    
    // Update password validator based on mode
    const passwordControl = this.loginForm.get('password');
    if (this.isLoginMode) {
      // Login mode: only require password, no strength requirements
      passwordControl?.setValidators([Validators.required]);
    } else {
      // Register mode: require strong password
      const passwordValidator = (control: any) => {
        if (!control.value) return null;
        
        const value = control.value;
        const errors: any = {};
        
        if (value.length < 8) errors.minLength = true;
        if (!/[A-Z]/.test(value)) errors.hasUpperCase = true;
        if (!/[a-z]/.test(value)) errors.hasLowerCase = true;
        if (!/[0-9]/.test(value)) errors.hasNumber = true;
        if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) errors.hasSpecialChar = true;
        
        return Object.keys(errors).length > 0 ? errors : null;
      };
      passwordControl?.setValidators([Validators.required, passwordValidator]);
    }
    passwordControl?.updateValueAndValidity({ emitEvent: false });
    
    // Reset form validity when switching modes
    this.loginForm.reset();
    this.errorMessage = ''; // Clear error when switching modes
  }

  onSubmit(event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Clear name errors if in login mode (name is not required for login)
    if (this.isLoginMode) {
      this.loginForm.get('name')?.clearValidators();
      this.loginForm.get('name')?.updateValueAndValidity({ emitEvent: false });
    }
    
    // 1. Basic Validation - only check email and password for login
    if (this.isLoginMode) {
      const emailValid = this.loginForm.get('email')?.valid;
      const passwordValid = this.loginForm.get('password')?.valid;
      
      if (!emailValid || !passwordValid) {
        this.loginForm.markAllAsTouched();
        return;
      }
    } else {
      // Register mode - check all fields including name
      if (this.loginForm.invalid) {
        if (!this.loginForm.get('name')?.value) {
          this.loginForm.get('name')?.setErrors({ required: true });
        }
        this.loginForm.markAllAsTouched();
        return;
      }
    }

    this.isLoading = true;
    this.errorMessage = ''; // Clear previous errors
    const { name, email, password } = this.loginForm.value;

    if (this.isLoginMode) {
      // --- LOGIN ---
      this.apiService.login(email, password).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading = false;
          // Extract error message from HTTP error response
          this.errorMessage = err.error?.error || err.error?.message || 'Login failed. Please check your credentials.';
        }
      });
    } else {
      // --- REGISTER ---
      this.apiService.register(name, email, password).subscribe({
        next: () => {
          this.isLoading = false;
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading = false;
          // Extract error message from HTTP error response
          this.errorMessage = err.error?.error || err.error?.message || 'Registration failed. Please try again.';
        }
      });
    }
  }

}