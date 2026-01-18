import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { QuotesService } from './services/quotes.service';
import { HttpClientModule } from '@angular/common/http';
import { DashboardService } from './services/dashboard.service';
import { NewDisplayCallsDetailService } from './services/new-display-calls-detail.service';



@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HttpClientModule
  ],
  providers : [
    QuotesService,
    NewDisplayCallsDetailService
  ]

})
export class CoreModule { }
