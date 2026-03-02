import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportService } from 'src/app/core/services/report.service';
import { NewDisplayCallsDetailResponse } from 'src/app/core/model/display-calls-detail.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-display-calls-detail',
  templateUrl: './display-calls-detail.component.html',
  styleUrls: ['./display-calls-detail.component.scss']
})
export class DisplayCallsDetailComponent implements OnInit, OnDestroy {
  
  // Allow access to Math in template
  Math = Math;
  Object = Object;
  
  // Component state
  detailPage: string = '';
  offId: string | undefined;
  dataSetName: string | undefined;
  page: string | undefined;
  month: string | undefined;
  useLegacyApi: boolean = false;
  displayData: any[] = [];
  totalsData: any[] = [];
  columns: string[] = [];
  isLoading = false;
  error: string | null = null;
  
  // Response metadata
  originalParameter: string = '';
  mappedParameter: string = '';
  parameterMapped: boolean = false;
  executionTimeMs: number = 0;
  
  // Pagination
  pageSize = 50;
  currentPage = 1;
  totalRecords = 0;
  
  // Sorting
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Subscriptions
  private subscriptions: Subscription[] = [];

  // Legacy DataSetName to API Parameter Mapping
  // Maps old SQL stored procedure parameter values to new standardized API names
  private readonly LEGACY_DATASET_MAPPING: { [key: string]: string } = {
    // Job scheduling and processing
    'past due unscheduled jobs': 'Past Due Unscheduled Jobs',
    'past due unscheduled job': 'Past Due Unscheduled Jobs',
    'jobs to to scheduled for next 90 days': 'Jobs to to Scheduled for Next 90 Days',
    'jobs to scheduled for next 90 days': 'Jobs to to Scheduled for Next 90 Days',
    'jobs to be scheduled for next 90 days': 'Jobs to to Scheduled for Next 90 Days',
    'pending next 30 days': 'Pending next 30 days',
    'scheduled next 30 days': 'Scheduled next 30 days',
    'scheduled next 60 days': 'Scheduled next 60 days',
    'scheduled next 7 days': 'Scheduled next 7 days',
    'scheduled next 72 hours': 'Scheduled next 72 hours',
    'scheduled today': 'Scheduled Today',
    'jobs to be processed this week': 'Jobs to be Processed this week',
    'jobs processed this week': 'Jobs Processed this week',
    'jobs to be scheduled this week': 'Jobs to be Scheduled this week',
    'jobs scheduled by account managers this week': 'Jobs Scheduled by Account Managers this week',
    'jobs processed by account managers this week': 'Jobs Processed by Account Managers this week',
    'jobs scheduled by scheduling coordinator this week': 'Jobs Scheduled by Scheduling Coordinator this week',

    // Quotes and Scheduled Jobs - Chart display titles to stored procedure parameters
    'pending customer approval next 60 days': 'Scheduled next 60 days',
    'customer confirmed next 60 days': 'Scheduled next 60 days',
    'customer confirmed next 30 days': 'Scheduled next 30 days',
    'customer confirmed next 7 days': 'Scheduled next 7 days',
    'customer confirmed next 72 hours': 'Scheduled next 72 hours',
    'jobs today': 'Scheduled Today',
    'pending quotes': 'Pending Quotes',
    'open quotes': 'Open Quotes',
    'expired quotes': 'Expired Quotes',
    'quotes to be completed': 'Quotes to be Completed',
    'quotes to complete': 'Quotes to be Completed',
    'quotes to be completed this week': 'Quotes to be completed this week',
    'quotes completed by account managers this week': 'Quotes Completed by Account Managers this week',

    // Job status and returns
    'completed not returned from tech': 'Completed Not Returned from engineer',
    'completed not returned from tech.': 'Completed Not Returned from engineer',
    'completed not returned from technician': 'Completed Not Returned from engineer',
    'completed not returned from engineer': 'Completed Not Returned from engineer',
    'returned for processing acct. mngr.': 'Returned for processing Acct. Mngr.',
    'returned from tech. for processing by acct. mngr.': 'Returned for processing Acct. Mngr.',
    'returned from technician for processing by account manager': 'Returned for processing Acct. Mngr.',
    'returned from missing data': 'Returned for processing Acct. Mngr.',
    'completed and returned with missing data': 'Completed and Returned with Missing Data',
    'completed and returned from technician with missing data': 'Completed and Returned with Missing Data',
    'completed and returned with equipment problem': 'Completed and Returned with Missing Data',

    // Site issues
    'down sites': 'Down Sites',
    'sites with equipment problem': 'Sites with Equipment Problem',

    // Job review and costing
    'jobs in review by part dep.': 'Completed Parts',
    'jobs in review by parts department': 'Completed Parts',
    'completed parts': 'Completed Parts',
    'jobs in technical review': 'Completed Tech Review',
    'jobs in review by technical manager': 'Completed Tech Review',
    'completed tech review': 'Completed Tech Review',
    'jobs in manager review': 'Completed Manager Review',
    'jobs in review by manager': 'Completed Manager Review',
    'completed manager review': 'Completed Manager Review',
    't&m job costing by accounting': 'Completed Costing',
    'tm job costing by accounting': 'Completed Costing',
    'completed costing': 'Completed Costing',
    'fs job costing': 'Completed FS Costing',
    'full service job costing by accounting': 'Completed FS Costing',
    'completed fs costing': 'Completed FS Costing',
    'liebert fs costing': 'Liebert FS Costing',
    'completed non fs costing': 'Completed Non FS Costing',
    'misc': 'Misc',
    'posting': 'Posting',

    // Contract and invoice data
    'contract invoice month to date': 'Contract Invoice Month to Date',
    'contracts invoiced month to date': 'Contract Invoice Month to Date',

    // Invoicing
    'jobs invoiced today': 'Jobs Invoiced Today',
    'service call invoiced today': 'Service Call Invoiced today',
    'jobs invoiced yesterday': 'Jobs Invoiced yesterday',
    'service call invoiced yesterday': 'Jobs Invoiced Yesterday',
    'jobs invoiced month to date': 'Jobs Invoiced Month to Date',
    'service call invoice month to date': 'Service Call Invoice Month to Date',
    'jobs waiting for contract': 'Waiting For Contract',
    'waiting for contract': 'Waiting For Contract',
    'liebert jobs to be invoiced (blb or mis)': 'Liebert Jobs to Invoice',
    't+m jobs to be mailed (blb or mis)': 'Non-FS Jobs to Invoice',
    'fs jobs to be mailed (blb or mis)': 'Completed FS Costing',

    // Invoice aging
    'current invoices': 'Current Invoices',
    'invoices - 1 to 30 days': 'Invoices - 1 to 30 days',
    'invoices - 31 to 60 days': 'Invoices - 31 to 60 days',
    'invoices - 61 to 90 days': 'Invoices - 61 to 90 days',
    'invoices - 91  days': 'Invoices - 91+ days',
    'invoices - 91+ days': 'Invoices - 91+ days',

    // Purchase orders
    'purchase order to be completed': 'Purchase Order to be Completed',
    'open purchase orders that have to be received': 'Open Purchase Orders',
    'received pos that have to be reconciled': 'Received Purchase Orders',

    // Mail and document types
    'posting with misc': 'Standard Mail',
    'e-mail': 'Email',
    'email': 'Email',
    'online/xign': 'Online/Xign',
    'filing': 'Filing',

    // Parts and equipment tracking
    'jobs (to be tracked)-part shipped from dc group': 'Jobs (To be Tracked)-Part Shipped from DC Group',
    'jobs (to be tracked)-part shipped from vendors': 'Jobs (To be Tracked)-Part Shipped from Vendors',
    'crash kit': 'Crash Kits',
    'crashkit': 'Crash Kits',
    'load bank': 'Load Banks',
    'loadbank': 'Load Banks',
    'past part reqs': 'Past Part Requisitions',
    'pastpartreqs': 'Past Part Requisitions',
    'reqs to process next four days': 'Part Requisitions - Next 4 Days',
    'reqstoprocessnextfourdays': 'Part Requisitions - Next 4 Days',
    'total reqs to process': 'All Part Requisitions',
    'totalreqstoprocess': 'All Part Requisitions',

    // Contract billing
    'liebert contracts not billed as of yesterday': 'Liebert Contracts not billed as of yesterday',
    'non liebert contracts not billed as of yesterday': 'Non Liebert Contracts not billed as of yesterday',
    'liebert contracts to be billed in next 30 days': 'Liebert Contracts to be billed in next 30 days',
    'non liebert contracts to be billed in next 30 days': 'Non Liebert Contracts to be billed in next 30 days',
    'liebert contracts to be billed in next 60 days': 'Liebert Contracts to be billed in next 60 days',
    'non liebert contracts to be billed in next 60 days': 'Non Liebert Contracts to be billed in next 60 days',
    'liebert contracts to be billed in next 90 days': 'Liebert Contracts to be billed in next 90 days',
    'non liebert contracts to be billed in next 90 days': 'Non Liebert Contracts to be billed in next 90 days',
    'liebert contracts to be billed after 90 days': 'Liebert Contracts to be billed after 90 days',
    'non liebert contracts to be billed after 90 days': 'Non Liebert Contracts to be billed after 90 days'
  };

  constructor(
    private reportService: ReportService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Get query parameters from route
    const sub = this.route.queryParams.subscribe(params => {
      this.detailPage = params['detailPage'] || params['Page'] || '';
      this.offId = params['offId'] || params['dataSetName'];
      this.dataSetName = params['dataSetName'];
      this.page = params['page'];
      this.month = params['month'];
      
      // Normalize legacy parameters to new API format
      // First check if detailPage contains a legacy value and normalize it
      if (this.detailPage) {
        const normalizedDetailPage = this.normalizeLegacyDataSetName(this.detailPage);
        if (normalizedDetailPage !== this.detailPage) {
          this.detailPage = normalizedDetailPage;
        }
      }
      
      // Then check if dataSetName should be used (for backward compatibility)
      if (this.dataSetName && !this.detailPage) {
        this.detailPage = this.normalizeLegacyDataSetName(this.dataSetName);
      }
      
      this.useLegacyApi = !!(this.page || this.month);
      
      if (this.detailPage || this.dataSetName) {
        this.loadCallsDetail();
      } else {
        this.error = 'No detail page or data set specified';
      }
    });
    
    this.subscriptions.push(sub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Load calls detail data from API
   */
  loadCallsDetail(): void {
    this.isLoading = true;
    this.error = null;
    
    let sub;
    
    const unscheduledDetailPageNames = [
      'Jobs to to Scheduled for Next 90 Days',
      'Past Due Unscheduled Jobs',
      'Unscheduled Jobs',
      'Jobs to Scheduled for Next 90 Days'  // alternative spelling
    ];
    
    const isUnscheduledJob = unscheduledDetailPageNames.some(name => 
      this.detailPage && this.detailPage.toLowerCase().includes(name.toLowerCase()) || 
      this.detailPage === name
    );
    
    // Check if this is for unscheduled jobs with offId - automatically convert to legacy API
    if ((isUnscheduledJob && this.offId) || (this.detailPage === 'Jobs to to Scheduled for Next 90 Days' && this.offId)) {
      // Auto-convert old format to legacy API format for unscheduled jobs
      sub = this.reportService.getDisplayCallsDetailLegacy(
        this.offId, 
        'UnschedActMngr', 
        undefined, 
        undefined
      ).subscribe({
        next: (response: NewDisplayCallsDetailResponse) => {
          this.handleSuccessResponse(response);
          this.isLoading = false;
        },
        error: (error) => {
          this.error = error.error?.message || 'Failed to load calls detail data';
          this.isLoading = false;
        }
      });
    } else if (this.useLegacyApi && this.dataSetName) {
      // Use legacy API
      sub = this.reportService.getDisplayCallsDetailLegacy(
        this.dataSetName, 
        this.page, 
        this.month, 
        this.offId
      ).subscribe({
        next: (response: NewDisplayCallsDetailResponse) => {
          this.handleSuccessResponse(response);
          this.isLoading = false;
        },
        error: (error) => {
          this.error = error.error?.message || 'Failed to load calls detail data';
          this.isLoading = false;
        }
      });
    } else {
      // Use regular API
      sub = this.reportService.getDisplayCallsDetail(this.detailPage, this.offId).subscribe({
        next: (response: NewDisplayCallsDetailResponse) => {
          this.handleSuccessResponse(response);
          this.isLoading = false;
        },
        error: (error) => {
          this.error = error.error?.message || 'Failed to load calls detail data';
          this.isLoading = false;
        }
      });
    }
    
    this.subscriptions.push(sub);
  }

  /**
   * Handle successful API response
   */
  private handleSuccessResponse(response: NewDisplayCallsDetailResponse): void {
    // Store response metadata
    this.originalParameter = response.originalParameter || this.detailPage;
    this.mappedParameter = response.mappedParameter || this.detailPage;
    this.parameterMapped = response.parameterMapped || false;
    this.executionTimeMs = response.executionTimeMs || 0;
    
    // Process data
    this.displayData = response.data || [];
    this.totalsData = response.totals || [];
    this.totalRecords = this.displayData.length;
    
    // Extract columns from first data row, excluding classId
    if (this.displayData.length > 0) {
      this.columns = Object.keys(this.displayData[0]).filter(col => 
        col.toLowerCase() !== 'classid' && col.toLowerCase() !== 'class id'
      );
    }
    
    // Show warning if no data
    if (this.displayData.length === 0 && response.message) {
      this.error = response.message;
    }
  }

  /**
   * Get sorted and paginated data for current page
   */
  get paginatedData(): any[] {
    let data = [...this.displayData];
    
    // Apply sorting if a sort column is selected
    if (this.sortColumn) {
      data.sort((a, b) => {
        const aVal = a[this.sortColumn];
        const bVal = b[this.sortColumn];
        
        // Handle null/undefined values
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return this.sortDirection === 'asc' ? 1 : -1;
        if (bVal == null) return this.sortDirection === 'asc' ? -1 : 1;
        
        // Compare values
        let comparison = 0;
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          comparison = aVal.toLowerCase().localeCompare(bVal.toLowerCase());
        } else if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else if (aVal instanceof Date && bVal instanceof Date) {
          comparison = aVal.getTime() - bVal.getTime();
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }
        
        return this.sortDirection === 'asc' ? comparison : -comparison;
      });
    }
    
    // Apply pagination
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return data.slice(startIndex, endIndex);
  }

  /**
   * Get total number of pages
   */
  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize);
  }

  /**
   * Navigate to specific page
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  /**
   * Change page size
   */
  changePageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 1; // Reset to first page
  }

  /**
   * Refresh data
   */
  refresh(): void {
    this.loadCallsDetail();
  }

  /**
   * Navigate back
   */
  goBack(): void {
    this.router.navigate(['/graphs/account-manager-graph']);
  }

  /**
   * Format column name for display
   */
  formatColumnName(column: string): string {
    // Convert camelCase or PascalCase to Title Case with spaces
    return column
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  }

  /**
   * Format cell value for display
   */
  formatCellValue(value: any): string {
    if (value === null || value === undefined) {
      return '-';
    }
    
    // Check if it's a date
    if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString();
      }
    }
    
    // Check if it's a boolean
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    
    return String(value);
  }

  /**
   * Handle column sort
   */
  sortBy(column: string): void {
    if (this.sortColumn === column) {
      // Toggle sort direction if clicking same column
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new sort column and reset to ascending
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    // Reset to first page when sorting
    this.currentPage = 1;
  }

  /**
   * Export data to CSV
   */
  exportToCSV(): void {
    if (this.displayData.length === 0) {
      return;
    }
    
    // Create CSV content
    const headers = this.columns.join(',');
    const rows = this.displayData.map(row => 
      this.columns.map(col => {
        const value = row[col];
        // Escape quotes and wrap in quotes if contains comma
        const stringValue = String(value || '').replace(/"/g, '""');
        return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
      }).join(',')
    );
    
    const csvContent = [headers, ...rows].join('\n');
    
    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${this.detailPage}_${new Date().toISOString()}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Get row styling classes based on color coding rules
   * Applies different background and text colors based on report type and data conditions
   */
  getRowStyleClass(row: any): string {
    const reportType = (this.detailPage || this.dataSetName || '').toLowerCase();
    const classes: string[] = [];
    
    // Get description and condition values from row
    const description = this.getRowDescription(row);
    const hasQuotedAmount = this.hasQuotedAmount(row);
    const isRedTextItem = this.isRedTextItem(row, reportType);
    const isVerified = this.isVerifiedItem(row, reportType);
    const isEmergency = description && description.includes('emergency job');
    const isNonPMJob = description && description.includes('not a pm job');
    const isAdditionalCharges = description && description.includes('additional charges');
    const isBillable = description && description.toLowerCase().includes('bill after pm') || (description && description.toLowerCase().includes('could be billed'));
    const hasPartsExist = description && (description.toLowerCase().includes('parts exist') || description.toLowerCase().includes('parts exists'));
    
    // Quoted amount > 0 - red text (highest priority)
    if (hasQuotedAmount) {
      classes.push('row-red-text');
    }
    // Verified items - light green
    else if (isVerified) {
      classes.push('row-verified');
    }
    // Emergency jobs - purple background
    else if (isEmergency) {
      classes.push('row-emergency');
    }
    // Non-PM jobs - blue background
    else if (isNonPMJob) {
      classes.push('row-non-pm');
    }
    // Additional charges - red background
    else if (isAdditionalCharges) {
      classes.push('row-additional-charges');
    }
    // Billable items - orange background
    else if (isBillable) {
      classes.push('row-billable');
    }
    // Parts exist - yellow background
    else if (hasPartsExist) {
      classes.push('row-parts-exist');
    }
    // Red text items - high amounts or quoted items
    else if (isRedTextItem) {
      classes.push('row-red-text');
    }
    
    return classes.join(' ');
  }

  /**
   * Get description field value from row
   */
  private getRowDescription(row: any): string {
    // Try common description column names first
    const descriptionColumns = ['description', 'Description', 'desc', 'Desc', 'notes', 'Notes', 'remarks', 'Remarks', 'comments', 'Comments'];
    for (const col of descriptionColumns) {
      if (row[col]) {
        return String(row[col]).toLowerCase();
      }
    }
    
    // If not found in common columns, search all columns for ones containing text data
    for (const key in row) {
      const value = row[key];
      if (value && typeof value === 'string' && value.length > 10) {
        // Check if this looks like a description (longer text field)
        const lowerValue = String(value).toLowerCase();
        if (lowerValue.includes('parts') || lowerValue.includes('charge') || 
            lowerValue.includes('emergency') || lowerValue.includes('pm') ||
            lowerValue.includes('billed') || lowerValue.includes('return')) {
          return lowerValue;
        }
      }
    }
    
    return '';
  }

  /**
   * Check if row should have red text (for amounts > threshold)
   */
  private isRedTextItem(row: any, reportType: string): boolean {
    // Get amount value from row
    const amount = this.getRowAmount(row);
    const isTMJob = this.isTMJob(row);
    
    // Check for T&M jobs in account manager and related reports
    if (reportType.includes('returned for processing') || 
        reportType.includes('completed and returned')) {
      if (isTMJob || (amount && amount > 0)) {
        return true;
      }
    }
    
    if (!amount || amount <= 0) return false;
    
    // Different thresholds for different report types
    if (reportType.includes('jobs invoiced yesterday')) {
      return amount > 10000; // Over $10,000
    }
    
    // For other report types, show red for any positive amount in specific columns
    if (reportType.includes('manager review') || 
        reportType.includes('completed not returned') ||
        reportType.includes('returned for processing') ||
        reportType.includes('unschedulacct') || 
        reportType.includes('unscheduled account manager')) {
      return amount > 0;
    }
    
    return false;
  }

  /**
   * Check if job is T&M (Time & Materials) type
   */
  private isTMJob(row: any): boolean {
    const tmColumns = ['type', 'Type', 'jobType', 'JobType', 'jobCategory', 'JobCategory'];
    
    for (const col of tmColumns) {
      if (row[col]) {
        const val = String(row[col]).toLowerCase().trim();
        if (val === 't&m' || val === 'time and materials' || val === 'time & materials') {
          return true;
        }
      }
    }
    
    // Check description for T&M mention
    const description = this.getRowDescription(row);
    if (description && (description.includes('t&m') || description.includes('time and materials'))) {
      return true;
    }
    
    return false;
  }

  /**
   * Get amount value from row (tries common amount column names)
   */
  private getRowAmount(row: any): number {
    const amountColumns = ['amount', 'Amount', 'total', 'Total', 'value', 'Value', 'balance', 'Balance'];
    for (const col of amountColumns) {
      if (row[col] !== undefined && row[col] !== null) {
        const val = Number(row[col]);
        if (!isNaN(val)) {
          return val;
        }
      }
    }
    return 0;
  }

  /**
   * Check if item is verified (for Manager Review reports)
   */
  private isVerifiedItem(row: any, reportType: string): boolean {
    if (!reportType.includes('manager review')) return false;
    
    const verifiedColumns = ['verified', 'Verified', 'isVerified', 'IsVerified'];
    for (const col of verifiedColumns) {
      if (row[col]) {
        const val = String(row[col]).toLowerCase();
        return val === 'true' || val === 'yes';
      }
    }
    return false;
  }

  /**
   * Get displayed value for a cell, applying transformations
   * This is called from the template for each cell
   */
  getCellDisplayValue(row: any, column: string): string {
    const value = row[column];
    
    // Check if this is a description column
    const descriptionColumns = ['description', 'Description', 'desc', 'Desc', 'notes', 'Notes', 'remarks', 'Remarks', 'comments', 'Comments'];
    const isDescriptionColumn = descriptionColumns.some(col => column.toLowerCase() === col.toLowerCase());
    
    // If quoted amount > 0 and this is the description column, show "Quoted"
    if (isDescriptionColumn && this.hasQuotedAmount(row)) {
      return 'Quoted';
    }
    
    // Otherwise apply normal transformations
    return this.formatCellValue(this.getTransformedDescription(value));
  }

  /**
   * Transform description text according to legacy rules
   */
  private getTransformedDescription(value: any): string {
    if (!value) return value; // Return as-is for null/undefined - formatCellValue will handle it
    
    let text = String(value);
    
    // Text transformations from legacy system
    if (text.toLowerCase().includes('parts exist')) {
      text = text.replace(/Parts Exist/gi, 'Parts Exists');
    }
    if (text.toLowerCase().includes('could be billed')) {
      text = text.replace(/Could be billed/gi, 'Bill After PM');
    }
    
    return text;
  }

  /**
   * Check if row has quoted amount > 0
   * In Manager Review reports and others, when Amount > 0, it means "Quoted"
   */
  private hasQuotedAmount(row: any): boolean {
    // Try common amount columns that represent quoted amounts
    const quotedColumns = ['quotedAmount', 'QuotedAmount', 'quoted', 'Quoted', 'quoteAmount', 'QuoteAmount'];
    
    for (const col of quotedColumns) {
      if (row[col] !== undefined && row[col] !== null) {
        const val = Number(row[col]);
        if (!isNaN(val) && val > 0) {
          return true;
        }
      }
    }
    
    // Search all columns for ones that might be quoted amount
    for (const key in row) {
      const colLower = key.toLowerCase();
      if (colLower.includes('quoted') || colLower.includes('quote')) {
        const val = Number(row[key]);
        if (!isNaN(val) && val > 0) {
          return true;
        }
      }
    }
    
    // Also check generic amount columns for amounts > 0 in specific report types
    const reportType = (this.detailPage || this.dataSetName || '').toLowerCase();
    if (reportType.includes('manager review')) {
      const managerReviewAmountColumns = ['amount', 'Amount'];
      for (const col of managerReviewAmountColumns) {
        if (row[col] !== undefined && row[col] !== null) {
          const val = Number(row[col]);
          if (!isNaN(val) && val > 0) {
            return true;
          }
        }
      }
    }
    
    return false;
  }

  /**
   * Check if a cell should have red text styling
   */
  getCellStyleClass(row: any, column: string): string {
    const reportType = (this.detailPage || this.dataSetName || '').toLowerCase();
    const value = row[column];
    
    // Apply red text styling to amount columns for certain report types
    const amountColumns = ['amount', 'Amount', 'total', 'Total', 'value', 'Value', 'balance', 'Balance'];
    const isAmountColumn = amountColumns.some(col => column.toLowerCase() === col.toLowerCase());
    
    if (isAmountColumn) {
      const num = Number(value);
      if (!isNaN(num) && this.isRedTextItem(row, reportType)) {
        return 'cell-red-text';
      }
    }
    
    return '';
  }

  /**
   * Normalize legacy DataSetName to new API parameter format
   * Maps old case-sensitive names from legacy system to standardized detail page names
   */
  private normalizeLegacyDataSetName(dataSetName: string): string {
    if (!dataSetName) return '';
    
    // Normalize to lowercase for case-insensitive matching
    const normalized = dataSetName.toLowerCase().trim();
    
    // Look up in mapping
    const mapped = this.LEGACY_DATASET_MAPPING[normalized];
    if (mapped) {
      return mapped;
    }
    
    // If no exact match, try partial matching for common variants
    for (const [key, value] of Object.entries(this.LEGACY_DATASET_MAPPING)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return value;
      }
    }
    
    // If still no match, return as-is (it might already be normalized)
    return dataSetName;
  }
}
