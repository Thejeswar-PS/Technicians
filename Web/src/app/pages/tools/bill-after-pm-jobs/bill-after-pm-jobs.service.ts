import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

interface BillAfterPMJob {
  callNbr: string;
  custNbr: string;
  custName: string;
  pmType: string;
  description: string;
  status: string;
  techName: string;
  accMgr: string;
  strtDate: string;
  endDate: string;
  contNbr: string;
}

interface BillAfterPMJobsResponse {
  columns?: {
    CallNbr?: string;
    CustNbr?: string;
    CustName?: string;
    PMType?: string;
    Description?: string;
    status?: string;
    TechName?: string;
    AccMgr?: string;
    StrtDate?: string;
    EndDate?: string;
    ContNbr?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class BillAfterPMJobsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getJobs(params: { archive: string; pmType: string; fiscalYear: string; month: string; }): Observable<BillAfterPMJob[]> {
    return this.http.get<BillAfterPMJobsResponse[]>(`${this.apiUrl}/TechTools/GetBillAfterPMJobs`, {
      params: {
        archive: params.archive,
        pmType: params.pmType,
        fiscalYear: params.fiscalYear,
        month: params.month
      }
    }).pipe(
      map((response: any) => {
        if (Array.isArray(response)) {
          return response.map(item => this.mapJob(item));
        }
        if (response?.tables?.length) {
          return response.tables[0].map((item: any) => this.mapJob(item));
        }
        return [];
      })
    );
  }

  moveJobs(jobIds: string[], archive: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/TechTools/MoveBillAfterPMJobs`, {
      jobIds,
      archive
    });
  }

  private mapJob(item: BillAfterPMJobsResponse | any): BillAfterPMJob {
    const row = (item && 'columns' in item && item.columns) ? item.columns : item;
    return {
      callNbr: row?.CallNbr ?? row?.callNbr ?? '',
      custNbr: row?.CustNbr ?? row?.custNbr ?? '',
      custName: row?.CustName ?? row?.custName ?? '',
      pmType: row?.PMType ?? row?.pmType ?? '',
      description: row?.Description ?? row?.description ?? '',
      status: row?.status ?? row?.Status ?? '',
      techName: row?.TechName ?? row?.techName ?? '',
      accMgr: row?.AccMgr ?? row?.accMgr ?? '',
      strtDate: row?.StrtDate ?? row?.strtDate ?? '',
      endDate: row?.EndDate ?? row?.endDate ?? '',
      contNbr: row?.ContNbr ?? row?.contNbr ?? ''
    };
  }
}
