import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { AuthService } from '../../../modules/auth';
import { ReportService } from '../../../core/services/report.service';
import { 
  DCGEmployeeDto, 
  OfficeStateAssignmentDto, 
  CreateDCGEmployeeDto,
  UpdateDCGEmployeeDto,
  CreateOfficeStateAssignmentDto,
  UpdateOfficeStateAssignmentDto
} from '../../../core/model/dcg-employee.model';
import { DcgEmployeeService } from '../../../core/services/dcg-employee.service';
import { EmployeeDepartmentResponse } from '../../../core/model/test-engineer-jobs.model';

// Local enums and constants to avoid import issues
enum GridType {
  Employee = 'E',
  Inventory = 'I'
}

interface EmployeeSortOption {
  value: string;
  label: string;
}

const EMPLOYEE_SORT_OPTIONS: EmployeeSortOption[] = [
  { value: 'EmpNo', label: 'Employee Number' },
  { value: 'EmpID', label: 'Employee ID' },
  { value: 'EmpName', label: 'Employee Name' },
  { value: 'Department', label: 'Department' },
  { value: 'EmpStatus', label: 'Status' },
  { value: 'WindowsID', label: 'Windows ID' },
  { value: 'Email', label: 'Email' },
  { value: 'Country', label: 'Country' }
];

const OFFICE_SORT_OPTIONS: EmployeeSortOption[] = [
  { value: 'State', label: 'State' },
  { value: 'StateName', label: 'State Name' },
  { value: 'OffID', label: 'Office ID' },
  { value: 'InvUserID', label: 'Inventory User ID' },
  { value: 'SubRegion', label: 'Sub Region' }
];

@Component({
  selector: 'app-dcg-emp-details',
  templateUrl: './dcg-emp-details.component.html',
  styleUrls: ['./dcg-emp-details.component.scss']
})
export class DcgEmpDetailsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Grid Data
  employees: DCGEmployeeDto[] = [];
  officeAssignments: OfficeStateAssignmentDto[] = [];
  
  // Grid Configuration
  currentGridType: GridType = GridType.Employee;
  GridType = GridType; // Expose enum to template
  
  // Table sorting
  sortColumn: string = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Loading States
  isLoading = false;
  isSubmitting = false;
  
  // Form Configuration
  employeeForm!: FormGroup;
  officeForm!: FormGroup;
  showEmployeeForm = false;
  showOfficeForm = false;
  showPassword = false;
  editingEmployee: DCGEmployeeDto | null = null;
  editingOffice: OfficeStateAssignmentDto | null = null;
  
  // Pagination (if needed)
  currentPage = 1;
  pageSize = 100;
  totalItems = 0;
  totalPages = 0;
  paginatedEmployees: DCGEmployeeDto[] = [];
  paginatedOfficeAssignments: OfficeStateAssignmentDto[] = [];
  
  // Messages
  successMessage = '';
  errorMessage = '';
  authorizationMessage = '';
  hasPageAccess = false;
  isCheckingAuthorization = false;

  // Current date for ID badge
  currentDate = new Date().toISOString().split('T')[0].replace(/-/g, '-');
  
  // Dropdown options for office assignment editing (matching legacy)
  stateOptions: { state: string, stateName: string }[] = [];
  officeIdOptions: { empID: string, empName: string, fullDisplay: string }[] = [];
  invUserIdOptions: { empID: string, empName: string, fullDisplay: string }[] = [];
  departmentOptions: string[] = [];
  allEmployees: DCGEmployeeDto[] = []; // Store all employees for lookup
  
  // Employee Status Options
  empStatusOptions = [
    { value: 'E', label: 'E - Engineer' },
    { value: 'M', label: 'M - Manager' },
    { value: 'A', label: 'A - Accounting' },
    { value: 'C', label: 'C - Contracts' },
    { value: 'T', label: 'T - Test Engineers' },
    { value: 'P', label: 'P - Inventory' },
    { value: 'B', label: 'B - Manager & Engineer' },
    { value: 'U', label: 'U - Terminated' }
  ];
  
  // Make Math available in template
  Math = Math;
  
  // Search functionality
  searchTerm = '';

  constructor(
    private dcgEmployeeService: DcgEmployeeService,
    private fb: FormBuilder,
    private router: Router,
    private auth: AuthService,
    private reportService: ReportService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.checkPageAuthorization();
  }
  private checkPageAuthorization(): void {
    const adUserId = this.getCurrentAdUserId();

    if (!adUserId) {
      this.hasPageAccess = false;
      this.authorizationMessage = 'Unauthorized. Restricted to this page.';
      return;
    }

    this.isCheckingAuthorization = true;
    this.reportService.getTestEngineerJobsEmployeeDepartment(adUserId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isCheckingAuthorization = false)
      )
      .subscribe({
        next: (response: EmployeeDepartmentResponse) => {
          const department = (response?.data?.department || '').toLowerCase();
          this.hasPageAccess = response?.success === true && department.includes('manager');

          if (this.hasPageAccess) {
            this.authorizationMessage = '';
            this.loadData();
            this.loadDropdownData();
          } else {
            this.authorizationMessage = 'Unauthorized, your access is denied.';
          }
        },
        error: () => {
          this.hasPageAccess = false;
          this.authorizationMessage = 'Unauthorized, your access is denied.';
        }
      });
  }

  private getCurrentAdUserId(): string {
    const currentUser = this.auth.currentUserValue || {};
    const userData = this.getStoredUserData();
    const rawUserId = (
      currentUser?.windowsID ||
      currentUser?.windowsId ||
      currentUser?.username ||
      currentUser?.userName ||
      userData?.windowsID ||
      userData?.windowsId ||
      userData?.username ||
      userData?.userName ||
      ''
    ).toString();

    return this.normalizeAdUserId(rawUserId);
  }

  private getStoredUserData(): any {
    try {
      return JSON.parse(localStorage.getItem('userData') || '{}');
    } catch {
      return {};
    }
  }

  private normalizeAdUserId(value: string): string {
    const trimmedValue = (value || '').trim();
    if (!trimmedValue) {
      return '';
    }

    if (trimmedValue.includes('\\')) {
      const segments = trimmedValue.split('\\');
      return (segments[segments.length - 1] || '').trim();
    }

    if (trimmedValue.includes('@')) {
      return (trimmedValue.split('@')[0] || '').trim();
    }

    return trimmedValue;
  }


  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.employeeForm = this.fb.group({
      empNo: [0],
      empID: ['', [Validators.required, Validators.maxLength(20)]],
      empName: ['', [Validators.required, Validators.maxLength(100)]],
      department: ['', [Validators.required, Validators.maxLength(100)]],
      empStatus: ['', [Validators.required, Validators.maxLength(50)]],
      windowsID: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
      password: ['', [Validators.minLength(6), Validators.maxLength(100)]]
    });

    this.officeForm = this.fb.group({
      state: ['', [Validators.required]],
      stateName: ['', [Validators.required]],
      offID: ['', [Validators.required]],
      invUserID: ['', [Validators.required]]
    });
  }

  // Grid Type Switching
  switchGrid(gridType: GridType): void {
    if (this.currentGridType === gridType) return;
    
    this.currentGridType = gridType;
    this.currentPage = 1;
    this.sortColumn = ''; // Reset sorting when switching grids
    this.sortDirection = 'asc';
    this.resetForms();
    this.clearMessages();
    this.loadData();
  }

  // Data Loading
  loadData(): void {
    this.isLoading = true;
    this.clearMessages();
    
    // Use current sort column if available, otherwise use defaults
    const sortBy = this.sortColumn || (this.currentGridType === GridType.Employee ? 'EmpName' : 'State');

    this.dcgEmployeeService.getDCGEmpDetails(this.currentGridType, sortBy)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.employees = response.data.employees || [];
            this.officeAssignments = response.data.officeAssignments || [];

            if (this.currentGridType === GridType.Employee && this.employees.length > 0) {
              this.updateDepartmentOptions(this.employees);
            }

            this.totalItems = this.currentGridType === GridType.Employee ? 
              response.data.employeeCount : 
              response.data.assignmentCount;
            
            // Apply client-side sorting if we have a sort column and direction
            if (this.sortColumn) {
              this.applySorting();
            }
            
            this.updatePagination();
          } else {
            this.showError(response.message || 'Failed to load data');
          }
        },
        error: (error) => {
          this.showError('An error occurred while loading data');
          console.error('Error loading DCG employee details:', error);
        }
      });
  }
  // Load dropdown data for office assignment editing
  private loadDropdownData(): void {
    // Load state options from office assignments  
    this.dcgEmployeeService.getOfficeStateAssignments('State')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            // Get distinct states with their names
            const uniqueStates = response.data.reduce((acc, curr) => {
              const existing = acc.find(item => item.state === curr.state);
              if (!existing) {
                acc.push({ state: curr.state, stateName: curr.stateName });
              }
              return acc;
            }, [] as { state: string, stateName: string }[]);
            
            this.stateOptions = uniqueStates.sort((a, b) => a.stateName.localeCompare(b.stateName));
          }
        },
        error: (error) => {
          console.error('Error loading state options:', error);
        }
      });
    
    // Load employee options for offID (Managers) and invUserID (All employees)
    this.dcgEmployeeService.getDCGEmployees('EmpName')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            const employees = response.data || [];
            
            // Store all employees for lookup
            this.allEmployees = employees;
            this.updateDepartmentOptions(employees);
            
            // Filter managers for Office ID dropdown - EMPSTATUS='M' only
            const managerMap = new Map();
            employees
              .filter((emp: DCGEmployeeDto) => emp.empStatus === 'M')
              .forEach((emp: DCGEmployeeDto) => {
                if (!managerMap.has(emp.empID)) {
                  managerMap.set(emp.empID, {
                    empID: emp.empID,
                    empName: emp.empName,
                    fullDisplay: `${emp.empID} - ${emp.empName}`
                  });
                }
              });
            
            this.officeIdOptions = Array.from(managerMap.values())
              .sort((a: any, b: any) => a.empName.localeCompare(b.empName));
            
            // Filter for Inventory User ID dropdown - EMPSTATUS='P' (Parts) only
            const inventoryMap = new Map();
            employees
              .filter((emp: DCGEmployeeDto) => emp.empStatus === 'P')
              .forEach((emp: DCGEmployeeDto) => {
                if (!inventoryMap.has(emp.empID)) {
                  inventoryMap.set(emp.empID, {
                    empID: emp.empID,
                    empName: emp.empName,
                    fullDisplay: `${emp.empID} - ${emp.empName}`
                  });
                }
              });
            
            this.invUserIdOptions = Array.from(inventoryMap.values())
              .sort((a: any, b: any) => a.empName.localeCompare(b.empName));
          }
        },
        error: (error) => {
          console.error('Error loading employee options:', error);
        }
      });
  }

  // Table Sorting
  sortTable(column: string): void {
    if (this.sortColumn === column) {
      // Toggle sort direction if same column
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New column, default to ascending
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    
    this.applySorting();
    this.currentPage = 1;
    this.updatePagination();
  }

  private applySorting(): void {
    const currentData = this.isEmployeeGrid ? this.employees : this.officeAssignments;
    
    currentData.sort((a: any, b: any) => {
      const aValue = this.getColumnValue(a, this.sortColumn);
      const bValue = this.getColumnValue(b, this.sortColumn);
      
      let comparison = 0;
      if (aValue < bValue) comparison = -1;
      if (aValue > bValue) comparison = 1;
      
      return this.sortDirection === 'desc' ? -comparison : comparison;
    });
  }

  private getColumnValue(item: any, column: string): any {
    const value = item[column];
    if (typeof value === 'string') {
      return value.toLowerCase();
    }
    return value || '';
  }

  sortIcon(column: string): string {
    if (this.sortColumn !== column) return 'bi-arrow-down-up';
    return this.sortDirection === 'asc' ? 'bi-sort-up' : 'bi-sort-down';
  }

  // State/StateName synchronization (matching legacy behavior)
  onStateChange(): void {
    const selectedState = this.officeForm.get('state')?.value;
    if (selectedState) {
      const stateOption = this.stateOptions.find(opt => opt.state === selectedState);
      if (stateOption) {
        this.officeForm.patchValue({
          stateName: stateOption.stateName
        });
      }
    }
  }

  onStateNameChange(): void {
    const selectedStateName = this.officeForm.get('stateName')?.value;
    if (selectedStateName) {
      const stateOption = this.stateOptions.find(opt => opt.stateName === selectedStateName);
      if (stateOption) {
        this.officeForm.patchValue({
          state: stateOption.state
        });
      }
    }
  }

  getSortClass(column: string): string {
    if (this.sortColumn === column) {
      return this.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc';
    }
    return '';
  }

  // Search Functionality
  applySearchFilter(): void {
    this.currentPage = 1;
    this.updatePagination();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.applySearchFilter();
  }

  performSearch(): void {
    this.applySearch();
    this.applySearchFilter();
  }

  private applySearch(): void {
    const searchLower = this.searchTerm.toLowerCase().trim();
    
    if (this.currentGridType === GridType.Employee) {
      this.paginatedEmployees = searchLower 
        ? this.employees.filter(emp => 
            emp.empID?.toLowerCase().includes(searchLower) ||
            emp.empName?.toLowerCase().includes(searchLower) ||
            emp.department?.toLowerCase().includes(searchLower) ||
            emp.empStatus?.toLowerCase().includes(searchLower) ||
            emp.windowsID?.toLowerCase().includes(searchLower) ||
            emp.email?.toLowerCase().includes(searchLower) ||
            emp.empNo?.toString().includes(searchLower)
          )
        : this.employees;
    } else {
      this.paginatedOfficeAssignments = searchLower
        ? this.officeAssignments.filter(office => 
            office.state?.toLowerCase().includes(searchLower) ||
            office.stateName?.toLowerCase().includes(searchLower) ||
            office.offID?.toLowerCase().includes(searchLower) ||
            office.invUserID?.toLowerCase().includes(searchLower) ||
            office.subRegion?.toLowerCase().includes(searchLower)
          )
        : this.officeAssignments;
    }
    
    // Update total items count for filtered results
    this.totalItems = this.currentGridType === GridType.Employee 
      ? this.paginatedEmployees.length 
      : this.paginatedOfficeAssignments.length;
  }

  // Employee Operations
  showAddEmployee(): void {
    this.editingEmployee = null;
    this.employeeForm.reset();
    this.employeeForm.patchValue({ empNo: 0 });
    this.showPassword = false;
    this.configurePasswordValidationForCreate();
    this.ensureDepartmentOption('');
    this.showEmployeeForm = true;
    this.clearMessages();
  }

  editEmployee(employee: DCGEmployeeDto): void {
    this.editingEmployee = employee;
    this.showPassword = false;
    this.configurePasswordValidationForEdit();
    
    // Ensure current empStatus is in dropdown options if not already present
    const currentStatus = (employee.empStatus || '').trim();
    const currentDepartment = (employee.department || '').trim();
    if (currentStatus && !this.empStatusOptions.find(opt => opt.value === currentStatus)) {
      this.empStatusOptions.push({ value: currentStatus, label: currentStatus });
    }
    this.ensureDepartmentOption(currentDepartment);
    
    // Ensure all fields have proper values before patching and trim whitespace
    const patchData = {
      empNo: employee.empNo || 0,
      empID: (employee.empID || '').trim(),
      empName: (employee.empName || '').trim(),
      department: currentDepartment,
      empStatus: currentStatus,
      windowsID: (employee.windowsID || '').trim(),
      email: (employee.email || '').trim(),
      password: this.getEmployeePasswordValue(employee)
    };
    
    this.employeeForm.patchValue(patchData);
    this.employeeForm.updateValueAndValidity();
    
    this.showEmployeeForm = true;
    this.clearMessages();
  }

  private getEmployeePasswordValue(employee: DCGEmployeeDto): string {
    const rawEmployee = employee as any;
    return (
      rawEmployee?.password ||
      rawEmployee?.Password ||
      rawEmployee?.pwd ||
      rawEmployee?.Pwd ||
      ''
    ).toString().trim();
  }

  saveEmployee(): void {
    if (this.employeeForm.invalid) {
      this.markFormGroupTouched(this.employeeForm);
      return;
    }

    const formData = this.employeeForm.value;

    if (!this.editingEmployee) {
      const newPassword = (formData.password || '').trim();
      if (!newPassword) {
        this.employeeForm.get('password')?.setErrors({ required: true });
        this.employeeForm.get('password')?.markAsTouched();
        this.showError('Password is required for new employee');
        return;
      }
    }

    this.isSubmitting = true;

    if (this.editingEmployee) {
      // Update existing employee - trim all string fields
      const updateData: UpdateDCGEmployeeDto = {
        empNo: formData.empNo!,
        empID: (formData.empID || '').trim(),
        empName: (formData.empName || '').trim(),
        department: (formData.department || '').trim(),
        empStatus: (formData.empStatus || '').trim(),
        windowsID: (formData.windowsID || '').trim(),
        email: (formData.email || '').trim(),
        password: (formData.password || '').trim() || undefined
      };

      this.dcgEmployeeService.updateDCGEmployee(updateData.empNo, updateData)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isSubmitting = false)
        )
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.showSuccess('Employee updated successfully');
              this.hideEmployeeModal();
              this.loadData();
            } else {
              this.showError(response.message || 'Failed to update employee');
            }
          },
          error: (error) => {
            this.showError('An error occurred while updating employee');
            console.error('Error updating employee:', error);
          }
        });
    } else {
      // Create new employee - trim all string fields
      const createData: CreateDCGEmployeeDto = {
        empID: (formData.empID || '').trim(),
        empName: (formData.empName || '').trim(),
        department: (formData.department || '').trim(),
        empStatus: (formData.empStatus || '').trim(),
        windowsID: (formData.windowsID || '').trim(),
        email: (formData.email || '').trim(),
        password: (formData.password || '').trim()
      };

      this.dcgEmployeeService.createDCGEmployee(createData)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isSubmitting = false)
        )
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.showSuccess('Employee created successfully');
              this.hideEmployeeModal();
              this.loadData();
            } else {
              this.showError(response.message || 'Failed to create employee');
            }
          },
          error: (error) => {
            this.showError('An error occurred while creating employee');
            console.error('Error creating employee:', error);
          }
        });
    }
  }

  deleteEmployee(employee: DCGEmployeeDto): void {
    if (!confirm(`Are you sure you want to delete employee "${employee.empName}"?`)) {
      return;
    }

    this.isLoading = true;
    this.dcgEmployeeService.deleteDCGEmployee(employee.empNo)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Employee deleted successfully');
            this.loadData();
          } else {
            this.showError(response.message || 'Failed to delete employee');
          }
        },
        error: (error) => {
          this.showError('An error occurred while deleting employee');
          console.error('Error deleting employee:', error);
        }
      });
  }

  // Office Assignment Operations
  showAddOfficeAssignment(): void {
    this.editingOffice = null;
    this.officeForm.reset();
    this.showOfficeForm = true;
    this.clearMessages();
  }

 editOfficeAssignment(office: OfficeStateAssignmentDto): void {
  this.editingOffice = office;
  
  const currentOffID = (office.offID || '').trim();
  const currentInvUserID = (office.invUserID || '').trim();
  
  // Ensure current values are in dropdown options if not already present
  if (currentOffID && !this.officeIdOptions.find(opt => opt.empID.toUpperCase() === currentOffID.toUpperCase())) {
    this.officeIdOptions.unshift({ empID: currentOffID, empName: currentOffID, fullDisplay: currentOffID });
  }
  
  if (currentInvUserID && !this.invUserIdOptions.find(opt => opt.empID.toUpperCase() === currentInvUserID.toUpperCase())) {
    this.invUserIdOptions.unshift({ empID: currentInvUserID, empName: currentInvUserID, fullDisplay: currentInvUserID });
  }
  
  this.showOfficeForm = true;

  // Wait for next tick so dropdown options are rendered
  setTimeout(() => {
    this.officeForm.patchValue({
      state: (office.state || '').trim(),
      stateName: (office.stateName || '').trim(),
      offID: currentOffID,
      invUserID: currentInvUserID
    });
    
    // Force form to update validity
    this.officeForm.updateValueAndValidity();
    
    this.clearMessages();
  }, 100);
}

  saveOfficeAssignment(): void {
    if (this.officeForm.invalid) {
      this.markFormGroupTouched(this.officeForm);
      return;
    }

    this.isSubmitting = true;
    const formData = this.officeForm.value;

    if (this.editingOffice) {
      // Update existing office assignment - trim all string fields
      const updateData: UpdateOfficeStateAssignmentDto = {
        state: (formData.state || '').trim(),
        stateName: (formData.stateName || '').trim(),
        offID: (formData.offID || '').trim(),
        invUserID: (formData.invUserID || '').trim()
      };

      this.dcgEmployeeService.updateOfficeStateAssignment(updateData.state, updateData)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isSubmitting = false)
        )
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.showSuccess('Inventory region updated successfully');
              this.hideOfficeModal();
              this.loadData();
            } else {
              this.showError(response.message || 'Failed to update inventory region');
            }
          },
          error: (error) => {
            this.showError('An error occurred while updating inventory region');
            console.error('Error updating office assignment:', error);
          }
        });
    } else {
      // Create new office assignment - trim all string fields
      const createData: CreateOfficeStateAssignmentDto = {
        state: (formData.state || '').trim(),
        stateName: (formData.stateName || '').trim(),
        offID: (formData.offID || '').trim(),
        invUserID: (formData.invUserID || '').trim()
      };

      this.dcgEmployeeService.createOfficeStateAssignment(createData)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.isSubmitting = false)
        )
        .subscribe({
          next: (response) => {
            if (response.success) {
              this.showSuccess('Inventory region created successfully');
              this.hideOfficeModal();
              this.loadData();
            } else {
              this.showError(response.message || 'Failed to create inventory region');
            }
          },
          error: (error) => {
            this.showError('An error occurred while creating inventory region');
            console.error('Error creating office assignment:', error);
          }
        });
    }
  }

  deleteOfficeAssignment(office: OfficeStateAssignmentDto): void {
    if (!confirm(`Are you sure you want to delete inventory region for state "${office.state}"?`)) {
      return;
    }

    this.isLoading = true;
    this.dcgEmployeeService.deleteOfficeStateAssignment(office.state)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('Inventory region deleted successfully');
            this.loadData();
          } else {
            this.showError(response.message || 'Failed to delete inventory region');
          }
        },
        error: (error) => {
          this.showError('An error occurred while deleting inventory region');
          console.error('Error deleting office assignment:', error);
        }
      });
  }

  // Helper Methods
  hideEmployeeModal(): void {
    this.showEmployeeForm = false;
    this.showPassword = false;
    this.resetForms();
  }

  hideOfficeModal(): void {
    this.showOfficeForm = false;
    this.resetForms();
  }

  private resetForms(): void {
    this.employeeForm.reset();
    this.officeForm.reset();
    this.configurePasswordValidationForEdit();
    this.editingEmployee = null;
    this.editingOffice = null;
  }

  private configurePasswordValidationForCreate(): void {
    const passwordControl = this.employeeForm.get('password');
    if (!passwordControl) return;

    passwordControl.setValidators([
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(100)
    ]);
    passwordControl.updateValueAndValidity({ emitEvent: false });
  }

  private configurePasswordValidationForEdit(): void {
    const passwordControl = this.employeeForm.get('password');
    if (!passwordControl) return;

    passwordControl.setValidators([
      Validators.minLength(6),
      Validators.maxLength(100)
    ]);
    passwordControl.updateValueAndValidity({ emitEvent: false });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private getFormErrors(formGroup: FormGroup): any {
    let formErrors: any = {};
    Object.keys(formGroup.controls).forEach(key => {
      const controlErrors = formGroup.get(key)?.errors;
      if (controlErrors) {
        formErrors[key] = controlErrors;
      }
    });
    return formErrors;
  }

  private isValidEmail(email: string): boolean {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => this.successMessage = '', 5000);
  }

  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => this.errorMessage = '', 5000);
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private updateDepartmentOptions(employees: DCGEmployeeDto[]): void {
    const departments = employees
      .map(emp => (emp.department || '').trim())
      .filter((department, index, array) => !!department && array.indexOf(department) === index)
      .sort((a, b) => a.localeCompare(b));

    this.departmentOptions = departments;
  }

  private ensureDepartmentOption(department: string): void {
    const trimmedDepartment = (department || '').trim();
    if (!trimmedDepartment) {
      return;
    }

    if (!this.departmentOptions.includes(trimmedDepartment)) {
      this.departmentOptions = [...this.departmentOptions, trimmedDepartment]
        .sort((a, b) => a.localeCompare(b));
    }
  }

  // Form Validation Helpers
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    const fieldLabels: Record<string, string> = {
      empID: 'Employee ID',
      empName: 'Employee Name',
      department: 'Department',
      empStatus: 'Status',
      windowsID: 'Windows ID',
      email: 'Email',
      password: 'Password',
      state: 'State',
      stateName: 'State Name',
      offID: 'Office ID',
      invUserID: 'Inventory User ID'
    };

    if (field?.errors) {
      const label = fieldLabels[fieldName] || fieldName;
      if (field.errors['required']) return `${label} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['minlength']) return `${label} must be at least 6 characters`;
      if (field.errors['maxlength']) return `${label} is too long`;
    }
    return '';
  }

  // Getters for template
  get isEmployeeGrid(): boolean {
    return this.currentGridType === GridType.Employee;
  }

  get isOfficeGrid(): boolean {
    return this.currentGridType === GridType.Inventory;
  }

  get currentData(): (DCGEmployeeDto | OfficeStateAssignmentDto)[] {
    return this.isEmployeeGrid ? this.employees : this.officeAssignments;
  }

  get modalTitle(): string {
    if (this.isEmployeeGrid) {
      return this.editingEmployee ? 'Edit Employee' : 'Add Employee';
    } else {
      return this.editingOffice ? 'Edit Inventory Region' : 'Add Inventory Region';
    }
  }

  // Search functionality
  onSearchChange(): void {
    this.applySearch();
    this.applySearchFilter();
  }

  // Filter badge styling
  getFilterBadgeClass(): string {
    if (this.totalItems === 0) return 'badge-secondary';
    if (this.totalItems < 10) return 'badge-warning';
    return 'badge-success';
  }

  // Navigation helper
  goBack(): void {
    // Navigate back to previous page or reports dashboard
    this.router?.navigate(['/reports']) || window.history.back();
  }

  // Status badge class helper
  getStatusBadgeClass(status: string): string {
    if (!status) return 'status-default';
    return 'status-' + status.toLowerCase().replace(/\s+/g, '-');
  }
  
  // Get full status label for display
  getStatusLabel(statusCode: string): string {
    if (!statusCode) return 'N/A';
    const status = this.empStatusOptions.find(s => s.value === statusCode.trim());
    return status ? status.label : statusCode; // Return code if not found in predefined list
  }
  
  // Get employee name by ID for Office ID display
  getOfficeIdLabel(offID: string): string {
    if (!offID) return 'N/A';
    const employee = this.officeIdOptions.find(emp => emp.empID === offID.trim());
    return employee ? employee.empName : offID;
  }
  
  // Get employee name by ID for Inventory User ID display
  getInvUserIdLabel(invUserID: string): string {
    if (!invUserID) return 'N/A';
    const employee = this.invUserIdOptions.find(emp => emp.empID === invUserID.trim());
    return employee ? employee.empName : invUserID;
  }
  
  // Get status options including current value if not in predefined list (for editing)
  get currentEmpStatusOptions() {
    return this.empStatusOptions;
  }
  
  // Get officeId options including current value if not in predefined list (for editing)
  get currentOfficeIdOptions() {
    return this.officeIdOptions;
  }
  
  // Get invUserId options including current value if not in predefined list (for editing)
  get currentInvUserIdOptions() {
    return this.invUserIdOptions;
  }
// Compare function for dropdown value matching
compareByValue(o1: any, o2: any): boolean {
  return String(o1).trim() === String(o2).trim();
}

  // Pagination methods
  updatePagination(): void {
    // First apply search filter
    this.applySearch();
    
    // Then calculate pagination based on filtered results
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    
    if (this.isEmployeeGrid) {
      // Apply pagination to already filtered results
      const filteredData = this.paginatedEmployees;
      this.paginatedEmployees = filteredData.slice(startIndex, endIndex);
    } else {
      // Apply pagination to already filtered results
      const filteredData = this.paginatedOfficeAssignments;
      this.paginatedOfficeAssignments = filteredData.slice(startIndex, endIndex);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  changePageSize(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage = 1;
    this.updatePagination();
  }

  getTotalPages(): number {
    return this.totalPages;
  }

  get startRecord(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endRecord(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }

  // TrackBy function for ngFor performance
  trackByEmpID(index: number, item: any): string {
    return item?.empID || index;
  }
}