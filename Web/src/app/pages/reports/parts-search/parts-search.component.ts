import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ReportService } from 'src/app/core/services/report.service';
import { CommonService } from 'src/app/core/services/common.service';
import { AuthService } from 'src/app/modules/auth';
import {
  PartsSearchRequestDto,
  PartsSearchDataDto,
  PartsSearchDataResponse,
  PARTS_SEARCH_STATUS_OPTIONS
} from 'src/app/core/model/parts-search.model';
import { ToastrService } from 'ngx-toastr';
import { Subscription, finalize } from 'rxjs';

@Component({
  selector: 'app-parts-search',
  templateUrl: './parts-search.component.html',
  styleUrls: ['./parts-search.component.scss']
})
export class PartsSearchComponent implements OnInit, OnDestroy {
  searchForm!: FormGroup;
  partsSearchData: PartsSearchDataDto[] = [];
  filteredPartsSearchData: PartsSearchDataDto[] = [];
  isLoading = false;
  totalRecords = 0;
  showResults = false;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 25;
  totalPages = 0;
  
  // Filter options
  statusOptions = PARTS_SEARCH_STATUS_OPTIONS;
  
  // Table sorting
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Make Math available in template
  Math = Math;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private reportService: ReportService,
    private commonService: CommonService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Don't load data initially - wait for user to search
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private initializeForm(): void {
    this.searchForm = this.fb.group({
      address: [''],
      status: [''],
      siteID: [''],
      make: [''],
      model: [''],
      kva: [''],
      ipVoltage: [''],
      opVoltage: [''],
      manufPartNo: [''],
      dcgPartNo: ['']
    });
  }

  searchParts(): void {
    if (this.searchForm.invalid) {
      this.toastr.error('Please fill in all required fields');
      return;
    }

    // Check if at least one criteria is provided (like legacy validation)
    const formValue = this.searchForm.value;
    const hasAnyCriteria = Object.values(formValue).some(value => 
      value !== null && value !== undefined && value !== ''
    );

    if (!hasAnyCriteria) {
      this.toastr.error('You must enter at least one criteria to search the parts');
      return;
    }

    this.isLoading = true;
    
    const request: PartsSearchRequestDto = {
      address: formValue.address || '',
      status: formValue.status || '%',
      siteID: formValue.siteID || '%',
      make: formValue.make || '%',
      model: formValue.model || '%',
      kva: formValue.kva || '%',
      ipVoltage: formValue.ipVoltage || '%',
      opVoltage: formValue.opVoltage || '%',
      manufPartNo: formValue.manufPartNo || '%',
      dcgPartNo: formValue.dcgPartNo || '%'
    };

    const searchSub = this.reportService.searchPartsData(request)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: PartsSearchDataResponse) => {
          if (response.success) {
            this.partsSearchData = response.data || [];
            this.totalRecords = response.totalRecords || this.partsSearchData.length;
            this.applyClientSideFiltering();
            this.updatePagination();
            this.showResults = true;
            
            this.toastr.success(`Found ${this.totalRecords} parts records`, 'Search Successful');
          } else {
            this.toastr.error(response.message || 'Failed to load parts data');
            this.partsSearchData = [];
            this.totalRecords = 0;
            this.showResults = true;
            this.updatePagination();
          }
        },
        error: (error) => {
          console.error('Error searching parts data:', error);
          this.toastr.error('An error occurred while searching parts data');
          this.partsSearchData = [];
          this.totalRecords = 0;
          this.updatePagination();
        }
      });

    this.subscriptions.push(searchSub);
  }

  clearFilters(): void {
    this.searchForm.reset({
      address: '',
      status: '',
      siteID: '',
      make: '',
      model: '',
      kva: '',
      ipVoltage: '',
      opVoltage: '',
      manufPartNo: '',
      dcgPartNo: ''
    });
    this.partsSearchData = [];
    this.filteredPartsSearchData = [];
    this.totalRecords = 0;
    this.showResults = false;
    this.updatePagination();
  }

  private applyClientSideFiltering(): void {
    this.filteredPartsSearchData = [...this.partsSearchData];
    this.currentPage = 1;
  }

  private updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredPartsSearchData.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages && this.totalPages > 0) {
      this.currentPage = 1;
    }
  }

  get paginatedData(): PartsSearchDataDto[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredPartsSearchData.slice(startIndex, endIndex);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisiblePages = 5;
    const halfVisible = Math.floor(maxVisiblePages / 2);
    
    let startPage = Math.max(1, this.currentPage - halfVisible);
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  sortData(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredPartsSearchData.sort((a, b) => {
      let aValue: any = a[column as keyof PartsSearchDataDto];
      let bValue: any = b[column as keyof PartsSearchDataDto];

      // Handle date sorting
      if (column === 'requestedDate') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      }
      
      // Convert to string for comparison if not numbers
      if (typeof aValue !== 'number' && typeof bValue !== 'number') {
        aValue = (aValue || '').toString().toLowerCase();
        bValue = (bValue || '').toString().toLowerCase();
      }

      if (aValue < bValue) {
        return this.sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    this.currentPage = 1; // Reset to first page after sorting
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'fa-sort';
    }
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  exportToCSV(): void {
    if (this.filteredPartsSearchData.length === 0) {
      this.toastr.warning('No data to export');
      return;
    }

    const headers = [
      'Call Number', 'Customer Number', 'Status', 'Address', 'Make', 'Model',
      'KVA', 'I/O Volt', 'Manufacturer Part No', 'DCG Part No', 'Tech Name', 
      'Job Type', 'Requested Date'
    ];

    const csvContent = [
      headers.join(','),
      ...this.filteredPartsSearchData.map(item => [
        item.callNbr,
        item.custnmbr,
        item.status,
        `"${item.address}"`,
        item.make,
        item.model,
        item.kva,
        item.ioVolt,
        item.manufPartNo,
        item.dcgPartNo,
        `"${item.techName}"`,
        item.jobType,
        item.requestedDate ? new Date(item.requestedDate).toLocaleDateString() : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `parts-search-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.toastr.success('Data exported successfully');
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.itemsPerPage = parseInt(target.value, 10);
    this.updatePagination();
    this.currentPage = 1;
  }

  // Utility methods for display
  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  }

  getTotalRecordsText(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.filteredPartsSearchData.length);
    return `Showing ${start} to ${end} of ${this.filteredPartsSearchData.length} entries`;
  }

  trackByCallNbr(index: number, item: PartsSearchDataDto): string {
    return item.callNbr;
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'initiated':
      case 'submitted':
      case 'delivered':
        return 'badge-light-success';
      case 'canceled':
        return 'badge-light-danger';
      case 'needs attention':
      case 'staging':
        return 'badge-light-warning';
      case 'shipped':
      case 'inassembly':
      case 'orderedtrackingreq':
        return 'badge-light-info';
      default:
        return 'badge-light-secondary';
    }
  }

  getObjectKeys(obj: any): string {
    return Object.keys(obj).join(', ');
  }

  onJobIdClick(callNbr: string, techName: string): void {
    if (callNbr && techName) {
      const encodedTechName = encodeURIComponent(techName);
      this.router.navigate(['/jobs/parts'], {
        queryParams: {
          CallNbr: callNbr,
          TechName: encodedTechName
        }
      });
    }
  }

  // Navigation
  goBack(): void {
    window.history.back();
  }

  // Get filter badge class
  getFilterBadgeClass(): string {
    if (this.totalRecords === 0) {
      return 'badge-light-secondary';
    } else if (this.totalRecords < 10) {
      return 'badge-light-warning';
    } else {
      return 'badge-light-success';
    }
  }
}