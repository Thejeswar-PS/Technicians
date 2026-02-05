import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountingStatusService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get accounting status data with 2 chart datasets
   * Returns data from stored procedures:
   * - GetAccMgmtGraphData: Accounting Status chart data
   * - GetAccMgmtGraphData3: Contract Billing Status chart data
   */
  getAccountingStatusData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/TechTools/GetAccountingStatusData`);
  }
}
