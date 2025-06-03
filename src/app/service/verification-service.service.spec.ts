import { TestBed } from '@angular/core/testing';

import { VerificationServiceService } from './verification-service.service';

describe('VerificationServiceService', () => {
  let service: VerificationServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VerificationServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
