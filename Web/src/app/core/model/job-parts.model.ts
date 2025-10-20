// Job Parts Models

export interface JobPartsInfo {
  callNbr: string;
  techName: string;
  techID: string;
  siteID: string;
  siteName: string;
  address: string;
  contactName: string;
  contactPh: string;
  verifyPh: boolean;
  requestedBy: string;
  scheduled: string;
  reqNote: string;
  shippingStatus: string;
  assignedTo: string;
  processedBy: string;
  submitted: string;
  firstSubmitted: string;
  lastUpdate: string;
  shippingNote: string;
}

export interface JobPartsInfoResponse {
  service_Call_ID?: string | null;
  callNbr?: string | null;
  custNmbr?: string | null;
  adrscode?: string | null;
  contactName?: string | null;
  contactPh?: string | null;
  verifyPh?: string | boolean | number | null;
  technician?: string | null;
  techName?: string | null;
  techID?: string | null;
  job_date?: string | null;
  location_Name?: string | null;
  locationName?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  requested_By?: string | null;
  requestedBy?: string | null;
  submitted?: string | number | null;
  status?: string | null;
  processed_By?: string | null;
  processedBy?: string | null;
  note?: string | null;
  req_Note?: string | null;
  reqNote?: string | null;
  requestedDate?: string | null;
  submittedDate?: string | null;
  invUserID?: string | null;
  firstSubmitted?: string | null;
  lastUpdate?: string | null;
  shippingStatus?: string | null;
  shippingNote?: string | null;
}

const trimString = (value: any): string => {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value === null || value === undefined) {
    return '';
  }
  return String(value).trim();
};

const toBoolean = (value: any): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', 'yes', 'y', '1'].includes(normalized)) {
      return true;
    }
    if (['false', 'no', 'n', '0'].includes(normalized)) {
      return false;
    }
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  return !!value;
};

const formatDate = (value: any): string => {
  const trimmed = trimString(value);
  if (!trimmed) {
    return '';
  }

  const date = new Date(trimmed);
  if (!isNaN(date.getTime())) {
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return trimmed;
};

export function mapJobPartsInfo(raw: JobPartsInfoResponse | null | undefined): JobPartsInfo {
  const empty: JobPartsInfo = {
    callNbr: '',
    techName: '',
    techID: '',
    siteID: '',
    siteName: '',
    address: '',
    contactName: '',
    contactPh: '',
    verifyPh: false,
    requestedBy: '',
    scheduled: '',
    reqNote: '',
    shippingStatus: 'Initiated',
    assignedTo: '',
    processedBy: '',
    submitted: '',
    firstSubmitted: '',
    lastUpdate: '',
    shippingNote: ''
  };

  if (!raw) {
    return empty;
  }

  const siteId = trimString(raw.custNmbr) || trimString(raw.adrscode) || trimString((raw as any).siteID);
  const addressParts = [trimString(raw.street), trimString(raw.city), trimString(raw.state), trimString(raw.zip)].filter((part) => !!part);
  const composedAddress = addressParts.join(', ');
  const address = composedAddress || trimString((raw as any).address);

  return {
    callNbr: trimString(raw.service_Call_ID) || trimString(raw.callNbr),
    techName: trimString(raw.technician) || trimString(raw.techName),
    techID: trimString(raw.techID),
    siteID: siteId,
    siteName:
      trimString(raw.location_Name) ||
      trimString(raw.locationName) ||
      trimString((raw as any).siteName) ||
      trimString(raw.custNmbr),
    address,
    contactName: trimString(raw.contactName),
    contactPh: trimString(raw.contactPh),
    verifyPh: toBoolean(raw.verifyPh),
    requestedBy: trimString(raw.requested_By) || trimString(raw.requestedBy),
    scheduled: formatDate(raw.job_date ?? (raw as any).scheduled),
    reqNote: trimString(raw.req_Note) || trimString(raw.reqNote) || trimString((raw as any).reqNote),
    shippingStatus: trimString(raw.status) || trimString(raw.shippingStatus) || 'Initiated',
    assignedTo: trimString(raw.invUserID) || trimString((raw as any).assignedTo),
    processedBy: trimString(raw.processed_By) || trimString(raw.processedBy),
    submitted: formatDate(raw.submittedDate ?? raw.submitted),
    firstSubmitted: formatDate(raw.firstSubmitted),
    lastUpdate: formatDate(raw.requestedDate ?? raw.lastUpdate),
    shippingNote: trimString(raw.note) || trimString(raw.shippingNote) || trimString((raw as any).shippingNote)
  };
}

export interface PartsRequest {
  scidInc: number;
  serviceCallID: string;
  callNbr?: string;
  partNum: string;
  dcPartNum: string;
  qty: number;
  description: string;
  location: string;
  destination: string;
  requiredDate: string;
  shippingMethod: string;
  urgent: boolean;
  backOrder: boolean;
  techName: string;
}

export interface ShippingPart {
  scidInc: number;
  serviceCallID: string;
  callNbr?: string;
  partNum: string;
  dcPartNum: string;
  qty: number;
  description: string;
  destination: string;
  shippingCompany: string;
  trackingNum: string;
  shipmentType: string;
  shippingCost: number;
  courierCost: number;
  shipDate: string;
  eta: string;
  shippedFrom: string;
  createDate: string;
  lastModified: string;
  maintAuthID: string;
  backOrder: boolean;
}

export interface TechPart {
  scidInc: number;
  serviceCallID: string;
  callNbr?: string;
  partNum: string;
  dcPartNum: string;
  totalQty: number;
  description: string;
  partSource: string;
  installedParts: number;
  unusedParts: number;
  faultyParts: number;
  unusedDesc: string;
  faultyDesc: string;
  isReceived: boolean;
  receivedStatus?: 'Yes' | 'No' | 'NA';
  brandNew: boolean;
  partsLeft: boolean;
  trackingInfo: string;
  createDate: string;
  lastModified: string;
  maintAuthID: string;
}

export interface PartsEquipInfo {
  callNbr: string;
  techID: string;
  techName: string;
  equipNo: string;
  make: string;
  model: string;
  kva: number;
  ipVolt: number;
  opVolt: number;
  addInfo: string;
  equipNo1: string;
  make1: string;
  model1: string;
  kva1: number;
  ipVolt1: number;
  opVolt1: number;
  addInfo1: string;
  emgNotes: string;
}

export interface TechReturnInfo {
  unusedSentBack: number;
  faultySentBack: number;
  returnStatus: string;
  lastModified: string;
  maintAuthId: string;
  returnNotes: string;
}

export interface FileAttachment {
  name: string;
  fullName: string;
  creationTime: string;
  url: string;
}
