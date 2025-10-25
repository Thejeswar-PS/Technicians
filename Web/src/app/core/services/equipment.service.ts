import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, timeout } from 'rxjs';
import { map } from 'rxjs/operators';
import { EquipmentDetail, UploadInfo, UploadResponse, EquipmentImage, EquipmentImageUpload, DeleteEquipmentImage } from '../model/equipment-details.model';
import { AAETechUPS, EquipReconciliationInfo, UpdateEquipStatus } from '../model/ups-readings.model';
import { EditEquipmentInfo, EquipBoardDetail, UpdateEquipmentRequest, UpdateEquipmentResponse } from '../model/edit-equipment.model';
import { environment } from 'src/environments/environment';

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
      return (data || []).map((item, index) => {
        // Based on your debug output, the API returns:
        // - uploadJobDt: "2025-10-24T19:02:31.03"
        // - uploadedBy: "Ajay.Sharmal"  
        // - type: "Job"
        const rawDate = item.uploadJobDt || item.uploadedJobDt || item.UploadJobDt || '';
        
        return {
          UploadedBy: item.uploadedBy || item.UploadedBy || '',
          UploadJobDt: rawDate ? new Date(rawDate) : null,
          Type: item.type || item.Type || ''
        };
      });
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
    return this.http.get<any[]>(`${this.apiUrl}/EquipmentDetails/GetManufacturerNames`);
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
   * Get equipment reconciliation info
   * Equivalent to dl.GetEquipReconciliationInfo(ARI, ref ErrMsg) in legacy code
   */
  getEquipReconciliationInfo(callNbr: string, equipId: number): Observable<any> {
    const params = new HttpParams()
      .set('callNbr', callNbr)
      .set('equipId', equipId.toString());

    return this.http.get<any>(`${this.apiUrl}/EquipmentDetails/GetEquipReconciliationInfo`, { params });
  }

  /**
   * Save equipment reconciliation info
   * Equivalent to dl.SaveUpdateEquipReconciliationInfo(ARI, ref ErrMsg) in legacy code
   */
  saveEquipReconciliationInfo(reconciliationData: any): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/UPSReadings/SaveEquipReconciliationInfo`, reconciliationData);
  }

  /**
   * Update equipment status
   * Equivalent to da.UpdateEquipStatus(UES) in legacy code
   */
  updateEquipStatus(statusData: any): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/UPSReadings/UpdateEquipStatus`, statusData);
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
      .set('flag', 'Y');
    
    return this.http.get<any>(`${this.apiUrl}/UPSReadings/GetJobSummaryReport`, { params });
  }

  /**
   * Get status description for equipment
   * Equivalent to da.GetStatusDescription("UPS") in legacy code
   */
  getStatusDescription(equipType: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/UPSReadings/GetStatusDescription?equipType=${equipType}`);
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

}