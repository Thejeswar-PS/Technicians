import { Component, Input, OnInit } from '@angular/core';
import * as _ from 'lodash';
import { Observable, Subscription } from 'rxjs';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';
import { AuthService } from '../../../modules/auth';
import { Dashboardmodel } from 'src/app/core/model/dashboard-model';
@Component({
  selector: 'app-dashboard-sales',
  templateUrl: './dashboard-sales.component.html',
  styleUrls: ['./dashboard-sales.component.css']
})
export class DashboardSalesComponent implements OnInit {

  @Input() color: string = '';
  @Input() data: Dashboardmodel = {};
  // @Input() toBeWritten: number = 0;
  filters : any = {
    department : 'ALL',
    accountManager : 'ALL'
  }
  empLevel: number = 0;
  empName: string = '';
  subscriptionDashboardFilter$: Subscription;
  //showDelayedContent = false;


  salesData : any[] = [];
  totalBalance : number = 0;
  constructor(private filterSharedService: DashboardFilterSharedService,
    private auth: AuthService) { }

  ngOnInit() {
    let p = this. data;
    this.auth.currentUserSubject.subscribe(data=>
    {
      // this.empLevel = data.sale?.empLevel;
      // this.empName = data.sale?.empName;
    });
    // this.loadData();s
    this.subscribeSharedServiceData();
    //setTimeout(() => {
    //  this.showDelayedContent = true;
    //}, 1000);
  }

  subscribeSharedServiceData()
  {
    this.subscriptionDashboardFilter$ = this.filterSharedService.selectedDashboardData$.subscribe((data : Dashboardmodel) => {
      if(!_.isEmpty(data))
      {
        this.data = data;
        this.loadData();
        this.filterSharedService.resetDashboardData();
      }
     });
     this.filterSharedService.selectedtoBeWritten$.subscribe((data : any) => {
      if(data !== -1)
      {
        // this.toBeWritten = data;
        this.loadData();
        this.filterSharedService.resettoBeWrittenData()
        ;
      }
     });

     this.subscriptionDashboardFilter$ = this.filterSharedService.selectedDashboardFilter$.subscribe((filters : any) => {
      if(!_.isEmpty(filters))
      {
        this.filters = filters;
      }
     });

  }

  loadData()
  {
    // this.salesData[0] =
    // {
    //   statusDesc : "To Be Scheduled",
    //   countStatus: this.data.sale?.inDiscussion,
    //   quoteAmount: 0
    // }



    // this.totalBalance = this.salesData.reduce((accumulator, obj) => {
    //   return accumulator + obj.quoteAmount;
    // }, 0);

  }

  reloadPage() {
    setTimeout(() => {
      location.reload();
    }, 100);
  }
}
