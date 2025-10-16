import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Job } from '../model/job-model';
import { EquipmentDetails } from '../model/equipment-detail.modal';
import { ActivityDetailLog } from '../model/equipment-detail-log.modal';
import { DCGBatteryPricingDetail } from '../model/dcg-battery-pricing-details.modal';
import { GetServiceReportsDetails } from '../model/service-report-details-model';
import { CalendarJobDetails } from '../model/calendar-job-details.model';
import { GetNotes } from '../model/get-notes.model';
import { MobileReceipt } from '../model/mobile-receipt.model';
@Injectable({
  providedIn: 'root'
})
export class JobService {

  constructor(private http : HttpClient) { }

  private headers = new HttpHeaders({
    'Access-Control-Allow-Origin': '*'
  });
  API : string = environment.apiUrl;

  getCalenderJobData(payload: any): Observable<CalendarJobDetails[]>{
    let params = new HttpParams({ fromObject: payload })
    return this.http.get<CalendarJobDetails[]>(`${this.API}/Jobs/GetCalenderJobData?${params}`,{ headers : this.headers });
  }
  getDCGBatteryPricingDetails(ids: string, quantity: number): Observable<DCGBatteryPricingDetail[]>{
    return this.http.get<DCGBatteryPricingDetail[]>(`${this.API}/Jobs/GetPricingDetails?ids=${ids}&quantity=${quantity}`,{ headers : this.headers });
  }

  getActivity(jobId: string): Observable<ActivityDetailLog[]>{
    return this.http.get<ActivityDetailLog[]>(`${this.API}/Jobs/GetActivity?jobId=${jobId}` ,{ headers : this.headers });
  }
  getEquipmentDetails(jobId: string): Observable<EquipmentDetails[]>{
    return this.http.get<EquipmentDetails[]>(`${this.API}/Jobs/GetEquipmentDetails?jobId=${jobId}`,{ headers : this.headers })
  }
  
  getEquipmentDetailsByCallNbr(callNbr: string): Observable<EquipmentDetails[]>{
    return this.http.get<EquipmentDetails[]>(`${this.API}/EquipmentDetails/GetEquipmentDetails?callNbr=${callNbr}`,{ headers : this.headers })
  }
  getServiceDetails(req : any) : Observable<Job[]>
  {
    let params = new HttpParams({ fromObject: req })
    return this.http.get<Job[]>(`${this.API}/jobs/GetServiceDetails?${params}`,{ headers : this.headers });
  }
  getServiceMasterSearch(jobId : any, manager : any, status : any, year : any, month : any, pagination: any) : Observable<Job[]>
  {
    let params = new HttpParams({ fromObject: pagination })
    return this.http.get<Job[]>(`${this.API}/jobs/GetServiceMasterSearch?jobId=${jobId}&accMgr=${manager}&status=${status}&year=${year}&month=${month}&${params}`,{ headers : this.headers });
  }
  getJobStatus() : Observable<any[]>
  {
    return this.http.get<any[]>(`${this.API}/jobs/GetJobStatus`,{ headers : this.headers });
  }
  getJobDetails(rowIndex: string) : Observable<any[]>
  {
    return this.http.get<any[]>(`${this.API}/jobs/GetJobDetails?rowIndex=${rowIndex}`,{ headers : this.headers });
  }
  updateJob(obj: any)
  {
    return this.http.put(`${this.API}/jobs/UpdateJobIDStatusComments`, obj,{ headers : this.headers });
  }
  updateJobStatus(rowIndex: string, status: string, modifiedBy: string, notes: string)
  {
    let payload = {
      rowIndex,
      status,
      modifiedBy,
      notes
    }
    return this.http.put(`${this.API}/jobs/UpdateJobStatus`, payload,{ headers : this.headers });
  }

  getServiceReportsDetails(req : any) : Observable<GetServiceReportsDetails[]>
  {
    let params = new HttpParams({ fromObject: req })
    return this.http.get<GetServiceReportsDetails[]>(`${this.API}/report/GetServiceReportsDetails?${params}`,{ headers : this.headers });
  }
  getNotes(req : any) : Observable<GetNotes>
  {
    let params = new HttpParams({ fromObject: req })
    return this.http.get<GetNotes>(`${this.API}/jobs/GetNotes?${params}`,{ headers : this.headers });
  }
  importJobs(accMngr: any) : Observable<any>
  {
    return this.http.get<any[]>(`${this.API}/jobs/ImportJobs?accManager=${accMngr}`,{ headers : this.headers });
  }
  
  // Legacy API methods to match WebForms functionality
  getJobs(req: any): Observable<Job[]> {
    let params = new HttpParams({ fromObject: req });
    return this.http.get<Job[]>(`${this.API}/Jobs/GetJobs?${params}`, { headers: this.headers });
  }
  
  searchJob(req: any): Observable<Job[]> {
    let params = new HttpParams({ fromObject: req });
    return this.http.get<Job[]>(`${this.API}/Jobs/SearchJob?${params}`, { headers: this.headers });
  }
  
  // New method for searched job (equivalent to GetJobInfo in legacy)
  getSearchedJob(jobId: string, techId: string, empId: string): Observable<Job[]> {
    return this.http.get<Job[]>(`${this.API}/Jobs/GetSearchedJob?jobId=${jobId}&techId=${techId}&empId=${empId}`, { headers: this.headers });
  }
  
  getTechnicians(): Observable<any[]> {
    return this.http.get<any[]>(`${this.API}/Jobs/GetTechnicians`, { headers: this.headers });
  }

  // Expense-related methods
  getExpenseInfo(callNbr: string, techName: string): Observable<any[]> {
    // Use the correct API endpoint with date range parameters
    // For single job expenses, we'll use a broad date range to get all expenses for the tech
    const dt1 = '01/01/2020'; // Start from a past date
    const dt2 = new Date().toLocaleDateString('en-US'); // Current date
    const tableIdx = -1; // Get all expenses
    
    return this.http.get<any[]>(`${this.API}/EtechExpense/GetEtechExpenses?dt1=${encodeURIComponent(dt1)}&dt2=${encodeURIComponent(dt2)}&techName=${encodeURIComponent(techName)}&tableIdx=${tableIdx}`, { headers: this.headers });
  }

  getExpenseInfoByDateRange(techName: string, startDate: Date, endDate: Date): Observable<any[]> {
    const dt1 = startDate.toLocaleDateString('en-US');
    const dt2 = endDate.toLocaleDateString('en-US');
    const tableIdx = -1; // Get all expenses
    
    return this.http.get<any[]>(`${this.API}/EtechExpense/GetEtechExpenses?dt1=${encodeURIComponent(dt1)}&dt2=${encodeURIComponent(dt2)}&techName=${encodeURIComponent(techName)}&tableIdx=${tableIdx}`, { headers: this.headers });
  }

  getMobileReceipts(callNbr: string, techID: string): Observable<MobileReceipt[]> {
    // Based on legacy: da.GetMobileReceipts(CallNbr, TechID, ref Result)
    // Updated to match the actual API endpoint structure
    return this.http.get<MobileReceipt[]>(`${this.API}/EtechExpense/GetMobileReceipts?callNbr=${encodeURIComponent(callNbr)}&techID=${encodeURIComponent(techID)}`, { headers: this.headers });
  }

  // Edit Expense API methods
  getExpenseDetail(callNbr: string, tableIdx: number): Observable<any> {
    // Based on legacy: da.GetExpenseDetail(CallNbr, TableIdx)
    return this.http.get<any>(`${this.API}/EtechExpense/GetExpenseDetail?callNbr=${encodeURIComponent(callNbr)}&tableIdx=${tableIdx}`, { headers: this.headers });
  }

  getAllowedAmountForFoodExpenses(callNbr: string, techName: string): Observable<string> {
    // Based on legacy: da.AllowedAmountForFoodExpenses(CallNbr, TechName)
    return this.http.get<string>(`${this.API}/EtechExpense/GetAllowedAmountForFoodExpenses?callNbr=${encodeURIComponent(callNbr)}&techName=${encodeURIComponent(techName)}`, { headers: this.headers });
  }

  saveExpense(expenseData: any): Observable<any> {
    // Based on legacy save expense operation
    return this.http.post<any>(`${this.API}/EtechExpense/SaveExpense`, expenseData, { headers: this.headers });
  }

  deleteExpense(callNbr: string, tableIdx: number): Observable<any> {
    // Based on legacy delete operation
    return this.http.delete<any>(`${this.API}/EtechExpense/DeleteExpense?callNbr=${encodeURIComponent(callNbr)}&tableIdx=${tableIdx}`, { headers: this.headers });
  }

  checkHoursSameDay(techName: string, startDate: Date, endDate: Date, tableIdx: number): Observable<any[]> {
    // Based on legacy: da.CheckHoursSameDay(TechName, pdtNewStrt, pdtNewEnd, TableIdx)
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();
    return this.http.get<any[]>(`${this.API}/EtechExpense/CheckHoursSameDay?techName=${encodeURIComponent(techName)}&startDate=${encodeURIComponent(startDateStr)}&endDate=${encodeURIComponent(endDateStr)}&tableIdx=${tableIdx}`, { headers: this.headers });
  }

  canTechAddFoodExpenses(callNbr: string, techName: string, expAmount: number, currentAmount: number, type: string, date: Date): Observable<string> {
    // Based on legacy: da.CanTechAddFoodExpenses(CallNbr, TechName, ExpAmount, CL, Type, dtNewStrt)
    const dateStr = date.toISOString();
    return this.http.get<string>(`${this.API}/EtechExpense/CanTechAddFoodExpenses?callNbr=${encodeURIComponent(callNbr)}&techName=${encodeURIComponent(techName)}&expAmount=${expAmount}&currentAmount=${currentAmount}&type=${encodeURIComponent(type)}&date=${encodeURIComponent(dateStr)}`, { headers: this.headers });
  }
}
