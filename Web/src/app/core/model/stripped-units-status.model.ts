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

// Display item for frontend table
export interface StrippedUnitsStatusItem extends StrippedUnitsStatusDto {
  // Add any computed or display-specific properties here
  displayStatus?: string;
  formattedCreatedOn?: string;
  formattedUnitCost?: string;
  formattedShipCost?: string;
}