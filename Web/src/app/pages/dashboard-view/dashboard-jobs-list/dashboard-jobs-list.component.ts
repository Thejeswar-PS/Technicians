import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { getCSSVariableValue } from 'src/app/_metronic/kt/_utils';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../modules/auth';

@Component({
  selector: 'app-dashboard-jobs-list',
  templateUrl: './dashboard-jobs-list.component.html',
  styleUrls: ['./dashboard-jobs-list.component.scss']
})
export class DashboardJobsListComponent implements OnInit {

  @Input() data: any[] = [];

  empLevel: number = 0;
  subscriptionDashboardData$: Subscription;
  constructor(private filterSharedService: DashboardFilterSharedService,private auth: AuthService) {
    //this.chartOptions = this.getChartOptions(this.chartHeight);
  }

  ngOnInit(): void {
    this.auth.currentUserSubject.subscribe(data=>
    {
      // this.empLevel = data.empLevel;
    });
    this.subscribeSharedServiceData();
  }


  subscribeSharedServiceData()
  {
    this.subscriptionDashboardData$ = this.filterSharedService.selectedDashboardData$.subscribe((data : any) => {
      if(!_.isEmpty(data))
      {
        this.data = data.todaysJobList;
        this.filterSharedService.resetDashboardData();
      }
     });
  }
  
}

