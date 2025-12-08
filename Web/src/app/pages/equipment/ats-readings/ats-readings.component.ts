import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AtsService, AtsInfo, AtsReconciliationInfo } from 'src/app/core/services/ats.service';
import { BatteryReadingsService } from 'src/app/core/services/battery-readings.service';
import { EquipmentService } from 'src/app/core/services/equipment.service';
import { AuthService } from 'src/app/modules/auth/services/auth.service';
import { ToastrService } from 'ngx-toastr';

interface Option {
  value: string;
  label: string;
}

@Component({
  selector: 'app-ats-readings',
  templateUrl: './ats-readings.component.html',
  styleUrls: ['./ats-readings.component.scss']
})
export class AtsReadingsComponent implements OnInit {
  // Route parameters
  callNbr: string = '';
  equipId: number = 0;
  equipNo = '';
  techId = '';
  techName = '';
  digest = '';
  
  // ATS data from backend
  atsId: number = 0;  // Store ATSId from GetATSInfo response

  // Form groups (PDU pattern: separate form per section)
  equipmentForm!: FormGroup;
  reconciliationForm!: FormGroup;
  visualForm!: FormGroup;
  timersForm!: FormGroup;

  // UI state
  loading = false;
  saving = false;
  successMessage = '';
  errorMessage = '';
  
  // Section visibility toggles
  showEquipmentVerification = true;
  showReconciliation = true;
  showVisualInspection = true;
  showTimers = true;

  // Option lists
  manufacturers: Option[] = [
    { value: '', label: 'Select manufacturer' },
    { value: 'GE', label: 'GE' },
    { value: 'ABB', label: 'ABB' },
    { value: 'EATON', label: 'Eaton' },
    { value: 'SCHNEIDER', label: 'Schneider' },
  ];

  statusOptions: Option[] = [
    { value: 'Online', label: 'On-Line' },
    { value: 'CriticalDeficiency', label: 'Critical Deficiency' },
    { value: 'ReplacementRecommended', label: 'Replacement Recommended' },
    { value: 'ProactiveReplacement', label: 'Proactive Replacement' },
    { value: 'OnLine(MajorDeficiency)', label: 'On-Line(Major Deficiency)' },
    { value: 'OnLine(MinorDeficiency)', label: 'On-Line(Minor Deficiency)' },
    { value: 'Offline', label: 'Off-Line' }
  ];

  yesNoOptions: Option[] = [
    { value: 'YS', label: 'Yes' },
    { value: 'NO', label: 'No' },
    { value: 'NA', label: 'N/A' }
  ];

  passFailOptions: Option[] = [
    { value: 'P', label: 'Pass' },
    { value: 'F', label: 'Fail' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private toastr: ToastrService,
    private equipmentService: EquipmentService,
    private batteryService: BatteryReadingsService,
    private atsService: AtsService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  // PDU pattern: modular initialization flow
  ngOnInit(): void {
    this.loadRouteParams();
    this.initializeForms();
    this.loadManufacturers();
    this.loadData();
  }

  // Load route parameters (PDU pattern)
  private loadRouteParams(): void {
    this.route.queryParams.subscribe(params => {
      this.callNbr = params['CallNbr'] || '';
      this.equipId = parseInt(params['EquipId'] || params['equipId'] || '0', 10);
      this.equipNo = params['EquipNo'] || params['equipNo'] || '';
      this.techId = params['Tech'] || params['techId'] || '';
      this.techName = params['TechName'] || params['techName'] || '';
      this.digest = params['Digest'] || '';
    });
  }

  // Initialize all form groups (PDU pattern)
  private initializeForms(): void {
    this.equipmentForm = this.fb.group({
      manufacturer: ['', Validators.required],
      modelNo: ['', Validators.required],
      serialNo: ['', Validators.required],
      temp: ['', Validators.required],  // API uses 'temp' not 'temperature'
      status: ['Online', Validators.required],
      statusNotes: [''],
      voltage: [''],
      amps: [''],
      poles: [''],
      manuals: ['Y', Validators.required]  // API uses 'manuals' not 'manual'
    });

    this.reconciliationForm = this.fb.group({
      model: [''],
      modelCorrect: ['YS'],
      actModel: [''],
      serialNo: [''],
      serialNoCorrect: ['YS'],
      actSerialNo: [''],
      verified: [false]
    });

    this.visualForm = this.fb.group({
      clean: ['P'],
      inspect: ['P'],
      checkContact: ['P'],
      inspectARC: ['P'],  // API uses 'inspectARC' (uppercase)
      transferSwitch: ['P'],
      testSwitch: ['P'],
      comments1: ['']
    });

    this.timersForm = this.fb.group({
      engineStart: [''],
      transferEmergency: [''],
      reTransferNormal: [''],
      gensetCooldown: [''],
      clockTime: [''],
      pickupVoltA: [''],
      pickupVoltB: [''],
      pickupVoltC: [''],
      dropoutVoltA: [''],
      dropoutVoltB: [''],
      dropoutVoltC: [''],
      emVoltPickup: [''],
      emVoltDropout: [''],
      freqPick: [''],
      freqDropout: [''],  // API uses 'freqDropout' not 'freqDrop'
      comments2: ['']
    });
  }

  // Load manufacturers (PDU pattern: separate from loadData)
  private loadManufacturers(): void {
    this.equipmentService.getManufacturerNames().subscribe({
      next: (manufacturers) => {
        const cleaned = (manufacturers || [])
          .map((m: any) => ({
            value: (m.value ?? m.id ?? '').toString().trim(),
            label: (m.text ?? m.name ?? '').toString().trim()
          }))
          .filter((m: any) => m.value && m.label);

        const seen = new Set<string>();
        this.manufacturers = cleaned.filter(m => {
          if (seen.has(m.value)) return false;
          seen.add(m.value);
          return true;
        });
      },
      error: (error) => {
        console.error('Error loading manufacturers:', error);
      }
    });
  }

  // Load all data (PDU pattern: separate async methods for each data source)
  private async loadData(): Promise<void> {
    this.saving = true;
    this.errorMessage = '';

    try {
      await Promise.all([
        this.loadAtsReadings(),
        this.loadReconciliationInfo()
      ]);
    } catch (error: any) {
      console.error('Error loading data:', error);
      this.errorMessage = 'Failed to load ATS data';
    } finally {
      this.saving = false;
    }
  }

  // Load ATS readings (PDU pattern: separate method)
  private async loadAtsReadings(): Promise<void> {
    return new Promise((resolve) => {
      this.atsService.getAtsInfo(this.callNbr, this.equipNo, this.equipId).subscribe({
        next: (ats: AtsInfo) => {
          // Store ATSId from response
          this.atsId = ats.atsId || 0;
          
          // Trim status field to handle trailing spaces from API
          const cleanedAts = {
            ...ats,
            status: (ats.status || '').trim()
          };
          this.equipmentForm.patchValue(cleanedAts);
          this.visualForm.patchValue(ats);
          this.timersForm.patchValue(ats);
          resolve();
        },
        error: (error) => {
          console.error('Error loading ATS info:', error);
          resolve();
        }
      });
    });
  }

  // Load reconciliation info (PDU pattern: separate method)
  private async loadReconciliationInfo(): Promise<void> {
    return new Promise((resolve) => {
      this.batteryService.getEquipReconciliationInfo(this.callNbr, this.equipId).subscribe({
        next: (response: any) => {
          
          // Handle response structure - data may be wrapped in 'data' property
          const rec = response?.data || response;
          
          // Trim all string values to remove trailing spaces
          const trimValue = (val: any) => (val || '').toString().trim();
          
          const formData = {
            model: trimValue(rec.model),
            modelCorrect: trimValue(rec.modelCorrect) || 'YS',
            actModel: trimValue(rec.actModel),
            serialNo: trimValue(rec.serialNo),
            serialNoCorrect: trimValue(rec.serialNoCorrect) || 'YS',
            actSerialNo: trimValue(rec.actSerialNo),
            verified: rec.verified || false
          };
          
          this.reconciliationForm.patchValue(formData);
          
          // Mark form as touched to trigger validation display
          Object.keys(this.reconciliationForm.controls).forEach(key => {
            this.reconciliationForm.controls[key].markAsTouched();
            this.reconciliationForm.controls[key].updateValueAndValidity();
          });
          
          // Force change detection
          this.cdr.detectChanges();
          
          resolve();
        },
        error: (error) => {
          console.error('Error loading reconciliation info:', error);
          resolve();
        }
      });
    });
  }

  // Legacy-equivalent: GetEquipStatus() for ATS (PDU pattern)
  private async getEquipStatus(): Promise<string> {
    try {
      const [jobSummary, statusDesc] = await Promise.all([
        this.equipmentService.getJobSummaryReport(this.callNbr, this.equipId, 'ATS').toPromise(),
        this.equipmentService.getStatusDescription('ATS').toPromise()
      ]);

      let resultStatus = 'Online';
      const rows = jobSummary?.Tables?.[0]?.Rows?.length ? jobSummary.Tables[0].Rows : jobSummary?.data?.primaryData;

      if (rows && rows.length > 0) {
        const row = rows[0];
        const columns = jobSummary?.Tables?.[0]?.Columns || Object.keys(row);

        for (const col of columns) {
          const tempColumnRaw = (col.ColumnName || col || '').toString();
          const tempColumn = tempColumnRaw.trim();
          const rawValue = (row[tempColumn] ?? row[col] ?? '').toString();
          const tempField = rawValue.trim();

          let shouldCheckStatus = false;

          const columnLower = tempColumn.toLowerCase();
          if (columnLower.includes('action') || columnLower.includes('critical')) {
            if (tempField === 'Y') {
              shouldCheckStatus = true;
            }
          } else {
            if (tempField === 'N' || tempField === 'F' || tempField === 'True' || tempField === '12' || tempField === 'W') {
              shouldCheckStatus = true;
            }
          }

          if (shouldCheckStatus) {
            resultStatus = 'OnLine(MinorDeficiency)';
            const statusTables = (statusDesc as any)?.Tables;
            const statusRows = Array.isArray(statusTables?.[0]?.Rows)
              ? statusTables[0].Rows
              : Array.isArray(statusDesc)
                ? statusDesc as any[]
                : [];

            for (const dr of statusRows) {
              const descColumn = (dr['ColumnName'] || '').toString().trim();
              if (descColumn.toLowerCase() === columnLower) {
                const type = (dr['StatusType'] || '').toString().trim();
                if (type === 'CriticalDeficiency') {
                  return 'CriticalDeficiency';
                } else if (type === 'OnLine(MajorDeficiency)') {
                  resultStatus = 'OnLine(MajorDeficiency)';
                } else if (type === 'ReplacementRecommended') {
                  resultStatus = 'ReplacementRecommended';
                } else if (type === 'ProactiveReplacement') {
                  resultStatus = 'ProactiveReplacement';
                }
              }
            }
          }
        }
      }

      return resultStatus;
    } catch (e) {
      console.error('GetEquipStatus error ->', e);
      return 'Online';
    }
  }

  // Legacy validations (PDU pattern)
  private runLegacyValidations(): boolean {
    if (!this.equipmentForm.valid) {
      this.errorMessage = 'Please complete required fields in Equipment Verification.';
      return false;
    }

    const recon = this.reconciliationForm.value;
    if (!recon.verified) {
      this.errorMessage = 'You must verify the Reconciliation section before Saving.';
      return false;
    }

    // Enforce status notes requirement if not Online
    if (this.equipmentForm.value.status !== 'Online') {
      if (!this.trimValue(this.equipmentForm.value.statusNotes)) {
        this.errorMessage = 'Please enter the reason for Equipment Status.';
        return false;
      }
      if (!window.confirm(`Are you sure that the Equipment Status : ${this.equipmentForm.value.status}`)) {
        return false;
      }
    }

    return true;
  }

  // Helper to trim strings
  private trimValue(value: any): string {
    return (value ?? '').toString().trim();
  }

  // Helper to get month name from number
  private getMonthName(month: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month] || '';
  }

  // Prepare ATS data for save (PDU pattern)
  private prepareAtsData(): AtsInfo {
    const eq = this.equipmentForm.value;
    const vis = this.visualForm.value;
    const timers = this.timersForm.value;
    
    // Get logged-in user's empId for Maint_Auth_ID (convert to string)
    const currentUser = this.authService.currentUserValue;
    const empId = currentUser?.empId ? currentUser.empId.toString() : '';

    return {
      atsId: this.atsId,  // Include ATSId from loaded data
      callNbr: this.callNbr,
      equipId: this.equipId,
      equipNo: this.equipNo,
      maint_Auth_ID: empId,  // Include Maint_Auth_ID from logged-in user (as string)
      ...eq,
      ...vis,
      ...timers,
      // Ensure FreqDropout is included (backend expects capital D)
      freqDropout: timers.freqDropout || ''
    } as AtsInfo;
  }

  // Prepare reconciliation data for save (PDU pattern)
  private prepareReconciliationData(): any {
    const recon = this.reconciliationForm.value;

    return {
      callNbr: this.callNbr,
      equipID: this.equipId,
      equipId: this.equipId,
      make: '',
      makeCorrect: '',
      actMake: '',
      model: recon.model || '',
      modelCorrect: recon.modelCorrect || '',
      actModel: recon.actModel || '',
      serialNo: recon.serialNo || '',
      serialNoCorrect: recon.serialNoCorrect || '',
      actSerialNo: recon.actSerialNo || '',
      kva: '',
      kvaCorrect: '',
      actKva: '',
      ascStringsNo: 0,
      ascStringsCorrect: '',
      actAscStringNo: 0,
      battPerString: 0,
      battPerStringCorrect: '',
      actBattPerString: 0,
      totalEquips: 0,
      totalEquipsCorrect: '',
      actTotalEquips: 0,
      newEquipment: '',
      equipmentNotes: '',
      verified: recon.verified || false,
      modifiedBy: this.techId
    };
  }

  // Save methods (PDU pattern: separate draft/final)
  async save(isDraft: boolean = false): Promise<void> {
    if (!this.validateForm(isDraft)) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const atsData = this.prepareAtsData();
      const reconData = this.prepareReconciliationData();

      // Legacy SaveData sequence (matching PDU):
      // 1. Save ATS readings
      const atsResult = await this.atsService.saveAtsInfo(this.callNbr, this.equipNo, this.equipId, atsData).toPromise();

      // 2. Save reconciliation info
      await this.batteryService.saveUpdateEquipReconciliationInfo(reconData).toPromise();

      // 3. Compute status (legacy GetEquipStatus)
      let statusToSend = this.equipmentForm.value.status;
      if (statusToSend !== 'Offline') {
        statusToSend = (await this.getEquipStatus())?.trim() || 'Online';
      }
      this.equipmentForm.patchValue({ status: statusToSend });

      // 4. Update equipment status
      const dateCode = new Date();
      const monthName = this.getMonthName(dateCode.getMonth());
      const year = dateCode.getFullYear();

      await this.batteryService.updateEquipStatus({
        callNbr: this.callNbr,
        equipId: this.equipId,
        status: statusToSend,
        statusNotes: this.equipmentForm.value.statusNotes,
        tableName: 'ETechATS',
        manufacturer: this.equipmentForm.value.manufacturer,
        modelNo: this.equipmentForm.value.modelNo,
        serialNo: this.equipmentForm.value.serialNo,
        location: '',
        monthName: monthName,
        year: year,
        readingType: '1',
        vfSelection: '',
        batteriesPerString: 0,
        batteriesPerPack: 0,
        Notes: this.equipmentForm.value.statusNotes || '',
        MaintAuthID: this.authService.currentUserValue?.id || this.techId || ''
      }).toPromise();

      this.successMessage = isDraft ? 'Saved as draft successfully' : 'Update Successful';
      this.toastr.success(this.successMessage);

      // Refresh data to reflect persisted values (legacy page reload behavior)
      await this.loadData();

    } catch (error: any) {
      console.error('Error saving ATS readings:', error);
      this.errorMessage = error.message || 'Failed to save ATS readings';
      this.toastr.error(this.errorMessage);
    } finally {
      this.saving = false;
    }
  }

  // Public save/draft methods
  saveAsDraft(): void {
    this.save(true);
  }

  saveAts(): void {
    this.save(false);
  }

  // Validation wrapper (PDU pattern)
  private validateForm(isDraft: boolean): boolean {
    if (isDraft) {
      return true;
    }
    return this.runLegacyValidations();
  }

  // Navigation
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
}
