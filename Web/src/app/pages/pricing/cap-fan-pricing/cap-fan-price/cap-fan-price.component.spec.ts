import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CapFanPriceComponent } from './cap-fan-price.component';

describe('CapFanPriceComponent', () => {
  let component: CapFanPriceComponent;
  let fixture: ComponentFixture<CapFanPriceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CapFanPriceComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CapFanPriceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
