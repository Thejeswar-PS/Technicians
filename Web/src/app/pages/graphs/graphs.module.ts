import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { TrendingReportTeamsComponent } from './trending-report-teams/trending-report-teams.component';
import { GraphsRoutingModule } from './graphs-routing.module';
import { TeamGridComponent } from './shared/team-grid/team-grid.component';


@NgModule({
  declarations: [
    TrendingReportTeamsComponent,
    TeamGridComponent
  ],
  imports: [
    CommonModule,
    GraphsRoutingModule,
    InlineSVGModule.forRoot(),
    ReactiveFormsModule
  ]
})
export class GraphsModule { }
