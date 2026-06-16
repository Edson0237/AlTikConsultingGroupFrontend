import { TestBed } from '@angular/core/testing';

import { FiliereBourseService } from './filiere-bourse.service';

describe('FiliereBourseService', () => {
  let service: FiliereBourseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FiliereBourseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
