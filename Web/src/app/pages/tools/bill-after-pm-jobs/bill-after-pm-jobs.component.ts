import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { BillAfterPMJobsService } from 'src/app/pages/tools/bill-after-pm-jobs/bill-after-pm-jobs.service';

interface BillAfterPMJob {
  callNbr: string;
  custNbr: string;
  custName: string;
  pmType: string;
  description: string;
  status: string;
  techName: string;
  accMgr: string;
  strtDate: string;
  endDate: string;
  contNbr: string;
}

interface SelectOption {
  text: string;
  value: string;
}

@Component({
  selector: 'app-bill-after-pm-jobs',
  templateUrl: './bill-after-pm-jobs.component.html',
  styleUrls: ['./bill-after-pm-jobs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BillAfterPMJobsComponent implements OnInit {
  jobs: BillAfterPMJob[] = [];
  loading = false;
  message = '';
  messageType: 'success' | 'error' | '' = '';

  archiveOptions: SelectOption[] = [
    { text: 'Active', value: '0' },
    { text: 'Archive', value: '1' }
  ];
  selectedArchive = '0';

  pmTypeOptions: SelectOption[] = [
    { text: 'Bill After PM', value: 'BAP' },
    { text: 'Regular', value: 'None' }
  ];
  selectedPmType = 'BAP';

  fiscalYears: SelectOption[] = [];
  selectedFiscalYear = '0';

  months: SelectOption[] = [];
  selectedMonth = '0';

  sortBy: keyof BillAfterPMJob = 'endDate';
  sortDirection: 'asc' | 'desc' = 'asc';

  selectedJobs = new Set<string>();

  constructor(
    private service: BillAfterPMJobsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initFiscalYears();
    this.initMonths();
    this.loadJobs();
  }

  initFiscalYears(): void {
    const currentYear = new Date().getFullYear();
    this.fiscalYears = [{ text: 'All', value: '0' }];
    for (let i = -3; i <= 1; i++) {
      const year = currentYear + i;
      this.fiscalYears.push({ text: year.toString(), value: year.toString() });
    }
    this.selectedFiscalYear = currentYear.toString();
  }

  initMonths(): void {
    this.months = [{ text: 'All', value: '0' }];
    const base = new Date(2000, 0, 1);
    for (let i = 0; i < 12; i++) {
      const month = new Date(base.getFullYear(), i, 1);
      this.months.push({ text: month.toLocaleString('en-US', { month: 'long' }), value: (i + 1).toString() });
    }
  }

  loadJobs(): void {
    this.loading = true;
    this.message = '';
    this.selectedJobs.clear();

    this.service.getJobs({
      archive: this.selectedArchive,
      pmType: this.selectedPmType,
      fiscalYear: this.selectedFiscalYear,
      month: this.selectedMonth
    }).subscribe({
      next: (data: BillAfterPMJob[]) => {
        this.jobs = data || [];
        this.applySort();
        if (this.jobs.length === 0) {
          this.message = 'No Rows Found';
          this.messageType = 'error';
        }
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err: any) => {
        this.message = 'Error loading data: ' + err.message;
        this.messageType = 'error';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onFilterChange(): void {
    this.loadJobs();
  }

  toggleSelection(callNbr: string, checked: boolean): void {
    if (checked) {
      this.selectedJobs.add(callNbr);
    } else {
      this.selectedJobs.delete(callNbr);
    }
  }

  isSelected(callNbr: string): boolean {
    return this.selectedJobs.has(callNbr);
  }

  moveSelected(): void {
    const actionText = this.selectedArchive === '0' ? 'Move to Archive' : 'Move to Active';
    if (!confirm(`Are you sure you want to ${actionText}?`)) {
      return;
    }
    if (this.selectedJobs.size === 0) {
      this.message = 'Please select a Job to move';
      this.messageType = 'error';
      this.cdr.markForCheck();
      return;
    }

    const targetArchive = this.selectedArchive === '0' ? '1' : '0';
    const jobIds = Array.from(this.selectedJobs);

    this.loading = true;
    this.service.moveJobs(jobIds, targetArchive).subscribe({
      next: () => {
        this.message = `Selected Jobs (${jobIds.join(', ')}) successfully moved to ${targetArchive === '1' ? 'Archive' : 'Active'}`;
        this.messageType = 'success';
        this.loadJobs();
      },
      error: (err: any) => {
        this.message = 'Error moving jobs: ' + err.message;
        this.messageType = 'error';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onSort(column: keyof BillAfterPMJob): void {
    if (this.sortBy === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortDirection = 'asc';
    }
    this.applySort();
    this.cdr.markForCheck();
  }

  applySort(): void {
    const direction = this.sortDirection === 'asc' ? 1 : -1;
    this.jobs.sort((a, b) => {
      const aValue = a[this.sortBy];
      const bValue = b[this.sortBy];

      if (this.sortBy === 'strtDate' || this.sortBy === 'endDate') {
        return (new Date(aValue).getTime() - new Date(bValue).getTime()) * direction;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * direction;
      }

      return 0;
    });
  }

  get moveButtonText(): string {
    return this.selectedArchive === '0' ? 'Move to Archive' : 'Move to Active';
  }
}
