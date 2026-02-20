import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
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
  EmployeeRequest,
  EmployeeResponse,
  DeletePartsTestResponse,
  JobExistsResponse,
  SubmittedDateResponse,
  ArchiveRecordResponse
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
import {
  UPSTestStatusDto,
  UPSTestStatusRequest,
  UPSTestStatusResponse,
  UPSTestStatusApiResponse,
  UPSTestMetadataResponse,
  MakeCountDto,
  StatusSummaryItem
} from '../model/ups-test-status.model';
import {
  NewUniTestRequest,
  NewUniTestResponse,
  NewUniTestApiResponse,
  NewUniTestSummaryResponse,
  UnitTestExistsResponse,
  MoveUnitToStrippingDto,
  MoveUnitToStrippingApiResponse
} from '../model/new-unit-test.model';
import {
  DTechUsersDataRequest,
  DTechUsersDataApiResponse,
  DTechUsersDataResponse
} from '../model/dtech-users-data.model';
import {
  ExtranetUserClassesDto,
  ExtranetUserClassesApiResponse,
  ExtranetCustNumbersDto,
  ExtranetUserInfoDto,
  ExtranetAddCustnmbrResult,
  ExtranetSaveUpdateUserDto,
  ExtranetSaveUpdateUserResponse,
  ExtranetDeleteUserResponse,
  ExtranetDeleteCustnmbrResponse
} from '../model/extranet-user-classes.model';
import {
  TestEngineerJobsRequestDto,
  TestEngineerJobsResponse,
  TestEngineerJobsChartsResponse,
  EngineersResponse,
  ChartDataResponse,
  EngineerDto,
  EngineerChartDto,
  StatusChartDto,
  SaveUpdateTestEngineerJobsDto,
  TestEngineerJobsEntryDto,
  TestEngineerJobsEntryResponse,
  NextRowIdResponse
} from '../model/test-engineer-jobs.model';

@Injectable({
  providedIn: 'root'
})
export class ReportService {

  constructor(private http : HttpClient) { }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    return throwError(() => error);
  }

  private headers = new HttpHeaders({
    'Access-Control-Allow-Origin': '*'
  });
  API : string = environment.apiUrl;

  getJobReportDetails(queryType : any,owner: any,yearType: any) : Observable<Job[]>
  {
    return this.http.get<Job[]>(`${this.API}/report/GetJobReportDetails?type=${queryType}&owner=${owner}&yearType=${yearType}`,{ headers : this.headers });
  }

  getContractDetails(category: string): Observable<any[]>
  {
    return this.http.get<any[]>(`${this.API}/TechTools/GetDCGDiplayReportDetails?reportName=${category}&title=""`, { headers: this.headers });
  }

  getPastDueContractDetails(status: string): Observable<any>
  {
    return this.http.get<any>(`${this.API}/TechTools/GetPastDueContracts?status=${status}`, { headers: this.headers });
  }

  searchPMNotes(query: string, page: number, pageSize: number): Observable<any>
  {
    return this.http.get<any>(`${this.API}/TechTools/SearchPMNotes?q=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`, { headers: this.headers });
  }

  handleMiscTask(operation: string, jobNo: string): Observable<any>
  {
    return this.http.post<any>(`${this.API}/TechTools/MiscTask`, { operation, jobNo }, { headers: this.headers });
  }

  getSiteHistory(siteID: string): Observable<any>
  {
    return this.http.get<any>(`${this.API}/TechTools/GetSiteHistory?siteID=${encodeURIComponent(siteID)}`, { headers: this.headers });
  }

  // Legacy checkJobExists method - keeping for backward compatibility
  checkJobExistsLegacy(jobNo: string, jobStatus: string): Observable<any>
  {
    return this.http.get<any>(`${this.API}/TechTools/CheckJobExists?jobNo=${encodeURIComponent(jobNo)}&jobStatus=${jobStatus}`, { headers: this.headers });
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
          const notesValue = item.Notes || item.notes || item.NOTES || item.note || item.Note || item.NOTE ||
            item.comment || item.Comment || item.COMMENT || item.comments || item.Comments || item.COMMENTS ||
            item.description || item.Description || item.DESCRIPTION ||
            item.remarks || item.Remarks || item.REMARKS ||
            item.notesText || item.NotesText || item.NOTESTEXT ||
            item.notes_text || item.Notes_Text || item.NOTES_TEXT ||
            item.notesValue || item.NotesValue || item.NOTESVALUE ||
            undefined;

          return {
            rowIndex: item.RowIndex ?? item.rowIndex ?? (index + 1),
            orderType: item.OrderType ?? item.orderType ?? undefined,
            requester: item.Requester ?? item.requester ?? undefined,
            dcgPartNo: item.DCGPartNo ?? item.dcgPartNo ?? undefined,
            manufPartNo: item.ManufPartNo ?? item.manufPartNo ?? undefined,
            qtyNeeded: item.QtyNeeded ?? item.qtyNeeded ?? undefined,
            vendor: item.Vendor ?? item.vendor ?? undefined,
            poNumber: item.PONumber ?? item.poNumber ?? undefined,
            orderDate: item.OrderDate ?? item.orderDate ?? undefined,
            arriveDate: item.ArriveDate ?? item.arriveDate ?? undefined,
            notes: notesValue,
            status: item.Status ?? item.status ?? undefined,
            lastModifiedBy: item.LastModifiedBy ?? item.lastModifiedBy ?? undefined,
            // Map API fields to frontend expected fields
            createdOn: item.LastModifiedOn || item.lastModifiedOn || item.CreatedOn || item.createdOn || item.ModifiedOn || item.modifiedOn || undefined,
            createdBy: item.LastModifiedBy || item.lastModifiedBy || item.CreatedBy || item.createdBy || item.ModifiedBy || item.modifiedBy || undefined,
            modifiedBy: item.LastModifiedBy || item.lastModifiedBy || item.ModifiedBy || item.modifiedBy || undefined,
            modifiedOn: item.LastModifiedOn || item.lastModifiedOn || item.ModifiedOn || item.modifiedOn || undefined,
            archive: item.Archive ?? item.archive ?? false
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
          const notesValue = item.Notes || item.notes || item.NOTES || item.note || item.Note || item.NOTE ||
            item.comment || item.Comment || item.COMMENT || item.comments || item.Comments || item.COMMENTS ||
            item.description || item.Description || item.DESCRIPTION ||
            item.remarks || item.Remarks || item.REMARKS ||
            item.notesText || item.NotesText || item.NOTESTEXT ||
            item.notes_text || item.Notes_Text || item.NOTES_TEXT ||
            item.notesValue || item.NotesValue || item.NOTESVALUE ||
            undefined;

          return {
            rowIndex: item.RowIndex ?? item.rowIndex ?? (index + 1),
            orderType: item.OrderType ?? item.orderType ?? undefined,
            requester: item.Requester ?? item.requester ?? undefined,
            dcgPartNo: item.DCGPartNo ?? item.dcgPartNo ?? undefined,
            manufPartNo: item.ManufPartNo ?? item.manufPartNo ?? undefined,
            qtyNeeded: item.QtyNeeded ?? item.qtyNeeded ?? undefined,
            vendor: item.Vendor ?? item.vendor ?? undefined,
            poNumber: item.PONumber ?? item.poNumber ?? undefined,
            orderDate: item.OrderDate ?? item.orderDate ?? undefined,
            arriveDate: item.ArriveDate ?? item.arriveDate ?? undefined,
            notes: notesValue,
            status: item.Status ?? item.status ?? undefined,
            lastModifiedBy: item.LastModifiedBy ?? item.lastModifiedBy ?? undefined,
            // Map API fields to frontend expected fields
            createdOn: item.LastModifiedOn || item.lastModifiedOn || item.CreatedOn || item.createdOn || item.ModifiedOn || item.modifiedOn || undefined,
            createdBy: item.LastModifiedBy || item.lastModifiedBy || item.CreatedBy || item.createdBy || item.ModifiedBy || item.modifiedBy || undefined,
            modifiedBy: item.LastModifiedBy || item.lastModifiedBy || item.ModifiedBy || item.modifiedBy || undefined,
            modifiedOn: item.LastModifiedOn || item.lastModifiedOn || item.ModifiedOn || item.modifiedOn || undefined,
            archive: item.Archive ?? item.archive ?? false
          } as OrderRequestStatusDto;
        });
      })
    );
  }

  private getOrderRequestNotes(item: any): string | undefined {
    if (!item || typeof item !== 'object') {
      return undefined;
    }

    const candidates = [
      item.notes,
      item.Notes,
      item.NOTES,
      item.note,
      item.Note,
      item.NOTE,
      item.comment,
      item.Comment,
      item.COMMENT,
      item.comments,
      item.Comments,
      item.COMMENTS,
      item.description,
      item.Description,
      item.DESCRIPTION,
      item.remarks,
      item.Remarks,
      item.REMARKS,
      item.notesText,
      item.NotesText,
      item.NOTESTEXT,
      item.notes_text,
      item.Notes_Text,
      item.NOTES_TEXT,
      item.notesValue,
      item.NotesValue,
      item.NOTESVALUE
    ];

    for (const value of candidates) {
      if (value !== null && value !== undefined) {
        const normalized = typeof value === 'string' ? value.trim() : value;
        if (normalized !== '') {
          return typeof normalized === 'string' ? normalized : String(normalized);
        }
      }
    }

    const key = Object.keys(item).find((name) =>
      name && name.toString().replace(/[^a-z0-9]/gi, '').toLowerCase() === 'notes'
    );

    if (key) {
      const value = item[key];
      const normalized = typeof value === 'string' ? value.trim() : value;
      const result = normalized !== null && normalized !== undefined && normalized !== ''
        ? (typeof normalized === 'string' ? normalized : String(normalized))
        : undefined;
      console.log('OrderRequestStatus notes key match:', { key, value, result });
      return result;
    }

    return undefined;
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

  // Check if job exists
  checkJobExists(jobNo: string): Observable<JobExistsResponse> {
    const params = new HttpParams().set('jobNo', jobNo.trim());
    return this.http.get<JobExistsResponse>(`${this.API}/PartsTest/CheckJobExists`, {
      headers: this.headers,
      params: params
    });
  }

  // Get submitted date for job
  getSubmittedDate(jobNo: string): Observable<SubmittedDateResponse> {
    const params = new HttpParams().set('jobNo', jobNo.trim());
    return this.http.get<SubmittedDateResponse>(`${this.API}/PartsTest/GetSubmittedDate`, {
      headers: this.headers,
      params: params
    });
  }

  // Archive parts test record
  archivePartsTestRecord(rowIndex: number): Observable<ArchiveRecordResponse> {
    return this.http.post<ArchiveRecordResponse>(`${this.API}/PartsTest/ArchiveRecord`, rowIndex, { 
      headers: this.headers 
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
      model: request?.model || 'All',
      assignedTo: request?.assignedTo || 'All'
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

  // GET method with query parameters to match backend
  getPartsTestStatusByParams(
    jobType: string = "",
    priority: string = "",
    archive: boolean = false,
    make: string = "",
    model: string = "",
    assignedTo: string = ""
  ): Observable<PartsTestStatusApiResponse> {
    let params = new HttpParams()
      .set('jobType', jobType)
      .set('priority', priority)
      .set('archive', archive.toString())
      .set('make', make)
      .set('model', model)
      .set('assignedTo', assignedTo);

    return this.http.get<PartsTestStatusApiResponse>(`${this.API}/PartsTestStatus/GetPartsTestStatus`, {
      headers: this.headers,
      params: params
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
    // Transform camelCase to PascalCase for backend compatibility
    const transformedDto = {
      Make: dto.make?.trim() || '',
      Model: dto.model?.trim() || '',
      SerialNo: dto.serialNo?.trim() || '',
      Kva: dto.kva?.trim() || '',
      Voltage: dto.voltage?.trim() || '',
      PoNumber: dto.poNumber?.trim() || '',
      ShippingPO: dto.shippingPO?.trim() || '',
      UnitCost: dto.unitCost || 0,
      ShipCost: dto.shipCost || 0,
      StrippedBy: dto.strippedBy?.trim() || '',
      PutAwayBy: dto.putAwayBy?.trim() || '',
      Status: dto.status?.trim() || '',
      CreatedOn: dto.createdOn ? new Date(dto.createdOn).toISOString() : new Date().toISOString(),
      RowIndex: dto.rowIndex || 0,
      StripExists: dto.stripExists || 0,
      PartsLocation: dto.partsLocation?.trim() || '',
      LastModifiedBy: dto.lastModifiedBy?.trim() || '',
      LastModifiedOn: dto.lastModifiedOn ? new Date(dto.lastModifiedOn).toISOString() : new Date().toISOString()
    };

    return this.http.post<{success: boolean; message: string; rowIndex?: number}>(`${this.API}/StrippedUnitsStatus/SaveUpdateStrippingUnit`, transformedDto, {
      headers: this.headers
    });
  }

  /**
   * Updates a stripping unit by RowIndex
   */
  updateStrippingUnitByRowIndex(rowIndex: number, dto: StrippedUnitsStatusDto): Observable<{success: boolean; message: string; rowIndex: number}> {
    // Transform camelCase to PascalCase for backend compatibility
    const transformedDto = {
      Make: dto.make?.trim() || '',
      Model: dto.model?.trim() || '',
      SerialNo: dto.serialNo?.trim() || '',
      Kva: dto.kva?.trim() || '',
      Voltage: dto.voltage?.trim() || '',
      PoNumber: dto.poNumber?.trim() || '',
      ShippingPO: dto.shippingPO?.trim() || '',
      UnitCost: dto.unitCost || 0,
      ShipCost: dto.shipCost || 0,
      StrippedBy: dto.strippedBy?.trim() || '',
      PutAwayBy: dto.putAwayBy?.trim() || '',
      Status: dto.status?.trim() || '',
      CreatedOn: dto.createdOn ? new Date(dto.createdOn).toISOString() : null,
      RowIndex: dto.rowIndex || 0,
      StripExists: dto.stripExists || 0,
      PartsLocation: dto.partsLocation?.trim() || '',
      LastModifiedBy: dto.lastModifiedBy?.trim() || '',
      LastModifiedOn: dto.lastModifiedOn ? new Date(dto.lastModifiedOn).toISOString() : new Date().toISOString()
    };

    return this.http.put<{success: boolean; message: string; rowIndex: number}>(`${this.API}/StrippedUnitsStatus/UpdateStrippingUnit/${rowIndex}`, transformedDto, {
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
   * Deletes a stripped part from unit using the new backend API
   * Calls: DELETE /api/StrippedUnitsStatus/DeleteStrippedPartsInUnit/{masterRowIndex}/{rowIndex}
   */
  deleteStrippedPartInUnit(masterRowIndex: number, rowIndex: number): Observable<StrippedPartsInUnitApiResponse> {
    return this.http.delete<StrippedPartsInUnitApiResponse>(`${this.API}/StrippedUnitsStatus/DeleteStrippedPartsInUnit/${masterRowIndex}/${rowIndex}`, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
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

  // ========== UPS Test Status API Methods ==========

  /**
   * Get UPS test status data with filtering options
   */
  getUPSTestStatus(request: UPSTestStatusRequest): Observable<UPSTestStatusApiResponse> {
    const params = new HttpParams()
      .set('assignedTo', request.assignedTo || 'All')
      .set('status', request.status || 'All')
      .set('priority', request.priority || 'All')
      .set('archive', request.archive.toString());

    return this.http.get<UPSTestStatusApiResponse>(`${this.API}/UPSTestStatus`, {
      params,
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get UPS test status data using POST method (for complex filtering if needed)
   */
  postUPSTestStatus(request: UPSTestStatusRequest): Observable<UPSTestStatusApiResponse> {
    return this.http.post<UPSTestStatusApiResponse>(`${this.API}/UPSTestStatus`, request, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get UPS test metadata including technicians, status summary, and dropdown data
   */
  getUPSTestMetadata(archive: boolean = false): Observable<UPSTestMetadataResponse> {
    const params = new HttpParams().set('archive', archive.toString());
    
    return this.http.get<UPSTestMetadataResponse>(`${this.API}/UPSTestStatus/metadata`, {
      params,
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  // New Unit Test Methods
  /**
   * Get new unit test list data
   * @param rowIndex Row index to filter by (0 returns all records ordered by LastModifiedOn)
   * @returns New unit test data using existing UPSTestStatusDto
   */
  getNewUniTestList(rowIndex: number = 0): Observable<NewUniTestApiResponse> {
    const params = new HttpParams().set('rowIndex', rowIndex.toString());

    return this.http.get<NewUniTestApiResponse>(`${this.API}/NewUniTest`, {
      params,
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get a specific unit test by row index
   * @param rowIndex The row index to retrieve
   * @returns Single UPSTestStatusDto record or null if not found
   */
  getNewUniTestByRowIndex(rowIndex: number): Observable<{ success: boolean; data: UPSTestStatusDto; message?: string; error?: string }> {
    return this.http.get<{ success: boolean; data: UPSTestStatusDto; message?: string; error?: string }>(`${this.API}/NewUniTest/${rowIndex}`, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get summary statistics and metadata for the new unit tests
   * @returns Summary statistics including counts by status, make, etc.
   */
  getNewUniTestSummary(): Observable<NewUniTestSummaryResponse> {
    return this.http.get<NewUniTestSummaryResponse>(`${this.API}/NewUniTest/summary`, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Check if a unit test exists for the given row index
   * @param rowIndex The row index to check
   * @returns Whether the unit test exists
   */
  checkNewUnitTestExists(rowIndex: number): Observable<UnitTestExistsResponse> {
    return this.http.get<UnitTestExistsResponse>(`${this.API}/NewUniTest/exists/${rowIndex}`, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Move a unit to stripping
   * @param dto The unit data to move to stripping
   * @returns Response indicating success or failure
   */
  moveUnitToStripping(dto: MoveUnitToStrippingDto): Observable<MoveUnitToStrippingApiResponse> {
    return this.http.post<MoveUnitToStrippingApiResponse>(`${this.API}/NewUniTest/move-to-stripping`, dto, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  // ====================== DTech Users Data Methods ======================

  /**
   * Gets DTech users data with optional filtering
   * @param filters Optional filter criteria for the search
   * @returns Filtered DTech users data
   */
  getDTechUsersData(filters?: DTechUsersDataRequest): Observable<DTechUsersDataApiResponse> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.login) {
        params = params.set('login', filters.login);
      }
      if (filters.siteID) {
        params = params.set('siteID', filters.siteID);
      }
      if (filters.custName) {
        params = params.set('custName', filters.custName);
      }
      if (filters.address) {
        params = params.set('address', filters.address);
      }
      if (filters.phone) {
        params = params.set('phone', filters.phone);
      }
      if (filters.email) {
        params = params.set('email', filters.email);
      }
      if (filters.contact) {
        params = params.set('contact', filters.contact);
      }
      if (filters.svcSerialId) {
        params = params.set('svcSerialId', filters.svcSerialId);
      }
    }

    return this.http.get<DTechUsersDataApiResponse>(`${this.API}/DTechUsersData`, {
      headers: this.headers,
      params: params
    }).pipe(
      map(response => {
        // Convert date strings to Date objects
        if (response.data && response.data.usersData) {
          response.data.usersData = response.data.usersData.map(user => ({
            ...user,
            lastLoggedIn: new Date(user.lastLoggedIn),
            lastChangedPwd: new Date(user.lastChangedPwd)
          }));
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Advanced filtering endpoint with POST method for complex queries
   * @param request Detailed filter criteria
   * @returns Filtered DTech users data
   */
  filterDTechUsers(request: DTechUsersDataRequest): Observable<DTechUsersDataApiResponse> {
    return this.http.post<DTechUsersDataApiResponse>(`${this.API}/DTechUsersData/filter`, request, {
      headers: this.headers
    }).pipe(
      map(response => {
        // Convert date strings to Date objects
        if (response.data && response.data.usersData) {
          response.data.usersData = response.data.usersData.map(user => ({
            ...user,
            lastLoggedIn: new Date(user.lastLoggedIn),
            lastChangedPwd: new Date(user.lastChangedPwd)
          }));
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Gets ExtranetUserClasses data from the API
   * @returns Observable containing ExtranetUserClasses data
   */
  getExtranetUserClasses(): Observable<ExtranetUserClassesApiResponse> {
    return this.http.get<ExtranetUserClassesApiResponse>(`${this.API}/ExtranetUserClasses`, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Gets customer numbers for a specific login from the API
   * @param login The login identifier
   * @returns Observable containing customer numbers data
   */
  getExtranetCustomerNumbers(login: string): Observable<ExtranetCustNumbersDto[]> {
    if (!login || login.trim() === '') {
      throw new Error('Login is required');
    }
    
    return this.http.get<ExtranetCustNumbersDto[]>(`${this.API}/ExtranetUserClasses/${encodeURIComponent(login.trim())}/customer-numbers`, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Gets user information for a specific login from the API
   * @param login The login identifier
   * @returns Observable containing user information
   */
  getExtranetUserInfo(login: string): Observable<ExtranetUserInfoDto> {
    if (!login || login.trim() === '') {
      throw new Error('Login is required');
    }
    
    return this.http.get<ExtranetUserInfoDto>(`${this.API}/ExtranetUserClasses/${encodeURIComponent(login.trim())}`, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Adds a customer number for a specific login
   * @param login The login identifier
   * @param custNmbr The customer number to add
   * @returns Observable containing the operation result
   */
  addExtranetCustomerNumber(login: string, custNmbr: string): Observable<ExtranetAddCustnmbrResult> {
    if (!login || login.trim() === '') {
      throw new Error('Login is required');
    }
    if (!custNmbr || custNmbr.trim() === '') {
      throw new Error('Customer number is required');
    }
    
    const trimmedLogin = login.trim();
    const trimmedCustNmbr = custNmbr.trim();
    
    return this.http.post<ExtranetAddCustnmbrResult>(
      `${this.API}/ExtranetUserClasses/${encodeURIComponent(trimmedLogin)}/customer-numbers/${encodeURIComponent(trimmedCustNmbr)}`,
      {},
      {
        headers: this.headers
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Saves or updates extranet user information
   * @param userDto The user information to save/update
   * @returns Observable containing the operation result
   */
  saveUpdateExtranetUser(userDto: ExtranetSaveUpdateUserDto): Observable<ExtranetSaveUpdateUserResponse> {
    // Trim all string properties
    const trimmedUserDto: ExtranetSaveUpdateUserDto = {
      login: (userDto.login || '').trim(),
      password: (userDto.password || '').trim(),
      classID: (userDto.classID || '').trim(),
      customerName: (userDto.customerName || '').trim(),
      contactName: (userDto.contactName || '').trim(),
      address1: (userDto.address1 || '').trim(),
      address2: (userDto.address2 || '').trim(),
      city: (userDto.city || '').trim(),
      state: (userDto.state || '').trim(),
      zip: (userDto.zip || '').trim(),
      phone: (userDto.phone || '').trim(),
      email: (userDto.email || '').trim(),
      viewFinancial: userDto.viewFinancial,
      underContract: userDto.underContract
    };
    
    if (!trimmedUserDto.login) {
      throw new Error('Login is required');
    }
    if (!trimmedUserDto.password) {
      throw new Error('Password is required');
    }
    if (!trimmedUserDto.classID) {
      throw new Error('Class ID is required');
    }
    
    return this.http.post<ExtranetSaveUpdateUserResponse>(
      `${this.API}/ExtranetUserClasses/save-update`,
      trimmedUserDto,
      {
        headers: this.headers
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Deletes an extranet user
   * @param username The username to delete
   * @returns Observable containing the operation result
   */
  deleteExtranetUser(username: string): Observable<ExtranetDeleteUserResponse> {
    if (!username || username.trim() === '') {
      throw new Error('Username is required');
    }
    
    const trimmedUsername = username.trim();
    
    return this.http.delete<ExtranetDeleteUserResponse>(
      `${this.API}/ExtranetUserClasses/${encodeURIComponent(trimmedUsername)}`,
      {
        headers: this.headers
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Deletes a customer number for a specific login
   * @param login The login identifier
   * @param custNmbr The customer number to delete
   * @returns Observable containing the operation result
   */
  deleteExtranetCustomerNumber(login: string, custNmbr: string): Observable<ExtranetDeleteCustnmbrResponse> {
    if (!login || login.trim() === '') {
      throw new Error('Login is required');
    }
    if (!custNmbr || custNmbr.trim() === '') {
      throw new Error('Customer number is required');
    }
    
    const trimmedLogin = login.trim();
    const trimmedCustNmbr = custNmbr.trim();
    
    return this.http.delete<ExtranetDeleteCustnmbrResponse>(
      `${this.API}/ExtranetUserClasses/${encodeURIComponent(trimmedLogin)}/customer-numbers/${encodeURIComponent(trimmedCustNmbr)}`,
      {
        headers: this.headers
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // TestEngineerJobs methods - Enhanced for better null handling
  getTestEngineerJobs(request: TestEngineerJobsRequestDto): Observable<TestEngineerJobsResponse> {
    // Ensure all parameters are properly defined to match backend expectations
    const params = new HttpParams()
      .set('engineer', request.engineer || '')
      .set('status', request.status || '')
      .set('location', request.location || '')
      .set('search', request.search || '')
      .set('sortColumn', request.sortColumn || 'RowID')
      .set('sortDirection', request.sortDirection || 'DESC');

    return this.http.get<TestEngineerJobsResponse>(
      `${this.API}/TestEngineerJobs`,
      {
        headers: this.headers,
        params: params
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // POST version for complex filter requests - Enhanced with proper defaults
  getTestEngineerJobsPost(request: TestEngineerJobsRequestDto): Observable<TestEngineerJobsResponse> {
    // Ensure request has proper defaults to match backend expectations
    const safeRequest: TestEngineerJobsRequestDto = {
      engineer: request.engineer || '',
      status: request.status || '',
      location: request.location || '',
      search: request.search || '',
      sortColumn: request.sortColumn || 'RowID',
      sortDirection: request.sortDirection || 'DESC'
    };
    
    return this.http.post<TestEngineerJobsResponse>(
      `${this.API}/TestEngineerJobs`,
      safeRequest,
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getTestEngineerJobsCharts(request: TestEngineerJobsRequestDto): Observable<ChartDataResponse> {
    const params = new HttpParams()
      .set('engineer', request.engineer || '')
      .set('status', request.status || '')
      .set('location', request.location || '')
      .set('search', request.search || '');

    return this.http.get<ChartDataResponse>(
      `${this.API}/TestEngineerJobs/charts`,
      {
        headers: this.headers,
        params: params
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Combined chart data using POST - Enhanced with proper defaults
  getTestEngineerJobsChartsPost(request: TestEngineerJobsRequestDto): Observable<ChartDataResponse> {
    return this.http.post<ChartDataResponse>(
      `${this.API}/TestEngineerJobs/charts`,
      request,
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Get all data in one call for efficiency - Enhanced with proper defaults
  getAllTestEngineerJobsData(request: TestEngineerJobsRequestDto): Observable<any> {
    return this.http.post<any>(
      `${this.API}/TestEngineerJobs/all`,
      request,
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Note: Separate chart endpoints don't exist in backend. Use getTestEngineerJobsCharts instead.
  // The GetChartsData endpoint returns both engineer and status data in one call.
  
  // Utility methods to extract specific chart data from combined response
  getEngineerChartDataOnly(request: TestEngineerJobsRequestDto): Observable<EngineerChartDto[]> {
    return this.getTestEngineerJobsCharts(request).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.engineerData || [];
        }
        return [];
      })
    );
  }

  getStatusChartDataOnly(request: TestEngineerJobsRequestDto): Observable<StatusChartDto[]> {
    return this.getTestEngineerJobsCharts(request).pipe(
      map(response => {
        if (response.success && response.data) {
          return response.data.statusData || [];
        }
        return [];
      })
    );
  }
  
  getTestEngineerJobsEngineers(department: string = 'T'): Observable<EngineersResponse> {
    // Only add department parameter if it's not the default to match backend expectations
    const params = department !== 'T' ? new HttpParams().set('department', department) : new HttpParams();

    return this.http.get<EngineersResponse>(
      `${this.API}/TestEngineerJobs/engineers`,
      {
        headers: this.headers,
        params: params
      }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // Entry-specific methods for Test Engineer Jobs
  getTestEngineerJobsNextRowId(): Observable<NextRowIdResponse> {
    return this.http.get<NextRowIdResponse>(
      `${this.API}/TestEngineerJobs/nextrowid`,
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  getTestEngineerJobById(id: number): Observable<TestEngineerJobsEntryResponse> {
    return this.http.get<TestEngineerJobsEntryResponse>(
      `${this.API}/TestEngineerJobs/${id}`,
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  createTestEngineerJob(job: SaveUpdateTestEngineerJobsDto): Observable<TestEngineerJobsEntryResponse> {
    return this.http.post<TestEngineerJobsEntryResponse>(
      `${this.API}/TestEngineerJobs/create`,
      job,
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  updateTestEngineerJob(id: number, job: SaveUpdateTestEngineerJobsDto): Observable<TestEngineerJobsEntryResponse> {
    return this.http.put<TestEngineerJobsEntryResponse>(
      `${this.API}/TestEngineerJobs/${id}`,
      job,
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  deleteTestEngineerJob(id: number): Observable<TestEngineerJobsEntryResponse> {
    return this.http.delete<TestEngineerJobsEntryResponse>(
      `${this.API}/TestEngineerJobs/${id}`,
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }
}
