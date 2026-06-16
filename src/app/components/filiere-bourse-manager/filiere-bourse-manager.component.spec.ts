import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FiliereBourseManagerComponent } from './filiere-bourse-manager.component';

describe('FiliereBourseManagerComponent', () => {
  let component: FiliereBourseManagerComponent;
  let fixture: ComponentFixture<FiliereBourseManagerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FiliereBourseManagerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FiliereBourseManagerComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
