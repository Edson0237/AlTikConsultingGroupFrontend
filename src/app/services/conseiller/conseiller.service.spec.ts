import { TestBed } from '@angular/core/testing';

import { ConseillerService } from './conseiller.service';

describe('ConseillerService', () => {
  let service: ConseillerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConseillerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
