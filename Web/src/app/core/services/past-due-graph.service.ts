import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { 
  PastDueGraphResponseDto, 
  PastDueCallStatusDto, 
  PastDueJobsSummaryDto, 
  ScheduledPercentageDto, 
  TotalJobsDto 
} from '../model/past-due-graph.model';

@Injectable({
  providedIn: 'root'
})
export class PastDueGraphService {
  private apiUrl = environment.apiUrl || 'https://localhost:7217/api';

  constructor(private http: HttpClient) {}

  /**
   * Get all past due jobs information - main endpoint
   * Calls the /api/PastDueGraph/info endpoint
   */
  getPastDueJobsInfo(): Observable<PastDueGraphResponseDto> {
    return this.http.get<PastDueGraphResponseDto>(`${this.apiUrl}/PastDueGraph/info`)
      .pipe(
        map(response => this.mapDates(response)),
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
      callStatus: response.callStatus.map(item => ({
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