import { Component, Input, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { QuotesService } from 'src/app/core/services/quotes.service';
import { AuthService } from '../../../auth';

@Component({
  selector: 'app-change-status-modal',
  templateUrl: './change-status-modal.component.html',
  styleUrls: ['./change-status-modal.component.scss']
})
export class ChangeStatusModalComponent implements OnInit {
  @Input() selectedQuoteIds: any[];

  quotes: any[];
  empName: string = "";

  constructor(public activeModal: NgbActiveModal,
    private quoteService: QuotesService,
    private auth: AuthService) { }

  ngOnInit(): void {
    this.auth.currentUserSubject.subscribe(data=>
      {
        this.empName = data.empName;
      });

  }
  updateStatus()
  {
    try {
      this.quoteService.updateAppToBeSentStatus(this.selectedQuoteIds.join(','),this.empName).subscribe(res=> {
        
      })
      this.activeModal.close(true);
      window.location.reload();
    } catch (error) {
      this.activeModal.close(false);
    }

  }
}
