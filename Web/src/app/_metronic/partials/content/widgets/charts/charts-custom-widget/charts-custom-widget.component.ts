import { Component, Input, OnInit } from '@angular/core';
import { getCSSVariableValue } from '../../../../../kt/_utils';
import { map } from 'rxjs/operators'


export class QuoteChartDetails{
  total : number;
  quoteYear : number;
}



@Component({
  selector: 'app-charts-custom-widget',
  templateUrl: './charts-custom-widget.component.html',
})
export class ChartsCustomWidgetComponent implements OnInit {
  chartOptions: any = {};
  @Input() chartData: QuoteChartDetails[];
  constructor() { }

  ngOnInit(): void {
    this.chartOptions = this.getChartOptions(350);
  }

  getChartOptions(height: number) {
    const labelColor = getCSSVariableValue('--kt-gray-500')
    const borderColor = getCSSVariableValue('--kt-gray-200')
    const baseColor = getCSSVariableValue('--kt-primary')
    const secondaryColor = getCSSVariableValue('--kt-gray-300')

    return {
      series: [
        {
          name: 'Quotes',
          data: this.chartData.map((x) => x.total),
          // data: [44, 55, 57, 56, 61, 58],
        },
        // {
        //   name: 'Revenue',
        //   data: [76, 85, 101, 98, 87, 105],
        // },
      ],
      chart: {
        fontFamily: 'inherit',
        type: 'bar',
        height: height,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '30%',
          borderRadius: 5,
        },
      },
      legend: {
        show: false,
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
        categories: this.chartData.map((x) => x.quoteYear),
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        labels: {
          style: {
            colors: labelColor,
            fontSize: '12px',
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: labelColor,
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
        style: {
          fontSize: '10px',
        },
        y: {
          formatter: function (val: number) {
            return val;
          },
        },
      },
      colors: [baseColor, secondaryColor],
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

