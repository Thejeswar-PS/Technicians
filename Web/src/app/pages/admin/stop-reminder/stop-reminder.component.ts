import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EMPTY, Subject, catchError, takeUntil } from 'rxjs';
import { StopReminder } from 'src/app/core/model/job-remider.models';
import { AdminService } from 'src/app/core/services/admin.service';
import { CommonService } from 'src/app/core/services/common.service';
import { StopReminderModalComponent } from '../modal/stop-reminder-modal/stop-reminder-modal.component';
import { ElementRef, ViewChild } from '@angular/core';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';

@Component({
  selector: 'app-stop-reminder',
  templateUrl: './stop-reminder.component.html',
  styleUrls: ['./stop-reminder.component.scss']
})
export class StopReminderComponent implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();
 stopRemainderList: StopReminder[] = [];
 selectedSites: any[] = [];
 accountManagers : any = [];
 userData: any;
 isDisable: boolean = true;
 sites = sites;
 FilterForm: FormGroup;
 selectedRowIndex: number;

 @ViewChild('input') searchInput!: ElementRef;
 sortedColumn: string = '';
 sortDirection: number = 1;


 sortTable(column: string): void {
  if (this.sortedColumn === column) {
    this.sortDirection = -this.sortDirection;
  } else {
    this.sortedColumn = column;
    this.sortDirection = 1;
  }

  this.stopRemainderList.sort((a, b) => {
    const aValue = (a as any)[column];
      const bValue = (b as any)[column];

    if (aValue < bValue) {
      //console.log("b greater");
      return -1 * this.sortDirection;
    } else if (aValue > bValue) {
      //console.log("a greater");
      return 1 * this.sortDirection;
    } else {
      return 0;
    }

// Handle other cases here, if needed

  });
}

sortIcon(column: string): string {
  if (this.sortedColumn === column) {
    return this.sortDirection === 1 ? 'fa-sort-up' : 'fa-sort-down';
  }
  return 'fa-sort';
}

selectAllRows(event: any): void {
  if (event.target.checked) {
    // Select all quotes
    this.selectedSites = this.stopRemainderList;
    console.log(this.stopRemainderList);
    console.log(this.selectedSites);
  } else {
    // Deselect all quotes
    this.selectedSites = [];
    console.log(this.selectedSites);
  }
  }

isQuoteSelected(quote: StopReminder): boolean {
  return this.selectedSites.includes(quote.custNmbr.trim());
}

get fl() {
  return this.FilterForm.controls;
}
constructor(
  private fb: FormBuilder,
  private _commonService: CommonService,
  private adminService: AdminService,
  private filterDashboardService: DashboardFilterSharedService,
  private modalService: NgbModal, ) { }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.initForm();
    this.onFilterChanges();
    this.loadFilters();
    this.getReminderList(this.FilterForm.value);
    this.filterDashboardService.setHomePage(false);
    this.userData = JSON.parse(localStorage.getItem("userData")!);
  }

  getReminderList(payload: any){
    this.adminService.GetStopReminders(payload).pipe(
      takeUntil(this.destroy$),
      catchError((err:any) =>{
        return EMPTY
      })
    ).subscribe((res: StopReminder[]) =>{
      this.selectedSites = [];
      this.stopRemainderList = res;
      for (let i = 0; i < res.length; i++) {
        if(res[i].stopDaysCount > 0)
        {
          this.selectedSites.push(res[i]);
        }
      }
    })
  }

  initForm(){
    this.FilterForm = this.fb.group({
      manager: new FormControl('All'),
      type: new FormControl('OS')
    })
  }
  public onFilterChanges()
  {
    this.FilterForm.valueChanges.subscribe(selectedValue  => {
      this.clearSearchInput(); // clear input value
      this.getReminderList(this.FilterForm.value);
    })
  }
  loadFilters(){
    // this._commonService.getAccountManagers().subscribe((data : any)  => {
    //   this.accountManagers = data;
    // });
    let userData = JSON.parse(localStorage.getItem("userData")!);
    if(this.accountManagers.length <= 0)
    {
      this.accountManagers = JSON.parse(localStorage.getItem("AccountManagers")!);
    }


    var searchIndex = this.accountManagers.find((item : any) => item.empName.trim() === userData.empName.trim());
    if(searchIndex === undefined)
    {
      this.FilterForm.patchValue({
        manager: 'All'
      });
    }
    else{
      this.FilterForm.patchValue({
        manager: userData.empName.trim(),
      });
    }
  }
isChecked: boolean;

  rowSelect(event: any, data: any){
    // this.isChecked = value;
    // this.selectedRowIndex = index;
    if(event.target.checked)
      this.selectedSites.push(data);
    else
    {
      // this.selectedSites.splice(this.selectedSites.indexOf(data.custNmbr.trim()),1);
      this.selectedSites = this.selectedSites.filter(function(item) {
        return item.custNmbr.trim() !== data.custNmbr.trim();
      });
    }
    this.isDisable = !this.isDisable;
  }

  SearchJobs(query:string){
    if(query !== null && this.stopRemainderList.length > 0){
      this.stopRemainderList = this.stopRemainderList.filter((list: StopReminder) => list.custNmbr === query);
    }
  }

  StopReminder()
  {
    const modalRef = this.modalService.open(StopReminderModalComponent,{ fullscreen : "lg", centered: true});
    modalRef.componentInstance.selectedSites = this.selectedSites.map(x => x.custNmbr.trim()).join(',');
    console.log(this.selectedSites.map(x => x.custNmbr.trim()).join(','));
    modalRef.componentInstance.reminderType = this.FilterForm.controls['type'].value;
    modalRef.result.then((data) => {
      if(data === true)
      {
        this.getReminderList(this.FilterForm.value);
      }
    }, (reason) => {

    });
  }

  SearchReminder(query:string){
    if(query !== '')
    {
      this.adminService.SearchStopReminder(this.FilterForm.value.manager.trim(),query).subscribe((res:any)=>{
        this.stopRemainderList = res;
      })
    }
    else
    {
      this.getReminderList(this.FilterForm.value);
    }
  }

  clearSearchInput(): void {
    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
      this.SearchReminder(''); // optional: resets search results
    }
  }

}

const sites: any[] = [
  {
    site: 'Temporarily Stopped',
    value: 'TS'
  },
  {
    site: 'Permanent Stopped',
    value: 'PS'
  },

  {
    site: 'Email Stopped',
    value: 'ES'
  },
  {
    site: 'Voice Calls Stopped',
    value: 'VS'
  },
  {
    site: 'Open Sites',
    value: 'OS'
  },
  {
    site: 'All Sites',
    value: 'AL'
  }

]

