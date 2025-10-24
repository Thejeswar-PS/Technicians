import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  JobPartsInfoResponse,
  PartsRequest,
  ShippingPart,
  TechPart,
  PartsEquipInfo,
  TechReturnInfo,
  FileAttachment
} from '../model/job-parts.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class JobPartsService {
  private readonly API = environment.apiUrl;
  private readonly headers = new HttpHeaders({ 'Content-Type': 'application/json' });

  constructor(private http: HttpClient) {}

  /**
   * Get job parts information
   * Legacy: GetJobInformation() → da.GetPartsInformation
   */
  getJobPartsInfo(callNbr: string): Observable<JobPartsInfoResponse> {
    return this.http.get<JobPartsInfoResponse>(
      `${this.API}/PartsData/GetJobPartsInfo?callNbr=${encodeURIComponent(callNbr)}`
    );
  }


  /**
   * Get parts request data
   * Legacy: DisplayPartsData() → da.GetPartsData
   */
  getPartsRequests(callNbr: string): Observable<PartsRequest[]> {
  return this.http
    .get<any[]>(`${this.API}/PartsData/GetPartsRequests?callNbr=${encodeURIComponent(callNbr)}`)
    .pipe(
      map(res => res.map(d => ({
        scidInc: d.sciD_Inc,
        serviceCallID: d.service_Call_ID?.trim(),
        partNum: d.part_Num?.trim(),
        dcPartNum: d.dC_Part_Num?.trim(),
        qty: d.qty,
        description: d.description?.trim(),
        location: d.location?.trim(),
        destination: d.destination?.trim(),
        requiredDate: d.required_Date,
        shippingMethod: d.shipping_Method,
        urgent: !!d.urgent,
        backOrder: false,
        techName: d.maint_Auth_ID?.trim()
      } as PartsRequest)))
    );
}


  /**
   * Get shipping parts data
   * Legacy: DisplayShippingPartsData() → da.GetShippingPartsData
   */
  getShippingParts(callNbr: string): Observable<ShippingPart[]> {
  return this.http
    .get<any[]>(`${this.API}/PartsData/GetShippingParts?callNbr=${encodeURIComponent(callNbr)}`)
    .pipe(
      map(res => res.map(d => ({
        scidInc: d.sciD_Inc,
        serviceCallID: d.service_Call_ID,
        partNum: d.part_Num,
        dcPartNum: d.dC_Part_Num,
        qty: d.qty,
        description: d.description?.trim(),
        destination: d.destination?.trim() ?? '',
        shippingCompany: d.shipping_Company?.trim() ?? '',
        trackingNum: d.tracking_Num,
        shipmentType: d.shipment_Type?.trim() ?? '',
        shippingCost: d.shipping_Cost,
        courierCost: d.courier_Cost,
        shipDate: d.ship_Date,
        eta: d.eta,
        shippedFrom: d.shipped_from,
        createDate: d.create_Date,
        lastModified: d.lastModified,
        maintAuthID: d.maint_Auth_ID,
        backOrder: !!d.backOrder
      } as ShippingPart)))
    );
}


  /**
   * Get tech parts data
   * Legacy: DisplayTechPartsData() → da.GetTechPartsData
   */
  getTechParts(callNbr: string): Observable<TechPart[]> {
  return this.http
    .get<any[]>(`${this.API}/PartsData/GetTechParts?callNbr=${encodeURIComponent(callNbr)}`)
    .pipe(
      map(res => res.map(d => ({
        scidInc: d.sciD_INC,
        serviceCallID: d.service_Call_ID,
        partNum: d.parT_NUM,
        dcPartNum: d.dC_PART_NUM,
        totalQty: d.totalQty,
        description: d.description?.trim(),
        partSource: (d.parT_SOURCE ?? d.partSource ?? '').toString().trim() || '75',
        installedParts: d.installedParts,
        unusedParts: d.unusedparts,
        faultyParts: d.faultyparts,
        unusedDesc: d.unuseD_DESC,
        faultyDesc: d.faultY_DESC,
  manufacturer: (d.manufacturer ?? d.manufactureR ?? d.MANUFACTURER ?? '').toString().trim(),
  modelNo: (d.modelNo ?? d.modeL_NO ?? d.MODELNO ?? '').toString().trim(),
        isReceived: this.toBoolean(d.isreceived),
        brandNew: this.toBoolean(d.brandNew ?? d.branD_NEW ?? d.isBrandNew),
        partsLeft: this.toBoolean(d.partsLeft ?? d.isPartsLeft ?? d.parts_left),
        trackingInfo: (d.trackingInfo ?? d.tracking_Info ?? d.trackinginfo ?? '').toString().trim(),
        createDate: d.creatE_DATE,
        lastModified: d.lastmodified,
        maintAuthID: d.lastModifiedBy
      } as TechPart)))
    );
}


  /**
   * Get equipment info
   * Legacy: GetPartsEquipInfo() → da.GetPartsEquipInfo
   */
  getPartsEquipInfo(callNbr: string): Observable<PartsEquipInfo> {
  return this.http
    .get<any[]>(`${this.API}/PartsData/GetPartsEquipInfo?callNbr=${encodeURIComponent(callNbr)}`)
    .pipe(
      map(res => {
        const d = res[0];
        return {
          callNbr,
          techID: '',
          techName: '',
          equipNo: d.equipNo,
          make: d.make,
          model: d.model,
          kva: +d.kva,
          ipVolt: +d.ipVoltage,
          opVolt: +d.opVoltage,
          addInfo: d.addInfo,
          equipNo1: d.equip1,
          make1: d.make1,
          model1: d.model1,
          kva1: +d.kvA1,
          ipVolt1: +d.ipVoltage1,
          opVolt1: +d.opVoltage1,
          addInfo1: d.addInfo1,
          emgNotes: d.emgNotes
        } as PartsEquipInfo;
      })
    );
}


  /**
   * Get tech return info
   * Legacy: GetTechReturnedPartsInfo() → da.GetTechReturnedInfo
   */
  getTechReturnInfo(callNbr: string): Observable<TechReturnInfo> {
  return this.http
    .get<any>(`${this.API}/PartsData/GetTechReturnInfo?callNbr=${encodeURIComponent(callNbr)}`)
    .pipe(
      map(d => ({
        unusedSentBack: +d.unUsedSentBack || 0,
        faultySentBack: +d.faultySentBack || 0,
        returnStatus: d.returnStatus,
        lastModified: d.lastModified,
        maintAuthId: '',
        returnNotes: d.returnNotes
      } as TechReturnInfo))
    );
}

  savePartsRequest(data: PartsRequest, empId: string): Observable<{ success: boolean; message?: string }> {
  return this.http.post<{ success: boolean; message?: string }>(
    `${this.API}/PartsData/SavePartsRequest?empId=${encodeURIComponent(empId)}`,
    data,
    { headers: this.headers }
  );
}

  saveShippingPart(data: ShippingPart, empId: string): Observable<{ success: boolean; message?: string }> {
  return this.http.post<{ success: boolean; message?: string }>(
    `${this.API}/PartsData/SaveShippingPart?empId=${encodeURIComponent(empId)}`,
    data,
    { headers: this.headers }
  );
}

  saveTechPart(data: TechPart, empId: string, source: string): Observable<{ success: boolean; message?: string }> {
  return this.http.post<{ success: boolean; message?: string }>(
    `${this.API}/PartsData/SaveTechPart?empId=${encodeURIComponent(empId)}&source=${encodeURIComponent(source)}`,
    data,
    { headers: this.headers }
  );
}


  /**
   * Update job parts info
   * Legacy: UpdatePartsInfo(int Source) → da.UpdatePartsInfo
   */
  updateJobPartsInfo(data: any, empId: string): Observable<any> {
    return this.http.post<any>(`${this.API}/PartsData/UpdateJobPartsInfo?empId=${encodeURIComponent(empId)}`, data, { headers: this.headers });
  }

  /**
   * Update equipment info
   * Legacy: GetPartsEquipInfo()/UpdateEmgNotes_Click() → da.GetPartsEquipInfo/ED.SaveUpdatePartsEquipInfo
   */
  updatePartsEquipInfo(data: any, empId: string): Observable<any> {
    return this.http.post<any>(`${this.API}/PartsData/UpdatePartsEquipInfo?empId=${encodeURIComponent(empId)}`, data, { headers: this.headers });
  }

  /**
   * Update tech return info
   * Legacy: UpdateTechReturnedInfo() → da.SaveUpdateReturnedPartsbyTech
   */
  updateTechReturnInfo(data: any): Observable<any> {
    return this.http.post<any>(`${this.API}/JobParts/UpdateTechReturnInfo`, data, { headers: this.headers });
  }

  /**
   * Update tech parts received status
   * Legacy: btnProcess_Click() → da.UpdateTechPartsRecieved
   */
  updateTechPartsReceived(callNbr: string, scidIncs: string, empId: string): Observable<any> {
    return this.http.post<any>(`${this.API}/PartsData/UpdateTechPartsReceived?empId=${encodeURIComponent(empId)}`, 
      { callNbr, scidIncs }, 
      { headers: this.headers }
    );
  }

  /**
   * Check if UPS task exists for job
   * Legacy: CmdNew_Click() → da.IsUPSTaskedForJob
   */
  isUPSTaskedForJob(callNbr: string): Observable<number> {
    return this.http.get<number>(`${this.API}/PartsData/IsUPSTaskedForJob?callNbr=${encodeURIComponent(callNbr)}`);
  }

  /**
   * Check if part exists in inventory
   * Legacy: DCPartNum_TextChanged(), CheckItemExists(), chkItem_Click() → da.IsPartExistsInInventory, da.GetInvItemDescription
   */
  checkInventoryItem(itemNbr: string): Observable<{ exists: boolean; description: string }> {
    return this.http.get<{ exists: boolean; description: string }>(
      `${this.API}/PartsData/CheckInventoryItem?itemNbr=${encodeURIComponent(itemNbr)}`
    );
  }

  /**
   * Check if part request already exists
   * Legacy: CheckIfPartReqExist() → da.IsPartReqExist
   */
  checkPartRequestExists(callNbr: string, partNbr: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(
      `${this.API}/PartsData/CheckPartRequestExists?callNbr=${encodeURIComponent(callNbr)}&partNbr=${encodeURIComponent(partNbr)}`
    );
  }

  /**
   * Check if equipment info exists in part request
   * Legacy: CmdNew_Click() → da.IsEquipInfoInPartReq
   */
  isEquipInfoInPartReq(callNbr: string): Observable<string> {
    return this.http.get<string>(`${this.API}/PartsData/IsEquipInfoInPartReq?callNbr=${encodeURIComponent(callNbr)}`);
  }

  /**
   * Check if all parts received by warehouse
   * Legacy: UpdateTechReturnedInfo() → da.IsAllPartsReceivedbyWH
   */
  isAllPartsReceivedByWH(callNbr: string): Observable<number> {
    return this.http.get<number>(`${this.API}/JobParts/IsAllPartsReceivedByWH?callNbr=${encodeURIComponent(callNbr)}`);
  }

  /**
   * Re-upload job to GP
   * Legacy: cmdReUpload_Click() → da.ReUploadJobToGP
   */
  reUploadJobToGP(callNbr: string, techID: string): Observable<any> {
    return this.http.post<any>(`${this.API}/JobParts/ReUploadJobToGP`, 
      { callNbr, techID }, 
      { headers: this.headers }
    );
  }

  /**
   * Get file attachments
   * Legacy: Page_PreRender() (directory read)
   */
  getFileAttachments(callNbr: string): Observable<FileAttachment[]> {
    return this.http.get<FileAttachment[]>(`${this.API}/JobParts/GetFileAttachments?callNbr=${encodeURIComponent(callNbr)}`);
  }

  /**
   * Upload file attachment
   * Legacy: btnUpload_Click() → SaveFile()
   */
  uploadFileAttachment(callNbr: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('callNbr', callNbr);
    return this.http.post<any>(`${this.API}/JobParts/UploadFileAttachment`, formData);
  }

  /**
   * Get file URL
   * Legacy: getRootURL()
   */
  getFileUrl(callNbr: string, fileName: string): string {
    return `${this.API}/JobParts/GetFile?callNbr=${encodeURIComponent(callNbr)}&fileName=${encodeURIComponent(fileName)}`;
  }


  

  /**
   * Delete a part
   * Legacy: btnDelete_Click() → da.DeleteParts
   */
  deletePart(callNbr: string, scidInc: number, display: number, empId?: string): Observable<{ success: boolean; message?: string }> {
    const payload: any = {
      callNbr,
      scidInc,
      display
    };

    if (empId) {
      payload.empId = empId;
    }

    return this.http.post<{ success: boolean; message?: string }>(
      `${this.API}/PartsData/DeletePart`,
      payload,
      { headers: this.headers }
    );
  }

  private toBoolean(value: any): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return ['true', '1', 'yes', 'y'].includes(normalized);
    }
    if (typeof value === 'number') {
      return value === 1;
    }
    return !!value;
  }
}
