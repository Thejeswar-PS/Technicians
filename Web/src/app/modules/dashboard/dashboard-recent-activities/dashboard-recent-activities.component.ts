import { RecentActivities } from './../../../core/model/recent-activities';
import { Component, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { ToBeWrittenQuotes } from 'src/app/core/model/to-be-written-quotes';
import { DashboardService } from 'src/app/core/services/dashboard.service';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';

@Component({
  selector: 'app-dashboard-recent-activities',
  templateUrl: './dashboard-recent-activities.component.html',
  styleUrls: ['./dashboard-recent-activities.component.scss']
})
export class DashboardRecentActivitiesComponent implements OnInit {

  subscriptionToBeWrittenData$: Subscription;
  filter : any = {
    accountManager : 'A'
    //accountManager : JSON.parse(localStorage.getItem("userData")!)["empName"]
  }
  accountManagers: any[] = [];
  recentActivities: RecentActivities[];
  // recentActivities : RecentActivities[] = [
  //   {
  //     "quoteID": 571873,
  //     "quoteOwner": "Andrew Ross ",

  //     "quotedOn": new Date("2021-04-30T08:31:58"),
  //     "dateStatusChanged": new Date("2021-05-11T12:50:51"),
  //     "quoteReason": "Caps and Fans Installation ",
  //     "quotePriority": "Normal ",
  //     "contractType": "T&M ",
  //     "age": 795
  //     },
  //     {
  //     "quoteID": 568668,
  //     "custname": "Kaiser Permanente ",
  //     "quoteOwner": "Robby Dorrance",
  //     "quoteStatus": "Sent",
  //     "quoteAmount": 9151.14,
  //     "quotedOn": new Date("2021-05-01T00:00:00"),
  //     "dateStatusChanged": new Date("2021-04-27T17:59:24"),
  //     "quoteReason": "Battery Installation - Full ",
  //     "quotePriority": "Normal",
  //     "contractType": "T&M ",
  //     "age": 97
  //     },
  //     {
  //     "quoteID": 568408,
  //     "custnmbr": "BASSPRTX09 ",
  //     "custname": "Bass Pro Shops ",
  //     "quoteOwner": "Zack Larson ",
  //     "quoteStatus": "Sent",
  //     "quoteAmount": 2225.5,
  //     "quotedOn": new Date("2022-05-21T14:26:25"),
  //     "dateStatusChanged": new Date("2021-04-21T17:11:49"),
  //     "quoteReason": "UPS Replacement",
  //     "quotePriority": "Normal",
  //     "contractType": "T&M ",
  //     "age": 96
  //     }
  // ];



  constructor(
    private filterSharedService: DashboardFilterSharedService,
    private dashboardService: DashboardService
    ) {

  }

  ngOnInit(): void {
    this.subscribeSharedServiceData();
  }


  subscribeSharedServiceData()
  {
    this.filterSharedService.selectedDashboardFilter$.subscribe((filters : any) => {
      if(!_.isEmpty(filters))
      {
        this.accountManagers = JSON.parse(localStorage.getItem("AccountManagers")!);
        // var item = this.accountManagers.find(x => x.text.trim() === filters.accountManager.trim());
        // if(item !== undefined)
        // {
        //   this.filter.accountManager = item.text;
        // }
        // else{
        //   this.filter.accountManager = 'A';
        // }

        this.loadData();
        this.filterSharedService.resetDashboardFilters();
      }
     });

     this.filterSharedService.selectedToBeSentTable$.subscribe((filter : any) => {
      if(!_.isEmpty(filter))
      {
        var item = filter.accountManager;
        if(item !== undefined)
        {
          this.filter.accountManager = item;
        }

        this.loadData();
        this.filterSharedService.resetToBeSentTableData();
      }
     });
  }

  loadData()
  {
    this.dashboardService.getRecentActivitiesData(this.filter.accountManager).subscribe((res) => {
      this.recentActivities = res.sort((a, b) => {
        let da : any = new Date(a.date),
            db : any = new Date(b.date);
        return db - da;
    });
      this.recentActivities = _.take(this.recentActivities,10);

    })
  }
}

