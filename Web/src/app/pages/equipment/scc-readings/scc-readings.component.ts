import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { EquipmentService } from 'src/app/core/services/equipment.service';
import { SCCReadings, SCCReconciliationInfo } from 'src/app/core/model/scc-readings.model';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
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
  // Section toggles (match ATS UX)
  showEquipmentVerification = true;
  showReconciliation = true;
  showVoltageSettings = true;
  showComments = true;
  
  // Cache for reconciliation data
  private sccDataCache: any = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private equipmentService: EquipmentService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.loadRouteParams();
    // Match legacy page load sequence exactly - must be sequential, not parallel
    // Legacy order: BindManufs() → GetEquipInfo() → DisplaySCCInfo() → DisplayReconciliationInfo()
    this.loadManufacturers();
  }

  private initializeForms(): void {
    // Equipment Verification Form
    this.equipmentVerificationForm = this.fb.group({
      manufacturer: ['', Validators.required],
      modelNo: ['', Validators.required],
      serialNo: ['', Validators.required],
      location: ['', Validators.required],
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
        actModelControl?.setValidators([Validators.required]);
        actModelControl?.updateValueAndValidity();
      } else {
        actModelControl?.setValue('');
        actModelControl?.clearValidators();
        actModelControl?.updateValueAndValidity();
        actModelControl?.disable();
      }
    });

    // Serial Number reconciliation
    this.reconciliationForm.get('recSerialNoCorrect')?.valueChanges.subscribe(value => {
      const actSerialNoControl = this.reconciliationForm.get('actSerialNo');
      if (value === 'NO') {
        actSerialNoControl?.enable();
        actSerialNoControl?.setValidators([Validators.required]);
        actSerialNoControl?.updateValueAndValidity();
      } else {
        actSerialNoControl?.setValue('');
        actSerialNoControl?.clearValidators();
        actSerialNoControl?.updateValueAndValidity();
        actSerialNoControl?.disable();
      }
    });

    // Total Equipment reconciliation
    this.reconciliationForm.get('recTotalEquipsCorrect')?.valueChanges.subscribe(value => {
      const actTotalEquipsControl = this.reconciliationForm.get('actTotalEquips');
      if (value === 'NO') {
        actTotalEquipsControl?.enable();
        actTotalEquipsControl?.setValidators([Validators.required]);
        actTotalEquipsControl?.updateValueAndValidity();
      } else {
        actTotalEquipsControl?.setValue('');
        actTotalEquipsControl?.clearValidators();
        actTotalEquipsControl?.updateValueAndValidity();
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

        // Once manufacturers are loaded, proceed to next step in sequence
        this.loadEquipmentInfo();
      },
      error: (error) => {
        console.error('Error loading manufacturers:', error);
        this.toastr.error('Failed to load manufacturers');
        // Even on error, continue the sequence
        this.loadEquipmentInfo();
      }
    });
  }

  private loadEquipmentInfo(): void {
    // Legacy: GetEquipInfo() - Maps from EditEquipInfo response
    console.log('[SCC Load] Step 2: loadEquipmentInfo started');
    this.equipmentService.editEquipInfo(this.callNbr, this.equipId, this.equipNo).subscribe({
      next: (data) => {
        console.log('[SCC Load] EditEquipInfo response:', data);
        if (data) {
          // Legacy mapping: txtSerialNo.Text = dr["SerialID"].ToString().Trim();
          const serialId = (data.SerialID || data.serialID || '').toString().trim();
          console.log('[SCC Load] Mapping SerialID:', data.SerialID, '→', serialId);
          this.equipmentVerificationForm.patchValue({
            serialNo: serialId
          });
          this.reconciliationForm.patchValue({
            recSerialNo: serialId
          });
          console.log('[SCC Load] After patch - equipmentVerificationForm.serialNo:', this.equipmentVerificationForm.get('serialNo')?.value);
          console.log('[SCC Load] After patch - reconciliationForm.recSerialNo:', this.reconciliationForm.get('recSerialNo')?.value);

          // Legacy mapping: txtModel.Text = dr["Version"].ToString().Trim();
          const version = (data.Version || data.version || '').toString().trim();
          console.log('[SCC Load] Mapping Version:', data.Version, '→', version);
          this.equipmentVerificationForm.patchValue({
            modelNo: version
          });
          this.reconciliationForm.patchValue({
            recModel: version
          });
          console.log('[SCC Load] After patch - equipmentVerificationForm.modelNo:', this.equipmentVerificationForm.get('modelNo')?.value);
          console.log('[SCC Load] After patch - reconciliationForm.recModel:', this.reconciliationForm.get('recModel')?.value);

          // Legacy mapping: txtLocation.Text = dr["Location"].ToString().Trim();
          const location = (data.Location || data.location || '').toString().trim();
          console.log('[SCC Load] Mapping Location:', data.Location, '→', location);
          this.equipmentVerificationForm.patchValue({
            location: location
          });

          // Legacy mapping: Date Code from EquipYear and EquipMonth
          // if (cvt2Int(dr["EquipYear"].ToString()) > 0 && dr["EquipMonth"].ToString() != string.Empty)
          // DateCode.Text = (Convert.ToDateTime(dr["EquipMonth"] + "/01/" + cvt2Int(dr["EquipYear"].ToString()))).ToString("MM/dd/yyyy");
          // Note: equipMonth comes as month name string like "December", not a number
          const equipYear = this.parseIntSafe(data.EquipYear || data.equipYear);
          const equipMonth = (data.EquipMonth || data.equipMonth || '').toString().trim();
          console.log('[SCC Load] Mapping DateCode - Month:', equipMonth, 'Year:', equipYear);
          
          if (equipYear > 0 && equipMonth !== '') {
            // Construct date from month name and year (e.g., "December/01/2025")
            const dateStr = `${equipMonth} 1, ${equipYear}`;
            const date = new Date(dateStr);
            console.log('[SCC Load] DateCode string:', dateStr, '→ Date:', date);
            
            // Validate the date was parsed correctly
            if (!isNaN(date.getTime())) {
              const dateCode = this.formatDate(date);
              console.log('[SCC Load] DateCode formatted:', dateCode);
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
          console.log('[SCC Load] Mapping Manufacturer - VendorId:', vendorId, 'Available manufacturers:', this.manufacturers.length);
          const manufacturer = this.manufacturers.find(m => m.value.trim() === vendorId);
          if (manufacturer) {
            console.log('[SCC Load] Manufacturer found:', manufacturer);
            this.equipmentVerificationForm.patchValue({
              manufacturer: manufacturer.value
            });
          } else {
            console.log('[SCC Load] Manufacturer NOT found for VendorId:', vendorId);
            this.equipmentVerificationForm.patchValue({
              manufacturer: ''
            });
          }
          console.log('[SCC Load] After patch - equipmentVerificationForm.manufacturer:', this.equipmentVerificationForm.get('manufacturer')?.value);
        }

        // Once equipment info is loaded, proceed to next step in sequence
        console.log('[SCC Load] equipmentVerificationForm complete state:', this.equipmentVerificationForm.value);
        console.log('[SCC Load] reconciliationForm state after editEquipInfo:', this.reconciliationForm.value);
        this.loadSCCInfo();
      },
      error: (error) => {
        console.error('Error loading equipment info:', error);
        // Don't show error toast on load - matches legacy behavior
        // Even on error, continue the sequence
        this.loadSCCInfo();
      }
    });
  }

  private loadSCCInfo(): void {
    // Legacy: DisplaySCCInfo() - reads SCC data and populates form fields
    console.log('[SCC Load] Step 3: loadSCCInfo started');
    this.equipmentService.getSCCInfo(this.callNbr, this.equipNo).subscribe({
      next: (response) => {
        console.log('[SCC Load] GetSCCInfo response:', response);
        // Cache the response for later use
        this.sccDataCache = response;

        if (response) {
          const data = Array.isArray(response) ? response[0] : response;
          console.log('[SCC Load] SCC data to map:', data);
          
          // Legacy mappings from DisplaySCCInfo:
          // txtModel.Text = dr["ModelNo"].ToString();
          // txtSerialNo.Text = dr["SerialNo"].ToString();
          // txtTemp.Text = dr["Temp"].ToString();
          // ddlStatus.SelectedValue = dr["Status"].ToString().Trim();
          // txtVoltageA.Text = dr["BypassVoltA"].ToString();
          // ... and so on
          
          console.log('[SCC Load] Mapping SCC fields - ModelNo:', data.modelNo, 'SerialNo:', data.serialNo);
          this.equipmentVerificationForm.patchValue({
            modelNo: (data.modelNo || data.ModelNo || '').toString().trim(),
            serialNo: (data.serialNo || data.SerialNo || '').toString().trim(),
            temperature: (data.temp || data.Temp || '').toString().trim(),
            status: (data.status || data.Status || 'Online').toString().trim(),
            statusNotes: (data.comments || data.Comments || data.statusNotes || data.StatusNotes || '').toString().trim()
          });
          console.log('[SCC Load] After SCC patch - modelNo:', this.equipmentVerificationForm.get('modelNo')?.value, 'serialNo:', this.equipmentVerificationForm.get('serialNo')?.value);

          this.voltageSettingsForm.patchValue({
            bypassVoltA: (data.bypassVoltA || data.BypassVoltA || '').toString().trim(),
            bypassVoltB: (data.bypassVoltB || data.BypassVoltB || '').toString().trim(),
            bypassVoltC: (data.bypassVoltC || data.BypassVoltC || '').toString().trim(),
            supplyVoltA: (data.supplyVoltA || data.SupplyVoltA || '').toString().trim(),
            supplyVoltB: (data.supplyVoltB || data.SupplyVoltB || '').toString().trim(),
            supplyVoltC: (data.supplyVoltC || data.SupplyVoltC || '').toString().trim(),
            outputVoltA: (data.outputVoltA || data.OutputVoltA || '').toString().trim(),
            outputVoltB: (data.outputVoltB || data.OutputVoltB || '').toString().trim(),
            outputVoltC: (data.outputVoltC || data.OutputVoltC || '').toString().trim(),
            firmwareVersion: (data.firmwareVersion || data.FirmwareVersion || '').toString().trim(),
            phaseError: (data.phaseError || data.PhaseError || '').toString().trim(),
            partNos: (data.partNos || data.PartNos || '').toString().trim(),
            loadCurrent: (data.loadCurrent || data.LoadCurrent || '').toString().trim()
          });

          // Comments form is for additional notes, not status notes
          this.commentsForm.patchValue({
            comments: ''
          });
        }

        // Once SCC info is loaded, proceed to next step in sequence
        this.loadReconciliationInfo();
      },
      error: (error) => {
        console.error('Error loading SCC info:', error);
        // Don't show error toast on load - matches legacy behavior (no lblErrMsg update on 404)
        // Even on error, continue the sequence
        this.loadReconciliationInfo();
      }
    });
  }

  private loadReconciliationInfo(): void {
    // Legacy: DisplayReconciliationInfo() - reads reconciliation data from ETechEquipmentData.GetEquipReconciliationInfo
    console.log('[SCC Load] Step 4: loadReconciliationInfo started');
    console.log('[SCC Load] equipmentVerificationForm at start of reconciliation:', this.equipmentVerificationForm.value);
    this.equipmentService.getEquipReconciliationInfo(this.callNbr, this.equipId).subscribe({
      next: (response) => {
        console.log('[SCC Load] GetEquipReconciliation response:', response);
        if (response?.success && response.data) {
          const data = response.data;
          
          // Legacy mappings from DisplayReconciliationInfo:
          // txtRecModel.Text = ARI.Model.Trim();
          // ddlRecModCorrect.SelectedValue = ARI.ModelCorrect;
          // txtActModel.Text = ARI.ActModel.Trim();
          // ... and so on
          
          // Get trimmed values from API
          const apiModel = (data.model || '').toString().trim();
          const apiSerialNo = (data.serialNo || '').toString().trim();
          console.log('[SCC Load] Reconciliation API values - Model:', apiModel, 'SerialNo:', apiSerialNo);
          
          // If reconciliation data is empty (first load or not saved), pre-populate with current equipment values
          // This helps user verify the information without manual copying
          const currentModel = this.equipmentVerificationForm.get('modelNo')?.value || '';
          const currentSerial = this.equipmentVerificationForm.get('serialNo')?.value || '';
          console.log('[SCC Load] Current form values - Model:', currentModel, 'SerialNo:', currentSerial);
          
          const recModel = apiModel || currentModel;
          const recSerialNo = apiSerialNo || currentSerial;
          console.log('[SCC Load] Final reconciliation values - Model:', recModel, 'SerialNo:', recSerialNo);
          
          this.reconciliationForm.patchValue({
            recModel: recModel,
            recModelCorrect: data.modelCorrect?.trim() || 'YS',
            actModel: (data.actModel || '').toString().trim(),
            
            recSerialNo: recSerialNo,
            recSerialNoCorrect: data.serialNoCorrect?.trim() || 'YS',
            actSerialNo: (data.actSerialNo || '').toString().trim(),
            
            recTotalEquips: data.totalEquips ? data.totalEquips.toString() : '',
            recTotalEquipsCorrect: data.totalEquipsCorrect?.trim() || 'YS',
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

    // Get logged-in user's empId for Maint_Auth_ID (convert to string)
    const currentUser = this.authService.currentUserValue;
    const empId = currentUser?.empId ? currentUser.empId.toString() : '';

    // Prepare SCC data
    const sccData = {
      sprocName: 'SaveUpdateSCC',
      sccId: this.equipNo,
      callNbr: this.callNbr,
      equipId: this.equipId,
      maint_Auth_ID: empId,  // Include Maint_Auth_ID from logged-in user
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

    // Prepare reconciliation data (match SaveUpdateEquipReconciliationDto with PascalCase)
    const modifiedBy = currentUser?.username || 'SYSTEM';

    const reconciliationData = {
      CallNbr: this.callNbr,
      EquipID: this.equipId,
      Make: this.equipmentVerificationForm.value.manufacturer || '',
      MakeCorrect: '',
      ActMake: '',
      Model: this.reconciliationForm.value.recModel || '',
      ModelCorrect: this.reconciliationForm.value.recModelCorrect || 'YS',
      ActModel: this.reconciliationForm.value.actModel || '',
      SerialNo: this.reconciliationForm.value.recSerialNo || '',
      SerialNoCorrect: this.reconciliationForm.value.recSerialNoCorrect || 'YS',
      ActSerialNo: this.reconciliationForm.value.actSerialNo || '',
      KVA: '',
      KVACorrect: '',
      ActKVA: '',
      ASCStringsNo: 0,
      ASCStringsCorrect: '',
      ActASCStringNo: 0,
      BattPerString: 0,
      BattPerStringCorrect: '',
      ActBattPerString: 0,
      TotalEquips: this.parseIntSafe(this.reconciliationForm.value.recTotalEquips),
      TotalEquipsCorrect: this.reconciliationForm.value.recTotalEquipsCorrect || 'YS',
      ActTotalEquips: this.parseIntSafe(this.reconciliationForm.value.actTotalEquips),
      NewEquipment: '',
      EquipmentNotes: '',
      Verified: this.reconciliationForm.value.verified || false,
      ModifiedBy: modifiedBy
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
    // Legacy validation: if status is not Online, StatusNotes is required
    if (calculatedStatus !== 'Online' && !this.equipmentVerificationForm.value.statusNotes) {
      this.saving = false;
      this.errorMessage = 'Please enter the reason for Equipment Status.';
      this.toastr.error(this.errorMessage);
      return;
    }

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

    // Get current user for MaintAuthID
    const currentUser = this.authService.currentUserValue;
    const maintAuthId = currentUser?.id || this.techId || '';
    
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
      vfSelection: '',
      Notes: this.equipmentVerificationForm.value.statusNotes || '',
      MaintAuthID: maintAuthId
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

    // Validate serial number
    if (!this.equipmentVerificationForm.value.serialNo) {
      this.errorMessage = 'Please enter the Serial No';
      this.toastr.error(this.errorMessage);
      return false;
    }

    // Validate location
    if (!this.equipmentVerificationForm.value.location) {
      this.errorMessage = 'Please enter the Location';
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
    const currentStatus = this.equipmentVerificationForm.value.status;
    const statusNotesControl = this.equipmentVerificationForm.get('statusNotes');
    const statusNotesValue = (statusNotesControl?.value || '').trim();
    
    console.log('Status validation - currentStatus:', currentStatus);
    console.log('Status validation - form control value:', statusNotesControl?.value);
    console.log('Status validation - statusNotesValue:', statusNotesValue);
    console.log('Status validation - statusNotesValue length:', statusNotesValue.length);
    console.log('Full form value:', this.equipmentVerificationForm.value);
    
    // Check if status is online (including variations like 'Online', 'OnLine', etc.)
    const isOnlineStatus = currentStatus?.toLowerCase() === 'online';
    
    if (!isOnlineStatus && !statusNotesValue) {
      this.errorMessage = 'Please enter the reason for status in the Status Notes field (located in Equipment Verification section)';
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

    // Validate reconciliation actual fields when marked as incorrect
    if (this.reconciliationForm.value.recModelCorrect === 'NO' && !this.reconciliationForm.value.actModel) {
      this.errorMessage = 'Please enter the Actual Model when marked as incorrect';
      this.toastr.error(this.errorMessage);
      return false;
    }

    if (this.reconciliationForm.value.recSerialNoCorrect === 'NO' && !this.reconciliationForm.value.actSerialNo) {
      this.errorMessage = 'Please enter the Actual Serial No when marked as incorrect';
      this.toastr.error(this.errorMessage);
      return false;
    }

    if (this.reconciliationForm.value.recTotalEquipsCorrect === 'NO' && !this.reconciliationForm.value.actTotalEquips) {
      this.errorMessage = 'Please enter the Actual Total Equipment when marked as incorrect';
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
