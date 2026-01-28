import { UPSTestStatusDto, MakeCountDto } from './ups-test-status.model';
import { StrippedUnitsStatusDto } from './stripped-units-status.model';

export interface NewUniTestRequest {
  rowIndex: number;
}

export interface NewUniTestResponse {
  unitsData: UPSTestStatusDto[];
  totalRecords: number;
  isFiltered: boolean;
  filteredRowIndex: number;
}

export interface NewUniTestApiResponse {
  success: boolean;
  data: NewUniTestResponse;
  totalRecords: number;
  isFiltered: boolean;
  filteredRowIndex: number;
  message?: string;
  error?: string;
}

export interface NewUniTestSummaryResponse {
  success: boolean;
  data: {
    TotalUnits: number;
    StatusCounts: { [key: string]: number };
    MakeCounts: MakeCountDto[];
    UnitsWithStrippedParts: number;
  };
  message?: string;
  error?: string;
}

export interface UnitTestExistsResponse {
  success: boolean;
  exists: boolean;
  rowIndex: number;
  message?: string;
  error?: string;
}

// Move Unit to Stripping Models
export interface MoveUnitToStrippingDto {
  rowIndex: number;
  make: string;
  model: string;
  kva: string;
  voltage: string;
  serialNo: string;
  poNumber: string;
  shippingPO: string;
  unitCost?: number;
  shipCost?: number;
  createdBy: string;
}

export interface MoveUnitToStrippingResponse {
  success: boolean;
  result: string;
  rowIndex: number;
  make: string;
}

export interface MoveUnitToStrippingApiResponse {
  success: boolean;
  message: string;
  data: MoveUnitToStrippingResponse;
  errors?: string[];
  error?: string;
}

// Save/Update Unit Test Models
export interface SaveUpdateNewUnitTestDto {
  rowIndex: number;
  make: string;
  model: string;
  kva: string;
  voltage: string;
  serialNo: string;
  poNumber?: string;
  shippingPO?: string;
  unitCost?: number;
  shipCost?: number;
  priority: string;
  assignedTo: string;
  dueDate?: Date | string;
  problemNotes: string;
  approved: boolean;
  archive: boolean;
  lastModifiedBy: string;
}

export interface SaveUpdateUnitTestResponse {
  success: boolean;
  message: string;
  rowIndex: number;
  errors?: string[];
  error?: string;
}

// DTO for updating new unit test result
export interface SaveUpdateNewUnitResultDto {
  RowIndex: number;
  Status: string;
  ResolveNotes?: string;
  TestProcedures?: string;
  TestedBy?: string;
  LastModifiedBy?: string;
}

export interface SaveUpdateUnitTestResultResponse {
  success: boolean;
  message: string;
  rowIndex: number;
  status: string;
  emailSent?: boolean;
  errors?: string[];
  error?: string;
}

// Delete Unit Test Models
export interface DeleteNewUnitTestResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    result: string;
    rowIndex: number;
  };
  error?: string;
}

// Create New Unit Models
export interface CreateNewUnitDto {
  // Basic Unit Information (Required)
  make: string;
  model: string;
  kva: string;
  voltage: string;
  serialNo: string;
  
  // Financial Information (Optional)
  poNumber?: string;
  shippingPO?: string;
  unitCost?: number;
  shipCost?: number;
  
  // Assignment & Scheduling Fields
  priority?: string;
  assignedTo?: string;
  dueDate?: Date | string;
  
  // Status & Workflow Fields
  status?: string;
  approved?: boolean;
  archive?: boolean;
  approvedOn?: Date | string;
  approvalSent?: boolean;
  archiveSent?: boolean;
  
  // Problem & Testing Fields
  problemNotes?: string;
  resolveNotes?: string;
  testProcedures?: string;
  
  // Test Results & Personnel
  testedBy?: string;
  testedOn?: Date | string;
  
  // Audit Metadata Fields
  createdBy: string;
  createdOn?: Date | string;
  lastModifiedBy?: string;
  lastModifiedOn?: Date | string;
}

export interface CreateNewUnitResponse {
  success: boolean;
  message: string;
  newRowIndex: number;
  make: string;
  serialNo: string;
}

export interface CreateNewUnitApiResponse {
  success: boolean;
  message: string;
  data: CreateNewUnitResponse;
  errors?: string[];
  error?: string;
}