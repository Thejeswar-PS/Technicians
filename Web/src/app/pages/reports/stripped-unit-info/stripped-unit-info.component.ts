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
    console.log('🚀 [COMPONENT INIT] StrippedUnitInfoComponent initialized');
    
    // Initialize forms first
    this.initializeForms();
    
    // Check authentication and set user info immediately
    this.checkUserAuthentication();
    
    // Load necessary data
    this.loadStripPartCodes();
    this.checkRouteParams();
    
    // Add periodic logging for debugging
    setInterval(() => {
      if (this.currentUnit) {
        console.log('📊 [PERIODIC DEBUG] Current component state:', {
          hasCurrentUnit: !!this.currentUnit,
          unitRowIndex: this.currentUnit?.rowIndex,
          showPartsSection: this.showPartsSection,
          partsCount: this.strippedParts.length,
          isLoadingParts: this.isLoadingParts,
          partsErrorMessage: this.partsErrorMessage
        });
      }
    }, 10000); // Every 10 seconds when unit is loaded
  }
  
  private checkUserAuthentication(): void {
    const currentUser = this.authService.currentUserValue;
    console.log('🔐 [AUTH] Checking user authentication:', currentUser?.username);
    
    if (!currentUser?.username) {
      console.log('⚠️ [AUTH] No authenticated user found');
      this.toastr.warning('Please ensure you are logged in');
    } else {
      console.log('✅ [AUTH] User authenticated:', currentUser.username);
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
      stripNo: [null, [Validators.required, Validators.min(1)]], // Add required and min validation
      lastModifiedBy: ['', Validators.required], // Add required validation
      createdBy: [''],
      createdOn: [''],
      lastModifiedOn: ['']
    });

    this.searchForm = this.fb.group({
      searchType: ['rowIndex'],
      searchValue: ['', Validators.required]
    });
    
    // Add form value changes subscription to track field interactions

    // Subscribe to individual field changes for detailed logging
    this.strippedPartsForm.get('dcgPartGroup')?.valueChanges.subscribe(value => {
      console.log('🎯 [UI FORM] DCG Part Group changed:', value);
    });
    
    this.strippedPartsForm.get('dcgPartNo')?.valueChanges.subscribe(value => {
      console.log('🎯 [UI FORM] DCG Part No changed:', value);
    });
    
    this.strippedPartsForm.get('stripNo')?.valueChanges.subscribe(value => {
      console.log('🎯 [UI FORM] Strip No changed:', value);
    });
    
    this.strippedPartsForm.get('keepThrow')?.valueChanges.subscribe(value => {
      console.log('🎯 [UI FORM] Keep/Throw changed:', value);
    });
    
    this.strippedPartsForm.get('partDesc')?.valueChanges.subscribe(value => {
      console.log('🎯 [UI FORM] Part Description changed:', value);
    });
    
    // Overall form changes
    this.strippedPartsForm.valueChanges.subscribe(value => {
      console.log('📝 [UI FORM] Complete form state:', value);
      console.log('✅ [UI FORM] Form valid:', this.strippedPartsForm.valid);
    });
    
    // Initialize form with default user info
    this.initializePartsFormDefaults();
  }
  
  private initializePartsFormDefaults(): void {
    const currentUser = this.authService.currentUserValue;
    console.log('🔧 [INIT] Initializing parts form defaults for user:', currentUser?.username);
    
    if (!currentUser?.username) {
      console.log('⚠️ [INIT] No authenticated user found');
      return;
    }
    
    const defaultValues = {
      lastModifiedBy: currentUser.username,
      createdBy: currentUser.username,
      keepThrow: 'Keep' // Set default value
    };
    
    console.log('📝 [INIT] Setting default form values:', defaultValues);
    this.strippedPartsForm.patchValue(defaultValues);
    
    // Ensure the form recognizes the changes
    this.strippedPartsForm.updateValueAndValidity();
  }

  private checkRouteParams(): void {
    this.route.queryParams.subscribe(params => {
      console.log('🧭 [ROUTE PARAMS] Received route parameters:', params);
      
      if (params['rowIndex'] || params['RowIndex']) {
        // Support both lowercase and uppercase (legacy uses RowIndex)
        const rowIndex = parseInt(params['rowIndex'] || params['RowIndex']);
        const fromAddParts = params['fromAddParts'] === 'true';
        
        console.log('🎯 [ROUTE LOAD] Loading unit with rowIndex:', rowIndex, 'fromAddParts:', fromAddParts);
        
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
          
          // Store unit details for context display
          this.unitContext = unitDetails;
          
          // Show success message with unit context
          if (unitDetails.make && unitDetails.model) {
            this.successMessage = `Add Parts for: ${unitDetails.make} ${unitDetails.model} (S/N: ${unitDetails.serialNo || 'N/A'}, KVA: ${unitDetails.kva || 'N/A'})`;
          }
          
          // Auto-show parts section when coming from Add Parts
          setTimeout(() => {
            this.showPartsSection = true;
            console.log('🎯 [AUTO SHOW] Auto-showing parts section for Add Parts workflow');
          }, 1000);
        }
      } else if (params['new'] === 'true') {
        this.startNewUnit();
      } else if (params['fromAddParts'] === 'true') {
        // Handle case where user wants to add parts without a specific unit
        this.successMessage = 'You can add parts information independently using the form on the right.';
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
          console.log('🔍 [DB RESPONSE] Unit data received from database:', response);
          if (response.success && response.data) {
            // The API returns a single unit directly in the data property for GetStrippedUnit endpoint
            this.currentUnit = response.data;
            console.log('✅ [DB DATA] Current unit loaded:', this.currentUnit);
            this.loadUnitToForm();
            this.loadStrippedPartsForUnit(); // Load associated parts
            this.isEditMode = false;
          } else {
            console.log('❌ [DB ERROR] Unit not found or error:', response.message);
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
      console.log('⚠️ [PARTS LOAD] No current unit available to load parts for');
      return;
    }

    console.log('🔄 [PARTS LOAD] Loading parts for unit with masterRowIndex:', this.currentUnit.rowIndex);
    this.isLoadingParts = true;
    this.partsErrorMessage = '';

    const subscription = this.reportService.getStrippedPartsInUnit(this.currentUnit.rowIndex)
      .pipe(finalize(() => this.isLoadingParts = false))
      .subscribe({
        next: (response: StrippedPartsInUnitApiResponse) => {
          console.log('📦 [DB RESPONSE] Stripped parts data from database:', response);
          if (response.success && response.data) {
            // Use PartsDetails from the new API structure
            this.strippedParts = response.data.partsDetails || [];
            console.log('✅ [PARTS DATA] Loaded parts for UI display:', this.strippedParts);
            console.log('📊 [PARTS COUNT] Total parts found:', this.strippedParts.length);
            
            if (this.strippedParts.length === 0 || !response.data.hasData) {
              console.log('📭 [PARTS EMPTY] No parts found for this unit in database');
              this.partsErrorMessage = 'No stripped parts found for this unit.';
            } else {
              console.log('📋 [PARTS DETAILS] Parts breakdown:', this.strippedParts.map(part => ({
                dcgPartNo: part.DCGPartNo,
                bomPartNo: part.BOMPartNo,
                description: part.Description,
                quantity: part.Quantity,
                partStatus: part.PartStatus,
                groupType: part.GroupType
              })));
            }
          } else {
            console.log('❌ [PARTS ERROR] Failed to load parts:', response.error || response.message);
            this.partsErrorMessage = response.error || response.message || 'Failed to load stripped parts';
            this.strippedParts = [];
          }
        },
        error: (error: any) => {
          console.error('🔥 [PARTS ERROR] Error loading stripped parts:', error);
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

    this.unitInfoForm.patchValue({
      rowIndex: this.currentUnit.rowIndex,
      make: this.currentUnit.make,
      model: this.currentUnit.model,
      serialNo: this.currentUnit.serialNo,
      kva: this.currentUnit.kva,
      voltage: this.currentUnit.voltage,
      poNumber: this.currentUnit.poNumber,
      shippingPO: this.currentUnit.shippingPO,
      unitCost: this.currentUnit.unitCost,
      shipCost: this.currentUnit.shipCost,
      strippedBy: this.currentUnit.strippedBy,
      putAwayBy: this.currentUnit.putAwayBy,
      status: this.currentUnit.status,
      partsLocation: this.currentUnit.partsLocation,
      createdOn: this.currentUnit.createdOn ? new Date(this.currentUnit.createdOn).toLocaleString() : '',
      lastModifiedOn: this.currentUnit.lastModifiedOn ? new Date(this.currentUnit.lastModifiedOn).toLocaleString() : '',
      stripExists: this.currentUnit.stripExists
    });
    
    // Set the currentStatusValue for the select binding
    this.currentStatusValue = this.currentUnit.status || '';
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.keys(formGroup.controls).forEach(field => {
      const control = formGroup.get(field);
      control?.markAsTouched({ onlySelf: true });
    });
  }

  // Other existing methods would continue here...
  // I'll add the rest in the next replacement

  isFieldEditable(): boolean {
    return this.isEditMode || this.isNewUnit || this.fromAddParts;
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
  }

  onCancel(): void {
    this.isEditMode = false;
    this.isNewUnit = false;
    this.loadUnitToForm();
    this.errorMessage = '';
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

    const formData = this.unitInfoForm.getRawValue();
    const currentUser = this.authService.currentUserValue;
    
    const unitData: StrippedUnitsStatusDto = {
      ...formData,
      rowIndex: this.isNewUnit ? 0 : formData.rowIndex,
      lastModifiedBy: currentUser?.username || 'System',
      lastModifiedOn: new Date()
    };

    const apiCall = this.isNewUnit 
      ? this.reportService.saveUpdateStrippingUnit(unitData)
      : this.reportService.updateStrippingUnitByRowIndex(unitData.rowIndex, unitData);

    const subscription = apiCall
      .pipe(finalize(() => this.isSaving = false))
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.successMessage = response.message || (this.isNewUnit ? 'Unit created successfully' : 'Unit updated successfully');
            this.toastr.success(this.successMessage);
            this.isEditMode = false;
            
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
    // Return status options - you may need to import these from your model
    return [
      { value: 'INP', label: 'In Progress' },
      { value: 'COM', label: 'Complete' },
      { value: 'DEF', label: 'Defective' },
      { value: 'WOS', label: 'Waiting On Someone else' }
    ];
  }

  onStatusSelectChange(event: any): void {
    const selectedValue = event.target.value;
    this.currentStatusValue = selectedValue;
    
    // Update the form control as well
    this.unitInfoForm.patchValue({ status: selectedValue });
    
    console.log('🎯 [STATUS CHANGE] Status changed to:', selectedValue);
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
    console.log('🔧 [SAVE] Starting save stripped part process');
    
    // Get current user early to avoid redeclaration
    const currentUser = this.authService.currentUserValue;
    
    // Clear previous messages
    this.partsErrorMessage = '';
    this.partsSuccessMessage = '';
    
    // Set user info first to ensure lastModifiedBy is populated
    this.setPartsUserInfo();
    
    // Validate the form
    if (this.strippedPartsForm.invalid) {
      console.log('❌ [VALIDATION] Form is invalid:', this.strippedPartsForm.errors);
      
      // Mark all fields as touched to show validation errors
      Object.keys(this.strippedPartsForm.controls).forEach(key => {
        this.strippedPartsForm.get(key)?.markAsTouched();
      });
      
      this.toastr.error('Please fill in all required fields');
      return;
    }
    
    // Ensure dcgPartGroup is selected
    const partsFormValue = this.strippedPartsForm.value;
    const partsRawValue = this.strippedPartsForm.getRawValue();
    
    console.log('🔍 [VALIDATION] Current form value:', JSON.stringify(partsFormValue, null, 2));
    console.log('🔍 [VALIDATION] Current form RAW value:', JSON.stringify(partsRawValue, null, 2));
    console.log('🔍 [VALIDATION] Form valid status:', this.strippedPartsForm.valid);
    console.log('🔍 [VALIDATION] Form errors:', this.strippedPartsForm.errors);
    
    // Check individual form controls
    console.log('🔍 [CONTROLS] dcgPartGroup control:', this.strippedPartsForm.get('dcgPartGroup')?.value);
    console.log('🔍 [CONTROLS] lastModifiedBy control:', this.strippedPartsForm.get('lastModifiedBy')?.value);
    
    if (!partsFormValue.dcgPartGroup || partsFormValue.dcgPartGroup.trim() === '') {
      console.log('❌ [VALIDATION] DCG Part Group is missing or empty:', partsFormValue.dcgPartGroup);
      console.log('❌ [VALIDATION] Available part codes:', this.stripPartCodes);
      this.toastr.error('DCG Part Group is required - Please select from dropdown');
      this.strippedPartsForm.get('dcgPartGroup')?.markAsTouched();
      return;
    }
    
    // Ensure lastModifiedBy is set - force it if necessary
    if (!partsFormValue.lastModifiedBy || partsFormValue.lastModifiedBy.trim() === '') {
      console.log('⚠️ [USER] LastModifiedBy is missing, forcing user info update');
      const userToSet = currentUser?.username || 'System';
      this.strippedPartsForm.patchValue({
        lastModifiedBy: userToSet,
        createdBy: userToSet
      });
      // Update the local variable to reflect the change
      partsFormValue.lastModifiedBy = userToSet;
      console.log('✅ [USER] Forced lastModifiedBy to:', userToSet);
    }

    // Allow parts to be added independently, but get masterRowIndex from loaded unit or query params
    let masterRowIndex = 0;
    if (this.currentUnit) {
      masterRowIndex = this.currentUnit.rowIndex;
    } else {
      // Try to get rowIndex from query params if no unit is loaded
      this.route.queryParams.subscribe(params => {
        if (params['rowIndex'] || params['RowIndex']) {
          masterRowIndex = parseInt(params['rowIndex'] || params['RowIndex']) || 0;
        }
      }).unsubscribe();
      
      if (masterRowIndex === 0) {
        this.toastr.error('No unit reference found. Please load a unit or navigate from the stripped units status page.');
        return;
      }
    }

    this.isSavingPart = true;
    this.partsErrorMessage = '';
    this.partsSuccessMessage = '';

    // Get fresh form data after any patches
    const partsData = this.strippedPartsForm.getRawValue();
    
    // Log form data for debugging
    console.log('🔍 [DEBUG] Form raw value after validation:', JSON.stringify(partsData, null, 2));
    console.log('🔍 [DEBUG] DCG Part Group value:', partsData.dcgPartGroup);
    console.log('🔍 [DEBUG] Last Modified By value:', partsData.lastModifiedBy);
    console.log('🔍 [DEBUG] Current user:', currentUser?.username);
    
    // CRITICAL: Ensure we have actual values, not just form validation
    const actualDcgPartGroup = partsData.dcgPartGroup || partsFormValue.dcgPartGroup;
    const actualLastModifiedBy = partsData.lastModifiedBy || partsFormValue.lastModifiedBy || currentUser?.username || 'System';
    
    console.log('🔍 [CRITICAL] Raw form dcgPartGroup:', partsData.dcgPartGroup);
    console.log('🔍 [CRITICAL] Value form dcgPartGroup:', partsFormValue.dcgPartGroup);
    console.log('🔍 [CRITICAL] Raw form lastModifiedBy:', partsData.lastModifiedBy);
    console.log('🔍 [CRITICAL] Value form lastModifiedBy:', partsFormValue.lastModifiedBy);
    console.log('🔍 [CRITICAL] Current user username:', currentUser?.username);
    console.log('🔍 [CRITICAL] Actual DCG Part Group to send:', actualDcgPartGroup);
    console.log('🔍 [CRITICAL] Actual LastModifiedBy to send:', actualLastModifiedBy);
    
    // Check if form controls themselves have values
    const dcgControl = this.strippedPartsForm.get('dcgPartGroup');
    const lastModControl = this.strippedPartsForm.get('lastModifiedBy');
    console.log('🔍 [CONTROLS] DCG Part Group control value:', dcgControl?.value);
    console.log('🔍 [CONTROLS] DCG Part Group control valid:', dcgControl?.valid);
    console.log('🔍 [CONTROLS] LastModifiedBy control value:', lastModControl?.value);
    console.log('🔍 [CONTROLS] LastModifiedBy control valid:', lastModControl?.valid);
    
    // Final validation - ensure required fields are not empty
    if (!actualDcgPartGroup || actualDcgPartGroup.trim() === '') {
      console.log('❌ [ERROR] DCG Part Group is still empty after all checks');
      this.toastr.error('DCG Part Group must be selected from the dropdown');
      return;
    }
    
    if (!actualLastModifiedBy || actualLastModifiedBy.trim() === '') {
      console.log('❌ [ERROR] No user information available for LastModifiedBy after all checks');
      this.toastr.error('User authentication is required - please log in again');
      return;
    }
    
    console.log('✅ [VALIDATION] Final values - DCG Part Group:', actualDcgPartGroup, 'LastModifiedBy:', actualLastModifiedBy);
    
    // Create a clean payload that matches server expectations exactly
    const cleanPayload = {
      MasterRowIndex: masterRowIndex,
      RowIndex: this.isNewPart ? 0 : (partsData.rowIndex || 0),
      DCGPartGroup: actualDcgPartGroup,  // Use the verified value
      DCGPartNo: partsData.dcgPartNo || '',
      PartDesc: partsData.partDesc || '',
      KeepThrow: partsData.keepThrow || 'Keep',
      StripNo: parseInt(partsData.stripNo) || 1,
      LastModifiedBy: actualLastModifiedBy,  // Use the verified value
      CreatedBy: actualLastModifiedBy,
      CreatedOn: new Date().toISOString(),
      LastModifiedOn: new Date().toISOString()
    };
    
    console.log('🧿 [CLEAN PAYLOAD] Final payload to send:', JSON.stringify(cleanPayload, null, 2));
    console.log('🧿 [VALIDATION FINAL] DCGPartGroup in payload:', cleanPayload.DCGPartGroup);
    console.log('🧿 [VALIDATION FINAL] LastModifiedBy in payload:', cleanPayload.LastModifiedBy);
    console.log('🔄 [API ENDPOINT] Using UpdateStrippedPartsInUnit (PUT) with MasterRowIndex:', masterRowIndex, 'RowIndex:', cleanPayload.RowIndex);
    
    // ABSOLUTE FINAL CHECK - if these are still empty, something is very wrong
    if (!cleanPayload.DCGPartGroup || !cleanPayload.LastModifiedBy) {
      console.log('❌ [CRITICAL ERROR] Payload still missing required fields after all processing!');
      console.log('❌ [CRITICAL ERROR] DCGPartGroup:', cleanPayload.DCGPartGroup);
      console.log('❌ [CRITICAL ERROR] LastModifiedBy:', cleanPayload.LastModifiedBy);
      this.toastr.error('CRITICAL: Unable to prepare data for saving. Please refresh and try again.');
      this.isSavingPart = false;
      return;
    }
    
    // Use the clean payload for the API call
    const finalApiCall = this.http.put<any>(`${environment.apiUrl}/StrippedUnitsStatus/UpdateStrippedPartsInUnit/${masterRowIndex}/${cleanPayload.RowIndex}`, cleanPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    const subscription = finalApiCall
      .pipe(finalize(() => this.isSavingPart = false))
      .subscribe({
        next: (response: any) => {
          console.log('📥 [SAVE RESPONSE] Save response from database:', response);
          if (response && response.success) {
            console.log('✅ [SAVE SUCCESS] Part saved successfully');
            this.partsSuccessMessage = response.message || 'Stripped part saved successfully';
            this.toastr.success(this.partsSuccessMessage);
            this.isPartsEditMode = false;
            this.isNewPart = false;
            this.currentStrippedPart = null;
            // Clear the form after successful save
            this.onClearPartForm();
            // Reload stripped parts list
            this.loadStrippedPartsForUnit();

          } else {
            console.log('❌ [SAVE ERROR] Failed to save part:', response?.message);
            this.partsErrorMessage = response?.message || 'Failed to save stripped part';
            this.toastr.error(this.partsErrorMessage);
          }
        },
        error: (error) => {
          console.error('🔥 [SAVE ERROR] Network/Server error saving part:', error);
          console.log('🔍 [ERROR DETAILS] Status:', error.status);
          console.log('🔍 [ERROR DETAILS] Error body:', error.error);
          
          let errorMessage = 'Failed to save stripped part';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.errors) {
            errorMessage = 'Validation failed: ' + error.error.errors.join(', ');
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

    console.log('🗑️ [DELETE REQUEST] Deleting stripped part:', part);
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
          console.log('📤 [DELETE RESPONSE] Delete response from database:', response);
          if (response.success) {
            console.log('✅ [DELETE SUCCESS] Part deleted successfully');
            this.toastr.success('Stripped part deleted successfully');
            this.loadStrippedPartsForUnit(); // Reload the parts list
          } else {
            console.log('❌ [DELETE ERROR] Failed to delete part:', response.message);
            this.toastr.error(response.message || 'Failed to delete stripped part');
          }
        },
        error: (error) => {
          console.error('🔥 [DELETE ERROR] Network/Server error deleting part:', error);
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
    this.strippedPartsForm.patchValue({
      masterRowIndex: this.currentUnit?.rowIndex || 0,
      rowIndex: 0,
      keepThrow: 'Keep',
      lastModifiedBy: currentUser?.username || '',
      createdBy: currentUser?.username || ''
    });
  }

  togglePartsSection(): void {
    if (!this.currentUnit) {
      console.log('⚠️ [PARTS SECTION] No unit loaded, cannot show parts section');
      this.toastr.error('Please load a unit first');
      return;
    }

    this.showPartsSection = !this.showPartsSection;
    console.log('🔄 [UI TOGGLE] Parts section visibility:', this.showPartsSection ? 'SHOWN' : 'HIDDEN');
    console.log('📊 [PARTS STATE] Current parts in memory:', this.strippedParts.length, 'parts');
    
    if (this.showPartsSection && this.strippedParts.length === 0) {
      console.log('🔄 [PARTS RELOAD] Parts section shown but no parts loaded, reloading...');
      this.loadStrippedPartsForUnit();
    }
  }

  isPartsFieldInvalid(fieldName: string): boolean {
    const field = this.strippedPartsForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  debugLoadParts(): void {
    console.log('🐛 [DEBUG] Manual parts reload triggered');
    console.log('🐛 [DEBUG] Current state:', {
      currentUnit: this.currentUnit,
      unitRowIndex: this.currentUnit?.rowIndex,
      showPartsSection: this.showPartsSection,
      isLoadingParts: this.isLoadingParts,
      partsCount: this.strippedParts.length,
      partsErrorMessage: this.partsErrorMessage
    });
    
    if (!this.currentUnit) {
      console.log('🐛 [DEBUG] No current unit - cannot load parts');
      this.toastr.warning('No unit loaded - cannot load parts');
      return;
    }
    
    console.log('🐛 [DEBUG] Forcing parts reload...');
    this.showPartsSection = true;
    this.loadStrippedPartsForUnit();
  }

  debugFormStatus(): void {
    console.log('Form Status:', {
      valid: this.strippedPartsForm.valid,
      touched: this.strippedPartsForm.touched,
      dirty: this.strippedPartsForm.dirty,
      value: this.strippedPartsForm.value,
      errors: this.strippedPartsForm.errors
    });
    
    // Log each field's status
    Object.keys(this.strippedPartsForm.controls).forEach(key => {
      const control = this.strippedPartsForm.get(key);
      if (control) {
        console.log(`Field ${key}:`, {
          value: control.value,
          errors: control.errors,
          touched: control.touched,
          dirty: control.dirty
        });
      }
    });
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
    console.log('👤 [USER INFO] Setting parts user info, current user:', currentUser?.username);
    
    if (!currentUser?.username) {
      console.log('⚠️ [USER INFO] No current user found');
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
    
    console.log('🔧 [PATCH] Patching form with user data:', patchData);
    this.strippedPartsForm.patchValue(patchData);
    
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

  // Test method to send hardcoded values to verify API works
  testApiWithHardcodedValues(): void {
    console.log('🧪 [TEST] Testing API with hardcoded values');
    
    const testPayload = {
      MasterRowIndex: 1,
      RowIndex: 0,
      DCGPartGroup: "TEST_GROUP",
      DCGPartNo: "TEST_PART_123",
      PartDesc: "Test Description",
      KeepThrow: "Keep",
      StripNo: 1,
      LastModifiedBy: "TEST_USER",
      CreatedBy: "TEST_USER",
      CreatedOn: new Date().toISOString(),
      LastModifiedOn: new Date().toISOString()
    };
    
    console.log('🧪 [TEST] Sending test payload:', JSON.stringify(testPayload, null, 2));
    
    this.http.put<any>(`${environment.apiUrl}/StrippedUnitsStatus/UpdateStrippedPartsInUnit/${testPayload.MasterRowIndex}/${testPayload.RowIndex}`, testPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }).subscribe({
      next: (response) => {
        console.log('🧪 [TEST SUCCESS] Test payload worked:', response);
        this.toastr.success('Test API call successful - form values are the issue');
      },
      error: (error) => {
        console.log('🧪 [TEST ERROR] Test payload failed:', error);
        this.toastr.error('Test API call failed - API or server issue');
      }
    });
  }

  // Method to populate form with test values
  populateTestValues(): void {
    console.log('🧪 [TEST] Populating form with test values');
    
    this.strippedPartsForm.patchValue({
      dcgPartGroup: 'TEST_GROUP',
      dcgPartNo: 'TEST_PART_123', 
      partDesc: 'Test Description for debugging',
      keepThrow: 'Keep',
      stripNo: 5,
      lastModifiedBy: 'TEST_USER',
      createdBy: 'TEST_USER'
    });
    
    // Force form validation update
    this.strippedPartsForm.updateValueAndValidity();
    
    console.log('🧪 [TEST] Form populated. Current form value:', this.strippedPartsForm.value);
    this.toastr.info('Form populated with test values - try saving now');
  }

  // Debug method to check form state
  debugFormState(): void {
    console.log('🐛 [DEBUG] === FORM STATE DEBUG ===');
    console.log('🐛 [DEBUG] Form valid:', this.strippedPartsForm.valid);
    console.log('🐛 [DEBUG] Form value:', this.strippedPartsForm.value);
    console.log('🐛 [DEBUG] Form raw value:', this.strippedPartsForm.getRawValue());
    console.log('🐛 [DEBUG] Current user:', this.authService.currentUserValue);
    console.log('🐛 [DEBUG] Strip part codes loaded:', this.stripPartCodes.length);
    console.log('🐛 [DEBUG] Available part codes:', this.stripPartCodes);
    
    // Test each form control individually
    Object.keys(this.strippedPartsForm.controls).forEach(key => {
      const control = this.strippedPartsForm.get(key);
      console.log(`🐛 [DEBUG] Control ${key}:`, {
        value: control?.value,
        valid: control?.valid,
        errors: control?.errors,
        touched: control?.touched
      });
    });
    
    this.toastr.info('Form state logged to console');
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