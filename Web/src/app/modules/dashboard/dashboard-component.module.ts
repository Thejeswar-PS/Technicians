import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { DashboardFilterModule, DropdownMenusModule } from 'src/app/_metronic/partials';
import { NgApexchartsModule } from 'ng-apexcharts';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { DashboardToBeWrittenTableComponent } from './dashboard-to-be-written-table/dashboard-to-be-written-table.component';
import { DashboardToBeSentQuotesTableComponent } from './dashboard-to-be-sent-quotes-table/dashboard-to-be-sent-quotes-table.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { RouterModule } from '@angular/router';
@NgModule({
  imports: [
    CommonModule,
    InlineSVGModule,
    DropdownMenusModule,
    NgApexchartsModule,
    NgbDropdownModule,
    ReactiveFormsModule,
    DashboardFilterModule,
    MatTableModule,
    RouterModule
  ],
  exports:[
    DashboardToBeWrittenTableComponent,
    DashboardToBeSentQuotesTableComponent,
  ],
  declarations: [
    DashboardToBeWrittenTableComponent,
    DashboardToBeSentQuotesTableComponent,
    DashboardToBeSentQuotesTableComponent,
  ]
})
export class DashboarComponentdModule { }
