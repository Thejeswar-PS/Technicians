import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ReportService } from '../../../core/services/report.service';
import { CommonService } from '../../../core/services/common.service';
import { AuthService } from '../../../modules/auth/services/auth.service';
import { AccountManager } from '../../../core/model/account-manager.model';
import {
  AccMgrPerformanceReportResponseDto,
  AccMgrPerformanceReportSummaryDto
} from '../../../core/model/account-manager-performance-report.model';
import { EmployeeStatusDto } from '../../../core/model/employee-status.model';

@Component({
  selector: 'app-acc-mgr-performance-report',
  templateUrl: './acc-mgr-performance-report.component.html',
  styleUrls: ['./acc-mgr-performance-report.component.scss']
})
export class AccMgrPerformanceReportComponent implements OnInit, OnDestroy {
  // Math object for template access
  Math = Math;
  
  reportForm: FormGroup;
  reportData: AccMgrPerformanceReportResponseDto | null = null;
  summaryData: AccMgrPerformanceReportSummaryDto | null = null;
  accountManagers: AccountManager[] = [];
  isLoading = false;
  isLoadingAccountManagers = false;
  errorMessage: string | null = null;
  
  // Active section for tabbed view
  activeSection = 'returnedForProcessing';

  monthLabels: string[] = [];
  
  // Role-based filtering properties
  hasPageAccess: boolean = true;
  empID: string = '';
  windowsID: string = '';
  userRole: string = '';
  employeeStatus: string = '';
  currentUserStatus: EmployeeStatusDto | null = null;
  employeeStatusLoaded: boolean = false;
  accountManagersLoaded: boolean = false;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 100;
  totalItems = 0;

  // Sorting
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  private routeOfficeId: string = '';
  private routeSection: string = '';
  private routeSectionApplied = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private commonService: CommonService,
    private route: ActivatedRoute,
    private auth: AuthService
  ) {
    this.reportForm = this.fb.group({
      officeId: [{ value: '', disabled: false }, [Validators.required, Validators.maxLength(11)]]
    });
  }

  ngOnInit(): void {
    this.monthLabels = this.getMonthLabels();

    this.route.queryParams.subscribe(params => {
      this.routeOfficeId = (params['officeId'] || '').toString().trim();
      this.routeSection = (params['section'] || '').toString().trim();
      this.routeSectionApplied = false;
    });
    
    // Initialize role-based filtering first
    this.determineEmployeeStatus();
  }

  private getMonthLabels(baseDate: Date = new Date()): string[] {
    const labels: string[] = [];
    for (let i = 0; i < 5; i++) {
      const date = new Date(baseDate.getFullYear(), baseDate.getMonth() + i, 1);
      labels.push(date.toLocaleString('en-US', { month: 'long' }));
    }
    return labels;
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Generate the performance report
   */
  generateReport(filterType?: string, preferredSection?: string): void {
    const officeId = this.reportForm.get('officeId')?.value || '';
    
    // Check if we have a valid office ID instead of form validation
    if (!officeId || officeId.trim() === '') {
      this.markFormGroupTouched();
      return;
    }
    this.isLoading = true;
    this.errorMessage = null;
    
    let roJobs = '';

    // Apply RedOrange filter if specified
    if (filterType === 'RedOrange') {
      roJobs = 'RedOrange';
    }

    // Get comprehensive report data with role-based filtering
    const reportSub = this.reportService.getAccMgrPerformanceReport(officeId, roJobs, this.empID, this.windowsID).subscribe({
      next: (data) => {
        this.reportData = data;
        this.isLoading = false;

        if (preferredSection && this.isAllowedSection(preferredSection)) {
          this.activeSection = preferredSection;
          this.routeSectionApplied = true;
          return;
        }
        
        // If this is a RedOrange (Critical Jobs) filter, set active section to show data
        if (filterType === 'RedOrange') {
          // Check which section has data and set it as active
          if (data.CompletedNotReturned?.length || data.completedNotReturned?.length) {
            this.activeSection = 'completedNotReturned';
          } else if (data.ReturnedForProcessing?.length || data.returnedForProcessing?.length) {
            this.activeSection = 'returnedForProcessing';
          } else if (data.PastDueUnscheduled?.length || data.pastDueUnscheduled?.length) {
            this.activeSection = 'pastDueUnscheduled';
          } else if (data.FirstMonth?.length || data.firstMonth?.length) {
            this.activeSection = 'firstMonth';
          } else if (data.ReturnedWithIncompleteData?.length || data.returnedWithIncompleteData?.length) {
            this.activeSection = 'returnedWithIncompleteData';
          } else {
            // Default to first available section for critical jobs
            this.activeSection = 'completedNotReturned';
          }
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'An error occurred while generating the report';
      }
    });

    // Get summary data with role-based filtering
    const summarySub = this.reportService.getAccMgrPerformanceReportSummary(officeId, roJobs, this.empID, this.windowsID).subscribe({
      next: (data) => {
        this.summaryData = data;
      },
      error: (error) => {
      }
    });

    this.subscriptions.push(reportSub, summarySub);
  }

  /**
   * Load account managers from the existing service
   */
  loadAccountManagers(): void {
    this.isLoadingAccountManagers = true;
    this.reportForm.get('officeId')?.disable();
    
    const accountManagerSub = this.commonService.getAccountManagers().subscribe({
      next: (data: any[]) => {
        if (data && data.length > 0) {
          // Convert to AccountManager format, preserving original properties
          this.accountManagers = data.map(item => ({
            // Preserve original properties from API response
            ...item,
            // Add mapped properties for consistency
            empName: item.empName || item.name || item.username || item.offname || item.offName,
            empId: item.empId || item.id || item.offid,
            OFFNAME: item.OFFNAME || item.officeName || item.offname || item.offName || item.empName || item.name,
            OFFID: item.OFFID || item.officeId || item.offid || item.empId || item.id
          }));
          
          this.accountManagersLoaded = true;
          this.applyRoleBasedDefaults();
        }
        this.isLoadingAccountManagers = false;
        this.reportForm.get('officeId')?.enable();
      },
      error: (error) => {
        this.isLoadingAccountManagers = false;
        this.reportForm.get('officeId')?.enable();
        console.error('Error loading account managers:', error);
      }
    });

    this.subscriptions.push(accountManagerSub);
  }

  /**
   * Export report data to CSV
   */
  exportToCSV(section: string): void {
    if (!this.reportData) return;

    let data: any[] = [];
    let filename = '';

    switch (section) {
      case 'completedNotReturned':
        data = this.reportData.completedNotReturned;
        filename = 'completed-not-returned.csv';
        break;
      case 'returnedForProcessing':
        data = this.reportData.returnedForProcessing;
        filename = 'returned-for-processing.csv';
        break;
      case 'jobsScheduledToday':
        data = this.reportData.jobsScheduledToday;
        filename = 'jobs-scheduled-today.csv';
        break;
      case 'jobsConfirmedNext120Hours':
        data = this.reportData.jobsConfirmedNext120Hours;
        filename = 'jobs-confirmed-next-120-hours.csv';
        break;
      case 'returnedIncomplete':
        data = this.reportData.returnedIncompleteData;
        filename = 'returned-incomplete-data.csv';
        break;
      case 'customerConfirmed':
        data = this.reportData.customerConfirmedData;
        filename = 'customer-confirmed-next-120-hours.csv';
        break;
      case 'monthlyUnscheduled':
        const monthly = this.reportData.monthlyUnscheduledJobs;
        data = monthly ? [...(monthly.currentMonth || []), ...(monthly.previousMonth || [])] : [];
        filename = 'monthly-unscheduled-jobs.csv';
        break;
      case 'pastDueUnscheduled':
        data = this.reportData.pastDueUnscheduled;
        filename = 'past-due-unscheduled.csv';
        break;
      default:
        return;
    }

    this.downloadCSV(data, filename);
  }

  /**
   * Download data as CSV file
   */
  private downloadCSV(data: any[], filename: string): void {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    window.URL.revokeObjectURL(url);
  }

  /**
   * Get CSS class based on row data status/priority
   */
  getRowClass(statusOrPriority: string): string {
    if (!statusOrPriority) return '';
    
    const status = statusOrPriority.toLowerCase();
    
    // Priority-based classes (from legacy SetLabelText method)
    if (status.includes('red') || status.includes('critical') || status === 'high') {
      return 'table-danger';
    }
    if (status.includes('orange') || status.includes('urgent')) {
      return 'table-warning';
    }
    if (status.includes('yellow') || status === 'medium') {
      return 'table-light';
    }
    if (status.includes('green') || status === 'low' || status === 'normal') {
      return 'table-success';
    }
    
    return '';
  }

  /**
   * Get badge class for priority display
   */
  getPriorityBadgeClass(priority: string): string {
    if (!priority) return 'badge badge-light';
    
    const priorityLower = priority.toLowerCase();
    
    if (priorityLower.includes('red') || priorityLower.includes('critical') || priorityLower === 'high') {
      return 'badge badge-danger';
    }
    if (priorityLower.includes('orange') || priorityLower.includes('urgent')) {
      return 'badge badge-warning';
    }
    if (priorityLower.includes('yellow') || priorityLower === 'medium') {
      return 'badge badge-info';
    }
    if (priorityLower.includes('green') || priorityLower === 'low' || priorityLower === 'normal') {
      return 'badge badge-success';
    }
    
    return 'badge badge-light';
  }

  /**
   * Set active section for tabbed navigation
   */
  setActiveSection(section: string): void {
    this.activeSection = section;
    this.currentPage = 1; // Reset to first page when switching sections
    this.sortColumn = '';
    this.sortDirection = 'asc';
  }

  onOfficeChange(): void {
    const officeId = this.reportForm.get('officeId')?.value || '';
    if (!officeId || officeId.trim() === '') {
      return;
    }
    this.generateReport();
  }

  /**
   * Check if form field has error
   */
  hasError(fieldName: string): boolean {
    const field = this.reportForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Get error message for form field
   */
  getErrorMessage(fieldName: string): string {
    const field = this.reportForm.get(fieldName);
    if (field?.errors?.['required']) {
      return `${fieldName} is required`;
    }
    if (field?.errors?.['maxlength']) {
      return `${fieldName} cannot exceed ${field.errors['maxlength'].requiredLength} characters`;
    }
    return '';
  }

  /**
   * Mark all form fields as touched
   */
  private markFormGroupTouched(): void {
    Object.keys(this.reportForm.controls).forEach(key => {
      const control = this.reportForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Clear the report data and form
   */
  clearReport(): void {
    this.reportData = null;
    this.summaryData = null;
    this.errorMessage = null;
    this.activeSection = 'returnedForProcessing';
  }

  /**
   * Get formatted date string in dd-MMM-yyyy format
   */
  formatDate(dateString: string): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    } catch {
      return dateString;
    }
  }

  /**
   * Get contract number from item, checking multiple possible property names
   */
  getContractNumber(item: any): string {
    // ContractNo is mapped from "Contract No" column in backend
    return item.ContractNo || 
           item.contractNo || 
           item.contnbr || 
           item.contractNumber || 
           item['Contract No'] || 
           '';
  }

  /**
   * Get formatted currency string
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }

  /**
   * Get active data for current section
   */
  getActiveData(): any[] {
    if (!this.reportData) return [];
    
    switch (this.activeSection) {
      case 'completedNotReturned':
        return this.reportData.CompletedNotReturned || this.reportData.completedNotReturned || [];
      case 'returnedForProcessing':
        return this.reportData.ReturnedForProcessing || this.reportData.returnedForProcessing || [];
      case 'jobsScheduledToday':
        return this.reportData.JobsScheduledToday || this.reportData.jobsScheduledToday || [];
      case 'jobsConfirmedNext120Hours':
        return this.reportData.JobsConfirmedNext120Hours || this.reportData.jobsConfirmedNext120Hours || [];
      case 'returnedWithIncompleteData':
        return this.reportData.ReturnedWithIncompleteData || this.reportData.returnedWithIncompleteData || [];
      case 'returnedIncomplete':
        return this.reportData.ReturnedWithIncompleteData || this.reportData.returnedIncompleteData || [];
      case 'customerConfirmed':
        return this.reportData.customerConfirmedData || [];
      case 'monthlyUnscheduled':
        const monthly = this.reportData.monthlyUnscheduledJobs;
        return monthly ? [...(monthly.currentMonth || []), ...(monthly.previousMonth || [])] : [];
      case 'firstMonth':
        return this.reportData.FirstMonth || this.reportData.firstMonth || [];
      case 'secondMonth':
        return this.reportData.SecondMonth || this.reportData.secondMonth || [];
      case 'thirdMonth':
        return this.reportData.ThirdMonth || this.reportData.thirdMonth || [];
      case 'fourthMonth':
        return this.reportData.FourthMonth || this.reportData.fourthMonth || [];
      case 'fifthMonth':
        return this.reportData.FifthMonth || this.reportData.fifthMonth || [];
      case 'pastDueUnscheduled':
        return this.reportData.PastDueUnscheduled || this.reportData.pastDueUnscheduled || [];
      default:
        return [];
    }
  }

  /**
   * Calculate total records across all sections
   */
  getTotalRecords(): number {
    if (!this.reportData) return 0;
    
    return this.reportData.completedNotReturned.length +
           this.reportData.returnedForProcessing.length +
           this.reportData.jobsScheduledToday.length +
           this.reportData.jobsConfirmedNext120Hours.length +
           this.reportData.returnedWithIncompleteData.length +
           this.reportData.pastDueUnscheduled.length +
           this.reportData.firstMonth.length +
           this.reportData.secondMonth.length +
           this.reportData.thirdMonth.length +
           this.reportData.fourthMonth.length +
           this.reportData.fifthMonth.length;
  }

  // Color coding methods to match legacy system
  getSectionColorClass(sectionType: string): string {
    switch (sectionType) {
      case 'completedNotReturned':
      case 'returnedForProcessing':
      case 'returnedIncomplete':
        return 'critical-section'; // White text, Red background
      case 'jobsToday':
      case 'customerConfirmed':
        return 'today-section'; // Red text, Transparent background
      case 'pastDueUnscheduled':
      case 'firstMonth':
      case 'secondMonth':
      case 'thirdMonth':
      case 'fourthMonth':
      case 'fifthMonth':
        return 'unscheduled-section'; // Black text, Orange background
      case 'emailReports':
        return 'normal-section'; // Normal colors
      default:
        return '';
    }
  }

  getRowColorClass(item: any, sectionType: string): string {
    const statusRaw = (item.status || item.jobStatus || '').toString();
    const isBillAfterPm = statusRaw === 'Bill After PM' ||
      statusRaw === 'Could be billed';

    const isUnscheduled = this.isUnscheduledSection(sectionType);
    const isCritical = this.isCriticalSection(sectionType);
    const isTodaySection = this.isTodaySection(sectionType);
    const isReturnedSection = this.isReturnedSection(sectionType);
    const isExpiredSection = this.isExpiredSection(sectionType, item);
    const quotedAmount = this.getQuotedAmount(item);
    const currentAge = this.getCurrentAge(item);

    if (isUnscheduled) {
      // Legacy: only highlight "Could be billed" in Unscheduled sections
      return isBillAfterPm ? 'bill-after-pm-warning' : '';
    }

    if (isBillAfterPm) {
      return isReturnedSection ? 'bill-after-pm-critical' : 'bill-after-pm-warning';
    }

    const shouldHighlightAmount = isExpiredSection
      ? currentAge > 30 && quotedAmount > 0
      : quotedAmount > 0;

    if (shouldHighlightAmount) {
      if (isCritical) {
        return 'critical-with-amount';
      }
      if (isTodaySection) {
        return 'today-with-amount';
      }
    }

    return '';
  }

  getStatusText(item: any): string {
    const status = item.status || item.jobStatus || '';
    if (status === 'Could be billed') {
      return 'Bill After PM';
    }
    return status;
  }

  shouldBoldAmount(item: any, sectionType?: string): boolean {
    const quotedAmount = this.getQuotedAmount(item);
    if (this.isExpiredSection(sectionType, item)) {
      const currentAge = this.getCurrentAge(item);
      return currentAge > 30 && quotedAmount > 0;
    }
    return quotedAmount > 0;
  }

  shouldBoldAge(item: any, sectionType?: string): boolean {
    if (!this.isExpiredSection(sectionType, item)) {
      return false;
    }
    const currentAge = this.getCurrentAge(item);
    const quotedAmount = this.getQuotedAmount(item);
    return currentAge > 30 && quotedAmount > 0;
  }

  getQuotedAmount(item: any): number {
    return Number(item.totalAmount ?? item.TotalAmount ?? 0);
  }

  private getCurrentAge(item: any): number {
    return Number(item.currentAge ?? item.changeAge ?? 0);
  }

  private isUnscheduledSection(sectionType: string): boolean {
    return sectionType === 'pastDueUnscheduled' ||
      sectionType === 'firstMonth' ||
      sectionType === 'secondMonth' ||
      sectionType === 'thirdMonth' ||
      sectionType === 'fourthMonth' ||
      sectionType === 'fifthMonth';
  }

  private isCriticalSection(sectionType: string): boolean {
    return sectionType === 'completedNotReturned' ||
      sectionType === 'returnedForProcessing' ||
      sectionType === 'returnedWithIncompleteData' ||
      sectionType === 'returnedIncomplete';
  }

  private isReturnedSection(sectionType: string): boolean {
    return sectionType === 'returnedForProcessing' ||
      sectionType === 'returnedWithIncompleteData' ||
      sectionType === 'returnedIncomplete';
  }

  private isTodaySection(sectionType: string): boolean {
    return sectionType === 'jobsScheduledToday' ||
      sectionType === 'jobsConfirmedNext120Hours';
  }

  private isExpiredSection(sectionType?: string, item?: any): boolean {
    const sectionText = (sectionType || '').toLowerCase();
    if (sectionText.includes('expired')) {
      return true;
    }
    const itemText = (
      item?.sectionLabel ||
      item?.sectionName ||
      item?.sectionType ||
      item?.statusLabel ||
      ''
    ).toString().toLowerCase();
    return itemText.includes('expired');
  }

  // Status badge color methods
  getStatusBadgeClass(item: any, sectionType?: string): string {
    const status = this.getStatusText(item);
    const statusLower = status.toLowerCase();
    
    // Handle different status types with appropriate colors
    if (statusLower.includes('opn') || statusLower === 'open') {
      // OPN (Open) - Green normally, Red if in critical sections
      const isCriticalSection = sectionType === 'completedNotReturned' || 
                               sectionType === 'returnedForProcessing' || 
                               sectionType === 'pastDueUnscheduled';
      return isCriticalSection ? 'bg-danger' : 'bg-success';
    }
    
    if (status === 'Bill After PM' || statusLower.includes('blb') || status === 'Could be billed') {
      // BLB (Bill After PM) - Orange/Warning color
      return 'bg-warning text-dark';
    }
    
    if (statusLower.includes('fcd') || statusLower === 'forced close') {
      // FCD (Forced Close) - Purple color
      return 'bg-primary';
    }
    
    if (statusLower.includes('complete') || statusLower.includes('confirmed')) {
      // Completed/Confirmed statuses - Green
      return 'bg-success';
    }
    
    if (statusLower.includes('pending') || statusLower.includes('processing')) {
      // Pending/Processing statuses - Blue
      return 'bg-info';
    }
    
    if (statusLower.includes('returned') || statusLower.includes('incomplete')) {
      // Returned/Incomplete statuses - Red
      return 'bg-danger';
    }

    if (statusLower.includes('mis')) {
      // MIS - Teal
      return 'bg-info text-dark';
    }
    
    // Default status color
    return 'bg-secondary';
  }

  sortData(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.currentPage = 1;
  }

  private getSortedActiveData(): any[] {
    const activeData = this.getActiveData();
    if (!this.sortColumn) {
      return activeData;
    }

    const sorted = [...activeData];
    sorted.sort((a, b) => {
      const aValue = this.getColumnValue(a, this.sortColumn);
      const bValue = this.getColumnValue(b, this.sortColumn);

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return (aValue - bValue) * (this.sortDirection === 'asc' ? 1 : -1);
      }

      return aValue.toString().localeCompare(bValue.toString()) * (this.sortDirection === 'asc' ? 1 : -1);
    });

    return sorted;
  }

  private getColumnValue(item: any, column: string): string | number {
    switch (column) {
      case 'callNbr':
        return (item.callNbr || item.callNumber || '').toString().toLowerCase();
      case 'custNmbr':
        return (item.custNmbr || item.customerId || item.customerNumber || '').toString().toLowerCase();
      case 'custName':
        return (item.custName || item.customerName || '').toString().toLowerCase();
      case 'status':
        return (this.getStatusText(item) || item.jobStatus || item.status || '').toString().toLowerCase();
      case 'jobStatus':
        return (item.jobStatus || item.status || '').toString().toLowerCase();
      case 'techName':
        return (item.techName || item.technician || '').toString().toLowerCase();
      case 'scheduledStart':
        return this.toTime(item.scheduledStart);
      case 'scheduledEnd':
        return this.toTime(item.scheduledEnd);
      case 'returnedDate':
        return this.toTime(item.returned || item.responseDate);
      case 'responseDate':
        return this.toTime(item.responseDate);
      case 'changeAge':
        return this.toNumber(item.changeAge1 ?? item.changeAge);
      case 'origAge':
        return this.toNumber(item.origAge);
      case 'description':
        return (item.description || '').toString().toLowerCase();
      case 'contractNo':
        return (this.getContractNumber(item) || '').toString().toLowerCase();
      case 'quotedAmount':
        return this.toNumber(this.getQuotedAmount(item));
      case 'jobType':
        return (item.jobType || '').toString().toLowerCase();
      case 'siteContact':
        return (item.siteContact || '').toString().toLowerCase();
      case 'city':
        return (item.city || '').toString().toLowerCase();
      case 'confirmationStatus':
        return 'confirmed';
      default:
        return (item[column] || '').toString().toLowerCase();
    }
  }

  private toNumber(value: any): number {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : 0;
  }

  private toTime(value: any): number {
    if (!value) return 0;
    const time = new Date(value).getTime();
    return Number.isFinite(time) ? time : 0;
  }

  // Pagination methods
  getPaginatedData(): any[] {
    const activeData = this.getSortedActiveData();
    this.totalItems = activeData.length;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return activeData.slice(startIndex, endIndex);
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

  // ============================================
  // ROLE-BASED FILTERING METHODS
  // ============================================

  /**
   * Determine employee status for role-based filtering
   * Access restricted to managers only (empStatus = 'M' or status = 'Manager')
   * All other users are redirected to login
   */
  private determineEmployeeStatus(): void {
    const userDataStr = localStorage.getItem("userData");
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      
      // Store user data for role-based filtering
      this.empID = (userData.empID || '').trim();
      this.userRole = userData.role || '';
      this.windowsID = userData.windowsID || userData.windowsId || userData.empName || '';
      const userDataEmpStatus = (userData.empStatus || '').trim();
      
      console.log('Account Manager Performance Report - User data loaded:', {
        empID: this.empID,
        userRole: this.userRole,
        windowsID: this.windowsID,
        userDataEmpStatus: userDataEmpStatus
      });
      
      if (this.windowsID) {
        this.reportService.getEmployeeStatusForJobListByParam(this.windowsID).subscribe({
          next: (response: EmployeeStatusDto) => {
            this.currentUserStatus = response;
            this.employeeStatus = response.status || '';
            
            // Fallback: If API returns unexpected status, use userData empStatus
            if (!this.employeeStatus || this.employeeStatus.toLowerCase() === 'redirect') {
              this.employeeStatus = userDataEmpStatus === 'M' ? 'Manager' : 
                                    userDataEmpStatus === 'E' ? 'Employee' :
                                    userDataEmpStatus === 'T' ? 'Technician' : 
                                    userDataEmpStatus || 'Other';
              console.log('Using fallback employee status from userData:', this.employeeStatus);
            }
            
            console.log('Account Manager Performance Report - Employee status:', {
              status: this.employeeStatus,
              apiStatus: response.status,
              userDataEmpStatus: userDataEmpStatus,
              isManagerContext: this.isManagerContext()
            });

            // Only managers can access this page
            if (!this.isManagerContext()) {
              console.log('Access denied: Only managers can access Account Manager Performance Reports');
              this.hasPageAccess = false;
              this.auth.logout();
              return;
            }

            this.hasPageAccess = true;
            this.employeeStatusLoaded = true;
            
            // Load account managers after determining role
            this.loadAccountManagers();
          },
          error: (error) => {
            console.error('Error loading employee status, trying fallback:', error);
            
            // Fallback: Use userData empStatus if API call fails
            if (userDataEmpStatus) {
              this.employeeStatus = userDataEmpStatus === 'M' ? 'Manager' : 
                                    userDataEmpStatus === 'E' ? 'Employee' :
                                    userDataEmpStatus === 'T' ? 'Technician' : 
                                    'Other';
              
              console.log('Using fallback from userData after API error:', this.employeeStatus);
              
              // Only managers can access
              if (!this.isManagerContext()) {
                console.log('Access denied: Only managers can access this report');
                this.hasPageAccess = false;
                this.auth.logout();
                return;
              }
              
              this.hasPageAccess = true;
              this.employeeStatusLoaded = true;
              this.loadAccountManagers();
            } else {
              this.errorMessage = 'Error retrieving employee status';
              this.hasPageAccess = false;
              this.auth.logout();
            }
          }
        });
      }
    } else {
      this.hasPageAccess = false;
      this.auth.logout();
    }
  }

  /**
   * Apply role-based defaults after both employee status and account managers are loaded
   * Since only managers can access, pre-select their own office
   */
  private applyRoleBasedDefaults(): void {
    if (!this.employeeStatusLoaded || !this.accountManagersLoaded) {
      return;
    }

    // If calendar/report sent explicit office + section via query params, honor that first
    if (this.routeOfficeId) {
      this.reportForm.patchValue({ officeId: this.routeOfficeId });
      setTimeout(() => {
        this.generateReport(undefined, this.routeSection || undefined);
      }, 0);
      return;
    }

    console.log('🔎 Account Manager Performance Report - Applying role-based defaults:', {
      empID: this.empID,
      userRole: this.userRole,
      employeeStatus: this.employeeStatus,
      accountManagersCount: this.accountManagers.length
    });

    // Pre-populate dropdown with the user's own EmpID if they are a manager in the list
    // Matches legacy behavior: dropdown is pre-populated but can be changed (no lock, no auto-generate)
    const empIdNormalized = (this.empID || '').toString().trim().toUpperCase();
    
    if (Array.isArray(this.accountManagers)) {
      const userManager = this.accountManagers.find(mgr => {
        const offid = (mgr.OFFID || mgr.empId || '').toString().trim().toUpperCase();
        const offname = (mgr.OFFNAME || mgr.empName || '').toString().trim().toUpperCase();
        return offid === empIdNormalized || offname === empIdNormalized;
      });

      if (userManager) {
        // Actual account manager — pre-select their own office
        const userOfficeId = userManager.OFFID || userManager.empId || '';
        this.reportForm.patchValue({ officeId: userOfficeId });
        
        console.log('Manager detected - Pre-selected their own office:', {
          officeId: userOfficeId,
          managerName: userManager.OFFNAME || userManager.empName
        });

        setTimeout(() => {
          this.generateReport();
        }, 0);
      } else {
        // Non-manager (e.g. EmpStatus='P','B', etc.) — default to DCG Account Manager (ACMGRS)
        const acmgrs = this.accountManagers.find(mgr =>
          (mgr.OFFID || mgr.empId || '').toString().trim().toUpperCase() === 'ACMGRS'
        );
        const defaultOfficeId = acmgrs ? (acmgrs.OFFID || acmgrs.empId || 'ACMGRS') : 'ACMGRS';
        this.reportForm.patchValue({ officeId: defaultOfficeId });
        console.log('Non-manager user - defaulting dropdown to DCG Account Manager (ACMGRS)');

        setTimeout(() => {
          this.generateReport();
        }, 0);
      }
    }
  }

  private isAllowedSection(section: string): boolean {
    return [
      'completedNotReturned',
      'returnedForProcessing',
      'jobsScheduledToday',
      'jobsConfirmedNext120Hours',
      'returnedWithIncompleteData',
      'returnedIncomplete',
      'customerConfirmed',
      'monthlyUnscheduled',
      'firstMonth',
      'secondMonth',
      'thirdMonth',
      'fourthMonth',
      'fifthMonth',
      'pastDueUnscheduled'
    ].includes(section);
  }

  /**
   * Check if user has access to this report
   * Matches legacy behavior: EmpStatus in ('M', 'E') - both Managers and Employees are allowed
   */
  private isManagerContext(): boolean {
    const status = (this.employeeStatus || this.userRole || '').trim().toLowerCase();
    
    // Allow Managers (EmpStatus='M') and Employees (EmpStatus='E') - matches legacy EmpStatus in ('M', 'E')
    return status === 'manager' || status === 'm' || status === 'employee' || status === 'e' || status === 'other';
  }
}