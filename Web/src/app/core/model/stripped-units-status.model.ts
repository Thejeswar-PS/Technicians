// Models for Stripped Units Status functionality matching backend DTOs
export interface StrippedUnitsStatusDto {
  make: string;
  model: string;
  serialNo: string;
  kva: string;
  voltage: string;
  poNumber: string;
  shippingPO: string;
  unitCost?: number;
  shipCost?: number;
  strippedBy: string;
  putAwayBy: string;
  status: string;
  createdOn?: Date;
  rowIndex: number;
  stripExists: number;
  partsLocation: string;
  lastModifiedBy: string;
  lastModifiedOn?: Date;
}

export interface MakeCountDto {
  make: string;
  makeCount: number;
}

export interface StrippedUnitsStatusRequest {
  status: string;
  rowIndex: number;
}

export interface StrippedUnitsStatusResponse {
  unitsData: StrippedUnitsStatusDto[];
  makeCounts: MakeCountDto[];
}

// API Response wrapper (for consistency with other API responses)
export interface StrippedUnitsStatusApiResponse {
  success: boolean;
  data: StrippedUnitsStatusResponse;
  totalRecords?: number;
  filters?: {
    status: string;
    rowIndex: number;
  };
  message?: string;
  error?: string;
}

// Legacy interface for backward compatibility
export interface StrippedPartsInUnitDto {
  rowIndex?: number;
  dcgPartGroup?: string;
  dcgPartNo?: string;
  partDesc?: string;
  keepThrow?: string;
  stripNo?: number;
  masterRowIndex?: number;
  lastModifiedBy?: string;
  lastModifiedOn?: Date;
  createdBy?: string;
  createdOn?: Date;
}

// Legacy response interface for backward compatibility
export interface StrippedPartsInUnitListResponse {
  success: boolean;
  data: StrippedPartsInUnitDto[];
  totalRecords: number;
  message?: string;
  error?: string;
}
export interface StrippedPartsDetailDto {
  // Database format (uppercase)
  DCGPartNo?: string;
  PartDesc?: string;
  KeepThrow?: string;
  StripNo?: number;
  RowIndex?: number;
  Group?: string; // Note: this might be [Group] in SQL
  // API format (lowercase)
  dcgPartNo?: string;
  partDesc?: string;
  keepThrow?: string;
  stripNo?: number;
  rowIndex?: number;
  group?: string;
  // Legacy properties for compatibility
  BOMPartNo?: string;
  Description?: string;
  PartStatus?: string;
  Quantity?: number;
  UnitPrice?: number;
  TotalPrice?: number;
  GroupType?: string;
  PartLocation?: string;
  SupplierInfo?: string;
  LastModifiedBy?: string;
  LastModifiedOn?: Date;
  CreatedBy?: string;
  CreatedOn?: Date;
  // UI helper property for editing
  actualKeepThrow?: string;
}

export interface StrippedPartsGroupCountDto {
  // Legacy ASPX DataField mappings (exact column names from stored procedure ds.Tables[2])
  'Part %'?: string;          // Pre-calculated percentage from database
  '$ of Total'?: string;      // Pre-calculated dollar percentage from database  
  'Quantity'?: number;        // SUM(StripNo) from database
  '$Per Part'?: string;       // Pre-calculated cost per part from database
  'Parts Stripped'?: string;  // Part group names from database
  
  // Database format (uppercase) - for compatibility
  DCGPartGroup?: string;
  PartsCount?: number;
  KeepThrow?: string;
  StripPercent?: number;      // Raw percentage value
  StripCost?: number;         // Raw cost value
  
  // API format (lowercase) - for compatibility
  dcgPartGroup?: string;
  count?: number;
  keepThrow?: string;
  stripPercent?: number;      // Raw percentage value (lowercase)
  stripCost?: number;         // Raw cost value (lowercase)
  quantity?: number;          // Raw quantity value (lowercase)
  
  // Legacy property names for compatibility
  GroupType?: string;
  GroupCount?: number;
  TotalValue?: number;
}

export interface StrippedPartsCostAnalysisDto {
  partPercent: number;
  dollarOfTotal: number;
  quantity: number;
  dollarPerPart: number;
  partsStripped: string;
  // Legacy property names for compatibility
  PartPercent?: number;
  DollarOfTotal?: number;
  Quantity?: number;
  DollarPerPart?: number;
  PartsStripped?: string;
}

export interface StrippedPartsLocationDto {
  partsLocation: string; // matches actual API response
  locationCode?: string;
  locationDescription?: string;
  partCount?: number;
  totalValue?: number;
}

export interface StrippedPartsInUnitResponse {
  masterRowIndex: number;
  hasData: boolean;
  partsDetails: StrippedPartsDetailDto[];
  groupCounts: StrippedPartsGroupCountDto[];
  costAnalysis: StrippedPartsCostAnalysisDto[];
  partsLocations: StrippedPartsLocationDto[];
}

// API Response wrapper for Stripped Parts In Unit
export interface StrippedPartsInUnitApiResponse {
  success: boolean;
  data: StrippedPartsInUnitResponse;
  message?: string;
  error?: string;
}

// API Response for single unit operations
export interface StrippedUnitApiResponse {
  success: boolean;
  data: StrippedUnitsStatusDto;
  rowIndex?: number;
  message?: string;
  error?: string;
}

// Filter options for the frontend
export interface StrippedUnitsStatusFilter {
  status: string;
  rowIndex?: number;
}

// Status options for dropdown
export const STRIPPED_UNITS_STATUS_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'Not Started', label: 'Not Started' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
  { value: 'Deferred', label: 'Deferred' },
  { value: 'Waiting On Someone else', label: 'Waiting On Someone else' }
];

// Legacy DTO for backward compatibility with existing components
export interface StrippedPartsInUnitDto {
  masterRowIndex?: number;
  rowIndex?: number;
  dcgPartGroup?: string;
  dcgPartNo?: string;
  partDesc?: string;
  keepThrow?: string;
  stripNo?: number;
  lastModifiedBy?: string;
  createdOn?: Date;
  lastModifiedOn?: Date;
  createdBy?: string;
}

// API Response for getting stripped parts list
export interface StrippedPartsInUnitListResponse {
  success: boolean;
  data: StrippedPartsInUnitDto[];
  totalRecords: number;
  message?: string;
  error?: string;
}

// Keep/Throw options for dropdown
export const KEEP_THROW_OPTIONS = [
  { value: 'Keep', label: 'Keep' },
  { value: 'Throw', label: 'Throw' }
];

// DTO for strip part codes dropdown data
export interface StripPartCodeDto {
  code: string;
  name: string;
}

// API Response for strip part codes
export interface StripPartCodeApiResponse {
  success: boolean;
  data: StripPartCodeDto[];
  count: number;
  message?: string;
}

// Display item for frontend table
export interface StrippedUnitsStatusItem extends StrippedUnitsStatusDto {
  // Add any computed or display-specific properties here
  displayStatus?: string;
  formattedCreatedOn?: string;
  formattedUnitCost?: string;
  formattedShipCost?: string;
}