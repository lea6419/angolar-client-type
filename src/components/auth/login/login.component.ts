import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

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
    MatButtonModule
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

  constructor(private http: HttpClient, private router: Router) {}

  onLogin() {
    const requestBody = {
      email: this.form.email,
      password: this.form.password
    };

    this.http.post<any>('https://server-type-practicom.onrender.com/api/User/login', requestBody)
      .subscribe({
        next: (response) => {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user)); // שמירת פרטי המשתמש
          console.log('התחברת בהצלחה:', response);
          this.router.navigate(['/home']);
        },
        error: (err) => {
          console.error('שגיאה בהתחברות:', err);
          this.errorMessage = err.error?.message || 'אימייל או סיסמה שגויים';
        }
      });
  }
}
