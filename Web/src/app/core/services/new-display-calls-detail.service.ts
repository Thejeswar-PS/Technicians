import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  NewDisplayCallsDetailRequestDto,
  NewDisplayCallsDetailResponseDto,
  ContractInvoiceDto,
  JobDetailDto,
  QuoteDetailDto,
  InvoiceDetailDto,
  UnscheduledJobDetailDto,
  SiteStatusDto,
  ContractBillingDto,
  PartsTrackingDto,
  CallStatusSummaryDto
} from '../model/new-display-calls-detail.model';

@Injectable({
  providedIn: 'root'
})
export class NewDisplayCallsDetailService {
  private readonly baseUrl = `${environment.apiUrl}/DisplayCallsDetail`;

  constructor(private http: HttpClient) {}

  /**
   * Get display calls detail data using query parameters - New API
   */
  getDisplayCallsDetailByParams(pDetailPage: string, pOffID: string = ''): Observable<any> {
    console.log('🚀 Service calling API with parameters:');
    console.log('  📄 pDetailPage:', pDetailPage);
    console.log('  🏢 pOffID:', pOffID);
    console.log('  🌐 Full URL will be:', `${this.baseUrl}?pDetailPage=${encodeURIComponent(pDetailPage)}&pOffID=${encodeURIComponent(pOffID)}`);
    
    const params = new HttpParams()
      .set('pDetailPage', pDetailPage)
      .set('pOffID', pOffID); // Always include pOffID, even if empty
    return this.http.get(`${this.baseUrl}`, { params });
  }

  /**
   * Generic method to get display calls detail data - Legacy support
   */
  getDisplayCallsDetail(request: NewDisplayCallsDetailRequestDto): Observable<NewDisplayCallsDetailResponseDto> {
    return this.getDisplayCallsDetailByParams(request.pDetailPage, request.pOffID || '');
  }

  /**
   * Get quotes to be completed this week
   */
  getQuotesToBeCompleted(officeId?: string): Observable<any> {
    // Try the exact string from the API test: "Quotes to be Completed"
    return this.getDisplayCallsDetailByParams('Quotes to be Completed', officeId || '');
  }

  /**
   * Get jobs to be processed this week
   */
  getJobsToBeProcessedThisWeek(): Observable<any> {
    return this.getDisplayCallsDetailByParams('Jobs to be processed this week');
  }

  /**
   * Get jobs processed this week
   */
  getJobsProcessedThisWeek(): Observable<any> {
    return this.getDisplayCallsDetailByParams('Jobs processed this week');
  }

  /**
   * Get jobs scheduled by account managers this week
   */
  getJobsScheduledByAccountManagers(): Observable<any> {
    return this.getDisplayCallsDetailByParams('Jobs scheduled by Account Managers');
  }

  /**
   * Get pending quotes
   */
  getPendingQuotes(): Observable<any> {
    return this.getDisplayCallsDetailByParams('Pending Quotes');
  }

  /**
   * Get open quotes
   */
  getOpenQuotes(): Observable<any> {
    return this.getDisplayCallsDetailByParams('Open Quotes');
  }

  /**
   * Get expired quotes
   */
  getExpiredQuotes(): Observable<any> {
    return this.getDisplayCallsDetailByParams('Expired Quotes');
  }

  /**
   * Get contract invoice month to date data
   */
  getContractInvoiceMonthToDate(): Observable<any> {
    return this.getDisplayCallsDetailByParams('Contract Invoice Month to Date');
  }

  /**
   * Get current invoices
   */
  getCurrentInvoices(): Observable<any> {
    return this.getDisplayCallsDetailByParams('Current Invoices');
  }

  /**
   * Get invoices by age range
   */
  getInvoicesByAge(ageRange: string): Observable<any> {
    return this.getDisplayCallsDetailByParams(`Invoices ${ageRange} Days`);
  }

  /**
   * Get down sites
   */
  getDownSites(): Observable<any> {
    return this.getDisplayCallsDetailByParams('Down Sites');
  }

  /**
   * Get sites with equipment problems
   */
  getSitesWithEquipmentProblems(): Observable<any> {
    return this.getDisplayCallsDetailByParams('Sites with Equipment Problems');
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