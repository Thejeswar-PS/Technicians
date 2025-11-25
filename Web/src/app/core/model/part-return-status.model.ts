// Part Return Status models matching the backend DTOs

export interface PartReturnStatusDto {
  service_Call_ID: string;
  part_Num: string;
  dc_Part_Num: string;
  totalQty: number;
  description: string;
  faultyParts: number;
  unusedParts: number;
  invUserID: string;
  technician: string;
  lastModified: Date | null;
  status?: string;
}

export interface PartReturnStatusRequestDto {
  key: number;
  source: string;
  invUserID: string;
  year: number;
}

export interface PartReturnStatusResponseDto {
  success: boolean;
  data: PartReturnStatusDto[];
  message?: string;
}

// Interface for display purposes (with camelCase properties)
export interface PartReturnStatusItem {
  serviceCallId: string;
  partNum: string;
  dcPartNum: string;
  totalQty: number;
  description: string;
  faultyParts: number;
  unusedParts: number;
  invUserID: string;
  technician: string;
  lastModified: Date | null;
  status: string;
}

// Filter interface for part return status queries
export interface PartReturnStatusFilter {
  key: number;
  source: string;
  invUserID: string;
  year: number;
}

// Status options for dropdown
export interface PartReturnStatusOption {
  key: number;
  value: string;
  label: string;
}

// Parts to be Received Chart models
export interface PartsToBeReceivedChartDto {
  jobsCount: number;
  faulty: number;
  name: string;
}

export interface PartsToBeReceivedTotalsDto {
  unUsedTR: number;
  faultyTR: number;
}

export interface PartsToBeReceivedResponseDto {
  chartData: PartsToBeReceivedChartDto[];
  totals: PartsToBeReceivedTotalsDto;
}

// API Response wrapper for Parts to be Received
export interface PartsToBeReceivedApiResponseDto {
  success: boolean;
  data: PartsToBeReceivedResponseDto;
  message?: string;
}

// Parts Received by Warehouse Chart models
export interface PartsReceivedByWHChartDto {
  name: string;
  jobsCount: number;
  faulty: number;
}

export interface PartsReceivedByWHTotalsDto {
  unUsedR: number;
  faultyR: number;
}

export interface PartsReceivedByWHResponseDto {
  chartData: PartsReceivedByWHChartDto[];
  totals: PartsReceivedByWHTotalsDto;
}

// API Response wrapper for Parts Received by Warehouse
export interface PartsReceivedByWHApiResponseDto {
  success: boolean;
  data: PartsReceivedByWHResponseDto;
  message?: string;
}

// Weekly Parts Returned Count models
export interface WeeklyPartsReturnedCountDto {
  wkEnd: string;
  unUsed: number;
  faulty: number;
  weekNo: number;
}

// API Response wrapper for Weekly Parts Returned Count
export interface WeeklyPartsReturnedCountApiResponseDto {
  success: boolean;
  data: WeeklyPartsReturnedCountDto[];
  message?: string;
}

// Parts Return Data by Week Number models
export interface PartsReturnDataByWeekNoDto {
  service_Call_ID: string;
  unusedSentBack: number;
  faultySentBack: number;
  returnStatus: string;
  returnNotes: string;
  truckStock: number;
  techName: string;
  maint_Auth_ID: string;
  lastModified: Date | null;
}

// API Response wrapper for Parts Return Data by Week Number
export interface PartsReturnDataByWeekNoApiResponseDto {
  success: boolean;
  data: PartsReturnDataByWeekNoDto[];
  count?: number;
  message?: string;
}

// Interface for display purposes (with camelCase properties)
export interface PartsReturnDataByWeekNoItem {
  serviceCallId: string;
  unusedSentBack: number;
  faultySentBack: number;
  returnStatus: string;
  returnNotes: string;
  truckStock: number;
  techName: string;
  maintAuthId: string;
  lastModified: Date | null;
}

// Predefined status options
export const PART_RETURN_STATUS_OPTIONS: PartReturnStatusOption[] = [
  { key: 0, value: 'not-returned', label: 'Not Returned' },
  { key: 1, value: 'in-progress', label: 'In Progress' },
  { key: 2, value: 'pending', label: 'Pending' },
  { key: 3, value: 'returned', label: 'Returned' }
];