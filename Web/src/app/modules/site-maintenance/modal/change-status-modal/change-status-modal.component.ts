import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
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
  showErrorMsg: boolean = false;
  changeStatusForm = this.fb.group({
    Type : [1],
    RemindType : ['V'],
    StopDaysCount : [-1]
  });

  constructor(public activeModal: NgbActiveModal,
    private quoteService: QuotesService,
    private fb: FormBuilder,
    private auth: AuthService
    ) { }

  ngOnInit(): void {
    this.auth.currentUserSubject.subscribe(data=>
      {
        this.empName = data.empName;
      });

  }
  updateStatus()
  {
    try {
      if(this.changeStatusForm.value.StopDaysCount == -1){
        this.showErrorMsg = true;
      }
      else{
        this.showErrorMsg = false;
        let data = this.changeStatusForm.value;
        if(data.StopDaysCount as number > 365)
        {
          data.Type = 0;
        }
        this.quoteService.updateStopQuoteReminders(
          this.selectedQuoteIds.map(id => id.trim()).join(','),
          data,
          this.empName
        ).subscribe(res => {
        // Handle the response as needed
        });
        this.activeModal.close(true);
        window.location.reload();
      }
      
      
    } catch (error) {
      this.activeModal.close(false);
    }

  }
}
