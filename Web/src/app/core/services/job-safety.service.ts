import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PreJobSafety } from '../model/job-safety.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JobSafetyService {
  private apiUrl = environment.apiUrl || 'https://localhost:7115/api';

  constructor(private http: HttpClient) {}

  /**
   * Get pre-job safety checklist information for a specific job
   * Equivalent to da.GetPreJobListInfo(PJS, ref ErrMsg) in legacy code
   * @param callNbr - The job call number
   */
  getPreJobSafetyInfo(callNbr: string): Observable<PreJobSafety> {
    const params = new HttpParams().set('callNbr', callNbr);
    return this.http.get<PreJobSafety>(`${this.apiUrl}/PreJobSafetyListInfo/GetPreJobSafetyInfo`, { params });
  }

  /**
   * Save or update pre-job safety checklist information
   * Equivalent to da.SaveUpdatePreJobSafetyList(PJS, ref ErrMsg) in legacy code
   * @param safetyData - The complete safety checklist data
   * @param empId - The employee ID
   */
  saveUpdatePreJobSafety(safetyData: PreJobSafety, empId: string): Observable<{ success: boolean; message?: string }> {
    const params = new HttpParams().set('empId', empId);
    return this.http.post<{ success: boolean; message?: string }>(
      `${this.apiUrl}/PreJobSafetyInfo/SaveUpdatePreJobSafety`,
      safetyData,
      { params }
    );
  }
}
