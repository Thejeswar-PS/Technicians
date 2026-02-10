import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ReportService } from 'src/app/core/services/report.service';
import { AuthService } from 'src/app/modules/auth';
import { 
  OrderRequestStatusDto, 
  OrderRequestStatusRequestDto,
  ORDER_STATUS_OPTIONS,
  ORDER_TYPE_OPTIONS
} from 'src/app/core/model/order-request-status.model';

@Component({
  selector: 'app-order-request-status',
  templateUrl: './order-request-status.component.html',
  styleUrls: ['./order-request-status.component.scss']
})
export class OrderRequestStatusComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Math object for template access
  Math = Math;
  
  // Form and filters
  orderStatusFilterForm: FormGroup;
  
  // Data properties
  orderRequestStatusList: OrderRequestStatusDto[] = [];
  filteredList: OrderRequestStatusDto[] = [];
  
  // Loading and error states
  isLoading = false;
  errorMessage = '';
  
  // Dropdown options
  statusOptions = ORDER_STATUS_OPTIONS;
  orderTypeOptions = ORDER_TYPE_OPTIONS;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 50;
  totalItems = 0;
  pageSizeOptions = [10, 25, 50, 100];
  
  // Sorting
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Table columns configuration
  displayedColumns = [
    'rowIndex',
    'orderType',
    'requester', 
    'dcgPartNo',
    'manufPartNo',
    'qtyNeeded',
    'vendor',
    'poNumber',
    'orderDate',
    'arriveDate',
    'status',
    'createdOn',
    'createdBy',
    'modifiedOn',
    'modifiedBy'
  ];
  
  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadOrderRequestStatus();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.orderStatusFilterForm = this.fb.group({
      status: ['All'],
      orderType: ['All'],
      archive: [false]
    });
  }

  private setupFormSubscriptions(): void {
    // Watch for form changes and reload data
    this.orderStatusFilterForm.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadOrderRequestStatus();
      });
  }

  loadOrderRequestStatus(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    const formValue = this.orderStatusFilterForm.value;
    
    const status = formValue.status || 'All';
    const orderType = formValue.orderType || 'All';
    const archive = formValue.archive || false;

    this.reportService.getOrderRequestStatusByParams(status, orderType, archive)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: OrderRequestStatusDto[]) => {
          this.orderRequestStatusList = data || [];
          this.filteredList = [...this.orderRequestStatusList];
          this.totalItems = this.filteredList.length;
          this.currentPage = 1;
          this.isLoading = false;
        },
        error: (error) => {
          this.errorMessage = 'Failed to load order request status data. Please try again.';
          this.orderRequestStatusList = [];
          this.filteredList = [];
          this.totalItems = 0;
          this.isLoading = false;
        }
      });
  }

  // Sorting functionality
  sortData(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredList.sort((a, b) => {
      const aValue = this.getColumnValue(a, column);
      const bValue = this.getColumnValue(b, column);
      
      let comparison = 0;
      if (aValue > bValue) {
        comparison = 1;
      } else if (aValue < bValue) {
        comparison = -1;
      }
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  private getColumnValue(item: OrderRequestStatusDto, column: string): any {
    switch (column) {
      case 'rowIndex': return item.rowIndex || 0;
      case 'orderType': return item.orderType || '';
      case 'requester': return item.requester || '';
      case 'dcgPartNo': return item.dcgPartNo || '';
      case 'manufPartNo': return item.manufPartNo || '';
      case 'qtyNeeded': return item.qtyNeeded || 0;
      case 'vendor': return item.vendor || '';
      case 'poNumber': return item.poNumber || '';
      case 'orderDate': return item.orderDate || '';
      case 'arriveDate': return item.arriveDate || '';
      case 'status': return item.status || '';
      case 'createdOn': return item.createdOn || '';
      case 'createdBy': return item.createdBy || '';
      case 'modifiedOn': return item.modifiedOn || '';
      case 'modifiedBy': return item.modifiedBy || '';
      default: return '';
    }
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'fa-sort';
    }
    return this.sortDirection === 'asc' ? 'fa-sort-up' : 'fa-sort-down';
  }

  getSortClass(column: string): string {
    if (this.sortColumn === column) {
      return this.sortDirection === 'asc' ? 'sorted-asc' : 'sorted-desc';
    }
    return '';
  }

  // getStatusPillClass(status: string | null | undefined): string {
  //   if (!status) {
  //     return 'status-pill status-default';
  //   }
    
  //   const normalizedStatus = status.toUpperCase();
    
  //   switch (normalizedStatus) {
  //     case 'COM':
  //     case 'COMPLETED':
  //       return 'status-pill status-completed';
  //     case 'ORD':
  //     case 'ORDERED':
  //       return 'status-pill status-ordered';
  //     case 'SHI':
  //     case 'SHIPPED':
  //       return 'status-pill status-shipped';
  //     case 'BOR':
  //     case 'BACK ORDERED':
  //       return 'status-pill status-backordered';
  //     case 'NEW':
  //       return 'status-pill status-new';
  //     case 'CAN':
  //     case 'CANCELLED':
  //       return 'status-pill status-cancelled';
  //     default:
  //       return 'status-pill status-default';
  //   }
  // }

  getStatusPillClass(status: string | null | undefined): string {
  if (!status || status.toLowerCase() === 'n/a') {
    return 'status-na';
  }

  const normalized = status.toLowerCase().replace(/\s+/g, '-');

  return `status-${normalized}`;
}

  // Pagination
  getPaginatedData(): OrderRequestStatusDto[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredList.slice(startIndex, endIndex);
  }

  getTotalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    
    if (endPage - startPage < maxPagesToShow - 1) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  // Utility methods
  formatDate(date: Date | string | null | undefined): string {
    if (!date) return '';
    
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return '';
      }
      return dateObj.toLocaleDateString();
    } catch {
      return '';
    }
  }

  formatDateTime(dateTime: Date | string | null | undefined): string {
    if (!dateTime) return '';
    
    try {
      const dateObj = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
      if (isNaN(dateObj.getTime())) {
        return '';
      }
      return dateObj.toLocaleString();
    } catch {
      return '';
    }
  }

  // Navigation
  viewOrderRequest(orderRequest: OrderRequestStatusDto): void {
    if (!orderRequest) return;
    
    // Debug: Log the order request data being passed
    console.log('Order Request Status Data:', orderRequest);
    console.log('Notes field value:', orderRequest.notes);
    
    // Navigate to order request form with the order request data
    this.router.navigate(['/reports/order-request'], {
      queryParams: { 
        rowIndex: orderRequest.rowIndex,
        orderType: orderRequest.orderType || '',
        requester: orderRequest.requester || '',
        dcgPartNo: orderRequest.dcgPartNo || '',
        manufPartNo: orderRequest.manufPartNo || '',
        qtyNeeded: orderRequest.qtyNeeded || 0,
        vendor: orderRequest.vendor || '',
        poNumber: orderRequest.poNumber || '',
        orderDate: orderRequest.orderDate ? new Date(orderRequest.orderDate).toISOString().split('T')[0] : '',
        arriveDate: orderRequest.arriveDate ? new Date(orderRequest.arriveDate).toISOString().split('T')[0] : '',
        status: orderRequest.status || 'NEW',
        notes: orderRequest.notes || '',
        createdOn: orderRequest.createdOn ? new Date(orderRequest.createdOn).toISOString() : ''
      }
    });
  }

  refreshData(): void {
    this.loadOrderRequestStatus();
  }

  exportToCSV(): void {
    if (!this.filteredList || this.filteredList.length === 0) {
      return;
    }

    const csvContent = this.convertToCSV(this.filteredList);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `order_request_status_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  private convertToCSV(data: OrderRequestStatusDto[]): string {
    const headers = [
      'Row Index',
      'Order Type',
      'Requester',
      'DCG Part No',
      'Manuf Part No',
      'Qty Needed',
      'Vendor',
      'PO Number',
      'Order Date',
      'Arrive Date',
      'Status',
      'Created On',
      'Created By',
      'Modified On',
      'Modified By'
    ];

    const csvRows = [headers.join(',')];

    data.forEach(item => {
      if (!item) return;
      
      const row = [
        item.rowIndex || 0,
        `"${item.orderType || ''}"`,
        `"${item.requester || ''}"`,
        `"${item.dcgPartNo || ''}"`,
        `"${item.manufPartNo || ''}"`,
        item.qtyNeeded || 0,
        `"${item.vendor || ''}"`,
        `"${item.poNumber || ''}"`,
        `"${this.formatDate(item.orderDate || null)}"`,
        `"${this.formatDate(item.arriveDate || null)}"`,
        `"${item.status || ''}"`,
        `"${this.formatDateTime(item.createdOn || null)}"`,
        `"${item.createdBy || ''}"`,
        `"${this.formatDateTime(item.modifiedOn || null)}"`,
        `"${item.modifiedBy || ''}"`
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }

  // Clear filters
  clearFilters(): void {
    this.orderStatusFilterForm.reset({
      status: 'All',
      orderType: 'All',
      archive: false
    });
  }

  // Check if any filters are applied
  hasActiveFilters(): boolean {
    const formValue = this.orderStatusFilterForm.value;
    return formValue.status !== 'All' || 
           formValue.orderType !== 'All' || 
           formValue.archive === true;
  }

  // Check if archive mode is enabled
  isArchiveMode(): boolean {
    const formValue = this.orderStatusFilterForm.value;
    return formValue.archive === true;
  }

  // Track by function for ngFor
  trackByRowIndex(index: number, item: OrderRequestStatusDto): number {
    return item?.rowIndex || index;
  }

  // Get filter badge class
  getFilterBadgeClass(): string {
    return 'badge-info-custom';
  }
}