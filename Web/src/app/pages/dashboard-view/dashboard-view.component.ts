import { Component, OnInit, ChangeDetectorRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';
import * as _ from 'lodash';
import { TechDashboardService, TechDashboardKPIs, AccountManager, Technician } from 'src/app/core/services/tech-dashboard.service';

declare var Chart: any;

@Component({
  selector: 'app-dashboard-view',
  templateUrl: './dashboard-view.component.html',
  styleUrls: ['./dashboard-view.component.scss']
})
export class DashboardViewComponent implements OnInit, AfterViewInit, OnDestroy {
  
  subscriptionDashboardFilter$: Subscription;
  filters: any = {
    department: 'ALL',
    accountManager: 'ALL'
  };

  // Tech Dashboard Data
  kpis: TechDashboardKPIs = {
    jobsScheduled: 0,
    jobsToBeUploaded: 0,
    emergencyJobs: 0,
    missingJobs: 0,
    jobsWithParts: 0,
    jobsThisWeek: 0
  };

  // Filters
  accountManagers: AccountManager[] = [];
  technicians: Technician[] = [];
  selectedAccMgr: string = 'ALL';
  selectedTech: string = 'ALL';
  selectedDateRange: string = 'CY';
  showFilterPanel: boolean = false;
  dateRangeOptions = [
    { text: 'Current Year', value: 'CY' },
    { text: 'Last 30 Days', value: '30' },
    { text: 'Last 90 Days', value: '90' }
  ];

  // Charts
  monthlyChart: any;
  jobChart: any;

  dashboardData: any = {
    sales: {},
    recentActivityLog: [],
    todaysJobList: [],
    weeklyTopPerformers: [],
    jobScheduleTrend: [],
    monthlyUnscheduledJob: [],
    customerFeedback: {}
  };

  loading: boolean = false;

  constructor(
    private filterSharedService: DashboardFilterSharedService,
    private techDashboardService: TechDashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.subscribeSharedServiceData();
    this.loadFilters();
    this.loadTechDashboardData();
    this.filterSharedService.setHomePage(true);
  }

  ngAfterViewInit(): void {
    // Initialize charts after view is rendered
    setTimeout(() => {
      this.initCharts();
    }, 100);
  }

  toggleFilterPanel(): void {
    this.showFilterPanel = !this.showFilterPanel;
  }

  applyFilters(): void {
    this.showFilterPanel = false;
    // Destroy existing charts before loading new data
    if (this.monthlyChart) {
      this.monthlyChart.destroy();
      this.monthlyChart = null;
    }
    if (this.jobChart) {
      this.jobChart.destroy();
      this.jobChart = null;
    }
    this.loadTechDashboardData();
  }

  loadFilters(): void {
    this.techDashboardService.getAccountManagers().subscribe({
      next: (managers) => {
        this.accountManagers = managers;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading account managers:', err)
    });

    this.techDashboardService.getTechnicians().subscribe({
      next: (techs) => {
        this.technicians = techs;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading technicians:', err)
    });
  }

  subscribeSharedServiceData() {
    this.subscriptionDashboardFilter$ = this.filterSharedService.selectedDashboardFilter$.subscribe((filters: any) => {
      if (!_.isEmpty(filters)) {
        this.filters = filters;
        this.loadTechDashboardData();
        this.filterSharedService.resetDashboardFilters();
      }
    });
  }

  loadTechDashboardData() {
    this.loading = true;

    // Load KPIs for the sales component
    this.techDashboardService.getKPIs(this.selectedAccMgr, this.selectedTech, this.selectedDateRange).subscribe({
      next: (kpis) => {
        this.kpis = kpis;
        // Map to sales format for compatibility
        this.dashboardData.sales = {
          jobsScheduled: kpis.jobsScheduled,
          jobsToBeUploaded: kpis.jobsToBeUploaded,
          emergencyJobs: kpis.emergencyJobs,
          missingJobs: kpis.missingJobs,
          jobsWithParts: kpis.jobsWithParts,
          jobsThisWeek: kpis.jobsThisWeek
        };
        this.filterSharedService.setDashboardData(this.dashboardData);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading KPIs:', err)
    });

    // Load Activity Log
    this.techDashboardService.getActivityLog(this.selectedAccMgr, this.selectedTech).subscribe({
      next: (activities) => {
        this.dashboardData.recentActivityLog = activities;
        this.filterSharedService.setDashboardData(this.dashboardData);
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading activity log:', err)
    });

    // Load Week Jobs
    this.techDashboardService.getWeekJobs(this.selectedAccMgr, this.selectedTech).subscribe({
      next: (jobs) => {
        this.dashboardData.todaysJobList = jobs;
        this.filterSharedService.setDashboardData(this.dashboardData);
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading week jobs:', err);
        this.loading = false;
      }
    });

    // Load chart data
    this.techDashboardService.getMonthlyChart(this.selectedAccMgr, this.selectedTech).subscribe({
      next: (chartData) => {
          // Map MonthlyChartData to JobScheduleTrend format
          const mappedData = chartData.map(item => ({
             date: new Date(item.monthName),
            monthNo: item.monthNo,
            monthName: item.monthName,
            jobs: item.jobs
          }));
        
          this.dashboardData.jobScheduleTrend = mappedData;
          this.dashboardData.monthlyUnscheduledJob = mappedData;
        this.filterSharedService.setDashboardData(this.dashboardData);
          this.filterSharedService.setWeeklyQuotesData(mappedData);
        this.cdr.detectChanges();
        
        // Update charts - reinitialize if not yet created
        if (!this.monthlyChart || !this.jobChart) {
          console.log('Charts not initialized, initializing now');
          this.initCharts();
          // Wait a bit for DOM to update before updating chart data
          setTimeout(() => {
            this.updateCharts(chartData);
          }, 50);
        } else {
          this.updateCharts(chartData);
        }
      },
      error: (err) => console.error('Error loading chart data:', err)
    });
  }

  initCharts(): void {
    // Monthly Chart (Bar)
    const monthlyCanvas = document.getElementById('monthlyChart') as HTMLCanvasElement;
    if (monthlyCanvas && typeof Chart !== 'undefined') {
      const monthlyCtx = monthlyCanvas.getContext('2d');
      if (monthlyCtx) {
        this.monthlyChart = new Chart(monthlyCtx, {
          type: 'bar',
          data: {
            labels: [],
            datasets: [{
              data: [],
              backgroundColor: 'rgba(63,174,154,.75)',
              borderRadius: 10
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              x: { grid: { display: false }, ticks: { color: '#134E4A' } },
              y: { grid: { color: 'rgba(0,0,0,.08)' }, ticks: { color: '#134E4A' } }
            }
          }
        });
      }
    }

    // Job Upload Trend Chart (Line)
    const jobCanvas = document.getElementById('jobChart') as HTMLCanvasElement;
    if (jobCanvas && typeof Chart !== 'undefined') {
      const jobCtx = jobCanvas.getContext('2d');
      if (jobCtx) {
        this.jobChart = new Chart(jobCtx, {
          type: 'line',
          data: {
            labels: [],
            datasets: [{
              data: [],
              fill: true,
              tension: 0.4,
              borderColor: '#3FAE9A',
              backgroundColor: 'rgba(111,213,195,.45)',
              pointRadius: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false }
            },
            scales: {
              x: { grid: { display: false }, ticks: { color: '#134E4A' } },
              y: { grid: { color: 'rgba(0,0,0,.08)' }, ticks: { color: '#134E4A' } }
            }
          }
        });
      }
    }
  }

  updateCharts(chartData: any[]): void {
    const labels = chartData.map(item => item.monthName);
    const values = chartData.map(item => item.jobs);

    console.log('updateCharts called with:', { labels, values, monthlyChart: this.monthlyChart, jobChart: this.jobChart });

    // Update Monthly Chart
    if (this.monthlyChart) {
      this.monthlyChart.data.labels = labels;
      this.monthlyChart.data.datasets[0].data = values;
      this.monthlyChart.update('none'); // Use 'none' to avoid animation and update immediately
      console.log('Monthly chart updated:', { labels, values });
    } else {
      console.warn('Monthly chart not initialized yet');
    }

    // Update Job Trend Chart
    if (this.jobChart) {
      this.jobChart.data.labels = labels;
      this.jobChart.data.datasets[0].data = values;
      this.jobChart.update('none'); // Use 'none' to avoid animation and update immediately
      console.log('Job chart updated:', { labels, values });
    } else {
      console.warn('Job chart not initialized yet');
    }
  }

  ngOnDestroy(): void {
    if (this.subscriptionDashboardFilter$) {
      this.subscriptionDashboardFilter$.unsubscribe();
    }
    if (this.monthlyChart) {
      this.monthlyChart.destroy();
    }
    if (this.jobChart) {
      this.jobChart.destroy();
    }
  }
}
