import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TrendingReportTeamsComponent } from './trending-report-teams/trending-report-teams.component';
import { AccountManagerGraphComponent } from '../reports/account-manager-graph/account-manager-graph.component';


const routes: Routes = [
  {
    path: '',
    redirectTo: 'trending-report-teams',
    pathMatch: 'full'
  },
  {
    path: 'trending-report-teams',
    component: TrendingReportTeamsComponent
  },
  {
    path: 'account-manager-graph',
    component: AccountManagerGraphComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GraphsRoutingModule { }
