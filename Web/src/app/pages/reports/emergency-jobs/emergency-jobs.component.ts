import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ReportService } from 'src/app/core/services/report.service';
import { AuthService } from 'src/app/modules/auth';
import { 
  EmergencyJobDto, 
  EmergencyJobsResponseDto
} from 'src/app/core/model/emergency-jobs.model';

@Component({
  selector: 'app-emergency-jobs',
  templateUrl: './emergency-jobs.component.html',

  styleUrls: ['./emergency-jobs.component.scss']
})
export class EmergencyJobsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Math object for template access
  Math = Math;
  
  // Data properties
  emergencyJobsList: EmergencyJobDto[] = [];
  filteredList: EmergencyJobDto[] = [];
  
  // Loading and error states
  isLoading = false;
  errorMessage = '';
  generatedAt: Date | null = null;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 100; // Show 100 records per page by default
  totalItems = 0;
  totalPages = 0;
  paginatedData: EmergencyJobDto[] = [];
  
  // Sorting
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Table columns configuration
  columns = [
    { key: 'callnbr', label: 'Call Number', sortable: true },
    { key: 'custname', label: 'Customer Name', sortable: true },
    { key: 'city', label: 'City', sortable: true },
    { key: 'state', label: 'State', sortable: true },
    { key: 'dispdte', label: 'Scheduled', sortable: true },
    { key: 'name', label: 'Technician', sortable: true },
    { key: 'accountManager', label: 'Account Manager', sortable: true },
    { key: 'jobStatus', label: 'Status', sortable: true },
    { key: 'changeAge', label: 'Change Age', sortable: true }
  ];

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService
  ) {
    // No form initialization needed for read-only table
  }

  ngOnInit(): void {
    this.loadEmergencyJobs();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadEmergencyJobs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.reportService.getEmergencyJobs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: EmergencyJobsResponseDto) => {
          if (response.success) {
            this.emergencyJobsList = response.emergencyJobs || [];
            this.generatedAt = response.generatedAt;
            this.applyFilters();
          } else {
            this.errorMessage = response.message || 'Failed to load emergency jobs';
            this.emergencyJobsList = [];
            this.filteredList = [];
          }
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading emergency jobs:', error);
          this.errorMessage = 'An error occurred while loading emergency jobs. Please try again.';
          this.emergencyJobsList = [];
          this.filteredList = [];
          this.isLoading = false;
        }
      });
  }

  private applyFilters(): void {
    // Show all data with proper pagination
    this.filteredList = [...this.emergencyJobsList];
    this.totalItems = this.filteredList.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedData = this.filteredList.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  changeItemsPerPage(newSize: number): void {
    this.itemsPerPage = newSize;
    this.currentPage = 1;
    this.updatePagination();
  }

  onSort(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredList.sort((a, b) => {
      let valueA = this.getColumnValue(a, column);
      let valueB = this.getColumnValue(b, column);

      if (valueA === null || valueA === undefined) valueA = '';
      if (valueB === null || valueB === undefined) valueB = '';

      if (typeof valueA === 'string') valueA = valueA.toLowerCase();
      if (typeof valueB === 'string') valueB = valueB.toLowerCase();

      let comparison = 0;
      if (valueA > valueB) comparison = 1;
      if (valueA < valueB) comparison = -1;

      return this.sortDirection === 'desc' ? comparison * -1 : comparison;
    });
    
    // Update pagination after sorting
    this.updatePagination();
  }

  private getColumnValue(item: EmergencyJobDto, column: string): any {
    switch (column) {
      case 'callnbr': return item.callnbr;
      case 'custname': return item.custname;
      case 'city': return item.city;
      case 'state': return item.state;
      case 'dispdte': return item.dispdte;
      case 'name': return item.name;
      case 'accountManager': return item.accountManager;
      case 'priorityLevel': return item.priorityLevel;
      case 'jobStatus': return item.jobStatus;
      case 'changeAge': return item.changeAge;
      default: return '';
    }
  }

  getPaginatedData(): EmergencyJobDto[] {
    return this.paginatedData;
  }

  getTotalPages(): number {
    return this.totalPages;
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  getFilterBadgeClass(): string {
    if (this.totalItems === 0) return 'badge-danger';
    if (this.totalItems < 10) return 'badge-warning';
    return 'badge-success';
  }

  getPriorityBadgeClass(priority: string): string {
    if (!priority) return 'badge-secondary';
    
    switch (priority.toUpperCase()) {
      case 'CRITICAL': return 'badge-danger';
      case 'HIGH': return 'badge-warning';
      case 'MEDIUM': return 'badge-info';
      case 'LOW': return 'badge-success';
      default: return 'badge-secondary';
    }
  }

  getStatusBadgeClass(status: string): string {
    if (!status) return 'badge-secondary';
    
    switch (status.toUpperCase()) {
      case 'COMPLETED': return 'badge-success';
      case 'IN_PROGRESS': return 'badge-primary';
      case 'PENDING': return 'badge-warning';
      case 'OPEN': return 'badge-info';
      default: return 'badge-secondary';
    }
  }

  formatDate(date: Date | string | null | undefined): string {
    if (!date) return 'N/A';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      
      const day = dateObj.getDate().toString().padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[dateObj.getMonth()];
      const year = dateObj.getFullYear();
      
      return `${day}-${month}-${year}`;
    } catch {
      return 'Invalid Date';
    }
  }

  goBack(): void {
    this.router.navigate(['/reports']);
  }

  refreshData(): void {
    this.loadEmergencyJobs();
  }

  trackByCallNumber(index: number, item: EmergencyJobDto): string {
    return item.callnbr;
  }

  getSortIcon(column: string): string {
    if (this.sortColumn === column) {
      return this.sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
    }
    return 'bi-arrow-down-up';
  }
}