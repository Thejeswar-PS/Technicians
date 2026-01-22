import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  UPSTestStatusDto,
  UPSTestStatusRequest,
  UPSTestStatusResponse,
  UPSTestStatusApiResponse,
  UPSTestMetadataResponse,
  MakeCountDto,
  StatusSummaryItem
} from '../model/ups-test-status.model';

@Injectable({
  providedIn: 'root'
})
export class UPSTestStatusService {
  
  private headers = new HttpHeaders({
    'Access-Control-Allow-Origin': '*'
  });
  
  private API: string = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private handleError(error: any): Observable<never> {
    console.error('UPS Test Status Service Error:', error);
    throw error;
  }

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
}