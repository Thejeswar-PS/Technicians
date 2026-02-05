import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { PartsPerformanceGraphService } from './parts-performance-graph.service';

@Component({
  selector: 'app-parts-performance-graph',
  templateUrl: './parts-performance-graph.component.html',
  styleUrls: ['./parts-performance-graph.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PartsPerformanceGraphComponent implements OnInit {
  isLoading = false;
  errorMessage = '';

  // Chart options
  foldersChartOptions: any;
  folderDaysChartOptions: any;
  returnsChartOptions: any;
  returnDaysChartOptions: any;
  testedChartOptions: any;
  testedDaysChartOptions: any;
  partsUnitsChartOptions: any;

  constructor(
    private service: PartsPerformanceGraphService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.markForCheck();

    this.service.getPartsPerformanceData().subscribe({
      next: (response: any) => {
        console.log('Parts Performance API Response:', response);
        
        if (response && response.tables && response.tables.length >= 5) {
          const table0 = response.tables[0] || [];
          const table1 = response.tables[1] || [];
          const table2 = response.tables[2] || [];
          const table3 = response.tables[3] || [];
          const table4 = response.tables[4] || [];

          this.createFoldersChart(table0);
          this.createFolderDaysChart(table1);
          this.createReturnsChart(table0);
          this.createReturnDaysChart(table2);
          this.createTestedChart(table0);
          this.createTestedDaysChart(table3);
          this.createPartsUnitsChart(table4);
        } else {
          this.errorMessage = 'Failed to load parts performance data';
        }
        
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: any) => {
        console.error('Error loading parts performance data:', error);
        this.errorMessage = error.message || 'An error occurred while loading the data';
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private createFoldersChart(data: any[]): void {
    const categories = data.map((d: any) => d.MonthName || d.monthName || '');
    const folders = data.map((d: any) => parseInt(d.Folders || d.folders || 0));

    this.foldersChartOptions = {
      series: [{ name: 'Jobs', data: folders }],
      chart: { type: 'bar', height: 350, animations: { enabled: false }, toolbar: { show: true } },
      colors: ['#7BB752'],
      plotOptions: { bar: { horizontal: false, columnWidth: '45px', borderRadius: 4, dataLabels: { position: 'top' } } },
      dataLabels: { enabled: true, formatter: (val: number) => val.toString(), style: { fontSize: '14px', fontWeight: 'bold' } },
      xaxis: { categories: categories, labels: { rotate: -45, style: { fontSize: '14px', fontWeight: 'bold' } } },
      yaxis: { labels: { formatter: (val: number) => Math.round(val).toString() } },
      title: { text: 'No of Folders Per Month', align: 'center', style: { fontSize: '16px', fontWeight: 'bold' } },
      tooltip: { enabled: true },
      grid: { borderColor: '#e7e7e7' }
    };
    this.cdr.markForCheck();
  }

  private createFolderDaysChart(data: any[]): void {
    const categories = data.map((d: any) => d.MonthName || d.monthName || '');
    const avgDays = data.map((d: any) => parseFloat(d.AvgDays || d.avgDays || 0));

    this.folderDaysChartOptions = {
      series: [{ name: 'Percentage', data: avgDays }],
      chart: { type: 'bar', height: 350, animations: { enabled: false }, toolbar: { show: true } },
      colors: ['#7BB752'],
      plotOptions: { bar: { horizontal: false, columnWidth: '45px', borderRadius: 4, dataLabels: { position: 'top' } } },
      dataLabels: { enabled: true, formatter: (val: number) => val.toFixed(1), style: { fontSize: '14px', fontWeight: 'bold' } },
      xaxis: { categories: categories, labels: { rotate: -45, style: { fontSize: '14px', fontWeight: 'bold' } } },
      yaxis: { labels: { formatter: (val: number) => val.toFixed(1) } },
      title: { text: 'Avg Days Taken to Process the Folders', align: 'center', style: { fontSize: '16px', fontWeight: 'bold' } },
      tooltip: { enabled: true },
      grid: { borderColor: '#e7e7e7' }
    };
    this.cdr.markForCheck();
  }

  private createReturnsChart(data: any[]): void {
    const categories = data.map((d: any) => d.MonthName || d.monthName || '');
    const returned = data.map((d: any) => parseInt(d.ReturnedParts || d.returnedParts || 0));
    const notReturned = data.map((d: any) => parseInt(d.NotReturned || d.notReturned || 0));

    this.returnsChartOptions = {
      series: [
        { name: 'Returned Parts', data: returned },
        { name: 'Not Returned', data: notReturned }
      ],
      chart: { type: 'bar', height: 350, animations: { enabled: false }, toolbar: { show: true } },
      colors: ['#7BB752', '#FF9900'],
      plotOptions: { bar: { horizontal: false, columnWidth: '45px', borderRadius: 4, dataLabels: { position: 'top' } } },
      dataLabels: { enabled: true, formatter: (val: number) => val.toString(), style: { fontSize: '12px', fontWeight: 'bold' } },
      xaxis: { categories: categories, labels: { rotate: -45, style: { fontSize: '14px', fontWeight: 'bold' } } },
      yaxis: { labels: { formatter: (val: number) => Math.round(val).toString() } },
      title: { text: 'No of Parts Returned / Not Returned', align: 'center', style: { fontSize: '16px', fontWeight: 'bold' } },
      tooltip: { enabled: true },
      grid: { borderColor: '#e7e7e7' },
      legend: { position: 'top' }
    };
    this.cdr.markForCheck();
  }

  private createReturnDaysChart(data: any[]): void {
    const categories = data.map((d: any) => d.MonthName || d.monthName || '');
    const avgDays = data.map((d: any) => parseFloat(d.AvgDays || d.avgDays || 0));

    this.returnDaysChartOptions = {
      series: [{ name: 'Total Jobs', data: avgDays }],
      chart: { type: 'bar', height: 350, animations: { enabled: false }, toolbar: { show: true } },
      colors: ['#7BB752'],
      plotOptions: { bar: { horizontal: false, columnWidth: '45px', borderRadius: 4, dataLabels: { position: 'top' } } },
      dataLabels: { enabled: true, formatter: (val: number) => val.toFixed(1), style: { fontSize: '14px', fontWeight: 'bold' } },
      xaxis: { categories: categories, labels: { rotate: -45, style: { fontSize: '14px', fontWeight: 'bold' } } },
      yaxis: { labels: { formatter: (val: number) => val.toFixed(1) } },
      title: { text: 'Avg Days Taken to Return the Parts', align: 'center', style: { fontSize: '16px', fontWeight: 'bold' } },
      tooltip: { enabled: true },
      grid: { borderColor: '#e7e7e7' }
    };
    this.cdr.markForCheck();
  }

  private createTestedChart(data: any[]): void {
    const categories = data.map((d: any) => d.MonthName || d.monthName || '');
    const tested = data.map((d: any) => parseInt(d.Tested || d.tested || 0));
    const notTested = data.map((d: any) => parseInt(d.NotTested || d.notTested || 0));

    this.testedChartOptions = {
      series: [
        { name: 'Tested', data: tested },
        { name: 'Not Tested', data: notTested }
      ],
      chart: { type: 'bar', height: 350, animations: { enabled: false }, toolbar: { show: true } },
      colors: ['#7BB752', '#FF9900'],
      plotOptions: { bar: { horizontal: false, columnWidth: '45px', borderRadius: 4, dataLabels: { position: 'top' } } },
      dataLabels: { enabled: true, formatter: (val: number) => val.toString(), style: { fontSize: '12px', fontWeight: 'bold' } },
      xaxis: { categories: categories, labels: { rotate: -45, style: { fontSize: '14px', fontWeight: 'bold' } } },
      yaxis: { labels: { formatter: (val: number) => Math.round(val).toString() } },
      title: { text: 'Monthly - Tested Parts / Not Tested', align: 'center', style: { fontSize: '16px', fontWeight: 'bold' } },
      tooltip: { enabled: true },
      grid: { borderColor: '#e7e7e7' },
      legend: { position: 'top' }
    };
    this.cdr.markForCheck();
  }

  private createTestedDaysChart(data: any[]): void {
    const categories = data.map((d: any) => d.MonthName || d.monthName || '');
    const avgDays = data.map((d: any) => parseFloat(d.AvgDays || d.avgDays || 0));

    this.testedDaysChartOptions = {
      series: [{ name: 'Total Jobs', data: avgDays }],
      chart: { type: 'bar', height: 350, animations: { enabled: false }, toolbar: { show: true } },
      colors: ['#7BB752'],
      plotOptions: { bar: { horizontal: false, columnWidth: '45px', borderRadius: 4, dataLabels: { position: 'top' } } },
      dataLabels: { enabled: true, formatter: (val: number) => val.toFixed(1), style: { fontSize: '14px', fontWeight: 'bold' } },
      xaxis: { categories: categories, labels: { rotate: -45, style: { fontSize: '14px', fontWeight: 'bold' } } },
      yaxis: { labels: { formatter: (val: number) => val.toFixed(1) } },
      title: { text: 'Avg Days Taken to Test the Parts', align: 'center', style: { fontSize: '16px', fontWeight: 'bold' } },
      tooltip: { enabled: true },
      grid: { borderColor: '#e7e7e7' }
    };
    this.cdr.markForCheck();
  }

  private createPartsUnitsChart(data: any[]): void {
    const categories = data.map((d: any) => d.Category || d.category || '');
    const partsCounts = data.map((d: any) => parseInt(d.PartsCount || d.partsCount || 0));

    this.partsUnitsChartOptions = {
      series: [{ name: 'Parts', data: partsCounts }],
      chart: { type: 'bar', height: 450, animations: { enabled: false }, toolbar: { show: true } },
      colors: ['#7BB752'],
      plotOptions: { bar: { horizontal: false, columnWidth: '80px', borderRadius: 4, dataLabels: { position: 'top' } } },
      dataLabels: { enabled: true, formatter: (val: number) => val.toString(), style: { fontSize: '12px', fontWeight: 'bold' } },
      xaxis: { categories: categories, labels: { rotate: -45, style: { fontSize: '14px', fontWeight: 'bold' } } },
      yaxis: { labels: { formatter: (val: number) => Math.round(val).toString() } },
      title: { text: 'Parts / Units Testing', align: 'center', style: { fontSize: '16px', fontWeight: 'bold' } },
      tooltip: { enabled: true },
      grid: { borderColor: '#e7e7e7' }
    };
    this.cdr.markForCheck();
  }

  refresh(): void {
    this.loadData();
  }
}
