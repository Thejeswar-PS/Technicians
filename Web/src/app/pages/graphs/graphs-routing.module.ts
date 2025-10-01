import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TrendingReportTeamsComponent } from './trending-report-teams/trending-report-teams.component';


const routes: Routes = [
  {
    path : '', component : TrendingReportTeamsComponent,
    children : [
      {
        path : 'trending-report-teams', component: TrendingReportTeamsComponent
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GraphsRoutingModule { }
