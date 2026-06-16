import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UniversitiesComponent } from './universities.component';

describe('UniversitiesComponent', () => {
  let component: UniversitiesComponent;
  let fixture: ComponentFixture<UniversitiesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UniversitiesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UniversitiesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
