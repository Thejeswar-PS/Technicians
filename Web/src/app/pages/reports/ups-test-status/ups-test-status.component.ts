import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
  styleUrls: ['./ups-test-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
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
  makeChartData: any[] = [];
  makeSummary: { [key: string]: number } = {};
  
  // Chart animation control
  public chartAnimationComplete: boolean = false;
  private cachedMakeChartData: {make: string, count: number}[] = [];
  private cachedYAxisTicks: number[] = [];
  private cachedBarWidth: number = 60;
  
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
  isProcessingData: boolean = false;
  
  // Error handling
  errorMessage: string = '';
  makeCountsErrorMessage: string = '';
  chartErrorMessage: string = '';
  makeChartErrorMessage: string = '';

  // Chart properties
  showChart: boolean = true;
  showMakeChart: boolean = true;

  // Interactive chart properties
  public hoveredSliceIndex: number = -1;
  public hoveredMakeSliceIndex: number = -1;
  public hoveredStatusSliceIndex: number = -1;
  public tooltipPosition = { x: 0, y: 0 };
  public makeTooltipPosition = { x: 0, y: 0 };
  public statusTooltipPosition = { x: 0, y: 0 };
  
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

  // Make Chart Options - initialized in setupMakeChartOptions()
  public makeBarChartOptions: any = {};
  
  // Canvas references for charts
  @ViewChild('makeBarChart', { static: false }) makeBarChartCanvas!: ElementRef<HTMLCanvasElement>;

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

  // Track archive value to detect archive-only changes
  private lastArchiveValue: boolean = false;

  // Status options matching backend - New Units Test Status system
  statusOptions = [
    { value: 'All', label: 'All' },
    { value: 'INP', label: 'In Progress' },
    { value: 'NCR', label: 'Needs Components for Repair' },
    { value: 'MPJ', label: 'Missing Parts from Job' }
  ];
  
  // Chart colors - same as stripped parts component
  private chartColors = [
    '#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0',
    '#546E7A', '#26a69a', '#D10CE8', '#FF6C00', '#1E90FF',
    '#FF1493', '#32CD32', '#FFD700', '#9370DB', '#FF6347',
    '#14b8a6', '#f97316', '#a855f7', '#22c55e', '#3b82f6'
  ];

  // Priority options (with all standard priorities)
  priorityOptions = [
    { value: 'All', label: 'All' },
    { value: 'High', label: 'High' },
    { value: 'Normal', label: 'Normal' },
    { value: 'Low', label: 'Low' },
    { value: 'At Convenience', label: 'At Convenience' }
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
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    // Setup chart options first
    this.initializeCharts();

    this.lastArchiveValue = this.filterForm.get('archive')?.value ?? false;
    
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
    this.setupMakeChartOptions();
  }

  private setupMakeChartOptions(): void {
    
    // Initialize make bar chart options with exact stripped parts design
    this.makeBarChartOptions = {
      series: [],
      chart: {
        type: 'bar',
        height: 350,
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
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '60%',
          borderRadius: 10,
          borderRadiusApplication: 'end',
          borderRadiusWhenStacked: 'last',
          dataLabels: {
            position: 'top'
          },
          distributed: true,
          colors: {
            ranges: [{
              from: 0,
              to: 1000,
              color: '#008FFB'
            }]
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: any) {
          return val;
        },
        offsetY: -20,
        style: {
          fontSize: '12px',
          fontFamily: 'inherit',
          colors: ['#304758']
        }
      },
      xaxis: {
        categories: [],
        labels: {
          rotate: -45,
          rotateAlways: false,
          hideOverlappingLabels: true,
          showDuplicates: false,
          trim: false,
          minHeight: undefined,
          maxHeight: 120,
          style: {
            colors: [],
            fontSize: '11px',
            fontFamily: 'inherit',
            fontWeight: 400,
            cssClass: 'apexcharts-xaxis-label'
          },
          offsetX: 0,
          offsetY: 0,
          format: undefined
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        title: {
          text: 'Number of Units',
          style: {
            color: '#304758',
            fontSize: '12px',
            fontFamily: 'inherit',
            fontWeight: 400
          }
        },
        labels: {
          style: {
            colors: '#304758',
            fontSize: '11px',
            fontFamily: 'inherit',
            fontWeight: 400
          }
        }
      },
      colors: ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0', '#546E7A', '#26a69a', '#D10CE8'],
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      tooltip: {
        enabled: true,
        shared: false,
        followCursor: false,
        intersect: false,
        inverseOrder: false,
        custom: undefined,
        fillSeriesColor: false,
        theme: false,
        style: {
          fontSize: '12px',
          fontFamily: 'inherit'
        },
        onDatasetHover: {
          highlightDataSeries: false
        },
        x: {
          show: true,
          format: 'dd MMM',
          formatter: undefined
        },
        y: {
          formatter: function (val: any) {
            return val + ' units';
          },
          title: {
            formatter: (seriesName: any) => seriesName + ': '
          }
        },
        z: {
          formatter: undefined,
          title: 'Size: '
        },
        marker: {
          show: true
        }
      },
      grid: {
        borderColor: '#e7e7e7',
        row: {
          colors: ['#f3f3f3', 'transparent'],
          opacity: 0.5
        }
      },
      title: {
        text: 'UPS Units Count by Manufacturer',
        align: 'center',
        style: {
          fontSize: '16px',
          fontWeight: 'bold',
          fontFamily: 'inherit',
          color: '#263238'
        }
      },
      legend: {
        show: false
      },
      theme: {}
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
          
          // Update status options from backend metadata
          if (response.validStatuses && response.statusLabels) {
            this.statusOptions = response.validStatuses.map(status => ({
              value: status,
              label: response.statusLabels[status] || status
            }));
          }
          
          // Update priority options from backend metadata  
          if (response.validPriorities && response.priorityLabels) {
            // Start with standard priority options
            const standardPriorities = [
              { value: 'All', label: 'All' },
              { value: 'High', label: 'High' },
              { value: 'Normal', label: 'Normal' },
              { value: 'Low', label: 'Low' },
              { value: 'At Convenience', label: 'At Convenience' }
            ];
            
            // Add any additional priorities from API that aren't already included
            const standardPriorityValues = ['All', 'High', 'Normal', 'Low', 'At Convenience', 'ATC', 'at convenience', 'at_convenience', 'convenience'];
            const apiPriorities = response.validPriorities
              .filter(p => {
                const normalizedP = p.toLowerCase().trim().replace(/[_\s]/g, '');
                const normalizedStandard = standardPriorityValues.map(s => s.toLowerCase().trim().replace(/[_\s]/g, ''));
                return !normalizedStandard.includes(normalizedP);
              })
              .map(priority => ({
                value: priority,
                label: response.priorityLabels[priority] || priority
              }));
            
            this.priorityOptions = [...standardPriorities, ...apiPriorities];
          }
          
          // Update technician dropdown options
          this.technicianOptions = [
            { value: 'All', label: 'All Technicians' },
            ...this.technicians
              .filter(tech => tech.toUpperCase() !== 'PS') // Remove PS from the list
              .map(tech => ({ value: tech, label: tech }))
          ];
          
          this.makeCounts = response.makeCounts || [];
        }
        this.isLoadingMetadata = false;
      },
      error: (error: any) => {
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
          
          // Calculate manufacturer summary from the data
          this.calculateMakeSummary();
          
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

  // Chart management methods removed - only bar chart supported

  // Force chart refresh
  refreshCharts(): void {
    if (this.hasMakeChartData()) {
      setTimeout(() => {
        this.updateMakeChart();
      }, 100);
    }
  }



  hasMakeChartData(): boolean {
    return Object.keys(this.makeSummary).length > 0;
  }

  private updateMakeChart(): void {
    if (!this.hasMakeChartData()) {
      return;
    }
    
    // Clear cached data to force recalculation with new data
    this.cachedMakeChartData = [];
    this.cachedYAxisTicks = [];
    this.cachedBarWidth = 0;
    this.chartAnimationComplete = false;
    
    const makeData = Object.entries(this.makeSummary).map(([make, count]) => ({
      make,
      count
    }));

    this.ngZone.run(() => {
      // Update only the data, preserve all styling from setupMakeChartOptions
      this.makeBarChartOptions = {
        ...this.makeBarChartOptions,
        series: [{
          name: 'Units',
          data: makeData.map(item => item.count)
        }],
        xaxis: {
          ...this.makeBarChartOptions.xaxis,
          categories: makeData.map(item => item.make)
        }
      };
      
      // Trigger change detection after chart update
      this.cdr.detectChanges();
    });
  }

  // Custom Chart Methods (matching stripped parts component)
  public getMakeChartData(): {make: string, count: number}[] {
    if (this.cachedMakeChartData.length > 0) {
      return this.cachedMakeChartData;
    }
    
    this.cachedMakeChartData = Object.entries(this.makeSummary).map(([make, count]) => ({
      make,
      count
    }));
    
    return this.cachedMakeChartData;
  }

  public getYAxisTicks(): number[] {
    if (this.cachedYAxisTicks.length > 0) {
      return this.cachedYAxisTicks;
    }
    
    // Always show 0-100 range regardless of data
    this.cachedYAxisTicks = [0, 20, 40, 60, 80, 100];
    return this.cachedYAxisTicks;
  }

  public getBarHeightPercentage(value: number): number {
    // Use fixed scale of 100 instead of dynamic max value
    return Math.min((value / 100) * 100, 100);
  }

  public getDynamicBarWidth(): number {
    if (this.cachedBarWidth > 0) {
      return this.cachedBarWidth;
    }
    
    const chartData = this.getMakeChartData();
    const totalBars = chartData.length;
    if (totalBars === 0) {
      this.cachedBarWidth = 60;
      return this.cachedBarWidth;
    }
    
    // Calculate optimal width based on container and number of bars
    const containerWidth = 800; // Approximate chart container width
    const availableWidth = containerWidth - (totalBars * 12); // Account for gaps
    const calculatedWidth = Math.floor(availableWidth / totalBars);
    
    // Ensure minimum and maximum widths for readability
    this.cachedBarWidth = Math.max(50, Math.min(120, calculatedWidth));
    return this.cachedBarWidth;
  }

  public getMakeColor(make: string, index: number): string {
    const colors = ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0', '#546E7A', '#26a69a', '#D10CE8'];
    return colors[index % colors.length];
  }

  public getProgressColor(index: number): string {
    return this.chartColors[index % this.chartColors.length];
  }

  // TrackBy function to prevent unnecessary re-rendering
  public trackByMake(index: number, item: {make: string, count: number}): string {
    return item.make;
  }

  // Check if a unit is stripped (has stripSNo value)
public isUnitStripped(item: any): boolean {
  return !!(item.stripSNo && item.stripSNo.trim());
}

public hasStripSerial(item: any): boolean {
  return !!(item.stripSNo && item.stripSNo.trim().length > 0);
}


  // Mark animation as complete after initial load
  public markAnimationComplete(): void {
    setTimeout(() => {
      this.chartAnimationComplete = true;
      this.cdr.detectChanges(); // Only trigger change detection when animation completes
    }, 1500); // Wait for all animations to complete
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

  private calculateMakeSummary(): void {
    // Use make counts data directly from backend
    this.makeSummary = {};
    
    if (this.makeCounts && this.makeCounts.length > 0) {
      this.makeCounts.forEach(item => {
        const make = item.make || 'Unknown';
        const count = item.makeCount || 0;
        this.makeSummary[make] = count;
      });
    }
    

  }

  private processChartData(): void {
    this.isLoadingChart = true;
    this.isLoadingMakeChart = true;
    
    try {
      // Process manufacturer chart data
      this.makeChartData = Object.entries(this.makeSummary).map(([make, count], index) => ({
        make,
        count,
        color: this.getMakeColor(make, index)
      }));

      // Update charts with a small delay to ensure proper rendering
      setTimeout(() => {
        this.updateMakeChart();
        this.markAnimationComplete();
        
        // Additional refresh after another small delay
        setTimeout(() => {
          this.refreshCharts();
        }, 200);
      }, 100);
      
    } catch (error) {
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

  // Navigation methods
  navigateToNewUnitTest(unit: UPSTestStatusDto): void {
    // Get current archive status from filter form
    const isArchived = this.filterForm.get('archive')?.value || false;
    
    // Navigate to new unit test page with rowIndex as query param
    // The New Unit Test page will fetch complete data using the API
    this.router.navigate(['/reports/new-unit-test'], {
      queryParams: {
        rowIndex: unit.rowIndex,
        loadFromApi: 'true',
        archive: isArchived
      }
    });
  }

  navigateToNewUnitTestByMake(make: string): void {
    // Navigate to new unit test page with pre-filled make field
    this.router.navigate(['/reports/new-unit-test'], {
      queryParams: {
        make: make
      }
    });
  }

  // Public methods for template
  onStatusChange(): void {
    const currentArchiveValue = this.filterForm.get('archive')?.value ?? false;
    if (currentArchiveValue !== this.lastArchiveValue) {
      this.lastArchiveValue = currentArchiveValue;
      this.loadMetadata();
    }

    this.loadUPSTestStatusData();
  }

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

  get filteredUnitsList(): UPSTestStatusDto[] {
    return this.filteredData;
  }

  get paginatedItems(): UPSTestStatusDto[] {
    return this.displayedData;
  }

  get itemsPerPage(): number {
    return this.pageSize;
  }

  get totalItems(): number {
    return this.totalRecords;
  }

  changeItemsPerPage(size: number): void {
    this.onPageSizeChange(size);
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) {
      return;
    }

    this.onPageChange(page);
  }

  sortBy(column: string): void {
    this.sortData(column);
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
    if (!status) return 'badge-light-secondary';
    
    const normalizedStatus = status.toLowerCase().trim();
    
    // Handle specific status values
    switch (normalizedStatus) {
      case 'nos':
      case 'not started':
      case 'not_started':
      case 'pending':
        return 'badge-light-secondary';
        
      case 'inp':
      case 'in progress':
      case 'in_progress':
      case 'inprogress':
      case 'active':
      case 'working':
        return 'badge-light-primary'; // Soft Blue
        
      case 'needs components for repair':
      case 'needs_components_for_repair':
      case 'needs components':
      case 'awaiting components':
      case 'def':
      case 'deferred':
      case 'delayed':
      case 'on hold':
      case 'on_hold':
      case 'hold':
        return 'badge-light-warning'; // Amber/Orange
        
      case 'missing parts from job':
      case 'missing_parts_from_job':
      case 'missing parts':
      case 'parts missing':
      case 'ncr':
      case 'rejected':
      case 'failed':
      case 'cancelled':
      case 'canceled':
      case 'error':
        return 'badge-light-danger'; // Red/Soft Red
        
      case 'com':
      case 'completed':
      case 'complete':
      case 'done':
      case 'finished':
        return 'badge-light-success';
        
      default:
        return 'badge-light-secondary';
    }
  }

  getPriorityBadgeClass(priority: string): string {
    if (!priority) return 'badge-light-secondary';
    
    const normalizedPriority = priority.toLowerCase().trim();
    
    // Handle common priority values
    switch (normalizedPriority) {
      case 'high':
      case 'urgent':
      case 'critical':
      case 'emergency':
        return 'badge-light-danger';
        
      case 'normal':
      case 'medium':
      case 'standard':
      case 'regular':
        return 'badge-light-primary';
        
      case 'low':
      case 'minor':
        return 'badge-light-success';
        
      case 'atc':
      case 'at convenience':
      case 'at_convenience':
      case 'convenience':
      case 'when convenient':
        return 'badge-light-info';
        
      default:
        return 'badge-light-secondary';
    }
  }

  formatCurrency(value: string): string {
    if (!value) return '$0.00';
    const numValue = this.parseNumericValue(value);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numValue);
  }

  formatDate(dateValue: string | Date | undefined): string {
    if (!dateValue) return 'N/A';
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      return date.toLocaleDateString();
    } catch {
      return dateValue instanceof Date ? dateValue.toISOString() : dateValue;
    }
  }

  formatDateTime(dateValue: string | Date | undefined): string {
    if (!dateValue) return 'N/A';
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      return date.toLocaleString(); // Includes both date and time
    } catch {
      return dateValue instanceof Date ? dateValue.toISOString() : dateValue;
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

  get makeSummaryItems(): any[] {
    return Object.entries(this.makeSummary).map(([make, count]) => ({
      make,
      count
    }));
  }

  getMakeIconClass(make: string): string {
    // Return different icon classes for different manufacturers
    const iconMap: { [key: string]: string } = {
      'APC': 'text-primary',
      'Tripp Lite': 'text-info',
      'Eaton': 'text-success',
      'CyberPower': 'text-warning',
      'Liebert': 'text-danger'
    };
    return iconMap[make] || 'text-secondary';
  }

  getMakePercentage(make: string): number {
    const total = this.filteredData.length;
    const makeCount = this.makeSummary[make] || 0;
    return total > 0 ? Math.round((makeCount / total) * 100) : 0;
  }

  // Utility method for parsing numeric values
}