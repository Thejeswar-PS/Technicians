import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TrendingReportTeamsComponent } from './trending-report-teams/trending-report-teams.component';
import { AccountManagerGraphComponent } from '../reports/account-manager-graph/account-manager-graph.component';
import { PastDueGraphComponent } from './past-due-graph/past-due-graph.component';


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
  },
  {
    path: 'past-due-graph',
    component: PastDueGraphComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GraphsRoutingModule { }
