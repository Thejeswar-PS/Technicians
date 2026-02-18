import { NgModule, CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { PartsRequestStatusComponent } from './parts-request-status/parts-request-status.component';
import { PartReturnStatusComponent } from './part-return-status/part-return-status.component';
import { OrderRequestComponent } from './order-request/order-request.component';
import { OrderRequestStatusComponent } from './order-request-status/order-request-status.component';
import { PartsTestInfoComponent } from './parts-test-info/parts-test-info.component';
import { StrippedUnitsStatusComponent } from './stripped-units-status/stripped-units-status.component';
import { StrippedUnitInfoComponent } from './stripped-unit-info/stripped-unit-info.component';
import { DcgDisplayReportDetailsComponent } from './dcg-display-report-details/dcg-display-report-details.component';
import { AccMgrPerformanceReportComponent } from './acc-mgr-performance-report/acc-mgr-performance-report.component';
import { EmergencyJobsComponent } from './emergency-jobs/emergency-jobs.component';

import { ReportsRoutingModule } from './report-routing.module';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { NgApexchartsModule } from 'ng-apexcharts';
// Using simple canvas charts instead of ng2-charts
import { PartsTestStatusComponent } from './parts-test-status/parts-test-status.component';
import { StrippedPartsInunitComponent } from './stripped-parts-inunit/stripped-parts-inunit.component';
import { PartsSearchComponent } from './parts-search/parts-search.component';
import { SharedModule } from '../../components/shared/shared.module';
import { ContractDetailsReportComponent } from './contract-details-report/contract-details-report.component';
import { PastDueContractDetailsComponent } from './past-due-contract-details/past-due-contract-details.component';
import { UPSTestStatusComponent } from './ups-test-status/ups-test-status.component';
import { NewUnitTestComponent } from './new-unit-test/new-unit-test.component';
import { DTechUsersDataComponent } from './dtech-users-data/dtech-users-data.component';
import { ExtranetUserClassesComponent } from './extranet-user-classes/extranet-user-classes.component';
import { UnscheduledReportComponent } from './unscheduled-report/unscheduled-report.component';
import { AccountingStatusComponent } from './accounting-status/accounting-status.component';
import { DcgEmpDetailsComponent } from './dcg-emp-details/dcg-emp-details.component';
import { TestEngineerJobsComponent } from './test-engineer-jobs/test-engineer-jobs.component';

@NgModule({
  declarations: [
    PartsRequestStatusComponent,
    PartReturnStatusComponent,
    OrderRequestComponent,
    OrderRequestStatusComponent,
    PartsTestInfoComponent,
    PartsTestStatusComponent,
    StrippedUnitsStatusComponent,
    StrippedUnitInfoComponent,
    StrippedPartsInunitComponent,
    DcgDisplayReportDetailsComponent,
    PartsSearchComponent,
    AccMgrPerformanceReportComponent,
    EmergencyJobsComponent,
    ContractDetailsReportComponent,
    PastDueContractDetailsComponent,
    UPSTestStatusComponent,
    NewUnitTestComponent,
    DTechUsersDataComponent,
    ExtranetUserClassesComponent,
    UnscheduledReportComponent,
    AccountingStatusComponent,
    DcgEmpDetailsComponent,
    TestEngineerJobsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    ReportsRoutingModule,
    InlineSVGModule.forRoot(),
    NgApexchartsModule,

    SharedModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA]
})
export class ReportsModule { }
