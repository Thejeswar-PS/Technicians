import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { PDUReadings, PDUReconciliationInfo, PDUEquipInfo } from '../model/pdu-readings.model';

@Injectable({
  providedIn: 'root'
})
export class PduService {
  private apiUrl = `${environment.apiUrl}/Readings`;

  constructor(private http: HttpClient) {}

  // Get PDU readings data
  getPDUReadings(callNbr: string, equipId: number, pduId: string): Observable<PDUReadings> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString())
      .set('pduId', pduId);
    
    return this.http.get<PDUReadings>(`${this.apiUrl}/GetPDUVerification`, { params });
  }

  // Save or update PDU readings
  savePDUReadings(data: PDUReadings): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/SaveUpdatePDUReadings`, data);
  }

  // Get reconciliation info
  getReconciliationInfo(callNbr: string, equipId: number): Observable<PDUReconciliationInfo> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString());
    
    return this.http.get<PDUReconciliationInfo>(`${this.apiUrl}/reconciliation`, { params });
  }

  // Save reconciliation info
  saveReconciliationInfo(data: PDUReconciliationInfo): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/reconciliation`, data);
  }

  // Get equipment info
  getEquipmentInfo(callNbr: string, equipId: number, pduId: string): Observable<PDUEquipInfo> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString())
      .set('pduId', pduId);
    
    return this.http.get<PDUEquipInfo>(`${this.apiUrl}/equipment-info`, { params });
  }

  // Calculate equipment status based on readings
  calculateEquipmentStatus(callNbr: string, equipId: number): Observable<{ status: string }> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString());
    
    return this.http.get<{ status: string }>(`${this.apiUrl}/calculate-status`, { params });
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
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/update-status`, data);
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
