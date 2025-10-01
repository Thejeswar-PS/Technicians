import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CapFanPriceComponent } from './cap-fan-pricing/cap-fan-price/cap-fan-price.component';
import { CapfanpricingRoutingModule } from './capfanpricing-routing.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CapFanListComponent } from './cap-fan-pricing/cap-fan-list/cap-fan-list.component';
import { BatteryPricingComponent } from './battery-pricing/battery-pricing.component';
import { BatteryPricingDetailComponent } from './battery-pricing/battery-pricing-detail/battery-pricing-detail.component';
import { QuantityComponent } from './battery-pricing/quantity/quantity.component';
import { BatteryContactComponent } from './battery-contact/battery-contact.component';
import { BatteryContactAddUpdateComponent } from './battery-contact/battery-contact-add-update/battery-contact-add-update.component';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ToastrModule } from 'ngx-toastr';
import { BatteryPricingEditComponent } from './battery-pricing/battery-pricing-edit/battery-pricing-edit.component';
import { PricingProfileListComponent } from './battery-pricing/pricing-profile-list/pricing-profile-list.component';
import { PricingProfileEditComponent } from './battery-pricing/pricing-profile-edit/pricing-profile-edit.component';
import { CapFanPriceAddEditComponent } from './cap-fan-pricing/cap-fan-price-add-edit/cap-fan-price-add-edit.component';
import { BatteryPricingAddComponent } from './battery-pricing/battery-pricing-add/battery-pricing-add.component';

@NgModule({
  declarations: [
    CapFanPriceComponent,
    CapFanListComponent,
    CapFanPriceAddEditComponent,
    BatteryPricingComponent,
    BatteryPricingDetailComponent,
    QuantityComponent,
    BatteryContactComponent,
    BatteryContactAddUpdateComponent,
    BatteryPricingEditComponent,
    PricingProfileListComponent,
    PricingProfileEditComponent,
    BatteryPricingAddComponent
  ],
  imports: [
    CommonModule,
    CapfanpricingRoutingModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class CapfanpricingModule { }
