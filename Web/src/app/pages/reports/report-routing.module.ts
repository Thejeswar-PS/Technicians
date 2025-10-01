import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JobReportDetailsComponent } from './job-report-details/job-report-details.component';
import { JobScheduleReportComponent } from './job-schedule-report/job-schedule-report.component';

const routes: Routes = [
  {
    path : '', component : JobReportDetailsComponent,
    children : [
      {
        path : 'job-report-details', component: JobReportDetailsComponent
      },
      {
        path : 'job-schedule-report', component: JobScheduleReportComponent
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
