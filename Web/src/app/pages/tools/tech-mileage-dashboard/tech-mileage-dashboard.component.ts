import { Component, OnInit } from '@angular/core';
import { getCSSVariableValue } from 'src/app/_metronic/kt/_utils';
import {
  TechMileageMonthlySummaryDto,
  TechMileageResponseDto,
  TechMileageTechnicianDto
} from 'src/app/core/model/tech-mileage.model';
import { TechMileageService } from 'src/app/core/services/tech-mileage.service';

@Component({
  selector: 'app-tech-mileage-dashboard',
  templateUrl: './tech-mileage-dashboard.component.html',
  styleUrls: ['./tech-mileage-dashboard.component.scss']
})
export class TechMileageDashboardComponent implements OnInit {
  technicians: TechMileageTechnicianDto[] = [];
  selectedTechName: string = 'All';
  startDate: string = '';
  endDate: string = '';
  techDropdownDisabled: boolean = false;

  report: TechMileageResponseDto | null = null;
  chartOptions: any = {};

  isLoading: boolean = false;
  errorMessage: string = '';

  // Sorting
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Pagination
  currentPage: number = 1;
  pageSize: number = 200;
  pageSizeOptions: number[] = [100, 150, 200, 300];

  constructor(private techMileageService: TechMileageService) {}

  ngOnInit(): void {
    this.setDefaultRange();
    this.loadTechnicians();
    this.loadReport();
  }

  applyFilters(): void {
    if (!this.startDate || !this.endDate) {
      this.errorMessage = 'Start and end dates are required.';
      return;
    }

    this.loadReport();
  }

  resetToCurrentQuarter(): void {
    this.setDefaultRange();
    this.loadReport();
  }

  private loadTechnicians(): void {
    this.techMileageService.getTechnicians().subscribe({
      next: (techs) => {
        const normalized = (techs || []).map((tech: any) => ({
          techID: tech.techID || tech.techId || '',
          techName: tech.techName || tech.techname || ''
        }));

        const hasAll = normalized.some((tech) => tech.techName.toLowerCase() === 'all');
        this.technicians = hasAll
          ? normalized
          : [{ techID: 'ALL', techName: 'All' }, ...normalized];

        // Auto-select technician based on user role
        this.autoSelectTechnician();
      },
      error: () => {
        this.errorMessage = 'Failed to load technicians list.';
      }
    });
  }

  private autoSelectTechnician(): void {
    // Check if current user has a stored tech role preference
    const storedTechName = localStorage.getItem('userTechName');
    const storedUserRole = localStorage.getItem('userRole');

    if (storedUserRole === 'Technician' || storedUserRole === 'TechManager') {
      if (storedTechName) {
        const tech = this.technicians.find(t => t.techName === storedTechName);
        if (tech) {
          this.selectedTechName = tech.techName;
          this.techDropdownDisabled = true;
          return;
        }
      }
    }
  }

  private loadReport(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const techName = this.normalizeTechName(this.selectedTechName);

    this.techMileageService
      .getTechMileageReport({
        startDate: this.startDate,
        endDate: this.endDate,
        techName: techName
      })
      .subscribe({
        next: (response) => {
          this.report = response;
          this.chartOptions = this.buildChartOptions(response?.monthlySummary || []);
          this.isLoading = false;
        },
        error: () => {
          this.errorMessage = 'Unable to load tech mileage data.';
          this.report = null;
          this.chartOptions = this.buildChartOptions([]);
          this.isLoading = false;
        }
      });
  }

  private buildChartOptions(summary: TechMileageMonthlySummaryDto[]): any {
    const categories = summary.map((item) => item.month || '');
    const miles = summary.map((item) => item.totalMiles || 0);
    const hours = summary.map((item) => Number(item.totalHours || 0));

    const labelColor = getCSSVariableValue('--kt-gray-700');
    const borderColor = getCSSVariableValue('--kt-gray-200');
    const milesColor = getCSSVariableValue('--kt-info');
    const hoursColor = getCSSVariableValue('--kt-warning');

    return {
      series: [
        {
          name: 'Miles',
          type: 'column',
          data: miles
        },
        {
          name: 'Hours',
          type: 'line',
          data: hours
        }
      ],
      chart: {
        fontFamily: 'inherit',
        type: 'line',
        height: 320,
        toolbar: { show: false }
      },
      stroke: {
        width: [0, 3],
        curve: 'smooth'
      },
      plotOptions: {
        bar: {
          columnWidth: '38%',
          borderRadius: 6
        }
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: {
            colors: labelColor,
            fontSize: '12px'
          }
        }
      },
      yaxis: [
        {
          title: {
            text: 'Miles',
            style: { color: milesColor }
          },
          labels: {
            style: { colors: labelColor, fontSize: '12px' },
            formatter: (value: number) => Math.round(value).toString()
          }
        },
        {
          opposite: true,
          title: {
            text: 'Hours',
            style: { color: hoursColor }
          },
          labels: {
            style: { colors: labelColor, fontSize: '12px' },
            formatter: (value: number) => Math.round(value).toString()
          }
        }
      ],
      legend: {
        show: false
      },
      colors: [milesColor, hoursColor],
      grid: {
        borderColor,
        strokeDashArray: 4,
        yaxis: { lines: { show: true } }
      },
      tooltip: {
        shared: true,
        intersect: false
      }
    };
  }

  private normalizeTechName(value: string): string | null {
    const trimmed = (value || '').trim();
    if (!trimmed || trimmed.toLowerCase() === 'all') {
      return null;
    }
    return trimmed;
  }

  private setDefaultRange(): void {
    const today = new Date();
    const quarter = Math.floor(today.getMonth() / 3);
    const start = new Date(today.getFullYear(), quarter * 3, 1);
    const end = new Date(today.getFullYear(), quarter * 3 + 3, 0);

    this.startDate = this.formatDate(start);
    this.endDate = this.formatDate(end);
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  sortData(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    if (!this.report?.mileageRecords) return;

    this.report.mileageRecords.sort((a: any, b: any) => {
      let aVal = a[column];
      let bVal = b[column];

      // Handle null/undefined
      if (aVal == null) aVal = '';
      if (bVal == null) bVal = '';

      // Convert to comparable types
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      let comparison = 0;
      if (aVal > bVal) comparison = 1;
      if (aVal < bVal) comparison = -1;

      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.currentPage = 1; // Reset to first page after sorting
  }

  get paginatedRecords(): any[] {
    if (!this.report?.mileageRecords) return [];
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    return this.report.mileageRecords.slice(startIndex, endIndex);
  }

  get totalPages(): number {
    if (!this.report?.mileageRecords) return 0;
    return Math.ceil(this.report.mileageRecords.length / this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  changePageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const total = this.totalPages;
    const current = this.currentPage;

    // Show first page
    if (total > 0) pages.push(1);

    // Show pages around current
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
      if (!pages.includes(i)) pages.push(i);
    }

    // Show last page
    if (total > 1 && !pages.includes(total)) pages.push(total);

    return pages;
  }

  exportToExcel(): void {
    if (!this.report?.mileageRecords || this.report.mileageRecords.length === 0) {
      this.errorMessage = 'No data to export. Please run a report first.';
      return;
    }

    const data = this.report.mileageRecords;
    const headers = [
      'Job #',
      'Customer',
      'Address',
      'Date',
      'Miles',
      'Hours',
      'Minutes',
      'Job Type',
      'Time Taken'
    ];

    // Create CSV content
    let csv = headers.join(',') + '\n';
    data.forEach((record: any) => {
      csv += [
        `"${record.callNbr}"`,
        `"${record.custName}"`,
        `"${record.address}"`,
        `"${new Date(record.startDate).toLocaleDateString()}"`,
        record.milesReported,
        record.hoursDecimal,
        record.totalMinutes,
        `"${record.jobType}"`,
        `"${record.timeTaken}"`
      ].join(',') + '\n';
    });

    // Add summary
    csv += '\n\nSummary\n';
    csv += `Total Miles,${this.report.totalMiles}\n`;
    csv += `Total Hours,${this.report.totalHours}\n`;
    csv += `Total Jobs,${this.report.totalJobs}\n`;

    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `TechMileageReport_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
