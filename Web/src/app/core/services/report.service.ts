import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Job } from '../model/job-model';
import { IReportTeam } from '../model/trending-report-team.models';
import { 
  PartsRequestStatusItem, 
  PartsRequestStatusFilter, 
  PartsRequestStatusResponse,
  PartReqStatusDto,
  PartReqStatusRequestDto,
  PartReqStatusResponseDto
} from '../model/parts-request-status.model';
import { InventoryUser, InventoryUserResponse } from '../model/inventory-user.model';
import { EmployeeStatusRequestDto, EmployeeStatusDto } from '../model/employee-status.model';
import { 
  PartReturnStatusDto,
  PartReturnStatusRequestDto,
  PartReturnStatusResponseDto,
  PartsToBeReceivedApiResponseDto,
  PartsReceivedByWHApiResponseDto,
  WeeklyPartsReturnedCountDto,
  WeeklyPartsReturnedCountApiResponseDto,
  PartsReturnDataByWeekNoDto,
  PartsReturnDataByWeekNoApiResponseDto
} from '../model/part-return-status.model';

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

  // Parts Request Status Report methods
  getPartsRequestStatusReport(filter: PartsRequestStatusFilter): Observable<PartsRequestStatusResponse>
  {
    let params = new HttpParams()
      .set('ownerId', filter.ownerId)
      .set('accountManager', filter.accountManager)
      .set('status', filter.status)
      .set('yearType', filter.yearType || '');
    
    // Add inventory user parameter if provided
    if (filter.inventoryUser) {
      params = params.set('inventoryUser', filter.inventoryUser);
    }
    
    return this.http.get<PartsRequestStatusResponse>(`${this.API}/report/GetPartsRequestStatus`, { 
      headers: this.headers,
      params: params 
    });
  }

  approvePartsRequest(requestId: string): Observable<any>
  {
    return this.http.post<any>(`${this.API}/report/ApprovePartsRequest`, { requestId }, { headers: this.headers });
  }

  rejectPartsRequest(requestId: string, reason?: string): Observable<any>
  {
    return this.http.post<any>(`${this.API}/report/RejectPartsRequest`, { requestId, reason }, { headers: this.headers });
  }

  // New Part Request Status API methods
  getPartReqStatus(request: PartReqStatusRequestDto): Observable<PartReqStatusResponseDto>
  {
    return this.http.post<PartReqStatusResponseDto>(`${this.API}/PartReqStatus/GetPartReqStatus`, request, { headers: this.headers });
  }

  getPartReqStatusByKey(key: number, invUserID: string = 'All', offName: string = 'All'): Observable<PartReqStatusResponseDto>
  {
    let params = new HttpParams()
      .set('key', key.toString())
      .set('invUserID', invUserID)
      .set('offName', offName);
    
    return this.http.get<PartReqStatusResponseDto>(`${this.API}/PartReqStatus/GetPartReqStatusByKey`, { 
      headers: this.headers,
      params: params 
    });
  }

  getPartReqList(key: number, invUserID: string = 'All', offName: string = 'All'): Observable<PartReqStatusDto[]>
  {
    let params = new HttpParams()
      .set('key', key.toString())
      .set('invUserID', invUserID)
      .set('offName', offName);
    
    return this.http.get<PartReqStatusDto[]>(`${this.API}/PartReqStatus/GetPartReqList`, { 
      headers: this.headers,
      params: params 
    });
  }

  getPartCounts(invUserID: string = 'All'): Observable<{ [key: string]: number }>
  {
    let params = new HttpParams().set('invUserID', invUserID);
    
    return this.http.get<{ [key: string]: number }>(`${this.API}/PartReqStatus/GetPartCounts`, { 
      headers: this.headers,
      params: params 
    });
  }

  // Specific part status methods
  getAllParts(invUserID: string = 'All', offName: string = 'All'): Observable<PartReqStatusDto[]>
  {
    let params = new HttpParams()
      .set('invUserID', invUserID)
      .set('offName', offName);
    
    return this.http.get<PartReqStatusDto[]>(`${this.API}/PartReqStatus/GetAllParts`, { 
      headers: this.headers,
      params: params 
    });
  }

  getStagingParts(invUserID: string = 'All', offName: string = 'All'): Observable<PartReqStatusDto[]>
  {
    let params = new HttpParams()
      .set('invUserID', invUserID)
      .set('offName', offName);
    
    return this.http.get<PartReqStatusDto[]>(`${this.API}/PartReqStatus/GetStagingParts`, { 
      headers: this.headers,
      params: params 
    });
  }

  getSubmittedParts(invUserID: string = 'All', offName: string = 'All'): Observable<PartReqStatusDto[]>
  {
    let params = new HttpParams()
      .set('invUserID', invUserID)
      .set('offName', offName);
    
    return this.http.get<PartReqStatusDto[]>(`${this.API}/PartReqStatus/GetSubmittedParts`, { 
      headers: this.headers,
      params: params 
    });
  }

  getUrgentParts(invUserID: string = 'All', offName: string = 'All'): Observable<PartReqStatusDto[]>
  {
    let params = new HttpParams()
      .set('invUserID', invUserID)
      .set('offName', offName);
    
    return this.http.get<PartReqStatusDto[]>(`${this.API}/PartReqStatus/GetUrgentParts`, { 
      headers: this.headers,
      params: params 
    });
  }

  getPartsNeedingAttention(invUserID: string = 'All', offName: string = 'All'): Observable<PartReqStatusDto[]>
  {
    let params = new HttpParams()
      .set('invUserID', invUserID)
      .set('offName', offName);
    
    return this.http.get<PartReqStatusDto[]>(`${this.API}/PartReqStatus/GetPartsNeedingAttention`, { 
      headers: this.headers,
      params: params 
    });
  }

  getPartsOrderedTrackingRequired(invUserID: string = 'All', offName: string = 'All'): Observable<PartReqStatusDto[]>
  {
    let params = new HttpParams()
      .set('invUserID', invUserID)
      .set('offName', offName);
    
    return this.http.get<PartReqStatusDto[]>(`${this.API}/PartReqStatus/GetPartsOrderedTrackingRequired`, { 
      headers: this.headers,
      params: params 
    });
  }

  getShippedParts(invUserID: string = 'All', offName: string = 'All'): Observable<PartReqStatusDto[]>
  {
    let params = new HttpParams()
      .set('invUserID', invUserID)
      .set('offName', offName);
    
    return this.http.get<PartReqStatusDto[]>(`${this.API}/PartReqStatus/GetShippedParts`, { 
      headers: this.headers,
      params: params 
    });
  }

  getDeliveredParts(invUserID: string = 'All', offName: string = 'All'): Observable<PartReqStatusDto[]>
  {
    let params = new HttpParams()
      .set('invUserID', invUserID)
      .set('offName', offName);
    
    return this.http.get<PartReqStatusDto[]>(`${this.API}/PartReqStatus/GetDeliveredParts`, { 
      headers: this.headers,
      params: params 
    });
  }

  getInitiatedParts(invUserID: string = 'All', offName: string = 'All'): Observable<PartReqStatusDto[]>
  {
    let params = new HttpParams()
      .set('invUserID', invUserID)
      .set('offName', offName);
    
    return this.http.get<PartReqStatusDto[]>(`${this.API}/PartReqStatus/GetInitiatedParts`, { 
      headers: this.headers,
      params: params 
    });
  }

  // Employee status methods
  getEmployeeStatusForJobList(request: EmployeeStatusRequestDto): Observable<EmployeeStatusDto>
  {
    return this.http.post<EmployeeStatusDto>(`${this.API}/PartReqStatus/GetEmployeeStatusForJobList`, request, { headers: this.headers });
  }

  getEmployeeStatusForJobListByParam(adUserID: string): Observable<EmployeeStatusDto>
  {
    let params = new HttpParams().set('adUserID', adUserID);
    
    return this.http.get<EmployeeStatusDto>(`${this.API}/PartReqStatus/GetEmployeeStatusForJobList`, { 
      headers: this.headers,
      params: params 
    });
  }

  // Account Manager methods
  getAccountManagerNames(): Observable<any[]>
  {
    return this.http.get<any[]>(`${this.API}/PartReqStatus/GetAccountManagerNames`, { headers: this.headers });
  }

  // Inventory User methods
  getInventoryUserNames(): Observable<InventoryUser[]>
  {
    return this.http.get<InventoryUser[]>(`${this.API}/PartReqStatus/GetInventoryUserNames`, { headers: this.headers });
  }

  // Part Return Status API methods
  getPartReturnStatus(request: PartReturnStatusRequestDto): Observable<PartReturnStatusResponseDto>
  {
    const url = `${this.API}/PartReturnStatus/GetPartReturnStatus`;
    
    return this.http.post<PartReturnStatusResponseDto>(url, request, { headers: this.headers });
  }

  getPartReturnStatusForGraph(invUserID: string = 'All', year?: number): Observable<PartReturnStatusResponseDto>
  {
    let params = new HttpParams()
      .set('invUserID', invUserID);
    
    if (year) {
      params = params.set('year', year.toString());
    }

    return this.http.get<PartReturnStatusResponseDto>(`${this.API}/PartReturnStatus/GetPartReturnStatusForGraph`, { 
      headers: this.headers,
      params: params 
    });
  }

  getPartsNotReceived(invUserID: string = 'All', year?: number): Observable<PartReturnStatusResponseDto>
  {
    let params = new HttpParams()
      .set('invUserID', invUserID);
    
    if (year) {
      params = params.set('year', year.toString());
    }

    return this.http.get<PartReturnStatusResponseDto>(`${this.API}/PartReturnStatus/GetPartsNotReceived`, { 
      headers: this.headers,
      params: params 
    });
  }

  getPartsInProgress(invUserID: string = 'All', year?: number): Observable<PartReturnStatusResponseDto>
  {
    let params = new HttpParams()
      .set('invUserID', invUserID);
    
    if (year) {
      params = params.set('year', year.toString());
    }

    return this.http.get<PartReturnStatusResponseDto>(`${this.API}/PartReturnStatus/GetPartsInProgress`, { 
      headers: this.headers,
      params: params 
    });
  }

  getPartsPending(invUserID: string = 'All', year?: number): Observable<PartReturnStatusResponseDto>
  {
    let params = new HttpParams()
      .set('invUserID', invUserID);
    
    if (year) {
      params = params.set('year', year.toString());
    }

    return this.http.get<PartReturnStatusResponseDto>(`${this.API}/PartReturnStatus/GetPartsPending`, { 
      headers: this.headers,
      params: params 
    });
  }

  getPartsReturned(invUserID: string = 'All', year?: number): Observable<PartReturnStatusResponseDto>
  {
    let params = new HttpParams()
      .set('invUserID', invUserID);
    
    if (year) {
      params = params.set('year', year.toString());
    }

    return this.http.get<PartReturnStatusResponseDto>(`${this.API}/PartReturnStatus/GetPartsReturned`, { 
      headers: this.headers,
      params: params 
    });
  }

  getPartReturnStatusByKey(key: number, invUserID: string = 'All', year?: number): Observable<PartReturnStatusResponseDto>
  {
    let params = new HttpParams()
      .set('key', key.toString())
      .set('invUserID', invUserID);
    
    if (year) {
      params = params.set('year', year.toString());
    }

    return this.http.get<PartReturnStatusResponseDto>(`${this.API}/PartReturnStatus/GetPartReturnStatusByKey`, { 
      headers: this.headers,
      params: params 
    });
  }

  // Parts to be Received Chart API
  getPartsToBeReceivedChart(year?: number): Observable<PartsToBeReceivedApiResponseDto> {
    let params = new HttpParams();
    
    if (year) {
      params = params.set('year', year.toString());
    }

    return this.http.get<PartsToBeReceivedApiResponseDto>(`${this.API}/PartReturnStatus/GetPartsToBeReceivedChart`, { 
      headers: this.headers,
      params: params 
    });
  }

  // Parts Received by Warehouse Chart API
  getPartsReceivedByWHChart(year?: number): Observable<PartsReceivedByWHApiResponseDto> {
    let params = new HttpParams();
    
    if (year) {
      params = params.set('year', year.toString());
    }

    return this.http.get<PartsReceivedByWHApiResponseDto>(`${this.API}/PartReturnStatus/GetPartsReceivedByWHChart`, { 
      headers: this.headers,
      params: params 
    });
  }

  // Weekly Parts Returned Count API
  getWeeklyPartsReturnedCount(): Observable<WeeklyPartsReturnedCountApiResponseDto> {
    return this.http.get<WeeklyPartsReturnedCountApiResponseDto>(`${this.API}/PartReturnStatus/GetWeeklyPartsReturnedCount`, { 
      headers: this.headers
    });
  }

  // Parts Return Data by Week Number API
  getPartsReturnDataByWeekNo(weekNo: number): Observable<PartsReturnDataByWeekNoApiResponseDto> {
    let params = new HttpParams()
      .set('weekNo', weekNo.toString());

    return this.http.get<PartsReturnDataByWeekNoApiResponseDto>(`${this.API}/PartReturnStatus/GetPartsReturnDataByWeekNo`, { 
      headers: this.headers,
      params: params 
    });
  }
}
