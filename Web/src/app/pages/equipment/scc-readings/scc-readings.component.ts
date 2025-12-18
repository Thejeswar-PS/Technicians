import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { EquipmentService } from 'src/app/core/services/equipment.service';
import { SCCReadings, SCCReconciliationInfo } from 'src/app/core/model/scc-readings.model';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-scc-readings',
  templateUrl: './scc-readings.component.html',
  styleUrls: ['./scc-readings.component.scss']
})
export class SccReadingsComponent implements OnInit {
  // Route Parameters
  callNbr: string = '';
  equipId: number = 0;
  equipNo: string = '';
  techId: string = '';
  techName: string = '';
  digest: string = '';

  // Forms
  equipmentVerificationForm!: FormGroup;
  reconciliationForm!: FormGroup;
  voltageSettingsForm!: FormGroup;
  commentsForm!: FormGroup;

  // Dropdown options
  manufacturers: any[] = [];
  
  statusOptions = [
    { label: 'On-Line', value: 'Online' },
    { label: 'Critical Deficiency', value: 'CriticalDeficiency' },
    { label: 'On-Line(Major Deficiency)', value: 'OnLine(MajorDeficiency)' },
    { label: 'On-Line(Minor Deficiency)', value: 'OnLine(MinorDeficiency)' },
    { label: 'Off-Line', value: 'Offline' }
  ];

  yesNoOptions = [
    { label: 'Yes', value: 'YS' },
    { label: 'No', value: 'NO' },
    { label: 'N/A', value: 'NA' }
  ];

  // UI State
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  
  // Cache for reconciliation data
  private sccDataCache: any = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private equipmentService: EquipmentService,
    private toastr: ToastrService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadRouteParams();
    // Match legacy page load sequence exactly
    this.loadManufacturers();      // BindManufs()
    this.loadEquipmentInfo();       // GetEquipInfo()
    this.loadSCCInfo();             // DisplaySCCInfo()
    this.loadReconciliationInfo();  // DisplayReconciliationInfo()
  }

  private initializeForms(): void {
    // Equipment Verification Form
    this.equipmentVerificationForm = this.fb.group({
      manufacturer: ['', Validators.required],
      modelNo: ['', Validators.required],
      serialNo: [''],
      location: [''],
      dateCode: ['', Validators.required],
      temperature: ['', Validators.required],
      status: ['Online', Validators.required],
      statusNotes: ['']
    });

    // Reconciliation Form
    this.reconciliationForm = this.fb.group({
      // Model reconciliation
      recModel: [{ value: '', disabled: true }],
      recModelCorrect: ['YS'],
      actModel: [''],
      
      // Serial Number reconciliation
      recSerialNo: [{ value: '', disabled: true }],
      recSerialNoCorrect: ['YS'],
      actSerialNo: [''],
      
      // Total Equipment reconciliation
      recTotalEquips: [{ value: '', disabled: true }],
      recTotalEquipsCorrect: ['YS'],
      actTotalEquips: [''],
      
      // Verification checkbox
      verified: [false, Validators.requiredTrue]
    });

    // Voltage Settings Form
    this.voltageSettingsForm = this.fb.group({
      // Bypass Voltages
      bypassVoltA: [''],
      bypassVoltB: [''],
      bypassVoltC: [''],
      
      // Power Supply Voltages
      supplyVoltA: [''],
      supplyVoltB: [''],
      supplyVoltC: [''],
      
      // System Output Voltages
      outputVoltA: [''],
      outputVoltB: [''],
      outputVoltC: [''],
      
      // Additional Settings
      firmwareVersion: [''],
      phaseError: [''],
      partNos: [''],
      loadCurrent: ['']
    });

    // Comments Form
    this.commentsForm = this.fb.group({
      comments: ['']
    });

    // Setup reconciliation field enable/disable logic
    this.setupReconciliationHandlers();
  }

  private setupReconciliationHandlers(): void {
    // Model reconciliation
    this.reconciliationForm.get('recModelCorrect')?.valueChanges.subscribe(value => {
      const actModelControl = this.reconciliationForm.get('actModel');
      if (value === 'NO') {
        actModelControl?.enable();
      } else {
        actModelControl?.setValue('');
        actModelControl?.disable();
      }
    });

    // Serial Number reconciliation
    this.reconciliationForm.get('recSerialNoCorrect')?.valueChanges.subscribe(value => {
      const actSerialNoControl = this.reconciliationForm.get('actSerialNo');
      if (value === 'NO') {
        actSerialNoControl?.enable();
      } else {
        actSerialNoControl?.setValue('');
        actSerialNoControl?.disable();
      }
    });

    // Total Equipment reconciliation
    this.reconciliationForm.get('recTotalEquipsCorrect')?.valueChanges.subscribe(value => {
      const actTotalEquipsControl = this.reconciliationForm.get('actTotalEquips');
      if (value === 'NO') {
        actTotalEquipsControl?.enable();
      } else {
        actTotalEquipsControl?.setValue('');
        actTotalEquipsControl?.disable();
      }
    });
  }

  private loadRouteParams(): void {
    this.route.queryParams.subscribe(params => {
      this.callNbr = params['CallNbr'] || '';
      this.equipId = parseInt(params['EquipId']) || 0;
      this.equipNo = decodeURIComponent(params['EquipNo'] || '');
      this.techId = params['Tech'] || '';
      this.techName = params['TechName'] || '';
      this.digest = params['Digest'] || '';
    });
  }

  private loadManufacturers(): void {
    this.equipmentService.getManufacturerNames().subscribe({
      next: (data) => {
        // Normalize to {value, label} format and remove duplicates
        const manufacturerMap = new Map<string, string>();
        
        data.forEach((item: any) => {
          const value = (item.value || '').toString().trim();
          const label = (item.text || item.label || value).toString().trim();
          
          if (value && !manufacturerMap.has(value)) {
            manufacturerMap.set(value, label);
          }
        });
        
        this.manufacturers = Array.from(manufacturerMap.entries()).map(([value, label]) => ({
          value,
          label
        }));
      },
      error: (error) => {
        console.error('Error loading manufacturers:', error);
        this.toastr.error('Failed to load manufacturers');
      }
    });
  }

  private loadEquipmentInfo(): void {
    // Legacy: GetEquipInfo() - Maps from EditEquipInfo response
    this.equipmentService.editEquipInfo(this.callNbr, this.equipId, this.equipNo).subscribe({
      next: (data) => {
        if (data) {
          // Legacy mapping: txtSerialNo.Text = dr["SerialID"].ToString().Trim();
          const serialId = (data.SerialID || data.serialID || '').toString().trim();
          this.equipmentVerificationForm.patchValue({
            serialNo: serialId
          });
          this.reconciliationForm.patchValue({
            recSerialNo: serialId
          });

          // Legacy mapping: txtModel.Text = dr["Version"].ToString().Trim();
          const version = (data.Version || data.version || '').toString().trim();
          this.equipmentVerificationForm.patchValue({
            modelNo: version
          });
          this.reconciliationForm.patchValue({
            recModel: version
          });

          // Legacy mapping: txtLocation.Text = dr["Location"].ToString().Trim();
          const location = (data.Location || data.location || '').toString().trim();
          this.equipmentVerificationForm.patchValue({
            location: location
          });

          // Legacy mapping: Date Code from EquipYear and EquipMonth
          // if (cvt2Int(dr["EquipYear"].ToString()) > 0 && dr["EquipMonth"].ToString() != string.Empty)
          // DateCode.Text = (Convert.ToDateTime(dr["EquipMonth"] + "/01/" + cvt2Int(dr["EquipYear"].ToString()))).ToString("MM/dd/yyyy");
          const equipYear = this.parseIntSafe(data.EquipYear || data.equipYear);
          const equipMonth = (data.EquipMonth || data.equipMonth || '').toString();
          
          if (equipYear > 0 && equipMonth !== '') {
            const monthNum = this.parseIntSafe(equipMonth);
            if (monthNum > 0 && monthNum <= 12) {
              const dateStr = `${equipMonth}/01/${equipYear}`;
              const date = new Date(dateStr);
              const dateCode = this.formatDate(date);
              this.equipmentVerificationForm.patchValue({
                dateCode: dateCode
              });
            }
          }

          // Legacy mapping: Manufacturer selection
          // foreach (ListItem item in ddlmanufacturer.Items)
          // if (item.Value.ToString().Trim() == dr["VendorId"].ToString().Trim())
          // ddlmanufacturer.SelectedValue = dr["VendorId"].ToString().Trim();
          const vendorId = (data.VendorId || data.vendorId || '').toString().trim();
          const manufacturer = this.manufacturers.find(m => m.value.trim() === vendorId);
          if (manufacturer) {
            this.equipmentVerificationForm.patchValue({
              manufacturer: manufacturer.value
            });
          } else {
            this.equipmentVerificationForm.patchValue({
              manufacturer: ''
            });
          }
        }
      },
      error: (error) => {
        console.error('Error loading equipment info:', error);
        // Don't show error toast on load - matches legacy behavior
      }
    });
  }

  private loadSCCInfo(): void {
    // Legacy: DisplaySCCInfo() - reads SCC data and populates form fields
    this.equipmentService.getSCCInfo(this.callNbr, this.equipNo).subscribe({
      next: (response) => {
        // Cache the response for later use
        this.sccDataCache = response;

        if (response) {
          const data = Array.isArray(response) ? response[0] : response;
          
          // Legacy mappings from DisplaySCCInfo:
          // txtModel.Text = dr["ModelNo"].ToString();
          // txtSerialNo.Text = dr["SerialNo"].ToString();
          // txtTemp.Text = dr["Temp"].ToString();
          // ddlStatus.SelectedValue = dr["Status"].ToString().Trim();
          // txtVoltageA.Text = dr["BypassVoltA"].ToString();
          // ... and so on
          
          this.equipmentVerificationForm.patchValue({
            modelNo: (data.ModelNo || '').toString().trim(),
            serialNo: (data.SerialNo || '').toString().trim(),
            temperature: (data.Temp || '').toString().trim(),
            status: (data.Status || 'Online').toString().trim(),
            statusNotes: (data.StatusNotes || '').toString().trim()
          });

          this.voltageSettingsForm.patchValue({
            bypassVoltA: (data.BypassVoltA || '').toString().trim(),
            bypassVoltB: (data.BypassVoltB || '').toString().trim(),
            bypassVoltC: (data.BypassVoltC || '').toString().trim(),
            supplyVoltA: (data.SupplyVoltA || '').toString().trim(),
            supplyVoltB: (data.SupplyVoltB || '').toString().trim(),
            supplyVoltC: (data.SupplyVoltC || '').toString().trim(),
            outputVoltA: (data.OutputVoltA || '').toString().trim(),
            outputVoltB: (data.OutputVoltB || '').toString().trim(),
            outputVoltC: (data.OutputVoltC || '').toString().trim(),
            firmwareVersion: (data.FirmwareVersion || '').toString().trim(),
            phaseError: (data.PhaseError || '').toString().trim(),
            partNos: (data.PartNos || '').toString().trim(),
            loadCurrent: (data.LoadCurrent || '').toString().trim()
          });

          this.commentsForm.patchValue({
            comments: (data.Comments || '').toString().trim()
          });
        }
      },
      error: (error) => {
        console.error('Error loading SCC info:', error);
        // Don't show error toast on load - matches legacy behavior (no lblErrMsg update on 404)
      }
    });
  }

  private loadReconciliationInfo(): void {
    // Legacy: DisplayReconciliationInfo() - reads reconciliation data from ETechEquipmentData.GetEquipReconciliationInfo
    this.equipmentService.getEquipReconciliationInfo(this.callNbr, this.equipId).subscribe({
      next: (response) => {
        if (response?.success && response.data) {
          const data = response.data;
          
          // Legacy mappings from DisplayReconciliationInfo:
          // txtRecModel.Text = ARI.Model.Trim();
          // ddlRecModCorrect.SelectedValue = ARI.ModelCorrect;
          // txtActModel.Text = ARI.ActModel.Trim();
          // ... and so on
          
          this.reconciliationForm.patchValue({
            recModel: (data.model || '').toString().trim(),
            recModelCorrect: data.modelCorrect || 'YS',
            actModel: (data.actModel || '').toString().trim(),
            
            recSerialNo: (data.serialNo || '').toString().trim(),
            recSerialNoCorrect: data.serialNoCorrect || 'YS',
            actSerialNo: (data.actSerialNo || '').toString().trim(),
            
            recTotalEquips: data.totalEquips ? data.totalEquips.toString() : '',
            recTotalEquipsCorrect: data.totalEquipsCorrect || 'YS',
            actTotalEquips: data.actTotalEquips ? data.actTotalEquips.toString() : '',
            
            verified: data.verified || false
          });

          // Trigger handlers to enable/disable fields based on "Is this Correct?" values
          this.reconciliationForm.get('recModelCorrect')?.updateValueAndValidity();
          this.reconciliationForm.get('recSerialNoCorrect')?.updateValueAndValidity();
          this.reconciliationForm.get('recTotalEquipsCorrect')?.updateValueAndValidity();
        }
      },
      error: (error) => {
        console.error('Error loading reconciliation info:', error);
        // Don't show error on load - matches legacy behavior (catch block doesn't show error)
      }
    });
  }

  saveSCC(): void {
    // Clear messages
    this.errorMessage = '';
    this.successMessage = '';

    // Validate forms
    if (!this.validateForms()) {
      return;
    }

    this.saving = true;

    // Prepare SCC data
    const sccData = {
      sprocName: 'SaveUpdateSCC',
      sccId: this.equipNo,
      callNbr: this.callNbr,
      equipId: this.equipId,
      manufacturer: this.equipmentVerificationForm.value.manufacturer,
      modelNo: this.equipmentVerificationForm.value.modelNo,
      serialNo: this.equipmentVerificationForm.value.serialNo,
      temp: parseInt(this.equipmentVerificationForm.value.temperature) || 0,
      status: this.equipmentVerificationForm.value.status,
      statusNotes: this.equipmentVerificationForm.value.statusNotes,
      
      bypassVoltA: this.voltageSettingsForm.value.bypassVoltA,
      bypassVoltB: this.voltageSettingsForm.value.bypassVoltB,
      bypassVoltC: this.voltageSettingsForm.value.bypassVoltC,
      supplyVoltA: this.voltageSettingsForm.value.supplyVoltA,
      supplyVoltB: this.voltageSettingsForm.value.supplyVoltB,
      supplyVoltC: this.voltageSettingsForm.value.supplyVoltC,
      outputVoltA: this.voltageSettingsForm.value.outputVoltA,
      outputVoltB: this.voltageSettingsForm.value.outputVoltB,
      outputVoltC: this.voltageSettingsForm.value.outputVoltC,
      phaseError: this.voltageSettingsForm.value.phaseError,
      partNos: this.voltageSettingsForm.value.partNos,
      firmwareVersion: this.voltageSettingsForm.value.firmwareVersion,
      loadCurrent: this.voltageSettingsForm.value.loadCurrent,
      comments: this.commentsForm.value.comments
    };

    // Prepare reconciliation data
    const reconciliationData = {
      callNbr: this.callNbr,
      equipId: this.equipId,
      make: this.equipmentVerificationForm.value.manufacturer,
      makeCorrect: '',
      actMake: '',
      model: this.reconciliationForm.value.recModel,
      modelCorrect: this.reconciliationForm.value.recModelCorrect,
      actModel: this.reconciliationForm.value.actModel,
      serialNo: this.reconciliationForm.value.recSerialNo,
      serialNoCorrect: this.reconciliationForm.value.recSerialNoCorrect,
      actSerialNo: this.reconciliationForm.value.actSerialNo,
      kva: '',
      kvaCorrect: '',
      actKva: '',
      ascStringsNo: 0,
      ascStringsCorrect: '',
      actAscStringNo: 0,
      battPerString: 0,
      battPerStringCorrect: '',
      actBattPerString: 0,
      totalEquips: this.parseIntSafe(this.reconciliationForm.value.recTotalEquips),
      totalEquipsCorrect: this.reconciliationForm.value.recTotalEquipsCorrect,
      actTotalEquips: this.parseIntSafe(this.reconciliationForm.value.actTotalEquips),
      verified: this.reconciliationForm.value.verified
    };

    // Save both SCC info and reconciliation info
    forkJoin({
      scc: this.equipmentService.saveUpdateSCC(sccData),
      reconciliation: this.equipmentService.saveEquipReconciliationInfo(reconciliationData)
    }).subscribe({
      next: (results) => {
        // Calculate equipment status
        this.calculateEquipStatusFromAPI().then(calculatedStatus => {
          // Update equipment status
          this.updateEquipmentStatus(calculatedStatus);
        }).catch(error => {
          console.error('Error calculating status:', error);
          this.saving = false;
          this.toastr.error('SCC saved but failed to update status');
        });
      },
      error: (error) => {
        console.error('Error saving SCC:', error);
        this.errorMessage = error.message || 'Failed to save SCC readings';
        this.toastr.error(this.errorMessage);
        this.saving = false;
      }
    });
  }

  private async calculateEquipStatusFromAPI(): Promise<string> {
    try {
      const result = await forkJoin({
        jobSummary: this.equipmentService.getJobSummaryReport(this.callNbr, this.equipId, 'SCC'),
        statusDesc: this.equipmentService.getStatusDescription('SCC')
      }).toPromise();
      
      if (!result) {
        return 'Online';
      }
      
      const jobSummary = result.jobSummary;
      const statusDesc = result.statusDesc;

      let resultStatus = 'Online';
      
      const rows = jobSummary?.Tables?.[0]?.Rows || jobSummary?.data?.primaryData || [];
      if (rows && rows.length > 0) {
        const row = rows[0];
        const columns = jobSummary?.Tables?.[0]?.Columns || Object.keys(row);
        
        for (const col of columns) {
          const tempColumn = (col.ColumnName || col || '').toString().trim();
          const tempField = (row[tempColumn] || '').toString().trim();
          
          let shouldCheckStatus = false;
          const columnLower = tempColumn.toLowerCase();
          
          if (columnLower.includes('action')) {
            if (tempField === 'Y' || tempField === 'YS') {
              shouldCheckStatus = true;
            }
          } else {
            if (tempField === 'N' || tempField === 'F' || tempField === 'True' || tempField === '12' || tempField === 'W') {
              shouldCheckStatus = true;
            }
          }
          
          if (shouldCheckStatus) {
            resultStatus = 'OnLine(MinorDeficiency)';
            
            const statusRows = (statusDesc as any)?.Tables?.[0]?.Rows || statusDesc || [];
            for (const dr of statusRows) {
              const descColumn = (dr['ColumnName'] || '').toString().trim();
              if (descColumn.toLowerCase() === columnLower) {
                const statusType = (dr['StatusType'] || '').toString().trim();
                if (statusType === 'CriticalDeficiency') {
                  return 'CriticalDeficiency';
                } else if (statusType === 'OnLine(MajorDeficiency)') {
                  resultStatus = 'OnLine(MajorDeficiency)';
                }
              }
            }
          }
        }
      }
      
      return resultStatus;
    } catch (error) {
      console.error('Error calculating equipment status:', error);
      return 'Online';
    }
  }

  private updateEquipmentStatus(calculatedStatus: string): void {
    // Get manufacturer text from dropdown
    const manufacturerValue = this.equipmentVerificationForm.value.manufacturer;
    const manufacturer = this.manufacturers.find(m => m.value === manufacturerValue);
    const manufacturerText = manufacturer ? manufacturer.label : manufacturerValue;
    
    // Parse date code to get month and year
    const dateCodeValue = this.equipmentVerificationForm.value.dateCode;
    let monthName = '';
    let year = 0;
    
    if (dateCodeValue) {
      const dateCode = new Date(dateCodeValue);
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      monthName = monthNames[dateCode.getUTCMonth()];
      year = dateCode.getUTCFullYear();
    }
    
    const updateData = {
      callNbr: this.callNbr,
      equipId: this.equipId,
      status: calculatedStatus,
      statusNotes: this.equipmentVerificationForm.value.statusNotes,
      tableName: 'ETechSCC',
      manufacturer: manufacturerText,
      modelNo: this.equipmentVerificationForm.value.modelNo,
      serialNo: this.equipmentVerificationForm.value.serialNo,
      location: this.equipmentVerificationForm.value.location,
      monthName: monthName,
      year: year,
      readingType: '1',
      batteriesPerString: 0,
      batteriesPerPack: 0,
      vfSelection: ''
    };
    
    this.equipmentService.updateEquipStatus(updateData).subscribe({
      next: (response) => {
        this.saving = false;
        this.successMessage = 'SCC readings saved successfully';
        this.toastr.success(this.successMessage);
        
        // Update status in form
        this.equipmentVerificationForm.patchValue({
          status: calculatedStatus
        });
      },
      error: (error) => {
        console.error('Error updating equipment status:', error);
        this.saving = false;
        this.toastr.warning('SCC saved but status update failed');
      }
    });
  }

  private validateForms(): boolean {
    // Validate manufacturer
    if (!this.equipmentVerificationForm.value.manufacturer) {
      this.errorMessage = 'Please select the manufacturer';
      this.toastr.error(this.errorMessage);
      return false;
    }

    // Validate model number
    if (!this.equipmentVerificationForm.value.modelNo) {
      this.errorMessage = 'Please enter the Model No';
      this.toastr.error(this.errorMessage);
      return false;
    }

    // Validate date code
    if (!this.equipmentVerificationForm.value.dateCode || this.equipmentVerificationForm.value.dateCode === '01/01/1900') {
      this.errorMessage = 'Please enter the DateCode';
      this.toastr.error(this.errorMessage);
      return false;
    }

    // Validate date code is not in future
    const dateCode = new Date(this.equipmentVerificationForm.value.dateCode);
    const today = new Date();
    if (dateCode > today) {
      this.errorMessage = 'DateCode cannot be higher than today\'s date';
      this.toastr.error(this.errorMessage);
      return false;
    }

    // Validate status notes if status is not Online
    if (this.equipmentVerificationForm.value.status !== 'Online' && 
        !this.equipmentVerificationForm.value.statusNotes) {
      this.errorMessage = 'Please enter the reason for status';
      this.toastr.error(this.errorMessage);
      return false;
    }

    // Validate temperature
    if (!this.equipmentVerificationForm.value.temperature) {
      this.errorMessage = 'Please enter the room temperature(°F)';
      this.toastr.error(this.errorMessage);
      return false;
    }

    // Validate reconciliation checkbox
    if (!this.reconciliationForm.value.verified) {
      this.errorMessage = 'You must verify the Reconciliation section before Saving PM form';
      this.toastr.error(this.errorMessage);
      return false;
    }

    return true;
  }

  goBack(): void {
    this.router.navigate(['/jobs/equipment-details'], {
      queryParams: {
        CallNbr: this.callNbr,
        Tech: this.techId,
        Digest: this.digest,
        TechName: this.techName
      }
    });
  }

  private parseIntSafe(value: any): number {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    const parsed = parseInt(value);
    return isNaN(parsed) ? 0 : parsed;
  }

  private formatDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
