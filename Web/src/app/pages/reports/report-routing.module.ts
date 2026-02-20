import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
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
import { EmergencyJobsComponent } from './emergency-jobs/emergency-jobs.component';
import { UPSTestStatusComponent } from './ups-test-status/ups-test-status.component';
import { NewUnitTestComponent } from './new-unit-test/new-unit-test.component';
import { ContractDetailsReportComponent } from './contract-details-report/contract-details-report.component';
import { PastDueContractDetailsComponent } from './past-due-contract-details/past-due-contract-details.component';
import { DTechUsersDataComponent } from './dtech-users-data/dtech-users-data.component';
import { ExtranetUserClassesComponent } from './extranet-user-classes/extranet-user-classes.component';
import { UnscheduledReportComponent } from './unscheduled-report/unscheduled-report.component';
import { AccountingStatusComponent } from './accounting-status/accounting-status.component';
import { DcgEmpDetailsComponent } from './dcg-emp-details/dcg-emp-details.component';
import { TestEngineerJobsComponent } from './test-engineer-jobs/test-engineer-jobs.component';
import { TestEngineerJobsEntryComponent } from './test-engineer-jobs/test-engineer-jobs-entry/test-engineer-jobs-entry.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'parts-request-status',
    pathMatch: 'full'
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
  },
  {
    path: 'emergency-jobs',
    component: EmergencyJobsComponent
  },
  {
    path: 'ups-test-status',
    component: UPSTestStatusComponent
  },
  {
    path: 'new-unit-test',
    component: NewUnitTestComponent
  },
  {
    path: 'new-unit-test/:rowIndex',
    component: NewUnitTestComponent
  },
  {
    path: 'contract-details-report',
    component: ContractDetailsReportComponent
  },
  {
    path: 'past-due-contract-details',
    component: PastDueContractDetailsComponent
  },
  {
    path: 'dtech-users-data',
    component: DTechUsersDataComponent
  },
  {
    path: 'extranet-user-classes',
    component: ExtranetUserClassesComponent
  },
  {
    path: 'unscheduled-report',
    component: UnscheduledReportComponent
  },
  {
    path: 'accounting-status',
    component: AccountingStatusComponent
  },
  {
    path: 'dcg-emp-details',
    component: DcgEmpDetailsComponent
  },
  {
    path: 'test-engineer-jobs',
    component: TestEngineerJobsComponent
  },
  {
    path: 'test-engineer-jobs/entry/:id',
    component: TestEngineerJobsEntryComponent
  },
  {
    path: 'test-engineer-jobs/entry',
    component: TestEngineerJobsEntryComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ReportsRoutingModule { }
