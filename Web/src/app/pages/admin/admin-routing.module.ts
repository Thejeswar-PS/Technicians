import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { StopReminderComponent } from './stop-reminder/stop-reminder.component';
import { CustomerFeedbackComponent } from './customer-feedback/customer-feedback.component';
import { ScheduleJobsComponent } from './schedule-jobs/schedule-jobs.component';
import { CustomerFeedbackDetailsComponent } from './customer-feedback-details/customer-feedback-details.component';
import { CustomerFeedbackSurveyComponent } from './customer-feedback-survey/customer-feedback-survey.component';

const routes: Routes = [
  {
    path: 'StopReminder',
    component: StopReminderComponent
  },
  {
    path: 'customer-feedback',
    component: CustomerFeedbackComponent
  },
  {
    path: 'customer-feedback-survey',
    component: CustomerFeedbackSurveyComponent
  },

  {
    path: 'customer-feedback-details',
    component: CustomerFeedbackDetailsComponent
  },
  {
    path: 'schedule-jobs',
    component: ScheduleJobsComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdminRoutingModule { }
