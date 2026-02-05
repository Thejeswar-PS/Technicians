import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UnscheduledJobsGraphService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get unscheduled jobs grouped by month
   * Calls stored procedure: DisplayUnscheduledGraph
   */
  getUnscheduledJobsByMonth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/TechTools/GetUnscheduledJobsByMonth`);
  }

  /**
   * Get unscheduled jobs by account manager for a specific month
   * Calls stored procedure: DisplayUnscheduledActMngrGraph
   * @param month - The month name (e.g., "January", "February")
   */
  getUnscheduledJobsByAccountManager(month: string): Observable<any> {
    const params = new HttpParams().set('month', month);
    return this.http.get(`${this.apiUrl}/TechTools/GetUnscheduledJobsByAccountManager`, { params });
  }
}
