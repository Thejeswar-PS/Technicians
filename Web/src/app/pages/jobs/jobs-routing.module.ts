import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { JobListComponent } from './job-list/job-list.component';
import { JobEditComponent } from './job-edit/job-edit.component';
import { JobExpensesComponent } from './job-expenses/job-expenses.component';
import { MobileReceiptsComponent } from './mobile-receipts/mobile-receipts.component';
import { EditExpenseComponent } from './edit-expense/edit-expense.component';
import { EquipmentDetailsComponent } from './equipment-details/equipment-details.component';
import { EditEquipmentComponent } from './edit-equipment/edit-equipment.component';
import { EquipmentImagesComponent } from './equipment-images/equipment-images.component';
import { UpsReadingsComponent } from '../ups-readings/ups-readings.component';
import { JobNotesInfoComponent } from './job-notes-info/job-notes-info.component';
import { JobSafetyComponent } from './job-safety/job-safety.component';
import { JobPartsComponent } from './job-parts/job-parts.component';
import { EditPartsComponent } from './edit-parts/edit-parts.component';
import { BatteryReadingsComponent } from '../equipment/battery-readings/battery-readings.component';
import { BatteryReadingsTempComponent } from '../equipment/battery-readings-temp/battery-readings-temp.component';
import { PduReadingsComponent } from '../equipment/pdu-readings/pdu-readings.component';
import { AtsReadingsComponent } from '../equipment/ats-readings/ats-readings.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'job-list',
    pathMatch: 'full'
  },
  {
    path: 'job-list',
    component: JobListComponent
  },
  {
    path: 'job-edit',
    component: JobEditComponent
  },
  {
    path: 'expenses',
    component: JobExpensesComponent
  },
  {
    path: 'mobile-receipts',
    component: MobileReceiptsComponent
  },
  {
    path: 'edit-expense',
    component: EditExpenseComponent
  },
  {
    path: 'edit-expense/:expenseId',
    component: EditExpenseComponent
  },
  {
    path: 'equipment-details',
    component: EquipmentDetailsComponent
  },
  {
    path: 'edit-equipment',
    component: EditEquipmentComponent
  },
  {
    path: 'images',
    component: EquipmentImagesComponent
  },
  {
    path: 'ups-readings',
    component: UpsReadingsComponent
  },
  {
    path: 'job-notes-info',
    component: JobNotesInfoComponent
  },
  {
    path: 'job-safety',
    component: JobSafetyComponent
  },
  {
    path: 'parts',
    component: JobPartsComponent
  },
  {
    path: 'edit-parts',
    component: EditPartsComponent
  },
  {
    path: 'battery-readings',
    component: BatteryReadingsComponent
  },
  {
    path: 'battery-readings-temp',
    component: BatteryReadingsTempComponent
  }
  ,
  {
    path: 'pdu-readings',
    component: PduReadingsComponent
  }
  ,
  {
    path: 'ats-readings',
    component: AtsReadingsComponent
  }
  // Job summary sample route commented out for integration-only usage
  // {
  //   path: 'job-summary-sample',
  //   component: JobSummarySampleComponent
  // }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class JobsRoutingModule { }
