import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable} from 'rxjs';
import { CapFanPrice } from '../model/cap-fan-pricing-list-model';
import { environment } from 'src/environments/environment';
import { DcgBatteryPrice, DcgBatteryPriceAdd, DcgBatteryPriceEdit } from '../model/dcg-battery-pricing-model';
import { CapFanPriceDetails } from '../model/cap-fan-pricing-model';
import { BatteryContact } from '../model/battery-contact.modal';
import { observableToBeFn } from 'rxjs/internal/testing/TestScheduler';
import { DeactivateAccountComponent } from 'src/app/modules/account/settings/forms/deactivate-account/deactivate-account.component';
import { dE } from '@fullcalendar/core/internal-common';
import { PriceGroup } from '../model/price-group.model';
import { PricingProfile } from '../model/pricing-profile';

@Injectable({
  providedIn: 'root'
})
export class PricingService {
  url: string = environment.apiUrl;
  private headers = new HttpHeaders({
    'Access-Control-Allow-Origin': '*'
  });

  constructor(private http: HttpClient) { }

  getBatteryContacts(): Observable<BatteryContact[]>{
    return this.http.get<BatteryContact[]>(`${this.url}/Pricing/GetBatteryContracts`, {headers: this.headers})
  }




  getPricingGroup(): Observable<PriceGroup[]>{
    return this.http.get<PriceGroup[]>(`${this.url}/Pricing/GetPricingGroup`, {headers: this.headers})
  }
  getBatteryPriceById(id: any): Observable<DcgBatteryPriceEdit>{
    return this.http.get<DcgBatteryPriceEdit>(`${this.url}/Pricing/GetBatteryPriceById?id=${id}`, {headers: this.headers})
  }
  AddDcgPricing(payload: DcgBatteryPriceAdd): Observable<number>{
    return this.http.post<number>(`${this.url}/Pricing/AddNewPricing`,payload, { headers: this.headers })
  }
  updateDcgPricingDetails(payload: DcgBatteryPrice): Observable<boolean>{
    return this.http.put<boolean>(`${this.url}/Pricing/UpdateDcgPricingDetails`,payload, { headers: this.headers })
  }
  getProfitGuideById(id: any):Observable<PricingProfile[]>{
    // let params = new HttpParams({ fromObject: req })
    return this.http.get<PricingProfile[]>(`${this.url}/Pricing/GetProfitGuideById?id=${id}`, {headers: this.headers})
  }
  getProfitGuideByPriceGroup(priceGroup: any):Observable<PricingProfile[]>{
    // let encodedData = encodeURIComponent(priceGroup);
    return this.http.get<PricingProfile[]>(`${this.url}/Pricing/GetPriceGroups?priceGroup=${priceGroup}`, {headers: this.headers})
  }
  updatePricingDetails(payload: PricingProfile): Observable<boolean>{
    return this.http.put<boolean>(`${this.url}/Pricing/UpdatePricingDetails`,payload, { headers: this.headers })
  }




  getCapFanPriceList(req: any):Observable<CapFanPrice[]>{
    let params = new HttpParams({ fromObject: req })
    return this.http.get<CapFanPrice[]>(`${this.url}/Pricing/GetCapPrice?${params}`, {headers: this.headers})
  }

  getDcgPriceDetails(req: any):Observable<DcgBatteryPrice[]>{
    let params = new HttpParams({ fromObject: req })
    return this.http.get<DcgBatteryPrice[]>(`${this.url}/Pricing/GetDcgPrice?${params}`, {headers: this.headers})
  }

  getCapFanPriceDetails(rowIndex : number):Observable<CapFanPriceDetails[]>{
    return this.http.get<CapFanPriceDetails[]>(`${this.url}/Pricing/GetCapFanPriceChild?id=${rowIndex}`, {headers: this.headers})
  }

  updateCapFanPrice(details: CapFanPrice): Observable<number>{
    return this.http.put<number>(`${this.url}/Pricing/UpdateCapFanPricing`, details, {headers: this.headers})
  }
  deleteCapFanPrice(rowIndex: number): Observable<any>{
    return this.http.delete<any>(`${this.url}/Pricing/DeleteCapFanPricing?rowIndex=${rowIndex}`, {headers: this.headers})
  }



  addNewChild(obj: any): Observable<boolean>{
    return this.http.post<boolean>(`${this.url}/Pricing/AddChildCapFanPrice`, obj, {headers: this.headers})
  }
  updateChild(details: CapFanPriceDetails): Observable<boolean>{
    return this.http.post<boolean>(`${this.url}/Pricing/UpdateChildCapFanPrice`, details, {headers: this.headers})
  }
  updateBulkChild(details: CapFanPriceDetails[]): Observable<boolean>{
    return this.http.post<boolean>(`${this.url}/Pricing/UpdateBulkChildCapFanPrice`, details, {headers: this.headers})
  }
  deleteChild(details: CapFanPriceDetails): Observable<boolean>{
    return this.http.post<boolean>(`${this.url}/Pricing/DeleteChildCapFanPrice`, details, {headers: this.headers})
  }


  updateBatteryContactDetails(details: BatteryContact): Observable<BatteryContact>{
    return this.http.put<BatteryContact>(`${this.url}/Pricing/UpdateBatteryContracts`, details, {headers: this.headers})
  }
  addBatteryContactDetails(details: BatteryContact): Observable<BatteryContact>{
    return this.http.post<BatteryContact>(`${this.url}/Pricing/AddeBatteryContracts`, details, {headers: this.headers})
  }
  deleteBatteryContactDetails(payload: BatteryContact): Observable<any>{
    return this.http.put(`${this.url}/Pricing/DeleteBatteryContracts`,payload,{headers: this.headers});
  }
  // &email=${payload.vendor}&officePhone=${payload.vendor}&otherPhone=${payload.vendor}&baseOperation=${payload.vendor}&notes=${payload.vendor}&type=${payload.vendor}
}

