import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { JobNotesInfoComponent } from './job-notes-info.component';

@NgModule({
  declarations: [
    JobNotesInfoComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  exports: [
    JobNotesInfoComponent
  ]
})
export class JobNotesInfoModule { }