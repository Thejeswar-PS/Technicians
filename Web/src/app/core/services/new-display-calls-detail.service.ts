import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  NewDisplayCallsDetailRequestDto,
  NewDisplayCallsDetailResponseDto,
  ReportResponseDto,
  ContractInvoiceDto,
  QuoteDto,
  JobProcessingDto,
  JobSchedulingDto,
  QuoteManagementDto,
  InvoiceDto,
  ContractBillingDto,
  PartsTrackingDto,
  PartsRequestDto,
  SiteStatusDto,
  JobStatusDetailDto,
  JobPerformanceDto,
  CompleteQuoteDto,
  ManagerReviewDto,
  DisplayCallsDetailDto,
  JobDetailDto,
  QuoteDetailDto,
  InvoiceDetailDto,
  UnscheduledJobDetailDto,
  CallStatusSummaryDto
} from '../model/new-display-calls-detail.model';

@Injectable({
  providedIn: 'root'
})
export class NewDisplayCallsDetailService {
  private readonly baseUrl = `${environment.apiUrl}/DisplayCallsDetail`;

  constructor(private http: HttpClient) {}

  /**
   * Generic method to get display calls detail data using the new POST endpoint
   */
  getDisplayCallsDetail(request: NewDisplayCallsDetailRequestDto): Observable<NewDisplayCallsDetailResponseDto> {
    console.log('🚀 Service calling POST API with request:', request);
    return this.http.post<NewDisplayCallsDetailResponseDto>(`${this.baseUrl}/report`, request);
  }

  /**
   * Get display calls detail data using query parameters - Legacy support
   */
  getDisplayCallsDetailByParams(pDetailPage: string, pOffID: string = ''): Observable<any> {
    console.log('🚀 Service calling GET API with parameters:');
    console.log('  📄 pDetailPage:', pDetailPage);
    console.log('  🏢 pOffID:', pOffID);
    
    // Use the new GET endpoint structure
    let url = `${this.baseUrl}/${encodeURIComponent(pDetailPage)}`;
    
    const params = new HttpParams().set('officeId', pOffID);
    return this.http.get(url, { params });
  }

  // Contract Reports
  /**
   * Get contract invoice month to date data
   */
  getContractInvoiceMonthToDate(): Observable<ReportResponseDto<ContractInvoiceDto>> {
    return this.http.get<ReportResponseDto<ContractInvoiceDto>>(`${this.baseUrl}/contract/invoice-month-to-date`);
  }

  // Quote Reports
  /**
   * Get quotes to be completed this week
   */
  getQuotesToBeCompletedThisWeek(officeId?: string): Observable<ReportResponseDto<QuoteDto>> {
    const params = officeId ? new HttpParams().set('officeId', officeId) : undefined;
    return this.http.get<ReportResponseDto<QuoteDto>>(`${this.baseUrl}/quotes/to-be-completed-this-week`, { params });
  }

  /**
   * Get quotes to be completed
   */
  getQuotesToBeCompleted(officeId?: string): Observable<ReportResponseDto<CompleteQuoteDto>> {
    const params = officeId ? new HttpParams().set('officeId', officeId) : undefined;
    return this.http.get<ReportResponseDto<CompleteQuoteDto>>(`${this.baseUrl}/quotes/to-be-completed`, { params });
  }

  /**
   * Get pending quotes
   */
  getPendingQuotes(): Observable<ReportResponseDto<QuoteManagementDto>> {
    return this.http.get<ReportResponseDto<QuoteManagementDto>>(`${this.baseUrl}/quotes/pending`);
  }

  /**
   * Get open quotes
   */
  getOpenQuotes(): Observable<ReportResponseDto<QuoteManagementDto>> {
    return this.http.get<ReportResponseDto<QuoteManagementDto>>(`${this.baseUrl}/quotes/open`);
  }

  /**
   * Get expired quotes
   */
  getExpiredQuotes(): Observable<ReportResponseDto<QuoteManagementDto>> {
    return this.http.get<ReportResponseDto<QuoteManagementDto>>(`${this.baseUrl}/quotes/expired`);
  }

  /**
   * Get quotes completed by account managers this week
   */
  getQuotesCompletedByAccountManagersThisWeek(): Observable<ReportResponseDto<CompleteQuoteDto>> {
    return this.http.get<ReportResponseDto<CompleteQuoteDto>>(`${this.baseUrl}/quotes/completed-by-account-managers-this-week`);
  }

  // Job Processing Reports
  /**
   * Get jobs to be processed this week
   */
  getJobsToBeProcessedThisWeek(officeId?: string): Observable<ReportResponseDto<JobProcessingDto>> {
    const params = officeId ? new HttpParams().set('officeId', officeId.trim()) : undefined;
    return this.http.get<ReportResponseDto<JobProcessingDto>>(`${this.baseUrl}/jobs/to-be-processed-this-week`, { params });
  }

  /**
   * Get jobs processed this week
   */
  getJobsProcessedThisWeek(officeId?: string): Observable<ReportResponseDto<JobProcessingDto>> {
    console.log('Service - getJobsProcessedThisWeek called with officeId:', officeId);
    const params = officeId ? new HttpParams().set('officeId', officeId.trim()) : undefined;
    console.log('Service - HTTP params:', params);
    return this.http.get<ReportResponseDto<JobProcessingDto>>(`${this.baseUrl}/jobs/processed-this-week`, { params });
  }

  /**
   * Get jobs processed by account managers this week
   */
  getJobsProcessedByAccountManagersThisWeek(officeId?: string): Observable<ReportResponseDto<JobProcessingDto>> {
    const params = officeId ? new HttpParams().set('officeId', officeId.trim()) : undefined;
    return this.http.get<ReportResponseDto<JobProcessingDto>>(`${this.baseUrl}/jobs/processed-by-account-managers-this-week`, { params });
  }

  // Job Scheduling Reports
  /**
   * Get jobs to be scheduled this week
   */
  getJobsToBeScheduledThisWeek(): Observable<ReportResponseDto<JobSchedulingDto>> {
    return this.http.get<ReportResponseDto<JobSchedulingDto>>(`${this.baseUrl}/jobs/to-be-scheduled-this-week`);
  }

  /**
   * Get jobs scheduled by account managers this week
   */
  getJobsScheduledByAccountManagers(): Observable<ReportResponseDto<JobProcessingDto>> {
    return this.http.get<ReportResponseDto<JobProcessingDto>>(`${this.baseUrl}/jobs/scheduled-by-account-managers-this-week`);
  }

  /**
   * Get jobs scheduled by scheduling coordinator this week
   */
  getJobsScheduledBySchedulingCoordinatorThisWeek(): Observable<ReportResponseDto<JobProcessingDto>> {
    return this.http.get<ReportResponseDto<JobProcessingDto>>(`${this.baseUrl}/jobs/scheduled-by-scheduling-coordinator-this-week`);
  }

  // Invoice Reports
  /**
   * Get current invoices
   */
  getCurrentInvoices(): Observable<ReportResponseDto<InvoiceDto>> {
    return this.http.get<ReportResponseDto<InvoiceDto>>(`${this.baseUrl}/invoices/current`);
  }

  /**
   * Get invoices by age range
   */
  getInvoicesByAge(ageRange: string): Observable<ReportResponseDto<InvoiceDto>> {
    const endpointMap: { [key: string]: string } = {
      '1-30': '1-to-30-days',
      '31-60': '31-to-60-days',
      '61-90': '61-to-90-days',
      '91+': '91-plus-days'
    };
    
    const endpoint = endpointMap[ageRange] || '1-to-30-days';
    return this.http.get<ReportResponseDto<InvoiceDto>>(`${this.baseUrl}/invoices/${endpoint}`);
  }

  // Contract Billing Reports
  /**
   * Get Liebert contracts not billed as of yesterday
   */
  getLiebertContractsNotBilledAsOfYesterday(): Observable<ReportResponseDto<ContractBillingDto>> {
    return this.http.get<ReportResponseDto<ContractBillingDto>>(`${this.baseUrl}/contracts/liebert-not-billed-yesterday`);
  }

  /**
   * Get non-Liebert contracts not billed as of yesterday
   */
  getNonLiebertContractsNotBilledAsOfYesterday(): Observable<ReportResponseDto<ContractBillingDto>> {
    return this.http.get<ReportResponseDto<ContractBillingDto>>(`${this.baseUrl}/contracts/non-liebert-not-billed-yesterday`);
  }

  // Parts Tracking Reports
  /**
   * Get jobs to be tracked - parts shipped from DC Group
   */
  getJobsToBeTrackedPartShippedFromDCGroup(): Observable<ReportResponseDto<PartsTrackingDto>> {
    return this.http.get<ReportResponseDto<PartsTrackingDto>>(`${this.baseUrl}/parts/jobs-to-be-tracked-dc-group`);
  }

  /**
   * Get jobs to be tracked - parts shipped from vendors
   */
  getJobsToBeTrackedPartShippedFromVendors(): Observable<ReportResponseDto<PartsTrackingDto>> {
    return this.http.get<ReportResponseDto<PartsTrackingDto>>(`${this.baseUrl}/parts/jobs-to-be-tracked-vendors`);
  }

  /**
   * Get crash kit parts information
   */
  getCrashKit(): Observable<ReportResponseDto<PartsRequestDto>> {
    return this.http.get<ReportResponseDto<PartsRequestDto>>(`${this.baseUrl}/parts/crash-kit`);
  }

  /**
   * Get load bank parts information
   */
  getLoadBank(): Observable<ReportResponseDto<PartsRequestDto>> {
    return this.http.get<ReportResponseDto<PartsRequestDto>>(`${this.baseUrl}/parts/load-bank`);
  }

  // Site Status Reports
  /**
   * Get down sites
   */
  getDownSites(): Observable<ReportResponseDto<SiteStatusDto>> {
    return this.http.get<ReportResponseDto<SiteStatusDto>>(`${this.baseUrl}/sites/down-sites`);
  }

  /**
   * Get sites with equipment problems
   */
  getSitesWithEquipmentProblems(): Observable<ReportResponseDto<SiteStatusDto>> {
    return this.http.get<ReportResponseDto<SiteStatusDto>>(`${this.baseUrl}/sites/equipment-problems`);
  }

  // Job Performance Reports
  /**
   * Get past due unscheduled jobs
   */
  getPastDueUnscheduledJobs(): Observable<ReportResponseDto<JobPerformanceDto>> {
    return this.http.get<ReportResponseDto<JobPerformanceDto>>(`${this.baseUrl}/jobs/past-due-unscheduled`);
  }

  /**
   * Get jobs scheduled today
   */
  getScheduledToday(): Observable<ReportResponseDto<JobPerformanceDto>> {
    return this.http.get<ReportResponseDto<JobPerformanceDto>>(`${this.baseUrl}/jobs/scheduled-today`);
  }

  /**
   * Get completed manager review jobs
   */
  getCompletedManagerReview(): Observable<ReportResponseDto<ManagerReviewDto>> {
    return this.http.get<ReportResponseDto<ManagerReviewDto>>(`${this.baseUrl}/jobs/completed-manager-review`);
  }

  /**
   * Get jobs invoiced yesterday
   */
  getJobsInvoicedYesterday(): Observable<ReportResponseDto<JobPerformanceDto>> {
    return this.http.get<ReportResponseDto<JobPerformanceDto>>(`${this.baseUrl}/jobs/invoiced-yesterday`);
  }

  /**
   * Get service calls invoiced today
   */
  getServiceCallInvoicedToday(): Observable<ReportResponseDto<JobPerformanceDto>> {
    return this.http.get<ReportResponseDto<JobPerformanceDto>>(`${this.baseUrl}/jobs/service-calls-invoiced-today`);
  }

  // Dynamic Reports
  /**
   * Get unscheduled detail report by month
   */
  getUnscheduledDetail(month: string): Observable<ReportResponseDto<JobStatusDetailDto>> {
    return this.http.get<ReportResponseDto<JobStatusDetailDto>>(`${this.baseUrl}/unscheduled-detail/${encodeURIComponent(month)}`);
  }

  /**
   * Get unscheduled account manager detail report
   */
  getUnscheduledActMngrDetail(month: string, officeId?: string): Observable<ReportResponseDto<JobStatusDetailDto>> {
    const params = officeId ? new HttpParams().set('officeId', officeId) : undefined;
    return this.http.get<ReportResponseDto<JobStatusDetailDto>>(`${this.baseUrl}/unscheduled-act-mngr-detail/${encodeURIComponent(month)}`, { params });
  }

  /**
   * Get office-specific report
   */
  getOfficeSpecificReport(officeId: string): Observable<ReportResponseDto<JobPerformanceDto>> {
    return this.http.get<ReportResponseDto<JobPerformanceDto>>(`${this.baseUrl}/office/${encodeURIComponent(officeId)}/report`);
  }

  /**
   * Get technician FCD report
   */
  getTechnicianFCDReport(technicianName: string): Observable<ReportResponseDto<JobPerformanceDto>> {
    return this.http.get<ReportResponseDto<JobPerformanceDto>>(`${this.baseUrl}/technician/${encodeURIComponent(technicianName)}/fcd`);
  }

  /**
   * Get technician MIS report
   */
  getTechnicianMISReport(technicianName: string): Observable<ReportResponseDto<JobPerformanceDto>> {
    return this.http.get<ReportResponseDto<JobPerformanceDto>>(`${this.baseUrl}/technician/${encodeURIComponent(technicianName)}/mis`);
  }

  /**
   * Helper method to map chart data to API detail page names
   */
  getDetailPageForChart(chartType: string, dataSetName: string): string {
    const mappings: { [key: string]: string } = {
      'quotes': 'Quotes to be completed this week',
      'pending-quotes': 'Pending Quotes',
      'open-quotes': 'Open Quotes',
      'expired-quotes': 'Expired Quotes',
      'jobs-to-process': 'Jobs to be processed this week',
      'jobs-processed': 'Jobs processed this week',
      'jobs-scheduled': 'Jobs scheduled by Account Managers',
      'down-sites': 'Down Sites',
      'problem-sites': 'Sites with Equipment Problems',
      'contract-invoice': 'Contract Invoice Month to Date',
      'current-invoices': 'Current Invoices',
      'invoices-1-30': 'Invoices 1-30 Days',
      'invoices-31-60': 'Invoices 31-60 Days',
      'invoices-61-90': 'Invoices 61-90 Days',
      'invoices-91+': 'Invoices 91+ Days',
      'unscheduled': 'Unscheduled Jobs'
    };

    return mappings[chartType] || chartType;
  }
}