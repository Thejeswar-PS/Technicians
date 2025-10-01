import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobScheduleReportComponent } from './job-schedule-report.component';

describe('JobScheduleReportComponent', () => {
  let component: JobScheduleReportComponent;
  let fixture: ComponentFixture<JobScheduleReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JobScheduleReportComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JobScheduleReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
