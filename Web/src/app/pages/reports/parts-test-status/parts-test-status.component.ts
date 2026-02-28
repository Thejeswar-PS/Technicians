import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { ReportService } from '../../../core/services/report.service';
import { 
  PartsTestStatusDto, 
  PartsTestStatusRequest, 
  PartsTestStatusResponse,
  PartsTestStatusDashboardResponse,
  PartsTestStatusJobTypeChartDto,
  PartsTestStatusStatusChartDto
} from '../../../core/model/parts-test-status.model';
import { EmployeeDto } from '../../../core/model/parts-test-info.model';

@Component({
  selector: 'app-parts-test-status',
  templateUrl: './parts-test-status.component.html',
  styleUrls: ['./parts-test-status.component.scss']
})
export class PartsTestStatusComponent implements OnInit {

  partsTestStatusList: PartsTestStatusDto[] = [];
  filteredData: PartsTestStatusDto[] = [];
  distinctMakes: string[] = [];
  distinctModels: string[] = [];
  modelsForSelectedMake: string[] = [];
  technicians: EmployeeDto[] = [];
  
  // Form and filters
  filterForm: FormGroup;
  
  // Loading states
  isLoading: boolean = false;
  isLoadingMakes: boolean = false;
  isLoadingModels: boolean = false;
  isProcessingData: boolean = false;
  isLoadingTechnicians: boolean = false;
  isLoadingCharts: boolean = false;
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 100;
  totalRecords: number = 0;
  displayedData: PartsTestStatusDto[] = [];
  totalPages: number = 0;
  
  // Sorting
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Submitted dates map (jobNumber -> submittedDate)
  submittedDatesMap: Map<string, string> = new Map();
  
  // Error handling
  errorMessage: string = '';
  chartErrorMessage: string = '';
  
  // Make Math available in template
  Math = Math;

  statusChartOptions: any;
  jobTypeChartOptions: any;
  
  // Job type options matching legacy system
  jobTypeOptions = [
    { value: 'All', label: 'All' },
    { value: '1', label: 'Fan Rebuild' },
    { value: '2', label: 'Cap Assy.' },
    { value: '4', label: 'Batt Module' },
    { value: '3', label: 'Inventory' },
    { value: '7', label: 'Board Setup' },
    { value: '6', label: 'Retest' }
  ];

  constructor(
    private reportService: ReportService,
    private fb: FormBuilder,
    private location: Location,
    private router: Router
  ) {
    this.filterForm = this.fb.group({
      jobType: ['All'],
      make: ['All'],
      model: ['All'],
      archive: [false],
      assignedTo: ['All']
    });
  }

  ngOnInit(): void {
    this.loadTechnicians();
    this.loadPartsTestStatus();
    this.loadDashboardData();
    this.setupFormSubscriptions();
  }

  setupFormSubscriptions(): void {
    // Watch for make changes to update models dropdown
    this.filterForm.get('make')?.valueChanges.subscribe(make => {
      this.modelsForSelectedMake = [...this.distinctModels];
      this.filterForm.patchValue({ model: 'All' }, { emitEvent: false });
    });

    // Watch for any form changes to trigger filtering with debounce
    this.filterForm.valueChanges.subscribe(() => {
      // Add a small delay to prevent excessive API calls
      setTimeout(() => {
        this.onFilterChange();
      }, 300);
    });
  }

  loadTechnicians(): void {
    this.isLoadingTechnicians = true;
    this.reportService.getEmployeeNamesByDept('T').subscribe({
      next: (response) => {
        if (response && response.success) {
          this.technicians = response.employees || [];
        } else {
          console.error('Failed to load technicians:', response?.message);
          this.technicians = [];
        }
        this.isLoadingTechnicians = false;
      },
      error: (error) => {
        console.error('Error loading technicians:', error);
        this.errorMessage = 'Error loading technicians. Please try again.';
        this.isLoadingTechnicians = false;
        this.technicians = [];
      }
    });
  }

  loadPartsTestStatus(): void {
    this.isLoading = true;
    this.displayedData = [];
    this.errorMessage = '';
    
    const formValue = this.filterForm.value;
    const request: PartsTestStatusRequest = {
      jobType: formValue.jobType || '',
      priority: '',
      archive: formValue.archive || false,
      make: formValue.make || '',
      model: formValue.model || '',
      assignedTo: formValue.assignedTo || ''
    };

    this.reportService.getPartsTestStatus(request).subscribe({
      next: (response: PartsTestStatusResponse) => {
        this.partsTestStatusList = response.partsTestData || [];
        this.distinctMakes = response.distinctMakes || [];
        this.distinctModels = response.distinctModels || [];
        this.modelsForSelectedMake = [...this.distinctModels];
        this.totalRecords = this.partsTestStatusList.length;
        
        // Apply default sorting: Emergency (red) first, then Orange, then Yellow, then Normal
        this.applySortByPriority();
        
        // Load submitted dates for all records
        this.loadSubmittedDatesForAllRecords();
        
        this.applyPagination();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading parts test status:', error);
        this.errorMessage = 'Error loading parts test status data. Please try again.';
        this.partsTestStatusList = [];
        this.distinctMakes = [];
        this.distinctModels = [];
        this.modelsForSelectedMake = [];
        this.totalRecords = 0;
        this.displayedData = [];
        this.isLoading = false;
      }
    });
  }

  onFilterChange(): void {
    this.isLoading = true;
    this.currentPage = 1;
    this.clearErrorMessage();
    this.loadPartsTestStatus();
    this.loadDashboardData();
  }

  navigateToPartTestEntry(rowIndex: number): void {
    if (rowIndex) {
      // Navigate to Part Test Info page with just rowIndex (simple approach)
      this.router.navigate(['/reports/parts-test-info'], {
        queryParams: { 
          rowIndex: rowIndex,
          source: 'PartsTest'
        }
      });
    }
  }

  // Load submitted dates for all records using API
  private loadSubmittedDatesForAllRecords(): void {
    // Clear previous map
    this.submittedDatesMap.clear();
    
    // Get unique job numbers
    const uniqueJobNumbers = [...new Set(this.partsTestStatusList.map(item => item.callNbr).filter(nb => nb))];
    
    // Load submitted date for each job number
    uniqueJobNumbers.forEach(jobNum => {
      if (jobNum && !this.submittedDatesMap.has(jobNum)) {
        this.reportService.getSubmittedDate(jobNum).subscribe({
          next: (response) => {
            if (response.success && response.submittedDate && response.submittedDate !== 'NA') {
              this.submittedDatesMap.set(jobNum, response.submittedDate);
            } else {
              this.submittedDatesMap.set(jobNum, 'NA');
            }
          },
          error: (error) => {
            console.warn(`Error loading submitted date for job ${jobNum}:`, error);
            this.submittedDatesMap.set(jobNum, 'NA');
          }
        });
      }
    });
  }

  // Get submitted date for a job number from the map and format it
  getSubmittedDate(callNbr: string): string {
    const submittedDate = this.submittedDatesMap.get(callNbr) || '';
    if (!submittedDate || submittedDate === 'NA') {
      return submittedDate;
    }
    // Format the date using the formatDate method
    return this.formatDate(submittedDate);
  }

  clearErrorMessage(): void {
    this.errorMessage = '';
  }

  clearChartErrorMessage(): void {
    this.chartErrorMessage = '';
  }

  loadDashboardData(): void {
    this.isLoadingCharts = true;
    this.clearChartErrorMessage();

    const formValue = this.filterForm.value;
    const request: PartsTestStatusRequest = {
      jobType: formValue.jobType || '',
      priority: '',
      archive: formValue.archive || false,
      make: formValue.make || '',
      model: formValue.model || '',
      assignedTo: formValue.assignedTo || ''
    };

    console.log('Loading dashboard with request:', request);

    this.reportService.getPartsTestStatusDashboard(request).subscribe({
      next: (response: PartsTestStatusDashboardResponse) => {
        console.log('Dashboard response received:', response);
        
        if (!response || response.success === false) {
          this.chartErrorMessage = response?.message || 'Failed to load dashboard charts';
          this.statusChartOptions = null;
          this.jobTypeChartOptions = null;
          this.isLoadingCharts = false;
          console.warn('Dashboard response failed:', this.chartErrorMessage);
          return;
        }

        console.log('Status Counts:', response.statusCounts);
        console.log('Job Type Distribution:', response.jobTypeDistribution);

        this.statusChartOptions = this.buildStatusChartOptions(response.statusCounts);
        this.jobTypeChartOptions = this.buildJobTypeChartOptions(response.jobTypeDistribution || []);
        
        console.log('Chart options built:', {
          statusChart: this.statusChartOptions ? 'Yes' : 'No',
          jobTypeChart: this.jobTypeChartOptions ? 'Yes' : 'No'
        });
        
        this.isLoadingCharts = false;
      },
      error: (error) => {
        console.error('Error loading dashboard charts:', error);
        this.chartErrorMessage = 'Error loading dashboard charts. Please try again.';
        this.statusChartOptions = null;
        this.jobTypeChartOptions = null;
        this.isLoadingCharts = false;
      }
    });
  }

  private buildStatusChartOptions(statusChart?: PartsTestStatusStatusChartDto): any {
    const counts = [
      statusChart?.emergencyCount ?? 0,
      statusChart?.overdueCount ?? 0,
      statusChart?.sameDayCount ?? 0,
      statusChart?.currentWeekCount ?? 0
    ];

    return {
      series: [{
        name: 'Count',
        data: counts
      }],
      chart: {
        type: 'bar',
        height: 280,
        toolbar: { show: false }
      },
      plotOptions: {
        bar: {
          distributed: true,
          borderRadius: 6,
          columnWidth: '55%'
        }
      },
      dataLabels: {
        enabled: true
      },
      colors: ['#ff6b57', '#f59e0b', '#facc15', '#22c55e'],
      xaxis: {
        categories: ['Emergency', 'Overdue', 'Same Day', 'Current Week'],
        labels: {
          style: { fontSize: '12px' }
        }
      },
      yaxis: {
        title: { text: 'Count' },
        labels: { style: { fontSize: '12px' } }
      },
      grid: {
        borderColor: '#e2e8f0',
        strokeDashArray: 3
      },
      tooltip: {
        y: { formatter: (val: number) => `${val}` }
      }
    };
  }

  private buildJobTypeChartOptions(jobTypes: PartsTestStatusJobTypeChartDto[]): any {
    if (!jobTypes || jobTypes.length === 0) {
      return null;
    }

    const labels = jobTypes.map(item => this.getJobTypeLabel(item.jobType));
    const values = jobTypes.map(item => item.totalCount ?? 0);

    return {
      series: [{
        name: 'Jobs',
        data: values
      }],
      chart: {
        type: 'bar',
        height: 280,
        toolbar: { show: false }
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 6,
          barHeight: '60%'
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val}`
      },
      colors: ['#3b82f6'],
      xaxis: {
        categories: labels,
        labels: { style: { fontSize: '12px' } }
      },
      yaxis: {
        labels: { style: { fontSize: '12px' } }
      },
      grid: {
        borderColor: '#e2e8f0',
        strokeDashArray: 3
      },
      tooltip: {
        y: { formatter: (val: number) => `${val}` }
      }
    };
  }

  private getJobTypeLabel(jobType: string): string {
    const match = this.jobTypeOptions.find(option => option.value === jobType);
    if (match) return match.label;
    return jobType || 'Unknown';
  }




  // Get priority rank for sorting (lower numbers = higher priority = appear first)
  private getRowPriorityRank(dueDate: Date | string | null | undefined): number {
    const colorClass = this.getRowColorClass(dueDate);
    
    switch (colorClass) {
      case 'row-overdue':   // RED - Emergency
        return 0;
      case 'row-urgent':    // ORANGE - Urgent
        return 1;
      case 'row-upcoming':  // YELLOW - Upcoming
        return 2;
      default:              // NORMAL
        return 3;
    }
  }

  // Sort data by priority: Red first, Orange second, Yellow third, Normal last
  private applySortByPriority(): void {
    this.partsTestStatusList.sort((a, b) => {
      const priorityA = this.getRowPriorityRank(a.dueDate);
      const priorityB = this.getRowPriorityRank(b.dueDate);
      
      // If priorities are equal, sort by due date (earlier dates first)
      if (priorityA === priorityB) {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_VALUE;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_VALUE;
        return dateA - dateB;
      }
      
      return priorityA - priorityB;
    });
  }

  onSort(column: string): void {
    // When sorting a specific column, clear the default priority sorting
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.applySorting();
  }

  applySorting(): void {
    if (!this.sortColumn) return;

    const column = this.sortColumn;

    this.partsTestStatusList.sort((a, b) => {
      const valueA = this.normalizeSortValue(this.getNestedProperty(a, column), column);
      const valueB = this.normalizeSortValue(this.getNestedProperty(b, column), column);

      if (valueA < valueB) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    this.applyPagination();
  }

  getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((o, p) => o && o[p], obj);
  }

  private normalizeSortValue(value: any, column: string): string | number {
    if (value === null || value === undefined) return '';

    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }

    if (typeof value === 'number') {
      return value;
    }

    if (value instanceof Date) {
      return value.getTime();
    }

    if (typeof value === 'string') {
      if (this.isDateColumn(column)) {
        const parsed = new Date(value);
        if (!isNaN(parsed.getTime())) {
          return parsed.getTime();
        }
      }
      return value.toLowerCase();
    }

    return String(value).toLowerCase();
  }

  private isDateColumn(column: string): boolean {
    return column === 'dueDate' || column === 'createdOn' || column === 'lastModifiedOn';
  }

  onPageChange(page: number, event?: Event): void {
    if (event) {
      event.preventDefault();
    }
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.applyPagination();
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    if (target && target.value) {
      this.pageSize = +target.value;
      this.currentPage = 1;
      this.applyPagination();
    }
  }

  applyPagination(): void {
    if (!this.partsTestStatusList || this.partsTestStatusList.length === 0) {
      this.displayedData = [];
      return;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedData = this.partsTestStatusList.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    if (this.totalRecords <= 0 || this.pageSize <= 0) return 1;
    return Math.ceil(this.totalRecords / this.pageSize);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  // New methods to match stripped-units-status design
  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  changeItemsPerPage(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.updatePagination();
  }

  shouldShowPageNumber(pageNumber: number): boolean {
    const totalPagesCount = this.getTotalPages();
    if (totalPagesCount <= 10) {
      return true;
    }
    
    const distance = Math.abs(this.currentPage - pageNumber);
    return distance <= 2 || pageNumber === 1 || pageNumber === totalPagesCount;
  }

  updatePagination(): void {
    this.totalPages = this.getTotalPages();
    this.applyPagination();
  }

  exportToExcel(): void {
    if (!this.partsTestStatusList || this.partsTestStatusList.length === 0) {
      console.warn('No data available to export');
      return;
    }
    
    // TODO: Implement Excel export functionality
    // This could use libraries like xlsx or exceljs

    
    // For now, create a simple CSV download
    this.downloadAsCSV();
  }

  downloadAsCSV(): void {
    if (!this.partsTestStatusList || this.partsTestStatusList.length === 0) {
      return;
    }

    const headers = [
      'Call Number', 'Site ID', 'Make', 'Model', 'Manuf Part No', 'DCG Part No', 
      'Serial No', 'Quantity', 'Description', 'QC Status', 'Assy Status', 
      'Test Passed', 'Assigned To', 'Due Date', 'Problem Notes', 'Resolve Notes',
      'Last Modified By', 'Last Modified On'
    ];

    const csvData = this.partsTestStatusList.map(item => [
      item.callNbr, item.siteID, item.make, item.model, item.manufPartNo, 
      item.dcgPartNo, item.serialNo, item.quantity, item.description, 
      item.qcWorkStatus, item.assyWorkStatus, item.isPassed ? 'Yes' : 'No',
      item.assignedTo, this.formatDate(item.dueDate), item.problemNotes, 
      item.resolveNotes, this.formatWindowsUser(item.lastModifiedBy || item.createdBy), this.formatDate(item.lastModifiedOn)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field || ''}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `parts-test-status-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onRefresh(): void {
    this.clearErrorMessage();
    this.loadPartsTestStatus();
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'passed':
        return 'badge-success';
      case 'in progress':
      case 'pending':
        return 'badge-warning';
      case 'failed':
      case 'rejected':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    
    const day = d.getDate().toString().padStart(2, '0');
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    
    return `${day}-${month}-${year}`;
  }

  formatWindowsUser(value: string | null | undefined): string {
    if (!value) return '';
    const trimmed = value.trim();
    if (!trimmed) return '';
    if (trimmed.includes('\\')) {
      return trimmed.split('\\').pop() || '';
    }
    if (trimmed.includes('@')) {
      return trimmed.split('@')[0] || '';
    }
    return trimmed;
  }

  trackByUniqueId(index: number, item: PartsTestStatusDto): string {
    return item.uniqueID;
  }

  getRowColorClass(dueDate: Date | string | null | undefined): string {
    if (!dueDate) return '';
    
    const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    const today = new Date();
    
    // Reset time to midnight for accurate day comparison (matching legacy .NET logic)
    const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
    const todayDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffTime = dueDay.getTime() - todayDay.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24); // Don't ceil - match .NET TotalDays exactly
    
    // Legacy logic: (DueDt - today).TotalDays
    if (diffDays <= 0) {
      return 'row-overdue'; // Red - Due same day or overdue
    } else if (diffDays <= 3) {
      return 'row-urgent'; // Orange - Due within 3 days
    } else if (diffDays <= 7) {
      return 'row-upcoming'; // Yellow - Due within a week
    }
    return '';
  }

  isAssembled(item: PartsTestStatusDto): boolean {
    // Match legacy logic: check if assyWorkStatus equals "1" or equivalent
    return item.assyWorkStatus === '1' || item.assyWorkStatus === 'Completed' || item.assyWorkStatus === 'Done';
  }

  isQualityChecked(item: PartsTestStatusDto): boolean {
    // Match legacy logic: check if qcWorkStatus equals "1" or equivalent  
    return item.qcWorkStatus === '1' || item.qcWorkStatus === 'Completed' || item.qcWorkStatus === 'Done';
  }

  onStatusChange(item: PartsTestStatusDto, statusType: 'assembled' | 'reviewed' | 'qc', event: Event): void {
    // Prevent changes - these checkboxes are for display only (matching legacy behavior)
    event.preventDefault();
    const target = event.target as HTMLInputElement;
    if (target) {
      // Reset checkbox to its original state
      if (statusType === 'assembled') {
        target.checked = this.isAssembled(item);
      } else if (statusType === 'reviewed') {
        target.checked = item.isPassed;
      } else if (statusType === 'qc') {
        target.checked = this.isQualityChecked(item);
      }
    }
  }

  getFilterBadgeClass(): string {
    if (this.totalRecords > 100) {
      return 'badge bg-success';
    } else if (this.totalRecords > 50) {
      return 'badge bg-warning';
    } else if (this.totalRecords > 0) {
      return 'badge bg-primary';
    }
    return 'badge bg-secondary';
  }

  getSortClass(column: string): string {
    if (this.sortColumn === column) {
      return this.sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc';
    }
    return 'sortable';
  }

  sortIcon(column: string): string {
    if (this.sortColumn === column) {
      return this.sortDirection === 'asc' ? 'bi bi-sort-up' : 'bi bi-sort-down';
    }
    return 'bi bi-three-dots-vertical';
  }

  goBack(): void {
    this.location.back();
  }
}
