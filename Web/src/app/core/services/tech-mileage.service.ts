import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  TechMileageRequestDto,
  TechMileageResponseDto,
  TechMileageTechnicianDto
} from '../model/tech-mileage.model';

@Injectable({
  providedIn: 'root'
})
export class TechMileageService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTechnicians(): Observable<TechMileageTechnicianDto[]> {
    return this.http
      .get<any>(`${this.apiUrl}/TechMileage/GetTechnicians`)
      .pipe(map((response) => response?.data || response || []));
  }

  getTechMileageReport(request: TechMileageRequestDto): Observable<TechMileageResponseDto> {
    return this.http
      .post<any>(`${this.apiUrl}/TechMileage/GetTechMileageReport`, request)
      .pipe(map((response) => response?.data || response));
  }
}
