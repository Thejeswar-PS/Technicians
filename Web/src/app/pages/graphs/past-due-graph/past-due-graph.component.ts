import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { 
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexYAxis,
  ApexTitleSubtitle,
  ApexLegend,
  ApexResponsive,
  ApexPlotOptions,
  ApexNonAxisChartSeries,
  ApexTooltip,
  ApexFill
} from 'ng-apexcharts';
import { PastDueGraphService } from 'src/app/core/services/past-due-graph.service';
import { 
  PastDueGraphResponseDto, 
  PastDueCallStatusDto, 
  PastDueJobsSummaryDto, 
  ScheduledPercentageDto, 
  TotalJobsDto 
} from 'src/app/core/model/past-due-graph.model';
import { getCSSVariableValue } from 'src/app/_metronic/kt/_utils';

export type ChartOptions = {
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  title: ApexTitleSubtitle;
  legend: ApexLegend;
  responsive: ApexResponsive[];
  plotOptions: ApexPlotOptions;
  tooltip: ApexTooltip;
  fill: ApexFill;
  colors: string[];
  labels: string[];
};

@Component({
  selector: 'app-past-due-graph',
  templateUrl: './past-due-graph.component.html',
  styleUrls: ['./past-due-graph.component.scss']
})
export class PastDueGraphComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Data properties
  pastDueData: PastDueGraphResponseDto | null = null;
  callStatusData: PastDueCallStatusDto[] = [];
  summaryData: PastDueJobsSummaryDto[] = [];
  scheduledPercentageData: ScheduledPercentageDto[] = [];
  unscheduledJobsData: TotalJobsDto[] = [];
  scheduledJobsData: TotalJobsDto[] = [];
  
  // Loading and error states
  isLoading = false;
  error: string | null = null;
  
  // Chart configurations
  summaryChartOptions: Partial<ChartOptions> = {};
  scheduledPercentageChartOptions: Partial<ChartOptions> = {};
  jobsComparisonChartOptions: Partial<ChartOptions> = {};
  callStatusByAgeChartOptions: Partial<ChartOptions> = {};

  // Default chart configurations for fallbacks
  defaultBarChart: ApexChart = { type: 'bar', height: 350 };
  defaultPieChart: ApexChart = { type: 'pie', height: 350 };
  defaultLineChart: ApexChart = { type: 'line', height: 350 };

  // Table pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 0;

  // Expose Math to template
  Math = Math;

  constructor(private pastDueGraphService: PastDueGraphService) {}

  ngOnInit(): void {
    this.loadPastDueData();
    this.initializeChartDefaults();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all past due jobs data
   */
  loadPastDueData(): void {
    this.isLoading = true;
    this.error = null;

    this.pastDueGraphService.getPastDueJobsInfo()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.pastDueData = data;
          this.processData(data);
          this.setupCharts();
          this.isLoading = false;
        },
        error: (error) => {
          this.error = `Failed to load past due data: ${error.message}`;
          this.isLoading = false;
          console.error('Error loading past due data:', error);
        }
      });
  }

  /**
   * Process and organize the received data
   */
  private processData(data: PastDueGraphResponseDto): void {
    this.callStatusData = data.callStatus || [];
    this.summaryData = data.pastDueJobsSummary || [];
    this.scheduledPercentageData = data.scheduledPercentages || [];
    this.unscheduledJobsData = data.totalUnscheduledJobs || [];
    this.scheduledJobsData = data.totalScheduledJobs || [];
    
    // Update pagination
    this.totalPages = Math.ceil(this.callStatusData.length / this.itemsPerPage);
  }

  /**
   * Initialize chart default settings
   */
  private initializeChartDefaults(): void {
    const defaultColors = [
      getCSSVariableValue('--bs-primary'),
      getCSSVariableValue('--bs-success'),
      getCSSVariableValue('--bs-warning'),
      getCSSVariableValue('--bs-danger'),
      getCSSVariableValue('--bs-info')
    ];
  }

  /**
   * Setup all charts with data
   */
  private setupCharts(): void {
    this.setupSummaryChart();
    this.setupScheduledPercentageChart();
    this.setupJobsComparisonChart();
    this.setupCallStatusByAgeChart();
  }

  /**
   * Setup past due jobs summary chart
   */
  private setupSummaryChart(): void {
    const categories = this.summaryData.map(item => item.accMgr);
    const pastDueData = this.summaryData.map(item => item.pastDueJobs);
    const billableData = this.summaryData.map(item => item.couldBeBilled);

    this.summaryChartOptions = {
      series: [
        { name: 'Past Due Jobs', data: pastDueData },
        { name: 'Could Be Billed', data: billableData }
      ],
      chart: {
        type: 'bar',
        height: 600,
        toolbar: { show: true },
        fontFamily: 'Inter, sans-serif',
        foreColor: '#000000'
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '85%',
          borderRadius: 8,
          dataLabels: {
            position: 'top'
          },
          distributed: false
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: any, opts: any) {
          return val > 0 ? val : '';
        },
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '700',
          colors: ['#ffffff']
        },
        background: {
          enabled: true,
          foreColor: '#ec4899',
          borderRadius: 8,
          padding: 6,
          opacity: 0.95,
          borderWidth: 1,
          borderColor: '#f472b6',
          dropShadow: {
            enabled: true,
            top: 1,
            left: 1,
            blur: 3,
            color: '#000000',
            opacity: 0.1
          }
        },
        offsetY: -8
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: categories,
        title: { text: 'Account Managers' }
      },
      yaxis: {
        title: { text: 'Number of Jobs' }
      },
      title: {
        text: 'Past Due Jobs Summary by Account Manager'
      },
      colors: ['#f64aa3ff', '#ec4899'],
      legend: {
        position: 'top'
      }
    };
  }

  /**
   * Setup scheduled percentage chart
   */
  private setupScheduledPercentageChart(): void {
    const offices = this.scheduledPercentageData.map(item => item.offId);
    const percentages = this.scheduledPercentageData.map(item => item.scheduledPercentage);

    this.scheduledPercentageChartOptions = {
      series: percentages,
      chart: {
        type: 'pie',
        height: 450
      },
      labels: offices,
      title: {
        text: 'Scheduled Percentage by Office'
      },
      colors: [
        getCSSVariableValue('--bs-primary'),
        getCSSVariableValue('--bs-success'),
        getCSSVariableValue('--bs-warning'),
        getCSSVariableValue('--bs-info'),
        getCSSVariableValue('--bs-secondary')
      ],
      legend: {
        position: 'bottom'
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '14px',
          fontWeight: 'bold'
        },
        formatter: function (val: any, opts: any) {
          const percentage = val.toFixed(1);
          const value = opts.w.config.series[opts.seriesIndex];
          return percentage + '%\n(' + value.toFixed(1) + ')';
        }
      }
    };
  }

  /**
   * Setup jobs comparison chart (scheduled vs unscheduled)
   */
  private setupJobsComparisonChart(): void {
    const offices = [...new Set([
      ...this.scheduledJobsData.map(item => item.offId),
      ...this.unscheduledJobsData.map(item => item.offId)
    ])];

    const scheduledData = offices.map(office => {
      const item = this.scheduledJobsData.find(x => x.offId === office);
      return item ? item.totalJobs : 0;
    });

    const unscheduledData = offices.map(office => {
      const item = this.unscheduledJobsData.find(x => x.offId === office);
      return item ? item.totalJobs : 0;
    });

    this.jobsComparisonChartOptions = {
      series: [
        { name: 'Scheduled Jobs', data: scheduledData },
        { name: 'Unscheduled Jobs', data: unscheduledData }
      ],
      chart: {
        type: 'bar',
        height: 800,
        stacked: true,
        fontFamily: 'Inter, sans-serif',
        foreColor: '#000000'
      },
      plotOptions: {
        bar: {
          horizontal: true,
          columnWidth: '90%',
          borderRadius: 8,
          dataLabels: {
            position: 'center'
          },
          distributed: false
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number, opts: any) {
          return val > 0 ? val.toString() : '';
        },
        style: {
          fontSize: '10px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '600',
          colors: ['#ffffff']
        },
        background: {
          enabled: false
        },
        offsetX: 0
      },
      xaxis: {
        categories: offices,
        title: { 
          text: 'Number of Jobs',
          style: {
            fontSize: '14px',
            fontWeight: '600'
          }
        },
        labels: {
          style: {
            fontSize: '12px',
            fontWeight: '500'
          }
        }
      },
      yaxis: {
        title: { 
          text: 'Offices',
          style: {
            fontSize: '14px',
            fontWeight: '600'
          }
        },
        labels: {
          style: {
            fontSize: '11px',
            fontWeight: '500'
          },
          maxWidth: 120
        }
      },
      title: {
        text: 'Scheduled vs Unscheduled Jobs by Office'
      },
      colors: ['#f472b6', '#fbbf24'],
      legend: {
        position: 'top'
      }
    };
  }

  /**
   * Setup call status by age chart
   */
  private setupCallStatusByAgeChart(): void {
    // Group calls by age ranges
    const ageRanges = ['0-30 days', '31-60 days', '61-90 days', '90+ days'];
    const ageCounts = [0, 0, 0, 0];

    this.callStatusData.forEach(call => {
      if (call.changeAge <= 30) ageCounts[0]++;
      else if (call.changeAge <= 60) ageCounts[1]++;
      else if (call.changeAge <= 90) ageCounts[2]++;
      else ageCounts[3]++;
    });

    this.callStatusByAgeChartOptions = {
      series: [
        { name: 'Number of Calls', data: ageCounts }
      ],
      chart: {
        type: 'line',
        height: 350
      },
      xaxis: {
        categories: ageRanges,
        title: { text: 'Age Range' }
      },
      yaxis: {
        title: { text: 'Number of Calls' }
      },
      title: {
        text: 'Call Distribution by Age'
      },
      colors: [getCSSVariableValue('--bs-primary')],
      stroke: {
        width: 3,
        curve: 'smooth'
      }
    };
  }

  /**
   * Get paginated call status data
   */
  getPaginatedCallStatus(): PastDueCallStatusDto[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.callStatusData.slice(startIndex, endIndex);
  }

  /**
   * Get page numbers for pagination
   */
  getPageNumbers(): number[] {
    const maxPages = Math.min(5, this.totalPages);
    const pages: number[] = [];
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);
    
    // Adjust startPage if we're near the end
    if (endPage - startPage + 1 < maxPages) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  /**
   * Navigate to next page
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  /**
   * Navigate to previous page
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  /**
   * Go to specific page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  /**
   * Refresh data
   */
  refreshData(): void {
    this.loadPastDueData();
  }

  /**
   * Export data (placeholder for future implementation)
   */
  exportData(): void {
    // TODO: Implement data export functionality
    console.log('Export functionality to be implemented');
  }

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  /**
   * Format date and time for display
   */
  formatDateTime(date: Date): string {
    return new Date(date).toLocaleString();
  }
}