import { Component, OnInit, ViewChild } from '@angular/core';
import { Subscription, combineLatest } from 'rxjs';
import { ModalComponent, ModalConfig } from 'src/app/_metronic/partials';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';
import * as _ from 'lodash';
import { DashboardService } from 'src/app/core/services/dashboard.service';
import { Dashboardmodel, JobScheduleTrend, MonthlyUnscheduledJob, RecentActivityLog, Sale, WeeklyTopPerformers } from 'src/app/core/model/dashboard-model';
import { ICustomerFeedback } from 'src/app/core/model/customer-feedback.model';
@Component({
  selector: 'app-dashboard-view',
  templateUrl: './dashboard-view.component.html',
  styleUrls: ['./dashboard-view.component.scss']
})
export class DashboardViewComponent implements OnInit{

  @ViewChild('modal') private modalComponent: ModalComponent;

  modalConfig: ModalConfig = {
    modalTitle: 'Modal title',
    dismissButtonLabel: 'Submit',
    closeButtonLabel: 'Cancel'
  };
  subscriptionDashboardFilter$: Subscription;
  filters : any = {
    department : 'ALL',
    accountManager : 'ALL'
  }
  dashboardData : Dashboardmodel = {}
  toBeWritten : any;

  weeklyQuotes : any =
  [
    {
        "date": "2023-05-21T00:00:00",
        "quotes": 0
    },
    {
        "date": "2023-05-28T00:00:00",
        "quotes": 0
    },
    {
        "date": "2023-06-04T00:00:00",
        "quotes": 0
    },
    {
        "date": "2023-06-11T00:00:00",
        "quotes": 0
    },
    {
        "date": "2023-06-18T00:00:00",
        "quotes": 0
    },
    {
        "date": "2023-06-25T00:00:00",
        "quotes": 0
    },
    {
        "date": "2023-07-02T00:00:00",
        "quotes": 0
    }
]


  constructor(private filterSharedService: DashboardFilterSharedService,
              private dashboardService: DashboardService
             ) {}

  ngOnInit(): void {
    this.subscribeSharedServiceData();
    //this.loadDashboardData();
    this.filterSharedService.setHomePage(true);
  }

  async openModal() {
    return await this.modalComponent.open();
  }

  subscribeSharedServiceData()
  {
    this.subscriptionDashboardFilter$ = this.filterSharedService.selectedDashboardFilter$.subscribe((filters : any) => {
      if(!_.isEmpty(filters))
      {
        this.filters = filters;

        this.loadDashboardData();
        this.filterSharedService.resetDashboardFilters();
      }
     });
  }

  loadDashboardData() {
    // this.dashboardService.getDashboardData(this.filters).subscribe((data: Dashboardmodel)=>{
    //   this.dashboardData = data;
    //   this.filterSharedService.setDashboardData(this.dashboardData);
    //   // this.filterSharedService.settoBeWrittenData(this.dashboardData.jobScheduleTrend);
    //   this.filterSharedService.setWeeklyQuotesData(this.dashboardData.jobScheduleTrend);
    // })
    this.dashboardService.getMonthlyUnscheduledJobs(this.filters).subscribe((data: MonthlyUnscheduledJob[])=>{
      this.dashboardData.monthlyUnscheduledJob = data;
      this.filterSharedService.setDashboardData(this.dashboardData);
    })
    this.dashboardService.getRecentActivityLog(this.filters).subscribe((data: RecentActivityLog[])=>{
      this.dashboardData.recentActivityLog = data;
      this.filterSharedService.setDashboardData(this.dashboardData);
    })
    this.dashboardService.getSalesAsync(this.filters).subscribe((data: Sale)=>{
      this.dashboardData.sales = data;
      this.filterSharedService.setDashboardData(this.dashboardData);
    })
    this.dashboardService.getTodaysJobList(this.filters).subscribe((data: any[])=>{
      this.dashboardData.todaysJobList = data;
      this.filterSharedService.setDashboardData(this.dashboardData);
    })
    this.dashboardService.getWeeklyJobScheduleTrends(this.filters).subscribe((data: JobScheduleTrend[])=>{
      this.dashboardData.jobScheduleTrend = data;
      this.filterSharedService.setDashboardData(this.dashboardData);
      this.filterSharedService.setWeeklyQuotesData(this.dashboardData.jobScheduleTrend);
    })
    this.dashboardService.getWeeklyTopPerformers(this.filters).subscribe((data: WeeklyTopPerformers[])=>{
      this.dashboardData.weeklyTopPerformers = data;
      this.filterSharedService.setDashboardData(this.dashboardData);
    })
    this.dashboardService.getCustomerFeedback(this.filters).subscribe((data: ICustomerFeedback)=>{
      this.dashboardData.customerFeedback = data;
      this.filterSharedService.setDashboardData(this.dashboardData);
    })
  }
}
