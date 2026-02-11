import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ReportService } from 'src/app/core/services/report.service';
import { AuthService } from 'src/app/modules/auth/services/auth.service';

interface SiteHistoryRow {
  jobNo: string;
  techName: string;
  scheduledOn: Date | null;
  techNotes: SafeHtml;
}

@Component({
  selector: 'app-miscellaneous-tasks',
  templateUrl: './miscellaneous-tasks.component.html',
  styleUrls: ['./miscellaneous-tasks.component.scss']
})
export class MiscellaneousTasksComponent implements OnInit {

  loading = false;
  errorMessage = '';
  successMessage = '';
  messageColor: 'red' | 'green' = 'red';

  // Form fields
  selectedTask = 'SAT';
  callNbr = '';
  jobNo = '';
  siteID = '';
  jobStatus = 'PS';

  // Site history
  siteHistoryRows: SiteHistoryRow[] = [];
  showSiteHistory = false;

  taskOptions = [
    { label: 'Select a Task', value: 'SAT' },
    { label: 'Add / View Parts Request', value: 'AVP' },
    { label: 'Re-Download Job', value: 'RDJ' },
    { label: 'Remove Tech From Job', value: 'RMT' },
    { label: 'Previous Site History', value: 'PSH' }
  ];

  jobStatusOptions = [
    { label: 'Please Select', value: 'PS' },
    { label: 'OPN', value: 'OPN' },
    { label: 'PEN', value: 'PEN' },
    { label: 'CON', value: 'CON' },
    { label: 'FCD', value: 'FCD' },
    { label: 'BLB', value: 'BLB' },
    { label: 'CLS', value: 'CLS' }
  ];

  constructor(
    private reportService: ReportService,
    private router: Router,
    private authService: AuthService,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.clearMessages();
    this.filterTasksByRole();
    this.checkQueryStringPrePopulation();
  }

  // Filter tasks based on user role (Technicians cannot see RDJ and RMT)
  private filterTasksByRole(): void {
    const userStatus = this.authService.currentUserValue?.status;
    if (userStatus === 'Technician') {
      this.taskOptions = this.taskOptions.filter(
        option => option.value !== 'RDJ' && option.value !== 'RMT'
      );
    }
  }

  // Check for query string pre-population (CustNmbr parameter for PSH)
  private checkQueryStringPrePopulation(): void {
    this.route.queryParams.subscribe(params => {
      if (params['CustNmbr']) {
        this.siteID = params['CustNmbr'].replace(/&/g, ' ');
        this.selectedTask = 'PSH';
        setTimeout(() => this.viewSiteHistory(), 500);
      }
    });
  }

  onTaskChange(): void {
    this.clearMessages();
    this.callNbr = '';
    this.jobNo = '';
    this.siteID = '';
    this.jobStatus = 'PS';
    this.siteHistoryRows = [];
    this.showSiteHistory = false;
  }

  onGoClick(): void {
    this.clearMessages();

    if (this.selectedTask === 'RDJ' || this.selectedTask === 'RMT') {
      if (!this.jobNo.trim()) {
        this.showError('Please enter Job Number');
        return;
      }
      this.handleRedownloadOrRemoveTech();
    } else if (this.selectedTask === 'PSH') {
      if (!this.siteID.trim()) {
        this.showError('Please enter Site ID');
        return;
      }
      this.viewSiteHistory();
    } else if (this.selectedTask === 'AVP') {
      if (!this.callNbr.trim()) {
        this.showError('Please enter Job Number');
        return;
      }
      if (this.jobStatus === 'PS') {
        this.showError('Please select Job Status');
        return;
      }
      this.addViewParts();
    }
  }

  handleRedownloadOrRemoveTech(): void {
    this.loading = true;
    const operation = this.selectedTask === 'RDJ' ? 'redownload' : 'remove';

    this.reportService.handleMiscTask(operation, this.jobNo).pipe(
      catchError(err => {
        console.error('Misc task failed', err);
        const errorMsg = err?.error?.message || err?.message || 'Error processing task. Please try again.';
        this.showError(errorMsg);
        this.loading = false;
        return of(null);
      })
    ).subscribe(response => {
      this.loading = false;
      
      if (!response) {
        // Error was already handled in catchError
        return;
      }

      // Check if operation was successful
      if (response.success === true) {
        this.showSuccess(response.message || `Job ${operation} successful`);
      } else if (response.success === false && response.message) {
        // Show the specific error message from the API
        this.showError(response.message);
      } else {
        this.showError(response.message || 'Operation failed');
      }
    });
  }

  viewSiteHistory(): void {
    this.loading = true;
    this.showSiteHistory = false;

    this.reportService.getSiteHistory(this.siteID).pipe(
      map(response => this.normalizeHistoryResponse(response || {})),
      catchError(err => {
        console.error('Site history load failed', err);
        this.showError('Unable to load site history');
        return of([]);
      })
    ).subscribe(rows => {
      this.loading = false;
      if (rows.length > 0) {
        this.siteHistoryRows = rows;
        this.showSiteHistory = true;
      } else {
        this.showError('No History Notes Found');
      }
    });
  }

  addViewParts(): void {
    this.loading = true;

    this.reportService.checkJobExists(this.callNbr, this.jobStatus).pipe(
      catchError(err => {
        console.error('Job check failed', err);
        this.showError('Unable to check job');
        return of(null);
      })
    ).subscribe(response => {
      this.loading = false;
      if (response && response.exists) {
        // Extract call number and tech name from the API response
        const data = response.data;
        if (data && data.callNbr && data.techName) {
          // Navigate to job-parts page with query parameters
          this.router.navigate(['/jobs/parts'], {
            queryParams: {
              CallNbr: data.callNbr.trim(),
              TechName: data.techName.trim()
            }
          });
        } else {
          this.showError('Invalid job data returned');
        }
      } else {
        this.showError('Job not found. Job status should match Great Plains job status and Service Type is Open');
      }
    });
  }

  private normalizeHistoryResponse(response: any): SiteHistoryRow[] {
    // Handle both wrapped response (with .rows) and direct array
    const rows = Array.isArray(response) ? response : (response.rows || []);
    
    if (!Array.isArray(rows)) {
      return [];
    }

    return rows.map((row: any) => {
      // Parse scheduledOn - API returns either "MM/DD/YYYY" format or ISO date
      let scheduledDate: Date | null = null;
      const scheduledRaw = row?.scheduledOn || row?.strtDate;
      
      if (scheduledRaw) {
        if (typeof scheduledRaw === 'string') {
          // Handle "09/23/2025" format or ISO "2025-09-23T00:00:00"
          if (scheduledRaw.includes('T')) {
            // ISO format
            scheduledDate = new Date(scheduledRaw);
          } else if (scheduledRaw.match(/\d{2}\/\d{2}\/\d{4}/)) {
            // MM/DD/YYYY format
            const [month, day, year] = scheduledRaw.split('/');
            scheduledDate = new Date(`${year}-${month}-${day}`);
          }
        }
      }

      // Sanitize HTML in techNotes
      const htmlNotes = (row?.techNotes || '').trim();
      const sanitizedHtml = this.sanitizer.sanitize(1, htmlNotes) || '';

      return {
        jobNo: (row?.jobNo || row?.callNbr || '').trim(),
        techName: (row?.technician || row?.techName || '').trim(),
        scheduledOn: scheduledDate,
        techNotes: this.sanitizer.bypassSecurityTrustHtml(sanitizedHtml)
      };
    });
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    this.messageColor = 'red';
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    this.messageColor = 'green';
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  trackByHistoryRow(index: number, row: SiteHistoryRow): string {
    return `${row.jobNo}-${index}`;
  }
}
