import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, timeout, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { EquipmentDetail, UploadInfo, UploadResponse, EquipmentImage, EquipmentImageUpload, DeleteEquipmentImage } from '../model/equipment-details.model';
import { AAETechUPS, EquipReconciliationInfo, UpdateEquipStatus, EquipFilterCurrents, SaveUpdateaaETechUPSDto, SaveUpdateUPSResponse } from '../model/ups-readings.model';
import { EditEquipmentInfo, EquipBoardDetail, UpdateEquipmentRequest, UpdateEquipmentResponse, UpdateEquipBoardInfoRequest } from '../model/edit-equipment.model';
import { JobSummarySampleRequest, JobSummarySampleResponse } from '../model/job-summary-sample.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EquipmentService {
  private apiUrl = environment.apiUrl || 'https://localhost:7115/api';

  constructor(private http: HttpClient) {}

  /**
   * Get equipment information for a job
   * Equivalent to da.GetEquipInfo(CallNbr) in legacy code
   */
  getEquipmentInfo(callNbr: string): Observable<EquipmentDetail[]> {
    return this.http.get<EquipmentDetail[]>(`${this.apiUrl}/EquipmentDetails/GetEquipmentDetails?callNbr=${callNbr}`);
  }

  /**
   * Edit equipment info for UPS readings
   * Equivalent to da.EditEquipInfo(CallNbr, EquipID) in legacy code
   */
  editEquipInfo(callNbr: string, equipId: number): Observable<any> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString());
    
    return this.http.get<any>(`${this.apiUrl}/EquipmentDetails/EditEquipInfo`, { params });
  }

  /**
   * Get upload information for a job
   * Equivalent to da.GetUploadedInfo(CallNbr, TechID) in legacy code
   */
  getUploadInfo(callNbr: string, techId: string): Observable<UploadInfo[]> {
  const params = new HttpParams()
    .set('callNbr', callNbr)
    .set('techId', techId);

  return this.http.get<any[]>(`${this.apiUrl}/EquipmentDetails/uploaded-info`, { params }).pipe(
    map((data: any[]) => {
      const mappedData = (data || []).map((item, index) => {
        const rawDate = item.uploadJobDt || item.uploadedJobDt || item.UploadJobDt || '';
        const mapped = {
          UploadedBy: item.uploadedBy || item.UploadedBy || '',
          UploadJobDt: rawDate ? new Date(rawDate) : null,
          Type: item.type || item.Type || ''
        };
        return mapped;
      });
      return mappedData;
    }),
    catchError((error: any) => {
      throw error;
    })
  );
}
  /**
   * Get button states for upload functionality
   * Equivalent to ProtectUploadingJobandExpenses() in legacy code
   */
  getButtonStates(callNbr: string, techId: string): Observable<{
    uploadJobEnabled: boolean;
    uploadExpenseVisible: boolean;
    uploadExpenseEnabled: boolean;
    enableExpenseVisible: boolean;
  }> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('techId', techId);
    
    return this.http.get<{
      uploadJobEnabled: boolean;
      uploadExpenseVisible: boolean;
      uploadExpenseEnabled: boolean;
      enableExpenseVisible: boolean;
    }>(`${this.apiUrl}/equipment/button-states`, { params });
  }

  /**
   * Get manufacturer names for dropdown
   * Equivalent to da.GetManufNames(ref ddlmanufacturer) in legacy code
   */
  getManufacturerNames(): Observable<any[]> {
    
    return this.http.get<any>(`${this.apiUrl}/EquipmentDetails/GetManufacturerNames`)
      .pipe(
        map((response: any) => {
          
          // Handle different response formats
          let manufacturers: any[] = [];
          
          if (Array.isArray(response)) {
            // Direct array response
            manufacturers = response;
          } else if (response && response.data && Array.isArray(response.data)) {
            // Wrapped in data property
            manufacturers = response.data;
          } else if (response && response.manufacturers && Array.isArray(response.manufacturers)) {
            // Wrapped in manufacturers property
            manufacturers = response.manufacturers;
          } else if (response && response.Tables && Array.isArray(response.Tables) && response.Tables[0] && response.Tables[0].Rows) {
            // DataSet format with Tables and Rows
            manufacturers = response.Tables[0].Rows;
          } else if (response && typeof response === 'object') {
            // Single object, convert to array
            manufacturers = [response];
          }
          
          // Ensure proper format with value and text properties
          const formattedManufacturers = manufacturers.map((item: any) => {
            if (typeof item === 'string') {
              return { value: item, text: item };
            } else if (item && typeof item === 'object') {
              // Handle various property names that might contain manufacturer data
              const manufacturerValue = item.value || item.Value || item.name || item.Name || 
                                      item.manufacturer || item.Manufacturer || item.ManufacturerName ||
                                      item.manufacturerName || item.MANUFACTURER || item.text || item.Text ||
                                      item.ManufacturerID || item.ManufName || item.mfg || item.MFG || '';
              
              const manufacturerText = item.text || item.Text || item.name || item.Name || 
                                     item.manufacturer || item.Manufacturer || item.ManufacturerName ||
                                     item.manufacturerName || item.MANUFACTURER || item.value || item.Value ||
                                     item.ManufName || item.mfg || item.MFG || manufacturerValue || '';
              
              return {
                value: manufacturerValue.toString(),
                text: manufacturerText.toString()
              };
            }
            return { value: '', text: '' };
          }).filter(item => item.value && item.text);
          
          // If we still don't have any manufacturers, return the comprehensive fallback list
          if (formattedManufacturers.length === 0) {
            return this.getComprehensiveManufacturerList();
          }
          
          return formattedManufacturers;
        }),
        catchError((error) => {
          
          return of(this.getComprehensiveManufacturerList());
        })
      );
  }

  /**
   * Get comprehensive manufacturer list as fallback
   * Based on the actual options from the legacy system
   */
  private getComprehensiveManufacturerList(): any[] {
    return [
      { value: '*APC', text: '*APC' },
      { value: '*CSB', text: '*CSB' },
      { value: '*DATA SAFE', text: '*DATA SAFE' },
      { value: '*EATON', text: '*EATON' },
      { value: '*LIEBERT', text: '*LIEBERT' },
      { value: '*MGE', text: '*MGE' },
      { value: '*MITSUBISHI', text: '*MITSUBISHI' },
      { value: '*POWERSAFE', text: '*POWERSAFE' },
      { value: '*POWERWARE', text: '*POWERWARE' },
      { value: '*SCHNEIDER', text: '*SCHNEIDER' },
      { value: '*TOSHIBA', text: '*TOSHIBA' },
      { value: '*TRIPPLITE', text: '*TRIPPLITE' },
      { value: 'ABB', text: 'ABB' },
      { value: 'APC', text: 'American Power Conversion' },
      { value: 'ASCO', text: 'ASCO' },
      { value: 'BEST POWER', text: 'BEST POWER' },
      { value: 'C&D', text: 'C&D' },
      { value: 'CATERPILLAR', text: 'Caterpillar' },
      { value: 'CHLORIDE', text: 'Chloride' },
      { value: 'CLARY', text: 'Clary' },
      { value: 'CSB', text: 'CSB' },
      { value: 'CUMMINS', text: 'Cummins' },
      { value: 'CUTLER HAMMER', text: 'Cutler Hammer' },
      { value: 'CYBEREX', text: 'Cyberex' },
      { value: 'CyberPower', text: 'CyberPower' },
      { value: 'Data Safe', text: 'Data Safe' },
      { value: 'DATASAFE', text: 'DATASAFE' },
      { value: 'DEKA', text: 'Deka' },
      { value: 'Delta', text: 'Delta' },
      { value: 'DELTEC', text: 'Deltec' },
      { value: 'DUAL LITE', text: 'DUAL LITE' },
      { value: 'DYNASTY', text: 'Dynasty' },
      { value: 'EAST PENN', text: 'EAST PENN' },
      { value: 'Eaton', text: 'Eaton' },
      { value: 'ELGAR', text: 'Elgar' },
      { value: 'Eltek', text: 'Eltek' },
      { value: 'EMERSON', text: 'Emerson' },
      { value: 'ENERSYS', text: 'Enersys' },
      { value: 'EXIDE', text: 'Exide' },
      { value: 'FERRUPS', text: 'FERRUPS' },
      { value: 'FIAMM', text: 'Fiamm' },
      { value: 'FULLRIVER', text: 'FULLRIVER' },
      { value: 'GAMATRONIC', text: 'Gamatronic UPS' },
      { value: 'GE', text: 'GE' },
      { value: 'Genesis', text: 'Genesis' },
      { value: 'GNB', text: 'GNB' },
      { value: 'HAWKER', text: 'Hawker Powersafe' },
      { value: 'HAZE', text: 'HAZE' },
      { value: 'INTERSTATE', text: 'Interstate' },
      { value: 'JOHNSON', text: 'Johnson Controls' },
      { value: 'KOHLER', text: 'Kohler' },
      { value: 'LAMARCHE', text: 'Lamarche' },
      { value: 'LEOCH', text: 'LEOCH' },
      { value: 'LIEBERT', text: 'LIEBERT' },
      { value: 'LINEAGE POWER', text: 'LINEAGE POWER' },
      { value: 'LITHONIA', text: 'Lithonia' },
      { value: 'LONG', text: 'LONG' },
      { value: 'MAGNETEK', text: 'MAGNETEK' },
      { value: 'MARATHON', text: 'Marathon' },
      { value: 'MGE', text: 'MGE' },
      { value: 'Minuteman', text: 'Minuteman' },
      { value: 'MITSUBISHI', text: 'Mitsubishi' },
      { value: 'MK', text: 'MK' },
      { value: 'NARADA', text: 'NARADA' },
      { value: 'NEWMAR', text: 'NEWMAR' },
      { value: 'NORTEL', text: 'Nortel' },
      { value: 'NPP', text: 'NPP' },
      { value: 'ONAN', text: 'Onan' },
      { value: 'ONEAC', text: 'ONEAC' },
      { value: 'PANASONIC', text: 'Panasonic' },
      { value: 'PECO', text: 'PECO' },
      { value: 'PILLER', text: 'PILLER' },
      { value: 'PORTALAC', text: 'Portalac' },
      { value: 'POWER SONIC', text: 'POWER SONIC' },
      { value: 'POWERSAFE', text: 'POWERSAFE' },
      { value: 'POWERSONIC', text: 'Powersonic Corporation' },
      { value: 'POWERVAR', text: 'POWERVAR' },
      { value: 'POWERWARE', text: 'POWERWARE' },
      { value: 'Riello', text: 'Riello' },
      { value: 'RITAR', text: 'RITAR' },
      { value: 'Saft', text: 'Saft' },
      { value: 'Samsung', text: 'Samsung' },
      { value: 'SBS Battery', text: 'SBS Battery' },
      { value: 'SCHNEIDER', text: 'SCHNEIDER' },
      { value: 'SIEMENS', text: 'Siemens' },
      { value: 'SOLA', text: 'Sola' },
      { value: 'Socomec', text: 'Socomec' },
      { value: 'SQUARE D', text: 'Square D' },
      { value: 'Staco', text: 'Staco' },
      { value: 'Sure-Lite', text: 'Sure-Lite' },
      { value: 'TOPAZ', text: 'Topaz' },
      { value: 'TOSHIBA', text: 'Toshiba' },
      { value: 'TRIPP LITE', text: 'TRIPP LITE' },
      { value: 'TRIPPLITE', text: 'TrippLite' },
      { value: 'TROJAN', text: 'Trojan' },
      { value: 'UNIGY', text: 'UNIGY' },
      { value: 'UNIVERSAL', text: 'Universal' },
      { value: 'Vertiv', text: 'Vertiv' },
      { value: 'VISION', text: 'VISION' },
      { value: 'VYCON', text: 'VYCON' },
      { value: 'Yuasa', text: 'Yuasa' }
    ];
  }

  /**
   * Get UPS types for dropdown
   * Returns predefined UPS types matching legacy system
   */
  getUPSTypes(): Observable<{ value: string; text: string }[]> {
    const upsTypes = [
      { value: 'NO', text: 'Normal UPS' },
      { value: 'YS', text: 'Modular UPS' },
      { value: 'LC', text: 'Longer Caps Life UPS(10 Yrs)' },
      { value: 'LT', text: 'Longer Caps Life UPS(15 Yrs)' }
    ];
    return of(upsTypes);
  }

  /**
   * Get maintenance bypass types for dropdown
   * Returns predefined maintenance bypass options matching legacy system
   */
  getMaintenanceBypassTypes(): Observable<{ value: string; text: string }[]> {
    const bypassTypes = [
      { value: 'NA', text: 'None' },
      { value: 'EM', text: 'External Make Before Break' },
      { value: 'EB', text: 'External Break Before Make' },
      { value: 'IB', text: 'Internal Bypass ONLY' },
      { value: 'IR', text: 'Internal Rotary/ Maintenance Bypass ONLY' }
    ];
    return of(bypassTypes);
  }

  /**
   * Get multi-module types for dropdown
   * Returns predefined multi-module options matching legacy system
   */
  getMultiModuleTypes(): Observable<{ value: string; text: string }[]> {
    const multiModuleTypes = [
      { value: 'Select', text: 'Select' },
      { value: 'N1', text: 'N + 1' },
      { value: 'N2', text: 'N + 2' },
      { value: 'N3', text: 'N + 3' },
      { value: 'N4', text: 'N + 4' },
      { value: 'N5', text: 'N + 5' },
      { value: 'N6', text: 'N + 6' },
      { value: 'NA', text: 'N/A' }
    ];
    return of(multiModuleTypes);
  }

  /**
   * Get equipment status options for dropdown
   * Calls the backend GetStatusDescription endpoint for dynamic status options
   */
  getEquipmentStatusOptions(): Observable<{ value: string; text: string }[]> {
    const params = new HttpParams().set('equipType', 'UPS');
    const upsApiUrl = `${this.apiUrl}/EquipmentDetails/GetStatusDescription`;
    
    return this.http.get<any[]>(upsApiUrl, { params }).pipe(
      map(response => {
        if (response && Array.isArray(response) && response.length > 0) {
          const mappedOptions = response
            .filter(item => item && (item.StatusType || item.statusType))
            .map(item => {
              const statusType = item.StatusType || item.statusType || '';
              const statusDescription = item.StatusDescription || item.statusDescription || statusType;
              
              return {
                value: statusType,
                text: statusDescription
              };
            })
            .filter((option, index, self) => 
              self.findIndex(o => o.value === option.value) === index
            );
          
          if (mappedOptions.length > 0) {
            return mappedOptions;
          }
        }
        
        return this.getFallbackStatusOptions();
      }),
      catchError(() => {
        return of(this.getFallbackStatusOptions());
      })
    );
  }

  /**
   * Get fallback status options when API fails or returns invalid data
   */
  private getFallbackStatusOptions(): { value: string; text: string }[] {
    return [
      { value: 'Online', text: 'On-Line' },
      { value: 'CriticalDeficiency', text: 'Critical Deficiency' },
      { value: 'ReplacementRecommended', text: 'Replacement Recommended' },
      { value: 'ProactiveReplacement', text: 'Proactive Replacement' },
      { value: 'OnLine(MajorDeficiency)', text: 'On-Line(Major Deficiency)' },
      { value: 'OnLine(MinorDeficiency)', text: 'On-Line(Minor Deficiency)' },
      { value: 'Offline', text: 'Off-Line' }
    ];
  }



  /**
   * Get UPS readings data
   * Equivalent to da.GetaaETechUPS(AEU, ref ErrMsg) in legacy code
   */
  getUPSReadings(callNbr: string, equipId: number, upsId: string): Observable<any> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString())
      .set('upsId', upsId);
    
    return this.http.get<any>(`${this.apiUrl}/EquipmentDetails/GetUPSReadings`, { params });
  }

  /**
   * Save or update UPS readings data
   * Equivalent to da.SaveUpdateaaETechUPS(AEU, ref ErrMsg) in legacy code
   */
  saveUpdateUPSReadings(upsData: any): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/UPSReadings/SaveUpdateUPSReadings`, upsData);
  }

  /**
   * Save or update UPS data using the comprehensive DTO and new API endpoint
   * Uses the SaveUpdateaaETechUPS stored procedure with all UPS parameters
   * @param upsData - Complete UPS data matching SaveUpdateaaETechUPSDto interface
   * @returns Observable with success status, message, and metadata
   */
  saveUpdateaaETechUPS(upsData: SaveUpdateaaETechUPSDto): Observable<SaveUpdateUPSResponse> {
    return this.http.post<SaveUpdateUPSResponse>(`${this.apiUrl}/EquipmentDetails/SaveUpdateaaETechUPS`, upsData);
  }

  /**
   * Get equipment reconciliation info
   * Equivalent to dl.GetEquipReconciliationInfo(ARI, ref ErrMsg) in legacy code
   */
  getEquipReconciliationInfo(callNbr: string, equipId: number): Observable<any> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString());

    return this.http.get<any>(`${this.apiUrl}/EquipmentDetails/GetEquipReconciliationInfo`, { params })
      .pipe(
        map((response) => {
          // Clean up string fields that may have trailing spaces from database
          if (response) {
            const cleanedResponse = { ...response };
            const stringFields = ['make', 'model', 'serialNo', 'kva', 'actMake', 'actModel', 'actSerialNo', 'actKVA'];
            const verificationFields = ['makeCorrect', 'modelCorrect', 'serialNoCorrect', 'kvaCorrect', 'totalEquipsCorrect', 'ascStringsCorrect', 'battPerStringCorrect'];
            
            // Clean regular string fields
            stringFields.forEach(field => {
              if (cleanedResponse[field]) {
                cleanedResponse[field] = cleanedResponse[field].toString().trim();
              }
            });
            
            // Clean verification fields
            verificationFields.forEach(field => {
              if (cleanedResponse[field]) {
                cleanedResponse[field] = cleanedResponse[field].toString().trim();
              }
            });
            
            return cleanedResponse;
          }
          
          return response;
        }),
        catchError((error) => {
          return throwError(() => error);
        })
      );
  }

  /**
   * Save equipment reconciliation info
   * Uses the SaveUpdateEquipReconciliation API endpoint with correct DTO structure
   */
  saveEquipReconciliationInfo(reconciliationData: any): Observable<{ success: boolean; message: string; rowsAffected?: number; callNbr?: string; equipId?: number }> {
    return this.http.post<{ success: boolean; message: string; rowsAffected?: number; callNbr?: string; equipId?: number }>(`${this.apiUrl}/EquipmentDetails/SaveUpdateEquipReconciliation`, reconciliationData);
  }

  /**
   * Update equipment status
   * Equivalent to da.UpdateEquipStatus(UES) in legacy code
   * Uses the new UpdateEquipStatus API endpoint with PUT method
   */
  updateEquipStatus(statusData: UpdateEquipStatus): Observable<{ success: boolean; message: string; rowsAffected?: number; callNbr?: string; equipId?: number; status?: string }> {
    return this.http.put<{ success: boolean; message: string; rowsAffected?: number; callNbr?: string; equipId?: number; status?: string }>(`${this.apiUrl}/EquipmentDetails/UpdateEquipStatus`, statusData);
  }

  /**
   * Get job summary report for equipment status calculation
   * Equivalent to da.JobSummaryReport(CallNbr, EquipID, "UPS", "Y") in legacy code
   */
  getJobSummaryReport(callNbr: string, equipId: number, equipType: string): Observable<any> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString())
      .set('equipType', equipType)
      .set('scheduled', 'Y');
    
    return this.http.get<any>(`${this.apiUrl}/EquipmentDetails/GetJobSummarySample`, { params });
  }

  /**
   * Get status description for equipment
   * Equivalent to da.GetStatusDescription("UPS") in legacy code
   */
  getStatusDescription(equipType: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/EquipmentDetails/GetStatusDescription?equipType=${equipType}`);
  }



  /**
   * Upload job to GP
   * Equivalent to da.UploadJobToGP(CallNbr, TechID, ref ErrMsg) in legacy code
   */
  uploadJob(callNbr: string, techId: string, techName: string): Observable<UploadResponse> {
    const body = {
      callNbr,
      techId,
      techName
    };
    
    return this.http.post<UploadResponse>(`${this.apiUrl}/EquipmentDetails/upload-job`, body);
  }

  /**
   * Upload expenses to GP
   * Equivalent to da.UploadExpensesToGP(CallNbr, da.getUID(), ref ErrMsg) in legacy code
   */
  uploadExpenses(callNbr: string, techName: string): Observable<UploadResponse> {
    const body = {
      callNbr,
      techName
    };
    
    return this.http.post<UploadResponse>(`${this.apiUrl}/EquipmentDetails/upload-expenses`, body);
  }

  /**
   * Enable expenses upload
   * Equivalent to da.EnableUpload(CallNbr, ref result) in legacy code
   */
  enableExpenses(callNbr: string): Observable<UploadResponse> {
    const body = { callNbr };
    
    return this.http.post<UploadResponse>(`${this.apiUrl}/EtechExpense/EnableExpenses`, body);
  }

  /**
   * Validate pre-job safety completion
   * Equivalent to da.IsPreJobSafetyDone(CallNbr.Trim()) in legacy code
   */
  validatePreJobSafety(callNbr: string): Observable<{ isCompleted: boolean; message?: string }> {
    return this.http.get<{ isCompleted: boolean; message?: string }>(`${this.apiUrl}/PreJobSafetyListInfo/IsPreJobSafetyDone?callNbr=${callNbr}`);
  }

  /**
   * Check if parts are returned by tech
   * Equivalent to da.IsPartsReturnedbyTech(CallNbr.Trim()) in legacy code
   * API returns: { isReturned: boolean, message: string }
   */
  validatePartsReturned(callNbr: string): Observable<{ isReturned: boolean; message: string }> {
    return this.http.get<{ isReturned: boolean; message: string }>(`${this.apiUrl}/EquipmentDetails/ValidatePartsReturned/?callNbr=${callNbr}`);
  }

  /**
   * Check for duplicate hours/expenses
   * Equivalent to da.CheckDuplicateHours(CallNbr, TechName) in legacy code
   * API returns: { hasDuplicates: boolean, message: string }
   */
  checkDuplicateHours(callNbr: string, techName: string): Observable<{ hasDuplicates: boolean; message: string }> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('techName', techName);

    return this.http.get<{ hasDuplicates: boolean; message: string }>(`${this.apiUrl}/EquipmentDetails/CheckDuplicateHours`, { params });
  }

  /**
   * Validate expense upload requirements
   * Equivalent to da.ValidateExpenseUpload(CallNbr) in legacy code
   * Returns: string - "Success" means valid, other values are error messages
   */
  validateExpenseUpload(callNbr: string): Observable<string> {
    return this.http.get(`${this.apiUrl}/EquipmentDetails/ValidateExpenseUpload/?callNbr=${callNbr}`, { responseType: 'text' });
  }

  /**
   * Get PM visual notes
   * Equivalent to da.GetPMVisualNotes(CallNbr, TechName) in legacy code
   * API returns: IEnumerable<etechNotesDto>
   */
  getPMVisualNotes(callNbr: string, techName: string): Observable<any[]> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('techName', techName);
    
    return this.http.get<any[]>(`${this.apiUrl}/EquipmentDetails/GetPMVisualNotes`, { params });
  }

  /**
   * Check readings existence for equipment
   * Equivalent to da.ReadingsExist(CallNbr.Trim(), equipID, equipType) in legacy code
   * API returns: { exists: boolean }
   */
  checkReadingsExist(callNbr: string, equipId: number, equipType: string): Observable<{ exists: boolean }> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString())
      .set('equipType', equipType);
    
    return this.http.get<{ exists: boolean }>(`${this.apiUrl}/EquipmentDetails/CheckReadingsExist`, { params });
  }

  /**
   * Check caps parts info for UPS equipment
   * Equivalent to da.CheckCapsPartsInfo(CallNbr.Trim(), equipID) in legacy code
   * API returns: { hasInfo: boolean }
   */
  checkCapsPartsInfo(callNbr: string, equipId: number): Observable<{ hasInfo: boolean }> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString());
    
    return this.http.get<{ hasInfo: boolean }>(`${this.apiUrl}/EquipmentDetails/CheckCapsPartsInfo`, { params });
  }

  /**
   * Check save as draft status
   * Equivalent to da.CheckSaveAsDraft(CallNbr, SaveAsDraft) in legacy code
   * API returns: string directly (message)
   */
  checkSaveAsDraft(callNbr: string): Observable<string> {
    return this.http.get(`${this.apiUrl}/EquipmentDetails/CheckSaveAsDraft/?callNbr=${callNbr}`, { responseType: 'text' });
  }

  /**
   * Check if job is in draft mode and uploads should be restricted
   * Returns an observable that resolves to an object with isDraft boolean and optional message
   */
  checkDraftModeForUploads(callNbr: string): Observable<{ isDraft: boolean; message?: string }> {
    return this.checkSaveAsDraft(callNbr).pipe(
      map(result => {
        const trimmedResult = result ? result.trim() : '';
        const isDraft = trimmedResult !== '';
        return {
          isDraft,
          message: isDraft ? trimmedResult : undefined
        };
      }),
      catchError(error => {
        // Return false for draft mode if API fails to allow uploads
        return of({ isDraft: false, message: 'Unable to verify draft status' });
      })
    );
  }

  /**
   * Get equipment images for a specific equipment
   * Equivalent to da.GetEquipmentImages(EquipID, 0) in legacy code
   * Backend now returns: { data: EquipmentImage[] }
   */
  getEquipmentImages(equipId: number, imgId: number = 0): Observable<EquipmentImage[]> {
    const params = new HttpParams()
      .set('equipId', equipId.toString());
    
    // Backend returns { data: EquipmentImage[] }, so we need to map to extract the data property
    return this.http.get<{ data: EquipmentImage[] }>(`${this.apiUrl}/EquipmentDetails/GetEquipmentImages`, { params })
      .pipe(
        map((response: { data: EquipmentImage[] }) => response.data || [])
      );
  }

  /**
   * Upload an equipment image
   * Equivalent to da.SaveEquipmentImages(EQI) in legacy code
   * Updated to match new controller with explicit [FromForm] parameters
   */
  uploadEquipmentImage(imageData: EquipmentImageUpload): Observable<{ success: boolean; message: string; rowsAffected?: number }> {
    const formData = new FormData();
    
    // Add form fields with exact parameter names matching the controller
    formData.append('CallNbr', imageData.callNbr || '');
    formData.append('EquipID', imageData.equipID.toString());
    formData.append('EquipNo', imageData.equipNo || '');
    formData.append('TechName', imageData.techName || '');
    formData.append('TechID', imageData.techID || '');
    formData.append('Img_Title', imageData.img_Title || '');
    formData.append('Img_Type', imageData.img_Type || '');
    formData.append('ImgFile', imageData.imgFile); // File field - matches controller parameter

    return this.http.post<{ success: boolean; message: string; rowsAffected?: number }>(`${this.apiUrl}/EquipmentDetails/InsertGetEquipmentImages`, formData);
  }

  /**
   * Delete an equipment image
   * Equivalent to da.DeleteEquipmentImage(imgId) in legacy code
   */
  deleteEquipmentImage(imgId: number): Observable<{ success: boolean; message?: string; rowsAffected?: number }> {
    // Try path parameter approach first
    const pathUrl = `${this.apiUrl}/EquipmentDetails/DeleteEquipmentImage/${imgId}`;
    
    // Alternative: query parameter approach
    const queryUrl = `${this.apiUrl}/EquipmentDetails/DeleteEquipmentImage?imgId=${imgId}`;
    
    // Use query parameter approach (more reliable)
    return this.http.delete<{ success: boolean; message?: string; rowsAffected?: number }>(queryUrl);
  }

  // ========== EDIT EQUIPMENT METHODS ==========

  /**
   * Get equipment details for editing
   * Matches your EditEquipInfo API endpoint
   */
  getEditEquipmentInfo(callNbr: string, equipId: number): Observable<EditEquipmentInfo> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString());
    
    return this.http.get<EditEquipmentInfo>(`${this.apiUrl}/EquipmentDetails/EditEquipInfo`, { params });
  }

  /**
   * Get equipment board/assembly details
   * Matches your GetEquipBoardInfo API endpoint
   */
  getEquipBoardInfo(equipNo: string, equipId: number): Observable<EquipBoardDetail[]> {
    const params = new HttpParams()
      .set('equipNo', equipNo)
      .set('equipId', equipId.toString());
    
    return this.http.get<EquipBoardDetail[]>(`${this.apiUrl}/EquipmentDetails/GetEquipBoardInfo`, { params });
  }

  /**
   * Save or update equipment information
   * Matches your spEquipmentInsertUpdate API endpoint
   */
  saveUpdateEquipmentInfo(request: UpdateEquipmentRequest): Observable<{ Message?: string; success?: boolean; rowsAffected?: number; message?: string }> {
    return this.http.post<{ Message?: string; success?: boolean; rowsAffected?: number; message?: string }>(`${this.apiUrl}/EquipmentDetails/spEquipmentInsertUpdate`, request);
  }

  /**
   * Update equipment board information
   * Matches your UpdateEquipBoardInfo API endpoint
   */
  updateEquipBoardInfo(request: UpdateEquipBoardInfoRequest): Observable<{ success: boolean; rowsUpdated: number }> {
    return this.http.post<{ success: boolean; rowsUpdated: number }>(`${this.apiUrl}/EquipmentDetails/UpdateEquipBoardInfo`, request);
  }

  /**
   * Delete equipment
   * Matches your delete API endpoint
   */
  deleteEquipment(callNbr: string, equipId: number, equipNo: string): Observable<{ success: boolean; message?: string; rowsAffected?: number }> {
    const requestBody = {
      callNbr: callNbr,
      equipNo: equipNo,
      equipId: equipId
    };
    
    return this.http.delete<{ success: boolean; message?: string; rowsAffected?: number }>(`${this.apiUrl}/EquipmentDetails/delete`, { body: requestBody });
  }

  // ========== EQUIPMENT FILTER CURRENTS METHODS ==========

  /**
   * Get equipment filter currents data
   * Matches your GetEquipFilterCurrents API endpoint
   */
  getEquipFilterCurrents(callNbr: string, equipId: number): Observable<{ success: boolean; message: string; data?: EquipFilterCurrents }> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString());
    
    return this.http.get<{ success: boolean; message: string; data?: EquipFilterCurrents }>(`${this.apiUrl}/EquipmentDetails/GetEquipFilterCurrents`, { params });
  }

  /**
   * Save or update equipment filter currents data
   * Matches your SaveUpdateEquipFilterCurrents API endpoint
   */
  saveUpdateEquipFilterCurrents(filterCurrentsData: EquipFilterCurrents): Observable<{ success: boolean; message: string; rowsAffected?: number; callNbr?: string; equipId?: number }> {
    return this.http.post<{ success: boolean; message: string; rowsAffected?: number; callNbr?: string; equipId?: number }>(`${this.apiUrl}/EquipmentDetails/SaveUpdateEquipFilterCurrents`, filterCurrentsData);
  }

  // ========== JOB SUMMARY SAMPLE METHODS ==========

  /**
   * Get job summary sample data based on equipment type
   * Equivalent to GetJobSummarySample API endpoint
   * Returns different data structures based on equipment type:
   * - BATTERY: Returns structured BatteryString and BatteryDetails data
   * - Other types: Returns dynamic data based on equipment-specific tables
   */
  getJobSummarySample(request: JobSummarySampleRequest): Observable<{ success: boolean; message: string; data?: JobSummarySampleResponse }> {
    const params = new HttpParams()
      .set('callNbr', request.callNbr)
      .set('equipId', request.equipId.toString())
      .set('equipType', request.equipType)
      .set('scheduled', request.scheduled);
    
    return this.http.get<{ success: boolean; message: string; data?: JobSummarySampleResponse }>(`${this.apiUrl}/EquipmentDetails/GetJobSummarySample`, { params });
  }

}