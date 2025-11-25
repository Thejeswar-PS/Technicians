import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { getCSSVariableValue } from 'src/app/_metronic/kt/_utils';
import { ReportService } from 'src/app/core/services/report.service';
import { PartsReceivedByWHChartDto, PartsReceivedByWHTotalsDto, PartsReceivedByWHApiResponseDto } from 'src/app/core/model/part-return-status.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-parts-received-wh-chart',
  templateUrl: './parts-received-wh-chart.component.html',
  styleUrls: ['./parts-received-wh-chart.component.scss']
})
export class PartsReceivedWHChartComponent implements OnInit, OnDestroy {

  @Input() chartHeight: string = '400px';
  @Input() chartColor: string = 'primary';

  // Chart data properties
  chartData: PartsReceivedByWHChartDto[] = [];
  chartTotals: PartsReceivedByWHTotalsDto = { unUsedR: 0, faultyR: 0 };
  public chartOptions: any = {};
  
  // Loading and error states
  isLoading: boolean = false;
  errorMessage: string = '';
  
  selectedYear: number = new Date().getFullYear();
  
  private subscriptions: Subscription = new Subscription();

  constructor(private reportService: ReportService) {
    this.chartOptions = this.getChartOptions();
  }

  ngOnInit(): void {
    // Load mock data first, then try API
    this.loadMockData();
    this.loadPartsReceivedData();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }



  loadPartsReceivedData(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const subscription = this.reportService.getPartsReceivedByWHChart(this.selectedYear).subscribe({
      next: (response: PartsReceivedByWHApiResponseDto) => {
        this.isLoading = false;
        
        if (response.success && response.data) {
          this.chartData = response.data.chartData || [];
          this.chartTotals = response.data.totals || { unUsedR: 0, faultyR: 0 };
          
          // Update chart options with new data
          this.chartOptions = this.getChartOptions();
        } else {
          this.errorMessage = response.message || 'No data available for the selected year';
          this.loadMockData(); // Keep mock data if API fails
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = `Error loading data: ${error.message}`;
        this.loadMockData(); // Keep mock data if API fails
      }
    });

    this.subscriptions.add(subscription);
  }

  private loadMockData(): void {
    // Mock data for development/testing
    this.chartData = [
      { name: 'January', jobsCount: 42, faulty: 8 },
      { name: 'February', jobsCount: 35, faulty: 6 },
      { name: 'March', jobsCount: 48, faulty: 12 },
      { name: 'April', jobsCount: 38, faulty: 7 },
      { name: 'May', jobsCount: 45, faulty: 9 },
      { name: 'June', jobsCount: 33, faulty: 5 }
    ];
    this.chartTotals = { unUsedR: 198, faultyR: 47 };
    this.chartOptions = this.getChartOptions();
  }

  private getChartOptions() {
    const labelColor = getCSSVariableValue('--kt-gray-500');
    const borderColor = getCSSVariableValue('--kt-gray-200');
    const baseColor = getCSSVariableValue('--kt-success');
    const dangerColor = getCSSVariableValue('--kt-danger');
    
    const categories = this.chartData.length > 0 ? this.chartData.map((item) => item.name) : [];
    const jobsCounts = this.chartData.length > 0 ? this.chartData.map((item) => item.jobsCount) : [];
    const faultyCounts = this.chartData.length > 0 ? this.chartData.map((item) => item.faulty) : [];

    return {
      series: [
        {
          name: 'Jobs Count',
          data: jobsCounts,
          color: baseColor
        },
        {
          name: 'Faulty Parts',
          data: faultyCounts,
          color: dangerColor
        }
      ],
      chart: {
        fontFamily: 'inherit',
        type: 'bar',
        height: this.chartHeight,
        toolbar: {
          show: false,
        },
        animations: {
          enabled: true,
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '40%',
          borderRadius: 5,
        },
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'left',
        labels: {
          colors: [labelColor]
        }
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
            colors: [labelColor],
            fontSize: '12px',
          },
        },
      },
      yaxis: {
        title: {
          text: 'Count',
          style: {
            color: labelColor,
          }
        },
        labels: {
          style: {
            colors: [labelColor],
            fontSize: '12px',
          },
        },
      },
      fill: {
        opacity: 0.8,
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
          formatter: function (val: number) {
            return val + ' parts';
          },
        },
      },
      colors: [baseColor, dangerColor],
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

  // Helper methods for template
  getTotalJobs(): number {
    return this.chartData.reduce((total, item) => total + item.jobsCount, 0);
  }

  getTotalFaulty(): number {
    return this.chartData.reduce((total, item) => total + item.faulty, 0);
  }

  getFaultyPercentage(): number {
    const totalJobs = this.getTotalJobs();
    const totalFaulty = this.getTotalFaulty();
    return totalJobs > 0 ? Math.round((totalFaulty / totalJobs) * 100) : 0;
  }


}