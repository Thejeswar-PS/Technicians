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
  jobType: string;
  priority: string;
  archive: boolean;
  make: string;
  model: string;
}

export interface MakeModelDto {
  make: string;
}

export interface PartsTestStatusResponse {
  partsTestData: PartsTestStatusDto[];
  distinctMakes: MakeModelDto[];
  distinctModels: MakeModelDto[];
}

export interface PartsTestStatusApiResponse {
  success: boolean;
  data: PartsTestStatusResponse;
  totalRecords: number;
  filters?: PartsTestStatusRequest;
  message?: string;
  error?: string;
}

export interface DistinctMakesResponse {
  success: boolean;
  makes: MakeModelDto[];
  count: number;
  message?: string;
  error?: string;
}

export interface DistinctModelsResponse {
  success: boolean;
  models: MakeModelDto[];
  count: number;
  message?: string;
  error?: string;
}

export interface DistinctModelsByMakeResponse {
  success: boolean;
  make: string;
  models: MakeModelDto[];
  count: number;
  message?: string;
  error?: string;
}