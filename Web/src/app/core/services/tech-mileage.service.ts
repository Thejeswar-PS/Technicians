import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
    const payload = {
      StartDate: request.startDate,
      EndDate: request.endDate,
      TechName: request.techName ?? null
    };

    return this.http
      .post<any>(`${this.apiUrl}/TechMileage/GetTechMileageReport`, payload)
      .pipe(map((response) => this.mapReportResponse(response?.data || response || {})));
  }

  private mapReportResponse(response: TechMileageApiResponse): TechMileageResponseDto {
    const rawRecords = (response?.mileageRecords || response?.MileageRecords || []) as TechMileageApiRecord[];
    const rawSummary = (response?.monthlySummary || response?.MonthlySummary || []) as TechMileageApiSummary[];

    const mileageRecords: TechMileageRecordDto[] = rawRecords.map((record) => ({
      callNbr: record?.callNbr || record?.CallNbr || '',
      techName: record?.techName || record?.TechName || '',
      custName: record?.custName || record?.CustName || '',
      address: record?.address || record?.Address || '',
      origin: record?.origin || record?.Origin || record?.orgin || record?.Orgin || '',
      orgin: record?.orgin || record?.Orgin,
      startDate: record?.startDate ?? record?.StartDate ?? null,
      milesReported: Number(record?.milesReported ?? record?.MilesReported ?? 0),
      hoursDecimal: Number(record?.hoursDecimal ?? record?.HoursDecimal ?? 0),
      jobType: record?.jobType || record?.JobType || '',
      totalMinutes: Number(record?.totalMinutes ?? record?.TotalMinutes ?? 0),
      timeTaken: record?.timeTaken || record?.TimeTaken || ''
    }));

    const monthlySummary: TechMileageMonthlySummaryDto[] = rawSummary.map((item) => ({
      month: item?.month || item?.Month || '',
      totalMiles: Number(item?.totalMiles ?? item?.TotalMiles ?? 0),
      totalHours: Number(item?.totalHours ?? item?.TotalHours ?? 0)
    }));

    return {
      mileageRecords,
      monthlySummary,
      totalMiles: Number(response?.totalMiles ?? response?.TotalMiles ?? 0),
      totalHours: Number(response?.totalHours ?? response?.TotalHours ?? 0),
      totalJobs: Number(response?.totalJobs ?? response?.TotalJobs ?? mileageRecords.length),
      success: Boolean(response?.success ?? response?.Success ?? true),
      message: response?.message || response?.Message || ''
    };
  }
}
