import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
import { 
  StrippedUnitsStatusDto,
  MakeCountDto,
  StrippedUnitsStatusRequest,
  StrippedUnitsStatusResponse,
  StrippedUnitsStatusApiResponse,
  StrippedUnitApiResponse,
  StrippedPartsDetailDto,
  StrippedPartsInUnitResponse,
  StrippedPartsInUnitApiResponse,
  StrippedPartsInUnitDto,
  StrippedPartsInUnitListResponse,
  StripPartCodeDto,
  StripPartCodeApiResponse
} from '../model/stripped-units-status.model';
import { 
  OrderRequestStatusRequestDto, 
  OrderRequestStatusDto, 
  OrderRequestStatusResponse 
} from '../model/order-request-status.model';
import { EmergencyJobsResponseDto } from '../model/emergency-jobs.model';
import { 
  AccMgrPerformanceReportResponseDto,
  AccMgrPerformanceReportSummaryDto,
  AccMgrCallStatusDto,
  AccMgrReturnedForProcessingDto,
  AccMgrUnscheduledJobDto
} from '../model/account-manager-performance-report.model';
import { 
  PartsTestRequest, 
  PartsTestResponse,
  SaveUpdatePartsTestDto,
  SaveUpdatePartsTestResponse,
  EmployeeDto,
  EmployeeRequest,
  EmployeeResponse,
  DeletePartsTestResponse
} from '../model/parts-test-info.model';
import { 
  PartsTestStatusDto,
  PartsTestStatusRequest,
  PartsTestStatusResponse,
  PartsTestStatusApiResponse,
  MakeModelDto,
  DistinctMakesResponse,
  DistinctModelsResponse,
  DistinctModelsByMakeResponse
} from '../model/parts-test-status.model';
import { 
  AcctStatusGraphDto,
  AccMgmtGraphDto,
  AccountManagerPaperworkDto,
  AccountManagerGraphResponse
} from '../model/account-manager-graph.model';
import {
  PartsSearchRequestDto,
  PartsSearchDataDto,
  PartsSearchDataResponse
} from '../model/parts-search.model';

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

  // Order Request Status API methods
  getOrderRequestStatus(request: OrderRequestStatusRequestDto): Observable<OrderRequestStatusDto[]> {
    return this.http.post<any[]>(`${this.API}/OrderRequestStatus/GetOrderRequestStatus`, request, { 
      headers: this.headers 
    }).pipe(
      // Transform API response to match frontend model
      map((response: any[]) => {
        if (!response || !Array.isArray(response)) {
          return [];
        }
        return response.map((item: any, index: number) => {
          if (!item) {
            return {
              rowIndex: index + 1,
              orderType: undefined,
              requester: undefined,
              dcgPartNo: undefined,
              manufPartNo: undefined,
              qtyNeeded: undefined,
              vendor: undefined,
              poNumber: undefined,
              orderDate: undefined,
              arriveDate: undefined,
              notes: undefined,
              status: undefined,
              lastModifiedBy: undefined,
              createdOn: undefined,
              createdBy: undefined,
              modifiedBy: undefined,
              modifiedOn: undefined,
              archive: false
            } as OrderRequestStatusDto;
          }
          return {
            rowIndex: item.rowIndex || (index + 1),
            orderType: item.orderType || undefined,
            requester: item.requester || undefined,
            dcgPartNo: item.dcgPartNo || undefined,
            manufPartNo: item.manufPartNo || undefined,
            qtyNeeded: item.qtyNeeded || undefined,
            vendor: item.vendor || undefined,
            poNumber: item.poNumber || undefined,
            orderDate: item.orderDate || undefined,
            arriveDate: item.arriveDate || undefined,
            notes: item.notes || item.comment || item.description || item.remarks || undefined,
            status: item.status || undefined,
            lastModifiedBy: item.lastModifiedBy || undefined,
            // Map API fields to frontend expected fields
            createdOn: item.lastModifiedOn || item.createdOn || item.modifiedOn || undefined,
            createdBy: item.lastModifiedBy || item.createdBy || item.modifiedBy || undefined,
            modifiedBy: item.lastModifiedBy || item.modifiedBy || undefined,
            modifiedOn: item.lastModifiedOn || item.modifiedOn || undefined,
            archive: item.archive || false
          } as OrderRequestStatusDto;
        });
      })
    );
  }

  getOrderRequestStatusByParams(status: string = 'All', orderType: string = 'All', archive: boolean = false): Observable<OrderRequestStatusDto[]> {
    let params = new HttpParams()
      .set('status', status)
      .set('orderType', orderType)
      .set('archive', archive.toString());

    return this.http.get<any[]>(`${this.API}/OrderRequestStatus/GetOrderRequestStatus`, { 
      headers: this.headers,
      params: params 
    }).pipe(
      // Transform API response to match frontend model
      map((response: any[]) => {
        console.log('Raw API response for getOrderRequestStatusByParams:', response);
        if (!response || !Array.isArray(response)) {
          return [];
        }
        return response.map((item: any, index: number) => {
          console.log(`Item ${index}:`, item);
          console.log(`Item ${index} all fields:`, Object.keys(item || {}));
          console.log(`Item ${index} notes field:`, item?.notes);
          console.log(`Item ${index} comment field:`, item?.comment);
          console.log(`Item ${index} description field:`, item?.description);
          console.log(`Item ${index} remarks field:`, item?.remarks);
          if (!item) {
            return {
              rowIndex: index + 1,
              orderType: undefined,
              requester: undefined,
              dcgPartNo: undefined,
              manufPartNo: undefined,
              qtyNeeded: undefined,
              vendor: undefined,
              poNumber: undefined,
              orderDate: undefined,
              arriveDate: undefined,
              notes: undefined,
              status: undefined,
              lastModifiedBy: undefined,
              createdOn: undefined,
              createdBy: undefined,
              modifiedBy: undefined,
              modifiedOn: undefined,
              archive: false
            } as OrderRequestStatusDto;
          }
          return {
            rowIndex: item.rowIndex || (index + 1),
            orderType: item.orderType || undefined,
            requester: item.requester || undefined,
            dcgPartNo: item.dcgPartNo || undefined,
            manufPartNo: item.manufPartNo || undefined,
            qtyNeeded: item.qtyNeeded || undefined,
            vendor: item.vendor || undefined,
            poNumber: item.poNumber || undefined,
            orderDate: item.orderDate || undefined,
            arriveDate: item.arriveDate || undefined,
            notes: item.notes || item.comment || item.description || item.remarks || undefined,
            status: item.status || undefined,
            lastModifiedBy: item.lastModifiedBy || undefined,
            // Map API fields to frontend expected fields
            createdOn: item.lastModifiedOn || item.createdOn || item.modifiedOn || undefined,
            createdBy: item.lastModifiedBy || item.createdBy || item.modifiedBy || undefined,
            modifiedBy: item.lastModifiedBy || item.modifiedBy || undefined,
            modifiedOn: item.lastModifiedOn || item.modifiedOn || undefined,
            archive: item.archive || false
          } as OrderRequestStatusDto;
        });
      })
    );
  }

  // Parts Test API methods
  getPartsTestList(request: PartsTestRequest): Observable<PartsTestResponse> {
    return this.http.post<PartsTestResponse>(`${this.API}/PartsTest/GetPartsTestList`, request, { 
      headers: this.headers 
    });
  }

  getPartsTestListByParams(rowIndex: number = 0, source: string = 'PartsTest'): Observable<PartsTestResponse> {
    let params = new HttpParams()
      .set('rowIndex', rowIndex.toString())
      .set('source', source);

    return this.http.get<PartsTestResponse>(`${this.API}/PartsTest/GetPartsTestList`, { 
      headers: this.headers,
      params: params 
    });
  }

  // Get maximum test row index
  getMaxTestRowIndex(): Observable<{ success: boolean; maxRowIndex: number }> {
    return this.http.get<{ success: boolean; maxRowIndex: number }>(`${this.API}/PartsTest/GetMaxTestRowIndex`, { 
      headers: this.headers 
    });
  }

  // Save or update parts test list entry
  saveUpdatePartsTestList(dto: SaveUpdatePartsTestDto): Observable<SaveUpdatePartsTestResponse> {
    return this.http.post<SaveUpdatePartsTestResponse>(`${this.API}/PartsTest/SaveUpdatePartsTestList`, dto, { 
      headers: this.headers 
    });
  }

  // Employee lookup methods
  getEmployeeNamesByDept(department: string): Observable<EmployeeResponse> {
    let params = new HttpParams().set('department', department);
    
    return this.http.get<EmployeeResponse>(`${this.API}/PartsTest/GetEmployeeNamesByDept`, { 
      headers: this.headers,
      params: params 
    });
  }

  getEmployeeNamesByDeptPost(request: EmployeeRequest): Observable<EmployeeResponse> {
    return this.http.post<EmployeeResponse>(`${this.API}/PartsTest/GetEmployeeNamesByDept`, request, { 
      headers: this.headers 
    });
  }

  // Delete parts test list entry
  deletePartsTestList(rowIndex: number, source: string = 'PartsTest'): Observable<DeletePartsTestResponse> {
    let params = new HttpParams()
      .set('rowIndex', rowIndex.toString())
      .set('source', source);
    
    return this.http.delete<DeletePartsTestResponse>(`${this.API}/PartsTest/DeletePartsTestList`, { 
      headers: this.headers,
      params: params 
    });
  }

  // Parts Test Status API methods
  getPartsTestStatus(request?: PartsTestStatusRequest): Observable<PartsTestStatusApiResponse> {
    // Always use POST method to avoid query parameter validation issues
    const requestBody: PartsTestStatusRequest = {
      jobType: request?.jobType || 'All',
      priority: request?.priority || 'All', 
      archive: request?.archive || false,
      make: request?.make || 'All',
      model: request?.model || 'All'
    };

    return this.http.post<PartsTestStatusApiResponse>(`${this.API}/PartsTestStatus/GetPartsTestStatus`, requestBody, {
      headers: this.headers
    });
  }

  getPartsTestStatusPost(request: PartsTestStatusRequest): Observable<PartsTestStatusApiResponse> {
    return this.http.post<PartsTestStatusApiResponse>(`${this.API}/PartsTestStatus/GetPartsTestStatus`, request, {
      headers: this.headers
    });
  }

  getAllPartsTestStatus(): Observable<PartsTestStatusApiResponse> {
    return this.http.get<PartsTestStatusApiResponse>(`${this.API}/PartsTestStatus/GetAllPartsTestStatus`, {
      headers: this.headers
    });
  }

  getDistinctMakes(): Observable<DistinctMakesResponse> {
    return this.http.get<DistinctMakesResponse>(`${this.API}/PartsTestStatus/GetDistinctMakes`, {
      headers: this.headers
    });
  }

  getDistinctModels(): Observable<DistinctModelsResponse> {
    return this.http.get<DistinctModelsResponse>(`${this.API}/PartsTestStatus/GetDistinctModels`, {
      headers: this.headers
    });
  }

  getDistinctModelsByMake(make: string): Observable<DistinctModelsByMakeResponse> {
    let params = new HttpParams().set('make', make);
    return this.http.get<DistinctModelsByMakeResponse>(`${this.API}/PartsTestStatus/GetDistinctModelsByMake`, {
      headers: this.headers,
      params: params
    });
  }

  // Stripped Units Status API methods
  
  /**
   * Gets stripped units status data using GET with query parameters
   */
  getStrippedUnitsStatus(status: string = 'All', rowIndex: number = 0): Observable<StrippedUnitsStatusApiResponse> {
    let params = new HttpParams()
      .set('status', status)
      .set('rowIndex', rowIndex.toString());

    return this.http.get<StrippedUnitsStatusApiResponse>(`${this.API}/StrippedUnitsStatus/GetStrippedUnitsStatus`, {
      headers: this.headers,
      params: params
    });
  }

  /**
   * Gets stripped units status data using POST with request body
   */
  getStrippedUnitsStatusPost(request: StrippedUnitsStatusRequest): Observable<StrippedUnitsStatusApiResponse> {
    return this.http.post<StrippedUnitsStatusApiResponse>(`${this.API}/StrippedUnitsStatus/GetStrippedUnitsStatus`, request, {
      headers: this.headers
    });
  }

  /**
   * Gets all stripped units status data with no filters
   */
  getAllStrippedUnitsStatus(): Observable<StrippedUnitsStatusApiResponse> {
    return this.http.get<StrippedUnitsStatusApiResponse>(`${this.API}/StrippedUnitsStatus/GetAllStrippedUnitsStatus`, {
      headers: this.headers
    });
  }

  /**
   * Gets the most recently updated stripped unit
   */
  getMostRecentlyUpdatedUnit(): Observable<any> {
    return this.http.get<any>(`${this.API}/StrippedUnitsStatus/GetMostRecentlyUpdatedUnit`, {
      headers: this.headers
    });
  }

  /**
   * Gets a specific stripped unit by RowIndex
   */
  getStrippedUnitByRowIndex(rowIndex: number): Observable<StrippedUnitApiResponse> {
    return this.http.get<StrippedUnitApiResponse>(`${this.API}/StrippedUnitsStatus/GetStrippedUnit/${rowIndex}`, {
      headers: this.headers
    });
  }

  /**
   * Gets stripped units filtered by status
   */
  getStrippedUnitsByStatus(status: string): Observable<StrippedUnitsStatusApiResponse> {
    return this.http.get<StrippedUnitsStatusApiResponse>(`${this.API}/StrippedUnitsStatus/GetStrippedUnitsByStatus/${status}`, {
      headers: this.headers
    });
  }

  /**
   * Gets only make counts for incomplete units
   */
  getStrippedUnitsMakeCounts(): Observable<{success: boolean; makeCounts: MakeCountDto[]; count: number}> {
    return this.http.get<{success: boolean; makeCounts: MakeCountDto[]; count: number}>(`${this.API}/StrippedUnitsStatus/GetMakeCounts`, {
      headers: this.headers
    });
  }

  /**
   * Gets stripped units make counts formatted for chart display
   */
  getStrippedUnitsMakeCountsForChart(): Observable<{
    success: boolean; 
    chartData: {
      labels: string[];
      data: number[];
      datasets: Array<{
        label: string;
        data: number[];
        backgroundColor: string[];
      }>;
    };
    rawData: MakeCountDto[];
  }> {
    return this.http.get<{
      success: boolean; 
      chartData: {
        labels: string[];
        data: number[];
        datasets: Array<{
          label: string;
          data: number[];
          backgroundColor: string[];
        }>;
      };
      rawData: MakeCountDto[];
    }>(`${this.API}/StrippedUnitsStatus/GetMakeCountsForChart`, {
      headers: this.headers
    });
  }

  /**
   * Saves or updates a stripping unit
   */
  saveUpdateStrippingUnit(dto: StrippedUnitsStatusDto): Observable<{success: boolean; message: string; rowIndex?: number}> {
    return this.http.post<{success: boolean; message: string; rowIndex?: number}>(`${this.API}/StrippedUnitsStatus/SaveUpdateStrippingUnit`, dto, {
      headers: this.headers
    });
  }

  /**
   * Updates a stripping unit by RowIndex
   */
  updateStrippingUnitByRowIndex(rowIndex: number, dto: StrippedUnitsStatusDto): Observable<{success: boolean; message: string; rowIndex: number}> {
    return this.http.put<{success: boolean; message: string; rowIndex: number}>(`${this.API}/StrippedUnitsStatus/UpdateStrippingUnit/${rowIndex}`, dto, {
      headers: this.headers
    });
  }

  // Stripped Parts In Unit methods

  /**
   * Saves or updates stripped parts in unit
   */
  saveUpdateStrippedPartsInUnit(dto: StrippedPartsInUnitDto): Observable<StrippedPartsInUnitApiResponse> {
    return this.http.post<StrippedPartsInUnitApiResponse>(`${this.API}/StrippedUnitsStatus/SaveUpdateStrippedPartsInUnit`, dto, {
      headers: this.headers
    });
  }

  /**
   * Updates stripped parts in unit by MasterRowIndex and RowIndex
   */
  updateStrippedPartsInUnit(masterRowIndex: number, rowIndex: number, dto: StrippedPartsInUnitDto): Observable<StrippedPartsInUnitApiResponse> {
    return this.http.put<StrippedPartsInUnitApiResponse>(`${this.API}/StrippedUnitsStatus/UpdateStrippedPartsInUnit/${masterRowIndex}/${rowIndex}`, dto, {
      headers: this.headers
    });
  }

  /**
   * Gets stripped parts for a specific unit by master row index
   */
  getStrippedPartsInUnit(masterRowIndex: number): Observable<StrippedPartsInUnitApiResponse> {
    return this.http.get<StrippedPartsInUnitApiResponse>(`${this.API}/StrippedUnitsStatus/GetStrippedPartsInUnit/${masterRowIndex}`, {
      headers: this.headers
    });
  }

  /**
   * Deletes a stripped part from unit
   * Note: This endpoint may need to be added to the backend if not already available
   */
  deleteStrippedPartInUnit(masterRowIndex: number, rowIndex: number): Observable<StrippedPartsInUnitApiResponse> {
    return this.http.delete<StrippedPartsInUnitApiResponse>(`${this.API}/StrippedUnitsStatus/DeleteStrippedPartInUnit/${masterRowIndex}/${rowIndex}`, {
      headers: this.headers
    });
  }

  /**
   * Gets strip part codes for dropdown population
   */
  getStripPartCodes(): Observable<StripPartCodeApiResponse> {
    return this.http.get<StripPartCodeApiResponse>(`${this.API}/StrippedUnitsStatus/GetStripPartCodes`, {
      headers: this.headers
    });
  }

  /**
   * Deletes a stripped unit by RowIndex
   */
  deleteStrippedUnit(rowIndex: number): Observable<{success: boolean; message: string; rowIndex: number; source: string}> {
    return this.http.delete<{success: boolean; message: string; rowIndex: number; source: string}>(`${this.API}/StrippedUnitsStatus/Delete/${rowIndex}?source=StrippingUnit`, {
      headers: this.headers
    });
  }

  /**
   * Saves a new stripped part in unit
   */
  saveStrippedPartInUnit(partData: StrippedPartsInUnitDto): Observable<StrippedPartsInUnitApiResponse> {
    return this.http.post<StrippedPartsInUnitApiResponse>(`${this.API}/StrippedUnitsStatus/SaveStrippedPartInUnit`, partData, {
      headers: this.headers
    });
  }

  /**
   * Updates an existing stripped part in unit
   */
  updateStrippedPartInUnit(partData: StrippedPartsInUnitDto): Observable<StrippedPartsInUnitApiResponse> {
    return this.http.put<StrippedPartsInUnitApiResponse>(`${this.API}/StrippedUnitsStatus/UpdateStrippedPartInUnit`, partData, {
      headers: this.headers
    });
  }

  // Account Manager Graph API methods
  getAcctStatusGraph(): Observable<AcctStatusGraphDto> {
    return this.http.get<AcctStatusGraphDto>(`${this.API}/calls-graph/acct-status`, {
      headers: this.headers
    });
  }

  getAccMgmtGraph(): Observable<AccMgmtGraphDto> {
    return this.http.get<AccMgmtGraphDto>(`${this.API}/calls-graph/acct-management`, {
      headers: this.headers
    });
  }

  getAccountManagerPaperwork(): Observable<AccountManagerPaperworkDto[]> {
    return this.http.get<AccountManagerPaperworkDto[]>(`${this.API}/calls-graph/account-manager-paperwork`, {
      headers: this.headers
    });
  }

  getAccountManagerQuoteGraph(): Observable<AccountManagerPaperworkDto[]> {
    return this.http.get<AccountManagerPaperworkDto[]>(`${this.API}/calls-graph/account-manager-quote-graph`, {
      headers: this.headers
    });
  }

  getAccountManagerUnscheduled(): Observable<AccountManagerPaperworkDto[]> {
    return this.http.get<AccountManagerPaperworkDto[]>(`${this.API}/calls-graph/account-manager-unscheduled`, {
      headers: this.headers
    });
  }

  // Parts Search API methods
  searchPartsData(request: PartsSearchRequestDto): Observable<PartsSearchDataResponse> {
    return this.http.post<PartsSearchDataResponse>(`${this.API}/PartsSearch/search`, request, {
      headers: this.headers
    });
  }

  searchPartsDataByQuery(params: {
    address?: string;
    status?: string;
    siteId?: string;
    make?: string;
    model?: string;
    kva?: string;
    ipVoltage?: string;
    opVoltage?: string;
    manufPartNo?: string;
    dcgPartNo?: string;
  }): Observable<PartsSearchDataResponse> {
    let httpParams = new HttpParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, value);
      }
    });

    return this.http.get<PartsSearchDataResponse>(`${this.API}/PartsSearch/search`, {
      headers: this.headers,
      params: httpParams
    });
  }

  // Account Manager Performance Report API methods
  /**
   * Get comprehensive Account Manager Performance Report data for a specific office
   */
  getAccMgrPerformanceReport(officeId: string, roJobs: string = ''): Observable<AccMgrPerformanceReportResponseDto> {
    const params: any = { officeId };
    if (roJobs) {
      params.roJobs = roJobs;
    }
    
    return this.http.get<AccMgrPerformanceReportResponseDto>(`${this.API}/AccMgrPerformanceReport/report`, {
      params,
      headers: this.headers
    });
  }

  /**
   * Get Account Manager Performance Report summary statistics (calculated client-side)
   */
  getAccMgrPerformanceReportSummary(officeId: string, roJobs: string = ''): Observable<AccMgrPerformanceReportSummaryDto> {
    return this.getAccMgrPerformanceReport(officeId, roJobs).pipe(
      map(data => ({
        completedNotReturnedCount: data.completedNotReturned.length,
        returnedForProcessingCount: data.returnedForProcessing.length,
        jobsScheduledTodayCount: data.jobsScheduledToday.length,
        jobsConfirmedNext120HoursCount: data.jobsConfirmedNext120Hours.length,
        returnedWithIncompleteDataCount: data.returnedWithIncompleteData.length,
        pastDueUnscheduledCount: data.pastDueUnscheduled.length,
        monthlyScheduledCounts: {
          'FirstMonth': data.firstMonth.length,
          'SecondMonth': data.secondMonth.length,
          'ThirdMonth': data.thirdMonth.length,
          'FourthMonth': data.fourthMonth.length,
          'FifthMonth': data.fifthMonth.length
        },
        totalJobs: data.completedNotReturned.length + 
                  data.returnedForProcessing.length + 
                  data.jobsScheduledToday.length + 
                  data.jobsConfirmedNext120Hours.length + 
                  data.returnedWithIncompleteData.length + 
                  data.pastDueUnscheduled.length + 
                  data.firstMonth.length + 
                  data.secondMonth.length + 
                  data.thirdMonth.length + 
                  data.fourthMonth.length + 
                  data.fifthMonth.length,
        officeId: officeId,
        roJobsFilter: roJobs,
        generatedAt: new Date().toISOString()
      }))
    );
  }

  /**
   * Get completed jobs not returned from technician
   */
  getCompletedNotReturned(officeId: string, roJobs: string = ''): Observable<AccMgrCallStatusDto[]> {
    const params: any = { officeId };
    if (roJobs) {
      params.roJobs = roJobs;
    }
    
    return this.http.get<AccMgrCallStatusDto[]>(`${this.API}/AccMgrPerformanceReport/completed-not-returned`, {
      params,
      headers: this.headers
    });
  }

  /**
   * Get jobs returned from technician for processing by account manager
   */
  getReturnedForProcessing(officeId: string, roJobs: string = ''): Observable<AccMgrReturnedForProcessingDto[]> {
    const params: any = { officeId };
    if (roJobs) {
      params.roJobs = roJobs;
    }
    
    return this.http.get<AccMgrReturnedForProcessingDto[]>(`${this.API}/AccMgrPerformanceReport/returned-for-processing`, {
      params,
      headers: this.headers
    });
  }

  /**
   * Get jobs scheduled today
   */
  getJobsScheduledToday(officeId: string, roJobs: string = ''): Observable<AccMgrReturnedForProcessingDto[]> {
    const params: any = { officeId };
    if (roJobs) {
      params.roJobs = roJobs;
    }
    
    return this.http.get<AccMgrReturnedForProcessingDto[]>(`${this.API}/AccMgrPerformanceReport/jobs-today`, {
      params,
      headers: this.headers
    });
  }

  /**
   * Get jobs confirmed for next 120 hours
   */
  getJobsConfirmedNext120Hours(officeId: string, roJobs: string = ''): Observable<AccMgrReturnedForProcessingDto[]> {
    const params: any = { officeId };
    if (roJobs) {
      params.roJobs = roJobs;
    }
    
    return this.http.get<AccMgrReturnedForProcessingDto[]>(`${this.API}/AccMgrPerformanceReport/confirmed-next-120-hours`, {
      params,
      headers: this.headers
    });
  }

  /**
   * Get past due unscheduled jobs
   */
  getPastDueUnscheduled(officeId: string, roJobs: string = ''): Observable<AccMgrUnscheduledJobDto[]> {
    const params: any = { officeId };
    if (roJobs) {
      params.roJobs = roJobs;
    }
    
    return this.http.get<AccMgrUnscheduledJobDto[]>(`${this.API}/AccMgrPerformanceReport/past-due-unscheduled`, {
      params,
      headers: this.headers
    });
  }

  /**
   * Health check endpoint for Account Manager Performance Report
   */
  accMgrPerformanceReportHealthCheck(): Observable<string> {
    return this.http.get<string>(`${this.API}/AccMgrPerformanceReport/health`, {
      headers: this.headers
    });
  }

  /**
   * Get emergency jobs for display
   */
  getEmergencyJobs(): Observable<EmergencyJobsResponseDto> {
    return this.http.get<EmergencyJobsResponseDto>(`${this.API}/EmergencyJobs`, {
      headers: this.headers
    });
  }
}
