import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BussinessVisaComponent } from './bussiness-visa.component';

describe('BussinessVisaComponent', () => {
  let component: BussinessVisaComponent;
  let fixture: ComponentFixture<BussinessVisaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BussinessVisaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BussinessVisaComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
