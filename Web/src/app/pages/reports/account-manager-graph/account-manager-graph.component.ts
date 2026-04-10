import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
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
  
  // ===== API DETAIL PAGE MAPPING =====
  // Maps chart categories to NewDisplayCallsDetail API endpoint detail page names
  // These values MUST match the exact @pDetailPage parameter values in SQL stored procedure
  private readonly ACCOUNT_MGMT_API_MAPPING: { [key: number]: string } = {
    0: 'Past Due Unscheduled Jobs',
    1: 'Jobs to to Scheduled for Next 90 Days',  // Note: SQL has typo "to to" - must match exactly
    2: 'Scheduled next 60 days',  // Display shows "Customer Confirmed" but SQL uses "Scheduled"
    3: 'Scheduled next 30 days',
    4: 'Scheduled next 7 days',
    5: 'Scheduled next 72 hours',
    6: 'Scheduled Today',  // Display shows "Jobs Today" but SQL uses "Scheduled Today"
    7: 'Completed Not Returned from engineer',  // Display shows "from tech." but SQL uses "engineer"
    8: 'Returned for processing Acct. Mngr.',
    9: 'Completed and Returned with Missing Data',
    10: 'Quotes to be Completed',
    11: 'Down Sites',
    12: 'Sites with Equipment Problem'
  };
  
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

  constructor(
    private reportService: ReportService,
    private router: Router
  ) {}

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

    const labelColor = '#000000';
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
        name: 'Job Count',
        data: values,
        type: 'column'
      }],
      chart: {
        fontFamily: 'Inter, sans-serif',
        type: 'bar',
        height: 520,
        foreColor: '#000000',
        selection: {
          enabled: true,
          type: 'x',
          fill: {
            color: baseColor,
            opacity: 0.1
          }
        },
        toolbar: {
          show: true,
          offsetX: 0,
          offsetY: 0,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          },
          export: {
            csv: {
              filename: 'Account_Status_Analytics',
              columnDelimiter: ',',
              headerCategory: 'Category',
              headerValue: 'Jobs'
            },
            svg: {
              filename: 'Account_Status_Chart'
            },
            png: {
              filename: 'Account_Status_Chart'
            }
          }
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 1800,
          animateGradually: {
            enabled: true,
            delay: 200
          },
          dynamicAnimation: {
            enabled: true,
            speed: 400
          }
        },
        background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
        dropShadow: {
          enabled: true,
          color: '#1e293b',
          top: 4,
          left: 3,
          blur: 6,
          opacity: 0.12
        },
        sparkline: {
          enabled: false
        },
        zoom: {
          enabled: true,
          type: 'x',
          autoScaleYaxis: true
        },
        events: {
          dataPointSelection: (event: any, chartContext: any, config: any) => {
            this.handleChartClick('acct-status', config);
          }
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '65%',
          borderRadius: 8,
          borderRadiusApplication: 'end',
          borderRadiusWhenStacked: 'last',
          dataLabels: {
            position: 'top'
          },
          distributed: false
        }
      },
      legend: {
        show: false
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
          colors: ['#1f2937']
        },
        background: {
          enabled: true,
          foreColor: '#ffffff',
          borderRadius: 8,
          padding: 6,
          opacity: 0.95,
          borderWidth: 1,
          borderColor: '#e5e7eb',
          dropShadow: {
            enabled: true,
            top: 1,
            left: 1,
            blur: 3,
            color: '#000000',
            opacity: 0.15
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
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        },
        labels: {
          style: {
            colors: ['#000000'],
            fontSize: '16px',
            fontWeight: '900'
          },
          rotate: -65,
          rotateAlways: true,
          hideOverlappingLabels: true,
          maxHeight: 180,
          trim: false,
          offsetY: 20
        }
      },
      yaxis: {
        title: {
          text: 'Count',
          style: {
            color: '#000000',
            fontSize: '18px',
            fontWeight: 600
          }
        },
        labels: {
          style: {
            colors: '#000000',
            fontSize: '13px',
            fontWeight: '600'
          }
        }
      },
      fill: {
        type: 'solid',
        opacity: 1,
        colors: ['#3b82f6']
      },
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
      grid: {
        show: true,
        borderColor: '#e5e7eb',
        strokeDashArray: 2,
        position: 'back',
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        },
        row: {
          colors: ['transparent', 'transparent'],
          opacity: 0.05
        },
        column: {
          colors: ['transparent', 'transparent'],
          opacity: 0.05
        },
        padding: {
          top: 10,
          right: 10,
          bottom: 60,
          left: 10
        }
      },
      tooltip: {
        enabled: true,
        shared: false,
        intersect: false,
        style: {
          fontSize: '13px',
          fontFamily: 'inherit'
        },
        theme: 'light',
        marker: {
          show: true
        },
        y: {
          formatter: function (val: number) {
            return val + ' jobs';
          },
          title: {
            formatter: function (seriesName: string) {
              return seriesName + ': ';
            }
          }
        },
        x: {
          formatter: function (val: any) {
            return 'Category: ' + val;
          }
        },
        custom: function({series, seriesIndex, dataPointIndex, w}: any) {
          const value = series[seriesIndex][dataPointIndex];
          const category = w.globals.labels[dataPointIndex];
          return '<div class="custom-tooltip">' +
                 '<div class="tooltip-title">' + category + '</div>' +
                 '<div class="tooltip-value">' + value + ' jobs</div>' +
                 '</div>';
        }
      }
    };
  }

  /**
   * Initialize Account Management Chart
   */
  private initializeAccMgmtChart(): void {
    if (!this.accMgmtData) return;

    const labelColor = '#000000';
    const borderColor = getCSSVariableValue('--kt-gray-200');
    const successColor = getCSSVariableValue('--kt-success');
    const lightSuccessColor = getCSSVariableValue('--kt-success-light');

    // Prepare chart data - Labels MUST match exact UI requirements
    const chartData = [
      { label: 'Past Due Unscheduled jobs', value: this.accMgmtData.pastUnscheduled ?? 0 },
      { label: 'Jobs to be Scheduled for Next 90 Days', value: this.accMgmtData.unscheduledNext90 ?? 0 },
      { label: 'Customer Confirmed next 60 days', value: this.accMgmtData.scheduled60 ?? 0 },
      { label: 'Customer Confirmed next 30 days', value: this.accMgmtData.scheduled30 ?? 0 },
      { label: 'Customer Confirmed next 7 days', value: this.accMgmtData.scheduled7days ?? 0 },
      { label: 'Customer Confirmed next 72 hours', value: this.accMgmtData.scheduled72hours ?? 0 },
      { label: 'Jobs Today', value: this.accMgmtData.scheduledtoday ?? 0 },
      { label: 'Completed Not Returned from tech.', value: this.accMgmtData.completednotreturned ?? 0 },
      { label: 'Returned from tech. for processing by Acct. Mngr.', value: this.accMgmtData.completedreturned ?? 0 },
      { label: 'Completed and Returned with Missing Data', value: this.accMgmtData.missingData ?? 0 },
      { label: 'Quotes to be completed', value: this.accMgmtData.quotesToComplete ?? 0 },
      { label: 'Down Sites', value: this.accMgmtData.downSites ?? 0 },
      { label: 'Sites with Equipment Problem', value: this.accMgmtData.problemDownSites ?? 0 }
    ];

    const categories = chartData.map(item => item.label);
    const values = chartData.map(item => item.value);

    this.accMgmtChartOptions = {
      series: [{
        name: 'Management Pipeline',
        data: values
      }],
      chart: {
        fontFamily: 'Inter, sans-serif',
        type: 'bar',
        height: Math.max(560, categories.length * 42),
        foreColor: '#000000',
        toolbar: {
          show: true,
          offsetX: 0,
          offsetY: 0,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          },
          export: {
            csv: {
              filename: 'Management_Pipeline_Analytics'
            },
            svg: {
              filename: 'Management_Pipeline_Chart'
            },
            png: {
              filename: 'Management_Pipeline_Chart'
            }
          }
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 1600,
          animateGradually: {
            enabled: true,
            delay: 180
          },
          dynamicAnimation: {
            enabled: true,
            speed: 380
          }
        },
        background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
        dropShadow: {
          enabled: true,
          color: '#16a34a',
          top: 4,
          left: 3,
          blur: 6,
          opacity: 0.08
        },
        zoom: {
          enabled: true,
          type: 'xy',
          autoScaleYaxis: true
        },
        events: {
          dataPointSelection: (event: any, chartContext: any, config: any) => {
            this.handleChartClick('account-management', config);
          }
        }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '58%',
          borderRadius: 8,
          borderRadiusApplication: 'end',
          borderRadiusWhenStacked: 'last',
          dataLabels: {
            position: 'right'
          },
          distributed: false
        }
      },
      legend: {
        show: false
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: any, opts: any) {
          return Number(val ?? 0).toLocaleString();
        },
        style: {
          fontSize: '12px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '700',
          colors: ['#047857']
        },
        background: {
          enabled: true,
          foreColor: '#f0fdf4',
          borderRadius: 8,
          padding: 6,
          opacity: 0.95,
          borderWidth: 1,
          borderColor: '#bbf7d0',
          dropShadow: {
            enabled: true,
            top: 1,
            left: 1,
            blur: 3,
            color: '#000000',
            opacity: 0.1
          }
        },
        offsetX: 10
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
          formatter: function (val: any) {
            return Number(val || 0).toLocaleString();
          },
          style: {
            colors: ['#000000'],
            fontSize: '12px',
            fontWeight: '700'
          },
          trim: false
        }
      },
      yaxis: {
        labels: {
          maxWidth: 440,
          style: {
            colors: labelColor,
            fontSize: '14px',
            fontWeight: 700
          },
          trim: false
        }
      },
      fill: {
        type: 'solid',
        opacity: 1
      },
      colors: ['#10b981'],
      grid: {
        borderColor: borderColor,
        strokeDashArray: 4,
        yaxis: {
          lines: {
            show: true
          }
        },
        padding: {
          top: 10,
          right: 10,
          bottom: 60,
          left: 10
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

    const labelColor = '#000000';
    const borderColor = getCSSVariableValue('--kt-gray-200');
    const paperworkColor = '#5b8def';

    // Prepare chart data
    const categories = this.paperworkData.map(item => item.offid);
    const values = this.paperworkData.map(item => item.jobs);

    this.paperworkChartOptions = {
      series: [{
        name: 'Paperwork Jobs',
        data: values
      }],
      chart: {
        fontFamily: 'Inter, sans-serif',
        type: 'bar',
        height: Math.max(420, categories.length * 34),
        foreColor: '#000000',
        toolbar: {
          show: true,
          offsetX: 0,
          offsetY: 0,
          tools: {
            download: true,
            selection: false,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          },
          export: {
            csv: {
              filename: 'Paperwork_Distribution_Data'
            },
            svg: {
              filename: 'Paperwork_Distribution_Chart'
            },
            png: {
              filename: 'Paperwork_Distribution_Chart'
            }
          }
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 900,
          animateGradually: {
            enabled: true,
            delay: 60
          },
          dynamicAnimation: {
            enabled: true,
            speed: 250
          }
        },
        background: 'transparent',
        events: {
          dataPointSelection: (event: any, chartContext: any, config: any) => {
            this.handleChartClick('paperwork', config);
          }
        }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '58%',
          borderRadius: 6,
          borderRadiusApplication: 'end',
          borderRadiusWhenStacked: 'last',
          dataLabels: {
            position: 'top'
          },
          distributed: false
        }
      },
      legend: {
        show: false
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number, opts: any) {
          return val > 0 ? val.toString() : '';
        },
        style: {
          fontSize: '11px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '600',
          colors: ['#334155']
        },
        background: {
          enabled: true,
          foreColor: '#ffffff',
          borderRadius: 6,
          padding: 4,
          opacity: 0.9,
          borderWidth: 1,
          borderColor: '#dbeafe',
          dropShadow: {
            enabled: false,
            top: 0,
            left: 0,
            blur: 0,
            color: '#000000',
            opacity: 0
          }
        },
        offsetX: 8
      },
      stroke: {
        show: true,
        width: 0,
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
            colors: ['#475569'],
            fontSize: '12px',
            fontWeight: '600'
          },
          formatter: function (val: number) {
            return val?.toString?.() ?? '';
          }
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
            colors: '#1e293b',
            fontSize: '13px',
            fontWeight: 600
          },
          maxWidth: 220
        }
      },
      fill: {
        type: 'solid',
        opacity: 0.92,
        colors: [paperworkColor]
      },
      colors: [paperworkColor],
      grid: {
        borderColor: borderColor,
        strokeDashArray: 2,
        xaxis: {
          lines: {
            show: true
          }
        },
        padding: {
          top: 4,
          right: 22,
          bottom: 8,
          left: 20
        }
      },
      tooltip: {
        enabled: true,
        style: {
          fontSize: '12px'
        },
        x: {
          show: true
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

    const labelColor = '#000000';
    const borderColor = getCSSVariableValue('--kt-gray-200');
    const quotesColor = '#c6924a';

    // Prepare chart data
    const categories = this.quoteGraphData.map(item => item.offid);
    const values = this.quoteGraphData.map(item => item.jobs);

    this.quoteGraphChartOptions = {
      series: [{
        name: 'Quotes Pipeline',
        data: values
      }],
      chart: {
        fontFamily: 'Inter, sans-serif',
        type: 'bar',
        height: Math.max(420, categories.length * 34),
        foreColor: '#000000',
        toolbar: {
          show: true,
          offsetX: 0,
          offsetY: 0,
          tools: {
            download: true,
            selection: false,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          },
          export: {
            csv: {
              filename: 'Quotes_Pipeline_Analytics'
            },
            svg: {
              filename: 'Quotes_Pipeline_Chart'
            },
            png: {
              filename: 'Quotes_Pipeline_Chart'
            }
          }
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 900,
          animateGradually: {
            enabled: true,
            delay: 60
          },
          dynamicAnimation: {
            enabled: true,
            speed: 250
          }
        },
        background: 'transparent',
        events: {
          dataPointSelection: (event: any, chartContext: any, config: any) => {
            this.handleQuoteGraphClick(config);
          }
        }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '58%',
          borderRadius: 6,
          borderRadiusApplication: 'end',
          borderRadiusWhenStacked: 'last',
          dataLabels: {
            position: 'top'
          },
          distributed: false
        }
      },
      legend: {
        show: false
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number, opts: any) {
          return val > 0 ? val.toString() : '';
        },
        style: {
          fontSize: '11px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '600',
          colors: ['#334155']
        },
        background: {
          enabled: true,
          foreColor: '#ffffff',
          borderRadius: 6,
          padding: 4,
          opacity: 0.9,
          borderWidth: 1,
          borderColor: '#f5deb3',
          dropShadow: {
            enabled: false,
            top: 0,
            left: 0,
            blur: 0,
            color: '#000000',
            opacity: 0
          }
        },
        offsetX: 8
      },
      stroke: {
        show: true,
        width: 0,
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
            colors: ['#475569'],
            fontSize: '12px',
            fontWeight: '600'
          },
          formatter: function (val: number) {
            return val?.toString?.() ?? '';
          }
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
            colors: '#1e293b',
            fontSize: '13px',
            fontWeight: 600
          },
          maxWidth: 220
        }
      },
      fill: {
        type: 'solid',
        opacity: 0.92,
        colors: [quotesColor]
      },
      colors: [quotesColor],
      grid: {
        borderColor: borderColor,
        strokeDashArray: 2,
        xaxis: {
          lines: {
            show: true
          }
        },
        padding: {
          top: 4,
          right: 22,
          bottom: 8,
          left: 20
        }
      },
      tooltip: {
        enabled: true,
        style: {
          fontSize: '12px'
        },
        x: {
          show: true
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

    const labelColor = '#000000';
    const borderColor = getCSSVariableValue('--kt-gray-200');
    const unscheduledColor = '#d9776a';

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
        height: Math.max(420, categories.length * 34),
        foreColor: '#000000',
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          },
          export: {
            csv: {
              filename: 'Unscheduled_Jobs_Data'
            },
            png: {
              filename: 'Unscheduled_Jobs_Chart'
            }
          }
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 900,
          animateGradually: {
            enabled: true,
            delay: 60
          },
          dynamicAnimation: {
            enabled: true,
            speed: 250
          }
        },
        background: 'transparent',
        events: {
          dataPointSelection: (event: any, chartContext: any, config: any) => {
            this.handleUnscheduledJobsClick(config);
          }
        }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '58%',
          borderRadius: 6,
          borderRadiusApplication: 'end',
          borderRadiusWhenStacked: 'last',
          dataLabels: {
            position: 'top'
          },
          distributed: false
        }
      },
      legend: {
        show: false
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number, opts: any) {
          return val > 0 ? val.toString() : '';
        },
        style: {
          fontSize: '11px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: '600',
          colors: ['#334155']
        },
        background: {
          enabled: true,
          foreColor: '#ffffff',
          borderRadius: 6,
          padding: 4,
          opacity: 0.9,
          borderWidth: 1,
          borderColor: '#f4c7bf',
          dropShadow: {
            enabled: false,
            top: 0,
            left: 0,
            blur: 0,
            color: '#000000',
            opacity: 0
          }
        },
        offsetX: 8
      },
      stroke: {
        show: true,
        width: 0,
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
            colors: ['#475569'],
            fontSize: '12px',
            fontWeight: '600'
          },
          formatter: function (val: number) {
            return val?.toString?.() ?? '';
          }
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
            colors: '#1e293b',
            fontSize: '13px',
            fontWeight: 600
          },
          maxWidth: 220
        }
      },
      fill: {
        type: 'solid',
        opacity: 0.92,
        colors: [unscheduledColor]
      },
      colors: [unscheduledColor],
      grid: {
        borderColor: borderColor,
        strokeDashArray: 2,
        xaxis: {
          lines: {
            show: true
          }
        },
        padding: {
          top: 4,
          right: 22,
          bottom: 8,
          left: 20
        }
      },
      tooltip: {
        enabled: true,
        style: {
          fontSize: '12px'
        },
        x: {
          show: true
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

  /**
   * Get current formatted time for dashboard header
   */
  getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Handle chart click events and navigate to detailed report
   */
  handleChartClick(chartType: string, config: any): void {
    if (!config || config.dataPointIndex === undefined) return;

    const dataPointIndex = config.dataPointIndex;
    let page = '';
    let dataSetName = '';
    let officeId = '';

    // Map chart clicks to appropriate report pages
    switch (chartType) {
      case 'acct-status':
        page = this.getAcctStatusPageType(dataPointIndex);
        dataSetName = this.getAcctStatusDataSetName(dataPointIndex);
        break;
      case 'account-management':
        page = 'account-management';
        // Use API mapping directly to get correct SQL stored procedure parameter
        dataSetName = this.getAccMgmtDataSetName(dataPointIndex);
        console.log('[ACCOUNT-MANAGER-GRAPH] Chart clicked:', {
          chartType,
          dataPointIndex,
          page,
          chartLabel: config?.w?.globals?.labels?.[dataPointIndex],
          dataSetName,
          mappingConstant: this.ACCOUNT_MGMT_API_MAPPING[dataPointIndex],
          allMappings: this.ACCOUNT_MGMT_API_MAPPING
        });
        break;
      case 'paperwork':
        page = 'jobs-processed';
        dataSetName = this.getPaperworkDataSetName(dataPointIndex);
        officeId = this.getPaperworkOfficeId(dataPointIndex);
        break;
    }

    if (page) {
      this.navigateToReportDetails(page, dataSetName, officeId);
    }
  }

  /**
   * Get page type for account status chart clicks
   */
  private getAcctStatusPageType(dataPointIndex: number): string {
    const pageMapping = [
      'jobs-completed-costing',     // Completed Costing
      'invoices-yesterday',         // Invoiced Yesterday
      'jobs-completed-fs-costing',  // Completed FS Costing
      'invoices-today',             // Invoiced Today
      'invoices-month-to-date',     // Invoiced Month to Date
      'contract-invoice',           // Contract Invoice Month to Date
      'jobs-completed-parts',       // Completed Parts
      'jobs-tech-review',           // Completed Tech Review
      'jobs-manager-review',        // Completed Manager Review
      'jobs-missing-data',          // Missing Data
      'liebert-jobs',               // Liebert Jobs to Invoice
      'non-fs-jobs',                // Non-FS Jobs to Invoice
      'fs-jobs',                    // FS Jobs to Invoice
      'waiting-contract',           // Waiting for Contract
      'misc-pos',                   // MISC POS
      'pos'                         // POS
    ];

    return pageMapping[dataPointIndex] || 'jobs-to-process';
  }

  /**
   * Get data set name for account status chart clicks
   */
  private getAcctStatusDataSetName(dataPointIndex: number): string {
    const dataSetMapping = [
      'Completed Costing',
      'Invoiced Yesterday',
      'Completed FS Costing',
      'Invoiced Today',
      'Invoice Month to Date',
      'Contract Invoice Month to Date',
      'Completed Parts',
      'Completed Tech Review',
      'Completed Manager Review',
      'Missing Data',
      'Liebert Jobs to Invoice',
      'Non-FS Jobs to Invoice',
      'FS Jobs to Invoice',
      'Waiting for Contract',
      'MISC POS',
      'POS'
    ];

    return dataSetMapping[dataPointIndex] || 'Unknown';
  }

  /**
   * Get page type for account management chart clicks
   */
  private getAccMgmtPageType(dataPointIndex: number): string {
    const pageMapping = [
      'unscheduled-past',           // Past Unscheduled
      'unscheduled-90',             // Unscheduled Next 90
      'jobs-pending-30',            // Pending 30
      'jobs-scheduled-30',          // Scheduled 30
      'jobs-scheduled-60',          // Scheduled 60
      'jobs-scheduled-7',           // Scheduled 7 Days
      'jobs-scheduled-72',          // Scheduled 72 Hours
      'jobs-scheduled-today',       // Scheduled Today
      'jobs-completed-not-returned', // Completed Not Returned
      'jobs-completed-returned',    // Completed Returned
      'jobs-missing-data',          // Missing Data
      'quote',                      // Quotes to Complete
      'down-sites',                 // Down Sites
      'problem-sites'               // Problem Down Sites
    ];

    return pageMapping[dataPointIndex] || 'jobs-to-process';
  }

  /**
   * Get data set name for account management chart clicks
   * Maps to NewDisplayCallsDetail API endpoint detail page parameter names
   */
  private getAccMgmtDataSetName(dataPointIndex: number): string {
    return this.ACCOUNT_MGMT_API_MAPPING[dataPointIndex] || 'Unknown';
  }

  /**
   * Navigate to the report details page via NewDisplayCallsDetail API
   * @param page - Page type identifier (for legacy compatibility)
   * @param dataSetName - Detail page name matching API endpoint parameter
   * @param officeId - Optional office ID filter
   * 
   * API Endpoint Format:
   * GET /api/NewDisplayCallsDetail?detailPage={dataSetName}&offId={officeId}
   * 
   * Examples:
   * /api/NewDisplayCallsDetail?detailPage=Past Due Unscheduled Jobs
   * /api/NewDisplayCallsDetail?detailPage=Scheduled next 30 days
   * /api/NewDisplayCallsDetail?detailPage=Down Sites&offId=NYC
   */
  private navigateToReportDetails(page: string, dataSetName: string, officeId: string = ''): void {
    const apiUrl = this.getApiDetailsUrl(dataSetName, officeId);
    
    console.log('[ACCOUNT-MANAGER-GRAPH] Navigating to NewDisplayCallsDetail:', { 
      page,
      detailPage: dataSetName, 
      offId: officeId,
      apiEndpoint: apiUrl,
      fullUrl: `https://localhost:7217${apiUrl}`
    });
    
    this.router.navigate(['/reports/display-calls-detail'], {
      queryParams: {
        detailPage: dataSetName,
        offId: officeId || undefined
      }
    });
  }

  /**
   * Get data set name for paperwork chart clicks
   */
  private getPaperworkDataSetName(dataPointIndex: number): string {
    if (!this.paperworkData || dataPointIndex >= this.paperworkData.length) return 'Unknown';
    return this.paperworkData[dataPointIndex].offid.trim();
  }

  /**
   * Get office ID for paperwork chart clicks
   */
  private getPaperworkOfficeId(dataPointIndex: number): string {
    if (!this.paperworkData || dataPointIndex >= this.paperworkData.length) return '';
    return this.paperworkData[dataPointIndex].offid.trim();
  }

  /**
   * Handle quote graph chart clicks
   */
  handleQuoteGraphClick(config: any): void {
    console.log('Quote graph clicked:', config);
    
    if (!config || config.dataPointIndex === undefined) {
      console.log('Invalid config or dataPointIndex');
      return;
    }

    const dataPointIndex = config.dataPointIndex;
    
    if (!this.quoteGraphData || dataPointIndex >= this.quoteGraphData.length) {
      console.log('Invalid data or index out of bounds');
      return;
    }

    // Get the office ID from the clicked bar
    const officeId = this.quoteGraphData[dataPointIndex].offid;
    const dataSetName = officeId.trim();
    
    console.log('Navigating with office ID:', officeId);

    // Navigate to the display calls detail page
    this.router.navigate(['/reports/display-calls-detail'], {
      queryParams: {
        detailPage: 'Quotes to be completed',
        offId: dataSetName
      }
    });
  }

  /**
   * Handle unscheduled jobs chart clicks
   */
  handleUnscheduledJobsClick(config: any): void {
    console.log('[UNSCHEDULED CLICK] Chart clicked with config:', config);
    
    if (!config || config.dataPointIndex === undefined) {
      console.log('[UNSCHEDULED CLICK] Invalid config or dataPointIndex');
      return;
    }

    const dataPointIndex = config.dataPointIndex;
    
    if (!this.unscheduledData || dataPointIndex >= this.unscheduledData.length) {
      console.log('[UNSCHEDULED CLICK] Invalid data or index out of bounds');
      return;
    }

    // Get the office ID from the clicked bar
    const officeId = this.unscheduledData[dataPointIndex].offid;
    const dataSetName = officeId.trim();
    
    console.log('[UNSCHEDULED CLICK] Navigating with dataSetName:', dataSetName, 'Using LEGACY API');

    // Navigate to the display calls detail page using legacy API
    // Query params: dataSetName=<OFFID>&page=UnschedActMngr
    this.router.navigate(['/reports/display-calls-detail'], {
      queryParams: {
        dataSetName: dataSetName,
        page: 'UnschedActMngr'
      }
    }).then(success => {
      console.log('[UNSCHEDULED CLICK] Navigation success:', success);
    });
  }

  /**
   * ===== NewDisplayCallsDetail API MAPPING DOCUMENTATION =====
   * 
   * Available Detail Page Names for /api/NewDisplayCallsDetail endpoint:
   * 
   * ACCOUNT MANAGEMENT PIPELINE:
   * 0. "Past Due Unscheduled Jobs" - Jobs not yet scheduled that are overdue
   * 1. "Jobs to be Scheduled for Next 90 Days" - Upcoming jobs within 90 days
   * 2. "Customer Confirmed next 60 days" - Customer-confirmed jobs in next 60 days
   * 3. "Customer Confirmed next 30 days" - Customer-confirmed jobs in next 30 days
   * 4. "Customer Confirmed next 7 days" - Customer-confirmed jobs in next 7 days
   * 5. "Customer Confirmed next 72 hours" - Customer-confirmed jobs in next 72 hours
   * 6. "Jobs Today" - Jobs scheduled for today
   * 7. "Completed Not Returned from tech" - Completed jobs awaiting tech return
   * 8. "Acct. Mgmt" - Account management status jobs
   * 9. "Returned from Missing Data" - Jobs returned with missing data
   * 10. "Completed and Returned with Equipment Problem" - Jobs with equipment issues
   * 11. "Down Sites" - Currently down job sites
   * 12. "Sites with Equipment Problem" - Sites with equipment problems
   * 13. "Problem" - Various problem categorization
   * 
   * USAGE EXAMPLES:
   * GET /api/NewDisplayCallsDetail?detailPage=Past Due Unscheduled Jobs
   * GET /api/NewDisplayCallsDetail?detailPage=Scheduled next 30 days
   * GET /api/NewDisplayCallsDetail?detailPage=Down Sites&offId=NYC
   * 
   * PARAMETERS:
   * - detailPage (required): Name of the detail page from the mapping above
   * - offId (optional): Office/Location ID filter for results
   */

  /**
   * Generate API endpoint URL for a given detail page
   * @param detailPage - Detail page name from ACCOUNT_MGMT_API_MAPPING
   * @param officeId - Optional office ID filter
   * @returns Full API endpoint URL
   * 
   * Examples:
   * getApiDetailsUrl('Past Due Unscheduled Jobs')
   * → /api/NewDisplayCallsDetail?detailPage=Past Due Unscheduled Jobs
   * 
   * getApiDetailsUrl('Down Sites', 'NYC')
   * → /api/NewDisplayCallsDetail?detailPage=Down Sites&offId=NYC
   */
  private getApiDetailsUrl(detailPage: string, officeId: string = ''): string {
    const baseUrl = '/api/NewDisplayCallsDetail';
    const params = new URLSearchParams();
    params.set('detailPage', detailPage);
    if (officeId) {
      params.set('offId', officeId);
    }
    return `${baseUrl}?${params.toString()}`;
  }

  /**
   * Get all available detail pages for the API
   * @returns Array of detail page names that can be used in API calls
   */
  getAvailableDetailPages(): string[] {
    return Object.values(this.ACCOUNT_MGMT_API_MAPPING);
  }

  /**
   * Get detail page name by chart index
   * @param chartIndex - Index of the chart category
   * @returns Detail page name for API endpoint
   */
  getDetailPageByIndex(chartIndex: number): string {
    return this.ACCOUNT_MGMT_API_MAPPING[chartIndex] || 'Unknown';
  }
}