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

    this.accountingStatusChartOptions = {
      series: [{
        name: 'Jobs',
        data: yvalues
      }],
      chart: {
        type: 'bar',
        height: 450,
        animations: { enabled: false },
        toolbar: { show: true },
        events: {
          dataPointSelection: (event: any, chartContext: any, config: any) => {
            const categoryIndex = config.dataPointIndex;
            const categoryName = categories[categoryIndex];
            const value = yvalues[categoryIndex];
            
            // Only navigate if value is not 0 (matching legacy logic)
            if (value && value !== 0) {
              this.router.navigate(['/reports/dcg-display-report-details'], {
                queryParams: {
                  Page: 'AccountingStatus',
                  dataSetName: categoryName,
                  backbutton: 'AccountingStatus'
                }
              });
            }
          }
        }
      },
      colors: ['#7BB752'],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '45px',
          borderRadius: 4,
          dataLabels: {
            position: 'top'
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => val.toString(),
        style: { fontSize: '11px', fontWeight: 'bold' }
      },
      xaxis: {
        categories: categories,
        title: { text: '', style: { fontSize: '12px', fontWeight: 'bold' } },
        labels: {
          rotate: -45,
          rotateAlways: true,
          hideOverlappingLabels: true,
          style: { fontSize: '10px', fontWeight: 'bold' }
        }
      },
      yaxis: {
        title: { text: 'No of Jobs', style: { fontSize: '12px', fontWeight: 'bold' } },
        labels: { formatter: (val: number) => Math.round(val).toString() }
      },
      title: {
        text: 'DC Group - Accounting Status',
        align: 'center',
        style: { fontSize: '18px', fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: { enabled: true, y: { formatter: (val: number) => val.toString() + ' Jobs' } },
      grid: { borderColor: '#e7e7e7' }
    };

    this.cdr.markForCheck();
  }

  private createContractBillingChart(): void {
    // Extract categories and values directly from API response
    const categories = this.contractBillingData.map((d: any) => d.label || d.Label || '');
    const yvalues = this.contractBillingData.map((d: any) => parseInt(d.value || d.Value || 0));

    this.contractBillingChartOptions = {
      series: [{
        name: 'Contract Count',
        data: yvalues
      }],
      chart: {
        type: 'bar',
        height: 450,
        animations: { enabled: false },
        toolbar: { show: true },
        events: {
          dataPointSelection: (event: any, chartContext: any, config: any) => {
            const categoryIndex = config.dataPointIndex;
            const categoryName = categories[categoryIndex];
            const value = yvalues[categoryIndex];
            
            // Only navigate if value is not 0 (matching legacy logic)
            if (value && value !== 0) {
              this.router.navigate(['/reports/dcg-display-report-details'], {
                queryParams: {
                  Page: 'AccountingStatus',
                  dataSetName: categoryName,
                  backbutton: 'AccountingStatus'
                }
              });
            }
          }
        }
      },
      colors: ['#FF9900'],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '45px',
          borderRadius: 4,
          dataLabels: {
            position: 'top'
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: (val: number) => val.toString(),
        style: { fontSize: '11px', fontWeight: 'bold' }
      },
      xaxis: {
        categories: categories,
        title: { text: '', style: { fontSize: '12px', fontWeight: 'bold' } },
        labels: {
          rotate: -90,
          rotateAlways: true,
          hideOverlappingLabels: true,
          style: { fontSize: '11px', fontWeight: 'bold' }
        }
      },
      yaxis: {
        title: { text: 'No of Contracts', style: { fontSize: '12px', fontWeight: 'bold' } },
        labels: { formatter: (val: number) => Math.round(val).toString() }
      },
      title: {
        text: 'DC Group - Contract Billing Status Graph',
        align: 'center',
        style: { fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }
      },
      tooltip: { enabled: true, y: { formatter: (val: number) => val.toString() + ' Contracts' } },
      grid: { borderColor: '#e7e7e7' }
    };

    this.cdr.markForCheck();
  }

  refresh(): void {
    this.loadData();
  }
}
