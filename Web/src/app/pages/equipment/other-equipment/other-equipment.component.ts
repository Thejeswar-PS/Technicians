import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EquipmentService } from '../../../core/services/equipment.service';
import { AuthService } from '../../../modules/auth/services/auth.service';
import { UpdateEquipStatus } from '../../../core/model/ups-readings.model';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-other-equipment',
  templateUrl: './other-equipment.component.html',
  styleUrls: ['./other-equipment.component.scss']
})
export class OtherEquipmentComponent implements OnInit {
  /**
   * Other Equipment Page
   * 
   * Legacy Implementation Notes:
   * - DisplayOtherInfo() calls da.GetSCCInfo() -> reuses SCC page's getSCCInfo()
   * - UpdateSCCInfo() calls da.SaveUpdateSCC() with SprocName="SaveUpdateOther"
   * - Both use the same service methods as SCC readings page
   * 
   * Load Sequence:
   * 1. BindManufs() -> calls equipmentService.getManufacturerNames()
   * 2. GetEquipInfo() -> calls equipmentService.editEquipInfo()
   * 3. DisplayOtherInfo() -> calls equipmentService.getSCCInfo()
   * 
   * Save Sequence:
   * 1. UpdateSCCInfo() -> calls equipmentService.saveUpdateSCC() with SaveUpdateOther sproc
   * 2. UpdateEquipStatus() -> calls equipmentService.updateEquipStatus()
   */
  // Page state
  callNbr: string = '';
  equipId: number = 0;
  equipNo: string = '';
  techId: string = '';
  
  // Forms
  equipmentVerificationForm: FormGroup;
  
  // Section toggles
  showEquipmentVerification = true;
  
  // Dropdown options
  manufacturers: any[] = [];
  statusOptions = [
    { value: 'Online', label: 'On-Line' },
    { value: 'CriticalDeficiency', label: 'Critical Deficiency' },
    { value: 'ReplacementRecommended', label: 'Replacement Recommended' },
    { value: 'OnLine(MajorDeficiency)', label: 'On-Line(Major Deficiency)' },
    { value: 'OnLine(MinorDeficiency)', label: 'On-Line(Minor Deficiency)' },
    { value: 'Offline', label: 'Off-Line' }
  ];

  // Cache loaded data for save operations
  sccDataCache: any = {};

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private equipmentService: EquipmentService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {
    this.equipmentVerificationForm = this.fb.group({
      manufacturer: ['', [Validators.required]],
      modelNo: ['', [Validators.required]],
      serialNo: ['', [Validators.required]],
      location: [''],
      dateCode: [''],
      status: ['Online', [Validators.required]],
      statusNotes: [''],
      comments: ['']
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.callNbr = params['CallNbr'] || params['callNbr'] || '';
      this.equipId = parseInt(params['EquipId'] || params['equipId'] || '0', 10);
      this.equipNo = params['EquipNo'] || params['equipNo'] || '';
      this.techId = params['Tech'] || params['tech'] || '';

      if (this.callNbr && this.equipId && this.equipNo) {
        // Load in sequence: manufacturers → equipment info → other equipment info
        this.loadManufacturers();
      }
    });
  }

  /**
   * Legacy: BindManufs()
   * Load manufacturers from the service
   */
  private loadManufacturers(): void {
    console.log('[Other Load] Step 1: loadManufacturers started');
    this.equipmentService.getManufacturerNames().subscribe({
      next: (data: any) => {
        console.log('[Other Load] Manufacturers response:', data);
        if (data && Array.isArray(data)) {
          this.manufacturers = data.map(m => ({
            value: m.value || m.Value || '',
            label: m.label || m.Label || m.value || m.Value || ''
          }));
          console.log('[Other Load] Manufacturers normalized:', this.manufacturers.length);
        }
        // Chain to next step
        this.loadEquipmentInfo();
      },
      error: (error: any) => {
        console.error('Error loading manufacturers:', error);
        this.toastr.error('Failed to load manufacturers');
        // Continue anyway
        this.loadEquipmentInfo();
      }
    });
  }

  /**
   * Legacy: GetEquipInfo()
   * Load equipment info from EditEquipInfo API
   */
  private loadEquipmentInfo(): void {
    console.log('[Other Load] Step 2: loadEquipmentInfo started');
    this.equipmentService.editEquipInfo(this.callNbr, this.equipId, this.equipNo).subscribe({
      next: (data: any) => {
        console.log('[Other Load] EditEquipInfo response:', data);
        if (data) {
          // Legacy mapping: txtSerialNo.Text = dr["SerialID"].ToString().Trim();
          const serialId = (data.serialID || data.SerialID || '').toString().trim();
          console.log('[Other Load] Mapping SerialID:', serialId);
          this.equipmentVerificationForm.patchValue({
            serialNo: serialId
          });

          // Legacy mapping: txtModel.Text = dr["Version"].ToString().Trim();
          const version = (data.version || data.Version || '').toString().trim();
          console.log('[Other Load] Mapping Version:', version);
          this.equipmentVerificationForm.patchValue({
            modelNo: version
          });

          // Legacy mapping: txtLocation.Text = dr["Location"].ToString().Trim();
          const location = (data.location || data.Location || '').toString().trim();
          console.log('[Other Load] Mapping Location:', location);
          this.equipmentVerificationForm.patchValue({
            location: location
          });

          // Legacy mapping: Date Code from EquipYear and EquipMonth
          const equipYear = this.parseIntSafe(data.equipYear || data.EquipYear);
          const equipMonth = (data.equipMonth || data.EquipMonth || '').toString().trim();
          console.log('[Other Load] Mapping DateCode - Month:', equipMonth, 'Year:', equipYear);
          
          if (equipYear > 0 && equipMonth !== '') {
            const dateStr = `${equipMonth} 1, ${equipYear}`;
            const date = new Date(dateStr);
            console.log('[Other Load] DateCode string:', dateStr, '→ Date:', date);
            
            if (!isNaN(date.getTime())) {
              const dateCode = this.formatDate(date);
              console.log('[Other Load] DateCode formatted:', dateCode);
              this.equipmentVerificationForm.patchValue({
                dateCode: dateCode
              });
            }
          }

          // Legacy mapping: Manufacturer selection
          const vendorId = (data.vendorId || data.VendorId || '').toString().trim();
          console.log('[Other Load] Mapping Manufacturer - VendorId:', vendorId);
          const manufacturer = this.manufacturers.find(m => m.value.trim() === vendorId);
          if (manufacturer) {
            console.log('[Other Load] Manufacturer found:', manufacturer);
            this.equipmentVerificationForm.patchValue({
              manufacturer: manufacturer.value
            });
          } else {
            console.log('[Other Load] Manufacturer NOT found');
          }
        }

        // Chain to next step
        console.log('[Other Load] equipmentVerificationForm state after editEquipInfo:', this.equipmentVerificationForm.value);
        this.loadOtherEquipmentInfo();
      },
      error: (error: any) => {
        console.error('Error loading equipment info:', error);
        this.toastr.error('Failed to load equipment information');
        // Continue anyway
        this.loadOtherEquipmentInfo();
      }
    });
  }

  /**
   * Legacy: DisplayOtherInfo()
   * Calls GetSCCInfo (same as SCC page, but used for Other Equipment data)
   */
  private loadOtherEquipmentInfo(): void {
    console.log('[Other Load] Step 3: loadOtherEquipmentInfo started');
    this.equipmentService.getSCCInfo(this.callNbr, this.equipNo).subscribe({
      next: (response: any) => {
        console.log('[Other Load] GetSCCInfo response:', response);
        if (response) {
          const data = Array.isArray(response) ? response[0] : response;
          console.log('[Other Load] Other equipment data:', data);

          // Cache the full response for save operations
          this.sccDataCache = data;

          if (data) {
            // Legacy mappings from DisplayOtherInfo - data comes from GetSCCInfo
            const manufacturer = (data.manufacturer || data.Manufacturer || '').toString().trim();
            const modelNo = (data.modelNo || data.ModelNo || '').toString().trim();
            const serialNo = (data.serialNo || data.SerialNo || '').toString().trim();
            const status = (data.status || data.Status || 'Online').toString().trim();
            const statusNotes = (data.statusNotes || data.StatusNotes || '').toString().trim();
            const comments = (data.comments || data.Comments || '').toString().trim();

            console.log('[Other Load] Mapping Other fields - Manufacturer:', manufacturer, 'Model:', modelNo, 'Serial:', serialNo);

            this.equipmentVerificationForm.patchValue({
              manufacturer: manufacturer,
              modelNo: modelNo,
              serialNo: serialNo,
              status: status,
              statusNotes: statusNotes,
              comments: comments
            });

            console.log('[Other Load] After other equip patch:', this.equipmentVerificationForm.value);
          }
        }
      },
      error: (error: any) => {
        console.error('Error loading other equipment info:', error);
        this.toastr.error('Failed to load other equipment information');
      }
    });
  }

  /**
   * Legacy: Validate() - Check if status requires notes
   */
  private validateForm(): boolean {
    const status = this.equipmentVerificationForm.get('status')?.value;
    const statusNotes = this.equipmentVerificationForm.get('statusNotes')?.value || '';

    if (status !== 'Online' && !statusNotes.trim()) {
      this.toastr.warning('Please enter the reason for status');
      return false;
    }

    return true;
  }

  /**
   * Legacy: UpdateSCCInfo() + btnSave_Click()
   * Save equipment information
   */
  saveEquipment(): void {
    if (!this.validateForm()) {
      return;
    }

    console.log('[Other Save] Starting save flow');
    const formValue = this.equipmentVerificationForm.value;
    const currentUser = this.authService.currentUserSubject.value;

    // Legacy: Create UpdateSCCInfo payload with SaveUpdateOther sproc
    // Uses the same SaveUpdateSCC method as SCC page, but with different sproc
    const otherData = {
      sprocName: 'SaveUpdateOther',
      sccId: this.equipNo,
      callNbr: this.callNbr,
      equipId: this.equipId,
      maint_Auth_ID: currentUser?.empId ? currentUser.empId.toString() : '',
      manufacturer: formValue.manufacturer,
      modelNo: formValue.modelNo,
      serialNo: formValue.serialNo,
      status: formValue.status,
      statusNotes: formValue.statusNotes,
      comments: formValue.comments,
      // Include all SCC fields from cache to avoid API validation errors (use camelCase)
      partNos: (this.sccDataCache.partNos || this.sccDataCache.PartNos || '').toString(),
      phaseError: (this.sccDataCache.phaseError || this.sccDataCache.PhaseError || '').toString(),
      bypassVoltA: (this.sccDataCache.bypassVoltA || this.sccDataCache.BypassVoltA || '').toString(),
      bypassVoltB: (this.sccDataCache.bypassVoltB || this.sccDataCache.BypassVoltB || '').toString(),
      bypassVoltC: (this.sccDataCache.bypassVoltC || this.sccDataCache.BypassVoltC || '').toString(),
      supplyVoltA: (this.sccDataCache.supplyVoltA || this.sccDataCache.SupplyVoltA || '').toString(),
      supplyVoltB: (this.sccDataCache.supplyVoltB || this.sccDataCache.SupplyVoltB || '').toString(),
      supplyVoltC: (this.sccDataCache.supplyVoltC || this.sccDataCache.SupplyVoltC || '').toString(),
      outputVoltA: (this.sccDataCache.outputVoltA || this.sccDataCache.OutputVoltA || '').toString(),
      outputVoltB: (this.sccDataCache.outputVoltB || this.sccDataCache.OutputVoltB || '').toString(),
      outputVoltC: (this.sccDataCache.outputVoltC || this.sccDataCache.OutputVoltC || '').toString(),
      loadCurrent: (this.sccDataCache.loadCurrent || this.sccDataCache.LoadCurrent || '').toString(),
      firmwareVersion: (this.sccDataCache.firmwareVersion || this.sccDataCache.FirmwareVersion || '').toString(),
      temp: this.parseIntSafe(this.sccDataCache.temp || this.sccDataCache.Temp || 0)
    };

    console.log('[Other Save] Saving other equipment via SaveUpdateSCC:', otherData);

    // Legacy: UpdateSCCInfo() uses da.SaveUpdateSCC() with SaveUpdateOther sproc
    // Then UpdateEquipStatus() - Update equipment status
    forkJoin({
      otherEquip: this.equipmentService.saveUpdateSCC(otherData),
      equipStatus: this.updateEquipmentStatus(formValue)
    }).subscribe({
      next: (result) => {
        console.log('[Other Save] Save result:', result);
        this.toastr.success('Other equipment updated successfully');
        // Reload data on the same page
        this.loadManufacturers();
      },
      error: (error) => {
        console.error('Error saving equipment:', error);
        this.toastr.error('Failed to save equipment information');
      }
    });
  }

  /**
   * Legacy: UpdateEquipStatus()
   * Update equipment status with validation
   */
  private updateEquipmentStatus(formValue: any): any {
    const currentUser = this.authService.currentUserSubject.value;
    const dateCode = formValue.dateCode || '';
    let monthName = '';
    let year = new Date().getFullYear();

    // Parse date code to extract month and year (use UTC to avoid timezone issues)
    if (dateCode) {
      try {
        const date = new Date(dateCode);
        if (!isNaN(date.getTime())) {
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
          monthName = monthNames[date.getUTCMonth()];
          year = date.getUTCFullYear();
        }
      } catch (e) {
        console.error('Error parsing date code:', e);
      }
    }

    // Validate: if status != Online, statusNotes required
    if (formValue.status !== 'Online') {
      if (!formValue.statusNotes || !formValue.statusNotes.trim()) {
        return throwError(() => new Error('Status notes are required when status is not Online'));
      }
    }

    const updatePayload: UpdateEquipStatus = {
      callNbr: this.callNbr,
      equipId: this.equipId,
      status: formValue.status,
      notes: formValue.statusNotes || '',
      tableName: 'ETechOther',
      manufacturer: formValue.manufacturer,
      modelNo: formValue.modelNo,
      serialNo: formValue.serialNo,
      location: formValue.location,
      monthName: monthName,
      year: year,
      readingType: '1',
      batteriesPerString: 0,
      batteriesPerPack: 0,
      vfSelection: '',
      maintAuthID: currentUser?.empId || ''
    };

    console.log('[Other Save] Updating equipment status:', updatePayload);
    return this.equipmentService.updateEquipStatus(updatePayload);
  }

  /**
   * Navigate back to equipment details
   */
  goBack(): void {
    this.router.navigate(['/jobs/equipment-details'], {
      queryParams: {
        CallNbr: this.callNbr,
        Tech: this.techId
      }
    });
  }

  // Helper methods
  private parseIntSafe(value: any): number {
    try {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? 0 : parsed;
    } catch {
      return 0;
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}

// Helper function for error handling
function throwError(errorFactory: () => Error): any {
  return new Promise((_, reject) => reject(errorFactory()));
}
