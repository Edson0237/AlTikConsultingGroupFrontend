import { TestBed } from '@angular/core/testing';

import { RapportAnalyseService } from './rapport-analyse.service';

describe('RapportAnalyseService', () => {
  let service: RapportAnalyseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RapportAnalyseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
