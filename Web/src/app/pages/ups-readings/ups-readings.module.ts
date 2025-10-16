import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { UpsReadingsComponent } from './ups-readings.component';
import { SharedModule } from '../../components/shared/shared.module';

@NgModule({
  declarations: [
    UpsReadingsComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    SharedModule
  ],
  exports: [
    UpsReadingsComponent
  ]
})
export class UpsReadingsModule { }