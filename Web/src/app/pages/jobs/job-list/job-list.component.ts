import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
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
import { JobStatusModalComponent } from '../modal/job-status-modal/job-status-modal.component';
import { JobEditComponent } from '../job-edit/job-edit.component';
import { ToastrService } from 'ngx-toastr';
import { GetNotes } from 'src/app/core/model/get-notes.model';
import { NotesViewComponent } from '../modal/notes-view/notes-view.component';
import * as XLSX from 'xlsx';
@Component({
  selector: 'app-job-list',
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.scss']
})
export class JobListComponent implements OnInit {
  selectedJobId:string | null = null;
  isOpenEquipementDetailModel: { [key: string]: boolean } = {};
  jobList : Job[] = [] ;
  jobListRequest : JobListRequest | any= {};
  accountManagers : any = [];
  quoteOwner: any;
  jobStatus: any[];
  quoteStatus : any = [];
  chartData : QuoteChartDetails[];
  fiscalYears : Array<string> = [];
  selectedJobIds: string[] = [];
  selectedJobs: Job[] = [];
  keyword: string = '';
  // selectedJobs: Job[] = [];
  fromEditPage: boolean = false;

  jobFilterForm: FormGroup;
  paginationObj  : {pageNumber : number ,pageSize : number, totalRecordsCount : number } ={
    pageNumber: 1,
    pageSize: 500,
    totalRecordsCount: 0
  };
  // initialValues = {
  //   ownerId : ['All'],
  //   status : ['All'],
  //   year : [(new Date().getFullYear()).toString()],
  //   month : ['All'],
  //   type: ['All'],
  //   jobType : ['0'],
  //   serviceType: [''],
  //   jobId: [''],
  // }
  

  paginationParams = {
    pageNumber: this.paginationObj.pageNumber,
    pageSize: this.paginationObj.pageSize

  }

  empName: string = '';

  months : any[] = [
     //{Text : 'All',value:'All'}
     {Text : 'January',value:'1' }
    ,{Text : 'February',value:'2' }
    ,{Text : 'March',value:'3' }
    ,{Text : 'April',value:'4' }
    ,{Text : 'May',value:'5' }
    ,{Text : 'June',value:'6' }
    ,{Text : 'July',value:'7' }
    ,{Text : 'August',value:'8' }
    ,{Text : 'September',value:'9' }
    ,{Text : 'October',value:'10'}
    ,{Text : 'November',value:'11'}
    ,{Text : 'December',value:'12'}
  ];
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
  
      // Normalize nulls or undefined to a consistent value for sorting
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1 * this.sortDirection;  // push nulls to bottom
      if (bValue == null) return -1 * this.sortDirection;
  
      if (aValue < bValue) return -1 * this.sortDirection;
      if (aValue > bValue) return 1 * this.sortDirection;
      return 0;
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
      this.selectedJobIds = this.jobList.map(Job => Job.jobID);
      this.selectedJobs = this.jobList;
      //this.selectedJobs = this.quotesList.filter(quote => quote.quoteStatus !== 'Email Missing').map(quote => quote.quoteID);
    } else {
      // Deselect all quotes
      this.selectedJobIds = [];
      this.selectedJobs = [];
    }
  }

  isQuoteSelected(jobs: Job): boolean {
    return this.selectedJobIds.includes(jobs.jobID);
  }

  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private router: Router,
    private quoteSharedService: QuoteSharedService,
    private filterDashboardService: DashboardFilterSharedService,
    private _jobService: JobService,
    private _toastrService: ToastrService,
    private _commonService: CommonService

    ) {

      router.events.subscribe((event) => {
        if (event instanceof NavigationStart) {
          let browserRefresh = !router.navigated;
        }
      });
    }

  ngOnInit(): void {
    let loadDefault = true;
    
    this.initializeFilterForm();
    this.LoadFilters();
    this.LoadFiscalYears();
    this.onFilterChanges();

    this.filterDashboardService.setHomePage(false);
    this.subscribeSharedServiceData();

    this.route.queryParamMap.subscribe((params) => {
      if(params.has('jobId'))
      {
        // this.jobFilterForm.patchValue({
        //   jobId: params.get('jobId')
        // });
        //this.Load(false);
        loadDefault = false;
      }

    }
    );
    if(loadDefault)
    {
      this.Load(true);
    }
  }
  setQueryParamToFilter()
  {
      this.route.queryParamMap.subscribe((params) => {
        
        if(params.has('jobId'))
        {
          
          // this.SearchJobs();
        }

      }
    );
  }
  initializeFilterForm()
  {
    let ownerId = this.route.snapshot.paramMap.get('manager') || 'All';
    let year = (new Date().getFullYear()).toString();
    let type = this.route.snapshot.paramMap.get('type') || 'All';
    let jobId = this.route.snapshot.paramMap.get('jobId') || '';
    if(jobId !== '')
    {
      ownerId = 'All';
      year = 'All';
    }

    let userData = JSON.parse(localStorage.getItem("userData")!);

    ownerId = userData.empName.trim() ? userData.empName.trim() : ownerId;
    
    this.jobFilterForm = this.fb.group({
      ownerId : [ownerId],
      status : ['All'],
      year : [year],
      month : ['All'],
      type: [type],
      jobType : ['0'],
      serviceType: [''],
      jobId: [''],
    });
  }
  exportToExcel(): void {
    const ws: XLSX.WorkSheet = XLSX.utils.table_to_sheet(document.getElementById('table-to-export'));
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, 'exported_table.xlsx');
  }
  openEquipementDetailModel(jobId: string){
    this.selectedJobId = jobId;
    this.isOpenEquipementDetailModel[jobId] = !this.isOpenEquipementDetailModel[jobId];
  }
  subscribeSharedServiceData()
  {
    this.quoteSharedService.setIsFromEdit$.subscribe((isFromEdit : boolean) => {
      if(isFromEdit)
      {
        this.fromEditPage = true;
      }
     });
  }

public Load(initialLoad: boolean = false)
{
  if(initialLoad)
  {
    this.jobListRequest = {...this.jobFilterForm.value, ...this.paginationParams}
  }
  this._jobService.getServiceDetails(this.jobListRequest).pipe(
    catchError((err: any) => {
      let getList = localStorage.getItem('joblist');
      if(getList) this.jobList = JSON.parse(getList);
      return EMPTY;
    }
  )).subscribe((data: any)=> {
    this.jobList = data.serviceDetails;
    this.paginationObj.totalRecordsCount = data.count;
    localStorage.setItem("joblist", JSON.stringify(data))
    this.selectedJobs = [];
    this.selectedJobIds = [];
  })
}
  public onFilterChanges()
  {

    this.jobFilterForm.valueChanges.subscribe(selectedValue  => {
      this.jobListRequest.ownerId = selectedValue.ownerId?.trim();
      this.jobListRequest.status = selectedValue.status;
      this.jobListRequest.year = selectedValue.year?.toString();
      this.jobListRequest.month = selectedValue.month?.toString();
      this.jobListRequest.type = selectedValue.type;
      this.jobListRequest.jobType = parseInt(selectedValue.jobType!);
      this.jobListRequest.serviceType = selectedValue.serviceType!;

      if(selectedValue.jobId === '')
      {
        this.Load(false);
      }
      else {
        this.SearchJobs();
        console.log(this.jobStatus);
      }
    })
  }
  public SearchJobs(pageNumber: number = 1)
  {
    let jobId = this.jobFilterForm.value.jobId;
    let manager = this.jobFilterForm.value.ownerId;
    let status = this.jobFilterForm.value.status;
    let selectedStatus = this.jobStatus.find(item => item.statusCode === status);
    console.log(selectedStatus);
    if(selectedStatus === undefined) selectedStatus = 'ALL';
    let statusDesc = selectedStatus.statusDesc;
    if(statusDesc === undefined) statusDesc = 'ALL';
    let year = this.jobFilterForm.value.year;
    let month = this.jobFilterForm.value.month;
    this.paginationObj.pageNumber = pageNumber;
    this.paginationParams.pageNumber= this.paginationObj.pageNumber,
    this.paginationParams.pageSize= this.paginationObj.pageSize

    if(jobId !== null && jobId !== '')
    {
      this._jobService.getServiceMasterSearch(jobId, manager, statusDesc, year, month, this.paginationParams).subscribe((data: any)=> {
        this.jobList = data.serviceDetails;
        this.paginationObj.totalRecordsCount = data.count;

        localStorage.setItem("joblist", JSON.stringify(data))

        this.selectedJobs = [];
        this.selectedJobIds = [];
      })
    }
  }

  public LoadFilters()
  {
    let userData = JSON.parse(localStorage.getItem("userData")!);

    
    this._commonService.getAccountManagers().subscribe((data: any)  => {
      this.accountManagers = data;
      var searchIndex = this.accountManagers.find((item : any) => item.empName.trim() === userData.empName.trim());
      if(searchIndex === undefined)
      {
        this.jobFilterForm.patchValue({
          ownerId: 'All'
        });
      }
    
      this.setQueryParamToFilter();
    });

    this._jobService.getJobStatus().subscribe(data => {
      this.jobStatus = data.filter(status => ['Draft', 'In Discussion', 'Confirmed', 'Job Scheduled'].includes(status.statusDesc));
      this.route.queryParamMap.subscribe((params) => {
        if(params.has('jobId'))
        {
          this.jobFilterForm.patchValue({
            jobId: params.get('jobId')
          });
          this.jobFilterForm.patchValue({
            ownerId: 'All'
          });
          
          
        }
  
      })
    });
}

  LoadFiscalYears()
  {
    var year = new Date().getFullYear();
    for (let i = -3; i <=1 ; i++)
    {
      this.fiscalYears.push((year + i).toString());
    }
  }

  updatePagination(event: number)
  {
    this.paginationParams.pageNumber = event;
    this.paginationObj.pageNumber = event

    let jobId = this.jobFilterForm.value.jobId;

    if(jobId !== null && jobId !== '')
    {
      this.SearchJobs(event);
      return;
    }
    this.Load(true);
  }

  openQuoteDetailsModal(jobId: any) {
    const modalRef = this.modalService.open(QuoteDetailsModalComponent,{ fullscreen : "lg", centered: true});
    modalRef.componentInstance.jobId = jobId;


  }
  openChangeStatusModal(){
    const modalRef = this.modalService.open(JobStatusModalComponent,{ fullscreen : "lg", centered: true});
    modalRef.componentInstance.jobIds = this.selectedJobIds.join(',');
    console.log(this.selectedJobIds.join(','));
    modalRef.componentInstance.selectedJobs = this.selectedJobs;
    console.log(this.selectedJobs);
    modalRef.result.then((data) => {
      if(data)
      {
        this.Load(false);
      }
    }, (reason) => {

    });

  }

  rowSelect(job: any)
  {
    if(this.selectedJobIds.includes(job.jobID))
    {
      this.selectedJobIds.splice(this.selectedJobIds.indexOf(job.jobID),1);
      this.selectedJobs.splice(this.selectedJobs.indexOf(job.rowIndex,1));
    }
    else{
      this.selectedJobIds.push(job.jobID);
      this.selectedJobs.push(job);
    }
  }
  getNotes(jobId: any, siteId: any)
  {
    let model =
    {
      jobId : jobId.trim(),
      siteId : siteId
    }
    this._jobService.getNotes(model).subscribe((res: GetNotes) =>{
      const modalRef = this.modalService.open(NotesViewComponent,{ fullscreen : "lg", centered: true});
      modalRef.componentInstance.jobId = jobId;
      modalRef.componentInstance.siteId = siteId;
      modalRef.componentInstance.note = res;
      modalRef.result.then((data) => {
        if(data)
        {
          this.Load(false);
        }
      }, (reason) => {

      });
    })
  }
  importQuotes()
  {
    let accMngr = this.jobFilterForm.value.ownerId;
    this._jobService.importJobs(accMngr).subscribe(res=> {
      this._toastrService.success('Job imported successfully', 'Imported');
    })

  }

  get selectedOwnerId(): string|null {
    const ownerIdControl = this.jobFilterForm.get('ownerId');
    if (ownerIdControl) {
      return ownerIdControl.value;
    } else {
      return '';
    }
  }

  getColorByStatus(status: string|null): string {
    switch (status) {
      case 'Email Sent':
        return '#E8A90E';
      case 'Viewed':
        return '#008ed6';
      case 'In Discussion':
        return '#cc00cc';
      case 'Accepted':
        return '#00b300';
      case 'Confirmed':
        return '#958C02';
      case 'Job Scheduled':
        return '#00b300';
        //return '#e60000';
      case 'To Be Sent':
        return '#958C02';
      case 'Draft':
        return '#808080'

      case 'Cancelled':
            return '#730202';
      default:
        return '#730202';
    }
  }
  getColorByPriority(status: string): string {
    switch (status) {
      case 'Critical':
            return 'red';
      default:
        return 'black';
    }

  }

  validateEmails(emails: string[]): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of emails) {
      if (!emailRegex.test(email)) {
        return false;
      }
    }
    return true;
  }

  edit(rowIndex: any)
  {
    const modalRef = this.modalService.open(JobEditComponent,{ windowClass: 'job-edit-modal-width', centered: true});
    modalRef.componentInstance.rowIndex = rowIndex;
    modalRef.result.then((data) => {
      if(data)
      {
        this.Load(false);
      }
    }, (reason) => {

    });
  }
}

