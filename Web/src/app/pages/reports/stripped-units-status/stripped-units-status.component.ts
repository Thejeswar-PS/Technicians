import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from 'src/app/core/services/common.service';
import { ReportService } from 'src/app/core/services/report.service';
import { AuthService } from 'src/app/modules/auth';
import { 
  StrippedUnitsStatusDto,
  MakeCountDto,
  StrippedUnitsStatusRequest,
  StrippedUnitsStatusResponse,
  StrippedUnitsStatusApiResponse,
  StrippedUnitsStatusItem,
  STRIPPED_UNITS_STATUS_OPTIONS
} from 'src/app/core/model/stripped-units-status.model';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-stripped-units-status',
  templateUrl: './stripped-units-status.component.html',
  styleUrls: ['./stripped-units-status.component.scss']
})
export class StrippedUnitsStatusComponent implements OnInit, OnDestroy, AfterViewInit {

  // Form and filters
  filterForm: FormGroup;
  statusOptions = STRIPPED_UNITS_STATUS_OPTIONS;

  // Data properties
  strippedUnitsList: StrippedUnitsStatusItem[] = [];
  strippedUnitsData: any[] = []; // Chart data for status distribution
  makeCountsList: MakeCountDto[] = [];
  makeChartData: any = null; // Chart-ready data from backend
  filteredUnitsList: StrippedUnitsStatusItem[] = [];
  availableMakes: string[] = [];
  availableModels: string[] = [];
  availableKvaRanges: string[] = [];
  availablePersonnel: string[] = [];

  // Loading and error states
  isLoading: boolean = false;
  isLoadingMakeCounts: boolean = false;
  isLoadingChart: boolean = false;
  isLoadingMakeChart: boolean = false;
  errorMessage: string = '';
  makeCountsErrorMessage: string = '';
  chartErrorMessage: string = '';
  makeChartErrorMessage: string = '';

  // Chart properties
  showChart: boolean = true;
  showMakeChart: boolean = true;
  showMakeCountsChart: boolean = true;
  currentChartType: 'bar' | 'pie' = 'bar';
  currentMakeChartType: 'bar' | 'pie' = 'bar';

  // Interactive chart properties
  public hoveredSliceIndex: number = -1;
  public hoveredMakeSliceIndex: number = -1;
  public tooltipPosition = { x: 0, y: 0 };
  public makeTooltipPosition = { x: 0, y: 0 };
  
  // Removed graph tabs - only Make Distribution now
  
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
  
  // Make Math available in template
  public Math = Math;

  // Canvas references for make charts only
  @ViewChild('makeBarChart', { static: false }) makeBarChartCanvas!: ElementRef<HTMLCanvasElement>;

  /**
   * Determines if a row should have the stripped exists highlighting
   * Matches legacy ASP.NET logic: if (Convert.ToInt32(lblStripExists.Text) > 0)
   * @param unit - The stripped units status item
   * @returns true if stripExists > 0
   */
  hasStrippedParts(unit: StrippedUnitsStatusItem): boolean {
    return unit.stripExists > 0;
  }

  // Sorting
  sortedColumn: string = '';
  sortDirection: number = 1;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 25;
  totalItems: number = 0;
  totalPages: number = 0;
  paginatedItems: StrippedUnitsStatusItem[] = [];

  // Search
  searchTerm: string = '';

  // Subscriptions
  private subscriptions: Subscription = new Subscription();

  // View modes
  viewMode: 'list' | 'details' = 'list';
  selectedUnit: StrippedUnitsStatusItem | null = null;



  constructor(
    private route: ActivatedRoute,
    private reportService: ReportService,
    private commonService: CommonService,
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService,
    private toastr: ToastrService
  ) {
    this.filterForm = this.fb.group({
      status: ['All'],
      makeFilter: ['All'],
      modelFilter: ['All'],
      kvaFilter: ['All'],
      personnelFilter: ['All'],
      searchTerm: ['']
    });

    // Listen to route parameters
    this.route.params.subscribe(params => {
      if (params['status']) {
        this.filterForm.patchValue({ status: params['status'] });
      }
      if (params['rowIndex']) {
        this.filterForm.patchValue({ rowIndex: parseInt(params['rowIndex']) });
      }
    });
  }

  ngOnInit(): void {
    // Set default sorting to Created On (latest first)
    this.sortedColumn = 'createdOn';
    this.sortDirection = -1; // Descending order
    
    this.loadStrippedUnitsStatus();
    this.loadMakeCounts();
    this.loadChartData();
    this.setupFormSubscriptions();
  }

  ngAfterViewInit(): void {
    // Small delay to ensure DOM is ready
    setTimeout(() => {
      this.renderSimpleCharts();
    }, 100);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private setupFormSubscriptions(): void {
    // Listen to form changes for real-time filtering
    this.subscriptions.add(
      this.filterForm.valueChanges.subscribe(() => {
        this.applyFilters();
      })
    );
  }

  loadStrippedUnitsStatus(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const formValue = this.filterForm.value;
    const status = formValue.status || 'All';

    const subscription = this.reportService.getStrippedUnitsStatus(status, 0).subscribe({
      next: (response: StrippedUnitsStatusApiResponse) => {
        console.log('🔍 [MAIN DB] Stripped units response from database:', response);
        if (response.success && response.data) {
          this.strippedUnitsList = this.transformUnitsData(response.data.unitsData);
          console.log('✅ [MAIN DATA] Transformed units list for UI:', this.strippedUnitsList.length, 'units');
          console.log('📋 [MAIN SAMPLE] Sample unit data:', this.strippedUnitsList.slice(0, 3));
          
          this.totalItems = response.totalRecords || this.strippedUnitsList.length;
          this.updateAvailableMakes();
          this.loadChartData();
          this.applyFilters();
          this.toastr.success(`Loaded ${this.strippedUnitsList.length} stripped units`, 'Success');
        } else {
          console.log('❌ [MAIN ERROR] Failed to load units:', response.message);
          this.handleError(response.message || 'Failed to load stripped units status');
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.handleError('Error loading stripped units status: ' + (error.message || 'Unknown error'));
        this.isLoading = false;
      }
    });

    this.subscriptions.add(subscription);
  }

  loadMakeCounts(): void {
    this.isLoadingMakeCounts = true;
    this.makeCountsErrorMessage = '';

    const subscription = this.reportService.getStrippedUnitsMakeCounts().subscribe({
      next: (response) => {
        if (response.success) {
          this.makeCountsList = response.makeCounts || [];
          // Also load chart data after regular data is loaded
          this.loadMakeChartData();
        } else {
          this.makeCountsErrorMessage = 'Failed to load make counts';
        }
        this.isLoadingMakeCounts = false;
      },
      error: (error) => {
        this.makeCountsErrorMessage = 'Error loading make counts: ' + (error.message || 'Unknown error');
        this.isLoadingMakeCounts = false;
      }
    });

    this.subscriptions.add(subscription);
  }

  /**
   * Load make counts data formatted for charts
   */
  loadMakeChartData(): void {
    this.isLoadingMakeChart = true;
    this.makeChartErrorMessage = '';

    const subscription = this.reportService.getStrippedUnitsMakeCountsForChart().subscribe({
      next: (response) => {
        if (response.success) {
          this.makeChartData = response.chartData;
          // Update chart colors to match our theme
          if (this.makeChartData?.datasets?.[0]) {
            this.makeChartData.datasets[0].backgroundColor = this.chartColors.slice(0, this.makeChartData.labels.length);
          }
          this.renderSimpleCharts();
        } else {
          this.makeChartErrorMessage = 'Failed to load chart data';
        }
        this.isLoadingMakeChart = false;
      },
      error: (error) => {
        this.makeChartErrorMessage = 'Error loading chart data: ' + (error.message || 'Unknown error');
        this.isLoadingMakeChart = false;

      }
    });

    this.subscriptions.add(subscription);
  }

  private transformUnitsData(units: StrippedUnitsStatusDto[]): StrippedUnitsStatusItem[] {
    return units.map(unit => ({
      ...unit,
      displayStatus: this.getStatusLabel(unit.status),
      formattedCreatedOn: unit.createdOn ? new Date(unit.createdOn).toLocaleDateString() : '',
      formattedUnitCost: unit.unitCost ? `$${unit.unitCost.toFixed(2)}` : '',
      formattedShipCost: unit.shipCost ? `$${unit.shipCost.toFixed(2)}` : ''
    }));
  }

  private getStatusLabel(status: string): string {
    const statusOption = this.statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.label : status;
  }

  private handleError(message: string): void {
    this.errorMessage = message;
    this.toastr.error(message, 'Error');

  }

  // Filtering
  applyFilters(): void {
    const formValue = this.filterForm.value;
    const makeFilter = formValue.makeFilter || 'All';
    const modelFilter = formValue.modelFilter || 'All';
    const kvaFilter = formValue.kvaFilter || 'All';
    const personnelFilter = formValue.personnelFilter || 'All';
    const searchTerm = (formValue.searchTerm || '').toLowerCase().trim();

    let filtered = [...this.strippedUnitsList];

    // Apply make filter
    if (makeFilter !== 'All') {
      filtered = filtered.filter(unit => unit.make === makeFilter);
    }

    // Apply model filter
    if (modelFilter !== 'All') {
      filtered = filtered.filter(unit => unit.model === modelFilter);
    }

    // Apply KVA filter
    if (kvaFilter !== 'All') {
      filtered = filtered.filter(unit => unit.kva === kvaFilter);
    }

    // Apply personnel filter
    if (personnelFilter !== 'All') {
      filtered = filtered.filter(unit => 
        unit.strippedBy === personnelFilter || unit.putAwayBy === personnelFilter
      );
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(unit =>
        (unit.serialNo?.toLowerCase().includes(searchTerm)) ||
        (unit.make?.toLowerCase().includes(searchTerm)) ||
        (unit.model?.toLowerCase().includes(searchTerm)) ||
        (unit.poNumber?.toLowerCase().includes(searchTerm)) ||
        (unit.strippedBy?.toLowerCase().includes(searchTerm)) ||
        (unit.putAwayBy?.toLowerCase().includes(searchTerm)) ||
        (unit.kva?.toLowerCase().includes(searchTerm))
      );
    }

    this.filteredUnitsList = filtered;
    this.totalItems = this.filteredUnitsList.length;
    this.currentPage = 1;
    this.updatePagination();
  }

  // Sorting
  sortBy(column: string): void {
    if (this.sortedColumn === column) {
      this.sortDirection *= -1;
    } else {
      this.sortedColumn = column;
      this.sortDirection = 1;
    }

    this.filteredUnitsList.sort((a, b) => {
      let aValue = this.getColumnValue(a, column);
      let bValue = this.getColumnValue(b, column);

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * this.sortDirection;
      }
      
      if (aValue < bValue) return -1 * this.sortDirection;
      if (aValue > bValue) return 1 * this.sortDirection;
      return 0;
    });

    this.updatePagination();
  }

  private getColumnValue(unit: StrippedUnitsStatusItem, column: string): any {
    switch (column) {
      case 'rowIndex': return unit.rowIndex || 0;
      case 'make': return unit.make || '';
      case 'model': return unit.model || '';
      case 'serialNo': return unit.serialNo || '';
      case 'kva': return unit.kva || '';
      case 'poNumber': return unit.poNumber || '';
      case 'unitCost': return unit.unitCost || 0;
      case 'shipCost': return unit.shipCost || 0;
      case 'status': return unit.status || '';
      case 'strippedBy': return unit.strippedBy || '';
      case 'putAwayBy': return unit.putAwayBy || '';
      case 'createdOn': return unit.createdOn ? new Date(unit.createdOn) : new Date(0);
      default: return '';
    }
  }

  getSortIcon(column: string): string {
    if (this.sortedColumn !== column) return 'bi-arrow-down-up';
    return this.sortDirection === 1 ? 'bi-sort-up' : 'bi-sort-down';
  }

  // Pagination
  updatePagination(): void {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedItems = this.filteredUnitsList.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  changeItemsPerPage(newSize: number): void {
    this.itemsPerPage = newSize;
    this.currentPage = 1;
    this.updatePagination();
  }

  // Actions

  viewUnitDetails(unit: StrippedUnitsStatusItem): void {
    this.selectedUnit = unit;
    this.viewMode = 'details';
  }

  addParts(unit: StrippedUnitsStatusItem): void {
    console.log('🎯 [ADD PARTS] User clicked Add Parts button for unit:', unit);
    console.log('📊 [ADD PARTS] Unit details:', {
      rowIndex: unit.rowIndex,
      make: unit.make,
      model: unit.model,
      serialNo: unit.serialNo,
      kva: unit.kva,
      stripExists: unit.stripExists
    });
    
    // Navigate to stripped unit info page with the selected unit data
    // Both sections (unit info and add parts) can be used independently
    this.router.navigate(['/reports/stripped-unit-info'], { 
      queryParams: { 
        rowIndex: unit.rowIndex,
        fromAddParts: true,
        Make: unit.make,
        Model: unit.model,
        SNo: unit.serialNo,
        KVA: unit.kva
      } 
    });
    
    console.log('🧭 [NAVIGATION] Navigating to stripped-unit-info with query params');
  }

  backToList(): void {
    this.viewMode = 'list';
    this.selectedUnit = null;
  }

  // Chart methods
  toggleMakeCountsChart(): void {
    this.showMakeCountsChart = !this.showMakeCountsChart;
  }

  changeMakeCountsChartType(type: 'bar' | 'pie'): void {
    this.currentMakeChartType = type;
  }



  // Utility methods
  getTotalMakeCount(): number {
    return this.makeCountsList.reduce((total, item) => total + item.makeCount, 0);
  }

  formatCurrency(amount: number | null | undefined): string {
    return amount ? `$${amount.toFixed(2)}` : '';
  }

  formatDateTime(dateTime: Date | string | null | undefined): string {
    if (!dateTime) return '';
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateTimeTooltip(dateTime: Date | string | null | undefined): string {
    if (!dateTime) return '';
    const date = typeof dateTime === 'string' ? new Date(dateTime) : dateTime;
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'inp':
        return 'badge-warning';
      case 'def':
        return 'badge-danger';
      case 'com':
        return 'badge-success';
      case 'wos':
        return 'badge-secondary';
      default:
        return 'badge-light';
    }
  }

  trackByRowIndex(index: number, item: StrippedUnitsStatusItem): number {
    return item.rowIndex;
  }

  shouldShowPageNumber(pageNumber: number): boolean {
    if (this.totalPages <= 10) {
      return true;
    }
    
    const distance = Math.abs(this.currentPage - pageNumber);
    return distance <= 2 || pageNumber === 1 || pageNumber === this.totalPages;
  }

  // View mode helper methods
  isDetailsMode(): boolean {
    return this.viewMode === 'details';
  }

  isListMode(): boolean {
    return this.viewMode === 'list';
  }

  // Navigation methods matching part return status
  goBack(): void {
    this.router.navigate(['/reports']);
  }

  onStatusChange(): void {
    this.loadStrippedUnitsStatus();
    this.loadChartData();
  }

  // Chart-related methods

  setChartType(type: 'bar' | 'pie'): void {
    this.currentChartType = type;
  }

  setMakeChartType(type: 'bar' | 'pie'): void {
    this.currentMakeChartType = type;
  }

  loadChartData(): void {
    this.isLoadingChart = true;
    this.chartErrorMessage = '';
    
    try {
      // Create chart data from status distribution
      const statusCounts: { [key: string]: number } = {};
      
      this.strippedUnitsList.forEach(unit => {
        const status = unit.status || 'Unknown';
        statusCounts[status] = (statusCounts[status] || 0) + 1;
      });
      
      this.strippedUnitsData = Object.keys(statusCounts).map(status => ({
        status,
        count: statusCounts[status]
      }));
      
      this.isLoadingChart = false;
      this.renderSimpleCharts();
    } catch (error) {

      this.chartErrorMessage = 'Unable to load chart data';
      this.isLoadingChart = false;
    }
  }

  getChartItemPercentage(item: any): number {
    const total = this.strippedUnitsData.reduce((sum, data) => sum + data.count, 0);
    return total > 0 ? Math.round((item.count / total) * 100) : 0;
  }

  getMakeChartItemPercentage(item: any): number {
    // If we have chart data, calculate percentage from that
    if (this.makeChartData && this.makeChartData.data && this.makeChartData.data.length > 0) {
      const total = this.makeChartData.data.reduce((sum: number, count: number) => sum + count, 0);
      return total > 0 ? Math.round((item.makeCount / total) * 100) : 0;
    }
    // Fallback to makeCountsList
    const total = this.makeCountsList.reduce((sum, data) => sum + data.makeCount, 0);
    return total > 0 ? Math.round((item.makeCount / total) * 100) : 0;
  }

  getSliceColor(index: number): string {
    return this.chartColors[index % this.chartColors.length];
  }

  getMakeSliceColor(index: number): string {
    return this.chartColors[index % this.chartColors.length];
  }

  onChartItemClick(item: any): void {
    // Handle chart item click - filter by status
    this.filterForm.patchValue({ status: item.status });
  }

  onMakeChartItemClick(item: any): void {
    // Handle make chart item click - filter by make
    this.filterForm.patchValue({ makeFilter: item.make });
  }

  onRowHover(index: number, isHovering: boolean): void {
    this.hoveredSliceIndex = isHovering ? index : -1;
  }



  /**
   * Get chart data for display - prioritizes backend chart data when available
   */
  getDisplayMakeChartData(): any {
    return this.makeChartData || {
      labels: this.makeCountsList.map(item => item.make),
      data: this.makeCountsList.map(item => item.makeCount),
      datasets: [{
        label: 'Units by Make',
        data: this.makeCountsList.map(item => item.makeCount),
        backgroundColor: this.chartColors.slice(0, this.makeCountsList.length)
      }]
    };
  }

  /**
   * Check if we have chart data available
   */
  hasChartData(): boolean {
    return (this.makeChartData && this.makeChartData.labels && this.makeChartData.labels.length > 0) ||
           (this.makeCountsList && this.makeCountsList.length > 0);
  }

  /**
   * Get total count for make chart
   */
  getMakeChartTotalCount(): number {
    if (this.makeChartData && this.makeChartData.data) {
      return this.makeChartData.data.reduce((sum: number, count: number) => sum + count, 0);
    }
    return this.makeCountsList.reduce((sum, data) => sum + data.makeCount, 0);
  }

  // Summary methods for sidebar
  getCompleteUnitsCount(): number {
    return this.strippedUnitsList.filter(unit => unit.status?.toLowerCase() === 'com').length;
  }

  getIncompleteUnitsCount(): number {
    return this.strippedUnitsList.filter(unit => unit.status?.toLowerCase() !== 'com').length;
  }

  getCompletionPercentage(): number {
    const complete = this.getCompleteUnitsCount();
    return this.totalItems > 0 ? Math.round((complete / this.totalItems) * 100) : 0;
  }

  getCompletePercentage(): number {
    return this.getCompletionPercentage();
  }

  getIncompletePercentage(): number {
    return 100 - this.getCompletionPercentage();
  }

  getTopMake(): any {
    if (this.makeCountsList.length === 0) return null;
    return this.makeCountsList.reduce((top, current) => 
      current.makeCount > top.makeCount ? current : top
    );
  }

  getAveragePerMake(): number {
    // Use chart data if available
    if (this.makeChartData && this.makeChartData.data && this.makeChartData.labels) {
      if (this.makeChartData.labels.length === 0) return 0;
      const total = this.makeChartData.data.reduce((sum: number, count: number) => sum + count, 0);
      return Math.round(total / this.makeChartData.labels.length);
    }
    
    // Fallback to makeCountsList
    if (this.makeCountsList.length === 0) return 0;
    const total = this.makeCountsList.reduce((sum, make) => sum + make.makeCount, 0);
    return Math.round(total / this.makeCountsList.length);
  }

  getStatusCount(status: string): number {
    if (!this.filteredUnitsList || this.filteredUnitsList.length === 0) return 0;
    return this.filteredUnitsList.filter(unit => unit.status === status).length;
  }

  getStatusPercentage(status: string): number {
    if (!this.filteredUnitsList || this.filteredUnitsList.length === 0) return 0;
    const count = this.getStatusCount(status);
    return Math.round((count / this.filteredUnitsList.length) * 100);
  }

  // Filter methods
  onMakeFilterChange(): void {
    this.applyFilters();
  }

  onModelFilterChange(): void {
    this.applyFilters();
  }

  onKvaFilterChange(): void {
    this.applyFilters();
  }

  onPersonnelFilterChange(): void {
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  clearSearch(): void {
    this.filterForm.patchValue({ searchTerm: '' });
  }

  clearAllFilters(): void {
    this.filterForm.patchValue({
      makeFilter: 'All',
      modelFilter: 'All',
      kvaFilter: 'All',
      personnelFilter: 'All',
      searchTerm: ''
    });
  }

  exportFilteredData(): void {
    // TODO: Implement export functionality
  }

  private updateAvailableMakes(): void {
    const makes = new Set<string>();
    const models = new Set<string>();
    const kvaRanges = new Set<string>();
    const personnel = new Set<string>();

    this.strippedUnitsList.forEach(unit => {
      if (unit.make) makes.add(unit.make);
      if (unit.model) models.add(unit.model);
      if (unit.kva) kvaRanges.add(unit.kva);
      if (unit.strippedBy) personnel.add(unit.strippedBy);
      if (unit.putAwayBy) personnel.add(unit.putAwayBy);
    });

    this.availableMakes = Array.from(makes).sort();
    this.availableModels = Array.from(models).sort();
    this.availableKvaRanges = Array.from(kvaRanges).sort();
    this.availablePersonnel = Array.from(personnel).sort();
  }

  // Interactive chart rendering methods
  private renderSimpleCharts(): void {
    setTimeout(() => {
      this.initializeBarChart();
      this.initializeDonutChart();
    }, 100);
  }

  private initializeBarChart(): void {
    if (!this.makeCountsList || this.makeCountsList.length === 0) return;

    const categories = this.makeCountsList.map(item => item.make);
    const data = this.makeCountsList.map(item => item.makeCount);

    this.barChartOptions = {
      series: [{
        name: 'Units',
        data: data.map((value, index) => ({
          x: categories[index],
          y: value,
          fillColor: this.chartColors[index % this.chartColors.length]
        }))
      }],
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
        },
        events: {
          dataPointSelection: (event: any, chartContext: any, config: any) => {
            if (config.dataPointIndex >= 0 && this.makeCountsList[config.dataPointIndex]) {
              const item = this.makeCountsList[config.dataPointIndex];
              this.onMakeChartItemClick(item);
            }
          }
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 12,
          borderRadiusApplication: 'end',
          borderRadiusWhenStacked: 'last',
          dataLabels: {
            position: 'top'
          },
          distributed: true,
          rangeBarOverlap: true,
          rangeBarGroupRows: false
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: number) {
          return val.toString();
        },
        offsetY: -25,
        style: {
          fontSize: '13px',
          fontWeight: '700',
          colors: ['#2d3748'],
          fontFamily: 'Inter, sans-serif'
        },
        background: {
          enabled: true,
          foreColor: '#2d3748',
          borderRadius: 6,
          padding: 4,
          opacity: 0.1
        }
      },
      xaxis: {
        categories: categories,
        labels: {
          style: {
            fontSize: '12px',
            fontWeight: 500
          }
        }
      },
      yaxis: {
        title: {
          text: 'Number of Units',
          style: {
            fontSize: '14px',
            fontWeight: 600
          }
        },
        labels: {
          style: {
            fontSize: '12px'
          }
        }
      },
      colors: this.chartColors.slice(0, data.length),
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'vertical',
          shadeIntensity: 0.35,
          gradientToColors: this.chartColors.slice(0, data.length).map(color => {
            // Create lighter gradient end colors
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            const lighter = `#${Math.min(255, r + 40).toString(16).padStart(2, '0')}${Math.min(255, g + 40).toString(16).padStart(2, '0')}${Math.min(255, b + 40).toString(16).padStart(2, '0')}`;
            return lighter;
          }),
          inverseColors: false,
          opacityFrom: 0.95,
          opacityTo: 0.65,
          stops: [0, 50, 100]
        }
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      tooltip: {
        enabled: true,
        theme: 'dark',
        style: {
          fontSize: '12px'
        },
        y: {
          formatter: function(val: number, opts: any) {
            const percentage = ((val / data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
            return `${val} units (${percentage}%)`;
          }
        }
      },
      grid: {
        borderColor: '#e2e8f0',
        strokeDashArray: 3,
        row: {
          colors: ['#f8fafc', 'transparent'],
          opacity: 0.05
        },
        column: {
          colors: ['#f8fafc', 'transparent'],
          opacity: 0.03
        },
        xaxis: {
          lines: {
            show: false
          }
        },
        yaxis: {
          lines: {
            show: true
          }
        }
      },
      theme: {
        mode: 'light',
        palette: 'palette1'
      }
    };
  }

  private initializeDonutChart(): void {
    if (!this.makeCountsList || this.makeCountsList.length === 0) return;

    const labels = this.makeCountsList.map(item => item.make);
    const series = this.makeCountsList.map(item => item.makeCount);

    this.donutChartOptions = {
      series: series,
      chart: {
        type: 'donut',
        height: 350,
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
        },
        events: {
          dataPointSelection: (event: any, chartContext: any, config: any) => {
            if (config.dataPointIndex >= 0 && this.makeCountsList[config.dataPointIndex]) {
              const item = this.makeCountsList[config.dataPointIndex];
              this.onMakeChartItemClick(item);
            }
          }
        }
      },
      labels: labels,
      colors: this.chartColors,
      plotOptions: {
        pie: {
          donut: {
            size: '60%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '16px',
                fontWeight: 600,
                color: '#373d3f',
                offsetY: -10
              },
              value: {
                show: true,
                fontSize: '20px',
                fontWeight: 700,
                color: '#373d3f',
                offsetY: 10,
                formatter: function (val: string) {
                  return val + ' units';
                }
              },
              total: {
                show: true,
                showAlways: false,
                label: 'Total',
                fontSize: '16px',
                fontWeight: 600,
                color: '#373d3f',
                formatter: function (w: any) {
                  return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0) + ' units';
                }
              }
            }
          }
        }
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '14px',
          fontWeight: 'bold'
        },
        formatter: function (val: number) {
          return val.toFixed(1) + '%';
        },
        dropShadow: {
          enabled: false
        }
      },
      legend: {
        position: 'bottom',
        fontSize: '14px',
        fontWeight: 500,
        markers: {
          width: 12,
          height: 12,
          radius: 6
        },
        itemMargin: {
          horizontal: 10,
          vertical: 5
        }
      },
      tooltip: {
        enabled: true,
        theme: 'dark',
        style: {
          fontSize: '12px'
        },
        y: {
          formatter: function(val: number, opts: any) {
            const total = series.reduce((a, b) => a + b, 0);
            const percentage = ((val / total) * 100).toFixed(1);
            return `${val} units (${percentage}%)`;
          }
        }
      },
      responsive: [{
        breakpoint: 480,
        options: {
          chart: {
            height: 300
          },
          legend: {
            position: 'bottom'
          }
        }
      }]
    };
  }


  
  private renderMakeBarChart(): void {
    if (!this.makeBarChartCanvas?.nativeElement || this.makeCountsList.length === 0) return;
    
    const canvas = this.makeBarChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Simple bar chart implementation
    const padding = 40;
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - (padding * 2);
    const maxValue = Math.max(...this.makeCountsList.map(item => item.makeCount));
    const barWidth = chartWidth / this.makeCountsList.length;
    
    this.makeCountsList.forEach((item, index) => {
      const barHeight = (item.makeCount / maxValue) * chartHeight;
      const x = padding + (index * barWidth);
      const y = canvas.height - padding - barHeight;
      
      // Draw bar
      ctx.fillStyle = this.chartColors[index % this.chartColors.length];
      ctx.fillRect(x + 5, y, barWidth - 10, barHeight);
      
      // Draw label
      ctx.fillStyle = '#333';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.make, x + barWidth/2, canvas.height - 10);
      
      // Draw value
      ctx.fillText(item.makeCount.toString(), x + barWidth/2, y - 5);
    });
  }
}
