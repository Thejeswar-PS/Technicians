import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from 'src/app/core/services/common.service';
import { JobService } from 'src/app/core/services/job.service';
import { ReportService } from 'src/app/core/services/report.service';
import { AuthService } from 'src/app/modules/auth';
import { QuoteSharedService } from 'src/app/modules/quotes/quote-shared.service';

@Component({
  selector: 'app-job-report-details',
  templateUrl: './job-report-details.component.html',
  styleUrls: ['./job-report-details.component.scss']
})
export class JobReportDetailsComponent implements OnInit {

  rowIndex : string = "";
  accountManagers: any[] = [];
  queryType: any = "";
  quoteOwner:any = "";
  yearType: any = "";
  empName: string = "";
  jobList: any = {};
  job: any = {};
  jobStatus: any[] = [];
  jobFilterForm = this.fb.group({
    ownerId : ['ALL'],
    yearType : ['CY']
  });
  sortedColumn: string = '';
  sortDirection: number = 1;
  showHeaderName: boolean = false;
  constructor( private route : ActivatedRoute,

    private _reportService : ReportService,
    private _commonService : CommonService,
    private fb: FormBuilder,
    private router: Router,
    private quoteSharedService: QuoteSharedService,
    private auth: AuthService
    ) {
      route.params.subscribe(val => {
        let p = 10
        })
    this.route.params.subscribe(param => {
      if(param['rowIndex'] != null)
      {
        this.rowIndex = param['rowIndex'];
      }
    });
  }


  ngOnInit(): void {


    if(this.accountManagers.length <= 0)
    {
      this.accountManagers = JSON.parse(localStorage.getItem("AccountManagers")!);
    }
    this.route.queryParamMap.subscribe((params) => {
      if(params.has('QueryType'))
      {
        this.queryType = params.get('QueryType');
      }
      if(params.has('manager'))
      {
        this.quoteOwner = params.get('manager');
        if(this.quoteOwner === 'ALL' || this.quoteOwner === 'All'){
          this.jobFilterForm.controls['ownerId'].setValue('All');
        }
        else{
          this.jobFilterForm.controls['ownerId'].setValue(this.quoteOwner);
        }
        this.showHeaderName = true;
      }
      if(params.has('quoteOwner'))
        {
          this.quoteOwner = params.get('quoteOwner');
          const empNames = this.accountManagers.map(manager => manager.empName);
          if (!empNames.includes(this.quoteOwner)) {
            this.jobFilterForm.controls['ownerId'].setValue('All');
          }
          else{
            this.jobFilterForm.controls['ownerId'].setValue(this.quoteOwner);
          }
          //this.showHeaderName = true;
        }
      if(params.has('yearType'))
      {
        this.yearType = params.get('yearType');
        this.jobFilterForm.controls['yearType'].setValue(this.yearType);
      }
      this.getJobsReport(
        this.jobFilterForm.get('ownerId')?.value,
        this.jobFilterForm.get('yearType')?.value
      );
    });
    //this.getJobsReport(this.jobFilterForm.get('ownerId')?.value,this.jobFilterForm.get('yearType')?.value);
    this.onFilterChanges();
    this.loadFilters();
  }

  loadFilters()
  {
    if(this.jobFilterForm.get('ownerId')?.value !== 'ALL')
      return;

    let userData = JSON.parse(localStorage.getItem("userData")!);
    var searchIndex = this.accountManagers.find((item : any) => item.empName.trim() === userData.empName.trim());
    if(searchIndex === undefined)
    {
      this.jobFilterForm.patchValue({
        ownerId: 'All'
      });
    }
    else{
      this.jobFilterForm.patchValue({
        ownerId: userData.empName.trim()
      });
    }
  }
  getJobsReport(owner:any = 'ALL',yearType:any = 'CY')
  {
    this._reportService.getJobReportDetails(this.queryType,owner.trim(),yearType).subscribe(res=> {
      this.jobList = res;
    })
  }

  sortTable(column: string): void {
  if (this.sortedColumn === column) {
    this.sortDirection = -this.sortDirection;
  } else {
    this.sortedColumn = column;
    this.sortDirection = 1;
  }

  this.jobList.sort((a: any, b: any) => {
    const aValue = a[column];
    const bValue = b[column];

    console.log(aValue?.[0]); // safely log without breaking

    // Handle null or undefined
    if (aValue == null && bValue == null) return 0;
    if (aValue == null) return 1 * this.sortDirection;
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

  public onFilterChanges()
  {

    this.jobFilterForm.valueChanges.subscribe((selectedValue:any)  => {
      this.getJobsReport(selectedValue.ownerId?.trim(), selectedValue.yearType?.trim())
    })

  // this.jobFilterForm.controls.jobId.enable({onlySelf: true,emitEvent:false});
  //   this.jobFilterForm.valueChanges.pipe(startWith(undefined), pairwise())
  //   .subscribe(valuesArray => {
  //        const oldVal = valuesArray[0];
  //        const newVal = valuesArray[1];
  //        const oldQuoteId = oldVal === undefined ? null : oldVal['QuoteID'];
  //        if(oldQuoteId === newVal?.QuoteID)
  //        {
  //         this.paginationObj['PageNumber'] = 1;
  //         this.LoadQuotes(false);
  //        }
  //   })
  }


  edit(rowIndex: any)
  {
    this.router.navigate(['/job-edit', { rowIndex: rowIndex}]);
  }

  getColorByStatus(status: string|null): string {
    switch (status) {
      case 'Sent':
        return '#E8A90E';
      case 'Viewed':
        return '#008ed6';
      case 'In Discussion':
        return '#cc00cc';
      case 'Job Scheduled':
        return '#00b300';
      case 'Confirmed':
        return '#958C02';
      case 'Accepted':
        return '#008ed6';
      case 'Declined':
        return '#e60000';
      case 'To Be Sent':
        return '#958C02';
      case 'Draft':
        return '#808080';
      case 'Cancelled':
          return '#e60000';
      // Add more cases for other status if needed
      default:
        return '#730202'; // Default color when the status doesn't match any case
    }
  }

  get responseDateLabel(): string {
    switch (this.queryType) {
      case 'QuotesWritten':
        return 'Quoted On';
      case 'Processed':
        return 'Processed On';
      case 'Scheduled':
        return 'Scheduled On';
      default:
        return 'Response Date';
    }
  }

  get displayQueryType(): string {
    switch (this.queryType) {
      case 'ToBeScheduled':
        return 'To Be Scheduled';
      case 'Scheduled':
        return 'Scheduled';
      case 'PastDue':
        return 'Past Due';
      case 'JobsToProcess':
        return 'Jobs To Process';
      case 'QuotesWritten':
        return 'Quotes Written';
      case 'Processed':
        return 'Processed';
      default:
        return this.queryType || '';
    }
  }
}
