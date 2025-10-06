import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JobListComponent } from './job-list/job-list.component';
import { JobEditComponent } from './job-edit/job-edit.component';
import { JobExpensesComponent } from './job-expenses/job-expenses.component';

const routes: Routes = [
  {
    path : '', component : JobListComponent,
    children : [
      {
        path : 'job-list', component: JobListComponent
      },
      {
        path : 'job-edit', component: JobEditComponent
      }
    ]
  },
  {
    path: 'expenses', component: JobExpensesComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JobsRoutingModule { }
