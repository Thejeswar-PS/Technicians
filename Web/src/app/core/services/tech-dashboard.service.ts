import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface TechDashboardKPIs {
  jobsScheduled: number;
  jobsToBeUploaded: number;
  emergencyJobs: number;
  missingJobs: number;
  jobsWithParts: number;
  jobsThisWeek: number;
}

export interface ActivityLogItem {
  activityDate: string;
  jobID: string;
  message: string;
  isNewDate: number;
}

export interface WeekJob {
  callNbr: string;
  custName: string;
  accmgr: string;
  dateStatusChanged: string;
}

export interface MonthlyChartData {
  monthNo: number;
  monthName: string;
  jobs: number;
}

export interface AccountManager {
  empID: string;
  empName: string;
}

export interface Technician {
  techID: string;
  techName: string;
}

@Injectable({
  providedIn: 'root'
})
export class TechDashboardService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get account managers list
   */
  getAccountManagers(): Observable<AccountManager[]> {
    return this.http.get<any>(`${this.apiUrl}/Common/GetAccountManagers`).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response.map((item: any) => ({
            empID: item.offid || item.offID || item.empID || item.empId || '',
            empName: item.offname || item.offName || item.empName || item.empname || ''
          }));
        }
        if (response.columns) {
          return this.mapColumnsArray(response.columns).map((item: any) => ({
            empID: item.offid || item.offID || item.empID || item.empId || '',
            empName: item.offname || item.offName || item.empName || item.empname || ''
          }));
        }
        return [];
      })
    );
  }

  /**
   * Get technicians list
   */
  getTechnicians(): Observable<Technician[]> {
    return this.http.get<any>(`${this.apiUrl}/Common/GetTechnicians`).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response.map((item: any) => ({
            techID: item.techID || item.techId || item.TechID || '',
            techName: item.techname || item.techName || item.TechName || ''
          }));
        }
        if (response.columns) {
          return this.mapColumnsArray(response.columns).map((item: any) => ({
            techID: item.techID || item.techId || item.TechID || '',
            techName: item.techname || item.techName || item.TechName || ''
          }));
        }
        return [];
      })
    );
  }

  /**
   * Get KPIs for the dashboard
   */
  getKPIs(accMgr: string, techID: string, yearType: string): Observable<TechDashboardKPIs> {
    let params = new HttpParams()
      .set('pOffid', accMgr)
      .set('TechID', techID)
      .set('YearType', yearType);

    return this.http.get<any>(`${this.apiUrl}/Common/GetKPIs`, { params }).pipe(
      map(response => {
        if (response.columns) {
          const item = response.columns;
          return {
            jobsScheduled: Number(item.JobsScheduled || 0),
            jobsToBeUploaded: Number(item.JobsToBeUploaded || 0),
            emergencyJobs: Number(item.EmergencyJobs || 0),
            missingJobs: Number(item.MissingJobs || 0),
            jobsWithParts: Number(item.JobsWithParts || 0),
            jobsThisWeek: Number(item.JobsThisWeek || 0)
          };
        }
        return response;
      })
    );
  }

  /**
   * Get recent activity log
   */
  getActivityLog(accMgr: string, techID: string): Observable<ActivityLogItem[]> {
    let params = new HttpParams()
      .set('AccMgr', accMgr)
      .set('TechID', techID);

    return this.http.get<any>(`${this.apiUrl}/Common/GetActivityLog`, { params }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        if (response.columns && Array.isArray(response.columns)) {
          return response.columns.map((item: any) => ({
            activityDate: item.ActivityDate || item.activityDate || '',
            jobID: item.JobID || item.jobID || '',
            message: item.Message || item.message || '',
            isNewDate: Number(item.IsNewDate || item.isNewDate || 0)
          }));
        }
        return [];
      })
    );
  }

  /**
   * Get current week's job list
   */
  getWeekJobs(accMgr: string, techID: string): Observable<WeekJob[]> {
    let params = new HttpParams()
      .set('AccMgr', accMgr)
      .set('TechID', techID);

    return this.http.get<any>(`${this.apiUrl}/Common/GetWeekJobs`, { params }).pipe(
      map(response => {
        if (Array.isArray(response)) {
          return response;
        }
        if (response.columns && Array.isArray(response.columns)) {
          return response.columns.map((item: any) => ({
            callNbr: item.CallNbr || item.callNbr || '',
            custName: item.CustName || item.custName || '',
            accmgr: item.Accmgr || item.accmgr || '',
            dateStatusChanged: item.DateStatusChanged || item.dateStatusChanged || ''
          }));
        }
        return [];
      })
    );
  }

  /**
   * Get monthly chart data (for both charts)
   */
  getMonthlyChart(accMgr: string, techID: string): Observable<MonthlyChartData[]> {
    let params = new HttpParams()
      .set('AccMgr', accMgr)
      .set('TechID', techID);

    return this.http.get<any>(`${this.apiUrl}/Common/GetMonthlyScheduledChart`, { params }).pipe(
      map(response => {
        // Handle new format: { labels: [], data: [] }
        if (response.labels && response.data && Array.isArray(response.labels) && Array.isArray(response.data)) {
          return response.labels.map((label: string, index: number) => ({
            monthNo: index + 1,
            monthName: label,
            jobs: Number(response.data[index] || 0)
          }));
        }

        if (Array.isArray(response)) {
          return response;
        }
        if (response.columns && Array.isArray(response.columns)) {
          return response.columns.map((item: any) => ({
            monthNo: Number(item.MonthNo || item.monthNo || 0),
            monthName: item.MonthName || item.monthName || '',
            jobs: Number(item.Jobs || item.jobs || 0)
          }));
        }
        return [];
      })
    );
  }

  /**
   * Helper method to map nested columns array
   */
  private mapColumnsArray(columns: any[]): any[] {
    return columns.map((item: any) => {
      const mapped: any = {};
      Object.keys(item).forEach(key => {
        mapped[key.charAt(0).toLowerCase() + key.slice(1)] = item[key];
      });
      return mapped;
    });
  }
}
