import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { ApiService } from '../api.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.scss']
})
export class ResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  token = '';
  
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
    private route: ActivatedRoute,
    private apiService: ApiService
  ) {
    // Custom password validator
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
    
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, passwordValidator]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
    // Get token from URL query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (!this.token) {
        this.errorMessage = 'Invalid reset link. Please request a new password reset.';
      }
    });
    
    // Watch password changes to update requirements display
    this.resetPasswordForm.get('newPassword')?.valueChanges.subscribe(value => {
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

  passwordMatchValidator(group: FormGroup) {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    if (!newPassword || !confirmPassword) {
      return null;
    }
    
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit() {
    if (this.resetPasswordForm.invalid || !this.token) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const { newPassword } = this.resetPasswordForm.value;

    this.apiService.resetPassword(this.token, newPassword).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = response.message;
        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.error || err.error?.message || 'Failed to reset password. Please try again.';
      }
    });
  }
}

