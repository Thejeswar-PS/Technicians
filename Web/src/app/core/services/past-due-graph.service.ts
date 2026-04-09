import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { 
  PastDueGraphResponseDto, 
  PastDueCallStatusDto, 
  PastDueJobsSummaryDto, 
  PastDueJobDetailDto,
  PastDueJobDetailResponseDto,
  ScheduledPercentageDto, 
  TotalJobsDto 
} from '../model/past-due-graph.model';

@Injectable({
  providedIn: 'root'
})
export class PastDueGraphService {
  private apiUrl = environment.apiUrl || 'https://localhost:7217/api';
  private pastDueInfoCache: PastDueGraphResponseDto | null = null;
  private readonly detailCache = new Map<string, PastDueJobDetailResponseDto>();

  constructor(private http: HttpClient) {}

  /**
   * Get all past due jobs information - main endpoint
   * Calls the /api/PastDueGraph/info endpoint
   */
  getPastDueJobsInfo(forceRefresh = false): Observable<PastDueGraphResponseDto> {
    if (!forceRefresh && this.pastDueInfoCache) {
      return of(this.pastDueInfoCache);
    }

    return this.http.get<PastDueGraphResponseDto>(`${this.apiUrl}/PastDueGraph/info`)
      .pipe(
        map(response => this.mapDates(response)),
        map(response => {
          this.pastDueInfoCache = response;
          return response;
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get call status details (first result set)
   * Calls the /api/PastDueGraph/call-status endpoint
   */
  getCallStatus(): Observable<PastDueCallStatusDto[]> {
    return this.http.get<PastDueCallStatusDto[]>(`${this.apiUrl}/PastDueGraph/call-status`)
      .pipe(
        map(response => response.map(item => ({
          ...item,
          scheduledStart: new Date(item.scheduledStart),
          scheduledEnd: new Date(item.scheduledEnd)
        }))),
        catchError(this.handleError)
      );
  }

  /**
   * Get past due jobs summary by account manager (second result set)
   * Calls the /api/PastDueGraph/summary endpoint
   */
  getPastDueJobsSummary(): Observable<PastDueJobsSummaryDto[]> {
    return this.http.get<PastDueJobsSummaryDto[]>(`${this.apiUrl}/PastDueGraph/summary`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getPastDueJobsDetail(accountManager?: string, category?: string, forceRefresh = false): Observable<PastDueJobDetailResponseDto> {
    let params = new HttpParams();
    const normalizedCategory = this.normalizeCategory(category);

    if (accountManager) {
      params = params.set('accountManager', accountManager);
    }

    if (normalizedCategory) {
      params = params.set('category', normalizedCategory);
    }

    const url = `${this.apiUrl}/PastDueGraph/GetPastDueJobsDetail`;
    const cacheKey = `${(accountManager || 'ALL').trim()}__${normalizedCategory || 'ALL'}`;

    if (!forceRefresh && this.detailCache.has(cacheKey)) {
      return of(this.detailCache.get(cacheKey)!);
    }

    return this.http.get<PastDueJobDetailResponseDto>(url, { params }).pipe(
      map(response => ({
        ...response,
        data: (response.data || []).map((item: PastDueJobDetailDto) => ({
          ...item,
          scheduledStart: item.scheduledStart ? new Date(item.scheduledStart) : new Date(0),
          scheduledEnd: item.scheduledEnd ? new Date(item.scheduledEnd) : new Date(0)
        }))
      })),
      map(response => {
        this.detailCache.set(cacheKey, response);
        return response;
      }),
      catchError(this.handleError)
    );
  }

  clearCache(): void {
    this.pastDueInfoCache = null;
    this.detailCache.clear();
  }

  private normalizeCategory(category?: string): string | undefined {
    const normalized = (category || '').trim().toLowerCase();

    if (!normalized) {
      return undefined;
    }

    if (normalized === 'billable') {
      return 'Billable';
    }

    if (normalized === 'pastdue' || normalized === 'past-due' || normalized === 'past_due') {
      return 'PastDue';
    }

    return category?.trim() || undefined;
  }

  /**
   * Get scheduled percentages by office (third result set)
   * Calls the /api/PastDueGraph/scheduled-percentages endpoint
   */
  getScheduledPercentages(): Observable<ScheduledPercentageDto[]> {
    return this.http.get<ScheduledPercentageDto[]>(`${this.apiUrl}/PastDueGraph/scheduled-percentages`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get total unscheduled jobs by office (fourth result set)
   * Calls the /api/PastDueGraph/total-unscheduled-jobs endpoint
   */
  getTotalUnscheduledJobs(): Observable<TotalJobsDto[]> {
    return this.http.get<TotalJobsDto[]>(`${this.apiUrl}/PastDueGraph/total-unscheduled-jobs`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Get total scheduled jobs by office (fifth result set)
   * Calls the /api/PastDueGraph/total-scheduled-jobs endpoint
   */
  getTotalScheduledJobs(): Observable<TotalJobsDto[]> {
    return this.http.get<TotalJobsDto[]>(`${this.apiUrl}/PastDueGraph/total-scheduled-jobs`)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Map date strings to Date objects in the main response
   * @param response - The API response
   */
  private mapDates(response: PastDueGraphResponseDto): PastDueGraphResponseDto {
    return {
      ...response,
      generatedAt: new Date(response.generatedAt),
      callStatus: (response.callStatus || []).map(item => ({
        ...item,
        scheduledStart: new Date(item.scheduledStart),
        scheduledEnd: new Date(item.scheduledEnd)
      }))
    };
  }

  /**
   * Handle HTTP errors
   * @param error - The HTTP error response
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    
    console.error('PastDueGraphService Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Get API URL for debugging purposes
   */
  getApiUrl(): string {
    return this.apiUrl;
  }
}