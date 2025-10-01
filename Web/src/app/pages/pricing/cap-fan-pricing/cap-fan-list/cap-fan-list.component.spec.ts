import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CapFanListComponent } from './cap-fan-list.component';

describe('CapFanListComponent', () => {
  let component: CapFanListComponent;
  let fixture: ComponentFixture<CapFanListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CapFanListComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CapFanListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
