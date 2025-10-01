import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Job } from 'src/app/core/model/job-model';
import { AdminService } from 'src/app/core/services/admin.service';
import { JobService } from 'src/app/core/services/job.service';
import { AuthService } from 'src/app/modules/auth';

@Component({
  selector: 'app-stop-reminder-modal',
  templateUrl: './stop-reminder-modal.component.html',
  styleUrls: ['./stop-reminder-modal.component.scss']
})
export class StopReminderModalComponent implements OnInit {
  @Input() selectedSites: any[];
  @Input() reminderType: any;

  quotes: any[];
  daysToStop: string = '365000';
  type: string = "B";

  selectedJobs: Job[] = [];
  empName: string = "";
  showErrorMsg: boolean = false;
  sites: string = "";
  jobStatus: any= {};

  constructor(public activeModal: NgbActiveModal,
    private _adminService: AdminService,
    private _authService: AuthService) { }

  ngOnInit(): void {
    if(this.reminderType !== 'OS')
      this.daysToStop = '0'
  }

  updateStatus()
  {
    try {
      if(this.daysToStop == ""){
        this.showErrorMsg = true;
      }
      else{
        this.showErrorMsg = false;
        const currentUser = this._authService.currentUserValue;
        let model = {
          siteIds : this.selectedSites,
          type: 1,
          stopDaysCount: this.daysToStop,
          remindType: this.type,
          modifiedBy: currentUser.empName
        }
        this._adminService.UpdateStopReminder(model).subscribe(res=> {
          this.activeModal.close(true);
        });
      }
    } catch (error) {
      this.activeModal.close(false);
    }

  }
}
