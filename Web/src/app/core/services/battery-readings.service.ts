import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import {
  BatteryStringInfo,
  EquipReconciliationInfo,
  BatteryTypeValue,
  ReferenceValue,
  UpdateEquipStatus,
  BatteryData,
} from '../model/battery-readings.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BatteryReadingsService {
  private apiUrl = environment.apiUrl || '/api';

  constructor(private http: HttpClient) {}

  /**
   * Get manufacturer names
   */
  getManufacturerNames(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/Readings/GetManufacturerNames`)
      .pipe(
        map((response) => {
          // Normalize API response to objects with { id, name }
          if (!Array.isArray(response)) return [];
          return response.map((it: any) => {
            const id = (it?.manufID ?? it?.manufId ?? it?.id ?? '').toString().trim();
            const name = (it?.manufName ?? it?.manufname ?? it?.name ?? '').toString().trim();
            return { id, name };
          });
        }),
        catchError((error) => {
          console.error('Error fetching manufacturers:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get battery string readings information
   */
  getBatteryStringReadingsInfo(
    callNbr: string,
    equipId: number,
    batStrId: string
  ): Observable<BatteryStringInfo> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString())
      .set('batStrId', batStrId);

    return this.http
      .get<any>(`${this.apiUrl}/Readings/GetBatteryStringReadingsInfo`, { params })
      .pipe(
        map((response) => this.mapBatteryStringInfo(response)),
        catchError((error) => {
          console.error('Error fetching battery string info:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Save or update battery string readings
   */
  saveUpdateBatteryStringReadings(
    batteryInfo: BatteryStringInfo
  ): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/Readings/SaveUpdateBatteryStringReadings`, batteryInfo)
      .pipe(
        catchError((error) => {
          console.error('Error saving battery string readings:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get equipment reconciliation information
   */
  getEquipReconciliationInfo(
    callNbr: string,
    equipId: number
  ): Observable<EquipReconciliationInfo> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString());

    return this.http
      .get<any>(`${this.apiUrl}/EquipmentDetails/GetEquipReconciliationInfo`, { params })
      .pipe(
        map((response) => this.mapEquipReconciliationInfo(response)),
        catchError((error) => {
          console.error('Error fetching reconciliation info:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Save or update equipment reconciliation information
   */
  saveUpdateEquipReconciliationInfo(
    reconInfo: EquipReconciliationInfo
  ): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/EquipmentDetails/SaveUpdateEquipReconciliationInfo`, reconInfo)
      .pipe(
        catchError((error) => {
          console.error('Error saving reconciliation info:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get battery information (for grid population)
   */
  getBatteryInfo(
    callNbr: string,
    equipId: number,
    batStrId: string
  ): Observable<BatteryData[]> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString())
      .set('batStrId', batStrId);

    return this.http
      .get<any[]>(`${this.apiUrl}/Readings/GetBatteryInfo`, { params })
      .pipe(
        map((response) => response.map((item) => this.mapBatteryData(item))),
        catchError((error) => {
          console.error('Error fetching battery info:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get battery type values for calculations
   */
  getBatteryTypeValues(
    batteryType: string,
    batteryTypeName: string,
    floatVoltS: string,
    floatVoltV: number
  ): Observable<BatteryTypeValue> {
    const params = new HttpParams()
      .set('batteryType', batteryType)
      .set('batteryTypeName', batteryTypeName)
      .set('floatVoltS', floatVoltS)
      .set('floatVoltV', floatVoltV.toString());

    return this.http
      .get<any>(`${this.apiUrl}/battery/GetBatteryTypeValues`, { params })
      .pipe(
        map((response) => ({
          batteryType: response.batteryType || '',
          monitorStart: response.monitorStart || 0,
          monitorEnd: response.monitorEnd || 0,
          replace: response.replace || 0,
        })),
        catchError((error) => {
          console.error('Error fetching battery type values:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get reference values for battery readings
   */
  getReferenceValues(
    equipId: number,
    operation: string,
    readingMethod?: string,
    battMakeModel?: string,
    refValue1?: number,
    refValue2?: number
  ): Observable<ReferenceValue[]> {
    let params = new HttpParams()
      .set('equipId', equipId.toString())
      .set('operation', operation);

    if (readingMethod) params = params.set('readingMethod', readingMethod);
    if (battMakeModel) params = params.set('battMakeModel', battMakeModel);
    if (refValue1) params = params.set('refValue1', refValue1.toString());
    if (refValue2) params = params.set('refValue2', refValue2.toString());

    return this.http
      .get<any[]>(`${this.apiUrl}/battery/GetReferenceValues`, { params })
      .pipe(
        map((response) =>
          response.map((item) => ({
            id: item.id || '',
            name: item.name || '',
            value1: item.value1 || 0,
            value2: item.value2 || 0,
          }))
        ),
        catchError((error) => {
          console.error('Error fetching reference values:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Delete battery information
   */
  deleteBattery(
    callNbr: string,
    equipId: number,
    batStrId: string
  ): Observable<any> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString())
      .set('batStrId', batStrId);

    return this.http
      .delete(`${this.apiUrl}/battery/DeleteBattery`, { params })
      .pipe(
        catchError((error) => {
          console.error('Error deleting battery:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Save battery data
   */
  saveBatteryData(batteryDataList: BatteryData[]): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/battery/SaveBatteryData`, batteryDataList)
      .pipe(
        catchError((error) => {
          console.error('Error saving battery data:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update equipment status
   */
  updateEquipStatus(statusInfo: UpdateEquipStatus): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/equipment/UpdateEquipStatus`, statusInfo)
      .pipe(
        catchError((error) => {
          console.error('Error updating equipment status:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get job summary report for equipment status determination
   */
  getJobSummaryReport(
    callNbr: string,
    equipId: number,
    equipType: string,
    flag: string
  ): Observable<any> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString())
      .set('equipType', equipType)
      .set('flag', flag);

    return this.http
      .get<any>(`${this.apiUrl}/reports/GetJobSummaryReport`, { params })
      .pipe(
        catchError((error) => {
          console.error('Error fetching job summary report:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get status descriptions for equipment
   */
  getStatusDescription(equipType: string): Observable<any[]> {
    const params = new HttpParams().set('equipType', equipType);

    return this.http
      .get<any[]>(`${this.apiUrl}/equipment/GetStatusDescription`, { params })
      .pipe(
        catchError((error) => {
          console.error('Error fetching status descriptions:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get equipment information
   */
  getEquipmentInfo(callNbr: string, equipId: number): Observable<any> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString());

    return this.http
      .get<any>(`${this.apiUrl}/equipment/GetEquipmentInfo`, { params })
      .pipe(
        catchError((error) => {
          console.error('Error fetching equipment info:', error);
          return throwError(() => error);
        })
      );
  }

  // ==================== Helper Mapping Methods ====================

  private mapBatteryStringInfo(response: any): BatteryStringInfo {
    // Map API response field names to BatteryStringInfo interface
    // API uses snake_case (e.g., bulged_Check, plusTerminal_to_Ground)
    return {
      batStrId: response.batteryStringId || response.batStrId || '',
      callNbr: response.callNbr || '',
      equipId: response.equipId || 0,
      manufacturer: response.manufacturer || '',
      batteryHousing: response.batteryHousing || '',
      modelNo: response.modelNo || '',
      serialNo: response.serialNo || '',
      location: response.location || '',
      batteryType: response.batteryType || '',
      batteryTypeName: response.batteryTypeName || '',
      equipStatus: response.equipStatus || '',
      monthName: response.batteryDateCodeMonth || response.monthName || '',
      year: response.batteryDateCodeYear || response.year || 0,
      commentsUsed: response.comments_Used || '',
      bulgedCheck: response.bulged_Check || false,
      bulgedPf: response.bulged_PF || '',
      crackedCheck: response.cracked_Check || false,
      crackedPf: response.cracked_PF || '',
      debrisCheck: response.debris_Check || false,
      debrisPf: response.debris_PF || '',
      rotten: response.rotten || '',
      verifySaftey: response.verifySaftey || '',
      containerComments: response.containerComments || '',
      environmentComments: response.environmentComments || '',
      batVoltage: response.batteryVoltage || response.batVoltage || 0,
      plusTerminal: response.plusTerminalToGround || response.plusTerminal || 0,
      minusTerminal: response.minusTerminalToGround || response.minusTerminal || 0,
      dcCharging: response.dcChargingCurrent || response.dcCharging || 0,
      acRipple: response.acRipple || 0,
      acRippleCurrent: response.acRippleCurrent || 0,
      batVoltatePf: response.voltageStatus || response.batVoltatePf || '',
      plusTerminalPf: response.plusTermStatus || response.plusTerminalPf || '',
      minusTerminalPf: response.minusTermStatus || response.minusTerminalPf || '',
      dcChargingPf: response.dcChargingStatus || response.dcChargingPf || '',
      acRipplePf: response.acRippleStatus || response.acRipplePf || '',
      acRippleCurrentPf: response.acRippleCurrentStatus || response.acRippleCurrentPf || '',
      resistancePf: response.interCellStatus || response.resistancePf || '',
      codeTorquePf: response.torqueStatus || response.codeTorquePf || '',
      comment: response.comment || '',
      plusWrappedPf: response.plusWrapped_PF || response.plusWrappedPf || '',
      plusWrappedCheck: response.plusWrapped_Check || false,
      plusSulfatedCheck: response.plusSulfated_Check || false,
      plusMisPosCheck: response.plusMisPos_Check || false,
      missingCheck: response.missing_Check || false,
      missingPf: response.missing_PF || '',
      brokenCheck: response.broken_Check || false,
      needsCleaningCheck: response.needsCleaning_Check || false,
      platesComments: response.platesComments || '',
      waterLevelV: response.waterLevel_T || response.waterLevelV || '',
      waterLevelPf: response.waterLevel_PF || response.waterLevelPf || '',
      readingType: response.readingType || '',
      stringType: response.stringType || '',
      electrolytesComments: response.electrolytesComments || '',
      batteryTempPf: response.batteryTemp_PF || response.batteryTempPf || '',
      roomTemp: response.roomTemp || 0,
      battTemp: response.battTemp || 0,
      battTempPf: response.battTemp_PF || response.battTempPf || '',
      quantityUsed: response.quantity_Used || response.quantityUsed || 0,
      quantityNeeded: response.tobeMonitored || response.quantityNeeded || 0,
      reasonReplace: response.reason_Replace || response.reasonReplace || '',
      floatVoltS: response.floatVoltS || '',
      floatVoltV: response.floatVoltV || '',
      intercellConnector: response.intercellConnector || '',
      replaceWholeString: response.replaceWholeString || false,
      chckmVac: response.chkmVAC || response.chckmVac || false,
      chkStrap: response.chkStrap || false,
      maintAuthId: response.maint_Auth_Id || response.maintAuthId || '',
      repMonCalc: response.repMonCalc || '',
      batteryPackCount: response.batteryPackCount || 0,
      indBattDisconnect: response.indBattDisconnect || '',
      indBattInterConn: response.indBattInterConn || '',
      rackIntegrity: response.rackIntegrity || '',
      ventFanOperation: response.vfOperation || response.ventFanOperation || '',
      ddlBattTerminal: response.battTerminalS || response.ddlBattTerminal || '',
      ddlBattTypeTerminal: response.battTypeTerminal || response.ddlBattTypeTerminal || '',
      txtBattTerminal: response.battTerminalT || response.txtBattTerminal || '',
      readingMethod: response.readingMethod || '',
      chkGraph: response.chkGraph || false,
      saveAsDraft: response.saveAsDraft || false,
    };
  }

  private mapEquipReconciliationInfo(response: any): EquipReconciliationInfo {
    return {
      callNbr: response.callNbr || '',
      equipId: response.equipId || 0,
      make: response.make || '',
      makeCorrect: response.makeCorrect || '',
      actMake: response.actMake || '',
      model: response.model || '',
      modelCorrect: response.modelCorrect || '',
      actModel: response.actModel || '',
      serialNo: response.serialNo || '',
      serialNoCorrect: response.serialNoCorrect || '',
      actSerialNo: response.actSerialNo || '',
      ascStringsNo: response.ascStringsNo || 0,
      ascStringsCorrect: response.ascStringsCorrect || '',
      actAscStringNo: response.actAscStringNo || 0,
      battPerString: response.battPerString || 0,
      battPerStringCorrect: response.battPerStringCorrect || '',
      actBattPerString: response.actBattPerString || 0,
      totalEquips: response.totalEquips || 0,
      totalEquipsCorrect: response.totalEquipsCorrect || '',
      actTotalEquips: response.actTotalEquips || 0,
      kva: response.kva || '',
      kvaCorrect: response.kvaCorrect || '',
      actKva: response.actKva || '',
      verified: response.verified || false,
    };
  }

  private mapBatteryData(item: any): BatteryData {
    return {
      callNbr: item.callNbr || '',
      equipId: item.equipId || 0,
      batteryStringId: item.batteryStringId || '',
      batteryId: item.batteryId || 0,
      temp: item.temp || 0,
      vdc: item.vdc || 0,
      mhos: item.mhos || 0,
      strap1: item.strap1 || 0,
      strap2: item.strap2 || 0,
      spGravity: item.spGravity || 0,
      vac: item.vac || 0,
      cracks: item.cracks || '',
      replacementNeeded: item.replacementNeeded || '',
      monitoringBattery: item.monitoringBattery || '',
      actionPlan: item.actionPlan || '',
      lastModified: item.lastModified ? new Date(item.lastModified) : new Date(),
      maintAuthId: item.maintAuthId || '',
    };
  }
}
