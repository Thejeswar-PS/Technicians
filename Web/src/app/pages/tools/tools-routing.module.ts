import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TechToolsComponent } from './tech-tools/tech-tools.component';
import { NotesSearchComponent } from '../notes-search/notes-search.component';
import { ToolsTrackingCalendarComponent } from './tools-tracking-calendar/tools-tracking-calendar.component';
import { ToolTrackingEntryComponent } from './tool-tracking-entry/tool-tracking-entry.component';

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
    path: 'tools-tracking-calendar',
    component: ToolsTrackingCalendarComponent
  },
  {
    path: 'tool-tracking-entry',
    component: ToolTrackingEntryComponent
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
