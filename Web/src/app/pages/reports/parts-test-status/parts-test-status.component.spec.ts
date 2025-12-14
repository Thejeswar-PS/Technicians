import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PartsTestStatusComponent } from './parts-test-status.component';

describe('PartsTestStatusComponent', () => {
  let component: PartsTestStatusComponent;
  let fixture: ComponentFixture<PartsTestStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PartsTestStatusComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PartsTestStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
