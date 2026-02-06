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

  constructor(
    private fb: FormBuilder, 
    private router: Router,
    private apiService: ApiService // Inject Service
  ) {
    this.loginForm = this.fb.group({
      // Name is only required if NOT in login mode
      name: [''], 
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    // Reset form validity when switching modes
    this.loginForm.reset();
    this.errorMessage = ''; // Clear error when switching modes
  }

  onSubmit() {
    // 1. Basic Validation
    if (this.loginForm.invalid) {
      // If in Register mode, Name is mandatory.
      if (!this.isLoginMode && !this.loginForm.get('name')?.value) {
        this.loginForm.get('name')?.setErrors({ required: true });
      }
      
      // If basic fields are missing
      if (this.loginForm.invalid) {
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
          console.error('Login error:', err);
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
          console.error('Registration error:', err);
        }
      });
    }
  }

}