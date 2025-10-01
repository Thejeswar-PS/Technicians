import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Job } from '../model/job-model';
import { EquipmentDetails } from '../model/equipment-detail.modal';
import { ActivityDetailLog } from '../model/equipment-detail-log.modal';
import { DCGBatteryPricingDetail } from '../model/dcg-battery-pricing-details.modal';
import { GetServiceReportsDetails } from '../model/service-report-details-model';
import { CalendarJobDetails } from '../model/calendar-job-details.model';
import { GetNotes } from '../model/get-notes.model';
@Injectable({
  providedIn: 'root'
})
export class JobService {

  constructor(private http : HttpClient) { }

  private headers = new HttpHeaders({
    'Access-Control-Allow-Origin': '*'
  });
  API : string = environment.apiUrl;

  getCalenderJobData(payload: any): Observable<CalendarJobDetails[]>{
    let params = new HttpParams({ fromObject: payload })
    return this.http.get<CalendarJobDetails[]>(`${this.API}/Jobs/GetCalenderJobData?${params}`,{ headers : this.headers });
  }
  getDCGBatteryPricingDetails(ids: string, quantity: number): Observable<DCGBatteryPricingDetail[]>{
    return this.http.get<DCGBatteryPricingDetail[]>(`${this.API}/Jobs/GetPricingDetails?ids=${ids}&quantity=${quantity}`,{ headers : this.headers });
  }

  getActivity(jobId: string): Observable<ActivityDetailLog[]>{
    return this.http.get<ActivityDetailLog[]>(`${this.API}/Jobs/GetActivity?jobId=${jobId}` ,{ headers : this.headers });
  }
  getEquipmentDetails(jobId: string): Observable<EquipmentDetails[]>{
    return this.http.get<EquipmentDetails[]>(`${this.API}/Jobs/GetEquipmentDetails?jobId=${jobId}`,{ headers : this.headers })
  }
  getServiceDetails(req : any) : Observable<Job[]>
  {
    let params = new HttpParams({ fromObject: req })
    return this.http.get<Job[]>(`${this.API}/jobs/GetServiceDetails?${params}`,{ headers : this.headers });
  }
  getServiceMasterSearch(jobId : any, manager : any, status : any, year : any, month : any, pagination: any) : Observable<Job[]>
  {
    let params = new HttpParams({ fromObject: pagination })
    return this.http.get<Job[]>(`${this.API}/jobs/GetServiceMasterSearch?jobId=${jobId}&accMgr=${manager}&status=${status}&year=${year}&month=${month}&${params}`,{ headers : this.headers });
  }
  getJobStatus() : Observable<any[]>
  {
    return this.http.get<any[]>(`${this.API}/jobs/GetJobStatus`,{ headers : this.headers });
  }
  getJobDetails(rowIndex: string) : Observable<any[]>
  {
    return this.http.get<any[]>(`${this.API}/jobs/GetJobDetails?rowIndex=${rowIndex}`,{ headers : this.headers });
  }
  updateJob(obj: any)
  {
    return this.http.put(`${this.API}/jobs/UpdateJobIDStatusComments`, obj,{ headers : this.headers });
  }
  updateJobStatus(rowIndex: string, status: string, modifiedBy: string, notes: string)
  {
    let payload = {
      rowIndex,
      status,
      modifiedBy,
      notes
    }
    return this.http.put(`${this.API}/jobs/UpdateJobStatus`, payload,{ headers : this.headers });
  }

  getServiceReportsDetails(req : any) : Observable<GetServiceReportsDetails[]>
  {
    let params = new HttpParams({ fromObject: req })
    return this.http.get<GetServiceReportsDetails[]>(`${this.API}/report/GetServiceReportsDetails?${params}`,{ headers : this.headers });
  }
  getNotes(req : any) : Observable<GetNotes>
  {
    let params = new HttpParams({ fromObject: req })
    return this.http.get<GetNotes>(`${this.API}/jobs/GetNotes?${params}`,{ headers : this.headers });
  }
  importJobs(accMngr: any) : Observable<any>
  {
    return this.http.get<any[]>(`${this.API}/jobs/ImportJobs?accManager=${accMngr}`,{ headers : this.headers });
  }
}
