import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ReportService } from '../../../core/services/report.service';
import { AccountManager } from '../../../core/model/account-manager.model';
import {
  AccMgrPerformanceReportResponseDto,
  AccMgrPerformanceReportSummaryDto
} from '../../../core/model/account-manager-performance-report.model';

@Component({
  selector: 'app-acc-mgr-performance-report',
    templateUrl: './acc-mgr-performance-report.component.html',

  styleUrls: ['./acc-mgr-performance-report.component.scss']
})
export class AccMgrPerformanceReportComponent implements OnInit, OnDestroy {
  reportForm: FormGroup;
  reportData: AccMgrPerformanceReportResponseDto | null = null;
  summaryData: AccMgrPerformanceReportSummaryDto | null = null;
  accountManagers: AccountManager[] = [];
  isLoading = false;
  isLoadingAccountManagers = false;
  errorMessage: string | null = null;
  
  // Active section for tabbed view
  activeSection = 'summary';
  
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService
  ) {
    this.reportForm = this.fb.group({
      officeId: ['', [Validators.required, Validators.maxLength(11)]]
    });
  }

  ngOnInit(): void {
    // Load account managers first
    this.loadAccountManagers();
    
    // Set default values
    this.reportForm.patchValue({
      officeId: '' // Will be set after account managers load
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Generate the performance report
   */
  generateReport(filterType?: string): void {
    const officeId = this.reportForm.get('officeId')?.value || '';
    
    // Check if we have a valid office ID instead of form validation
    if (!officeId || officeId.trim() === '') {
      console.log('Cannot generate report: No office ID provided');
      this.markFormGroupTouched();
      return;
    }

    console.log('Generating report for office ID:', officeId, 'Filter:', filterType);
    this.isLoading = true;
    this.errorMessage = null;
    
    let roJobs = '';

    // Apply RedOrange filter if specified
    if (filterType === 'RedOrange') {
      roJobs = 'RedOrange';
    }

    // Get comprehensive report data
    const reportSub = this.reportService.getAccMgrPerformanceReport(officeId, roJobs).subscribe({
      next: (data) => {
        this.reportData = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = 'An error occurred while generating the report';
        console.error('Report generation error:', error);
      }
    });

    // Get summary data
    const summarySub = this.reportService.getAccMgrPerformanceReportSummary(officeId, roJobs).subscribe({
      next: (data) => {
        this.summaryData = data;
      },
      error: (error) => {
        console.error('Summary generation error:', error);
      }
    });

    this.subscriptions.push(reportSub, summarySub);
  }

  /**
   * Load account managers from the existing service
   */
  loadAccountManagers(): void {
    console.log('Loading account managers...');
    this.isLoadingAccountManagers = true;
    
    const accountManagerSub = this.reportService.getAccountManagerNames().subscribe({
      next: (data: any[]) => {
        console.log('Account managers loaded:', data);
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
          
          console.log('Processed account managers:', this.accountManagers);
          
          // Set DCG account manager as default if available, otherwise use first
          let defaultManager = this.accountManagers.find(manager => 
            (manager.OFFNAME && manager.OFFNAME.toUpperCase().includes('DCG')) ||
            (manager.empName && manager.empName.toUpperCase().includes('DCG')) ||
            (manager.offname && manager.offname.toUpperCase().includes('DCG'))
          );
          
          console.log('Found DCG manager:', defaultManager);
          
          if (!defaultManager && this.accountManagers.length > 0) {
            defaultManager = this.accountManagers[0];
            console.log('Using first manager as default:', defaultManager);
          }
          
          if (defaultManager) {
            const defaultOfficeId = defaultManager.OFFID || defaultManager.empId || '';
            console.log('Setting default office ID:', defaultOfficeId);
            this.reportForm.patchValue({ officeId: defaultOfficeId });
            
            // Auto-generate report with DCG account manager
            console.log('Auto-generating report in 500ms...');
            setTimeout(() => {
              this.generateReport();
            }, 500);
          }
        } else {
          console.log('No account managers found');
        }
        this.isLoadingAccountManagers = false;
      },
      error: (error) => {
        console.error('Error loading account managers:', error);
        this.isLoadingAccountManagers = false;
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
   * Get badge class for status display
   */
  getStatusBadgeClass(status: string): string {
    if (!status) return 'badge badge-light';
    
    const statusLower = status.toLowerCase();
    
    if (statusLower.includes('complete') || statusLower.includes('approved')) {
      return 'badge badge-success';
    }
    if (statusLower.includes('pending') || statusLower.includes('processing')) {
      return 'badge badge-warning';
    }
    if (statusLower.includes('returned') || statusLower.includes('incomplete')) {
      return 'badge badge-danger';
    }
    
    return 'badge badge-light';
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
    this.activeSection = 'summary';
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
    // Handle "Could be billed" -> "Bill After PM" logic
    if (item.status === 'Could be billed' || item.jobStatus === 'Could be billed') {
      if (sectionType.includes('returned') || sectionType === 'returnedForProcessing') {
        return 'bill-after-pm-critical'; // White text, Red background
      } else {
        return 'bill-after-pm-warning'; // Black text, Orange background
      }
    }

    // Handle quoted amounts > 0
    const quotedAmount = item.quotedAmount || item.amount || 0;
    if (quotedAmount > 0) {
      if (sectionType === 'completedNotReturned' || 
          sectionType === 'returnedForProcessing' || 
          sectionType === 'returnedIncomplete') {
        return 'critical-with-amount'; // White text, Red background, Bold amount
      } else if (sectionType.includes('Month') || sectionType === 'pastDueUnscheduled') {
        return 'unscheduled-with-amount'; // Black text, Orange background, Bold amount
      }
    }

    // Handle expired jobs over 30 days
    const currentAge = item.currentAge || item.changeAge || 0;
    if (currentAge > 30 && quotedAmount > 0) {
      return 'expired-critical'; // Bold text with section colors
    }

    return '';
  }

  getStatusText(item: any): string {
    const status = item.status || item.jobStatus || '';
    return status === 'Could be billed' ? 'Bill After PM' : status;
  }

  shouldBoldAmount(item: any): boolean {
    const quotedAmount = item.quotedAmount || item.amount || 0;
    return quotedAmount > 0;
  }

  shouldBoldAge(item: any): boolean {
    const currentAge = item.currentAge || item.changeAge || 0;
    const quotedAmount = item.quotedAmount || item.amount || 0;
    return currentAge > 30 && quotedAmount > 0;
  }
}