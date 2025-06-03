export interface VerificationResponse {
  status: number;
  success: boolean;
  message: string;
}


// src/app/components/login/login.component.ts - מעודכן
import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { ValidationService } from '../../../app/service/validation-service.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatIconModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  form = {
    email: '',
    password: ''
  };
  
  errorMessage = '';
  isLoading = false;
  
  // שגיאות ולידציה
  validationErrors = {
    email: '',
    password: ''
  };

  constructor(
    private http: HttpClient, 
    private router: Router,
    private validationService: ValidationService,
    private snackBar: MatSnackBar
  ) {}

  // בדיקת ולידציה
  validateField(field: string) {
    switch (field) {
      case 'email':
        this.validationErrors.email = this.validationService.isValidEmail(this.form.email) 
          ? '' : 'כתובת אימייל לא תקינה';
        break;
      
      case 'password':
        this.validationErrors.password = this.form.password.length >= 6 
          ? '' : 'סיסמה חייבת להכיל לפחות 6 תווים';
        break;
    }
  }

  // בדיקה אם הטופס תקין
  isFormValid(): boolean {
    return this.validationErrors.email === '' && 
           this.validationErrors.password === '' &&
           this.form.email.trim() !== '' && 
           this.form.password.trim() !== '';
  }

  onLogin() {
    // בדיקת ולידציה
    this.validateField('email');
    this.validateField('password');

    if (!this.isFormValid()) {
      this.errorMessage = 'נא למלא את כל השדות בצורה תקינה';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const requestBody = {
      email: this.form.email,
      password: this.form.password
    };

    this.http.post<any>('https://server-type-practicom.onrender.com/api/User/login', requestBody)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          
          this.snackBar.open('התחברת בהצלחה!', 'סגור', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          
          console.log('התחברת בהצלחה:', response);
          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.isLoading = false;
          console.error('שגיאה בהתחברות:', err);
          
          if (err.status === 401) {
            this.errorMessage = 'אימייל או סיסמה שגויים';
          } else if (err.status === 403) {
            this.errorMessage = 'חשבון לא מאומת. נא לאמת את כתובת האימייל';
          } else {
            this.errorMessage = err.error?.message || 'שגיאה בהתחברות';
          }
        }
      });
  }
}