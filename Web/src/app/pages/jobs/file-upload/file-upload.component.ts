import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { FileUploadService, UploadedFile, EquipmentFileResponseDto } from '../../../core/services/file-upload.service';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnInit {
  @Input() jobId?: string;
  @Input() equipmentId?: number;  // New input for equipment-specific uploads
  @Input() techId?: string;       // New input for tech ID (required for equipment uploads)
  @Output() onClose = new EventEmitter<void>();
  
  callNbr = '';
  selectedFiles: (File | null)[] = [null, null, null, null, null]; // 5 file slots like legacy
  uploadedFiles: UploadedFile[] = [];
  equipmentFiles: EquipmentFileResponseDto[] = []; // Equipment-specific files
  loading = false;
  uploading = false;
  errorMessage = '';
  successMessage = '';
  serviceUnavailable = false; // Always start with service available
  
  // Constants matching legacy (use the service validation method instead)
  private readonly FILE_SIZE_MB = 5;

  // Computed properties
  get isEquipmentMode(): boolean {
    return this.equipmentId !== undefined && this.equipmentId > 0 && !!this.techId;
  }

  get displayTitle(): string {
    return this.isEquipmentMode 
      ? `Upload Files - Equipment ${this.equipmentId}` 
      : `Upload Files - Job ${this.jobId}`;
  }

  constructor(
    private route: ActivatedRoute,
    private fileUploadService: FileUploadService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.callNbr = this.jobId || this.route.snapshot.queryParamMap.get('CallNbr') || '';
    
    console.log('FileUpload component initialized:', {
      isEquipmentMode: this.isEquipmentMode,
      equipmentId: this.equipmentId,
      techId: this.techId,
      callNbr: this.callNbr
    });
    
    // Always use equipment mode since both header and bottom uploads now use equipment functionality
    if (this.equipmentId && this.techId) {
      console.log('FileUpload component - Equipment mode:', this.equipmentId, 'Tech:', this.techId);
      this.loadEquipmentFiles();
    } else {
      console.warn('FileUpload component - No equipment info found, cannot load files');
      this.uploadedFiles = [];
      this.equipmentFiles = [];
    }
  }

  onFileSelected(event: any, index: number): void {
    console.log(`File selection triggered for index ${index}`);
    const file = event.target.files[0];
    console.log(`File selected:`, file ? { name: file.name, size: file.size, type: file.type } : 'null');
    
    if (file) {
      if (this.validateFile(file)) {
        this.selectedFiles[index] = file;
        this.clearMessages();
        console.log(`File successfully selected for slot ${index}:`, file.name);
      } else {
        // Clear the input
        event.target.value = '';
        this.selectedFiles[index] = null;
        console.log(`File validation failed for slot ${index}:`, file.name);
      }
    } else {
      this.selectedFiles[index] = null;
      console.log(`No file selected for slot ${index}`);
    }
  }

  private validateFile(file: File): boolean {
    // Use the service validation method which matches your legacy code
    const validation = this.fileUploadService.validateFile(file);
    if (!validation.isValid) {
      this.errorMessage = validation.errorMessage.replace(/\n/g, '<br>');
      this.toastr.error(this.errorMessage);
      return false;
    }

    // Check if file already exists
    let existingFile = false;
    if (this.isEquipmentMode) {
      existingFile = this.equipmentFiles.some(f => f.fileName === file.name);
    } else {
      existingFile = this.uploadedFiles.some(f => f.name === file.name);
    }
    
    if (existingFile) {
      this.errorMessage = `File '${file.name}' already exists in destination folder`;
      this.toastr.error(this.errorMessage);
      return false;
    }

    // Clear any previous error messages
    this.clearMessages();
    return true;
  }

  private getFileExtension(filename: string): string {
    const lastIndex = filename.lastIndexOf('.');
    return lastIndex >= 0 ? filename.substring(lastIndex + 1) : '';
  }

  async uploadFiles(): Promise<void> {
    // Validate required parameters
    if (this.isEquipmentMode) {
      if (!this.equipmentId || !this.techId) {
        this.errorMessage = 'Equipment ID and Tech ID are required for equipment file upload';
        this.toastr.error(this.errorMessage);
        return;
      }
    } else {
      if (!this.callNbr) {
        this.errorMessage = 'Call number is required for file upload';
        this.toastr.error(this.errorMessage);
        return;
      }
    }

    const filesToUpload = this.selectedFiles.filter((f): f is File => f !== null);
    
    if (filesToUpload.length === 0) {
      this.errorMessage = 'Please select at least one file to upload';
      this.toastr.error(this.errorMessage);
      return;
    }

    this.uploading = true;
    this.clearMessages();
    let successCount = 0;
    let errorMessages: string[] = [];

    try {
      // Upload each file
      for (const file of filesToUpload) {
        try {
          const uploadType = this.isEquipmentMode ? `equipment: ${this.equipmentId}` : `callNbr: ${this.callNbr}`;
          console.log(`Uploading file: ${file.name} for ${uploadType}`);
          
          let result: any;
          // Always use equipment upload if we have equipment info, otherwise use job upload
          if (this.equipmentId && this.techId) {
            console.log(`Using equipment upload: equipmentId=${this.equipmentId}, techId=${this.techId}`);
            result = await this.fileUploadService.uploadEquipmentFile(this.equipmentId, this.techId, file).toPromise();
          } else {
            console.log(`Using job upload: callNbr=${this.callNbr}`);
            result = await this.fileUploadService.uploadFile(this.callNbr, file).toPromise();
          }
          
          if (result?.success) {
            successCount++;
            this.successMessage += `File: ${file.name} uploaded successfully<br>`;
          } else {
            errorMessages.push(`File: ${file.name} - ${result?.message || 'Upload failed'}`);
          }
        } catch (error: any) {
          console.error('File upload error for file:', file.name);
          console.error('Full error details:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            message: error.message,
            error: error.error
          });
          
          // Try to get detailed error message from backend
          let errorDetail = '';
          if (error.error) {
            if (typeof error.error === 'string') {
              errorDetail = error.error;
            } else if (error.error.message) {
              errorDetail = error.error.message;
            } else if (error.error.errors) {
              // Handle validation errors
              const validationErrors = Object.entries(error.error.errors)
                .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
                .join('; ');
              errorDetail = validationErrors;
            }
          }
          
          if (error.status === 404) {
            const expectedEndpoint = this.isEquipmentMode ? 
              `${this.fileUploadService.getApiUrl()}/EquipmentDetails/InsertEquipmentFile` :
              `${this.fileUploadService.getApiUrl()}/EquipmentDetails/InsertEquipmentFile`;
            errorMessages.push(`File upload endpoint not found. Expected: ${expectedEndpoint}`);
          } else if (error.status === 0) {
            errorMessages.push(`Cannot connect to server at: ${this.fileUploadService.getApiUrl()}`);
          } else if (error.status === 400) {
            const detailMsg = errorDetail ? ` - ${errorDetail}` : '';
            errorMessages.push(`File: ${file.name} - Bad Request${detailMsg}`);
          } else {
            const detailMsg = errorDetail ? ` - ${errorDetail}` : '';
            errorMessages.push(`File: ${file.name} - HTTP ${error.status}: ${error.statusText}${detailMsg}`);
          }
        }
      }

      // Show results
      if (successCount > 0) {
        this.toastr.success(`${successCount} file(s) uploaded successfully`);
        this.clearFileInputs();
        
        // Refresh the file list
        if (this.isEquipmentMode) {
          this.loadEquipmentFiles();
        } else {
          this.loadExistingFiles();
        }
      }

      if (errorMessages.length > 0) {
        this.errorMessage = errorMessages.join('<br>');
        // Special handling for 404 errors
        if (errorMessages.some(msg => msg.includes('service not available'))) {
          this.toastr.warning('File upload feature is not available on the server', 'Feature Not Available');
        } else {
          this.toastr.error(`${errorMessages.length} file(s) failed to upload`);
        }
      }

    } catch (error: any) {
      console.error('Upload process error:', error);
      
      // Handle different types of errors
      if (error.status === 404) {
        this.errorMessage = 'File upload endpoint not found. Please check backend implementation.';
        this.toastr.error(this.errorMessage);
      } else if (error.status === 400) {
        this.errorMessage = error.error?.message || 'Invalid request. Please check your files and try again.';
        this.toastr.error(this.errorMessage);
      } else if (error.status === 500) {
        this.errorMessage = 'Server error occurred during upload. Please try again later.';
        this.toastr.error(this.errorMessage);
      } else {
        this.errorMessage = error.error?.message || error.message || 'Upload failed. Please try again.';
        this.toastr.error(this.errorMessage);
      }
    } finally {
      this.uploading = false;
    }
  }

  private clearFileInputs(): void {
    this.selectedFiles = [null, null, null, null, null];
    // Clear file input values
    const fileInputs = document.querySelectorAll('input[type="file"]') as NodeListOf<HTMLInputElement>;
    fileInputs.forEach(input => input.value = '');
  }

  private async loadExistingFiles(): Promise<void> {
    if (!this.callNbr) {
      console.warn('Cannot load files: callNbr is empty');
      this.uploadedFiles = [];
      return;
    }

    try {
      this.loading = true;
      console.log('Loading files for callNbr:', this.callNbr);
      const files = await this.fileUploadService.getUploadedFiles(this.callNbr).toPromise();
      this.uploadedFiles = files || [];
      console.log('Loaded files:', this.uploadedFiles);
    } catch (error: any) {
      console.error('Error loading files:', error);
      
      // Log the error but don't disable the service - let users try uploading
      if (error.status === 404) {
        console.warn('FileUpload API endpoint not found - but upload may still work');
      } else {
        console.warn('Failed to load existing files');
      }
      
      // Always keep service available for uploads
      this.uploadedFiles = [];
    } finally {
      this.loading = false;
    }
  }

  private async loadEquipmentFiles(): Promise<void> {
    if (!this.equipmentId) {
      console.warn('Cannot load equipment files: equipmentId is empty');
      this.equipmentFiles = [];
      return;
    }

    try {
      this.loading = true;
      console.log('Loading equipment files for equipmentId:', this.equipmentId);
      const response = await this.fileUploadService.getEquipmentFiles(this.equipmentId).toPromise();
      this.equipmentFiles = response?.data || [];
      console.log('Loaded equipment files:', this.equipmentFiles);
      
      // If we successfully loaded files, the service is definitely available
      this.serviceUnavailable = false;
    } catch (error: any) {
      console.error('Error loading equipment files:', error);
      
      // Log the error but don't disable the service - let users try uploading
      if (error.status === 404) {
        console.warn('Equipment files API endpoint not found - but upload may still work');
      } else if (error.status === 0) {
        console.warn('Cannot connect to server for file listing');
      } else {
        console.warn('Failed to load existing equipment files');
      }
      
      // Always keep service available for uploads
      this.equipmentFiles = [];
    } finally {
      this.loading = false;
    }
  }

  openFile(file: UploadedFile): void {
    this.fileUploadService.getFileUrl(this.callNbr, file.name).subscribe(
      (url: string) => {
        window.open(url, '_blank');
      },
      (error: any) => {
        this.toastr.error('Failed to open file');
      }
    );
  }

  openEquipmentFile(file: EquipmentFileResponseDto): void {
    if (file.data && file.fileName && file.contentType) {
      this.fileUploadService.downloadEquipmentFile(file.data, file.fileName, file.contentType);
    } else {
      this.toastr.error('File data is not available');
    }
  }

  // Generic method for template usage
  openAnyFile(file: UploadedFile | EquipmentFileResponseDto): void {
    if (this.isEquipmentMode) {
      this.openEquipmentFile(file as EquipmentFileResponseDto);
    } else {
      this.openFile(file as UploadedFile);
    }
  }

  // Get file name for display (handles both types)
  getFileName(file: UploadedFile | EquipmentFileResponseDto): string {
    return this.isEquipmentMode ? (file as EquipmentFileResponseDto).fileName : (file as UploadedFile).name;
  }

  // Get file date for display (handles both types)
  getFileDate(file: UploadedFile | EquipmentFileResponseDto): Date {
    return this.isEquipmentMode ? (file as EquipmentFileResponseDto).createdOn : (file as UploadedFile).creationTime;
  }

  // Get files for display
  get displayFiles(): (UploadedFile | EquipmentFileResponseDto)[] {
    return this.isEquipmentMode ? this.equipmentFiles : this.uploadedFiles;
  }

  // Method to reset service availability (for the Reset Service button)
  resetServiceAvailability(): void {
    this.serviceUnavailable = false;
    this.clearMessages();
    this.toastr.info('Service availability reset. You can now try uploading files.', 'Service Reset');
  }

  // Method to test service by trying to upload (for the Test Service button)
  testServiceAvailability(): void {
    this.clearMessages();
    console.log('Testing service availability...', {
      isEquipmentMode: this.isEquipmentMode,
      equipmentId: this.equipmentId,
      techId: this.techId,
      callNbr: this.callNbr,
      serviceUnavailable: this.serviceUnavailable
    });
    
    this.serviceUnavailable = false; // Allow testing
    this.toastr.success('Service has been enabled. Try selecting and uploading a file.', 'Test Mode Enabled');
  }

  closeWindow(): void {
    // Always emit close event to parent component (for modal usage)
    this.onClose.emit();
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Progress bar simulation (matching legacy JavaScript)
  getUploadProgress(): number {
    return this.uploading ? 75 : 0; // Simplified progress
  }
}