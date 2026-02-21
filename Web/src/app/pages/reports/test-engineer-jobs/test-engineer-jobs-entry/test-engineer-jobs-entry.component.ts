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
  EngineerDto
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
  errorMessage = '';
  successMessage = '';
  
  engineersList: EngineerDto[] = [];
  currentRowId?: number;
  
  // Dropdown options (matching legacy)
  workTypeOptions = [
    { value: '', label: '-- Select --' },
    { value: 'Emergency', label: 'Emergency' },
    { value: 'UPS Testing', label: 'UPS Testing' },
    { value: 'PCB Testing', label: 'PCB Testing' },
    { value: 'Asst Others', label: 'Asst Others' },
    { value: 'Retest', label: 'Retest' }
  ];
  
  statusOptions = [
    { value: 'Open', label: 'Open' },
    { value: 'In-Progress', label: 'In-Progress' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Closed', label: 'Closed' }
  ];
  
  locationOptions = [
    { value: '', label: '-- Select Location --' },
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
    this.loadEngineers();
    this.checkRouteParams();
    this.setupFormSubscriptions();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private buildForm(): void {
    const today = new Date().toISOString().split('T')[0];
    
    this.entryForm = this.fb.group({
      rowID: [0],
      jobNumber: [''],
      serialNo: ['', Validators.required],
      workType: ['', Validators.required],
      emergencyETA: [''],
      assignedEngineer: ['', Validators.required],
      location: ['', Validators.required],
      projectedDate: [today, Validators.required],
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

    // Status change handler
    this.entryForm.get('status')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(status => {
        if (status === 'Closed') {
          this.setReadOnlyMode();
        } else {
          this.clearReadOnlyMode();
        }
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
        next: (response: any) => {
          if (response.success) {
            this.engineersList = response.engineers;
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

  private loadNextRowId(): void {
    this.reportService.getTestEngineerJobsNextRowId()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: NextRowIdResponse) => {
          if (response.success) {
            const formattedId = response.nextRowId.toString().padStart(6, '0');
            this.entryForm.patchValue({ jobNumber: formattedId });
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

    if (job.status === 'Closed') {
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
    
    if (status === 'Closed' && (!completedDate || completedDate.trim() === '')) {
      return { completedDateRequired: true };
    }

    if (completedDate && new Date(completedDate) > new Date()) {
      return { completedDateFuture: true };
    }
    
    return null;
  }

  onSave(): void {
    if (this.entryForm.invalid) {
      this.markFormGroupTouched();
      this.displayFormErrors();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValues = this.entryForm.getRawValue();
    const currentUser = this.authService.currentUserValue;
    const userName = currentUser?.username || currentUser?.name || 'System';

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
      qcInspected: formValues.qcInspected || false,
      createdBy: userName,
      modifiedBy: userName
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
            this.successMessage = this.isEditMode 
              ? 'Job updated successfully.' 
              : 'Job created successfully.';
            
            // Redirect to list after a short delay
            setTimeout(() => {
              this.router.navigate(['../../'], { relativeTo: this.route });
            }, 2000);
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
    const errors = this.entryForm.errors;
    if (errors) {
      if (errors['emergencyETARequired']) {
        this.errorMessage = 'Emergency ETA is required when work type is Emergency.';
      } else if (errors['qualityCheckRequired']) {
        this.errorMessage = 'At least one quality check must be completed when status is Closed.';
      } else if (errors['completedDateRequired']) {
        this.errorMessage = 'Completed date is required when status is Closed.';
      } else if (errors['completedDateFuture']) {
        this.errorMessage = 'Completed date cannot be greater than today\'s date.';
      } else {
        this.errorMessage = 'Please correct the form errors and try again.';
      }
    }
  }

  // Navigation method
  goBack(): void {
    this.router.navigate(['/reports/test-engineer-jobs']);
  }

  // Utility methods
  private formatDate(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  }

  private formatDateTimeLocal(dateString: string): string {
    if (!dateString) return '';
    return new Date(dateString).toISOString().slice(0, 16);
  }

  // Getters for template
  get isEmergencyType(): boolean {
    return this.entryForm.get('workType')?.value === 'Emergency';
  }

  get isClosedStatus(): boolean {
    return this.entryForm.get('status')?.value === 'Closed';
  }
}