import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from 'src/app/core/services/common.service';
import { ReportService } from 'src/app/core/services/report.service';
import { AuthService } from 'src/app/modules/auth';
import { environment } from 'src/environments/environment';
import { 
  PartReturnStatusDto,
  PartReturnStatusRequestDto,
  PartReturnStatusResponseDto,
  PartReturnStatusItem,
  PART_RETURN_STATUS_OPTIONS,
  PartsToBeReceivedChartDto,
  PartsToBeReceivedTotalsDto,
  PartsToBeReceivedResponseDto,
  PartsToBeReceivedApiResponseDto,
  PartsReceivedByWHChartDto,
  PartsReceivedByWHTotalsDto,
  PartsReceivedByWHResponseDto,
  PartsReceivedByWHApiResponseDto,
  WeeklyPartsReturnedCountDto,
  WeeklyPartsReturnedCountApiResponseDto,
  PartsReturnDataByWeekNoDto,
  PartsReturnDataByWeekNoApiResponseDto,
  PartsReturnDataByWeekNoItem
} from 'src/app/core/model/part-return-status.model';
import { InventoryUser } from 'src/app/core/model/inventory-user.model';
import { EmployeeStatusDto } from 'src/app/core/model/employee-status.model';

@Component({
  selector: 'app-part-return-status',
  templateUrl: './part-return-status.component.html',
  styleUrls: ['./part-return-status.component.scss']
})
export class PartReturnStatusComponent implements OnInit, AfterViewInit, OnDestroy {

  partReturnStatusList: PartReturnStatusItem[] = [];
  inventoryUsers: InventoryUser[] = [];
  sortedColumn: string = '';
  sortDirection: number = 1;
  isLoading: boolean = false;
  isLoadingInventoryUsers: boolean = false;
  currentUserStatus: EmployeeStatusDto | null = null;
  errorMessage: string = '';
  
  // Chart-related properties
  chartData: PartsToBeReceivedChartDto[] = [];
  chartTotals: PartsToBeReceivedTotalsDto = { unUsedTR: 0, faultyTR: 0 };
  isLoadingChart: boolean = false;
  chartErrorMessage: string = '';
  showChart: boolean = true;
  
  // Chart visualization properties
  currentChartType: 'bar' | 'pie' | 'table' = 'bar';
  @ViewChild('barChartCanvas', { static: false }) barChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('pieChartCanvas', { static: false }) pieChartCanvas!: ElementRef<HTMLCanvasElement>;
  
  // Weekly Parts Returned Count Chart properties
  weeklyPartsData: WeeklyPartsReturnedCountDto[] = [];
  isLoadingWeeklyChart: boolean = false;
  weeklyChartErrorMessage: string = '';
  showWeeklyChart: boolean = true;
  currentWeeklyChartType: 'bar' | 'line' | 'table' = 'bar';
  @ViewChild('weeklyBarChartCanvas', { static: false }) weeklyBarChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('weeklyLineChartCanvas', { static: false }) weeklyLineChartCanvas!: ElementRef<HTMLCanvasElement>;

  // Parts Received by Warehouse Chart properties
  receivedChartData: PartsReceivedByWHChartDto[] = [];
  receivedChartTotals: PartsReceivedByWHTotalsDto = { unUsedR: 0, faultyR: 0, unUsedReceived: 0, faultyReceived: 0 };
  isLoadingReceivedChart: boolean = false;
  receivedChartErrorMessage: string = '';
  showReceivedChart: boolean = true;
  currentReceivedChartType: 'bar' | 'pie' | 'table' = 'bar';
  @ViewChild('receivedBarChartCanvas', { static: false }) receivedBarChartCanvas!: ElementRef<HTMLCanvasElement>;
  
  // Graph tabs
  activeGraphTab: 'graph1' | 'graph2' | 'graph3' = 'graph1';
  @ViewChild('receivedPieChartCanvas', { static: false }) receivedPieChartCanvas!: ElementRef<HTMLCanvasElement>;

  // Chart click handling properties
  private chartClickListeners: Map<string, any> = new Map();
  private hoveredChartItem: any = null;
  
  // Animation properties
  private animationFrameId: number | null = null;
  private chartAnimations: Map<string, any> = new Map();
  private isAnimating: boolean = false;
  
  // Interactive chart properties
  private hoveredBarIndex: number = -1;
  public hoveredSliceIndex: number = -1;
  private animationProgress: number = 0;
  public tooltipPosition = { x: 0, y: 0 };
  private isHovering = false;
  private hoverAnimationId: number | null = null;
  private sliceHoverScale: number[] = [];
  private clickAnimationProgress = 0;
  private clickedSliceIndex = -1;

  // Parts Return Data by Week Number properties
  partsReturnDataByWeekNo: PartsReturnDataByWeekNoItem[] = [];
  isLoadingWeeklyData: boolean = false;
  weeklyDataErrorMessage: string = '';
  showWeeklyData: boolean = true;
  selectedWeekNo: number = 1;
  
  chartColors = [
    '#3699ff', '#f64e60', '#1bc5bd', '#ffa800', '#8950fc',
    '#e1416c', '#fd7e14', '#6f42c1', '#20c997', '#fd7e14'
  ];
  
  // Pagination and performance properties
  currentPage: number = 1;
  pageSize: number = 50;
  totalRecords: number = 0;
  displayedData: PartReturnStatusItem[] = [];
  isProcessingData: boolean = false;

  // Available years for dropdown (last 5 years)
  availableYears: number[] = [];

  partReturnFilterForm: FormGroup = this.fb.group({
    inventoryUser: ['All'],
    status: ['0'],  // Not Returned by default (key 0)
    year: [new Date().getFullYear()],
    weekNo: [1]
  });

  // Status options from model
  statusOptions = PART_RETURN_STATUS_OPTIONS;

  constructor(
    private route: ActivatedRoute,
    private _reportService: ReportService,
    private _commonService: CommonService,
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService
  ) {
    this.route.params.subscribe(val => {
      // Handle any route parameters if needed
    });
  }

  ngOnInit(): void {
    this.initializeYears();
    this.initializeWeekNumber();
    this.loadInventoryUsers();
    this.determineEmployeeStatus();
    this.handleQueryParams();
    this.onFilterChanges();
    this.loadFilters();
    this.loadPartsToBeReceivedChart();
    this.loadWeeklyPartsReturnedCount();
    this.loadPartsReceivedByWarehouseChart();
    this.loadPartsReturnDataByWeekNo();
  }

  initializeYears(): void {
    const currentYear = new Date().getFullYear();
    this.availableYears = [];
    for (let i = 0; i < 5; i++) {
      this.availableYears.push(currentYear - i);
    }
  }

  initializeWeekNumber(): void {
    const currentWeek = this.getCurrentWeekNumber();
    this.selectedWeekNo = currentWeek;
    this.partReturnFilterForm.patchValue({ weekNo: currentWeek });
  }

  loadInventoryUsers(): void {
    // First try to load from localStorage for immediate display
    const storedUsers = localStorage.getItem("InventoryUsers");
    if (storedUsers) {
      try {
        const parsedUsers = JSON.parse(storedUsers);
        
        if (parsedUsers.length > 0) {
          const allOption = { invUserID: 'All', username: 'All' };
          const filteredUsers = parsedUsers.filter((user: InventoryUser) => 
            user.invUserID !== 'All' && user.username !== 'All'
          );
          this.inventoryUsers = [allOption, ...filteredUsers];
          
          const currentValue = this.partReturnFilterForm.get('inventoryUser')?.value;
          if (!currentValue || currentValue === '') {
            this.partReturnFilterForm.patchValue({ inventoryUser: 'All' });
          }
        } else {
          localStorage.removeItem("InventoryUsers");
        }
      } catch (e) {
        localStorage.removeItem("InventoryUsers");
      }
    }

    // Always fetch fresh data from API
    this.isLoadingInventoryUsers = true;
    this._reportService.getInventoryUserNames().subscribe({
      next: (data: any) => {
        this.isLoadingInventoryUsers = false;
        
        let inventoryUsers: InventoryUser[] = [];
        if (Array.isArray(data)) {
          inventoryUsers = data;
        } else if (data && data.data && Array.isArray(data.data)) {
          inventoryUsers = data.data;
        }
        
        if (inventoryUsers && inventoryUsers.length > 0) {
          const allOption = { invUserID: 'All', username: 'All' };
          const filteredUsers = inventoryUsers.filter((user: InventoryUser) => 
            user.invUserID !== 'All' && user.username !== 'All'
          );
          this.inventoryUsers = [allOption, ...filteredUsers];
          localStorage.setItem("InventoryUsers", JSON.stringify(this.inventoryUsers));
        } else {
          if (this.inventoryUsers.length === 0) {
            this.inventoryUsers = [{ invUserID: 'All', username: 'All' }];
          }
        }

        const currentValue = this.partReturnFilterForm.get('inventoryUser')?.value;
        if (!currentValue || currentValue === '' || !this.inventoryUsers.some(user => this.getInventoryUserValue(user) === currentValue)) {
          this.partReturnFilterForm.patchValue({ inventoryUser: 'All' });
        }
      },
      error: (error) => {
        this.isLoadingInventoryUsers = false;
        
        if (this.inventoryUsers.length === 0) {
          this.inventoryUsers = [{ invUserID: 'All', username: 'All' }];
          this.errorMessage = 'Unable to load inventory users. Please check network connection.';
        }
      }
    });
  }

  handleQueryParams(): void {
    this.route.queryParamMap.subscribe((params) => {
      if (params.has('invUserID')) {
        const invUserID = params.get('invUserID');
        this.partReturnFilterForm.controls['inventoryUser'].setValue(invUserID || 'All');
      }
      
      if (params.has('year')) {
        const year = parseInt(params.get('year') || '');
        if (year && this.availableYears.includes(year)) {
          this.partReturnFilterForm.controls['year'].setValue(year);
        }
      }

      if (params.has('status')) {
        const status = params.get('status');
        this.partReturnFilterForm.controls['status'].setValue(status || '0');
      }

      // Handle chart navigation parameters like legacy
      if (params.has('Source')) {
        this.handleChartNavigation(params);
      }

      this.getPartReturnStatusReport();
    });
  }

  loadFilters(): void {
    const userDataStr = localStorage.getItem("userData");
    
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      
      // Wait for inventory users to load if needed
      if (this.inventoryUsers.length === 0) {
        setTimeout(() => this.setDefaultUserFilter(userData), 500);
      } else {
        this.setDefaultUserFilter(userData);
      }
    }
  }

  private setDefaultUserFilter(userData: any): void {
    const userEmpID = userData.empID?.trim();
    const userEmpName = userData.empName?.trim();
    const windowsId = userData.windowsId?.trim() || userData.empName?.trim();
    
    const matchingUser = this.inventoryUsers.find((item: InventoryUser) => {
      const invUserIdMatch = item.invUserID?.trim().toLowerCase() === userEmpID?.toLowerCase() ||
                             item.invUserID?.trim().toLowerCase() === windowsId?.toLowerCase();
      
      const usernameMatch = item.username?.trim().toLowerCase() === userEmpName?.toLowerCase() ||
                            item.username?.trim().toLowerCase() === windowsId?.toLowerCase();
      
      return invUserIdMatch || usernameMatch;
    });
    
    if (matchingUser) {
      this.partReturnFilterForm.patchValue({
        inventoryUser: matchingUser.invUserID || 'All'
      });
    }
  }

  private determineEmployeeStatus(): void {
    const userDataStr = localStorage.getItem("userData");
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      const windowsID = userData.windowsId || userData.empName || '';
      
      if (windowsID) {
        this._reportService.getEmployeeStatusForJobListByParam(windowsID).subscribe({
          next: (response: EmployeeStatusDto) => {
            this.currentUserStatus = response;
          },
          error: (error) => {
            this.errorMessage = 'Error retrieving employee status';
          }
        });
      }
    }
  }

  getPartReturnStatusReport(): void {
    this.isLoading = true;
    this.errorMessage = '';
    const formValue = this.partReturnFilterForm.value;
    
    const key = parseInt(formValue.status) || 0; // Default to 'not-returned' (key 0)
    const invUserID = (formValue.inventoryUser || 'All').toString().trim();
    const year = formValue.year || new Date().getFullYear();



    // Call appropriate API method based on status
    let apiCall;
    switch (key) {
      case 0: // Not Returned
        apiCall = this._reportService.getPartsNotReceived(invUserID, year);
        break;
      case 1: // In Progress
        apiCall = this._reportService.getPartsInProgress(invUserID, year);
        break;
      case 2: // Pending
        apiCall = this._reportService.getPartsPending(invUserID, year);
        break;
      case 3: // Returned
        apiCall = this._reportService.getPartsReturned(invUserID, year);
        break;
      default:
        apiCall = this._reportService.getPartsNotReceived(invUserID, year);
        break;
    }

    apiCall.subscribe({
      next: (response: PartReturnStatusResponseDto) => {

        
        if (response.success && response.data) {
          this.partReturnStatusList = response.data.map(item => this.convertToDisplayFormat(item));
          this.currentPage = 1;
          this.updateDisplayedData();
          this.isLoading = false;
          // Ensure charts remain visible after data load
          setTimeout(() => this.ensureChartsVisible(), 100);
        } else {
          this.errorMessage = response.message || 'No data found';
          this.partReturnStatusList = [];
          this.isLoading = false;
          // Keep charts visible even if main data is empty
          setTimeout(() => this.ensureChartsVisible(), 100);
        }
      },
      error: (error) => {

        this.errorMessage = `Error loading data (${error.status}): ${error.message}`;
        this.partReturnStatusList = [];
        this.isLoading = false;
        this.loadMockData();
      }
    });
  }

  private convertToDisplayFormat(item: PartReturnStatusDto): PartReturnStatusItem {
    // Determine status based on backend data or use provided status
    let status = item.status || this.determineStatusFromData(item);
    
    return {
      serviceCallId: item.service_Call_ID,
      partNum: item.part_Num,
      dcPartNum: item.dc_Part_Num,
      totalQty: item.totalQty,
      description: item.description,
      faultyParts: item.faultyParts,
      unusedParts: item.unusedParts,
      invUserID: item.invUserID,
      technician: item.technician,
      lastModified: item.lastModified ? new Date(item.lastModified) : null,
      status: status
    };
  }

  private determineStatusFromData(item: PartReturnStatusDto): string {
    // Logic to determine status based on the current filter/key
    const formValue = this.partReturnFilterForm.value;
    const selectedKey = parseInt(formValue.status) || 0;
    
    switch (selectedKey) {
      case 0:
        return 'not-returned';
      case 1:
        return 'in-progress';
      case 2:
        return 'pending';
      case 3:
        return 'returned';
      default:
        return 'not-returned';
    }
  }

  private loadMockData(): void {
    // Mock data for development/testing when API is not available
    this.partReturnStatusList = [
      {
        serviceCallId: 'SC240001',
        partNum: 'P12345',
        dcPartNum: 'DC12345',
        totalQty: 10,
        description: 'UPS Battery Pack',
        faultyParts: 2,
        unusedParts: 1,
        invUserID: 'INVUSER1',
        technician: 'John Smith',
        lastModified: new Date('2024-11-20'),
        status: 'returned'
      },
      {
        serviceCallId: 'SC240002',
        partNum: 'P67890',
        dcPartNum: 'DC67890',
        totalQty: 5,
        description: 'Power Module',
        faultyParts: 0,
        unusedParts: 2,
        invUserID: 'INVUSER2',
        technician: 'Jane Doe',
        lastModified: new Date('2024-11-22'),
        status: 'in-progress'
      },
      {
        serviceCallId: 'SC240003',
        partNum: 'P11111',
        dcPartNum: 'DC11111',
        totalQty: 8,
        description: 'Circuit Board',
        faultyParts: 1,
        unusedParts: 0,
        invUserID: 'INVUSER1',
        technician: 'Mike Johnson',
        lastModified: new Date('2024-11-25'),
        status: 'pending'
      },
      {
        serviceCallId: 'SC240004',
        partNum: 'P22222',
        dcPartNum: 'DC22222',
        totalQty: 3,
        description: 'Cooling Fan',
        faultyParts: 0,
        unusedParts: 0,
        invUserID: 'INVUSER1',
        technician: 'Sarah Wilson',
        lastModified: new Date('2024-11-23'),
        status: 'not-returned'
      }
    ];
    this.currentPage = 1;
    this.updateDisplayedData();
    this.isLoading = false;
  }

  loadPartsToBeReceivedChart(): void {
    this.isLoadingChart = true;
    this.chartErrorMessage = '';
    const currentYear = this.partReturnFilterForm.get('year')?.value || new Date().getFullYear();

    this._reportService.getPartsToBeReceivedChart(currentYear).subscribe({
      next: (response: PartsToBeReceivedApiResponseDto) => {
        this.isLoadingChart = false;
        
        if (response.success && response.data) {
          this.chartData = response.data.chartData || [];
          this.chartTotals = response.data.totals || { unUsedTR: 0, faultyTR: 0 };
          this.showChart = this.chartData.length > 0;
          
          // Render charts after data is loaded
          setTimeout(() => this.renderCharts(), 100);
        } else {
          this.chartErrorMessage = response.message || 'No chart data available';
          this.chartData = [];
          this.chartTotals = { unUsedTR: 0, faultyTR: 0 };
          this.showChart = false;
        }
      },
      error: (error) => {
        this.isLoadingChart = false;
        this.chartErrorMessage = `Error loading chart data: ${error.message}`;
        this.loadMockChartData();
      }
    });
  }

  private loadMockChartData(): void {
    // Mock chart data for development/testing when API is not available
    this.chartData = [
      { name: 'January', jobsCount: 45, faulty: 12 },
      { name: 'February', jobsCount: 38, faulty: 8 },
      { name: 'March', jobsCount: 52, faulty: 15 },
      { name: 'April', jobsCount: 41, faulty: 9 },
      { name: 'May', jobsCount: 48, faulty: 11 },
      { name: 'June', jobsCount: 35, faulty: 7 }
    ];
    this.chartTotals = { unUsedTR: 156, faultyTR: 62 };
    this.showChart = true;
    this.isLoadingChart = false;
    
    // Render charts after mock data is loaded
    setTimeout(() => this.renderCharts(), 100);
  }

  onFilterChanges(): void {
    let previousYear = this.partReturnFilterForm.get('year')?.value;
    
    this.partReturnFilterForm.valueChanges.subscribe((selectedValue: any) => {
      console.log('Form values changed:', selectedValue);
      
      // Only reload data if this isn't a programmatic update
      if (this.partReturnFilterForm.dirty) {
        this.getPartReturnStatusReport();
      }
      
      // Reload charts when year changes
      if (selectedValue.year !== previousYear) {
        previousYear = selectedValue.year;
        this.loadPartsToBeReceivedChart();
        this.loadPartsReceivedByWarehouseChart();
      }
    });
  }

  sortTable(column: string): void {
    if (this.sortedColumn === column) {
      this.sortDirection = -this.sortDirection;
    } else {
      this.sortedColumn = column;
      this.sortDirection = 1;
    }

    this.partReturnStatusList.sort((a: any, b: any) => {
      let aValue = a[column];
      let bValue = b[column];

      // Handle null or undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1 * this.sortDirection;
      if (bValue == null) return -1 * this.sortDirection;

      // Handle different data types
      if (column === 'totalQty' || column === 'faultyParts' || column === 'unusedParts') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      } else if (column === 'lastModified') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return -1 * this.sortDirection;
      if (aValue > bValue) return 1 * this.sortDirection;
      return 0;
    });

    this.currentPage = 1;
    this.updateDisplayedData();
  }

  sortIcon(column: string): string {
    if (this.sortedColumn === column) {
      return this.sortDirection === 1 ? 'bi-arrow-up' : 'bi-arrow-down';
    }
    return 'bi-arrow-down-up';
  }

  getSortClass(column: string): string {
    if (this.sortedColumn === column) {
      return this.sortDirection === 1 ? 'sorted-asc' : 'sorted-desc';
    }
    return '';
  }

  exportToExcel(): void {
    if (this.partReturnStatusList.length === 0) {
      return;
    }

    const csvData = this.convertToCSV(this.partReturnStatusList);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Part_Return_Status_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private convertToCSV(data: PartReturnStatusItem[]): string {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = [
      'Service Call ID',
      'Part Number',
      'DC Part Number', 
      'Total Qty',
      'Description',
      'Faulty Parts',
      'Unused Parts',
      'Inventory User ID',
      'Technician',
      'Last Modified'
    ];

    const csvRows = data.map(item => [
      item.serviceCallId || '',
      item.partNum || '',
      item.dcPartNum || '',
      item.totalQty?.toString() || '',
      item.description || '',
      item.faultyParts?.toString() || '',
      item.unusedParts?.toString() || '',
      item.invUserID || '',
      item.technician || '',
      item.lastModified ? new Date(item.lastModified).toLocaleDateString() : ''
    ]);

    const allRows = [headers, ...csvRows];
    
    return allRows.map(row => 
      row.map(field => {
        if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      }).join(',')
    ).join('\n');
  }

  refreshData(): void {
    this.getPartReturnStatusReport();
    this.loadPartsToBeReceivedChart();
    this.loadWeeklyPartsReturnedCount();
    this.loadPartsReceivedByWarehouseChart();
    this.loadPartsReturnDataByWeekNo();
    // Ensure charts remain visible after refresh
    setTimeout(() => this.ensureChartsVisible(), 200);
  }

  clearFilters(): void {
    this.partReturnFilterForm.patchValue({
      inventoryUser: 'All',
      status: '0',  // Default to Not Returned (key 0)
      year: new Date().getFullYear(),
      weekNo: this.getCurrentWeekNumber()
    });
    
    this.currentPage = 1;
    this.loadPartsToBeReceivedChart();
    this.loadPartsReceivedByWarehouseChart();
    this.loadPartsReturnDataByWeekNo();
  }

  getInventoryUserDisplayName(user: InventoryUser): string {
    return user.username || 'Unknown User';
  }

  getInventoryUserValue(user: InventoryUser): string {
    // Backend expects full names like "Adam Keith", "Anton Johnson"
    // Use username field which contains full names, not invUserID which has abbreviated names
    const value = (user.username || user.invUserID || '').trim();
    console.log('getInventoryUserValue - User:', user, 'Returning value:', value);
    return value;
  }

  getSelectedStatusLabel(): string {
    const selectedValue = this.partReturnFilterForm.get('status')?.value;
    const selectedOption = this.statusOptions.find(option => option.key.toString() === selectedValue?.toString());
    return selectedOption ? selectedOption.label : 'Not Returned';
  }

  getFilterBadgeClass(): string {
    const selectedValue = this.partReturnFilterForm.get('status')?.value;
    
    const statusClassMap: { [key: string]: string } = {
      '0': 'badge bg-secondary', // Not Returned
      '1': 'badge bg-warning',   // In Progress
      '2': 'badge bg-danger',    // Pending
      '3': 'badge bg-success'    // Returned
    };
    
    return statusClassMap[selectedValue] || 'badge bg-secondary';
  }

  // Pagination methods
  updateDisplayedData(): void {
    this.isProcessingData = true;
    this.totalRecords = this.partReturnStatusList.length;
    
    setTimeout(() => {
      const startIndex = (this.currentPage - 1) * this.pageSize;
      const endIndex = Math.min(startIndex + this.pageSize, this.totalRecords);
      this.displayedData = this.partReturnStatusList.slice(startIndex, endIndex);
      this.isProcessingData = false;
    }, 10);
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

  get totalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize);
  }

  get startRecord(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endRecord(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalRecords);
  }

  goBack(): void {
    this.router.navigate(['/reports']);
  }

  navigateToServiceCall(serviceCallId: string, technician?: string): void {
    if (serviceCallId && serviceCallId.trim() !== '') {
      const callNumber = serviceCallId.trim();
      const technicianParam = technician && technician.trim() ? `&technician=${encodeURIComponent(technician.trim())}` : '';
      const targetUrl = `${window.location.origin}${window.location.pathname}#/jobs/parts?callNumber=${callNumber}${technicianParam}`;
      
      console.log('Navigating to call:', targetUrl);
      window.open(targetUrl, '_blank');
    }
  }

  navigateToTechnicianJobs(serviceCallId: string, technician: string): void {
    if (serviceCallId && serviceCallId.trim() !== '') {
      const callNumber = serviceCallId.trim();
      const technicianParam = technician && technician.trim() ? `&technician=${encodeURIComponent(technician.trim())}` : '';
      const targetUrl = `${window.location.origin}${window.location.pathname}#/jobs/parts?callNumber=${callNumber}${technicianParam}`;
      
      console.log('Navigating to technician jobs:', targetUrl, 'for technician:', technician);
      window.open(targetUrl, '_blank');
    }
  }

  getStatusCount(status: string): number {
    return this.partReturnStatusList.filter(item => item.status === status).length;
  }

  getTotalPartsCount(): number {
    return this.partReturnStatusList.reduce((total, item) => total + item.totalQty, 0);
  }

  getFaultyPartsCount(): number {
    return this.partReturnStatusList.reduce((total, item) => total + item.faultyParts, 0);
  }

  getUnusedPartsCount(): number {
    return this.partReturnStatusList.reduce((total, item) => total + item.unusedParts, 0);
  }

  getReturnedPartsCount(): number {
    return this.partReturnStatusList.reduce((total, item) => total + (item.faultyParts + item.unusedParts), 0);
  }

  getReturnPercentage(): number {
    const totalParts = this.getTotalPartsCount();
    const returnedParts = this.getReturnedPartsCount();
    return totalParts > 0 ? Math.round((returnedParts / totalParts) * 100) : 0;
  }

  // Chart helper methods
  getTotalChartJobs(): number {
    return this.chartData.reduce((total, item) => total + item.jobsCount, 0);
  }

  getTotalChartFaulty(): number {
    return this.chartData.reduce((total, item) => total + item.faulty, 0);
  }

  getChartItemPercentage(item: PartsToBeReceivedChartDto): number {
    const totalJobs = this.getTotalChartJobs();
    return totalJobs > 0 ? Math.round((item.jobsCount / totalJobs) * 100) : 0;
  }

  toggleChartVisibility(): void {
    this.showChart = !this.showChart;
  }

  ngAfterViewInit(): void {
    // Initialize charts after view is ready
    setTimeout(() => {
      this.ensureChartsVisible();
    }, 100);
  }

  private ensureChartsVisible(): void {
    // Ensure all charts remain visible and properly rendered
    if (this.chartData.length > 0) {
      this.showChart = true;
      setTimeout(() => this.renderCharts(), 50);
    }
    if (this.weeklyPartsData.length > 0) {
      this.showWeeklyChart = true;
      setTimeout(() => this.renderWeeklyCharts(), 50);
    }
    if (this.receivedChartData.length > 0) {
      this.showReceivedChart = true;
      setTimeout(() => this.renderReceivedCharts(), 50);
    }
  }

  setChartType(type: 'bar' | 'pie' | 'table'): void {
    this.currentChartType = type;
    if (type !== 'table') {
      setTimeout(() => this.renderCharts(), 100);
    }
  }

  getChartColor(index: number): string {
    return this.chartColors[index % this.chartColors.length];
  }

  renderCharts(): void {
    // Ensure we have data and canvas elements before rendering
    if (!this.chartData || this.chartData.length === 0) {
      console.log('No chart data available for rendering');
      return;
    }
    
    // Ensure chart visibility is maintained
    this.showChart = true;
    
    // Add animation class to trigger CSS animations
    this.addChartAnimationClass();
    
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      try {
        if (this.currentChartType === 'bar' && this.barChartCanvas?.nativeElement) {
          this.renderBarChart();
        } else if (this.currentChartType === 'pie' && this.pieChartCanvas?.nativeElement) {
          this.renderPieChart();
        }
        console.log('Charts rendered successfully, type:', this.currentChartType, 'Chart visible:', this.showChart);
      } catch (error) {
        console.error('Error rendering charts:', error);
      }
    }, 50);
  }
  
  private addChartAnimationClass(): void {
    const chartWrappers = document.querySelectorAll('.chart-wrapper');
    chartWrappers.forEach((wrapper, index) => {
      wrapper.classList.add('animating');
      setTimeout(() => {
        wrapper.classList.remove('animating');
      }, 2000 + (index * 200));
    });
  }

  private renderBarChart(): void {
    if (!this.barChartCanvas?.nativeElement || this.chartData.length === 0) return;
    
    const canvas = this.barChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Remove existing listeners
    const existingListener = this.chartClickListeners.get('barChart');
    if (existingListener) {
      canvas.removeEventListener('click', existingListener);
      this.chartClickListeners.delete('barChart');
    }
    
    // Start animation if not already animating
    if (!this.isAnimating) {
      this.animateBarChart(ctx, canvas);
    } else {
      this.drawBars(ctx, canvas, 1); // Draw without animation
    }
    
    const padding = 60;
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - (padding * 2);
    const barWidth = chartWidth / (this.chartData.length * 2);
    const maxValue = Math.max(...this.chartData.map(d => Math.max(d.jobsCount, d.faulty)));
    
    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight * i / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
      
      // Y-axis labels
      ctx.fillStyle = '#6c757d';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      const value = Math.round(maxValue * (5 - i) / 5);
      ctx.fillText(value.toString(), padding - 10, y + 4);
    }
    
    // Draw bars
    this.chartData.forEach((item, index) => {
      const x = padding + (index * 2 * barWidth) + (barWidth * 0.1);
      
      // Jobs count bar (blue)
      const jobsHeight = (item.jobsCount / maxValue) * chartHeight;
      const jobsY = padding + chartHeight - jobsHeight;
      ctx.fillStyle = '#3699ff';
      ctx.fillRect(x, jobsY, barWidth * 0.8, jobsHeight);
      
      // Faulty parts bar (red)
      const faultyHeight = (item.faulty / maxValue) * chartHeight;
      const faultyY = padding + chartHeight - faultyHeight;
      ctx.fillStyle = '#f64e60';
      ctx.fillRect(x + barWidth, faultyY, barWidth * 0.8, faultyHeight);
      
      // X-axis labels
      ctx.fillStyle = '#6c757d';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      const labelX = x + barWidth;
      ctx.fillText(item.name, labelX, canvas.height - padding + 20);
      
      // Value labels on bars - always display outside bars in black
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      
      // Jobs count bar label - always show above bar if value > 0
      if (item.jobsCount > 0) {
        ctx.fillText(item.jobsCount.toString(), x + (barWidth * 0.4), jobsY - 8);
      }
      
      // Faulty parts bar label - always show above bar if value > 0
      if (item.faulty > 0) {
        ctx.fillText(item.faulty.toString(), x + barWidth + (barWidth * 0.4), faultyY - 8);
      }
    });
    
    // Draw axes
    ctx.strokeStyle = '#6c757d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Add click event listener for bar chart
    const clickHandler = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      
      // Check if click is within chart area
      if (clickX >= padding && clickX <= canvas.width - padding && 
          clickY >= padding && clickY <= canvas.height - padding) {
        
        // Determine which bar was clicked
        const barWidth = chartWidth / (this.chartData.length * 2);
        
        for (let i = 0; i < this.chartData.length; i++) {
          const x = padding + (i * 2 * barWidth) + (barWidth * 0.1);
          
          // Check if click is within either bar for this data item
          if (clickX >= x && clickX <= x + (barWidth * 1.8)) {
            console.log('Bar chart clicked:', this.chartData[i]);
            this.onChartItemClick(this.chartData[i], 'parts-to-receive');
            break;
          }
        }
      }
    };
    
    canvas.addEventListener('click', clickHandler);
    this.chartClickListeners.set('barChart', clickHandler);
    
    // Add enhanced hover effect with animation updates
    const hoverHandler = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      canvas.style.cursor = 'default';
      let newHoveredIndex = -1;
      
      if (mouseX >= padding && mouseX <= canvas.width - padding && 
          mouseY >= padding && mouseY <= canvas.height - padding) {
        
        const barWidth = chartWidth / (this.chartData.length * 2);
        
        for (let i = 0; i < this.chartData.length; i++) {
          const x = padding + (i * 2 * barWidth) + (barWidth * 0.1);
          
          if (mouseX >= x && mouseX <= x + (barWidth * 1.8)) {
            canvas.style.cursor = 'pointer';
            newHoveredIndex = i;
            break;
          }
        }
      }
      
      // Only update cursor, no visual changes
      this.hoveredBarIndex = newHoveredIndex;
    };
    
    canvas.addEventListener('mousemove', hoverHandler);
    this.chartClickListeners.set('barChartHover', hoverHandler);
  }

  private animateBarChart(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    this.isAnimating = true;
    this.animationProgress = 0;
    
    const animate = () => {
      this.animationProgress += 0.02;
      
      if (this.animationProgress >= 1) {
        this.animationProgress = 1;
        this.isAnimating = false;
      }
      
      // Easing function for smooth animation
      const easeProgress = this.easeOutCubic(this.animationProgress);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.drawBars(ctx, canvas, easeProgress);
      
      if (this.isAnimating) {
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
  
  private easeOutElastic(t: number): number {
    const c4 = (2 * Math.PI) / 3;
    return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
  
  private drawBars(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, progress: number): void {
    const padding = 60;
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - (padding * 2);
    const barWidth = chartWidth / (this.chartData.length * 2);
    const maxValue = Math.max(...this.chartData.map(d => Math.max(d.jobsCount, d.faulty)));
    
    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(84, 134, 255, 0.02)');
    gradient.addColorStop(1, 'rgba(102, 126, 234, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw animated grid lines
    ctx.strokeStyle = 'rgba(233, 236, 239, 0.8)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight * i / 5);
      const gridProgress = Math.max(0, Math.min(1, (progress * 1.2) - (i * 0.1)));
      
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding + (chartWidth * gridProgress), y);
      ctx.stroke();
      
      // Y-axis labels with fade-in
      if (progress > 0.5) {
        ctx.fillStyle = `rgba(108, 117, 125, ${(progress - 0.5) * 2})`;
        ctx.font = '12px Inter, Arial, sans-serif';
        ctx.textAlign = 'right';
        const value = Math.round(maxValue * (5 - i) / 5);
        ctx.fillText(value.toString(), padding - 10, y + 4);
      }
    }
    
    // Draw animated bars
    this.chartData.forEach((item, index) => {
      const x = padding + (index * 2 * barWidth) + (barWidth * 0.1);
      
      // Jobs count bar with gradient and animation (no hover effects)
      const jobsHeight = ((item.jobsCount / maxValue) * chartHeight * progress);
      const jobsY = padding + chartHeight - jobsHeight;
      
      // Create gradient for jobs bar (consistent colors)
      const jobsGradient = ctx.createLinearGradient(0, jobsY, 0, jobsY + jobsHeight);
      jobsGradient.addColorStop(0, '#3699ff');
      jobsGradient.addColorStop(1, '#1d4ed8');
      
      ctx.fillStyle = jobsGradient;
      ctx.shadowColor = 'rgba(54, 153, 255, 0.2)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
      
      const barWidthScaled = barWidth * 0.8;
      
      this.drawRoundedRect(ctx, x, jobsY, barWidthScaled, jobsHeight, 4);
      
      // Faulty parts bar (consistent colors)
      const faultyHeight = ((item.faulty / maxValue) * chartHeight * progress);
      const faultyY = padding + chartHeight - faultyHeight;
      
      const faultyGradient = ctx.createLinearGradient(0, faultyY, 0, faultyY + faultyHeight);
      faultyGradient.addColorStop(0, '#f64e60');
      faultyGradient.addColorStop(1, '#e53e3e');
      
      ctx.fillStyle = faultyGradient;
      ctx.shadowColor = 'rgba(246, 78, 96, 0.2)';
      
      this.drawRoundedRect(ctx, x + barWidth, faultyY, barWidthScaled, faultyHeight, 4);
      
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      // X-axis labels with bounce-in animation
      if (progress > 0.7) {
        const labelProgress = Math.min(1, (progress - 0.7) / 0.3);
        const bounceProgress = this.easeOutElastic(labelProgress);
        
        ctx.fillStyle = `rgba(108, 117, 125, ${labelProgress})`;
        ctx.font = '11px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.save();
        ctx.translate(x + barWidth, canvas.height - padding + 20);
        ctx.scale(bounceProgress, bounceProgress);
        ctx.fillText(item.name, 0, 0);
        ctx.restore();
      }
      
      // Animated value labels - always show outside bars in black
      if (progress > 0.8) {
        const labelAlpha = (progress - 0.8) / 0.2;
        ctx.fillStyle = `rgba(0, 0, 0, ${labelAlpha})`;
        ctx.font = 'bold 11px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        
        // Jobs count label - always above bar
        if (item.jobsCount > 0) {
          ctx.fillText(item.jobsCount.toString(), x + (barWidth * 0.4), jobsY - 8);
        }
        
        // Faulty count label - always above bar
        if (item.faulty > 0) {
          ctx.fillText(item.faulty.toString(), x + barWidth + (barWidth * 0.4), faultyY - 8);
        }
      }
    });
    
    // Draw axes with animation
    if (progress > 0.3) {
      ctx.strokeStyle = `rgba(108, 117, 125, ${(progress - 0.3) / 0.7})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, canvas.height - padding);
      ctx.lineTo(canvas.width - padding, canvas.height - padding);
      ctx.stroke();
    }
  }
  


  private renderPieChart(): void {
    if (!this.pieChartCanvas?.nativeElement) {
      console.log('Pie chart canvas not found');
      return;
    }
    
    if (this.chartData.length === 0) {
      console.log('No chart data available');
      return;
    }
    
    const canvas = this.pieChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.log('Cannot get canvas context');
      return;
    }

    // Ensure canvas has proper dimensions
    if (canvas.width === 0 || canvas.height === 0) {
      canvas.width = canvas.offsetWidth || 800;
      canvas.height = canvas.offsetHeight || 400;
      console.log('Canvas dimensions set to:', canvas.width, 'x', canvas.height);
    }

    console.log('Rendering pie chart with data:', this.chartData.length, 'items');
    console.log('Canvas size:', canvas.width, 'x', canvas.height);

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Remove existing listeners
    const existingListener = this.chartClickListeners.get('pieChart');
    if (existingListener) {
      canvas.removeEventListener('click', existingListener);
      this.chartClickListeners.delete('pieChart');
    }
    
    try {
      // Always render the modern pie chart directly
      this.drawModernPieSlices(ctx, canvas, 1);
      console.log('Pie chart rendered successfully');
    } catch (error) {
      console.error('Error rendering pie chart:', error);
    }
    
    // Setup click detection with proper positioning
    const total = this.chartData.reduce((sum, item) => sum + item.jobsCount, 0);
    const legendWidth = 220;
    const availableWidth = canvas.width - legendWidth;
    const adjustedCenterX = legendWidth + (availableWidth / 2);
    const adjustedCenterY = canvas.height / 2;
    const adjustedOuterRadius = Math.min(availableWidth / 2, adjustedCenterY) - 40;
    const adjustedInnerRadius = adjustedOuterRadius * 0.4;
    
    // Add click event listener for pie chart
    const clickHandler = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      
      // Calculate distance from center using adjusted positions
      const dx = clickX - adjustedCenterX;
      const dy = clickY - adjustedCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check if click is within the pie chart (outside inner circle)
      if (distance <= adjustedOuterRadius && distance >= adjustedInnerRadius) {
        // Calculate angle of click
        let angle = Math.atan2(dy, dx);
        // Normalize angle to 0-2π and adjust for starting position
        angle = (angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
        
        // Find which slice was clicked
        let currentAngle = 0;
        for (let i = 0; i < this.chartData.length; i++) {
          const sliceAngle = (this.chartData[i].jobsCount / total) * 2 * Math.PI;
          
          if (angle >= currentAngle && angle <= currentAngle + sliceAngle) {
            console.log('Modern pie chart clicked:', this.chartData[i]);
            this.animateSliceClick(i);
            // Small delay before navigation for visual feedback
            setTimeout(() => {
              this.onChartItemClick(this.chartData[i], 'parts-to-receive');
            }, 300);
            break;
          }
          
          currentAngle += sliceAngle;
        }
      }
    };
    
    canvas.addEventListener('click', clickHandler);
    this.chartClickListeners.set('pieChart', clickHandler);
    
    // Enhanced interactive mouse handlers
    const mouseMoveHandler = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      const dx = mouseX - adjustedCenterX;
      const dy = mouseY - adjustedCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= adjustedOuterRadius && distance >= adjustedInnerRadius) {
        canvas.style.cursor = 'pointer';
        
        // Calculate which slice is being hovered
        let angle = Math.atan2(dy, dx);
        angle = (angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
        
        let currentAngle = 0;
        let newHoveredIndex = -1;
        
        for (let i = 0; i < this.chartData.length; i++) {
          const sliceAngle = (this.chartData[i].jobsCount / total) * 2 * Math.PI;
          
          if (angle >= currentAngle && angle <= currentAngle + sliceAngle) {
            newHoveredIndex = i;
            break;
          }
          
          currentAngle += sliceAngle;
        }
        
        if (newHoveredIndex !== this.hoveredSliceIndex) {
          this.hoveredSliceIndex = newHoveredIndex;
          this.animateSliceHover();
        }
        
        // Update tooltip position
        this.updateTooltipPosition(event, canvas);
        this.isHovering = true;
      } else {
        canvas.style.cursor = 'default';
        if (this.hoveredSliceIndex !== -1) {
          this.hoveredSliceIndex = -1;
          this.animateSliceHover();
        }
        this.isHovering = false;
      }
    };
    
    const mouseLeaveHandler = () => {
      canvas.style.cursor = 'default';
      this.hoveredSliceIndex = -1;
      this.isHovering = false;
      this.animateSliceHover();
    };
    
    canvas.addEventListener('mousemove', mouseMoveHandler);
    canvas.addEventListener('mouseleave', mouseLeaveHandler);
    this.chartClickListeners.set('pieChartHover', mouseMoveHandler);
    this.chartClickListeners.set('pieChartLeave', mouseLeaveHandler);
  }
  
  private animatePieChart(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    this.isAnimating = true;
    this.animationProgress = 0;
    
    const animate = () => {
      this.animationProgress += 0.02;
      
      if (this.animationProgress >= 1) {
        this.animationProgress = 1;
        this.isAnimating = false;
      }
      
      const easeProgress = this.easeOutCubic(this.animationProgress);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.drawModernPieSlices(ctx, canvas, easeProgress);
      
      if (this.isAnimating) {
        this.animationFrameId = requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  private drawPieSlices(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, progress: number): void {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const baseRadius = Math.min(centerX, centerY) - 40;
    const total = this.chartData.reduce((sum, item) => sum + item.jobsCount, 0);
    let currentAngle = -Math.PI / 2;
    
    // Draw gradient background
    const bgGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius + 20);
    bgGradient.addColorStop(0, 'rgba(248, 250, 252, 0.9)');
    bgGradient.addColorStop(1, 'rgba(241, 245, 249, 0.7)');
    ctx.fillStyle = bgGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius + 20, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw animated slices (no hover effects)
    this.chartData.forEach((item, index) => {
      const sliceAngle = (item.jobsCount / total) * 2 * Math.PI * progress;
      const radius = baseRadius; // No hover scaling
      
      // Create gradient for slice (consistent colors)
      const sliceGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, radius
      );
      const color = this.getAnimatedChartColor(index, false); // Always pass false for hover
      sliceGradient.addColorStop(0, color.light);
      sliceGradient.addColorStop(1, color.dark);
      
      ctx.fillStyle = sliceGradient;
      
      // Add consistent shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 5;
      
      // Draw slice (no offset)
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      
      // Draw slice border
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 3;
      ctx.stroke();
      
      // Draw enhanced labels with data names and values
      if (progress > 0.7 && sliceAngle > 0.2) {
        const percentage = Math.round((item.jobsCount / total) * 100);
        const labelProgress = Math.min(1, (progress - 0.7) / 0.3);
        const bounceProgress = this.easeOutElastic(labelProgress);
        
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelRadius = radius * 0.75;
        const labelX = centerX + Math.cos(labelAngle) * labelRadius;
        const labelY = centerY + Math.sin(labelAngle) * labelRadius;
        
        // Draw white background for better readability
        ctx.fillStyle = `rgba(255, 255, 255, ${labelProgress * 0.9})`;
        ctx.beginPath();
        ctx.arc(labelX, labelY, 25 * bounceProgress, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw name (abbreviated if too long)
        const displayName = item.name.length > 10 ? item.name.substring(0, 8) + '...' : item.name;
        ctx.fillStyle = `rgba(31, 41, 55, ${labelProgress})`;
        ctx.font = `bold ${9 * bounceProgress}px Inter, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(displayName, labelX, labelY - 5);
        
        // Draw value and percentage
        ctx.font = `bold ${10 * bounceProgress}px Inter, Arial, sans-serif`;
        ctx.fillText(`${item.jobsCount}`, labelX, labelY + 5);
        ctx.font = `${8 * bounceProgress}px Inter, Arial, sans-serif`;
        ctx.fillText(`(${percentage}%)`, labelX, labelY + 15);
      }
      
      currentAngle += sliceAngle;
    });
    
    // Draw animated center circle
    const centerRadius = baseRadius * 0.4 * progress;
    const centerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, centerRadius);
    centerGradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    centerGradient.addColorStop(1, 'rgba(248, 250, 252, 0.9)');
    
    ctx.fillStyle = centerGradient;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.shadowBlur = 0;
    
    // Draw total in center with bounce animation
    if (progress > 0.8) {
      const textProgress = (progress - 0.8) / 0.2;
      const bounceProgress = this.easeOutElastic(textProgress);
      
      ctx.fillStyle = `rgba(108, 117, 125, ${textProgress})`;
      ctx.font = `bold ${16 * bounceProgress}px Inter, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('Total Jobs', centerX, centerY - 5);
      ctx.fillText(total.toString(), centerX, centerY + 15);
    }
    
    // Draw legend below pie chart
    if (progress > 0.9) {
      const legendY = centerY + baseRadius + 60;
      const legendItemWidth = Math.min(120, canvas.width / Math.min(this.chartData.length, 4));
      const startX = centerX - (Math.min(this.chartData.length, 4) * legendItemWidth) / 2;
      
      this.chartData.slice(0, 4).forEach((item, index) => {
        const x = startX + (index * legendItemWidth);
        const color = this.getAnimatedChartColor(index, false);
        
        // Legend color box
        ctx.fillStyle = color.dark;
        ctx.fillRect(x, legendY - 8, 12, 12);
        
        // Legend text
        ctx.fillStyle = '#374151';
        ctx.font = '11px Inter, Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(`${item.name}: ${item.jobsCount}`, x + 18, legendY + 2);
      });
      
      // Show remaining items count if more than 4
      if (this.chartData.length > 4) {
        const remaining = this.chartData.length - 4;
        ctx.fillStyle = '#6B7280';
        ctx.font = '10px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`+${remaining} more items`, centerX, legendY + 25);
      }
    }
  }
  
  private getAnimatedChartColor(index: number, isHovered: boolean): {light: string, dark: string} {
    const colors = [
      { light: '#60A5FA', dark: '#2563EB' }, // Blue
      { light: '#F87171', dark: '#DC2626' }, // Red  
      { light: '#34D399', dark: '#059669' }, // Green
      { light: '#FBBF24', dark: '#D97706' }, // Yellow
      { light: '#A78BFA', dark: '#7C3AED' }, // Purple
      { light: '#FB7185', dark: '#E11D48' }, // Pink
      { light: '#FB923C', dark: '#EA580C' }, // Orange
      { light: '#818CF8', dark: '#4338CA' }, // Indigo
      { light: '#2DD4BF', dark: '#0D9488' }, // Teal
      { light: '#FDE047', dark: '#CA8A04' }  // Lime
    ];
    
    const colorSet = colors[index % colors.length];
    
    if (isHovered) {
      return {
        light: this.lightenColor(colorSet.light, 20),
        dark: this.darkenColor(colorSet.dark, 10)
      };
    }
    
    return colorSet;
  }
  
  private lightenColor(color: string, percent: number): string {
    // Simple color lightening - in production, use a proper color library
    return color;
  }
  
  private darkenColor(color: string, percent: number): string {
    // Simple color darkening - in production, use a proper color library  
    return color;
  }

  // Additional methods for template
  trackByServiceCallId(index: number, item: PartReturnStatusItem): string {
    return item.serviceCallId;
  }

  getInitials(fullName: string): string {
    if (!fullName) return '';
    return fullName.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  applyFilter(filterValue: string): void {
    // Implement search functionality
    if (!filterValue || filterValue.trim() === '') {
      this.updateDisplayedData();
      return;
    }

    const filteredData = this.partReturnStatusList.filter(item =>
      item.serviceCallId.toLowerCase().includes(filterValue.toLowerCase()) ||
      item.partNum.toLowerCase().includes(filterValue.toLowerCase()) ||
      item.dcPartNum.toLowerCase().includes(filterValue.toLowerCase()) ||
      item.description.toLowerCase().includes(filterValue.toLowerCase()) ||
      item.technician.toLowerCase().includes(filterValue.toLowerCase()) ||
      item.invUserID.toLowerCase().includes(filterValue.toLowerCase())
    );

    this.displayedData = filteredData;
    this.totalRecords = filteredData.length;
    this.currentPage = 1;
  }

  // Helper method to get current week number
  getCurrentWeekNumber(): number {
    const currentDate = new Date();
    const startOfYear = new Date(currentDate.getFullYear(), 0, 1);
    const days = Math.floor((currentDate.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil(days / 7);
    return Math.min(weekNumber, 53); // Ensure week number doesn't exceed 53
  }

  // Get available week numbers (1-53)
  getAvailableWeeks(): number[] {
    return Array.from({ length: 53 }, (_, i) => i + 1);
  }

  // Parts Return Data by Week Number methods
  loadPartsReturnDataByWeekNo(): void {
    const weekNo = this.partReturnFilterForm.get('weekNo')?.value || this.getCurrentWeekNumber();
    
    if (weekNo < 1 || weekNo > 53) {
      this.weeklyDataErrorMessage = 'Week number must be between 1 and 53';
      return;
    }

    this.isLoadingWeeklyData = true;
    this.weeklyDataErrorMessage = '';

    this._reportService.getPartsReturnDataByWeekNo(weekNo).subscribe({
      next: (response: PartsReturnDataByWeekNoApiResponseDto) => {
        this.isLoadingWeeklyData = false;
        

        
        if (response.success && response.data && response.data.length > 0) {
          this.partsReturnDataByWeekNo = response.data.map(item => this.convertWeeklyDataToDisplayFormat(item));
          this.showWeeklyData = true;
          this.weeklyDataErrorMessage = '';
        } else {
          // Handle empty data or unsuccessful response
          this.weeklyDataErrorMessage = response.message || `No parts return data found for week ${weekNo}`;
          this.partsReturnDataByWeekNo = [];
          this.showWeeklyData = false;
        }
      },
      error: (error) => {

        this.isLoadingWeeklyData = false;
        this.weeklyDataErrorMessage = `Error loading parts return data for week ${weekNo} (${error.status}): ${error.message || 'Network error'}`;
        this.partsReturnDataByWeekNo = [];
        this.showWeeklyData = false;
        // Only load mock data in development environment
        if (!environment.production) {
          this.loadMockWeeklyReturnData();
        }
      }
    });
  }

  private convertWeeklyDataToDisplayFormat(item: PartsReturnDataByWeekNoDto): PartsReturnDataByWeekNoItem {
    return {
      serviceCallId: item.service_Call_ID || '',
      unusedSentBack: item.unusedSentBack || 0,
      faultySentBack: item.faultySentBack || 0,
      returnStatus: item.returnStatus || '',
      returnNotes: item.returnNotes || '',
      truckStock: item.truckStock || 0,
      techName: item.techName || '',
      maintAuthId: item.maint_Auth_ID || '',
      lastModified: item.lastModified ? new Date(item.lastModified) : null
    };
  }

  private loadMockWeeklyReturnData(): void {
    // Mock weekly return data for development/testing when API is not available
    this.partsReturnDataByWeekNo = [
      {
        serviceCallId: 'SC240100',
        unusedSentBack: 3,
        faultySentBack: 1,
        returnStatus: 'Completed',
        returnNotes: 'Parts returned to warehouse successfully',
        truckStock: 15,
        techName: 'John Smith',
        maintAuthId: 'MA001',
        lastModified: new Date('2024-11-20')
      },
      {
        serviceCallId: 'SC240101',
        unusedSentBack: 2,
        faultySentBack: 0,
        returnStatus: 'Pending',
        returnNotes: 'Waiting for warehouse pickup',
        truckStock: 8,
        techName: 'Jane Doe',
        maintAuthId: 'MA002',
        lastModified: new Date('2024-11-22')
      },
      {
        serviceCallId: 'SC240102',
        unusedSentBack: 1,
        faultySentBack: 2,
        returnStatus: 'In Progress',
        returnNotes: 'Parts being processed',
        truckStock: 12,
        techName: 'Mike Johnson',
        maintAuthId: 'MA003',
        lastModified: new Date('2024-11-23')
      }
    ];
    this.showWeeklyData = true;
    this.isLoadingWeeklyData = false;
  }

  onWeekNumberChange(): void {
    this.loadPartsReturnDataByWeekNo();
  }

  toggleWeeklyDataVisibility(): void {
    this.showWeeklyData = !this.showWeeklyData;
  }

  // Weekly Parts Returned Count methods
  loadWeeklyPartsReturnedCount(): void {
    this.isLoadingWeeklyChart = true;
    this.weeklyChartErrorMessage = '';

    this._reportService.getWeeklyPartsReturnedCount().subscribe({
      next: (response: WeeklyPartsReturnedCountApiResponseDto) => {
        this.isLoadingWeeklyChart = false;
        
        if (response.success && response.data) {
          this.weeklyPartsData = response.data;
          this.showWeeklyChart = this.weeklyPartsData.length > 0;
          
          // Render charts after data is loaded
          setTimeout(() => this.renderWeeklyCharts(), 100);
        } else {
          this.weeklyChartErrorMessage = response.message || 'No weekly parts data available';
          this.weeklyPartsData = [];
          this.showWeeklyChart = false;
        }
      },
      error: (error) => {

        this.isLoadingWeeklyChart = false;
        this.weeklyChartErrorMessage = `Error loading weekly parts data: ${error.message}`;
        this.loadMockWeeklyData();
      }
    });
  }

  private loadMockWeeklyData(): void {
    // Mock weekly data for development/testing when API is not available
    this.weeklyPartsData = [
      { wkEnd: '01/07', unUsed: 12, faulty: 8, weekNo: 1 },
      { wkEnd: '01/14', unUsed: 15, faulty: 5, weekNo: 2 },
      { wkEnd: '01/21', unUsed: 9, faulty: 12, weekNo: 3 },
      { wkEnd: '01/28', unUsed: 18, faulty: 7, weekNo: 4 },
      { wkEnd: '02/04', unUsed: 11, faulty: 9, weekNo: 5 },
      { wkEnd: '02/11', unUsed: 14, faulty: 6, weekNo: 6 },
      { wkEnd: '02/18', unUsed: 16, faulty: 11, weekNo: 7 },
      { wkEnd: '02/25', unUsed: 13, faulty: 8, weekNo: 8 }
    ];
    this.showWeeklyChart = true;
    this.isLoadingWeeklyChart = false;
    
    // Render charts after mock data is loaded
    setTimeout(() => this.renderWeeklyCharts(), 100);
  }

  setWeeklyChartType(type: 'bar' | 'line' | 'table'): void {
    this.currentWeeklyChartType = type;
    if (type !== 'table') {
      setTimeout(() => this.renderWeeklyCharts(), 100);
    }
  }

  toggleWeeklyChartVisibility(): void {
    this.showWeeklyChart = !this.showWeeklyChart;
  }

  renderWeeklyCharts(): void {
    if (this.currentWeeklyChartType === 'bar') {
      this.renderWeeklyBarChart();
    } else if (this.currentWeeklyChartType === 'line') {
      this.renderWeeklyLineChart();
    }
  }

  private renderWeeklyBarChart(): void {
    if (!this.weeklyBarChartCanvas?.nativeElement || this.weeklyPartsData.length === 0) return;
    
    const canvas = this.weeklyBarChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Remove existing click listener if any
    const existingListener = this.chartClickListeners.get('weeklyBarChart');
    if (existingListener) {
      canvas.removeEventListener('click', existingListener);
      this.chartClickListeners.delete('weeklyBarChart');
    }
    
    const padding = 60;
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - (padding * 2);
    const barGroupWidth = chartWidth / this.weeklyPartsData.length;
    const barWidth = barGroupWidth * 0.35;
    const maxValue = Math.max(...this.weeklyPartsData.map(d => Math.max(d.unUsed, d.faulty)));
    
    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight * i / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
      
      // Y-axis labels
      ctx.fillStyle = '#6c757d';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      const value = Math.round(maxValue * (5 - i) / 5);
      ctx.fillText(value.toString(), padding - 10, y + 4);
    }
    
    // Draw bars
    this.weeklyPartsData.forEach((item, index) => {
      const x = padding + (index * barGroupWidth) + (barGroupWidth * 0.1);
      
      // UnUsed parts bar (blue)
      const unusedHeight = (item.unUsed / maxValue) * chartHeight;
      const unusedY = padding + chartHeight - unusedHeight;
      ctx.fillStyle = '#3699ff';
      ctx.fillRect(x, unusedY, barWidth, unusedHeight);
      
      // Faulty parts bar (red)
      const faultyHeight = (item.faulty / maxValue) * chartHeight;
      const faultyY = padding + chartHeight - faultyHeight;
      ctx.fillStyle = '#f64e60';
      ctx.fillRect(x + barWidth + 5, faultyY, barWidth, faultyHeight);
      
      // X-axis labels (week end dates)
      ctx.fillStyle = '#6c757d';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      const labelX = x + barWidth + 2.5;
      ctx.fillText(item.wkEnd, labelX, canvas.height - padding + 15);
      
      // Value labels on bars - always display outside bars in black
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 10px Arial';
      ctx.textAlign = 'center';
      
      // UnUsed parts label - always above bar
      if (item.unUsed > 0) {
        ctx.fillText(item.unUsed.toString(), x + (barWidth * 0.5), unusedY - 8);
      }
      
      // Faulty parts label - always above bar
      if (item.faulty > 0) {
        ctx.fillText(item.faulty.toString(), x + barWidth + 5 + (barWidth * 0.5), faultyY - 8);
      }
    });
    
    // Draw legend
    ctx.fillStyle = '#3699ff';
    ctx.fillRect(padding + 10, 20, 15, 12);
    ctx.fillStyle = '#6c757d';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Unused Parts', padding + 30, 31);
    
    ctx.fillStyle = '#f64e60';
    ctx.fillRect(padding + 130, 20, 15, 12);
    ctx.fillStyle = '#6c757d';
    ctx.fillText('Faulty Parts', padding + 150, 31);
    
    // Draw axes
    ctx.strokeStyle = '#6c757d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Add click event listener for weekly bar chart
    const clickHandler = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      
      // Check if click is within chart area
      if (clickX >= padding && clickX <= canvas.width - padding && 
          clickY >= padding && clickY <= canvas.height - padding) {
        
        // Determine which bar was clicked
        const barGroupWidth = chartWidth / this.weeklyPartsData.length;
        
        for (let i = 0; i < this.weeklyPartsData.length; i++) {
          const x = padding + (i * barGroupWidth) + (barGroupWidth * 0.1);
          const barWidth = barGroupWidth * 0.35;
          
          // Check if click is within either bar for this data item
          if (clickX >= x && clickX <= x + (barWidth * 2) + 5) {
            this.onChartItemClick(this.weeklyPartsData[i], 'weekly-returned');
            break;
          }
        }
      }
    };
    
    canvas.addEventListener('click', clickHandler);
    this.chartClickListeners.set('weeklyBarChart', clickHandler);
    
    // Add hover effect
    const hoverHandler = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      canvas.style.cursor = 'default';
      
      if (mouseX >= padding && mouseX <= canvas.width - padding && 
          mouseY >= padding && mouseY <= canvas.height - padding) {
        
        const barGroupWidth = chartWidth / this.weeklyPartsData.length;
        
        for (let i = 0; i < this.weeklyPartsData.length; i++) {
          const x = padding + (i * barGroupWidth) + (barGroupWidth * 0.1);
          const barWidth = barGroupWidth * 0.35;
          
          if (mouseX >= x && mouseX <= x + (barWidth * 2) + 5) {
            canvas.style.cursor = 'pointer';
            break;
          }
        }
      }
    };
    
    canvas.addEventListener('mousemove', hoverHandler);
    this.chartClickListeners.set('weeklyBarChartHover', hoverHandler);
  }

  private renderWeeklyLineChart(): void {
    if (!this.weeklyLineChartCanvas?.nativeElement || this.weeklyPartsData.length === 0) return;
    
    const canvas = this.weeklyLineChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const padding = 60;
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - (padding * 2);
    const stepX = chartWidth / (this.weeklyPartsData.length - 1);
    const maxValue = Math.max(...this.weeklyPartsData.map(d => Math.max(d.unUsed, d.faulty)));
    
    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight * i / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
      
      // Y-axis labels
      ctx.fillStyle = '#6c757d';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      const value = Math.round(maxValue * (5 - i) / 5);
      ctx.fillText(value.toString(), padding - 10, y + 4);
    }
    
    // Draw unused parts line
    ctx.strokeStyle = '#3699ff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    this.weeklyPartsData.forEach((item, index) => {
      const x = padding + (index * stepX);
      const y = padding + chartHeight - ((item.unUsed / maxValue) * chartHeight);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Draw faulty parts line
    ctx.strokeStyle = '#f64e60';
    ctx.lineWidth = 3;
    ctx.beginPath();
    this.weeklyPartsData.forEach((item, index) => {
      const x = padding + (index * stepX);
      const y = padding + chartHeight - ((item.faulty / maxValue) * chartHeight);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    
    // Draw data points
    this.weeklyPartsData.forEach((item, index) => {
      const x = padding + (index * stepX);
      
      // Unused parts points
      const unusedY = padding + chartHeight - ((item.unUsed / maxValue) * chartHeight);
      ctx.fillStyle = '#3699ff';
      ctx.beginPath();
      ctx.arc(x, unusedY, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // Faulty parts points
      const faultyY = padding + chartHeight - ((item.faulty / maxValue) * chartHeight);
      ctx.fillStyle = '#f64e60';
      ctx.beginPath();
      ctx.arc(x, faultyY, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // X-axis labels
      ctx.fillStyle = '#6c757d';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(item.wkEnd, x, canvas.height - padding + 15);
    });
    
    // Draw legend
    ctx.fillStyle = '#3699ff';
    ctx.fillRect(padding + 10, 20, 15, 12);
    ctx.fillStyle = '#6c757d';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Unused Parts', padding + 30, 31);
    
    ctx.fillStyle = '#f64e60';
    ctx.fillRect(padding + 130, 20, 15, 12);
    ctx.fillStyle = '#6c757d';
    ctx.fillText('Faulty Parts', padding + 150, 31);
    
    // Draw axes
    ctx.strokeStyle = '#6c757d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
  }

  // Weekly chart helper methods
  getTotalWeeklyUnused(): number {
    return this.weeklyPartsData.reduce((total, item) => total + item.unUsed, 0);
  }

  getTotalWeeklyFaulty(): number {
    return this.weeklyPartsData.reduce((total, item) => total + item.faulty, 0);
  }

  getTotalWeeklyParts(): number {
    return this.getTotalWeeklyUnused() + this.getTotalWeeklyFaulty();
  }

  getWeeklyItemPercentage(item: WeeklyPartsReturnedCountDto): number {
    const totalParts = this.getTotalWeeklyParts();
    const itemTotal = item.unUsed + item.faulty;
    return totalParts > 0 ? Math.round((itemTotal / totalParts) * 100) : 0;
  }

  getPaginationPages(): (number | null)[] {
    const pages: (number | null)[] = [];
    const totalPages = this.totalPages;
    const currentPage = this.currentPage;
    
    if (totalPages <= 7) {
      // Show all pages if total is 7 or less
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 4) {
        pages.push(null); // Ellipsis
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        if (i !== 1 && i !== totalPages) {
          pages.push(i);
        }
      }
      
      if (currentPage < totalPages - 3) {
        pages.push(null); // Ellipsis
      }
      
      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }
    
    return pages;
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'returned':
        return 'status-returned';
      case 'not-returned':
        return 'status-not-returned';
      case 'in-progress':
        return 'status-in-progress';
      case 'pending':
        return 'status-pending';
      default:
        return 'badge-light-secondary';
    }
  }

  getStatusDisplayName(status: string): string {
    switch (status) {
      case 'returned':
        return 'Returned';
      case 'not-returned':
        return 'Not Returned';
      case 'in-progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      default:
        return status || 'Unknown';
    }
  }

  getSelectedInventoryUserText(): string {
    const selectedValue = this.partReturnFilterForm.get('inventoryUser')?.value;
    const selectedUser = this.inventoryUsers.find(user => this.getInventoryUserValue(user) === selectedValue);
    return selectedUser ? this.getInventoryUserDisplayName(selectedUser) : 'Not Found';
  }

  onInventoryUserChange(event: any): void {
    // Optional: Add any specific handling for inventory user change
  }

  trackByUserId(index: number, user: InventoryUser): string {
    return user.invUserID || user.username || index.toString();
  }

  // Helper methods for weekly return data
  getTotalUnusedByWeek(): number {
    return this.partsReturnDataByWeekNo.reduce((total, item) => total + item.unusedSentBack, 0);
  }

  getTotalFaultyByWeek(): number {
    return this.partsReturnDataByWeekNo.reduce((total, item) => total + item.faultySentBack, 0);
  }

  getTotalReturnsByWeek(): number {
    return this.getTotalUnusedByWeek() + this.getTotalFaultyByWeek();
  }

  getTotalTruckStockByWeek(): number {
    return this.partsReturnDataByWeekNo.reduce((total, item) => total + item.truckStock, 0);
  }

  getReturnStatusBadgeClass(status: string): string {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'completed':
        return 'badge bg-success';
      case 'pending':
        return 'badge bg-warning';
      case 'in progress':
        return 'badge bg-primary';
      case 'cancelled':
      case 'rejected':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  exportWeeklyDataToExcel(): void {
    if (this.partsReturnDataByWeekNo.length === 0) {
      return;
    }

    const csvData = this.convertWeeklyDataToCSV(this.partsReturnDataByWeekNo);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Parts_Return_Data_Week_${this.selectedWeekNo}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private convertWeeklyDataToCSV(data: PartsReturnDataByWeekNoItem[]): string {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = [
      'Service Call ID',
      'Unused Sent Back',
      'Faulty Sent Back',
      'Return Status',
      'Return Notes',
      'Truck Stock',
      'Technician Name',
      'Maintenance Auth ID',
      'Last Modified'
    ];

    const csvRows = data.map(item => [
      item.serviceCallId || '',
      item.unusedSentBack?.toString() || '0',
      item.faultySentBack?.toString() || '0',
      item.returnStatus || '',
      item.returnNotes || '',
      item.truckStock?.toString() || '0',
      item.techName || '',
      item.maintAuthId || '',
      item.lastModified ? new Date(item.lastModified).toLocaleDateString() : ''
    ]);

    const allRows = [headers, ...csvRows];
    
    return allRows.map(row => 
      row.map(field => {
        if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      }).join(',')
    ).join('\n');
  }

  trackByWeeklyServiceCallId(index: number, item: PartsReturnDataByWeekNoItem): string {
    return item.serviceCallId;
  }

  // Chart Navigation Methods (mimicking legacy behavior)
  handleChartNavigation(params: any): void {
    const source = params.get('Source');
    const invUserID = params.get('InvUserID');
    const weekNo = params.get('WeekNo');
    
    // Ensure charts remain loaded during navigation
    const preserveCharts = () => {
      setTimeout(() => {
        if (this.chartData.length > 0) {
          this.renderCharts();
        }
        if (this.weeklyPartsData.length > 0) {
          this.renderWeeklyCharts();
        }
        if (this.receivedChartData.length > 0) {
          this.renderReceivedCharts();
        }
      }, 100);
    };
    
    switch (source) {
      case 'Graph':
        // Parts to be Received chart was clicked
        if (invUserID) {
          this.partReturnFilterForm.patchValue({ inventoryUser: invUserID });
          this.activeGraphTab = 'graph1';
          preserveCharts();
        }
        break;
        
      case 'Received':
        // Parts Received chart was clicked
        if (invUserID) {
          this.partReturnFilterForm.patchValue({ 
            inventoryUser: invUserID,
            status: '3' // Set to "Received" status
          });
          this.activeGraphTab = 'graph3';
          preserveCharts();
        }
        break;
        
      case 'Return':
        // Weekly Parts Returned chart was clicked
        if (weekNo) {
          const weekNumber = parseInt(weekNo);
          if (weekNumber >= 1 && weekNumber <= 53) {
            this.partReturnFilterForm.patchValue({ weekNo: weekNumber });
            this.selectedWeekNo = weekNumber;
            this.activeGraphTab = 'graph2';
            this.loadPartsReturnDataByWeekNo();
            preserveCharts();
          }
        }
        break;
    }
  }

  // Chart click handlers for different chart types
  onChartItemClick(item: any, chartType: 'parts-to-receive' | 'parts-received' | 'weekly-returned'): void {
    // Prevent navigation that would clear charts, handle drill-down locally
    console.log('Chart item clicked:', item, 'Type:', chartType);
    
    switch (chartType) {
      case 'parts-to-receive':
        // Handle parts to be received chart click
        this.handlePartsToReceiveClick(item);
        break;
        
      case 'parts-received':
        // Handle parts received chart click
        this.handlePartsReceivedClick(item);
        break;
        
      case 'weekly-returned':
        // Handle weekly returned chart click
        this.handleWeeklyReturnedClick(item);
        break;
    }
  }

  private handlePartsToReceiveClick(item: any): void {
    // Filter data by inventory user without navigation
    if (item.name) {
      const mappedUser = this.mapChartNameToInventoryUser(item.name);
      console.log('Parts to receive click - Chart name:', item.name, 'Mapped to user:', mappedUser);
      
      this.partReturnFilterForm.patchValue({ 
        inventoryUser: mappedUser
      }, { emitEvent: false });
      
      // Keep charts visible by not navigating away
      setTimeout(() => {
        this.getPartReturnStatusReport();
      }, 100);
    }
  }

  // Helper method for row hover effects
  onRowHover(index: number, isHovering: boolean): void {
    // Can be used for additional hover effects if needed
    // Currently handled via CSS :hover
  }
  
  // Interactive pie chart animation methods
  private animateSliceHover(): void {
    if (this.hoverAnimationId) {
      cancelAnimationFrame(this.hoverAnimationId);
    }
    
    // Initialize hover scales if not present
    while (this.sliceHoverScale.length < this.chartData.length) {
      this.sliceHoverScale.push(1);
    }
    
    const animateHover = () => {
      let hasChanges = false;
      
      this.chartData.forEach((_, index) => {
        const targetScale = index === this.hoveredSliceIndex ? 1.1 : 1;
        const currentScale = this.sliceHoverScale[index];
        const diff = targetScale - currentScale;
        
        if (Math.abs(diff) > 0.01) {
          this.sliceHoverScale[index] += diff * 0.15;
          hasChanges = true;
        } else {
          this.sliceHoverScale[index] = targetScale;
        }
      });
      
      if (hasChanges) {
        this.renderPieChart();
        this.hoverAnimationId = requestAnimationFrame(animateHover);
      } else {
        this.hoverAnimationId = null;
      }
    };
    
    animateHover();
  }
  
  private animateSliceClick(sliceIndex: number): void {
    this.clickedSliceIndex = sliceIndex;
    this.clickAnimationProgress = 0;
    
    const animateClick = () => {
      this.clickAnimationProgress += 0.1;
      
      if (this.clickAnimationProgress >= 1) {
        this.clickAnimationProgress = 1;
        setTimeout(() => {
          this.clickedSliceIndex = -1;
          this.renderPieChart();
        }, 200);
      }
      
      this.renderPieChart();
      
      if (this.clickAnimationProgress < 1) {
        requestAnimationFrame(animateClick);
      }
    };
    
    animateClick();
  }
  
  // Color manipulation utilities
  private brightenColor(color: string, percent: number): string {
    // Convert hex to RGB and brighten
    const hex = color.replace('#', '');
    const r = Math.min(255, parseInt(hex.substr(0, 2), 16) + percent);
    const g = Math.min(255, parseInt(hex.substr(2, 2), 16) + percent);
    const b = Math.min(255, parseInt(hex.substr(4, 2), 16) + percent);
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  // Tooltip helper methods
  public getSliceColor(index: number): string {
    const colors = [
      '#4F46E5', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', 
      '#06B6D4', '#EC4899', '#84CC16'
    ];
    return colors[index % colors.length];
  }
  
  private updateTooltipPosition(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    this.tooltipPosition.x = event.clientX - rect.left + 15;
    this.tooltipPosition.y = event.clientY - rect.top - 10;
  }

  // Draw modern pie slices with animation and data labels
  private drawModernPieSlices(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, progress: number): void {
    console.log('drawModernPieSlices called with progress:', progress);
    console.log('Chart data:', this.chartData);
    
    // Position pie chart to the right, accounting for left-side legend
    const legendWidth = 220;
    const availableWidth = canvas.width - legendWidth;
    const centerX = legendWidth + (availableWidth / 2);
    const centerY = canvas.height / 2;
    const outerRadius = Math.min(availableWidth / 2, centerY) - 40;
    const innerRadius = outerRadius * 0.4;
    
    console.log('Pie chart positioning:', {
      legendWidth,
      availableWidth,
      centerX,
      centerY,
      outerRadius,
      innerRadius
    });
    
    const total = this.chartData.reduce((sum, item) => sum + item.jobsCount, 0);
    console.log('Total jobs count:', total);
    
    // Check for valid dimensions
    if (outerRadius <= 0 || innerRadius <= 0) {
      console.error('Invalid pie chart dimensions - radius too small');
      return;
    }
    
    let currentAngle = -Math.PI / 2;

    const modernColors = [
      { main: '#4F46E5', light: '#6366F1', shadow: '#3730A3' },
      { main: '#EF4444', light: '#F87171', shadow: '#DC2626' },
      { main: '#10B981', light: '#34D399', shadow: '#059669' },
      { main: '#F59E0B', light: '#FBBF24', shadow: '#D97706' },
      { main: '#8B5CF6', light: '#A78BFA', shadow: '#7C3AED' },
      { main: '#06B6D4', light: '#22D3EE', shadow: '#0891B2' },
      { main: '#EC4899', light: '#F472B6', shadow: '#DB2777' },
      { main: '#84CC16', light: '#A3E635', shadow: '#65A30D' }
    ];

    console.log('Drawing background gradient');
    // Draw background
    const bgGradient = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius + 20);
    bgGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
    bgGradient.addColorStop(0.7, 'rgba(248, 250, 252, 0.8)');
    bgGradient.addColorStop(1, 'rgba(241, 245, 249, 0.9)');
    ctx.fillStyle = bgGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius + 15, 0, 2 * Math.PI);
    ctx.fill();

    // Draw slices with interactive effects
    this.chartData.forEach((item, index) => {
      const sliceAngle = ((item.jobsCount / total) * 2 * Math.PI) * progress;
      const colors = modernColors[index % modernColors.length];
      
      // Calculate interactive transformations
      const isHovered = this.hoveredSliceIndex === index;
      const isClicked = this.clickedSliceIndex === index;
      const hoverScale = this.sliceHoverScale[index] || 1;
      
      // Apply hover/click effects
      const effectiveOuterRadius = outerRadius * hoverScale;
      const effectiveInnerRadius = innerRadius * hoverScale;
      
      // Offset for hover effect (slice separation)
      let offsetX = 0, offsetY = 0;
      if (isHovered || isClicked) {
        const midAngle = currentAngle + sliceAngle / 2;
        const offsetDistance = isClicked ? 15 : 8;
        offsetX = Math.cos(midAngle) * offsetDistance;
        offsetY = Math.sin(midAngle) * offsetDistance;
      }
      
      const effectiveCenterX = centerX + offsetX;
      const effectiveCenterY = centerY + offsetY;
      
      // Enhanced gradient with hover effects
      const sliceGradient = ctx.createRadialGradient(
        effectiveCenterX, effectiveCenterY, effectiveInnerRadius,
        effectiveCenterX, effectiveCenterY, effectiveOuterRadius
      );
      
      if (isHovered) {
        sliceGradient.addColorStop(0, this.brightenColor(colors.light, 20));
        sliceGradient.addColorStop(0.6, this.brightenColor(colors.main, 15));
        sliceGradient.addColorStop(1, colors.shadow);
      } else if (isClicked) {
        sliceGradient.addColorStop(0, this.brightenColor(colors.light, 30));
        sliceGradient.addColorStop(0.6, this.brightenColor(colors.main, 25));
        sliceGradient.addColorStop(1, this.brightenColor(colors.shadow, 10));
      } else {
        sliceGradient.addColorStop(0, colors.light);
        sliceGradient.addColorStop(0.6, colors.main);
        sliceGradient.addColorStop(1, colors.shadow);
      }
      
      // Add glow effect for hovered/clicked slices
      if (isHovered || isClicked) {
        ctx.shadowColor = colors.main;
        ctx.shadowBlur = isClicked ? 20 : 15;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      ctx.fillStyle = sliceGradient;
      ctx.beginPath();
      ctx.moveTo(effectiveCenterX, effectiveCenterY);
      ctx.arc(effectiveCenterX, effectiveCenterY, effectiveOuterRadius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      
      // Reset shadow
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      
      // Enhanced stroke with interaction feedback
      ctx.strokeStyle = isHovered ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = isHovered ? 4 : 3;
      ctx.stroke();
      
      // Add labels when animation is complete or nearly complete
      if (progress > 0.8) {
        const percentage = Math.round((item.jobsCount / total) * 100);
        if (percentage >= 3) {
          const labelAngle = currentAngle + ((item.jobsCount / total) * 2 * Math.PI) / 2;
          const labelRadius = innerRadius + (outerRadius - innerRadius) * 0.65;
          const labelX = centerX + Math.cos(labelAngle) * labelRadius;
          const labelY = centerY + Math.sin(labelAngle) * labelRadius;
          
          ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
          ctx.shadowBlur = 3;
          
          const displayName = item.name.length > 10 ? item.name.substring(0, 8) + '..' : item.name;
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px Inter, Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(displayName, labelX, labelY - 6);
          
          ctx.font = 'bold 11px Inter, Arial, sans-serif';
          ctx.fillText(`${item.jobsCount}`, labelX, labelY + 4);
          
          ctx.font = '8px Inter, Arial, sans-serif';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.fillText(`(${percentage}%)`, labelX, labelY + 14);
          
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
        }
      }
      
      currentAngle += (item.jobsCount / total) * 2 * Math.PI;
    });
    
    // Draw center circle
    const innerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, innerRadius);
    innerGradient.addColorStop(0, '#ffffff');
    innerGradient.addColorStop(0.6, '#fafbfc');
    innerGradient.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Center text
    ctx.fillStyle = '#64748b';
    ctx.font = '600 14px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Total Jobs', centerX, centerY - 8);
    
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 24px Inter, Arial, sans-serif';
    ctx.fillText(total.toString(), centerX, centerY + 16);
    
    // Draw legend when animation is complete
    if (progress >= 1) {
      this.drawModernLegend(ctx, canvas, modernColors);
    }
  }

  // Draw elegant modern legend positioned on the left side
  private drawModernLegend(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, colors: any[]): void {
    const legendX = 25;
    const legendY = 40; // Start from top
    const itemHeight = 40; // Increased spacing
    const total = this.chartData.reduce((sum, item) => sum + item.jobsCount, 0);
    
    // Calculate legend dimensions
    const legendWidth = 240;
    const legendHeight = (this.chartData.length * itemHeight) + 80;
    
    // Draw elegant legend background with gradient
    const bgGradient = ctx.createLinearGradient(legendX - 15, legendY - 35, legendX - 15, legendY - 35 + legendHeight);
    bgGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    bgGradient.addColorStop(1, 'rgba(248, 250, 252, 0.98)');
    
    ctx.fillStyle = bgGradient;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.12)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 8;
    
    // Rounded rectangle for legend background
    this.drawRoundedRect(ctx, legendX - 15, legendY - 35, legendWidth, legendHeight, 16);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    
    // Draw subtle border
    ctx.strokeStyle = 'rgba(203, 213, 225, 0.4)';
    ctx.lineWidth = 1;
    this.strokeRoundedRect(ctx, legendX - 15, legendY - 35, legendWidth, legendHeight, 12);
    
    // Draw elegant legend title
    ctx.font = '600 18px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#111827';
    ctx.textAlign = 'left';
    ctx.fillText('Job Distribution', legendX, legendY - 10);
    
    // Draw refined summary
    ctx.font = '500 13px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`${total} jobs across ${this.chartData.length} technicians`, legendX, legendY + 12);
    
    // Draw elegant legend items
    this.chartData.forEach((item, index) => {
      const y = legendY + 35 + (index * itemHeight);
      const color = colors[index % colors.length];
      const percentage = Math.round((item.jobsCount / total) * 100);
      
      // Draw sophisticated color indicator
      const circleGradient = ctx.createRadialGradient(legendX + 12, y + 12, 2, legendX + 12, y + 12, 12);
      circleGradient.addColorStop(0, color.light);
      circleGradient.addColorStop(0.7, color.main);
      circleGradient.addColorStop(1, color.shadow);
      
      ctx.fillStyle = circleGradient;
      ctx.beginPath();
      ctx.arc(legendX + 12, y + 12, 12, 0, 2 * Math.PI);
      ctx.fill();
      
      // Add subtle border
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw user name with better typography
      ctx.fillStyle = '#111827';
      ctx.font = '600 14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      const maxNameLength = 16;
      const displayName = item.name.length > maxNameLength ? 
        item.name.substring(0, maxNameLength - 2) + '...' : item.name;
      ctx.fillText(displayName, legendX + 35, y + 10);
      
      // Draw job count with emphasis
      ctx.fillStyle = color.main;
      ctx.font = 'bold 16px Inter, system-ui, sans-serif';
      ctx.fillText(item.jobsCount.toString(), legendX + 35, y + 28);
      
      // Draw "jobs" label
      ctx.fillStyle = '#6b7280';
      ctx.font = '500 12px Inter, system-ui, sans-serif';
      const jobsTextX = legendX + 35 + ctx.measureText(item.jobsCount.toString()).width + 6;
      ctx.fillText('jobs', jobsTextX, y + 28);
      
      // Draw percentage on the right
      ctx.fillStyle = '#374151';
      ctx.font = '600 13px Inter, system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(`${percentage}%`, legendX + legendWidth - 35, y + 19);
      
      ctx.textAlign = 'left'; // Reset alignment
    });
  }
  
  // Helper method to draw rounded rectangles
  private drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
  }
  
  // Helper method to stroke rounded rectangles
  private strokeRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.stroke();
  }

  private handlePartsReceivedClick(item: any): void {
    // Filter by inventory user and set to received status
    if (item.name) {
      const mappedUser = this.mapChartNameToInventoryUser(item.name);
      console.log('Parts received click - Chart name:', item.name, 'Mapped to user:', mappedUser);
      
      this.partReturnFilterForm.patchValue({ 
        inventoryUser: mappedUser,
        status: '3' // Received status
      }, { emitEvent: false });
      
      // Switch to received chart tab
      this.activeGraphTab = 'graph3';
      
      setTimeout(() => {
        this.getPartReturnStatusReport();
      }, 100);
    }
  }

  private handleWeeklyReturnedClick(item: any): void {
    // Filter by week number and load weekly data
    if (item.weekNo) {
      this.partReturnFilterForm.patchValue({ 
        weekNo: item.weekNo
      });
      this.selectedWeekNo = item.weekNo;
      // Switch to weekly chart tab
      this.activeGraphTab = 'graph2';
      this.loadPartsReturnDataByWeekNo();
    }
  }

  // Map chart item names to inventory user values
  private mapChartNameToInventoryUser(chartName: string): string {
    if (!chartName) return 'All';
    
    console.log('Mapping chart name:', chartName);
    console.log('Available inventory users:', this.inventoryUsers.map(u => ({ id: u.invUserID, name: u.username })));
    
    // First try to find exact match by username
    let matchingUser = this.inventoryUsers.find(user => {
      const userName = user.username?.toLowerCase().trim();
      const chartNameLower = chartName.toLowerCase().trim();
      console.log('Comparing:', userName, 'with', chartNameLower);
      return userName === chartNameLower;
    });
    
    // If no exact match, try partial match
    if (!matchingUser) {
      matchingUser = this.inventoryUsers.find(user => {
        const userName = user.username?.toLowerCase().trim() || '';
        const chartNameLower = chartName.toLowerCase().trim();
        return userName.includes(chartNameLower) || chartNameLower.includes(userName);
      });
    }
    
    // If still no match, try by invUserID
    if (!matchingUser) {
      matchingUser = this.inventoryUsers.find(user => {
        const userIdLower = user.invUserID?.toLowerCase().trim();
        const chartNameLower = chartName.toLowerCase().trim();
        return userIdLower === chartNameLower;
      });
    }
    
    console.log('Chart name:', chartName, 'Matched user:', matchingUser);
    
    return matchingUser ? this.getInventoryUserValue(matchingUser) : chartName;
  }

  // Parts Received by Warehouse Chart methods
  loadPartsReceivedByWarehouseChart(): void {
    this.isLoadingReceivedChart = true;
    this.receivedChartErrorMessage = '';
    const currentYear = this.partReturnFilterForm.get('year')?.value || new Date().getFullYear();

    this._reportService.getPartsReceivedByWHChart(currentYear).subscribe({
      next: (response: PartsReceivedByWHApiResponseDto) => {
        this.isLoadingReceivedChart = false;
        
        if (response.success && response.data) {
          this.receivedChartData = response.data.chartData || [];
          
          // Calculate totals from the chart data
          const totalJobs = this.receivedChartData.reduce((sum, item) => sum + (item.jobsCount || 0), 0);
          const totalFaulty = this.receivedChartData.reduce((sum, item) => sum + (item.faulty || 0), 0);
          
          this.receivedChartTotals = {
            unUsedR: 0,
            faultyR: 0,
            unUsedReceived: totalJobs,
            faultyReceived: totalFaulty
          };
          
          this.showReceivedChart = this.receivedChartData.length > 0;
          
          // Render charts after data is loaded
          setTimeout(() => this.renderReceivedCharts(), 100);
        } else {
          this.receivedChartErrorMessage = response.message || 'No received chart data available';
          this.receivedChartData = [];
          this.receivedChartTotals = { unUsedR: 0, faultyR: 0, unUsedReceived: 0, faultyReceived: 0 };
          this.showReceivedChart = false;
        }
      },
      error: (error) => {
        this.isLoadingReceivedChart = false;
        this.receivedChartErrorMessage = `Error loading received chart data: ${error.message}`;
        this.loadMockReceivedChartData();
      }
    });
  }

  private loadMockReceivedChartData(): void {
    // Mock received chart data for development/testing
    this.receivedChartData = [
      { name: 'January', jobsCount: 35, faulty: 8, unusedReceived: 25, faultyReceived: 6 },
      { name: 'February', jobsCount: 28, faulty: 6, unusedReceived: 20, faultyReceived: 4 },
      { name: 'March', jobsCount: 42, faulty: 12, unusedReceived: 32, faultyReceived: 8 },
      { name: 'April', jobsCount: 31, faulty: 7, unusedReceived: 24, faultyReceived: 5 },
      { name: 'May', jobsCount: 38, faulty: 9, unusedReceived: 28, faultyReceived: 7 },
      { name: 'June', jobsCount: 45, faulty: 11, unusedReceived: 35, faultyReceived: 9 }
    ];
    this.receivedChartTotals = { unUsedR: 0, faultyR: 0, unUsedReceived: 164, faultyReceived: 39 };
    this.showReceivedChart = true;
    this.isLoadingReceivedChart = false;
    
    // Render charts after data is loaded
    setTimeout(() => this.renderReceivedCharts(), 100);
  }

  setReceivedChartType(type: 'bar' | 'pie' | 'table'): void {
    this.currentReceivedChartType = type;
    if (type !== 'table') {
      setTimeout(() => this.renderReceivedCharts(), 100);
    }
  }

  renderReceivedCharts(): void {
    if (this.currentReceivedChartType === 'bar') {
      this.renderReceivedBarChart();
    } else if (this.currentReceivedChartType === 'pie') {
      this.renderReceivedPieChart();
    }
  }

  private renderReceivedBarChart(): void {
    if (!this.receivedBarChartCanvas?.nativeElement || this.receivedChartData.length === 0) return;
    
    const canvas = this.receivedBarChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Remove existing click listener if any
    const existingListener = this.chartClickListeners.get('receivedBarChart');
    if (existingListener) {
      canvas.removeEventListener('click', existingListener);
      this.chartClickListeners.delete('receivedBarChart');
    }
    
    const padding = 60;
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - (padding * 2);
    const barWidth = chartWidth / (this.receivedChartData.length * 2);
    const maxValue = Math.max(...this.receivedChartData.map(d => Math.max(d.jobsCount || 0, d.faulty || 0)));
    
    // Draw background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid lines
    ctx.strokeStyle = '#e9ecef';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (chartHeight * i / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(canvas.width - padding, y);
      ctx.stroke();
      
      // Y-axis labels
      ctx.fillStyle = '#6c757d';
      ctx.font = '12px Arial';
      ctx.textAlign = 'right';
      const value = Math.round(maxValue * (5 - i) / 5);
      ctx.fillText(value.toString(), padding - 10, y + 4);
    }
    
    // Draw bars
    this.receivedChartData.forEach((item, index) => {
      const x = padding + (index * 2 * barWidth) + (barWidth * 0.1);
      
      // Jobs count bar (green)
      const jobsHeight = ((item.jobsCount || 0) / maxValue) * chartHeight;
      const jobsY = padding + chartHeight - jobsHeight;
      ctx.fillStyle = '#1bc5bd';
      ctx.fillRect(x, jobsY, barWidth * 0.8, jobsHeight);
      
      // Faulty parts bar (orange)
      const faultyHeight = ((item.faulty || 0) / maxValue) * chartHeight;
      const faultyY = padding + chartHeight - faultyHeight;
      ctx.fillStyle = '#ffa800';
      ctx.fillRect(x + barWidth, faultyY, barWidth * 0.8, faultyHeight);
      
      // X-axis labels
      ctx.fillStyle = '#6c757d';
      ctx.font = '11px Arial';
      ctx.textAlign = 'center';
      const labelX = x + barWidth;
      ctx.fillText(item.name, labelX, canvas.height - padding + 20);
      
      // Value labels on bars - always display outside bars in black
      ctx.fillStyle = '#000000';
      ctx.font = 'bold 11px Arial';
      ctx.textAlign = 'center';
      
      // Jobs count label - always above bar
      if ((item.jobsCount || 0) > 0) {
        ctx.fillText((item.jobsCount || 0).toString(), x + (barWidth * 0.4), jobsY - 8);
      }
      
      // Faulty parts label - always above bar
      if ((item.faulty || 0) > 0) {
        ctx.fillText((item.faulty || 0).toString(), x + barWidth + (barWidth * 0.4), faultyY - 8);
      }
    });
    
    // Draw axes
    ctx.strokeStyle = '#6c757d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();
    
    // Add click event listener for received bar chart
    const clickHandler = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      
      // Check if click is within chart area
      if (clickX >= padding && clickX <= canvas.width - padding && 
          clickY >= padding && clickY <= canvas.height - padding) {
        
        // Determine which bar was clicked
        const barWidth = chartWidth / (this.receivedChartData.length * 2);
        
        for (let i = 0; i < this.receivedChartData.length; i++) {
          const x = padding + (i * 2 * barWidth) + (barWidth * 0.1);
          
          // Check if click is within either bar for this data item
          if (clickX >= x && clickX <= x + (barWidth * 1.8)) {
            this.onChartItemClick(this.receivedChartData[i], 'parts-received');
            break;
          }
        }
      }
    };
    
    canvas.addEventListener('click', clickHandler);
    this.chartClickListeners.set('receivedBarChart', clickHandler);
    
    // Add hover effect
    const hoverHandler = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      canvas.style.cursor = 'default';
      
      if (mouseX >= padding && mouseX <= canvas.width - padding && 
          mouseY >= padding && mouseY <= canvas.height - padding) {
        
        const barWidth = chartWidth / (this.receivedChartData.length * 2);
        
        for (let i = 0; i < this.receivedChartData.length; i++) {
          const x = padding + (i * 2 * barWidth) + (barWidth * 0.1);
          
          if (mouseX >= x && mouseX <= x + (barWidth * 1.8)) {
            canvas.style.cursor = 'pointer';
            break;
          }
        }
      }
    };
    
    canvas.addEventListener('mousemove', hoverHandler);
    this.chartClickListeners.set('receivedBarChartHover', hoverHandler);
  }

  private renderReceivedPieChart(): void {
    if (!this.receivedPieChartCanvas?.nativeElement || this.receivedChartData.length === 0) return;
    
    const canvas = this.receivedPieChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Remove existing click listener if any
    const existingListener = this.chartClickListeners.get('receivedPieChart');
    if (existingListener) {
      canvas.removeEventListener('click', existingListener);
      this.chartClickListeners.delete('receivedPieChart');
    }
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;
    
    const total = this.receivedChartData.reduce((sum, item) => sum + (item.jobsCount || 0) + (item.faulty || 0), 0);
    let currentAngle = -Math.PI / 2; // Start from top
    
    // Draw background circle
    ctx.fillStyle = '#f8f9fa';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw pie slices
    this.receivedChartData.forEach((item, index) => {
      const itemTotal = (item.jobsCount || 0) + (item.faulty || 0);
      const sliceAngle = (itemTotal / total) * 2 * Math.PI;
      
      // Draw slice
      ctx.fillStyle = this.getChartColor(index);
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      
      // Draw slice border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw enhanced labels with names and values
      const percentage = Math.round((itemTotal / total) * 100);
      if (percentage > 3 && sliceAngle > 0.2) { // Show label if slice is large enough
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius * 0.75);
        const labelY = centerY + Math.sin(labelAngle) * (radius * 0.75);
        
        // Draw white background circle for better readability
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.beginPath();
        ctx.arc(labelX, labelY, 22, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw month name (abbreviated)
        const displayName = item.name.length > 8 ? item.name.substring(0, 6) + '..' : item.name;
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 9px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(displayName, labelX, labelY - 5);
        
        // Draw total value and percentage
        ctx.font = 'bold 10px Arial';
        ctx.fillText(`${itemTotal}`, labelX, labelY + 5);
        ctx.font = '8px Arial';
        ctx.fillText(`(${percentage}%)`, labelX, labelY + 15);
      }
      
      currentAngle += sliceAngle;
    });
    
    // Draw center circle
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.4, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw total in center
    ctx.fillStyle = '#6c757d';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Total Received', centerX, centerY - 5);
    ctx.fillText(total.toString(), centerX, centerY + 15);
    
    // Draw legend below pie chart
    const legendY = centerY + radius + 50;
    const legendItemWidth = Math.min(100, canvas.width / Math.min(this.receivedChartData.length, 5));
    const startX = centerX - (Math.min(this.receivedChartData.length, 5) * legendItemWidth) / 2;
    
    this.receivedChartData.slice(0, 5).forEach((item, index) => {
      const x = startX + (index * legendItemWidth);
      const itemTotal = (item.jobsCount || 0) + (item.faulty || 0);
      
      // Legend color box
      ctx.fillStyle = this.getChartColor(index);
      ctx.fillRect(x, legendY - 8, 12, 12);
      
      // Legend text
      ctx.fillStyle = '#374151';
      ctx.font = '10px Arial';
      ctx.textAlign = 'left';
      const displayName = item.name.length > 8 ? item.name.substring(0, 6) + '..' : item.name;
      ctx.fillText(`${displayName}: ${itemTotal}`, x + 18, legendY + 2);
    });
    
    // Show remaining items count if more than 5
    if (this.receivedChartData.length > 5) {
      const remaining = this.receivedChartData.length - 5;
      ctx.fillStyle = '#6B7280';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`+${remaining} more`, centerX, legendY + 20);
    }
    
    // Add click event listener for received pie chart
    const clickHandler = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      
      // Calculate distance from center
      const dx = clickX - centerX;
      const dy = clickY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check if click is within the pie chart (outside inner circle)
      if (distance <= radius && distance >= radius * 0.4) {
        // Calculate angle of click
        let angle = Math.atan2(dy, dx);
        // Normalize angle to 0-2π and adjust for starting position
        angle = (angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
        
        // Find which slice was clicked
        let currentAngle = 0;
        for (let i = 0; i < this.receivedChartData.length; i++) {
          const itemTotal = (this.receivedChartData[i].jobsCount || 0) + (this.receivedChartData[i].faulty || 0);
          const sliceAngle = (itemTotal / total) * 2 * Math.PI;
          
          if (angle >= currentAngle && angle <= currentAngle + sliceAngle) {
            this.onChartItemClick(this.receivedChartData[i], 'parts-received');
            break;
          }
          
          currentAngle += sliceAngle;
        }
      }
    };
    
    canvas.addEventListener('click', clickHandler);
    this.chartClickListeners.set('receivedPieChart', clickHandler);
    
    // Add hover effect
    const hoverHandler = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      const dx = mouseX - centerX;
      const dy = mouseY - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      canvas.style.cursor = (distance <= radius && distance >= radius * 0.4) ? 'pointer' : 'default';
    };
    
    canvas.addEventListener('mousemove', hoverHandler);
    this.chartClickListeners.set('receivedPieChartHover', hoverHandler);
  }

  // Helper methods for received chart
  getTotalReceivedUnused(): number {
    return this.receivedChartData.reduce((total, item) => total + (item.jobsCount || 0), 0);
  }

  getTotalReceivedFaulty(): number {
    return this.receivedChartData.reduce((total, item) => total + (item.faulty || 0), 0);
  }

  getReceivedChartItemPercentage(item: any): number {
    const totalReceived = this.getTotalReceivedUnused() + this.getTotalReceivedFaulty();
    const itemTotal = (item.jobsCount || 0) + (item.faulty || 0);
    return totalReceived > 0 ? Math.round((itemTotal / totalReceived) * 100) : 0;
  }

  toggleReceivedChartVisibility(): void {
    this.showReceivedChart = !this.showReceivedChart;
  }

  // Graph tab management
  setActiveGraphTab(tab: 'graph1' | 'graph2' | 'graph3'): void {
    this.activeGraphTab = tab;
    // Ensure charts are properly rendered when switching tabs
    setTimeout(() => {
      switch (tab) {
        case 'graph1':
          if (this.chartData.length > 0) {
            this.showChart = true;
            this.renderCharts();
          }
          break;
        case 'graph2':
          if (this.weeklyPartsData.length > 0) {
            this.showWeeklyChart = true;
            this.renderWeeklyCharts();
          }
          break;
        case 'graph3':
          if (this.receivedChartData.length > 0) {
            this.showReceivedChart = true;
            this.renderReceivedCharts();
          }
          break;
      }
    }, 100);
  }

  // Helper methods for totals display
  getUnusedReturnedTotal(): number {
    return this.receivedChartTotals?.unUsedReceived || 0;
  }

  getFaultyReturnedTotal(): number {
    return this.receivedChartTotals?.faultyReceived || 0;
  }

  ngOnDestroy(): void {
    // Clean up animations
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.chartAnimations.clear();
    this.isAnimating = false;
    
    // Clean up all event listeners
    this.chartClickListeners.forEach((listener, key) => {
      const canvas = this.getCanvasForListener(key);
      if (canvas && listener) {
        canvas.removeEventListener('click', listener);
        canvas.removeEventListener('mousemove', listener);
      }
    });
    this.chartClickListeners.clear();
  }

  private getCanvasForListener(key: string): HTMLCanvasElement | null {
    switch (key) {
      case 'barChart':
      case 'barChartHover':
        return this.barChartCanvas?.nativeElement || null;
      case 'pieChart':
      case 'pieChartHover':
        return this.pieChartCanvas?.nativeElement || null;
      case 'weeklyBarChart':
      case 'weeklyBarChartHover':
        return this.weeklyBarChartCanvas?.nativeElement || null;
      case 'receivedBarChart':
      case 'receivedBarChartHover':
        return this.receivedBarChartCanvas?.nativeElement || null;
      case 'receivedPieChart':
      case 'receivedPieChartHover':
        return this.receivedPieChartCanvas?.nativeElement || null;
      default:
        return null;
    }
  }

  // Debug method to check chart state
  debugChartState(): void {
    console.log('Chart Debug State:', {
      activeTab: this.activeGraphTab,
      showChart: this.showChart,
      showWeeklyChart: this.showWeeklyChart,
      showReceivedChart: this.showReceivedChart,
      chartDataLength: this.chartData.length,
      weeklyDataLength: this.weeklyPartsData.length,
      receivedDataLength: this.receivedChartData.length,
      canvasElements: {
        barChart: !!this.barChartCanvas?.nativeElement,
        pieChart: !!this.pieChartCanvas?.nativeElement,
        weeklyBar: !!this.weeklyBarChartCanvas?.nativeElement,
        receivedBar: !!this.receivedBarChartCanvas?.nativeElement,
        receivedPie: !!this.receivedPieChartCanvas?.nativeElement
      }
    });
  }
}