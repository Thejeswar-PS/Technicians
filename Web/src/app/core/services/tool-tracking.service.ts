import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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
   * Get tools tracking technicians data
   */
  getToolsTrackingTechs(): Observable<ToolsTrackingTechsApiResponse> {
    return this.http.get<ToolsTrackingTechsApiResponse>(
      `${this.apiUrl}/ToolsTrackingTechs`,
      { headers: this.headers }
    );
  }

  /**
   * Get tool serial numbers by tool name
   * @param toolName The tool name to filter by (defaults to "All")
   */
  getTechToolSerialNos(toolName: string = 'All'): Observable<TechToolSerialNoApiResponse> {
    return this.http.get<TechToolSerialNoApiResponse>(
      `${this.apiUrl}/ToolsTrackingTechs/serial-numbers?toolName=${encodeURIComponent(toolName)}`,
      { headers: this.headers }
    );
  }

  /**
   * Get tools calendar tracking data with due counts
   * @param startDate Start date for filtering (defaults to 15th of previous month)
   * @param endDate End date for filtering (defaults to 15th of next month)
   * @param toolName Tool name to filter by (defaults to "All")
   * @param serialNo Serial number to filter by (defaults to "All")
   * @param techFilter Tech filter (defaults to "All")
   */
  getToolsCalendarTracking(
    startDate?: Date,
    endDate?: Date,
    toolName: string = 'All',
    serialNo: string = 'All',
    techFilter: string = 'All'
  ): Observable<ToolsCalendarTrackingApiResponse> {
    let url = `${this.apiUrl}/ToolsTrackingTechs/calendar-tracking?`;
    
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate.toISOString());
    if (endDate) params.append('endDate', endDate.toISOString());
    params.append('toolName', toolName);
    params.append('serialNo', serialNo);
    params.append('techFilter', techFilter);
    
    url += params.toString();

    return this.http.get<ToolsCalendarTrackingApiResponse>(
      url,
      { headers: this.headers }
    );
  }

  /**
   * Get tech tools misc kit data by tech ID
   * @param techId The technician ID to retrieve misc kit data for
   */
  getTechToolsMiscKit(techId: string): Observable<TechToolsMiscKitApiResponse> {
    return this.http.get<TechToolsMiscKitApiResponse>(
      `${this.apiUrl}/ToolsTrackingTechs/misc-kit/${techId}`,
      { headers: this.headers }
    );
  }

  /**
   * Get tech tools tracking data by tech ID
   * @param techId The technician ID to retrieve tracking data for
   */
  getTechToolsTracking(techId: string): Observable<ToolTrackingApiResponse> {
    return this.http.get<ToolTrackingApiResponse>(
      `${this.apiUrl}/ToolsTrackingTechs/tracking/${techId}`,
      { headers: this.headers }
    );
  }

  /**
   * Get tools tracking count by tech ID
   * @param techId The technician ID to retrieve count for
   */
  getToolsTrackingCount(techId: string): Observable<ToolTrackingCountApiResponse> {
    return this.http.get<ToolTrackingCountApiResponse>(
      `${this.apiUrl}/ToolsTrackingTechs/count/${techId}`,
      { headers: this.headers }
    );
  }

  /**
   * Execute insert tech tools query
   * @param query SQL query to execute
   */
  executeInsertTechToolsQuery(query: string): Observable<ExecuteInsertTechToolsQueryResultDto> {
    return this.http.post<ExecuteInsertTechToolsQueryResultDto>(
      `${this.apiUrl}/ToolsTrackingTechs/execute-query`,
      { query },
      { headers: this.headers }
    );
  }

  /**
   * Delete tools tracking data by tech ID
   * @param techId The technician ID to delete tracking data for
   */
  deleteToolsTracking(techId: string): Observable<DeleteToolsTrackingResultDto> {
    return this.http.delete<DeleteToolsTrackingResultDto>(
      `${this.apiUrl}/ToolsTrackingTechs/delete/${techId}`,
      { headers: this.headers }
    );
  }

  /**
   * Save/Update tech tools tracking data
   * @param request Save request containing tech ID and tool tracking items
   */
  saveTechToolsTracking(request: SaveTechToolsTrackingRequestDto): Observable<SaveTechToolsTrackingApiResponse> {
    return this.http.post<SaveTechToolsTrackingApiResponse>(
      `${this.apiUrl}/ToolsTrackingTechs/save-tracking`,
      request,
      { headers: this.headers }
    );
  }

  /* ============ FILE MANAGEMENT ENDPOINTS ============ */

  /**
   * Get file attachments for a tech ID
   * @param techId Tech ID to get files for
   */
  getToolsTrackingFiles(techId: string): Observable<ToolsTrackingFilesApiResponse> {
    return this.http.get<ToolsTrackingFilesApiResponse>(
      `${this.apiUrl}/ToolsTrackingTechs/files/${techId}`,
      { headers: this.headers }
    );
  }

  /**
   * Upload a file for a tech ID
   * @param techId Tech ID to upload file for
   * @param file File to upload
   */
  uploadToolsTrackingFile(techId: string, file: File): Observable<FileUploadApiResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<FileUploadApiResponse>(
      `${this.apiUrl}/ToolsTrackingTechs/upload-file/${techId}`,
      formData,
      { headers: new HttpHeaders({ 'Access-Control-Allow-Origin': '*' }) }
    );
  }

  /**
   * Download a file for a tech ID
   * @param techId Tech ID
   * @param fileName File name to download
   */
  downloadToolsTrackingFile(techId: string, fileName: string): Observable<Blob> {
    return this.http.get(
      `${this.apiUrl}/ToolsTrackingTechs/download-file/${techId}/${encodeURIComponent(fileName)}`,
      { 
        headers: this.headers,
        responseType: 'blob'
      }
    );
  }

  /**
   * Delete a file for a tech ID
   * @param techId Tech ID
   * @param fileName File name to delete
   */
  deleteToolsTrackingFile(techId: string, fileName: string): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/ToolsTrackingTechs/delete-file/${techId}/${encodeURIComponent(fileName)}`,
      { headers: this.headers }
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