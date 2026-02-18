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
  jobNumber: string;
  assignedEngineer: string;
  status: string;
  location: string;
  workType: string;
  projectedDate: string | null;
  createdOn: string | null;
  description: string;
  customer: string;
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