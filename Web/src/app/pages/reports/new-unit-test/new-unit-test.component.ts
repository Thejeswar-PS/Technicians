import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NewUnitTestService } from '../../../core/services/new-unit-test.service';
import { UPSTestStatusService } from '../../../core/services/ups-test-status.service';
import { CommonService } from 'src/app/core/services/common.service';
import { AuthService } from 'src/app/modules/auth';
import { ToastrService } from 'ngx-toastr';
import { 
  UPSTestStatusDto, 
  MakeCountDto,
  UPSTestMetadataResponse
} from '../../../core/model/ups-test-status.model';
import {
  NewUniTestResponse,
  NewUniTestApiResponse,
  MoveUnitToStrippingDto,
  MoveUnitToStrippingApiResponse,
  SaveUpdateNewUnitTestDto,
  SaveUpdateUnitTestResponse,
  SaveUpdateNewUnitResultDto,
  SaveUpdateUnitTestResultResponse
} from '../../../core/model/new-unit-test.model';
import { StrippedUnitsStatusDto } from '../../../core/model/stripped-units-status.model';

@Component({
  selector: 'app-new-unit-test',
  templateUrl: './new-unit-test.component.html',
  styleUrls: ['./new-unit-test.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewUnitTestComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('chartContainer') chartContainer!: ElementRef;

  // Observables and Subscriptions
  private destroy$ = new Subject<void>();
  private formSubscription?: Subscription;
  private routeSubscription?: Subscription;

  // Form and Search
  filterForm!: FormGroup;
  searchTerm: string = '';

  // Data Management
  allData: UPSTestStatusDto[] = [];
  filteredData: UPSTestStatusDto[] = [];
  displayedData: UPSTestStatusDto[] = [];
  makeSummary: { [key: string]: number } = {};
  statusSummary: { [key: string]: number } = {};
  totalRecords: number = 0;
  isFiltered: boolean = false;
  filteredRowIndex: number = 0;

  // UI State
  isLoading = false;
  errorMessage = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50, 100];

  // Sorting
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Cache for performance
  private cachedMakeChartData: {make: string, count: number}[] = [];
  private cachedYAxisTicks: number[] = [];
  private originalData: UPSTestStatusDto[] = [];

  public Math = Math;

  // View modes
  viewMode: 'list' | 'details' = 'list';
  selectedUnit: UPSTestStatusDto | null = null;

  // Move to Stripping functionality
  showMoveConfirmModal = false;
  unitToMove: UPSTestStatusDto | null = null;
  movingUnits: Set<number> = new Set();
  moveResults: { [rowIndex: number]: { success: boolean; message: string } } = {};

  // Edit/Create functionality
  showEditModal = false;
  editForm!: FormGroup;
  editingUnit: UPSTestStatusDto | null = null;
  isCreatingNew = false;
  savingUnit = false;

  // Result Update functionality
  showResultModal = false;
  resultForm!: FormGroup;
  updatingResult = false;
  resultUnit: UPSTestStatusDto | null = null;

  // Status options matching backend - New Units Test system
  statusOptions = [
    { value: 'All', label: 'All' },
    { value: 'INP', label: 'In Progress' },
    { value: 'NCR', label: 'Needs Components for Repair' },
    { value: 'MPJ', label: 'Missing Parts from Job' }
  ];
  
  // Priority options
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
  
  // Chart colors - same as stripped parts component
  private chartColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
  ];

  // Chart options
  public barChartOptions: any = {
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

  constructor(
    private formBuilder: FormBuilder,
    private newUnitTestService: NewUnitTestService,
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
    
    this.setupFormSubscriptions();
    this.loadMetadata();
    this.loadNewUnitTestData();
    
    // Make debug method available in browser console
    (window as any).debugNewUnitChart = () => this.debugChartData();
  }

  ngAfterViewInit(): void {
    // Additional initialization after view is ready
    setTimeout(() => {
      this.updateCharts();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
    
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  private initializeForm(): void {
    this.filterForm = this.formBuilder.group({
      assignedTo: ['All'],
      status: ['All'],
      priority: ['All'],
      rowIndex: [0]
    });

    // Initialize edit form with UPS Test Status fields
    this.editForm = this.formBuilder.group({
      rowIndex: [0],
      make: ['', [Validators.required, Validators.maxLength(50)]],
      model: ['', [Validators.required, Validators.maxLength(50)]],
      kva: ['', [Validators.maxLength(10)]],
      voltage: ['', [Validators.maxLength(10)]],
      serialNo: ['', [Validators.required, Validators.maxLength(50)]],
      poNumber: ['', [Validators.maxLength(50)]],
      unitCost: ['', [Validators.maxLength(20)]],
      shippingPO: ['', [Validators.maxLength(50)]],
      shipCost: ['', [Validators.maxLength(20)]],
      priority: ['Normal', [Validators.maxLength(15)]],
      assignedTo: ['', [Validators.required, Validators.maxLength(50)]],
      dueDate: [''],
      deficiencyNotes: ['', [Validators.maxLength(1000)]],
      approved: [false],
      moveToArchive: [false],
      moveToStrip: [false]
    });

    // Initialize result update form with test result fields
    this.resultForm = this.formBuilder.group({
      RowIndex: [0, [Validators.required, Validators.min(1)]],
      Status: ['', [Validators.required, Validators.maxLength(5)]],
      ResolveNotes: ['', [Validators.maxLength(500)]],
      TestProcedures: ['', [Validators.maxLength(1)]],
      TestedBy: ['', [Validators.maxLength(50)]],
      followedProcedure: ['', [Validators.maxLength(20)]],
      currentStatus: ['', [Validators.maxLength(20)]],
      testEngineer: ['', [Validators.maxLength(50)]],
      inspectionNotes: ['', [Validators.maxLength(2000)]]
    });
  }

  private initializeCharts(): void {
    this.setupMakeChartOptions();
    this.setupBarChartOptions();
    this.setupDonutChartOptions();
  }

  private setupFormSubscriptions(): void {
    // Watch for form changes
    this.formSubscription = this.filterForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  private setupMakeChartOptions(): void {
    console.log('🔧 Setting up make chart options...');
    
    this.makeBarChartOptions = {
      series: [{
        name: 'Units Count',
        data: []
      }],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {
          show: false
        },
        background: 'transparent'
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          endingShape: 'rounded',
          borderRadius: 4,
          dataLabels: {
            position: 'top'
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
            fontFamily: 'inherit'
          },
          formatter: function (val: any) {
            return Math.floor(val);
          }
        }
      },
      colors: this.chartColors,
      tooltip: {
        shared: true,
        intersect: false,
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
        show: true,
        borderColor: '#e7e7e7',
        row: {
          colors: ['#f3f3f3', 'transparent'],
          opacity: 0.5
        }
      },
      title: {
        text: 'New Unit Test Count by Manufacturer',
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
    
    console.log('✅ Chart options setup complete!');
  }

  private setupBarChartOptions(): void {
    // Similar to UPS test status component
    this.barChartOptions = {
      chart: { type: 'bar', height: 350 },
      dataLabels: { enabled: false },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%'
        }
      },
      xaxis: { categories: [] },
      yaxis: {},
      colors: this.chartColors,
      tooltip: {},
      grid: {},
      theme: {}
    };
  }

  private setupDonutChartOptions(): void {
    this.donutChartOptions = {
      series: [],
      chart: { type: 'donut', height: 350 },
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
      responsive: []
    };
  }

  private loadMetadata(): void {
    this.upsTestStatusService.getUPSTestMetadata(false).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: UPSTestMetadataResponse) => {
        console.log('Technician metadata loaded:', response);
        if (response.success && response.technicians) {
          // Update technician dropdown options
          this.technicianOptions = [
            { value: 'All', label: 'All Technicians' },
            ...response.technicians.map(tech => ({ value: tech, label: tech }))
          ];
          
          console.log('Updated technicianOptions:', this.technicianOptions);
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error loading technician metadata:', error);
        // Continue with default options if metadata loading fails
      }
    });
  }

  loadNewUnitTestData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    const rowIndex = this.filterForm.get('rowIndex')?.value || 0;
    
    this.newUnitTestService.getNewUniTestList(rowIndex)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: NewUniTestApiResponse) => {
          if (response.success && response.data) {
            this.allData = response.data.unitsData || [];
            this.totalRecords = response.totalRecords;
            this.isFiltered = response.isFiltered;
            this.filteredRowIndex = response.filteredRowIndex;
            
            this.originalData = [...this.allData];
            this.processData();
            this.applyFilters();
            
            console.log('✅ New unit test data loaded:', {
              totalRecords: this.totalRecords,
              isFiltered: this.isFiltered,
              dataLength: this.allData.length
            });
            
            this.toastr.success(`Loaded ${this.totalRecords} new unit test records`, 'Success');
          } else {
            this.errorMessage = response.message || 'Failed to load new unit test data';
            this.toastr.error(this.errorMessage, 'Error');
          }
        },
        error: (error) => {
          console.error('❌ Error loading new unit test data:', error);
          this.errorMessage = 'Failed to load new unit test data. Please try again.';
          this.toastr.error(this.errorMessage, 'Error');
        },
        complete: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  private processData(): void {
    // Calculate make summary
    this.makeSummary = {};
    this.statusSummary = {};
    
    this.allData.forEach(item => {
      // Make counts
      const make = item.make || 'Unknown';
      this.makeSummary[make] = (this.makeSummary[make] || 0) + 1;
      
      // Status counts
      const status = item.status || 'Unknown';
      this.statusSummary[status] = (this.statusSummary[status] || 0) + 1;
    });
    
    this.updateCharts();
  }

  private applyFilters(): void {
    let filtered = [...this.allData];
    
    const formValue = this.filterForm.value;
    
    // Apply assigned to filter
    if (formValue.assignedTo && formValue.assignedTo !== 'All') {
      filtered = filtered.filter(item => 
        item.assignedTo && item.assignedTo.toLowerCase().includes(formValue.assignedTo.toLowerCase())
      );
    }
    
    // Apply status filter
    if (formValue.status && formValue.status !== 'All') {
      filtered = filtered.filter(item => 
        item.status && item.status.toLowerCase().includes(formValue.status.toLowerCase())
      );
    }
    
    // Apply priority filter
    if (formValue.priority && formValue.priority !== 'All') {
      filtered = filtered.filter(item => 
        item.priority && item.priority.toLowerCase().includes(formValue.priority.toLowerCase())
      );
    }
    
    // Apply search term filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchLower)
        )
      );
    }
    
    this.filteredData = filtered;
    this.currentPage = 1; // Reset to first page
    this.updateDisplayedData();
  }

  private updateDisplayedData(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedData = this.filteredData.slice(startIndex, endIndex);
    this.cdr.detectChanges();
  }

  private updateCharts(): void {
    this.updateMakeChart();
    this.updateStatusChart();
    this.cdr.detectChanges();
  }

  private updateMakeChart(): void {
    const makeData = Object.entries(this.makeSummary).map(([make, count]) => ({
      make: make || 'Unknown',
      count: count as number
    }));
    
    // Sort by count descending
    makeData.sort((a, b) => b.count - a.count);
    
    this.makeBarChartOptions.series = [{
      name: 'Units Count',
      data: makeData.map(item => item.count)
    }];
    
    this.makeBarChartOptions.xaxis = {
      ...this.makeBarChartOptions.xaxis,
      categories: makeData.map(item => item.make)
    };
  }

  private updateStatusChart(): void {
    const statusData = Object.entries(this.statusSummary);
    
    this.donutChartOptions.series = statusData.map(([, count]) => count as number);
    this.donutChartOptions.labels = statusData.map(([status]) => status || 'Unknown');
  }

  // Event handlers
  onSearch(event: any): void {
    this.searchTerm = event.target.value;
    this.applyFilters();
  }

  onPageSizeChange(event: any): void {
    this.pageSize = parseInt(event.target.value);
    this.currentPage = 1;
    this.updateDisplayedData();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedData();
    }
  }

  onRowIndexChange(): void {
    this.loadNewUnitTestData();
  }

  goBack(): void {
    this.location.back();
  }

  // Utility methods
  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.pageSize);
  }

  getVisiblePages(): number[] {
    const totalPages = this.totalPages;
    const current = this.currentPage;
    const delta = 2; // Number of pages to show on each side
    
    let start = Math.max(1, current - delta);
    let end = Math.min(totalPages, current + delta);
    
    // Adjust if we're near the beginning or end
    if (end - start < 2 * delta) {
      if (start === 1) {
        end = Math.min(totalPages, start + 2 * delta);
      } else {
        start = Math.max(1, end - 2 * delta);
      }
    }
    
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  trackByIndex(index: number): number {
    return index;
  }

  sortData(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredData.sort((a, b) => {
      const aVal = this.getColumnValue(a, column);
      const bVal = this.getColumnValue(b, column);
      
      let comparison = 0;
      if (aVal > bVal) {
        comparison = 1;
      } else if (aVal < bVal) {
        comparison = -1;
      }
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.updateDisplayedData();
  }

  private getColumnValue(item: UPSTestStatusDto, column: string): any {
    switch (column) {
      case 'unitCost':
      case 'shipCost':
        return this.parseNumericValue(item[column as keyof UPSTestStatusDto] as string);
      case 'kva':
        return this.parseNumericValue(item.kva);
      default:
        return item[column as keyof UPSTestStatusDto] || '';
    }
  }

  private parseNumericValue(value: string): number {
    if (!value) return 0;
    const cleaned = value.toString().replace(/[$,]/g, '');
    return parseFloat(cleaned) || 0;
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'bi-arrow-down-up';
    }
    return this.sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  getFilterBadgeClass(): string {
    const formValue = this.filterForm.value;
    const hasFilters = formValue.status !== 'All' || 
                      formValue.priority !== 'All' ||
                      this.searchTerm;
    
    return hasFilters ? 'badge-light-primary' : 'badge-light-secondary';
  }

  getStatusIconClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'passed':
        return 'text-success';
      case 'in progress':
      case 'inp':
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
      case 'ncr':
      case 'needs components':
      case 'awaiting components':
        return 'badge-light-warning'; // Soft Orange
        
      case 'missing parts from job':
      case 'missing_parts_from_job':
      case 'mpj':
      case 'missing parts':
        return 'badge-light-danger'; // Soft Red
        
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
    
    switch (priority.toLowerCase().trim()) {
      case 'high':
      case 'urgent':
        return 'badge-light-danger';
      case 'normal':
      case 'medium':
        return 'badge-light-primary';
      case 'low':
        return 'badge-light-info';
      case 'at convenience':
        return 'badge-light-secondary';
      default:
        return 'badge-light-secondary';
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
      return date.toLocaleString();
    } catch {
      return dateString; // Return original if parsing fails
    }
  }

  // Chart helper methods
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

  // Debug method
  debugChartData(): void {
    console.log('🔍 Debug Chart Data:');
    console.log('Make Summary:', this.makeSummary);
    console.log('Status Summary:', this.statusSummary);
    console.log('Chart Options:', this.makeBarChartOptions);
    console.log('All Data:', this.allData);
    console.log('Filtered Data:', this.filteredData);
  }

  // Move to Stripping functionality
  /**
   * Opens confirmation modal for moving unit to stripping
   */
  openMoveConfirmModal(unit: UPSTestStatusDto): void {
    this.unitToMove = unit;
    this.showMoveConfirmModal = true;
  }

  /**
   * Closes the move confirmation modal
   */
  closeMoveConfirmModal(): void {
    this.showMoveConfirmModal = false;
    this.unitToMove = null;
  }

  /**
   * Confirms and executes the move to stripping operation
   */
  confirmMoveToStripping(): void {
    if (!this.unitToMove) return;

    const unit = this.unitToMove;
    this.closeMoveConfirmModal();
    
    this.moveUnitToStripping(unit);
  }

  /**
   * Moves a unit to stripping
   */
  moveUnitToStripping(unit: UPSTestStatusDto): void {
    const currentUser = this.auth.currentUserValue?.userName || 'System';
    
    // Add to moving units set to show loading state
    this.movingUnits.add(unit.rowIndex);
    
    const moveDto: MoveUnitToStrippingDto = {
      rowIndex: unit.rowIndex,
      make: unit.make || '',
      model: unit.model || '',
      kva: unit.kva || '',
      voltage: unit.voltage || '',
      serialNo: unit.serialNo || '',
      poNumber: unit.poNumber || '',
      shippingPO: unit.shippingPO || '',
      unitCost: unit.unitCostDecimal,
      shipCost: unit.shipCostDecimal,
      createdBy: currentUser
    };

    this.newUnitTestService.moveUnitToStripping(moveDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: MoveUnitToStrippingApiResponse) => {
          this.movingUnits.delete(unit.rowIndex);
          
          if (response.success) {
            this.moveResults[unit.rowIndex] = {
              success: true,
              message: response.message || 'Unit moved to stripping successfully'
            };
            
            this.toastr.success(
              `${unit.make} ${unit.model} (S/N: ${unit.serialNo}) moved to stripping successfully`,
              'Move Successful'
            );
            
            // Refresh the data to remove the moved unit from the list
            this.loadNewUnitTestData();
            
            // Clear the result after 5 seconds
            setTimeout(() => {
              delete this.moveResults[unit.rowIndex];
              this.cdr.detectChanges();
            }, 5000);
            
          } else {
            this.moveResults[unit.rowIndex] = {
              success: false,
              message: response.message || 'Failed to move unit to stripping'
            };
            
            this.toastr.error(
              response.message || 'Failed to move unit to stripping',
              'Move Failed'
            );
          }
          
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.movingUnits.delete(unit.rowIndex);
          
          console.error('❌ Error moving unit to stripping:', error);
          
          this.moveResults[unit.rowIndex] = {
            success: false,
            message: 'An error occurred while moving the unit'
          };
          
          this.toastr.error(
            'An error occurred while moving the unit to stripping',
            'Move Failed'
          );
          
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Checks if a unit is currently being moved
   */
  isUnitMoving(rowIndex: number): boolean {
    return this.movingUnits.has(rowIndex);
  }

  /**
   * Gets the move result for a unit
   */
  getMoveResult(rowIndex: number): { success: boolean; message: string } | null {
    return this.moveResults[rowIndex] || null;
  }

  /**
   * Checks if unit can be moved (has required fields)
   */
  canMoveUnit(unit: UPSTestStatusDto): boolean {
    return !!(unit.make && unit.model && unit.serialNo && unit.rowIndex > 0);
  }

  /**
   * Gets tooltip text for move button
   */
  getMoveTooltip(unit: UPSTestStatusDto): string {
    if (!this.canMoveUnit(unit)) {
      return 'Unit missing required fields (Make, Model, Serial No)';
    }
    if (this.isUnitMoving(unit.rowIndex)) {
      return 'Moving unit to stripping...';
    }
    return `Move ${unit.make} ${unit.model} to stripping`;
  }

  // Edit/Create functionality
  /**
   * Opens the edit modal for creating a new unit test
   */
  openCreateModal(): void {
    this.isCreatingNew = true;
    this.editingUnit = null;
    this.editForm.reset({
      rowIndex: 0,
      make: '',
      model: '',
      kva: '',
      voltage: '',
      serialNo: '',
      priority: 'Normal',
      assignedTo: '',
      dueDate: '',
      problemNotes: '',
      approved: false,
      archive: false
    });
    this.showEditModal = true;
  }

  /**
   * Opens the edit modal for updating an existing unit test
   */
  openEditModal(unit: UPSTestStatusDto): void {
    this.isCreatingNew = false;
    this.editingUnit = unit;
    
    // Convert date to proper format if needed
    let dueDateValue = '';
    if (unit.lastModifiedOn) {
      const date = new Date(unit.lastModifiedOn);
      if (!isNaN(date.getTime())) {
        dueDateValue = date.toISOString().split('T')[0];
      }
    }

    this.editForm.patchValue({
      rowIndex: unit.rowIndex,
      make: unit.make || '',
      model: unit.model || '',
      kva: unit.kva || '',
      voltage: unit.voltage || '',
      serialNo: unit.serialNo || '',
      priority: unit.priority || 'Normal',
      assignedTo: unit.assignedTo || '',
      dueDate: dueDateValue,
      problemNotes: '', // Not available in UPSTestStatusDto, user can add new notes
      approved: false, // Default value
      archive: false // Default value
    });
    
    this.showEditModal = true;
  }

  /**
   * Closes the edit modal
   */
  closeEditModal(): void {
    this.showEditModal = false;
    this.editingUnit = null;
    this.isCreatingNew = false;
    this.editForm.reset();
  }

  /**
   * Clears the edit form
   */
  clearForm(): void {
    this.editForm.reset({
      rowIndex: 0,
      make: '',
      model: '',
      kva: '',
      voltage: '',
      serialNo: '',
      poNumber: '',
      unitCost: '',
      shippingPO: '',
      shipCost: '',
      priority: 'High',
      assignedTo: '',
      dueDate: '',
      problemNotes: '',
      approved: false,
      archive: false
    });
  }

  /**
   * Deletes the current unit
   */
  deleteUnit(): void {
    if (!this.editingUnit) return;
    
    const confirmMessage = `Are you sure you want to delete ${this.editingUnit.make}?\nBy clicking OK you will be directed to Testing Parts Graph Page.`;
    
    if (confirm(confirmMessage)) {
      // Implement delete functionality here
      this.toastr.info('Delete functionality will be implemented', 'Info');
      this.closeEditModal();
    }
  }

  /**
   * Saves or updates the unit test
   */
  saveUnitTest(): void {
    if (this.editForm.invalid) {
      this.markFormGroupTouched(this.editForm);
      return;
    }

    this.savingUnit = true;
    const currentUser = this.auth.currentUserValue?.userName || 'System';
    
    const formValue = this.editForm.value;
    const saveDto: SaveUpdateNewUnitTestDto = {
      rowIndex: formValue.rowIndex || 0,
      make: formValue.make || '',
      model: formValue.model || '',
      kva: formValue.kva || '',
      voltage: formValue.voltage || '',
      serialNo: formValue.serialNo || '',
      priority: formValue.priority || 'Normal',
      assignedTo: formValue.assignedTo || '',
      dueDate: formValue.dueDate ? new Date(formValue.dueDate) : undefined,
      problemNotes: formValue.problemNotes || '',
      approved: formValue.approved || false,
      archive: formValue.archive || false,
      lastModifiedBy: currentUser
    };

    this.newUnitTestService.saveUpdateUnitTest(saveDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: SaveUpdateUnitTestResponse) => {
          this.savingUnit = false;
          
          if (response.success) {
            this.toastr.success(
              response.message,
              this.isCreatingNew ? 'Unit Test Created' : 'Unit Test Updated'
            );
            
            this.closeEditModal();
            this.loadNewUnitTestData(); // Refresh the list
            
          } else {
            this.toastr.error(
              response.message || 'Failed to save unit test',
              'Save Failed'
            );
          }
        },
        error: (error) => {
          this.savingUnit = false;
          console.error('❌ Error saving unit test:', error);
          
          this.toastr.error(
            'An error occurred while saving the unit test',
            'Save Failed'
          );
        }
      });
  }

  /**
   * Marks all form controls as touched to show validation errors
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Gets validation error message for a form field
   */
  getFieldError(fieldName: string): string {
    const control = this.editForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${fieldName} is required`;
      }
      if (control.errors['maxlength']) {
        return `${fieldName} exceeds maximum length of ${control.errors['maxlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  /**
   * Checks if a form field has errors
   */
  hasFieldError(fieldName: string): boolean {
    const control = this.editForm.get(fieldName);
    return !!(control?.errors && control.touched);
  }

  // #region Result Update Methods

  /**
   * Opens the result update modal for a unit
   */
  openResultUpdateModal(unit: UPSTestStatusDto): void {
    this.resultUnit = unit;
    this.resultForm.patchValue({
      RowIndex: unit.rowIndex,
      Status: unit.status || '',
      ResolveNotes: unit.resolveNotes || '',
      TestProcedures: unit.testProcedures || '',
      TestedBy: unit.testedBy || ''
    });
    this.showResultModal = true;
    this.cdr.detectChanges();
  }

  /**
   * Closes the result update modal
   */
  closeResultModal(): void {
    this.showResultModal = false;
    this.resultUnit = null;
    this.resultForm.reset();
    this.updatingResult = false;
    this.cdr.detectChanges();
  }

  /**
   * Updates the unit test result
   */
  updateUnitTestResult(): void {
    if (this.resultForm.invalid) {
      this.markResultFormGroupTouched(this.resultForm);
      this.toastr.warning('Please fill in all required fields correctly.', 'Validation Error');
      return;
    }

    this.updatingResult = true;
    this.cdr.detectChanges();

    const dto: SaveUpdateNewUnitResultDto = this.resultForm.value;
    
    this.newUnitTestService.saveUpdateUnitTestResult(dto).subscribe({
      next: (response: SaveUpdateUnitTestResultResponse) => {
        if (response.success) {
          this.toastr.success(response.message, 'Result Updated');
          
          // Update the local data
          if (this.resultUnit) {
            const index = this.allData.findIndex(unit => unit.rowIndex === dto.RowIndex);
            if (index !== -1) {
              this.allData[index] = { ...this.allData[index], 
                status: dto.Status, 
                resolveNotes: dto.ResolveNotes || '',
                testProcedures: dto.TestProcedures || '',
                testedBy: dto.TestedBy || ''
              };
            }
          }

          // Refresh data and close modal
          this.applyFilters();
          this.updateCharts();
          this.closeResultModal();
        } else {
          this.toastr.error(response.message || 'Failed to update unit test result', 'Update Failed');
        }
      },
      error: (error) => {
        console.error('Error updating unit test result:', error);
        this.toastr.error('Failed to update unit test result. Please try again.', 'Error');
      },
      complete: () => {
        this.updatingResult = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Marks all controls in result form as touched for validation display
   */
  private markResultFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Gets validation error message for a result form field
   */
  getResultFieldError(fieldName: string): string {
    const control = this.resultForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${fieldName} is required`;
      }
      if (control.errors['maxlength']) {
        return `${fieldName} exceeds maximum length of ${control.errors['maxlength'].requiredLength} characters`;
      }
      if (control.errors['min']) {
        return `${fieldName} must be greater than ${control.errors['min'].min}`;
      }
    }
    return '';
  }

  /**
   * Checks if a result form field has errors
   */
  hasResultFieldError(fieldName: string): boolean {
    const control = this.resultForm.get(fieldName);
    return !!(control?.errors && control.touched);
  }

  // #endregion

  // #region Navigation and UI Methods

  /**
   * Navigates back to the previous page or unit test list
   */
  onBack(): void {
    this.location.back();
  }

  /**
   * Opens the edit modal for a unit
   */
  onEditUnit(): void {
    if (!this.selectedUnit) return;
    
    this.editingUnit = this.selectedUnit;
    this.editForm.patchValue({
      rowIndex: this.selectedUnit.rowIndex,
      make: this.selectedUnit.make || '',
      model: this.selectedUnit.model || '',
      kva: this.selectedUnit.kva || '',
      voltage: this.selectedUnit.voltage || '',
      serialNo: this.selectedUnit.serialNo || '',
      poNumber: this.selectedUnit.poNumber || '',
      unitCost: this.selectedUnit.unitCost || '',
      shippingPO: this.selectedUnit.shippingPO || '',
      shipCost: this.selectedUnit.shipCost || '',
      assignedTo: this.selectedUnit.assignedTo || '',
      priority: this.selectedUnit.priority || 'Normal',
      dueDate: '',
      deficiencyNotes: '',
      approved: false,
      moveToArchive: false,
      moveToStrip: false
    });
    this.showEditModal = true;
    this.viewMode = 'details';
    this.cdr.detectChanges();
  }

  /**
   * Opens the result update modal for a unit
   */
  onUpdateResults(): void {
    if (!this.selectedUnit) return;
    
    this.resultUnit = this.selectedUnit;
    this.resultForm.patchValue({
      RowIndex: this.selectedUnit.rowIndex,
      Status: this.selectedUnit.status || '',
      ResolveNotes: this.selectedUnit.resolveNotes || '',
      TestProcedures: this.selectedUnit.testProcedures || '',
      TestedBy: this.selectedUnit.testedBy || '',
      followedProcedure: '',
      currentStatus: '',
      testEngineer: '',
      inspectionNotes: ''
    });
    this.showResultModal = true;
    this.cdr.detectChanges();
  }

  /**
   * Views the UPS test procedure
   */
  onViewTestProcedure(): void {
    // This would typically open a modal or navigate to a procedure document
    // For now, we'll show a placeholder message
    this.toastr.info('UPS Test Procedure would be displayed here', 'Test Procedure');
    
    // In a real implementation, you might:
    // - Open a modal with the procedure document
    // - Navigate to a procedure page
    // - Download a PDF document
    // - Open an external link
  }

  /**
   * Saves the unit information
   */
  onSaveUnit(): void {
    if (this.editForm.invalid) {
      this.markFormGroupTouched(this.editForm);
      this.toastr.warning('Please fill in all required fields correctly.', 'Validation Error');
      return;
    }

    this.savingUnit = true;
    this.cdr.detectChanges();

    const dto: SaveUpdateNewUnitTestDto = this.editForm.value;
    
    this.newUnitTestService.saveUpdateUnitTest(dto).subscribe({
      next: (response: SaveUpdateUnitTestResponse) => {
        if (response.success) {
          this.toastr.success(response.message, 'Unit Updated');
          
          // Update the local data
          if (this.editingUnit) {
            const index = this.allData.findIndex(unit => unit.rowIndex === dto.rowIndex);
            if (index !== -1) {
              this.allData[index] = { ...this.allData[index], ...dto };
              this.selectedUnit = this.allData[index];
            }
          }

          // Refresh data and close modal
          this.applyFilters();
          this.updateCharts();
          this.onCancelEdit();
        } else {
          this.toastr.error(response.message || 'Failed to update unit', 'Update Failed');
        }
      },
      error: (error) => {
        console.error('Error updating unit:', error);
        this.toastr.error('Failed to update unit. Please try again.', 'Error');
      },
      complete: () => {
        this.savingUnit = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Cancels the edit operation
   */
  onCancelEdit(): void {
    this.showEditModal = false;
    this.editingUnit = null;
    this.editForm.reset();
    this.savingUnit = false;
    this.viewMode = 'details';
    this.cdr.detectChanges();
  }

  /**
   * Cancels the create operation
   */
  onCancelCreate(): void {
    this.isCreatingNew = false;
    this.editForm.reset();
    this.savingUnit = false;
    this.selectedUnit = null;
    this.viewMode = 'list';
    this.cdr.detectChanges();
  }

  /**
   * Creates a new unit
   */
  onCreateUnit(): void {
    if (this.editForm.invalid) {
      this.markFormGroupTouched(this.editForm);
      this.toastr.warning('Please fill in all required fields correctly.', 'Validation Error');
      return;
    }

    this.savingUnit = true;
    this.cdr.detectChanges();

    const dto: SaveUpdateNewUnitTestDto = {
      ...this.editForm.value,
      rowIndex: 0 // New unit
    };
    
    this.newUnitTestService.saveUpdateUnitTest(dto).subscribe({
      next: (response: SaveUpdateUnitTestResponse) => {
        if (response.success) {
          this.toastr.success(response.message, 'Unit Created');
          
          // Reload data to include the new unit
          this.loadNewUnitTestData();
          this.onCancelCreate();
        } else {
          this.toastr.error(response.message || 'Failed to create unit', 'Create Failed');
        }
      },
      error: (error) => {
        console.error('Error creating unit:', error);
        this.toastr.error('Failed to create unit. Please try again.', 'Error');
      },
      complete: () => {
        this.savingUnit = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Saves the test results
   */
  onSaveResults(): void {
    if (this.resultForm.invalid) {
      this.markResultFormGroupTouched(this.resultForm);
      this.toastr.warning('Please fill in all required fields correctly.', 'Validation Error');
      return;
    }

    this.updatingResult = true;
    this.cdr.detectChanges();

    const dto: SaveUpdateNewUnitResultDto = this.resultForm.value;
    
    this.newUnitTestService.saveUpdateUnitTestResult(dto).subscribe({
      next: (response: SaveUpdateUnitTestResultResponse) => {
        if (response.success) {
          this.toastr.success(response.message, 'Results Updated');
          
          // Update the local data
          if (this.resultUnit) {
            const index = this.allData.findIndex(unit => unit.rowIndex === dto.RowIndex);
            if (index !== -1) {
              this.allData[index] = { ...this.allData[index], 
                status: dto.Status, 
                resolveNotes: dto.ResolveNotes || '',
                testProcedures: dto.TestProcedures || '',
                testedBy: dto.TestedBy || ''
              };
              this.selectedUnit = this.allData[index];
            }
          }

          // Refresh data and close modal
          this.applyFilters();
          this.updateCharts();
          this.onCancelResultUpdate();
        } else {
          this.toastr.error(response.message || 'Failed to update results', 'Update Failed');
        }
      },
      error: (error) => {
        console.error('Error updating results:', error);
        this.toastr.error('Failed to update results. Please try again.', 'Error');
      },
      complete: () => {
        this.updatingResult = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Cancels the result update operation
   */
  onCancelResultUpdate(): void {
    this.showResultModal = false;
    this.resultUnit = null;
    this.resultForm.reset();
    this.updatingResult = false;
    this.cdr.detectChanges();
  }

  /**
   * Clears the unit form
   */
  onClearUnitForm(): void {
    this.editForm.reset({
      rowIndex: 0,
      priority: 'Normal',
      approved: false,
      moveToArchive: false,
      moveToStrip: false
    });
    this.cdr.detectChanges();
  }

  /**
   * Adds a new unit
   */
  onAddUnit(): void {
    if (this.editForm.invalid) {
      this.markFormGroupTouched(this.editForm);
      this.toastr.warning('Please fill in all required fields correctly.', 'Validation Error');
      return;
    }

    this.savingUnit = true;
    this.cdr.detectChanges();

    const dto: SaveUpdateNewUnitTestDto = {
      ...this.editForm.value,
      rowIndex: 0 // New unit
    };
    
    this.newUnitTestService.saveUpdateUnitTest(dto).subscribe({
      next: (response: SaveUpdateUnitTestResponse) => {
        if (response.success) {
          this.toastr.success(response.message, 'Unit Added');
          
          // Reload data to include the new unit
          this.loadNewUnitTestData();
          this.onClearUnitForm();
        } else {
          this.toastr.error(response.message || 'Failed to add unit', 'Add Failed');
        }
      },
      error: (error) => {
        console.error('Error adding unit:', error);
        this.toastr.error('Failed to add unit. Please try again.', 'Error');
      },
      complete: () => {
        this.savingUnit = false;
        this.cdr.detectChanges();
      }
    });
  }

  // #endregion
}