import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NewDisplayCallsDetailService } from 'src/app/core/services/new-display-calls-detail.service';
import {
  NewDisplayCallsDetailResponseDto,
  ReportResponseDto,
  ContractInvoiceDto,
  QuoteDto,
  JobProcessingDto,
  JobSchedulingDto,
  QuoteManagementDto,
  InvoiceDto,
  ContractBillingDto,
  PartsTrackingDto,
  PartsRequestDto,
  SiteStatusDto,
  JobStatusDetailDto,
  JobPerformanceDto,
  CompleteQuoteDto,
  ManagerReviewDto,
  DisplayCallsDetailDto,
  JobDetailDto,
  QuoteDetailDto,
  InvoiceDetailDto,
  UnscheduledJobDetailDto
} from 'src/app/core/model/new-display-calls-detail.model';

@Component({
  selector: 'app-dcg-display-report-details',
  templateUrl: './dcg-display-report-details.component.html',
  styleUrls: ['./dcg-display-report-details.component.scss']
})
export class DcgDisplayReportDetailsComponent implements OnInit, OnDestroy {
  
  // Route parameters
  page: string = '';
  dataSetName: string = '';
  backButton: string = '';
  officeId: string = '';

  // Component state
  isLoading = false;
  error: string | null = null;
  reportData: any[] = [];
  totalData: any = null;
  reportTitle: string = '';
  reportType: string = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 25;
  totalRecords = 0;

  // Sorting
  sortField: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Filtering
  searchTerm: string = '';
  filteredData: any[] = [];

  private subscriptions: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private newDisplayCallsDetailService: NewDisplayCallsDetailService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.page = params['Page'] || '';
      this.dataSetName = params['dataSetName'] || '';
      this.backButton = params['backbutton'] || 'account-manager-graph';
      
      // Handle officeId - decode dataSetName if using it as fallback
      if (params['officeId']) {
        this.officeId = params['officeId'].trim();
      } else if (params['dataSetName']) {
        this.officeId = decodeURIComponent(params['dataSetName']).trim();
      } else {
        this.officeId = '';
      }
      
      console.log('DCG Component - Page:', this.page, 'DataSetName:', this.dataSetName, 'OfficeId:', this.officeId);
      
      this.setReportTitle();
      this.loadReportData();
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Set the report title based on page parameter
   */
  private setReportTitle(): void {
    const titleMappings: { [key: string]: string } = {
      'quote': 'Quote Details',
      'pending-quotes': 'Pending Quotes',
      'open-quotes': 'Open Quotes', 
      'expired-quotes': 'Expired Quotes',
      'jobs-to-process': 'Jobs to be Processed',
      'jobs-processed': 'Paperwork Processing Jobs',
      'jobs-paperwork': 'Paperwork Processing Jobs',
      'jobs-scheduled': 'Jobs Scheduled by Account Managers',
      'down-sites': 'Down Sites',
      'problem-sites': 'Sites with Equipment Problems',
      'contract-invoice': 'Contract Invoice Month to Date',
      'current-invoices': 'Current Invoices',
      'invoices-1-30': 'Invoices (1-30 Days)',
      'invoices-31-60': 'Invoices (31-60 Days)',
      'invoices-61-90': 'Invoices (61-90 Days)',
      'invoices-91+': 'Invoices (91+ Days)',
      'unscheduled': 'Unscheduled Jobs'
    };

    this.reportTitle = titleMappings[this.page] || 'Report Details';
    
    if (this.dataSetName) {
      this.reportTitle += ` - ${decodeURIComponent(this.dataSetName).trim()}`;
    }
  }

  /**
   * Load report data based on page parameter
   */
  loadReportData(): void {
    if (!this.page) {
      this.error = 'No page parameter provided';
      return;
    }

    console.log('Loading report data for page:', this.page, 'with officeId:', this.officeId);

    this.isLoading = true;
    this.error = null;

    let observable;

    // Use the new structured endpoints
    switch (this.page) {
      case 'quote':
      case 'quotes':
        observable = this.newDisplayCallsDetailService.getQuotesToBeCompleted(this.officeId);
        break;
      case 'pending-quotes':
        observable = this.newDisplayCallsDetailService.getPendingQuotes();
        break;
      case 'open-quotes':
        observable = this.newDisplayCallsDetailService.getOpenQuotes();
        break;
      case 'expired-quotes':
        observable = this.newDisplayCallsDetailService.getExpiredQuotes();
        break;
      case 'jobs-to-process':
        observable = this.newDisplayCallsDetailService.getJobsToBeProcessedThisWeek(this.officeId);
        break;
      case 'jobs-processed':
        observable = this.newDisplayCallsDetailService.getJobsProcessedThisWeek(this.officeId);
        break;
      case 'jobs-paperwork':
        // Use Service Call Invoice Month to Date from SP
        observable = this.newDisplayCallsDetailService.getContractInvoiceMonthToDate();
        break;
      case 'jobs-scheduled':
        observable = this.newDisplayCallsDetailService.getJobsScheduledByAccountManagers();
        break;
      case 'down-sites':
        observable = this.newDisplayCallsDetailService.getDownSites();
        break;
      case 'problem-sites':
        observable = this.newDisplayCallsDetailService.getSitesWithEquipmentProblems();
        break;
      case 'contract-invoice':
        observable = this.newDisplayCallsDetailService.getContractInvoiceMonthToDate();
        break;
      case 'current-invoices':
        observable = this.newDisplayCallsDetailService.getCurrentInvoices();
        break;
      case 'invoices-1-30':
        observable = this.newDisplayCallsDetailService.getInvoicesByAge('1-30');
        break;
      case 'invoices-31-60':
        observable = this.newDisplayCallsDetailService.getInvoicesByAge('31-60');
        break;
      case 'invoices-61-90':
        observable = this.newDisplayCallsDetailService.getInvoicesByAge('61-90');
        break;
      case 'invoices-91+':
        observable = this.newDisplayCallsDetailService.getInvoicesByAge('91+');
        break;
      default:
        // Try generic approach with legacy API for backward compatibility
        const detailPage = this.newDisplayCallsDetailService.getDetailPageForChart(this.page, this.dataSetName);
        observable = this.newDisplayCallsDetailService.getDisplayCallsDetailByParams(detailPage, this.officeId);
        break;
    }

    if (!observable) {
      this.error = 'No matching data source found for this page type';
      this.isLoading = false;
      return;
    }

    const sub = observable.subscribe({
      next: (response) => {
        console.log('🔍 Frontend received response:', response);
        console.log('🔍 Response type:', typeof response);
        console.log('🔍 Response keys:', Object.keys(response || {}));
        this.handleDataResponse(response);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading report data:', error);
        this.error = 'Failed to load report data. Please try again.';
        this.isLoading = false;
      }
    });

    this.subscriptions.push(sub);
  }

  /**
   * Handle the API response data - Updated for new ReportResponseDto structure
   */
  private handleDataResponse(response: any): void {
    console.log('🔄 Processing response in handleDataResponse:', response);
    
    if (response && response.success === false) {
      this.error = response.message || 'Failed to load data';
      return;
    }

    // Handle the new ReportResponseDto structure
    if (response && response.data && Array.isArray(response.data)) {
      // New structured response from typed endpoints
      this.reportData = response.data;
      this.totalData = response.totalAmount;
      this.reportType = response.reportType || '';
      console.log('✅ Extracted data from ReportResponseDto:', this.reportData.length, 'records');
      console.log('✅ Report type:', this.reportType);
      console.log('✅ Total amount:', this.totalData);
    } 
    // Handle legacy NewDisplayCallsDetailResponseDto structure
    else if (response && response.data && response.success !== false) {
      if (Array.isArray(response.data)) {
        this.reportData = response.data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // Handle nested data structure
        this.reportData = response.data.data;
        this.totalData = response.data.totalAmount;
      } else if (response.data.details && Array.isArray(response.data.details)) {
        // Handle details structure
        this.reportData = response.data.details;
        this.totalData = response.data.totalAmount;
      } else {
        // Single object or other structure
        this.reportData = [response.data];
      }
      
      if (response.totalData) {
        this.totalData = response.totalData;
      }
      
      console.log('✅ Extracted data from legacy response:', this.reportData.length, 'records');
    }
    // Handle direct array response (legacy)
    else if (Array.isArray(response)) {
      this.reportData = response;
      console.log('✅ Direct array response:', this.reportData.length, 'records');
    }
    // Handle single object response
    else if (response && typeof response === 'object') {
      this.reportData = [response];
      console.log('✅ Single object wrapped:', this.reportData.length, 'record');
    }
    // No data
    else {
      this.reportData = [];
      console.log('⚠️ No data found in response');
    }

    this.totalRecords = this.reportData.length;
    console.log('📊 Final report data:', this.totalRecords, 'total records');
    console.log('📋 Sample data:', this.reportData.slice(0, 2));
    
    this.applyFiltering();
  }

  /**
   * Apply search filtering
   */
  applyFiltering(): void {
    if (!this.searchTerm.trim()) {
      this.filteredData = [...this.reportData];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredData = this.reportData.filter(item => {
        return Object.values(item).some(value => 
          value != null && String(value).toLowerCase().includes(searchLower)
        );
      });
    }
    this.currentPage = 1; // Reset to first page after filtering
  }

  /**
   * Handle search input
   */
  onSearch(): void {
    this.applyFiltering();
  }

  /**
   * Clear search filter
   */
  clearSearch(): void {
    this.searchTerm = '';
    this.applyFiltering();
  }

  /**
   * Sort data by field
   */
  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.filteredData.sort((a, b) => {
      const aValue = a[field] || '';
      const bValue = b[field] || '';
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return this.sortDirection === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Get paginated data
   */
  getPaginatedData(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.filteredData.slice(startIndex, endIndex);
  }

  /**
   * Get total pages
   */
  getTotalPages(): number {
    return Math.ceil(this.filteredData.length / this.pageSize);
  }

  /**
   * Change page size
   */
  changePageSize(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
  }

  /**
   * Go to specific page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.getTotalPages()) {
      this.currentPage = page;
    }
  }

  /**
   * Get object keys for dynamic table rendering (excluding columns with all null values)
   */
  getDataKeys(): string[] {
    if (this.reportData.length === 0) return [];
    
    const allKeys = Object.keys(this.reportData[0]);
    
    // Filter out keys that have null values in ALL records or are commonly empty fields
    const keysToExclude = ['description', 'quotedAmount', 'changeAge', 'address', 'salesPerson', 'type', 'mailingDt', 'pordnmbr'];
    
    return allKeys.filter(key => {
      // Exclude commonly null fields
      if (keysToExclude.includes(key)) {
        return false;
      }
      
      // Check if this column has any non-null values
      return this.reportData.some(record => 
        record[key] !== null && record[key] !== undefined && record[key] !== ''
      );
    });
  }

  /**
   * Format field name for display
   */
  formatFieldName(key: string): string {
    // Custom field name mappings for better display
    const fieldNameMappings: { [key: string]: string } = {
      'jobNo': 'Job No',
      'customerNo': 'Customer No', 
      'customerName': 'Customer Name',
      'acctMngr': 'Account Manager',
      'startDt': 'Start Date',
      'endDt': 'End Date',
      'returnedOn': 'Returned On',
      'invoicedOn': 'Invoiced On',
      'techName': 'Tech Name',
      'jobType': 'Job Type',
      'contractNo': 'Contract No',
      'dueInDays': 'Due In (Days)',
      'quotedAmount': 'Quoted Amount',
      'changeAge': 'Change Age',
      'salesPerson': 'Sales Person',
      'mailingDt': 'Mailing Date',
      'pordnmbr': 'PO Number'
    };
    
    // Use custom mapping if available, otherwise format the key
    if (fieldNameMappings[key]) {
      return fieldNameMappings[key];
    }
    
    return key.replace(/([A-Z])/g, ' $1')
              .replace(/^./, str => str.toUpperCase())
              .trim();
  }

  /**
   * Format field value for display
   */
  formatFieldValue(value: any): string {
    if (value === null || value === undefined) return '';
    
    // Check if this is a date field by name or format
    const valueStr = value.toString();
    
    // Handle date fields (startDt, endDt, returnedOn, invoicedOn, mailingDt)
    if (this.isDateField(valueStr) || this.isDateValue(valueStr)) {
      return this.formatDate(valueStr);
    }
    
    // Handle numeric values
    if (typeof value === 'number' && value % 1 !== 0) {
      return value.toFixed(2);
    }
    
    return valueStr;
  }

  /**
   * Check if field name suggests it's a date
   */
  private isDateField(fieldName: string): boolean {
    const dateFields = ['startdt', 'enddt', 'returnedon', 'invoicedon', 'mailingdt', 'date'];
    return dateFields.some(field => fieldName.toLowerCase().includes(field));
  }

  /**
   * Check if value looks like a date
   */
  private isDateValue(value: string): boolean {
    // Check for ISO date format or common date patterns
    const dateRegex = /^\d{4}-\d{2}-\d{2}|^\d{1,2}\/\d{1,2}\/\d{4}|^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
    return dateRegex.test(value) && !isNaN(Date.parse(value));
  }

  /**
   * Format date to MM/dd/yyyy format
   */
  private formatDate(dateValue: string): string {
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return dateValue; // Return original if invalid
      
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const year = date.getFullYear();
      
      return `${month}/${day}/${year}`;
    } catch (error) {
      return dateValue; // Return original value if parsing fails
    }
  }

  /**
   * Navigate back to previous page
   */
  goBack(): void {
    if (this.backButton === 'AccMgmtGraph.aspx') {
      this.router.navigate(['/reports/account-manager-graph']);
    } else {
      this.router.navigate(['/reports/account-manager-graph']);
    }
  }

  /**
   * Export data to CSV
   */
  exportToCSV(): void {
    if (this.filteredData.length === 0) return;

    const headers = this.getDataKeys().map(key => this.formatFieldName(key));
    const csvData = this.filteredData.map(row => 
      this.getDataKeys().map(key => this.formatFieldValue(row[key]))
    );

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `${this.reportTitle.replace(/\s+/g, '_')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  /**
   * Get pagination pages array
   */
  getPaginationPages(): (number | string)[] {
    const totalPages = this.getTotalPages();
    const current = this.currentPage;
    const pages: (number | string)[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (current > 4) {
        pages.push('...');
      }
      
      const start = Math.max(2, current - 2);
      const end = Math.min(totalPages - 1, current + 2);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (current < totalPages - 3) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }

    return pages;
  }

  /**
   * Get filter badge class based on result count
   */
  getFilterBadgeClass(): string {
    if (this.filteredData.length === 0) return 'badge-light-danger';
    if (this.filteredData.length <= 10) return 'badge-light-warning';
    if (this.filteredData.length <= 50) return 'badge-light-primary';
    return 'badge-light-success';
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByFn(index: number, item: any): any {
    return item?.jobNo || item?.customerNo || index;
  }

  /**
   * Math object for template
   */
  Math = Math;
}