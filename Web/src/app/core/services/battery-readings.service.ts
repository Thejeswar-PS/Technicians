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

  getBatteryStringReadingsInfoTemp(
    callNbr: string,
    equipId: number,
    batStrId: string
  ): Observable<BatteryStringInfo> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString())
      .set('batStrId', batStrId);

    return this.http
      .get<any>(`${this.apiUrl}/Readings/GetBatteryStringReadingsInfoTemp`, { params })
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
    // Map camelCase properties to PascalCase with underscores for backend API
    const payload = this.mapBatteryStringInfoToApi(batteryInfo);
    
    return this.http
      .post(`${this.apiUrl}/Readings/SaveUpdateBatteryStringReadings`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error saving battery string readings:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Save or update battery string readings (Temp version)
   */
  saveUpdateBatteryStringReadingsTemp(
    batteryInfo: BatteryStringInfo
  ): Observable<any> {
    // Map camelCase properties to PascalCase with underscores for backend API
    const payload = this.mapBatteryStringInfoToApi(batteryInfo);
    
    return this.http
      .post(`${this.apiUrl}/Readings/SaveUpdateBatteryStringReadingsTemp`, payload)
      .pipe(
        catchError((error) => {
          console.error('Error saving battery string readings (Temp):', error);
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
        map((response) => {
          
          // Backend returns: { success: true, message: "...", data: { verified: true, ... } }
          // We need to extract from response.data, not response directly
          const dataObject = response.data || response;
          
          
          const mappedData = this.mapEquipReconciliationInfo(dataObject);
          console.log('✅ Mapped to frontend model:');
          console.log('   verified field:', mappedData.verified, typeof mappedData.verified);
          return mappedData;
        }),
        catchError((error) => {
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
    // Map camelCase properties to PascalCase for backend API
    const payload = this.mapEquipReconciliationInfoToApi(reconInfo);
    
    return this.http
      .post(`${this.apiUrl}/EquipmentDetails/SaveUpdateEquipReconciliation`, payload)
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

  getBatteryInfoTemp(
    callNbr: string,
    equipId: number,
    batStrId: string
  ): Observable<BatteryData[]> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString())
      .set('batStrId', batStrId);

    return this.http
      .get<any[]>(`${this.apiUrl}/Readings/GetBatteryInfoTemp`, { params })
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

    const url = `${this.apiUrl}/Readings/GetBatteryTypeValues`;

    return this.http
      .get<any>(url, { params })
      .pipe(
        map((response) => {
          // API returns an array, get the first element
          const data = Array.isArray(response) && response.length > 0 ? response[0] : response;
          
          return {
            batteryType: data.batteryType || '',
            monitorStart: parseFloat(data.monitorStrt) || 0,
            monitorEnd: parseFloat(data.monitorEnd) || 0,
            replace: parseFloat(data.replace) || 0,
          };
        }),
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
      .set('type', operation);

    if (readingMethod) params = params.set('readingMethod', readingMethod);
    if (battMakeModel) params = params.set('battMakeModel', battMakeModel);
    if (refValue1) params = params.set('refValue1', refValue1.toString());
    if (refValue2) params = params.set('refValue2', refValue2.toString());

    return this.http
      .get<any[]>(`${this.apiUrl}/Readings/GetReferenceValues`, { params })
      .pipe(
        map((response) => {
          if (!Array.isArray(response)) return [];
          return response.map((item) => ({
            // Map from API response: Name, Value, RefValue, Resistance
            id: (item.Value || item.value || '').toString().trim(),
            name: (item.Name || item.name || '').toString().trim(),
            value1: item.RefValue || item.refValue || 0,  // Reference voltage/capacity
            value2: item.Resistance || item.resistance || 0, // Resistance value
          }));
        }),
        catchError((error) => {
          console.error('Error fetching reference values:', error);
          return throwError(() => error);
        })
      );
  }

  saveReferenceValues(
    equipId: number,
    operation: string,
    readingMethod?: string,
    battMakeModel?: string,
    refValue1?: number,
    refValue2?: number
  ): Observable<ReferenceValue[]> {
    let params = new HttpParams()
      .set('equipId', equipId.toString())
      .set('type', operation);

    if (readingMethod) params = params.set('readingMethod', readingMethod);
    if (battMakeModel) params = params.set('battMakeModel', battMakeModel);
    if (refValue1) params = params.set('refValue1', refValue1.toString());
    if (refValue2) params = params.set('refValue2', refValue2.toString());

    return this.http
      .get<any[]>(`${this.apiUrl}/Readings/SaveReferenceValues`, { params })
      .pipe(
        map((response) => {
          if (!Array.isArray(response)) return [];
          return response.map((item) => ({
            // Map from API response: Name, Value, RefValue, Resistance
            id: (item.Value || item.value || '').toString().trim(),
            name: (item.Name || item.name || '').toString().trim(),
            value1: item.RefValue || item.refValue || 0,  // Reference voltage/capacity
            value2: item.Resistance || item.resistance || 0, // Resistance value
          }));
        }),
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
      .delete(`${this.apiUrl}/Readings/DeleteBattery`, { params })
      .pipe(
        catchError((error) => {
          console.error('Error deleting battery:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Delete battery rows above a certain count
   * Used when reducing battery count - deletes BatteryID > batteryCount
   * Legacy: DELETE FROM Battery WHERE BatteryID > {count}
   */
  deleteBatteryRowsAboveCount(
    callNbr: string,
    equipId: number,
    batStrId: string,
    batteryCount: number
  ): Observable<any> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString())
      .set('batStrId', batStrId)
      .set('batteryCount', batteryCount.toString());

    return this.http
      .delete(`${this.apiUrl}/Readings/DeleteBatteryRowsAboveCount`, { params })
      .pipe(
        catchError((error) => {
          console.error('Error deleting battery rows above count:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Save battery data
   */
  saveBatteryData(batteryDataList: BatteryData[]): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/Readings/SaveBatteryData`, batteryDataList)
      .pipe(
        catchError((error) => {
          console.error('Error saving battery data:', error);
          return throwError(() => error);
        })
      );
  }

  saveBatteryDataTemp(batteryDataList: BatteryData[]): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/Readings/SaveBatteryDataTemp`, batteryDataList)
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
      .put(`${this.apiUrl}/EquipmentDetails/UpdateEquipStatus`, statusInfo)
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
      .get<any>(`${this.apiUrl}/Readings/GetEquipmentInfo`, { params })
      .pipe(
        catchError((error) => {
          console.error('Error fetching equipment info:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update battery info - Generic method aligned with legacy UpdateBatteryInfo(i)
   * Backend handles different operations based on parameter value:
   * - i=1: Update ReadingType in ETechEquipmentInfo
   * - i=2: Update BatteriesPerString and BatteriesPerPack, then call GetEquipInfo
   * - i=3+: Other operations (extensible on backend)
   * 
   * Legacy SQL patterns:
   * i=2: UPDATE ETechEquipmentInfo SET BatteriesPerString=..., BatteriesPerPack=... 
   *      WHERE CallNbr=... AND EquipID=... AND EquipNo=...
   *      THEN GetEquipInfo()
   * 
   * i!=2: UPDATE ETechEquipmentInfo SET ReadingType=...
   *       WHERE CallNbr=... AND EquipID=... AND EquipNo=...
   *       THEN GetEquipInfo()
   */
  updateBatteryInfo(
    callNbr: string,
    equipId: number,
    batStrId: string,
    i: number,
    batteryInfo?: any
  ): Observable<any> {
    const payload = {
      CallNbr: callNbr,
      EquipId: equipId,
      BatStrId: batStrId,
      i: i,
      ...batteryInfo,
    };

    return this.http
      .post(`${this.apiUrl}/Readings/UpdateBatteryInfo`, payload)
      .pipe(
        catchError((error) => {
          console.error(`Error updating battery info (i=${i}):`, error);
          return throwError(() => error);
        })
      );
  }

  // ==================== Helper Mapping Methods ====================

  /**
   * Map BatteryStringInfo from frontend (camelCase) to backend API format (PascalCase with underscores)
   */
  private mapBatteryStringInfoToApi(info: BatteryStringInfo): any {
    return {
      CallNbr: info.callNbr,
      EquipId: info.equipId,
      BatteryStringId: info.batStrId,
      Manufacturer: info.manufacturer,
      BatteryHousing: info.batteryHousing,
      ModelNo: info.modelNo,
      SerialNo: info.serialNo,
      BatteryType: info.batteryType,
      EquipStatus: info.equipStatus,
      BatteryDateCodeMonth: info.monthName,
      BatteryDateCodeYear: info.year,
      Comments_Used: info.commentsUsed,
      Bulged_Check: info.bulgedCheck,
      Bulged_PF: info.bulgedPf,
      Cracked_Check: info.crackedCheck,
      Cracked_PF: info.crackedPf,
      Debris_Check: info.debrisCheck,
      Debris_PF: info.debrisPf,
      Rotten: info.rotten,
      VerifySaftey: info.verifySaftey,
      ContainerComments: info.containerComments,
      EnvironmentComments: info.environmentComments,
      BatteryVoltage: info.batVoltage,
      BatVoltage_PF: info.batVoltatePf,
      PlusTerminalToGround: info.plusTerminal,
      PlusTerminal_PF: info.plusTerminalPf,
      MinusTerminalToGround: info.minusTerminal,
      MinusTerminal_PF: info.minusTerminalPf,
      DCChargingCurrent: info.dcCharging,
      DCCharging_PF: info.dcChargingPf,
      ACRipple: info.acRipple,
      ACRipple_PF: info.acRipplePf,
      ACRippleCurrent: info.acRippleCurrent,
      VoltageStatus: info.batVoltatePf,
      PlusTermStatus: info.plusTerminalPf,
      MinusTermStatus: info.minusTerminalPf,
      DCChargingStatus: info.dcChargingPf,
      ACRippleStatus: info.acRipplePf,
      ACRippleCurrentStatus: info.acRippleCurrentPf,
      InterCellStatus: info.resistancePf,
      TorqueStatus: info.codeTorquePf,
      Comment: info.comment,
      PlusWrapped_PF: info.plusWrappedPf,
      PlusWrapped_Check: info.plusWrappedCheck,
      PlusSulfated_Check: info.plusSulfatedCheck,
      PlusMisPos_Check: info.plusMisPosCheck,
      Missing_Check: info.missingCheck,
      Missing_PF: info.missingPf,
      Broken_Check: info.brokenCheck,
      NeedsCleaning_Check: info.needsCleaningCheck,
      PlatesComments: info.platesComments,
      WaterLevel_T: info.waterLevelV,
      WaterLevel_PF: info.waterLevelPf,
      ElectrolytesComments: info.electrolytesComments,
      BatteryTemp_PF: info.batteryTempPf,
      Temp: info.roomTemp,
      Quantity_Used: info.quantityUsed,
      TobeMonitored: info.quantityNeeded,
      Reason_Replace: info.reasonReplace,
      FloatVoltS: info.floatVoltS,
      FloatVoltV: info.floatVoltV,
      IntercellConnector: info.intercellConnector,
      ReplaceWholeString: info.replaceWholeString,
      Maint_Auth_Id: info.maintAuthId,
      RepMonCalc: info.repMonCalc,
      BatteryPackCount: info.batteryPackCount,
      IndBattDisconnect: info.indBattDisconnect,
      IndBattInterConn: info.indBattInterConn,
      RackIntegrity: info.rackIntegrity,
      VFOperation: info.ventFanOperation,
      Location: info.location,
      ReadingType: info.readingType,
      SaveAsDraft: info.saveAsDraft,
      chkmVAC: info.chckmVac,
      chkStrap: info.chkStrap,
      BattTemp: info.battTemp,
      BattTemp_PF: info.battTempPf,
      BatteryTypeName: info.batteryTypeName,
      StringType: info.stringType,
      BattTerminalS: info.ddlBattTerminal,
      BattTerminalT: info.txtBattTerminal,
      BattTypeTerminal: info.ddlBattTypeTerminal,
      ReadingMethod: info.readingMethod,
      chkGraph: info.chkGraph,
      
      // Additional fields
      Message: info.message,
      code: info.code,
      Resistance: info.resistance,
      Resistance_PF: info.resistancePf,
      CodeTorque: info.codeTorque,
      CodeTorque_PF: info.codeTorquePf,
      NegWrapped_Check: info.negWrappedCheck,
      NegWrapped_PF: info.negWrappedPf,
      NegSulfated_Check: info.negSulfatedCheck,
      NegMisPos_Check: info.negMisPosCheck,
      BothActMat_PF: info.bothActMatPf,
      BothActMat_Check: info.bothActMatCheck,
      ActPosMat_Check: info.actPosMatCheck,
      Other_Check: info.otherCheck,
      SedimentsComments: info.sedimentsComments,
      MissingCovers_Check: info.missingCoversCheck,
      MissingCovers_PF: info.missingCoversPf,
      BrokenCovers_Check: info.brokenCoversCheck,
      NeedsCleaningCovers_Check: info.needsCleaningCoversCheck,
      MissingSep_Check: info.missingSepCheck,
      MissingSep_PF: info.missingSepPf,
      QuartBelow_Check: info.quartBelowCheck,
      QuartBelow_PF: info.quartBelowPf,
      HalfBelow_Check: info.halfBelowCheck,
      HalfBelow_PF: info.halfBelowPf,
      ThrbyFourBelow_Check: info.thrbyFourBelowCheck,
      ThrbyFourBelow_PF: info.thrbyFourBelowPf,
      WaterFill_YN: info.waterFillYn,
      SepComments: info.sepComments,
      Quantity_Needed: info.quantityNeeded,
      ImmedActionOpen: info.immedActionOpen,
      UpgradeNoOpenAge: info.upgradeNoOpenAge,
      UpgradeNoOpen: info.upgradeNoOpen,
      RoomTemp: info.roomTemp,
      PositivePost: info.positivePost,
      NegativePost: info.negativePost,
      PostSeals: info.postSeals,
      BatteryDisc: info.batteryDisc,
      MiscHardware: info.miscHardware,
      SealsComments: info.sealsComments,
      HardwareComments: info.hardwareComments,
      ManufDate_PF: info.manufDatePf,
      ManufDate: info.manufDate,
      BattProActiveReplace: info.battProActiveReplace,
    };
  }

  private mapBatteryStringInfo(response: any): BatteryStringInfo {
    // Map API response field names to BatteryStringInfo interface
    // API primarily uses camelCase with underscores (e.g., bulged_Check, cracked_Check)
    return {
      batStrId: response.batteryStringId || response.BatteryStringId || '',
      callNbr: response.callNbr || response.CallNbr || '',
      equipId: response.equipId || response.EquipId || 0,
      manufacturer: response.manufacturer || response.Manufacturer || '',
      batteryHousing: response.batteryHousing || response.BatteryHousing || '',
      modelNo: response.modelNo || response.ModelNo || '',
      serialNo: response.serialNo || response.SerialNo || '',
      location: response.location || response.Location || '',
      batteryType: response.batteryType || response.BatteryType || '',
      batteryTypeName: response.batteryTypeName || response.BatteryTypeName || '',
      equipStatus: response.equipStatus || response.EquipStatus || '',
      monthName: response.batteryDateCodeMonth || response.BatteryDateCodeMonth || '',
      year: response.batteryDateCodeYear || response.BatteryDateCodeYear || 0,
      commentsUsed: response.comments_Used || response.Comments_Used || response.commentsUsed || '',
      bulgedCheck: response.bulged_Check !== undefined ? response.bulged_Check : (response.Bulged_Check || false),
      bulgedPf: response.bulged_PF || response.Bulged_PF || '',
      crackedCheck: response.cracked_Check !== undefined ? response.cracked_Check : (response.Cracked_Check || false),
      crackedPf: response.cracked_PF || response.Cracked_PF || '',
      debrisCheck: response.debris_Check !== undefined ? response.debris_Check : (response.Debris_Check || false),
      debrisPf: response.debris_PF || response.Debris_PF || '',
      rotten: response.rotten || response.Rotten || '',
      verifySaftey: response.verifySaftey || response.VerifySaftey || '',
      containerComments: response.containerComments || response.ContainerComments || '',
      environmentComments: response.environmentComments || response.EnvironmentComments || '',
      batVoltage: response.batteryVoltage || response.BatteryVoltage || 0,
      plusTerminal: response.plusTerminalToGround || response.PlusTerminalToGround || 0,
      minusTerminal: response.minusTerminalToGround || response.MinusTerminalToGround || 0,
      dcCharging: response.dcChargingCurrent || response.DCChargingCurrent || 0,
      acRipple: response.acRipple || response.ACRipple || 0,
      acRippleCurrent: response.acRippleCurrent || response.ACRippleCurrent || 0,
      batVoltatePf: response.voltageStatus || response.VoltageStatus || response.batVoltage_PF || response.BatVoltage_PF || '',
      plusTerminalPf: response.plusTermStatus || response.PlusTermStatus || response.plusTerminal_PF || response.PlusTerminal_PF || '',
      minusTerminalPf: response.minusTermStatus || response.MinusTermStatus || response.minusTerminal_PF || response.MinusTerminal_PF || '',
      dcChargingPf: response.dcChargingStatus || response.DCChargingStatus || response.dcCharging_PF || response.DCCharging_PF || '',
      acRipplePf: response.acRippleStatus || response.ACRippleStatus || response.acRipple_PF || response.ACRipple_PF || '',
      acRippleCurrentPf: response.acRippleCurrentStatus || response.ACRippleCurrentStatus || '',
      resistancePf: response.interCellStatus || response.InterCellStatus || response.resistance_PF || response.Resistance_PF || '',
      codeTorquePf: response.torqueStatus || response.TorqueStatus || response.codeTorque_PF || response.CodeTorque_PF || '',
      comment: response.comment || response.Comment || '',
      plusWrappedPf: response.plusWrapped_PF || response.PlusWrapped_PF || '',
      plusWrappedCheck: response.plusWrapped_Check || response.PlusWrapped_Check || false,
      plusSulfatedCheck: response.plusSulfated_Check || response.PlusSulfated_Check || false,
      plusMisPosCheck: response.plusMisPos_Check || response.PlusMisPos_Check || false,
      missingCheck: response.missing_Check || response.Missing_Check || false,
      missingPf: response.missing_PF || response.Missing_PF || '',
      brokenCheck: response.broken_Check || response.Broken_Check || false,
      needsCleaningCheck: response.needsCleaning_Check || response.NeedsCleaning_Check || false,
      platesComments: response.platesComments || response.PlatesComments || '',
      waterLevelV: response.waterLevel_T || response.WaterLevel_T || '',
      waterLevelPf: response.waterLevel_PF || response.WaterLevel_PF || '',
      readingType: response.readingType || response.ReadingType || '',
      stringType: response.stringType || response.StringType || '',
      electrolytesComments: response.electrolytesComments || response.ElectrolytesComments || '',
      batteryTempPf: response.batteryTemp_PF || response.BatteryTemp_PF || '',
      roomTemp: response.roomTemp || response.RoomTemp || response.temp || response.Temp || 0,
      battTemp: response.battTemp || response.BattTemp || 0,
      battTempPf: response.battTemp_PF || response.BattTemp_PF || '',
      quantityUsed: response.quantity_Used || response.Quantity_Used || 0,
      quantityNeeded: response.tobeMonitored || response.TobeMonitored || response.quantity_Needed || response.Quantity_Needed || 0,
      reasonReplace: response.reason_Replace || response.Reason_Replace || '',
      floatVoltS: response.floatVoltS || response.FloatVoltS || '',
      floatVoltV: response.floatVoltV || response.FloatVoltV || '',
      intercellConnector: response.intercellConnector || response.IntercellConnector || '',
      replaceWholeString: response.replaceWholeString || response.ReplaceWholeString || false,
      chckmVac: response.chkmVAC || response.ChkmVAC || false,
      chkStrap: response.chkStrap || response.ChkStrap || false,
      maintAuthId: response.maint_Auth_Id || response.Maint_Auth_Id || '',
      repMonCalc: response.repMonCalc || response.RepMonCalc || '',
      batteryPackCount: response.batteryPackCount || response.BatteryPackCount || 0,
      indBattDisconnect: response.indBattDisconnect || response.IndBattDisconnect || '',
      indBattInterConn: response.indBattInterConn || response.IndBattInterConn || '',
      rackIntegrity: response.rackIntegrity || response.RackIntegrity || '',
      ventFanOperation: response.vfOperation || response.VFOperation || '',
      ddlBattTerminal: (response.battTerminalS || response.BattTerminalS || '').toString().trim(),
      ddlBattTypeTerminal: (response.battTypeTerminal || response.BattTypeTerminal || '').toString().trim(),
      txtBattTerminal: (response.battTerminalT || response.BattTerminalT || '').toString().trim(),
      readingMethod: response.readingMethod || response.ReadingMethod || '',
      chkGraph: response.chkGraph || response.ChkGraph || false,
      saveAsDraft: response.saveAsDraft || response.SaveAsDraft || false,
      
      // Additional fields from backend API
      message: response.message || response.Message || '',
      code: response.code || response.Code || null,
      resistance: response.resistance || response.Resistance || null,
      codeTorque: response.codeTorque || response.CodeTorque || null,
      negWrappedCheck: response.negWrapped_Check || response.NegWrapped_Check || null,
      negWrappedPf: response.negWrapped_PF || response.NegWrapped_PF || '',
      negSulfatedCheck: response.negSulfated_Check || response.NegSulfated_Check || null,
      negMisPosCheck: response.negMisPos_Check || response.NegMisPos_Check || null,
      bothActMatPf: response.bothActMat_PF || response.BothActMat_PF || '',
      bothActMatCheck: response.bothActMat_Check || response.BothActMat_Check || null,
      actPosMatCheck: response.actPosMat_Check || response.ActPosMat_Check || null,
      otherCheck: response.other_Check || response.Other_Check || null,
      sedimentsComments: response.sedimentsComments || response.SedimentsComments || '',
      missingCoversCheck: response.missingCovers_Check || response.MissingCovers_Check || null,
      missingCoversPf: response.missingCovers_PF || response.MissingCovers_PF || '',
      brokenCoversCheck: response.brokenCovers_Check || response.BrokenCovers_Check || null,
      needsCleaningCoversCheck: response.needsCleaningCovers_Check || response.NeedsCleaningCovers_Check || null,
      missingSepCheck: response.missingSep_Check || response.MissingSep_Check || null,
      missingSepPf: response.missingSep_PF || response.MissingSep_PF || '',
      quartBelowCheck: response.quartBelow_Check || response.QuartBelow_Check || null,
      quartBelowPf: response.quartBelow_PF || response.QuartBelow_PF || '',
      halfBelowCheck: response.halfBelow_Check || response.HalfBelow_Check || null,
      halfBelowPf: response.halfBelow_PF || response.HalfBelow_PF || '',
      thrbyFourBelowCheck: response.thrbyFourBelow_Check || response.ThrbyFourBelow_Check || null,
      thrbyFourBelowPf: response.thrbyFourBelow_PF || response.ThrbyFourBelow_PF || '',
      waterFillYn: response.waterFill_YN || response.WaterFill_YN || '',
      sepComments: response.sepComments || response.SepComments || '',
      immedActionOpen: response.immedActionOpen || response.ImmedActionOpen || '',
      upgradeNoOpenAge: response.upgradeNoOpenAge || response.UpgradeNoOpenAge || '',
      upgradeNoOpen: response.upgradeNoOpen || response.UpgradeNoOpen || '',
      positivePost: response.positivePost || response.PositivePost || '',
      negativePost: response.negativePost || response.NegativePost || '',
      postSeals: response.postSeals || response.PostSeals || '',
      batteryDisc: response.batteryDisc || response.BatteryDisc || '',
      miscHardware: response.miscHardware || response.MiscHardware || '',
      sealsComments: response.sealsComments || response.SealsComments || '',
      hardwareComments: response.hardwareComments || response.HardwareComments || '',
      manufDatePf: response.manufDate_PF || response.ManufDate_PF || '',
      manufDate: response.manufDate || response.ManufDate || '',
      battProActiveReplace: response.battProActiveReplace || response.BattProActiveReplace || '',
    };
  }

  /**
   * Map EquipReconciliationInfo from frontend (camelCase) to backend API format (PascalCase)
   */
  private mapEquipReconciliationInfoToApi(info: EquipReconciliationInfo): any {
    return {
      CallNbr: info.callNbr,
      EquipId: info.equipId,
      Make: info.make,
      MakeCorrect: info.makeCorrect,
      ActMake: info.actMake,
      Model: info.model,
      ModelCorrect: info.modelCorrect,
      ActModel: info.actModel,
      SerialNo: info.serialNo,
      SerialNoCorrect: info.serialNoCorrect,
      ActSerialNo: info.actSerialNo,
      AscStringsNo: info.ascStringsNo,
      AscStringsCorrect: info.ascStringsCorrect,
      ActAscStringNo: info.actAscStringNo,
      BattPerString: info.battPerString,
      BattPerStringCorrect: info.battPerStringCorrect,
      ActBattPerString: info.actBattPerString,
      TotalEquips: info.totalEquips,
      TotalEquipsCorrect: info.totalEquipsCorrect,
      ActTotalEquips: info.actTotalEquips,
      Kva: info.kva,
      KvaCorrect: info.kvaCorrect,
      ActKva: info.actKva,
      Verified: info.verified,
      ModifiedBy: info.modifiedBy,
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
      // Handle both actKva (model) and actKVA (API response) property names
      actKva: response.actKVA || response.actKva || '',
      verified: response.verified || false,
      modifiedBy: response.modifiedBy || response.ModifiedBy || '',
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
      milliohms: item.milliohms || 0, // API returns milliohms
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
