import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
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
export class PartReturnStatusComponent implements OnInit, AfterViewInit {

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
        } else {
          this.errorMessage = response.message || 'No data found';
          this.partReturnStatusList = [];
          this.isLoading = false;
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
      this.getPartReturnStatusReport();
      
      // Reload chart when year changes
      if (selectedValue.year !== previousYear) {
        previousYear = selectedValue.year;
        this.loadPartsToBeReceivedChart();
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
    this.loadPartsReturnDataByWeekNo();
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
    this.loadPartsReturnDataByWeekNo();
  }

  getInventoryUserDisplayName(user: InventoryUser): string {
    return user.username || 'Unknown User';
  }

  getInventoryUserValue(user: InventoryUser): string {
    // Backend expects full names like "Adam Keith", "Anton Johnson"
    // Use username field which contains full names, not invUserID which has abbreviated names
    return (user.username || user.invUserID || '').trim();
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

  navigateToServiceCall(serviceCallId: string): void {
    if (serviceCallId && serviceCallId.trim() !== '') {
      this.router.navigate(['/jobs'], { 
        queryParams: { callNumber: serviceCallId.trim() }
      });
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
      if (this.chartData.length > 0) {
        this.renderCharts();
      }
    }, 100);
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
    if (this.currentChartType === 'bar') {
      this.renderBarChart();
    } else if (this.currentChartType === 'pie') {
      this.renderPieChart();
    }
  }

  private renderBarChart(): void {
    if (!this.barChartCanvas?.nativeElement || this.chartData.length === 0) return;
    
    const canvas = this.barChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
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
      
      // Value labels on bars
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px Arial';
      if (jobsHeight > 20) {
        ctx.fillText(item.jobsCount.toString(), x + (barWidth * 0.4), jobsY + 15);
      }
      if (faultyHeight > 20) {
        ctx.fillText(item.faulty.toString(), x + barWidth + (barWidth * 0.4), faultyY + 15);
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
  }

  private renderPieChart(): void {
    if (!this.pieChartCanvas?.nativeElement || this.chartData.length === 0) return;
    
    const canvas = this.pieChartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 40;
    
    const total = this.chartData.reduce((sum, item) => sum + item.jobsCount, 0);
    let currentAngle = -Math.PI / 2; // Start from top
    
    // Draw background circle
    ctx.fillStyle = '#f8f9fa';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI);
    ctx.fill();
    
    // Draw pie slices
    this.chartData.forEach((item, index) => {
      const sliceAngle = (item.jobsCount / total) * 2 * Math.PI;
      
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
      
      // Draw percentage label
      const percentage = Math.round((item.jobsCount / total) * 100);
      if (percentage > 5) { // Only show label if slice is large enough
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelX = centerX + Math.cos(labelAngle) * (radius * 0.7);
        const labelY = centerY + Math.sin(labelAngle) * (radius * 0.7);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${percentage}%`, labelX, labelY);
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
    ctx.fillText('Total', centerX, centerY - 5);
    ctx.fillText(total.toString(), centerX, centerY + 15);
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
      
      // Value labels on bars
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px Arial';
      if (unusedHeight > 15) {
        ctx.fillText(item.unUsed.toString(), x + (barWidth * 0.5), unusedY + 12);
      }
      if (faultyHeight > 15) {
        ctx.fillText(item.faulty.toString(), x + barWidth + 5 + (barWidth * 0.5), faultyY + 12);
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
}