import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { NgApexchartsModule } from 'ng-apexcharts';
import { TrendingReportTeamsComponent } from './trending-report-teams/trending-report-teams.component';
import { GraphsRoutingModule } from './graphs-routing.module';
import { TeamGridComponent } from './shared/team-grid/team-grid.component';
import { AccountManagerGraphComponent } from '../reports/account-manager-graph/account-manager-graph.component';
import { PastDueGraphComponent } from './past-due-graph/past-due-graph.component';
import { CapFanUsageYearlyComponent } from './cap-fan-usage-yearly/cap-fan-usage-yearly.component';
import { UnscheduledJobsGraphComponent } from './unscheduled-jobs-graph/unscheduled-jobs-graph.component';
import { PartsPerformanceGraphComponent } from './parts-performance-graph/parts-performance-graph.component';
import { SharedModule } from '../../components/shared/shared.module';


@NgModule({
  declarations: [
    TrendingReportTeamsComponent,
    TeamGridComponent,
    AccountManagerGraphComponent,
    PastDueGraphComponent,
    CapFanUsageYearlyComponent,
    UnscheduledJobsGraphComponent,
    PartsPerformanceGraphComponent
  ],
  imports: [
    CommonModule,
    GraphsRoutingModule,
    InlineSVGModule.forRoot(),
    ReactiveFormsModule,
    FormsModule,
    NgApexchartsModule,
    SharedModule
  ]
})
export class GraphsModule { }
