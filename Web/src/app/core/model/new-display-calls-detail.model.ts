export interface NewDisplayCallsDetailRequestDto {
  pDetailPage: string;
  pOffID?: string;
}

export interface DisplayCallsDetailDTO {
  jobNo?: string;              // e.g., callnbr or Reference No
  customerNo?: string;         // e.g., custnmbr
  customerName?: string;       // e.g., custname
  status?: string;             // e.g., JobStatus
  acctMngr?: string;          // e.g., offid
  startDt?: string;           // e.g., etadte or scheduledstart
  endDt?: string;             // e.g., scheduledend
  returnedOn?: string;        // e.g., returned
  invoicedOn?: string;        // e.g., invoicedate or DOCDATE
  amount?: number;            // e.g., invoiceamount or DOCAMNT
  techName?: string;          // e.g., TechName
  jobType?: string;           // e.g., srvtype
  contractNo?: string;        // e.g., CONTNBR
  class?: string;             // e.g., custclas
  dueInDays?: number;         // e.g., Due In(Days)
  city?: string;              // e.g., CITY
  state?: string;             // e.g., STATE
  description?: string;       // e.g., from GetContractDescription
  quotedAmount?: number;      // e.g., Quoted Amount
  changeAge?: number;         // e.g., datediff results
  address?: string;           // e.g., Address
  salesPerson?: string;       // e.g., SLPRSNID
  type?: string;              // e.g., CNTTYPE
  mailingDt?: string;         // e.g., MailingDate
  pordnmbr?: string;          // e.g., PORDNMBR
}

export interface DisplayCallsDetailResponse {
  details: DisplayCallsDetailDTO[];
  totalAmount?: number;       // For branches that return a total in a second SELECT
}

export interface NewDisplayCallsDetailResponseDto {
  success: boolean;
  message: string;
  detailPage: string;
  officeId: string;
  data?: DisplayCallsDetailResponse | DisplayCallsDetailDTO[];
  totalData?: any;
}

export interface ContractInvoiceDto {
  referenceNo: string;
  invoiceDate: string;
  invoiceAmount: number;
}

export interface JobDetailDto {
  jobNo: string;
  customerNo: string;
  status: string;
  acctMgr: string;
  startDt: string;
  endDt: string;
  lastChanged: string;
  confirmedOn: string;
  finalConfirmedBy: string;
  city: string;
  state: string;
  returnedOn: string;
  techName: string;
  class: string;
  customerName: string;
  contractNo: string;
  dueInDays: number;
  lastModified: string;
  jobType: string;
  quotedAmount: number;
  changeAge: number;
  description: string;
  amount: number;
  invoicedOn: string;
  billedAmount: number;
  jobCost: number;
  totalAmount: number;
}

export interface QuoteDetailDto {
  jobNo: string;
  customerNo: string;
  status: string;
  accountMgr: string;
  lastChanged: string;
  startDt: string;
  quotedAmount: number;
}

export interface InvoiceDetailDto {
  customerNo: string;
  name: string;
  invoiceNo: string;
  invoiceDt: string;
  amount: number;
  dueOn: string;
  referenceNo: string;
  changeAge: number;
}

export interface UnscheduledJobDetailDto {
  jobNo: string;
  customerNo: string;
  status: string;
  acctMgr: string;
  startDt: string;
  endDt: string;
  jobType: string;
  contractNo: string;
  description: string;
  totalAmount: number;
}

export interface SiteStatusDto {
  jobNo: string;
  customerNo: string;
  level: number;
  startDt: string;
  customerName: string;
  city: string;
  state: string;
  techName: string;
  acctMgr: string;
  lastModified: string;
  changeAge: number;
  class: string;
}

export interface ContractBillingDto {
  customerNo: string;
  customerName: string;
  address: string;
  salesPerson: string;
  contractNo: string;
  type: string;
  invoicedOn: string;
  amount: number;
  mailingDt: string;
  pordnmbr: string;
}

export interface PartsTrackingDto {
  callNbr: string;
  custNmbr: string;
  custName: string;
  accMgr: string;
  techName: string;
  jobDate: string;
  serviceCallId: string;
  partNum: string;
  description: string;
  destination: string;
  shipDate: string;
  requiredDate: string;
  city: string;
  state: string;
  status: string;
  reqDate: string;
}

export interface CallStatusSummaryDto {
  callNbr: string;
  custNmbr: string;
  offId: string;
  jobStatus: string;
  scheduledStart: string;
  scheduledEnd: string;
  returned: string;
  invoiceDate: string;
  invoiceAmount: number;
  techName: string;
  jobType: string;
  quotedAmount: number;
  custClass: string;
  custName: string;
  contNbr: string;
  dueDays: number;
  changeAge: number;
  description: string;
}

export interface TotalAmountDto {
  totalAmount: number;
}