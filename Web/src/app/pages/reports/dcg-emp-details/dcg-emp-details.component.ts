import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil, finalize } from 'rxjs';
import { 
  DCGEmployeeDto, 
  OfficeStateAssignmentDto, 
  CreateDCGEmployeeDto,
  UpdateDCGEmployeeDto,
  CreateOfficeStateAssignmentDto,
  UpdateOfficeStateAssignmentDto
} from '../../../core/model/dcg-employee.model';
import { DcgEmployeeService } from '../../../core/services/dcg-employee.service';

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

  // Current date for ID badge
  currentDate = new Date().toISOString().split('T')[0].replace(/-/g, '-');
  
  // Make Math available in template
  Math = Math;
  
  // Search functionality
  searchTerm = '';

  constructor(
    private dcgEmployeeService: DcgEmployeeService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadData();
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
      empStatus: ['', [Validators.required, Validators.maxLength(50)]],
      windowsID: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]]
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

  getSortClass(column: string): string {
    if (this.sortColumn === column) {
      return this.sortDirection === 'asc' ? 'sort-asc' : 'sort-desc';
    }
    return '';
  }

  // Employee Operations
  showAddEmployee(): void {
    this.editingEmployee = null;
    this.employeeForm.reset();
    this.employeeForm.patchValue({ empNo: 0 });
    this.showEmployeeForm = true;
    this.clearMessages();
  }

  editEmployee(employee: DCGEmployeeDto): void {
    this.editingEmployee = employee;
    this.employeeForm.patchValue(employee);
    this.showEmployeeForm = true;
    this.clearMessages();
  }

  saveEmployee(): void {
    if (this.employeeForm.invalid) {
      this.markFormGroupTouched(this.employeeForm);
      return;
    }

    this.isSubmitting = true;
    const formData = this.employeeForm.value;

    if (this.editingEmployee) {
      // Update existing employee
      const updateData: UpdateDCGEmployeeDto = {
        empNo: formData.empNo!,
        empID: formData.empID,
        empName: formData.empName,
        empStatus: formData.empStatus,
        windowsID: formData.windowsID,
        email: formData.email
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
      // Create new employee
      const createData: CreateDCGEmployeeDto = {
        empID: formData.empID,
        empName: formData.empName,
        empStatus: formData.empStatus,
        windowsID: formData.windowsID,
        email: formData.email
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
    this.officeForm.patchValue(office);
    this.showOfficeForm = true;
    this.clearMessages();
  }

  saveOfficeAssignment(): void {
    if (this.officeForm.invalid) {
      this.markFormGroupTouched(this.officeForm);
      return;
    }

    this.isSubmitting = true;
    const formData = this.officeForm.value;

    if (this.editingOffice) {
      // Update existing office assignment
      const updateData: UpdateOfficeStateAssignmentDto = {
        state: formData.state,
        stateName: formData.stateName,
        offID: formData.offID,
        invUserID: formData.invUserID
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
      // Create new office assignment
      const createData: CreateOfficeStateAssignmentDto = {
        state: formData.state,
        stateName: formData.stateName,
        offID: formData.offID,
        invUserID: formData.invUserID
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
    this.resetForms();
  }

  hideOfficeModal(): void {
    this.showOfficeForm = false;
    this.resetForms();
  }

  private resetForms(): void {
    this.employeeForm.reset();
    this.officeForm.reset();
    this.editingEmployee = null;
    this.editingOffice = null;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
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

  // Form Validation Helpers
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email address';
      if (field.errors['maxlength']) return `${fieldName} is too long`;
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
    // Implement search logic here
    this.loadData();
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

  // Pagination methods
  updatePagination(): void {
    const currentData = this.isEmployeeGrid ? this.employees : this.officeAssignments;
    this.totalItems = currentData.length;
    this.totalPages = Math.ceil(this.totalItems / this.pageSize);
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    
    if (this.isEmployeeGrid) {
      this.paginatedEmployees = this.employees.slice(startIndex, endIndex);
    } else {
      this.paginatedOfficeAssignments = this.officeAssignments.slice(startIndex, endIndex);
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

  get startRecord(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get endRecord(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalItems);
  }
}