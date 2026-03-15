export interface TechMileageRequestDto {
  startDate: string;
  endDate: string;
  techName?: string | null;
}

export interface TechMileageRecordDto {
  callNbr: string;
  techName: string;
  custName: string;
  address: string;
  origin?: string;
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
  success: boolean;
  message: string;
}

export interface TechMileageTechnicianDto {
  techID: string;
  techName: string;
}
