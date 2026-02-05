import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CapFanUsageService {
  private headers = new HttpHeaders({
    'Access-Control-Allow-Origin': '*'
  });

  API: string = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get Cap/Fan usage data by year
   * Returns an array of 12 datasets:
   * [0-5]: Grid data for Caps, Fans, Batts, IGB, SCR, FUS
   * [6-11]: Chart data for Caps, Fans, Batts, IGB, SCR, FUS
   */
  getCapFanUsageByYear(
    capPartNo: string,
    fanPartNo: string,
    battNo: string,
    igbNo: string,
    scrNo: string,
    fusNo: string,
    year: number
  ): Observable<any[]> {
    let params = new HttpParams()
      .set('capPartNo', capPartNo || '')
      .set('fanPartNo', fanPartNo || '')
      .set('battNo', battNo || '')
      .set('igbNo', igbNo || '')
      .set('scrNo', scrNo || '')
      .set('fusNo', fusNo || '')
      .set('year', year.toString());

    return this.http.get<any[]>(
      `${this.API}/TechTools/GetCapFanUsageByYear`,
      {
        headers: this.headers,
        params: params
      }
    );
  }
}
