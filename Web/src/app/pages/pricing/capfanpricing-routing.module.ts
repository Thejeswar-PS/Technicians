import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CapFanListComponent } from './cap-fan-pricing/cap-fan-list/cap-fan-list.component';
import { BatteryPricingComponent } from './battery-pricing/battery-pricing.component';
import { BatteryPricingDetailComponent } from './battery-pricing/battery-pricing-detail/battery-pricing-detail.component';
import { BatteryContactComponent } from './battery-contact/battery-contact.component';
import { BatteryPricingEditComponent } from './battery-pricing/battery-pricing-edit/battery-pricing-edit.component';
import { PricingProfileListComponent } from './battery-pricing/pricing-profile-list/pricing-profile-list.component';
import { CapFanPriceAddEditComponent } from './cap-fan-pricing/cap-fan-price-add-edit/cap-fan-price-add-edit.component';
import { BatteryPricingAddComponent } from './battery-pricing/battery-pricing-add/battery-pricing-add.component';

const routes: Routes = [
  {
    path: 'CapFanPricing',
    component: CapFanListComponent
  },
  {
    path: 'cap-fan-pricing-add-edit',
    component: CapFanPriceAddEditComponent
  },
  {
    path: 'BatteryPricing',
    component: BatteryPricingComponent
  },
  {
    path: 'add-new-battery',
    component: BatteryPricingAddComponent
  },
  {
    path: 'battery-pricing-edit',
    component: BatteryPricingEditComponent
  },
  {
    path: 'pricing-profile-list',
    component: PricingProfileListComponent
  },
  {
    path: 'dcg-pricing-detail',
    component: BatteryPricingDetailComponent
  },
  {
    path: 'VendorContact',
    component: BatteryContactComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CapfanpricingRoutingModule { }
