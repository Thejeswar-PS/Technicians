import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardViewComponent } from './dashboard-view.component';
import { RouterModule } from '@angular/router';
import { WidgetsModule, ModalsModule, DashboardFilterModule, DropdownMenusModule } from 'src/app/_metronic/partials';
import { ChartsComponent } from 'src/app/modules/widgets-examples/charts/charts.component';
import { DashboardModule } from '../dashboard/dashboard.module';
import { DashboardSalesComponent } from 'src/app/pages/dashboard-view/dashboard-sales/dashboard-sales.component';
import { DashboarComponentdModule } from 'src/app/modules/dashboard/dashboard-component.module';
import { HttpClientModule } from '@angular/common/http';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NgApexchartsModule } from 'ng-apexcharts';
import { DashboardWeeklyQuotoesComponent } from './dashboard-weekly-quotoes/dashboard-weekly-quotoes.component';
import { DashboardSalesBarChartComponent } from './dashboard-sales-bar-chart/dashboard-sales-bar-chart.component';
import { DashboardRecentActivitiesComponent } from './dashboard-recent-activities/dashboard-recent-activities.component';
import { DashboardCustomerSatisfactionComponent } from './dashboard-customer-satisfaction/dashboard-customer-satisfaction.component';
import { DashboardTopPerformersComponent } from './dashboard-top-performers/dashboard-top-performers.component';
import { DashboardJobsListComponent } from './dashboard-jobs-list/dashboard-jobs-list.component';


@NgModule({
  declarations: [
    DashboardViewComponent,
    DashboardSalesComponent,
    DashboardSalesBarChartComponent,
    DashboardWeeklyQuotoesComponent,
    DashboardRecentActivitiesComponent,
    DashboardCustomerSatisfactionComponent,
    DashboardTopPerformersComponent,
    DashboardJobsListComponent
  ],
  imports: [
    CommonModule,
    InlineSVGModule,
    RouterModule.forChild([
      {
        path: '',
        component: DashboardViewComponent,
      },
    ]),
    WidgetsModule,
    ModalsModule,
    // DashboarComponentdModule,
    HttpClientModule,
    DashboardFilterModule,
    DropdownMenusModule,
    NgApexchartsModule,
    NgbDropdownModule,
    ReactiveFormsModule,
    MatTableModule,
  ],
})
export class DashboardViewModule { }

