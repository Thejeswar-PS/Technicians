import { Component, OnInit, OnDestroy } from '@angular/core';
import { ReportService } from 'src/app/core/services/report.service';
import { AcctStatusGraphDto, AccMgmtGraphDto, AccountManagerPaperworkDto } from 'src/app/core/model/account-manager-graph.model';
import { getCSSVariableValue } from 'src/app/_metronic/kt/_utils';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-account-manager-graph',
  templateUrl: './account-manager-graph.component.html',
  styleUrls: ['./account-manager-graph.component.scss']
})
export class AccountManagerGraphComponent implements OnInit, OnDestroy {
  
  // Data properties
  acctStatusData: AcctStatusGraphDto | null = null;
  accMgmtData: AccMgmtGraphDto | null = null;
  paperworkData: AccountManagerPaperworkDto[] | null = null;
  quoteGraphData: AccountManagerPaperworkDto[] | null = null;
  unscheduledData: AccountManagerPaperworkDto[] | null = null;
  
  // Chart options
  acctStatusChartOptions: any = {};
  accMgmtChartOptions: any = {};
  paperworkChartOptions: any = {};
  quoteGraphChartOptions: any = {};
  unscheduledChartOptions: any = {};
  
  // Loading states
  isLoadingAcctStatus = false;
  isLoadingAccMgmt = false;
  isLoadingPaperwork = false;
  isLoadingQuoteGraph = false;
  isLoadingUnscheduled = false;
  
  // Error states
  acctStatusError: string | null = null;
  accMgmtError: string | null = null;
  paperworkError: string | null = null;
  quoteGraphError: string | null = null;
  unscheduledError: string | null = null;
  
  // Subscriptions
  private subscriptions: Subscription[] = [];

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.loadAccountStatusData();
    this.loadAccountManagementData();
    this.loadAccountManagerPaperwork();
    this.loadAccountManagerQuoteGraph();
    this.loadAccountManagerUnscheduled();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Load Account Status Graph Data
   */
  loadAccountStatusData(): void {
    this.isLoadingAcctStatus = true;
    this.acctStatusError = null;
    
    const sub = this.reportService.getAcctStatusGraph().subscribe({
      next: (data) => {
        this.acctStatusData = data;
        this.initializeAcctStatusChart();
        this.isLoadingAcctStatus = false;
      },
      error: (error) => {
        console.error('Error loading account status data:', error);
        this.acctStatusError = 'Failed to load account status data';
        this.isLoadingAcctStatus = false;
      }
    });
    
    this.subscriptions.push(sub);
  }

  /**
   * Load Account Management Graph Data
   */
  loadAccountManagementData(): void {
    this.isLoadingAccMgmt = true;
    this.accMgmtError = null;
    
    const sub = this.reportService.getAccMgmtGraph().subscribe({
      next: (data) => {
        this.accMgmtData = data;
        this.initializeAccMgmtChart();
        this.isLoadingAccMgmt = false;
      },
      error: (error) => {
        console.error('Error loading account management data:', error);
        this.accMgmtError = 'Failed to load account management data';
        this.isLoadingAccMgmt = false;
      }
    });
    
    this.subscriptions.push(sub);
  }

  /**
   * Load Account Manager Paperwork Data
   */
  loadAccountManagerPaperwork(): void {
    this.isLoadingPaperwork = true;
    this.paperworkError = null;
    
    const sub = this.reportService.getAccountManagerPaperwork().subscribe({
      next: (data) => {
        this.paperworkData = data;
        this.initializePaperworkChart();
        this.isLoadingPaperwork = false;
      },
      error: (error) => {
        console.error('Error loading account manager paperwork data:', error);
        this.paperworkError = 'Failed to load account manager paperwork data';
        this.isLoadingPaperwork = false;
      }
    });
    
    this.subscriptions.push(sub);
  }

  /**
   * Load Account Manager Quote Graph Data
   */
  loadAccountManagerQuoteGraph(): void {
    this.isLoadingQuoteGraph = true;
    this.quoteGraphError = null;
    
    const sub = this.reportService.getAccountManagerQuoteGraph().subscribe({
      next: (data) => {
        this.quoteGraphData = data;
        this.initializeQuoteGraphChart();
        this.isLoadingQuoteGraph = false;
      },
      error: (error) => {
        console.error('Error loading account manager quote graph data:', error);
        this.quoteGraphError = 'Failed to load account manager quote graph data';
        this.isLoadingQuoteGraph = false;
      }
    });
    
    this.subscriptions.push(sub);
  }

  /**
   * Load Account Manager Unscheduled Data
   */
  loadAccountManagerUnscheduled(): void {
    this.isLoadingUnscheduled = true;
    this.unscheduledError = null;
    
    const sub = this.reportService.getAccountManagerUnscheduled().subscribe({
      next: (data) => {
        this.unscheduledData = data;
        this.initializeUnscheduledChart();
        this.isLoadingUnscheduled = false;
      },
      error: (error) => {
        console.error('Error loading account manager unscheduled data:', error);
        this.unscheduledError = 'Failed to load account manager unscheduled data';
        this.isLoadingUnscheduled = false;
      }
    });
    
    this.subscriptions.push(sub);
  }

  /**
   * Initialize Account Status Chart
   */
  private initializeAcctStatusChart(): void {
    if (!this.acctStatusData) return;

    const labelColor = getCSSVariableValue('--kt-gray-500');
    const borderColor = getCSSVariableValue('--kt-gray-200');
    const baseColor = getCSSVariableValue('--kt-primary');
    const lightColor = getCSSVariableValue('--kt-primary-light');

    // Prepare chart data
    const categories = [
      'Completed Costing',
      'Invoiced Yesterday',
      'Completed FS Costing', 
      'Invoiced Today',
      'Invoice Month to Date',
      'Contract Invoice MTD',
      'Completed Parts',
      'Tech Review',
      'Manager Review',
      'Missing Data',
      'Liebert Jobs',
      'Non-FS Jobs',
      'FS Jobs',
      'Waiting Contract',
      'MISC POS',
      'POS'
    ];

    const values = [
      this.acctStatusData.completedcosting,
      this.acctStatusData.invoicedyesterdate,
      this.acctStatusData.completedFScosting,
      this.acctStatusData.invoicedtoday,
      this.acctStatusData.invoicemonthtodate,
      this.acctStatusData.contractInvoicemonthtodate,
      this.acctStatusData.completedparts,
      this.acctStatusData.completedTechReview,
      this.acctStatusData.completedMngrReview,
      this.acctStatusData.missingData,
      this.acctStatusData.liebertJobsToInvoice,
      this.acctStatusData.nonFSJobstoInvoice,
      this.acctStatusData.fsJobstoInvoice,
      this.acctStatusData.waitingForContract,
      this.acctStatusData.miscpos,
      this.acctStatusData.pos
    ];

    this.acctStatusChartOptions = {
      series: [{
        name: 'Count',
        data: values
      }],
      chart: {
        fontFamily: 'inherit',
        type: 'bar',
        height: 500,
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '50%',
          borderRadius: 5
        }
      },
      legend: {
        show: false
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '12px',
          fontWeight: 'bold'
        }
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: categories,
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        labels: {
          style: {
            colors: labelColor,
            fontSize: '12px'
          },
          rotate: -45
        }
      },
      yaxis: {
        title: {
          text: 'Count',
          style: {
            color: labelColor,
            fontSize: '13px',
            fontWeight: 500
          }
        },
        labels: {
          style: {
            colors: labelColor,
            fontSize: '12px'
          }
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.3,
          gradientToColors: [lightColor],
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 0.8,
          stops: [0, 100]
        }
      },
      colors: [baseColor],
      grid: {
        borderColor: borderColor,
        strokeDashArray: 4,
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      tooltip: {
        enabled: true,
        style: {
          fontSize: '12px'
        },
        y: {
          formatter: function (val: number) {
            return val.toString();
          }
        }
      }
    };
  }

  /**
   * Initialize Account Management Chart
   */
  private initializeAccMgmtChart(): void {
    if (!this.accMgmtData) return;

    const labelColor = getCSSVariableValue('--kt-gray-500');
    const borderColor = getCSSVariableValue('--kt-gray-200');
    const successColor = getCSSVariableValue('--kt-success');
    const lightSuccessColor = getCSSVariableValue('--kt-success-light');

    // Prepare chart data
    const categories = [
      'Past Unscheduled',
      'Unscheduled Next 90',
      'Pending 30',
      'Scheduled 30',
      'Scheduled 60',
      'Scheduled 7 Days',
      'Scheduled 72 Hours',
      'Scheduled Today',
      'Completed Not Returned',
      'Completed Returned',
      'Missing Data',
      'Quotes to Complete',
      'Down Sites',
      'Problem Down Sites'
    ];

    const values = [
      this.accMgmtData.pastUnscheduled,
      this.accMgmtData.unscheduledNext90,
      this.accMgmtData.pending30,
      this.accMgmtData.scheduled30,
      this.accMgmtData.scheduled60,
      this.accMgmtData.scheduled7days,
      this.accMgmtData.scheduled72hours,
      this.accMgmtData.scheduledtoday,
      this.accMgmtData.completednotreturned,
      this.accMgmtData.completedreturned,
      this.accMgmtData.missingData,
      this.accMgmtData.quotesToComplete,
      this.accMgmtData.downSites,
      this.accMgmtData.problemDownSites
    ];

    this.accMgmtChartOptions = {
      series: [{
        name: 'Count',
        data: values
      }],
      chart: {
        fontFamily: 'inherit',
        type: 'bar',
        height: 500,
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '50%',
          borderRadius: 5
        }
      },
      legend: {
        show: false
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '12px',
          fontWeight: 'bold'
        }
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: categories,
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        labels: {
          style: {
            colors: labelColor,
            fontSize: '12px'
          },
          rotate: -45
        }
      },
      yaxis: {
        title: {
          text: 'Count',
          style: {
            color: labelColor,
            fontSize: '13px',
            fontWeight: 500
          }
        },
        labels: {
          style: {
            colors: labelColor,
            fontSize: '12px'
          }
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.3,
          gradientToColors: [lightSuccessColor],
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 0.8,
          stops: [0, 100]
        }
      },
      colors: [successColor],
      grid: {
        borderColor: borderColor,
        strokeDashArray: 4,
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      tooltip: {
        enabled: true,
        style: {
          fontSize: '12px'
        },
        y: {
          formatter: function (val: number) {
            return val.toString();
          }
        }
      }
    };
  }

  /**
   * Initialize Account Manager Paperwork Chart
   */
  private initializePaperworkChart(): void {
    if (!this.paperworkData || this.paperworkData.length === 0) return;

    const labelColor = getCSSVariableValue('--kt-gray-500');
    const borderColor = getCSSVariableValue('--kt-gray-200');
    const infoColor = getCSSVariableValue('--kt-info');
    const lightInfoColor = getCSSVariableValue('--kt-info-light');

    // Prepare chart data
    const categories = this.paperworkData.map(item => item.offid);
    const values = this.paperworkData.map(item => item.jobs);

    this.paperworkChartOptions = {
      series: [{
        name: 'Jobs Count',
        data: values
      }],
      chart: {
        fontFamily: 'inherit',
        type: 'bar',
        height: 400,
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '60%',
          borderRadius: 5
        }
      },
      legend: {
        show: false
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '12px',
          fontWeight: 'bold'
        }
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: categories,
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        labels: {
          style: {
            colors: labelColor,
            fontSize: '12px'
          },
          rotate: -45
        }
      },
      yaxis: {
        title: {
          text: 'Jobs Count',
          style: {
            color: labelColor,
            fontSize: '13px',
            fontWeight: 500
          }
        },
        labels: {
          style: {
            colors: labelColor,
            fontSize: '12px'
          }
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.3,
          gradientToColors: [lightInfoColor],
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 0.8,
          stops: [0, 100]
        }
      },
      colors: [infoColor],
      grid: {
        borderColor: borderColor,
        strokeDashArray: 4,
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      tooltip: {
        enabled: true,
        style: {
          fontSize: '12px'
        },
        y: {
          formatter: function (val: number) {
            return val + ' jobs';
          }
        }
      }
    };
  }

  /**
   * Initialize Account Manager Quote Graph Chart
   */
  private initializeQuoteGraphChart(): void {
    if (!this.quoteGraphData || this.quoteGraphData.length === 0) return;

    const labelColor = getCSSVariableValue('--kt-gray-500');
    const borderColor = getCSSVariableValue('--kt-gray-200');
    const warningColor = getCSSVariableValue('--kt-warning');
    const lightWarningColor = getCSSVariableValue('--kt-warning-light');

    // Prepare chart data
    const categories = this.quoteGraphData.map(item => item.offid);
    const values = this.quoteGraphData.map(item => item.jobs);

    this.quoteGraphChartOptions = {
      series: [{
        name: 'Quotes Count',
        data: values
      }],
      chart: {
        fontFamily: 'inherit',
        type: 'bar',
        height: 400,
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '60%',
          borderRadius: 5
        }
      },
      legend: {
        show: false
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '12px',
          fontWeight: 'bold'
        }
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: categories,
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        labels: {
          style: {
            colors: labelColor,
            fontSize: '12px'
          },
          rotate: -45
        }
      },
      yaxis: {
        title: {
          text: 'Quotes Count',
          style: {
            color: labelColor,
            fontSize: '13px',
            fontWeight: 500
          }
        },
        labels: {
          style: {
            colors: labelColor,
            fontSize: '12px'
          }
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.3,
          gradientToColors: [lightWarningColor],
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 0.8,
          stops: [0, 100]
        }
      },
      colors: [warningColor],
      grid: {
        borderColor: borderColor,
        strokeDashArray: 4,
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      tooltip: {
        enabled: true,
        style: {
          fontSize: '12px'
        },
        y: {
          formatter: function (val: number) {
            return val + ' quotes';
          }
        }
      }
    };
  }

  /**
   * Initialize Account Manager Unscheduled Chart
   */
  private initializeUnscheduledChart(): void {
    if (!this.unscheduledData || this.unscheduledData.length === 0) return;

    const labelColor = getCSSVariableValue('--kt-gray-500');
    const borderColor = getCSSVariableValue('--kt-gray-200');
    const dangerColor = getCSSVariableValue('--kt-danger');
    const lightDangerColor = getCSSVariableValue('--kt-danger-light');

    // Prepare chart data
    const categories = this.unscheduledData.map(item => item.offid);
    const values = this.unscheduledData.map(item => item.jobs);

    this.unscheduledChartOptions = {
      series: [{
        name: 'Unscheduled Jobs',
        data: values
      }],
      chart: {
        fontFamily: 'inherit',
        type: 'bar',
        height: 400,
        toolbar: {
          show: false
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '60%',
          borderRadius: 5
        }
      },
      legend: {
        show: false
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '12px',
          fontWeight: 'bold'
        }
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: categories,
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        labels: {
          style: {
            colors: labelColor,
            fontSize: '12px'
          },
          rotate: -45
        }
      },
      yaxis: {
        title: {
          text: 'Unscheduled Jobs Count',
          style: {
            color: labelColor,
            fontSize: '13px',
            fontWeight: 500
          }
        },
        labels: {
          style: {
            colors: labelColor,
            fontSize: '12px'
          }
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.3,
          gradientToColors: [lightDangerColor],
          inverseColors: false,
          opacityFrom: 1,
          opacityTo: 0.8,
          stops: [0, 100]
        }
      },
      colors: [dangerColor],
      grid: {
        borderColor: borderColor,
        strokeDashArray: 4,
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      tooltip: {
        enabled: true,
        style: {
          fontSize: '12px'
        },
        y: {
          formatter: function (val: number) {
            return val + ' unscheduled jobs';
          }
        }
      }
    };
  }

  /**
   * Refresh all data
   */
  refreshData(): void {
    this.loadAccountStatusData();
    this.loadAccountManagementData();
    this.loadAccountManagerPaperwork();
    this.loadAccountManagerQuoteGraph();
    this.loadAccountManagerUnscheduled();
  }

  /**
   * Helper methods for paperwork statistics
   */
  getTotalJobs(): number {
    if (!this.paperworkData) return 0;
    return this.paperworkData.reduce((sum, item) => sum + item.jobs, 0);
  }

  getAverageJobs(): string {
    if (!this.paperworkData || this.paperworkData.length === 0) return '0';
    const total = this.getTotalJobs();
    const average = total / this.paperworkData.length;
    return average.toFixed(1);
  }

  getTopOffice(): string {
    if (!this.paperworkData || this.paperworkData.length === 0) return 'N/A';
    const topOffice = this.paperworkData.reduce((prev, current) => 
      (prev.jobs > current.jobs) ? prev : current
    );
    return `${topOffice.offid} (${topOffice.jobs})`;
  }

  /**
   * Helper methods for quote graph statistics
   */
  getTotalQuotes(): number {
    if (!this.quoteGraphData) return 0;
    return this.quoteGraphData.reduce((sum, item) => sum + item.jobs, 0);
  }

  getAverageQuotes(): string {
    if (!this.quoteGraphData || this.quoteGraphData.length === 0) return '0';
    const total = this.getTotalQuotes();
    const average = total / this.quoteGraphData.length;
    return average.toFixed(1);
  }

  getTopQuoteOffice(): string {
    if (!this.quoteGraphData || this.quoteGraphData.length === 0) return 'N/A';
    const topOffice = this.quoteGraphData.reduce((prev, current) => 
      (prev.jobs > current.jobs) ? prev : current
    );
    return `${topOffice.offid} (${topOffice.jobs})`;
  }

  /**
   * Helper methods for unscheduled statistics
   */
  getTotalUnscheduled(): number {
    if (!this.unscheduledData) return 0;
    return this.unscheduledData.reduce((sum, item) => sum + item.jobs, 0);
  }

  getAverageUnscheduled(): string {
    if (!this.unscheduledData || this.unscheduledData.length === 0) return '0';
    const total = this.getTotalUnscheduled();
    const average = total / this.unscheduledData.length;
    return average.toFixed(1);
  }

  getTopUnscheduledOffice(): string {
    if (!this.unscheduledData || this.unscheduledData.length === 0) return 'N/A';
    const topOffice = this.unscheduledData.reduce((prev, current) => 
      (prev.jobs > current.jobs) ? prev : current
    );
    return `${topOffice.offid} (${topOffice.jobs})`;
  }
}