/**
 * Response DTO for individual call status from PDueUnscheduledJobsInfo stored procedure
 * Matches the @CallStatus table structure
 */
export interface PastDueCallStatusDto {
  callNbr: string;
  custName: string;
  custNmbr: string;
  accMgr: string;
  jobStatus: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  techName: string;
  custClas: string;
  contNbr: string;
  changeAge: number;
  origAge: number;
  description: string;
}

/**
 * Response DTO for past due jobs summary by account manager
 */
export interface PastDueJobsSummaryDto {
  accMgr: string;
  pastDueJobs: number;
  couldBeBilled: number;
}

/**
 * Response DTO for scheduled percentage by office
 */
export interface ScheduledPercentageDto {
  offId: string;
  scheduledPercentage: number;
}

/**
 * Response DTO for total jobs count by office
 */
export interface TotalJobsDto {
  offId: string;
  totalJobs: number;
}

/**
 * Comprehensive response DTO for PDueUnscheduledJobsInfo stored procedure
 * Contains all result sets from the stored procedure
 */
export interface PastDueGraphResponseDto {
  success: boolean;
  message: string;
  generatedAt: Date;

  /**
   * Detailed call status information for past due jobs
   */
  callStatus: PastDueCallStatusDto[];

  /**
   * Summary of past due jobs and billable jobs by account manager
   */
  pastDueJobsSummary: PastDueJobsSummaryDto[];

  /**
   * Scheduled percentage by office
   */
  scheduledPercentages: ScheduledPercentageDto[];

  /**
   * Total unscheduled jobs by office
   */
  totalUnscheduledJobs: TotalJobsDto[];

  /**
   * Total scheduled jobs by office
   */
  totalScheduledJobs: TotalJobsDto[];

  /**
   * Total number of records across all result sets
   */
  totalRecords: number;
}

/**
 * Chart data structure for ApexCharts
 */
export interface ChartDataSeries {
  name: string;
  data: number[];
}

/**
 * Chart configuration for past due graphs
 */
export interface PastDueChartConfig {
  series: ChartDataSeries[];
  categories: string[];
  colors?: string[];
  title?: string;
}