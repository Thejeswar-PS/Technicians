import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { DashboardService } from 'src/app/core/services/dashboard.service';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';
import * as _ from 'lodash'
import { ToBeSentQuotes } from 'src/app/core/model/to-be-sent-quotes';
@Component({
  selector: 'app-dashboard-to-be-sent-quotes-table',
  templateUrl: './dashboard-to-be-sent-quotes-table.component.html',
  styleUrls: ['./dashboard-to-be-sent-quotes-table.component.scss']
})
export class DashboardToBeSentQuotesTableComponent implements OnInit {

  subscriptionToBeWrittenData$: Subscription;
  filter : any = {
    accountManager : 'A'
  }
  accountManagers: any[] = [];
  toBeSentQuotes : ToBeSentQuotes[] = []
  //   {
  //     "quoteID": 566886,
  //     "custnmbr": "CHMPCA01 ",
  //     "custname": "Community Hospital Monterey Peninsula ",
  //     "quoteOwner": "Evan Cis",
  //     "quoteStatus": "In Discussion",
  //     "quoteAmount": 5139.68,
  //     "quotedOn": new Date("2021-04-19T11:36:33"),
  //     "dateStatusChanged": new Date("2021-04-19T14:53:33"),
  //     "quoteReason": "Battery Installation - Full ",
  //     "quotePriority": "Critical",
  //     "contractType": "T&M ",
  //     "age": 817
  //     },
  //     {
  //     "quoteID": 566887,
  //     "custnmbr": "CHMPCA01 ",
  //     "custname": "Community Hospital Monterey Peninsula ",
  //     "quoteOwner": "Evan Cis",
  //     "quoteStatus": "In Discussion",
  //     "quoteAmount": 5139.68,
  //     "quotedOn": new Date("2021-04-19T11:39:47"),
  //     "dateStatusChanged": new Date("2021-04-19T14:54:04"),
  //     "quoteReason": "Battery Installation - Full ",
  //     "quotePriority": "Critical",
  //     "contractType": "T&M ",
  //     "age": 817
  //     },
  //     {
  //       "quoteID": 567027,
  //       "custnmbr": "OSFIL03",
  //       "custname": "Ottawa Regional Hospital & Healthcare Center",
  //       "quoteOwner": "Alaina Price",
  //       "quoteStatus": "Sent",
  //       "quoteAmount": 8727.5,
  //       "quotedOn": new Date("2021-04-20T14:35:14"),
  //       "dateStatusChanged": new Date("2021-04-22T17:41:12"),
  //       "quoteReason": "Caps and Fan Installation",
  //       "quotePriority": "Critical",
  //       "contractType": "T&M ",
  //       "age": 816
  //       }
  // ];
  constructor(
    private filterSharedService: DashboardFilterSharedService,
    private dashboardService: DashboardService
    ) {

  }

  ngOnInit(): void {
    this.loadData();
    this.subscribeSharedServiceData();
  }
  subscribeSharedServiceData()
  {
    this.subscriptionToBeWrittenData$ = this.filterSharedService.selectedToBeSentTable$.subscribe((filter : any) => {
      if(!_.isEmpty(filter))
      {
        // this.accountManagers = JSON.parse(localStorage.getItem("AccountManagers")!);
        // var item = this.accountManagers.find(x => x.value === filter.accountManager);
        this.filter.accountManager = filter.accountManager;
        this.loadData();
        this.filterSharedService.resetToBeSentTableData();
      }
     });
  }
  loadData()
  {
    this.dashboardService.getToBeSentQuotesData(this.filter).subscribe(res => {
      this.toBeSentQuotes = res && res.length > 0 ? res.slice(0,10) : [];

      // this.toBeSentQuotes = _.take(_.sortBy(res,['quotedOn'], ['desc']),10);
    })
  }
}
