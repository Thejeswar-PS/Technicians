import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JobInformation, EquipReconciliationInfo, EquipmentDetail, DeficiencyNote, UpdateJobRequest } from '../model/job-notes-info.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JobNotesInfoService {
  private apiUrl = environment.apiUrl || 'https://localhost:7115/api';

  constructor(private http: HttpClient) {}

  /**
   * Get job information for JobNotesInfo page
   * Equivalent to da.GetJobInformation(CallNbr, TechName) in legacy code
   * Note: API returns an array, we extract the first element
   */
  getJobInformation(callNbr: string, techName: string): Observable<JobInformation> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('techName', techName);
    
    return this.http.get<JobInformation[]>(`${this.apiUrl}/JobInfo/GetJobInformation`, { params })
      .pipe(
        map(response => response && response.length > 0 ? response[0] : null as any)
      );
  }

  /**
   * Get deficiency notes for the job
   * Equivalent to da.getDeficiencyNotes(CallNbr, ref ErrMsg) in legacy code
   */
  getDeficiencyNotes(callNbr: string): Observable<string> {
    return this.http.get(`${this.apiUrl}/JobInfo/GetDeficiencyNotes?callNbr=${callNbr}`, { responseType: 'text' });
  }

  /**
   * Get distinct technicians for the job
   * Equivalent to GetDistinctTechs() method in legacy code
   */
  getDistinctTechs(callNbr: string, techName: string): Observable<string[]> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('techName', techName);
    
    return this.http.get<string[]>(`${this.apiUrl}/JobInfo/GetDistinctTechs`, { params });
  }

  /**
   * Get equipment reconciliation information
   * Equivalent to dl.GetEquipReconciliationInfo(ARI, ref ErrMsg) in legacy code
   */
  getJobReconciliationInfo(callNbr: string, equipId: number): Observable<EquipReconciliationInfo> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString());

    return this.http.get<EquipReconciliationInfo>(`${this.apiUrl}/EquipmentDetails/GetEquipReconciliationInfo`, { params });
  }

  /**
   * Save/Update equipment reconciliation information
   * Equivalent to dl.SaveUpdateJobReconciliationInfo(ARI, ref ErrMsg) in legacy code
   */
  saveUpdateJobReconciliationInfo(reconciliationInfo: EquipReconciliationInfo): Observable<{ success: boolean; message?: string }> {
    return this.http.post<{ success: boolean; message?: string }>(`${this.apiUrl}/JobInfo/SaveUpdateJobReconciliationInfo`, reconciliationInfo);
  }

  /**
   * Get equipment information for job notes
   * Equivalent to da.GetEquipInfo(CallNbr) in legacy code
   */
  getJobEquipmentInfo(callNbr: string): Observable<EquipmentDetail[]> {
    return this.http.get<EquipmentDetail[]>(`${this.apiUrl}/EquipmentDetails/GetEquipmentDetails?callNbr=${callNbr}`);
  }

  /**
   * Get auto tech notes by equipment type
   * Equivalent to da.GetAutoTechNotesByEquipType(CallNbr, EquipID, EquipType, ref errMsg) in legacy code
   */
  getAutoTechNotesByEquipType(callNbr: string, equipId: number, equipType: string): Observable<DeficiencyNote[]> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString())
      .set('equipType', equipType);
    
    return this.http.get<DeficiencyNote[]>(`${this.apiUrl}/JobInfo/GetAutoTechNotesByEquipType`, { params });
  }

  /**
   * Update job information
   * Equivalent to da.UpdateJobInformation(JIF, ref ErrMsg) in legacy code
   */
  updateJobInformation(jobInfo: UpdateJobRequest): Observable<{ success: boolean; message?: string }> {
    // Backend expects the data wrapped in a "jobInfo" property
    // Also ensure chkNotes is a proper boolean
    const request = {
      jobInfo: {
        ...jobInfo,
        chkNotes: Boolean(jobInfo.chkNotes) // Ensure it's a proper boolean
      }
    };
    
    return this.http.post<{ success: boolean; message?: string }>(`${this.apiUrl}/JobInfo/UpdateJobInformation`, request);
  }

  /**
   * Insert deficiency notes
   * Equivalent to da.InsertDeficiencyNotes(CallNbr, TechName, lblAutNotes.Text, "Deficiency", ref ErrMsg) in legacy code
   */
  insertDeficiencyNotes(callNbr: string, techName: string, notes: string, noteType: string): Observable<{ success: boolean; message?: string }> {
    const request = {
      callNbr,
      techName,
      notes,
      noteType
    };
    
    return this.http.post<{ success: boolean; message?: string }>(`${this.apiUrl}/JobInfo/InsertDeficiencyNotes`, request);
  }

  /**
   * Get generated equipment info for deficiency notes
   * Equivalent to GetEquipInfo() method in legacy code
   * This should return the fully formatted HTML string with all deficiency notes and corrective actions
   */
  getEquipInfoForDeficiencyNotes(callNbr: string): Observable<string> {
    return this.http.get(`${this.apiUrl}/EquipmentDetails/GetEquipmentDetails?callNbr=${callNbr}`, { responseType: 'text' });
  }
}