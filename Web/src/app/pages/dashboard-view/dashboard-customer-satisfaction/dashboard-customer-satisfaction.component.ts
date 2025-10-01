import { ChangeDetectorRef, Component, OnDestroy, OnInit, Input, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { EMPTY, Subject, catchError, takeUntil } from 'rxjs';
import { ICustomerFeedback, ISatisfication, IStat } from 'src/app/core/model/customer-feedback.model';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';
import { CommonService } from 'src/app/core/services/common.service';
import { AuthService } from '../../../modules/auth';
import {
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexChart,
  ChartComponent
} from "ng-apexcharts";
import { Router } from '@angular/router';
import { trigger, transition, animate, style } from '@angular/animations';
import { Subscription } from 'rxjs';
import * as _ from 'lodash';
import { ChangeDetectionStrategy } from '@angular/core';
import { AfterViewInit } from '@angular/core';
import { AdminService } from 'src/app/core/services/admin.service';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive?: any;
  labels: any;
  stroke?: any;
  fill?: any;
  colors: any[];
  plotOptions?: any,
  grid?: any,
  legend?: any
};
@Component({
  selector: 'app-dashboard-customer-satisfaction',
  templateUrl: './dashboard-customer-satisfaction.component.html',
  styleUrls: ['./dashboard-customer-satisfaction.component.scss']
  // changeDetection: ChangeDetectionStrategy.OnPush
  // animations: [
  //   trigger('dataChange', [
  //     transition(':increment', [
  //       style({ opacity: 0, transform: 'translateY(-20px)' }), // Start with opacity 0 and above
  //       animate('0.3s ease-out', style({ opacity: 1, transform: 'translateY(0)' })) // Fade in and slide down
  //     ]),
  //     transition(':decrement', [
  //       animate('0.3s ease-out', style({ opacity: 0, transform: 'translateY(-20px)' })) // Fade out and slide up
  //     ])
  //   ])
  // ]
})
export class DashboardCustomerSatisfactionComponent implements OnInit{
  
  destroy$ = new Subject<void>();
  feedbackDetails: ICustomerFeedback;
  @ViewChild("chart") chart: ChartComponent;
  chartOptions: ChartOptions = {
    series: [],
    colors: [],
    chart: { width: 0, type: "pie" },
    labels: [],
    responsive:[]
  }
  subscriptionDashboardData$: Subscription;
  subscriptionDashboardFilter$: Subscription;
  filters : any = {
    dateRange : 'CY',
    accountManager : 'ALL'
  }
  constructor(
    private filterSharedService: DashboardFilterSharedService,
    private auth: AuthService,
    private adminService: AdminService, 
    private cdRef:ChangeDetectorRef) { }
  ngOnInit(): void {
    this.initChart();
    this.getFeedback(this.filters);
    this.subscribeSharedServiceData();
  }
  
 getFeedback(filter: any){
  this.adminService.getCustomerFeedback({type : filter.dateRange, manager: filter.accountManager.trim()}).pipe(takeUntil(this.destroy$), catchError((err: any) =>{
    return EMPTY
  }))
  .subscribe((feedback: any)=> {
    this.chartOptions.series = [];
    this.feedbackDetails = feedback;
    this.chartOptions.series.push(this.feedbackDetails.score)

  });
}
ngOnDestroy(): void {
  this.destroy$.next();
  this.destroy$.complete();
}
subscribeSharedServiceData()
{
  this.subscriptionDashboardFilter$ = this.filterSharedService.selectedDashboardFilter$.subscribe((filters : any) => {
    if(!_.isEmpty(filters))
    {
      if(filters.dateRange !== this.filters.dateRamge || filters.accountManager !== this.filters.accountManager)
      {
        this.getFeedback(filters);
      }
      this.filterSharedService.resetDashboardFilters();
    }
   });
}

  initChart(){
    this.chartOptions = {
      series: [],
      chart: {
        height: 350,
        type: "radialBar",
        toolbar: {
          show: false
        }
      },
      colors:[],
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 225,
          hollow: {
            margin: 0,
            size: "70%",
            background: "#fff",
            image: undefined,
            position: "front",
            dropShadow: {
              enabled: true,
              top: 3,
              left: 0,
              blur: 4,
              opacity: 0.24
            }
          },
          track: {
            background: "#fff",
            strokeWidth: "67%",
            margin: 0, // margin is in pixels
            dropShadow: {
              enabled: true,
              top: -3,
              left: 0,
              blur: 4,
              opacity: 0.35
            }
          },

          dataLabels: {
            show: true,
            name: {
              offsetY: -10,
              show: false,
              color: "#888",
              fontSize: "17px"
            },
            value: {
              // formatter: function(val) {
              //   return parseInt(val.toString(), 10).toString();
              // },
              color: "#111",
              fontSize: "36px",
              show: true
            }
          }
        }
      },
      fill: {
        type: "gradient",
        gradient: {
          shade: "dark",
          type: "horizontal",
          shadeIntensity: 0.5,
          gradientToColors: ["#ABE5A1"],
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100]
        }
      },
      stroke: {
        lineCap: "round"
      },
      labels: []
    };

  }
  
  
    /*getFeedback(){
    this.adminService.getCustomerFeedback(this.FilterForm.value).pipe(takeUntil(this.destroy$), catchError((err: any) =>{
      return EMPTY
    }))
    .subscribe(feedback=> {
      
      this.feedbackDetails = feedback;
      let details = this.feedbackDetails.satisfication;
      this.score = this.feedbackDetails.score;
      this.guageOptions.series = [this.score];
      this.guageOptions.labels = ["Score"]
      for (const key in details) {
        const validKey = key as keyof ISatisfication;
        
      }
    });
  }


  
  
  goToDetails(status: any)
  {
    this.router.navigate(['admin/customer-feedback-details'], { queryParams: { status: status,year: this.FilterForm.controls['type'].value} });

    // this.router.navigate(['/customer-feedback-details', { status: status,year: this.FilterForm.controls['type'].value}]);
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }*/
  
}

