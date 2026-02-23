// Test Engineer Jobs Entry Models

export interface TestEngineerJobEntry {
  id?: number;
  jobNumber?: string;
  serialNo: string;
  assignedEngineer: string;
  location: string;
  workType: string;
  emergencyETA?: string;
  status: string;
  projectedDate: string;
  completedDate?: string;
  qcCleaned: boolean;
  qcTorque: boolean;
  qcInspected: boolean;
  descriptionNotes?: string;
  createdDate?: string;
  createdBy?: string;
  modifiedDate?: string;
  modifiedBy?: string;
}

export interface TestEngineerJobEntryResponse {
  success: boolean;
  message: string;
  data?: TestEngineerJobEntry;
  errors?: string[];
}

export interface TestEngineerJobEntriesResponse {
  success: boolean;
  message: string;
  data?: TestEngineerJobEntry[];
  totalCount?: number;
  errors?: string[];
}

// DTOs for API communication
export interface CreateTestEngineerJobEntryDto {
  serialNo: string;
  assignedEngineer: string;
  location: string;
  workType: string;
  emergencyETA?: string;
  status: string;
  projectedDate: string;
  completedDate?: string;
  qcCleaned: boolean;
  qcTorque: boolean;
  qcInspected: boolean;
  descriptionNotes?: string;
}

export interface UpdateTestEngineerJobEntryDto extends CreateTestEngineerJobEntryDto {
  id: number;
}

// Select Options
export interface SelectOption {
  value: string;
  label: string;
}

export interface EngineerOption {
  empName: string;
  empId?: string;
}