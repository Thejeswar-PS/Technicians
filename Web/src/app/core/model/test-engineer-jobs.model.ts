// TestEngineerJobs Models

export interface TestEngineerJobsRequestDto {
  engineer: string;
  status: string;
  location: string;
  search: string;
  sortColumn: string;
  sortDirection: string;
}

export interface TestEngineerJobDto {
  rowID?: number;
  serialNo: string;
  jobNumber: string;
  assignedEngineer: string;
  status: string;
  location: string;
  workType: string;
  projectedDate: string | null;
  completedDate: string | null;
  emergencyETA: string | null;
  createdOn: string | null;
  description: string;
  customer: string;
  qC_Cleaned: boolean;
  qC_Torque: boolean;
  qC_Inspected: boolean;
  isOverdue: boolean;
  isEmergency: boolean;
}

export interface TestEngineerJobsResponse {
  success: boolean;
  message: string;
  data: TestEngineerJobDto[];
  totalRecords: number;
}

export interface EngineerDto {
  empName: string;
}

export interface EngineerChartDto {
  engineer: string;
  status: string;
  count: number;
}

export interface StatusChartDto {
  status: string;
  count: number;
}

export interface TestEngineerJobsChartsResponse {
  engineerData: EngineerChartDto[];
  statusData: StatusChartDto[];
}

export interface EngineersResponse {
  success: boolean;
  engineers: EngineerDto[];
}

export interface ChartDataResponse {
  success: boolean;
  data: TestEngineerJobsChartsResponse;
}

// Entry-specific models
export interface SaveUpdateTestEngineerJobsDto {
  rowID: number;
  jobNumber: string;
  workType: string;
  emergencyETA?: string | null;
  assignedEngineer: string;
  location: string;
  projectedDate?: string | null;
  completedDate?: string | null;
  descriptionNotes: string;
  status: string;
  qcCleaned: boolean;
  qcTorque: boolean;
  qcInspected: boolean;
  createdBy: string;
  modifiedBy: string;
}

export interface TestEngineerJobsEntryDto {
  rowID: number;
  jobNumber: string;
  workType: string;
  assignedEngineer: string;
  status: string;
  projectedDate?: string | null;
  completedDate?: string | null;
  emergencyETA?: string | null;
  descriptionNotes: string;
  location: string;
  qC_Cleaned: boolean;
  qC_Torque: boolean;
  qC_Inspected: boolean;
  createdOn?: string | null;
  modifiedOn?: string | null;
  createdBy: string;
  modifiedBy: string;
}

export interface TestEngineerJobsEntryResponse {
  success: boolean;
  message: string;
  data?: TestEngineerJobsEntryDto;
}

export interface NextRowIdResponse {
  success: boolean;
  message: string;
  nextRowId: number;
}