// Interface matching the backend PartsTestRequest
export interface PartsTestRequest {
  rowIndex: number;
  source: string;
}

// Response interface for API calls
export interface PartsTestResponse {
  success: boolean;
  tables: PartsTestTable[];
  message?: string;
  error?: string;
}

export interface PartsTestTable {
  tableName: string;
  rows: PartsTestRow[];
}

export interface PartsTestRow {
  [key: string]: any;
}

// Display interface for the component
export interface PartsTestInfo {
  id?: number;
  partNumber?: string;
  description?: string;
  quantity?: number;
  status?: string;
  testDate?: Date;
  testResult?: string;
  technician?: string;
  notes?: string;
  orderNumber?: string;
  serialNumber?: string;
  location?: string;
  vendor?: string;
  // Additional fields from SaveUpdatePartsTestDto for comprehensive editing
  jobFrom?: string;
  callNbr?: string;
  siteID?: string;
  make?: string;
  model?: string;
  manufPartNo?: string;
  dcgPartNo?: string;
  serialNo?: string;
  workType?: string;
  priority?: string;
  assignedTo?: string;
  dueDate?: Date | string; // Can be Date object or string for HTML date inputs
  kva?: string;
  voltage?: string;
  problemNotes?: string;
  resolveNotes?: string;
  rowIndex?: number;
  boardStatus?: string;
  compWorkDone?: string;
  compWorkStatus?: string;
  testWorkDone?: string;
  testWorkStatus?: string;
  completedBy?: string;
  reviewedBy?: string;
  isPassed?: boolean;
  assyWorkDone?: string;
  assyProcFollowed?: string;
  assyWorkStatus?: string;
  qcWorkDone?: string;
  qcProcFollowed?: string;
  qcApproved?: string;
  qcWorkStatus?: string;
  createdBy?: string;
  approved?: boolean;
  lastModifiedBy?: string;
}

// Filter interface for the component
export interface PartsTestFilter {
  source: 'PartsTest' | 'OrderRequest' | 'NewUniTest';
  rowIndex: number;
  searchTerm?: string;
  status?: string;
  dateFrom?: Date;
  dateTo?: Date;
}

// DTO interface for SaveUpdatePartsTestList - matches backend SaveUpdatePartsTestDto
export interface SaveUpdatePartsTestDto {
  jobFrom: string;
  callNbr: string;
  siteID: string;
  make: string;
  model: string;
  manufPartNo: string;
  dcgPartNo: string;
  serialNo: string;
  quantity: number;
  workType: string;
  description: string;
  priority: string;
  assignedTo: string;
  dueDate?: Date;
  kva: string;
  voltage: string;
  problemNotes: string;
  resolveNotes: string;
  rowIndex: number;
  boardStatus: string;
  compWorkDone: string;
  compWorkStatus: string;
  testWorkDone: string;
  testWorkStatus: string;
  completedBy: string;
  reviewedBy: string;
  isPassed: boolean;
  assyWorkDone: string;
  assyProcFollowed: string;
  assyWorkStatus: string;
  qcWorkDone: string;
  qcProcFollowed: string;
  qcApproved: string;
  qcWorkStatus: string;
  createdBy: string;
  approved: boolean;
  lastModifiedBy: string;
}

// Response interface for save/update operations
export interface SaveUpdatePartsTestResponse {
  success: boolean;
  message: string;
  rowIndex?: number;
  error?: string;
}

// Employee DTO interface matching backend EmployeeDto
export interface EmployeeDto {
  empID: string;
  empName: string;
  email: string;
  windowsID: string;
}

// Employee request interface matching backend EmployeeRequest
export interface EmployeeRequest {
  department: string;
}

// Employee response interface
export interface EmployeeResponse {
  success: boolean;
  department: string;
  employees: EmployeeDto[];
  message?: string;
  error?: string;
}

// Delete parts test response interface
export interface DeletePartsTestResponse {
  success: boolean;
  message: string;
  result?: string;
  rowIndex?: number;
  source?: string;
  error?: string;
}