import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import {
  NewUniTestRequest,
  NewUniTestResponse,
  NewUniTestApiResponse,
  NewUniTestSummaryResponse,
  UnitTestExistsResponse,
  MoveUnitToStrippingDto,
  MoveUnitToStrippingApiResponse,
  SaveUpdateNewUnitTestDto,
  SaveUpdateUnitTestResponse,
  SaveUpdateNewUnitResultDto,
  SaveUpdateUnitTestResultResponse,
  DeleteNewUnitTestResponse,
  CreateNewUnitDto,
  CreateNewUnitApiResponse
} from '../model/new-unit-test.model';
import { UPSTestStatusDto } from '../model/ups-test-status.model';
import { StrippedUnitsStatusDto } from '../model/stripped-units-status.model';

@Injectable({
  providedIn: 'root'
})
export class NewUnitTestService {
  
  private headers = new HttpHeaders({
    'Access-Control-Allow-Origin': '*'
  });
  
  private API: string = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private handleError(error: any): Observable<never> {
    console.error('New Unit Test Service Error:', error);
    throw error;
  }

  /**
   * Get new unit test list data
   * @param rowIndex Row index to filter by (0 returns all records ordered by LastModifiedOn)
   * @returns New unit test data using existing UPSTestStatusDto
   */
  getNewUniTestList(rowIndex: number = 0): Observable<NewUniTestApiResponse> {
    const params = new HttpParams().set('rowIndex', rowIndex.toString());

    return this.http.get<NewUniTestApiResponse>(`${this.API}/NewUniTest`, {
      params,
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get a specific unit test by row index
   * @param rowIndex The row index to retrieve
   * @param archive Whether to search in archived data
   * @returns Single UPSTestStatusDto record or null if not found
   */
  getNewUniTestByRowIndex(rowIndex: number, archive: boolean = false): Observable<{ success: boolean; data: UPSTestStatusDto; message?: string; error?: string }> {
    const params = new HttpParams().set('archive', archive.toString());
    
    return this.http.get<{ success: boolean; data: UPSTestStatusDto; message?: string; error?: string }>(`${this.API}/NewUniTest/${rowIndex}`, {
      params,
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get summary statistics and metadata for the new unit tests
   * @returns Summary statistics including counts by status, make, etc.
   */
  getSummary(): Observable<NewUniTestSummaryResponse> {
    return this.http.get<NewUniTestSummaryResponse>(`${this.API}/NewUniTest/summary`, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Check if a unit test exists for the given row index
   * @param rowIndex The row index to check
   * @returns Whether the unit test exists
   */
  checkUnitTestExists(rowIndex: number): Observable<UnitTestExistsResponse> {
    return this.http.get<UnitTestExistsResponse>(`${this.API}/NewUniTest/exists/${rowIndex}`, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Move a unit to stripping
   * @param dto The unit data to move to stripping
   * @returns Response indicating success or failure
   */
  moveUnitToStripping(dto: MoveUnitToStrippingDto): Observable<MoveUnitToStrippingApiResponse> {
    return this.http.post<MoveUnitToStrippingApiResponse>(`${this.API}/NewUniTest/move-to-stripping`, dto, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Check if a unit already exists in stripping
   * @param rowIndex The row index to check
   * @returns Whether the unit exists in stripping
   */
  checkUnitExistsInStripping(rowIndex: number): Observable<{ success: boolean; exists: boolean; message?: string }> {
    return this.http.get<{ success: boolean; exists: boolean; message?: string }>(`${this.API}/NewUniTest/exists-in-stripping/${rowIndex}`, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Get stripped unit information by row index
   * @param rowIndex The row index to retrieve
   * @returns Stripped unit data or null if not found
   */
  getStrippedUnitByRowIndex(rowIndex: number): Observable<{ success: boolean; data: StrippedUnitsStatusDto; message?: string }> {
    return this.http.get<{ success: boolean; data: StrippedUnitsStatusDto; message?: string }>(`${this.API}/NewUniTest/stripped-unit/${rowIndex}`, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Save or update a unit test
   * @param dto The unit test data to save or update
   * @returns Response indicating success or failure
   */
  saveUpdateUnitTest(dto: SaveUpdateNewUnitTestDto): Observable<SaveUpdateUnitTestResponse> {
    return this.http.post<SaveUpdateUnitTestResponse>(`${this.API}/NewUniTest/save-update`, dto, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Update unit test result including status, resolve notes, test procedures, and tester info
   * @param dto The unit test result data to update
   * @returns Response indicating success or failure with completion details
   */
  saveUpdateUnitTestResult(dto: SaveUpdateNewUnitResultDto): Observable<SaveUpdateUnitTestResultResponse> {
    return this.http.post<SaveUpdateUnitTestResultResponse>(`${this.API}/NewUniTest/update-result`, dto, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Delete a unit test
   * @param rowIndex The RowIndex of the unit test to delete
   * @returns Response indicating success or failure with result message
   */
  deleteNewUnitTest(rowIndex: number): Observable<DeleteNewUnitTestResponse> {
    return this.http.delete<DeleteNewUnitTestResponse>(`${this.API}/NewUniTest/${rowIndex}`, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Create a new unit test record with complete metadata
   * @param dto The new unit data to create
   * @returns Response with created unit details including new RowIndex
   */
  createNewUnit(dto: CreateNewUnitDto): Observable<CreateNewUnitApiResponse> {
    return this.http.post<CreateNewUnitApiResponse>(`${this.API}/NewUniTest/create`, dto, {
      headers: this.headers
    }).pipe(
      catchError(this.handleError)
    );
  }
}