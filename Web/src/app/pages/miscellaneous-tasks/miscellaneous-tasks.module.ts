import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MiscellaneousTasksRoutingModule } from './miscellaneous-tasks-routing.module';
import { MiscellaneousTasksComponent } from './miscellaneous-tasks.component';

@NgModule({
  declarations: [
    MiscellaneousTasksComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    MiscellaneousTasksRoutingModule
  ]
})
export class MiscellaneousTasksModule { }
