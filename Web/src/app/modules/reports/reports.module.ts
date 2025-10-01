import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportsRoutingModule } from './reports-routing.module';
import { ListComponent } from './list/list.component';
import { LayoutModule } from 'src/app/_metronic/layout';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { CoreModule } from 'src/app/core/core.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WidgetsModule } from 'src/app/_metronic/partials';
import { SharedModule } from 'src/app/components/shared/shared.module';

@NgModule({
  declarations: [
    ListComponent
  ],
  imports: [
    ReactiveFormsModule,
    ReportsRoutingModule,
    WidgetsModule,
    SharedModule,
    LayoutModule,
    InlineSVGModule,
    CoreModule,
    FormsModule,
    CommonModule,
  ]
})
export class ReportsModule { }
