import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';

// Component imports
import { TechToolsComponent } from './tech-tools/tech-tools.component';
import { NotesSearchComponent } from '../notes-search/notes-search.component';
import { ToolsTrackingCalendarComponent } from './tools-tracking-calendar/tools-tracking-calendar.component';
import { ToolTrackingEntryComponent } from './tool-tracking-entry/tool-tracking-entry.component';
import { TechMileageDashboardComponent } from './tech-mileage-dashboard/tech-mileage-dashboard.component';

// Routing import
import { ToolsRoutingModule } from './tools-routing.module';
import { JobsToBeUploadedComponent } from './jobs-to-be-uploaded/jobs-to-be-uploaded.component';
import { DataMaintenanceComponent } from './data-maintenance/data-maintenance.component';
import { BillAfterPMJobsComponent } from './bill-after-pm-jobs/bill-after-pm-jobs.component';

@NgModule({
  declarations: [
    TechToolsComponent,
    NotesSearchComponent,
    ToolsTrackingCalendarComponent,
    ToolTrackingEntryComponent,
    TechMileageDashboardComponent,
    JobsToBeUploadedComponent,
    DataMaintenanceComponent,
    BillAfterPMJobsComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    NgApexchartsModule,
    ToolsRoutingModule
  ]
})
export class ToolsModule { }

