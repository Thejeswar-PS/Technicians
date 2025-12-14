import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { EquipmentService } from 'src/app/core/services/equipment.service';
import { forkJoin, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Component({
  selector: 'app-rectifier-readings',
  templateUrl: './rectifier-readings.component.html',
  styleUrls: ['./rectifier-readings.component.scss']
})
export class RectifierReadingsComponent implements OnInit {
  // Route Parameters
  callNbr: string = '';
  rectifierId: string = '';
  equipId: number = 0;
  techId: string = '';
  techName: string = '';
  digest: string = '';

  // Forms
  equipmentVerificationForm!: FormGroup;
  visualMechanicalForm!: FormGroup;
  powerVerificationForm!: FormGroup;

  // Data
  manufacturers: any[] = [];
  passFailOptions = [
    { label: 'Pass', value: 'P' },
    { label: 'Fail', value: 'F' },
    { label: 'N/A', value: 'A' }
  ];

  statusOptions = [
    { label: 'On-Line', value: 'Online' },
    { label: 'Critical Deficiency', value: 'CriticalDeficiency' },
    { label: 'Replacement Recommended', value: 'ReplacementRecommended' },
    { label: 'Proactive Replacement', value: 'ProactiveReplacement' },
    { label: 'On-Line(Major Deficiency)', value: 'OnLine(MajorDeficiency)' },
    { label: 'On-Line(Minor Deficiency)', value: 'OnLine(MinorDeficiency)' },
    { label: 'Off-Line', value: 'Offline' }
  ];

  // UI State
  loading = false;
  saving = false;
  errorMessage = '';
  successMessage = '';
  // Cache for GET response to align save payload
  private rectifierDataCache: any = null;

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
    this.loadManufacturers();
    this.loadEquipmentInfo();
    // After equipment info loads, load rectifier verification data
    setTimeout(() => {
      this.loadRectifierVerification();
    }, 500);
  }

  private initializeForms(): void {
    this.equipmentVerificationForm = this.fb.group({
      manufacturer: ['', Validators.required],
      modelNo: [''],
      serialNo: [''],
      location: [''],
      dateCode: [''],
      temperature: [''],
      status: ['Online', Validators.required],
      statusNotes: ['']
    });

    this.visualMechanicalForm = this.fb.group({
      // DC BUS
      dcBusManuf: [''],
      dcBusQuantity: [''],
      dcBusYears: ['P'],
      // INPUT
      inputManuf: [''],
      inputQuantity: [''],
      inputYears: ['P'],
      // COMM
      commManuf: [''],
      commQuantity: [''],
      commYears: ['P'],
      // Alarms and Checks
      currentLimitAlarm: ['P'],
      hiVoltAlarm: ['P'],
      shutdownAlarm: ['P'],
      lowCurrentAlarm: ['P'],
      loadSharing: ['P'],
      visualInspection: ['P'],
      comments: ['']
    });

    this.powerVerificationForm = this.fb.group({
      // Voltage and Current
      voltAB: [208],
      voltAB_PF: ['P'],
      currentA: [''],
      currentA_PF: ['P'],
      voltBC: [208],
      voltBC_PF: ['P'],
      currentB: [''],
      currentB_PF: ['P'],
      voltCA: [208],
      voltCA_PF: ['P'],
      currentC: [''],
      currentC_PF: ['P'],
      frequency: [60],
      frequency_PF: ['P'],
      floatVoltage: [54],
      floatVoltage_PF: ['P'],
      equalizeVoltage: [57],
      equalizeVoltage_PF: ['P'],
      loadCurrent: [''],
      loadCurrent_PF: ['P'],
      filterCurrent: [''],
      filterCurrent_PF: ['P']
    });
  }

  private loadRouteParams(): void {
    this.route.queryParams.subscribe(params => {
      this.callNbr = params['CallNbr'] || '';
      this.rectifierId = params['RectifierId'] || '';
      this.equipId = parseInt(params['EquipId'] || '0');
      this.techId = params['Tech'] || '';
      this.techName = params['TechName'] || '';
      this.digest = params['Digest'] || '';
    });
  }

  private loadManufacturers(): void {
    this.equipmentService.getManufacturerNames().subscribe({
      next: (manufacturers: any[]) => {
        const cleaned = (manufacturers || [])
          .map((m: any) => ({
            value: (m.value ?? m.id ?? m.manufID ?? '').toString().trim(),
            label: (m.label ?? m.text ?? m.name ?? m.ManufacturerName ?? m.ManufName ?? '').toString().trim()
          }))
          .filter((m: any) => m.value && m.label);

        const seen = new Set<string>();
        this.manufacturers = cleaned.filter(m => {
          if (seen.has(m.value)) return false;
          seen.add(m.value);
          return true;
        });
      },
      error: (error: any) => {
        console.error('Error loading manufacturers:', error);
      }
    });
  }

  private loadEquipmentInfo(): void {
    if (!this.callNbr || !this.equipId) return;

    this.loading = true;
    // Legacy: da.EditEquipInfo(CallNbr, EquipID, EquipNo)
    this.equipmentService.editEquipInfo(this.callNbr, this.equipId, this.rectifierId).subscribe({
      next: (equipment: any) => {
        if (equipment) {
          const vendorId = equipment.vendorId != null ? equipment.vendorId.toString().trim() : '';
          this.equipmentVerificationForm.patchValue({
            serialNo: (equipment.serialID || '').trim(),
            modelNo: (equipment.version || '').trim(),
            location: (equipment.location || '').trim(),
            manufacturer: vendorId
          });

          // Set date code if available - Legacy converts date from EquipMonth/EquipYear
          const dateCode = this.resolveDateCode(equipment.equipYear, equipment.equipMonth);
          if (dateCode) {
            this.equipmentVerificationForm.patchValue({ dateCode });
          }
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading equipment info:', error);
        this.loading = false;
      }
    });
  }

  private loadRectifierVerification(): void {
    if (!this.callNbr || !this.equipId || !this.rectifierId) return;

    // Legacy: da.GetRectifier_Verification(RCV, ref ErrMsg)
    // Backend API: /Readings/GetRectifierInfo
    this.equipmentService.getRectifierReadings(this.callNbr, this.equipId, this.rectifierId).subscribe({
      next: (data: any) => {
        if (data) {
          // Cache full payload for save alignment
          this.rectifierDataCache = data;
          const equipmentPatch: any = {
            temperature: data.temp ?? '',
            status: (data.status || 'Online').trim(),
            statusNotes: (data.statusNotes || '').trim()
          };

          const manufacturer = (data.manufacturer ?? data.manufID ?? '').toString().trim();
          if (manufacturer) equipmentPatch.manufacturer = manufacturer;

          const modelNo = (data.modelNo || '').trim();
          if (modelNo) equipmentPatch.modelNo = modelNo;

          const serialNo = (data.serialNo || '').trim();
          if (serialNo) equipmentPatch.serialNo = serialNo;

          const location = (data.location || '').trim();
          if (location) equipmentPatch.location = location;

          const dateCode = this.resolveDateCode(data.year ?? data.equipYear, data.month ?? data.equipMonth, data.dateCode);
          if (dateCode) equipmentPatch.dateCode = dateCode;

          // Populate Equipment Verification form
          this.equipmentVerificationForm.patchValue(equipmentPatch);

          // Populate Visual & Mechanical form
          this.visualMechanicalForm.patchValue({
            dcBusManuf: (data.dcBus_Make || '').trim(),
            dcBusQuantity: data.dcBus_Quantity ?? '',
            dcBusYears: (data.dcBus_Age || 'P').trim(),
            inputManuf: (data.input_Make || '').trim(),
            inputQuantity: data.input_Quantity ?? '',
            inputYears: (data.input_Age || 'P').trim(),
            commManuf: (data.comm_Make || '').trim(),
            commQuantity: data.comm_Quantity ?? '',
            commYears: (data.comm_Age || 'P').trim(),
            currentLimitAlarm: (data.currLimitAlarms || 'P').trim(),
            hiVoltAlarm: (data.hiVoltAlarm || 'P').trim(),
            shutdownAlarm: (data.shutdownAlarm || 'P').trim(),
            lowCurrentAlarm: (data.lowCurrAlarm || 'P').trim(),
            loadSharing: (data.loadSharing || 'P').trim(),
            visualInspection: (data.visualInspection || 'P').trim(),
            comments: (data.comments || '').trim()
          });

          // Populate Power Verification form
          this.powerVerificationForm.patchValue({
            voltAB: data.input208AVoltAtoB_T ?? 208,
            voltAB_PF: (data.input208AVoltAtoB_PF || 'P').trim(),
            currentA: data.input208CurrA_T ?? '',
            currentA_PF: (data.input208CurrA_PF || 'P').trim(),
            voltBC: data.input208AVoltBtoC_T ?? 208,
            voltBC_PF: (data.input208AVoltBtoC_PF || 'P').trim(),
            currentB: data.input208CurrB_T ?? '',
            currentB_PF: (data.input208CurrB_PF || 'P').trim(),
            voltCA: data.input208AVoltCtoA_T ?? 208,
            voltCA_PF: (data.input208AVoltCtoA_PF || 'P').trim(),
            currentC: data.input208CurrC_T ?? '',
            currentC_PF: (data.input208CurrC_PF || 'P').trim(),
            frequency: data.frequency_T ?? 60,
            frequency_PF: (data.frequency_PF || 'P').trim(),
            floatVoltage: data.floatVoltage_T ?? 54,
            floatVoltage_PF: (data.floatVoltage_PF || 'P').trim(),
            equalizeVoltage: data.eqVoltage_T ?? 57,
            equalizeVoltage_PF: (data.eqVoltage_PF || 'P').trim(),
            loadCurrent: data.loadCurrent_T ?? '',
            loadCurrent_PF: (data.loadCurrent_PF || 'P').trim(),
            filterCurrent: data.filterCurrent_T ?? '',
            filterCurrent_PF: (data.filterCurrent_PF || 'P').trim()
          });
        }
      },
      error: (error: any) => {
        console.error('Error loading rectifier verification:', error);
      }
    });
  }

  saveRectifier(): void {
    console.log('[Rectifier] Save clicked', {
      callNbr: this.callNbr, equipId: this.equipId, rectifierId: this.rectifierId
    });
    // Validate required fields
    if (!this.validateForm()) {
      console.warn('[Rectifier] Validation failed for status/statusNotes');
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Legacy: SaveUpdateRectifierVerification()
    const rectifierData = {
      callNbr: this.callNbr,
      equipId: this.equipId,
      rectifierId: (this.rectifierId || '').toString().trim(),
      techId: this.techId,
      techName: this.techName,
      // Equipment Verification
      manufacturer: this.equipmentVerificationForm.get('manufacturer')?.value,
      modelNo: this.equipmentVerificationForm.get('modelNo')?.value,
      serialNo: this.equipmentVerificationForm.get('serialNo')?.value,
      location: this.equipmentVerificationForm.get('location')?.value,
      temp: this.equipmentVerificationForm.get('temperature')?.value,
      status: this.equipmentVerificationForm.get('status')?.value,
      statusNotes: this.equipmentVerificationForm.get('statusNotes')?.value,
      // Visual & Mechanical
      dcBus_Make: this.visualMechanicalForm.get('dcBusManuf')?.value,
      dcBus_Quantity: this.visualMechanicalForm.get('dcBusQuantity')?.value,
      dcBus_Age: this.visualMechanicalForm.get('dcBusYears')?.value,
      input_Make: this.visualMechanicalForm.get('inputManuf')?.value,
      input_Quantity: this.visualMechanicalForm.get('inputQuantity')?.value,
      input_Age: this.visualMechanicalForm.get('inputYears')?.value,
      comm_Make: this.visualMechanicalForm.get('commManuf')?.value,
      comm_Quantity: this.visualMechanicalForm.get('commQuantity')?.value,
      comm_Age: this.visualMechanicalForm.get('commYears')?.value,
      currLimitAlarms: this.visualMechanicalForm.get('currentLimitAlarm')?.value,
      hiVoltAlarm: this.visualMechanicalForm.get('hiVoltAlarm')?.value,
      shutdownAlarm: this.visualMechanicalForm.get('shutdownAlarm')?.value,
      lowCurrAlarm: this.visualMechanicalForm.get('lowCurrentAlarm')?.value,
      loadSharing: this.visualMechanicalForm.get('loadSharing')?.value,
      visualInspection: this.visualMechanicalForm.get('visualInspection')?.value,
      comments: this.visualMechanicalForm.get('comments')?.value,
      // Power Verification
      input208AVoltAtoB_T: this.powerVerificationForm.get('voltAB')?.value,
      input208AVoltAtoB_PF: this.powerVerificationForm.get('voltAB_PF')?.value,
      input208CurrA_T: this.powerVerificationForm.get('currentA')?.value,
      input208CurrA_PF: this.powerVerificationForm.get('currentA_PF')?.value,
      input208AVoltBtoC_T: this.powerVerificationForm.get('voltBC')?.value,
      input208AVoltBtoC_PF: this.powerVerificationForm.get('voltBC_PF')?.value,
      input208CurrB_T: this.powerVerificationForm.get('currentB')?.value,
      input208CurrB_PF: this.powerVerificationForm.get('currentB_PF')?.value,
      input208AVoltCtoA_T: this.powerVerificationForm.get('voltCA')?.value,
      input208AVoltCtoA_PF: this.powerVerificationForm.get('voltCA_PF')?.value,
      input208CurrC_T: this.powerVerificationForm.get('currentC')?.value,
      input208CurrC_PF: this.powerVerificationForm.get('currentC_PF')?.value,
      frequency_T: this.powerVerificationForm.get('frequency')?.value,
      frequency_PF: this.powerVerificationForm.get('frequency_PF')?.value,
      floatVoltage_T: this.powerVerificationForm.get('floatVoltage')?.value,
      floatVoltage_PF: this.powerVerificationForm.get('floatVoltage_PF')?.value,
      eqVoltage_T: this.powerVerificationForm.get('equalizeVoltage')?.value,
      eqVoltage_PF: this.powerVerificationForm.get('equalizeVoltage_PF')?.value,
      loadCurrent_T: this.powerVerificationForm.get('loadCurrent')?.value,
      loadCurrent_PF: this.powerVerificationForm.get('loadCurrent_PF')?.value,
      filterCurrent_T: this.powerVerificationForm.get('filterCurrent')?.value,
      filterCurrent_PF: this.powerVerificationForm.get('filterCurrent_PF')?.value,
      // Align with API casing based on GET fields
      add_Type: (this.rectifierDataCache?.add_Type ?? 'NA'),
      add_Manuf: (this.rectifierDataCache?.add_Manuf ?? ''),
      add_Quantity: (this.rectifierDataCache?.add_Quantity ?? 0),
      add_ImmedAction: (this.rectifierDataCache?.add_ImmedAction ?? 'N'),
      upgNonCritical: (this.rectifierDataCache?.upgNonCritical ?? 'N'),
      comments1: this.visualMechanicalForm.get('comments')?.value ?? (this.rectifierDataCache?.comments1 ?? ''),
      maint_Auth_Id: (this.rectifierDataCache?.maint_Auth_Id ?? '')
    };

    // Legacy flow: SaveUpdateRectifierVerification, then GetEquipStatus, then UpdateEquipStatus
    console.log('[Rectifier] Posting SaveUpdateRectifierVerification payload', rectifierData);
    this.equipmentService.saveUpdateRectifierVerification(rectifierData).subscribe({
      next: (response) => {
        const msg: string = (response?.message || '').toString();
        const isSuccess = response?.success === true || /saved successfully/i.test(msg);
        if (isSuccess) {
          // Legacy: After save, calculate status using JobSummaryReport and update
          console.log('[Rectifier] SaveUpdateRectifierVerification success. Calculating status via JobSummaryReport…');
          this.calculateEquipStatusFromAPI().subscribe({
            next: (calculatedStatus) => {
              console.log('[Rectifier] Calculated status from API:', calculatedStatus);
              this.updateEquipmentStatus(calculatedStatus);
            },
            error: (error) => {
              console.error('Error calculating equipment status:', error);
              // Fallback to basic status calculation
              const fallbackStatus = this.calculateEquipmentStatus();
              console.log('[Rectifier] Using fallback status:', fallbackStatus);
              this.updateEquipmentStatus(this.calculateEquipmentStatus());
            }
          });
          // Defer success toast until status update succeeds
          this.saving = false;
        } else {
          this.saving = false;
          this.errorMessage = response.message || 'Failed to save rectifier readings';
          this.toastr.error(this.errorMessage);
          console.error('[Rectifier] SaveUpdateRectifierVerification failed:', response);
        }
      },
      error: (error) => {
        this.saving = false;
        this.errorMessage = error.error?.message || 'An error occurred while saving';
        this.toastr.error(this.errorMessage);
        console.error('Error saving rectifier data:', error);
      }
    });
  }

  private validateForm(): boolean {
    const status = this.equipmentVerificationForm.get('status')?.value;
    const statusNotes = this.equipmentVerificationForm.get('statusNotes')?.value;
    const comments1 = this.visualMechanicalForm.get('comments')?.value || '';
    const hasFailures = this.checkForFailReadings();

    // Legacy validation: if status is not Online, status notes are required
    if (status !== 'Online') {
      if (!statusNotes || statusNotes.trim() === '') {
        this.errorMessage = 'Please enter the reason for Equipment Status.';
        this.toastr.error(this.errorMessage);
        return false;
      }
    }

    // Legacy ddlFinder: if any select is Fail/Replace, require comments
    if (hasFailures && comments1.trim() === '') {
      this.errorMessage = 'You must enter the respected comments if anything selected as Fail';
      this.toastr.error(this.errorMessage);
      return false;
    }

    return true;
  }

  private checkForFailReadings(): boolean {
    const vmForm = this.visualMechanicalForm.value;
    const pvForm = this.powerVerificationForm.value;

    // Check all _PF (Pass/Fail) fields for 'F' value
    const allFields = { ...vmForm, ...pvForm };
    return Object.keys(allFields).some(key => {
      if (key.endsWith('_PF')) {
        return allFields[key] === 'F';
      }
      return false;
    });
  }

  private updateEquipmentStatus(calculatedStatus?: string): void {
    // Legacy: Use calculated status from JobSummaryReport or form status
    const status = calculatedStatus || this.equipmentVerificationForm.get('status')?.value;
    const statusNotes = this.equipmentVerificationForm.get('statusNotes')?.value;
    console.log('[Rectifier] Updating equipment status', { status, statusNotes });
    
    // Legacy validation: if status is not Online, status notes are required
    if (status !== 'Online' && (!statusNotes || statusNotes.trim() === '')) {
      this.errorMessage = 'Please enter the reason for Equipment Status.';
      this.toastr.error(this.errorMessage);
      console.warn('[Rectifier] Status notes required but missing');
      return;
    }

    const dateCodeValue = this.equipmentVerificationForm.get('dateCode')?.value;
    let month = '';
    let year = 0;

    if (dateCodeValue) {
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      // Parse yyyy-MM-dd in UTC to avoid timezone shift on first day
      const parts = typeof dateCodeValue === 'string' ? dateCodeValue.split('-') : [];
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10); // 1-12
        if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
          year = y;
          month = monthNames[m - 1];
        }
      } else {
        // Fallback to Date parsing in UTC
        const d = new Date(Date.UTC(
          new Date(dateCodeValue).getUTCFullYear(),
          new Date(dateCodeValue).getUTCMonth(),
          new Date(dateCodeValue).getUTCDate()
        ));
        year = d.getUTCFullYear();
        month = monthNames[d.getUTCMonth()];
      }
    } else {
      // Fallback to current month/year if dateCode not set to satisfy backend
      const now = new Date();
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
      month = monthNames[now.getMonth()];
      year = now.getFullYear();
    }

    // Prefer manufacturer text from GET cache when available
    const manufacturerFormVal = this.equipmentVerificationForm.get('manufacturer')?.value;
    const manufacturerText = (this.rectifierDataCache?.manufacturer || '').toString().trim();
    let manufacturerValue = manufacturerText || manufacturerFormVal || '';
    // If form value is an ID, resolve to label from loaded manufacturers
    const foundManuf = this.manufacturers.find(m => m.value === manufacturerFormVal);
    if (!manufacturerValue && foundManuf) {
      manufacturerValue = foundManuf.label;
    }

    const updateData = {
      callNbr: this.callNbr,
      equipId: this.equipId,
      status: status,
      statusNotes: statusNotes,
      // API expects Notes (legacy: txtUsedCmts / StatusNotes)
      Notes: statusNotes,
      tableName: 'Rectifier_Verification',
      manufacturer: manufacturerValue,
      modelNo: this.equipmentVerificationForm.get('modelNo')?.value,
      serialNo: this.equipmentVerificationForm.get('serialNo')?.value,
      location: this.equipmentVerificationForm.get('location')?.value,
      monthName: month,
      year: year,
      readingType: '1',
      batteriesPerString: 0,
      batteriesPerPack: 0,
      vfSelection: ''
    };

    // API expects MaintAuthID for rectifier updates; use cached maint_Auth_Id when available
    const maintAuthId = (this.rectifierDataCache?.maint_Auth_Id || this.rectifierDataCache?.maintAuthId || '').toString().trim();
    if (maintAuthId) {
      (updateData as any).MaintAuthID = maintAuthId;
    }

    console.log('[Rectifier] UpdateEquipStatus payload', updateData);
    this.equipmentService.updateEquipStatus(updateData).subscribe({
      next: () => {
        console.log('Equipment status updated successfully');
        this.successMessage = 'Rectifier Verification saved successfully';
        this.toastr.success('Rectifier Verification saved successfully');
      },
      error: (error: any) => {
        console.error('Error updating equipment status:', error);
        try {
          console.error('UpdateEquipStatus error body:', error?.error);
        } catch {}
        this.toastr.error('Failed to update equipment status');
      }
    });
  }

  private calculateEquipmentStatus(): string {
    // Legacy logic: Check current status from form
    const currentStatus = this.equipmentVerificationForm.get('status')?.value;
    
    // If user has explicitly set a status, use it
    if (currentStatus && currentStatus !== 'Online') {
      return currentStatus;
    }
    
    // Check for any failed readings in visual/mechanical or power verification
    const hasFailures = this.checkForFailReadings();
    
    // If there are failures, return appropriate deficiency status
    // The backend will use JobSummaryReport and GetStatusDescription to determine exact status
    if (hasFailures) {
      return 'OnLine(MinorDeficiency)';
    }
    
    // Default to Online if no issues found
    return 'Online';
  }

  /**
   * Calculate equipment status using JobSummaryReport and GetStatusDescription APIs
   * Legacy: GetEquipStatus() method that calls da.JobSummaryReport and da.GetStatusDescription
   */
  private calculateEquipStatusFromAPI(): Observable<string> {
    return forkJoin({
      jobSummary: this.equipmentService.getJobSummaryReport(this.callNbr, this.equipId, 'RECTIFIER'),
      statusDesc: this.equipmentService.getStatusDescription('RECTIFIER')
    }).pipe(
      map(({ jobSummary, statusDesc }) => {
        let resultStatus = 'Online';

        // Extract data from API response
        const jobSummaryData = jobSummary?.data?.primaryData || jobSummary;
        const statusDescData = (statusDesc as any)?.data || statusDesc;

        if (!jobSummaryData || !Array.isArray(jobSummaryData) || jobSummaryData.length === 0) {
          return 'Online';
        }

        const rowData = jobSummaryData[0];
        const statusDescMap = new Map<string, string>();

        // Build status description lookup map
        if (statusDescData && Array.isArray(statusDescData)) {
          statusDescData.forEach((row: any) => {
            const columnName = (row.columnName || row.ColumnName || '').trim();
            const statusType = (row.statusType || row.StatusType || '').trim();
            if (columnName && statusType) {
              statusDescMap.set(columnName, statusType);
            }
          });
        }

        // Legacy: Loop through all columns
        const columns = Object.keys(rowData);
        
        for (const columnName of columns) {
          const fieldValue = (rowData[columnName] || '').toString().trim();

          if (columnName === 'CallNbr' || columnName === 'EquipId' || columnName === 'RectifierId') {
            continue;
          }

          // Legacy: Check if column contains "Action"
          if (columnName.includes('Action')) {
            if (fieldValue === 'Y') {
              resultStatus = 'OnLine(MinorDeficiency)';
              const statusType = statusDescMap.get(columnName);
              if (statusType === 'CriticalDeficiency') {
                return 'CriticalDeficiency';
              } else if (statusType === 'OnLine(MajorDeficiency)') {
                resultStatus = 'OnLine(MajorDeficiency)';
              } else if (statusType === 'ReplacementRecommended') {
                resultStatus = 'ReplacementRecommended';
              }
            }
          } else {
            // Legacy: Check for N, F, True, W values
            if (fieldValue === 'N' || fieldValue === 'F' || fieldValue === 'True' || fieldValue === 'W') {
              resultStatus = 'OnLine(MinorDeficiency)';
              const statusType = statusDescMap.get(columnName);
              
              if (statusType) {
                if (statusType === 'CriticalDeficiency') {
                  return 'CriticalDeficiency';
                } else if (statusType === 'OnLine(MajorDeficiency)') {
                  resultStatus = 'OnLine(MajorDeficiency)';
                } else if (statusType === 'ReplacementRecommended') {
                  resultStatus = 'ReplacementRecommended';
                } else if (statusType === 'ProactiveReplacement') {
                  resultStatus = 'ProactiveReplacement';
                }
              }
            }
          }
        }

        return resultStatus;
      }),
      catchError(error => {
        console.error('Error calculating equipment status from API:', error);
        return of('Online');
      })
    );
  }

  private resolveDateCode(yearValue: any, monthValue: any, rawDate?: any): string {
    if (rawDate) {
      const parsed = new Date(rawDate);
      if (!isNaN(parsed.getTime())) {
        return this.formatDate(parsed);
      }
    }

    const yearNum = parseInt(yearValue, 10);
    const monthNum = this.getMonthNumber(monthValue);

    if (!isNaN(yearNum) && monthNum >= 1 && monthNum <= 12) {
      const date = new Date(yearNum, monthNum - 1, 1);
      return this.formatDate(date);
    }

    return '';
  }

  private getMonthNumber(monthValue: any): number {
    if (monthValue === undefined || monthValue === null) return 0;
    const monthStr = monthValue.toString().trim();

    const numeric = parseInt(monthStr, 10);
    if (!isNaN(numeric) && numeric >= 1 && numeric <= 12) {
      return numeric;
    }

    const months = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
    const idx = months.indexOf(monthStr.toLowerCase());
    return idx >= 0 ? idx + 1 : 0;
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

  private formatDate(date: Date): string {
    // Match STS/PDU behavior: use UTC ISO date to avoid timezone offsets
    const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    return utc.toISOString().split('T')[0];
  }
}
