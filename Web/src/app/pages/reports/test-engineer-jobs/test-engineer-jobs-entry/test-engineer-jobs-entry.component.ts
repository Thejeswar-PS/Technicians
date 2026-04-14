import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ReportService } from 'src/app/core/services/report.service';
import { AuthService } from 'src/app/modules/auth';
import { 
  SaveUpdateTestEngineerJobsDto,
  TestEngineerJobsEntryDto,
  TestEngineerJobsEntryResponse,
  NextRowIdResponse,
  EngineerDto,
  EmployeeDepartmentResponse,
  TestEngineerJobFileDto,
  FileOperationResponse
} from 'src/app/core/model/test-engineer-jobs.model';

@Component({
  selector: 'app-test-engineer-jobs-entry',
  templateUrl: './test-engineer-jobs-entry.component.html',
  styleUrls: ['./test-engineer-jobs-entry.component.scss']
})
export class TestEngineerJobsEntryComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  entryForm!: FormGroup;
  isLoading = false;
  isEditMode = false;
  isReadOnlyMode = false;
  isCheckingAuthorization = false;
  hasJobEditAccess = true;
  errorMessage = '';
  successMessage = '';
  accessDeniedMessage = '';
  currentUserDepartment = '';
  
  engineersList: EngineerDto[] = [];
  currentRowId?: number;
  selectedFiles: File[] = [];
  existingFiles: TestEngineerJobFileDto[] = [];
  isUploadingFiles = false;
  isLoadingFiles = false;

  private readonly allowedFileTypes = ['jpg', 'gif', 'doc', 'bmp', 'xls', 'png', 'txt', 'xlsx', 'docx', 'pdf', 'jpeg'];
  private readonly maxFileSizeBytes = 10 * 1024 * 1024;
  
  // Dropdown options (matching legacy)
  workTypeOptions = [
    { value: '', label: '-- Select --' },
    { value: 'Emergency', label: 'Emergency' },
    { value: 'UPS Testing', label: 'UPS Testing' },
    { value: 'PCB Testing', label: 'PCB Testing' },
    { value: 'Breaker testing', label: 'Breaker testing' },
    { value: 'Asst Others', label: 'Asst Others' },
    { value: 'Other', label: 'Other' },
    { value: 'Retest', label: 'Retest' }
  ];
  
  statusOptions = [
    { value: 'Open', label: 'Open' },
    { value: 'In-Progress', label: 'In-Progress' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Closed', label: 'Closed' }
  ];
  
  locationOptions = [
    { value: 'DC1', label: 'DC1' },
    { value: 'DC2', label: 'DC2' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private reportService: ReportService,
    private authService: AuthService
  ) {
    this.buildForm();
  }

  ngOnInit(): void {
    this.setupFormSubscriptions();
    this.loadUserAuthorization();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    const today = new Date().toISOString().split('T')[0];
    
    // Form validation rules match legacy TestEngineerJobsEntry.aspx:
    // ALWAYS REQUIRED: assignedEngineer, workType, projectedDate
    // CONDITIONALLY REQUIRED: emergencyETA (if workType='Emergency'), 
    //                        completedDate & qcCheckboxes (if status='Closed')
    // OPTIONAL: serialNo, location (defaults to DC1), notes
    this.entryForm = this.fb.group({
      rowID: [0],
      jobNumber: [''],
      serialNo: [''], // Optional - no validation required
      workType: ['', Validators.required], // Always required
      emergencyETA: [''],
      assignedEngineer: ['', Validators.required], // Always required
      location: ['DC1'], // Optional with default, no validation required
      projectedDate: [today, Validators.required], // Always required
      completedDate: [''],
      descriptionNotes: [''],
      status: ['Open', Validators.required],
      qcCleaned: [false],
      qcTorque: [false],
      qcInspected: [false]
    });

    // Add custom validators
    this.entryForm.addValidators([
      this.emergencyETAValidator.bind(this),
      this.qualityCheckValidator.bind(this),
      this.completedDateValidator.bind(this)
    ]);
  }

  private setupFormSubscriptions(): void {
    // Work type change handler
    this.entryForm.get('workType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(workType => {
        const etaControl = this.entryForm.get('emergencyETA');
        if (workType === 'Emergency') {
          etaControl?.enable();
          etaControl?.setValidators([Validators.required]);
        } else {
          etaControl?.disable();
          etaControl?.clearValidators();
          etaControl?.setValue('');
        }
        etaControl?.updateValueAndValidity();
      });

    // Status change handler - trigger validation when status changes
    this.entryForm.get('status')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        // Revalidate completed date when status changes
        this.entryForm.updateValueAndValidity();
        const completedDateControl = this.entryForm.get('completedDate');
        completedDateControl?.updateValueAndValidity();
      });

    // Completed date change handler - validate and enforce max date when status is Closed
    this.entryForm.get('completedDate')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(dateValue => {
        const status = this.entryForm.get('status')?.value;
        
        // If status is Closed and a future date is selected, clear it
        if (status === 'Closed' && dateValue) {
          const selectedDate = new Date(dateValue);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          selectedDate.setHours(0, 0, 0, 0);
          
          if (selectedDate > today) {
            // Clear the invalid future date
            this.entryForm.get('completedDate')?.setValue('', { emitEvent: false });
            this.errorMessage = 'Future dates are not allowed for completed date when status is Closed. Please select today or an earlier date.';
            
            // Clear error message after 3 seconds
            setTimeout(() => {
              if (this.errorMessage === 'Future dates are not allowed for completed date when status is Closed. Please select today or an earlier date.') {
                this.errorMessage = '';
              }
            }, 3000);
          }
        }
        
        this.entryForm.updateValueAndValidity();
      });
  }

  private checkRouteParams(): void {
    const rowId = this.route.snapshot.paramMap.get('id');
    if (rowId && rowId !== '0') {
      this.isEditMode = true;
      this.currentRowId = parseInt(rowId, 10);
      this.loadJob(this.currentRowId);
    } else {
      this.isEditMode = false;
      this.loadNextRowId();
    }
  }

  private loadEngineers(): void {
    this.reportService.getTestEngineerJobsEngineers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.engineersList = response.engineers || [];
          } else {
            this.errorMessage = 'Failed to load engineers';
          }
        },
        error: (error) => {
          console.error('Error loading engineers:', error);
          this.errorMessage = 'Error loading engineers';
        }
      });
  }

  private loadUserAuthorization(): void {
    const adUserId = this.getCurrentAdUserId();

    if (!adUserId) {
      this.hasJobEditAccess = true;
      this.accessDeniedMessage = '';
      this.loadEngineers();
      this.checkRouteParams();
      return;
    }

    this.isCheckingAuthorization = true;

    this.reportService.getTestEngineerJobsEmployeeDepartment(adUserId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: EmployeeDepartmentResponse) => {
          this.isCheckingAuthorization = false;

          if (!response.success) {
            this.hasJobEditAccess = true;
            this.accessDeniedMessage = '';
            this.loadEngineers();
            this.checkRouteParams();
            return;
          }

          this.currentUserDepartment = response.data?.department || 'Other';
          this.hasJobEditAccess = true;

          this.loadEngineers();
          this.checkRouteParams();
        },
        error: (error) => {
          console.error('Error loading Test Engineer Jobs authorization:', error);
          this.isCheckingAuthorization = false;
          this.hasJobEditAccess = true;
          this.accessDeniedMessage = '';
          this.loadEngineers();
          this.checkRouteParams();
        }
      });
  }

  private loadNextRowId(): void {
    this.reportService.getTestEngineerJobsNextRowId()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: NextRowIdResponse) => {
          if (response.success) {
            const formattedId = response.formattedRowId || response.nextRowId.toString().padStart(6, '0');
            this.currentRowId = response.nextRowId;
            this.entryForm.patchValue({ jobNumber: formattedId });
            this.loadJobFiles();
          }
        },
        error: (error) => {
          console.error('Error loading next row ID:', error);
        }
      });
  }

  private loadJob(rowId: number): void {
    this.isLoading = true;
    this.reportService.getTestEngineerJobById(rowId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: TestEngineerJobsEntryResponse) => {
          this.isLoading = false;
          if (response.success && response.data) {
            this.populateForm(response.data);
            this.loadJobFiles();
          } else {
            this.errorMessage = response.message || 'Failed to load job details';
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error loading job:', error);
          this.errorMessage = 'Error loading job details';
        }
      });
  }

  private populateForm(job: TestEngineerJobsEntryDto): void {
    const formattedId = job.rowID.toString().padStart(6, '0');
    
    this.entryForm.patchValue({
      rowID: job.rowID,
      jobNumber: formattedId,
      serialNo: job.jobNumber,
      workType: job.workType,
      emergencyETA: job.emergencyETA ? this.formatDateTimeLocal(job.emergencyETA) : '',
      assignedEngineer: job.assignedEngineer,
      location: job.location,
      projectedDate: job.projectedDate ? this.formatDate(job.projectedDate) : '',
      completedDate: job.completedDate ? this.formatDate(job.completedDate) : '',
      descriptionNotes: job.descriptionNotes,
      status: job.status,
      qcCleaned: job.qC_Cleaned,
      qcTorque: job.qC_Torque,
      qcInspected: job.qC_Inspected
    });

    // Disable job number in edit mode
    this.entryForm.get('jobNumber')?.disable();

    // Only set read-only if the job was already closed (edit mode with closed status)
    if (job.status === 'Closed' && this.isEditMode) {
      this.setReadOnlyMode();
    }
  }

  private setReadOnlyMode(): void {
    this.isReadOnlyMode = true;
    const formControls = [
      'workType', 'emergencyETA', 'assignedEngineer', 'status',
      'projectedDate', 'completedDate', 'descriptionNotes',
      'qcCleaned', 'qcTorque', 'qcInspected'
    ];

    formControls.forEach(controlName => {
      this.entryForm.get(controlName)?.disable();
    });
  }

  private clearReadOnlyMode(): void {
    this.isReadOnlyMode = false;
    const formControls = [
      'workType', 'assignedEngineer', 'status',
      'projectedDate', 'completedDate', 'descriptionNotes',
      'qcCleaned', 'qcTorque', 'qcInspected'
    ];

    formControls.forEach(controlName => {
      this.entryForm.get(controlName)?.enable();
    });

    // Handle emergency ETA based on work type
    const workType = this.entryForm.get('workType')?.value;
    const etaControl = this.entryForm.get('emergencyETA');
    if (workType === 'Emergency') {
      etaControl?.enable();
    } else {
      etaControl?.disable();
    }
  }

  // Custom Validators
  private emergencyETAValidator(control: AbstractControl): { [key: string]: any } | null {
    const workType = control.get('workType')?.value;
    const emergencyETA = control.get('emergencyETA')?.value;
    
    if (workType === 'Emergency' && (!emergencyETA || emergencyETA.trim() === '')) {
      return { emergencyETARequired: true };
    }
    return null;
  }

  private qualityCheckValidator(control: AbstractControl): { [key: string]: any } | null {
    const status = control.get('status')?.value;
    const qcCleaned = control.get('qcCleaned')?.value;
    const qcTorque = control.get('qcTorque')?.value;
    const qcInspected = control.get('qcInspected')?.value;
    
    // Quality check validation - always required when status is Closed
    if (status === 'Closed' && !qcCleaned && !qcTorque && !qcInspected) {
      return { qualityCheckRequired: true };
    }
    return null;
  }

  private completedDateValidator(control: AbstractControl): { [key: string]: any } | null {
    const status = control.get('status')?.value;
    const completedDate = control.get('completedDate')?.value;
    
    // Required validation when status is Closed
    if (status === 'Closed' && (!completedDate || completedDate.trim() === '')) {
      return { completedDateRequired: true };
    }

    // Future date validation - only apply when status is Closed
    if (status === 'Closed' && completedDate) {
      const selectedDate = new Date(completedDate);
      const today = new Date();
      // Set time to 00:00:00 for accurate date comparison
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate > today) {
        return { completedDateFuture: true };
      }
    }
    
    return null;
  }

  onSave(): void {
    // Force form validation
    this.entryForm.updateValueAndValidity();
    
    // Mark all fields as touched to show validation errors
    this.markFormGroupTouched();
    
    if (this.entryForm.invalid) {
      this.displayFormErrors();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValues = this.entryForm.getRawValue();
    const saveData: SaveUpdateTestEngineerJobsDto = {
      rowID: this.isEditMode ? this.currentRowId! : 0,
      jobNumber: formValues.serialNo,
      workType: formValues.workType,
      emergencyETA: formValues.emergencyETA || null,
      assignedEngineer: formValues.assignedEngineer,
      location: formValues.location,
      projectedDate: formValues.projectedDate || null,
      completedDate: formValues.completedDate || null,
      descriptionNotes: formValues.descriptionNotes || '',
      status: formValues.status,
      qcCleaned: formValues.qcCleaned || false,
      qcTorque: formValues.qcTorque || false,
      qcInspected: formValues.qcInspected || false
    };

    const serviceCall = this.isEditMode 
      ? this.reportService.updateTestEngineerJob(this.currentRowId!, saveData)
      : this.reportService.createTestEngineerJob(saveData);

    serviceCall
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: TestEngineerJobsEntryResponse) => {
          this.isLoading = false;
          if (response.success) {
            if (response.data?.rowID) {
              this.currentRowId = response.data.rowID;
            }

            if (!this.isEditMode && this.currentRowId) {
              this.isEditMode = true;
            }

            this.successMessage = this.isEditMode 
              ? 'Job updated successfully.' 
              : 'Job created successfully.';

            this.loadJobFiles();
          } else {
            this.errorMessage = response.message || 'Failed to save job';
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Error saving job:', error);
          this.errorMessage = 'Error saving job';
        }
      });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.entryForm.controls).forEach(key => {
      const control = this.entryForm.get(key);
      control?.markAsTouched();
    });
  }

  private displayFormErrors(): void {
    const errorMessages: string[] = [];
    const errors = this.entryForm.errors;
    
    // Check individual field validations
    if (this.entryForm.get('workType')?.invalid) {
      errorMessages.push('Work Type is required.');
    }
    
    if (this.entryForm.get('assignedEngineer')?.invalid) {
      errorMessages.push('Assigned Engineer is required.');
    }
    
    if (this.entryForm.get('projectedDate')?.invalid) {
      errorMessages.push('Projected Date is required.');
    }
    
    // Check form-level validators
    if (errors) {
      if (errors['emergencyETARequired']) {
        errorMessages.push('Emergency ETA is required when Work Type is Emergency.');
      }
      if (errors['completedDateRequired']) {
        errorMessages.push('Completed Date is required when Status is Closed.');
      }
      if (errors['qualityCheckRequired']) {
        errorMessages.push('At least one Quality Check (Cleaned, Torque, or Inspected) is required when Status is Closed.');
      }
      if (errors['completedDateFuture']) {
        errorMessages.push('Completed Date cannot be in the future.');
      }
    }
    
    // Build error message
    if (errorMessages.length > 0) {
      this.errorMessage = 'Please fix the following:\n' + errorMessages.map((msg, idx) => `${idx + 1}. ${msg}`).join('\n');
    } else {
      this.errorMessage = 'Please correct the form errors and try again.';
    }
    
    // Build error message
    if (errorMessages.length > 0) {
      this.errorMessage = 'Please fix the following:\n' + errorMessages.map((msg, idx) => `${idx + 1}. ${msg}`).join('\n');
    } else {
      this.errorMessage = 'Please correct the form errors and try again.';
    }
  }

  // Navigation method
  goBack(): void {
    this.router.navigate(['/reports/test-engineer-jobs']);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;

    if (!files || files.length === 0) {
      return;
    }

    const validationErrors: string[] = [];

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const extension = file.name.split('.').pop()?.toLowerCase() || '';

      if (!this.allowedFileTypes.includes(extension)) {
        validationErrors.push(`${file.name}: invalid file type`);
        continue;
      }

      if (file.size > this.maxFileSizeBytes) {
        validationErrors.push(`${file.name}: exceeds 10MB limit`);
        continue;
      }

      const alreadySelected = this.selectedFiles.some(selected => selected.name.toLowerCase() === file.name.toLowerCase());
      const alreadyUploaded = this.existingFiles.some(uploaded => uploaded.fileName.toLowerCase() === file.name.toLowerCase());

      if (alreadySelected || alreadyUploaded) {
        validationErrors.push(`${file.name}: file with same name already exists`);
        continue;
      }

      this.selectedFiles.push(file);
    }

    if (validationErrors.length > 0) {
      this.errorMessage = validationErrors.join('\n');
    }

    if (this.selectedFiles.length > 0 && !this.isUploadingFiles) {
      this.uploadSelectedFiles();
    }

    input.value = '';
  }

  removeSelectedFile(index: number): void {
    this.selectedFiles.splice(index, 1);
  }

  uploadSelectedFiles(): void {
    const jobId = this.currentRowId;
    const folderKey = this.getPreferredUploadFolderKey();

    if (!jobId || !folderKey) {
      this.errorMessage = 'Job details are not available for file upload.';
      return;
    }

    if (this.selectedFiles.length === 0) {
      this.errorMessage = 'Please select at least one file to upload.';
      return;
    }

    this.isUploadingFiles = true;
    this.errorMessage = '';

    const filesToUpload = [...this.selectedFiles];
    const failedUploads: string[] = [];

    const uploadNext = (fileIndex: number): void => {
      if (fileIndex >= filesToUpload.length) {
        this.isUploadingFiles = false;
        this.selectedFiles = [];

        if (failedUploads.length > 0) {
          this.errorMessage = failedUploads.join('\n');
        } else {
          this.successMessage = 'File(s) uploaded successfully.';
        }

        this.loadJobFiles();
        return;
      }

      const file = filesToUpload[fileIndex];

      this.reportService.uploadTestEngineerJobFile(jobId, folderKey, file)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: FileOperationResponse) => {
            if (!response.success) {
              failedUploads.push(`${file.name}: ${response.message || 'Upload failed'}`);
            }

            uploadNext(fileIndex + 1);
          },
          error: (error) => {
            console.error('Error uploading file:', error);
            failedUploads.push(`${file.name}: upload failed`);
            uploadNext(fileIndex + 1);
          }
        });
    };

    uploadNext(0);
  }

  loadJobFiles(): void {
    const jobId = this.currentRowId;
    const folderKeys = this.getCandidateFolderKeys();

    if (!jobId || folderKeys.length === 0) {
      this.existingFiles = [];
      return;
    }

    this.isLoadingFiles = true;

    const tryLoad = (index: number): void => {
      if (index >= folderKeys.length) {
        this.isLoadingFiles = false;
        this.existingFiles = [];
        return;
      }

      const folderKey = folderKeys[index];

      this.reportService.getTestEngineerJobFiles(jobId, folderKey)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: FileOperationResponse) => {
            const files = this.extractFiles(response);

            if (response.success && files.length > 0) {
              this.isLoadingFiles = false;
              this.existingFiles = files;
              return;
            }

            tryLoad(index + 1);
          },
          error: (error) => {
            console.error('Error loading job files:', error);
            tryLoad(index + 1);
          }
        });
    };

    tryLoad(0);
  }

  downloadFile(file: TestEngineerJobFileDto): void {
    this.reportService.downloadTestEngineerJobFile(file.filePath)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const anchor = document.createElement('a');
          anchor.href = url;
          anchor.download = file.fileName;
          anchor.click();
          window.URL.revokeObjectURL(url);
        },
        error: (error) => {
          console.error('Error downloading file:', error);
          this.errorMessage = 'Failed to download file.';
        }
      });
  }

  deleteFile(file: TestEngineerJobFileDto): void {
    if (!confirm(`Delete file '${file.fileName}'?`)) {
      return;
    }

    this.reportService.deleteTestEngineerJobFile(file.filePath)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: FileOperationResponse) => {
          if (response.success) {
            this.existingFiles = this.extractFiles(response);
            this.successMessage = 'File deleted successfully.';
          } else {
            this.errorMessage = response.message || 'Failed to delete file.';
          }
        },
        error: (error) => {
          console.error('Error deleting file:', error);
          this.errorMessage = 'Failed to delete file.';
        }
      });
  }

  getFileSizeFormatted(bytes: number): string {
    if (bytes === 0) return '0 B';

    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const size = bytes / Math.pow(1024, index);

    return `${size.toFixed(index === 0 ? 0 : 2)} ${units[index]}`;
  }

  private getPreferredUploadFolderKey(): string {
    const folderKeys = this.getCandidateFolderKeys();
    return folderKeys[0] || '';
  }

  private getCandidateFolderKeys(): string[] {
    const serialNo = (this.entryForm.get('serialNo')?.value || '').toString().trim();
    const formattedJobNumber = (this.entryForm.get('jobNumber')?.value || '').toString().trim();
    const rowId = this.currentRowId ? this.currentRowId.toString() : '';
    const paddedRowId = this.currentRowId ? this.currentRowId.toString().padStart(6, '0') : '';

    return [serialNo, formattedJobNumber, rowId, paddedRowId].filter((value, index, values) =>
      !!value && values.indexOf(value) === index
    );
  }

  private extractFiles(response: any): TestEngineerJobFileDto[] {
    const rawFiles = response?.files || response?.Files || [];

    if (!Array.isArray(rawFiles)) {
      return [];
    }

    return rawFiles.map((file: any) => ({
      fileName: file?.fileName || file?.FileName || '',
      filePath: file?.filePath || file?.FilePath || '',
      fileSize: Number(file?.fileSize ?? file?.FileSize ?? 0),
      uploadedOn: file?.uploadedOn || file?.UploadedOn || '',
      uploadedBy: file?.uploadedBy || file?.UploadedBy || ''
    })).filter((file: TestEngineerJobFileDto) => !!file.fileName && !!file.filePath);
  }

  // Date validation handler
  onCompletedDateChange(event: any): void {
    const status = this.entryForm.get('status')?.value;
    const selectedDate = event.target.value;
    
    if (status === 'Closed' && selectedDate) {
      const selected = new Date(selectedDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selected.setHours(0, 0, 0, 0);
      
      if (selected > today) {
        // Prevent future date
        event.target.value = '';
        this.entryForm.get('completedDate')?.setValue('', { emitEvent: false });
        this.errorMessage = 'Future dates are not allowed when status is Closed. Please select today or an earlier date.';
        
        setTimeout(() => {
          if (this.errorMessage?.includes('Future dates are not allowed')) {
            this.errorMessage = '';
          }
        }, 3000);
      }
    }
  }

  // Utility methods
  private formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  }

  formatDateTimeLocal(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toISOString().slice(0, 16);
  }

  private getCurrentAdUserId(): string {
    const currentUser = this.authService.currentUserValue || {};
    const userData = this.getStoredUserData();
    const rawUserId = (
      currentUser?.windowsID ||
      currentUser?.windowsId ||
      currentUser?.username ||
      currentUser?.userName ||
      userData?.windowsID ||
      userData?.windowsId ||
      userData?.username ||
      userData?.userName ||
      ''
    ).toString();

    return this.normalizeAdUserId(rawUserId);
  }

  private getStoredUserData(): any {
    try {
      return JSON.parse(localStorage.getItem('userData') || '{}');
    } catch {
      return {};
    }
  }

  private normalizeAdUserId(value: string): string {
    const trimmedValue = (value || '').trim();
    if (!trimmedValue) {
      return '';
    }

    const withoutDomain = trimmedValue.split('\\').pop() || trimmedValue;
    return withoutDomain.split('/').pop()?.trim() || withoutDomain;
  }


  // Getters for template
  get isEmergencyType(): boolean {
    return this.entryForm.get('workType')?.value === 'Emergency';
  }

  get isClosedStatus(): boolean {
    return this.entryForm.get('status')?.value === 'Closed';
  }

  get maxCompletedDate(): string {
  if (!this.isClosedStatus) return '';

  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
}