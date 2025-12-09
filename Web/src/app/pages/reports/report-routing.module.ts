import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JobReportDetailsComponent } from './job-report-details/job-report-details.component';
import { JobScheduleReportComponent } from './job-schedule-report/job-schedule-report.component';
import { PartsRequestStatusComponent } from './parts-request-status/parts-request-status.component';
import { PartReturnStatusComponent } from './part-return-status/part-return-status.component';
import { OrderRequestComponent } from './order-request/order-request.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'job-report-details',
    pathMatch: 'full'
  },
  {
    path: 'job-report-details', 
    component: JobReportDetailsComponent
  },
  {
    path: 'job-schedule-report', 
    component: JobScheduleReportComponent
  },
  {
    path: 'parts-request-status', 
    component: PartsRequestStatusComponent
  },
  {
    path: 'part-return-status', 
    component: PartReturnStatusComponent
  },
  {
    path: 'order-request', 
    component: OrderRequestComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
