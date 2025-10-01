import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { catchError, EMPTY } from 'rxjs';
import { QuoteChartDetails } from 'src/app/_metronic/partials/content/widgets/charts/charts-custom-widget/charts-custom-widget.component';
import { Job } from 'src/app/core/model/job-model';
import { JobListRequest } from 'src/app/core/request-model/job-list-req';
import { CommonService } from 'src/app/core/services/common.service';
import { JobService } from 'src/app/core/services/job.service';
import { QuotesService } from 'src/app/core/services/quotes.service';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';
import { AuthService } from 'src/app/modules/auth';
import { QuoteDetailsModalComponent } from 'src/app/modules/quotes/modal/quote-details/quote-details.component';
import { QuoteSharedService } from 'src/app/modules/quotes/quote-shared.service';
import { JobEditComponent } from '../../jobs/job-edit/job-edit.component';
import { JobStatusModalComponent } from '../../jobs/modal/job-status-modal/job-status-modal.component';
import { AdminService } from 'src/app/core/services/admin.service';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-customer-feedback-details',
  templateUrl: './customer-feedback-details.component.html',
  styleUrls: ['./customer-feedback-details.component.scss']
})
export class CustomerFeedbackDetailsComponent implements OnInit {
  selectedJobId:string;
  isOpenEquipementDetailModel: boolean = false;
  jobList : any[] = [] ;
  accountManagers : any = [];
  status: any[];
  quoteStatus : any = [];
  fromEditPage: boolean = false;
  jobListRequest:any;
  baseUrl: any;
  jobFilterForm = this.fb.group({
    ownerId : ['ALL'],
    status : ['ALL'],
    year : ['CY'],
    jobId: ['']
  });
  searchText: any = '';

  empName: string = '';

  sortedColumn: string = '';
 sortDirection: number = 1;

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
    @Inject(DOCUMENT) private document: Document,
    private quotesService : QuotesService,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private router: Router,
    private quoteSharedService: QuoteSharedService,
    private filterDashboardService: DashboardFilterSharedService,
    private auth: AuthService,
    private _jobService: JobService,
    private _commonService: CommonService,
    private _adminService: AdminService,


    ) {

      router.events.subscribe((event) => {
        if (event instanceof NavigationStart) {
          let browserRefresh = !router.navigated;
        }
      });
    }

  ngOnInit(): void {
    this.baseUrl = this.document.location.origin;
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        let pageReloading = !this.router.navigated;
      }
  });

    this.route.queryParamMap.subscribe((params) => {
      if(params.has('status'))
      {
        this.jobFilterForm.controls['status'].setValue(params.get('status'));
      }
      if(params.has('year'))
      {
        this.jobFilterForm.controls['year'].setValue(params.get('year'));
      }
      if(params.has('ownerId')){
        if(params.get('ownerId') === 'ALL' || params.get('ownerId') === 'All'){
          this.jobFilterForm.controls['ownerId'].setValue('ALL');
        }
        else{
          this.jobFilterForm.controls['ownerId'].setValue(params.get('ownerId'));
        }
      }
    }

  );
    this.filterDashboardService.setHomePage(false);
    this.subscribeSharedServiceData();
    this.Load(true);
    this.LoadFilters();
    this.onFilterChanges();
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
    this.jobListRequest = {...this.jobFilterForm.value}
  }
  this._adminService.getCustomerFeedbackDetails(this.jobListRequest).pipe(
    catchError((err: any) => {
      return EMPTY;
    }
  )).subscribe((data: any)=> {
    this.jobList = data;
  })
}
  public onFilterChanges()
  {
    this.jobFilterForm.controls.ownerId.valueChanges.subscribe((selectedValue) =>{
      this.jobListRequest.ownerId = selectedValue;
      this.Load(false);
    })
    this.jobFilterForm.controls.status.valueChanges.subscribe((selectedValue) =>{
      this.jobListRequest.status = selectedValue;
      this.Load(false);
    })
    this.jobFilterForm.controls.year.valueChanges.subscribe((selectedValue) =>{
      this.jobListRequest.year = selectedValue?.toString();
      this.Load(false);
    })
  }
  // public setFilterDataOnValueChanges(selectedValue:any)
  // {
      
      
  //     this.Load(false);
  // }
  public SearchJobs()
  {
    let jobId = this.jobFilterForm.value.jobId?.trim();
    if(jobId !== null && jobId !== '')
    {
      this._adminService.GetCustFeedSearchResults(jobId!).subscribe((data : any)=> {
        this.jobList = data;
      })
    }
  }

  public LoadFilters()
  {
    this._commonService.getAccountManagers().subscribe((data : any)  => {
      this.accountManagers = data;
    });
  }

  getColorByPriority(status: string): string {
    switch (status) {
      case 'Critical':
            return 'red';
      default:
        return 'black';
    }

  }
}
