import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { VerificationResponse } from '../../components/auth/login/login.component';


export @Injectable({
  providedIn: 'root'
})
class VerificationService {
  private baseUrl = 'https://server-type-practicom.onrender.com/api/Verification';

  constructor(private http: HttpClient) {}

  sendVerificationCode(email: string) {
    return this.http.post<VerificationResponse>(`${this.baseUrl}/send-code`, null, {
      params: { email }
    });
  }

  verifyCode(email: string, code: string) {
    return this.http.post<VerificationResponse>(`${this.baseUrl}/verify-code`, null, {
      params: { email, code }
    });
  }
}


