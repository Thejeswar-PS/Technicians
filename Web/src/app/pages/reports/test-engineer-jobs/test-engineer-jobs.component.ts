import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { ReportService } from 'src/app/core/services/report.service';
import { AuthService } from 'src/app/modules/auth';
import { 
  TestEngineerJobDto, 
  TestEngineerJobsRequestDto,
  TestEngineerJobsResponse,
  TestEngineerJobsChartsResponse,
  EngineerDto,
  EngineerChartDto,
  StatusChartDto
} from 'src/app/core/model/test-engineer-jobs.model';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-test-engineer-jobs',
  templateUrl: './test-engineer-jobs.component.html',
  styleUrls: ['./test-engineer-jobs.component.scss']
})
export class TestEngineerJobsComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('engineerChart') engineerChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;
  
  private destroy$ = new Subject<void>();
  
  // Math object for template access
  Math = Math;
  
  // Chart instances
  private engineerChart?: Chart<any>;
  private statusChart?: Chart<any>;
  
  // Data properties
  jobsList: TestEngineerJobDto[] = [];
  filteredList: TestEngineerJobDto[] = [];
  engineersList: EngineerDto[] = [];
  
  // Loading and error states
  isLoading = false;
  errorMessage = '';
  generatedAt: Date | null = null;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;  // Match ASP.NET default page size
  totalItems = 0;
  totalPages = 0;
  paginatedData: TestEngineerJobDto[] = [];
  
  // Sorting
  sortColumn = 'ProjectedDate';
  sortDirection: 'ASC' | 'DESC' = 'DESC';
  
  // Filter form
  filterForm: FormGroup;
  
  // Chart data
  engineerChartData: EngineerChartDto[] = [];
  statusChartData: StatusChartDto[] = [];
  showCharts = true;
  
  // Table columns configuration
  columns = [
    { key: 'jobNumber', label: 'Job Number', sortable: true },
    { key: 'assignedEngineer', label: 'Assigned Engineer', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'location', label: 'Location', sortable: true },
    { key: 'workType', label: 'Work Type', sortable: true },
    { key: 'projectedDate', label: 'Projected Date', sortable: true },
    { key: 'createdOn', label: 'Created On', sortable: true },
    { key: 'customer', label: 'Customer', sortable: true },
    { key: 'description', label: 'Description', sortable: false }
  ];

  // Filter options - match ASP.NET options
  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'Open', label: 'Open' },
    { value: 'In-Progress', label: 'In-Progress' },
    { value: 'Closed', label: 'Closed' }
  ];

  locationOptions = [
    { value: '', label: 'All Locations' },
    { value: 'DC1', label: 'DC1' },
    { value: 'DC2', label: 'DC2' }
  ];

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService
  ) {
    this.filterForm = this.fb.group({
      engineer: [''],
      status: [''],
      location: [''],
      search: ['']
    });
  }

  ngOnInit(): void {
    this.loadEngineers();
    this.loadTestEngineerJobs();
    this.setupFilterSubscriptions();
  }

  ngAfterViewInit(): void {
    // Charts will be initialized after data is loaded
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  setupFilterSubscriptions(): void {
    this.filterForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadTestEngineerJobs();
      });
  }

  loadEngineers(): void {
    this.reportService.getTestEngineerJobsEngineers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.engineersList = response.engineers || [];
          }
        },
        error: (error) => {
          console.error('Error loading engineers:', error);
        }
      });
  }

  loadTestEngineerJobs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const formValue = this.filterForm.value;
    const request: TestEngineerJobsRequestDto = {
      engineer: formValue.engineer || '',
      status: formValue.status || '',
      location: formValue.location || '',
      search: formValue.search || '',
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };

    this.reportService.getTestEngineerJobs(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: TestEngineerJobsResponse) => {
          if (response.success) {
            this.jobsList = response.data || [];
            this.totalItems = response.totalRecords;
            this.applyPagination();
            this.loadChartData(request);
          } else {
            this.errorMessage = response.message || 'Failed to load test engineer jobs';
            this.jobsList = [];
            this.filteredList = [];
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading test engineer jobs:', error);
          this.errorMessage = 'An error occurred while loading test engineer jobs. Please try again.';
          this.jobsList = [];
          this.filteredList = [];
          this.isLoading = false;
        }
      });
  }

  loadChartData(request: TestEngineerJobsRequestDto): void {
    this.reportService.getTestEngineerJobsCharts(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.engineerChartData = response.data.engineerData || [];
            this.statusChartData = response.data.statusData || [];
            // Initialize charts after data is loaded
            setTimeout(() => {
              this.initializeCharts();
            }, 100);
          }
        },
        error: (error) => {
          console.error('Error loading chart data:', error);
        }
      });
  }

  applyPagination(): void {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedData = this.jobsList.slice(startIndex, endIndex);
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'ASC';
    }
    this.loadTestEngineerJobs();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.applyPagination();
  }

  onItemsPerPageChange(itemsPerPage: number): void {
    this.itemsPerPage = Number(itemsPerPage);
    this.currentPage = 1;
    this.applyPagination();
  }

  resetFilters(): void {
    this.filterForm.reset({
      engineer: '',
      status: '',
      location: '',
      search: ''
    });
  }

  exportToExcel(): void {
    // TODO: Implement Excel export functionality
    console.log('Export to Excel clicked');
  }

  toggleCharts(): void {
    this.showCharts = !this.showCharts;
  }

  getRowClass(job: TestEngineerJobDto): string {
    if (job.isOverdue) {
      return 'overdue-row';  // Red styling for overdue jobs
    } else if (job.isEmergency) {
      return 'emergency-row';  // Orange styling for emergency jobs
    }
    return '';
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'open':
        return 'badge badge-open';
      case 'in-progress':
      case 'in progress':
        return 'badge badge-progress';
      case 'closed':
      case 'completed':
        return 'badge badge-closed';
      default:
        return 'badge badge-open';
    }
  }

  trackByJobNumber(index: number, job: TestEngineerJobDto): string {
    return job.jobNumber;
  }

  addNewJob(): void {
    // TODO: Navigate to new job entry form
    console.log('Add new job clicked');
    // this.router.navigate(['/jobs/new']); // Implement when route is available
  }

  editJob(jobNumber: string): void {
    // TODO: Navigate to job edit form
    console.log('Edit job clicked:', jobNumber);
    // this.router.navigate(['/jobs/edit', jobNumber]); // Implement when route is available
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  formatDate(dateString: string | null): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  formatDateTime(dateString: string | null): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  getTotalByStatus(status: string): number {
    return this.jobsList.filter(job => job.status === status).length;
  }

  getTotalOverdue(): number {
    return this.jobsList.filter(job => job.isOverdue).length;
  }

  getTotalEmergency(): number {
    return this.jobsList.filter(job => job.isEmergency).length;
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'bi-arrow-down-up';
    }
    return this.sortDirection === 'ASC' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  // TrackBy functions for performance optimization
  trackByJob(index: number, job: TestEngineerJobDto): string {
    return job.jobNumber;
  }

  trackByColumn(index: number, column: any): string {
    return column.key;
  }

  trackByStatus(index: number, item: StatusChartDto): string {
    return item.status;
  }

  trackByEngineer(index: number, item: EngineerChartDto): string {
    return item.engineer + item.status;
  }

  trackByPage(index: number, page: number): number {
    return page;
  }

  private initializeCharts(): void {
    this.initializeEngineerChart();
    this.initializeStatusChart();
  }

  private initializeEngineerChart(): void {
    if (!this.engineerChartRef?.nativeElement || this.engineerChartData.length === 0) {
      return;
    }

    // Destroy existing chart
    if (this.engineerChart) {
      this.engineerChart.destroy();
    }

    const ctx = this.engineerChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    // Group data by engineer and status
    const groupedData = this.engineerChartData.reduce((acc, item) => {
      if (!acc[item.engineer]) {
        acc[item.engineer] = { Open: 0, 'In-Progress': 0, Closed: 0 };
      }
      acc[item.engineer][item.status] = item.count;
      return acc;
    }, {} as Record<string, Record<string, number>>);

    const engineers = Object.keys(groupedData);
    const openData = engineers.map(engineer => groupedData[engineer]['Open'] || 0);
    const inProgressData = engineers.map(engineer => groupedData[engineer]['In-Progress'] || 0);
    const closedData = engineers.map(engineer => groupedData[engineer]['Closed'] || 0);

    const config: any = {
      type: 'bar',
      data: {
        labels: engineers,
        datasets: [
          {
            label: 'Open',
            data: openData,
            backgroundColor: '#0d6efd',
            borderColor: '#0d6efd',
            borderWidth: 1,
            hoverBackgroundColor: '#0a58ca',
            hoverBorderColor: '#0a58ca'
          },
          {
            label: 'In-Progress',
            data: inProgressData,
            backgroundColor: '#fd7e14',
            borderColor: '#fd7e14',
            borderWidth: 1,
            hoverBackgroundColor: '#e8690b',
            hoverBorderColor: '#e8690b'
          },
          {
            label: 'Closed',
            data: closedData,
            backgroundColor: '#198754',
            borderColor: '#198754',
            borderWidth: 1,
            hoverBackgroundColor: '#146c43',
            hoverBorderColor: '#146c43'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        animation: {
          duration: 800,
          easing: 'easeInOutQuart'
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: {
                size: 12
              }
            },
            onClick: (evt: any, legendItem: any, legend: any) => {
              const index = legendItem.datasetIndex;
              const ci = legend.chart;
              if (ci.isDatasetVisible(index!)) {
                ci.hide(index!);
                legendItem.hidden = true;
              } else {
                ci.show(index!);
                legendItem.hidden = false;
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#333',
            borderWidth: 1,
            cornerRadius: 6,
            displayColors: true,
            callbacks: {
              title: (tooltipItems: any) => {
                return `Engineer: ${tooltipItems[0].label}`;
              },
              label: (context: any) => {
                const datasetLabel = context.dataset.label || '';
                const value = context.raw;
                return `${datasetLabel}: ${value} job${Number(value) !== 1 ? 's' : ''}`;
              },
              afterBody: (tooltipItems: any) => {
                const engineer = tooltipItems[0].label;
                const total = tooltipItems.reduce((sum: number, item: any) => sum + Number(item.raw), 0);
                return `Total jobs: ${total}`;
              }
            }
          }
        },
        scales: {
          x: {
            stacked: false,
            grid: {
              display: false
            },
            ticks: {
              maxRotation: 45,
              minRotation: 0,
              font: {
                size: 11
              }
            }
          },
          y: {
            stacked: false,
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              stepSize: 1,
              font: {
                size: 11
              }
            }
          }
        },
        onClick: (event: any, elements: any) => {
          if (elements.length > 0) {
            const element = elements[0];
            const datasetIndex = element.datasetIndex;
            const index = element.index;
            const engineer = engineers[index];
            const status = ['Open', 'In-Progress', 'Closed'][datasetIndex];
            this.onChartClick('engineer', engineer, status);
          }
        }
      }
    };

    this.engineerChart = new Chart(ctx, config);
  }

  private initializeStatusChart(): void {
    if (!this.statusChartRef?.nativeElement || this.statusChartData.length === 0) {
      return;
    }

    // Destroy existing chart
    if (this.statusChart) {
      this.statusChart.destroy();
    }

    const ctx = this.statusChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const labels = this.statusChartData.map(item => item.status);
    const data = this.statusChartData.map(item => item.count);
    const colors = this.statusChartData.map(item => {
      switch (item.status) {
        case 'Open': return '#0d6efd';
        case 'In-Progress': return '#fd7e14';
        case 'Closed': return '#198754';
        default: return '#6c757d';
      }
    });

    const config: any = {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: colors,
            borderColor: colors,
            borderWidth: 2,
            hoverOffset: 8,
            hoverBorderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        animation: {
          duration: 1000,
          easing: 'easeInOutQuart'
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12
              },
              generateLabels: (chart: any) => {
                const data = chart.data;
                if (data.labels?.length && data.datasets.length) {
                  return data.labels.map((label: any, i: number) => {
                    const dataset = data.datasets[0];
                    const value = dataset.data[i] as number;
                    const total = (dataset.data as number[]).reduce((sum, val) => sum + val, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    
                    const bgColors = Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor : [dataset.backgroundColor];
                    const borderColors = Array.isArray(dataset.borderColor) ? dataset.borderColor : [dataset.borderColor];
                    
                    return {
                      text: `${label} (${value}) - ${percentage}%`,
                      fillStyle: (bgColors[i] || bgColors[0]) as string,
                      strokeStyle: (borderColors[i] || borderColors[0]) as string,
                      lineWidth: dataset.borderWidth as number,
                      hidden: false,
                      index: i
                    };
                  });
                }
                return [];
              }
            },
            onClick: (evt: any, legendItem: any, legend: any) => {
              const chart = legend.chart;
              const index = legendItem.index!;
              const meta = chart.getDatasetMeta(0);
              
              // Toggle visibility using Chart.js API
              const isVisible = chart.isDatasetVisible(0);
              if (isVisible) {
                chart.toggleDataVisibility(index);
              } else {
                chart.toggleDataVisibility(index);
              }
              chart.update();
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleColor: '#fff',
            bodyColor: '#fff',
            borderColor: '#333',
            borderWidth: 1,
            cornerRadius: 6,
            callbacks: {
              label: (context: any) => {
                const label = context.label || '';
                const value = context.raw as number;
                const total = (context.dataset.data as number[]).reduce((sum, val) => sum + val, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} job${value !== 1 ? 's' : ''} (${percentage}%)`;
              }
            }
          }
        },
        onClick: (event: any, elements: any) => {
          if (elements.length > 0) {
            const element = elements[0];
            const index = element.index;
            const status = labels[index];
            this.onChartClick('status', status);
          }
        }
      }
    };

    this.statusChart = new Chart(ctx, config);
  }

  onChartClick(type: 'engineer' | 'status', value: string, status?: string): void {
    // Update filter form based on chart click
    if (type === 'engineer') {
      this.filterForm.patchValue({
        assignedEngineer: value,
        status: status || ''
      });
    } else if (type === 'status') {
      this.filterForm.patchValue({
        status: value
      });
    }

    // Scroll to table to show filtered results
    setTimeout(() => {
      const tableElement = document.querySelector('.data-table');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

    // Show user feedback
    this.showChartClickMessage(type, value, status);
  }

  private showChartClickMessage(type: 'engineer' | 'status', value: string, status?: string): void {
    let message = '';
    if (type === 'engineer' && status) {
      message = `Filtered by ${value} - ${status} jobs`;
    } else if (type === 'engineer') {
      message = `Filtered by engineer: ${value}`;
    } else {
      message = `Filtered by status: ${value}`;
    }

    // Create a temporary toast notification
    this.showToast(message);
  }

  private showToast(message: string): void {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'chart-filter-toast';
    toast.innerHTML = `
      <i class="bi bi-funnel me-2"></i>
      ${message}
      <button type="button" class="btn-close btn-close-white ms-2" onclick="this.parentElement.remove()">
        <span aria-hidden="true">&times;</span>
      </button>
    `;
    
    // Add to body
    document.body.appendChild(toast);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 4000);
  }

  clearChartFilters(): void {
    this.filterForm.patchValue({
      assignedEngineer: '',
      status: '',
      workType: '',
      location: ''
    });
  }
}