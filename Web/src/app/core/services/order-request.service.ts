import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { 
  OrderRequestDto, 
  SaveUpdateOrderRequestRequest, 
  SaveUpdateOrderRequestResponse 
} from '../model/order-request.model';

// Interfaces for API responses
export interface TableColumn {
  Name: string;
  Type: string;
}

export interface DataTable {
  TableName: string;
  Columns: TableColumn[];
  Rows: { [key: string]: any }[];
}

export interface PartsTestListResponse {
  Tables: DataTable[];
  ErrorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderRequestService {
  private headers = new HttpHeaders({
    'Access-Control-Allow-Origin': '*'
  });

  private API: string = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Gets the maximum OrderRequest row index from the API
   * @returns Observable<number> - The maximum row index
   */
  getMaxOrderRequestRowIndex(): Observable<number> {
    return this.http.get<number>(`${this.API}/OrderRequest/GetMaxOrderRequestRowIndex`, { headers: this.headers });
  }



  /**
   * Gets parts test list data based on row index and source
   * @param rowIndex - Row index parameter
   * @param source - Source type: PartsTest, OrderRequest, or other (defaults to OrderRequest)
   * @returns Observable<PartsTestListResponse> - The parts test list data
   */
  getPartsTestList(rowIndex: number, source: string = 'OrderRequest'): Observable<PartsTestListResponse> {
    const params = new HttpParams()
      .set('rowIndex', rowIndex.toString())
      .set('source', source);
    
    return this.http.get<PartsTestListResponse>(`${this.API}/OrderRequest/GetPartsTestList`, { 
      headers: this.headers,
      params: params
    });
  }

  /**
   * Deletes parts test list based on row index and source
   * @param rowIndex - Row index parameter
   * @param source - Source type: PartsTest, UnitTest, OrderRequest, or other (defaults to OrderRequest)
   * @returns Observable<{message: string}> - Result message from the stored procedure
   */
  deletePartsTestList(rowIndex: number, source: string = 'OrderRequest'): Observable<{message: string}> {
    const params = new HttpParams()
      .set('rowIndex', rowIndex.toString())
      .set('source', source);
    
    return this.http.delete<{message: string}>(`${this.API}/OrderRequest/DeletePartsTestList`, { 
      headers: this.headers,
      params: params
    });
  }

  /**
   * Saves or updates an order request
   * @param orderRequest - The order request data to save/update
   * @returns Observable<SaveUpdateOrderRequestResponse> - Result with row index and message
   */
  saveUpdateOrderRequest(orderRequest: SaveUpdateOrderRequestRequest): Observable<SaveUpdateOrderRequestResponse> {
    return this.http.post<SaveUpdateOrderRequestResponse>(`${this.API}/OrderRequest/SaveUpdateOrderRequest`, orderRequest, { 
      headers: this.headers 
    });
  }

  /**
   * Saves or updates an order request with file attachments
   * @param orderRequest - The order request data to save/update
   * @param files - Array of files to upload
   * @returns Observable<SaveUpdateOrderRequestResponse> - Result with row index and message
   */
  saveUpdateOrderRequestWithFiles(orderRequest: SaveUpdateOrderRequestRequest, files: File[]): Observable<SaveUpdateOrderRequestResponse> {
    const formData = new FormData();
    
    // Add order request data as JSON
    formData.append('orderRequest', JSON.stringify(orderRequest));
    
    // Add files
    files.forEach((file, index) => {
      formData.append(`files`, file, file.name);
    });
    
    // Create headers without Content-Type to let browser set it with boundary for FormData
    const uploadHeaders = new HttpHeaders({
      'Access-Control-Allow-Origin': '*'
    });
    
    return this.http.post<SaveUpdateOrderRequestResponse>(`${this.API}/OrderRequest/SaveUpdateOrderRequestWithFiles`, formData, { 
      headers: uploadHeaders 
    });
  }
}