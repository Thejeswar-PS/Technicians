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

  // UI state
  showBatteryPanel = false;
  showCapacitorPanel = false;
  showBoardPanel = false;

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
      callNbr: ['', Validators.required],
      equipNo: ['', Validators.required],
      serialId: [''],
      location: [''],
      dateCodeMonth: [''],
      dateCodeYear: [null, [Validators.pattern(/^\d{2,4}$/)]],
      status: ['', Validators.required],
      equipType: ['SELECT', Validators.required],
      floatVoltageSelection: ['PS'],
      batteryPackCount: [null, [Validators.pattern(/^\d+$/)]],
      batteriesPerString: [null, [Validators.pattern(/^\d+$/)]],
      readingType: ['1'],
      kva: [null, [Validators.pattern(/^\d+(\.\d+)?$/)]],
      vendorId: [''],
      version: [''],
      tag: [''],
      contract: [''],
      taskDescription: ['']
    });

    this.capacitorForm = this.fb.group({
      dcfCapsPartNo: [''],
      dcfQty: [null, [Validators.pattern(/^\d+$/)]],
      dcfMonth: [''],
      dcfYear: [null, [Validators.pattern(/^\d{2,4}$/)]],
      
      acfipCapsPartNo: [''],
      acfQty: [null, [Validators.pattern(/^\d+$/)]],
      acfMonth: [''],
      acfYear: [null, [Validators.pattern(/^\d{2,4}$/)]],
      
      dcCommCapsPartNo: [''],
      commQty: [null, [Validators.pattern(/^\d+$/)]],
      commMonth: [''],
      commYear: [null, [Validators.pattern(/^\d{2,4}$/)]],
      
      acfopCapsPartNo: [''],
      acfopQty: [null, [Validators.pattern(/^\d+$/)]],
      acfopMonth: [''],
      acfopYear: [null, [Validators.pattern(/^\d{2,4}$/)]],
      
      fansPartNo: [''],
      fansQty: [null, [Validators.pattern(/^\d+$/)]],
      fansMonth: [''],
      fansYear: [null, [Validators.pattern(/^\d{2,4}$/)]],
      
      blowersPartNo: [''],
      blowersQty: [null, [Validators.pattern(/^\d+$/)]],
      blowersMonth: [''],
      blowersYear: [null, [Validators.pattern(/^\d{2,4}$/)]],
      
      miscPartNo: [''],
      miscQty: [null, [Validators.pattern(/^\d+$/)]],
      miscMonth: [''],
      miscYear: [null, [Validators.pattern(/^\d{2,4}$/)]],
      
      comments: ['']
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
          equipType: 'UPS',
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
    
    // Populate basic info form - matching your legacy DisplayEquipment() method
    this.basicInfoForm.patchValue({
      callNbr: this.callNbr, // From route params (txtCallNbr)
      equipNo: this.equipmentInfo.equipNo?.trim() || this.equipNo, // txtSerialNo
      serialId: this.equipmentInfo.serialID || '', // txtSvcSID
      location: this.equipmentInfo.location || '', // txtLocation
      dateCodeMonth: this.equipmentInfo.equipMonth || '', // txtDateCodeMonth
      dateCodeYear: this.equipmentInfo.equipYear || null, // txtDateCodeYear
      status: this.equipmentInfo.codeEquipmentStatus || '', // ddlStatus
      equipType: (this.equipmentInfo.equipType || '').trim() || 'SELECT', // ddlEquipType
      floatVoltageSelection: this.getFloatVoltageSelection(), // ddlFloatVoltS
      batteryPackCount: this.equipmentInfo.batteriesPerPack ?? 0, // txtPackNo - show 0 instead of null
      batteriesPerString: this.equipmentInfo.batteriesPerString ?? 0, // txtBattNo - show 0 instead of null
      readingType: this.equipmentInfo.readingType || '1', // ddlReadingType
      kva: this.equipmentInfo.upskva || null, // txtKVA
      vendorId: this.equipmentInfo.vendorId || '', // txtVendorID
      version: this.equipmentInfo.version || '', // txtVersion
      tag: (this.equipmentInfo.svC_Asset_Tag || '').trim(), // txtTag - Fixed property name
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
    
    // If no board details exist, create 15 empty rows for UPS equipment
    if (this.boardDetails.length === 0 && this.equipmentInfo?.equipType === 'UPS') {
      for (let i = 0; i < 15; i++) {
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
    } else {
      // Populate with existing board details
      this.boardDetails.forEach(detail => {
        boardItemsArray.push(this.createBoardDetailFormGroup(detail));
      });
    }
  }

  private createBoardDetailFormGroup(detail: Partial<EquipBoardDetail>): FormGroup {
    return this.fb.group({
      rowID: [detail.rowID || 0],
      equipNo: [detail.equipNo || this.equipNo],
      equipID: [detail.equipID || this.equipId],
      partNo: [detail.partNo || ''],
      qty: [detail.qty, [Validators.pattern(/^\d+$/)]],
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
  }

  async onSave(): Promise<void> {
    if (!this.validateForms()) {
      this.toastr.error('Please correct the validation errors before saving.');
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const request: UpdateEquipmentRequest = this.buildUpdateRequest();
      
      const response = await this.equipmentService.saveUpdateEquipmentInfo(request).toPromise();
      
      if (response?.success) {
        this.successMessage = 'Equipment updated successfully!';
        this.toastr.success(this.successMessage);
      } else {
        this.errorMessage = response?.message || 'Failed to update equipment';
        this.toastr.error(this.errorMessage);
      }
      
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
    }
    
    const finalValid = isValid && this.basicInfoForm.valid && 
           (!this.showCapacitorPanel || this.capacitorForm.valid) &&
           (!this.showBoardPanel || this.boardDetailsForm.valid);
    
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
    
      // Get the current user from auth service
      const currentUser = this.authService.currentUserValue?.userName || 'system';
      
      return {
        // Exact parameter names matching stored procedure
        CallNbr: this.callNbr,
        EquipId: this.equipId,
        EquipNo: basicData.equipNo || this.equipNo,
        VendorId: basicData.vendorId || '',
        EquipType: basicData.equipType || 'UPS',
        Version: basicData.version || '',
        SerialID: basicData.serialId || '',
        SVC_Asset_Tag: basicData.tag || '',
        Location: basicData.location || '',
        ReadingType: basicData.readingType || '1',
        Contract: basicData.contract || '',
        TaskDesc: basicData.taskDescription || '',
        BatPerStr: this.parseIntOrZero(basicData.batteriesPerString),
        EquipStatus: basicData.status || 'Online',
        MaintAuth: currentUser,
        KVA: basicData.kva?.toString() || '0',
        EquipMonth: basicData.dateCodeMonth || '',
        EquipYear: this.parseIntOrZero(basicData.dateCodeYear),
        
        // Capacitor info - integers must be 0, not null (C# DTO expects int, not int?)
        DCFCapsPartNo: capacitorData.dcfCapsPartNo || '',
        ACFIPCapsPartNo: capacitorData.acfipCapsPartNo || '',
        DCFQty: this.parseIntOrZero(capacitorData.dcfQty),
        ACFIPQty: this.parseIntOrZero(capacitorData.acfQty),
        DCFCapsMonthName: capacitorData.dcfMonth || '',
        ACFIPCapsMonthName: capacitorData.acfMonth || '',
        DCFCapsYear: 0, // Match backend DTO property name (with F)
        ACFIPYear: 0, // Force to 0 to test
        
        DCCommCapsPartNo: capacitorData.dcCommCapsPartNo || '',
        ACFOPCapsPartNo: capacitorData.acfopCapsPartNo || '',
        DCCommQty: this.parseIntOrZero(capacitorData.commQty),
        ACFOPQty: this.parseIntOrZero(capacitorData.acfopQty),
        DCCommCapsMonthName: capacitorData.commMonth || '',
        ACFOPCapsMonthName: capacitorData.acfopMonth || '',
        DCCommCapsYear: 0, // Force to 0 to test
        ACFOPYear: 0, // Force to 0 to test
        
        BatteriesPerPack: this.parseIntOrZero(basicData.batteryPackCount),
        VFSelection: basicData.floatVoltageSelection || 'PS',
        
        FansPartNo: capacitorData.fansPartNo || '',
        FansQty: this.parseIntOrZero(capacitorData.fansQty),
        FansMonth: capacitorData.fansMonth || '',
        FansYear: this.parseIntOrZero(capacitorData.fansYear),
        
        BlowersPartNo: capacitorData.blowersPartNo || '',
        BlowersQty: this.parseIntOrZero(capacitorData.blowersQty),
        BlowersMonth: capacitorData.blowersMonth || '',
        BlowersYear: this.parseIntOrZero(capacitorData.blowersYear),
        
        MiscPartNo: capacitorData.miscPartNo || '',
        MiscQty: this.parseIntOrZero(capacitorData.miscQty),
        MiscMonth: capacitorData.miscMonth || '',
        MiscYear: this.parseIntOrZero(capacitorData.miscYear),
        
        Comments: capacitorData.comments || ''
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
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['pattern']) return `${fieldName} must contain only numbers`;
      if (field.errors['numeric']) return `${fieldName} must contain only integer values`;
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
}