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
  assignedTo: string;
  dueDate?: string | Date;
  testProcedures: string;
  problemNotes: string;
  resolveNotes: string;
  testedBy: string;
  testedOn: string;
  archive: boolean;
  approved: boolean;
  approvedOn?: string | Date;
  rowIndex: number;
  createdBy: string;
  createdOn?: string | Date;
  lastModifiedBy: string;
  lastModifiedOn?: string | Date;
  approvalSent: boolean;
  archiveSent: boolean;
  stripSNo: string;
  
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