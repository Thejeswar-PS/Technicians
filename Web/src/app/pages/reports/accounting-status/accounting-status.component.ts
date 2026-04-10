import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AccountingStatusService } from './accounting-status.service';

@Component({
  selector: 'app-accounting-status',
  templateUrl: './accounting-status.component.html',
  styleUrls: ['./accounting-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountingStatusComponent implements OnInit {
  isLoading = false;
  errorMessage = '';
  Math = Math; // Expose Math to template

  // Chart 1: Accounting Status
  accountingStatusChartOptions: any;
  accountingStatusData: any[] = [];

  // Chart 2: Contract Billing Status
  contractBillingChartOptions: any;
  contractBillingData: any[] = [];

  constructor(
    private service: AccountingStatusService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.service.getAccountingStatusData().subscribe({
      next: (response: any) => {
        console.log('Accounting Status API Response:', response);
        
        if (response && (response.accountingStatus || response.contractBillingStatus)) {
          // Chart 1: Accounting Status
          this.accountingStatusData = response.accountingStatus || [];
          this.createAccountingStatusChart();
          
          // Chart 2: Contract Billing Status
          this.contractBillingData = response.contractBillingStatus || [];
          this.createContractBillingChart();
        } else {
          this.errorMessage = 'Failed to load accounting status data';
        }
        
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        console.error('Error loading accounting status data:', error);
        this.errorMessage = error.message || 'An error occurred while loading the data';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private createAccountingStatusChart(): void {
    // Extract categories and values directly from API response
    const categories = this.accountingStatusData.map((d: any) => d.label || d.Label || '');
    const yvalues = this.accountingStatusData.map((d: any) => parseInt(d.value || d.Value || 0));

    const maxVal1 = Math.max(...yvalues, 1);
    const barHeight = Math.max(32, Math.min(52, Math.floor(400 / Math.max(categories.length, 1))));
    const chartHeight1 = Math.max(420, categories.length * (barHeight + 14) + 100);

    this.accountingStatusChartOptions = {
      series: [{
        name: 'Jobs',
        data: yvalues
      }],
      chart: {
        type: 'bar',
        height: chartHeight1,
        animations: { enabled: false },
        toolbar: { show: true },
        events: {
          dataPointSelection: (event: any, chartContext: any, config: any) => {
            const categoryIndex = config.dataPointIndex;
            const categoryName = categories[categoryIndex];
            const value = yvalues[categoryIndex];
            if (value && value !== 0) {
              this.navigateToDisplayCallsDetail(categoryName);
            }
          }
        }
      },
      colors: ['#7BB752'],
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: barHeight + 'px',
          borderRadius: 4,
          dataLabels: {
            position: 'center'
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => val > 0 ? val.toString() : '',
        style: { fontSize: '13px', fontWeight: '700', colors: ['#ffffff'] },
        offsetX: 0
      },
      xaxis: {
        categories: categories,
        title: { text: 'No of Jobs', style: { fontSize: '13px', fontWeight: '600' } },
        labels: {
          style: { fontSize: '12px' },
          formatter: (val: number) => Math.round(val).toString()
        },
        max: Math.ceil(maxVal1 * 1.15)
      },
      yaxis: {
        labels: {
          style: { fontSize: '13px', fontWeight: '600' },
          maxWidth: 240
        }
      },
      title: {
        text: 'DC Group - Accounting Status',
        align: 'center',
        style: { fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: { enabled: true, y: { formatter: (val: number) => val.toString() + ' Jobs' } },
      grid: {
        borderColor: '#e7e7e7',
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
        padding: { left: 10, right: 20, top: 10, bottom: 10 }
      }
    };

    this.cdr.markForCheck();
  }

  private createContractBillingChart(): void {
    const nonLiebertData = (this.contractBillingData || [])
      .map((d: any) => ({
        rawLabel: (d.label || d.Label || '').toString().trim(),
        value: parseInt((d.value || d.Value || 0), 10) || 0
      }))
      .filter((d: any) => /^non\s+liebert\s+contracts/i.test(d.rawLabel));

    const categories = nonLiebertData.map((d: any) =>
      this.capitalizeFirstLetter(d.rawLabel.replace(/^non\s+liebert\s+contracts\s*/i, '').trim())
    );
    const rawCategories = nonLiebertData.map((d: any) => d.rawLabel);
    const yvalues = nonLiebertData.map((d: any) => d.value);

    const maxVal2 = Math.max(...yvalues, 1);
    const barHeight2 = Math.max(32, Math.min(52, Math.floor(400 / Math.max(categories.length, 1))));
    const chartHeight2 = Math.max(420, categories.length * (barHeight2 + 14) + 100);

    this.contractBillingChartOptions = {
      series: [{
        name: 'Contract Count',
        data: yvalues
      }],
      chart: {
        type: 'bar',
        height: chartHeight2,
        animations: { enabled: false },
        toolbar: { show: true },
        events: {
          dataPointSelection: (event: any, chartContext: any, config: any) => {
            const categoryIndex = config.dataPointIndex;
            const categoryName = rawCategories[categoryIndex];
            const value = yvalues[categoryIndex];
            if (value && value !== 0) {
              this.navigateToDisplayCallsDetail(categoryName);
            }
          }
        }
      },
      colors: ['#FF9900'],
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: barHeight2 + 'px',
          borderRadius: 4,
          dataLabels: {
            position: 'center'
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => val > 0 ? val.toString() : '',
        style: { fontSize: '13px', fontWeight: '700', colors: ['#ffffff'] },
        offsetX: 0
      },
      xaxis: {
        categories: categories,
        title: { text: 'No of Contracts', style: { fontSize: '13px', fontWeight: '600' } },
        labels: {
          style: { fontSize: '12px' },
          formatter: (val: number) => Math.round(val).toString()
        },
        max: Math.ceil(maxVal2 * 1.15)
      },
      yaxis: {
        labels: {
          style: { fontSize: '13px', fontWeight: '600' },
          maxWidth: 240
        }
      },
      title: {
        text: 'DC Group - Contract Billing Status',
        align: 'center',
        style: { fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: { enabled: true, y: { formatter: (val: number) => val.toString() + ' Contracts' } },
      grid: {
        borderColor: '#e7e7e7',
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: false } },
        padding: { left: 10, right: 20, top: 10, bottom: 10 }
      }
    };

    this.cdr.markForCheck();
  }

  private navigateToDisplayCallsDetail(dataSetName: string): void {
    this.router.navigate(['/reports/display-calls-detail'], {
      queryParams: {
        dataSetName: dataSetName
      }
    });
  }

  refresh(): void {
    this.loadData();
  }

  private capitalizeFirstLetter(value: string): string {
    if (!value) {
      return '';
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
  }
}
