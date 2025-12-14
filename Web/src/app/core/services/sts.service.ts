import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { STSReadings, STSReconciliationInfo, STSEquipInfo } from '../model/sts-readings.model';

@Injectable({
  providedIn: 'root'
})
export class StsService {
  private apiUrl = `${environment.apiUrl}/Readings`;

  constructor(private http: HttpClient) {}

  // Get STS readings data
  getSTSReadings(callNbr: string, equipId: number, stsId: string): Observable<STSReadings> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString())
      .set('stsId', stsId);
    
    return this.http.get<STSReadings>(`${this.apiUrl}/GetSTSInfo`, { params });
  }

  // Save or update STS readings
  saveSTSReadings(data: STSReadings): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/SaveUpdateSTSInfo`, data);
  }

  // Get reconciliation info
  getReconciliationInfo(callNbr: string, equipId: number): Observable<STSReconciliationInfo> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString());
    
    return this.http.get<STSReconciliationInfo>(`${this.apiUrl}/sts-reconciliation`, { params });
  }

  // Save reconciliation info
  saveReconciliationInfo(data: STSReconciliationInfo): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/sts-reconciliation`, data);
  }

  // Get equipment info
  getEquipmentInfo(callNbr: string, equipId: number, stsId: string): Observable<STSEquipInfo> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString())
      .set('stsId', stsId);
    
    return this.http.get<STSEquipInfo>(`${this.apiUrl}/sts-equipment-info`, { params });
  }

  // Calculate equipment status based on readings
  calculateEquipmentStatus(callNbr: string, equipId: number): Observable<{ status: string }> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString());
    
    return this.http.get<{ status: string }>(`${this.apiUrl}/calculate-sts-status`, { params });
  }

  // Update equipment status
  updateEquipmentStatus(data: {
    callNbr: string;
    equipId: number;
    status: string;
    statusNotes: string;
    tableName: string;
    manufacturer: string;
    modelNo: string;
    serialNo: string;
    location: string;
    monthName: string;
    year: number;
    readingType: string;
  }): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/update-sts-status`, data);
  }

  // Utility method to calculate phase-to-neutral voltage
  calculatePhaseToNeutralVoltage(phaseToPhaseVoltage: number): number {
    if (!phaseToPhaseVoltage || phaseToPhaseVoltage === 0) {
      return 0;
    }
    return Math.round(phaseToPhaseVoltage / 1.732);
  }

  // Calculate load percentage
  calculateLoadPercentage(current: number, kva: number, voltage: number, phases: number): number {
    if (!kva || kva === 0 || !voltage || voltage === 0) {
      return 0;
    }
    
    const maxCurrent = (kva * 1000) / (voltage * Math.sqrt(phases));
    const loadPercentage = (current / maxCurrent) * 100;
    
    return Math.round(loadPercentage * 100) / 100; // Round to 2 decimal places
  }
}
