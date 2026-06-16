import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UniversiteDetailComponent } from './universite-detail.component';

describe('UniversiteDetailComponent', () => {
  let component: UniversiteDetailComponent;
  let fixture: ComponentFixture<UniversiteDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UniversiteDetailComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UniversiteDetailComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
