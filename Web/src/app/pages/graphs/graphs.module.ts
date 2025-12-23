import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { NgApexchartsModule } from 'ng-apexcharts';
import { TrendingReportTeamsComponent } from './trending-report-teams/trending-report-teams.component';
import { GraphsRoutingModule } from './graphs-routing.module';
import { TeamGridComponent } from './shared/team-grid/team-grid.component';
import { AccountManagerGraphComponent } from '../reports/account-manager-graph/account-manager-graph.component';
import { SharedModule } from '../../components/shared/shared.module';


@NgModule({
  declarations: [
    TrendingReportTeamsComponent,
    TeamGridComponent,
    AccountManagerGraphComponent
  ],
  imports: [
    CommonModule,
    GraphsRoutingModule,
    InlineSVGModule.forRoot(),
    ReactiveFormsModule,
    NgApexchartsModule,
    SharedModule
  ]
})
export class GraphsModule { }
