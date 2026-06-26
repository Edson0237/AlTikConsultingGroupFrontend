import { TestBed } from '@angular/core/testing';

import { StaffMessagingService } from './staff-messaging.service';

describe('StaffMessagingService', () => {
  let service: StaffMessagingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StaffMessagingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
