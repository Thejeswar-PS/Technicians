export interface PartsTestStatusDto {
  callNbr: string;
  siteID: string;
  make: string;
  model: string;
  manufPartNo: string;
  dcgPartNo: string;
  serialNo: string;
  quantity: number;
  description: string;
  priority: string;
  qcWorkStatus: string;
  assyWorkStatus: string;
  isPassed: boolean;
  assignedTo: string;
  dueDate?: Date;
  problemNotes: string;
  resolveNotes: string;
  lastModifiedBy: string;
  lastModifiedOn?: Date;
  rowIndex: number;
  createdBy: string;
  createdOn?: Date;
  uniqueID: string;
}

export interface PartsTestStatusRequest {
  jobType?: string;
  priority?: string;
  archive?: boolean;
  make?: string;
  model?: string;
  assignedTo?: string;
}

export interface PartsTestStatusResponse {
  partsTestData: PartsTestStatusDto[];
  distinctMakes: string[];
  distinctModels: string[];
}

export interface PartsTestStatusApiResponse {
  success: boolean;
  data: PartsTestStatusResponse;
  totalRecords?: number;
  filters?: PartsTestStatusRequest;
  message?: string;
  error?: string;
}

export interface PartsTestStatusAllApiResponse {
  success: boolean;
  data: PartsTestStatusDto[];
  makes: string[];
  models: string[];
  totalRecords: number;
  message?: string;
  error?: string;
}

export interface PartsTestStatusDashboardResponse {
  success: boolean;
  statusChart: PartsTestStatusStatusChartDto;
  jobTypeChart: PartsTestStatusJobTypeChartDto[];
  filters?: PartsTestStatusRequest;
  message?: string;
  error?: string;
}

export interface PartsTestStatusStatusChartDto {
  emergencyCount: number;
  overdueCount: number;
  sameDayCount: number;
  currentWeekCount: number;
}

export interface PartsTestStatusJobTypeChartDto {
  jobType: string;
  totalCount: number;
}