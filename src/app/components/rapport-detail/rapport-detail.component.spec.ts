import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RapportDetailComponent } from './rapport-detail.component';

describe('RapportDetailComponent', () => {
  let component: RapportDetailComponent;
  let fixture: ComponentFixture<RapportDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RapportDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(RapportDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
