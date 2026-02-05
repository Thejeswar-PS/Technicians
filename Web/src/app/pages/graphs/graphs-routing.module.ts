import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AccountManagerGraphComponent } from '../reports/account-manager-graph/account-manager-graph.component';
import { PastDueGraphComponent } from './past-due-graph/past-due-graph.component';
import { CapFanUsageYearlyComponent } from './cap-fan-usage-yearly/cap-fan-usage-yearly.component';
import { UnscheduledJobsGraphComponent } from './unscheduled-jobs-graph/unscheduled-jobs-graph.component';
import { PartsPerformanceGraphComponent } from './parts-performance-graph/parts-performance-graph.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'account-manager-graph',
    pathMatch: 'full'
  },
  {
    path: 'account-manager-graph',
    component: AccountManagerGraphComponent
  },
  {
    path: 'past-due-graph',
    component: PastDueGraphComponent
  },
  {
    path: 'cap-fan-usage-yearly',
    component: CapFanUsageYearlyComponent
  },
  {
    path: 'unscheduled-jobs-graph',
    component: UnscheduledJobsGraphComponent
  },
  {
    path: 'parts-performance-graph',
    component: PartsPerformanceGraphComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GraphsRoutingModule { }
