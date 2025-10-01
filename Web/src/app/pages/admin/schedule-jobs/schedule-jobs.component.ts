import { first } from 'rxjs/operators';
import { Component, OnInit, NgModule, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonService } from 'src/app/core/services/common.service';
import { AdminService } from 'src/app/core/services/admin.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { JobEditComponent } from '../../jobs/job-edit/job-edit.component';
import { SchedultJobsEditComponent } from '../modal/schedult-jobs-edit/schedult-jobs-edit.component';
import { AuthService } from 'src/app/modules/auth';
import { ToastrService } from 'ngx-toastr';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';
@Component({
  selector: 'app-schedule-jobs',
  templateUrl: './schedule-jobs.component.html',
  styleUrls: ['./schedule-jobs.component.scss']
})
export class ScheduleJobsComponent implements OnInit {
  dropdownData : any[] = [];
  form!:FormGroup;
  selectedItems: any[] = [] ;
  accountManagers : any = [];
  toBeScheduledCustomers: any = [];
  customerIds: any = [];
  technicians: any = [];
  jobs: any[] = [];
  selectedJobIds: any[] = [];
  // selectedJobs: any[] = [];
  isSubmitted: boolean = false;

  sortedColumn: string = '';
 sortDirection: number = 1;

 sortTable(column: string): void {
  if (this.sortedColumn === column) {
    this.sortDirection = -this.sortDirection;
  } else {
    this.sortedColumn = column;
    this.sortDirection = 1;
  }

  this.jobs.sort((a, b) => {
    const aValue = (a as any)[column];
      const bValue = (b as any)[column];

    console.log(aValue[0]);


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
  this.selectedJobIds = [];
  if (event.target.checked) {
    // Select all quotes
    this.selectedJobIds = this.jobs.map(quote => quote.callNbr.trim());
  } else {
    // Deselect all quotes
    this.selectedJobIds = [];
  }
  this.cdr.detectChanges();
}

  filterForm = this.fb.group({
    ownerId : ['All'],
    customer : [],
    customerId : []
  });

  jobForm = this.fb.group({
    jobIds: [],
    techIds : ['',[Validators.required]],
    startDate : [Validators.required],
    notes : ['',Validators.required],
  });

  constructor(
    private fb: FormBuilder,
    private _commonService: CommonService,
    private _adminService: AdminService,
    private modalService: NgbModal,
    private _authService: AuthService,
    private _toastrService: ToastrService,
    private filterDashboardService: DashboardFilterSharedService,
    private cdr: ChangeDetectorRef
    ) {}

  ngOnInit() {
    this.LoadAccountManager();
    this.onFilterChanges();
    this.LoadTechnicians();
    this.filterDashboardService.setHomePage(false);
  }

  public LoadAccountManager()
  {
    if(this.accountManagers.length <= 0)
    {
      this.accountManagers = JSON.parse(localStorage.getItem("AccountManagers")!);
    }

    // var searchIndex = this.accountManagers.find((item : any) => item.empName.trim() === userData.empName.trim());
    // this.filterForm.patchValue({
    //   ownerId: 'All'
    // });


    // if(searchIndex === undefined)
    // {
    //   this.filterForm.patchValue({
    //     ownerId: 'All'
    //   });
    // }
    // else{
    //   this.filterForm.patchValue({
    //     ownerId: userData.empID.trim()
    //   });
    //   this.LoadCustomers(userData.empID.trim())
    // }

  }
  public LoadCustomers(ownerId: any)
  {
    this._adminService.ToBeScheduledCustomers(ownerId).subscribe((data : any)=> {
      this.toBeScheduledCustomers = data;
      if(data.length > 0 && this.filterForm.controls.ownerId.value !== 'ALL')
      {
        this.filterForm.patchValue({
          customer : data[0]
        })
        this.LoadCustomerIds(this.filterForm.controls.ownerId.value,data[0])
      }
    })
  }
  public LoadCustomerIds(ownerId: any,custName: any)
  {
    this._adminService.GetCustIDsbyCustomer(ownerId, custName).subscribe((data:any)=> {
      this.customerIds = data;
      this.filterForm.patchValue({
        customerId : data[0]
      })
      if(this.filterForm.controls.customerId.value !== null)
      {
        this.GetToBeScheduleJobs(this.filterForm.controls.customerId.value);
      }
    })
  }
  public onFilterChanges()
  {
    this.filterForm.controls.ownerId.valueChanges.subscribe((selectedValue : any)  => {
      this.LoadCustomers(selectedValue.trim());
    })
    this.filterForm.controls.customer.valueChanges.subscribe((selectedValue : any)  => {
      this.LoadCustomerIds(this.filterForm.controls.ownerId.value?.trim(),selectedValue);
    })
    this.filterForm.controls.customerId.valueChanges.subscribe((selectedValue : any)  => {
      this.GetToBeScheduleJobs(selectedValue);
    })
  }

  public LoadTechnicians()
  {
    this._commonService.getTechnicians().subscribe((data : any)=> {
      this.technicians = data;
    })
  }

  public GetToBeScheduleJobs(custId: any)
  {
    this._adminService.GetToBeScheduleJobs(custId).subscribe((data : any)=> {
      this.jobs = data;
    })
  }

  confirmAndUpdateJobs(): void {
    if(this.jobForm.valid){
      if (window.confirm('Are you sure you want to update the jobs?')) {
        this.updateJobs();
      }
    }
  }

  public updateJobs()
  {
    this.isSubmitted = true;
    if(this.jobForm.valid)
    {
      const currentUser = this._authService.currentUserValue;
      var model = {
        jobIds : this.selectedJobIds,
        techIds: this.jobForm.controls.techIds.value,
        startDt: this.jobForm.controls.startDate.value,
        notes: this.jobForm.controls.notes.value,
        modifiedby: currentUser.windowsID
      }
      if (window.confirm('Are you sure you want to update the jobs?')) {
      this._adminService.UpdateScheduleJobsinGP(model).subscribe((data : any)=> {
        if(data)
        {
          //this._toastrService.success("Update successfully","Update");
          this.GetToBeScheduleJobs(this.filterForm.controls.customerId.value);
          this.showSuccessAlert();
        }
      })
      window.alert('Update successful');
      this.GetToBeScheduleJobs(this.filterForm.controls.customerId.value);
      }
    }
  }

  showSuccessAlert(): void {
    window.alert('Update successful');
  }

  isQuoteSelected(job: any): boolean {
    return this.selectedJobIds.includes(job.callNbr.trim());
  }
  edit(job: any)
  {
    const modalRef = this.modalService.open(SchedultJobsEditComponent,{ windowClass: 'job-edit-modal-width', centered: true});
    modalRef.componentInstance.job = job;
    modalRef.closed.subscribe(result => {
      if(result)
      {
        this._toastrService.success("Updated successfully","Update")
        this.GetToBeScheduleJobs(this.filterForm.controls.customerId.value);
      }
    })
    // this.router.navigate(['/job-edit', { rowIndex: rowIndex}]);
  }
  rowSelect(job: any)
  {
    if(this.selectedJobIds.includes(job.callNbr.trim()))
    {
      this.selectedJobIds.splice(this.selectedJobIds.indexOf(job.callNbr.trim()),1);
      // this.selectedJobs.splice(this.selectedJobs.indexOf(job.callNbr,1));
    }
    else{
      this.selectedJobIds.push(job.callNbr.trim());
      // this.selectedJobs.push(job);
    }
  }
}
