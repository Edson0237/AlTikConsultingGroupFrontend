import { TestBed } from '@angular/core/testing';

import { DossierDetailService } from './dossier-detail.service';

describe('DossierDetailService', () => {
  let service: DossierDetailService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DossierDetailService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
