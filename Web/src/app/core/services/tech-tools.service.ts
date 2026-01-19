import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { TechToolsData, TechnicianInfo, ToolKitItem, Technician } from '../model/tech-tools.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TechToolsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Get list of technicians
  getTechnicians(): Observable<Technician[]> {
    return this.http.get<Technician[]>(`${this.apiUrl}/TechTools/GetTechnicians`);
  }

  // Get technician info and tool kit data
  getTechToolsKit(techID: string): Observable<{ technicianInfo: TechnicianInfo; toolKitItems: ToolKitItem[] }> {
    return this.http.get<any>(
      `${this.apiUrl}/TechTools/GetTechToolsKit/${techID}`
    ).pipe(
      map(response => ({
        technicianInfo: response.techInfo || response.technicianInfo || {},
        toolKitItems: response.tools || response.toolKitItems || []
      }))
    );
  }

  // Get tech tools PPE/Meters data
  getTechToolsData(techID: string): Observable<TechToolsData> {
    return this.http.get<any>(`${this.apiUrl}/TechTools/GetTechToolsData/${techID}`).pipe(
      map(response => ({
        ...response,
        // Map oshA10 (API) to osha10 (model) if needed
        osha10: response.oshA10 || response.osha10
      }))
    );
  }

  // New endpoints aligning with legacy flow
  getTechToolsMiscCount(techID: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/TechTools/GetTechToolsMiscCount/${techID}`);
  }

  deleteReplaceToolsMisc(techID: string, toolKitItems: ToolKitItem[], modifiedBy: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/TechTools/DeleteReplaceToolsMisc`, {
      techID,
      toolKitItems,
      modifiedBy
    });
  }

  saveUpdateTechTools(data: TechToolsData): Observable<any> {
    return this.http.post(`${this.apiUrl}/TechTools/SaveUpdateTechTools`, data);
  }
}
