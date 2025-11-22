import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonService } from 'src/app/core/services/common.service';
import { ReportService } from 'src/app/core/services/report.service';
import { AuthService } from 'src/app/modules/auth';
import { 
  PartsRequestStatusItem, 
  PartsRequestStatusFilter, 
  PartReqStatusDto,
  PartReqStatusRequestDto,
  PartReqStatusResponseDto
} from 'src/app/core/model/parts-request-status.model';
import { AccountManager } from 'src/app/core/model/account-manager.model';
import { InventoryUser } from 'src/app/core/model/inventory-user.model';
import { EmployeeStatusDto } from 'src/app/core/model/employee-status.model';

@Component({
  selector: 'app-parts-request-status',
  templateUrl: './parts-request-status.component.html',
  styleUrls: ['./parts-request-status.component.scss']
})
export class PartsRequestStatusComponent implements OnInit {

  partsRequestList: PartsRequestStatusItem[] = [];
  partReqStatusList: PartReqStatusDto[] = [];
  accountManagers: AccountManager[] = [];
  inventoryUsers: InventoryUser[] = [];
  sortedColumn: string = '';
  sortDirection: number = 1;
  showHeaderName: boolean = false;
  isLoading: boolean = false;
  isLoadingInventoryUsers: boolean = false;
  currentUserStatus: EmployeeStatusDto | null = null;
  errorMessage: string = '';
  
  // New properties for enhanced functionality
  crashKitCount: number = 0;
  loadBankCount: number = 0;
  
  // Pagination and performance properties
  currentPage: number = 1;
  pageSize: number = 50;
  totalRecords: number = 0;
  displayedData: PartsRequestStatusItem[] = [];
  isProcessingData: boolean = false;

  partsFilterForm: FormGroup = this.fb.group({
    accountManager: ['All'],
    inventoryUser: ['ALL'],
    status: ['0']  // All Requisitions
  });

  // Legacy status options matching the ASP.NET dropdown
  statusOptions: any[] = [
    { value: '0', label: 'All Requisitions' },
    { value: '8', label: 'Initiated' },
    { value: '2', label: 'Submitted' },
    { value: '4', label: 'Needs Attention' },
    { value: '1', label: 'Staging' },
    { value: '5', label: 'Ordered-Tracking Req' },
    { value: '3', label: 'Urgent' },
    { value: '6', label: 'Shipped' },
    { value: '7', label: 'Delivered' }
  ];

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
    this.loadAccountManagers();
    this.loadInventoryUsers();
    this.determineEmployeeStatus();
    this.handleQueryParams();
    this.onFilterChanges();
    this.loadFilters();
  }

  loadAccountManagers(): void {
    // First try to load from localStorage for immediate display
    const storedManagers = localStorage.getItem("AccountManagers");
    if (storedManagers) {
      try {
        this.accountManagers = JSON.parse(storedManagers);
      } catch (e) {
        localStorage.removeItem("AccountManagers");
      }
    }

    // Always fetch fresh data from API
    this._commonService.getAccountManagers().subscribe({
      next: (data: AccountManager[]) => {
        if (data && data.length > 0) {
          this.accountManagers = data;
          // Update localStorage with fresh data
          localStorage.setItem("AccountManagers", JSON.stringify(data));
        } else {
          this.tryReportServiceFallback();
        }
      },
      error: (error) => {
        // Try the new PartReqStatus API as fallback
        this.tryReportServiceFallback();
      }
    });
  }

  private tryReportServiceFallback(): void {
    this._reportService.getAccountManagerNames().subscribe({
      next: (data: any[]) => {
        if (data && data.length > 0) {
          // Convert to AccountManager format if needed, preserving original properties
          this.accountManagers = data.map(item => ({
            // Preserve original properties from API response
            ...item,
            // Add mapped properties for consistency
            empName: item.empName || item.name || item.username || item.offname || item.offName,
            empId: item.empId || item.id || item.offid,
            OFFNAME: item.OFFNAME || item.officeName || item.offname || item.offName || item.empName || item.name,
            OFFID: item.OFFID || item.officeId || item.offid || item.empId || item.id
          }));
          // Update localStorage with fresh data
          localStorage.setItem("AccountManagers", JSON.stringify(this.accountManagers));
        } else {
          if (this.accountManagers.length === 0) {
            this.errorMessage = 'Failed to load account managers from both APIs';
            // Provide minimal fallback
            this.accountManagers = [{ empName: 'All', empId: 'All', OFFNAME: 'All', OFFID: 'All' }];
          }
        }
      },
      error: (error) => {
        if (this.accountManagers.length === 0) {
          this.errorMessage = 'Failed to load account managers from all available APIs';
          // Provide minimal fallback
          this.accountManagers = [{ empName: 'All', empId: 'All', OFFNAME: 'All', OFFID: 'All' }];
        }
      }
    });
  }

  loadInventoryUsers(): void {
    // First try to load from localStorage for immediate display
    const storedUsers = localStorage.getItem("InventoryUsers");
    if (storedUsers) {
      try {
        const parsedUsers = JSON.parse(storedUsers);
        
        // Use cached data if available
        if (parsedUsers.length > 0) {
          // Ensure 'All' option is first and no duplicates
          const allOption = { invUserID: 'All', username: 'All' };
          const filteredUsers = parsedUsers.filter((user: InventoryUser) => 
            user.invUserID !== 'All' && user.username !== 'All'
          );
          this.inventoryUsers = [allOption, ...filteredUsers];
          
          // Ensure the form has the correct default value when loading from cache
          const currentValue = this.partsFilterForm.get('inventoryUser')?.value;
          if (!currentValue || currentValue === '') {
            this.partsFilterForm.patchValue({ inventoryUser: 'ALL' });
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
        
        // Handle different response formats
        let inventoryUsers: InventoryUser[] = [];
        if (Array.isArray(data)) {
          inventoryUsers = data;
        } else if (data && data.data && Array.isArray(data.data)) {
          inventoryUsers = data.data;
        } else if (data && typeof data === 'object') {
          inventoryUsers = [];
        }
        
        if (inventoryUsers && inventoryUsers.length > 0) {
          // Always ensure 'All' option is first, avoid duplicates
          const allOption = { invUserID: 'All', username: 'All' };
          const filteredUsers = inventoryUsers.filter((user: InventoryUser) => 
            user.invUserID !== 'All' && user.username !== 'All'
          );
          this.inventoryUsers = [allOption, ...filteredUsers];
          
          // Update localStorage with fresh data
          localStorage.setItem("InventoryUsers", JSON.stringify(this.inventoryUsers));
        } else {
          if (this.inventoryUsers.length === 0) {
            this.inventoryUsers = [{ invUserID: 'All', username: 'All' }];
          }
        }

        // Ensure the form has the correct default value after loading users
        const currentValue = this.partsFilterForm.get('inventoryUser')?.value;
        if (!currentValue || currentValue === '' || !this.inventoryUsers.some(user => this.getInventoryUserValue(user) === currentValue)) {
          this.partsFilterForm.patchValue({ inventoryUser: 'ALL' });
        }
      },
      error: (error) => {
        this.isLoadingInventoryUsers = false;
        
        // If API fails and no localStorage data, provide fallback
        if (this.inventoryUsers.length === 0) {
          this.inventoryUsers = [{ invUserID: 'All', username: 'All' }];
          this.errorMessage = 'Unable to load inventory users. Please check network connection.';
        }
      }
    });
  }

  handleQueryParams(): void {
    this.route.queryParamMap.subscribe((params) => {
      if (params.has('manager')) {
        const manager = params.get('manager');
        if (manager === 'ALL' || manager === 'All') {
          this.partsFilterForm.controls['inventoryUser'].setValue('ALL');
        } else {
          this.partsFilterForm.controls['inventoryUser'].setValue(manager);
        }
        this.showHeaderName = true;
      }
      
      if (params.has('yearType')) {
        const yearType = params.get('yearType');
        this.partsFilterForm.controls['yearType'].setValue(yearType);
      }

      if (params.has('status')) {
        const status = params.get('status');
        this.partsFilterForm.controls['status'].setValue(status);
      }

      this.getPartsRequestReport();
    });
  }

  loadFilters(): void {
    const currentInventoryUser = this.partsFilterForm.get('inventoryUser')?.value;
    
    if (currentInventoryUser !== 'All') {
      return;
    }

    const userDataStr = localStorage.getItem("userData");
    
    if (userDataStr) {
      const userData = JSON.parse(userDataStr);
      
      // Wait for account managers to load if needed
      if (this.accountManagers.length === 0) {
        setTimeout(() => this.setDefaultOwnerFilter(userData), 500);
      } else {
        this.setDefaultOwnerFilter(userData);
      }
    }
  }

  private setDefaultOwnerFilter(userData: any): void {
    const userEmpID = userData.empID?.trim();
    const userEmpName = userData.empName?.trim();
    const windowsId = userData.windowsId?.trim() || userData.empName?.trim();
    
    const matchingUser = this.inventoryUsers.find((item: InventoryUser) => {
      // Legacy matching: ddlInvUser.Items[i].Value == dr["EmpID"] 
      // But legacy DataValueField = "InvUserID", so match by InvUserID
      const invUserIdMatch = item.invUserID?.trim().toLowerCase() === userEmpID?.toLowerCase() ||
                             item.invUserID?.trim().toLowerCase() === windowsId?.toLowerCase();
      
      // Fallback: match by username
      const usernameMatch = item.username?.trim().toLowerCase() === userEmpName?.toLowerCase() ||
                            item.username?.trim().toLowerCase() === windowsId?.toLowerCase();
      
      return invUserIdMatch || usernameMatch;
    });
    
    if (matchingUser) {
      // Legacy: SP expects ddlInvUser.SelectedItem.Text (username in uppercase)
      const userValue = matchingUser.username?.toUpperCase() || 'All';
      this.partsFilterForm.patchValue({
        inventoryUser: userValue
      });
    } else {
      this.partsFilterForm.patchValue({
        inventoryUser: 'All'
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

  getPartsRequestReport(): void {
    this.isLoading = true;
    this.errorMessage = '';
    const formValue = this.partsFilterForm.value;
    
    const key = parseInt(formValue.status) || 0;
    const invUserID = formValue.inventoryUser || 'All';
    const offName = formValue.accountManager || 'All';

    // Use new API structure
    const request: PartReqStatusRequestDto = {
      key: key,
      invUserID: invUserID,
      offName: offName
    };

    this._reportService.getPartReqStatus(request).subscribe({
      next: (response: PartReqStatusResponseDto) => {
        this.partReqStatusList = response.partRequests;
        this.crashKitCount = response.crashKitCount;
        this.loadBankCount = response.loadBankCount;
        
        // Convert to legacy format for compatibility
        this.partsRequestList = response.partRequests.map(item => this.convertToLegacyFormat(item));
        
        // Update pagination for large datasets
        this.currentPage = 1;
        this.updateDisplayedData();
        
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error loading parts request data';
        this.partsRequestList = [];
        this.partReqStatusList = [];
        this.isLoading = false;
        
        // Fallback to mock data for development/testing
        this.loadMockData();
      }
    });
  }

  private convertToLegacyFormat(item: PartReqStatusDto): PartsRequestStatusItem {
    
    // Handle urgent field - could be string or object
    let urgentValue: string = '';
    if (typeof item.urgent === 'string') {
      urgentValue = item.urgent;
    } else if (typeof item.urgent === 'object' && item.urgent !== null) {
      // Handle case where urgent is an object - cast as any to access dynamic properties
      const urgentObj = item.urgent as any;
      

      
      // Try common properties that might contain the value
      if ('value' in urgentObj) {
        urgentValue = String(urgentObj.value);
      } else if ('text' in urgentObj) {
        urgentValue = String(urgentObj.text);
      } else if ('label' in urgentObj) {
        urgentValue = String(urgentObj.label);
      } else if ('name' in urgentObj) {
        urgentValue = String(urgentObj.name);
      } else {
        // Try to extract any string-like values from the object
        const keys = Object.keys(urgentObj);
        
        // Check if it's an array-like object
        if (Array.isArray(urgentObj)) {
          urgentValue = urgentObj.length > 0 ? String(urgentObj[0]) : 'No';
        } else if (keys.length > 0) {
          // Take the first available property value
          const firstKey = keys[0];
          urgentValue = String(urgentObj[firstKey]);
        } else {
          urgentValue = 'No'; // Default fallback
        }
      }
    } else if (typeof item.urgent === 'boolean') {
      urgentValue = item.urgent ? 'Yes' : 'No';
    } else {
      urgentValue = 'No'; // Default fallback
    }
    
    const converted = {
      callNumber: item.callnbr,
      customerNumber: item.custnumbr,
      customerName: item.custname,
      technician: item.technician,
      city: item.city,
      state: item.state,
      status: item.status,
      age: item.age,
      shipDate: item.ship_Date ? new Date(item.ship_Date) : null,
      reqDate: new Date(item.reqDate),
      urgent: urgentValue
    };
    
    return converted;
  }

  private loadMockData(): void {
    // Mock data for development/testing when API is not available
    this.partsRequestList = [
      {
        callNumber: 'C240001',
        customerNumber: 'CUST001',
        customerName: 'ABC Corporation',
        technician: 'John Smith',
        city: 'New York',
        state: 'NY',
        status: 'Submitted',
        age: 3,
        shipDate: new Date('2024-11-18'),
        reqDate: new Date('2024-11-25'),
        urgent: 'No'
      },
      {
        callNumber: 'C240002',
        customerNumber: 'CUST002',
        customerName: 'XYZ Industries',
        technician: 'Jane Doe',
        city: 'Los Angeles',
        state: 'CA',
        status: 'Urgent',
        age: 7,
        shipDate: null,
        reqDate: new Date('2024-11-22'),
        urgent: 'Yes'
      },
      {
        callNumber: 'C240003',
        customerNumber: 'CUST003',
        customerName: 'Tech Solutions',
        technician: 'Mike Johnson',
        city: 'Chicago',
        state: 'IL',
        status: 'Shipped',
        age: 12,
        shipDate: new Date('2024-11-20'),
        reqDate: new Date('2024-11-28'),
        urgent: 'No'
      }
    ];
    this.isLoading = false;
  }

  onFilterChanges(): void {
    this.partsFilterForm.valueChanges.subscribe((selectedValue: any) => {
      this.getPartsRequestReport();
    });
  }

  sortTable(column: string): void {
    if (this.sortedColumn === column) {
      this.sortDirection = -this.sortDirection;
    } else {
      this.sortedColumn = column;
      this.sortDirection = 1;
    }

    this.partsRequestList.sort((a: any, b: any) => {
      let aValue = a[column];
      let bValue = b[column];

      // Handle null or undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1 * this.sortDirection;
      if (bValue == null) return -1 * this.sortDirection;

      // Handle different data types for better sorting
      if (column === 'age') {
        aValue = parseInt(aValue) || 0;
        bValue = parseInt(bValue) || 0;
      } else if (column === 'reqDate' || column === 'shipDate') {
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

    // Reset to first page and update displayed data after sorting
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

  getColorByStatus(status: string | null): string {
    switch (status) {
      case 'Pending':
        return '#FFA500';
      case 'Approved':
        return '#00b300';
      case 'Rejected':
        return '#e60000';
      case 'Ordered':
        return '#008ed6';
      case 'Received':
        return '#958C02';
      case 'Delivered':
        return '#4CAF50';
      default:
        return '#808080';
    }
  }

  viewDetails(item: any): void {
    // Navigate to parts request details or implement modal
  }

  exportToExcel(): void {
    if (this.partsRequestList.length === 0) {
      return;
    }

    // Prepare data for CSV export
    const csvData = this.convertToCSV(this.partsRequestList);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Parts_Request_Status_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private convertToCSV(data: PartsRequestStatusItem[]): string {
    if (!data || data.length === 0) {
      return '';
    }

    // Define headers
    const headers = [
      'Call Number',
      'Customer Number', 
      'Customer Name',
      'Technician',
      'City',
      'State',
      'Status',
      'Age (Days)',
      'Ship Date',
      'Required Date',
      'Urgent'
    ];

    // Convert data to CSV rows
    const csvRows = data.map(item => [
      item.callNumber || '',
      item.customerNumber || '',
      item.customerName || '',
      item.technician || '',
      item.city || '',
      item.state || '',
      item.status || '',
      item.age?.toString() || '',
      item.shipDate ? new Date(item.shipDate).toLocaleDateString() : '',
      item.reqDate ? new Date(item.reqDate).toLocaleDateString() : '',
      item.urgent || ''
    ]);

    // Combine headers and data
    const allRows = [headers, ...csvRows];
    
    // Convert to CSV string
    return allRows.map(row => 
      row.map(field => {
        // Escape quotes and wrap in quotes if contains comma or quote
        if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      }).join(',')
    ).join('\n');
  }

  getStatusCount(status: string): number {
    if (status === 'CrashKit') {
      return this.crashKitCount;
    } else if (status === 'LoadBank') {
      return this.loadBankCount;
    }
    return this.partsRequestList.filter(item => item.status === status).length;
  }

  calculateAge(requestDate: Date): number {
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - new Date(requestDate).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  approveRequest(request: PartsRequestStatusItem): void {
    if (!request.callNumber) {
      return;
    }

    this.isLoading = true;
    this._reportService.approvePartsRequest(request.callNumber).subscribe({
      next: (response) => {
        request.status = 'Approved';
        // Optionally refresh the entire list
        this.getPartsRequestReport();
      },
      error: (error) => {
        this.errorMessage = 'Failed to approve request';
        this.isLoading = false;
      }
    });
  }

  rejectRequest(request: PartsRequestStatusItem, reason?: string): void {
    if (!request.callNumber) {
      return;
    }

    this.isLoading = true;
    this._reportService.rejectPartsRequest(request.callNumber, reason).subscribe({
      next: (response) => {
        request.status = 'Rejected';
        // Optionally refresh the entire list
        this.getPartsRequestReport();
      },
      error: (error) => {
        this.errorMessage = 'Failed to reject request';
        this.isLoading = false;
      }
    });
  }

  navigateToJob(jobId: string): void {
    // Navigate to job details
    this.router.navigate(['/jobs', jobId]);
  }

  getInitials(fullName: string): string {
    if (!fullName) return '';
    return fullName.split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  }

  goBack(): void {
    // Navigate back to previous page or reports dashboard
    this.router.navigate(['/reports']);
  }

  canApproveRejects(): boolean {
    // Check if current user has permission to approve/reject based on their status
    return this.currentUserStatus?.status === 'Manager' || 
           this.currentUserStatus?.status === 'Admin' || 
           this.currentUserStatus?.status === 'Supervisor';
  }

  showApprovalActions(item: PartsRequestStatusItem): boolean {
    // Show approval actions only for certain statuses and if user has permission
    const approvableStatuses = ['Submitted', 'Initiated', 'Needs Attention'];
    return this.canApproveRejects() && approvableStatuses.includes(item.status);
  }

  refreshData(): void {
    this.getPartsRequestReport();
  }

  clearFilters(): void {
    this.partsFilterForm.patchValue({
      accountManager: 'All',
      inventoryUser: 'All',
      status: '0'
    });
    
    // Reset pagination
    this.currentPage = 1;
  }

  getManagerDisplayName(manager: AccountManager): string {
    // Try multiple property variations to handle different API response formats
    const displayName = manager.empName || 
                       manager.OFFNAME || 
                       (manager as any).offname || 
                       (manager as any).offName || 
                       (manager as any).name || 
                       (manager as any).managerName || 
                       (manager as any).username ||
                       'Unknown Manager';
    return displayName;
  }

  getManagerValue(manager: AccountManager): string {
    return manager.OFFNAME || 
           (manager as any).offname || 
           (manager as any).offName || 
           '';
  }

  getInventoryUserDisplayName(user: InventoryUser): string {
    return user.username || 'Unknown User';
  }

  getInventoryUserValue(user: InventoryUser): string {
    return user.username?.toUpperCase() || '';
  }

  getStatusBadgeClass(status: string): string {
    if (!status) return 'status-default';
    return 'status-' + status.toLowerCase().replace(/\s+/g, '-');
  }

  getSelectedStatusLabel(): string {
    const selectedValue = this.partsFilterForm.get('status')?.value;
    if (!selectedValue || selectedValue === 'All' || selectedValue === '0') {
      return 'All Requisitions';
    }
    
    const selectedOption = this.statusOptions.find(option => option.value === selectedValue);
    return selectedOption ? selectedOption.label : 'All Requisitions';
  }

  getFilterBadgeClass(): string {
    const selectedValue = this.partsFilterForm.get('status')?.value;
    
    // Map form values to status classes
    const statusClassMap: { [key: string]: string } = {
      '0': 'badge bg-primary',
      '1': 'badge bg-success', 
      '2': 'badge bg-danger',
      '3': 'badge bg-warning',
      '4': 'badge bg-danger',
      '5': 'badge bg-info',
      '6': 'badge bg-success',
      '7': 'badge bg-success',
      '8': 'badge bg-warning'
    };
    
    return statusClassMap[selectedValue] || 'badge bg-primary';
  }

  // Pagination methods
  updateDisplayedData(): void {
    this.isProcessingData = true;
    this.totalRecords = this.partsRequestList.length;
    
    // Use setTimeout to prevent UI blocking for large datasets
    setTimeout(() => {
      const startIndex = (this.currentPage - 1) * this.pageSize;
      const endIndex = Math.min(startIndex + this.pageSize, this.totalRecords);
      this.displayedData = this.partsRequestList.slice(startIndex, endIndex);
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

  getStatusRowStyle(status: string): { [key: string]: string } {
    const styles: { [key: string]: string } = {};
    
    switch (status) {
      case 'Shipped':
      case 'Delivered':
        styles['background-color'] = '#00e47b !important';
        break;
      case 'Needs Attention':
        styles['background-color'] = '#FF6577 !important';
        styles['color'] = 'white !important';
        break;
      case 'Staging':
        styles['background-color'] = '#C6EFCE !important';
        break;
      case 'OrderedTrackingReq':
      case 'Ordered-Tracking Req':
        styles['background-color'] = '#ff00bf !important';
        styles['color'] = 'white !important';
        break;
      case 'InAssembly':
        styles['background-color'] = '#FFC7CE !important';
        break;
      case 'Initiated':
        styles['background-color'] = '#FFEB9C !important';
        break;
      case 'Submitted':
        styles['background-color'] = '#FF6577 !important';
        styles['color'] = 'white !important';
        break;
      default:
        styles['background-color'] = '#80ff00 !important';
        break;
    }
    
    return styles;
  }

  getStatusRowClass(status: string): string {
    switch (status) {
      case 'Shipped':
      case 'Delivered':
        return 'status-shipped';
      case 'Needs Attention':
        return 'status-needs-attention';
      case 'Staging':
        return 'status-staging';
      case 'OrderedTrackingReq':
      case 'Ordered-Tracking Req':
        return 'status-ordered-tracking';
      case 'InAssembly':
        return 'status-in-assembly';
      case 'Initiated':
        return 'status-initiated';
      case 'Submitted':
        return 'status-submitted';
      default:
        return 'status-default';
    }
  }

  navigateToJobParts(callNumber: string): void {
    if (callNumber && callNumber.trim() !== '') {
      this.router.navigate(['/jobs/parts'], { 
        queryParams: { callNumber: callNumber.trim() }
      });
    }
  }



}