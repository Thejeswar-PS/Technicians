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
  defaultBarChart: ApexChart = { type: 'bar', height: 250 };
  defaultPieChart: ApexChart = { type: 'pie', height: 250 };
  defaultLineChart: ApexChart = { type: 'line', height: 250 };

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
  }

  /**
   * Setup past due jobs summary chart
   */
  /**
   * Break long names into 2 lines for better display and clean up text
   */
  private formatLongNames(names: string[]): string[] {
    return names.map(name => {
      // Clean up the name by removing "DCG" prefix
      let cleanName = name;
      if (name && name.startsWith('DCG ')) {
        cleanName = name.substring(4); // Remove "DCG " from the beginning
      }
      
      if (cleanName && cleanName.length > 8) { // Lowered threshold from 12 to 8
        const words = cleanName.split(' ');
        if (words.length > 1) {
          const mid = Math.ceil(words.length / 2);
          const firstLine = words.slice(0, mid).join(' ');
          const secondLine = words.slice(mid).join(' ');
          return `${firstLine}\n${secondLine}`;
        } else {
          const mid = Math.ceil(cleanName.length / 2);
          return `${cleanName.substring(0, mid)}\n${cleanName.substring(mid)}`;
        }
      }
      return cleanName;
    });
  }

  private setupSummaryChart(): void {
    const originalCategories = this.summaryData.map(item => item.accMgr);
    const categories = this.formatLongNames(originalCategories);
    const pastDueData = this.summaryData.map(item => item.pastDueJobs);
    const billableData = this.summaryData.map(item => item.couldBeBilled);

    this.summaryChartOptions = {
      series: [
        { name: 'Past Due Jobs', data: pastDueData },
        { name: 'Could Be Billed', data: billableData }
      ],
      chart: {
        type: 'bar',
        height: 500,
        toolbar: { show: true },
        fontFamily: 'Inter, sans-serif',
        foreColor: '#000000',
        offsetY: 0,
        sparkline: {
          enabled: false
        }
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
          return val.toString();
        },
        style: {
          fontSize: '10px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '500',
          colors: ['#f64aa3ff', '#f97316']
        },
        background: {
          enabled: true,
          foreColor: '#ffffff',
          borderRadius: 4,
          padding: 2,
          opacity: 0.8,
          borderWidth: 1,
          borderColor: '#e5e7eb'
        },
        offsetY: -5
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: categories,
        title: { text: '' },
        labels: {
          rotate: -45,
          style: {
            fontSize: '10px',
            fontWeight: '500'
          },
          trim: false,
          maxHeight: 180,
          offsetY: 0,
          hideOverlappingLabels: false
        }
      },
      yaxis: {
        title: { text: 'Number of Jobs' }
      },
      title: {
        text: 'Past Due/ Bill After PM Unscheduled Jobs by Account Manager',
        align: 'center',
        style: {
          fontSize: '18px',
          fontWeight: '700',
          fontFamily: 'Inter, sans-serif',
          color: '#1f2937'
        }
      },
      colors: ['#f64aa3ff', '#f97316'],
      legend: {
        position: 'top'
      }
    };
  }

  /**
   * Setup scheduled percentage chart as bar chart
   */
  private setupScheduledPercentageChart(): void {
    const originalOffices = this.scheduledPercentageData.map(item => item.offId);
    const offices = this.formatLongNames(originalOffices);
    const percentages = this.scheduledPercentageData.map(item => item.scheduledPercentage);

    this.scheduledPercentageChartOptions = {
      series: [
        { name: 'Scheduled Percentage', data: percentages }
      ],
      chart: {
        type: 'bar',
        height: 400,
        toolbar: { show: true },
        fontFamily: 'Inter, sans-serif',
        foreColor: '#000000'
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '70%',
          borderRadius: 8,
          dataLabels: {
            position: 'top'
          },
          distributed: true
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: any) {
          if (val === 0) {
            return '0';
          }
          return val.toFixed(1) + '%';
        },
        style: {
          fontSize: '10px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '600',
          colors: ['#ffffff']
        },
        background: {
          enabled: true,
          foreColor: '#10b981',
          borderRadius: 8,
          padding: 6,
          opacity: 0.95,
          borderWidth: 1,
          borderColor: '#34d399',
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
        categories: offices,
        title: { text: '' },
        labels: {
          rotate: -45,
          style: {
            fontSize: '10px',
            fontWeight: '500'
          },
          trim: false,
          maxHeight: 160,
          offsetY: 0,
          hideOverlappingLabels: false
        }
      },
      yaxis: {
        title: { text: 'Scheduled Percentage (%)' },
        max: 100,
        labels: {
          formatter: function (val: number) {
            return val.toFixed(0) + '%';
          }
        }
      },
      title: {
        text: ''
      },
      colors: [
        '#f472b6', '#ec4899', '#db2777', '#be185d', '#9d174d',
        '#831843', '#701a75', '#581c87', '#4c1d95', '#3730a3'
      ],
      legend: {
        show: false
      },
      tooltip: {
        y: {
          formatter: function(value: number) {
            return value.toFixed(1) + '%';
          }
        }
      }
    };
  }

  /**
   * Setup jobs comparison chart (scheduled vs unscheduled)
   */
  private setupJobsComparisonChart(): void {
    const originalOffices = [...new Set([
      ...this.scheduledJobsData.map(item => item.offId),
      ...this.unscheduledJobsData.map(item => item.offId)
    ])];

    const offices = this.formatLongNames(originalOffices);

    const scheduledData = originalOffices.map(office => {
      const item = this.scheduledJobsData.find(x => x.offId === office);
      return item ? item.totalJobs : 0;
    });

    const unscheduledData = originalOffices.map(office => {
      const item = this.unscheduledJobsData.find(x => x.offId === office);
      return item ? item.totalJobs : 0;
    });

    this.jobsComparisonChartOptions = {
      series: [
        { name: 'Scheduled Jobs', data: scheduledData, color: '#f64aa3ff' },
        { name: 'Unscheduled Jobs', data: unscheduledData, color: '#f97316' }
      ],
      chart: {
        type: 'bar',
        height: 450,
        stacked: false,
        fontFamily: 'Inter, sans-serif',
        foreColor: '#000000',
        toolbar: { show: true }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '70%',
          borderRadius: 8,
          dataLabels: {
            position: 'top'
          },
          distributed: false
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number, opts: any) {
          return val.toString();
        },
        style: {
          fontSize: '10px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '500',
          colors: ['#f64aa3ff', '#f97316']
        },
        background: {
          enabled: true,
          foreColor: '#ffffff',
          borderRadius: 4,
          padding: 2,
          opacity: 0.8,
          borderWidth: 1,
          borderColor: '#e5e7eb'
        },
        offsetY: -5
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: offices,
        title: { 
          text: '',
          style: {
            fontSize: '14px',
            fontWeight: '600'
          }
        },
        labels: {
          style: {
            fontSize: '10px',
            fontWeight: '500'
          },
          rotate: -45,
          trim: false,
          maxHeight: 180,
          offsetY: 0,
          hideOverlappingLabels: false
        }
      },
      yaxis: {
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
          },
          formatter: function (val: number) {
            return Math.floor(val).toString();
          }
        }
      },
      title: {
        text: ''
      },
      colors: ['#f64aa3ff', '#f97316'],
      legend: {
        show: true,
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
        height: 300
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