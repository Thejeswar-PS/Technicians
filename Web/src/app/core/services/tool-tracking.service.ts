import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { 
  ToolsTrackingTechsApiResponse, 
  TechToolSerialNoApiResponse,
  ToolsCalendarTrackingApiResponse,
  TechToolsMiscKitApiResponse,
  ToolTrackingCountApiResponse, 
  ToolTrackingApiResponse,
  SaveTechToolsTrackingRequestDto,
  SaveTechToolsTrackingApiResponse,
  ExecuteInsertTechToolsQueryResultDto,
  DeleteToolsTrackingResultDto,
  ToolsTrackingFilesApiResponse,
  FileUploadApiResponse,
  EquipmentFileApiResponse, 
  SaveEquipmentFileRequestDto, 
  SaveFileApiResponse 
} from '../model/tool-tracking.model';

@Injectable({
  providedIn: 'root'
})
export class ToolTrackingService {
  private apiUrl = environment.apiUrl;
  
  private headers = new HttpHeaders({
    'Access-Control-Allow-Origin': '*'
  });

  constructor(private http: HttpClient) {}

  /**
   * Get tools tracking technicians data - Enhanced with role-based filtering
   * @param userEmpID Current user's employee ID (optional)
   * @param windowsID Current user's Windows ID (optional)
   */
  getToolsTrackingTechs(userEmpID?: string, windowsID?: string): Observable<ToolsTrackingTechsApiResponse> {
    let params = new HttpParams();
    if (userEmpID) params = params.set('userEmpID', userEmpID);
    if (windowsID) params = params.set('windowsID', windowsID);
    
    return this.http.get<ToolsTrackingTechsApiResponse>(
      `${this.apiUrl}/ToolsTrackingTechs`,
      { headers: this.headers, params }
    );
  }

  /**
   * Get tool serial numbers by tool name - Enhanced with role-based filtering
   * @param toolName The tool name to filter by (defaults to "All")
   * @param userEmpID Current user's employee ID (optional)
   * @param windowsID Current user's Windows ID (optional)
   */
  getTechToolSerialNos(toolName: string = 'All', userEmpID?: string, windowsID?: string): Observable<TechToolSerialNoApiResponse> {
    let params = new HttpParams().set('toolName', toolName);
    if (userEmpID) params = params.set('userEmpID', userEmpID);
    if (windowsID) params = params.set('windowsID', windowsID);
    
    return this.http.get<TechToolSerialNoApiResponse>(
      `${this.apiUrl}/ToolsTrackingTechs/serial-numbers`,
      { headers: this.headers, params }
    );
  }

  /**
   * Get tools calendar tracking data with due counts - Enhanced with role-based filtering
   * @param startDate Start date for filtering (defaults to 15th of previous month)
   * @param endDate End date for filtering (defaults to 15th of next month)
   * @param toolName Tool name to filter by (defaults to "All")
   * @param serialNo Serial number to filter by (defaults to "All")
   * @param techFilter Tech filter (defaults to "All")
   * @param userEmpID Current user's employee ID (optional)
   * @param windowsID Current user's Windows ID (optional)
   */
  getToolsCalendarTracking(
    startDate?: Date,
    endDate?: Date,
    toolName: string = 'All',
    serialNo: string = 'All',
    techFilter: string = 'All',
    userEmpID?: string,
    windowsID?: string
  ): Observable<ToolsCalendarTrackingApiResponse> {
    let params = new HttpParams()
      .set('toolName', toolName)
      .set('serialNo', serialNo)
      .set('techFilter', techFilter);
    
    if (startDate) params = params.set('startDate', startDate.toISOString());
    if (endDate) params = params.set('endDate', endDate.toISOString());
    if (userEmpID) params = params.set('userEmpID', userEmpID);
    if (windowsID) params = params.set('windowsID', windowsID);

    return this.http.get<ToolsCalendarTrackingApiResponse>(
      `${this.apiUrl}/ToolsTrackingTechs/calendar-tracking`,
      { headers: this.headers, params }
    );
  }

  /**
   * Get tech tools misc kit data by tech ID - Enhanced with role-based filtering
   * @param techId The technician ID to retrieve misc kit data for
   * @param userEmpID Current user's employee ID (optional)
   * @param windowsID Current user's Windows ID (optional)
   */
  getTechToolsMiscKit(techId: string, userEmpID?: string, windowsID?: string): Observable<TechToolsMiscKitApiResponse> {
    let params = new HttpParams();
    if (userEmpID) params = params.set('userEmpID', userEmpID);
    if (windowsID) params = params.set('windowsID', windowsID);
    
    return this.http.get<TechToolsMiscKitApiResponse>(
      `${this.apiUrl}/ToolsTrackingTechs/misc-kit/${techId}`,
      { headers: this.headers, params }
    );
  }

  /**
   * Get tech tools tracking data by tech ID - Enhanced with role-based filtering
   * @param techId The technician ID to retrieve tracking data for
   * @param userEmpID Current user's employee ID (optional)
   * @param windowsID Current user's Windows ID (optional)
   */
  getTechToolsTracking(techId: string, userEmpID?: string, windowsID?: string): Observable<ToolTrackingApiResponse> {
    let params = new HttpParams();
    if (userEmpID) params = params.set('userEmpID', userEmpID);
    if (windowsID) params = params.set('windowsID', windowsID);
    
    return this.http.get<ToolTrackingApiResponse>(
      `${this.apiUrl}/ToolsTrackingTechs/tracking/${techId}`,
      { headers: this.headers, params }
    );
  }

  /**
   * Get tools tracking count by tech ID - Enhanced with role-based filtering
   * @param techId The technician ID to retrieve count for
   * @param userEmpID Current user's employee ID (optional)
   * @param windowsID Current user's Windows ID (optional)
   */
  getToolsTrackingCount(techId: string, userEmpID?: string, windowsID?: string): Observable<ToolTrackingCountApiResponse> {
    let params = new HttpParams();
    if (userEmpID) params = params.set('userEmpID', userEmpID);
    if (windowsID) params = params.set('windowsID', windowsID);
    
    return this.http.get<ToolTrackingCountApiResponse>(
      `${this.apiUrl}/ToolsTrackingTechs/count/${techId}`,
      { headers: this.headers, params }
    );
  }

  /**
   * Execute insert tech tools query - Enhanced with role-based validation
   * @param query SQL query to execute
   * @param userEmpID Current user's employee ID (optional)
   * @param windowsID Current user's Windows ID (optional)
   */
  executeInsertTechToolsQuery(query: string, userEmpID?: string, windowsID?: string): Observable<ExecuteInsertTechToolsQueryResultDto> {
    let params = new HttpParams();
    if (userEmpID) params = params.set('userEmpID', userEmpID);
    if (windowsID) params = params.set('windowsID', windowsID);
    
    return this.http.post<ExecuteInsertTechToolsQueryResultDto>(
      `${this.apiUrl}/ToolsTrackingTechs/execute-query`,
      { query },
      { headers: this.headers, params }
    );
  }

  /**
   * Delete tools tracking data by tech ID - Enhanced with role-based filtering
   * @param techId The technician ID to delete tracking data for
   * @param userEmpID Current user's employee ID (optional)
   * @param windowsID Current user's Windows ID (optional)
   */
  deleteToolsTracking(techId: string, userEmpID?: string, windowsID?: string): Observable<DeleteToolsTrackingResultDto> {
    let params = new HttpParams();
    if (userEmpID) params = params.set('userEmpID', userEmpID);
    if (windowsID) params = params.set('windowsID', windowsID);
    
    return this.http.delete<DeleteToolsTrackingResultDto>(
      `${this.apiUrl}/ToolsTrackingTechs/delete/${techId}`,
      { headers: this.headers, params }
    );
  }

  /**
   * Save/Update tech tools tracking data - Enhanced with role-based filtering
   * @param request Save request containing tech ID and tool tracking items
   * @param userEmpID Current user's employee ID (optional)
   * @param windowsID Current user's Windows ID (optional)
   */
  saveTechToolsTracking(request: SaveTechToolsTrackingRequestDto, userEmpID?: string, windowsID?: string): Observable<SaveTechToolsTrackingApiResponse> {
    let params = new HttpParams();
    if (userEmpID) params = params.set('userEmpID', userEmpID);
    if (windowsID) params = params.set('windowsID', windowsID);
    
    return this.http.post<SaveTechToolsTrackingApiResponse>(
      `${this.apiUrl}/ToolsTrackingTechs/save-tracking`,
      request,
      { headers: this.headers, params }
    );
  }

  /* ============ FILE MANAGEMENT ENDPOINTS ============ */

  /**
   * Get file attachments for a tech ID - Enhanced with role-based filtering
   * @param techId Tech ID to get files for
   * @param userEmpID Current user's employee ID (optional)
   * @param windowsID Current user's Windows ID (optional)
   */
  getToolsTrackingFiles(techId: string, userEmpID?: string, windowsID?: string): Observable<ToolsTrackingFilesApiResponse> {
    let params = new HttpParams();
    if (userEmpID) params = params.set('userEmpID', userEmpID);
    if (windowsID) params = params.set('windowsID', windowsID);
    
    return this.http.get<ToolsTrackingFilesApiResponse>(
      `${this.apiUrl}/ToolsTrackingTechs/files/${techId}`,
      { headers: this.headers, params }
    );
  }

  /**
   * Upload a file for a tech ID - Enhanced with role-based filtering
   * @param techId Tech ID to upload file for
   * @param file File to upload
   * @param userEmpID Current user's employee ID (optional)
   * @param windowsID Current user's Windows ID (optional)
   */
  uploadToolsTrackingFile(techId: string, file: File, userEmpID?: string, windowsID?: string): Observable<FileUploadApiResponse> {
    const formData = new FormData();
    formData.append('file', file);

    let params = new HttpParams();
    if (userEmpID) params = params.set('userEmpID', userEmpID);
    if (windowsID) params = params.set('windowsID', windowsID);

    return this.http.post<FileUploadApiResponse>(
      `${this.apiUrl}/ToolsTrackingTechs/upload-file/${techId}`,
      formData,
      { headers: new HttpHeaders({ 'Access-Control-Allow-Origin': '*' }), params }
    );
  }

  /**
   * Download a file for a tech ID - Enhanced with role-based filtering
   * @param techId Tech ID
   * @param fileName File name to download
   * @param userEmpID Current user's employee ID (optional)
   * @param windowsID Current user's Windows ID (optional)
   */
  downloadToolsTrackingFile(techId: string, fileName: string, userEmpID?: string, windowsID?: string): Observable<Blob> {
    let params = new HttpParams();
    if (userEmpID) params = params.set('userEmpID', userEmpID);
    if (windowsID) params = params.set('windowsID', windowsID);
    
    return this.http.get(
      `${this.apiUrl}/ToolsTrackingTechs/download-file/${techId}/${encodeURIComponent(fileName)}`,
      { 
        headers: this.headers,
        responseType: 'blob',
        params
      }
    );
  }

  /**
   * Delete a file for a tech ID - Enhanced with role-based filtering
   * @param techId Tech ID
   * @param fileName File name to delete
   * @param userEmpID Current user's employee ID (optional)
   * @param windowsID Current user's Windows ID (optional)
   */
  deleteToolsTrackingFile(techId: string, fileName: string, userEmpID?: string, windowsID?: string): Observable<{ success: boolean; message: string }> {
    let params = new HttpParams();
    if (userEmpID) params = params.set('userEmpID', userEmpID);
    if (windowsID) params = params.set('windowsID', windowsID);
    
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/ToolsTrackingTechs/delete-file/${techId}/${encodeURIComponent(fileName)}`,
      { headers: this.headers, params }
    );
  }

  /* ============ LEGACY EQUIPMENT FILE ATTACHMENTS (BLOB STORAGE) ============ */

  /**
   * Save equipment file attachment to database as BLOB
   * Matches legacy SaveEquipmentFiles method
   */
  saveEquipmentFile(fileData: SaveEquipmentFileRequestDto): Observable<SaveFileApiResponse> {
    return this.http.post<SaveFileApiResponse>(
      `${this.apiUrl}/ToolsTrackingTechs/equipment-files`,
      fileData,
      { headers: this.headers }
    );
  }

  /**
   * Get equipment file attachments from database
   * Matches legacy GetEquipmentFiles method
   */
  getEquipmentFiles(equipID: number): Observable<EquipmentFileApiResponse> {
    return this.http.get<EquipmentFileApiResponse>(
      `${this.apiUrl}/ToolsTrackingTechs/equipment-files/${equipID}`,
      { headers: this.headers }
    );
  }

  /**
   * Download file from database BLOB storage
   */
  downloadEquipmentFile(equipID: number, fileName: string): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/ToolsTrackingTechs/equipment-files/${equipID}/download/${fileName}`,
      { 
        headers: this.headers,
        responseType: 'blob'
      }
    );
  }
}