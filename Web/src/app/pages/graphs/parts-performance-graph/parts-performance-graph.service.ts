import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PartsPerformanceGraphService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get parts performance data with multiple chart datasets
   * Returns data from stored procedure: PartsPerformanceDashboard
   * Expected response structure:
   * {
   *   tables: [
   *     table0: Monthly data (Folders, ReturnedParts, NotReturned, Tested, NotTested),
   *     table1: Avg Days to Process Folders,
   *     table2: Avg Days to Return Parts,
   *     table3: Avg Days to Test Parts,
   *     table4: Parts/Units Testing by Category
   *   ]
   * }
   */
  getPartsPerformanceData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/TechTools/GetPartsPerformanceData`);
  }
}
