import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

// Uploaded File interface matching the frontend model
export interface UploadedFile {
  name: string;
  creationTime: Date;
  fullName: string;
  size: number;
}

// Equipment File DTOs matching the backend models
export interface EquipmentFileDto {
  equipID: number;
  techID: string;
  img_Title: string;
  img_Type: string;
  createdBy: string;
  imgFile: File;
}

export interface EquipmentFileResponseDto {
  equipID: number;
  techID: string;
  fileName: string;
  contentType: string;
  createdBy: string;
  createdOn: Date;
  data: string; // Base64 encoded file data
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

  constructor(private http: HttpClient) {
  }
  /**
   * Upload a file for a specific job - uses same endpoint as equipment uploads
   */
  uploadFile(callNbr: string, file: File, createdBy?: string): Observable<UploadResponse> {
    const formData = new FormData();
    
    // Use same format as equipment uploads, but with EquipID = 0 for job files
    formData.append('EquipID', '0'); // Use 0 for job files (no specific equipment)
    formData.append('TechID', callNbr);
    formData.append('Img_Title', file.name);
    formData.append('Img_Type', file.type || 'application/octet-stream');
    formData.append('CreatedBy', createdBy || callNbr);
    
    // Adding file size if backend expects it
    formData.append('FileSize', file.size.toString());
    
    // The file itself - same as equipment uploads
    formData.append('ImgFile', file, file.name);
    
    // endpoint for job uploads (header button)
    const endpoint = `${this.apiUrl}/EquipmentDetails/InsertEquipmentFiles`;
    console.log('Uploading job file to header endpoint:', endpoint);
    console.log('Job file FormData contents (for header upload):', {
      EquipID: 0,
      TechID: callNbr,
      Img_Title: file.name,
      Img_Type: file.type,
      CreatedBy: createdBy || callNbr,
      FileSize: file.size
    });
    
    // Debug: Log FormData keys
    formData.forEach((value, key) => {
      console.log(`${key}: ${value instanceof File ? `[File: ${value.name}, size: ${value.size}]` : value}`);
    });
    
    return this.http.post<UploadResponse>(endpoint, formData);
  }
  /**
   * Upload equipment file (matching legacy EqFileUpload functionality)
   */
  uploadEquipmentFile(equipmentId: number, techId: string, file: File, createdBy?: string, callNbr?: string, equipNo?: string, techName?: string): Observable<UploadResponse> {
    const formData = new FormData();
    
    // Add required fields for the backend InsertEquipmentFile endpoint (separate from images)
    formData.append('EquipID', equipmentId.toString());
    formData.append('TechID', techId);
    formData.append('Img_Title', file.name);
    formData.append('Img_Type', file.type || 'application/octet-stream');
    formData.append('CreatedBy', createdBy || techId);
    
    // The file itself - backend expects ImgFile
    formData.append('ImgFile', file, file.name);
    
    // Use the file-specific backend endpoint (separate from equipment images)
    const endpoint = `${this.apiUrl}/EquipmentDetails/InsertEquipmentFile`;
    console.log('Uploading equipment FILE (not image) to endpoint:', endpoint);
    console.log('Equipment FILE FormData contents:', {
      EquipID: equipmentId,
      TechID: techId,
      Img_Title: file.name,
      Img_Type: file.type,
      CreatedBy: createdBy || techId
    });
    
    // Debug: Log FormData keys
    formData.forEach((value, key) => {
      console.log(`${key}: ${value instanceof File ? `[File: ${value.name}, size: ${value.size}]` : value}`);
    });
    
    return this.http.post<UploadResponse>(endpoint, formData);
  }

  /**
   * Get list of uploaded files for a job
   * Using the same endpoint as equipment files with equipId=0 for job files
   */
  getUploadedFiles(callNbr: string): Observable<UploadedFile[]> {
    // Use equipId=0 to get job files, or you can modify backend to accept callNbr
    return this.http.get<{ data: EquipmentFileResponseDto[] }>(`${this.apiUrl}/EquipmentDetails/GetEquipmentFiles?equipId=0`)
      .pipe(
        map((response: { data: EquipmentFileResponseDto[] }) => {
          // Convert EquipmentFileResponseDto[] to UploadedFile[]
          return response.data.map((file: EquipmentFileResponseDto) => ({
            name: file.fileName,
            creationTime: new Date(file.createdOn),
            fullName: file.fileName,
            size: 0 // Size not available in the response
          }));
        })
      );
  }

  /**
   * Get equipment files for a specific equipment ID
   * Now using the same database table as equipment images for persistence
   */
  getEquipmentFiles(equipmentId: number): Observable<{ data: EquipmentFileResponseDto[] }> {
    // Use the file-specific backend endpoint (separate from equipment images)
    const params = new HttpParams()
      .set('equipId', equipmentId.toString());
    
    console.log('Fetching equipment FILES (not images) for equipmentId:', equipmentId);
    
    return this.http.get<{ data: any[] }>(`${this.apiUrl}/EquipmentDetails/GetEquipmentFiles`, { params })
      .pipe(
        map((response: any) => {
          console.log('Raw equipment FILES API response:', response);
          
          // Transform the backend response to match frontend expectations
          // Backend returns: equipID, techID, fileName, contentType, createdBy, createdOn, data
          const transformedData = (response.data || []).map((item: any) => {
            return {
              equipID: item.equipID,
              techID: item.techID,
              fileName: item.fileName,
              contentType: item.contentType,
              createdBy: item.createdBy,
              createdOn: new Date(item.createdOn),
              data: item.data || ''
            };
          });
          return { data: transformedData };
        })
      );
  }

  /**
   * Get URL for downloading/viewing a file
   * For job files, we'll use the same download mechanism as equipment files
   */
  getFileUrl(callNbr: string, fileName: string): Observable<string> {
    // This method might not be needed anymore since we're using base64 download
    // But keeping it for compatibility
    return this.http.get<string>(`${this.apiUrl}/EquipmentDetails/GetFileUrl/${callNbr}/${fileName}`);
  }

  /**
   * Download equipment file as blob
   */
  downloadEquipmentFile(fileData: string, fileName: string, contentType: string): void {
    try {
      // Convert base64 to blob
      const byteCharacters = atob(fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: contentType });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  }

  /**
   * Delete a file
   */
  deleteFile(callNbr: string, fileName: string): Observable<UploadResponse> {
    return this.http.delete<UploadResponse>(`${this.apiUrl}/FileUpload/DeleteFile/${callNbr}/${fileName}`);
  }

  /**
   * Validate file type and size (matching legacy validation)
   */
  validateFile(file: File): { isValid: boolean; errorMessage: string } {
    const UPLOAD_FILE_TYPES = ['pdf', 'doc', 'docx', 'txt', 'pptx', 'xls', 'rtf', 'ppt', 'xlsx', 'log', 'jpg', 'jpeg'];
    const MAX_FILE_SIZE_MB = 5;

    let isValid = true;
    let errorMessage = '';

    // Check file extension
    const extension = this.getFileExtension(file.name);
    if (!UPLOAD_FILE_TYPES.includes(extension.toLowerCase())) {
      errorMessage += `Invalid file format. File must be of format: ${UPLOAD_FILE_TYPES.join(', ')}\n`;
      isValid = false;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_FILE_SIZE_MB) {
      errorMessage += `File size should be less than or equal to ${MAX_FILE_SIZE_MB} MB\n`;
      isValid = false;
    }

    // Check if filename has spaces
    if (file.name.includes(' ')) {
      errorMessage += `File name should not contain any spaces. Use underscores or hyphens instead.\n`;
      isValid = false;
    }

    return { isValid, errorMessage };
  }

  /**
   * Get file extension (matching legacy GetFileExtension)
   */
  private getFileExtension(fileName: string): string {
    const lastIndex = fileName.lastIndexOf('.');
    return lastIndex >= 0 ? fileName.substring(lastIndex + 1) : '';
  }

  //Testing basic API connectivity
  testApiConnectivity(): Observable<any> {
    // Try a simple GET request to see if the API is reachable
    return this.http.get(`${this.apiUrl}/EquipmentDetails/GetEquipmentFiles?equipId=1`, {
      observe: 'response'
    });
  }

  /**
   * Get API URL for debugging
   */
  getApiUrl(): string {
    return this.apiUrl;
  }
}