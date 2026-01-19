import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ReportService } from 'src/app/core/services/report.service';

interface SiteHistoryRow {
  jobNo: string;
  techName: string;
  scheduledOn: string | null;
  customerName: string;
  address: string;
  techNotes: string;
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

  constructor(private reportService: ReportService, private router: Router) {}

  ngOnInit(): void {
    this.clearMessages();
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
        this.showError('Error processing task. Please try again.');
        return of({ success: false, message: '' });
      })
    ).subscribe(response => {
      this.loading = false;
      if (response.success || response.message?.includes('Success')) {
        this.showSuccess(response.message || `Job ${operation} successful`);
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
      if (response && response.jobNo) {
        // Redirect to parts page
        window.location.href = `/DTechJobParts.aspx?CallNbr=${response.jobNo}&TechName=${response.techName}`;
      } else {
        this.showError('Job not found. Job status should match Great Plains job status and Service Type is Open');
      }
    });
  }

  private normalizeHistoryResponse(response: any): SiteHistoryRow[] {
    if (!response.rows || !Array.isArray(response.rows)) {
      return [];
    }
    return response.rows.map((row: any) => ({
      jobNo: row?.jobNo || row?.callNbr || '',
      techName: row?.techName || '',
      scheduledOn: row?.scheduledOn || null,
      customerName: row?.customerName || '',
      address: row?.address || '',
      techNotes: row?.techNotes || ''
    }));
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
