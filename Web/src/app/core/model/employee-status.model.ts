export interface EmployeeStatusDto {
  status?: string;
  empId?: string;
  empName?: string;
  canApprove?: boolean;
}

export interface EmployeeStatusRequestDto {
  adUserID: string;
}