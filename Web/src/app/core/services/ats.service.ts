import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface AtsInfo {
  atsId?: number;  // ATSId from backend
  manufacturer: string;
  modelNo: string;
  serialNo: string;
  temperature: string;
  status: string;
  statusNotes: string;
  voltage: string;
  amps: string;
  poles: string;
  manual: string;
  clean: string;
  inspect: string;
  checkContact: string;
  inspectArc: string;
  transferSwitch: string;
  testSwitch: string;
  comments1: string;
  engineStart: string;
  transferEmergency: string;
  reTransferNormal: string;
  gensetCooldown: string;
  clockTime: string;
  pickupVoltA: string;
  pickupVoltB: string;
  pickupVoltC: string;
  dropoutVoltA: string;
  dropoutVoltB: string;
  dropoutVoltC: string;
  emVoltPickup: string;
  emVoltDropout: string;
  freqPick: string;
  freqDropout: string;
  comments2: string;
  maint_Auth_ID?: number;
}

export interface AtsReconciliationInfo {
  recModel: string;
  recModelCorrect: string;
  actModel: string;
  recSerialNo: string;
  recSerialNoCorrect: string;
  actSerialNo: string;
  verified: boolean;
  totalEquips?: number;
  totalEquipsCorrect?: string;
  actTotalEquips?: number;
}

@Injectable({ providedIn: 'root' })
export class AtsService {
  private apiUrl = `${environment.apiUrl}/Readings`;

  constructor(private http: HttpClient) {}

  getManufacturers(): Observable<{ value: string; label: string }[]> {
    return this.http.get<{ value: string; label: string }[]>(`${this.apiUrl}/manufacturers`);
  }

  getAtsInfo(callNbr: string, equipNo: string, equipId: number): Observable<AtsInfo> {
    const params = new HttpParams()
      .set('CallNbr', callNbr)
      .set('EquipNo', equipNo)
      .set('EquipId', equipId.toString());
    return this.http.get<AtsInfo>(`${this.apiUrl}/GetATSInfo`, { params });
  }

  getReconciliationInfo(callNbr: string, equipId: number): Observable<AtsReconciliationInfo> {
    const params = new HttpParams()
      .set('CallNbr', callNbr)
      .set('EquipId', equipId.toString());
    return this.http.get<AtsReconciliationInfo>(`${this.apiUrl}/reconciliation`, { params });
  }

  saveAtsInfo(callNbr: string, equipNo: string, equipId: number, ats: AtsInfo): Observable<any> {
    // Backend expects ATSInfo wrapped in 'dto' property as per controller signature:
    // public async Task<IActionResult> UpdateATS([FromBody] ATSInfo dto)
    return this.http.post(`${this.apiUrl}/UpdateATSInfo`, {
      
        callNbr,
        equipNo,
        equipId,
        ...ats
      
    });
  }

  saveReconciliationInfo(callNbr: string, equipId: number, rec: AtsReconciliationInfo): Observable<any> {
    return this.http.post(`${this.apiUrl}/reconciliation/save`, { callNbr, equipId, rec });
  }

  updateEquipStatus(callNbr: string, equipId: number, status: string, statusNotes: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/status`, { callNbr, equipId, status, statusNotes });
  }

  getEquipStatus(callNbr: string, equipId: number): Observable<string> {
    const params = new HttpParams()
      .set('CallNbr', callNbr)
      .set('EquipId', equipId.toString());
    return this.http.get<string>(`${this.apiUrl}/computed-status`, { params });
  }
}
