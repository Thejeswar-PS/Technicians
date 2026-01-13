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

// Status options for dropdown - matching legacy ASP.NET values
export const ORDER_STATUS_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'NEW', label: 'New' },
  { value: 'ORD', label: 'Ordered' },
  { value: 'SHI', label: 'Shipped' },
  { value: 'BOR', label: 'Back Ordered' },
  { value: 'CAN', label: 'Cancelled' },
  { value: 'COM', label: 'Completed' }
];

// Order type options for dropdown - matching legacy ASP.NET values
export const ORDER_TYPE_OPTIONS = [
  { value: 'All', label: 'All' },
  { value: 'Repair', label: 'Repair' },
  { value: 'ASSY', label: 'ASSY' }
];