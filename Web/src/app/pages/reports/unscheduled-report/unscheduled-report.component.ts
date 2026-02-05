import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { UnscheduledReportService } from './unscheduled-report.service';

@Component({
  selector: 'app-unscheduled-report',
  templateUrl: './unscheduled-report.component.html',
  styleUrls: ['./unscheduled-report.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnscheduledReportComponent implements OnInit {
  isLoading = false;
  errorMessage = '';
  Math = Math; // Expose Math to template

  // Grid data
  gridData: any[] = [];
  gridColumns = ['callnbr', 'custName', 'accMgr', 'jobstatus', 'custclas', 'scheduledstart', 'contnbr', 'description', 'changeAge', 'origAge'];
  displayColumns = [
    { key: 'callnbr', header: 'Job No', width: '120px' },
    { key: 'custName', header: 'Site Name', width: '250px' },
    { key: 'accMgr', header: 'Manager', width: '250px' },
    { key: 'jobstatus', header: 'Status', width: '50px' },
    { key: 'custclas', header: 'Class', width: '120px' },
    { key: 'scheduledstart', header: 'Scheduled On', width: '100px' },
    { key: 'contnbr', header: 'Contract No', width: '100px' },
    { key: 'description', header: 'Description', width: '120px' },
    { key: 'changeAge', header: 'Current Age', width: '100px' },
    { key: 'origAge', header: 'Original Age', width: '100px' }
  ];
  currentPage = 1;
  pageSize = 20;
  sortField = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Chart data
  pastDueChartOptions: any;
  scheduledPercentageChartOptions: any;
  totalJobsChartOptions: any;
  totalJobsScheduledChartOptions: any;

  pastDueData: any[] = [];
  scheduledPercentageData: any[] = [];
  totalJobsData: any[] = [];
  totalJobsScheduledData: any[] = [];

  constructor(
    private service: UnscheduledReportService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.service.getUnscheduledReportData().subscribe({
      next: (response: any) => {
        console.log('Unscheduled Report API Response:', response);
        
        if (response.success && response.data) {
          // Table 0: Grid data
          this.gridData = response.data.gridData || [];
          
          // Table 1: Past Due / Bill After PM
          this.pastDueData = response.data.pastDueData || [];
          this.createPastDueChart();
          
          // Table 2: Scheduled Percentage
          this.scheduledPercentageData = response.data.scheduledPercentageData || [];
          this.createScheduledPercentageChart();
          
          // Table 3: Total Jobs to be Scheduled
          this.totalJobsData = response.data.totalJobsData || [];
          this.createTotalJobsChart();
          
          // Table 4: Total Jobs Scheduled
          this.totalJobsScheduledData = response.data.totalJobsScheduledData || [];
          this.createTotalJobsScheduledChart();
        } else {
          this.errorMessage = 'Failed to load unscheduled report data';
        }
        
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        console.error('Error loading unscheduled report data:', error);
        this.errorMessage = error.message || 'An error occurred while loading the report';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private createPastDueChart(): void {
    const accountManagers = this.pastDueData.map(d => d.accMgr || d.AccMgr || '');
    const pastDueJobs = this.pastDueData.map(d => parseInt(d.pastDueJobs || d.PastDueJobs || 0));
    const billAfterPM = this.pastDueData.map(d => parseInt(d.couldbebilled || d.Couldbebilled || 0));

    this.pastDueChartOptions = {
      series: [
        {
          name: 'Past Due Jobs',
          data: pastDueJobs
        },
        {
          name: 'Bill After PM',
          data: billAfterPM
        }
      ],
      chart: {
        type: 'bar',
        height: 400,
        animations: { enabled: false },
        toolbar: { show: true }
      },
      colors: ['#7BB752', '#FF9900'],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '40px',
          borderRadius: 4
        }
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: accountManagers,
        title: { text: 'Account Manager', style: { fontSize: '14px', fontWeight: 'bold' } },
        labels: { rotate: -45, rotateAlways: false, hideOverlappingLabels: true, style: { fontSize: '10pt' } }
      },
      yaxis: {
        title: { text: 'No of Jobs', style: { fontSize: '14px', fontWeight: 'bold' } },
        labels: { formatter: (val: number) => Math.round(val).toString() }
      },
      title: {
        text: 'Past Due / Bill After PM Unscheduled Jobs (Current Year and above)',
        align: 'center',
        style: { fontSize: '13pt', fontWeight: 'bold' }
      },
      tooltip: { enabled: true, y: { formatter: (val: number) => val.toString() + ' Jobs' } },
      grid: { borderColor: '#e7e7e7' }
    };

    this.cdr.markForCheck();
  }

  private createScheduledPercentageChart(): void {
    const accountManagers = this.scheduledPercentageData.map(d => d.offid || d.offId || '');
    const scheduledPercentage = this.scheduledPercentageData.map(d => parseFloat(d.scheduledPct || d['Scheduled %'] || 0));

    this.scheduledPercentageChartOptions = {
      series: [{
        name: 'Scheduled %',
        data: scheduledPercentage
      }],
      chart: {
        type: 'bar',
        height: 400,
        animations: { enabled: false },
        toolbar: { show: true }
      },
      colors: ['#667eea'],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '40px',
          borderRadius: 4
        }
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: accountManagers,
        title: { text: 'Account Manager', style: { fontSize: '14px', fontWeight: 'bold' } },
        labels: { rotate: -45, rotateAlways: false, hideOverlappingLabels: true, style: { fontSize: '10pt' } }
      },
      yaxis: {
        title: { text: 'Percentage (%)', style: { fontSize: '14px', fontWeight: 'bold' } },
        labels: { formatter: (val: number) => val.toFixed(1) + '%' }
      },
      title: {
        text: 'Account Managers - Scheduled Percentage (Current Year and above)',
        align: 'center',
        style: { fontSize: '13pt', fontWeight: 'bold' }
      },
      tooltip: { enabled: true, y: { formatter: (val: number) => val.toFixed(2) + '%' } },
      grid: { borderColor: '#e7e7e7' }
    };

    this.cdr.markForCheck();
  }

  private createTotalJobsChart(): void {
    const accountManagers = this.totalJobsData.map(d => d.offid || d.offId || '');
    const totalJobs = this.totalJobsData.map(d => parseInt(d.totalJobs || d.TotalJobs || 0));

    this.totalJobsChartOptions = {
      series: [{
        name: 'Total Jobs to be Scheduled',
        data: totalJobs
      }],
      chart: {
        type: 'bar',
        height: 400,
        animations: { enabled: false },
        toolbar: { show: true }
      },
      colors: ['#764ba2'],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '40px',
          borderRadius: 4
        }
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: accountManagers,
        title: { text: 'Account Manager', style: { fontSize: '14px', fontWeight: 'bold' } },
        labels: { rotate: -45, rotateAlways: false, hideOverlappingLabels: true, style: { fontSize: '10pt' } }
      },
      yaxis: {
        title: { text: 'No of Jobs', style: { fontSize: '14px', fontWeight: 'bold' } },
        labels: { formatter: (val: number) => Math.round(val).toString() }
      },
      title: {
        text: 'Total Jobs to be Scheduled (Current Year and above)',
        align: 'center',
        style: { fontSize: '13pt', fontWeight: 'bold' }
      },
      tooltip: { enabled: true, y: { formatter: (val: number) => val.toString() + ' Jobs' } },
      grid: { borderColor: '#e7e7e7' }
    };

    this.cdr.markForCheck();
  }

  private createTotalJobsScheduledChart(): void {
    const accountManagers = this.totalJobsScheduledData.map(d => d.offid || d.offId || '');
    const totalJobsScheduled = this.totalJobsScheduledData.map(d => parseInt(d.totalJobs || d.TotalJobs || 0));

    this.totalJobsScheduledChartOptions = {
      series: [{
        name: 'Total Jobs Scheduled',
        data: totalJobsScheduled
      }],
      chart: {
        type: 'bar',
        height: 400,
        animations: { enabled: false },
        toolbar: { show: true }
      },
      colors: ['#f093fb'],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '40px',
          borderRadius: 4
        }
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: accountManagers,
        title: { text: 'Account Manager', style: { fontSize: '14px', fontWeight: 'bold' } },
        labels: { rotate: -45, rotateAlways: false, hideOverlappingLabels: true, style: { fontSize: '10pt' } }
      },
      yaxis: {
        title: { text: 'No of Jobs', style: { fontSize: '14px', fontWeight: 'bold' } },
        labels: { formatter: (val: number) => Math.round(val).toString() }
      },
      title: {
        text: 'Total Jobs Scheduled (Current Year and above)',
        align: 'center',
        style: { fontSize: '13pt', fontWeight: 'bold' }
      },
      tooltip: { enabled: true, y: { formatter: (val: number) => val.toString() + ' Jobs' } },
      grid: { borderColor: '#e7e7e7' }
    };

    this.cdr.markForCheck();
  }

  getDisplayData(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.gridData.slice(start, start + this.pageSize);
  }

  getTotalPages(): number {
    return Math.ceil(this.gridData.length / this.pageSize);
  }

  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
      this.cdr.markForCheck();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.cdr.markForCheck();
    }
  }

  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }

    this.gridData.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      
      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.cdr.markForCheck();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return 'bi-arrow-down-up';
    return this.sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
  }

  exportToExcel(): void {
    // Excel export functionality
    const ws = document.createElement('table');
    ws.innerHTML = '<tr>' + this.displayColumns.map(col => '<th>' + col.header + '</th>').join('') + '</tr>';
    this.gridData.forEach(row => {
      ws.innerHTML += '<tr>' + this.displayColumns.map(col => '<td>' + (row[col.key] || '') + '</td>').join('') + '</tr>';
    });
    
    const wbout = new Blob([ws.outerHTML], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const filename = 'UnscheduledReport_' + new Date().toISOString().split('T')[0] + '.xls';
    const url = URL.createObjectURL(wbout);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  }
}
