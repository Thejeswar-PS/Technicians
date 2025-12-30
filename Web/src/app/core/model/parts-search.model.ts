export interface PartsSearchRequestDto {
  address: string;
  status: string;
  siteID: string;
  make: string;
  model: string;
  kva: string;
  ipVoltage: string;
  opVoltage: string;
  manufPartNo: string;
  dcgPartNo: string;
}

export interface PartsSearchDataDto {
  callNbr: string;
  custNmbr: string;
  status: string;
  address: string;
  make: string;
  model: string;
  kva: string;
  ioVolt: string;
  manufPartNo: string;
  dcgPartNo: string;
  techName: string;
  jobType: string;
  requestedDate?: Date;
}

export interface PartsSearchDataResponse {
  success: boolean;
  message: string;
  data: PartsSearchDataDto[];
  totalRecords: number;
}

// Filter options for dropdowns
export const PARTS_SEARCH_STATUS_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'Initiated', label: 'Initiated' },
  { value: 'Submitted', label: 'Submitted' },
  { value: 'Needs Attention', label: 'Needs Attention' },
  { value: 'Staging', label: 'Staging' },
  { value: 'InAssembly', label: 'In Assembly' },
  { value: 'OrderedTrackingReq', label: 'Ordered - Tracking Required' },
  { value: 'Shipped', label: 'Shipped' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Canceled', label: 'Canceled' }
];