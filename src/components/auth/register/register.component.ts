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
import { VerificationService } from '../../../app/service/verification-service.service';
import { ValidationService } from '../../../app/service/validation-service.service';


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
  
  verificationCode = '';
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  
  // שלבי האימות
  currentStep: 'form' | 'email-verification' | 'completed' = 'form';
  
  constructor(
    private http: HttpClient, 
    private router: Router,
    private verificationService: VerificationService,
    private validationService: ValidationService
  ) {}

  // בדיקת תקינות הטופס
  validateForm(): boolean {
    this.errorMessage = '';
    
    // בדיקת שם
    if (!this.validationService.isValidName(this.form.name)) {
      this.errorMessage = 'שם לא תקין - השם חייב להכיל לפחות 2 תווים ורק אותיות';
      return false;
    }
    
    // בדיקת מייל
    if (!this.validationService.isValidEmail(this.form.email)) {
      this.errorMessage = 'כתובת המייל לא תקינה';
      return false;
    }
    
    // בדיקת סיסמה
    const passwordValidation = this.validationService.validatePassword(this.form.password);
    if (!passwordValidation.isValid) {
      this.errorMessage = passwordValidation.errors[0];
      return false;
    }
    
    // בדיקת התאמת סיסמאות
    if (!this.validationService.passwordsMatch(this.form.password, this.form.confirmPassword)) {
      this.errorMessage = 'הסיסמאות לא תואמות';
      return false;
    }
    
    return true;
  }

  // שליחת קוד אימות למייל
  async sendVerificationCode() {
    if (!this.validateForm()) {
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    try {
      const response: any = await this.verificationService.sendVerificationCode(this.form.email).toPromise();
      
      console.log('תגובת השרת לשליחת קוד:', response); // לדיבוג
      
      // נסה כמה אפשרויות שונות של תגובה מוצלחתi
      if (response?.success || response?.statusCode === 'success' || response?.message?.includes('נשלח') || !response?.error) {
        this.successMessage = 'קוד אימות נשלח למייל שלך';
        this.currentStep = 'email-verification';
      } else {
        this.errorMessage = response?.message || response?.error || 'שגיאה בשליחת קוד האימות';
      }
    } catch (error: any) {
      console.error('שגיאה בשליחת קוד אימות:', error);
      
      // אם השגיאה היא 200 (הצלחה) אבל נזרקה כשגיאה
      if (error.status === 200 || error.statusText === 'OK') {
        this.successMessage = 'קוד אימות נשלח למייל שלך';
        this.currentStep = 'email-verification';
      } else {
        this.errorMessage = error.error?.message || error.message || 'שגיאה בשליחת קוד האימות';
      }
    } finally {
      this.isLoading = false;
    }
  }

  // אימות הקוד שהתקבל במייל
  async verifyEmailCode() {
    if (!this.verificationCode || this.verificationCode.trim().length !== 6) {
      this.errorMessage = 'יש להזין קוד אימות בן 6 ספרות';
      return;
    }
  
    if (!/^\d{6}$/.test(this.verificationCode.trim())) {
      this.errorMessage = 'קוד האימות חייב להכיל 6 ספרות בלבד';
      return;
    }
  
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
  
    try {
      const response: any = await this.verificationService.verifyCode(this.form.email, this.verificationCode.trim()).toPromise();
  
      console.log('תגובת השרת לאימות קוד:', response);
      if (response.isSuccess || response.status === 200) {
        this.successMessage = 'המייל אומת בהצלחה! מועבר לעמוד ההתחברות...';
        setTimeout(() => {
          this.router.navigate(['/login']); // הנתיב לעמוד התחברות
        }, 2000);
      } else {
        this.errorMessage = response?.message || 'קוד אימות שגוי או פג תוקף';
      }
    } catch (error: any) {
      console.error('שגיאה באימות קוד:', error);
      this.errorMessage = error.error?.message || 'שגיאה באימות הקוד';
    } finally {
      this.isLoading = false;
    }
  }
  
  // השלמת תהליך הרישום אחרי אימות המייל
  async completeRegistration() {
    const requestBody = {
      fullName: this.form.name,
      email: this.form.email,
      password: this.form.password,
      role: 'user',
      isEmailVerified: true // מציינים שהמייל אומת
    };

    try {
      const response = await this.http.post<any>('https://server-type-practicom.onrender.com/api/User/register', requestBody).toPromise();
      
      console.log('נרשמת בהצלחה:', response);
      this.currentStep = 'completed';
      this.successMessage = 'נרשמת בהצלחה! מועבר לעמוד הבית...';
      
      // המתן קצר לפני הניווט
      setTimeout(() => {
        this.router.navigate(['/home']);
      }, 2000);
      
    } catch (error: any) {
      console.error('שגיאה ברישום:', error);
      this.errorMessage = error.error?.message || 'שגיאה כללית ברישום';
    }
  }

  // חזרה לשלב הקודם
  goBack() {
    this.currentStep = 'form';
    this.errorMessage = '';
    this.successMessage = '';
    this.verificationCode = '';
  }

  // שליחה מחדש של קוד אימות
  async resendCode() {
    this.errorMessage = '';
    this.successMessage = '';
    this.verificationCode = ''; // מנקה את הקוד הקודם
    
    this.isLoading = true;
    
    try {
      const response = await this.verificationService.sendVerificationCode(this.form.email).toPromise();
      
      if (response?.success) {
        this.successMessage = 'קוד אימות חדש נשלח למייל שלך';
      } else {
        this.errorMessage = response?.message || 'שגיאה בשליחת קוד האימות';
      }
    } catch (error: any) {
      console.error('שגיאה בשליחת קוד אימות מחדש:', error);
      this.errorMessage = error.error?.message || 'שגיאה בשליחת קוד האימות';
    } finally {
      this.isLoading = false;
    }
  }

  // הפונקציה הראשית שמתחילה את התהליך
  onRegister() {
    this.sendVerificationCode();
  }

  // פונקציה לטיפול בשינוי קוד האימות
  onVerificationCodeChange(event: any) {
    const value = event.target.value;
    // מסנן רק ספרות ומגביל ל-6 תווים
    const filteredValue = value.replace(/[^0-9]/g, '').substring(0, 6);
    this.verificationCode = filteredValue;
    event.target.value = filteredValue;
    
    // מנקה הודעת שגיאה כשמתחילים להקליד
    if (this.errorMessage) {
      this.errorMessage = '';
    }
  }

  // פונקציה לטיפול בהדבקת קוד אימות
  onPasteVerificationCode(event: ClipboardEvent) {
    event.preventDefault();
    const pastedText = event.clipboardData?.getData('text') || '';
    
    // מסנן רק ספרות ומגביל ל-6 תווים
    const filteredValue = pastedText.replace(/[^0-9]/g, '').substring(0, 6);
    this.verificationCode = filteredValue;
    
    // מנקה הודעת שגיאה
    if (this.errorMessage) {
      this.errorMessage = '';
    }
    
    // אם הקוד מלא (6 ספרות), אפשר לאמת אוטומטית
    if (filteredValue.length === 6) {
      // אופציונלי: אימות אוטומטי
      // setTimeout(() => this.verifyEmailCode(), 500);
    }
  }
}