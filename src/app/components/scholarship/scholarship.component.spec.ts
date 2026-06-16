import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScholarshipComponent } from './scholarship.component';

describe('ScholarshipComponent', () => {
  let component: ScholarshipComponent;
  let fixture: ComponentFixture<ScholarshipComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScholarshipComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScholarshipComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
