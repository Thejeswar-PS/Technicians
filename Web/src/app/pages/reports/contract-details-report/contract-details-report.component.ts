import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { of, Subject } from 'rxjs';
import { catchError, map, debounceTime, takeUntil } from 'rxjs/operators';
import { ReportService } from 'src/app/core/services/report.service';

interface ContractDetailRow {
  customerNo: string;
  customerName: string;
  address: string;
  salesPerson: string;
  contractNo: string;
  poNumber: string;
  type: string;
  invoicedOn: string | null;
  amount: number | null;
}

interface CategoryOption {
  key: string;
  label: string;
}

interface ChartDataPoint {
  period: string;
  totalAmount: number;
}

type SortField = 'customerNo' | 'customerName' | 'address' | 'salesPerson' | 'contractNo' | 'poNumber' | 'type' | 'invoicedOn' | 'amount';
type SortOrder = 'asc' | 'desc';

@Component({
  selector: 'app-contract-details-report',
  templateUrl: './contract-details-report.component.html',
  styleUrls: ['./contract-details-report.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContractDetailsReportComponent implements OnInit, OnDestroy {

  loading = false;
  errorMessage = '';
  contractRows: ContractDetailRow[] = [];
  filteredContractRows: ContractDetailRow[] = [];
  displayedContractRows: ContractDetailRow[] = [];
  selectedCategory = 'Non Liebert Contracts not billed as of yesterday';
  customerNameFilter = '';
  sortField: SortField = 'contractNo';
  sortOrder: SortOrder = 'asc';

  // Performance optimization
  private destroy$ = new Subject<void>();
  private filterChange$ = new Subject<void>();
  pageSize = 50;
  currentPage = 1;
  Math = Math; // Expose Math object to template

  // Chart properties
  chartData: ChartDataPoint[] = [];
  currentChartType: 'bar' | 'pie' = 'bar';
  chartColors = [
    '#667eea', '#764ba2', '#f472b6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#f97316', '#84cc16', '#ec4899', '#3b82f6', '#14b8a6', '#eab308',
    '#a855f7', '#22c55e', '#6366f1', '#db2777', '#0891b2', '#059669'
  ];

  public barChartOptions: any = {
    series: [],
    chart: { type: 'bar', height: 350 },
    dataLabels: { enabled: false },
    plotOptions: {},
    xaxis: { categories: [] },
    yaxis: {},
    colors: [],
    tooltip: {},
    grid: {},
    theme: {}
  };

  public donutChartOptions: any = {
    series: [],
    chart: { type: 'donut', height: 350 },
    labels: [],
    colors: [],
    legend: {},
    tooltip: {},
    plotOptions: {},
    dataLabels: {},
    responsive: []
  };

  categoryOptions: CategoryOption[] = [
    {
      key: 'Non Liebert Contracts not billed as of yesterday',
      label: 'Non Liebert Contracts not billed as of yesterday'
    },
    {
      key: 'Non Liebert Contracts to be billed in next 30 days',
      label: 'Non Liebert Contracts to be billed in next 30 days'
    },
    {
      key: 'Non Liebert Contracts to be billed in next 60 days',
      label: 'Non Liebert Contracts to be billed in next 60 days'
    }
  ];

  constructor(private reportService: ReportService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    // Setup debounced filter change
    this.filterChange$
      .pipe(
        debounceTime(300),
        takeUntil(this.destroy$)
      )
      .subscribe(() => this.applyFilters());

    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';
    this.contractRows = [];

    this.reportService.getContractDetails(this.selectedCategory).pipe(
      map(rows => this.normalizeRows(rows || [])),
      catchError(err => {
        console.error('Contract details load failed', err);
        this.errorMessage = 'Unable to load contract details right now. Please try again.';
        return of([] as ContractDetailRow[]);
      })
    ).subscribe(rows => {
      this.contractRows = rows;
      this.applyFilters();
      this.loading = false;
    });
  }

  onCategoryChange(): void {
    this.sortField = 'contractNo';
    this.sortOrder = 'asc';
    this.customerNameFilter = '';
    this.loadData();
  }

  onCustomerNameFilterChange(): void {
    this.currentPage = 1;
    this.filterChange$.next();
  }

  private applyFilters(): void {
    if (!this.customerNameFilter.trim()) {
      this.filteredContractRows = [...this.contractRows];
    } else {
      const filterLower = this.customerNameFilter.toLowerCase().trim();
      this.filteredContractRows = this.contractRows.filter(row =>
        (row.customerName || '').toLowerCase().includes(filterLower)
      );
    }
    this.applySorting();
    this.generateChartData();
    this.updateDisplayedRows();
    this.cdr.markForCheck();
  }

  private updateDisplayedRows(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedContractRows = this.filteredContractRows.slice(startIndex, endIndex);
  }

  nextPage(): void {
    if (this.currentPage * this.pageSize < this.filteredContractRows.length) {
      this.currentPage++;
      this.updateDisplayedRows();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updateDisplayedRows();
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.filteredContractRows.length / this.pageSize);
  }

  setChartType(type: 'bar' | 'pie'): void {
    this.currentChartType = type;
  }

  private generateChartData(): void {
    if (!this.filteredContractRows || this.filteredContractRows.length === 0) {
      this.chartData = [];
      return;
    }

    // Group by month/year
    const groupedByMonth = new Map<string, number>();

    this.filteredContractRows.forEach(row => {
      if (row.invoicedOn) {
        const date = new Date(row.invoicedOn);
        const monthYear = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        const currentAmount = groupedByMonth.get(monthYear) || 0;
        groupedByMonth.set(monthYear, currentAmount + (row.amount || 0));
      }
    });

    // Sort by date and convert to array, limit to last 24 months for better performance
    this.chartData = Array.from(groupedByMonth.entries())
      .map(([period, totalAmount]) => ({
        period,
        totalAmount
      }))
      .sort((a, b) => {
        const dateA = new Date(a.period);
        const dateB = new Date(b.period);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(-24); // Limit to last 24 months

    this.renderChart();
  }

  private renderChart(): void {
    if (!this.chartData || this.chartData.length === 0) {
      return;
    }

    const labels = this.chartData.map(item => item.period);
    const values = this.chartData.map(item => Math.round(item.totalAmount * 100) / 100);

    // Get colors for each bar - reuse instead of creating new array
    const barColors = labels.map((_, index) => this.chartColors[index % this.chartColors.length]);

    // Simplified bar chart to reduce memory usage
    this.barChartOptions = {
      series: [{
        name: 'Total Amount',
        data: values
      }],
      chart: {
        type: 'bar',
        height: 350,
        animations: {
          enabled: false  // Disable animations for better performance
        },
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: false,
            reset: true
          }
        }
      },
      dataLabels: {
        enabled: false  // Disable for better performance
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 0,
          dataLabels: {
            position: 'top'
          },
          distributed: true
        }
      },
      xaxis: {
        categories: labels,
        labels: {
          style: {
            fontSize: '11px'
          },
          rotate: -45
        }
      },
      yaxis: {
        title: {
          text: 'Total Amount ($)'
        },
        labels: {
          formatter: (val: number) => `$${Math.round(val / 1000)}k`
        }
      },
      colors: barColors,
      tooltip: {
        enabled: true,
        y: {
          formatter: (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        }
      },
      grid: {
        borderColor: '#e7e7e7',
        xaxis: {
          lines: {
            show: false
          }
        }
      }
    };

    // Simplified donut chart
    const totalAmount = values.reduce((a, b) => a + b, 0);
    this.donutChartOptions = {
      series: values,
      chart: {
        type: 'donut',
        height: 350,
        animations: {
          enabled: false
        }
      },
      labels: labels,
      colors: labels.map((_, index) => this.chartColors[index % this.chartColors.length]),
      legend: {
        position: 'bottom',
        fontSize: '12px'
      },
      tooltip: {
        enabled: true,
        y: {
          formatter: (val: number) => `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => `${val.toFixed(0)}%`
      }
    };
  }

  sortBy(field: SortField): void {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortOrder = 'asc';
    }
    this.applySorting();
  }

  private applySorting(): void {
    this.filteredContractRows.sort((a, b) => {
      const aVal = a[this.sortField];
      const bVal = b[this.sortField];

      let comparison = 0;

      if (aVal == null && bVal == null) comparison = 0;
      else if (aVal == null) comparison = 1;
      else if (bVal == null) comparison = -1;
      else if (typeof aVal === 'string') {
        comparison = aVal.localeCompare(bVal as string);
      } else {
        comparison = (aVal as number) < (bVal as number) ? -1 : 1;
      }

      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  getSortIcon(field: SortField): string {
    if (this.sortField !== field) {
      return 'bi-arrow-down-up';
    }
    return this.sortOrder === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
  }

  private normalizeRows(rows: any[]): ContractDetailRow[] {
    return rows.map((row: any) => {
      const invoicedOn = row?.['Invoiced On'] ?? row?.invoicedOn ?? row?.invoiceDate ?? null;
      const amount = row?.['Amount'] ?? row?.amount ?? null;

      return {
        customerNo: row?.['Customer No'] ?? row?.customerNo ?? row?.customer ?? '',
        customerName: row?.['Customer Name'] ?? row?.customerName ?? '',
        address: row?.['Address'] ?? row?.address ?? '',
        salesPerson: row?.['SalesPerson'] ?? row?.salesPerson ?? '',
        contractNo: row?.['Contract No'] ?? row?.contractNo ?? '',
        poNumber: row?.['PORDNMBR'] ?? row?.poNumber ?? '',
        type: row?.['Type'] ?? row?.type ?? '',
        invoicedOn: invoicedOn,
        amount: amount !== null && amount !== undefined ? Number(amount) : null
      } as ContractDetailRow;
    });
  }

  trackByRow(index: number, row: ContractDetailRow): string {
    return `${row.contractNo}-${row.customerNo}-${row.poNumber}-${index}`;
  }
}