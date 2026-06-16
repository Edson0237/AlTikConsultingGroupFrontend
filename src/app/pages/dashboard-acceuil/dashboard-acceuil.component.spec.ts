import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardAcceuilComponent } from './dashboard-acceuil.component';

describe('DashboardAcceuilComponent', () => {
  let component: DashboardAcceuilComponent;
  let fixture: ComponentFixture<DashboardAcceuilComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardAcceuilComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardAcceuilComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
