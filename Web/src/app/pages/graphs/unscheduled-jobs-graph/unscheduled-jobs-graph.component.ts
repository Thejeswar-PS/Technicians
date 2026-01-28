import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { UnscheduledJobsGraphService } from './unscheduled-jobs-graph.service';

@Component({
  selector: 'app-unscheduled-jobs-graph',
  templateUrl: './unscheduled-jobs-graph.component.html',
  styleUrls: ['./unscheduled-jobs-graph.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnscheduledJobsGraphComponent implements OnInit {
  isLoading = false;
  errorMessage = '';
  selectedMonth = '';

  // Chart 1: Jobs by Month
  monthlyChartOptions: any;
  monthlyData: any[] = [];

  // Chart 2: Jobs by Account Manager (Funnel)
  accountManagerChartOptions: any;
  accountManagerData: any[] = [];

  constructor(
    private service: UnscheduledJobsGraphService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Set default month to current month
    const currentDate = new Date();
    this.selectedMonth = currentDate.toLocaleString('default', { month: 'long' });
    
    this.loadMonthlyData();
    this.loadAccountManagerData();
  }

  loadMonthlyData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.service.getUnscheduledJobsByMonth().subscribe({
      next: (response) => {
        console.log('Monthly API Response:', response);
        
        if (response.success && response.data) {
          this.monthlyData = response.data;
          this.createMonthlyChart();
        } else {
          this.errorMessage = 'Failed to load monthly data';
        }
        
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading monthly data:', error);
        this.errorMessage = error.message || 'An error occurred';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadAccountManagerData(): void {
    this.service.getUnscheduledJobsByAccountManager(this.selectedMonth).subscribe({
      next: (response) => {
        console.log('Account Manager API Response:', response);
        
        if (response.success && response.data) {
          this.accountManagerData = response.data;
          this.createAccountManagerChart();
        }
        
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading account manager data:', error);
        this.cdr.markForCheck();
      }
    });
  }

  onMonthClick(monthName: string): void {
    this.selectedMonth = monthName;
    this.loadAccountManagerData();
  }

  private createMonthlyChart(): void {
    const months = this.monthlyData.map(d => d.monthName || d.MonthName || '');
    const jobCounts = this.monthlyData.map(d => parseInt(d.jobs) || parseInt(d.Jobs) || 0);

    this.monthlyChartOptions = {
      series: [{
        name: 'Jobs Count',
        data: jobCounts
      }],
      chart: {
        type: 'bar',
        height: 500,
        animations: {
          enabled: false
        },
        toolbar: {
          show: true
        },
        events: {
          dataPointSelection: (event: any, chartContext: any, config: any) => {
            const monthName = months[config.dataPointIndex];
            if (monthName) {
              this.onMonthClick(monthName);
            }
          }
        }
      },
      colors: ['#5486ff', '#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#fa709a', '#fee140', '#30cfd0', '#330867'],
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '40px',
          borderRadius: 4,
          distributed: true,
          dataLabels: {
            position: 'top'
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number) {
          return val.toString();
        },
        offsetY: -20,
        style: {
          fontSize: '10pt',
          fontWeight: 'bold',
          colors: ['#000']
        }
      },
      xaxis: {
        categories: months,
        title: {
          text: 'Months',
          style: {
            fontSize: '14px',
            fontWeight: 'bold'
          }
        },
        labels: {
          style: {
            fontSize: '10pt',
            fontWeight: 'bold'
          }
        }
      },
      yaxis: {
        title: {
          text: 'No of Jobs',
          style: {
            fontSize: '14px',
            fontWeight: 'bold'
          }
        },
        labels: {
          formatter: (val: number) => Math.round(val).toString()
        }
      },
      tooltip: {
        enabled: true,
        y: {
          formatter: (val: number) => val.toString() + ' Jobs'
        }
      },
      legend: {
        show: false
      },
      grid: {
        borderColor: '#e7e7e7'
      }
    };

    this.cdr.markForCheck();
  }

  private createAccountManagerChart(): void {
    // Sort data by job count descending for funnel effect
    const sortedData = [...this.accountManagerData].sort((a, b) => {
      const aJobs = parseInt(a.jobs || a.Jobs || a.jobssa || a.Jobssa || 0);
      const bJobs = parseInt(b.jobs || b.Jobs || b.jobssa || b.Jobssa || 0);
      return bJobs - aJobs;
    });

    // Format data for horizontal bar chart with proper labels
    const chartData = sortedData.map(d => ({
      x: d.offId || d.offid || '',
      y: parseInt(d.jobs || d.Jobs || d.jobssa || d.Jobssa || 0)
    }));

    // Create gradient colors - highest value = darkest red, lowest = lightest
    const maxValue = Math.max(...chartData.map(d => d.y));
    const minValue = Math.min(...chartData.map(d => d.y));
    const range = maxValue - minValue || 1;

    const colors = chartData.map(d => {
      const normalized = (d.y - minValue) / range; // 0 to 1, where 1 is highest
      
      // Create red gradient from light (#FF9999) to dark (#B31C1C)
      const h = 0; // Red hue
      const s = 100; // Saturation
      const l = Math.round(70 - (normalized * 40)); // Light from 70% to 30%
      
      return `hsl(${h}, ${s}%, ${l}%)`;
    });

    // Create a pyramid/funnel-like effect using horizontal bar chart
    this.accountManagerChartOptions = {
      series: [{
        name: 'Jobs Count',
        data: chartData.map((d, index) => ({
          x: d.x,
          y: d.y,
          fillColor: colors[index]
        }))
      }],
      chart: {
        type: 'bar',
        height: 600,
        animations: {
          enabled: false
        },
        toolbar: {
          show: true
        },
        margin: {
          right: 150
        }
      },
      colors: colors,
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 8,
          barHeight: '65%',
          distributed: true,
          dataLabels: {
            position: 'outside'
          }
        }
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        type: 'numeric',
        title: {
          text: 'No of Jobs',
          style: {
            fontSize: '14px',
            fontWeight: 'bold'
          }
        }
      },
      yaxis: {
        title: {
          text: 'Account Manager',
          style: {
            fontSize: '14px',
            fontWeight: 'bold'
          }
        },
        labels: {
          style: {
            fontSize: '9pt',
            fontWeight: 'bold'
          },
          maxWidth: 100
        }
      },
      tooltip: {
        enabled: true,
        y: {
          formatter: (val: number) => val.toString() + ' Jobs'
        }
      },
      legend: {
        show: false
      },
      grid: {
        borderColor: '#e7e7e7'
      }
    };

    this.cdr.markForCheck();
  }
}
