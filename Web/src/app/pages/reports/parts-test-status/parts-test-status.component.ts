import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { ReportService } from '../../../core/services/report.service';
import { 
  PartsTestStatusDto, 
  PartsTestStatusRequest, 
  PartsTestStatusResponse,
  MakeModelDto
} from '../../../core/model/parts-test-status.model';

@Component({
  selector: 'app-parts-test-status',
  templateUrl: './parts-test-status.component.html',
  styleUrls: ['./parts-test-status.component.scss']
})
export class PartsTestStatusComponent implements OnInit {

  partsTestStatusList: PartsTestStatusDto[] = [];
  filteredData: PartsTestStatusDto[] = [];
  distinctMakes: MakeModelDto[] = [];
  distinctModels: MakeModelDto[] = [];
  modelsForSelectedMake: MakeModelDto[] = [];
  
  // Form and filters
  filterForm: FormGroup;
  
  // Loading states
  isLoading: boolean = false;
  isLoadingMakes: boolean = false;
  isLoadingModels: boolean = false;
  isProcessingData: boolean = false;
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 25;
  totalRecords: number = 0;
  displayedData: PartsTestStatusDto[] = [];
  
  // Sorting
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Error handling
  errorMessage: string = '';
  
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
  
  priorityOptions = [
    { value: 'All', label: 'All' },
    { value: 'High', label: 'High' },
    { value: 'Medium', label: 'Medium' },
    { value: 'Low', label: 'Low' },
    { value: 'Urgent', label: 'Urgent' }
  ];

  constructor(
    private reportService: ReportService,
    private fb: FormBuilder,
    private location: Location,
    private router: Router
  ) {
    this.filterForm = this.fb.group({
      jobType: ['All'],
      priority: ['All'],
      make: ['All'],
      model: ['All'],
      archive: [false]
    });
  }

  ngOnInit(): void {
    this.loadDistinctMakes();
    this.loadDistinctModels();
    this.loadPartsTestStatus();
    this.setupFormSubscriptions();
  }

  setupFormSubscriptions(): void {
    // Watch for make changes to update models dropdown
    this.filterForm.get('make')?.valueChanges.subscribe(make => {
      if (make && make !== '' && make !== 'All') {
        this.loadModelsByMake(make);
        // Clear model selection when make changes
        this.filterForm.patchValue({ model: 'All' }, { emitEvent: false });
      } else {
        this.modelsForSelectedMake = [...this.distinctModels];
        this.filterForm.patchValue({ model: 'All' }, { emitEvent: false });
      }
    });

    // Watch for any form changes to trigger filtering with debounce
    this.filterForm.valueChanges.subscribe(() => {
      // Add a small delay to prevent excessive API calls
      setTimeout(() => {
        this.onFilterChange();
      }, 300);
    });
  }

  loadDistinctMakes(): void {
    this.isLoadingMakes = true;
    this.reportService.getDistinctMakes().subscribe({
      next: (response) => {
        if (response && response.success) {
          this.distinctMakes = response.makes || [];
        } else {
          this.errorMessage = response?.message || 'Failed to load makes';
        }
        this.isLoadingMakes = false;
      },
      error: (error) => {
        console.error('Error loading makes:', error);
        this.errorMessage = 'Error loading makes. Please try again.';
        this.isLoadingMakes = false;
        this.distinctMakes = [];
      }
    });
  }

  loadDistinctModels(): void {
    this.isLoadingModels = true;
    this.reportService.getDistinctModels().subscribe({
      next: (response) => {
        if (response && response.success) {
          this.distinctModels = response.models || [];
          this.modelsForSelectedMake = [...this.distinctModels];
        } else {
          this.errorMessage = response?.message || 'Failed to load models';
        }
        this.isLoadingModels = false;
      },
      error: (error) => {
        console.error('Error loading models:', error);
        this.errorMessage = 'Error loading models. Please try again.';
        this.isLoadingModels = false;
        this.distinctModels = [];
        this.modelsForSelectedMake = [];
      }
    });
  }

  loadModelsByMake(make: string): void {
    if (!make || make.trim() === '' || make === 'All') {
      this.modelsForSelectedMake = [...this.distinctModels];
      return;
    }

    this.reportService.getDistinctModelsByMake(make).subscribe({
      next: (response) => {
        if (response && response.success) {
          this.modelsForSelectedMake = response.models || [];
        } else {
          console.warn(`Failed to load models for make "${make}": ${response?.message}`);
          this.modelsForSelectedMake = [...this.distinctModels];
        }
      },
      error: (error) => {
        console.error('Error loading models by make:', error);
        // Fallback to all models if there's an error
        this.modelsForSelectedMake = [...this.distinctModels];
      }
    });
  }

  loadPartsTestStatus(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    const formValue = this.filterForm.value;
    const request: PartsTestStatusRequest = {
      jobType: formValue.jobType || '',
      priority: formValue.priority || '',
      archive: formValue.archive || false,
      make: formValue.make || '',
      model: formValue.model || ''
    };

    this.reportService.getPartsTestStatus(request).subscribe({
      next: (response) => {
        if (response && response.success) {
          this.partsTestStatusList = response.data?.partsTestData || [];
          this.totalRecords = response.totalRecords || 0;
          this.applyPagination();
        } else {
          this.errorMessage = response?.message || 'Failed to load parts test status';
          this.partsTestStatusList = [];
          this.totalRecords = 0;
          this.displayedData = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading parts test status:', error);
        this.errorMessage = 'Error loading parts test status data. Please try again.';
        this.partsTestStatusList = [];
        this.totalRecords = 0;
        this.displayedData = [];
        this.isLoading = false;
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.clearErrorMessage();
    this.loadPartsTestStatus();
  }

  onClearFilters(): void {
    this.filterForm.reset({
      jobType: 'All',
      priority: 'All',
      make: 'All',
      model: 'All',
      archive: false
    });
    this.loadPartsTestStatus();
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

  clearErrorMessage(): void {
    this.errorMessage = '';
  }



  onSort(column: string): void {
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

    this.partsTestStatusList.sort((a, b) => {
      let valueA = this.getNestedProperty(a, this.sortColumn);
      let valueB = this.getNestedProperty(b, this.sortColumn);

      // Handle dates
      if (valueA instanceof Date && valueB instanceof Date) {
        return this.sortDirection === 'asc' 
          ? valueA.getTime() - valueB.getTime()
          : valueB.getTime() - valueA.getTime();
      }

      // Handle strings and numbers
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
      item.resolveNotes, item.lastModifiedBy, this.formatDate(item.lastModifiedOn)
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
    this.loadDistinctMakes();
    this.loadDistinctModels();
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
    return d.toLocaleDateString();
  }

  trackByUniqueId(index: number, item: PartsTestStatusDto): string {
    return item.uniqueID;
  }

  getRowColorClass(dueDate: Date | string | null | undefined): string {
    // Only apply colors to ACTIVE items (not archived) - matches legacy behavior
    const isShowingArchived = this.filterForm.get('archive')?.value === true;
    if (isShowingArchived || !dueDate) return '';
    
    const due = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return 'row-overdue'; // Red gradient - Due same day or overdue (ACTIVE ONLY)
    } else if (diffDays <= 3) {
      return 'row-urgent'; // Orange gradient - Due within 3 days (ACTIVE ONLY)
    } else if (diffDays <= 7) {
      return 'row-upcoming'; // Yellow gradient - Due within a week (ACTIVE ONLY)
    }
    return '';
  }

  isAssembled(item: PartsTestStatusDto): boolean {
    return item.assyWorkStatus === 'Completed' || item.assyWorkStatus === 'Done';
  }

  isQualityChecked(item: PartsTestStatusDto): boolean {
    return item.qcWorkStatus === 'Completed' || item.qcWorkStatus === 'Done';
  }

  onStatusChange(item: PartsTestStatusDto, statusType: 'assembled' | 'reviewed' | 'qc', event: Event): void {
    const target = event.target as HTMLInputElement;
    const checked = target?.checked || false;
    
    // TODO: Implement status update functionality
    // This would call an API to update the status

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
