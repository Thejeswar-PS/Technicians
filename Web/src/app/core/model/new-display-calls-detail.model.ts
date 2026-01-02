// Request DTOs
export interface NewDisplayCallsDetailRequestDto {
  pDetailPage: string;
  pOffID?: string;
}

// Generic Response DTO with strongly typed Data property
export interface ReportResponseDto<T> {
  data: T[];
  totalAmount?: number;
  reportType: string;
  generatedAt: Date;
  hasMultipleResultSets: boolean;
  additionalData?: { [key: string]: any };
  totalRecords: number;
  success: boolean;
  message: string;
}

// Enhanced response DTO for handling multiple result sets and complex responses
export interface EnhancedReportResponseDto<T> {
  data: T[];
  totalAmount?: number;
  reportType: string;
  detailPage: string;
  officeId: string;
  generatedAt: Date;
  hasMultipleResultSets: boolean;
  additionalData?: { [key: string]: any };
  summaryData?: any;
  totalRecords: number;
  success: boolean;
  message: string;
  errors?: string[];
}

// Legacy response DTOs for backward compatibility
export interface NewDisplayCallsDetailResponseDto {
  success: boolean;
  message: string;
  detailPage: string;
  officeId: string;
  data?: any;
  totalData?: any;
  generatedAt: Date;
}

export interface DisplayCallsDetailResponse {
  details: DisplayCallsDetailDto[];
  totalAmount?: number;
}

// Generic display calls detail DTO that can handle most report types
export interface DisplayCallsDetailDto {
  jobNo?: string;
  customerNo?: string;
  customerName?: string;
  status?: string;
  acctMngr?: string;
  startDt?: Date;
  endDt?: Date;
  returnedOn?: Date;
  invoicedOn?: Date;
  amount?: number;
  techName?: string;
  jobType?: string;
  contractNo?: string;
  class?: string;
  dueInDays?: number;
  city?: string;
  state?: string;
  description?: string;
  quotedAmount?: number;
  changeAge?: number;
  address?: string;
  salesPerson?: string;
  type?: string;
  mailingDt?: Date;
  pordnmbr?: string;
  lastChanged?: string;
  lastModified?: Date;
  confirmedOn?: Date;
  finalConfirmedBy?: string;
  level?: number;
  invoiceNo?: string;
  invoiceDt?: Date;
  dueOn?: Date;
  referenceNo?: string;
}

// Contract Invoice DTO for monthly reporting
export interface ContractInvoiceDto {
  referenceNo: string;
  invoiceDate: Date;
  invoiceAmount: number;
  totalAmount: number;
}

// Quote DTO for quote management reports
export interface QuoteDto {
  jobNo: string;
  customerNo: string;
  status: string;
  acctMgr: string;
  startDt: Date;
  lastChanged: string;
  dueInDays: number;
  class: string;
  customerName: string;
  city: string;
  state: string;
}

// Job Processing DTO for job workflow tracking
export interface JobProcessingDto {
  jobNo: string;
  customerNo: string;
  status: string;
  acctMgr: string;
  startDt: Date;
  endDt: Date;
  confirmedOn?: Date;
  finalConfirmedBy: string;
  finalConfirmedByUserName?: string;
  city: string;
  state: string;
  returnedOn?: Date;
  techName: string;
  class: string;
  customerName: string;
  contractNo: string;
}

// Job Scheduling DTO for scheduling operations
export interface JobSchedulingDto {
  jobNo: string;
  customerNo: string;
  status: string;
  acctMgr: string;
  startDt: Date;
  endDt: Date;
  techName: string;
  class: string;
  customerName: string;
  contractNo: string;
}

// Quote Management DTO for quote lifecycle tracking
export interface QuoteManagementDto {
  jobNo: string;
  customerNo: string;
  status: string;
  accountMgr: string;
  lastChanged: Date;
  startDt: Date;
  quotedAmount: number;
}

// Invoice DTO for accounts receivable tracking
export interface InvoiceDto {
  customerNo: string;
  name: string;
  invoiceNo: string;
  invoiceDt: Date;
  amount: number;
  dueOn: Date;
  referenceNo: string;
  changeAge: number;
}

// Contract Billing DTO for contract billing schedules
export interface ContractBillingDto {
  customerNo: string;
  customerName: string;
  address: string;
  salesPerson: string;
  contractNo: string;
  type: string;
  invoicedOn: Date;
  amount: number;
  mailingDt?: Date;
  pordnmbr: string;
  totalAmount: number;
}

// Job Status Detail DTO for detailed job tracking
export interface JobStatusDetailDto {
  jobNo: string;
  customerNo: string;
  acctMgr: string;
  status: string;
  startDt: Date;
  endDt: Date;
  jobType: string;
  contractNo: string;
  description: string;
  totalAmount: number;
}

// Parts Tracking DTO for parts shipment tracking
export interface PartsTrackingDto {
  callNbr: string;
  custNmbr: string;
  custName: string;
  offId: string;
  techName: string;
  jobDate: Date;
}

// Parts Request DTO for parts requisition tracking
export interface PartsRequestDto {
  serviceCallId: string;
  partNum: string;
  description: string;
  destination: string;
  shipDate?: Date;
  custName: string;
  custNumber: string;
  city: string;
  state: string;
  status: string;
  reqDate?: Date;
  shippedFrom?: string;
  partStatus?: string;
}

// Site Status DTO for site condition tracking
export interface SiteStatusDto {
  jobNo: string;
  customerNo: string;
  level: number;
  startDt: Date;
  customerName: string;
  city: string;
  state: string;
  techName: string;
  acctMgr: string;
  lastModified?: Date;
  changeAge: number;
  class: string;
}

// Job Performance DTO for comprehensive job performance tracking
export interface JobPerformanceDto {
  jobNo: string;
  customerNo: string;
  acctMgr: string;
  status: string;
  startDt?: Date;
  endDt?: Date;
  returnedOn?: Date;
  invoicedOn?: Date;
  amount?: number;
  billedAmount?: number;
  jobCost?: number;
  techName: string;
  jobType: string;
  classId: string;
  customerName: string;
  contractNo: string;
  changeAge?: number;
  dueInDays?: number;
  dueDays?: number;
  description: string;
  invoiceTotal?: number;
  quotedAmount?: number;
  lastPM?: string;
  city?: string;
  state?: string;
  invoiceDueDate?: string;
  mailDate?: string;
  invoiceAmount?: number;
  contractType?: string;
}

// Complete Quote DTO for comprehensive quote tracking
export interface CompleteQuoteDto {
  jobNo: string;
  customerNo: string;
  status: string;
  acctMgr: string;
  startDt: Date;
  lastChanged: string;
  lastModified?: Date;
  dueInDays: number;
  class: string;
  customerName: string;
  city: string;
  state: string;
  confirmedOn?: Date;
  finalConfirmedBy?: string;
  finalConfirmedByUserName?: string;
  techName?: string;
}

// Manager Review DTO for specific manager review tracking
export interface ManagerReviewDto {
  callNbr: string;
  custNmbr: string;
  offId: string;
  jobStatus: string;
  startDt: string;
  endDt: string;
  returnedOn: string;
  invoiceDate?: Date;
  invoiceAmount: number;
  costingTotal: number;
  techName: string;
  jobType: string;
  quotedAmount: number;
  custClas: string;
  custName: string;
  contNbr: string;
  contractType?: string;
  description: string;
  verified: string;
  lastModifiedOn: Date;
}

// Legacy interfaces - keeping for backward compatibility
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
  callNbr: string;
  custNmbr: string;
  custName: string;
  accMgr: string;
  status: string;
  scheduledStart: string;
  scheduledEnd: string;
  returned: string;
  invoiceDate: string;
  invoiceAmount: number;
  techName: string;
  jobType: string;
  quotedAmount: number;
  custClass: string;
  contNbr: string;
  dueDays: number;
  changeAge: number;
  description: string;
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