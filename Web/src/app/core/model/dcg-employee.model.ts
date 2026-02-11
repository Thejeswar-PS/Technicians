// DCG Employee Models matching the backend DTOs

export interface DCGEmployeeDto {
  empNo: number;
  empID: string;
  empName: string;
  empStatus: string;
  windowsID: string;
  email: string;
  country: string;
}

export interface OfficeStateAssignmentDto {
  state: string;
  stateName: string;
  offID: string;
  invUserID: string;
  subRegion: string;
}

export interface CreateDCGEmployeeDto {
  empID: string;
  empName: string;
  empStatus: string;
  windowsID: string;
  email: string;
}

export interface UpdateDCGEmployeeDto {
  empNo: number;
  empID: string;
  empName: string;
  empStatus: string;
  windowsID: string;
  email: string;
}

export interface CreateOfficeStateAssignmentDto {
  state: string;
  stateName: string;
  offID: string;
  invUserID: string;
}

export interface UpdateOfficeStateAssignmentDto {
  state: string;
  stateName: string;
  offID: string;
  invUserID: string;
}

export interface DCGEmpDetailsResponse {
  employees: DCGEmployeeDto[];
  officeAssignments: OfficeStateAssignmentDto[];
  employeeCount: number;
  assignmentCount: number;
  sortBy: string;
  gridType: string; // 'E' for Employee, 'I' for Inventory/Assignments
}

export interface DCGApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}

// Grid Type Constants
export enum GridType {
  Employee = 'E',
  Inventory = 'I'
}

// Sort Column Options for Employee Grid
export interface EmployeeSortOption {
  value: string;
  label: string;
}

export const EMPLOYEE_SORT_OPTIONS: EmployeeSortOption[] = [
  { value: 'EmpNo', label: 'Employee Number' },
  { value: 'EmpID', label: 'Employee ID' },
  { value: 'EmpName', label: 'Employee Name' },
  { value: 'EmpStatus', label: 'Status' },
  { value: 'WindowsID', label: 'Windows ID' },
  { value: 'Email', label: 'Email' },
  { value: 'Country', label: 'Country' }
];

// Sort Column Options for Office Assignment Grid
export const OFFICE_SORT_OPTIONS: EmployeeSortOption[] = [
  { value: 'State', label: 'State' },
  { value: 'StateName', label: 'State Name' },
  { value: 'OffID', label: 'Office ID' },
  { value: 'InvUserID', label: 'Inventory User ID' },
  { value: 'SubRegion', label: 'Sub Region' }
];

// Form validation interfaces
export interface DCGEmployeeFormData extends CreateDCGEmployeeDto {
  isEditing?: boolean;
  empNo?: number;
}

export interface OfficeStateAssignmentFormData extends CreateOfficeStateAssignmentDto {
  isEditing?: boolean;
}