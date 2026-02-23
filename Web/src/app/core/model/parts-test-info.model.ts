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
  submittedDate?: Date | string; // Optional submitted date field
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
  // qcPassed?: boolean;   // Missing QC passed field
  // qcApprovedBy?: string; // Missing QC approved by field
  createdBy?: string;
  createdOn?: Date | string; // Creation date for auto-generated ID calculation
  autoGenID?: string; // Existing auto-generated ID from database
  approved?: boolean;
  archive?: boolean;     // Archive status
  finalApproval?: boolean; // Final approval status
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

// DTO interface for SaveUpdatePartsTestList - matches backend SaveUpdatePartsTestDto (39 parameters)
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
  KVA: string;                 // Case-sensitive: KVA not kva
  Voltage: string;             // Case-sensitive: Voltage not voltage
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
  CreatedBy: string;           // PascalCase for backend
  Approved: boolean;           // PascalCase for backend
  LastModifiedBy: string;      // PascalCase for backend
  
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

// Job exists response interface
export interface JobExistsResponse {
  success: boolean;
  exists: boolean;
  jobNo: string;
  message?: string;
  error?: string;
}

// Submitted date response interface
export interface SubmittedDateResponse {
  success: boolean;
  submittedDate: string;
  jobNo: string;
  message?: string;
  error?: string;
}

// Archive record response interface
export interface ArchiveRecordResponse {
  success: boolean;
  message: string;
  rowIndex?: number;
  error?: string;
}