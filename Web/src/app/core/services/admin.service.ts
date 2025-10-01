import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { StopReminder } from '../model/job-remider.models';
import { Observable } from 'rxjs';
import { ICustomerFeedback } from '../model/customer-feedback.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  url: string = environment.apiUrl;
  private headers = new HttpHeaders({
    'Access-Control-Allow-Origin': '*'
  });

  constructor(private http: HttpClient) { }
  GetStopReminders(payload: {manager: string, type: string}): Observable<StopReminder[]>{
    return this.http.get<StopReminder[]>(`${this.url}/Admin/GetStopReminders?manager=${payload.manager}&type=${payload.type}`, {headers: this.headers})
  }
  getCustomerFeedback(payload: {type: string, manager: string}): Observable<ICustomerFeedback>{
    return this.http.get<ICustomerFeedback>(`${this.url}/Admin/GetCustomerFeedback?type=${payload.type}&jobOwner=${payload.manager.trim()}`, {headers: this.headers})
  }
  getCustomerFeedbackDetails(payload: {status: string, ownerId: string, year: string}): Observable<any>{
    return this.http.get<any>(`${this.url}/Admin/GetCustomerFeedbackDetails?ownerId=${payload.ownerId}&status=${payload.status}&year=${payload.year}`, {headers: this.headers})
  }

  ToBeScheduledCustomers(ownerId: string)
  {
    return this.http.get(`${this.url}/Admin/ToBeScheduledCustomers?ownerId=${ownerId}`,{ headers : this.headers });
  }
  GetCustIDsbyCustomer(ownerId: string, custName : string)
  {
    return this.http.get(`${this.url}/Admin/GetCustIDsbyCustomer?ownerId=${ownerId}&custName=${custName}`,{ headers : this.headers });
  }
  GetToBeScheduleJobs(custId: string)
  {
    return this.http.get(`${this.url}/Admin/GetToBeScheduleJobs?custId=${custId}`,{ headers : this.headers });
  }
  UpdateScheduleJobsinGP(model: any)
  {
    return this.http.put(`${this.url}/Admin/UpdateScheduleJobsinGP`,model,{ headers : this.headers });
  }
  UpdateStopReminder(model: any)
  {
    return this.http.put(`${this.url}/Admin/UpdateStopReminder`,model,{ headers : this.headers });
  }
  SearchStopReminder(owner: string,site: string)
  {
    return this.http.get(`${this.url}/Admin/SearchStopReminder?siteName=${site}&&manager=${owner}`,{ headers : this.headers });
  }
  GetCustFeedSearchResults(jobId: string)
  {
    return this.http.get(`${this.url}/Jobs/GetCustFeedSearchResults?jobId=${jobId}`,{ headers : this.headers });
  }
  GetCustFeedbackByToken(token: string)
  {
    return this.http.get(`${this.url}/Admin/GetCustomerFeedbackByToken?token=${token}`,{ headers : this.headers });
  }

}
