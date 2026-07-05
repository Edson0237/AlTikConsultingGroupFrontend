import { TestBed } from '@angular/core/testing';

import { NotificationAdminService } from './notification-admin.service';

describe('NotificationAdminService', () => {
  let service: NotificationAdminService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationAdminService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
