import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobsRoutingModule } from './jobs-routing.module';
import { JobEditComponent } from './job-edit/job-edit.component';
import { JobListComponent } from './job-list/job-list.component';
import { JobExpensesComponent } from './job-expenses/job-expenses.component';
import { JobStatusModalComponent } from './modal/job-status-modal/job-status-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/components/shared/shared.module';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { EquipmentDetailsComponent } from './equipment-details/equipment-details.component';
import { NotesViewComponent } from './modal/notes-view/notes-view.component';



@NgModule({
  declarations: [
    JobListComponent,
    JobEditComponent,
    JobExpensesComponent,
    JobStatusModalComponent,
    EquipmentDetailsComponent,
    NotesViewComponent
  ],
  imports: [
    CommonModule,
    JobsRoutingModule,
    FormsModule,
    SharedModule,
    InlineSVGModule.forRoot(),
    ReactiveFormsModule
  ]
})
export class JobsModule { }
