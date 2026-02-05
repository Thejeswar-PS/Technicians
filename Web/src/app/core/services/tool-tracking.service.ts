import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ToolTrackingApiResponse, ToolTrackingCountApiResponse, ToolsTrackingTechsApiResponse } from '../model/tool-tracking.model';

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
}