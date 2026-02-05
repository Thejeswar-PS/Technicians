import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

interface RefValue {
  equipID: number;
  make: string;
  model: string;
  refValue: number | null;
  resistance: number | null;
  lastModified: string;
}

interface RefValueApiResponse {
  columns: {
    EquipID: number;
    Make: string;
    Model: string;
    RefValue: number | null;
    Resistance: number | null;
    LastModified: string;
  };
}

export interface MakeOption {
  text: string;
  value: string;
}

@Injectable({
  providedIn: 'root'
})
export class DataMaintenanceService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getBatteryMakes(): Observable<MakeOption[]> {
    return this.http.get<MakeOption[]>(`${this.apiUrl}/TechTools/GetBatteryMakes`);
  }

  getRefValues(make: string): Observable<RefValue[]> {
    return this.http.get<RefValueApiResponse[]>(`${this.apiUrl}/TechTools/GetRefValues`, {
      params: { make }
    }).pipe(
      map(response => response.map(item => ({
        equipID: item.columns.EquipID,
        make: item.columns.Make,
        model: item.columns.Model,
        refValue: item.columns.RefValue,
        resistance: item.columns.Resistance,
        lastModified: item.columns.LastModified
      })))
    );
  }

  addRefValue(refValue: RefValue): Observable<any> {
    return this.http.post(`${this.apiUrl}/TechTools/AddRefValue`, refValue);
  }

  updateRefValue(refValue: RefValue): Observable<any> {
    return this.http.put(`${this.apiUrl}/TechTools/UpdateRefValue`, refValue);
  }

  deleteRefValue(refValue: RefValue): Observable<any> {
    return this.http.delete(`${this.apiUrl}/TechTools/DeleteRefValue`, {
      params: {
        equipID: refValue.equipID.toString(),
        make: refValue.make,
        model: refValue.model
      }
    });
  }
}
