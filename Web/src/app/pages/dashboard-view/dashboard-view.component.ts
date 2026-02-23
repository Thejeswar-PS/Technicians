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
  scheduledUploadedChart: any;
  topTechChart: any;
  showScheduledUploadedEmpty = false;
  showTopTechEmpty = false;

  scheduledUploadedValues = { scheduled: 0, uploaded: 0 };

  topTechLabels: string[] = [];
  topTechData: number[] = [];

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
    if (this.scheduledUploadedChart) {
      this.scheduledUploadedChart.destroy();
      this.scheduledUploadedChart = null;
    }
    if (this.topTechChart) {
      this.topTechChart.destroy();
      this.topTechChart = null;
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

        this.updateScheduledUploadedChart();
      },
      error: (err) => console.error('Error loading KPIs:', err)
    });

    this.techDashboardService.getScheduledVsUploaded(this.selectedAccMgr, this.selectedTech).subscribe({
      next: (counts) => {
        this.updateScheduledUploadedChart(counts.scheduled, counts.uploaded);
      },
      error: (err) => {
        console.warn('Error loading scheduled vs uploaded data:', err);
        this.updateScheduledUploadedChart();
      }
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
        if (!this.monthlyChart) {
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

    this.techDashboardService.getTopTechsDaysToUpload(this.selectedAccMgr, this.selectedTech).subscribe({
      next: (rows) => {
        this.topTechLabels = rows.map(item => item.techName);
        this.topTechData = rows.map(item => item.medianDays);
        this.updateTopTechChart();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.warn('Error loading top tech chart data:', err);
        this.topTechLabels = [];
        this.topTechData = [];
        this.updateTopTechChart();
      }
    });
  }

  initCharts(): void {
    // Scheduled vs Uploaded (Doughnut)
    const scheduledCanvas = document.getElementById('scheduledUploadedChart') as HTMLCanvasElement;
    if (scheduledCanvas && typeof Chart !== 'undefined') {
      const scheduledCtx = scheduledCanvas.getContext('2d');
      if (scheduledCtx) {
        this.scheduledUploadedChart = new Chart(scheduledCtx, {
          type: 'doughnut',
          data: {
            labels: ['Scheduled', 'Uploaded'],
            datasets: [{
              data: [0, 0],
              backgroundColor: ['#60c5d6', '#b794f4'],
              borderWidth: 0
            }]
          },
          options: {
            rotation: -90,
            circumference: 180,
            cutout: '70%',
            maintainAspectRatio: false,
            plugins: {
              legend: { position: 'bottom' }
            }
          }
        });
      }
    }

    // Top 10 Techs - Days To Upload (Horizontal Bar)
    const topTechCanvas = document.getElementById('topTechChart') as HTMLCanvasElement;
    if (topTechCanvas && typeof Chart !== 'undefined') {
      const topTechCtx = topTechCanvas.getContext('2d');
      if (topTechCtx) {
        this.topTechChart = new Chart(topTechCtx, {
          type: 'bar',
          data: {
            labels: [],
            datasets: [{
              data: [],
              backgroundColor: ['#60c5d6', '#34d399', '#f472b6', '#6366f1', '#b794f4'],
              borderRadius: 6
            }]
          },
          options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                position: 'left',
                ticks: {
                  align: 'start',
                  padding: 6,
                  font: { size: 13, weight: '500' }
                },
                grid: { display: false }
              },
              x: {
                grid: { color: 'rgba(0,0,0,0.08)' }
              }
            },
            plugins: {
              legend: { display: false }
            }
          }
        });
      }
    }

    // Monthly Chart (Bar)
    const monthlyCanvas = document.getElementById('monthlyChart') as HTMLCanvasElement;
    if (monthlyCanvas && typeof Chart !== 'undefined') {
      const monthlyCtx = monthlyCanvas.getContext('2d');
      if (monthlyCtx) {
        const gradient = monthlyCtx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, '#60c5d6');
        gradient.addColorStop(1, '#DDF5F9');

        this.monthlyChart = new Chart(monthlyCtx, {
          type: 'bar',
          data: {
            labels: [],
            datasets: [{
              data: [],
              backgroundColor: gradient,
              borderRadius: 8
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

    // Populate charts with latest data
    this.updateScheduledUploadedChart();
    this.updateTopTechChart();
  }

  updateCharts(chartData: any[]): void {
    const labels = chartData.map(item => item.monthName);
    const values = chartData.map(item => item.jobs);

    console.log('updateCharts called with:', { labels, values, monthlyChart: this.monthlyChart });

    // Update Monthly Chart
    if (this.monthlyChart) {
      this.monthlyChart.data.labels = labels;
      this.monthlyChart.data.datasets[0].data = values;
      this.monthlyChart.update('none'); // Use 'none' to avoid animation and update immediately
      console.log('Monthly chart updated:', { labels, values });
    } else {
      console.warn('Monthly chart not initialized yet');
    }

  }

  updateScheduledUploadedChart(scheduledValue?: number, uploadedValue?: number): void {
    if (scheduledValue != null || uploadedValue != null) {
      this.scheduledUploadedValues = {
        scheduled: Number(scheduledValue ?? this.scheduledUploadedValues.scheduled),
        uploaded: Number(uploadedValue ?? this.scheduledUploadedValues.uploaded)
      };
    } else if (this.scheduledUploadedValues.scheduled === 0 && this.scheduledUploadedValues.uploaded === 0) {
      this.scheduledUploadedValues = {
        scheduled: Number(this.kpis.jobsScheduled || 0),
        uploaded: Number(this.kpis.jobsToBeUploaded || 0)
      };
    }

    const scheduled = this.scheduledUploadedValues.scheduled;
    const uploaded = this.scheduledUploadedValues.uploaded;
    this.showScheduledUploadedEmpty = scheduled === 0 && uploaded === 0;

    if (this.scheduledUploadedChart) {
      this.scheduledUploadedChart.data.datasets[0].data = [scheduled, uploaded];
      this.scheduledUploadedChart.update('none');
    }
  }

  updateTopTechChart(): void {
    this.showTopTechEmpty = !this.topTechData || this.topTechData.length === 0;

    if (this.topTechChart) {
      this.topTechChart.data.labels = this.topTechLabels;
      this.topTechChart.data.datasets[0].data = this.topTechData;
      this.topTechChart.update('none');
    }
  }

  ngOnDestroy(): void {
    if (this.subscriptionDashboardFilter$) {
      this.subscriptionDashboardFilter$.unsubscribe();
    }
    if (this.monthlyChart) {
      this.monthlyChart.destroy();
    }
    if (this.scheduledUploadedChart) {
      this.scheduledUploadedChart.destroy();
    }
    if (this.topTechChart) {
      this.topTechChart.destroy();
    }
  }

  trackByActivity(index: number, item: any): string {
    return `${item.activityDate}-${item.jobID}-${index}`;
  }

  trackByWeekJob(index: number, item: any): string {
    return `${item.callNbr}-${index}`;
  }
}
