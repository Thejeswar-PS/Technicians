import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { FileUploadService, UploadedFile } from '../../../core/services/file-upload.service';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.scss']
})
export class FileUploadComponent implements OnInit {
  @Input() jobId?: string;
  @Output() closed = new EventEmitter<void>();
  
  callNbr = '';
  selectedFiles: (File | null)[] = [null, null, null, null, null]; // 5 file slots like legacy
  uploadedFiles: UploadedFile[] = [];
  loading = false;
  uploading = false;
  errorMessage = '';
  successMessage = '';
  
  // Constants matching legacy
  private readonly UPLOAD_FILE_TYPES = ['jpg', 'gif', 'doc', 'bmp', 'xls', 'png', 'txt', 'xlsx', 'docx', 'pdf', 'jpeg'];
  private readonly FILE_SIZE_MB = 5;

  constructor(
    private route: ActivatedRoute,
    private fileUploadService: FileUploadService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.callNbr = this.jobId || this.route.snapshot.queryParamMap.get('CallNbr') || '';
    this.loadExistingFiles();
  }

  onFileSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (file) {
      if (this.validateFile(file)) {
        this.selectedFiles[index] = file;
        this.clearMessages();
      } else {
        // Clear the input
        event.target.value = '';
        this.selectedFiles[index] = null;
      }
    }
  }

  private validateFile(file: File): boolean {
    let isValid = true;
    let errorMsg = '';

    // Check file extension
    const extension = this.getFileExtension(file.name);
    if (!this.UPLOAD_FILE_TYPES.includes(extension.toLowerCase())) {
      errorMsg += `Invalid file format. File must be of format: ${this.UPLOAD_FILE_TYPES.join(', ')}<br>`;
      isValid = false;
    }

    // Check file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > this.FILE_SIZE_MB) {
      errorMsg += `File size should be less than or equal to ${this.FILE_SIZE_MB} MB<br>`;
      isValid = false;
    }

    // Check if filename has spaces
    if (file.name.includes(' ')) {
      errorMsg += `File name should not contain spaces. Use underscores or hyphens instead.<br>`;
      isValid = false;
    }

    // Check if file already exists
    if (this.uploadedFiles.some(f => f.name === file.name)) {
      errorMsg += `File '${file.name}' already exists in destination folder<br>`;
      isValid = false;
    }

    if (!isValid) {
      this.errorMessage = errorMsg;
      this.toastr.error(errorMsg);
    }

    return isValid;
  }

  private getFileExtension(filename: string): string {
    const lastIndex = filename.lastIndexOf('.');
    return lastIndex >= 0 ? filename.substring(lastIndex + 1) : '';
  }

  async uploadFiles(): Promise<void> {
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
          const result = await this.fileUploadService.uploadFile(this.callNbr, file).toPromise();
          if (result?.success) {
            successCount++;
            this.successMessage += `File: ${file.name} uploaded successfully<br>`;
          } else {
            errorMessages.push(`File: ${file.name} - ${result?.message || 'Upload failed'}`);
          }
        } catch (error: any) {
          errorMessages.push(`File: ${file.name} - ${error.message || 'Upload failed'}`);
        }
      }

      // Show results
      if (successCount > 0) {
        this.toastr.success(`${successCount} file(s) uploaded successfully`);
        this.clearFileInputs();
        this.loadExistingFiles(); // Refresh the file list
      }

      if (errorMessages.length > 0) {
        this.errorMessage = errorMessages.join('<br>');
        this.toastr.error(`${errorMessages.length} file(s) failed to upload`);
      }

    } catch (error: any) {
      this.errorMessage = error.message || 'Upload failed';
      this.toastr.error(this.errorMessage);
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
    try {
      this.loading = true;
      const files = await this.fileUploadService.getUploadedFiles(this.callNbr).toPromise();
      this.uploadedFiles = files || [];
    } catch (error: any) {
      console.error('Error loading files:', error);
      this.uploadedFiles = [];
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

  closeWindow(): void {
    // Emit close event for modal usage, or close popup for standalone usage
    if (this.jobId) {
      // Modal mode - emit event to parent
      this.closed.emit();
    } else {
      // Standalone popup mode - refresh parent window and close popup (matching legacy behavior)
      if (window.opener) {
        window.opener.location.reload();
      }
      window.close();
    }
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