import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  TechMileageApiRecord,
  TechMileageApiResponse,
  TechMileageApiSummary,
  TechMileageApiTechnician,
  TechMileageRequestDto,
  TechMileageRecordDto,
  TechMileageResponseDto,
  TechMileageMonthlySummaryDto,
  TechMileageTechnicianDto
} from '../model/tech-mileage.model';

@Injectable({
  providedIn: 'root'
})
export class TechMileageService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTechnicians(): Observable<TechMileageTechnicianDto[]> {
    return this.http
      .get<any>(`${this.apiUrl}/TechMileage/GetTechnicians`)
      .pipe(
        catchError(() => this.http.get<any>(`${this.apiUrl}/Common/GetTechnicians`)),
        map((response) => {
          const rawList = response?.data || response || [];
          return (rawList as TechMileageApiTechnician[]).map((tech) => ({
            techID: tech?.techID || tech?.TechID || tech?.techId || '',
            techName: tech?.techName || tech?.TechName || tech?.techname || ''
          }));
        })
      );
  }

  getTechMileageReport(request: TechMileageRequestDto): Observable<TechMileageResponseDto> {
    let params = new HttpParams()
      .set('startDate', request.startDate)
      .set('endDate', request.endDate)
      .set('techName', request.techName || 'ALL')
      .set('pageNumber', String(request.pageNumber ?? 1))
      .set('pageSize', String(request.pageSize ?? 100));

    return this.http
      .get<any>(`${this.apiUrl}/TechMileage/report`, { params })
      .pipe(map((response) => this.mapReportResponse(response || {})));
  }

  getTechMileageMonthlySummary(request: TechMileageRequestDto): Observable<TechMileageMonthlySummaryDto[]> {
    const params = new HttpParams()
      .set('startDate', request.startDate)
      .set('endDate', request.endDate)
      .set('techName', request.techName || 'ALL');

    return this.http
      .get<any>(`${this.apiUrl}/TechMileage/GetTechMileageMonthlySummary`, { params })
      .pipe(
        map((response) => {
          const rawSummary = Array.isArray(response)
            ? response
            : (response?.data || response?.Data || response?.monthlySummary || response?.MonthlySummary || []);

          return (rawSummary as TechMileageApiSummary[]).map((item) => ({
            month: item?.month || item?.Month || '',
            totalMiles: Number(item?.totalMiles ?? item?.TotalMiles ?? 0),
            totalHours: Number(item?.totalHours ?? item?.TotalHours ?? 0)
          }));
        })
      );
  }

  private mapReportResponse(response: TechMileageApiResponse): TechMileageResponseDto {
    const rawRecords = (
      response?.data ||
      response?.Data ||
      response?.mileageRecords ||
      response?.MileageRecords ||
      []
    ) as TechMileageApiRecord[];
    const rawSummary = (response?.monthlySummary || response?.MonthlySummary || []) as TechMileageApiSummary[];

    const mileageRecords: TechMileageRecordDto[] = rawRecords.map((record) => ({
      callNbr: record?.callNbr || record?.CallNbr || record?.jobNumber || record?.JobNumber || '',
      techName: record?.techName || record?.TechName || '',
      custName: record?.custName || record?.CustName || record?.customerName || record?.CustomerName || '',
      address: record?.address || record?.Address || record?.siteAddress || record?.SiteAddress || '',
      origin: record?.origin || record?.Origin || record?.orgin || record?.Orgin || '',
      orgin: record?.orgin || record?.Orgin,
      startDate: record?.startDate ?? record?.StartDate ?? record?.date ?? record?.Date ?? null,
      milesReported: Number(record?.milesReported ?? record?.MilesReported ?? 0),
      hoursDecimal: Number(record?.hoursDecimal ?? record?.HoursDecimal ?? 0),
      jobType: record?.jobType || record?.JobType || '',
      totalMinutes: Number(record?.totalMinutes ?? record?.TotalMinutes ?? 0),
      timeTaken: record?.timeTaken || record?.TimeTaken || record?.timeTakenHHMM || record?.TimeTakenHHMM || ''
    }));

    const monthlySummary: TechMileageMonthlySummaryDto[] = rawSummary.map((item) => ({
      month: item?.month || item?.Month || '',
      totalMiles: Number(item?.totalMiles ?? item?.TotalMiles ?? 0),
      totalHours: Number(item?.totalHours ?? item?.TotalHours ?? 0)
    }));

    return {
      mileageRecords,
      monthlySummary,
      totalMiles: Number(response?.totalMiles ?? response?.TotalMiles ?? mileageRecords.reduce((sum, row) => sum + (row.milesReported || 0), 0)),
      totalHours: Number(response?.totalHours ?? response?.TotalHours ?? mileageRecords.reduce((sum, row) => sum + (row.hoursDecimal || 0), 0)),
      totalJobs: Number(response?.totalRecords ?? response?.TotalRecords ?? response?.totalJobs ?? response?.TotalJobs ?? mileageRecords.length),
      pageNumber: Number(response?.pageNumber ?? response?.PageNumber ?? 1),
      pageSize: Number(response?.pageSize ?? response?.PageSize ?? (mileageRecords.length || 100)),
      success: Boolean(response?.success ?? response?.Success ?? true),
      message: response?.message || response?.Message || ''
    };
  }
}
