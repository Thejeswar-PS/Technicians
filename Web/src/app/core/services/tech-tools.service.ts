import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { TechToolsData, TechnicianInfo, ToolKitItem, Technician, ToolsTrackingTechsDto, TechToolSerialNoDto, ToolsCalendarTrackingResultDto } from '../model/tech-tools.model';
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

  // Get tools tracking technicians
  getToolsTrackingTechs(): Observable<ToolsTrackingTechsDto[]> {
    return this.http.get<any>(`${this.apiUrl}/ToolsTrackingTechs`).pipe(
      map(response => response.data || response || [])
    );
  }

  // Get tech tool serial numbers
  getTechToolSerialNos(toolName: string = 'All'): Observable<TechToolSerialNoDto[]> {
    return this.http.get<any>(`${this.apiUrl}/ToolsTrackingTechs/serial-numbers?toolName=${encodeURIComponent(toolName)}`).pipe(
      map(response => response.data || response || [])
    );
  }

  // Get tools calendar tracking data
  getToolsCalendarTracking(
    startDate?: string,
    endDate?: string,
    toolName: string = 'All',
    serialNo: string = 'All',
    techFilter: string = 'All'
  ): Observable<ToolsCalendarTrackingResultDto> {
    // Build params object, only include dates if provided
    const params: any = {
      toolName,
      serialNo,
      techFilter
    };
    
    // Only add dates if they're provided (backend has defaults)
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const url = `${this.apiUrl}/ToolsTrackingTechs/calendar-tracking`;
    
    return this.http.get<any>(url, { params }).pipe(
      map(response => {
        // Your controller returns: { success: true, data: ToolsCalendarTrackingResultDto, ... }
        // Extract the actual ToolsCalendarTrackingResultDto from response.data
        return response.data || response;
      })
    );
  }
}
