import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MiscellaneousTasksComponent } from './miscellaneous-tasks.component';

const routes: Routes = [
  {
    path: '',
    component: MiscellaneousTasksComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MiscellaneousTasksRoutingModule { }
