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
  
  // Subscriptions
  private subscriptions: Subscription[] = [];

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
      
      console.log('[DETAIL INIT] Raw params received from route:', params);
      console.log('[DETAIL INIT] Parsed values:', {
        detailPage: this.detailPage,
        offId: this.offId,
        dataSetName: this.dataSetName,
        page: this.page,
        month: this.month
      });
      
      // Determine if we should use legacy API
      // Use legacy API if: page/month params present OR dataSetName param present (accounting-status comes with dataSetName)
      this.useLegacyApi = !!(this.page || this.month || this.dataSetName);
      
      console.log('[DETAIL INIT] useLegacyApi flag:', this.useLegacyApi);
      
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
    
    console.log('[DISPLAY DETAIL] Loading with params:', {
      detailPage: this.detailPage,
      detailPageLower: this.detailPage?.toLowerCase(),
      offId: this.offId,
      dataSetName: this.dataSetName,
      page: this.page,
      month: this.month,
      useLegacyApi: this.useLegacyApi,
      isUnscheduledJob: isUnscheduledJob
    });
    
    // Check if this is for unscheduled jobs with offId - automatically convert to legacy API
    if ((isUnscheduledJob && this.offId) || (this.detailPage === 'Jobs to to Scheduled for Next 90 Days' && this.offId)) {
      console.log('[DISPLAY DETAIL] 🔄 CONVERTING TO LEGACY API - Unscheduled Job Detected!');
      console.log('[DISPLAY DETAIL] Calling: getDisplayCallsDetailLegacy(', this.offId, ', UnschedActMngr, undefined, undefined)');
      
      // Auto-convert old format to legacy API format for unscheduled jobs
      sub = this.reportService.getDisplayCallsDetailLegacy(
        this.offId, 
        'UnschedActMngr', 
        undefined, 
        undefined
      ).subscribe({
        next: (response: NewDisplayCallsDetailResponse) => {
          console.log('[DISPLAY DETAIL] Legacy API response received:', response);
          this.handleSuccessResponse(response);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('[DISPLAY DETAIL] Legacy API error:', error);
          this.error = error.error?.message || 'Failed to load calls detail data';
          this.isLoading = false;
        }
      });
    } else if (this.useLegacyApi && this.dataSetName && !this.page && !this.month) {
      // Coming from accounting-status with dataSetName only (no page/month)
      console.log('[DISPLAY DETAIL] Using LEGACY API with dataSetName from Accounting Status');
      console.log('[DISPLAY DETAIL] Calling: getDisplayCallsDetailLegacy(', this.dataSetName, ', undefined, undefined, undefined)');
      
      sub = this.reportService.getDisplayCallsDetailLegacy(
        this.dataSetName, 
        undefined, 
        undefined, 
        undefined
      ).subscribe({
        next: (response: NewDisplayCallsDetailResponse) => {
          console.log('[DISPLAY DETAIL] Legacy API response received:', response);
          this.handleSuccessResponse(response);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('[DISPLAY DETAIL] Legacy API error:', error);
          this.error = error.error?.message || 'Failed to load calls detail data';
          this.isLoading = false;
        }
      });
    } else if (this.useLegacyApi && this.dataSetName) {
      console.log('[DISPLAY DETAIL] Using LEGACY API (page/month params present)');
      console.log('[DISPLAY DETAIL] Calling: getDisplayCallsDetailLegacy(', this.dataSetName, ',', this.page, ',', this.month, ',', this.offId, ')');
      
      // Use legacy API
      sub = this.reportService.getDisplayCallsDetailLegacy(
        this.dataSetName, 
        this.page, 
        this.month, 
        this.offId
      ).subscribe({
        next: (response: NewDisplayCallsDetailResponse) => {
          console.log('[DISPLAY DETAIL] Legacy API response received:', response);
          this.handleSuccessResponse(response);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('[DISPLAY DETAIL] Legacy API error:', error);
          this.error = error.error?.message || 'Failed to load calls detail data';
          this.isLoading = false;
        }
      });
    } else {
      console.log('[DISPLAY DETAIL] Using REGULAR API (no legacy indicators)');
      console.log('[DISPLAY DETAIL] Calling: getDisplayCallsDetail(', this.detailPage, ',', this.offId, ')');
      
      // Use regular API
      sub = this.reportService.getDisplayCallsDetail(this.detailPage, this.offId).subscribe({
        next: (response: NewDisplayCallsDetailResponse) => {
          console.log('[DISPLAY DETAIL] Regular API response received:', response);
          this.handleSuccessResponse(response);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('[DISPLAY DETAIL] Regular API error:', error);
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
    
    // Extract columns from first data row
    if (this.displayData.length > 0) {
      this.columns = Object.keys(this.displayData[0]);
    }
    
    // Show warning if no data
    if (this.displayData.length === 0 && response.message) {
      this.error = response.message;
    }
  }

  /**
   * Get paginated data for current page
   */
  get paginatedData(): any[] {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.displayData.slice(startIndex, endIndex);
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
}
