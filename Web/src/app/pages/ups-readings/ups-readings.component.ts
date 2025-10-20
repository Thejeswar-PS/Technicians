import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { EquipmentService } from '../../core/services/equipment.service';
import { AuthService } from '../../modules/auth/services/auth.service';
import { 
  AAETechUPS, 
  EquipReconciliationInfo, 
  VOLTAGE_CONFIGURATIONS, 
  VoltageConfiguration,
  PASS_FAIL_OPTIONS,
  YES_NO_OPTIONS,
  STATUS_OPTIONS,
  UPSReadingsFormData
} from '../../core/model/ups-readings.model';

@Component({
  selector: 'app-ups-readings',
  templateUrl: './ups-readings.component.html',
  styleUrls: ['./ups-readings.component.scss']
})
export class UpsReadingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Form groups
  equipmentForm!: FormGroup;
  reconciliationForm!: FormGroup;
  measurementsForm!: FormGroup;
  visualForm!: FormGroup;
  environmentForm!: FormGroup;
  inputReadingsForm!: FormGroup;
  bypassReadingsForm!: FormGroup;
  outputReadingsForm!: FormGroup;
  rectifierForm!: FormGroup;
  capacitorForm!: FormGroup;
  transferForm!: FormGroup;
  actionForm!: FormGroup;
  commentsForm!: FormGroup;
  
  // Route parameters
  callNbr: string = '';
  equipId: number = 0;
  upsId: string = '';
  techId: string = '';
  techName: string = '';
  digest: string = '';
  archive: string = '';
  year: string = '';
  
  // Data
  manufacturers: any[] = [];
  upsData: AAETechUPS | null = null;
  reconciliationData: EquipReconciliationInfo | null = null;
  
  // Configuration options
  voltageConfigurations = VOLTAGE_CONFIGURATIONS;
  passfailOptions = PASS_FAIL_OPTIONS;
  yesNoOptions = YES_NO_OPTIONS;
  statusOptions = STATUS_OPTIONS;
  
  // Current voltage configurations
  inputConfig: VoltageConfiguration | null = null;
  bypassConfig: VoltageConfiguration | null = null;
  outputConfig: VoltageConfiguration | null = null;
  
  // Loading and error states
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';
  
  // UI state
  showReconciliation = false;
  showMeasurements = false;
  showVisual = false;
  showEnvironment = false;
  showInputReadings = false;
  showBypassReadings = false;
  showOutputReadings = false;
  showRectifier = false;
  showCapacitor = false;
  showTransfer = false;
  showActions = false;
  showComments = false;
  
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
    this.getRouteParams();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getRouteParams(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.callNbr = params['callNbr'] || '';
      this.equipId = parseInt(params['equipId']) || 0;
      this.upsId = decodeURIComponent(params['upsId']) || '';
      this.techId = params['techId'] || '';
      this.techName = params['techName'] || '';
      this.digest = params['digest'] || '';
      this.archive = params['archive'] || '';
      this.year = params['year'] || '';
    });
  }

  private initializeForms(): void {
    this.equipmentForm = this.fb.group({
      manufacturer: ['', Validators.required],
      kva: ['', Validators.required],
      multiModule: ['N'],
      maintByPass: ['N'],
      other: [''],
      model: ['', Validators.required],
      serialNo: ['', Validators.required],
      location: ['', Validators.required],
      dateCode: ['', Validators.required],
      status: ['Online', Validators.required],
      statusNotes: [''],
      parallelCabinet: ['N'],
      snmpPresent: ['N'],
      modularUPS: ['N']
    });

    this.reconciliationForm = this.fb.group({
      model: [''],
      modelCorrect: ['Y'],
      actModel: [''],
      serialNo: [''],
      serialNoCorrect: ['Y'],
      actSerialNo: [''],
      kvaSize: [''],
      kvaCorrect: ['Y'],
      actKVA: [''],
      totalEquips: [''],
      totalEquipsCorrect: ['Y'],
      actTotalEquips: [''],
      verified: [false]
    });

    this.measurementsForm = this.fb.group({
      inputPower: ['P'],
      lcd: ['P'],
      loadKVA: ['P'],
      threePhase: ['P'],
      normal: ['P'],
      caliberation: ['P'],
      endOfLife: ['P']
    });

    this.visualForm = this.fb.group({
      noAlarms: ['P'],
      tightness: ['P'],
      broken: ['P'],
      vacuum: ['P'],
      epo: ['P'],
      noise: ['P'],
      fansAge: ['P'],
      replaceFilters: ['P']
    });

    this.environmentForm = this.fb.group({
      roomTemp: ['P'],
      safety: ['P'],
      clean: ['P'],
      space: ['P'],
      circuit: ['P']
    });

    this.inputReadingsForm = this.fb.group({
      configuration: ['3'], // Default to 208V Three Phase
      voltA: [''],
      voltA_PF: ['P'],
      voltB: [''],
      voltB_PF: ['P'],
      voltC: [''],
      voltC_PF: ['P'],
      currA: [''],
      currA_PF: ['P'],
      currB: [''],
      currB_PF: ['P'],
      currC: [''],
      currC_PF: ['P'],
      freq: [''],
      freq_PF: ['P']
    });

    this.bypassReadingsForm = this.fb.group({
      configuration: ['3'], // Default to 208V Three Phase
      voltA: [''],
      voltA_PF: ['P'],
      voltB: [''],
      voltB_PF: ['P'],
      voltC: [''],
      voltC_PF: ['P'],
      currA: [''],
      currA_PF: ['P'],
      currB: [''],
      currB_PF: ['P'],
      currC: [''],
      currC_PF: ['P'],
      freq: [''],
      freq_PF: ['P']
    });

    this.outputReadingsForm = this.fb.group({
      configuration: ['3'], // Default to 208V Three Phase
      voltA: [''],
      voltA_PF: ['P'],
      voltB: [''],
      voltB_PF: ['P'],
      voltC: [''],
      voltC_PF: ['P'],
      currA: [''],
      currA_PF: ['P'],
      currB: [''],
      currB_PF: ['P'],
      currC: [''],
      currC_PF: ['P'],
      freq: [''],
      freq_PF: ['P'],
      loadA: [''],
      loadA_PF: ['P'],
      loadB: [''],
      loadB_PF: ['P'],
      loadC: [''],
      loadC_PF: ['P'],
      totalLoad: ['']
    });

    this.rectifierForm = this.fb.group({
      floatVolt_PF: ['P'],
      dcVoltage: [''],
      dcVoltage_PF: ['P'],
      acRipple: [''],
      acRipple_PF: ['P'],
      dcCurrent: [''],
      dcCurrent_PF: ['P'],
      acRippleVolt: [''],
      acRippleVolt_PF: ['P'],
      posToGND: [''],
      posToGND_PF: ['P'],
      acRippleCurr: [''],
      acRippleCurr_PF: ['P'],
      negToGND: [''],
      negToGND_PF: ['P']
    });

    this.capacitorForm = this.fb.group({
      dcCaps_PF: ['P'],
      dcCapsAge_PF: ['P'],
      dcCapsAge: [''],
      acInputCaps_PF: ['P'],
      acInputCapsAge_PF: ['P'],
      acInputCapsAge: [''],
      acOutputCaps_PF: ['P'],
      acOutputCapsAge_PF: ['P'],
      acOutputCapsAge: [''],
      commCaps_PF: ['P'],
      commCapsAge_PF: ['P'],
      commCapsAge: [''],
      fansYear: ['']
    });

    this.transferForm = this.fb.group({
      firstMajor: ['P'],
      staticBypass: ['P'],
      transMaintByPass: ['P'],
      currentWave: ['P'],
      normalMode: ['P'],
      verifyAlarm: ['P']
    });

    this.actionForm = this.fb.group({
      dcgAction1: ['N'],
      custAction1: ['N'],
      airFilterLength: [''],
      airFilterWidth: [''],
      airFilterThick: [''],
      airFilterQty: [''],
      airFilterLength1: [''],
      airFilterWidth1: [''],
      airFilterThick1: [''],
      airFilterQty1: ['']
    });

    this.commentsForm = this.fb.group({
      comments1: [''],
      comments2: [''],
      comments3: [''],
      comments4: [''],
      comments5: ['']
    });

    // Subscribe to voltage configuration changes
    this.inputReadingsForm.get('configuration')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.inputConfig = this.getVoltageConfiguration(value);
    });

    this.bypassReadingsForm.get('configuration')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.bypassConfig = this.getVoltageConfiguration(value);
    });

    this.outputReadingsForm.get('configuration')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.outputConfig = this.getVoltageConfiguration(value);
    });

    // Subscribe to voltage field changes for automatic phase-to-neutral calculations
    this.setupPhaseToNeutralCalculations();
  }

  private setupPhaseToNeutralCalculations(): void {
    // Input voltage calculations
    ['voltA', 'voltB', 'voltC'].forEach(field => {
      this.inputReadingsForm.get(field)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.calculatePhaseToNeutral('input');
      });
    });

    // Bypass voltage calculations
    ['voltA', 'voltB', 'voltC'].forEach(field => {
      this.bypassReadingsForm.get(field)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.calculatePhaseToNeutral('bypass');
      });
    });

    // Output voltage calculations
    ['voltA', 'voltB', 'voltC'].forEach(field => {
      this.outputReadingsForm.get(field)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.calculatePhaseToNeutral('output');
      });
    });
  }

  private loadData(): void {
    this.loading = true;
    
    // Load manufacturers
    this.equipmentService.getManufacturerNames()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (manufacturers) => {
          this.manufacturers = manufacturers;
        },
        error: (error) => {
          console.error('Error loading manufacturers:', error);
          this.toastr.error('Error loading manufacturers');
        }
      });

    // Load UPS data
    this.equipmentService.getUPSReadings(this.callNbr, this.equipId, this.upsId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.upsData = data;
          this.populateFormsWithData(data);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading UPS data:', error);
          this.loadEquipmentInfo(); // Fallback to equipment info
        }
      });

    // Load reconciliation data
    this.equipmentService.getEquipReconciliationInfo(this.callNbr, this.equipId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.reconciliationData = data;
          this.populateReconciliationForm(data);
        },
        error: (error) => {
          console.error('Error loading reconciliation data:', error);
        }
      });
  }

  private loadEquipmentInfo(): void {
    this.equipmentService.editEquipInfo(this.callNbr, this.equipId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.populateEquipmentForm(data);
          this.loading = false;
        },
        error: (error: any) => {
          console.error('Error loading equipment info:', error);
          this.toastr.error('Error loading equipment information');
          this.loading = false;
        }
      });
  }

  private populateFormsWithData(data: AAETechUPS): void {
    // Populate equipment form
    this.equipmentForm.patchValue({
      manufacturer: data.manufacturer || '',
      kva: data.kva || '',
      multiModule: data.multiModule || 'N',
      maintByPass: data.maintByPass || 'N',
      other: data.other || '',
      model: data.modelNo || '',
      serialNo: data.serialNo || '',
      location: data.location || '',
      dateCode: this.formatDateCode(data.monthName, data.year),
      status: data.status || 'Online',
      statusNotes: data.statusReason || '',
      parallelCabinet: data.parallelCabinet || 'N',
      snmpPresent: data.snmpPresent || 'N',
      modularUPS: data.modularUPS || 'N'
    });

    // Populate measurements form
    this.measurementsForm.patchValue({
      inputPower: data.measure_Input || 'P',
      lcd: data.measure_LCD || 'P',
      loadKVA: data.measure_Load || 'P',
      threePhase: data.measure_3Phase || 'P',
      normal: data.measure_Normal || 'P',
      caliberation: data.measure_Caliberation || 'P',
      endOfLife: data.measure_EOL || 'P'
    });

    // Populate visual form
    this.visualForm.patchValue({
      noAlarms: data.visual_NoAlarms || 'P',
      tightness: data.visual_Tightness || 'P',
      broken: data.visual_Broken || 'P',
      vacuum: data.visual_Vaccum || 'P',
      epo: data.visual_EPO || 'P',
      noise: data.visual_Noise || 'P',
      fansAge: data.visual_FansAge || 'P',
      replaceFilters: data.visual_ReplaceFilters || 'P'
    });

    // Populate environment form
    this.environmentForm.patchValue({
      roomTemp: data.environment_RoomTemp || 'P',
      safety: data.environment_Saftey || 'P',
      clean: data.environment_Clean || 'P',
      space: data.environment_Space || 'P',
      circuit: data.environment_Circuit || 'P'
    });

    // Populate input readings
    this.inputReadingsForm.patchValue({
      configuration: data.input || '3'
    });
    this.populateVoltageReadings('input', data);

    // Populate bypass readings
    this.bypassReadingsForm.patchValue({
      configuration: data.bypass || '3'
    });
    this.populateVoltageReadings('bypass', data);

    // Populate output readings
    this.outputReadingsForm.patchValue({
      configuration: data.output || '3'
    });
    this.populateVoltageReadings('output', data);

    // Populate rectifier form
    this.rectifierForm.patchValue({
      floatVolt_PF: data.rectFloatVolt_PF || 'P',
      dcVoltage: this.convertZeroToEmpty(data.dcVoltage_T),
      dcVoltage_PF: data.dcVoltage_PF || 'P',
      acRipple: this.convertZeroToEmpty(data.acRipple_T),
      acRipple_PF: data.acRipple_PF || 'P',
      dcCurrent: this.convertZeroToEmpty(data.dcCurrent_T),
      dcCurrent_PF: data.dcCurrent_PF || 'P',
      acRippleVolt: this.convertZeroToEmpty(data.acRippleVolt_T),
      acRippleVolt_PF: data.acRippleVolt_PF || 'P',
      posToGND: this.convertZeroToEmpty(data.posToGND_T),
      posToGND_PF: data.posToGND_PF || 'P',
      acRippleCurr: this.convertZeroToEmpty(data.acRippleCurr_T),
      acRippleCurr_PF: data.acRippleCurr_PF || 'P',
      negToGND: this.convertZeroToEmpty(data.negToGND_T),
      negToGND_PF: data.negToGND_PF || 'P'
    });

    // Populate capacitor form
    this.capacitorForm.patchValue({
      dcCaps_PF: data.dcCapsLeak_PF || 'P',
      dcCapsAge_PF: data.dcCapsAge_PF || 'P',
      dcCapsAge: this.convertZeroToEmpty(data.dcCapsYear),
      acInputCaps_PF: data.acInputCapsLeak_PF || 'P',
      acInputCapsAge_PF: data.acInputCapsAge_PF || 'P',
      acInputCapsAge: this.convertZeroToEmpty(data.acInputCapsYear),
      acOutputCaps_PF: data.acOutputCapsLeak_PF || 'P',
      acOutputCapsAge_PF: data.acOutputCapsAge_PF || 'P',
      acOutputCapsAge: this.convertZeroToEmpty(data.acOutputCapsYear),
      commCaps_PF: data.commCapsLeak_PF || 'P',
      commCapsAge_PF: data.commCapsAge_PF || 'P',
      commCapsAge: this.convertZeroToEmpty(data.commCapsYear),
      fansYear: this.convertZeroToEmpty(data.fansYear)
    });

    // Populate transfer form
    this.transferForm.patchValue({
      firstMajor: data.transfer_Major || 'P',
      staticBypass: data.transfer_Static || 'P',
      transMaintByPass: data.transfer_ByPass || 'P',
      currentWave: data.transfer_Wave || 'P',
      normalMode: data.transfer_Normal || 'P',
      verifyAlarm: data.transfer_Alarm || 'P'
    });

    // Populate action form
    this.actionForm.patchValue({
      dcgAction1: data.dcgAction1 || 'N',
      custAction1: data.custAction1 || 'N',
      airFilterLength: this.convertZeroToEmpty(data.afLength),
      airFilterWidth: this.convertZeroToEmpty(data.afWidth),
      airFilterThick: this.convertZeroToEmpty(data.afThick),
      airFilterQty: this.convertZeroToEmpty(data.afQty),
      airFilterLength1: this.convertZeroToEmpty(data.afLength1),
      airFilterWidth1: this.convertZeroToEmpty(data.afWidth1),
      airFilterThick1: this.convertZeroToEmpty(data.afThick1),
      airFilterQty1: this.convertZeroToEmpty(data.afQty1)
    });

    // Populate comments form
    this.commentsForm.patchValue({
      comments1: data.comments1 || '',
      comments2: data.comments2 || '',
      comments3: data.comments3 || '',
      comments4: data.comments4 || '',
      comments5: data.comments5 || ''
    });

    // Set voltage configurations
    this.inputConfig = this.getVoltageConfiguration(data.input);
    this.bypassConfig = this.getVoltageConfiguration(data.bypass);
    this.outputConfig = this.getVoltageConfiguration(data.output);
  }

  private populateEquipmentForm(data: any): void {
    if (data && data.Tables && data.Tables.length > 0) {
      const equipInfo = data.Tables[0].Rows[0];
      const capsInfo = data.Tables[1]?.Rows[0];
      
      this.equipmentForm.patchValue({
        kva: equipInfo?.Upskva || '',
        serialNo: equipInfo?.SerialID || '',
        location: equipInfo?.Location || '',
        model: equipInfo?.Version || '',
        dateCode: this.formatEquipDateCode(equipInfo?.EquipMonth, equipInfo?.EquipYear)
      });

      if (capsInfo) {
        this.capacitorForm.patchValue({
          dcCapsAge: this.convertZeroToEmpty(capsInfo.DCCapsYear),
          acInputCapsAge: this.convertZeroToEmpty(capsInfo.ACInputCapsYear),
          acOutputCapsAge: this.convertZeroToEmpty(capsInfo.ACOutputCapsYear),
          commCapsAge: this.convertZeroToEmpty(capsInfo.DCCommCapsYear)
        });
      }
    }
  }

  private populateReconciliationForm(data: EquipReconciliationInfo): void {
    if (data) {
      this.reconciliationForm.patchValue({
        model: data.model || '',
        modelCorrect: data.modelCorrect || 'Y',
        actModel: data.actModel || '',
        serialNo: data.serialNo || '',
        serialNoCorrect: data.serialNoCorrect || 'Y',
        actSerialNo: data.actSerialNo || '',
        kvaSize: data.kva || '',
        kvaCorrect: data.kvaCorrect || 'Y',
        actKVA: data.actKVA || '',
        totalEquips: data.totalEquips ? data.totalEquips.toString() : '',
        totalEquipsCorrect: data.totalEquipsCorrect || 'Y',
        actTotalEquips: data.actTotalEquips ? data.actTotalEquips.toString() : '',
        verified: data.verified || false
      });
    }

    // Set KVA size from equipment form if empty
    const kvaValue = this.equipmentForm.get('kva')?.value;
    if (kvaValue && !this.reconciliationForm.get('kvaSize')?.value) {
      this.reconciliationForm.patchValue({ kvaSize: kvaValue });
    }
  }

  private populateVoltageReadings(type: 'input' | 'bypass' | 'output', data: AAETechUPS): void {
    const form = type === 'input' ? this.inputReadingsForm : 
                  type === 'bypass' ? this.bypassReadingsForm : this.outputReadingsForm;

    const prefix = type === 'input' ? 'input' : type === 'bypass' ? 'bypass' : 'output';

    form.patchValue({
      voltA: this.convertZeroToEmpty(data[`${prefix}VoltA_T` as keyof AAETechUPS] as number),
      voltA_PF: (data[`${prefix}VoltA_PF` as keyof AAETechUPS] as string) || 'P',
      voltB: this.convertZeroToEmpty(data[`${prefix}VoltB_T` as keyof AAETechUPS] as number),
      voltB_PF: (data[`${prefix}VoltB_PF` as keyof AAETechUPS] as string) || 'P',
      voltC: this.convertZeroToEmpty(data[`${prefix}VoltC_T` as keyof AAETechUPS] as number),
      voltC_PF: (data[`${prefix}VoltC_PF` as keyof AAETechUPS] as string) || 'P',
      currA: this.convertZeroToEmpty(data[`${prefix}CurrA_T` as keyof AAETechUPS] as number),
      currA_PF: (data[`${prefix}CurrA_PF` as keyof AAETechUPS] as string) || 'P',
      currB: this.convertZeroToEmpty(data[`${prefix}CurrB_T` as keyof AAETechUPS] as number),
      currB_PF: (data[`${prefix}CurrB_PF` as keyof AAETechUPS] as string) || 'P',
      currC: this.convertZeroToEmpty(data[`${prefix}CurrC_T` as keyof AAETechUPS] as number),
      currC_PF: (data[`${prefix}CurrC_PF` as keyof AAETechUPS] as string) || 'P',
      freq: this.convertZeroToEmpty(data[`${prefix}Freq_T` as keyof AAETechUPS] as number),
      freq_PF: (data[`${prefix}Freq_PF` as keyof AAETechUPS] as string) || 'P'
    });

    // Populate load data for output only
    if (type === 'output') {
      this.outputReadingsForm.patchValue({
        loadA: this.convertZeroToEmpty(data.outputLoadA),
        loadA_PF: data.outputLoadA_PF || 'P',
        loadB: this.convertZeroToEmpty(data.outputLoadB),
        loadB_PF: data.outputLoadB_PF || 'P',
        loadC: this.convertZeroToEmpty(data.outputLoadC),
        loadC_PF: data.outputLoadC_PF || 'P',
        totalLoad: this.convertZeroToEmpty(data.totalLoad)
      });
    }
  }

  private getVoltageConfiguration(configId: string): VoltageConfiguration | null {
    return this.voltageConfigurations.find(config => config.id === configId) || null;
  }

  private calculatePhaseToNeutral(type: 'input' | 'bypass' | 'output'): void {
    const form = type === 'input' ? this.inputReadingsForm : 
                  type === 'bypass' ? this.bypassReadingsForm : this.outputReadingsForm;
    
    const config = type === 'input' ? this.inputConfig : 
                   type === 'bypass' ? this.bypassConfig : this.outputConfig;

    if (!config || !config.showPhaseToNeutral) return;

    const voltA = this.convertToDouble(form.get('voltA')?.value);
    const voltB = this.convertToDouble(form.get('voltB')?.value);
    const voltC = this.convertToDouble(form.get('voltC')?.value);

    // Calculate phase-to-neutral voltages (divide by √3 ≈ 1.732)
    // These are display-only calculations, not form fields
    // Implementation would update display elements in template
  }

  /**
   * Calculate phase to neutral voltage
   * Equivalent to GetPhasetoNuetralVoltage(string PPVoltage) in legacy code
   */
  getPhaseToNeutralVoltage(phaseToPhaseVoltage: string): string {
    const voltage = this.convertToDouble(phaseToPhaseVoltage);
    if (voltage === 0) return '';
    
    const result = Math.round(voltage / 1.732);
    return result.toString();
  }

  /**
   * Calculate equipment status based on form values
   * Equivalent to GetEquipStatus() in legacy code
   */
  calculateEquipStatus(): string {
    let resultStatus = 'Online';
    
    // Check all form values for failure conditions
    const allForms = [
      this.measurementsForm,
      this.visualForm,
      this.environmentForm,
      this.inputReadingsForm,
      this.bypassReadingsForm,
      this.outputReadingsForm,
      this.rectifierForm,
      this.capacitorForm,
      this.transferForm
    ];

    for (const form of allForms) {
      const formValues = form.value;
      
      for (const [key, value] of Object.entries(formValues)) {
        if (key.includes('Action') || key === 'clean') {
          if (value === 'Y') {
            if (resultStatus === 'Online' || resultStatus === 'ProactiveReplacement') {
              resultStatus = 'OnLine(MinorDeficiency)';
            }
          } else if (value === 'YS') {
            return 'CriticalDeficiency';
          }
        } else {
          if (value === 'N' || value === 'F' || value === 'True' || value === 'F ') {
            if (resultStatus === 'Online' || resultStatus === 'ProactiveReplacement') {
              resultStatus = 'OnLine(MinorDeficiency)';
            }
            
            // Check against status description rules (would need API call)
            // This is a simplified version - full implementation would query status rules
          } else if (value === 'W') {
            if (resultStatus === 'Online') {
              resultStatus = 'ProactiveReplacement';
            }
          }
        }
      }
    }

    return resultStatus;
  }

  onVoltageConfigurationChange(type: 'input' | 'bypass' | 'output', configId: string): void {
    const form = type === 'input' ? this.inputReadingsForm : 
                  type === 'bypass' ? this.bypassReadingsForm : this.outputReadingsForm;
    
    // Clear existing voltage readings when configuration changes
    form.patchValue({
      voltA: '',
      voltA_PF: 'P',
      voltB: '',
      voltB_PF: 'P',
      voltC: '',
      voltC_PF: 'P',
      currA: '',
      currA_PF: 'P',
      currB: '',
      currB_PF: 'P',
      currC: '',
      currC_PF: 'P',
      freq: '',
      freq_PF: 'P'
    });

    if (type === 'output') {
      this.outputReadingsForm.patchValue({
        loadA: '',
        loadA_PF: 'P',
        loadB: '',
        loadB_PF: 'P',
        loadC: '',
        loadC_PF: 'P',
        totalLoad: ''
      });
    }
  }

  onSave(): void {
    this.save(false);
  }

  onSaveAsDraft(): void {
    this.save(true);
  }

  private save(isDraft: boolean): void {
    if (!isDraft && !this.validateForms()) {
      this.toastr.error('Please correct validation errors before saving');
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    const upsData = this.buildUPSData(isDraft);
    
    // Save UPS readings
    this.equipmentService.saveUpdateUPSReadings(upsData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            // Update equipment status if not draft
            if (!isDraft) {
              this.updateEquipmentStatus();
            }
            
            // Save reconciliation data
            this.saveReconciliationData();
            
            this.successMessage = isDraft ? 'Draft saved successfully' : 'UPS readings saved successfully';
            this.toastr.success(this.successMessage);
          } else {
            this.errorMessage = response.message;
            this.toastr.error(this.errorMessage);
          }
          this.saving = false;
        },
        error: (error) => {
          console.error('Error saving UPS readings:', error);
          this.errorMessage = 'Error saving UPS readings';
          this.toastr.error(this.errorMessage);
          this.saving = false;
        }
      });
  }

  private buildUPSData(isDraft: boolean): AAETechUPS {
    const equipment = this.equipmentForm.value;
    const measurements = this.measurementsForm.value;
    const visual = this.visualForm.value;
    const environment = this.environmentForm.value;
    const input = this.inputReadingsForm.value;
    const bypass = this.bypassReadingsForm.value;
    const output = this.outputReadingsForm.value;
    const rectifier = this.rectifierForm.value;
    const capacitor = this.capacitorForm.value;
    const transfer = this.transferForm.value;
    const action = this.actionForm.value;
    const comments = this.commentsForm.value;

    const dateCode = new Date(equipment.dateCode);
    
    return {
      upsId: this.upsId,
      callNbr: this.callNbr,
      equipId: this.equipId,
      manufacturer: equipment.manufacturer,
      kva: equipment.kva,
      multiModule: equipment.multiModule,
      maintByPass: equipment.maintByPass,
      other: equipment.other,
      modelNo: equipment.model,
      serialNo: equipment.serialNo,
      location: equipment.location,
      status: equipment.status,
      statusReason: equipment.statusNotes,
      parallelCabinet: equipment.parallelCabinet,
      snmpPresent: equipment.snmpPresent,
      modularUPS: equipment.modularUPS,
      
      // Measurements
      measure_Input: measurements.inputPower,
      measure_LCD: measurements.lcd,
      measure_Load: measurements.loadKVA,
      measure_3Phase: measurements.threePhase,
      measure_KVA: 'P',
      measure_Normal: measurements.normal,
      measure_Caliberation: measurements.caliberation,
      measure_EOL: measurements.endOfLife,
      
      // Visual
      visual_NoAlarms: visual.noAlarms,
      visual_Tightness: visual.tightness,
      visual_Broken: visual.broken,
      visual_Vaccum: visual.vacuum,
      visual_EPO: visual.epo,
      visual_Noise: visual.noise,
      visual_FansAge: visual.fansAge,
      visual_ReplaceFilters: visual.replaceFilters,
      
      // Environment
      environment_RoomTemp: environment.roomTemp,
      environment_Saftey: environment.safety,
      environment_Clean: environment.clean,
      environment_Space: environment.space,
      environment_Circuit: environment.circuit,
      
      // Transfer
      transfer_Major: transfer.firstMajor,
      transfer_Static: transfer.staticBypass,
      transfer_ByPass: transfer.transMaintByPass,
      transfer_Wave: transfer.currentWave,
      transfer_Normal: transfer.normalMode,
      transfer_Alarm: transfer.verifyAlarm,
      
      // Comments
      comments1: comments.comments1,
      comments2: comments.comments2,
      comments3: comments.comments3,
      comments4: comments.comments4,
      comments5: comments.comments5,
      
      // Air filter data
      afLength: action.airFilterLength,
      afWidth: action.airFilterWidth,
      afThick: action.airFilterThick,
      afQty: action.airFilterQty,
      afLength1: action.airFilterLength1,
      afWidth1: action.airFilterWidth1,
      afThick1: action.airFilterThick1,
      afQty1: action.airFilterQty1,
      
      // Date information
      monthName: dateCode.toLocaleDateString('en-US', { month: 'long' }),
      year: dateCode.getFullYear(),
      
      // Voltage readings - Input
      input: input.configuration,
      inputVoltA_T: this.convertToDouble(input.voltA),
      inputVoltA_PF: input.voltA_PF,
      inputVoltB_T: this.convertToDouble(input.voltB),
      inputVoltB_PF: input.voltB_PF,
      inputVoltC_T: this.convertToDouble(input.voltC),
      inputVoltC_PF: input.voltC_PF,
      inputCurrA_T: this.convertToDouble(input.currA),
      inputCurrA_PF: input.currA_PF,
      inputCurrB_T: this.convertToDouble(input.currB),
      inputCurrB_PF: input.currB_PF,
      inputCurrC_T: this.convertToDouble(input.currC),
      inputCurrC_PF: input.currC_PF,
      inputFreq_T: this.convertToDouble(input.freq),
      inputFreq_PF: input.freq_PF,
      
      // Voltage readings - Bypass
      bypass: bypass.configuration,
      bypassVoltA_T: this.convertToDouble(bypass.voltA),
      bypassVoltA_PF: bypass.voltA_PF,
      bypassVoltB_T: this.convertToDouble(bypass.voltB),
      bypassVoltB_PF: bypass.voltB_PF,
      bypassVoltC_T: this.convertToDouble(bypass.voltC),
      bypassVoltC_PF: bypass.voltC_PF,
      bypassCurrA_T: this.convertToDouble(bypass.currA),
      bypassCurrA_PF: bypass.currA_PF,
      bypassCurrB_T: this.convertToDouble(bypass.currB),
      bypassCurrB_PF: bypass.currB_PF,
      bypassCurrC_T: this.convertToDouble(bypass.currC),
      bypassCurrC_PF: bypass.currC_PF,
      bypassFreq_T: this.convertToDouble(bypass.freq),
      bypassFreq_PF: bypass.freq_PF,
      
      // Voltage readings - Output
      output: output.configuration,
      outputVoltA_T: this.convertToDouble(output.voltA),
      outputVoltA_PF: output.voltA_PF,
      outputVoltB_T: this.convertToDouble(output.voltB),
      outputVoltB_PF: output.voltB_PF,
      outputVoltC_T: this.convertToDouble(output.voltC),
      outputVoltC_PF: output.voltC_PF,
      outputCurrA_T: this.convertToDouble(output.currA),
      outputCurrA_PF: output.currA_PF,
      outputCurrB_T: this.convertToDouble(output.currB),
      outputCurrB_PF: output.currB_PF,
      outputCurrC_T: this.convertToDouble(output.currC),
      outputCurrC_PF: output.currC_PF,
      outputFreq_T: this.convertToDouble(output.freq),
      outputFreq_PF: output.freq_PF,
      outputLoadA: this.convertToDouble(output.loadA),
      outputLoadA_PF: output.loadA_PF,
      outputLoadB: this.convertToDouble(output.loadB),
      outputLoadB_PF: output.loadB_PF,
      outputLoadC: this.convertToDouble(output.loadC),
      outputLoadC_PF: output.loadC_PF,
      totalLoad: this.convertToDouble(output.totalLoad),
      
      // Rectifier
      rectFloatVolt_PF: rectifier.floatVolt_PF,
      dcVoltage_T: this.convertToDouble(rectifier.dcVoltage),
      dcVoltage_PF: rectifier.dcVoltage_PF,
      acRipple_T: this.convertToDouble(rectifier.acRipple),
      acRipple_PF: rectifier.acRipple_PF,
      dcCurrent_T: this.convertToDouble(rectifier.dcCurrent),
      dcCurrent_PF: rectifier.dcCurrent_PF,
      acRippleVolt_T: this.convertToDouble(rectifier.acRippleVolt),
      acRippleVolt_PF: rectifier.acRippleVolt_PF,
      posToGND_T: this.convertToDouble(rectifier.posToGND),
      posToGND_PF: rectifier.posToGND_PF,
      acRippleCurr_T: this.convertToDouble(rectifier.acRippleCurr),
      acRippleCurr_PF: rectifier.acRippleCurr_PF,
      negToGND_T: this.convertToDouble(rectifier.negToGND),
      negToGND_PF: rectifier.negToGND_PF,
      
      // Capacitor
      dcCapsLeak_PF: capacitor.dcCaps_PF,
      dcCapsAge_PF: capacitor.dcCapsAge_PF,
      dcCapsYear: this.convertToInt(capacitor.dcCapsAge),
      acInputCapsLeak_PF: capacitor.acInputCaps_PF,
      acInputCapsAge_PF: capacitor.acInputCapsAge_PF,
      acInputCapsYear: this.convertToInt(capacitor.acInputCapsAge),
      acOutputCapsLeak_PF: capacitor.acOutputCaps_PF,
      acOutputCapsAge_PF: capacitor.acOutputCapsAge_PF,
      acOutputCapsYear: this.convertToInt(capacitor.acOutputCapsAge),
      commCapsLeak_PF: capacitor.commCaps_PF,
      commCapsAge_PF: capacitor.commCapsAge_PF,
      commCapsYear: this.convertToInt(capacitor.commCapsAge),
      
      // Fan information
      fansYear: this.convertToInt(capacitor.fansYear),
      
      // Actions
      dcgAction1: action.dcgAction1,
      custAction1: action.custAction1,
      manufSpecification: 'P',
      dcgAction2: 'N',
      custAction2: 'N',
      
      // Service info
      svcDescr: '', // Would be set based on service type
      maintAuthId: this.authService.currentUserValue?.id || '',
      saveAsDraft: isDraft,
      
      // Battery string info
      batteryStringID: 0,
      
      // Check flags
      chkDCBreak: false,
      chkFault: false,
      chkOverLoad: false,
      chkTransfer: false
    };
  }

  private updateEquipmentStatus(): void {
    const status = this.calculateEquipStatus();
    const dateCode = new Date(this.equipmentForm.get('dateCode')?.value);
    
    const statusData = {
      callNbr: this.callNbr,
      equipId: this.equipId,
      status: status !== 'Offline' ? status : this.equipmentForm.get('status')?.value,
      statusNotes: this.equipmentForm.get('statusNotes')?.value,
      tableName: 'UPS_Verification1',
      manufacturer: this.equipmentForm.get('manufacturer')?.value,
      modelNo: this.equipmentForm.get('model')?.value,
      serialNo: this.equipmentForm.get('serialNo')?.value,
      location: this.equipmentForm.get('location')?.value,
      monthName: dateCode.toLocaleDateString('en-US', { month: 'long' }),
      year: dateCode.getFullYear(),
      readingType: '1',
      batteriesPerString: 0,
      vfSelection: ''
    };

    this.equipmentService.updateEquipStatus(statusData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (!response.success) {
            console.error('Error updating equipment status:', response.message);
          }
        },
        error: (error) => {
          console.error('Error updating equipment status:', error);
        }
      });
  }

  private saveReconciliationData(): void {
    const reconciliation = this.reconciliationForm.value;
    
    const reconciliationData = {
      callNbr: this.callNbr,
      equipId: this.equipId,
      make: this.equipmentForm.get('manufacturer')?.value,
      makeCorrect: '',
      actMake: '',
      model: reconciliation.model,
      modelCorrect: reconciliation.modelCorrect,
      actModel: reconciliation.actModel,
      serialNo: reconciliation.serialNo,
      serialNoCorrect: reconciliation.serialNoCorrect,
      actSerialNo: reconciliation.actSerialNo,
      kva: reconciliation.kvaSize,
      kvaCorrect: reconciliation.kvaCorrect,
      actKVA: reconciliation.actKVA,
      ascStringsNo: 0,
      ascStringsCorrect: '',
      actASCStringNo: 0,
      battPerString: 0,
      battPerStringCorrect: '',
      actBattPerString: 0,
      totalEquips: this.convertToInt(reconciliation.totalEquips),
      totalEquipsCorrect: reconciliation.totalEquipsCorrect,
      actTotalEquips: this.convertToInt(reconciliation.actTotalEquips),
      verified: reconciliation.verified
    };

    this.equipmentService.saveEquipReconciliationInfo(reconciliationData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (!response.success) {
            console.error('Error saving reconciliation data:', response.message);
          }
        },
        error: (error) => {
          console.error('Error saving reconciliation data:', error);
        }
      });
  }

  private validateForms(): boolean {
    const formsToValidate = [
      this.equipmentForm,
      this.inputReadingsForm,
      this.outputReadingsForm
    ];

    let isValid = true;
    
    formsToValidate.forEach(form => {
      if (!form.valid) {
        form.markAllAsTouched();
        isValid = false;
      }
    });

    return isValid;
  }

  onGoBack(): void {
    const queryParams: any = {
      CallNbr: this.callNbr,
      Tech: this.techId,
      TechName: this.techName
    };

    // Add archive and year if they exist
    if (this.archive) {
      queryParams.Archive = this.archive;
    }
    if (this.year) {
      queryParams.Year = this.year;
    }
    
    this.router.navigate(['/jobs/equipment-details'], { queryParams });
  }

  // Utility methods
  private convertToDouble(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    const num = parseFloat(value);
    return isNaN(num) ? 0 : num;
  }

  private convertToInt(value: any): number {
    if (value === null || value === undefined || value === '') return 0;
    const num = parseInt(value);
    return isNaN(num) ? 0 : num;
  }

  private convertZeroToEmpty(value: any): string {
    if (value === null || value === undefined || value === 0) return '';
    return value.toString();
  }

  private formatDateCode(monthName: string, year: number): string {
    if (!monthName || !year || year <= 0) return '';
    
    const monthNumber = new Date(Date.parse(monthName + " 1, 2000")).getMonth() + 1;
    return `${monthNumber.toString().padStart(2, '0')}/01/${year}`;
  }

  private formatEquipDateCode(month: string, year: string): string {
    if (!month || !year) return '';
    
    const yearNum = this.convertToInt(year);
    if (yearNum <= 0) return '';
    
    return `${month}/01/${yearNum}`;
  }

  // Template helper methods
  getFieldsForConfiguration(config: VoltageConfiguration | null): any[] {
    if (!config) return [];
    return config.fields;
  }

  shouldShowField(config: VoltageConfiguration | null, fieldId: string): boolean {
    if (!config) return false;
    return config.fields.some(field => field.id === fieldId);
  }

  shouldShowPhaseToNeutral(config: VoltageConfiguration | null): boolean {
    return config?.showPhaseToNeutral || false;
  }

  getSummary(): string {
    return `Job Id: ${this.callNbr}  UPS ID: ${this.upsId}  Equipment Id: ${this.equipId}`;
  }
}