import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminRoutingModule } from './admin-routing.module';
import { StopReminderComponent } from './stop-reminder/stop-reminder.component';
import { ReactiveFormsModule } from '@angular/forms';
import { CustomerFeedbackComponent } from './customer-feedback/customer-feedback.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ScheduleJobsComponent } from './schedule-jobs/schedule-jobs.component';
import { FormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { SchedultJobsEditComponent } from './modal/schedult-jobs-edit/schedult-jobs-edit.component';
import { StopReminderModalComponent } from './modal/stop-reminder-modal/stop-reminder-modal.component';
import { CustomerFeedbackDetailsComponent } from './customer-feedback-details/customer-feedback-details.component';
import { CustomerFeedbackSurveyComponent } from './customer-feedback-survey/customer-feedback-survey.component';


@NgModule({
  declarations: [
    StopReminderComponent,
    CustomerFeedbackComponent,
    ScheduleJobsComponent,
    SchedultJobsEditComponent,
    StopReminderModalComponent,
    CustomerFeedbackDetailsComponent,
    CustomerFeedbackSurveyComponent
  ],
  imports: [
    CommonModule,
    AdminRoutingModule,
    ReactiveFormsModule,
    NgApexchartsModule,
    FormsModule,
    MatNativeDateModule
  ],
  exports: [NgApexchartsModule]
})
export class AdminModule { }
