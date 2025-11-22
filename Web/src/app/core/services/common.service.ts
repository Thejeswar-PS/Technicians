import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { EmployeeStatusDto, EmployeeStatusRequestDto } from '../model/employee-status.model';
import { AccountManager } from '../model/account-manager.model';

@Injectable({
  providedIn: 'root'
})
export class CommonService {
  constructor(private http : HttpClient) { }

  private headers = new HttpHeaders({
    'Access-Control-Allow-Origin': '*'
  });

  API : string = environment.apiUrl;

  getAccountManagers(): Observable<AccountManager[]>
  {
    return this.http.get<AccountManager[]>(`${this.API}/Common/GetAccountManagers`, { headers: this.headers });
  }

  getTechnicians()
  {
    return this.http.get(`${this.API}/Common/GetTechnicians`,{ headers : this.headers });
  }
  getStates()
  {
    return this.http.get(`${this.API}/Common/GetStates`,{ headers : this.headers });
  }

  // New methods for the required filter loading flow
  getEmployeeStatusForJobList(windowsID: string): Observable<EmployeeStatusDto>
  {
    return this.http.get<EmployeeStatusDto>(`${this.API}/Common/GetEmployeeStatusForJobList?adUserID=${windowsID}`, { headers: this.headers });
  }

  // POST version of employee status for job list
  getEmployeeStatusForJobListPost(request: EmployeeStatusRequestDto): Observable<EmployeeStatusDto>
  {
    return this.http.post<EmployeeStatusDto>(`${this.API}/Common/GetEmployeeStatusForJobList`, request, { headers: this.headers });
  }
  
  getTechNamesByEmpID(empID: string, status: string)
  {
    return this.http.get(`${this.API}/Common/GetTechNamesByEmpID?empID=${empID}&empType=${status}`,{ headers : this.headers });
  }

}
