export interface UPSTestStatusDto {
  make: string;
  model: string;
  serialNo: string;
  kva: string;
  voltage: string;
  poNumber: string;
  shippingPO: string;
  unitCost: string;
  shipCost: string;
  priority: string;
  status: string;
  testedOn: string;
  assignedTo: string;
  testedBy: string;
  createdOn?: Date;
  lastModifiedBy: string;
  lastModifiedOn?: Date;
  rowIndex: number;
  stripSNo: string;
  
  // Additional fields for result updates
  resolveNotes?: string;
  testProcedures?: string;
  
  // Computed properties for parsed decimal values (optional, for calculations)
  unitCostDecimal?: number;
  shipCostDecimal?: number;
}

export interface UPSTestStatusRequest {
  assignedTo: string;
  status: string;
  priority: string;
  archive: boolean;
}

export interface MakeCountDto {
  make: string;
  makeCount: number;
}

export interface UPSTestStatusResponse {
  unitsData: UPSTestStatusDto[];
  makeCounts: MakeCountDto[];
}

export interface UPSTestStatusApiResponse {
  success: boolean;
  data: UPSTestStatusResponse;
  totalRecords: number;
  filters?: {
    assignedTo: string;
    status: string;
    priority: string;
    archive: boolean;
  };
  message?: string;
  error?: string;
}

export interface UPSTestMetadataResponse {
  success: boolean;
  technicians: string[];
  makeCounts: MakeCountDto[];
  statusSummary: { [key: string]: number };
  validStatuses: string[];
  validPriorities: string[];
  statusLabels: { [key: string]: string };
  priorityLabels: { [key: string]: string };
  legacyStatusMappings?: { [key: string]: string };
  message?: string;
  error?: string;
}

export interface StatusSummaryItem {
  status: string;
  label: string;
  count: number;
}