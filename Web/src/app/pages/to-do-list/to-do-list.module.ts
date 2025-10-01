import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SendServiceReportsComponent } from './send-service-reports/send-service-reports.component';
import { ToDoListRoutingModule } from './to-do-list-routing.module';
import { ReactiveFormsModule } from '@angular/forms';
import { InlineSVGModule } from 'ng-inline-svg-2';



@NgModule({
  declarations: [
    SendServiceReportsComponent
  ],
  imports: [
    CommonModule,
    ToDoListRoutingModule,
    InlineSVGModule.forRoot(),
    ReactiveFormsModule
  ]
})
export class ToDoListModule { }
