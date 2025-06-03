export interface VerificationResponse {
  success: boolean;
  message: string;
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

import { Injectable } from '@angular/core';

export @Injectable({
  providedIn: 'root'
})
// Validation Service
class ValidationService {
  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  isValidName(name: string): boolean {
    return name.trim().length >= 2 && /^[a-zA-Zא-ת\s]+$/.test(name);
  }

  validatePassword(password: string): ValidationResult {
    const errors: string[] = [];
    
    if (password.length < 6) {
      errors.push('הסיסמה חייבת להכיל לפחות 6 תווים');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('הסיסמה חייבת להכיל לפחות אות גדולה אחת');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('הסיסמה חייבת להכיל לפחות ספרה אחת');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  passwordsMatch(password: string, confirmPassword: string): boolean {
    return password === confirmPassword;
  }
}
