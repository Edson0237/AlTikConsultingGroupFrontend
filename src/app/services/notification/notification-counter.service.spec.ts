import { TestBed } from '@angular/core/testing';

import { NotificationCounterService } from './notification-counter.service';

describe('NotificationCounterService', () => {
  let service: NotificationCounterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationCounterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
