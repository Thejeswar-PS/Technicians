import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CapFanUsageService } from '../../../core/services/cap-fan-usage.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-cap-fan-usage-yearly',
  templateUrl: './cap-fan-usage-yearly.component.html',
  styleUrls: ['./cap-fan-usage-yearly.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CapFanUsageYearlyComponent implements OnInit {
  // Filter inputs
  capPartNo: string = '';
  fanPartNo: string = '';
  battNo: string = '';
  igbNo: string = '';
  scrNo: string = '';
  fusNo: string = '';
  selectedYear: string = 'All';
  fiscalYears: string[] = [];

  // Data
  capsData: any[] = [];
  fansData: any[] = [];
  battsData: any[] = [];
  igbData: any[] = [];
  scrData: any[] = [];
  fusData: any[] = [];

  // Chart data
  capsChartData: any[] = [];
  fansChartData: any[] = [];
  battsChartData: any[] = [];
  igbChartData: any[] = [];
  scrChartData: any[] = [];
  fusChartData: any[] = [];

  // State
  isLoading: boolean = false;
  errorMessage: string = '';
  
  // Pagination
  maxDisplayRows: number = 20;
  showAllCaps: boolean = false;
  showAllFans: boolean = false;
  showAllBatts: boolean = false;
  showAllIgb: boolean = false;
  showAllScr: boolean = false;
  showAllFus: boolean = false;

  // Chart options
  capsChartOptions: any = {};
  fansChartOptions: any = {};
  battsChartOptions: any = {};
  igbChartOptions: any = {};
  scrChartOptions: any = {};
  fusChartOptions: any = {};

  constructor(
    private router: Router,
    private capFanUsageService: CapFanUsageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadFiscalYears();
    this.loadData();
  }

  private loadFiscalYears(): void {
    const currentYear = new Date().getFullYear();
    this.fiscalYears = [];
    
    for (let i = -5; i <= 0; i++) {
      this.fiscalYears.push((currentYear + i).toString());
    }
    this.fiscalYears.push('All');
    this.selectedYear = 'All';
  }

  search(): void {
    this.loadData();
  }

  private loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Reset show all flags
    this.showAllCaps = false;
    this.showAllFans = false;
    this.showAllBatts = false;
    this.showAllIgb = false;
    this.showAllScr = false;
    this.showAllFus = false;

    const yearValue = this.selectedYear === 'All' ? 0 : parseInt(this.selectedYear);

    this.capFanUsageService.getCapFanUsageByYear(
      this.capPartNo,
      this.fanPartNo,
      this.battNo,
      this.igbNo,
      this.scrNo,
      this.fusNo,
      yearValue
    ).subscribe({
      next: (response: any) => {
        
        if (response && response.success && response.data) {
          const data = response.data;
          
          // Grid data
          this.capsData = data.caps || [];
          this.fansData = data.fans || [];
          this.battsData = data.batts || data.batteries || [];
          this.igbData = data.igb || [];
          this.scrData = data.scr || [];
          this.fusData = data.fus || [];

          // Chart data (use the same data for charts)
          this.capsChartData = data.capsChart || data.caps || [];
          this.fansChartData = data.fansChart || data.fans || [];
          this.battsChartData = data.battsChart || data.batts || data.batteries || [];
          this.igbChartData = data.igbChart || data.igb || [];
          this.scrChartData = data.scrChart || data.scr || [];
          this.fusChartData = data.fusChart || data.fus || [];

          this.initializeCharts();
        } else {
          this.errorMessage = 'Invalid response format from server.';
        }
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.errorMessage = 'Error loading data. Please try again.';
        this.isLoading = false;
      }
    });
  }

  private initializeCharts(): void {
    this.capsChartOptions = this.createChartOptions(this.capsChartData, 'Total Caps', 'Year');
    this.fansChartOptions = this.createChartOptions(this.fansChartData, 'Total Fans', 'Year');
    this.battsChartOptions = this.createChartOptions(this.battsChartData, 'Total Batteries', 'Year');
    this.igbChartOptions = this.createChartOptions(this.igbChartData, 'Total IGB', 'Year');
    this.scrChartOptions = this.createChartOptions(this.scrChartData, 'Total SCR', 'Year');
    this.fusChartOptions = this.createChartOptions(this.fusChartData, 'Total FUS', 'Year');
  }

  private createChartOptions(data: any[], yAxisTitle: string, xAxisTitle: string): any {
    // Group by year and sum totals
    const yearMap = new Map<string, number>();
    
    data.filter(d => d.year && d.total).forEach(d => {
      const year = d.year.toString();
      const total = parseInt(d.total) || 0;
      yearMap.set(year, (yearMap.get(year) || 0) + total);
    });

    // Convert to array and sort by year
    const aggregatedData = Array.from(yearMap.entries())
      .map(([year, total]) => ({ year, total }))
      .sort((a, b) => a.year.localeCompare(b.year));

    const years = aggregatedData.map(d => d.year);
    const values = aggregatedData.map(d => d.total);


    return {
      series: [{
        name: yAxisTitle,
        data: values
      }],
      chart: {
        type: 'bar',
        height: 300,
        animations: {
          enabled: false
        },
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false
          }
        }
      },
      colors: ['#428bca'],
      dataLabels: {
        enabled: false
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 0,
          dataLabels: {
            position: 'top'
          }
        }
      },
      xaxis: {
        categories: years,
        title: {
          text: xAxisTitle,
          style: {
            fontSize: '14px',
            fontWeight: 'bold'
          }
        },
        labels: {
          rotate: -45,
          rotateAlways: false,
          hideOverlappingLabels: true,
          trim: true,
          style: {
            fontSize: '11px'
          }
        }
      },
      yaxis: {
        title: {
          text: yAxisTitle,
          style: {
            fontSize: '14px',
            fontWeight: 'bold'
          }
        },
        labels: {
          formatter: (val: number) => val ? Math.round(val).toString() : '0'
        }
      },
      tooltip: {
        enabled: true,
        y: {
          formatter: (val: number) => val ? val.toLocaleString() : '0'
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
  }

  exportToExcel(data: any[], fileName: string): void {
    if (!data || data.length === 0) {
      alert('No data to export');
      return;
    }

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = { Sheets: { 'data': worksheet }, SheetNames: ['data'] };
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  goBack(): void {
    this.router.navigate(['/graphs']);
  }

  // TrackBy functions for performance
  trackByIndex(index: number): number {
    return index;
  }

  // Get display data with pagination
  getDisplayData(data: any[], showAll: boolean): any[] {
    return showAll ? data : data.slice(0, this.maxDisplayRows);
  }

  // Get column keys from first row
  getColumnKeys(data: any[]): string[] {
    return data.length > 0 ? Object.keys(data[0]) : [];
  }

  // Toggle show all for each grid
  toggleShowAll(gridName: string): void {
    switch(gridName) {
      case 'caps': this.showAllCaps = !this.showAllCaps; break;
      case 'fans': this.showAllFans = !this.showAllFans; break;
      case 'batts': this.showAllBatts = !this.showAllBatts; break;
      case 'igb': this.showAllIgb = !this.showAllIgb; break;
      case 'scr': this.showAllScr = !this.showAllScr; break;
      case 'fus': this.showAllFus = !this.showAllFus; break;
    }
    this.cdr.markForCheck();
  }
}
