export interface TechMileageRequestDto {
  startDate: string;
  endDate: string;
  techName?: string | null;
  pageNumber?: number;
  pageSize?: number;
}

export interface TechMileageRecordDto {
  callNbr: string;
  techName: string;
  custName: string;
  address: string;
  origin: string;
  orgin?: string;
  startDate: string | Date | null;
  milesReported: number;
  hoursDecimal: number;
  jobType: string;
  totalMinutes: number;
  timeTaken: string;
}

export interface TechMileageMonthlySummaryDto {
  month: string;
  totalMiles: number;
  totalHours: number;
}

export interface TechMileageResponseDto {
  mileageRecords: TechMileageRecordDto[];
  monthlySummary: TechMileageMonthlySummaryDto[];
  totalMiles: number;
  totalHours: number;
  totalJobs: number;
  pageNumber: number;
  pageSize: number;
  success: boolean;
  message: string;
}

export interface TechMileageTechnicianDto {
  techID: string;
  techName: string;
}

export interface TechMileageApiRecord {
  Date?: string | Date | null;
  date?: string | Date | null;
  JobNumber?: string;
  jobNumber?: string;
  CallNbr?: string;
  callNbr?: string;
  TechName?: string;
  techName?: string;
  CustomerName?: string;
  customerName?: string;
  CustName?: string;
  custName?: string;
  SiteAddress?: string;
  siteAddress?: string;
  Address?: string;
  address?: string;
  Origin?: string;
  origin?: string;
  Orgin?: string;
  orgin?: string;
  StartDate?: string | Date | null;
  startDate?: string | Date | null;
  MilesReported?: number;
  milesReported?: number;
  HoursDecimal?: number;
  hoursDecimal?: number;
  JobType?: string;
  jobType?: string;
  TotalMinutes?: number;
  totalMinutes?: number;
  TimeTaken?: string;
  timeTaken?: string;
  TimeTakenHHMM?: string;
  timeTakenHHMM?: string;
}

export interface TechMileageApiSummary {
  Month?: string;
  month?: string;
  TotalMiles?: number;
  totalMiles?: number;
  TotalHours?: number;
  totalHours?: number;
}

export interface TechMileageApiResponse {
  Data?: TechMileageApiRecord[];
  data?: TechMileageApiRecord[];
  TotalRecords?: number;
  totalRecords?: number;
  PageNumber?: number;
  pageNumber?: number;
  PageSize?: number;
  pageSize?: number;
  MileageRecords?: TechMileageApiRecord[];
  mileageRecords?: TechMileageApiRecord[];
  MonthlySummary?: TechMileageApiSummary[];
  monthlySummary?: TechMileageApiSummary[];
  TotalMiles?: number;
  totalMiles?: number;
  TotalHours?: number;
  totalHours?: number;
  TotalJobs?: number;
  totalJobs?: number;
  Success?: boolean;
  success?: boolean;
  Message?: string;
  message?: string;
}

export interface TechMileageApiTechnician {
  TechID?: string;
  techID?: string;
  techId?: string;
  TechName?: string;
  techName?: string;
  techname?: string;
}
