import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TechToolsComponent } from './tech-tools/tech-tools.component';

const routes: Routes = [
  {
    path: 'tech-tools',
    component: TechToolsComponent
  },
  {
    path: '',
    redirectTo: 'tech-tools',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ToolsRoutingModule { }
