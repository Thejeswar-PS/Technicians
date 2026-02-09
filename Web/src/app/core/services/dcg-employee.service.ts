import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  DCGEmployeeDto, 
  OfficeStateAssignmentDto, 
  DCGEmpDetailsResponse,
  CreateDCGEmployeeDto,
  UpdateDCGEmployeeDto,
  CreateOfficeStateAssignmentDto,
  UpdateOfficeStateAssignmentDto,
  DCGApiResponse
} from '../model/dcg-employee.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DcgEmployeeService {
  private readonly apiUrl = `${environment.apiUrl}/DCGEmployee`;

  constructor(private http: HttpClient) { }

  // DCG Employees
  getDCGEmployees(sortBy: string = 'EmpName'): Observable<DCGApiResponse<DCGEmployeeDto[]>> {
    const params = new HttpParams().set('sortBy', sortBy);
    return this.http.get<DCGApiResponse<DCGEmployeeDto[]>>(`${this.apiUrl}/employees`, { params });
  }

  getDCGEmployee(empNo: number): Observable<DCGApiResponse<DCGEmployeeDto>> {
    return this.http.get<DCGApiResponse<DCGEmployeeDto>>(`${this.apiUrl}/employees/${empNo}`);
  }

  createDCGEmployee(employee: CreateDCGEmployeeDto): Observable<DCGApiResponse<number>> {
    return this.http.post<DCGApiResponse<number>>(`${this.apiUrl}/employees`, employee);
  }

  updateDCGEmployee(empNo: number, employee: UpdateDCGEmployeeDto): Observable<DCGApiResponse<boolean>> {
    return this.http.put<DCGApiResponse<boolean>>(`${this.apiUrl}/employees/${empNo}`, employee);
  }

  deleteDCGEmployee(empNo: number): Observable<DCGApiResponse<boolean>> {
    return this.http.delete<DCGApiResponse<boolean>>(`${this.apiUrl}/employees/${empNo}`);
  }

  // Office State Assignments
  getOfficeStateAssignments(sortBy: string = 'State'): Observable<DCGApiResponse<OfficeStateAssignmentDto[]>> {
    const params = new HttpParams().set('sortBy', sortBy);
    return this.http.get<DCGApiResponse<OfficeStateAssignmentDto[]>>(`${this.apiUrl}/office-assignments`, { params });
  }

  getOfficeStateAssignment(state: string): Observable<DCGApiResponse<OfficeStateAssignmentDto>> {
    return this.http.get<DCGApiResponse<OfficeStateAssignmentDto>>(`${this.apiUrl}/office-assignments/${state}`);
  }

  createOfficeStateAssignment(assignment: CreateOfficeStateAssignmentDto): Observable<DCGApiResponse<boolean>> {
    return this.http.post<DCGApiResponse<boolean>>(`${this.apiUrl}/office-assignments`, assignment);
  }

  updateOfficeStateAssignment(state: string, assignment: UpdateOfficeStateAssignmentDto): Observable<DCGApiResponse<boolean>> {
    return this.http.put<DCGApiResponse<boolean>>(`${this.apiUrl}/office-assignments/${state}`, assignment);
  }

  deleteOfficeStateAssignment(state: string): Observable<DCGApiResponse<boolean>> {
    return this.http.delete<DCGApiResponse<boolean>>(`${this.apiUrl}/office-assignments/${state}`);
  }

  // Combined Operations
  getDCGEmpDetails(gridType: string = 'E', sortBy: string = ''): Observable<DCGApiResponse<DCGEmpDetailsResponse>> {
    let params = new HttpParams().set('gridType', gridType);
    if (sortBy) {
      params = params.set('sortBy', sortBy);
    }
    return this.http.get<DCGApiResponse<DCGEmpDetailsResponse>>(`${this.apiUrl}/details`, { params });
  }
}