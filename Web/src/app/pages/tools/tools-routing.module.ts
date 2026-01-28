import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TechToolsComponent } from './tech-tools/tech-tools.component';
import { NotesSearchComponent } from '../notes-search/notes-search.component';
import { JobsToBeUploadedComponent } from './jobs-to-be-uploaded/jobs-to-be-uploaded.component';

const routes: Routes = [
  {
    path: 'tech-tools',
    component: TechToolsComponent
  },
  {
    path: 'notes-search',
    component: NotesSearchComponent
  },
  {
    path: 'jobs-to-be-uploaded',
    component: JobsToBeUploadedComponent
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
