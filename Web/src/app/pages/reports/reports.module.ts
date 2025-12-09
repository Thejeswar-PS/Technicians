import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { JobReportDetailsComponent } from './job-report-details/job-report-details.component';
import { JobScheduleReportComponent } from './job-schedule-report/job-schedule-report.component';
import { PartsRequestStatusComponent } from './parts-request-status/parts-request-status.component';
import { PartReturnStatusComponent } from './part-return-status/part-return-status.component';
import { OrderRequestComponent } from './order-request/order-request.component';

import { ReportsRoutingModule } from './report-routing.module';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { NgApexchartsModule } from 'ng-apexcharts';

@NgModule({
  declarations: [
    JobReportDetailsComponent,
    JobScheduleReportComponent,
    PartsRequestStatusComponent,
    PartReturnStatusComponent,
    OrderRequestComponent,

  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ReportsRoutingModule,
    InlineSVGModule.forRoot(),
    NgApexchartsModule
  ]
})
export class ReportsModule { }
