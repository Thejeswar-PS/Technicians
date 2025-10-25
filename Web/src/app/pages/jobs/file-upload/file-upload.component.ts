import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { FileUploadService, UploadedFile, EquipmentFileResponseDto } from '../../../core/services/file-upload.service';
import { EquipmentService } from '../../../core/services/equipment.service';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnInit, OnChanges {
  @Input() jobId?: string;
  @Input() equipmentId?: number;  // New input for equipment-specific uploads
  @Input() equipmentNo?: string;  // Equipment number for API requirements
  @Input() techId?: string;       // New input for tech ID (required for equipment uploads)
  @Input() techName?: string;     // Tech name for API requirements
  @Input() callNbr?: string;      // New input for call number (required for upload info)
  @Output() onClose = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();
  
  selectedFiles: (File | null)[] = [null, null]; // 2 file slots as requested
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
    // Use equipment mode if we have techId (since that's what we're using for uploads)
    const result = !!this.techId;
    
    return result;
  }

  get displayTitle(): string {
    return this.isEquipmentMode 
      ? `Upload Files - Equipment ${this.equipmentId}` 
      : `Upload Files - Job ${this.jobId}`;
  }

  constructor(
    private route: ActivatedRoute,
    private fileUploadService: FileUploadService,
    private equipmentService: EquipmentService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Use provided callNbr input or fallback to jobId or route param
    const resolvedCallNbr = this.callNbr || this.jobId || this.route.snapshot.queryParamMap.get('CallNbr') || '';
    this.callNbr = resolvedCallNbr;
    
    // Initialize with clean file slots
    this.selectedFiles = [null, null];
    console.log('=== FILE UPLOAD COMPONENT INIT ===');
    console.log('Initial selectedFiles state:', this.selectedFiles.map((f, i) => `${i}: ${f?.name || 'null'}`));
    
    console.log('FileUpload component initialized:', {
      isEquipmentMode: this.isEquipmentMode,
      equipmentId: this.equipmentId,
      equipmentNo: this.equipmentNo,
      techId: this.techId,
      techName: this.techName,
      callNbr: this.callNbr
    });
    
    this.loadFilesIfReady();
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Handle changes to input properties
    if (changes['equipmentId'] || changes['techId'] || changes['callNbr']) {
      console.log('FileUpload component inputs changed:', {
        equipmentId: this.equipmentId,
        techId: this.techId,
        callNbr: this.callNbr
      });
      this.loadFilesIfReady();
    }
  }

  private loadFilesIfReady(): void {
    // Always use equipment mode since both header and bottom uploads now use equipment functionality
    if (this.equipmentId && this.techId && this.callNbr) {
      console.log('FileUpload component - Equipment mode:', this.equipmentId, 'Tech:', this.techId, 'CallNbr:', this.callNbr);
      this.loadEquipmentFiles();
    } else {
      console.warn('FileUpload component - Missing required info:', { equipmentId: this.equipmentId, techId: this.techId, callNbr: this.callNbr });
      
      // Try to load files anyway if we have at least equipmentId
      if (this.equipmentId) {
        console.log('Attempting to load files with equipmentId only:', this.equipmentId);
        this.loadEquipmentFiles();
      } else if (this.techId) {
        this.uploadedFiles = [];
        this.equipmentFiles = [];
      } else {
        this.uploadedFiles = [];
        this.equipmentFiles = [];
      }
    }
  }

  onFileSelected(event: any, index: number): void {
    const file = event.target.files[0];
    console.log(`File selected:`, file ? { name: file.name, size: file.size, type: file.type } : 'null');
    
    if (file) {
      if (this.validateFile(file)) {
        // Ensure we create a completely new array to trigger change detection
        const newSelectedFiles: (File | null)[] = [null, null];
        // Copy existing files except for the current index
        for (let i = 0; i < this.selectedFiles.length; i++) {
          if (i !== index) {
            newSelectedFiles[i] = this.selectedFiles[i];
          }
        }
        // Set the new file for the specific index
        newSelectedFiles[index] = file;
        this.selectedFiles = newSelectedFiles;
        this.clearMessages();
        console.log(`File successfully selected for slot ${index}:`, file.name);
        console.log(`Updated selectedFiles:`, this.selectedFiles.map((f, i) => `${i}: ${f?.name || 'null'}`));
      } else {
        // Clear the input and ensure slot is reset
        event.target.value = '';
        const newSelectedFiles: (File | null)[] = [null, null];
        // Copy existing files except for the current index
        for (let i = 0; i < this.selectedFiles.length; i++) {
          if (i !== index) {
            newSelectedFiles[i] = this.selectedFiles[i];
          }
        }
        this.selectedFiles = newSelectedFiles;
        console.log(`File validation failed for slot ${index}:`, file.name);
      }
    } else {
      // No file selected (user cancelled or cleared), make sure to reset
      event.target.value = '';
      const newSelectedFiles: (File | null)[] = [null, null];
      // Copy existing files except for the current index
      for (let i = 0; i < this.selectedFiles.length; i++) {
        if (i !== index) {
          newSelectedFiles[i] = this.selectedFiles[i];
        }
      }
      this.selectedFiles = newSelectedFiles;
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
          let result: any;
          // Always use equipment upload if we have equipment info, otherwise use job upload
          if (this.equipmentId && this.techId) {
            result = await this.fileUploadService.uploadEquipmentFile(
              this.equipmentId, 
              this.techId, 
              file, 
              this.techId, 
              this.callNbr, 
              this.equipmentNo, 
              this.techName
            ).toPromise();
          } else if (this.callNbr) {
            console.log(`Using job upload: callNbr=${this.callNbr}`);
            result = await this.fileUploadService.uploadFile(this.callNbr, file).toPromise();
          } else {
            console.error('No callNbr available for file upload');
            this.errorMessage += `File: ${file.name} failed - No call number available<br>`;
            continue;
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
        
        console.log('Files uploaded successfully, refreshing file list...');
        
        // Refresh the file list
        if (this.isEquipmentMode) {
          await this.loadEquipmentFiles();
        } else {
          this.loadExistingFiles();
        }
        
        // Removed loadUploadInfo() since upload history grid was removed
        
        console.log('File list refreshed after upload. Current files count:', this.displayFiles.length);
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
    // Reset the selectedFiles array with new null references
    this.selectedFiles = [null, null]; // Only 2 file slots as requested
    
    // Clear each file input by ID to ensure proper reset
    setTimeout(() => {
      for (let i = 0; i < 2; i++) {
        const fileInput = document.getElementById(`fileInput${i}`) as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
          fileInput.files = null;
          console.log(`Cleared file input ${i}`);
        }
      }
    }, 0);
    
    console.log('All file inputs cleared, selectedFiles reset:', this.selectedFiles);
  }

  // Method to clear individual file slot
  clearFileSlot(index: number): void {
    if (index >= 0 && index < 2) {
      console.log(`Clearing file slot ${index}`);
      
      // Create completely new array
      const newSelectedFiles: (File | null)[] = [null, null];
      // Copy existing files except for the current index
      for (let i = 0; i < this.selectedFiles.length; i++) {
        if (i !== index) {
          newSelectedFiles[i] = this.selectedFiles[i];
        }
      }
      this.selectedFiles = newSelectedFiles;
      
      // Clear the specific file input
      setTimeout(() => {
        const fileInput = document.getElementById(`fileInput${index}`) as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
          fileInput.files = null;
          console.log(`DOM input cleared for slot ${index}`);
        }
      }, 0);
      
      console.log(`File slot ${index} cleared. New state:`, this.selectedFiles.map((f, i) => `${i}: ${f?.name || 'null'}`));
    }
  }

  // TrackBy function for ngFor to ensure proper element tracking
  trackByIndex(index: number, item: any): number {
    return index;
  }

  private async loadExistingFiles(): Promise<void> {
    if (!this.callNbr) {
      console.warn('Cannot load files: callNbr is empty');
      this.uploadedFiles = [];
      return;
    }

    try {
      this.loading = true;
      const files = await this.fileUploadService.getUploadedFiles(this.callNbr).toPromise();
      this.uploadedFiles = files || [];
    } catch (error: any) {
      
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
    // Try to get equipmentId - if not available, try to use the first equipment from the page
    let effectiveEquipmentId = this.equipmentId;
    
    if (!effectiveEquipmentId) {
      // Try to get from route params or use a fallback
      const urlParams = new URLSearchParams(window.location.search);
      effectiveEquipmentId = parseInt(urlParams.get('equipmentId') || '0');
      
      if (!effectiveEquipmentId) {
        this.equipmentFiles = [];
        return;
      }
    }

    try {
      this.loading = true;
      console.log('=== LOADING EQUIPMENT FILES ===');
      console.log('Loading equipment files for equipmentId:', effectiveEquipmentId);
      console.log('Component inputs:', {
        equipmentId: this.equipmentId,
        effectiveEquipmentId: effectiveEquipmentId,
        equipmentNo: this.equipmentNo,
        techId: this.techId,
        techName: this.techName,
        callNbr: this.callNbr
      });
      
      const response = await this.fileUploadService.getEquipmentFiles(effectiveEquipmentId).toPromise();
      this.equipmentFiles = response?.data || [];

      // If we successfully loaded files, the service is definitely available
      this.serviceUnavailable = false;
    } catch (error: any) {
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
  // Public method to refresh all data
  public refreshAllData(): void {
    if (this.isEquipmentMode) {
      this.loadEquipmentFiles();
    } else {
      this.loadExistingFiles();
    }
  }

  openFile(file: UploadedFile): void {
    if (!this.callNbr) {
      this.toastr.error('No call number available to open file');
      return;
    }
    
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

  closeWindow(): void {
    // Emit close event for modal usage, or close popup for standalone usage
    this.onClose.emit();
    this.closed.emit();
    
    if (!this.jobId) {
      // Standalone popup mode - close window
      window.close();
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
    const fileName = this.isEquipmentMode ? (file as EquipmentFileResponseDto).fileName : (file as UploadedFile).name;
    return fileName;
  }

  // Get file date for display (handles both types)
  getFileDate(file: UploadedFile | EquipmentFileResponseDto): Date {
    const date = this.isEquipmentMode ? (file as EquipmentFileResponseDto).createdOn : (file as UploadedFile).creationTime;
    return date;
  }

  // Get file created by for display (handles both types)
  getFileCreatedBy(file: UploadedFile | EquipmentFileResponseDto): string {
    const createdBy = this.isEquipmentMode ? (file as EquipmentFileResponseDto).createdBy : this.techId || 'Unknown';
    return createdBy;
  }

  // Download file method
  downloadFile(file: UploadedFile | EquipmentFileResponseDto): void {
    if (this.isEquipmentMode) {
      const equipmentFile = file as EquipmentFileResponseDto;
      // Use existing openAnyFile method or implement specific download logic
      this.openAnyFile(file);
    } else {
      const uploadedFile = file as UploadedFile;
      // Use existing openAnyFile method or implement specific download logic
      this.openAnyFile(file);
    }
  }

  // Get files for display
  get displayFiles(): (UploadedFile | EquipmentFileResponseDto)[] {
    const files = this.isEquipmentMode ? this.equipmentFiles : this.uploadedFiles;
    return files;
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

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Progress bar simulation (matching legacy JavaScript)
  getUploadProgress(): number {
    return this.uploading ? 75 : 0; // Simplified progress
  }
}