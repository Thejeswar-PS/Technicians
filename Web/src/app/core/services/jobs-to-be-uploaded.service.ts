import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface JobRecord {
  callNbr: string;
  techName: string;
  accMgr: string;
  status: string;
  strtDate: string;
  custName: string;
  changeAge: string;
}

@Injectable({
  providedIn: 'root'
})
export class JobsToBeUploadedService {
  private headers = new HttpHeaders({
    'Access-Control-Allow-Origin': '*'
  });

  API: string = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get jobs to be uploaded based on filters
   * @param technicianID - Selected technician ID or 'All'
   * @param accountManagerName - Selected account manager name or 'All'
   * @param empID - Current employee ID
   * @returns Observable of job records
   */
  getJobsToBeUploaded(
    technicianID: string,
    accountManagerName: string,
    empID: string
  ): Observable<JobRecord[]> {
    const params = {
      technicianID: technicianID,
      accountManagerName: accountManagerName,
      empID: empID
    };

    return this.http.get<JobRecord[]>(
      `${this.API}/TechTools/GetJobsToBeUploaded`,
      {
        headers: this.headers,
        params: params
      }
    );
  }
}
