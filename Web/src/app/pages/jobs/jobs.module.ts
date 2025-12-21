import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JobsRoutingModule } from './jobs-routing.module';
import { JobEditComponent } from './job-edit/job-edit.component';
import { JobListComponent } from './job-list/job-list.component';
import { JobExpensesComponent } from './job-expenses/job-expenses.component';
import { MobileReceiptsComponent } from './mobile-receipts/mobile-receipts.component';
import { EditExpenseComponent } from './edit-expense/edit-expense.component';
import { JobStatusModalComponent } from './modal/job-status-modal/job-status-modal.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from 'src/app/components/shared/shared.module';
import { InlineSVGModule } from 'ng-inline-svg-2';
import { EquipmentDetailsComponent } from './equipment-details/equipment-details.component';
import { EditEquipmentComponent } from './edit-equipment/edit-equipment.component';
import { NotesViewComponent } from './modal/notes-view/notes-view.component';
import { EquipmentImagesComponent } from './equipment-images/equipment-images.component';
import { JobNotesInfoComponent } from './job-notes-info/job-notes-info.component';
import { JobSafetyComponent } from './job-safety/job-safety.component';
import { JobPartsComponent } from './job-parts/job-parts.component';
import { EditPartsComponent } from './edit-parts/edit-parts.component';
import { JobSummarySampleComponent } from './job-summary-sample/job-summary-sample.component';
import { UpsReadingsModule } from '../ups-readings/ups-readings.module';
import { BatteryReadingsComponent } from '../equipment/battery-readings/battery-readings.component';
import { BatteryReadingsTempComponent } from '../equipment/battery-readings-temp/battery-readings-temp.component';
import { PduReadingsComponent } from '../equipment/pdu-readings/pdu-readings.component';
import { AtsReadingsComponent } from '../equipment/ats-readings/ats-readings.component';
import { StsReadingsComponent } from '../equipment/sts-readings/sts-readings.component';
import { RectifierReadingsComponent } from '../equipment/rectifier-readings/rectifier-readings.component';
import { SccReadingsComponent } from '../equipment/scc-readings/scc-readings.component';



@NgModule({
  declarations: [
    JobListComponent,
    JobEditComponent,
    JobExpensesComponent,
    MobileReceiptsComponent,
    EditExpenseComponent,
    JobStatusModalComponent,
    EquipmentDetailsComponent,
    EditEquipmentComponent,
    NotesViewComponent,
    EquipmentImagesComponent,
    JobNotesInfoComponent,
    JobSafetyComponent,
    JobPartsComponent,
    EditPartsComponent,
    JobSummarySampleComponent,
    BatteryReadingsComponent,
    BatteryReadingsTempComponent,
    PduReadingsComponent,
    AtsReadingsComponent,
    StsReadingsComponent,
    RectifierReadingsComponent,
    SccReadingsComponent
  ],
  imports: [
    CommonModule,
    JobsRoutingModule,
    FormsModule,
    SharedModule,
    InlineSVGModule.forRoot(),
    ReactiveFormsModule,
    UpsReadingsModule
  ]
})
export class JobsModule { }
