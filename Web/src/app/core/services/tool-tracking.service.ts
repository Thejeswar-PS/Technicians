import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ToolTrackingApiResponse, ToolTrackingCountApiResponse, ToolsTrackingTechsApiResponse, EquipmentFileApiResponse, SaveEquipmentFileRequestDto, SaveFileApiResponse } from '../model/tool-tracking.model';

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

  // Commented out - replaced with tracking endpoint
  // /**
  //  * Get tech tools misc kit data by tech ID
  //  * @param techId The technician ID to retrieve data for
  //  */
  // getTechToolsMiscKit(techId: string): Observable<ToolTrackingApiResponse> {
  //   return this.http.get<ToolTrackingApiResponse>(
  //     `${this.apiUrl}/ToolsTrackingTechs/misc-kit/${techId}`,
  //     { headers: this.headers }
  //   );
  // }

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

  /**
   * Save bulk tool tracking data updates
   * @param toolTrackingData Array of modified tool tracking records
   */
  saveToolTrackingBulk(toolTrackingData: any[]): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/ToolsTrackingTechs/bulk-update`,
      toolTrackingData,
      { headers: this.headers }
    );
  }
}