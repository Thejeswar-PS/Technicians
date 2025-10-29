import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { EquipmentService } from '../../../core/services/equipment.service';
import { AuthService } from '../../../modules/auth/services/auth.service';
import { 
  EditEquipmentInfo, 
  EquipBoardDetail, 
  UpdateEquipmentRequest,
  UpdateEquipBoardInfoRequest,
  EquipBoardRow,
  EQUIPMENT_STATUS_OPTIONS,
  EQUIPMENT_TYPE_OPTIONS,
  FLOAT_VOLTAGE_OPTIONS,
  READING_TYPE_OPTIONS 
} from '../../../core/model/edit-equipment.model';

@Component({
  selector: 'app-edit-equipment',
  templateUrl: './edit-equipment.component.html',
  styleUrls: ['./edit-equipment.component.scss']
})
export class EditEquipmentComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Form groups
  basicInfoForm!: FormGroup;
  capacitorForm!: FormGroup;
  boardDetailsForm!: FormGroup;
  
  // Route parameters
  callNbr: string = '';
  equipId: number = 0;
  equipNo: string = '';
  techId: string = '';
  techName: string = '';
  digest: string = '';

  // Component state
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';

  // Equipment data
  equipmentInfo: EditEquipmentInfo | null = null;
  boardDetails: EquipBoardDetail[] = [];

  // Month options for capacitor date codes
  monthOptions = [
    { value: 'JAN', label: 'January' },
    { value: 'FEB', label: 'February' },
    { value: 'MAR', label: 'March' },
    { value: 'APR', label: 'April' },
    { value: 'MAY', label: 'May' },
    { value: 'JUN', label: 'June' },
    { value: 'JUL', label: 'July' },
    { value: 'AUG', label: 'August' },
    { value: 'SEP', label: 'September' },
    { value: 'OCT', label: 'October' },
    { value: 'NOV', label: 'November' },
    { value: 'DEC', label: 'December' }
  ];

  // UI state
  showBatteryPanel = false;
  showCapacitorPanel = false;
  showBoardPanel = false;

  // Layout computation - UPS uses two-column, all others use single-column centered
  get isUpsLayout(): boolean {
    return this.showCapacitorPanel || this.showBoardPanel;
  }

  get layoutClass(): string {
    return this.isUpsLayout ? 'ups-layout' : 'standard-layout';
  }

  // New methods for enhanced layout system
  isUpsEquipment(): boolean {
    const equipType = this.basicInfoForm?.get('equipType')?.value;
    return equipType === 'UPS';
  }

  getLayoutModeClass(): string {
    return this.isUpsEquipment() ? 'ups-mode' : 'standard-mode';
  }

  getEquipmentTypeLabel(): string {
    const equipType = this.basicInfoForm?.get('equipType')?.value;
    const option = this.equipmentTypeOptions.find(opt => opt.value === equipType);
    return option ? option.label : '';
  }

  // Dropdown options
  statusOptions = EQUIPMENT_STATUS_OPTIONS;
  equipmentTypeOptions = EQUIPMENT_TYPE_OPTIONS;
  floatVoltageOptions = FLOAT_VOLTAGE_OPTIONS;
  readingTypeOptions = READING_TYPE_OPTIONS;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private equipmentService: EquipmentService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.loadRouteParams();
    this.loadEquipmentData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForms(): void {
    this.basicInfoForm = this.fb.group({
      callNbr: ['', [Validators.required, Validators.maxLength(11)]],
      equipNo: ['', [Validators.required, Validators.maxLength(21)]],
      serialId: ['', [Validators.maxLength(50)]],
      location: ['', [Validators.maxLength(128)]],
      dateCodeMonth: [''],
      dateCodeYear: [null, [Validators.pattern(/^\d{2,4}$/)]],
      status: ['Online', Validators.required], // Default to 'Online' instead of empty
      equipType: ['SELECT', [Validators.required, Validators.maxLength(50)]],
      floatVoltageSelection: ['PS'],
      batteryPackCount: [null, [Validators.pattern(/^\d+$/)]],
      batteriesPerString: [null, [Validators.pattern(/^\d+$/)]],
      readingType: ['1', [Validators.maxLength(25)]],
      kva: [null, [Validators.pattern(/^\d+(\.\d+)?$/)]],
      vendorId: ['', [Validators.maxLength(50)]],
      version: ['', [Validators.maxLength(200)]],
      tag: ['', [Validators.maxLength(50)]],
      contract: ['', [Validators.maxLength(11)]],
      taskDescription: ['', [Validators.maxLength(500)]]
    });

    this.capacitorForm = this.fb.group({
      dcfCapsPartNo: ['', [Validators.maxLength(50)]],
      dcfQty: [null, [Validators.pattern(/^\d+$/)]],
      dcfMonth: [''],
      dcfYear: [null, [Validators.pattern(/^\d{2,4}$/)]],
      
      acfipCapsPartNo: ['', [Validators.maxLength(50)]],
      acfQty: [null, [Validators.pattern(/^\d+$/)]],
      acfMonth: [''],
      acfYear: [null, [Validators.pattern(/^\d{2,4}$/)]],
      
      dcCommCapsPartNo: ['', [Validators.maxLength(50)]],
      commQty: [null, [Validators.pattern(/^\d+$/)]],
      commMonth: [''],
      commYear: [null, [Validators.pattern(/^\d{2,4}$/)]],
      
      acfopCapsPartNo: ['', [Validators.maxLength(50)]],
      acfopQty: [null, [Validators.pattern(/^\d+$/)]],
      acfopMonth: [''],
      acfopYear: [null, [Validators.pattern(/^\d{2,4}$/)]],
      
      fansPartNo: ['', [Validators.maxLength(100)]],
      fansQty: [null, [Validators.pattern(/^\d+$/)]],
      fansMonth: [''],
      fansYear: [null, [Validators.pattern(/^\d{2,4}$/)]],
      
      blowersPartNo: ['', [Validators.maxLength(100)]],
      blowersQty: [null, [Validators.pattern(/^\d+$/)]],
      blowersMonth: [''],
      blowersYear: [null, [Validators.pattern(/^\d{2,4}$/)]],
      
      miscPartNo: ['', [Validators.maxLength(100)]],
      miscQty: [null, [Validators.pattern(/^\d+$/)]],
      miscMonth: [''],
      miscYear: [null, [Validators.pattern(/^\d{2,4}$/)]],
      
      comments: ['', [Validators.maxLength(1000)]]
    });

    this.boardDetailsForm = this.fb.group({
      boardItems: this.fb.array([])
    });

    // Subscribe to equipment type changes
    this.basicInfoForm.get('equipType')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(equipType => {
        this.onEquipmentTypeChange(equipType);
      });
  }

  private loadRouteParams(): void {
    this.route.queryParams.subscribe(params => {
      this.callNbr = params['CallNbr'] || params['callNbr'] || '';
      this.equipId = parseInt(params['EquipId'] || params['equipId'] || '0');
      this.equipNo = params['EquipNo'] || params['equipNo'] || '';
      this.techId = params['Tech'] || params['techId'] || '';
      this.techName = params['TechName'] || params['techName'] || '';
      this.digest = params['Digest'] || params['digest'] || '';
      
      if (!this.callNbr || !this.equipId) {
        this.errorMessage = 'Invalid parameters. Call number and equipment ID are required.';
      }
    });
  }

  private async loadEquipmentData(): Promise<void> {
    if (!this.callNbr || !this.equipId) return;
    
    this.loading = true;
    this.errorMessage = '';
    
    try {
      try {
        // Try to load equipment info
        const equipmentInfo = await this.equipmentService.getEditEquipmentInfo(this.callNbr, this.equipId).toPromise();
        
        const boardDetails = await this.equipmentService.getEquipBoardInfo(this.equipNo, this.equipId).toPromise();
        
        this.equipmentInfo = equipmentInfo || null;
        this.boardDetails = boardDetails || [];
        
      } catch (apiError: any) {
        
        // If API fails, create minimal info for new record
        this.equipmentInfo = {
          equipId: 0, // Force INSERT mode
          equipNo: this.equipNo,
          callNbr: this.callNbr,
          vendorId: '', // Required field - provide default
          equipType: 'UPS', // Required field
          codeEquipmentStatus: 'Online'
        };
        this.boardDetails = [];
        
        // Show detailed error to user
        const errorMsg = apiError.error?.message || apiError.message || 'Unknown error loading equipment data';
        this.toastr.error(`Could not load existing equipment data: ${errorMsg}`, 'Data Loading Error');
      }
      
      this.populateFormData();
      this.setupBoardDetailsForm();
      
    } catch (error: any) {
      this.errorMessage = error.error?.message || error.message || 'Failed to load equipment data';
      this.toastr.error(this.errorMessage);
    } finally {
      this.loading = false;
    }
  }

  private populateFormData(): void {
    if (!this.equipmentInfo) return;
    
    // Debug: Log the equipment info to check field values
    
    // Handle case sensitivity issues in API response
    const tagValue = (this.equipmentInfo as any).svC_Asset_tag || (this.equipmentInfo as any).svC_Asset_Tag || '';
    const statusValue = (this.equipmentInfo.codeEquipmentStatus || '').trim();
    
    // Populate basic info form - matching your legacy DisplayEquipment() method
    this.basicInfoForm.patchValue({
      callNbr: this.callNbr, // From route params (txtCallNbr)
      equipNo: this.equipmentInfo.equipNo?.trim() || this.equipNo, // txtSerialNo
      serialId: this.equipmentInfo.serialID || '', // txtSvcSID
      location: this.equipmentInfo.location || '', // txtLocation
      dateCodeMonth: this.equipmentInfo.equipMonth || '', // txtDateCodeMonth
      dateCodeYear: this.equipmentInfo.equipYear || null, // txtDateCodeYear
      status: statusValue || 'Online', // ddlStatus - trim spaces and default to Online if empty
      equipType: (this.equipmentInfo.equipType || '').trim() || 'SELECT', // ddlEquipType
      floatVoltageSelection: this.getFloatVoltageSelection(), // ddlFloatVoltS
      batteryPackCount: this.equipmentInfo.batteriesPerPack ?? 0, // txtPackNo - show 0 instead of null
      batteriesPerString: this.equipmentInfo.batteriesPerString ?? 0, // txtBattNo - show 0 instead of null
      readingType: this.equipmentInfo.readingType || '1', // ddlReadingType
      kva: this.equipmentInfo.upskva || null, // txtKVA
      vendorId: this.equipmentInfo.vendorId || '', // txtVendorID
      version: this.equipmentInfo.version || '', // txtVersion
      tag: tagValue.trim(), // txtTag - Handle both case variations and trim
      contract: this.equipmentInfo.contract || '', // txtContract
      taskDescription: this.equipmentInfo.taskDescription || '' // txtDesc
    });

    // Debug: Log what was actually set in the form
    
    // Trigger equipment type change to show/hide panels
    const equipType = (this.equipmentInfo.equipType || '').trim();
    if (equipType) {
      this.onEquipmentTypeChange(equipType);
    }

    // Populate capacitor form - matching your legacy DisplayEquipment() method
    // Note: Your legacy code set values to empty string if they were "0"
    this.capacitorForm.patchValue({
      // DC Capacitors (txtDCFCapsNo, txtDCFQty, txtDCFMonth, txtDCFYear)
      dcfCapsPartNo: this.equipmentInfo.dcfCapsPartNo || '',
      dcfQty: this.convertZeroToNull(this.equipmentInfo.dcfQty),
      dcfMonth: this.equipmentInfo.dcfCapsMonthName || '',
      dcfYear: this.convertForPattern(this.equipmentInfo.dcfCapsYear), // Use convertForPattern for pattern validator
      
      // AC Input Capacitors (txtACFIPCapsNo, txtACFQty, txtACFMonth, txtACFYear)
      acfipCapsPartNo: this.equipmentInfo.acfipCapsPartNo || '',
      acfQty: this.convertZeroToNull(this.equipmentInfo.acfipQty),
      acfMonth: this.equipmentInfo.acfipCapsMonthName || '',
      acfYear: this.convertForPattern(this.equipmentInfo.acfipYear), // Use convertForPattern for pattern validator
      
      // DC Comm / AC O/P WYE Capacitors (txtDCCommPartNo, txtCommQty, txtCommMonth, txtCommYear)
      dcCommCapsPartNo: this.equipmentInfo.dcCommCapsPartNo || '',
      commQty: this.convertZeroToNull(this.equipmentInfo.dcCommQty),
      commMonth: this.equipmentInfo.dcCommCapsMonthName || '',
      commYear: this.convertForPattern(this.equipmentInfo.dcCommCapsYear), // Use convertForPattern for pattern validator
      
      // AC Output Delta Capacitors (txtACFOPPartsNo, txtACFOPQty, txtACFOPMonth, txtACFOPYear)
      acfopCapsPartNo: this.equipmentInfo.acfopCapsPartNo || '',
      acfopQty: this.convertZeroToNull(this.equipmentInfo.acfopQty),
      acfopMonth: this.equipmentInfo.acfopCapsMonthName || '',
      acfopYear: this.convertForPattern(this.equipmentInfo.acfopYear), // Use convertForPattern for pattern validator
      
      // Fans (txtFansPartsNo, txtFansQty, txtFansMonth, txtFansYear)
      fansPartNo: this.equipmentInfo.fansPartNo || '',
      fansQty: this.convertZeroToNull(this.equipmentInfo.fansQty),
      fansMonth: this.equipmentInfo.fansMonth || '',
      fansYear: this.convertForPattern(this.equipmentInfo.fansYear), // Use convertForPattern for pattern validator
      
      // Blowers (txtBlowersPartsNo, txtBlowersQty, txtBlowersMonth, txtBlowersYear)
      blowersPartNo: this.equipmentInfo.blowersPartNo || '',
      blowersQty: this.convertZeroToNull(this.equipmentInfo.blowersQty),
      blowersMonth: this.equipmentInfo.blowersMonth || '',
      blowersYear: this.convertForPattern(this.equipmentInfo.blowersYear), // Use convertForPattern for pattern validator
      
      // Miscellaneous (txtMiscPartNo, txtMiscQty, txtMiscMonth, txtMiscYear)
      miscPartNo: this.equipmentInfo.miscPartNo || '',
      miscQty: this.convertZeroToNull(this.equipmentInfo.miscQty),
      miscMonth: this.equipmentInfo.miscMonth || '',
      miscYear: this.convertForPattern(this.equipmentInfo.miscYear), // Use convertForPattern for pattern validator
      
      // Comments (txtCapsComments)
      comments: this.equipmentInfo.comments || ''
    });

    // Set panel visibility based on equipment type
    this.onEquipmentTypeChange(this.equipmentInfo.equipType || 'SELECT');
  }

  private setupBoardDetailsForm(): void {
    const boardItemsArray = this.boardDetailsForm.get('boardItems') as FormArray;
    boardItemsArray.clear();
    
    // Get current equipment type from form (user may have changed it)
    const currentEquipType = this.basicInfoForm?.get('equipType')?.value || this.equipmentInfo?.equipType;
    
    // For UPS equipment, always create 15 rows
    if (currentEquipType === 'UPS') {
      for (let i = 0; i < 15; i++) {
        // Check if we have existing data for this row
        const existingDetail = this.boardDetails.find(detail => detail.rowID === (i + 1));
        
        if (existingDetail) {
          // Use existing data
          boardItemsArray.push(this.createBoardDetailFormGroup(existingDetail));
        } else {
          // Create empty row
          boardItemsArray.push(this.createBoardDetailFormGroup({
            rowID: i + 1,
            equipNo: this.equipNo,
            equipID: this.equipId,
            partNo: '',
            qty: undefined,
            description: '',
            comments: ''
          }));
        }
      }
    }
  }

  private createBoardDetailFormGroup(detail: Partial<EquipBoardDetail>): FormGroup {
    return this.fb.group({
      rowID: [detail.rowID || 0],
      equipNo: [detail.equipNo || this.equipNo],
      equipID: [detail.equipID || this.equipId],
      partNo: [detail.partNo || ''],
      qty: [detail.qty, [Validators.min(0), Validators.pattern(/^\d+$/)]],
      description: [detail.description || ''],
      comments: [detail.comments || '']
    });
  }

  get boardItemsArray(): FormArray {
    return this.boardDetailsForm.get('boardItems') as FormArray;
  }

  onEquipmentTypeChange(equipType: string): void {
    const cleanEquipType = (equipType || '').trim().toUpperCase();
    
    this.showBatteryPanel = cleanEquipType === 'BATTERY';
    this.showCapacitorPanel = cleanEquipType === 'UPS';
    this.showBoardPanel = cleanEquipType === 'UPS';
    
    // Update battery field requirement
    const batteriesControl = this.basicInfoForm.get('batteriesPerString');
    if (equipType === 'BATTERY') {
      batteriesControl?.setValidators([Validators.required, Validators.pattern(/^\d+$/)]);
    } else {
      batteriesControl?.clearValidators();
    }
    batteriesControl?.updateValueAndValidity();
    
    // Recreate board details form when switching to UPS equipment
    if (cleanEquipType === 'UPS') {
      this.setupBoardDetailsForm();
    } else {
      // Clear board details form for non-UPS equipment
      const boardItemsArray = this.boardDetailsForm.get('boardItems') as FormArray;
      boardItemsArray.clear();
    }
  }

  async onSave(): Promise<void> {
    
    // Mark all fields as touched to trigger validation display
    this.markAllFieldsAsTouched();
    
    const validationResult = this.validateForms();
    
    if (!validationResult) {
      // Check for specific maxlength errors to provide better messaging
      const hasLengthErrors = this.capacitorForm.get('dcCommCapsPartNo')?.hasError('maxlength') ||
                              this.capacitorForm.get('acfopCapsPartNo')?.hasError('maxlength') ||
                              this.capacitorForm.get('dcfCapsPartNo')?.hasError('maxlength') ||
                              this.capacitorForm.get('acfipCapsPartNo')?.hasError('maxlength') ||
                              this.capacitorForm.get('fansPartNo')?.hasError('maxlength') ||
                              this.capacitorForm.get('blowersPartNo')?.hasError('maxlength') ||
                              this.capacitorForm.get('miscPartNo')?.hasError('maxlength') ||
                              this.capacitorForm.get('comments')?.hasError('maxlength');
      
      if (hasLengthErrors) {
        this.toastr.error('One or more fields exceed the maximum allowed length. Please check the highlighted fields.');
      } else {
        this.toastr.error('Please correct the validation errors before saving.');
      }
      
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const request: UpdateEquipmentRequest = this.buildUpdateRequest();
      
      // Validate field lengths before API call
      const validationErrors: string[] = [];
      
      if (request.dcfCapsPartNo && request.dcfCapsPartNo.length > 50) {
        validationErrors.push(`DC Caps Part Number (${request.dcfCapsPartNo.length} chars) exceeds 50 character limit`);
      }
      if (request.acfipCapsPartNo && request.acfipCapsPartNo.length > 50) {
        validationErrors.push(`AC Input Caps Part Number (${request.acfipCapsPartNo.length} chars) exceeds 50 character limit`);
      }
      if (request.dcCommCapsPartNo && request.dcCommCapsPartNo.length > 50) {
        validationErrors.push(`AC Output WYE Caps Part Number (${request.dcCommCapsPartNo.length} chars) exceeds 50 character limit`);
      }
      if (request.acfopCapsPartNo && request.acfopCapsPartNo.length > 50) {
        validationErrors.push(`AC Output Delta Caps Part Number (${request.acfopCapsPartNo.length} chars) exceeds 50 character limit`);
      }
      if (request.fansPartNo && request.fansPartNo.length > 100) {
        validationErrors.push(`Fans Part Number (${request.fansPartNo.length} chars) exceeds 100 character limit`);
      }
      if (request.blowersPartNo && request.blowersPartNo.length > 100) {
        validationErrors.push(`Blowers Part Number (${request.blowersPartNo.length} chars) exceeds 100 character limit`);
      }
      if (request.miscPartNo && request.miscPartNo.length > 100) {
        validationErrors.push(`Miscellaneous Part Number (${request.miscPartNo.length} chars) exceeds 100 character limit`);
      }
      if (request.comments && request.comments.length > 1000) {
        validationErrors.push(`Comments (${request.comments.length} chars) exceeds 1000 character limit`);
      }

      if (validationErrors.length > 0) {
        this.saving = false;
        const errorMsg = 'Field length validation failed:\n' + validationErrors.join('\n');
        this.toastr.error(errorMsg);
        return;
      }
      
      const response = await this.equipmentService.saveUpdateEquipmentInfo(request).toPromise();
      
      // Save board details if UPS equipment and board panel is shown
      if (this.showBoardPanel && this.boardItemsArray.length > 0) {
        try {
          // Convert form data to board details
          const boardDetailsToSave = this.boardItemsArray.controls
            .map((control, index) => {
              const value = control.value;
              return {
                equipNo: this.equipNo,
                equipID: this.equipId,
                rowID: index + 1, // Use 1-based indexing
                partNo: value.partNo || '',
                description: value.description || '',
                qty: parseInt(value.qty) || 0,
                comments: value.comments || '',
                lastModifiedBy: this.authService.currentUserValue?.userName || 'system',
                lastModifiedOn: new Date()
              } as EquipBoardDetail;
            })
            .filter(detail => detail.partNo.trim() !== '' || detail.description.trim() !== ''); // Only save non-empty rows
          
          // Always call the API, even if boardDetailsToSave is empty (to clear all records)
          console.log(`Saving board details (${boardDetailsToSave.length} items):`, boardDetailsToSave);
          
          // Prepare the request for the UpdateEquipBoardInfo API
          const boardUpdateRequest: UpdateEquipBoardInfoRequest = {
            equipNo: this.equipNo,
            equipId: this.equipId,
            rows: boardDetailsToSave.map(detail => ({
              partNo: detail.partNo,
              description: detail.description,
              qty: detail.qty || 0,
              comments: detail.comments
            } as EquipBoardRow))
          };
          
          try {
            const result = await this.equipmentService.updateEquipBoardInfo(boardUpdateRequest).toPromise();
            
            if (result?.success) {
              if (boardDetailsToSave.length > 0) {
                console.log(`Board details saved successfully. ${result.rowsUpdated} rows updated.`);
                this.toastr.success(`Board details saved successfully! ${result.rowsUpdated} rows updated.`);
              } else {
                console.log('Board details cleared successfully.');
              }
              
              // Store in component for session persistence
              this.boardDetails = boardDetailsToSave;
              
              // Reload board details to confirm persistence
              try {
                const reloadedBoardDetails = await this.equipmentService.getEquipBoardInfo(this.equipNo, this.equipId).toPromise();
                this.boardDetails = reloadedBoardDetails || [];
                this.setupBoardDetailsForm(); // Refresh the form with saved data
              } catch (reloadError) {
                console.warn('Could not reload board details after save:', reloadError);
              }
            } else {
              console.warn('Board details save returned unsuccessful result');
              // Only show warning if there was actual data to save (not when clearing)
              if (boardDetailsToSave.length > 0) {
                this.toastr.warning('Equipment saved successfully, but board details may not have been saved properly.');
              }
            }
          } catch (boardSaveError: any) {
            console.error('Failed to save board details:', boardSaveError);
            // Only show warning if there was actual data to save (not when clearing)
            if (boardDetailsToSave.length > 0) {
              this.toastr.warning('Equipment saved successfully, but board details could not be saved. Please try again.');
            }
          }
        } catch (boardError: any) {
          // Don't fail the whole save if board details fail, just warn
          console.warn('Failed to process board details:', boardError);
          // Only show warning if there was actual data to save (not when clearing)
          const boardDetailsToSave = this.boardItemsArray.controls
            .map((control, index) => {
              const value = control.value;
              return {
                partNo: value.partNo || '',
                description: value.description || ''
              };
            })
            .filter(detail => detail.partNo.trim() !== '' || detail.description.trim() !== '');
          
          if (boardDetailsToSave.length > 0) {
            this.toastr.warning('Equipment saved successfully, but there was an issue processing board details.');
          }
        }
      }
      
      // API returns { Message: "Equipment inserted or updated successfully" } on success
      // Since we get here, the request was successful (no exception thrown)
      const successMsg = (response as any)?.Message || response?.message || 'Equipment updated successfully!';
      this.successMessage = successMsg;
      this.toastr.success(this.successMessage);
      
    } catch (error: any) {
      this.errorMessage = error.error?.message || error.message || 'Failed to save equipment';
      this.toastr.error(this.errorMessage);
    } finally {
      this.saving = false;
    }
  }

  private validateForms(): boolean {
    let isValid = true;
    
    // Mark all fields as touched to show validation errors
    this.basicInfoForm.markAllAsTouched();
    
    if (this.showCapacitorPanel) {
      this.capacitorForm.markAllAsTouched();
    }
    
    if (this.showBoardPanel) {
      this.boardDetailsForm.markAllAsTouched();
    }


    
    // Custom validation for numeric fields
    const numericFields = [
      'dateCodeYear', 'batteryPackCount', 'batteriesPerString', 'kva'
    ];
    
    numericFields.forEach(fieldName => {
      const control = this.basicInfoForm.get(fieldName);
      if (control?.value && !this.isNumeric(control.value.toString())) {
        control.setErrors({ 'numeric': true });
        isValid = false;
      }
    });

    // Validate capacitor numeric fields
    if (this.showCapacitorPanel) {
      const capacitorNumericFields = [
        'dcfQty', 'dcfYear', 'acfQty', 'acfYear', 'commQty', 'commYear',
        'acfopQty', 'acfopYear', 'fansQty', 'fansYear', 'blowersQty', 'blowersYear',
        'miscQty', 'miscYear'
      ];
      
      capacitorNumericFields.forEach(fieldName => {
        const control = this.capacitorForm.get(fieldName);
        if (control?.value && !this.isNumeric(control.value.toString())) {
          control.setErrors({ 'numeric': true });
          isValid = false;
        }
      });

      // Explicitly validate maxlength for part number fields
      const partNumberFields = [
        { name: 'dcfCapsPartNo', maxLength: 50 },
        { name: 'acfipCapsPartNo', maxLength: 50 },
        { name: 'dcCommCapsPartNo', maxLength: 50 },
        { name: 'acfopCapsPartNo', maxLength: 50 },
        { name: 'fansPartNo', maxLength: 100 },
        { name: 'blowersPartNo', maxLength: 100 },
        { name: 'miscPartNo', maxLength: 100 },
        { name: 'comments', maxLength: 1000 }
      ];

      partNumberFields.forEach(field => {
        const control = this.capacitorForm.get(field.name);
        if (control?.value) {
          // Clean the value by removing ALL whitespace before checking length
          const cleanedValue = control.value.replace(/\s+/g, '');
          
          // Update the control with cleaned value
          control.setValue(cleanedValue);
          
          if (cleanedValue.length > field.maxLength) {
            control.setErrors({ 'maxlength': { requiredLength: field.maxLength, actualLength: cleanedValue.length } });
            isValid = false;
          }
        }
      });
    }
    
    const finalValid = isValid && this.basicInfoForm.valid && 
           (!this.showCapacitorPanel || this.capacitorForm.valid) &&
           (!this.showBoardPanel || this.boardDetailsForm.valid);
    
    // Additional safety check for field lengths with aggressive whitespace cleaning
    if (this.showCapacitorPanel) {
      const capacitorData = this.capacitorForm.value;
      
      // Clean all values by removing whitespace and check lengths
      const cleanedData = {
        dcCommCapsPartNo: capacitorData.dcCommCapsPartNo ? capacitorData.dcCommCapsPartNo.replace(/\s+/g, '') : '',
        acfopCapsPartNo: capacitorData.acfopCapsPartNo ? capacitorData.acfopCapsPartNo.replace(/\s+/g, '') : '',
        dcfCapsPartNo: capacitorData.dcfCapsPartNo ? capacitorData.dcfCapsPartNo.replace(/\s+/g, '') : '',
        acfipCapsPartNo: capacitorData.acfipCapsPartNo ? capacitorData.acfipCapsPartNo.replace(/\s+/g, '') : '',
        fansPartNo: capacitorData.fansPartNo ? capacitorData.fansPartNo.replace(/\s+/g, '') : '',
        blowersPartNo: capacitorData.blowersPartNo ? capacitorData.blowersPartNo.replace(/\s+/g, '') : '',
        miscPartNo: capacitorData.miscPartNo ? capacitorData.miscPartNo.replace(/\s+/g, '') : '',
        comments: capacitorData.comments ? capacitorData.comments.replace(/\s+/g, '') : ''
      };
      
      if ((cleanedData.dcCommCapsPartNo && cleanedData.dcCommCapsPartNo.length > 50) ||
          (cleanedData.acfopCapsPartNo && cleanedData.acfopCapsPartNo.length > 50) ||
          (cleanedData.dcfCapsPartNo && cleanedData.dcfCapsPartNo.length > 50) ||
          (cleanedData.acfipCapsPartNo && cleanedData.acfipCapsPartNo.length > 50) ||
          (cleanedData.fansPartNo && cleanedData.fansPartNo.length > 100) ||
          (cleanedData.blowersPartNo && cleanedData.blowersPartNo.length > 100) ||
          (cleanedData.miscPartNo && cleanedData.miscPartNo.length > 100) ||
          (cleanedData.comments && cleanedData.comments.length > 1000)) {
        console.error('Final validation check failed - CLEANED field lengths exceed limits');
        return false;
      }
      
      // Update form controls with cleaned values
      Object.keys(cleanedData).forEach(key => {
        if (this.capacitorForm.get(key)) {
          this.capacitorForm.get(key)?.setValue(cleanedData[key as keyof typeof cleanedData]);
        }
      });
    }
    
    return finalValid;
  }

  private isNumeric(value: string): boolean {
    const validChars = '0123456789';
    for (let i = 0; i < value.length; i++) {
      if (validChars.indexOf(value.charAt(i)) === -1) {
        return false;
      }
    }
    return true;
  }

  private buildUpdateRequest(): UpdateEquipmentRequest {
    const basicData = this.basicInfoForm.value;
    const capacitorData = this.showCapacitorPanel ? this.capacitorForm.value : {};
    
    // Helper function to aggressively remove ALL whitespace
    const trimString = (value: any): string => {
      if (!value || typeof value !== 'string') return '';
      // Remove ALL whitespace characters (spaces, tabs, newlines, etc.)
      return value.replace(/\s+/g, '');
    };
    
      // Get the current user from auth service
      const currentUser = this.authService.currentUserValue?.userName || 'system';
      
      return {
        // Updated to use camelCase property names matching our interface
        callNbr: this.callNbr,
        equipId: this.equipId,
        equipNo: basicData.equipNo || this.equipNo,
        vendorId: basicData.vendorId || '',
        equipType: basicData.equipType || 'UPS',
        version: basicData.version || '',
        serialID: basicData.serialId || '',
        SVC_Asset_Tag: basicData.tag || '', // Use exact casing expected by C# API: SVC_Asset_Tag
        location: basicData.location || '',
        readingType: basicData.readingType || '1',
        contract: basicData.contract || '',
        taskDescription: basicData.taskDescription || '',
        batteriesPerString: this.parseIntOrZero(basicData.batteriesPerString),
        codeEquipmentStatus: basicData.status || 'Online',
        maint_Auth_ID: currentUser,
        upskva: basicData.kva?.toString() || '0',
        equipMonth: basicData.dateCodeMonth || '',
        equipYear: this.parseIntOrZero(basicData.dateCodeYear),
        
        // Capacitor info - using camelCase property names with trimmed values
        dcfCapsPartNo: trimString(capacitorData.dcfCapsPartNo),
        acfipCapsPartNo: trimString(capacitorData.acfipCapsPartNo),
        dcfQty: this.parseIntOrZero(capacitorData.dcfQty),
        acfipQty: this.parseIntOrZero(capacitorData.acfQty),
        dcfCapsMonthName: capacitorData.dcfMonth || '',
        acfipCapsMonthName: capacitorData.acfMonth || '',
        dcfCapsYear: this.parseIntOrZero(capacitorData.dcfYear), // Updated to use form value
        acfipYear: this.parseIntOrZero(capacitorData.acfYear), // Updated to use form value
        
        dcCommCapsPartNo: trimString(capacitorData.dcCommCapsPartNo),
        acfopCapsPartNo: trimString(capacitorData.acfopCapsPartNo),
        dcCommQty: this.parseIntOrZero(capacitorData.commQty),
        acfopQty: this.parseIntOrZero(capacitorData.acfopQty),
        dcCommCapsMonthName: capacitorData.commMonth || '',
        acfopCapsMonthName: capacitorData.acfopMonth || '',
        dcCommCapsYear: this.parseIntOrZero(capacitorData.commYear), // Updated to use form value
        acfopYear: this.parseIntOrZero(capacitorData.acfopYear), // Updated to use form value
        
        batteriesPerPack: this.parseIntOrZero(basicData.batteryPackCount),
        vfSelection: basicData.floatVoltageSelection || 'PS',
        
        fansPartNo: trimString(capacitorData.fansPartNo),
        fansQty: this.parseIntOrZero(capacitorData.fansQty),
        fansMonth: capacitorData.fansMonth || '',
        fansYear: this.parseIntOrZero(capacitorData.fansYear),
        
        blowersPartNo: trimString(capacitorData.blowersPartNo),
        blowersQty: this.parseIntOrZero(capacitorData.blowersQty),
        blowersMonth: capacitorData.blowersMonth || '',
        blowersYear: this.parseIntOrZero(capacitorData.blowersYear),
        
        miscPartNo: trimString(capacitorData.miscPartNo),
        miscQty: this.parseIntOrZero(capacitorData.miscQty),
        miscMonth: capacitorData.miscMonth || '',
        miscYear: this.parseIntOrZero(capacitorData.miscYear),
        
        comments: trimString(capacitorData.comments)
    };
  }

  // Note: Board details are not handled in the current API structure
  // If needed, they should be managed through a separate API call

  goBack(): void {
    this.router.navigate(['/jobs/equipment-details'], {
      queryParams: {
        CallNbr: this.callNbr,
        Tech: this.techId,
        TechName: this.techName,
        Digest: this.digest
      }
    });
  }

  // Utility methods for template
  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
      if (field.errors['maxlength']) {
        const maxLength = field.errors['maxlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} cannot exceed ${maxLength} characters`;
      }
      if (field.errors['pattern']) return `${this.getFieldLabel(fieldName)} must contain only numbers`;
      if (field.errors['numeric']) return `${this.getFieldLabel(fieldName)} must contain only integer values`;
    }
    return '';
  }

  /**
   * Calculate total batteries when battery pack fields change (legacy logic)
   * Replicates: Me.lblTotBatt.Text = Val(Me.txtPackNo.Text) * Val(Me.txtBattNo.Text)
   */
  private updateBatteryCalculations(): void {
    const packCount = this.basicInfoForm.get('batteryPackCount')?.value;
    const batteriesPerString = this.basicInfoForm.get('batteriesPerString')?.value;
    
    if (packCount && batteriesPerString) {
      const totalBatteries = packCount * batteriesPerString;
      // Update the total batteries display (you can add this to your template)
    }
  }

  /**
   * Get float voltage selection value, handling various formats
   * Based on legacy VFSelection field behavior
   */
  private getFloatVoltageSelection(): string {
    const vfSelection = this.equipmentInfo?.vfSelection;
    
    if (!vfSelection || vfSelection.trim() === '') {
      return 'PS'; // Default to "Please Select" - legacy behavior for empty values
    }
    
    const trimmed = vfSelection.trim();
    
    // If it's still empty after trim, use legacy default
    if (trimmed === '') {
      return 'PS'; // Please Select - legacy default
    }
    
    // Use exact value from API if it matches our options
    // Check if the trimmed value matches any of our option values exactly
    const validOptions = ['PS', 'OF', 'ON', 'BP'];
    if (validOptions.includes(trimmed)) {
      return trimmed;
    }
    
    // If no exact match, default to Please Select (legacy behavior)
    return 'PS';
  }

  // Replicates legacy behavior: if value is 0, show empty string instead
  // Your legacy code: if (txtDCFQty.Text == "0") { txtDCFQty.Text = ""; }
  private convertZeroToNull(value: number | undefined | null): number | null {
    return (value === 0 || value === undefined) ? null : value;
  }

  // Convert values for pattern validation - pattern validators need strings, not null
  private convertForPattern(value: number | string | undefined | null): string {
    if (value === 0 || value === '0' || value === undefined || value === null) {
      return ''; // Empty string for pattern validators
    }
    return value.toString();
  }

  // Helper to safely parse integers from form values
  private parseIntOrZero(value: any): number {
    if (value === null || value === undefined || value === '' || value === '0') {
      return 0;
    }
    const parsed = parseInt(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  // Helper to truncate strings to specified length
  private truncateString(value: string, maxLength: number): string {
    if (!value) return '';
    return value.length > maxLength ? value.substring(0, maxLength) : value;
  }

  // Method to handle input change and auto-truncate if necessary
  onPartNumberInput(event: Event, fieldName: string, maxLength: number): void {
    const input = event.target as HTMLInputElement;
    
    // AGGRESSIVE whitespace removal - remove ALL whitespace characters
    let inputValue = input.value.replace(/\s+/g, ''); // Remove all whitespace (spaces, tabs, newlines)
    
    if (inputValue.length > maxLength) {
      const truncatedValue = inputValue.substring(0, maxLength);
      input.value = truncatedValue;
      this.capacitorForm.get(fieldName)?.setValue(truncatedValue);
      // Show a brief warning
      this.toastr.warning(`${this.getFieldLabel(fieldName)} has been truncated to ${maxLength} characters.`, '', {
        timeOut: 2000
      });
    } else {
      // Update both the input and form control with cleaned value
      input.value = inputValue;
      this.capacitorForm.get(fieldName)?.setValue(inputValue);
    }
  }

  // Method to aggressively remove whitespace when user leaves the field
  onPartNumberBlur(event: Event, fieldName: string): void {
    const input = event.target as HTMLInputElement;
    // Remove ALL whitespace characters completely
    const cleanedValue = input.value.replace(/\s+/g, '');
    
    // Update both the input field and form control with cleaned value
    input.value = cleanedValue;
    this.capacitorForm.get(fieldName)?.setValue(cleanedValue);
  }

  // Method to handle focus - clear whitespace and position cursor at start
  onPartNumberFocus(event: Event, fieldName: string): void {
    const input = event.target as HTMLInputElement;
    
    // Aggressively remove ALL whitespace
    const cleanedValue = input.value.replace(/\s+/g, '');
    input.value = cleanedValue;
    this.capacitorForm.get(fieldName)?.setValue(cleanedValue);
    
    // Set cursor to the beginning if field is empty
    setTimeout(() => {
      if (cleanedValue === '') {
        input.setSelectionRange(0, 0);
      }
    }, 0);
  }

  // Helper method to check if a field has a specific error
  hasError(fieldName: string, formGroup: FormGroup, errorType: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.hasError(errorType) && (field.dirty || field.touched));
  }

  // Helper method to get error message for a field
  getErrorMessage(fieldName: string, formGroup: FormGroup): string {
    const field = formGroup.get(fieldName);
    if (!field) return '';

    if (field.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (field.hasError('maxlength')) {
      const maxLength = field.getError('maxlength').requiredLength;
      return `${this.getFieldLabel(fieldName)} cannot exceed ${maxLength} characters`;
    }
    if (field.hasError('pattern')) {
      return `${this.getFieldLabel(fieldName)} has an invalid format`;
    }
    return '';
  }

  // Helper method to get user-friendly field labels
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      // Basic Info Form Fields
      'callNbr': 'Job Number',
      'equipNo': 'Equipment No',
      'serialId': 'Serial No',
      'location': 'Location',
      'equipType': 'Equipment Type',
      'readingType': 'Reading Type',
      'vendorId': 'Vendor ID',
      'version': 'Version',
      'tag': 'Tag',
      'contract': 'Contract',
      'taskDescription': 'Task Description',
      // Capacitor Form Fields
      'dcfCapsPartNo': 'DC Caps Part Number',
      'acfipCapsPartNo': 'AC Input Caps Part Number',
      'dcCommCapsPartNo': 'AC Output WYE Caps Part Number',
      'acfopCapsPartNo': 'AC Output Delta Caps Part Number',
      'fansPartNo': 'Fans Part Number',
      'blowersPartNo': 'Blowers Part Number',
      'miscPartNo': 'Miscellaneous Part Number',
      'comments': 'Comments'
    };
    return labels[fieldName] || fieldName;
  }

  // Mark all form fields as touched to trigger validation display
  private markAllFieldsAsTouched(): void {
    this.basicInfoForm.markAllAsTouched();
    if (this.showCapacitorPanel) {
      this.capacitorForm.markAllAsTouched();
    }
    if (this.showBoardPanel) {
      this.boardDetailsForm.markAllAsTouched();
    }
  }

  /**
   * Handle qty input to prevent negative values
   */
  onQtyInput(event: any, rowIndex: number): void {
    const value = parseInt(event.target.value);
    if (value < 0 || isNaN(value)) {
      const control = this.boardItemsArray.at(rowIndex).get('qty');
      control?.setValue(0);
      event.target.value = 0;
    }
  }

  /**
   * Prevent negative numbers from being typed
   */
  onQtyKeyDown(event: KeyboardEvent): void {
    // Allow: backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(event.keyCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (event.keyCode === 65 && event.ctrlKey === true) ||
        (event.keyCode === 67 && event.ctrlKey === true) ||
        (event.keyCode === 86 && event.ctrlKey === true) ||
        (event.keyCode === 88 && event.ctrlKey === true)) {
      return;
    }
    // Prevent: minus sign and anything that's not a number
    if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && 
        (event.keyCode < 96 || event.keyCode > 105)) {
      event.preventDefault();
    }
  }
}