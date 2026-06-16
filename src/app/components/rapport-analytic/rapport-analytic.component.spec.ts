import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RapportAnalyticComponent } from './rapport-analytic.component';

describe('RapportAnalyticComponent', () => {
  let component: RapportAnalyticComponent;
  let fixture: ComponentFixture<RapportAnalyticComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RapportAnalyticComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RapportAnalyticComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
