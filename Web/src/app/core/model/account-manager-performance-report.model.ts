// Base call status DTO matching backend AccMgrCallStatusDto
export interface AccMgrCallStatusDto {
  callNbr: string;
  custNmbr: string;
  offId: string;
  jobStatus: string;
  responseDate: string;
  scheduledStart: string;
  scheduledEnd: string;
  returned: string;
  invoiceDate: string;
  invoiceAmount: number;
  invoiceTotal: number;
  jobType: string;
  totalAmount: number;
  techName: string;
  custClas: string;
  custName: string;
  contnbr?: string;
  description: string;
  changeAge: number;
  origAge: number;
  // Additional properties for template binding
  contractNo?: string;
  dateCompleted?: string;
  technician?: string;
  customerName?: string;
  status?: string;
  callType?: string;
  productType?: string;
  // Mapped from "Contract No" column by Dapper
  ContractNo?: string;
}

// DTOs with ChangeAge1 property
export interface AccMgrReturnedForProcessingDto extends AccMgrCallStatusDto {
  changeAge1: number;
}

export interface AccMgrJobsScheduledTodayDto extends AccMgrCallStatusDto {
  changeAge1: number;
}

export interface AccMgrJobsConfirmedNext120HoursDto extends AccMgrCallStatusDto {
  changeAge1: number;
}

// Unscheduled/Monthly jobs DTO
export interface AccMgrUnscheduledJobDto {
  callNbr: string;
  custNmbr: string;
  custName: string;
  siteContact: string;
  city: string;
  jobStatus: string;
  scheduledStart: string;
  description: string;
  changeAge: number;
  origAge: number;
}

// Master response DTO matching backend
export interface AccMgrPerformanceReportResponseDto {
  officeId: string;
  roJobs: string;
  generatedAt: string;
  completedNotReturned: AccMgrCallStatusDto[];
  returnedForProcessing: AccMgrReturnedForProcessingDto[];
  jobsScheduledToday: AccMgrJobsScheduledTodayDto[];
  jobsConfirmedNext120Hours: AccMgrJobsConfirmedNext120HoursDto[];
  returnedWithIncompleteData: AccMgrCallStatusDto[];
  pastDueUnscheduled: AccMgrUnscheduledJobDto[];
  firstMonth: AccMgrUnscheduledJobDto[];
  secondMonth: AccMgrUnscheduledJobDto[];
  thirdMonth: AccMgrUnscheduledJobDto[];
  fourthMonth: AccMgrUnscheduledJobDto[];
  fifthMonth: AccMgrUnscheduledJobDto[];
  // Additional sections from legacy code
  returnedIncompleteData: AccMgrCallStatusDto[];
  customerConfirmedData: AccMgrCustomerConfirmedDto[];
  monthlyUnscheduledJobs: AccMgrMonthlyUnscheduledDto;
  // Missing properties for component usage
  completedApprovalUPS?: AccMgrCallStatusDto[];
  unscheduledJobs?: AccMgrUnscheduledJobDto[];
  
  // Backend PascalCase properties to match repository
  CompletedNotReturned?: AccMgrCallStatusDto[];
  ReturnedForProcessing?: AccMgrReturnedForProcessingDto[];
  JobsScheduledToday?: AccMgrJobsScheduledTodayDto[];
  JobsConfirmedNext120Hours?: AccMgrJobsConfirmedNext120HoursDto[];
  ReturnedWithIncompleteData?: AccMgrCallStatusDto[];
  PastDueUnscheduled?: AccMgrUnscheduledJobDto[];
  FirstMonth?: AccMgrUnscheduledJobDto[];
  SecondMonth?: AccMgrUnscheduledJobDto[];
  ThirdMonth?: AccMgrUnscheduledJobDto[];
  FourthMonth?: AccMgrUnscheduledJobDto[];
  FifthMonth?: AccMgrUnscheduledJobDto[];
  OfficeId?: string;
  GeneratedAt?: string;
}

// Additional interfaces for new sections
export interface AccMgrCustomerConfirmedDto {
  contractNo: string;
  scheduledDate: Date;
  customerName: string;
  technicianAssigned: string;
  callType: string;
  priority: string;
  confirmationStatus: string;
}

export interface AccMgrMonthlyUnscheduledDto {
  currentMonth: AccMgrMonthlyJobDto[];
  previousMonth: AccMgrMonthlyJobDto[];
}

export interface AccMgrMonthlyJobDto {
  contractNo: string;
  customerName: string;
  dateCreated: Date;
  priority: string;
}

// Helper interfaces for frontend
export interface AccMgrPerformanceReportSummaryDto {
  completedNotReturnedCount: number;
  returnedForProcessingCount: number;
  jobsScheduledTodayCount: number;
  jobsConfirmedNext120HoursCount: number;
  returnedWithIncompleteDataCount: number;
  pastDueUnscheduledCount: number;
  monthlyScheduledCounts: { [key: string]: number };
  totalJobs: number;
  officeId: string;
  roJobsFilter: string;
  generatedAt: string;
}