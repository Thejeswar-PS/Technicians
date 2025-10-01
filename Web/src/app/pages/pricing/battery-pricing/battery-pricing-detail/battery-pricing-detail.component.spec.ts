import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BatteryPricingDetailComponent } from './battery-pricing-detail.component';

describe('BatteryPricingDetailComponent', () => {
  let component: BatteryPricingDetailComponent;
  let fixture: ComponentFixture<BatteryPricingDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BatteryPricingDetailComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BatteryPricingDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
