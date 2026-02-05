import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UnscheduledReportService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get unscheduled report data with grids and charts
   * Returns 5 datasets from stored procedure: PDueUnscheduledJobsInfo
   * - Table 0: Grid data (all job details)
   * - Table 1: Past Due / Bill After PM by Account Manager
   * - Table 2: Scheduled Percentage by Account Manager
   * - Table 3: Total Jobs to be Scheduled
   * - Table 4: Total Jobs Scheduled
   */
  getUnscheduledReportData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/TechTools/GetPastDueUnscheduledJobs`);
  }
}
