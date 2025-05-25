import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    HttpClientModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  form = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };

  errorMessage = '';

  constructor(private http: HttpClient, private router: Router) {}

  onRegister() {
    if (this.form.password !== this.form.confirmPassword) {
      this.errorMessage = 'הסיסמאות לא תואמות';
      return;
    }

    const requestBody = {
      fullName: this.form.name,
      email: this.form.email,
      password: this.form.password,
      role: 'user' // או 'admin' לפי הצורך
    };

    this.http.post<any>('https://server-type-practicom.onrender.com/api/User/register', requestBody)
      .subscribe({
        next: (response) => {
          console.log('נרשמת בהצלחה:', response);
          this.router.navigate(['/home']); // ניווט אחרי הרשמה
        },
        error: (err) => {
          console.error('שגיאה ברישום:', err);
          this.errorMessage = err.error?.message || 'שגיאה כללית ברישום';
        }
      });
  }
}
