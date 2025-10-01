import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { EMPTY, catchError } from 'rxjs';
import { Job } from 'src/app/core/model/job-model';
import { GetServiceReportsDetails } from 'src/app/core/model/service-report-details-model';
import { JobListRequest } from 'src/app/core/request-model/job-list-req';
import { CommonService } from 'src/app/core/services/common.service';
import { JobService } from 'src/app/core/services/job.service';
import { ReportService } from 'src/app/core/services/report.service';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';
import { AuthService } from 'src/app/modules/auth';
import { QuoteSharedService } from 'src/app/modules/quotes/quote-shared.service';

@Component({
  selector: 'app-send-service-reports',
  templateUrl: './send-service-reports.component.html',
  styleUrls: ['./send-service-reports.component.scss']
})
export class SendServiceReportsComponent implements OnInit {

  selectedJobId:string;
  isOpenEquipementDetailModel: boolean = false;
  accountManagers : any = [];
  jobList : GetServiceReportsDetails[] = [] ;
  quoteOwner: any;
  jobStatus: any[];
  quoteStatus : any = [];
  jobListRequest : JobListRequest | any= {};
  selectedJobIds: string[] = [];
  selectedJobs: GetServiceReportsDetails[] = [];
  // selectedJobs: Job[] = [];
  fromEditPage: boolean = false;
  jobFilterForm = this.fb.group({
    ownerID : ['ALL'],
    status : ['ALL'],
    jobType : ['0'],
  });
  sortedColumn: string = '';
  sortDirection: number = 1;
  currentUser: any;

  sortTable(column: string): void {
    if (this.sortedColumn === column) {
      this.sortDirection = -this.sortDirection;
    } else {
      this.sortedColumn = column;
      this.sortDirection = 1;
    }

    this.jobList.sort((a, b) => {
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

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private router: Router,
    private quoteSharedService: QuoteSharedService,
    private filterDashboardService: DashboardFilterSharedService,
    private auth: AuthService,
    private _jobService: JobService,
    private _commonService: CommonService,
    private _reportService: ReportService,
    private _toastrService: ToastrService,
    private _authService: AuthService,

    ) { }

  ngOnInit(): void {

    this.LoadFilters();
    this.onFilterChanges();
    this.filterDashboardService.setHomePage(false);
    this.currentUser = this._authService.currentUserValue;
    this.Load(true);

    // this.jobFilterForm.controls['ownerID'].setValue('All'); //TBC
  }


  selectAllRows(event: any): void {
    if (event.target.checked) {
      // Select all quotes
      this.selectedJobIds = this.jobList.filter(quote => quote.status !== 'Email Missing').map(quote => quote.callNbr);
      // this.selectedJobs = this.jobList.map(data => data.jobID);
      //this.selectedJobIds = this.jobList.map(x=> x.callNbr)
    } else {
      // Deselect all quotes
      this.selectedJobIds = [];
      //this.selectedJobs = [];
    }
  }

  isQuoteSelected(job: GetServiceReportsDetails): boolean {
    return this.selectedJobIds.includes(job.callNbr);
  }
  subscribeSharedServiceData()
  {
    this.quoteSharedService.setIsFromEdit$.subscribe((isFromEdit : boolean) => {
      if(isFromEdit)
      {
        // let quotesRequestBody = JSON.parse(localStorage.getItem('QuoteListFilter')!)
        // this.quotefilterForm.patchValue(quotesRequestBody);
        this.fromEditPage = true;
      }
     });
  }

public Load(initialLoad: boolean = false)
{
  if(initialLoad)
  {
    this.jobListRequest = this.jobFilterForm.value
  }
  this._jobService.getServiceReportsDetails(this.jobListRequest).pipe(
    catchError((err: any) => {
      let getList = localStorage.getItem('joblist');
      if(getList) this.jobList = JSON.parse(getList);
      return EMPTY;
    }
  )).subscribe(data=> {
    this.jobList = data;
    this.sortByAge();
    localStorage.setItem("joblist", JSON.stringify(data))
  })
}

  public onFilterChanges()
  {

    this.jobFilterForm.valueChanges.subscribe((selectedValue: any)  => {
      this.jobListRequest.ownerID = selectedValue.ownerID?.trim();
      this.jobListRequest.status = selectedValue.status;
      this.jobListRequest.jobType = parseInt(selectedValue.jobType!);
      this.Load(false);
    })

  }


  public LoadFilters()
  {
    let userData = JSON.parse(localStorage.getItem("userData")!);
    if(this.accountManagers.length <= 0)
    {
      this.accountManagers = JSON.parse(localStorage.getItem("AccountManagers")!);
    }

    var searchIndex = this.accountManagers.find((item : any) => item.empName.trim() === userData.empName.trim());
    if(searchIndex === undefined)
    {
      this.jobFilterForm.patchValue({
        ownerID: 'All'
      });
    }
    else{
      this.jobFilterForm.patchValue({
        ownerID: userData.empName.trim()
      });
    }
    this._jobService.getJobStatus().subscribe(data=> {
      this.jobStatus = data;
    })
  }

  splitString(str: string|null): string[] {
    if (str === null){
      return []
    }
    return str.split(';');
  }

  importAndUpdate()
  {
    this._reportService.importAndUpdate().subscribe(res=>
      {
        if(res)
          {
            this._toastrService.success('Imported successfully', 'Import and Updated');
            this.Load();
          }
          else
          {
            this._toastrService.error('Something went wrong', 'Error!');
          }
      })
  }
  removeAndArchive()
  {
    let obj =
    {
      jobIds : this.selectedJobIds,
      modifiedBy: this.currentUser.empName,
      archive: this.jobFilterForm.controls.jobType.value

    }
    this._reportService.removeAndArchivce(obj).subscribe(res=>
    {
      if(res)
      {
        this._toastrService.success('Removed successfully', 'Removed and Archived');
        this.Load();
      }
      else
      {
        this._toastrService.error('Something went wrong', 'Error!');
      }
    })
  }
  readyToSend()
  {
    let obj =
    {
      jobIds : this.selectedJobIds,
      modifiedBy: this.currentUser.empName
    }
    this._reportService.readyToSend(obj).subscribe(res=>
    {
      if(res)
        {
          this._toastrService.success('Updated successfully', 'Updated');
          this.Load();
          this.selectedJobIds = [];
        }
        else
        {
          this._toastrService.error('Something went wrong', 'Error!');
        }
    })
  }

  rowSelect(job: any)
  {
    if(this.selectedJobIds.includes(job.callNbr.trim()))
    {
      this.selectedJobIds.splice(this.selectedJobIds.indexOf(job.callNbr),1);
      this.selectedJobs.splice(this.selectedJobs.indexOf(job.callNbr,1));
    }
    else{
      this.selectedJobIds.push(job.callNbr.trim());
      this.selectedJobs.push(job);
    }
  }
  getColorByStatus(status: string|null): string {
    switch (status) {
      case 'Email Missing':
        return '#730202';
      case 'In Progress':
        return '#008ed6';
      case 'Ready to Send':
        return '#00b300';
      case 'Sent':
        return '#E8A90E';
      case 'Cancelled':
        return 'red';
      // Add more cases for other status if needed
      default:
        return '#730202'; // Default color when the status doesn't match any case
    }
  }

  validateEmails(emails: string[]): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regular expression for email validation
    for (const email of emails) {
      if (!emailRegex.test(email)) {
        return false; // If any email is invalid, return false
      }
    }
    return true; // If all emails are valid, return true
  }
  getEmpLevel(): any {
    let userData = JSON.parse(localStorage.getItem("userData")!);
    return userData.empLevel;
  }

  private sortByAge(): void {
    this.sortedColumn = 'age';
    this.sortDirection = -1;
  
    this.jobList.sort((a, b) => {
      const ageA = a.age ?? 0;
      const ageB = b.age ?? 0;
      return ageB - ageA; // Descending order
    });
  }
}
