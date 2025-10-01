import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { JobService } from 'src/app/core/services/job.service';
import { QuotesService } from 'src/app/core/services/quotes.service';
import { AuthService } from 'src/app/modules/auth';
import { QuoteDetailsModalComponent } from 'src/app/modules/quotes/modal/quote-details/quote-details.component';
import { QuoteSharedService } from 'src/app/modules/quotes/quote-shared.service';

@Component({
  selector: 'app-job-edit',
  templateUrl: './job-edit.component.html',
  styleUrls: ['./job-edit.component.scss']
})
export class JobEditComponent implements OnInit {

  rowIndex : string;
  accountManagers: any;

  empName: string = "";
  job: any = {};
  jobStatus: any[] = [];
  jobForm = this.fb.group({
    jobID : [''],
    notes : [''],
    status : [{value: ''}],
    verifyContact: [{value: ''}],
    comments: ['']
  });
  constructor( private route : ActivatedRoute,
    private quoteService : QuotesService,
    private _jobService : JobService,
    private fb: FormBuilder,
    private router: Router,
    private quoteSharedService: QuoteSharedService,
    private auth: AuthService,
    public activeModel: NgbActiveModal,
    private modalService: NgbModal,
    ) {
    this.route.params.subscribe(param => {
      if(param['rowIndex'] != null)
      {
        this.rowIndex = param['rowIndex'];
      }
    });
  }


  ngOnInit(): void {
    this.getJobDetails();
    this.getJobStatus();
    this.getManagers();
    this.getJobDetails();
    let userData = JSON.parse(localStorage.getItem("userData")!);

    this.empName = userData.empName;

  }
  updatePurchaseReq(checked: boolean): void {
    this.jobForm.patchValue({

    });
  }
  openQuoteDetailsModal(jobId: any) {
    const modalRef = this.modalService.open(QuoteDetailsModalComponent,{ fullscreen : "lg", centered: true});
    modalRef.componentInstance.jobId = jobId;


  }

  getManagers()
  {
    this.quoteService.getQuoteAccountManagers('A').subscribe(res  => {
      this.accountManagers = res;
    });
  }
  getJobStatus()
  {
    this._jobService.getJobStatus().subscribe(data=> {
      this.jobStatus = data.filter(status => ['Draft', 'Email Sent', 'In Discussion', 'Confirmed', 'Viewed', 'Job Scheduled'].includes(status.statusDesc));
    })
  }
  getJobDetails()
  {
    this._jobService.getJobDetails(this.rowIndex).subscribe((data : any) => {
      //this.quoteDetail = data;
      if (data)
      {
        this.job = data;
        this.jobForm.patchValue({
          jobID: data.callNbr,
          status : data.amStatus,
          verifyContact : data.checkContact,
          notes: data.notes
        });
      }

    })
  }
  cancel()
  {
    this.quoteSharedService.setIsFromEdit(true);
    this.activeModel.close(false);
    //this.router.navigate(['jobs']);
  }
  update()
  {
    let data = this.jobForm.value;
    let obj = {
      rowIndexIds : this.rowIndex,
      status : data.status,
      modifiedBy: this.empName,
      strComments: data.comments,
      checkContact: data.verifyContact,
      type: 0,
      multipleId: 0
    }
    this._jobService.updateJob(obj).subscribe(res=> {
      this.router.navigate(['jobs/job-list']);
    })
    this.activeModel.close(true);
  }

}
