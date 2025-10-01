import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Job } from '../model/job-model';
import { IReportTeam } from '../model/trending-report-team.models';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(private http : HttpClient) { }

  private headers = new HttpHeaders({
    'Access-Control-Allow-Origin': '*'
  });
  API : string = environment.apiUrl;

  getJobReportDetails(queryType : any,owner: any,yearType: any) : Observable<Job[]>
  {
    return this.http.get<Job[]>(`${this.API}/report/GetJobReportDetails?type=${queryType}&owner=${owner}&yearType=${yearType}`,{ headers : this.headers });
  }
  getJobScheduleReport(queryType : any) : Observable<Job[]>
  {
    return this.http.get<Job[]>(`${this.API}/report/GetServiceMasterSearch?ueryType=${queryType}`,{ headers : this.headers });
  }
  getMontylyWeeklyTeams(type : any) : Observable<IReportTeam>
  {
    return this.http.get<IReportTeam>(`${this.API}/report/GetMontylyWeeklyTeams?type=${type}`,{ headers : this.headers });
  }
  importAndUpdate() : Observable<any>
  {
    return this.http.get<any>(`${this.API}/report/ImportServiceReport`,{ headers : this.headers });
  }
  removeAndArchivce(obj: any) : Observable<any>
  {
    return this.http.post<any>(`${this.API}/report/RemoveAndArchive`,obj,{ headers : this.headers });
  }
  readyToSend(obj: any) : Observable<any>
  {
    return this.http.post<any>(`${this.API}/report/ReadyToSend`,obj,{ headers : this.headers });
  }
}
