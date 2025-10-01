import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobReportDetailsComponent } from './job-report-details/job-report-details.component';
import { JobScheduleReportComponent } from './job-schedule-report/job-schedule-report.component';
import { ReportsRoutingModule } from './report-routing.module';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { ReactiveFormsModule } from '@angular/forms';



@NgModule({
  declarations: [
    JobReportDetailsComponent,
    JobScheduleReportComponent
  ],
  imports: [
    CommonModule,
    ReportsRoutingModule,
    InlineSVGModule.forRoot(),
    ReactiveFormsModule
  ]
})
export class ReportsModule { }
