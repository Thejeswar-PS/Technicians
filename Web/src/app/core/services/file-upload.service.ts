import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface UploadedFile {
  name: string;
  creationTime: Date;
  fullName: string;
  size: number;
}

export interface UploadResponse {
  success: boolean;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  private apiUrl = environment.apiUrl || 'https://localhost:7115/api';

  constructor(private http: HttpClient) {}

  /**
   * Upload a file for a specific job
   */
  uploadFile(callNbr: string, file: File): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('callNbr', callNbr);
    
    return this.http.post<UploadResponse>(`${this.apiUrl}/FileUpload/UploadFile`, formData);
  }

  /**
   * Get list of uploaded files for a job
   */
  getUploadedFiles(callNbr: string): Observable<UploadedFile[]> {
    return this.http.get<UploadedFile[]>(`${this.apiUrl}/FileUpload/GetFiles/${callNbr}`);
  }

  /**
   * Get URL for downloading/viewing a file
   */
  getFileUrl(callNbr: string, fileName: string): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/FileUpload/GetFileUrl/${callNbr}/${fileName}`);
  }

  /**
   * Delete a file
   */
  deleteFile(callNbr: string, fileName: string): Observable<UploadResponse> {
    return this.http.delete<UploadResponse>(`${this.apiUrl}/FileUpload/DeleteFile/${callNbr}/${fileName}`);
  }
}