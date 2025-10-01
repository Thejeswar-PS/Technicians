import { Component, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';
import * as _ from 'lodash';
import { DashboardService } from 'src/app/core/services/dashboard.service';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ToBeWrittenQuotes } from 'src/app/core/model/to-be-written-quotes';

@Component({
  selector: 'app-dashboard-to-be-written-table',
  templateUrl: './dashboard-to-be-written-table.component.html',
  styleUrls: ['./dashboard-to-be-written-table.component.scss']
})

export class DashboardToBeWrittenTableComponent implements OnInit {



  subscriptionToBeWrittenData$: Subscription;
  filter : any = {
    accountManager : 'A'
  }
  accountManagers: any[] = [];
  toBeWrittenQuotes : ToBeWrittenQuotes[] = []

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
    this.subscriptionToBeWrittenData$ = this.filterSharedService.selectedToBeWrittenTable$.subscribe((filter : any) => {
      if(!_.isEmpty(filter))
      {
        // this.accountManagers = JSON.parse(localStorage.getItem("AccountManagers")!);
        // var item = this.accountManagers.find(x => x.value === filter.accountManager);
        this.filter.accountManager = filter.accountManager; 
        this.loadData();
        this.filterSharedService.resetToBeWrittenTableData();
      }
     });
  }

  loadData()
  {
    this.dashboardService.getToBeWrittenQuotesData(this.filter).subscribe((res) => {
      this.toBeWrittenQuotes = res && res.length > 0 ? res.slice(0,10) : [];
    })
  }
}
