import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonService } from 'src/app/core/services/common.service';
import { ReportService } from 'src/app/core/services/report.service';
import { AuthService } from 'src/app/modules/auth';
import { 
  StrippedUnitsStatusDto,
  StrippedUnitApiResponse,
  StrippedPartsDetailDto,
  StrippedPartsInUnitDto,
  StrippedPartsInUnitResponse,
  StrippedPartsInUnitApiResponse,
  KEEP_THROW_OPTIONS,
  StripPartCodeDto,
  StripPartCodeApiResponse
} from 'src/app/core/model/stripped-units-status.model';
import { ToastrService } from 'ngx-toastr';
import { Subscription, finalize } from 'rxjs';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-stripped-unit-info',
  templateUrl: './stripped-unit-info.component.html',
  styleUrls: ['./stripped-unit-info.component.scss']
})
export class StrippedUnitInfoComponent implements OnInit, OnDestroy {

  // Form for searching/editing unit info
  unitInfoForm: FormGroup;
  searchForm: FormGroup;
  strippedPartsForm: FormGroup;

  // Data properties
  currentUnit: StrippedUnitsStatusDto | null = null;
  strippedParts: StrippedPartsDetailDto[] = [];
  currentStrippedPart: StrippedPartsDetailDto | null = null;
  stripPartCodes: StripPartCodeDto[] = [];
  currentStatusValue: string = '';
  isEditMode: boolean = false;
  isNewUnit: boolean = false;
  isPartsEditMode: boolean = false;
  isNewPart: boolean = false;

  // Loading and error states
  isLoading: boolean = false;
  isSaving: boolean = false;
  isLoadingParts: boolean = false;
  isSavingPart: boolean = false;
  isLoadingStripPartCodes: boolean = false;
  isDeleting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  fromAddParts: boolean = false; // Track if coming from Add Parts
  unitContext: any = null; // Store unit details from URL parameters
  partsErrorMessage: string = '';
  partsSuccessMessage: string = '';

  // UI state
  showPartsSection: boolean = false;

  // Subscription management
  private subscriptions: Subscription = new Subscription();

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private commonService: CommonService,
    private authService: AuthService,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    // Initialize forms first
    this.initializeForms();
    
    // Check authentication and set user info immediately
    this.checkUserAuthentication();
    
    // Load necessary data
    this.loadStripPartCodes();
    this.checkRouteParams();
  }
  
  private checkUserAuthentication(): void {
    const currentUser = this.authService.currentUserValue;
    
    if (currentUser?.username) {
      // Immediately set user info in the form
      setTimeout(() => {
        this.initializePartsFormDefaults();
      }, 100); // Small delay to ensure form is ready
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeForms(): void {
    this.unitInfoForm = this.fb.group({
      rowIndex: [{ value: '', disabled: true }],
      make: [''], // Editable
      model: [''], // Editable
      serialNo: [''], // Editable
      kva: [''], // Editable
      voltage: [''], // Editable
      poNumber: [''], // Maps to "Purchase Order" - editable
      shippingPO: [''], // Maps to "Shipping PO" - editable
      unitCost: [''], // Maps to "Unit Cost" - editable
      shipCost: [''], // Maps to "Ship Cost" - editable
      strippedBy: [''], // Maps to "Stripped by" - editable
      putAwayBy: [''], // Maps to "Put Away by" - editable
      status: [''], // Maps to "Status" - editable dropdown
      partsLocation: [''], // Maps to "Stripped Parts Location" - editable
      createdOn: [{ value: '', disabled: true }],
      lastModifiedOn: [{ value: '', disabled: true }],
      stripExists: [{ value: 0, disabled: true }]
    });

    this.strippedPartsForm = this.fb.group({
      masterRowIndex: [0],
      rowIndex: [0],
      dcgPartGroup: ['', Validators.required], // Add required validation back
      dcgPartNo: ['', Validators.required],    // Add required validation back
      partDesc: ['', Validators.required],     // Add required validation back
      keepThrow: ['Keep', Validators.required], // Add required validation back
      stripNo: [1, [Validators.required, Validators.min(1)]], // Add required and min validation with default value
      lastModifiedBy: [''], // Remove required validation - will be set during save
      createdBy: [''],
      createdOn: [''],
      lastModifiedOn: ['']
    });

    this.searchForm = this.fb.group({
      searchType: ['rowIndex'],
      searchValue: ['', Validators.required]
    });
    
    // Add form value changes subscription to track field interactions
    // Initialize form with default user info
    this.initializePartsFormDefaults();
  }
  
  private initializePartsFormDefaults(): void {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser?.username) {
      return;
    }
    
    const defaultValues = {
      masterRowIndex: 0, // Use 0 for direct additions (backend now allows it)
      stripNo: 1, // Default strip number
      lastModifiedBy: currentUser?.username || 'System',
      createdBy: currentUser?.username || 'System',
      keepThrow: 'Keep' // Set default value
    };
    

    this.strippedPartsForm.patchValue(defaultValues);
    
    // Ensure the form recognizes the changes
    this.strippedPartsForm.updateValueAndValidity();
  }

  private checkRouteParams(): void {
    this.route.queryParams.subscribe(params => {

      if (params['rowIndex'] || params['RowIndex']) {
        // Support both lowercase and uppercase (legacy uses RowIndex)
        const rowIndex = parseInt(params['rowIndex'] || params['RowIndex']);
        const fromAddParts = params['fromAddParts'] === 'true';
        

        // Capture additional unit details from URL parameters
        const unitDetails = {
          make: params['Make'],
          model: params['Model'],
          serialNo: params['SNo'],
          kva: params['KVA']
        };
        
        this.loadUnitByRowIndex(rowIndex);
        
        // If coming from Add Parts, enable field editing and store unit context
        if (fromAddParts) {
          this.fromAddParts = true;
          this.isEditMode = true; // Automatically enable edit mode when coming from Add Parts
          
          // Store unit details for context display
          this.unitContext = unitDetails;
          
          // Auto-show parts section when coming from Add Parts
          setTimeout(() => {
            this.showPartsSection = true;
          }, 1000);
        }
      } else if (params['new'] === 'true') {
        this.startNewUnit();
      } else if (params['fromAddParts'] === 'true') {
        // Handle case where user wants to add parts without a specific unit
        // Auto-show parts section when coming from Add Parts without specific unit
        setTimeout(() => {
          this.showPartsSection = true;
        }, 1000);
      }
      // Legacy also passes Make, Model, SNo, KVA for context but we get them from the API
    });
  }

  onSearch(): void {
    if (this.searchForm.invalid) {
      this.markFormGroupTouched(this.searchForm);
      return;
    }

    const searchType = this.searchForm.value.searchType;
    const searchValue = this.searchForm.value.searchValue;

    if (searchType === 'rowIndex') {
      this.loadUnitByRowIndex(parseInt(searchValue));
    } else if (searchType === 'serialNo') {
      this.loadUnitBySerialNumber(searchValue);
    }
  }

  private loadUnitByRowIndex(rowIndex: number): void {
    if (rowIndex <= 0) {
      this.toastr.error('Please enter a valid Row Index');
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const subscription = this.reportService.getStrippedUnitByRowIndex(rowIndex)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response: StrippedUnitApiResponse) => {
          if (response.success && response.data) {
            // The API returns a single unit directly in the data property for GetStrippedUnit endpoint
            this.currentUnit = response.data;
            this.loadUnitToForm();
            this.loadStrippedPartsForUnit(); // Load associated parts
            this.isEditMode = false;
          } else {
            this.errorMessage = response.message || 'Unit not found';
            this.currentUnit = null;
          }
        },
        error: (error) => {
          this.errorMessage = error.error?.message || `Failed to load unit information (Status: ${error.status})`;
          this.toastr.error(this.errorMessage);
        }
      });

    this.subscriptions.add(subscription);
  }

  /**
   * Loads stripped parts for the current unit
   */
  private loadStrippedPartsForUnit(): void {
    if (!this.currentUnit) {
      return;
    }
    this.isLoadingParts = true;
    this.partsErrorMessage = '';

    const subscription = this.reportService.getStrippedPartsInUnit(this.currentUnit.rowIndex)
      .pipe(finalize(() => this.isLoadingParts = false))
      .subscribe({
        next: (response: StrippedPartsInUnitApiResponse) => {
          if (response.success && response.data) {
            // Use PartsDetails from the new API structure
            this.strippedParts = response.data.partsDetails || [];
            
            if (this.strippedParts.length === 0 || !response.data.hasData) {
              this.partsErrorMessage = 'No stripped parts found for this unit.';
            }
          } else {
            this.partsErrorMessage = response.error || response.message || 'Failed to load stripped parts';
            this.strippedParts = [];
          }
        },
        error: (error: any) => {
          this.partsErrorMessage = 'Error loading stripped parts: ' + (error.message || 'Unknown error');
          this.strippedParts = [];
          this.toastr.error('Failed to load stripped parts');
        }
      });

    this.subscriptions.add(subscription);
  }

  private loadUnitBySerialNumber(serialNo: string): void {
    // This would require a new API endpoint or filtering all units
    this.toastr.info('Search by Serial Number coming soon');
  }

  private loadUnitToForm(): void {
    if (!this.currentUnit) return;

    const trimmedStatus = this.currentUnit.status ? this.currentUnit.status.trim() : '';
    const trimmedVoltage = this.currentUnit.voltage ? this.currentUnit.voltage.trim() : '';
    
    this.unitInfoForm.patchValue({
      rowIndex: this.currentUnit.rowIndex,
      make: this.currentUnit.make,
      model: this.currentUnit.model,
      serialNo: this.currentUnit.serialNo,
      kva: this.currentUnit.kva,
      voltage: trimmedVoltage,
      poNumber: this.currentUnit.poNumber,
      shippingPO: this.currentUnit.shippingPO,
      unitCost: this.currentUnit.unitCost,
      shipCost: this.currentUnit.shipCost,
      strippedBy: this.currentUnit.strippedBy,
      putAwayBy: this.currentUnit.putAwayBy,
      partsLocation: this.currentUnit.partsLocation,
      createdOn: this.currentUnit.createdOn ? new Date(this.currentUnit.createdOn).toLocaleString() : '',
      lastModifiedOn: this.currentUnit.lastModifiedOn ? new Date(this.currentUnit.lastModifiedOn).toLocaleString() : '',
      stripExists: this.currentUnit.stripExists
    });
    
    // Set status separately with setValue to force update
    const statusControl = this.unitInfoForm.get('status');
    statusControl?.setValue(trimmedStatus);
    statusControl?.markAsTouched();
    statusControl?.updateValueAndValidity();
    
    // Force update the status field
    this.cdr.detectChanges();
    
    // Double-check the status value after change detection
    setTimeout(() => {
      // Force another change detection
      this.cdr.detectChanges();
    }, 100);
    
    // Set the currentStatusValue for the select binding
    this.currentStatusValue = this.currentUnit.status || '';
    
    // Set proper form control states based on edit mode
    const editableFields = ['make', 'model', 'serialNo', 'kva', 'voltage', 'status', 'strippedBy', 'putAwayBy', 'partsLocation'];
    if (this.isEditMode || this.isNewUnit || this.fromAddParts) {
      editableFields.forEach(field => {
        this.unitInfoForm.get(field)?.enable();
      });
    } else {
      editableFields.forEach(field => {
        this.unitInfoForm.get(field)?.disable();
      });
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  private getFormValidationErrors() {
    const errors: any = {};
    Object.keys(this.strippedPartsForm.controls).forEach(key => {
      const controlErrors = this.strippedPartsForm.get(key)?.errors;
      if (controlErrors) {
        errors[key] = controlErrors;
      }
    });
    return errors;
  }

  // Other existing methods would continue here...
  // I'll add the rest in the next replacement

  isFieldEditable(): boolean {
    return this.isEditMode || this.isNewUnit || this.fromAddParts;
  }

  // Check if a specific field should be readonly regardless of edit mode
  isFieldAlwaysReadonly(fieldName: string): boolean {
    const alwaysReadonlyFields = ['poNumber', 'shippingPO', 'unitCost', 'shipCost', 'rowIndex', 'createdOn', 'lastModifiedOn', 'stripExists'];
    return alwaysReadonlyFields.includes(fieldName);
  }

  // Combined method for field readonly state
  isFieldReadonly(fieldName: string): boolean {
    return this.isFieldAlwaysReadonly(fieldName) || !this.isFieldEditable();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.unitInfoForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.unitInfoForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['min']) return `${fieldName} must be greater than 0`;
      if (field.errors['email']) return 'Invalid email format';
    }
    return '';
  }

  startNewUnit(): void {
    this.isNewUnit = true;
    this.isEditMode = true;
    this.currentUnit = null;
    this.unitInfoForm.reset();
    this.resetPartsData();
    this.errorMessage = '';
    this.successMessage = 'Enter new unit information below';
  }

  onEdit(): void {
    this.isEditMode = true;
    this.errorMessage = '';
    
    // Enable editable form controls
    const editableFields = ['make', 'model', 'serialNo', 'kva', 'voltage', 'status', 'strippedBy', 'putAwayBy', 'partsLocation'];
    editableFields.forEach(field => {
      this.unitInfoForm.get(field)?.enable();
    });
  }

  onCancel(): void {
    if (this.fromAddParts) {
      // If coming from Add Parts, navigate back to the previous page
      this.router.navigate(['/reports/stripped-units-status']);
      return;
    }
    
    this.isEditMode = false;
    this.isNewUnit = false;
    this.loadUnitToForm();
    this.errorMessage = '';
    
    // Disable editable form controls when not in edit mode
    const editableFields = ['make', 'model', 'serialNo', 'kva', 'voltage', 'status', 'strippedBy', 'putAwayBy', 'partsLocation'];
    editableFields.forEach(field => {
      this.unitInfoForm.get(field)?.disable();
    });
  }

  onBack(): void {
    this.router.navigate(['/reports/stripped-units-status']);
  }

  onSave(): void {
    if (this.unitInfoForm.invalid) {
      this.markFormGroupTouched(this.unitInfoForm);
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    // Enable all controls temporarily to get their values
    const editableFields = ['make', 'model', 'serialNo', 'kva', 'voltage', 'status', 'strippedBy', 'putAwayBy', 'partsLocation'];
    editableFields.forEach(field => {
      this.unitInfoForm.get(field)?.enable();
    });
    
    const formData = this.unitInfoForm.getRawValue();
    const currentUser = this.authService.currentUserValue;
    
    const unitData: StrippedUnitsStatusDto = {
      ...formData,
      rowIndex: this.isNewUnit ? 0 : formData.rowIndex,
      lastModifiedBy: currentUser?.username || 'System',
      lastModifiedOn: new Date(),
      status: this.currentStatusValue || formData.status, // Use the currentStatusValue if available
      // Ensure required fields are not empty
      make: formData.make || '',
      serialNo: formData.serialNo || '',
      model: formData.model || '',
      kva: formData.kva || '',
      voltage: formData.voltage || '',
      strippedBy: formData.strippedBy || '',
      putAwayBy: formData.putAwayBy || '',
      partsLocation: formData.partsLocation || ''
    };

    // Validate required fields before sending
    if (!unitData.make?.trim()) {
      this.toastr.error('Make is required');
      return;
    }
    if (!unitData.serialNo?.trim()) {
      this.toastr.error('Serial Number is required');
      return;
    }
    if (!unitData.status?.trim()) {
      this.toastr.error('Status is required');
      return;
    }
    if (!unitData.lastModifiedBy?.trim()) {
      this.toastr.error('User information is required');
      return;
    }

    const apiCall = this.isNewUnit 
      ? this.reportService.saveUpdateStrippingUnit(unitData)
      : this.reportService.updateStrippingUnitByRowIndex(unitData.rowIndex, unitData);

    const subscription = apiCall
      .pipe(finalize(() => {
        this.isSaving = false;
        // Restore disabled state for fields if not in edit mode
        if (!this.isEditMode && !this.isNewUnit) {
          editableFields.forEach(field => {
            this.unitInfoForm.get(field)?.disable();
          });
        }
      }))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.successMessage = response.message || (this.isNewUnit ? 'Unit created successfully' : 'Unit updated successfully');
            this.toastr.success(this.successMessage);
            
            // Don't disable edit mode if coming from Add Parts - keep it editable
            if (!this.fromAddParts) {
              this.isEditMode = false;
              
              // Disable editable fields after successful save (only if not from Add Parts)
              const editableFields = ['make', 'model', 'serialNo', 'kva', 'voltage', 'status', 'strippedBy', 'putAwayBy', 'partsLocation'];
              editableFields.forEach(field => {
                this.unitInfoForm.get(field)?.disable();
              });
            } else {
              // If from Add Parts, show a message encouraging parts addition
              this.successMessage += ' - You can now add parts information below.';
            }
            
            if (this.isNewUnit && response.rowIndex) {
              // Load the newly created unit
              this.isNewUnit = false;
              this.loadUnitByRowIndex(response.rowIndex);
            } else if (this.currentUnit) {
              // Reload current unit to get updated data
              this.loadUnitByRowIndex(this.currentUnit.rowIndex);
            }
          } else {
            this.errorMessage = response.message || 'Failed to save unit';
            this.toastr.error(this.errorMessage);
          }
        },
        error: (error: any) => {
          this.errorMessage = error.error?.message || 'Failed to save unit';
          this.toastr.error(this.errorMessage);
        }
      });

    this.subscriptions.add(subscription);
  }

  getStatusOptions() {
    // Return status options matching actual database values
    return [
      { value: 'Inp', label: 'In Progress' },
      { value: 'COM', label: 'Completed' },
      { value: 'NCR', label: 'Needs Components for Repair' },
      { value: 'MPJ', label: 'Missing Parts from Job' }
    ];
  }

  onStatusSelectChange(event: any): void {
    const selectedValue = event.target.value;
    this.currentStatusValue = selectedValue;
    
    // Update the form control directly
    this.unitInfoForm.get('status')?.setValue(selectedValue);
    this.unitInfoForm.get('status')?.updateValueAndValidity();
    
    // Mark the field as touched for validation
    this.unitInfoForm.get('status')?.markAsTouched();
    
    // Force change detection
    this.cdr.detectChanges();
  }

  getCurrentStatusLabel(): string {
    const currentValue = this.unitInfoForm.get('status')?.value;
    const option = this.getStatusOptions().find(opt => opt.value === currentValue);
    
    // If no match found, default to In Progress
    if (!option) {
      // Set default status to In Progress if no value or no match
      if (!currentValue) {
        this.unitInfoForm.get('status')?.setValue('Inp');
        return 'In Progress';
      }
      return `DB Value: "${currentValue}"`;
    }
    
    return option ? option.label : 'In Progress';
  }

  updateStatus(value: string): void {
    // Update the reactive form control
    const statusControl = this.unitInfoForm.get('status');
    statusControl?.setValue(value);
    statusControl?.updateValueAndValidity();
    statusControl?.markAsTouched();
    
    // Update component property
    this.currentStatusValue = value;
  }

  onStatusChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    
    // Update the reactive form control
    const statusControl = this.unitInfoForm.get('status');
    statusControl?.setValue(value);
    statusControl?.updateValueAndValidity();
    statusControl?.markAsTouched();
    
    // Update component property
    this.currentStatusValue = value;
  }

  private loadStripPartCodes(): void {
    this.isLoadingStripPartCodes = true;

    const subscription = this.reportService.getStripPartCodes()
      .pipe(finalize(() => this.isLoadingStripPartCodes = false))
      .subscribe({
        next: (response: StripPartCodeApiResponse) => {
          if (response.success) {
            this.stripPartCodes = response.data || [];
          } else {
            this.toastr.error(response.message || 'Failed to load strip part codes');
          }
        },
        error: (error) => {
          this.toastr.error('Failed to load strip part codes');
        }
      });

    this.subscriptions.add(subscription);
  }

  onDelete(): void {
    if (!this.currentUnit || !confirm('Are you sure you want to delete this unit?')) {
      return;
    }

    this.isDeleting = true;
    const subscription = this.reportService.deleteStrippedUnit(this.currentUnit.rowIndex)
      .pipe(finalize(() => this.isDeleting = false))
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success('Unit deleted successfully');
            this.router.navigate(['/reports/stripped-units-status']);
          } else {
            this.toastr.error(response.message || 'Failed to delete unit');
          }
        },
        error: (error) => {
          this.toastr.error('Failed to delete unit');
        }
      });

    this.subscriptions.add(subscription);
  }

  // Stripped Parts Methods

  onAddStrippedPart(): void {
    if (!this.currentUnit) {
      this.toastr.error('Please load a unit first');
      return;
    }

    this.isNewPart = true;
    this.isPartsEditMode = true;
    this.currentStrippedPart = null;
    this.resetPartsForm();
    this.partsSuccessMessage = '';
    this.partsErrorMessage = '';

    // Set master row index from current unit
    this.strippedPartsForm.patchValue({
      masterRowIndex: this.currentUnit.rowIndex,
      rowIndex: 0 // New part will get assigned by backend
    });
  }

  onEditStrippedPart(part: StrippedPartsDetailDto): void {
    this.isNewPart = false;
    this.isPartsEditMode = true;
    this.currentStrippedPart = part;
    this.loadPartToForm(part);
    this.partsSuccessMessage = '';
    this.partsErrorMessage = '';
  }

  onCancelPartEdit(): void {
    this.isPartsEditMode = false;
    this.isNewPart = false;
    this.currentStrippedPart = null;
    this.resetPartsForm();
    this.partsSuccessMessage = '';
    this.partsErrorMessage = '';
  }

  onSaveStrippedPart(): void {
    // Get current user early to avoid redeclaration
    const currentUser = this.authService.currentUserValue;
    
    // Clear previous messages
    this.partsErrorMessage = '';
    this.partsSuccessMessage = '';
    
    // FORCE user info to be set properly
    const username = currentUser?.username || 'System';
    if (!username || username.trim() === '') {
      this.toastr.error('User authentication required - please log in again');
      return;
    }
    
    // Force patch the user info
    this.strippedPartsForm.patchValue({
      lastModifiedBy: username,
      createdBy: username
    });
    
    // Get the raw form values
    const formData = this.strippedPartsForm.getRawValue();
    
    // Set lastModifiedBy in the form control
    this.strippedPartsForm.patchValue({
      lastModifiedBy: username
    });
    
    // Debug: Log form data to see what we're getting
    // Check if form is valid
    if (!this.strippedPartsForm.valid) {
      this.toastr.error('Please fill in all required fields');
      this.markFormGroupTouched(this.strippedPartsForm);
      return;
    }
    
    // Validate required fields manually
    if (!formData.dcgPartGroup || formData.dcgPartGroup.trim() === '') {
      this.toastr.error('DCG Part Group is required - Please select from dropdown');
      this.strippedPartsForm.get('dcgPartGroup')?.markAsTouched();
      return;
    }
    
    if (!formData.dcgPartNo || formData.dcgPartNo.trim() === '') {
      this.toastr.error('DCG Part Number is required');
      this.strippedPartsForm.get('dcgPartNo')?.markAsTouched();
      return;
    }
    
    if (!formData.partDesc || formData.partDesc.trim() === '') {
      this.toastr.error('Part Description is required');
      this.strippedPartsForm.get('partDesc')?.markAsTouched();
      return;
    }
    
    // Get master row index
    let masterRowIndex = 0; // Default to 0 for direct additions
    if (this.currentUnit) {
      masterRowIndex = this.currentUnit.rowIndex;
    } else {
      // Try to get from query params
      const queryParams = this.route.snapshot.queryParams;
      masterRowIndex = parseInt(queryParams['rowIndex'] || queryParams['RowIndex']) || 0;
      
      // Allow Master Row Index = 0 for direct part additions
      // This will be treated as independent part entries
    }
    
    this.isSavingPart = true;
    
    // Create the payload directly from form data
    const payload = {
      MasterRowIndex: masterRowIndex,
      RowIndex: this.isNewPart ? 0 : (formData.rowIndex || 0),
      DCGPartGroup: formData.dcgPartGroup.trim(),
      DCGPartNo: formData.dcgPartNo.trim(),
      PartDesc: formData.partDesc.trim(),
      KeepThrow: formData.keepThrow || 'Keep',
      StripNo: parseInt(formData.stripNo) || 1,
      LastModifiedBy: username
    };
    
    // Final validation of payload
    const requiredFields = ['DCGPartGroup', 'DCGPartNo', 'PartDesc', 'LastModifiedBy'];
    const missingFields = requiredFields.filter(field => !payload[field as keyof typeof payload] || (typeof payload[field as keyof typeof payload] === 'string' && (payload[field as keyof typeof payload] as string).trim() === ''));
    
    // Special check for MasterRowIndex - allow 0 as valid value
    if (payload.MasterRowIndex === null || payload.MasterRowIndex === undefined) {
      missingFields.push('MasterRowIndex');
    }
    
    if (missingFields.length > 0) {
      this.toastr.error(`Missing required fields: ${missingFields.join(', ')}`);
      this.isSavingPart = false;
      return;
    }
    
    // Make the API call
    const apiCall = this.http.post<any>(`${environment.apiUrl}/StrippedUnitsStatus/SaveUpdateStrippedPartsInUnit`, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const subscription = apiCall
      .pipe(finalize(() => this.isSavingPart = false))
      .subscribe({
        next: (response: any) => {
          if (response && response.success) {
            const successMsg = masterRowIndex === 0 
              ? 'Part saved successfully as direct entry. View in "Stripped Parts in Unit" page.'
              : response.message || 'Stripped part saved successfully';
            this.partsSuccessMessage = successMsg;
            this.toastr.success(this.partsSuccessMessage);
            this.isPartsEditMode = false;
            this.isNewPart = false;
            this.currentStrippedPart = null;
            // Clear the form after successful save
            this.onClearPartForm();
            // Reload stripped parts list
            this.loadStrippedPartsForUnit();
            
            // Store the Master Row Index = 0 in session storage for the Stripped Parts in Unit page
            if (masterRowIndex === 0) {
              sessionStorage.setItem('StrippedPartsInUnit_MasterRowIndex', '0');
              sessionStorage.setItem('LastUsedMasterRowIndex', '0');
              sessionStorage.setItem('CurrentUnitRowIndex', '0');
            }

          } else {
            this.partsErrorMessage = response?.message || 'Failed to save stripped part';
            this.toastr.error(this.partsErrorMessage);
          }
        },
        error: (error) => {
          let errorMessage = 'Failed to save stripped part';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.errors) {
            errorMessage = 'Validation failed: ' + (Array.isArray(error.error.errors) 
              ? error.error.errors.join(', ')
              : JSON.stringify(error.error.errors));
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          this.partsErrorMessage = errorMessage;
          this.toastr.error(this.partsErrorMessage);
        }
      });

    this.subscriptions.add(subscription);
  }

  onDeleteStrippedPart(part: StrippedPartsDetailDto): void {
    if (!confirm(`Are you sure you want to delete this part?\n\nPart: ${part.GroupType} - ${part.DCGPartNo}\nDescription: ${part.Description}`)) {
      return;
    }
    this.isDeleting = true;
    this.partsErrorMessage = '';

    // Use current unit's masterRowIndex and find part index as rowIndex substitute
    const masterRowIndex = this.currentUnit?.rowIndex || 0;
    const partIndex = this.strippedParts.findIndex(p => p.DCGPartNo === part.DCGPartNo);
    const rowIndexSubstitute = partIndex >= 0 ? partIndex + 1 : 0; // Use 1-based index as substitute
    
    const subscription = this.reportService.deleteStrippedPartInUnit(masterRowIndex, rowIndexSubstitute)
      .pipe(finalize(() => this.isDeleting = false))
      .subscribe({
        next: (response: StrippedPartsInUnitApiResponse) => {
          if (response.success) {
            this.toastr.success('Stripped part deleted successfully');
            this.loadStrippedPartsForUnit(); // Reload the parts list
          } else {
            this.toastr.error(response.message || 'Failed to delete stripped part');
          }
        },
        error: (error) => {
          this.toastr.error('Failed to delete stripped part');
        }
      });

    this.subscriptions.add(subscription);
  }

  private loadPartToForm(part: StrippedPartsDetailDto): void {
    this.strippedPartsForm.patchValue({
      // Use current unit's masterRowIndex, not from part
      masterRowIndex: this.currentUnit?.rowIndex || 0,
      rowIndex: 0, // New parts will get rowIndex from backend
      // Map new API properties to form fields
      dcgPartGroup: part.GroupType,
      dcgPartNo: part.DCGPartNo,
      partDesc: part.Description,
      keepThrow: part.PartStatus,
      stripNo: part.Quantity,
      lastModifiedBy: part.LastModifiedBy,
      createdBy: part.CreatedBy,
      createdOn: part.CreatedOn ? new Date(part.CreatedOn).toLocaleString() : '',
      lastModifiedOn: part.LastModifiedOn ? new Date(part.LastModifiedOn).toLocaleString() : ''
    });
  }

  private resetPartsForm(): void {
    this.strippedPartsForm.reset();
    const currentUser = this.authService.currentUserValue;
    
    // Use current unit's row index if available, otherwise default to 0 for direct entries
    const masterRowIndex = this.currentUnit?.rowIndex || 0;
    
    this.strippedPartsForm.patchValue({
      masterRowIndex: masterRowIndex,
      rowIndex: 0,
      stripNo: 1,
      keepThrow: 'Keep',
      lastModifiedBy: currentUser?.username || 'System',
      createdBy: currentUser?.username || 'System'
    });
  }

  togglePartsSection(): void {
    // Allow toggling even without current unit for direct part additions
    if (!this.currentUnit && !this.fromAddParts) {
      this.toastr.warning('Load a unit first or use "Add Parts" functionality for direct entries');
      return;
    }

    this.showPartsSection = !this.showPartsSection;
    
    // Only load parts if we have a current unit
    if (this.showPartsSection && this.currentUnit && this.strippedParts.length === 0) {
      this.loadStrippedPartsForUnit();
    }
  }

  isPartsFieldInvalid(fieldName: string): boolean {
    const field = this.strippedPartsForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }



  getPartsFieldError(fieldName: string): string {
    const field = this.strippedPartsForm.get(fieldName);
    if (field && field.errors && field.touched) {
      const errors = field.errors;
      
      // Legacy-style error messages for parts
      if (errors['required']) {
        switch (fieldName) {
          case 'dcgPartGroup': return "One or more of the required fields is incomplete.\nPlease enter 'Part Group' and resave your Part.";
          case 'dcgPartNo': return "One or more of the required fields is incomplete.\nPlease enter 'DCG Part No' and resave your Part.";
          case 'keepThrow': return "One or more of the required fields is incomplete.\nPlease select 'KEEP OR THROW' and resave your Part.";
          case 'stripNo': return "One or more of the required fields is incomplete.\nPlease enter 'Strip No' and resave your Part.";
          case 'partDesc': return "One or more of the required fields is incomplete.\nPlease enter 'Part Description' and resave your Part.";
          default: return `${fieldName} is required`;
        }
      }
      
      if (errors['min'] && fieldName === 'stripNo') return "Strip No must be greater than zero.\nPlease enter 'Strip No' and resave your Part.";
    }
    return '';
  }

  trackByRowIndex(index: number, item: StrippedPartsDetailDto): string {
    return item.DCGPartNo || index.toString();
  }

  trackByPartRowIndex(index: number, item: StrippedPartsDetailDto): string {
    return item.DCGPartNo || index.toString();
  }

  hasPartContent(): boolean {
    const partFormValue = this.strippedPartsForm.value;
    const hasContent = !!(partFormValue.dcgPartGroup || partFormValue.dcgPartNo || partFormValue.partDesc);
    return hasContent;
  }

  getKeepThrowOptions() {
    return KEEP_THROW_OPTIONS;
  }

  private setPartsUserInfo(): void {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser?.username) {
      this.toastr.warning('User authentication required');
      return;
    }
    
    // Always ensure these fields are set for API validation
    const patchData: any = {
      lastModifiedBy: currentUser.username,
      createdBy: currentUser.username
    };
    
    const userInfoFormValue = this.strippedPartsForm.value;
    if (!userInfoFormValue.masterRowIndex && this.currentUnit) {
      patchData.masterRowIndex = this.currentUnit.rowIndex;
    }
    
    this.strippedPartsForm.patchValue(patchData);
    
    // Force form validation update
    this.strippedPartsForm.updateValueAndValidity();
    
    // Force form to recognize the changes
    this.strippedPartsForm.updateValueAndValidity();
  }

  private addPartsValidation(): void {
    const currentUser = this.authService.currentUserValue;
    
    // Set user information in form before validation
    const validationFormValue = this.strippedPartsForm.value;
    const patchData: any = {};
    
    if (!validationFormValue.lastModifiedBy) {
      patchData.lastModifiedBy = currentUser?.username || '';
    }
    if (!validationFormValue.createdBy) {
      patchData.createdBy = currentUser?.username || '';
    }
    if (!validationFormValue.masterRowIndex && this.currentUnit) {
      patchData.masterRowIndex = this.currentUnit.rowIndex;
    }
    
    // Only patch if we have data to patch
    if (Object.keys(patchData).length > 0) {
      this.strippedPartsForm.patchValue(patchData);
    }
    
    // Add required validators for submission
    this.strippedPartsForm?.get('dcgPartGroup')?.setValidators([Validators.required]);
    this.strippedPartsForm?.get('dcgPartNo')?.setValidators([Validators.required]);
    this.strippedPartsForm?.get('partDesc')?.setValidators([Validators.required]);
    this.strippedPartsForm?.get('keepThrow')?.setValidators([Validators.required]);
    this.strippedPartsForm?.get('stripNo')?.setValidators([Validators.required, Validators.min(1)]);
    this.strippedPartsForm?.get('lastModifiedBy')?.setValidators([Validators.required]);
    this.strippedPartsForm?.get('createdBy')?.setValidators([Validators.required]);
    
    // Update validators and validity
    Object.keys(this.strippedPartsForm?.controls || {}).forEach(key => {
      this.strippedPartsForm?.get(key)?.updateValueAndValidity();
    });
  }





  onClearPartForm(): void {
    this.resetPartsForm();
    this.partsSuccessMessage = '';
    this.partsErrorMessage = '';
    
    // Reset edit state - we're now adding a new part
    this.isNewPart = true;
    this.isPartsEditMode = false;
    this.currentStrippedPart = null;
    
    // Clear any validation errors
    this.strippedPartsForm?.markAsUntouched();
    this.strippedPartsForm?.markAsPristine();
  }

  private resetPartsData(): void {
    this.strippedParts = [];
    this.currentStrippedPart = null;
    this.isPartsEditMode = false;
    this.isNewPart = false;
    this.showPartsSection = false;
    this.partsErrorMessage = '';
    this.partsSuccessMessage = '';
    this.resetPartsForm();
  }

  // Track by function for ngFor performance
  trackByPartIndex(index: number, part: StrippedPartsDetailDto): any {
    return part.RowIndex || part.rowIndex || index;
  }
}