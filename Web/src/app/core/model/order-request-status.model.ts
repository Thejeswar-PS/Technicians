export interface OrderRequestStatusRequestDto {
  status: string;
  orderType: string;
  archive: boolean;
}

export interface OrderRequestStatusDto {
  rowIndex: number;
  orderType?: string | null;
  requester?: string | null;
  dcgPartNo?: string | null;
  manufPartNo?: string | null;
  vendor?: string | null;
  qtyNeeded?: number | null;
  poNumber?: string | null;
  orderDate?: Date | null;
  arriveDate?: Date | null;
  notes?: string | null;
  status?: string | null;
  lastModifiedBy?: string | null;
  createdBy?: string | null;
  createdOn?: Date | null;
  modifiedBy?: string | null;
  modifiedOn?: Date | null;
  archive?: boolean;
}

export interface OrderRequestStatusResponse {
  success: boolean;
  message?: string;
  data: OrderRequestStatusDto[];
}

// Status options for dropdown
export const ORDER_STATUS_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'NEW', label: 'New' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'ORDERED', label: 'Ordered' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'COMPLETED', label: 'Completed' }
];

// Order type options for dropdown
export const ORDER_TYPE_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'PARTS', label: 'Parts' },
  { value: 'EQUIPMENT', label: 'Equipment' },
  { value: 'SERVICE', label: 'Service' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'OTHER', label: 'Other' }
];