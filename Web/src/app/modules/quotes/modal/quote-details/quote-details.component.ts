import { Component, Input, OnInit } from '@angular/core';
import {NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import { ActivityDetailLog } from 'src/app/core/model/equipment-detail-log.modal';
import { JobService } from 'src/app/core/services/job.service';
import { QuotesService } from 'src/app/core/services/quotes.service';

@Component({
  selector: 'app-quote-details',
  templateUrl: './quote-details-modal.component.html',
  styleUrls: ['./quote-details.component.scss']
})
export class QuoteDetailsModalComponent implements OnInit {
  @Input() jobId: any;

  jobDetails: ActivityDetailLog[];

  constructor(public activeModal: NgbActiveModal,
    private jobService: JobService) { }

  ngOnInit(): void {
     this.laodJobDetails()  
  }

  laodJobDetails()
  {
    this.jobService.getActivity(this.jobId).subscribe((res : any) =>{
      this.jobDetails = res;
      console.log(this.jobId)
    })
  }
}
