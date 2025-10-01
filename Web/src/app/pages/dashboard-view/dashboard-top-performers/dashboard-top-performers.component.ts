import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import { getCSSVariableValue } from 'src/app/_metronic/kt/_utils';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';
import * as _ from 'lodash';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../modules/auth';

@Component({
  selector: 'app-dashboard-top-performers',
  templateUrl: './dashboard-top-performers.component.html',
  styleUrls: ['./dashboard-top-performers.component.scss']
})
export class DashboardTopPerformersComponent implements OnInit {

  @Input() data: any[] = [];
  @Input() chartHeight: string;
  @Input() chartColor: string = '';

  totalBalance: number = 0;
  empLevel: number = 0;
  subscriptionDashboardData$: Subscription;
  public chartOptions: any = {};
  constructor(private filterSharedService: DashboardFilterSharedService,private auth: AuthService) {
    this.chartOptions = this.getChartOptions(this.chartHeight);
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
        this.data = data.weeklyTopPerformers;
        /*this.data = [
          {
            "offName": "Alex Werner          ",
            "quotesWritten": 1,
            "jobScheduled": 0,
            "jobsProcessed": 0,
            "teamRank": 1
          },
          {
            "offName": "Bradie Rosen         ",
            "quotesWritten": 0,
            "jobScheduled": 0,
            "jobsProcessed": 0,
            "teamRank": 2
          },
          {
            "offName": "Brynn Weibel         ",
            "quotesWritten": 0,
            "jobScheduled": 0,
            "jobsProcessed": 0,
            "teamRank": 3
          },
          {
            "offName": "Christopher Frid     ",
            "quotesWritten": 1,
            "jobScheduled": 0,
            "jobsProcessed": 0,
            "teamRank": 4
          },
          {
            "offName": "Ellie Hempel         ",
            "quotesWritten": 1,
            "jobScheduled": 1,
            "jobsProcessed": 2,
            "teamRank": 5
          }
        ];*/
        this.chartOptions = this.getChartOptions(this.chartHeight);

        // let obj = this.data.find(obj => {
        //   return obj.statusDesc === 'Accepted'
        // })
        // this.totalBalance = obj.quoteAmount;
        this.filterSharedService.resetDashboardData();
      }
     });
  }
  getChartOptions(height: string) {
    const labelColor = getCSSVariableValue('--kt-gray-500');
    const borderColor = getCSSVariableValue('--kt-gray-200');
    const baseColor = getCSSVariableValue('--kt-primary');
    const secondaryColor = getCSSVariableValue('--kt-gray-300');

    const sortedData = this.data.sort((a, b) => a.teamRank - b.teamRank);
    const categories = sortedData.map((element) => element['offName'].trim());
    const series = [
        {
            name: 'Quotes Written',
            data: sortedData.map((element) => element['quotesWritten']),
        },
        {
            name: 'Jobs Scheduled',
            data: sortedData.map((element) => element['jobScheduled']),
        },
        {
            name: 'Jobs Processed',
            data: sortedData.map((element) => element['jobsProcessed']),
        }
    ];

    return {
        series: series,
        chart: {
            stacked: true,
            fontFamily: 'inherit',
            type: 'bar',
            height: height,
            toolbar: {
                show: false,
            },
            events: {
                dataPointMouseEnter: function (event: any, chartContext: any, config: any) {
                    // Handle mouse enter event if needed
                },
                click: function (event: any, chartContext: any, config: any)  {
                    // Handle click event if needed
                }
            },
        },
        plotOptions: {
            bar: {
                horizontal: true,
                columnWidth: '30%',
                borderRadius: 5,
            },
        },
        legend: {
            show: true,
        },
        dataLabels: {
            enabled: false,
        },
        stroke: {
            show: true,
            width: 2,
            colors: ['transparent'],
        },
        xaxis: {
            categories: categories,
            axisBorder: {
                show: false,
            },
            axisTicks: {
                show: false,
            },
            labels: {
                style: {
                    colors: ['black'],
                    fontSize: '14px',
                },
            },
        },
        yaxis: {
            text: 'Count',
            labels: {
                style: {
                    colors: ['black'],
                    fontSize: '12px',
                },
            },
        },
        fill: {
            opacity: 1,
        },
        states: {
            normal: {
                filter: {
                    type: 'none',
                    value: 0,
                },
            },
            hover: {
                filter: {
                    type: 'none',
                    value: 0,
                },
            },
            active: {
                allowMultipleDataPointsSelection: false,
                filter: {
                    type: 'none',
                    value: 0,
                },
            },
        },
        tooltip: {
            enabled: true,
            style: {
                fontSize: '12px',
            },
        },
        colors: [baseColor, "#c384ff", "#4db943"],
        grid: {
            borderColor: borderColor,
            strokeDashArray: 4,
            yaxis: {
                lines: {
                    show: true,
                },
            },
        },
    };
}
}