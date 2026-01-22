import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { UPSTestStatusService } from '../../../core/services/ups-test-status.service';
import { CommonService } from 'src/app/core/services/common.service';
import { AuthService } from 'src/app/modules/auth';
import { ToastrService } from 'ngx-toastr';
import { 
  UPSTestStatusDto, 
  UPSTestStatusRequest, 
  UPSTestStatusResponse,
  MakeCountDto,
  StatusSummaryItem,
  UPSTestMetadataResponse
} from '../../../core/model/ups-test-status.model';

@Component({
  selector: 'app-ups-test-status',
  templateUrl: './ups-test-status.component.html',
  styleUrls: ['./ups-test-status.component.scss']
})
export class UPSTestStatusComponent implements OnInit, OnDestroy, AfterViewInit {

  // Form and filters
  filterForm: FormGroup;

  // Data properties
  upsTestStatusList: UPSTestStatusDto[] = [];
  filteredData: UPSTestStatusDto[] = [];
  makeCounts: MakeCountDto[] = [];
  technicians: string[] = [];
  statusSummary: { [key: string]: number } = {};
  statusLabels: { [key: string]: string } = {};
  priorityLabels: { [key: string]: string } = {};
  
  // Chart data
  statusChartData: any[] = [];
  makeChartData: any = null;
  
  // Available filter options (populated from data)
  availableMakes: string[] = [];
  availableModels: string[] = [];
  availableKvaRanges: string[] = [];
  availableTechnicians: string[] = [];
  
  // Loading states
  isLoading: boolean = false;
  isLoadingMetadata: boolean = false;
  isLoadingChart: boolean = false;
  isLoadingMakeChart: boolean = false;
  isLoadingStatusChart: boolean = false;
  isProcessingData: boolean = false;
  
  // Error handling
  errorMessage: string = '';
  makeCountsErrorMessage: string = '';
  chartErrorMessage: string = '';
  makeChartErrorMessage: string = '';
  statusChartErrorMessage: string = '';

  // Chart properties
  showChart: boolean = true;
  showMakeChart: boolean = true;
  showStatusChart: boolean = true;
  currentChartType: 'bar' | 'pie' = 'bar';
  currentMakeChartType: 'bar' | 'pie' = 'bar';
  currentStatusChartType: 'bar' | 'pie' = 'bar';

  // Interactive chart properties
  public hoveredSliceIndex: number = -1;
  public hoveredMakeSliceIndex: number = -1;
  public hoveredStatusSliceIndex: number = -1;
  public tooltipPosition = { x: 0, y: 0 };
  public makeTooltipPosition = { x: 0, y: 0 };
  public statusTooltipPosition = { x: 0, y: 0 };
  
  // Chart colors - Modern vibrant palette
  chartColors = [
    '#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#f97316', '#84cc16', '#ec4899', '#6366f1',
    '#14b8a6', '#f97316', '#a855f7', '#22c55e', '#3b82f6'
  ];

  // ApexCharts configurations
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

  // Status Chart Options
  public statusBarChartOptions: any = {
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

  public statusDonutChartOptions: any = {
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
  
  // Canvas references for charts
  @ViewChild('makeBarChart', { static: false }) makeBarChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusBarChart', { static: false }) statusBarChartCanvas!: ElementRef<HTMLCanvasElement>;

  // Sorting
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Pagination
  currentPage: number = 1;
  pageSize: number = 100;
  totalRecords: number = 0;
  displayedData: UPSTestStatusDto[] = [];

  // Search
  searchTerm: string = '';

  // Subscriptions
  private subscriptions: Subscription = new Subscription();
  
  // Destroy subject for subscription cleanup
  private destroy$ = new Subject<void>();
  
  // Make Math available in template
  public Math = Math;

  // View modes
  viewMode: 'list' | 'details' = 'list';
  selectedUnit: UPSTestStatusDto | null = null;

  // Status options matching backend
  statusOptions = [
    { value: 'All', label: 'All' },
    { value: 'Inp', label: 'In Progress' },
    { value: 'NCR', label: 'Needs Components for Repair' },
    { value: 'Missing', label: 'Missing parts from Job' }
  ];
  
  // Priority options
  priorityOptions = [
    { value: 'All', label: 'All' },
    { value: 'High', label: 'High' },
    { value: 'Normal', label: 'Normal' },
    { value: 'Low', label: 'Low' },
    { value: 'Atc', label: 'At Convenience' }
  ];
  
  // Technician options (populated from API)
  technicianOptions: { value: string; label: string }[] = [
    { value: 'All', label: 'All Technicians' }
  ];

  constructor(
    private formBuilder: FormBuilder,
    private upsTestStatusService: UPSTestStatusService,
    private commonService: CommonService,
    private location: Location,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private toastr: ToastrService,
    private ngZone: NgZone
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadMetadata();
    this.setupFormSubscriptions();
    this.loadUPSTestStatusData();
  }

  ngAfterViewInit(): void {
    // Initialize charts after view init if needed
    setTimeout(() => {
      this.initializeCharts();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.subscriptions.unsubscribe();
  }

  private initializeForm(): void {
    this.filterForm = this.formBuilder.group({
      assignedTo: ['All'],
      status: ['All'],
      priority: ['All'],
      archive: [false],
      searchTerm: [''],
      makeFilter: ['All'],
      modelFilter: ['All'],
      kvaFilter: ['All']
    });
  }

  private setupFormSubscriptions(): void {
    // Subscribe to form changes and reload data
    const formSubscription = this.filterForm.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(300),
      distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr))
    ).subscribe(() => {
      this.loadUPSTestStatusData();
    });
    
    this.subscriptions.add(formSubscription);
  }

  private initializeCharts(): void {
    this.setupBarChartOptions();
    this.setupDonutChartOptions();
  }

  private setupBarChartOptions(): void {
    this.barChartOptions = {
      series: [],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: { show: true }
      },
      dataLabels: { enabled: true },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          endingShape: 'rounded'
        }
      },
      xaxis: { categories: [] },
      yaxis: {},
      colors: this.chartColors,
      tooltip: {},
      grid: { borderColor: '#f1f1f1' },
      theme: { mode: 'light' }
    };
  }

  private setupDonutChartOptions(): void {
    this.donutChartOptions = {
      series: [],
      chart: {
        type: 'donut',
        height: 350
      },
      labels: [],
      colors: this.chartColors,
      legend: {
        position: 'bottom'
      },
      tooltip: {},
      plotOptions: {
        pie: {
          donut: {
            size: '65%'
          }
        }
      },
      dataLabels: {
        enabled: true
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            width: 200
          },
          legend: {
            position: 'bottom'
          }
        }
      }]
    };
  }

  private loadMetadata(): void {
    this.isLoadingMetadata = true;
    const archive = this.filterForm.get('archive')?.value || false;
    
    this.upsTestStatusService.getUPSTestMetadata(archive).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: UPSTestMetadataResponse) => {
        if (response.success) {
          this.technicians = response.technicians || [];
          this.statusSummary = response.statusSummary || {};
          this.statusLabels = response.statusLabels || {};
          this.priorityLabels = response.priorityLabels || {};
          
          // Update technician dropdown options
          this.technicianOptions = [
            { value: 'All', label: 'All Technicians' },
            ...this.technicians.map(tech => ({ value: tech, label: tech }))
          ];
          
          this.makeCounts = response.makeCounts || [];
        }
        this.isLoadingMetadata = false;
      },
      error: (error: any) => {
        console.error('Error loading UPS test metadata:', error);
        this.errorMessage = 'Failed to load metadata. Please try again.';
        this.isLoadingMetadata = false;
      }
    });
  }

  private loadUPSTestStatusData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    const formValues = this.filterForm.value;
    const request: UPSTestStatusRequest = {
      assignedTo: formValues.assignedTo || 'All',
      status: formValues.status || 'All',
      priority: formValues.priority || 'All',
      archive: formValues.archive || false
    };

    const dataSubscription = this.upsTestStatusService.getUPSTestStatus(request).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.upsTestStatusList = response.data.unitsData || [];
          this.makeCounts = response.data.makeCounts || [];
          this.totalRecords = response.totalRecords || this.upsTestStatusList.length;
          
          // Update filter options based on new data
          this.updateAvailableFilterOptions();
          
          // Apply client-side filters and update display
          this.applyClientSideFilters();
          
          // Process chart data
          this.processChartData();
        } else {
          this.errorMessage = response.message || 'Failed to load UPS test status data';
          this.upsTestStatusList = [];
          this.totalRecords = 0;
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading UPS test status:', error);
        this.errorMessage = error.error?.message || 'Failed to load UPS test status data. Please try again.';
        this.upsTestStatusList = [];
        this.totalRecords = 0;
        this.isLoading = false;
      }
    });
    
    this.subscriptions.add(dataSubscription);
  }

  private applyClientSideFilters(): void {
    this.isProcessingData = true;
    
    let filtered = [...this.upsTestStatusList];
    const formValues = this.filterForm.value;
    
    // Apply make filter
    if (formValues.makeFilter && formValues.makeFilter !== 'All') {
      filtered = filtered.filter(item => item.make === formValues.makeFilter);
    }
    
    // Apply model filter
    if (formValues.modelFilter && formValues.modelFilter !== 'All') {
      filtered = filtered.filter(item => item.model === formValues.modelFilter);
    }
    
    // Apply KVA filter
    if (formValues.kvaFilter && formValues.kvaFilter !== 'All') {
      filtered = filtered.filter(item => item.kva === formValues.kvaFilter);
    }
    
    // Apply search term filter
    const searchTerm = formValues.searchTerm?.toLowerCase().trim();
    if (searchTerm) {
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          value?.toString().toLowerCase().includes(searchTerm)
        )
      );
    }
    
    this.filteredData = filtered;
    this.totalRecords = this.filteredData.length;
    this.currentPage = 1; // Reset to first page when filters change
    this.updateDisplayedData();
    
    this.isProcessingData = false;
  }

  private updateDisplayedData(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedData = this.filteredData.slice(startIndex, endIndex);
  }

  // Chart management methods
  setMakeChartType(type: 'bar' | 'pie'): void {
    this.currentMakeChartType = type;
    this.updateMakeChart();
  }

  setStatusChartType(type: 'bar' | 'pie'): void {
    this.currentStatusChartType = type;
    this.updateStatusChart();
  }

  hasChartData(): boolean {
    return this.makeCounts && this.makeCounts.length > 0;
  }

  hasStatusChartData(): boolean {
    return Object.keys(this.statusSummary).length > 0;
  }

  private updateMakeChart(): void {
    if (!this.hasChartData()) return;
    
    this.ngZone.run(() => {
      // Update make chart based on current type
      if (this.currentMakeChartType === 'bar') {
        this.barChartOptions = {
          ...this.barChartOptions,
          series: [{
            name: 'Units',
            data: this.makeCounts.map(item => item.makeCount)
          }],
          xaxis: {
            categories: this.makeCounts.map(item => item.make)
          }
        };
      } else {
        this.donutChartOptions = {
          ...this.donutChartOptions,
          series: this.makeCounts.map(item => item.makeCount),
          labels: this.makeCounts.map(item => item.make)
        };
      }
    });
  }

  private updateStatusChart(): void {
    if (!this.hasStatusChartData()) return;
    
    const statusData = Object.entries(this.statusSummary).map(([status, count]) => ({
      status,
      label: this.statusLabels[status] || status,
      count
    }));

    this.ngZone.run(() => {
      if (this.currentStatusChartType === 'bar') {
        this.barChartOptions = {
          ...this.barChartOptions,
          series: [{
            name: 'Count',
            data: statusData.map(item => item.count)
          }],
          xaxis: {
            categories: statusData.map(item => item.label)
          }
        };
      } else {
        this.donutChartOptions = {
          ...this.donutChartOptions,
          series: statusData.map(item => item.count),
          labels: statusData.map(item => item.label)
        };
      }
    });
  }

  // Data processing methods
  private updateAvailableFilterOptions(): void {
    // Extract unique makes
    this.availableMakes = ['All', ...new Set(this.upsTestStatusList.map(item => item.make).filter(make => make))];
    
    // Extract unique models
    this.availableModels = ['All', ...new Set(this.upsTestStatusList.map(item => item.model).filter(model => model))];
    
    // Extract unique KVA ranges
    this.availableKvaRanges = ['All', ...new Set(this.upsTestStatusList.map(item => item.kva).filter(kva => kva))];
    
    // Extract unique technicians
    this.availableTechnicians = ['All', ...new Set(this.upsTestStatusList.map(item => item.assignedTo).filter(tech => tech))];
  }

  private processChartData(): void {
    this.isLoadingChart = true;
    this.isLoadingMakeChart = true;
    
    try {
      // Process status chart data
      this.statusChartData = Object.entries(this.statusSummary).map(([status, count]) => ({
        status,
        label: this.statusLabels[status] || status,
        count,
        color: this.getStatusColor(status)
      }));

      // Update charts
      this.updateMakeChart();
      this.updateStatusChart();
      
    } catch (error) {
      console.error('Error processing chart data:', error);
      this.chartErrorMessage = 'Failed to process chart data';
      this.makeChartErrorMessage = 'Failed to process make chart data';
    } finally {
      this.isLoadingChart = false;
      this.isLoadingMakeChart = false;
    }
  }

  private getStatusColor(status: string): string {
    const statusColorMap: { [key: string]: string } = {
      'Nos': '#6c757d', // Secondary
      'Inp': '#0d6efd', // Primary
      'Def': '#ffc107', // Warning
      'Com': '#198754', // Success
      'NCR': '#dc3545'  // Danger
    };
    return statusColorMap[status] || this.chartColors[0];
  }

  // Utility methods for cost handling
  getCostSummary(): { totalUnitCost: number; totalShipCost: number; avgUnitCost: number; avgShipCost: number } {
    const validUnits = this.filteredData.filter(unit => unit.unitCost && unit.shipCost);
    
    if (validUnits.length === 0) {
      return { totalUnitCost: 0, totalShipCost: 0, avgUnitCost: 0, avgShipCost: 0 };
    }

    const totalUnitCost = validUnits.reduce((sum, unit) => sum + this.parseNumericValue(unit.unitCost), 0);
    const totalShipCost = validUnits.reduce((sum, unit) => sum + this.parseNumericValue(unit.shipCost), 0);
    
    return {
      totalUnitCost,
      totalShipCost,
      avgUnitCost: totalUnitCost / validUnits.length,
      avgShipCost: totalShipCost / validUnits.length
    };
  }

  // Detail view methods
  viewUnitDetails(unit: UPSTestStatusDto): void {
    this.selectedUnit = unit;
    this.viewMode = 'details';
  }

  closeDetailsView(): void {
    this.selectedUnit = null;
    this.viewMode = 'list';
  }

  // Public methods for template
  onFilterChange(): void {
    this.loadUPSTestStatusData();
  }

  onArchiveToggle(): void {
    this.loadMetadata(); // Reload metadata when archive status changes
    this.loadUPSTestStatusData();
  }

  onSearchTermChange(): void {
    this.applyClientSideFilters();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updateDisplayedData();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 1;
    this.updateDisplayedData();
  }

  sortData(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredData.sort((a, b) => {
      let aVal = this.getColumnValue(a, column);
      let bVal = this.getColumnValue(b, column);
      
      // Handle numeric sorting for costs
      if (column === 'unitCost' || column === 'shipCost') {
        aVal = this.parseNumericValue(aVal?.toString() || '0');
        bVal = this.parseNumericValue(bVal?.toString() || '0');
      }
      
      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.updateDisplayedData();
  }

  private getColumnValue(item: UPSTestStatusDto, column: string): any {
    return (item as any)[column];
  }

  private parseNumericValue(value: string): number {
    const cleanValue = value.replace(/[$,]/g, '').trim();
    return parseFloat(cleanValue) || 0;
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return 'bi-arrow-down-up';
    return this.sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  getFilterBadgeClass(): string {
    if (this.totalRecords === 0) return 'badge-light-warning';
    if (this.totalRecords < 10) return 'badge-light-success';
    if (this.totalRecords < 50) return 'badge-light-primary';
    return 'badge-light-info';
  }

  getStatusIconClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'passed':
        return 'text-success';
      case 'in progress':
      case 'testing':
        return 'text-warning';
      case 'failed':
      case 'error':
        return 'text-danger';
      case 'pending':
      case 'waiting':
        return 'text-info';
      default:
        return 'text-secondary';
    }
  }

  getStatusPercentage(status: string): number {
    if (!this.filteredData || this.filteredData.length === 0) return 0;
    const statusCount = this.filteredData.filter(item => item.status === status).length;
    return Math.round((statusCount / this.filteredData.length) * 100);
  }

  getVisiblePages(): number[] {
    const totalPages = this.totalPages;
    const current = this.currentPage;
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, current - delta); i <= Math.min(totalPages - 1, current + delta); i++) {
      range.push(i);
    }

    if (current - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (current + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots.filter(p => typeof p === 'number') as number[];
  }

  trackByIndex(index: number): number {
    return index;
  }

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize);
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'nos': return 'badge-light-secondary';
      case 'inp': return 'badge-light-primary';
      case 'def': return 'badge-light-warning';
      case 'com': return 'badge-light-success';
      case 'ncr': return 'badge-light-danger';
      default: return 'badge-light-secondary';
    }
  }

  getPriorityBadgeClass(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'atc': return 'badge-light-info';
      default: return 'badge-light-secondary';
    }
  }

  formatCurrency(value: string): string {
    if (!value) return '$0.00';
    const numValue = this.parseNumericValue(value);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numValue);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString; // Return original if parsing fails
    }
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString(); // Includes both date and time
    } catch {
      return dateString; // Return original if parsing fails
    }
  }

  clearFilters(): void {
    this.filterForm.reset({
      assignedTo: 'All',
      status: 'All',
      priority: 'All',
      archive: false,
      searchTerm: '',
      makeFilter: 'All',
      modelFilter: 'All',
      kvaFilter: 'All'
    });
  }

  exportData(): void {
    this.toastr.info('Export functionality will be implemented', 'Coming Soon');
  }

  refreshData(): void {
    this.loadMetadata();
    this.loadUPSTestStatusData();
  }

  goBack(): void {
    this.location.back();
  }

  get statusSummaryItems(): StatusSummaryItem[] {
    return Object.entries(this.statusSummary).map(([status, count]) => ({
      status,
      label: this.statusLabels[status] || status,
      count
    }));
  }
}