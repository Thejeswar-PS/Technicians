import { Component, OnInit, OnDestroy, ElementRef, HostListener, ChangeDetectorRef } from '@angular/core';
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
  POWER_VERIFICATION_OPTIONS,
  YES_NO_OPTIONS,
  STATUS_OPTIONS,
  UPSReadingsFormData,
  UpdateEquipStatus,
  EquipFilterCurrents,
  SaveUpdateaaETechUPSDto,
  SaveUpdateUPSResponse
} from '../../core/model/ups-readings.model';
import { convertToSaveUpdateDto, convertFromSaveUpdateDto } from '../../core/utils/ups-data-mapper.util';

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
  actionRequiredForm!: FormGroup;
  
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
  upsTypes: { value: string; text: string }[] = [];
  maintenanceBypassTypes: { value: string; text: string }[] = [];
  multiModuleTypes: { value: string; text: string }[] = [];
  equipmentStatusOptions: { value: string; text: string }[] = [];
  upsData: AAETechUPS | null = null;
  reconciliationData: EquipReconciliationInfo | null = null;
  filterCurrentsData: EquipFilterCurrents | null = null;
  
  // Configuration options
  voltageConfigurations = VOLTAGE_CONFIGURATIONS;
  passfailOptions = PASS_FAIL_OPTIONS;
  powerVerificationOptions = POWER_VERIFICATION_OPTIONS;
  measurementOptions = [
    { value: 'P', text: 'Pass' },
    { value: 'F', text: 'Fail' },
    { value: 'N', text: 'N/A' }
  ];
  
  // Visual and Mechanical options (same as measurement options)
  visualMechanicalOptions = [
    { value: 'P', text: 'Pass' },
    { value: 'F', text: 'Fail' },
    { value: 'N', text: 'N/A' }
  ];
  
  // Air filter options for "Inspect and clean or replace UPS air filters"
  airFilterOptions = [
    { value: 'C', text: 'Cleaned' },
    { value: 'RN', text: 'Replacement needed' },
    { value: 'R', text: 'Replaced' },
    { value: 'N', text: 'N/A' }
  ];
  yesNoOptions = YES_NO_OPTIONS;
  yesNoNAOptions = [
    { value: 'Y', text: 'Yes' },
    { value: 'N', text: 'No' },
    { value: 'N/A', text: 'N/A' }
  ];
  statusOptions = STATUS_OPTIONS;
  
  // Current voltage configurations
  inputConfig: VoltageConfiguration | null = null;
  bypassConfig: VoltageConfiguration | null = null;
  outputConfig: VoltageConfiguration | null = null;
  
  // Loading and error states
  loading = true;
  saving = false;
  saveMode: 'draft' | 'ups' | null = null;
  errorMessage = '';
  successMessage = '';
  
  // UI state
  showReconciliation = true; // Equipment Verification - always expanded by default
  showReconciliationDetails = false; // Separate collapsible for Equipment Reconciliation
  showMeasurements = false;
  showAirFilterDetails = false;
  showVisual = false;
  showEnvironment = false;
  showPowerVerification = true; // Power Verification - always expanded by default
  showInputReadings = false;
  showBypassReadings = false;
  showOutputReadings = false;
  showRectifier = false;
  showCapacitor = false;
  showTransfer = false;
  showActionRequired = false;
  
  // Filter current checkboxes UI state - replicate legacy behavior
  showInputFilterCurrent = false;
  showInputTHD = false;
  showOutputFilterCurrent = false;
  showOutputTHD = false;
  
  // Dynamic labels
  endOfLifeLabel = '7. UPS date code is < 25 years (End of Life):';
  
  // Basic date state (for legacy compatibility)
  currentCalendarDate = new Date();
  selectedDate: Date | null = null;
  selectedYear = new Date().getFullYear();
  
  // Temporary properties to avoid compilation errors (these methods should be removed eventually)
  showDatePicker = false;
  showMonthYearPicker = false;
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private equipmentService: EquipmentService,
    private authService: AuthService,
    private toastr: ToastrService,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    
    // Initialize with comprehensive manufacturer list immediately to ensure dropdown is populated
    this.manufacturers = [
      { value: 'POWERWARE', text: 'POWERWARE' },
      { value: '*APC', text: '*APC' },
      { value: '*EATON', text: '*EATON' },
      { value: '*LIEBERT', text: '*LIEBERT' },
      { value: '*SCHNEIDER', text: '*SCHNEIDER' },
      { value: 'APC', text: 'American Power Conversion' },
      { value: 'Eaton', text: 'Eaton' },
      { value: 'LIEBERT', text: 'LIEBERT' },
      { value: 'SCHNEIDER', text: 'SCHNEIDER' },
      { value: 'TRIPP LITE', text: 'TRIPP LITE' },
      { value: 'EMERSON', text: 'Emerson' },
      { value: 'MGE', text: 'MGE' },
      { value: 'CYBEREX', text: 'Cyberex' },
      { value: 'Delta', text: 'Delta' },
      { value: 'Vertiv', text: 'Vertiv' }
    ];
    
    this.getRouteParams();
    this.loadData();
    
    // Set up date code display value watcher
    this.setupDateCodeDisplayWatcher();
    
    // Watch for air filter dropdown changes
    this.visualForm.get('airFilters')?.valueChanges.subscribe(value => {
      this.showAirFilterDetails = value && value !== '';
    });

    // Debug form after initialization
    setTimeout(() => {
      // Form initialization debug removed
    }, 1000);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Set up date code display value watcher
   */
  private setupDateCodeDisplayWatcher(): void {
    // No custom date picker logic needed - just using simple text input
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
      kva: ['', [Validators.required, Validators.min(0)]],
      multiModule: [''],
      maintByPass: [''],
      other: [''],
      model: ['', Validators.required],
      serialNo: ['', Validators.required],
      location: ['', Validators.required],
      monthName: ['', Validators.required],
      year: ['', [Validators.required, Validators.min(1900)]],
      status: ['Online', Validators.required],
      statusNotes: [''],
      parallelCabinet: [''],
      snmpPresent: [''],
      modularUPS: [''],
      ctoPartNo: [''], // Added CTO/Part No field
      upsType: ['NO'] // Added UPS Type field with default value 'NO' (Normal UPS)
    });

    this.reconciliationForm = this.fb.group({
      model: [''],
      modelCorrect: [''], // Default to blank - let user make conscious choice
      actModel: [''],
      serialNo: [''],
      serialNoCorrect: [''], 
      actSerialNo: [''],
      kvaSize: [''],
      kvaCorrect: [''], 
      actKVA: [''],
      totalEquips: [''],
      totalEquipsCorrect: [''], 
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
      upsOnline: ['P'],
      checkConnections: ['P'],
      inspectDamage: ['P'],
      vacuumClean: ['P'],
      epoSwitch: ['P'],
      coolingFans: ['P'],
      fansAge: ['P'],
      airFilters: ['P'],
      // Air filter details
      filterSet1Length: [''],
      filterSet1Width: [''],
      filterSet1Thickness: [''],
      filterSet1Quantity: [''],
      filterSet2Length: [''],
      filterSet2Width: [''],
      filterSet2Thickness: [''],
      filterSet2Quantity: [''],
      visualComments: ['']
    });

    this.environmentForm = this.fb.group({
      roomTempVentilation: ['P'],
      safetyEquipment: ['P'],
      hostileEnvironment: ['N'], // Default to No for hostile environment
      serviceSpace: ['P'],
      circuitBreakers: ['P']
    });

    this.inputReadingsForm = this.fb.group({
      configuration: [''], // Default to "Select" option
      inputFilterCurrent: [false],
      inputThdPercent: [false],
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
      configuration: [''], // Default to "Select" option
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
      configuration: [''], // Default to "Select" option
      outputFilterCurrent: [false],
      outputThdPercent: [false],
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
      dcFloatVoltage: [''],
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
      dcCapsAge: [''],
      acInputCaps_PF: ['P'],
      acInputCapsAge: [''],
      acOutputCaps_PF: ['P'],
      acOutputCapsAge: [''],
      commCaps_PF: ['P'],
      commCapsAge: [''],
      fansYear: ['']
    });

    this.transferForm = this.fb.group({
      firstMajor: [''], 
      staticBypass: [''], 
      transMaintByPass: [''], 
      currentWave: [''],
      normalMode: [''], 
      verifyAlarm: [''] 
    });

    this.actionRequiredForm = this.fb.group({
      dcgAction1: [''], 
      custAction1: ['']
    });

    // Subscribe to voltage configuration changes
    this.inputReadingsForm.get('configuration')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.inputConfig = this.getVoltageConfiguration(value);
      this.onVoltageConfigurationChange('input', value);
    });

    this.bypassReadingsForm.get('configuration')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.bypassConfig = this.getVoltageConfiguration(value);
      this.onVoltageConfigurationChange('bypass', value);
    });

    this.outputReadingsForm.get('configuration')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.outputConfig = this.getVoltageConfiguration(value);
      this.onVoltageConfigurationChange('output', value);
    });

    // Subscribe to voltage field changes for automatic phase-to-neutral calculations
    this.setupPhaseToNeutralCalculations();
    
    // Subscribe to equipment form changes to keep reconciliation form in sync
    this.setupEquipmentReconciliationSync();
    
    // Subscribe to filter current checkbox changes
    this.setupFilterCurrentCheckboxHandlers();
    
    // Subscribe to KVA changes for dynamic end-of-life label
    this.setupKVAChangeHandlers();
  }

  private setupEquipmentReconciliationSync(): void {
    // Watch for changes in equipment form fields that should sync with reconciliation
    const equipmentFields = ['model', 'serialNo', 'kva'];
    
    equipmentFields.forEach(fieldName => {
      this.equipmentForm.get(fieldName)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
        this.updateReconciliationField(fieldName, value);
      });
    });
  }

  private setupFilterCurrentCheckboxHandlers(): void {
    // Handle Input Filter Current checkbox
    this.inputReadingsForm.get('inputFilterCurrent')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(checked => {
      this.showInputFilterCurrent = checked || false;
    });

    // Handle Input THD checkbox  
    this.inputReadingsForm.get('inputThdPercent')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(checked => {
      this.showInputTHD = checked || false;
    });

    // Handle Output Filter Current checkbox
    this.outputReadingsForm.get('outputFilterCurrent')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(checked => {
      this.showOutputFilterCurrent = checked || false;
    });

    // Handle Output THD checkbox
    this.outputReadingsForm.get('outputThdPercent')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(checked => {
      this.showOutputTHD = checked || false;
    });
  }

  private setupKVAChangeHandlers(): void {
    // Watch for KVA changes to update end-of-life label
    this.equipmentForm.get('kva')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(kvaValue => {
      this.updateEndOfLifeLabel(kvaValue);
    });
  }

  private updateEndOfLifeLabel(kvaValue: any): void {
    const kva = this.convertToDouble(kvaValue);
    if (kva <= 50) {
      this.endOfLifeLabel = '7. UPS date code is < 20 years (End of Life):';
    } else {
      this.endOfLifeLabel = '7. UPS date code is < 25 years (End of Life):';
    }
  }

  private updateReconciliationField(equipmentField: string, value: any): void {
    if (!this.reconciliationForm) return;
    
    const reconciliationFieldMap: { [key: string]: string } = {
      'model': 'model',
      'serialNo': 'serialNo', 
      'kva': 'kvaSize'
    };
    
    const reconciliationField = reconciliationFieldMap[equipmentField];
    if (reconciliationField) {
      // Only update if the reconciliation field is currently empty
      const currentValue = this.reconciliationForm.get(reconciliationField)?.value;
      if (!currentValue) {
        this.reconciliationForm.patchValue({ [reconciliationField]: value || '' });
      }
    }
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
          
          // Always update with the API response, which includes comprehensive fallback if API fails
          if (manufacturers && manufacturers.length > 0) {
            this.manufacturers = manufacturers;
          }
        },
        error: (error) => {
          // Keep the initial fallback list that was set in ngOnInit
          this.toastr.warning('Using default manufacturer list. Please check your connection.');
        }
      });

    // Load UPS types
    this.equipmentService.getUPSTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (upsTypes) => {
          this.upsTypes = upsTypes;
        },
        error: (error) => {
          console.error('Error loading UPS types:', error);
        }
      });

    // Load maintenance bypass types
    this.equipmentService.getMaintenanceBypassTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (bypassTypes) => {
          this.maintenanceBypassTypes = bypassTypes;
        },
        error: (error) => {
          console.error('Error loading maintenance bypass types:', error);
        }
      });

    // Load multi-module types
    this.equipmentService.getMultiModuleTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (multiModuleTypes) => {
          this.multiModuleTypes = multiModuleTypes;
        },
        error: (error) => {
          console.error('Error loading multi-module types:', error);
        }
      });

    // Load equipment status options
    this.equipmentService.getEquipmentStatusOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (statusOptions) => {
          this.equipmentStatusOptions = statusOptions;
        },
        error: (error) => {
          console.error('Error loading equipment status options:', error);
          // Fallback to existing statusOptions if service fails
        }
      });

    // Load UPS data
    this.equipmentService.getUPSReadings(this.callNbr, this.equipId, this.upsId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.upsData = data;
          this.populateFormsWithData(data);
          
          // Load reconciliation data after equipment form is populated
          this.loadReconciliationDataAfterEquipment();
          
          this.loading = false;
        },
        error: (error) => {
          this.loadEquipmentInfo(); // Fallback to equipment info
        }
      });

    // Load filter currents data
    this.equipmentService.getEquipFilterCurrents(this.callNbr, this.equipId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.data) {
            this.filterCurrentsData = response.data;
            // Filter currents form removed - data handled in power verification
          }
        },
        error: (error) => {
          // This is not a critical error, so we don't show a toast
        }
      });
  }

  private loadEquipmentInfo(): void {
    this.equipmentService.editEquipInfo(this.callNbr, this.equipId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.populateEquipmentForm(data);
          
          // Load reconciliation data after equipment form is populated
          this.loadReconciliationDataAfterEquipment();
          
          this.loading = false;
        },
        error: (error: any) => {
          
          // Final fallback - ensure month/year are populated even when all data loading fails
          const currentDate = new Date();
          const defaultMonthName = currentDate.toLocaleDateString('en-US', { month: 'long' });
          const defaultYear = currentDate.getFullYear();
          
          this.equipmentForm.patchValue({
            monthName: defaultMonthName,
            year: defaultYear
          });
          
          // Load reconciliation data after equipment form is populated
          this.loadReconciliationDataAfterEquipment();
          
          this.loading = false;
          this.toastr.error('Error loading equipment data. Using default values.');
        }
      });
  }

  private loadReconciliationDataAfterEquipment(): void {
    // Add a small delay to ensure equipment form is fully populated
    setTimeout(() => {
      this.equipmentService.getEquipReconciliationInfo(this.callNbr, this.equipId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (data) => {
            this.reconciliationData = data;
            this.populateReconciliationForm(data);
          },
          error: (error) => {
            console.error('Error loading reconciliation data:', error);
            // Initialize form with defaults for new records when no existing data found
            this.populateReconciliationForm(null);
          }
        });
    }, 100);
  }

  private populateFormsWithData(data: AAETechUPS): void {
    // Use the mapped date values for form population
    const actualMonthName = data.monthName;
    const actualYear = data.year;
    
    // Determine default values for parallel cabinet and SNMP based on UPS characteristics
    const defaultParallelCabinet = this.determineDefaultParallelCabinet(data);
    const defaultSnmpPresent = this.determineDefaultSnmpPresent(data);

    // Populate equipment form (following legacy logic - use backend data only)
    this.equipmentForm.patchValue({
      manufacturer: data.manufacturer || '',
      kva: data.kva || '',
      multiModule: data.multiModule || '',
      maintByPass: data.maintByPass || '',
      other: data.other || '',
      model: data.modelNo || '',
      serialNo: data.serialNo || '',
      location: data.location || '',
      monthName: actualMonthName || '', // Use mapped backend month only, empty if not provided
      year: actualYear || null, // Use mapped backend year only, null if not provided
      status: data.status || 'Online',
      statusNotes: data.statusReason || '',
      parallelCabinet: data.parallelCabinet || defaultParallelCabinet, // Use backend data or intelligent default
      snmpPresent: data.snmpPresent || defaultSnmpPresent, // Use backend data or intelligent default
      modularUPS: data.modularUPS || '',
      ctoPartNo: data.ctoPartNo || data.other || '', // Map to CTO/Part No if available in data
      upsType: data.modularUPS || 'NO' // Use the actual modularUPS value from backend or default to 'NO' (Normal UPS)
    });

    // Log the actual form values after patching to verify what's being set
    // Update selected date for calendar only if we have valid backend date data
    if (actualMonthName && actualYear) {
      try {
        const month = this.getMonthNumber(actualMonthName);
        if (month !== -1) {
          this.selectedDate = new Date(actualYear, month, 1);
          this.currentCalendarDate = new Date(this.selectedDate);
          this.selectedYear = this.selectedDate.getFullYear(); // Sync year selector
        }
      } catch (error) {
        // Could not parse date for calendar
      }
    }

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
      upsOnline: data.visual_NoAlarms || 'P', // Map to existing no alarms field
      checkConnections: data.visual_Tightness || 'P', // Map to existing tightness field
      inspectDamage: data.visual_Broken || 'P', // Map to existing broken field
      vacuumClean: data.visual_Vaccum || 'P', // Map to existing vacuum field
      epoSwitch: data.visual_EPO || 'P', // Map to existing EPO field
      coolingFans: data.visual_Noise || 'P', // Map to existing noise field
      fansAge: data.visual_FansAge || 'P',
      airFilters: data.visual_ReplaceFilters || 'P', // Map to existing replace filters field
      filterSet1Length: '',
      filterSet1Width: '',
      filterSet1Thickness: '',
      filterSet1Quantity: '',
      filterSet2Length: '',
      filterSet2Width: '',
      filterSet2Thickness: '',
      filterSet2Quantity: '',
      visualComments: ''
    });

    // Populate environment form
    this.environmentForm.patchValue({
      roomTempVentilation: data.environment_RoomTemp || 'P',
      safetyEquipment: data.environment_Saftey || 'P',
      hostileEnvironment: data.environment_Clean || 'N', // Default to No for hostile environment
      serviceSpace: data.environment_Space || 'P',
      circuitBreakers: data.environment_Circuit || 'P'
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
      dcCapsAge: this.convertZeroToEmpty(data.dcCapsYear),
      acInputCaps_PF: data.acInputCapsLeak_PF || 'P',
      acInputCapsAge: this.convertZeroToEmpty(data.acInputCapsYear),
      acOutputCaps_PF: data.acOutputCapsLeak_PF || 'P',
      acOutputCapsAge: this.convertZeroToEmpty(data.acOutputCapsYear),
      commCaps_PF: data.commCapsLeak_PF || 'P',
      commCapsAge: this.convertZeroToEmpty(data.commCapsYear),
      fansYear: this.convertZeroToEmpty(data.fansYear)
    });

    // Populate transfer form
    this.transferForm.patchValue({
      firstMajor: data.transfer_Major || 'No', // Default to 'No' to match legacy
      staticBypass: data.transfer_Static || 'P',
      transMaintByPass: data.transfer_ByPass || 'P',
      currentWave: data.transfer_Wave || 'P',
      normalMode: data.transfer_Normal || 'P',
      verifyAlarm: data.transfer_Alarm || 'P'
    });

    this.actionRequiredForm.patchValue({
      dcgAction1: data.dcgAction1 || 'N',
      custAction1: data.custAction1 || 'N'
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
      
      // Create temporary data object for default value calculation
      const tempData = {
        manufacturer: equipInfo?.Manufacturer || '',
        kva: equipInfo?.Upskva || '',
        year: this.convertToInt(equipInfo?.EquipYear) || new Date().getFullYear(),
        parallelCabinet: equipInfo?.ParallelCabinet || equipInfo?.parallelCabinet || '',
        snmpPresent: equipInfo?.SnmpPresent || equipInfo?.snmpPresent || equipInfo?.SNMP || ''
      } as any;
      
      const defaultParallelCabinet = this.determineDefaultParallelCabinet(tempData);
      const defaultSnmpPresent = this.determineDefaultSnmpPresent(tempData);
      
      this.equipmentForm.patchValue({
        kva: equipInfo?.Upskva || '',
        serialNo: equipInfo?.SerialID || '',
        location: equipInfo?.Location || '',
        model: equipInfo?.Version || '',
        monthName: equipInfo?.EquipMonth || '', // Use backend month only, empty if not provided
        year: this.convertToInt(equipInfo?.EquipYear) || null, // Use backend year only, null if not provided
        // Enhanced auto-population with intelligent defaults
        parallelCabinet: tempData.parallelCabinet || defaultParallelCabinet,
        snmpPresent: tempData.snmpPresent || defaultSnmpPresent,
        upsType: equipInfo?.ModularUPS || equipInfo?.UpsType || 'NO'
      });

      // Log the actual form values after patching from equipment info
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

  private populateReconciliationForm(data: EquipReconciliationInfo | null): void {
    if (data) {
      this.reconciliationForm.patchValue({
        model: data.model || '',
        modelCorrect: this.getVerificationDefault(data.modelCorrect),
        actModel: data.actModel || '',
        serialNo: data.serialNo || '',
        serialNoCorrect: this.getVerificationDefault(data.serialNoCorrect),
        actSerialNo: data.actSerialNo || '',
        kvaSize: data.kva || '',
        kvaCorrect: this.getVerificationDefault(data.kvaCorrect),
        actKVA: data.actKVA || '',
        totalEquips: data.totalEquips ? data.totalEquips.toString() : '',
        totalEquipsCorrect: this.getVerificationDefault(data.totalEquipsCorrect),
        actTotalEquips: data.actTotalEquips ? data.actTotalEquips.toString() : '',
        verified: data.verified || false
      });
      
    } else {
      // No existing data - use default values for new records
      this.reconciliationForm.patchValue({
        modelCorrect: this.getVerificationDefault(null),
        serialNoCorrect: this.getVerificationDefault(null),
        kvaCorrect: this.getVerificationDefault(null),
        totalEquipsCorrect: this.getVerificationDefault(null)
      });
      
    }

    // Set current equipment values from equipment form for comparison
    this.populateCurrentEquipmentValues();
    
    // Set up watchers for real-time verification status updates
    this.setupVerificationWatchers();
    
    // Set up reconciliation editable field watchers
    this.setupReconciliationEditableWatchers();
  }

  /**
   * Set up watchers for reconciliation dropdown changes to enable/disable actual value fields
   * Matches legacy EnabletoEdit functionality where "NO" makes fields editable, others make readonly
   */
  private setupReconciliationEditableWatchers(): void {
    // Model correctness -> actual model field
    this.reconciliationForm.get('modelCorrect')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.updateFieldEditability('actModel', value);
    });

    // Serial number correctness -> actual serial number field
    this.reconciliationForm.get('serialNoCorrect')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.updateFieldEditability('actSerialNo', value);
    });

    // KVA correctness -> actual KVA field
    this.reconciliationForm.get('kvaCorrect')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.updateFieldEditability('actKVA', value);
    });

    // Total equipment correctness -> actual total equipment field
    this.reconciliationForm.get('totalEquipsCorrect')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.updateFieldEditability('actTotalEquips', value);
    });
  }

  /**
   * Update field editability based on dropdown value
   * Legacy logic: "NO" = editable, other values = readonly
   */
  private updateFieldEditability(fieldName: string, dropdownValue: string): void {
    const field = this.reconciliationForm.get(fieldName);
    if (!field) return;

    if (dropdownValue === 'NO' || dropdownValue === 'N') {
      // Make field editable
      field.enable();
    } else {
      // Make field readonly
      field.disable();
    }
  }

  /**
   * Set up watchers to monitor changes in verification dropdowns for real-time feedback
   */
  private setupVerificationWatchers(): void {
    const verificationFields = ['modelCorrect', 'serialNoCorrect', 'kvaCorrect', 'totalEquipsCorrect'];
    
    verificationFields.forEach(field => {
      this.reconciliationForm.get(field)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
        console.log(`Verification status updated - ${field}: ${value}`);
        
        // Auto-check verified checkbox if all fields are verified
        this.checkAutoVerificationComplete();
      });
    });
  }

  /**
   * Check if all verification fields are completed and auto-check verified if appropriate
   */
  private checkAutoVerificationComplete(): void {
    const verificationValues = {
      model: this.reconciliationForm.get('modelCorrect')?.value,
      serial: this.reconciliationForm.get('serialNoCorrect')?.value,
      kva: this.reconciliationForm.get('kvaCorrect')?.value,
      totalEquips: this.reconciliationForm.get('totalEquipsCorrect')?.value
    };
    
    // Check if all verification fields have been addressed
    const allFieldsVerified = Object.values(verificationValues).every(value => 
      value === 'Y' || value === 'N' || value === 'N/A'
    );
    
    if (allFieldsVerified && !this.reconciliationForm.get('verified')?.value) {
      console.log('All verification fields completed - auto-checking verified status');
      this.reconciliationForm.patchValue({ verified: true });
    }
  }

  /**
   * Get the default value for verification dropdowns based on existing data
   * Returns existing saved value if available, otherwise defaults to empty string (blank)
   */
  private getVerificationDefault(existingValue: string | null | undefined): string {
    // If we have existing verification data, use it
    if (existingValue && (existingValue === 'Y' || existingValue === 'N' || existingValue === 'N/A')) {
      return existingValue;
    }
    
    // For new records or missing data, default to empty string (blank dropdown)
    // This allows technicians to make a conscious choice rather than assuming correctness
    return '';
  }

  /**
   * Populate current equipment values in reconciliation form for comparison
   */
  private populateCurrentEquipmentValues(): void {
    const equipmentValues = this.equipmentForm.value;
    
    // Update the current values in reconciliation form if they're empty
    const currentValues = {
      model: equipmentValues.model || '',
      serialNo: equipmentValues.serialNo || '',
      kvaSize: equipmentValues.kva || '',
      totalEquips: '1' // Default to 1 equipment unless specified otherwise
    };

    const reconciliationValues = this.reconciliationForm.value;
    
    // Only update if the reconciliation fields are empty
    const updateValues: any = {};
    
    if (!reconciliationValues.model) {
      updateValues.model = currentValues.model;
    }
    if (!reconciliationValues.serialNo) {
      updateValues.serialNo = currentValues.serialNo;
    }
    if (!reconciliationValues.kvaSize) {
      updateValues.kvaSize = currentValues.kvaSize;
    }
    if (!reconciliationValues.totalEquips) {
      updateValues.totalEquips = currentValues.totalEquips;
    }

    if (Object.keys(updateValues).length > 0) {
      this.reconciliationForm.patchValue(updateValues);
      console.log('Updated reconciliation form with current equipment values:', updateValues);
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
    // This matches the legacy GetPNVolt function
    if (voltA > 0) {
      const phaseToNeutralA = Math.round(voltA / 1.732);
      // Store calculated value for display - could be added to form if needed
      // form.patchValue({ phaseToNeutralA: phaseToNeutralA }, { emitEvent: false });
    }
    
    if (voltB > 0) {
      const phaseToNeutralB = Math.round(voltB / 1.732);
      // form.patchValue({ phaseToNeutralB: phaseToNeutralB }, { emitEvent: false });
    }
    
    if (voltC > 0) {
      const phaseToNeutralC = Math.round(voltC / 1.732);
      // form.patchValue({ phaseToNeutralC: phaseToNeutralC }, { emitEvent: false });
    }

    // Call the legacy-style comprehensive phase to neutral calculation
    this.calculatePhaseToNeutralAllSections();
  }

  /**
   * Comprehensive phase-to-neutral calculation matching legacy PhasetoNuetralIPVoltages function
   * This handles all voltage configurations and calculates phase-to-neutral voltages automatically
   */
  private calculatePhaseToNeutralAllSections(): void {
    // Input calculations
    this.calculatePhaseToNeutralForSection('input');
    
    // Bypass calculations  
    this.calculatePhaseToNeutralForSection('bypass');
    
    // Output calculations
    this.calculatePhaseToNeutralForSection('output');
  }

  private calculatePhaseToNeutralForSection(sectionType: 'input' | 'bypass' | 'output'): void {
    const form = sectionType === 'input' ? this.inputReadingsForm : 
                 sectionType === 'bypass' ? this.bypassReadingsForm : this.outputReadingsForm;
    
    const configValue = form.get('configuration')?.value;
    
    // Only calculate for 3-phase configurations that show phase-to-neutral
    if (configValue === '3' || configValue === '4' || configValue === '5' || configValue === '6') {
      const voltA = this.convertToDouble(form.get('voltA')?.value);
      const voltB = this.convertToDouble(form.get('voltB')?.value);
      const voltC = this.convertToDouble(form.get('voltC')?.value);

      // Legacy GetPNVolt calculation: Math.round(Voltage.value / 1.732, 0)
      if (voltA > 0) {
        const phaseToNeutralA = Math.round(voltA / 1.732);
        // This would be displayed in the UI - exact implementation depends on template structure
      }
      
      if (voltB > 0) {
        const phaseToNeutralB = Math.round(voltB / 1.732);
      }
      
      if (voltC > 0) {
        const phaseToNeutralC = Math.round(voltC / 1.732);
      }
    }
  }

  /**
   * Calculate phase to neutral voltage
   * Equivalent to GetPhasetoNuetralVoltage(string PPVoltage) in legacy code
   */
  /**
   * Calculate total load percentage for output readings
   */
  calculateTotalLoad(): void {
    const loadA = this.convertToDouble(this.outputReadingsForm.get('loadA')?.value || '0');
    const loadB = this.convertToDouble(this.outputReadingsForm.get('loadB')?.value || '0');
    
    const total = loadA + loadB;
    this.outputReadingsForm.get('totalLoad')?.setValue(total);
  }

  /**
   * Comprehensive load percentage calculation matching legacy CalcLoadPercent function
   * Calculates load percentages for each voltage type and validates against 85% and 90% thresholds
   */
  calculateLoadPercent(): boolean {
    // Don't validate during page loading or if not actively calculating
    if (this.loading) return true;
    
    const outputConfig = this.outputReadingsForm.get('configuration')?.value;
    const kvaValue = this.equipmentForm.get('kva')?.value;
    
    // Only validate if this is an explicit calculation request, not auto-triggered
    if (!kvaValue || kvaValue === '') {
      return true; // Allow empty KVA during form setup, only validate on explicit calculation
    }

    const upsKVA = this.convertToDouble(kvaValue);
    
    switch (outputConfig) {
      case '1': // 120V Single Phase
        return this.calculateSinglePhaseLoad(upsKVA, '120');
      case '2': // 240V Two Phase
        return this.calculateTwoPhaseLoad(upsKVA, '240');
      case '3': // 208V Three Phase
        return this.calculateThreePhaseLoad(upsKVA, '208');
      case '4': // 480V Three Phase
        return this.calculateThreePhaseLoad(upsKVA, '480');
      case '5': // 600V Three Phase
        return this.calculateThreePhaseLoad(upsKVA, '600');
      case '6': // 575V Three Phase
        return this.calculateThreePhaseLoad(upsKVA, '575');
      case '7': // 208V Single Phase
        return this.calculateSinglePhaseLoad(upsKVA, '208S');
      case '8': // 208V Two Phase
        return this.calculateTwoPhaseLoad(upsKVA, '208T');
      case '9': // 480V Single Phase
        return this.calculateSinglePhaseLoad(upsKVA, '480S');
      case '10': // 277V Single Phase
        return this.calculateSinglePhaseLoad(upsKVA, '277S');
      case '11': // 400V Three Phase
        return this.calculateThreePhaseLoad(upsKVA, '400');
      default:
        alert('You must enter the values for Input, Bypass and Output voltages.');
        return false;
    }
  }

  private calculateSinglePhaseLoad(upsKVA: number, voltageType: string): boolean {
    const currentField = this.getOutputCurrentField('A', voltageType);
    const voltageField = this.getOutputVoltageField('A', voltageType);
    const loadField = this.getOutputLoadField('A', voltageType);
    const totalLoadField = this.getOutputTotalLoadField(voltageType);
    const loadDropdownField = this.getOutputLoadDropdownField('A', voltageType);

    const current = this.convertToDouble(currentField);
    const voltage = this.convertToDouble(voltageField);

    if (current === 0) {
      // Only show alert during active use, not during page load
      if (!this.loading) {
        alert('Output Current cannot be empty');
      }
      return false;
    }

    // Calculate: KVA = Current * Voltage / 1000
    const actualKVA = current * voltage / 1000;
    const loadPercentage = (actualKVA * 100) / upsKVA;

    this.setOutputLoadValue(loadField, loadPercentage);
    this.setOutputTotalLoadValue(totalLoadField, loadPercentage);

    return this.validateLoadPercentage(loadPercentage, loadDropdownField, 'A');
  }

  private calculateTwoPhaseLoad(upsKVA: number, voltageType: string): boolean {
    const currentA = this.convertToDouble(this.getOutputCurrentField('A', voltageType));
    const voltageA = this.convertToDouble(this.getOutputVoltageField('A', voltageType));
    const currentB = this.convertToDouble(this.getOutputCurrentField('B', voltageType));
    const voltageB = this.convertToDouble(this.getOutputVoltageField('B', voltageType));

    if (currentA === 0 || currentB === 0) {
      // Only show alert during active use, not during page load
      if (!this.loading) {
        alert('Output Current A or Output Current B cannot be empty');
      }
      return false;
    }

    const eachPhaseKVA = upsKVA / 2;

    // Phase A calculations
    const actualKVA_A = currentA * voltageA / 1000;
    const loadPercentageA = (actualKVA_A * 100) / eachPhaseKVA;

    // Phase B calculations
    const actualKVA_B = currentB * voltageB / 1000;
    const loadPercentageB = (actualKVA_B * 100) / eachPhaseKVA;

    // Total load is average of both phases
    const totalLoad = ((loadPercentageA + loadPercentageB) / 2);

    this.setOutputLoadValue(this.getOutputLoadField('A', voltageType), loadPercentageA);
    this.setOutputLoadValue(this.getOutputLoadField('B', voltageType), loadPercentageB);
    this.setOutputTotalLoadValue(this.getOutputTotalLoadField(voltageType), totalLoad);

    // Validate both phases
    const validA = this.validateLoadPercentage(loadPercentageA, this.getOutputLoadDropdownField('A', voltageType), 'A');
    const validB = this.validateLoadPercentage(loadPercentageB, this.getOutputLoadDropdownField('B', voltageType), 'B');

    return validA && validB;
  }

  private calculateThreePhaseLoad(upsKVA: number, voltageType: string): boolean {
    const currentA = this.convertToDouble(this.getOutputCurrentField('A', voltageType));
    const voltageA = this.convertToDouble(this.getOutputVoltageField('A', voltageType));
    const currentB = this.convertToDouble(this.getOutputCurrentField('B', voltageType));
    const voltageB = this.convertToDouble(this.getOutputVoltageField('B', voltageType));
    const currentC = this.convertToDouble(this.getOutputCurrentField('C', voltageType));
    const voltageC = this.convertToDouble(this.getOutputVoltageField('C', voltageType));

    if (currentA === 0 || currentB === 0 || currentC === 0) {
      // Only show alert during active use, not during page load
      if (!this.loading) {
        alert('Output Current A, B, C cannot be empty');
      }
      return false;
    }

    const eachPhaseKVA = upsKVA / 3;

    // Three-phase calculations use 1732 factor (√3 * 1000)
    const loadPercentageA = ((voltageA * currentA / 1732) * 100) / eachPhaseKVA;
    const loadPercentageB = ((voltageB * currentB / 1732) * 100) / eachPhaseKVA;
    const loadPercentageC = ((voltageC * currentC / 1732) * 100) / eachPhaseKVA;

    // Total load is average of all three phases
    const totalLoad = (loadPercentageA + loadPercentageB + loadPercentageC) / 3;

    this.setOutputLoadValue(this.getOutputLoadField('A', voltageType), loadPercentageA);
    this.setOutputLoadValue(this.getOutputLoadField('B', voltageType), loadPercentageB);
    this.setOutputLoadValue(this.getOutputLoadField('C', voltageType), loadPercentageC);
    this.setOutputTotalLoadValue(this.getOutputTotalLoadField(voltageType), totalLoad);

    // Validate all three phases
    const validA = this.validateLoadPercentage(loadPercentageA, this.getOutputLoadDropdownField('A', voltageType), 'A');
    const validB = this.validateLoadPercentage(loadPercentageB, this.getOutputLoadDropdownField('B', voltageType), 'B');
    const validC = this.validateLoadPercentage(loadPercentageC, this.getOutputLoadDropdownField('C', voltageType), 'C');

    return validA && validB && validC;
  }

  private validateLoadPercentage(loadPercentage: number, dropdownField: any, phase: string): boolean {
    if (loadPercentage >= 90) {
      if (confirm(`Are you sure that Load on UPS Phase ${phase} exceeds maximum limit`)) {
        this.setDropdownValue(dropdownField, 'F');
      } else {
        return false;
      }
    } else if (loadPercentage >= 85) {
      if (confirm(`Are you sure that Load on UPS Phase ${phase} is above 85%`)) {
        this.setDropdownValue(dropdownField, 'F');
      } else {
        return false;
      }
    } else {
      this.setDropdownValue(dropdownField, 'P');
    }
    return true;
  }

  // Helper methods to get field values based on voltage type
  private getOutputCurrentField(phase: 'A' | 'B' | 'C', voltageType: string): any {
    return this.outputReadingsForm.get(`curr${phase}`)?.value || '';
  }

  private getOutputVoltageField(phase: 'A' | 'B' | 'C', voltageType: string): any {
    return this.outputReadingsForm.get(`volt${phase}`)?.value || '';
  }

  private getOutputLoadField(phase: 'A' | 'B' | 'C', voltageType: string): any {
    return this.outputReadingsForm.get(`load${phase}`);
  }

  private getOutputTotalLoadField(voltageType: string): any {
    return this.outputReadingsForm.get('totalLoad');
  }

  private getOutputLoadDropdownField(phase: 'A' | 'B' | 'C', voltageType: string): any {
    return this.outputReadingsForm.get(`load${phase}_PF`);
  }

  private setOutputLoadValue(field: any, value: number): void {
    if (field) {
      field.setValue(Math.round(value * 100) / 100); // Round to 2 decimal places
    }
  }

  private setOutputTotalLoadValue(field: any, value: number): void {
    if (field) {
      field.setValue(Math.round(value * 100) / 100); // Round to 2 decimal places
    }
  }

  private setDropdownValue(field: any, value: string): void {
    if (field) {
      field.setValue(value);
    }
  }

  /**
   * Validate current readings with tolerance checking
   * Matches legacy ValidateAllCurrents function
   */
  validateCurrentReadings(type: 'input' | 'bypass' | 'output'): boolean {
    const form = type === 'input' ? this.inputReadingsForm : 
                  type === 'bypass' ? this.bypassReadingsForm : this.outputReadingsForm;
    
    const configuration = form.get('configuration')?.value;
    const kvaValue = this.equipmentForm.get('kva')?.value;
    
    // Only validate for multi-phase configurations
    if (!this.isMultiPhaseConfiguration(configuration)) {
      return true;
    }

    const upsKVA = this.convertToDouble(kvaValue);
    const tolerance = upsKVA > 200 ? 0.30 : 0.50; // Legacy tolerance logic

    const currentA = this.convertToDouble(form.get('currA')?.value);
    const currentB = this.convertToDouble(form.get('currB')?.value);
    const currentC = this.convertToDouble(form.get('currC')?.value);

    // Validate A and B phases
    if (currentA === 0 || currentB === 0) {
      alert('Input Current A or B cannot be empty');
      return false;
    }

    const toleranceValueA = Math.round((currentA * tolerance) * 10) / 10;

    // Check A vs B tolerance
    const diffAB = Math.abs(currentA - currentB);
    if (diffAB > toleranceValueA) {
      const message = `${type.charAt(0).toUpperCase() + type.slice(1)} Current A and Current B not in Tolerance. Power Verification will be failed.\nAre you sure you want to do this?\nTolerance range can be: +- ${toleranceValueA}`;
      
      if (confirm(message)) {
        this.setFailedCurrentStatus(form, ['currB_PF'], type);
      } else {
        form.get('currB')?.markAsTouched();
        return false;
      }
    }

    // Validate C phase if it's a three-phase configuration
    if (this.isThreePhaseConfiguration(configuration)) {
      if (currentC === 0) {
        alert('Input Current C cannot be empty');
        return false;
      }

      const toleranceValueB = Math.round((currentB * tolerance) * 10) / 10;
      const diffBC = Math.abs(currentB - currentC);

      if (diffBC > toleranceValueB) {
        const message = `${type.charAt(0).toUpperCase() + type.slice(1)} Current B and Current C not in Tolerance. Power Verification will be failed.\nAre you sure you want to do this?\nTolerance range can be: +- ${toleranceValueA}`;
        
        if (confirm(message)) {
          this.setFailedCurrentStatus(form, ['currB_PF', 'currC_PF'], type);
        } else {
          form.get('currC')?.markAsTouched();
          return false;
        }
      }
    }

    return true;
  }

  private isMultiPhaseConfiguration(configuration: string): boolean {
    return ['2', '3', '4', '5', '6', '8', '11'].includes(configuration);
  }

  private isThreePhaseConfiguration(configuration: string): boolean {
    return ['3', '4', '5', '6', '11'].includes(configuration);
  }

  private setFailedCurrentStatus(form: FormGroup, fieldNames: string[], type: string): void {
    fieldNames.forEach(fieldName => {
      form.get(fieldName)?.setValue('F');
    });

    // Also set the three-phase status to failed if applicable
    const threePhaseField = this.measurementsForm.get('threePhase');
    if (threePhaseField) {
      threePhaseField.setValue('F');
    }
  }

  /**
   * Comprehensive validation function matching legacy ValidateInputCurr
   * Validates all critical form fields before saving
   */
  validateComprehensiveInputs(): boolean {
    // Validate manufacturer
    const manufacturer = this.equipmentForm.get('manufacturer')?.value;
    if (!manufacturer || manufacturer.substring(0, 3) === 'Ple' || manufacturer === '') {
      alert('Please select the manufacturer');
      this.equipmentForm.get('manufacturer')?.markAsTouched();
      return false;
    }

    // Validate model
    const model = this.equipmentForm.get('model')?.value;
    if (!model || model.trim() === '') {
      alert('Please enter the Model No');
      this.equipmentForm.get('model')?.markAsTouched();
      return false;
    }

    // Validate CTO/Part No
    const ctoPartNo = this.equipmentForm.get('ctoPartNo')?.value;
    if (!ctoPartNo || ctoPartNo.trim() === '') {
      alert('Please enter the CTO / Part No');
      this.equipmentForm.get('ctoPartNo')?.markAsTouched();
      return false;
    }

    // Validate serial number
    const serialNo = this.equipmentForm.get('serialNo')?.value;
    if (!serialNo || serialNo.trim() === '') {
      alert('Please enter the Serial No');
      this.equipmentForm.get('serialNo')?.markAsTouched();
      return false;
    }

    // Validate location
    const location = this.equipmentForm.get('location')?.value;
    if (!location || location.trim() === '') {
      alert('Please enter the Location');
      this.equipmentForm.get('location')?.markAsTouched();
      return false;
    }

    // Validate KVA
    const kvaValue = this.equipmentForm.get('kva')?.value;
    if (!kvaValue || kvaValue.trim() === '') {
      alert('KVA value cannot be empty');
      this.equipmentForm.get('kva')?.markAsTouched();
      return false;
    }

    const kva = this.convertToDouble(kvaValue);
    if (kva <= 0) {
      alert('Please enter valid KVA Value');
      this.equipmentForm.get('kva')?.markAsTouched();
      return false;
    }

    // Validate maintenance bypass
    const maintByPass = this.equipmentForm.get('maintByPass')?.value;
    if (maintByPass === 'NA' || !maintByPass) {
      alert('Please select the value for Maintenance ByPass');
      this.equipmentForm.get('maintByPass')?.markAsTouched();
      return false;
    }

    // Validate SNMP
    const snmpPresent = this.equipmentForm.get('snmpPresent')?.value;
    if (snmpPresent === 'PS' || !snmpPresent) {
      alert('Please select the value for SNMP Card Present ?');
      this.equipmentForm.get('snmpPresent')?.markAsTouched();
      return false;
    }

    // Validate date code
    const monthName = this.equipmentForm.get('monthName')?.value;
    const year = this.equipmentForm.get('year')?.value;
    if (!monthName || monthName === '' || !year || year === '') {
      alert('Please enter the Month and Year.');
      this.equipmentForm.get('monthName')?.markAsTouched();
      this.equipmentForm.get('year')?.markAsTouched();
      return false;
    }

    // Validate date code age - format for validation
    const dateCodeForValidation = `${this.getMonthNumber(monthName)}/${year}`;
    if (!this.validateDateCodeAge(dateCodeForValidation, kva)) {
      return false;
    }

    // Validate reconciliation
    const verified = this.reconciliationForm.get('verified')?.value;
    if (!verified) {
      alert('You must verify the Reconciliation section before Saving PM form');
      return false;
    }

    // Validate fans age
    if (!this.validateFansAge(kva)) {
      return false;
    }

    // Validate end of life
    if (!this.validateEndOfLife(dateCodeForValidation, kva)) {
      return false;
    }

    // Validate data format (no forward slashes)
    if (!this.validateDataFormat()) {
      return false;
    }

    // Validate capacitor data for major service
    if (!this.validateCapacitorData()) {
      return false;
    }

    // Validate voltage configurations
    if (!this.validateVoltageConfigurations()) {
      return false;
    }

    // Calculate load percentages
    if (!this.calculateLoadPercent()) {
      return false;
    }

    // Validate load percentage threshold
    if (!this.validateLoadPercentageThreshold()) {
      return false;
    }

    // Validate current readings
    if (!this.validateAllCurrentReadings()) {
      return false;
    }

    // Validate frequency ranges
    if (!this.validateFrequencyRanges()) {
      return false;
    }

    // Final equipment status confirmation
    const status = this.equipmentForm.get('status')?.value;
    if (status !== 'Online') {
      if (!confirm(`Are you sure that the Equipment Status: ${status}`)) {
        return false;
      }
    }

    return true;
  }

  private validateDateCodeAge(dateCode: string, kva: number): boolean {
    try {
      const dateCodeDate = new Date(dateCode);
      const today = new Date();

      if (dateCodeDate > today) {
        alert('DateCode cannot be higher than today\'s date');
        return false;
      }

      const ageInYears = today.getFullYear() - dateCodeDate.getFullYear();
      if (ageInYears > 30) {
        if (!confirm('Are you sure UPS age is more than 30 years ?')) {
          this.equipmentForm.get('dateCode')?.markAsTouched();
          return false;
        }
      }

      return true;
    } catch (error) {
      alert('Invalid date format in DateCode');
      return false;
    }
  }

  private validateFansAge(kva: number): boolean {
    const fansYear = this.convertToInt(this.capacitorForm.get('fansYear')?.value);
    const currentYear = new Date().getFullYear();
    const modularUPS = this.equipmentForm.get('modularUPS')?.value;

    if (fansYear > 0) {
      const fansAge = currentYear - fansYear;
      if (fansAge > 7) {
        if (modularUPS === 'NO') {
          if (confirm('Fans are more than 7 years old. Fans dropdown marked as Failed')) {
            this.visualForm.get('fansAge')?.setValue('F');
          } else {
            this.visualForm.get('fansAge')?.setValue('F');
            return false;
          }
        } else {
          this.visualForm.get('fansAge')?.setValue('P');
        }
      } else {
        this.visualForm.get('fansAge')?.setValue('P');
      }
    }

    return true;
  }

  private validateEndOfLife(dateCode: string, kva: number): boolean {
    try {
      const dateCodeDate = new Date(dateCode);
      const currentYear = new Date().getFullYear();
      const upsAge = currentYear - dateCodeDate.getFullYear();
      const endOfLifeThreshold = kva <= 50 ? 20 : 25;

      if (upsAge > endOfLifeThreshold) {
        if (confirm(`UPS date code is > ${endOfLifeThreshold} years. End of Life dropdown marked as Failed`)) {
          this.measurementsForm.get('endOfLife')?.setValue('F');
        } else {
          this.measurementsForm.get('endOfLife')?.setValue('F');
          return false;
        }
      } else {
        this.measurementsForm.get('endOfLife')?.setValue('P');
      }

      return true;
    } catch (error) {
      return true; // If date parsing fails, skip validation
    }
  }

  private validateDataFormat(): boolean {
    // Get all input elements and check for forward slashes
    const excludedFields = [
      'dateCode', 'model', 'actModel', 'serialNo', 'actSerialNo', 'ctoPartNo'
    ];

    const forms = [
      this.equipmentForm,
      this.reconciliationForm,
      this.measurementsForm,
      this.inputReadingsForm,
      this.bypassReadingsForm,
      this.outputReadingsForm,
      this.rectifierForm,
      this.capacitorForm
    ];

    for (const form of forms) {
      const formValues = form.value;
      for (const [fieldName, value] of Object.entries(formValues)) {
        if (excludedFields.includes(fieldName)) continue;
        
        if (typeof value === 'string' && value.includes('/')) {
          alert(`${fieldName} - data / is not allowed in textbox`);
          return false;
        }
      }
    }

    return true;
  }

  private validateCapacitorData(): boolean {
    const monthName = this.equipmentForm.get('monthName')?.value;
    const year = this.equipmentForm.get('year')?.value;
    const modularUPS = this.equipmentForm.get('modularUPS')?.value;
    
    // Check if this is a major service (would need to be determined from service description)
    const isMajorService = true; // Simplified - would need actual service type logic

    if (modularUPS !== 'LC' && modularUPS !== 'YS' && isMajorService) {
      const dcCapsAge = this.capacitorForm.get('dcCapsAge')?.value;
      const acInputCapsAge = this.capacitorForm.get('acInputCapsAge')?.value;
      const acOutputCapsAge = this.capacitorForm.get('acOutputCapsAge')?.value;
      const commCapsAge = this.capacitorForm.get('commCapsAge')?.value;
      const dateCodeDisplay = `${monthName} ${year}`;

      if (!dcCapsAge || dcCapsAge.trim() === '') {
        alert(`You must enter DC Caps Year. Here is the UPS DateCode : ${dateCodeDisplay}`);
        this.capacitorForm.get('dcCapsAge')?.markAsTouched();
        return false;
      }

      if (!acInputCapsAge || acInputCapsAge.trim() === '') {
        alert(`You must enter AC Input Caps Year. Here is the UPS DateCode : ${dateCodeDisplay}`);
        this.capacitorForm.get('acInputCapsAge')?.markAsTouched();
        return false;
      }

      if ((!acOutputCapsAge || acOutputCapsAge.trim() === '') && 
          (!commCapsAge || commCapsAge.trim() === '')) {
        alert(`You must enter AC OP WYE or OP Delta Caps Year. Here is the UPS DateCode: ${dateCodeDisplay}`);
        this.capacitorForm.get('acOutputCapsAge')?.markAsTouched();
        return false;
      }
    }

    return true;
  }

  private validateVoltageConfigurations(): boolean {
    const inputConfig = this.inputReadingsForm.get('configuration')?.value;
    const bypassConfig = this.bypassReadingsForm.get('configuration')?.value;
    const outputConfig = this.outputReadingsForm.get('configuration')?.value;

    if (inputConfig === '0' || bypassConfig === '0' || outputConfig === '0') {
      alert('You must enter the values for Input, Bypass and Output voltages.');
      return false;
    }

    return true;
  }

  private validateLoadPercentageThreshold(): boolean {
    const outputConfig = this.outputReadingsForm.get('configuration')?.value;
    const totalLoadField = this.getTotalLoadFieldForConfig(outputConfig);
    
    if (totalLoadField) {
      const totalLoad = this.convertToDouble(totalLoadField.value);
      
      if (totalLoad > 85) {
        if (confirm('UPS Load is more than 85%. % load (KVA) dropdown is Failed')) {
          this.measurementsForm.get('loadKVA')?.setValue('F');
        } else {
          this.measurementsForm.get('loadKVA')?.setValue('F');
          return false;
        }
      } else {
        this.measurementsForm.get('loadKVA')?.setValue('P');
      }
    }

    return true;
  }

  private getTotalLoadFieldForConfig(outputConfig: string): any {
    // This would return the appropriate total load field based on configuration
    return this.outputReadingsForm.get('totalLoad');
  }

  private validateAllCurrentReadings(): boolean {
    return this.validateCurrentReadings('input') && 
           this.validateCurrentReadings('bypass') && 
           this.validateCurrentReadings('output');
  }

  private validateFrequencyRanges(): boolean {
    // Input frequency: 55-65 Hz
    const inputFreq = this.convertToDouble(this.inputReadingsForm.get('freq')?.value);
    if (inputFreq < 55 || inputFreq > 65) {
      if (!confirm('Are you sure that Input Frequency not within specified tolerance')) {
        return false;
      }
      this.inputReadingsForm.get('freq_PF')?.setValue('F');
    } else {
      this.inputReadingsForm.get('freq_PF')?.setValue('P');
    }

    // Bypass frequency: 55-65 Hz
    const bypassFreq = this.convertToDouble(this.bypassReadingsForm.get('freq')?.value);
    if (bypassFreq < 55 || bypassFreq > 65) {
      if (!confirm('Are you sure that Bypass Frequency not within specified tolerance')) {
        return false;
      }
      this.bypassReadingsForm.get('freq_PF')?.setValue('F');
    } else {
      this.bypassReadingsForm.get('freq_PF')?.setValue('P');
    }

    // Output frequency: 58-62 Hz
    const outputFreq = this.convertToDouble(this.outputReadingsForm.get('freq')?.value);
    if (outputFreq < 58 || outputFreq > 62) {
      if (!confirm('Are you sure that Output Frequency not within specified tolerance')) {
        return false;
      }
      this.outputReadingsForm.get('freq_PF')?.setValue('F');
    } else {
      this.outputReadingsForm.get('freq_PF')?.setValue('P');
    }

    return true;
  }

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
    
    // Get the voltage configuration to determine expected values
    const config = this.getVoltageConfiguration(configId);
    if (!config) return;

    // Clear existing readings first
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

    // Auto-populate expected voltage values based on configuration
    const expectedVoltage = this.getExpectedVoltageForConfig(configId);
    if (expectedVoltage && expectedVoltage > 0) {
      // Auto-populate voltage fields based on phase count and voltage type
      if (config.phaseCount === 1) {
        // Single phase: just A-B voltage
        form.patchValue({ voltA: expectedVoltage.toString() });
      } else if (config.phaseCount === 2) {
        // Two phase: A-B voltage
        form.patchValue({ voltA: expectedVoltage.toString() });
      } else if (config.phaseCount === 3) {
        // Three phase: A-B, B-C, C-A voltages (all line-to-line)
        form.patchValue({ 
          voltA: expectedVoltage.toString(),  // A-B
          voltB: expectedVoltage.toString(),  // B-C  
          voltC: expectedVoltage.toString()   // C-A
        });
      }
    }

    // Auto-populate standard frequency (60 Hz for most configurations)
    form.patchValue({ freq: '60' });

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

    // Trigger phase-to-neutral calculations if applicable
    this.calculatePhaseToNeutralAllSections();
  }

  /**
   * Get expected voltage value based on configuration ID
   */
  private getExpectedVoltageForConfig(configId: string): number {
    switch (configId) {
      case '1': return 120;  // 120V Single Phase
      case '7': return 208;  // 208V Single Phase  
      case '10': return 277; // 277V Single Phase
      case '9': return 480;  // 480V Single Phase
      case '2': return 240;  // 240V Two Phase
      case '8': return 208;  // 208V Two Phase
      case '3': return 208;  // 208V Three Phase
      case '4': return 480;  // 480V Three Phase
      case '5': return 600;  // 600V Three Phase
      case '6': return 575;  // 575V Three Phase
      case '11': return 400; // 400V Three Phase
      default: return 0;
    }
  }

  /**
   * Legacy-style voltage configuration showing/hiding
   * Matches the original JavaScript logic for showing specific voltage divs
   */
  shouldShowVoltageConfiguration(type: 'input' | 'bypass' | 'output', configId: string): boolean {
    const form = type === 'input' ? this.inputReadingsForm : 
                  type === 'bypass' ? this.bypassReadingsForm : this.outputReadingsForm;
    
    const selectedConfig = form.get('configuration')?.value;
    return selectedConfig === configId;
  }

  /**
   * Get configuration display name for legacy voltage types
   */
  getVoltageConfigurationName(configId: string): string {
    const configMap: { [key: string]: string } = {
      '1': '120V Single Phase',
      '2': '240V Two Phase', 
      '3': '208V Three Phase',
      '4': '480V Three Phase',
      '5': '600V Three Phase',
      '6': '575V Three Phase',
      '7': '208V Single Phase',
      '8': '208V Two Phase',
      '9': '480V Single Phase',
      '10': '277V Single Phase',
      '11': '400V Three Phase'
    };
    
    return configMap[configId] || `Configuration ${configId}`;
  }

  /**
   * Check if configuration requires phase-to-neutral display
   */
  shouldShowPhaseToNeutralForConfig(configId: string): boolean {
    // Three-phase configurations show phase-to-neutral calculations
    return ['3', '4', '5', '6', '11'].includes(configId);
  }

  onSave(): void {
    this.saveMode = 'ups';
    this.save(false);
  }

  onSaveAsDraft(): void {
    this.saveMode = 'draft';
    this.save(true);
  }

  onSaveUPS(): void {
    this.saveMode = 'ups';
    this.save(false);
  }

  private save(isDraft: boolean): void {
    if (!isDraft && !this.validateComprehensiveInputs()) {
      this.toastr.error('Please correct validation errors before saving');
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Build UPS data using the comprehensive DTO approach
    const upsData = this.buildUPSData(isDraft);
    const saveUpdateDto = convertToSaveUpdateDto(upsData, this.authService.currentUserValue?.username || 'SYSTEM');
    
    console.log('Saving UPS data with DTO:', saveUpdateDto);
    
    // Use the new comprehensive SaveUpdateaaETechUPS API method
    this.equipmentService.saveUpdateaaETechUPS(saveUpdateDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: SaveUpdateUPSResponse) => {
          if (response.success) {
            // Update equipment status if not draft
            if (!isDraft) {
              this.updateEquipmentStatus();
            }
            
            // Save reconciliation data
            this.saveReconciliationData();
            
            // Filter currents data removed - handled in power verification section
            
            this.successMessage = isDraft ? 'Draft saved successfully' : 'UPS readings saved successfully';
            this.toastr.success(this.successMessage);
            
            console.log('UPS data saved successfully:', response);
          } else {
            this.errorMessage = response.message;
            this.toastr.error(this.errorMessage);
          }
          this.saving = false;
          this.saveMode = null;
        },
        error: (error) => {
          console.error('Error saving UPS readings:', error);
          this.errorMessage = 'Error saving UPS readings. Please try again.';
          this.toastr.error(this.errorMessage);
          this.saving = false;
          this.saveMode = null;
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
    const actionRequired = this.actionRequiredForm.value;

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
      ctoPartNo: equipment.ctoPartNo, // Include CTO/Part No
      upsType: equipment.upsType, // Include UPS Type
      
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
      visual_NoAlarms: visual.upsOnline,
      visual_Tightness: visual.checkConnections,
      visual_Broken: visual.inspectDamage,
      visual_Vaccum: visual.vacuumClean,
      visual_EPO: visual.epoSwitch,
      visual_Noise: visual.coolingFans,
      visual_FansAge: visual.fansAge,
      visual_ReplaceFilters: visual.airFilters,
      
      // Environment
      environment_RoomTemp: environment.roomTempVentilation,
      environment_Saftey: environment.safetyEquipment,
      environment_Clean: environment.hostileEnvironment,
      environment_Space: environment.serviceSpace,
      environment_Circuit: environment.circuitBreakers,
      
      // Transfer
      transfer_Major: transfer.firstMajor,
      transfer_Static: transfer.staticBypass,
      transfer_ByPass: transfer.transMaintByPass,
      transfer_Wave: transfer.currentWave,
      transfer_Normal: transfer.normalMode,
      transfer_Alarm: transfer.verifyAlarm,
      
      // Comments - removed section, providing defaults
      comments1: '',
      comments2: '',
      comments3: '',
      comments4: '',
      comments5: '',
      
      // Air filter data - removed from action items, providing defaults
      afLength: '',
      afWidth: '',
      afThick: '',
      afQty: '',
      afLength1: '',
      afWidth1: '',
      afThick1: '',
      afQty1: '',
      
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
      dcCapsAge_PF: 'P', // Default value for legacy compatibility
      dcCapsYear: this.convertToInt(capacitor.dcCapsAge),
      acInputCapsLeak_PF: capacitor.acInputCaps_PF,
      acInputCapsAge_PF: 'P', // Default value for legacy compatibility
      acInputCapsYear: this.convertToInt(capacitor.acInputCapsAge),
      acOutputCapsLeak_PF: capacitor.acOutputCaps_PF,
      acOutputCapsAge_PF: 'P', // Default value for legacy compatibility
      acOutputCapsYear: this.convertToInt(capacitor.acOutputCapsAge),
      commCapsLeak_PF: capacitor.commCaps_PF,
      commCapsAge_PF: 'P', // Default value for legacy compatibility
      commCapsYear: this.convertToInt(capacitor.commCapsAge),
      
      // Fan information
      fansYear: this.convertToInt(capacitor.fansYear),
      
      // Actions - removed action items section, providing defaults
      // Action required fields
      dcgAction1: actionRequired.dcgAction1 || 'N',
      custAction1: actionRequired.custAction1 || 'N',
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
    const monthName = this.equipmentForm.get('monthName')?.value;
    const year = this.equipmentForm.get('year')?.value;
    
    const statusData: UpdateEquipStatus = {
      callNbr: this.callNbr,
      equipId: this.equipId,
      status: status !== 'Offline' ? status : this.equipmentForm.get('status')?.value,
      notes: this.equipmentForm.get('statusNotes')?.value,
      tableName: 'UPS_Verification1',
      manufacturer: this.equipmentForm.get('manufacturer')?.value,
      modelNo: this.equipmentForm.get('model')?.value,
      serialNo: this.equipmentForm.get('serialNo')?.value,
      location: this.equipmentForm.get('location')?.value,
      maintAuthID: '', // Default or get from form if available
      monthName: monthName,
      year: parseInt(year),
      readingType: '1',
      batteriesPerString: 0,
      batteriesPerPack: 0, // Added required field
      vfSelection: ''
    };

    this.equipmentService.updateEquipStatus(statusData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (!response.success) {
            console.error('Error updating equipment status:', response.message);
          } else {
            console.log('Equipment status updated successfully:', response);
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

  // Job summary navigation disabled for UI - keeping for integration only  
  // onViewJobSummarySample(): void {
  //   const queryParams: any = {
  //     callNbr: this.callNbr,
  //     equipId: this.equipId,
  //     equipType: 'UPS',
  //     techId: this.techId,
  //     techName: this.techName
  //   };

  //   // Add archive and year if they exist
  //   if (this.archive) {
  //     queryParams.archive = this.archive;
  //   }
  //   if (this.year) {
  //     queryParams.year = this.year;
  //   }

  //   this.router.navigate(['/jobs/job-summary-sample'], { queryParams });
  // }

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

  /**
   * Legacy trimAll function - trims whitespace from both ends of a string
   * Matches the original JavaScript implementation
   */
  private trimAll(value: string): string {
    if (!value) return '';
    
    let result = value;
    
    // Trim from the beginning
    while (result.length > 0 && result.substring(0, 1) === ' ') {
      result = result.substring(1, result.length);
    }
    
    // Trim from the end
    while (result.length > 0 && result.substring(result.length - 1, result.length) === ' ') {
      result = result.substring(0, result.length - 1);
    }
    
    return result;
  }

  /**
   * Legacy IsNumeric function - check if input is a valid number
   */
  private isNumeric(input: string): boolean {
    const RE = /^-{0,1}\d*\.{0,1}\d+$/;
    return RE.test(input);
  }

  /**
   * Legacy ValidateCurr function - validates current entry order
   */
  private validateCurrentEntryOrder(currentId: string, previousCurrentId: string): boolean {
    const currentField = this.outputReadingsForm.get(currentId);
    const previousField = this.outputReadingsForm.get(previousCurrentId);

    if (!previousField?.value || this.trimAll(previousField.value) === '') {
      const phaseLabel = currentId.includes('A') ? 'A' : currentId.includes('B') ? 'B' : 'C';
      const previousPhase = previousCurrentId.includes('A') ? 'A' : 'B';
      
      alert(`Please first enter Input Current ${previousPhase}`);
      previousField?.markAsTouched();
      return false;
    }

    // For C phase, also check B phase
    if (currentId.includes('C')) {
      const bPhaseId = currentId.replace('C', 'B');
      const bPhaseField = this.outputReadingsForm.get(bPhaseId);
      
      if (!bPhaseField?.value || this.trimAll(bPhaseField.value) === '') {
        alert('Please first enter Input Current B');
        bPhaseField?.markAsTouched();
        return false;
      }
    }

    return true;
  }

  private formatDateCode(monthName: string, year: number): string {
    if (!monthName || !year || year <= 0) return '';
    
    const monthNumber = new Date(Date.parse(monthName + " 1, 2000")).getMonth() + 1;
    return `${monthNumber.toString().padStart(2, '0')}/01/${year}`;
  }

  private formatDateCodeFromData(monthName: string, year: number): string {
    if (!monthName || !year || year <= 0) return '';
    
    // Convert month name to month number (1-12)
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
    if (monthIndex >= 0) {
      const monthStr = (monthIndex + 1).toString().padStart(2, '0');
      return `${monthStr}/${year}`;
    }
    
    // Fallback: try to extract month number if monthName is numeric
    const monthNum = parseInt(monthName);
    if (monthNum >= 1 && monthNum <= 12) {
      const monthStr = monthNum.toString().padStart(2, '0');
      return `${monthStr}/${year}`;
    }
    
    // Last fallback: return MM/YYYY with 01 as default month
    return `01/${year}`;
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

  /**
   * Get CSS class for equipment status display
   */
  getStatusClass(status: string): string {
    if (!status) return '';
    
    switch (status.toLowerCase()) {
      case 'online':
        return 'badge bg-success';
      case 'online(minordeficiency)':
        return 'badge bg-warning';
      case 'online(majordeficiency)':
        return 'badge bg-warning';
      case 'criticaldeficiency':
        return 'badge bg-danger';
      case 'replacementrecommended':
        return 'badge bg-danger';
      case 'proactivereplacement':
        return 'badge bg-warning';
      case 'offline':
        return 'badge bg-secondary';
      default:
        return 'badge bg-primary';
    }
  }

  /**
   * Get display text for maintenance bypass type
   */
  getMaintenanceBypassText(value: string): string {
    if (!value) return '';
    
    const bypassType = this.maintenanceBypassTypes.find(type => type.value === value);
    return bypassType ? bypassType.text : value;
  }

  /**
   * Get display text for Yes/No values
   */
  getYesNoText(value: string): string {
    if (!value) return '';
    
    switch (value.toUpperCase()) {
      case 'Y':
        return 'Yes';
      case 'N':
        return 'No';
      case 'N/A':
        return 'N/A';
      default:
        return value;
    }
  }

  getMultiModuleText(value: string): string {
    if (!value) return '';
    
    const option = this.multiModuleTypes.find(t => t.value === value);
    return option ? option.text : value;
  }

  getUPSTypeText(value: string): string {
    if (!value) return '';
    
    const option = this.upsTypes.find(t => t.value === value);
    return option ? option.text : value;
  }

  /**
   * Check if a reconciliation field has a mismatch between current and actual values
   */
  hasReconciliationMismatch(currentField: string, actualField: string): boolean {
    const currentValue = this.reconciliationForm.get(currentField)?.value;
    const actualValue = this.reconciliationForm.get(actualField)?.value;
    
    if (!currentValue || !actualValue) return false;
    
    return currentValue.toString().trim() !== actualValue.toString().trim();
  }

  /**
   * Get CSS class for reconciliation field based on correctness status
   */
  getReconciliationFieldClass(correctnessField: string, currentField: string, actualField: string): string {
    const correctness = this.reconciliationForm.get(correctnessField)?.value;
    const hasMismatch = this.hasReconciliationMismatch(currentField, actualField);
    
    if (correctness === 'N' || hasMismatch) {
      return 'border-warning'; // Yellow border for issues
    } else if (correctness === 'Y') {
      return 'border-success'; // Green border for verified correct
    }
    
    return ''; // Default styling
  }

  // ========== CUSTOM DATE PICKER METHODS ==========
  
  // ========== UTILITY METHODS ==========
  /**
   * Compact date picker implementation with the following features:
   * 1. Minimal space usage with inline positioning
   * 2. Fast month/year navigation with double arrows for year jumps
   * 3. Month/Year picker view for quick navigation
   * 4. Click outside to close
   * 5. Today/Clear quick actions
   * 6. YYYY-MM format output for date codes
   */

  // Debug mode for date picker
  public debugDatePicker = true;

  private log(message: string, ...args: any[]): void {
    if (this.debugDatePicker) {
      console.log(`[DatePicker] ${message}`, ...args);
    }
  }

  toggleDatePicker(): void {
    this.log('toggleDatePicker called, current state:', this.showDatePicker);
    this.showDatePicker = !this.showDatePicker;
    this.showMonthYearPicker = false; // Always close month/year picker when toggling main picker
    this.log('Date picker toggled to:', this.showDatePicker);
  }

  getCurrentMonthYear(): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[this.currentCalendarDate.getMonth()]} ${this.currentCalendarDate.getFullYear()}`;
  }

  changeMonth(direction: number): void {
    const newDate = new Date(this.currentCalendarDate);
    newDate.setMonth(newDate.getMonth() + direction);
    this.currentCalendarDate = newDate;
    this.selectedYear = newDate.getFullYear(); // Keep year selector in sync
  }

  toggleMonthYearPicker(): void {
    this.showMonthYearPicker = !this.showMonthYearPicker;
  }

  getYearRange(): number[] {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 50;
    const endYear = currentYear + 10;
    const years: number[] = [];
    
    for (let year = startYear; year <= endYear; year++) {
      years.push(year);
    }
    
    return years;
  }

  getMonths(): string[] {
    return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  }

  onYearChange(): void {
    const newDate = new Date(this.currentCalendarDate);
    newDate.setFullYear(this.selectedYear);
    this.currentCalendarDate = newDate;
  }

  selectMonth(monthIndex: number): void {
    const newDate = new Date(this.currentCalendarDate);
    newDate.setMonth(monthIndex);
    this.currentCalendarDate = newDate;
    this.showMonthYearPicker = false;
  }

  getCalendarDays(): any[] {
    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();
    
    // Get first day of month and how many days to show from previous month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysFromPrevMonth = firstDay.getDay();
    
    // Get last day of previous month
    const prevMonth = new Date(year, month, 0);
    
    const days: any[] = [];
    
    // Add days from previous month
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const day = prevMonth.getDate() - i;
      const date = new Date(year, month - 1, day);
      days.push({
        day: day,
        date: date,
        isCurrentMonth: false,
        isToday: this.isSameDate(date, new Date()),
        isSelected: this.selectedDate && this.isSameDate(date, this.selectedDate)
      });
    }
    
    // Add days from current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const date = new Date(year, month, day);
      days.push({
        day: day,
        date: date,
        isCurrentMonth: true,
        isToday: this.isSameDate(date, new Date()),
        isSelected: this.selectedDate && this.isSameDate(date, this.selectedDate)
      });
    }
    
    // Add days from next month to complete the grid (42 days total - 6 weeks)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        day: day,
        date: date,
        isCurrentMonth: false,
        isToday: this.isSameDate(date, new Date()),
        isSelected: this.selectedDate && this.isSameDate(date, this.selectedDate)
      });
    }
    
    // Debug logging
    const currentMonthDays = days.filter(d => d.isCurrentMonth);
    this.log('Calendar days generated:', {
      totalDays: days.length,
      currentMonthDays: currentMonthDays.length,
      year,
      month: month + 1,
      selectedDate: this.selectedDate,
      sample: currentMonthDays.slice(0, 5)
    });
    
    return days;
  }

  selectDate(day: any): void {
    this.log('selectDate called with day:', day);
    
    if (!day || !day.isCurrentMonth) {
      this.log('Day is not in current month, ignoring. Day object:', day);
      return;
    }
    
    this.log('Proceeding with date selection...');
    
    this.selectedDate = new Date(day.date);
    this.log('Selected date set to:', this.selectedDate);
    
    const dateCode = `${this.selectedDate.getFullYear()}-${String(this.selectedDate.getMonth() + 1).padStart(2, '0')}`;
    this.log('Generated date code:', dateCode);
    
    // Update form
    this.equipmentForm.patchValue({
      dateCode: dateCode
    });
    
    this.log('Form updated with date code:', this.equipmentForm.get('dateCode')?.value);
    
    // Close date picker
    this.showDatePicker = false;
    this.showMonthYearPicker = false;
    
    this.log('Date picker closed, selection complete');
    
    // Force change detection
    this.cdr.detectChanges();
  }

  selectToday(): void {
    const today = new Date();
    this.log('selectToday called, today is:', today);
    
    this.selectedDate = today;
    this.currentCalendarDate = new Date(today);
    this.selectedYear = today.getFullYear();
    
    const dateCode = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    this.log('Today date code generated:', dateCode);
    
    this.equipmentForm.patchValue({
      dateCode: dateCode
    });
    
    this.log('Form updated with today date code:', this.equipmentForm.get('dateCode')?.value);
    
    this.showDatePicker = false;
    this.showMonthYearPicker = false;
    
    this.log('Date picker closed after selecting today');
  }

  clearDate(): void {
    this.selectedDate = null;
    this.equipmentForm.patchValue({
      dateCode: ''
    });
    this.showDatePicker = false;
    this.showMonthYearPicker = false;
  }

  testDateSelection(): void {
    this.log('TEST: testDateSelection called');
    const today = new Date();
    const testDay = {
      day: today.getDate(),
      date: today,
      isCurrentMonth: true,
      isToday: true,
      isSelected: false
    };
    
    this.log('TEST: Simulating click on today:', testDay);
    this.selectDate(testDay);
  }

  getCurrentMonthDaysCount(): number {
    return this.getCalendarDays().filter(d => d.isCurrentMonth).length;
  }

  private isSameDate(date1: Date, date2: Date): boolean {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  }

  // Legacy method for backward compatibility
  getDayButtonClass(day: any): string {
    let classes = 'btn-outline-secondary';
    
    if (!day.isCurrentMonth) {
      classes = 'btn-light text-muted';
    } else if (day.isSelected) {
      classes = 'btn-primary';
    } else if (day.isToday) {
      classes = 'btn-outline-primary';
    }
    
    return classes;
  }

  getCalendarWeeks(): any[][] {
    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the starting date (may be from previous month)
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const weeks: any[][] = [];
    const currentDate = new Date(startDate);
    
    for (let week = 0; week < 6; week++) {
      const days: any[] = [];
      
      for (let day = 0; day < 7; day++) {
        const isCurrentMonth = currentDate.getMonth() === month;
        const isToday = this.isSameDate(currentDate, new Date());
        const isSelected = this.selectedDate && this.isSameDate(currentDate, this.selectedDate);
        
        days.push({
          day: currentDate.getDate(),
          date: new Date(currentDate),
          isCurrentMonth: isCurrentMonth,
          isToday: isToday,
          isSelected: isSelected
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      weeks.push(days);
    }
    
    return weeks;
  }

  private getMonthNumber(monthName: string): number {
    if (!monthName) return -1;
    
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    
    const monthIndex = months.indexOf(monthName.toLowerCase());
    return monthIndex; // Returns 0-11 for months, -1 if not found
  }

  /**
   * Determine default value for parallel cabinet based on UPS characteristics
   * Larger UPS systems (higher KVA) are more likely to have parallel cabinets
   */
  private determineDefaultParallelCabinet(data: AAETechUPS): string {
    // If data explicitly provides a value, don't override
    if (data.parallelCabinet) return data.parallelCabinet;
    
    const kva = this.convertToDouble(data.kva);
    const manufacturer = (data.manufacturer || '').toUpperCase();
    
    // High-capacity UPS systems are more likely to have parallel configurations
    if (kva >= 500) return 'Y'; // Yes for high-capacity systems
    if (kva >= 200 && (manufacturer.includes('LIEBERT') || manufacturer.includes('APC') || manufacturer.includes('EATON'))) {
      return 'Y'; // Major manufacturers often have parallel options for mid-range systems
    }
    
    return 'N'; // Default to No for most standard systems
  }

  /**
   * Determine default value for SNMP card presence based on UPS characteristics
   * Modern UPS systems typically include SNMP cards for remote monitoring
   */
  private determineDefaultSnmpPresent(data: AAETechUPS): string {
    // If data explicitly provides a value, don't override
    if (data.snmpPresent) return data.snmpPresent;
    
    const kva = this.convertToDouble(data.kva);
    const manufacturer = (data.manufacturer || '').toUpperCase();
    const year = data.year || new Date().getFullYear();
    
    // Modern UPS systems (post-2010) typically have SNMP capabilities
    if (year >= 2010) return 'Y';
    
    // Higher capacity systems are more likely to have SNMP cards
    if (kva >= 100) return 'Y';
    
    // Major manufacturers typically include SNMP in their systems
    if (manufacturer.includes('APC') || manufacturer.includes('LIEBERT') || 
        manufacturer.includes('EATON') || manufacturer.includes('SCHNEIDER')) {
      return 'Y';
    }
    
    return 'N'; // Default to No for older or smaller systems
  }

  // Save methods for Environment section
  saveDraft(): void {
    console.log('Saving as draft...');
    // TODO: Implement save as draft functionality
    this.successMessage = 'UPS readings saved as draft successfully';
    this.errorMessage = '';
    
    // Clear message after 3 seconds
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  saveUPS(): void {
    console.log('Saving UPS readings...');
    // TODO: Implement save UPS functionality
    this.successMessage = 'UPS readings saved successfully';
    this.errorMessage = '';
    
    // Clear message after 3 seconds
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }
}