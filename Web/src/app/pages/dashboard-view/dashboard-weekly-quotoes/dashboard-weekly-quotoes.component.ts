import { Component, Input, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { getCSSVariableValue } from 'src/app/_metronic/kt/_utils';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-dashboard-weekly-quotoes',
  templateUrl: './dashboard-weekly-quotoes.component.html',
  styleUrls: ['./dashboard-weekly-quotoes.component.scss']
})
export class DashboardWeeklyQuotoesComponent implements OnInit {

  @Input() data: any[] = [];
  @Input() chartColor: string = '';
  @Input() chartHeight: string;

  subscriptionDashboardData$: Subscription;

  public chartOptions: any = {};
  constructor(private filterSharedService: DashboardFilterSharedService) {}

  ngOnInit(): void {
    this.subscribeSharedServiceData();
  }

  subscribeSharedServiceData()
  {
    this.subscriptionDashboardData$ = this.filterSharedService.selectedWeeklyQuotes$.subscribe((data : any) => {
      if(!_.isEmpty(data))
      {
        this.data = data;
        this.chartOptions = this.getChartOptions(this.chartHeight, this.chartColor);
        this.filterSharedService.resetWeeklyQuotesData();
      }
     });
  }


  getChartOptions(chartHeight: string, chartColor: string) {
    const labelColor = getCSSVariableValue('--kt-gray-800');
    const strokeColor = getCSSVariableValue('--kt-gray-300');
    const baseColor = getCSSVariableValue('--kt-' + chartColor);
    const lightColor = getCSSVariableValue('--kt-' + chartColor + '-light');
    const jobs = this.data.map((element) => element['jobs']);
    const date = this.data.map((element) => element['date'])
    .map((element,index) => element.substring(0,10));

    return {
      series: [
        {
          name: 'Jobs',
          data: jobs,
        },
      ],
      chart: {
        fontFamily: 'inherit',
        type: 'area',
        height: chartHeight,
        toolbar: {
          show: true,
        },
        zoom: {
          enabled: false,
        },
        sparkline: {
          enabled: false,
        },
      },
      plotOptions: {},
      legend: {
        show: true,
      },
      dataLabels: {
        enabled: false,
        colors: "#008080",
      },
      fill: {
        type: 'solid',
        opacity: 1,
      },
      stroke: {
        curve: 'smooth',
        show: true,
        width: 2,
        colors: ["#8a2be2"],
      },
      xaxis: {
        categories: date,
        axisBorder: {
          show: true,
        },
        axisTicks: {
          show: true,
        },
        labels: {
          show: true,
          style: {
            colors: labelColor,
            fontSize: '12px',
          },
        },
        crosshairs: {
          show: false,
          position: 'front',
          stroke: {
            color: strokeColor,
            width: 1,
            dashArray: 3,
          },
        },
        tooltip: {
          enabled: true,
        },
      },
      yaxis: {
        min: 0,
        max: Math.max.apply(null, jobs) + 10,
        labels: {
          show: true,
          style: {
            colors: labelColor,
            fontSize: '12px',
          },
        },
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
        style: {
          fontSize: '12px',
        },
        y: {
          formatter: function (val: any) {
            return val + '';
          },
        },
      },
      
      markers: {
        colors: [lightColor],
        strokeColors: [baseColor],
        strokeWidth: 10,
      },
      colors: ["#FFCC99"],
    };
  }
}

