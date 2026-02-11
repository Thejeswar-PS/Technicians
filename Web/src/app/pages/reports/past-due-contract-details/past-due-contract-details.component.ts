import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ReportService } from 'src/app/core/services/report.service';

interface PastDueRow {
  siteId: string;
  siteName: string;
  accountManager: string;
  contractNo: string;
  contractType: string;
  invoiceDate: string | null;
  mailingDate: string | null;
  amount: number | null;
}

interface ChartDataPoint {
  accountManager: string;
  contractCount: number;
}

interface StatusOption {
  label: string;
  value: string;
}

type SortField = 'siteId' | 'siteName' | 'accountManager' | 'contractNo' | 'contractType' | 'invoiceDate' | 'amount';
type SortOrder = 'asc' | 'desc';

@Component({
  selector: 'app-past-due-contract-details',
  templateUrl: './past-due-contract-details.component.html',
  styleUrls: ['./past-due-contract-details.component.scss']
})
export class PastDueContractDetailsComponent implements OnInit {

  loading = false;
  errorMessage = '';
  pastDueRows: PastDueRow[] = [];
  chartData: ChartDataPoint[] = [];
  selectedStatus = '30';
  
  // Sorting
  sortField: SortField = 'contractNo';
  sortOrder: SortOrder = 'asc';

  statusOptions: StatusOption[] = [
    {
      label: 'Past Due 0 - 30 Days',
      value: '30'
    },
    {
      label: 'Past Due 30 + Days',
      value: '60'
    },
    {
      label: 'All',
      value: 'All'
    }
  ];

  // Chart properties
  currentChartType: 'bar' | 'pie' = 'bar';
  chartColors = [
    '#667eea', '#764ba2', '#f472b6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#f97316', '#84cc16', '#ec4899', '#3b82f6', '#14b8a6', '#eab308', 
    '#a855f7', '#22c55e', '#6366f1', '#db2777', '#0891b2', '#059669'
  ];

  // ApexCharts configuration
  public barChartOptions: any = {
    series: [],
    chart: { type: 'bar', height: 350 },
    dataLabels: { enabled: false },
    plotOptions: {},
    xaxis: { categories: [] },
    yaxis: {},
    colors: [],
    tooltip: {},
    legend: { show: false },
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

  constructor(private reportService: ReportService, private router: Router) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';
    this.pastDueRows = [];
    this.chartData = [];

    this.reportService.getPastDueContractDetails(this.selectedStatus).pipe(
      map(response => this.normalizeResponse(response || {})),
      catchError(err => {
        console.error('Past due contract details load failed', err);
        this.errorMessage = 'Unable to load past due contract details right now. Please try again.';
        return of({ rows: [], chartData: [] });
      })
    ).subscribe(data => {
      this.pastDueRows = data.rows;
      this.chartData = data.chartData;
      this.applySorting();
      this.renderChart();
      this.loading = false;
    });
  }

  onStatusChange(): void {
    this.loadData();
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
    if (!this.pastDueRows.length) return;

    this.pastDueRows.sort((a, b) => {
      let aVal: any = a[this.sortField];
      let bVal: any = b[this.sortField];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      let comparison = 0;
      if (aVal > bVal) comparison = 1;
      else if (aVal < bVal) comparison = -1;

      return this.sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  getSortIcon(field: SortField): string {
    if (this.sortField !== field) return 'bi-arrow-down-up';
    return this.sortOrder === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
  }

  private normalizeResponse(response: any): { rows: PastDueRow[], chartData: ChartDataPoint[] } {
    let rows: PastDueRow[] = [];
    let chartData: ChartDataPoint[] = [];

    // Map 'details' array from API response
    if (response.details && Array.isArray(response.details)) {
      rows = response.details.map((row: any) => this.normalizeRow(row));
    }

    // Map 'summary' array from API response for chart data
    if (response.summary && Array.isArray(response.summary)) {
      chartData = response.summary.map((point: any) => ({
        accountManager: point?.accountManager ?? '',
        contractCount: point?.contractNo ?? 0
      }));
    }

    return { rows, chartData };
  }

  private normalizeRow(row: any): PastDueRow {
    return {
      siteId: row?.custNmbr?.trim() ?? '',
      siteName: row?.custName?.trim() ?? '',
      accountManager: row?.offName?.trim() ?? '',
      contractNo: row?.contNbr?.trim() ?? '',
      contractType: row?.cntType?.trim() ?? '',
      invoiceDate: row?.invoDate ?? null,
      mailingDate: row?.mailingDate ?? null,
      amount: row?.docAmnt ?? null
    };
  }

  trackByRow(index: number, row: PastDueRow): string {
    return `${row.contractNo}-${row.siteId}-${index}`;
  }

  getStatusLabel(): string {
    const selected = this.statusOptions.find(opt => opt.value === this.selectedStatus);
    return selected ? selected.label : 'Past Due';
  }

  setChartType(type: 'bar' | 'pie'): void {
    this.currentChartType = type;
  }

  private renderChart(): void {
    if (!this.chartData || this.chartData.length === 0) {
      return;
    }

    const labels = this.chartData.map(item => item.accountManager.trim());
    const values = this.chartData.map(item => item.contractCount);
    
    // Get colors for each bar
    const barColors = labels.map((_, index) => this.chartColors[index % this.chartColors.length]);

    // Bar Chart Configuration
    this.barChartOptions = {
      series: [{
        name: 'Contract Count',
        data: values.map((value, index) => ({
          x: labels[index],
          y: value,
          fillColor: barColors[index]
        }))
      }],
      chart: {
        type: 'bar',
        height: 400,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: any) => val,
        offsetY: -25,
        style: {
          colors: ['#000'],
          fontSize: '12px',
          fontWeight: 600
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 4,
          dataLabels: {
            position: 'top',
            hideOverflowingLabels: false
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
          text: 'Number of Contracts'
        }
      },
      colors: barColors,
      tooltip: {
        y: {
          formatter: (val: number) => `${val} contracts`
        }
      },
      legend: {
        show: false
      },
      grid: {
        show: true
      },
      theme: {
        mode: 'light'
      }
    };

    // Pie Chart Configuration
    this.donutChartOptions = {
      series: values,
      chart: {
        type: 'donut',
        height: 400,
        toolbar: {
          show: true,
          tools: {
            download: true
          }
        }
      },
      labels: labels,
      colors: this.chartColors.slice(0, labels.length),
      legend: {
        show: false
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val} contracts`
        }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '14px',
                fontWeight: 600
              },
              value: {
                show: true,
                fontSize: '14px',
                fontWeight: 600
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '12px'
        }
      },
      responsive: [{
        breakpoint: 480,
        options: {
          legend: {
            position: 'bottom'
          }
        }
      }]
    };
  }

  goBack(): void {
    this.router.navigate(['/reports']);
  }
}
