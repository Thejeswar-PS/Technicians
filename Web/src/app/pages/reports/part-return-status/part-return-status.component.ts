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
  currentWeeklyChartType: 'bar' | 'pie' | 'table' = 'bar';
  @ViewChild('weeklyBarChartCanvas', { static: false }) weeklyBarChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('weeklyPieChartCanvas', { static: false }) weeklyPieChartCanvas!: ElementRef<HTMLCanvasElement>;

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
  
  // Component initialization flag
  private isComponentInitialized: boolean = false;
  
  // Interactive chart properties
  private hoveredBarIndex: number = -1;
  public hoveredSliceIndex: number = -1;
  private animationProgress: number = 0;
  public tooltipPosition = { x: 0, y: 0 };
  
  // Additional interactive properties for weekly and received charts
  public hoveredWeeklySliceIndex: number = -1;
  public hoveredReceivedSliceIndex: number = -1;
  public weeklyTooltipPosition = { x: 0, y: 0 };
  public receivedTooltipPosition = { x: 0, y: 0 };
  private hoveredWeeklyBarIndex: number = -1;
  private hoveredReceivedBarIndex: number = -1;
  private isWeeklyAnimating: boolean = false;
  private isReceivedAnimating: boolean = false;
  private weeklyAnimationProgress: number = 0;
  private receivedAnimationProgress: number = 0;
  private clickedWeeklySliceIndex: number = -1;
  private clickedReceivedSliceIndex: number = -1;
  private weeklySliceHoverScale: number[] = [];
  private receivedSliceHoverScale: number[] = [];
  
  // Make Math available in template
  public Math = Math;
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
  
  // Control which data grid to display (legacy behavior)
  showWeeklyDataGrid: boolean = false; // false = show main parts grid, true = show weekly parts grid
  
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
  availableWeeks: { value: string, label: string }[] = [];

  partReturnFilterForm: FormGroup = this.fb.group({
    inventoryUser: ['All'],
    status: [0],  // Not Returned by default (key 0)
    year: [new Date().getFullYear()],
    week: [''], // New week filter
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
    this.initializeWeeks();
    this.initializeWeekNumber();
    this.loadInventoryUsers();
    this.determineEmployeeStatus();
    
    // Process query parameters first, then other initialization
    this.handleQueryParams();
    this.onFilterChanges();
    this.loadFilters();
    

    this.loadPartsToBeReceivedChart();
    this.loadWeeklyPartsReturnedCount();
    this.loadPartsReceivedByWarehouseChart();
    this.loadPartsReturnDataByWeekNo();
    
    // Load initial main data (only if not in weekly mode)
    // Weekly mode data is loaded by processLegacyNavigation
    setTimeout(() => {
      if (!this.showWeeklyDataGrid) {
        this.getPartReturnStatusReport();
      }
    }, 100);
    
    // Set initialization flag after all setup is complete
    setTimeout(() => {
      this.isComponentInitialized = true;
    }, 1000);
  }

  initializeYears(): void {
    const currentYear = new Date().getFullYear();
    this.availableYears = [];
    for (let i = 0; i < 5; i++) {
      this.availableYears.push(currentYear - i);
    }
  }

  initializeWeeks(): void {
    this.availableWeeks = [];
    const currentYear = new Date().getFullYear();
    
    // Generate weeks for current year
    for (let week = 1; week <= 53; week++) {
      const startDate = this.getDateOfWeek(week, currentYear);
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      
      const label = `Week ${week} (${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
      
      this.availableWeeks.push({
        value: week.toString(),
        label: label
      });
    }
  }

  private getDateOfWeek(week: number, year: number): Date {
    const firstDayOfYear = new Date(year, 0, 1);
    const daysOffset = (week - 1) * 7;
    const dayOfWeek = firstDayOfYear.getDay();
    const daysToMonday = dayOfWeek === 0 ? 1 : (8 - dayOfWeek) % 7;
    
    const result = new Date(firstDayOfYear);
    result.setDate(firstDayOfYear.getDate() + daysToMonday + daysOffset);
    return result;
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
      
      let shouldReloadData = false;
      let tabHandled = false;
      
      // FIRST: Handle tab parameter to restore active tab (only if no legacy navigation)
      const tabParam = params.get('tab') as 'graph1' | 'graph2' | 'graph3';
      if (tabParam && ['graph1', 'graph2', 'graph3'].includes(tabParam) && !params.has('Source')) {
        this.activeGraphTab = tabParam;
        if (tabParam === 'graph2') {
          this.showWeeklyDataGrid = true;
          const currentWeek = this.getCurrentWeekNumber();
          this.selectedWeekNo = currentWeek;
          setTimeout(() => {
            this.loadPartsReturnDataByWeekNo();
            this.loadWeeklyPartsReturnedCount();
          }, 50);
        } else {
          this.showWeeklyDataGrid = false;
        }
        tabHandled = true;
      }
      
      // SECOND: Handle legacy chart navigation parameters (Source, InvUserID, WeekNo)
      if (params.has('Source')) {
        shouldReloadData = true;
        this.processLegacyNavigation(params);
        tabHandled = true; // Legacy navigation sets its own tabs
        
        // Clear legacy parameters after processing to prevent loops
        setTimeout(() => {
          const currentParams = { ...this.route.snapshot.queryParams };
          delete currentParams['Source'];
          delete currentParams['InvUserID']; 
          delete currentParams['WeekNo'];
          
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: currentParams,
            replaceUrl: true // Use replaceUrl to avoid adding to browser history
          });
        }, 100);
      } else {
        // Handle regular query parameters
        if (params.has('invUserID')) {
          const invUserID = params.get('invUserID');
          this.partReturnFilterForm.controls['inventoryUser'].setValue(invUserID || 'All');
          shouldReloadData = true;
        }
        
        if (params.has('year')) {
          const year = parseInt(params.get('year') || '');
          if (year && this.availableYears.includes(year)) {
            this.partReturnFilterForm.controls['year'].setValue(year);
            shouldReloadData = true;
          }
        }

        if (params.has('status')) {
          const status = params.get('status');
          this.partReturnFilterForm.controls['status'].setValue(status ? parseInt(status) : 0);
          shouldReloadData = true;
        }
        
        if (shouldReloadData) {
          this.getPartReturnStatusReport();
        }
      }
      
      // THIRD: Set default tab only if no tab was handled
      if (!tabHandled) {
        this.activeGraphTab = 'graph1';
        this.showWeeklyDataGrid = false;
        setTimeout(() => {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { tab: 'graph1' },
            queryParamsHandling: 'merge'
          });
        }, 100);
      }
    });
  }

  private processLegacyNavigation(params: any): void {
    const source = params.get('Source');
    const invUserID = params.get('InvUserID');
    const weekNo = params.get('WeekNo');
    
    // Mimic legacy ASP.NET behavior exactly
    switch (source) {
      case 'Graph':
        // Like WHChart click in legacy: Auto-select user and set to "Not Returned"
        if (invUserID) {
          // Fix: Map chart user name to actual dropdown value like legacy ddlInvUser.SelectedItem.Text = InvUserID
          const mappedUserValue = this.mapChartUserToDropdownValue(invUserID);
          
          this.partReturnFilterForm.patchValue({
            inventoryUser: mappedUserValue,
            status: 0 // Auto-select "Not Returned" like legacy
          });
          
          this.setActiveGraphTab('graph1', true); // Update URL to reflect correct tab
          this.showWeeklyDataGrid = false; // Show main grid
          this.getPartReturnStatusReport(); // Call DisplayPartReqStatus equivalent
        }
        break;
        
      case 'Received':
        // Like WRChart click in legacy: Auto-select user and set to "Returned"
        if (invUserID) {
          this.partReturnFilterForm.patchValue({
            inventoryUser: invUserID,
            status: 3 // Auto-select "Returned" like legacy
          });
          this.setActiveGraphTab('graph3', true); // Update URL to reflect correct tab
          this.showWeeklyDataGrid = false; // Show main grid
          this.getPartReturnStatusReport(); // Call DisplayPartReqStatus equivalent
        }
        break;
        
      case 'Return':
        // Like WkChart click in legacy: Show weekly data
        if (weekNo) {
          const weekNumber = parseInt(weekNo);
          if (weekNumber >= 1 && weekNumber <= 53) {
            // Clear weekly data before switching to weekly view
            this.partsReturnDataByWeekNo = [];
            this.partReturnFilterForm.patchValue({ 
              weekNo: weekNumber,
              week: weekNumber.toString()
            });
            this.selectedWeekNo = weekNumber;
            this.setActiveGraphTab('graph2', true); // Update URL to reflect correct tab
            this.showWeeklyDataGrid = true; // Show weekly grid (legacy behavior)
            
            // Force UI update and load weekly data
            setTimeout(() => {
              this.loadPartsReturnDataByWeekNo(); // Call DisplayPartsReturned equivalent
            }, 0);
          }
        }
        break;
    }
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
    let invUserID = (formValue.inventoryUser || 'All').toString().trim();
    const year = formValue.year || new Date().getFullYear();

    // Ensure we're sending full name to database if not 'All'
    if (invUserID !== 'All') {
      const user = this.inventoryUsers.find(u => u.username === invUserID || u.invUserID === invUserID);
      if (user && user.username) {
        invUserID = user.username; // Ensure we use full name
      }
    }

    // Call appropriate API method based on status
    let apiCall;
    let selectedApiMethod = '';
    switch (key) {
      case 0: // Not Returned
        apiCall = this._reportService.getPartsNotReceived(invUserID, year);
        selectedApiMethod = 'getPartsNotReceived';
        break;
      case 1: // In Progress
        apiCall = this._reportService.getPartsInProgress(invUserID, year);
        selectedApiMethod = 'getPartsInProgress';
        break;
      case 2: // Pending
        apiCall = this._reportService.getPartsPending(invUserID, year);
        selectedApiMethod = 'getPartsPending';
        break;
      case 3: // Returned
        apiCall = this._reportService.getPartsReturned(invUserID, year);
        selectedApiMethod = 'getPartsReturned';
        break;
      default:
        apiCall = this._reportService.getPartsNotReceived(invUserID, year);
        selectedApiMethod = 'getPartsNotReceived (default)';
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
    let previousFormValue = this.partReturnFilterForm.value;
    
    this.partReturnFilterForm.valueChanges.subscribe((selectedValue: any) => {
      // Sync week and weekNo fields
      if (previousFormValue.week !== selectedValue.week && selectedValue.week && selectedValue.week !== '') {
        const weekNumber = parseInt(selectedValue.week);
        if (weekNumber !== selectedValue.weekNo) {
          this.partReturnFilterForm.patchValue({ weekNo: weekNumber }, { emitEvent: false });
          this.selectedWeekNo = weekNumber;
          if (this.showWeeklyDataGrid) {
            this.loadPartsReturnDataByWeekNo();
          }
        }
      }
      
      // Reload data when form values actually change
      const hasValueChanged = JSON.stringify(previousFormValue) !== JSON.stringify(selectedValue);
      if (hasValueChanged && this.isComponentInitialized) {
        // Check for changes that affect main data (user, status, year)
        const mainDataChanged = previousFormValue.inventoryUser !== selectedValue.inventoryUser || 
                               previousFormValue.status !== selectedValue.status ||
                               previousFormValue.year !== selectedValue.year;
        
        // Check for changes that affect weekly data (weekNo)
        const weeklyDataChanged = previousFormValue.weekNo !== selectedValue.weekNo;
        
        // Reload appropriate data based on current view and what changed
        if (this.showWeeklyDataGrid) {
          // In weekly mode: reload weekly data if any relevant filter changed
          if (weeklyDataChanged || mainDataChanged) {
            this.loadPartsReturnDataByWeekNo();
          }
        } else {
          // In main mode: reload main data if relevant filters changed
          if (mainDataChanged) {
            this.getPartReturnStatusReport();
          }
        }
      }
      previousFormValue = { ...selectedValue };
      
      // Reload charts when year changes
      if (selectedValue.year !== previousYear) {
        previousYear = selectedValue.year;
        this.loadPartsToBeReceivedChart();
        this.loadPartsReceivedByWarehouseChart();
        this.loadWeeklyPartsReturnedCount();
      }
      
      // Reload charts when inventory user changes (if charts are user-specific)
      if (previousFormValue.inventoryUser !== selectedValue.inventoryUser && this.isComponentInitialized) {
        this.loadPartsToBeReceivedChart();
        this.loadPartsReceivedByWarehouseChart();
        this.loadWeeklyPartsReturnedCount();
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
    const currentWeek = this.getCurrentWeekNumber();
    this.partReturnFilterForm.patchValue({
      inventoryUser: 'All',
      status: 0,  // Default to Not Returned (key 0)
      year: new Date().getFullYear(),
      week: '', // Clear week selection to show "All Weeks"
      weekNo: currentWeek
    });
    
    // Reset to main grid view (legacy behavior)
    this.showWeeklyDataGrid = false;
    
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
    // Always use username field which contains full names, not invUserID (AdamK, AJohnson, etc.)
    const value = (user.username || user.invUserID || '').trim();
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
      
      window.open(targetUrl, '_blank');
    }
  }

  navigateToTechnicianJobs(serviceCallId: string, technician: string): void {
    if (serviceCallId && serviceCallId.trim() !== '') {
      const callNumber = serviceCallId.trim();
      const technicianParam = technician && technician.trim() ? `&technician=${encodeURIComponent(technician.trim())}` : '';
      const targetUrl = `${window.location.origin}${window.location.pathname}#/jobs/parts?callNumber=${callNumber}${technicianParam}`;
      
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
      } catch (error) {
        // Error rendering charts - silently handle
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
    
    const existingHoverListener = this.chartClickListeners.get('barChartHover');
    if (existingHoverListener) {
      canvas.removeEventListener('mousemove', existingHoverListener);
      this.chartClickListeners.delete('barChartHover');
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
        
        // STRICT click detection - matches drawing coordinates EXACTLY
        const barWidth = chartWidth / (this.chartData.length * 2);
        
        for (let i = 0; i < this.chartData.length; i++) {
          const x = padding + (i * 2 * barWidth) + (barWidth * 0.1);
          
          // Calculate EXACT coordinates as in drawBars method
          const maxValue = Math.max(...this.chartData.map(d => Math.max(d.jobsCount, d.faulty)));
          const jobsHeight = (this.chartData[i].jobsCount / maxValue) * chartHeight;
          const jobsY = padding + chartHeight - jobsHeight;
          const faultyHeight = (this.chartData[i].faulty / maxValue) * chartHeight;
          const faultyY = padding + chartHeight - faultyHeight;
          const barWidthScaled = barWidth * 0.8;
          
          // Blue bar (jobs) - EXACT bounds from drawBars
          const blueBarLeft = x;
          const blueBarRight = x + barWidthScaled;
          const blueBarTop = Math.max(jobsY, padding); // Never go above chart area
          const blueBarBottom = padding + chartHeight;
          
          // Red bar (faulty) - EXACT bounds from drawBars
          const redBarLeft = x + barWidth;
          const redBarRight = x + barWidth + barWidthScaled;
          const redBarTop = Math.max(faultyY, padding); // Never go above chart area  
          const redBarBottom = padding + chartHeight;
          
          // STRICT click detection with expanded hit zones for better UX
          const isInBlueBar = clickX >= (blueBarLeft - 2) && clickX <= (blueBarRight + 2) && 
                             clickY >= (blueBarTop - 5) && clickY <= (blueBarBottom + 5);
          const isInRedBar = clickX >= (redBarLeft - 2) && clickX <= (redBarRight + 2) && 
                            clickY >= (redBarTop - 5) && clickY <= (redBarBottom + 5);
          
          if (isInBlueBar || isInRedBar) {
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
          
          // Check both blue and red bars for hover - exact same coordinates as drawing
          const blueBarLeft = x;
          const blueBarRight = x + (barWidth * 0.8);
          const redBarLeft = x + barWidth;
          const redBarRight = x + barWidth + (barWidth * 0.8);
          
          const isInBlueBar = mouseX >= blueBarLeft && mouseX <= blueBarRight;
          const isInRedBar = mouseX >= redBarLeft && mouseX <= redBarRight;
          
          if (isInBlueBar || isInRedBar) {
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
      return;
    }
    
    if (this.chartData.length === 0) {
      return;
    }
    
    const canvas = this.pieChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Ensure canvas has proper dimensions
    if (canvas.width === 0 || canvas.height === 0) {
      canvas.width = canvas.offsetWidth || 800;
      canvas.height = canvas.offsetHeight || 400;
    }

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
    } catch (error) {
      // Error rendering pie chart - silently handle
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
    return Math.min(Math.max(weekNumber, 1), 53); // Ensure week number is between 1 and 53
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
      this.partsReturnDataByWeekNo = []; // Clear data for invalid week
      return;
    }

    // Clear data and start loading
    this.partsReturnDataByWeekNo = [];
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
      createDate: item.create_Date ? new Date(item.create_Date) : null,
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
        createDate: new Date('2024-11-18'),
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
        createDate: new Date('2024-11-21'),
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
        createDate: new Date('2024-11-22'),
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

  setWeeklyChartType(type: 'bar' | 'pie' | 'table'): void {
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
    } else if (this.currentWeeklyChartType === 'pie') {
      this.renderWeeklyPieChart();
    }
  }

  private renderWeeklyBarChart(): void {
    if (!this.weeklyBarChartCanvas?.nativeElement || this.weeklyPartsData.length === 0) return;
    
    const canvas = this.weeklyBarChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Remove existing listeners
    const existingListener = this.chartClickListeners.get('weeklyBarChart');
    if (existingListener) {
      canvas.removeEventListener('click', existingListener);
      this.chartClickListeners.delete('weeklyBarChart');
    }
    
    const existingHoverListener = this.chartClickListeners.get('weeklyBarChartHover');
    if (existingHoverListener) {
      canvas.removeEventListener('mousemove', existingHoverListener);
      this.chartClickListeners.delete('weeklyBarChartHover');
    }
    
    // Start animation if not already animating
    if (!this.isWeeklyAnimating) {
      this.animateWeeklyBarChart(ctx, canvas);
    } else {
      this.drawWeeklyBars(ctx, canvas, 1); // Draw without animation
    }
    
    const padding = 60;
    const chartWidth = canvas.width - (padding * 2);
    
    // Add click event listener for weekly bar chart
    const clickHandler = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      
      // Check if click is within chart area
      if (clickX >= padding && clickX <= canvas.width - padding && 
          clickY >= padding && clickY <= canvas.height - padding) {
        
        // STRICT weekly bar chart detection - matches drawWeeklyBars EXACTLY
        const barGroupWidth = chartWidth / this.weeklyPartsData.length;
        const barWidth = barGroupWidth * 0.35;
        const maxValue = Math.max(...this.weeklyPartsData.map(d => Math.max(d.unUsed, d.faulty)));
        
        for (let i = 0; i < this.weeklyPartsData.length; i++) {
          const x = padding + (i * barGroupWidth) + (barGroupWidth * 0.1);
          
          // Calculate EXACT coordinates as in drawWeeklyBars method
          const unusedHeight = (this.weeklyPartsData[i].unUsed / maxValue) * (canvas.height - (padding * 2));
          const unusedY = padding + (canvas.height - (padding * 2)) - unusedHeight;
          const faultyHeight = (this.weeklyPartsData[i].faulty / maxValue) * (canvas.height - (padding * 2));
          const faultyY = padding + (canvas.height - (padding * 2)) - faultyHeight;
          
          // Unused bar (green) - EXACT bounds from drawWeeklyBars
          const unusedBarLeft = x;
          const unusedBarRight = x + barWidth;
          const unusedBarTop = Math.max(unusedY, padding);
          const unusedBarBottom = padding + (canvas.height - (padding * 2));
          
          // Faulty bar (orange) - EXACT bounds from drawWeeklyBars
          const faultyBarLeft = x + barWidth + 5;
          const faultyBarRight = x + barWidth + 5 + barWidth;
          const faultyBarTop = Math.max(faultyY, padding);
          const faultyBarBottom = padding + (canvas.height - (padding * 2));
          
          // STRICT click detection with expanded hit zones for better UX
          const isInUnusedBar = clickX >= (unusedBarLeft - 2) && clickX <= (unusedBarRight + 2) &&
                                clickY >= (unusedBarTop - 5) && clickY <= (unusedBarBottom + 5);
          const isInFaultyBar = clickX >= (faultyBarLeft - 2) && clickX <= (faultyBarRight + 2) &&
                                clickY >= (faultyBarTop - 5) && clickY <= (faultyBarBottom + 5);
          
          if (isInUnusedBar || isInFaultyBar) {
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

  private renderWeeklyPieChart(): void {
    if (!this.weeklyPieChartCanvas?.nativeElement) {
      return;
    }
    
    if (this.weeklyPartsData.length === 0) {
      return;
    }
    
    const canvas = this.weeklyPieChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Ensure canvas has proper dimensions
    if (canvas.width === 0 || canvas.height === 0) {
      canvas.width = canvas.offsetWidth || 900;
      canvas.height = canvas.offsetHeight || 500;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Remove existing listeners
    const existingListener = this.chartClickListeners.get('weeklyPieChart');
    if (existingListener) {
      canvas.removeEventListener('click', existingListener);
      this.chartClickListeners.delete('weeklyPieChart');
    }
    
    try {
      // Render the modern pie chart directly
      this.drawModernWeeklyPieSlices(ctx, canvas, 1);
    } catch (error) {
      // Error rendering weekly pie chart - silently handle
    }
    
    // Setup interactive click detection
    const total = this.getTotalWeeklyParts();
    const legendWidth = 220;
    const availableWidth = canvas.width - legendWidth;
    const adjustedCenterX = legendWidth + (availableWidth / 2);
    const adjustedCenterY = canvas.height / 2;
    const adjustedOuterRadius = Math.min(availableWidth / 2, adjustedCenterY) - 40;
    const adjustedInnerRadius = adjustedOuterRadius * 0.4;
    
    // Add click event listener for weekly pie chart
    const clickHandler = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      
      // Calculate distance from center
      const dx = clickX - adjustedCenterX;
      const dy = clickY - adjustedCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check if click is within the pie chart
      if (distance <= adjustedOuterRadius && distance >= adjustedInnerRadius) {
        // Calculate angle of click
        let angle = Math.atan2(dy, dx);
        angle = (angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
        
        // Find which slice was clicked
        let currentAngle = 0;
        for (let i = 0; i < this.weeklyPartsData.length; i++) {
          const itemTotal = this.weeklyPartsData[i].unUsed + this.weeklyPartsData[i].faulty;
          const sliceAngle = (itemTotal / total) * 2 * Math.PI;
          
          if (angle >= currentAngle && angle <= currentAngle + sliceAngle) {
            this.animateWeeklySliceClick(i);
            setTimeout(() => {
              this.onChartItemClick(this.weeklyPartsData[i], 'weekly-returned');
            }, 300);
            break;
          }
          
          currentAngle += sliceAngle;
        }
      }
    };
    
    canvas.addEventListener('click', clickHandler);
    this.chartClickListeners.set('weeklyPieChart', clickHandler);
    
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
        
        for (let i = 0; i < this.weeklyPartsData.length; i++) {
          const itemTotal = this.weeklyPartsData[i].unUsed + this.weeklyPartsData[i].faulty;
          const sliceAngle = (itemTotal / total) * 2 * Math.PI;
          
          if (angle >= currentAngle && angle <= currentAngle + sliceAngle) {
            newHoveredIndex = i;
            break;
          }
          
          currentAngle += sliceAngle;
        }
        
        if (newHoveredIndex !== this.hoveredWeeklySliceIndex) {
          this.hoveredWeeklySliceIndex = newHoveredIndex;
          this.animateWeeklySliceHover();
        }
        
        // Update tooltip position
        this.updateWeeklyTooltipPosition(event, canvas);
      } else {
        canvas.style.cursor = 'default';
        if (this.hoveredWeeklySliceIndex !== -1) {
          this.hoveredWeeklySliceIndex = -1;
          this.animateWeeklySliceHover();
        }
      }
    };
    
    const mouseLeaveHandler = () => {
      canvas.style.cursor = 'default';
      this.hoveredWeeklySliceIndex = -1;
      this.animateWeeklySliceHover();
    };
    
    canvas.addEventListener('mousemove', mouseMoveHandler);
    canvas.addEventListener('mouseleave', mouseLeaveHandler);
    this.chartClickListeners.set('weeklyPieChartHover', mouseMoveHandler);
    this.chartClickListeners.set('weeklyPieChartLeave', mouseLeaveHandler);
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
    // Trigger data and chart reload when inventory user changes
    if (this.isComponentInitialized) {
      // Reload data based on current view
      if (this.showWeeklyDataGrid) {
        this.loadPartsReturnDataByWeekNo();
      } else {
        this.getPartReturnStatusReport();
      }
      
      // Reload charts as they may be user-specific
      this.loadPartsToBeReceivedChart();
      this.loadPartsReceivedByWarehouseChart();
      this.loadWeeklyPartsReturnedCount();
    }
  }

  onStatusChange(event: any): void {
    // Trigger data reload when status changes
    if (this.isComponentInitialized) {
      if (this.showWeeklyDataGrid) {
        this.loadPartsReturnDataByWeekNo();
      } else {
        this.getPartReturnStatusReport();
      }
    }
  }

  onWeekChange(event: any): void {
    // Trigger weekly data reload when week changes
    const weekValue = event.target.value;
    if (this.isComponentInitialized && weekValue && weekValue !== '') {
      const weekNumber = parseInt(weekValue);
      this.selectedWeekNo = weekNumber;
      if (this.showWeeklyDataGrid) {
        this.loadPartsReturnDataByWeekNo();
      }
    }
  }

  onYearChange(event: any): void {
    // Trigger data and chart reload when year changes
    if (this.isComponentInitialized) {
      // Reload main data
      if (!this.showWeeklyDataGrid) {
        this.getPartReturnStatusReport();
      }
      // Reload all charts
      this.loadPartsToBeReceivedChart();
      this.loadPartsReceivedByWarehouseChart();
      this.loadWeeklyPartsReturnedCount();
      // Reload weekly data if in weekly mode
      if (this.showWeeklyDataGrid) {
        this.loadPartsReturnDataByWeekNo();
      }
    }
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
        // Legacy: Navigate with query parameters like PartReturnStatus.aspx?Source=Graph&InvUserID=...
        if (invUserID) {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { 
              Source: 'Graph', 
              InvUserID: invUserID 
            },
            queryParamsHandling: 'merge'
          });
        }
        break;
        
      case 'Received':
        // Parts Received chart was clicked
        // Legacy: Navigate with query parameters like PartReturnStatus.aspx?Source=Received&InvUserID=...
        if (invUserID) {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { 
              Source: 'Received', 
              InvUserID: invUserID 
            },
            queryParamsHandling: 'merge'
          });
        }
        break;
        
      case 'Return':
        // Weekly Parts Returned chart was clicked
        // Legacy: Navigate with query parameters like PartReturnStatus.aspx?Source=Return&WeekNo=...
        if (weekNo) {
          const weekNumber = parseInt(weekNo);
          if (weekNumber >= 1 && weekNumber <= 53) {
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: { 
                Source: 'Return', 
                WeekNo: weekNumber 
              },
              queryParamsHandling: 'merge'
            });
          }
        }
        break;
    }
  }

  // Chart click handlers for different chart types
  onChartItemClick(item: any, chartType: 'parts-to-receive' | 'parts-received' | 'weekly-returned'): void {
    // Prevent navigation that would clear charts, handle drill-down locally
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
    // Legacy: Navigate with query parameters like WHChart behavior
    if (item.name) {
      const mappedUser = this.mapChartNameToInventoryUser(item.name);
      
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { 
          Source: 'Graph', 
          InvUserID: mappedUser 
        },
        queryParamsHandling: 'merge'
      });
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
    
    // Position pie chart to the right, accounting for left-side legend
    const legendWidth = 220;
    const availableWidth = canvas.width - legendWidth;
    const centerX = legendWidth + (availableWidth / 2);
    const centerY = canvas.height / 2;
    const outerRadius = Math.min(availableWidth / 2, centerY) - 40;
    const innerRadius = outerRadius * 0.4;
    
    const total = this.chartData.reduce((sum, item) => sum + item.jobsCount, 0);
    
    // Check for valid dimensions
    if (outerRadius <= 0 || innerRadius <= 0) {
      // Invalid pie chart dimensions - radius too small
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
      
      // Remove "jobs" label as requested
      // ctx.fillStyle = '#6b7280';
      // ctx.font = '500 12px Inter, system-ui, sans-serif';
      // const jobsTextX = legendX + 35 + ctx.measureText(item.jobsCount.toString()).width + 6;
      // ctx.fillText('jobs', jobsTextX, y + 28);
      
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
    // Legacy: Navigate with query parameters like WRChart behavior
    if (item.name) {
      const mappedUser = this.mapChartNameToInventoryUser(item.name);
      
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { 
          Source: 'Received', 
          InvUserID: mappedUser 
        },
        queryParamsHandling: 'merge'
      });
    }
  }

  private handleWeeklyReturnedClick(item: any): void {
    // Legacy: Navigate with query parameters like WkChart behavior
    if (item.weekNo) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { 
          Source: 'Return', 
          WeekNo: item.weekNo 
        },
        queryParamsHandling: 'merge'
      });
    } else {
    }
  }

  // Map chart item names to inventory user values
  private mapChartNameToInventoryUser(chartName: string): string {
    if (!chartName) return 'All';
    
    // First try to find exact match by username
    let matchingUser = this.inventoryUsers.find(user => {
      const userName = user.username?.toLowerCase().trim();
      const chartNameLower = chartName.toLowerCase().trim();
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
    
    return matchingUser ? this.getInventoryUserValue(matchingUser) : chartName;
  }
  
  // Map chart user names to proper dropdown values (DB expects full names like 'Adam Keith' not 'AdamK')
  private mapChartUserToDropdownValue(chartUserName: string): string {
    if (!chartUserName || chartUserName === 'All') return 'All';
    
    // Find user where username (display text) matches chart name
    const userByName = this.inventoryUsers.find(user => 
      user.username && user.username.toLowerCase() === chartUserName.toLowerCase()
    );
    
    if (userByName) {
      // Return the full username (display text) since DB expects full names
      return userByName.username || chartUserName;
    }
    
    // Try exact invUserID match as fallback
    const userById = this.inventoryUsers.find(user => 
      user.invUserID && user.invUserID.toLowerCase() === chartUserName.toLowerCase()
    );
    
    if (userById) {
      // Return full username, not the short invUserID
      return userById.username || chartUserName;
    }
    
    // If no match found, return as-is
    return chartUserName;
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
    
    // Remove existing listeners
    const existingListener = this.chartClickListeners.get('receivedBarChart');
    if (existingListener) {
      canvas.removeEventListener('click', existingListener);
      this.chartClickListeners.delete('receivedBarChart');
    }
    
    const existingHoverListener = this.chartClickListeners.get('receivedBarChartHover');
    if (existingHoverListener) {
      canvas.removeEventListener('mousemove', existingHoverListener);
      this.chartClickListeners.delete('receivedBarChartHover');
    }
    
    // Start animation if not already animating
    if (!this.isReceivedAnimating) {
      this.animateReceivedBarChart(ctx, canvas);
    } else {
      this.drawReceivedBars(ctx, canvas, 1); // Draw without animation
    }
    
    const padding = 60;
    const chartWidth = canvas.width - (padding * 2);
    
    // Add click event listener for received bar chart
    const clickHandler = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      
      // Check if click is within chart area
      if (clickX >= padding && clickX <= canvas.width - padding && 
          clickY >= padding && clickY <= canvas.height - padding) {
        
        // STRICT received bar chart detection 
        const barGroupWidth = chartWidth / this.receivedChartData.length;
        const barWidth = barGroupWidth * 0.35;
        const maxValue = Math.max(...this.receivedChartData.map(d => Math.max((d.jobsCount || 0), (d.faulty || 0))));
        
        for (let i = 0; i < this.receivedChartData.length; i++) {
          const x = padding + (i * barGroupWidth) + (barGroupWidth * 0.15);
          
          // Calculate EXACT coordinates as in drawing method
          const jobsHeight = ((this.receivedChartData[i].jobsCount || 0) / maxValue) * (canvas.height - (padding * 2));
          const jobsY = padding + (canvas.height - (padding * 2)) - jobsHeight;
          const faultyHeight = ((this.receivedChartData[i].faulty || 0) / maxValue) * (canvas.height - (padding * 2));
          const faultyY = padding + (canvas.height - (padding * 2)) - faultyHeight;
          
          // Jobs bar (purple) - EXACT bounds from drawing
          const jobsBarLeft = x;
          const jobsBarRight = x + barWidth;
          const jobsBarTop = Math.max(jobsY, padding);
          const jobsBarBottom = padding + (canvas.height - (padding * 2));
          
          // Faulty bar (red) - EXACT bounds from drawing
          const faultyBarLeft = x + barWidth + 5;
          const faultyBarRight = x + barWidth + 5 + barWidth;
          const faultyBarTop = Math.max(faultyY, padding);
          const faultyBarBottom = padding + (canvas.height - (padding * 2));
          
          // STRICT click detection with expanded hit zones for better UX
          const isInJobsBar = clickX >= (jobsBarLeft - 2) && clickX <= (jobsBarRight + 2) &&
                             clickY >= (jobsBarTop - 5) && clickY <= (jobsBarBottom + 5);
          const isInFaultyBar = clickX >= (faultyBarLeft - 2) && clickX <= (faultyBarRight + 2) &&
                               clickY >= (faultyBarTop - 5) && clickY <= (faultyBarBottom + 5);
          
          if (isInJobsBar || isInFaultyBar) {
            this.onChartItemClick(this.receivedChartData[i], 'parts-received');
            break;
          }
        }
      }
    };
    
    canvas.addEventListener('click', clickHandler);
    this.chartClickListeners.set('receivedBarChart', clickHandler);
    
    // Add enhanced hover effect
    const hoverHandler = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      
      canvas.style.cursor = 'default';
      let newHoveredIndex = -1;
      
      if (mouseX >= padding && mouseX <= canvas.width - padding && 
          mouseY >= padding && mouseY <= canvas.height - padding) {
        
        const barGroupWidth = chartWidth / this.receivedChartData.length;
        
        for (let i = 0; i < this.receivedChartData.length; i++) {
          const x = padding + (i * barGroupWidth) + (barGroupWidth * 0.15);
          const barWidth = barGroupWidth * 0.35;
          
          if (mouseX >= x && mouseX <= x + (barWidth * 2) + 5) {
            canvas.style.cursor = 'pointer';
            newHoveredIndex = i;
            break;
          }
        }
      }
      
      // Only update cursor, no visual changes
      this.hoveredReceivedBarIndex = newHoveredIndex;
    };
    
    canvas.addEventListener('mousemove', hoverHandler);
    this.chartClickListeners.set('receivedBarChartHover', hoverHandler);
  }

  private renderReceivedPieChart(): void {
    if (!this.receivedPieChartCanvas?.nativeElement) {
      return;
    }
    
    if (this.receivedChartData.length === 0) {
      return;
    }
    
    const canvas = this.receivedPieChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    // Ensure canvas has proper dimensions
    if (canvas.width === 0 || canvas.height === 0) {
      canvas.width = canvas.offsetWidth || 900;
      canvas.height = canvas.offsetHeight || 500;
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Remove existing listeners
    const existingListener = this.chartClickListeners.get('receivedPieChart');
    if (existingListener) {
      canvas.removeEventListener('click', existingListener);
      this.chartClickListeners.delete('receivedPieChart');
    }
    
    try {
      // Render the modern pie chart directly
      this.drawModernReceivedPieSlices(ctx, canvas, 1);
    } catch (error) {
      // Error rendering received pie chart - silently handle
    }
    
    // Setup interactive click detection with centered chart coordinates
    const total = this.receivedChartData.reduce((sum, item) => sum + (item.jobsCount || 0) + (item.faulty || 0), 0);
    const adjustedCenterX = canvas.width / 2;
    const adjustedCenterY = canvas.height / 2;
    const adjustedOuterRadius = Math.min(canvas.width, canvas.height) / 2 - 60;
    const adjustedInnerRadius = adjustedOuterRadius * 0.6;
    
    // Add click event listener for received pie chart
    const clickHandler = (event: MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();
      
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;
      
      // Calculate distance from center
      const dx = clickX - adjustedCenterX;
      const dy = clickY - adjustedCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check if click is within the pie chart
      if (distance <= adjustedOuterRadius && distance >= adjustedInnerRadius) {
        // Calculate angle of click
        let angle = Math.atan2(dy, dx);
        angle = (angle + Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
        
        // Find which slice was clicked
        let currentAngle = 0;
        for (let i = 0; i < this.receivedChartData.length; i++) {
          const itemTotal = (this.receivedChartData[i].jobsCount || 0) + (this.receivedChartData[i].faulty || 0);
          const sliceAngle = (itemTotal / total) * 2 * Math.PI;
          
          if (angle >= currentAngle && angle <= currentAngle + sliceAngle) {
            this.animateReceivedSliceClick(i);
            setTimeout(() => {
              this.onChartItemClick(this.receivedChartData[i], 'parts-received');
            }, 300);
            break;
          }
          
          currentAngle += sliceAngle;
        }
      }
    };
    
    canvas.addEventListener('click', clickHandler);
    this.chartClickListeners.set('receivedPieChart', clickHandler);
    
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
        
        for (let i = 0; i < this.receivedChartData.length; i++) {
          const itemTotal = (this.receivedChartData[i].jobsCount || 0) + (this.receivedChartData[i].faulty || 0);
          const sliceAngle = (itemTotal / total) * 2 * Math.PI;
          
          if (angle >= currentAngle && angle <= currentAngle + sliceAngle) {
            newHoveredIndex = i;
            break;
          }
          
          currentAngle += sliceAngle;
        }
        
        if (newHoveredIndex !== this.hoveredReceivedSliceIndex) {
          this.hoveredReceivedSliceIndex = newHoveredIndex;
          this.renderReceivedPieChart();
        }
        
        // Update tooltip position
        this.updateReceivedTooltipPosition(event, canvas);
      } else {
        canvas.style.cursor = 'default';
        if (this.hoveredReceivedSliceIndex !== -1) {
          this.hoveredReceivedSliceIndex = -1;
          this.renderReceivedPieChart();
        }
      }
    };
    
    const mouseLeaveHandler = () => {
      canvas.style.cursor = 'default';
      this.hoveredReceivedSliceIndex = -1;
      this.renderReceivedPieChart();
    };
    
    canvas.addEventListener('mousemove', mouseMoveHandler);
    canvas.addEventListener('mouseleave', mouseLeaveHandler);
    this.chartClickListeners.set('receivedPieChartHover', mouseMoveHandler);
    this.chartClickListeners.set('receivedPieChartLeave', mouseLeaveHandler);
  }

  // Helper methods for received chart
  getTotalReceivedUnused(): number {
    return this.receivedChartData.reduce((total, item) => total + (item.jobsCount || 0), 0);
  }

  getTotalReceivedFaulty(): number {
    return this.receivedChartData.reduce((total, item) => total + (item.faulty || 0), 0);
  }

  toggleReceivedChartVisibility(): void {
    this.showReceivedChart = !this.showReceivedChart;
  }

  // Graph tab management
setActiveGraphTab(tab: 'graph1' | 'graph2' | 'graph3', updateUrl: boolean = true) {
  this.activeGraphTab = tab;

  // Update URL to preserve tab state on refresh (only when called by user interaction)
  if (updateUrl) {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab },
      queryParamsHandling: 'merge'
    });
  }

  if (tab === 'graph2') {
    // 👉 Weekly parts returned tab selected
    this.showWeeklyDataGrid = true;  // show weekly table instead of main table

    // Set default filters and current week
    const currentWeek = this.getCurrentWeekNumber();
    this.partReturnFilterForm.patchValue({
      inventoryUser: 'All',
      status: 0, // Not Returned (key 0)
      year: new Date().getFullYear(),
      week: currentWeek.toString(),
      weekNo: currentWeek
    });
    this.selectedWeekNo = currentWeek;

    // Load weekly tables & charts
    this.loadPartsReturnDataByWeekNo();
    this.loadWeeklyPartsReturnedCount();
  } 
  else if (tab === 'graph3') {
    // 👉 Parts Received by Warehouse tab selected
    this.showWeeklyDataGrid = false; // hide weekly table
    
    // Set status to 'Returned' for Parts Received by Warehouse
    this.partReturnFilterForm.patchValue({
      status: 3 // Returned (key 3)
    });
    
    // Load data with returned status
    if (this.isComponentInitialized) {
      this.getPartReturnStatusReport();
    }
  }
  else {
    // 👉 Other tabs selected (graph1)
    this.showWeeklyDataGrid = false; // hide weekly table
    
    // Set status to 'Not Returned' for Parts to be Received
    this.partReturnFilterForm.patchValue({
      status: 0 // Not Returned (key 0)
    });
    
    // Load data with not returned status
    if (this.isComponentInitialized) {
      this.getPartReturnStatusReport();
    }
  }
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

  // Additional hover methods for weekly and received charts
  onWeeklyRowHover(index: number, isHovering: boolean): void {
    // Handle weekly row hover effects
    if (isHovering) {
      // Add any specific weekly hover logic here
    }
  }
  
  onReceivedRowHover(index: number, isHovering: boolean): void {
    // Handle received chart row hover effects
    if (isHovering) {
      // Add any specific received chart hover logic here
    }
  }

  // Debug method to check chart state
  debugChartState(): void {
    // Debug information available in development mode
  }

  // Method to switch back to main parts grid (from weekly grid)
  switchToMainGrid(): void {
    this.showWeeklyDataGrid = false;
    this.getPartReturnStatusReport(); // Reload main grid data
  }

  // Get current grid type for display purposes
  getCurrentGridType(): string {
    return this.showWeeklyDataGrid ? 'Weekly Parts Return Data' : 'Parts Return Status';
  }

  // Get grid-specific record count
  getCurrentGridRecordCount(): number {
    return this.showWeeklyDataGrid ? this.partsReturnDataByWeekNo.length : this.totalRecords;
  }

  // Weekly and received chart tooltip methods
  updateWeeklyTooltipPosition(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    this.weeklyTooltipPosition.x = event.clientX - rect.left + 15;
    this.weeklyTooltipPosition.y = event.clientY - rect.top - 10;
  }

  updateReceivedTooltipPosition(event: MouseEvent, canvas: HTMLCanvasElement): void {
    const rect = canvas.getBoundingClientRect();
    this.receivedTooltipPosition.x = event.clientX - rect.left + 15;
    this.receivedTooltipPosition.y = event.clientY - rect.top - 10;
  }

  // Weekly bar chart animation methods
  private animateWeeklyBarChart(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    this.isWeeklyAnimating = true;
    this.weeklyAnimationProgress = 0;
    
    const animate = () => {
      this.weeklyAnimationProgress += 0.02;
      
      if (this.weeklyAnimationProgress >= 1) {
        this.weeklyAnimationProgress = 1;
        this.isWeeklyAnimating = false;
      }
      
      // Easing function for smooth animation
      const easeProgress = this.easeOutCubic(this.weeklyAnimationProgress);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.drawWeeklyBars(ctx, canvas, easeProgress);
      
      if (this.isWeeklyAnimating) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  private drawWeeklyBars(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, progress: number): void {
    const padding = 60;
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - (padding * 2);
    const barGroupWidth = chartWidth / this.weeklyPartsData.length;
    const barWidth = barGroupWidth * 0.35;
    const maxValue = Math.max(...this.weeklyPartsData.map(d => Math.max(d.unUsed, d.faulty)));
    
    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(80, 205, 137, 0.02)');
    gradient.addColorStop(1, 'rgba(255, 149, 0, 0.05)');
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
    this.weeklyPartsData.forEach((item, index) => {
      const x = padding + (index * barGroupWidth) + (barGroupWidth * 0.1);
      
      // UnUsed parts bar with gradient and animation
      const unusedHeight = ((item.unUsed / maxValue) * chartHeight * progress);
      const unusedY = padding + chartHeight - unusedHeight;
      
      // Create gradient for unused bar
      const unusedGradient = ctx.createLinearGradient(0, unusedY, 0, unusedY + unusedHeight);
      unusedGradient.addColorStop(0, '#50cd89');
      unusedGradient.addColorStop(1, '#38a169');
      
      ctx.fillStyle = unusedGradient;
      ctx.shadowColor = 'rgba(80, 205, 137, 0.2)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
      
      this.drawRoundedRect(ctx, x, unusedY, barWidth, unusedHeight, 4);
      
      // Faulty parts bar with gradient and animation
      const faultyHeight = ((item.faulty / maxValue) * chartHeight * progress);
      const faultyY = padding + chartHeight - faultyHeight;
      
      const faultyGradient = ctx.createLinearGradient(0, faultyY, 0, faultyY + faultyHeight);
      faultyGradient.addColorStop(0, '#ff9500');
      faultyGradient.addColorStop(1, '#e67e00');
      
      ctx.fillStyle = faultyGradient;
      ctx.shadowColor = 'rgba(255, 149, 0, 0.2)';
      
      this.drawRoundedRect(ctx, x + barWidth + 5, faultyY, barWidth, faultyHeight, 4);
      
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      // X-axis labels with bounce-in animation
      if (progress > 0.7) {
        const labelProgress = Math.min(1, (progress - 0.7) / 0.3);
        const bounceProgress = this.easeOutElastic(labelProgress);
        
        ctx.fillStyle = `rgba(108, 117, 125, ${labelProgress})`;
        ctx.font = '10px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.save();
        const labelX = x + barWidth + 2.5;
        ctx.translate(labelX, canvas.height - padding + 15);
        ctx.scale(bounceProgress, bounceProgress);
        ctx.fillText(item.wkEnd, 0, 0);
        ctx.restore();
      }
      
      // Animated value labels
      if (progress > 0.8) {
        const labelAlpha = (progress - 0.8) / 0.2;
        ctx.fillStyle = `rgba(0, 0, 0, ${labelAlpha})`;
        ctx.font = 'bold 10px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        
        // UnUsed parts label - always above bar
        if (item.unUsed > 0) {
          ctx.fillText(item.unUsed.toString(), x + (barWidth * 0.5), unusedY - 8);
        }
        
        // Faulty parts label - always above bar
        if (item.faulty > 0) {
          ctx.fillText(item.faulty.toString(), x + barWidth + 5 + (barWidth * 0.5), faultyY - 8);
        }
      }
    });
    
    // Draw animated axes
    if (progress > 0.3) {
      const axisProgress = (progress - 0.3) / 0.7;
      ctx.strokeStyle = `rgba(108, 117, 125, ${axisProgress})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, canvas.height - padding);
      ctx.lineTo(canvas.width - padding, canvas.height - padding);
      ctx.stroke();
    }
    
    // Draw animated legend
    if (progress > 0.6) {
      const legendAlpha = (progress - 0.6) / 0.4;
      
      ctx.fillStyle = `rgba(80, 205, 137, ${legendAlpha})`;
      ctx.fillRect(padding + 10, 20, 15, 12);
      ctx.fillStyle = `rgba(108, 117, 125, ${legendAlpha})`;
      ctx.font = '12px Inter, Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Unused Parts', padding + 30, 31);
      
      ctx.fillStyle = `rgba(255, 149, 0, ${legendAlpha})`;
      ctx.fillRect(padding + 130, 20, 15, 12);
      ctx.fillStyle = `rgba(108, 117, 125, ${legendAlpha})`;
      ctx.fillText('Faulty Parts', padding + 150, 31);
    }
  }

  // Received warehouse bar chart animation methods
  private animateReceivedBarChart(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): void {
    this.isReceivedAnimating = true;
    this.receivedAnimationProgress = 0;
    
    const animate = () => {
      this.receivedAnimationProgress += 0.02;
      
      if (this.receivedAnimationProgress >= 1) {
        this.receivedAnimationProgress = 1;
        this.isReceivedAnimating = false;
      }
      
      // Easing function for smooth animation
      const easeProgress = this.easeOutCubic(this.receivedAnimationProgress);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      this.drawReceivedBars(ctx, canvas, easeProgress);
      
      if (this.isReceivedAnimating) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }

  private drawReceivedBars(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, progress: number): void {
    const padding = 60;
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - (padding * 2);
    const barGroupWidth = chartWidth / this.receivedChartData.length;
    const barWidth = barGroupWidth * 0.35; // Narrower bars to fit two per group
    const maxValue = Math.max(...this.receivedChartData.map((d: PartsReceivedByWHChartDto) => Math.max(d.jobsCount || 0, d.faulty || 0)));
    
    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(54, 153, 255, 0.02)');
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
    this.receivedChartData.forEach((item: PartsReceivedByWHChartDto, index: number) => {
      const x = padding + (index * barGroupWidth) + (barGroupWidth * 0.15);
      
      // Jobs count bar with gradient and animation
      const jobsHeight = ((item.jobsCount || 0) / maxValue) * chartHeight * progress;
      const jobsY = padding + chartHeight - jobsHeight;
      
      // Create gradient for jobs bar
      const jobsGradient = ctx.createLinearGradient(0, jobsY, 0, jobsY + jobsHeight);
      jobsGradient.addColorStop(0, '#8b5cf6');
      jobsGradient.addColorStop(1, '#7c3aed');
      
      ctx.fillStyle = jobsGradient;
      ctx.shadowColor = 'rgba(139, 92, 246, 0.2)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 5;
      
      this.drawRoundedRect(ctx, x, jobsY, barWidth, jobsHeight, 4);
      
      // Faulty parts bar with gradient and animation
      const faultyHeight = ((item.faulty || 0) / maxValue) * chartHeight * progress;
      const faultyY = padding + chartHeight - faultyHeight;
      
      const faultyGradient = ctx.createLinearGradient(0, faultyY, 0, faultyY + faultyHeight);
      faultyGradient.addColorStop(0, '#ef4444');
      faultyGradient.addColorStop(1, '#dc2626');
      
      ctx.fillStyle = faultyGradient;
      ctx.shadowColor = 'rgba(239, 68, 68, 0.2)';
      
      this.drawRoundedRect(ctx, x + barWidth + 5, faultyY, barWidth, faultyHeight, 4);
      
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      // X-axis labels with bounce-in animation
      if (progress > 0.7) {
        const labelProgress = Math.min(1, (progress - 0.7) / 0.3);
        const bounceProgress = this.easeOutElastic(labelProgress);
        
        ctx.fillStyle = `rgba(108, 117, 125, ${labelProgress})`;
        ctx.font = '10px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.save();
        const labelX = x + barWidth + 2.5;
        ctx.translate(labelX, canvas.height - padding + 15);
        ctx.scale(bounceProgress, bounceProgress);
        ctx.fillText(item.name, 0, 0);
        ctx.restore();
      }
      
      // Animated value labels
      if (progress > 0.8) {
        const labelAlpha = (progress - 0.8) / 0.2;
        ctx.fillStyle = `rgba(0, 0, 0, ${labelAlpha})`;
        ctx.font = 'bold 10px Inter, Arial, sans-serif';
        ctx.textAlign = 'center';
        
        // Jobs count label - always above bar
        if ((item.jobsCount || 0) > 0) {
          ctx.fillText((item.jobsCount || 0).toString(), x + (barWidth * 0.5), jobsY - 8);
        }
        
        // Faulty parts label - always above bar  
        if ((item.faulty || 0) > 0) {
          ctx.fillText((item.faulty || 0).toString(), x + barWidth + 5 + (barWidth * 0.5), faultyY - 8);
        }
      }
    });
    
    // Draw animated axes
    if (progress > 0.3) {
      const axisProgress = (progress - 0.3) / 0.7;
      ctx.strokeStyle = `rgba(108, 117, 125, ${axisProgress})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, canvas.height - padding);
      ctx.lineTo(canvas.width - padding, canvas.height - padding);
      ctx.stroke();
    }
    
    // Draw animated legend
    if (progress > 0.6) {
      const legendAlpha = (progress - 0.6) / 0.4;
      
      ctx.fillStyle = `rgba(139, 92, 246, ${legendAlpha})`;
      ctx.fillRect(padding + 10, 20, 15, 12);
      ctx.fillStyle = `rgba(108, 117, 125, ${legendAlpha})`;
      ctx.font = '12px Inter, Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('Jobs Count', padding + 30, 31);
      
      ctx.fillStyle = `rgba(239, 68, 68, ${legendAlpha})`;
      ctx.fillRect(padding + 120, 20, 15, 12);
      ctx.fillStyle = `rgba(108, 117, 125, ${legendAlpha})`;
      ctx.fillText('Faulty Parts', padding + 140, 31);
    }
  }

  // Weekly pie chart animation and interaction methods
  private drawModernWeeklyPieSlices(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, progress: number): void {
    // Position pie chart to the right, accounting for left-side data panel
    const legendWidth = 250;
    const availableWidth = canvas.width - legendWidth;
    const centerX = legendWidth + (availableWidth / 2);
    const centerY = canvas.height / 2;
    const outerRadius = Math.min(availableWidth / 2, centerY) - 40;
    const innerRadius = outerRadius * 0.4;
    
    const total = this.getTotalWeeklyParts();
    
    // Check for valid dimensions
    if (outerRadius <= 0 || innerRadius <= 0 || total === 0) {
      return;
    }
    
    let currentAngle = -Math.PI / 2;

    const modernColors = [
      '#4f46e5', '#ef4444', '#10b981', '#f59e0b', 
      '#06b6d4', '#ec4899', '#84cc16', '#8b5cf6'
    ];

    // Draw slices with labels inside
    this.weeklyPartsData.forEach((item, index) => {
      const itemTotal = item.unUsed + item.faulty;
      const sliceAngle = ((itemTotal / total) * 2 * Math.PI) * progress;
      const color = modernColors[index % modernColors.length];
      const percentage = ((itemTotal / total) * 100).toFixed(1);
      
      // Draw slice
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      
      // Draw inner circle (donut hole)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
      ctx.fill();
      
      // Calculate label position (middle of slice)
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelRadius = (outerRadius + innerRadius) / 2;
      const labelX = centerX + Math.cos(labelAngle) * labelRadius;
      const labelY = centerY + Math.sin(labelAngle) * labelRadius;
      
      // Draw labels inside slices if slice is large enough
      if (sliceAngle > 0.3) { // Only show labels for slices larger than ~17 degrees
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw week ending date (truncated if needed)
        const weekName = item.wkEnd.length > 10 ? item.wkEnd.substring(0, 8) + '...' : item.wkEnd;
        ctx.fillText(weekName, labelX, labelY - 12);
        
        // Draw count
        ctx.font = 'bold 13px Arial';
        ctx.fillText(itemTotal.toString(), labelX, labelY + 2);
        
        // Draw percentage
        ctx.font = '10px Arial';
        ctx.fillText(`(${percentage}%)`, labelX, labelY + 14);
      }
      
      currentAngle += sliceAngle;
    });
    
    // Draw center label
    ctx.fillStyle = '#374151';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Total Parts', centerX, centerY - 10);
    
    ctx.font = 'bold 24px Arial';
    ctx.fillText(total.toString(), centerX, centerY + 10);
    
    // Draw left-side data panel
    this.drawWeeklyDataPanel(ctx, canvas, modernColors);
  }

  // Draw simple data panel on the left side for Weekly chart
  private drawWeeklyDataPanel(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, colors: string[]): void {
    const panelX = 25;
    const panelY = 40;
    const itemHeight = 35;
    const total = this.getTotalWeeklyParts();
    
    // Panel background
    const panelWidth = 220;
    const panelHeight = (this.weeklyPartsData.length * itemHeight) + 80;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(panelX - 10, panelY - 30, panelWidth, panelHeight);
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX - 10, panelY - 30, panelWidth, panelHeight);
    
    // Panel title
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Weekly Distribution', panelX, panelY - 5);
    
    // Summary
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Arial';
    ctx.fillText(`${total} parts across ${this.weeklyPartsData.length} weeks`, panelX, panelY + 15);
    
    // Data items
    this.weeklyPartsData.forEach((item, index) => {
      const y = panelY + 40 + (index * itemHeight);
      const color = colors[index % colors.length];
      const itemTotal = item.unUsed + item.faulty;
      const percentage = Math.round((itemTotal / total) * 100);
      
      // Color indicator
      ctx.fillStyle = color;
      ctx.fillRect(panelX, y - 8, 12, 12);
      
      // Week name
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 12px Arial';
      const displayName = item.wkEnd.length > 15 ? item.wkEnd.substring(0, 13) + '...' : item.wkEnd;
      ctx.fillText(displayName, panelX + 20, y - 2);
      
      // Count and percentage
      ctx.fillStyle = color;
      ctx.font = 'bold 14px Arial';
      ctx.fillText(itemTotal.toString(), panelX + 20, y + 12);
      
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px Arial';
      const countTextWidth = ctx.measureText(itemTotal.toString()).width;
      ctx.fillText(`parts (${percentage}%)`, panelX + 20 + countTextWidth + 8, y + 12);
    });
  }

  // Draw elegant modern legend positioned on the left side for Weekly chart
  private drawWeeklyModernLegend(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, colors: any[]): void {
    const legendX = 25;
    const legendY = 40;
    const itemHeight = 40;
    const total = this.getTotalWeeklyParts();
    
    // Calculate legend dimensions
    const legendWidth = 240;
    const legendHeight = (this.weeklyPartsData.length * itemHeight) + 80;
    
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
    ctx.fillText('Weekly Distribution', legendX, legendY - 10);
    
    // Draw refined summary
    ctx.font = '500 13px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`${total} parts across ${this.weeklyPartsData.length} weeks`, legendX, legendY + 12);
    
    // Draw elegant legend items
    this.weeklyPartsData.forEach((item, index) => {
      const y = legendY + 35 + (index * itemHeight);
      const color = colors[index % colors.length];
      const itemTotal = item.unUsed + item.faulty;
      const percentage = Math.round((itemTotal / total) * 100);
      
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
      
      // Draw week name with better typography
      ctx.fillStyle = '#111827';
      ctx.font = '600 14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      const maxNameLength = 16;
      const displayName = item.wkEnd.length > maxNameLength ? 
        item.wkEnd.substring(0, maxNameLength - 2) + '...' : item.wkEnd;
      ctx.fillText(displayName, legendX + 35, y + 10);
      
      // Draw part count with emphasis
      ctx.fillStyle = color.main;
      ctx.font = 'bold 16px Inter, system-ui, sans-serif';
      ctx.fillText(itemTotal.toString(), legendX + 35, y + 28);
      
      // Draw "parts" label
      ctx.fillStyle = '#6b7280';
      ctx.font = '500 12px Inter, system-ui, sans-serif';
      const partsTextX = legendX + 35 + ctx.measureText(itemTotal.toString()).width + 6;
      ctx.fillText('parts', partsTextX, y + 28);
      
      // Draw percentage
      ctx.fillStyle = '#9ca3af';
      ctx.font = '500 11px Inter, system-ui, sans-serif';
      const percentageTextX = partsTextX + ctx.measureText('parts').width + 12;
      ctx.fillText(`(${percentage}%)`, percentageTextX, y + 28);
    });
  }

  private drawWeeklyPieLegend(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, legendWidth: number): void {
    const legendX = 30;
    let legendY = 80;
    const lineHeight = 35;
    const total = this.getTotalWeeklyParts();
    
    // Legend title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px Inter, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Weekly Distribution', legendX, legendY - 20);
    
    // Legend items
    this.weeklyPartsData.forEach((item, index) => {
      const itemTotal = item.unUsed + item.faulty;
      const percentage = total > 0 ? Math.round((itemTotal / total) * 100) : 0;
      const color = this.getWeeklySliceColor(index);
      const isHovered = this.hoveredWeeklySliceIndex === index;
      
      // Highlight hovered legend item
      if (isHovered) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.fillRect(legendX - 10, legendY - 20, legendWidth - 40, 30);
      }
      
      // Color indicator
      ctx.fillStyle = color;
      ctx.fillRect(legendX, legendY - 12, 16, 16);
      
      // Week text
      ctx.fillStyle = isHovered ? '#1f2937' : '#374151';
      ctx.font = isHovered ? 'bold 14px Inter, Arial, sans-serif' : '14px Inter, Arial, sans-serif';
      ctx.fillText(`Week ${item.weekNo}`, legendX + 25, legendY - 2);
      
      // Value and percentage
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Inter, Arial, sans-serif';
      ctx.fillText(`${itemTotal} parts (${percentage}%)`, legendX + 25, legendY + 12);
      
      legendY += lineHeight;
    });
  }

  private animateWeeklySliceHover(): void {
    if (!this.weeklyPieChartCanvas?.nativeElement) return;
    
    const canvas = this.weeklyPieChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawModernWeeklyPieSlices(ctx, canvas, 1);
  }

  private animateWeeklySliceClick(index: number): void {
    this.clickedWeeklySliceIndex = index;
    
    // Animate click effect
    let scale = 1;
    const animateClick = () => {
      scale += 0.02;
      if (scale >= 1.1) {
        scale = 1.1;
        // Reset after short delay
        setTimeout(() => {
          this.clickedWeeklySliceIndex = -1;
          this.animateWeeklySliceHover();
        }, 200);
        return;
      }
      
      this.weeklySliceHoverScale[index] = scale;
      this.animateWeeklySliceHover();
      requestAnimationFrame(animateClick);
    };
    
    animateClick();
  }

  // Received pie chart animation and interaction methods
  private drawModernReceivedPieSlices(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, progress: number): void {
    // Modern donut-style chart positioned in center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const outerRadius = Math.min(canvas.width, canvas.height) / 2 - 60;
    const innerRadius = outerRadius * 0.6; // Large center hole for donut style
    
    const total = this.receivedChartData.reduce((sum, item) => sum + (item.jobsCount || 0) + (item.faulty || 0), 0);
    
    // Check for valid dimensions
    if (outerRadius <= 0 || innerRadius <= 0) {
      return;
    }
    
    let currentAngle = -Math.PI / 2;

    // Modern high-contrast color palette
    const modernColors = [
      { main: '#FF6B6B', light: '#FF8E8E', shadow: '#E84545' }, // Bright Red
      { main: '#4ECDC4', light: '#7EDDD8', shadow: '#2EAB9F' }, // Teal
      { main: '#45B7D1', light: '#6BC5D8', shadow: '#2A9FC7' }, // Blue
      { main: '#F9CA24', light: '#F9D949', shadow: '#E6B800' }, // Yellow
      { main: '#A55EEA', light: '#B87EED', shadow: '#8B3CD9' }, // Purple
      { main: '#26DE81', light: '#52E69B', shadow: '#1CB55A' }, // Green
      { main: '#FD79A8', light: '#FE98BC', shadow: '#E84393' }, // Pink
      { main: '#FDCB6E', light: '#FDD888', shadow: '#E6B800' }  // Orange
    ];

    // Draw modern background with subtle gradient
    const bgGradient = ctx.createRadialGradient(centerX, centerY, innerRadius, centerX, centerY, outerRadius + 30);
    bgGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
    bgGradient.addColorStop(0.8, 'rgba(248, 250, 252, 0.3)');
    bgGradient.addColorStop(1, 'rgba(241, 245, 249, 0.5)');
    ctx.fillStyle = bgGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerRadius + 20, 0, 2 * Math.PI);
    ctx.fill();

    // Draw donut slices with modern styling
    this.receivedChartData.forEach((item, index) => {
      const itemTotal = (item.jobsCount || 0) + (item.faulty || 0);
      const sliceAngle = ((itemTotal / total) * 2 * Math.PI) * progress;
      const colors = modernColors[index % modernColors.length];
      const percentage = Math.round((itemTotal / total) * 100);
      
      // Interactive effects
      const isHovered = this.hoveredReceivedSliceIndex === index;
      const isClicked = this.clickedReceivedSliceIndex === index;
      
      // Apply hover/click effects with slight expansion
      let effectiveOuterRadius = outerRadius;
      let effectiveInnerRadius = innerRadius;
      let offsetX = 0, offsetY = 0;
      
      if (isHovered || isClicked) {
        const midAngle = currentAngle + sliceAngle / 2;
        const offsetDistance = isClicked ? 12 : 6;
        offsetX = Math.cos(midAngle) * offsetDistance;
        offsetY = Math.sin(midAngle) * offsetDistance;
        effectiveOuterRadius = outerRadius + (isClicked ? 8 : 4);
      }
      
      const effectiveCenterX = centerX + offsetX;
      const effectiveCenterY = centerY + offsetY;
      
      // Modern gradient with smooth transitions
      const sliceGradient = ctx.createRadialGradient(
        effectiveCenterX, effectiveCenterY, effectiveInnerRadius,
        effectiveCenterX, effectiveCenterY, effectiveOuterRadius
      );
      
      if (isHovered || isClicked) {
        sliceGradient.addColorStop(0, colors.light);
        sliceGradient.addColorStop(0.5, colors.main);
        sliceGradient.addColorStop(1, colors.shadow);
        
        // Add glow effect
        ctx.shadowColor = colors.main;
        ctx.shadowBlur = isClicked ? 20 : 12;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      } else {
        sliceGradient.addColorStop(0, colors.light);
        sliceGradient.addColorStop(0.7, colors.main);
        sliceGradient.addColorStop(1, colors.shadow);
      }
      
      ctx.fillStyle = sliceGradient;
      
      // Draw the donut slice with slight padding between slices
      const paddingAngle = 0.01; // Small gap between slices
      ctx.beginPath();
      ctx.arc(effectiveCenterX, effectiveCenterY, effectiveInnerRadius, currentAngle + paddingAngle, currentAngle + sliceAngle - paddingAngle);
      ctx.arc(effectiveCenterX, effectiveCenterY, effectiveOuterRadius, currentAngle + sliceAngle - paddingAngle, currentAngle + paddingAngle, true);
      ctx.closePath();
      ctx.fill();
      
      // Reset shadow
      ctx.shadowBlur = 0;
      
      // Draw subtle slice borders for clean separation
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Draw clean, readable labels inside slices
      if (sliceAngle > 0.08) { // Only show labels for reasonably sized slices
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelRadius = (effectiveOuterRadius + effectiveInnerRadius) / 2;
        const labelX = effectiveCenterX + Math.cos(labelAngle) * labelRadius;
        const labelY = effectiveCenterY + Math.sin(labelAngle) * labelRadius;
        
        // Smart label positioning based on slice size
        const isLargeSlice = sliceAngle > 0.3;
        const isMediumSlice = sliceAngle > 0.15;
        
        // Text styling with better visibility
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffffff';
        
        if (isLargeSlice) {
          // Large slices: Show name, value, and percentage on separate lines
          ctx.font = 'bold 11px Inter, Arial, sans-serif';
          const maxNameLength = 10;
          const displayName = item.name.length > maxNameLength ? 
            item.name.substring(0, maxNameLength - 2) + '..' : item.name;
          ctx.fillText(displayName, labelX, labelY - 16);
          
          ctx.font = 'bold 15px Inter, Arial, sans-serif';
          ctx.fillText(itemTotal.toString(), labelX, labelY);
          
          // Removed percentage display as requested
          // ctx.font = 'bold 10px Inter, Arial, sans-serif';
          // ctx.fillText(`(${percentage}%)`, labelX, labelY + 14);
          
        } else if (isMediumSlice) {
          // Medium slices: Show name and value
          ctx.font = 'bold 10px Inter, Arial, sans-serif';
          const maxNameLength = 6;
          const displayName = item.name.length > maxNameLength ? 
            item.name.substring(0, maxNameLength - 2) + '..' : item.name;
          ctx.fillText(displayName, labelX, labelY - 8);
          
          ctx.font = 'bold 12px Inter, Arial, sans-serif';
          ctx.fillText(itemTotal.toString(), labelX, labelY + 6);
          
        } else {
          // Small slices: Show only value
          ctx.font = 'bold 10px Inter, Arial, sans-serif';
          ctx.fillText(itemTotal.toString(), labelX, labelY);
        }
        
        // Reset text shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }
      
      currentAngle += (itemTotal / total) * 2 * Math.PI;
    });
    
    // Draw modern center circle with subtle shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4;
    
    const innerGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, innerRadius * 0.9);
    innerGradient.addColorStop(0, '#ffffff');
    innerGradient.addColorStop(0.5, '#fafbfc');
    innerGradient.addColorStop(1, '#f8fafc');
    ctx.fillStyle = innerGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Reset shadow
    ctx.shadowBlur = 0;
    
    // Subtle border
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Modern center text display
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Large total count (main focal point)
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 44px Inter, Arial, sans-serif';
    ctx.fillText(total.toString(), centerX, centerY - 10);
    
    // Descriptive label below
    ctx.fillStyle = '#64748b';
    ctx.font = '600 14px Inter, Arial, sans-serif';
    ctx.fillText('Total Parts', centerX, centerY + 24);
    
    // Draw legend when animation is complete
    if (progress >= 1) {
      this.drawReceivedModernLegend(ctx, canvas, modernColors);
    }
  }

  // Draw simple data panel on the left side for Received chart
  private drawReceivedDataPanel(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, colors: string[]): void {
    const panelX = 25;
    const panelY = 40;
    const itemHeight = 35;
    const total = this.receivedChartData.reduce((sum, item) => sum + (item.jobsCount || 0) + (item.faulty || 0), 0);
    
    // Panel background
    const panelWidth = 220;
    const panelHeight = (this.receivedChartData.length * itemHeight) + 80;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillRect(panelX - 10, panelY - 30, panelWidth, panelHeight);
    
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX - 10, panelY - 30, panelWidth, panelHeight);
    
    // Panel title
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('Warehouse Distribution', panelX, panelY - 5);
    
    // Summary
    ctx.fillStyle = '#6b7280';
    ctx.font = '12px Arial';
    ctx.fillText(`${total} parts across ${this.receivedChartData.length} warehouses`, panelX, panelY + 15);
    
    // Data items
    this.receivedChartData.forEach((item, index) => {
      const y = panelY + 40 + (index * itemHeight);
      const color = colors[index % colors.length];
      const itemTotal = (item.jobsCount || 0) + (item.faulty || 0);
      const percentage = Math.round((itemTotal / total) * 100);
      
      // Color indicator
      ctx.fillStyle = color;
      ctx.fillRect(panelX, y - 8, 12, 12);
      
      // Warehouse name
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 12px Arial';
      const displayName = item.name.length > 15 ? item.name.substring(0, 13) + '...' : item.name;
      ctx.fillText(displayName, panelX + 20, y - 2);
      
      // Count and percentage
      ctx.fillStyle = color;
      ctx.font = 'bold 14px Arial';
      ctx.fillText(itemTotal.toString(), panelX + 20, y + 12);
      
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px Arial';
      const countTextWidth = ctx.measureText(itemTotal.toString()).width;
      ctx.fillText(`parts (${percentage}%)`, panelX + 20 + countTextWidth + 8, y + 12);
    });
  }

  // Draw elegant modern legend positioned on the left side for Received chart
  private drawReceivedModernLegend(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, colors: any[]): void {
    const legendX = 25;
    const legendY = 40;
    const itemHeight = 40;
    const total = this.receivedChartData.reduce((sum, item) => sum + (item.jobsCount || 0) + (item.faulty || 0), 0);
    
    // Calculate legend dimensions
    const legendWidth = 240;
    const legendHeight = (this.receivedChartData.length * itemHeight) + 80;
    
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
    ctx.fillText('Warehouse Distribution', legendX, legendY - 10);
    
    // Draw refined summary
    ctx.font = '500 13px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#6b7280';
    ctx.fillText(`${total} across ${this.receivedChartData.length} warehouses`, legendX, legendY + 12);
    
    // Draw elegant legend items
    this.receivedChartData.forEach((item, index) => {
      const y = legendY + 35 + (index * itemHeight);
      const color = colors[index % colors.length];
      const itemTotal = (item.jobsCount || 0) + (item.faulty || 0);
      const percentage = Math.round((itemTotal / total) * 100);
      
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
      
      // Draw warehouse name with better typography
      ctx.fillStyle = '#111827';
      ctx.font = '600 14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      const maxNameLength = 16;
      const displayName = item.name.length > maxNameLength ? 
        item.name.substring(0, maxNameLength - 2) + '...' : item.name;
      ctx.fillText(displayName, legendX + 35, y + 10);
      
      // Draw part count with emphasis
      ctx.fillStyle = color.main;
      ctx.font = 'bold 16px Inter, system-ui, sans-serif';
      ctx.fillText(itemTotal.toString(), legendX + 35, y + 28);
      
      // Removed "parts" label and percentage as requested
      // ctx.fillStyle = '#6b7280';
      // ctx.font = '500 12px Inter, system-ui, sans-serif';
      // const partsTextX = legendX + 35 + ctx.measureText(itemTotal.toString()).width + 6;
      // ctx.fillText('parts', partsTextX, y + 28);
      // 
      // Draw percentage
      // ctx.fillStyle = '#9ca3af';
      // ctx.font = '500 11px Inter, system-ui, sans-serif';
      // const percentageTextX = partsTextX + ctx.measureText('parts').width + 12;
      // ctx.fillText(`(${percentage}%)`, percentageTextX, y + 28);
    });
  }

  private drawReceivedPieLegend(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, legendWidth: number): void {
    const legendX = 30;
    let legendY = 80;
    const lineHeight = 35;
    const total = this.receivedChartData.reduce((sum, item) => sum + (item.jobsCount || 0) + (item.faulty || 0), 0);
    
    // Legend title
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px Inter, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Received by Month', legendX, legendY - 20);
    
    // Legend items
    this.receivedChartData.forEach((item, index) => {
      const itemTotal = (item.jobsCount || 0) + (item.faulty || 0);
      const percentage = total > 0 ? Math.round((itemTotal / total) * 100) : 0;
      const color = this.getReceivedSliceColor(index);
      const isHovered = this.hoveredReceivedSliceIndex === index;
      
      // Highlight hovered legend item
      if (isHovered) {
        ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
        ctx.fillRect(legendX - 10, legendY - 20, legendWidth - 40, 30);
      }
      
      // Color indicator
      ctx.fillStyle = color;
      ctx.fillRect(legendX, legendY - 12, 16, 16);
      
      // Month text
      ctx.fillStyle = isHovered ? '#1f2937' : '#374151';
      ctx.font = isHovered ? 'bold 14px Inter, Arial, sans-serif' : '14px Inter, Arial, sans-serif';
      ctx.fillText(item.name, legendX + 25, legendY - 2);
      
      // Value and percentage
      ctx.fillStyle = '#6b7280';
      ctx.font = '12px Inter, Arial, sans-serif';
      ctx.fillText(`${itemTotal} parts (${percentage}%)`, legendX + 25, legendY + 12);
      
      legendY += lineHeight;
    });
  }



  private animateReceivedSliceClick(index: number): void {
    this.clickedReceivedSliceIndex = index;
    
    // Animate click effect
    let scale = 1;
    const animateClick = () => {
      scale += 0.02;
      if (scale >= 1.1) {
        scale = 1.1;
        // Reset after short delay
        setTimeout(() => {
          this.clickedReceivedSliceIndex = -1;
          this.renderReceivedPieChart();
        }, 200);
        return;
      }
      
      this.receivedSliceHoverScale[index] = scale;
      this.renderReceivedPieChart();
      requestAnimationFrame(animateClick);
    };
    
    animateClick();
  }

  public getWeeklySliceColor(index: number): string {
    const colors = [
      '#50cd89', '#ff9500', '#4F46E5', '#EF4444', 
      '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16'
    ];
    return colors[index % colors.length];
  }

  public getReceivedSliceColor(index: number): string {
    const colors = [
      '#8b5cf6', '#ef4444', '#10b981', '#f59e0b', 
      '#06b6d4', '#ec4899', '#84cc16', '#4f46e5'
    ];
    return colors[index % colors.length];
  }

  public getWeeklyItemPercentage(item: WeeklyPartsReturnedCountDto): number {
    const total = this.getTotalWeeklyParts();
    const itemTotal = item.unUsed + item.faulty;
    return total > 0 ? Math.round((itemTotal / total) * 100) : 0;
  }

  public getReceivedChartItemPercentage(item: PartsReceivedByWHChartDto): number {
    const total = this.receivedChartData.reduce((sum, chartItem) => sum + (chartItem.jobsCount || 0) + (chartItem.faulty || 0), 0);
    const itemTotal = (item.jobsCount || 0) + (item.faulty || 0);
    return total > 0 ? Math.round((itemTotal / total) * 100) : 0;
  }



  // Mouse event handlers for received pie chart
  onReceivedPieChartMouseMove(event: MouseEvent): void {
    const canvas = this.receivedPieChartCanvas?.nativeElement;
    if (!canvas || !this.receivedChartData || this.receivedChartData.length === 0) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Position pie chart to the right, accounting for left-side legend
    const legendWidth = 220;
    const availableWidth = canvas.width - legendWidth;
    const centerX = legendWidth + (availableWidth / 2);
    const centerY = canvas.height / 2;
    const outerRadius = Math.min(availableWidth / 2, centerY) - 40;
    const innerRadius = outerRadius * 0.4;
    
    // Calculate distance from center
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check if mouse is within the donut chart area
    if (distance >= innerRadius && distance <= outerRadius) {
      // Calculate angle
      const angle = Math.atan2(dy, dx);
      const adjustedAngle = angle < -Math.PI / 2 ? angle + 2 * Math.PI : angle;
      const normalizedAngle = adjustedAngle + Math.PI / 2;
      
      // Find which slice the mouse is over
      const total = this.receivedChartData.reduce((sum, item) => sum + (item.jobsCount || 0) + (item.faulty || 0), 0);
      let currentAngle = 0;
      let hoveredIndex = -1;
      
      for (let i = 0; i < this.receivedChartData.length; i++) {
        const item = this.receivedChartData[i];
        const itemTotal = (item.jobsCount || 0) + (item.faulty || 0);
        const sliceAngle = (itemTotal / total) * 2 * Math.PI;
        
        if (normalizedAngle >= currentAngle && normalizedAngle <= currentAngle + sliceAngle) {
          hoveredIndex = i;
          break;
        }
        
        currentAngle += sliceAngle;
      }
      
      // Update hover state
      if (hoveredIndex !== this.hoveredReceivedSliceIndex) {
        this.hoveredReceivedSliceIndex = hoveredIndex;
        
        // Animate hover effect
        this.animateReceivedSliceHover(hoveredIndex);
        
        // Update tooltip position
        this.receivedTooltipPosition = { x: event.clientX + 10, y: event.clientY - 10 };
        
        // Redraw chart
        this.renderReceivedPieChart();
      }
    } else {
      // Mouse is outside the chart area
      if (this.hoveredReceivedSliceIndex !== -1) {
        this.hoveredReceivedSliceIndex = -1;
        this.resetReceivedSliceAnimations();
        this.renderReceivedPieChart();
      }
    }
  }

  onReceivedPieChartMouseLeave(): void {
    if (this.hoveredReceivedSliceIndex !== -1) {
      this.hoveredReceivedSliceIndex = -1;
      this.resetReceivedSliceAnimations();
      this.renderReceivedPieChart();
    }
  }

  onReceivedPieChartClick(event: MouseEvent): void {
    const canvas = this.receivedPieChartCanvas?.nativeElement;
    if (!canvas || !this.receivedChartData || this.receivedChartData.length === 0) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Position pie chart to the right, accounting for left-side legend
    const legendWidth = 220;
    const availableWidth = canvas.width - legendWidth;
    const centerX = legendWidth + (availableWidth / 2);
    const centerY = canvas.height / 2;
    const outerRadius = Math.min(availableWidth / 2, centerY) - 40;
    const innerRadius = outerRadius * 0.4;
    
    // Calculate distance from center
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Check if click is within the donut chart area
    if (distance >= innerRadius && distance <= outerRadius) {
      // Calculate angle
      const angle = Math.atan2(dy, dx);
      const adjustedAngle = angle < -Math.PI / 2 ? angle + 2 * Math.PI : angle;
      const normalizedAngle = adjustedAngle + Math.PI / 2;
      
      // Find which slice was clicked
      const total = this.receivedChartData.reduce((sum, item) => sum + (item.jobsCount || 0) + (item.faulty || 0), 0);
      let currentAngle = 0;
      let clickedIndex = -1;
      
      for (let i = 0; i < this.receivedChartData.length; i++) {
        const item = this.receivedChartData[i];
        const itemTotal = (item.jobsCount || 0) + (item.faulty || 0);
        const sliceAngle = (itemTotal / total) * 2 * Math.PI;
        
        if (normalizedAngle >= currentAngle && normalizedAngle <= currentAngle + sliceAngle) {
          clickedIndex = i;
          break;
        }
        
        currentAngle += sliceAngle;
      }
      
      // Handle click
      if (clickedIndex !== -1) {
        this.clickedReceivedSliceIndex = clickedIndex === this.clickedReceivedSliceIndex ? -1 : clickedIndex;
        this.renderReceivedPieChart();
        
        // Optional: Add click action here (e.g., drill down, show details)
      }
    }
  }

  private animateReceivedSliceHover(sliceIndex: number): void {
    if (sliceIndex === -1) return;
    
    const targetScale = 1.1;
    const currentScale = this.receivedSliceHoverScale[sliceIndex] || 1;
    
    const animate = () => {
      const diff = targetScale - currentScale;
      if (Math.abs(diff) > 0.01) {
        this.receivedSliceHoverScale[sliceIndex] = currentScale + (diff * 0.2);
        requestAnimationFrame(animate);
      } else {
        this.receivedSliceHoverScale[sliceIndex] = targetScale;
      }
    };
    
    animate();
  }

  private resetReceivedSliceAnimations(): void {
    Object.keys(this.receivedSliceHoverScale).forEach(key => {
      const index = parseInt(key);
      const currentScale = this.receivedSliceHoverScale[index];
      
      if (currentScale && currentScale > 1) {
        const animate = () => {
          const diff = 1 - currentScale;
          if (Math.abs(diff) > 0.01) {
            this.receivedSliceHoverScale[index] = currentScale + (diff * 0.2);
            requestAnimationFrame(animate);
          } else {
            this.receivedSliceHoverScale[index] = 1;
          }
        };
        
        animate();
      }
    });
  }
}