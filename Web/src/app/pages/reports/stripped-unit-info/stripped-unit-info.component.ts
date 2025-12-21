import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    console.log('🚀 [COMPONENT INIT] StrippedUnitInfoComponent initialized');
    this.initializeForms();
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
      dcgPartGroup: [''], // Remove required - only validate when actually adding parts
      dcgPartNo: [''],    // Remove required - only validate when actually adding parts
      partDesc: [''],     // Remove required - only validate when actually adding parts
      keepThrow: ['Keep'], // Remove required - only validate when actually adding parts
      stripNo: [null, [Validators.min(1)]], // Keep min validation but remove required
      lastModifiedBy: [''],
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
            this.successMessage = 'Unit loaded successfully';
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
    // Flexible validation - only check if user provided some data
    const partsFormValue = this.strippedPartsForm.value;
    
    const hasAnyData = partsFormValue.dcgPartGroup || partsFormValue.dcgPartNo || partsFormValue.partDesc || 
                      partsFormValue.keepThrow || partsFormValue.stripNo;
    
    if (!hasAnyData) {
      this.toastr.warning('Please provide at least some parts information to save');
      return;
    }
    
    // Set user info without adding strict validation
    this.setPartsUserInfo();

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

    const partsData = this.strippedPartsForm.getRawValue();
    const currentUser = this.authService.currentUserValue;
    const partData: StrippedPartsInUnitDto = {
      masterRowIndex: masterRowIndex, // Use the determined masterRowIndex
      rowIndex: this.isNewPart ? 0 : partsData.rowIndex,
      dcgPartGroup: partsData.dcgPartGroup,
      dcgPartNo: partsData.dcgPartNo,
      partDesc: partsData.partDesc,
      keepThrow: partsData.keepThrow,
      stripNo: partsData.stripNo,
      lastModifiedBy: currentUser?.username || 'System',
      createdBy: currentUser?.username || 'System',
      createdOn: this.currentStrippedPart?.CreatedOn || undefined,
      lastModifiedOn: new Date()
    };

    const apiCall = this.isNewPart
      ? this.reportService.saveUpdateStrippedPartsInUnit(partData)
      : this.reportService.updateStrippedPartsInUnit(partData.masterRowIndex || 0, partData.rowIndex || 0, partData);

    console.log('💾 [SAVE REQUEST] Attempting to save part data:', partData);
    console.log('🔄 [SAVE REQUEST] API Call type:', this.isNewPart ? 'CREATE' : 'UPDATE');
    
    const subscription = apiCall
      .pipe(finalize(() => this.isSavingPart = false))
      .subscribe({
        next: (response: StrippedPartsInUnitApiResponse) => {
          console.log('📥 [SAVE RESPONSE] Save response from database:', response);
          if (response.success) {
            console.log('✅ [SAVE SUCCESS] Part saved successfully');
            this.partsSuccessMessage = response.message || 'Stripped part saved successfully';
            this.toastr.success(this.partsSuccessMessage);
            this.isPartsEditMode = false;
            this.isNewPart = false;
            this.currentStrippedPart = null;
            // Reload stripped parts list
            this.loadStrippedPartsForUnit();

          } else {
            console.log('❌ [SAVE ERROR] Failed to save part:', response.message);
            this.partsErrorMessage = response.message || 'Failed to save stripped part';
            this.toastr.error(this.partsErrorMessage);
          }
        },
        error: (error) => {
          console.error('🔥 [SAVE ERROR] Network/Server error saving part:', error);
          this.partsErrorMessage = error.error?.message || 'Failed to save stripped part';
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
    
    // Set user information in form if not already present
    const userInfoFormValue = this.strippedPartsForm.value;
    const patchData: any = {};
    
    if (!userInfoFormValue.lastModifiedBy) {
      patchData.lastModifiedBy = currentUser?.username || '';
    }
    if (!userInfoFormValue.createdBy) {
      patchData.createdBy = currentUser?.username || '';
    }
    if (!userInfoFormValue.masterRowIndex && this.currentUnit) {
      patchData.masterRowIndex = this.currentUnit.rowIndex;
    }
    
    // Only patch if we have data to patch
    if (Object.keys(patchData).length > 0) {
      this.strippedPartsForm.patchValue(patchData);
    }
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
}