import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JobReportDetailsComponent } from './job-report-details/job-report-details.component';
import { JobScheduleReportComponent } from './job-schedule-report/job-schedule-report.component';
import { PartsRequestStatusComponent } from './parts-request-status/parts-request-status.component';
import { PartReturnStatusComponent } from './part-return-status/part-return-status.component';
import { OrderRequestComponent } from './order-request/order-request.component';
import { OrderRequestStatusComponent } from './order-request-status/order-request-status.component';
import { PartsTestInfoComponent } from './parts-test-info/parts-test-info.component';
import { PartsTestStatusComponent } from './parts-test-status/parts-test-status.component';
import { StrippedUnitsStatusComponent } from './stripped-units-status/stripped-units-status.component';
import { StrippedUnitInfoComponent } from './stripped-unit-info/stripped-unit-info.component';
import { StrippedPartsInunitComponent } from './stripped-parts-inunit/stripped-parts-inunit.component';
import { DcgDisplayReportDetailsComponent } from './dcg-display-report-details/dcg-display-report-details.component';
import { PartsSearchComponent } from './parts-search/parts-search.component';
import { AccMgrPerformanceReportComponent } from './acc-mgr-performance-report/acc-mgr-performance-report.component';

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
  },
  {
    path: 'order-request-status', 
    component: OrderRequestStatusComponent
  },
  {
    path: 'parts-test-info', 
    component: PartsTestInfoComponent
  },
  {
    path: 'parts-test-status', 
    component: PartsTestStatusComponent
  },
  {
    path: 'stripped-units-status', 
    component: StrippedUnitsStatusComponent
  },
  {
    path: 'stripped-unit-info', 
    component: StrippedUnitInfoComponent
  },
  {
    path: 'stripped-parts-inunit', 
    component: StrippedPartsInunitComponent
  },
  {
    path: 'stripped-parts-inunit/:masterRowIndex', 
    component: StrippedPartsInunitComponent
  },
  {
    path: 'dcg-display-report-details',
    component: DcgDisplayReportDetailsComponent
  },
  {
    path: 'parts-search',
    component: PartsSearchComponent
  },
  {
    path: 'acc-mgr-performance-report',
    component: AccMgrPerformanceReportComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
