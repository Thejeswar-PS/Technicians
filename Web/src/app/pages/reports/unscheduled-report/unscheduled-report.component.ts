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
  filteredGridData: any[] = [];
  managerFilter = '';
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
  pageSize = 50;
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
          const data = response.data;

          // Grid data
          const jobDetails = data.jobDetails || data.gridData || [];
          this.gridData = jobDetails.map((item: any) => ({
            callnbr: (item.callNbr || item.callnbr || '').toString().trim(),
            custName: (item.custName || item.custname || '').toString().trim(),
            accMgr: (item.accMgr || item.accmgr || '').toString().trim(),
            jobstatus: (item.jobStatus || item.jobstatus || '').toString().trim(),
            custclas: (item.custClas || item.custclas || '').toString().trim(),
            scheduledstart: item.scheduledStart
              ? new Date(item.scheduledStart)
              : item.scheduledstart
                ? new Date(item.scheduledstart)
                : null,
            contnbr: (item.contNbr || item.contnbr || '').toString().trim(),
            description: item.description || '',
            changeAge: item.changeAge ?? item.changeage ?? '',
            origAge: item.origAge ?? item.origage ?? ''
          }));
          this.applyManagerFilter();

          // Past Due / Bill After PM
          this.pastDueData = data.summaryByManager || data.pastDueData || [];
          this.createPastDueChart();

          // Scheduled Percentage
          this.scheduledPercentageData = data.scheduledPercent || data.scheduledPercentageData || [];
          this.createScheduledPercentageChart();

          // Total Jobs to be Scheduled
          this.totalJobsData = data.totalUnscheduledJobs || data.totalJobsData || [];
          this.createTotalJobsChart();

          // Total Jobs Scheduled
          this.totalJobsScheduledData = data.totalScheduledJobs || data.totalJobsScheduledData || [];
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
    const billAfterPM = this.pastDueData.map(d => parseInt(d.couldBeBilled || d.couldbebilled || d.Couldbebilled || 0));

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
    return this.filteredGridData.slice(start, start + this.pageSize);
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredGridData.length / this.pageSize);
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

    this.filteredGridData.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      
      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.cdr.markForCheck();
  }

  onManagerFilterChange(): void {
    this.applyManagerFilter();
  }

  private applyManagerFilter(): void {
    const query = this.managerFilter.trim().toLowerCase();
    if (!query) {
      this.filteredGridData = [...this.gridData];
      this.currentPage = 1;
      this.cdr.markForCheck();
      return;
    }

    this.filteredGridData = this.gridData.filter(row =>
      (row.accMgr || '').toString().toLowerCase().includes(query)
    );
    this.currentPage = 1;
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
    this.filteredGridData.forEach(row => {
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
