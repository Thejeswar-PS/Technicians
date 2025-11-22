// Legacy interface for backward compatibility
export interface PartsRequestStatusItem {
  callNumber: string;
  customerNumber: string;
  customerName: string;
  technician: string;
  city: string;
  state: string;
  status: string;
  age: number;
  shipDate: Date | null;
  reqDate: Date;
  urgent: string;
  technicianId?: string;
  accountManager?: string;
  reqNumber?: string;
  trackingNumber?: string;
  shippingMethod?: string;
  notes?: string;
}

// New interfaces matching the API structure
export interface PartReqStatusDto {
  callnbr: string;
  custnumbr: string;
  custname: string;
  city: string;
  state: string;
  status: string;
  reqDate: string;
  urgent: string;
  technician: string;
  ship_Date: string;
  age: number;
}

export interface PartReqStatusRequestDto {
  key: number;
  invUserID: string;
  offName: string;
}

export interface PartReqStatusResponseDto {
  partRequests: PartReqStatusDto[];
  crashKitCount: number;
  loadBankCount: number;
}

export interface PartsRequestStatusFilter {
  ownerId: string;
  accountManager: string;
  inventoryUser?: string;
  status: string;
  yearType?: string;
  key?: number;
  invUserID?: string;
  offName?: string;
}

export interface PartsRequestStatusResponse {
  success: boolean;
  data: PartsRequestStatusItem[];
  message?: string;
}

