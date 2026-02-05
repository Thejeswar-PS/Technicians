import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TechToolsComponent } from './tech-tools/tech-tools.component';
import { NotesSearchComponent } from '../notes-search/notes-search.component';
import { ToolsTrackingCalendarComponent } from './tools-tracking-calendar/tools-tracking-calendar.component';
import { ToolTrackingEntryComponent } from './tool-tracking-entry/tool-tracking-entry.component';
import { JobsToBeUploadedComponent } from './jobs-to-be-uploaded/jobs-to-be-uploaded.component';
import { DataMaintenanceComponent } from './data-maintenance/data-maintenance.component';
import { BillAfterPMJobsComponent } from './bill-after-pm-jobs/bill-after-pm-jobs.component';

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
    path: 'jobs-to-be-uploaded',
    component: JobsToBeUploadedComponent
  },
  {
    path: 'data-maintenance',
    component: DataMaintenanceComponent
  },
  {
    path: 'bill-after-pm-jobs',
    component: BillAfterPMJobsComponent
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
