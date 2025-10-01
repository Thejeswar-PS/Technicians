import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { getCSSVariableValue } from 'src/app/_metronic/kt/_utils';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../modules/auth';

@Component({
  selector: 'app-dashboard-recent-activities',
  templateUrl: './dashboard-recent-activities.component.html',
  styleUrls: ['./dashboard-recent-activities.component.scss']
})
export class DashboardRecentActivitiesComponent implements OnInit {

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
        this.data = data.recentActivityLog;
        console.log(this.data)
        //this.chartOptions = this.getChartOptions(this.chartHeight);

        // let obj = this.data.find(obj => {
        //   return obj.statusDesc === 'Accepted'
        // })
        // this.totalBalance = obj.quoteAmount;
        this.filterSharedService.resetDashboardData();
      }
     });
  }

  getStatusColor(status: String) {
    let style = {};
    if (status === 'Job Scheduled') {
      style = { 'color': 'green' };
    } else if (status === 'anotherStatus') {
      style = { 'color': 'blue' };
    }
    // Add more conditions for different status and colors as needed
    return style
  }
  
}

