import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { getCSSVariableValue } from 'src/app/_metronic/kt/_utils';
import {
  TechMileageMonthlySummaryDto,
  TechMileageResponseDto,
  TechMileageTechnicianDto
} from 'src/app/core/model/tech-mileage.model';
import { TechMileageService } from 'src/app/core/services/tech-mileage.service';
import { AuthService } from 'src/app/modules/auth';
import { CommonService } from 'src/app/core/services/common.service';

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

  // Role-based visibility
  isTechnician: boolean = false;
  employeeStatus: string = '';

  /**
   * Mirrors legacy: gvMileage.Columns[2].Visible = !techSelected
   * where techSelected = !string.IsNullOrEmpty(ddlTech.SelectedItem.Text)
   * Hide the Tech Name column when the user is restricted by role,
   * OR when a manager has a specific technician selected (not "All").
   */
  get showTechColumn(): boolean {
    if (this.isTechnician) return false;
    const selected = (this.selectedTechName || '').trim().toLowerCase();
    return selected === '' || selected === 'all';
  }

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

  constructor(
    private techMileageService: TechMileageService,
    private router: Router,
    private authService: AuthService,
    private _commonService: CommonService
  ) {}

  ngOnInit(): void {
    if (!this.validateAccess()) return;
    this.setDefaultRange();
    this.loadTechnicians();
    // loadReport() is called inside loadTechnicians() after auto-select completes
  }

  /**
   * Validates that userData exists in localStorage.
   * Unauthorized users (no session) are redirected to the login page.
   */
  private validateAccess(): boolean {
    const userDataStr = localStorage.getItem('userData');
    if (!userDataStr) {
      this.authService.logout();
      return false;
    }
    return true;
  }

  applyFilters(): void {
    if (!this.startDate || !this.endDate) {
      this.errorMessage = 'Start and end dates are required.';
      return;
    }

    this.currentPage = 1;
    this.loadReport();
  }

  resetToCurrentQuarter(): void {
    this.setDefaultRange();
    this.currentPage = 1;
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

        // Apply role-based filter via API (mirrors legacy GetEmployeeStatusForJobList)
        this.applyRoleBasedFilters();
      },
      error: () => {
        this.errorMessage = 'Failed to load technicians list.';
        // Still apply role-based filters and load report
        this.applyRoleBasedFilters();
      }
    });
  }

  /**
   * Mirrors legacy TechMileageDashboard.aspx.cs BindFilters():
   * Calls GetEmployeeStatusForJobList API to determine if the current user is a
   * Technician or TechManager.  If so, locks the tech dropdown to their own EmpID
   * and hides the Tech column.  Managers/Others get full access.
   */
  private applyRoleBasedFilters(): void {
    let windowsID = '';
    let empID = '';

    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        const empName = (userData.empName || userData.empLabel || '').toString().trim();
        windowsID = (userData.windowsID || userData.windowsId || empName).toString().trim();
        empID = (userData.empID || '').toString().trim();
      }
    } catch (e) {
      console.error('[TechMileage] Error reading userData:', e);
    }

    if (!windowsID) {
      // No windowsID — fall back to localStorage heuristic, then load report
      this.applyRoleFromLocalStorage();
      this.loadReport();
      return;
    }

    this._commonService.getEmployeeStatusForJobList(windowsID).subscribe({
      next: (statusData: any) => {
        // Handle both array [ { Status, EmpID } ] and object { status, empId } response shapes
        let status = '';
        let apiEmpId = '';

        if (Array.isArray(statusData) && statusData.length > 0) {
          const first = statusData[0] || {};
          status   = (first.Status   || first.status   || '').toString().trim();
          apiEmpId = (first.EmpID    || first.empID    || first.empId    || '').toString().trim();
        } else if (statusData && typeof statusData === 'object') {
          status   = (statusData.Status   || statusData.status   || '').toString().trim();
          apiEmpId = (statusData.EmpID    || statusData.empID    || statusData.empId    || '').toString().trim();
        }

        this.employeeStatus = status;
        console.log('[TechMileage] Employee status from API:', status, 'EmpID:', apiEmpId);

        const isTechRole =
          status.toLowerCase() === 'technician' ||
          status.toLowerCase() === 'techmanager' ||
          status.toLowerCase() === 'tech manager';

        if (isTechRole) {
          // RESTRICTED: lock dropdown to this user's own data (mirrors ddlTech.Enabled = false)
          this.isTechnician = true;
          this.techDropdownDisabled = true;

          const resolvedEmpId = (apiEmpId || empID).toString().trim().toUpperCase();
          const matched = this.technicians.find(
            (tech) => (tech.techID || '').toString().trim().toUpperCase() === resolvedEmpId
          );
          if (matched) {
            this.selectedTechName = matched.techName;
            console.log('[TechMileage] Restricted to technician:', matched.techName);
          }
        }
        // FULL ACCESS (Manager/Other): dropdown stays enabled, selectedTechName stays 'All'

        this.loadReport();
      },
      error: () => {
        console.warn('[TechMileage] GetEmployeeStatusForJobList API failed — falling back to localStorage heuristic.');
        this.applyRoleFromLocalStorage();
        this.loadReport();
      }
    });
  }

  /**
   * Fallback role detection when the API is unavailable.
   * Uses localStorage userData (role/empStatus fields) + tech-list name matching.
   */
  private applyRoleFromLocalStorage(): void {
    let empName = '';
    let windowsID = '';
    let empID = '';
    let empStatus = '';
    let userRole = '';

    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        empName   = (userData.empName   || userData.empLabel || '').toString().trim();
        windowsID = (userData.windowsID || userData.windowsId || empName).toString().trim();
        empID     = (userData.empID     || '').toString().trim();
        empStatus = (userData.empStatus || '').toString().trim().toUpperCase();
        userRole  = (userData.role      || '').toString().trim().toLowerCase();
      }
    } catch (e) {
      console.error('[TechMileage] Error reading userData:', e);
    }

    const normalize = (v: string) =>
      (v || '').toString().trim().toUpperCase().replace(/[^A-Z0-9. ]/g, '');

    const windowsIdTail = (windowsID || '').split('\\').pop() || windowsID;
    const userTokens = [
      normalize(empID),
      normalize(empName),
      normalize(windowsID),
      normalize(windowsIdTail)
    ].filter(Boolean);

    const matched = this.technicians.find((tech) => {
      const techTokens = [
        normalize(tech.techID),
        normalize(tech.techName)
      ].filter(Boolean);
      return userTokens.some((ut) =>
        techTokens.some((tt) => ut === tt || tt.startsWith(ut) || ut.startsWith(tt))
      );
    });

    if (matched) {
      this.isTechnician = true;
      this.selectedTechName = matched.techName;
      this.techDropdownDisabled = true;
      console.log('[TechMileage] Fallback: restricted to technician:', matched.techName);
    } else {
      const isTechByRole =
        empStatus === 'T' ||
        userRole.includes('technician') ||
        userRole === 'tech' ||
        userRole === 'techmanager';
      if (isTechByRole) {
        this.isTechnician = true;
        this.techDropdownDisabled = true;
      }
    }
  }

  private loadReport(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const techName = this.normalizeTechName(this.selectedTechName);

    const request = {
        startDate: this.startDate,
        endDate: this.endDate,
        techName: techName,
        pageNumber: this.currentPage,
        pageSize: this.pageSize
      };

    forkJoin({
      report: this.techMileageService.getTechMileageReport(request),
      monthlySummary: this.techMileageService.getTechMileageMonthlySummary(request).pipe(
        catchError(() => of([] as TechMileageMonthlySummaryDto[]))
      )
    }).subscribe({
        next: ({ report: response, monthlySummary }) => {
          if (response && response.success === false) {
            this.report = null;
            this.chartOptions = this.buildChartOptions([]);
            this.errorMessage = response.message || 'Unable to load tech mileage data.';
            this.isLoading = false;
            return;
          }

          this.report = response;

          const reportSummary = (response?.monthlySummary || []) as TechMileageMonthlySummaryDto[];
          const resolvedMonthlySummary = monthlySummary.length > 0
            ? monthlySummary
            : reportSummary.length > 0
              ? reportSummary
              : this.buildMonthlySummaryFromRecords(response?.mileageRecords || []);

          this.report.monthlySummary = resolvedMonthlySummary;
          if (resolvedMonthlySummary.length > 0) {
            this.report.totalMiles = resolvedMonthlySummary.reduce(
              (sum, item) => sum + Number(item?.totalMiles || 0),
              0
            );
            this.report.totalHours = Number(
              resolvedMonthlySummary
                .reduce((sum, item) => sum + Number(item?.totalHours || 0), 0)
                .toFixed(2)
            );
          }
          this.chartOptions = this.buildChartOptions(resolvedMonthlySummary);
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

    const labelColor = '#212529';
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
            fontSize: '14px'
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
            style: { colors: labelColor, fontSize: '14px' },
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
            style: { colors: labelColor, fontSize: '14px' },
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
      let aVal = column === 'origin' ? this.getOriginValue(a) : a[column];
      let bVal = column === 'origin' ? this.getOriginValue(b) : b[column];

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
    return this.report?.mileageRecords || [];
  }

  get totalPages(): number {
    if (!this.report?.totalJobs) return 0;
    return Math.ceil(this.report.totalJobs / this.pageSize);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadReport();
    }
  }

  changePageSize(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadReport();
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
      ...(this.showTechColumn ? ['Tech Name'] : []),
      'Address',
      'Origin',
      'Date',
      'Job Type',
      'Miles',
      'Time Taken'
    ];

    // Create CSV content
    let csv = headers.join(',') + '\n';
    data.forEach((record: any) => {
      csv += [
        `"${record.callNbr}"`,
        `"${record.custName}"`,
        ...(this.showTechColumn ? [`"${record.techName}"`] : []),
        `"${record.address}"`,
        `"${this.getOriginValue(record)}"`,
        `"${new Date(record.startDate).toLocaleDateString()}"`,
        `"${record.jobType}"`,
        `"${record.milesReported ?? ''}"`,
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

  getOriginValue(record: any): string {
    return (
      record?.origin ||
      record?.orgin ||
      record?.Origin ||
      record?.Orgin ||
      ''
    ).toString().trim();
  }

  private buildMonthlySummaryFromRecords(records: any[]): TechMileageMonthlySummaryDto[] {
    const mapByMonth = new Map<string, { totalMiles: number; totalHours: number }>();

    records.forEach((record) => {
      const rawDate = record?.startDate;
      const date = rawDate ? new Date(rawDate) : null;
      if (!date || Number.isNaN(date.getTime())) {
        return;
      }

      const monthKey = this.formatMonthKey(date);
      const existing = mapByMonth.get(monthKey) || { totalMiles: 0, totalHours: 0 };

      existing.totalMiles += Number(record?.milesReported || 0);
      existing.totalHours += Number(record?.hoursDecimal || 0);
      mapByMonth.set(monthKey, existing);
    });

    return Array.from(mapByMonth.entries())
      .sort(([a], [b]) => new Date(`${a} 01`).getTime() - new Date(`${b} 01`).getTime())
      .map(([month, totals]) => ({
        month,
        totalMiles: Math.round(totals.totalMiles),
        totalHours: Number(totals.totalHours.toFixed(2))
      }));
  }

  private formatMonthKey(date: Date): string {
    const month = date.toLocaleString('en-US', { month: 'short' });
    return `${month} ${date.getFullYear()}`;
  }
}
