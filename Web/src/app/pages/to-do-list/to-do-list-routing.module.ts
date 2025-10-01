import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SendServiceReportsComponent } from './send-service-reports/send-service-reports.component';


const routes: Routes = [
  {
    path : '', component : SendServiceReportsComponent,
    children : [
      {
        path : 'send-service-reports', component: SendServiceReportsComponent
      },
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ToDoListRoutingModule { }
