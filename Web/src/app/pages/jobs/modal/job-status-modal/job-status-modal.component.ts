import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Job } from 'src/app/core/model/job-model';
import { JobService } from 'src/app/core/services/job.service';
import { QuotesService } from 'src/app/core/services/quotes.service';
import { AuthService } from 'src/app/modules/auth';

@Component({
  selector: 'app-job-status-modal',
  templateUrl: './job-status-modal.component.html',
  styleUrls: ['./job-status-modal.component.scss']
})
export class JobStatusModalComponent implements OnInit {
  @Input() selectedQuoteIds: any[];

  quotes: any[];
  selectedStatus: string = '';
  selectedJobs: Job[] = [];
  empName: string = "";
  notes: string = "";
  showErrorMsg: boolean = false;
  jobIds: string = "";
  jobStatus: any= {};

  constructor(public activeModal: NgbActiveModal,
    private _jobService: JobService,
    private auth: AuthService) { }

  ngOnInit(): void {
    // this.auth.currentUserSubject.subscribe(data=>
    //   {
    //     this.empName = data.empName;
    //   });
      //this.selectedJobIds = this.selectedJobs.map(a => a.jobID).join(',');
      this.load();
  }
  load()
  {
    this._jobService.getJobStatus().subscribe(data=> {
      this.jobStatus = data;
    })
  }
  updateStatus()
  {
    try {
      if(this.selectedStatus == ""){
        this.showErrorMsg = true;
      }
      else{
        this.showErrorMsg = false;
        this._jobService.updateJobStatus(this.selectedJobs.map(a => a.rowIndex).join(','),this.selectedStatus,this.selectedJobs[0].accMgr!,this.notes).subscribe(res=> {
          this.activeModal.close(true);
        });


      }
    } catch (error) {
      this.activeModal.close(false);
    }

  }
}
