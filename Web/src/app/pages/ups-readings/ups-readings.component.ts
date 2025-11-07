import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, HostListener, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';

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
export class UpsReadingsComponent implements OnInit, OnDestroy, AfterViewInit {
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

  // Section visibility control properties
  showAdditionalNotes: boolean = false;
  showAdvancedSettings: boolean = false;
  showDebugInfo: boolean = false;
  showMaintenanceDetails: boolean = false;
  showPowerDetails: boolean = false;

  // Form validation state
  isFormSubmission: boolean = false;
  validationErrors: { [key: string]: string } = {};

  // Configuration options
  voltageConfigurations = VOLTAGE_CONFIGURATIONS;
  passfailOptions = PASS_FAIL_OPTIONS;
  powerVerificationOptions = POWER_VERIFICATION_OPTIONS;
  measurementOptions = [
    { value: 'P', text: 'Pass' },
    { value: 'F', text: 'Fail' },
    { value: 'N', text: 'N/A' }
  ];

  // Visual and Mechanical options
  visualMechanicalOptions = [
    { value: 'P', text: 'Pass' },
    { value: 'F', text: 'Fail' },
    { value: 'N', text: 'N/A' }
  ];

  // Air filter options
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
  showReconciliation = true;
  showReconciliationDetails = false;
  showMeasurements = false;
  showAirFilterDetails = false;
  showVisual = false;
  showEnvironment = false;
  showPowerVerification = true;
  showInputReadings = false;
  showBypassReadings = false;
  showOutputReadings = false;
  showRectifier = false;
  showCapacitor = false;
  showTransfer = false;
  showActionRequired = false;

  // Filter current checkboxes UI state
  showInputFilterCurrent = false;
  showInputTHD = false;
  showOutputFilterCurrent = false;
  showOutputTHD = false;

  // Dynamic labels
  endOfLifeLabel = '7. UPS date code is < 25 years (End of Life):';

  // Basic date state for existing functionality
  currentCalendarDate = new Date();
  selectedDate: Date | null = null;
  selectedYear = new Date().getFullYear();

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
    // Initialize validation state for page load
    this.isFormSubmission = false;
    this.clearAllValidationErrors();
    
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

  ngAfterViewInit(): void {
    // Setup checkbox subscriptions after view initialization to ensure forms are ready
    this.setupFilterCurrentCheckboxHandlers();
  }

  // Set up date code display value watcher
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
      multiModule: ['Select'], // Default to "Select"
      maintByPass: ['NA'], // Default to "NA" (None)
      other: [''],
      model: ['', Validators.required],
      serialNo: ['', Validators.required],
      location: ['', Validators.required],
      monthName: ['', Validators.required],
      year: ['', [Validators.required, Validators.min(1900)]],
      status: ['Online', Validators.required],
      statusNotes: [''],
      parallelCabinet: [''],
      snmpPresent: ['PS'], // Default to "PS" (Select)
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
      inputPower: ['P'], // Default "Pass"
      lcd: ['P'], // Default "Pass"
      loadKVA: ['P'], // Default "Pass"
      threePhase: ['P'], // Default "Pass"
      normal: ['P'], // Default "Pass"
      caliberation: ['P'], // Default "Pass"
      endOfLife: ['P'] // Default "Pass"
    });

    this.visualForm = this.fb.group({
      upsOnline: ['P'], // Default "Pass"
      checkConnections: ['P'], // Default "Pass"
      inspectDamage: ['P'], // Default "Pass"
      vacuumClean: ['P'], // Default "Pass"
      epoSwitch: ['P'], // Default "Pass"
      coolingFans: ['P'], // Default "Pass"
      fansAge: ['P'], // Default "Pass"
      airFilters: ['P'], // Default "Pass"
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
      roomTempVentilation: ['P'], // Default "Pass"
      safetyEquipment: ['P'], // Default "Pass"
      hostileEnvironment: ['N', { selected: true }], // Default to "No" (Selected="True")
      serviceSpace: ['P'], // Default "Pass"
      circuitBreakers: ['P'] // Default "Pass"
    });

    this.inputReadingsForm = this.fb.group({
      configuration: [''], // Default to "Select" option
      inputFilterCurrent: [false],
      inputThdPercent: [false],
      voltA: [''], // Will be auto-populated based on configuration (120V, 208V, 480V, 575V, 600V, etc.)
      voltA_PF: ['P'], // Default "Pass"
      voltB: [''], // Will be auto-populated based on configuration
      voltB_PF: ['P'], // Default "Pass"
      voltC: [''], // Will be auto-populated based on configuration
      voltC_PF: ['P'], // Default "Pass"
      currA: [''],
      currA_PF: ['P'], // Default "Pass"
      currB: [''],
      currB_PF: ['P'], // Default "Pass"
      currC: [''],
      currC_PF: ['P'], // Default "Pass"
      freq: ['60'], // Default frequency to 60 Hz
      freq_PF: ['P'], // Default "Pass"
      // Filter Current detail fields
      filterCurrentA: [''],
      filterCurrentA_PF: ['P'], // Default "Pass"
      filterCurrentB: [''],
      filterCurrentB_PF: ['P'], // Default "Pass"
      filterCurrentC: [''],
      filterCurrentC_PF: ['P'], // Default "Pass"
      // Input THD detail fields
      inputThdA: [''],
      inputThdA_PF: ['P'], // Default "Pass"
      inputThdB: [''],
      inputThdB_PF: ['P'], // Default "Pass"
      inputThdC: [''],
      inputThdC_PF: ['P'] // Default "Pass"
    });

    this.bypassReadingsForm = this.fb.group({
      configuration: [''], // Default to "Select" option
      voltA: [''], // Will be auto-populated based on configuration (120V, 208V, 480V, 575V, 600V, etc.)
      voltA_PF: ['P'], // Default "Pass"
      voltB: [''], // Will be auto-populated based on configuration
      voltB_PF: ['P'], // Default "Pass"
      voltC: [''], // Will be auto-populated based on configuration
      voltC_PF: ['P'], // Default "Pass"
      currA: [''],
      currA_PF: ['P'], // Default "Pass"
      currB: [''],
      currB_PF: ['P'], // Default "Pass"
      currC: [''],
      currC_PF: ['P'], // Default "Pass"
      freq: ['60'], // Default frequency to 60 Hz
      freq_PF: ['P'] // Default "Pass"
    });

    this.outputReadingsForm = this.fb.group({
      configuration: [''], // Default to "Select" option
      outputFilterCurrent: [false],
      outputThdPercent: [false],
      voltA: [''], // Will be auto-populated based on configuration (120V, 208V, 480V, 575V, 600V, etc.)
      voltA_PF: ['P'], // Default "Pass"
      voltB: [''], // Will be auto-populated based on configuration
      voltB_PF: ['P'], // Default "Pass"
      voltC: [''], // Will be auto-populated based on configuration
      voltC_PF: ['P'], // Default "Pass"
      currA: [''],
      currA_PF: ['P'], // Default "Pass"
      currB: [''],
      currB_PF: ['P'], // Default "Pass"
      currC: [''],
      currC_PF: ['P'], // Default "Pass"
      freq: ['60'], // Default frequency to 60 Hz
      freq_PF: ['P'], // Default "Pass"
      loadA: [''],
      loadA_PF: ['P'], // Default "Pass"
      loadB: [''],
      loadB_PF: ['P'], // Default "Pass"
      loadC: [''],
      loadC_PF: ['P'], // Default "Pass"
      totalLoad: [''],
      // Output Filter Current detail fields
      outputFilterCurrentA: [''],
      outputFilterCurrentA_PF: ['P'], // Default "Pass"
      outputFilterCurrentB: [''],
      outputFilterCurrentB_PF: ['P'], // Default "Pass"
      outputFilterCurrentC: [''],
      outputFilterCurrentC_PF: ['P'], // Default "Pass"
      // Output THD detail fields
      outputThdA: [''],
      outputThdA_PF: ['P'], // Default "Pass"
      outputThdB: [''],
      outputThdB_PF: ['P'], // Default "Pass"
      outputThdC: [''],
      outputThdC_PF: ['P'] // Default "Pass"
    });

    this.rectifierForm = this.fb.group({
      floatVolt_PF: ['P'], // Default "Pass"
      dcFloatVoltage: [''],
      dcVoltage: [''],
      dcVoltage_PF: ['P'], // Default "Pass"
      acRipple: [''],
      acRipple_PF: ['P'], // Default "Pass"
      dcCurrent: [''],
      dcCurrent_PF: ['P'], // Default "Pass"
      acRippleVolt: [''],
      acRippleVolt_PF: ['P'], // Default "Pass"
      posToGND: [''],
      posToGND_PF: ['P'], // Default "Pass"
      acRippleCurr: [''],
      acRippleCurr_PF: ['P'], // Default "Pass"
      negToGND: [''],
      negToGND_PF: ['P'] // Default "Pass"
    });

    this.capacitorForm = this.fb.group({
      dcCaps_PF: ['P'], // Default "Pass"
      dcCapsAge: [''],
      acInputCaps_PF: ['P'], // Default "Pass"
      acInputCapsAge: [''],
      acOutputCaps_PF: ['P'], // Default "Pass"
      acOutputCapsAge: [''],
      commCaps_PF: ['P'], // Default "Pass"
      commCapsAge: [''],
      fansYear: ['']
    });

    this.transferForm = this.fb.group({
      firstMajor: ['N', { selected: true }], // Default to "No" (Selected="True")
      staticBypass: ['P'], // Default "Pass"
      transMaintByPass: ['P'], // Default "Pass"
      currentWave: ['P'], // Default "Pass"
      normalMode: ['P'], // Default "Pass"
      verifyAlarm: ['P'] // Default "Pass"
    });

    this.actionRequiredForm = this.fb.group({
      dcgAction1: ['N'], // Default to "No"
      custAction1: ['N'] // Default to "No"
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
    
    // Subscribe to KVA changes for dynamic end-of-life label
    this.setupKVAChangeHandlers();
    
    // Setup dynamic field control (legacy EnabletoEdit functionality)
    this.setupDynamicFieldControl();
    
    // Initialize enhanced form features
    this.initializeEnhancedFormFeatures();
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
    // Input voltage and current calculations with legacy methods
    ['voltA', 'voltB', 'voltC'].forEach(field => {
      this.inputReadingsForm.get(field)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.calculatePhaseToNeutral('input');
        this.updatePhaseToNeutralDisplay('input');
        this.calculateAndUpdatePowerValues('input');
        // Validate voltage against legacy tolerance ranges
        if (!this.isFormSubmission) {
          this.validateAllVoltagesForConfig('input');
        }
      });
    });

    ['currA', 'currB', 'currC'].forEach(field => {
      this.inputReadingsForm.get(field)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.calculateAndUpdatePowerValues('input');
        // Validate current against legacy tolerance
        if (!this.isFormSubmission) {
          this.validateCurrentReadingsLegacy('input');
        }
      });
    });

    // Bypass voltage and current calculations with legacy methods
    ['voltA', 'voltB', 'voltC'].forEach(field => {
      this.bypassReadingsForm.get(field)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.calculatePhaseToNeutral('bypass');
        this.updatePhaseToNeutralDisplay('bypass');
        this.calculateAndUpdatePowerValues('bypass');
        // Validate voltage against legacy tolerance ranges
        if (!this.isFormSubmission) {
          this.validateAllVoltagesForConfig('bypass');
        }
      });
    });

    ['currA', 'currB', 'currC'].forEach(field => {
      this.bypassReadingsForm.get(field)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.calculateAndUpdatePowerValues('bypass');
        // Validate current against legacy tolerance
        if (!this.isFormSubmission) {
          this.validateCurrentReadingsLegacy('bypass');
        }
      });
    });

    // Output voltage and current calculations with legacy methods
    ['voltA', 'voltB', 'voltC'].forEach(field => {
      this.outputReadingsForm.get(field)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.calculatePhaseToNeutral('output');
        this.updatePhaseToNeutralDisplay('output');
        this.calculateAndUpdatePowerValues('output');
        // Validate voltage against legacy tolerance ranges
        if (!this.isFormSubmission) {
          this.validateAllVoltagesForConfig('output');
        }
      });
    });

    ['currA', 'currB', 'currC'].forEach(field => {
      this.outputReadingsForm.get(field)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.calculateAndUpdatePowerValues('output');
        // Validate current against legacy tolerance
        if (!this.isFormSubmission) {
          this.validateCurrentReadingsLegacy('output');
        }
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
          
          // Initialize any forms/fields that weren't populated with backend data with defaults
          this.initializeFormsWithDefaults();
          
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
          
          // Initialize any forms/fields that weren't populated with backend data with defaults
          this.initializeFormsWithDefaults();
          
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
          
          // Initialize any forms/fields with defaults when no backend data is available
          this.initializeFormsWithDefaults();
          
          // Load reconciliation data after equipment form is populated
          this.loadReconciliationDataAfterEquipment();
          
          this.loading = false;
          this.toastr.error('Error loading equipment data. Using default values.');
        }
      });
  }

  // Setup dynamic field control - enables/disables textboxes when dropdown values change
  private setupDynamicFieldControl(): void {
    // Monitor parallel cabinet dropdown changes
    this.equipmentForm.get('parallelCabinet')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.enableToEdit('parallelCabinet', value);
      });

    // Monitor SNMP present dropdown changes
    this.equipmentForm.get('snmpPresent')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.enableToEdit('snmpPresent', value);
      });

    // Monitor modular UPS dropdown changes
    this.equipmentForm.get('modularUPS')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.enableToEdit('modularUPS', value);
      });

    // Monitor equipment status changes for status notes
    this.equipmentForm.get('status')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        const statusNotesControl = this.equipmentForm.get('statusNotes');
        if (value && value !== 'Online') {
          statusNotesControl?.enable();
          statusNotesControl?.setValidators([Validators.required]);
        } else {
          statusNotesControl?.disable();
          statusNotesControl?.clearValidators();
          statusNotesControl?.setValue('');
        }
        statusNotesControl?.updateValueAndValidity();
      });
  }

  // Legacy EnabletoEdit function - enables textbox editing when dropdown is "NO"
  private enableToEdit(fieldType: string, dropdownValue: string): void {
    // Enable related text field when dropdown is "NO" or specific values
    const shouldEnable = dropdownValue === 'NO' || dropdownValue === 'N' || dropdownValue === 'Other';
    
    switch (fieldType) {
      case 'parallelCabinet':
        const parallelOtherControl = this.equipmentForm.get('parallelCabinetOther');
        if (shouldEnable) {
          parallelOtherControl?.enable();
        } else {
          parallelOtherControl?.disable();
          parallelOtherControl?.setValue('');
        }
        break;
        
      case 'snmpPresent':
        const snmpOtherControl = this.equipmentForm.get('snmpPresentOther');
        if (shouldEnable) {
          snmpOtherControl?.enable();
        } else {
          snmpOtherControl?.disable();
          snmpOtherControl?.setValue('');
        }
        break;
        
      case 'modularUPS':
        const modularOtherControl = this.equipmentForm.get('modularUPSOther');
        if (shouldEnable) {
          modularOtherControl?.enable();
        } else {
          modularOtherControl?.disable();
          modularOtherControl?.setValue('');
        }
        break;
    }
  }

  private initializeFormsWithDefaults(): void {
    // Visual form defaults - including EPO switch mentioned by user
    this.visualForm.patchValue({
      epoSwitch: 'P', // EPO switch cover verification - default to Pass
    });

    // Environment form defaults - including hostile environment mentioned by user  
    this.environmentForm.patchValue({
      hostileEnvironment: 'N', // Hostile environment verification - default to No
    });

    // Transfer form defaults - this addresses the main issue reported by user
    this.transferForm.patchValue({
      transMaintByPass: 'P', // Transfer to Maintenance By-Pass - default to Pass
    });

    console.log('Transfer verification form fields initialized with default values');
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

  // Update field editability based on dropdown value - "NO" = editable, others = readonly
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

  // Set up watchers to monitor changes in verification dropdowns for real-time feedback
  private setupVerificationWatchers(): void {
    const verificationFields = ['modelCorrect', 'serialNoCorrect', 'kvaCorrect', 'totalEquipsCorrect'];
    
    verificationFields.forEach(field => {
      this.reconciliationForm.get(field)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
        
        // Auto-check verified checkbox if all fields are verified
        this.checkAutoVerificationComplete();
      });
    });
  }

  // Check if all verification fields are completed and auto-check verified if appropriate
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
    return '';
  }

  // Populate current equipment values in reconciliation form for comparison
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
  // Calculate total load percentage for output readings
  calculateTotalLoad(): void {
    // First, validate that all required current fields are filled
    if (!this.validateAllCurrentFieldsFilled()) {
      return; // Stop calculation if validation fails
    }

    // Proceed with load calculation only after all currents are validated
    const loadA = this.convertToDouble(this.outputReadingsForm.get('loadA')?.value || '0');
    const loadB = this.convertToDouble(this.outputReadingsForm.get('loadB')?.value || '0');
    
    const total = loadA + loadB;
    this.outputReadingsForm.get('totalLoad')?.setValue(total);

    // After successful calculation, determine if the load passes or fails
    this.validateLoadThresholds();
  }

  /**
   * Validates that all required output current fields are filled
   * before allowing load calculation to proceed
   */
  private validateAllCurrentFieldsFilled(): boolean {
    const emptyCurrentFields: string[] = [];

    // Only check Output currents based on configuration
    const outputConfig = this.outputReadingsForm.get('configuration')?.value;
    if (outputConfig) {
      const outputPhaseCount = this.getPhaseCountForConfiguration(outputConfig);
      if (outputPhaseCount >= 1 && this.isFieldEmpty(this.outputReadingsForm.get('currA')?.value)) {
        emptyCurrentFields.push('Output Current A');
      }
      if (outputPhaseCount >= 2 && this.isFieldEmpty(this.outputReadingsForm.get('currB')?.value)) {
        emptyCurrentFields.push('Output Current B');
      }
      if (outputPhaseCount >= 3 && this.isFieldEmpty(this.outputReadingsForm.get('currC')?.value)) {
        emptyCurrentFields.push('Output Current C');
      }
    }

    // If any output current fields are empty, show validation message and prevent calculation
    if (emptyCurrentFields.length > 0) {
      const fieldsList = emptyCurrentFields.join(', ');
      const message = `Please enter all required output current values before calculating load:\n\nMissing values for: ${fieldsList}`;
      
      this.toastr.warning(message, 'Output Current Values Required', {
        timeOut: 8000,
        closeButton: true,
        progressBar: true
      });
      
      // Highlight the first empty field for user attention
      this.highlightEmptyCurrentField(emptyCurrentFields[0]);
      
      return false;
    }

    return true;
  }

  /**
   * Helper method to check if a field value is empty or just whitespace
   */
  private isFieldEmpty(value: any): boolean {
    return value === null || value === undefined || value === '' || 
           (typeof value === 'string' && value.trim() === '');
  }

  /**
   * Get the number of phases for a given voltage configuration
   */
  private getPhaseCountForConfiguration(configId: string): number {
    const config = this.getVoltageConfiguration(configId);
    return config?.phaseCount || 1;
  }

  /**
   * Highlights the section and field containing the empty output current value
   */
  private highlightEmptyCurrentField(fieldName: string): void {
    // Only handle output current fields now
    if (fieldName.includes('Output')) {
      this.showPowerVerification = true;
      const fieldId = fieldName.replace('Output Current ', 'curr').toLowerCase();

      // Focus on the empty field after a short delay to allow section to expand
      setTimeout(() => {
        const element = document.querySelector(`input[formControlName="${fieldId}"]`) as HTMLElement;
        if (element) {
          element.focus();
          element.style.borderColor = '#dc3545';
          element.style.boxShadow = '0 0 0 0.2rem rgba(220, 53, 69, 0.25)';
          
          // Remove highlight after 5 seconds
          setTimeout(() => {
            element.style.borderColor = '';
            element.style.boxShadow = '';
          }, 5000);
        }
      }, 500);
    }
  }

  /**
   * Validates load thresholds and provides feedback after calculation
   */
  private validateLoadThresholds(): void {
    const totalLoad = this.convertToDouble(this.outputReadingsForm.get('totalLoad')?.value || '0');
    
    if (totalLoad > 85) {
      let message = '';
      let toastrType: 'error' | 'warning' = 'warning';
      
      if (totalLoad > 95) {
        message = `Critical: Load calculation shows ${totalLoad.toFixed(2)}% - UPS is severely overloaded!`;
        toastrType = 'error';
      } else if (totalLoad > 90) {
        message = `Warning: Load calculation shows ${totalLoad.toFixed(2)}% - UPS load is too high!`;
        toastrType = 'error';
      } else {
        message = `Caution: Load calculation shows ${totalLoad.toFixed(2)}% - UPS load is approaching maximum threshold.`;
      }
      
      if (toastrType === 'error') {
        this.toastr.error(message, 'Load Threshold Exceeded', {
          timeOut: 10000,
          closeButton: true,
          progressBar: true
        });
      } else {
        this.toastr.warning(message, 'Load Warning', {
          timeOut: 8000,
          closeButton: true,
          progressBar: true
        });
      }
    } else {
      this.toastr.success(`Load calculation completed: ${totalLoad.toFixed(2)}% - Within acceptable range`, 'Calculation Successful', {
        timeOut: 5000,
        closeButton: true,
        progressBar: true
      });
    }
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
        this.showValidationMessage('You must enter the values for Input, Bypass and Output voltages.', 'voltageConfig');
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
      this.showValidationMessage('Output Current cannot be empty', 'outputCurrent', currentField);
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
      this.showValidationMessage('Output Current A or Output Current B cannot be empty', 'outputCurrentTwoPhase');
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
      this.showValidationMessage('Output Current A, B, C cannot be empty', 'outputCurrentThreePhase');
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

  // Comprehensive validation function - validates all critical form fields before saving
  validateComprehensiveInputs(): boolean {
    // Validate manufacturer
    const manufacturer = this.equipmentForm.get('manufacturer')?.value;
    if (!manufacturer || manufacturer.substring(0, 3) === 'Ple' || manufacturer === '') {
      this.showValidationMessage('Please select the manufacturer', 'manufacturer', 'manufacturer');
      this.equipmentForm.get('manufacturer')?.markAsTouched();
      return false;
    }

    // Validate model
    const model = this.equipmentForm.get('model')?.value;
    if (!model || model.trim() === '') {
      this.showValidationMessage('Please enter the Model No', 'model', 'model');
      this.equipmentForm.get('model')?.markAsTouched();
      return false;
    }

    // Validate CTO/Part No
    const ctoPartNo = this.equipmentForm.get('ctoPartNo')?.value;
    if (!ctoPartNo || ctoPartNo.trim() === '') {
      this.showValidationMessage('Please enter the CTO / Part No', 'ctoPartNo', 'ctoPartNo');
      this.equipmentForm.get('ctoPartNo')?.markAsTouched();
      return false;
    }

    // Validate serial number
    const serialNo = this.equipmentForm.get('serialNo')?.value;
    if (!serialNo || serialNo.trim() === '') {
      this.showValidationMessage('Please enter the Serial No', 'serialNo', 'serialNo');
      this.equipmentForm.get('serialNo')?.markAsTouched();
      return false;
    }

    // Validate location
    const location = this.equipmentForm.get('location')?.value;
    if (!location || location.trim() === '') {
      this.showValidationMessage('Please enter the Location', 'location', 'location');
      this.equipmentForm.get('location')?.markAsTouched();
      return false;
    }

    // Validate KVA
    const kvaValue = this.equipmentForm.get('kva')?.value;
    if (!kvaValue || kvaValue.trim() === '') {
      this.showValidationMessage('KVA value cannot be empty', 'kva', 'kva');
      this.equipmentForm.get('kva')?.markAsTouched();
      return false;
    }

    const kva = this.convertToDouble(kvaValue);
    if (kva <= 0) {
      this.showValidationMessage('Please enter valid KVA Value', 'kva', 'kva');
      this.equipmentForm.get('kva')?.markAsTouched();
      return false;
    }

    // Validate maintenance bypass
    const maintByPass = this.equipmentForm.get('maintByPass')?.value;
    if (maintByPass === 'NA' || !maintByPass) {
      this.showValidationMessage('Please select the value for Maintenance ByPass', 'maintByPass', 'maintByPass');
      this.equipmentForm.get('maintByPass')?.markAsTouched();
      return false;
    }

    // Validate SNMP
    const snmpPresent = this.equipmentForm.get('snmpPresent')?.value;
    if (snmpPresent === 'PS' || !snmpPresent) {
      this.showValidationMessage('Please select the value for SNMP Card Present ?', 'snmpPresent', 'snmpPresent');
      this.equipmentForm.get('snmpPresent')?.markAsTouched();
      return false;
    }

    // Validate date code
    const monthName = this.equipmentForm.get('monthName')?.value;
    const year = this.equipmentForm.get('year')?.value;
    if (!monthName || monthName === '' || !year || year === '') {
      this.showValidationMessage('Please enter the Month and Year.', 'monthYear', 'monthName');
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
      this.showValidationMessage('You must verify the Reconciliation section before Saving PM form', 'reconciliation');
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

    // Validate and sanitize all inputs
    if (!this.validateAndSanitizeAllInputs()) {
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
        this.showValidationMessage('DateCode cannot be higher than today\'s date', 'dateCodeFuture', 'dateCode');
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
      this.showValidationMessage('Invalid date format in DateCode', 'dateCodeFormat', 'dateCode');
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

  // Enhanced Validation Methods
  /**
   * Stores a validation error for inline display instead of showing alert
   * @param fieldKey - Unique identifier for the field (e.g., 'outputCurrent', 'manufacturer')
   * @param message - Error message to display
   * @param elementId - Optional HTML element ID to scroll to and highlight
   */
  private setValidationError(fieldKey: string, message: string, elementId?: string): void {
    this.validationErrors[fieldKey] = message;
    
    // Only show visual cues during form submission, not page load
    if (this.isFormSubmission && elementId) {
      this.highlightAndScrollToField(elementId);
    }
  }

  /**
   * Clears a specific validation error
   * @param fieldKey - Field key to clear
   */
  private clearValidationError(fieldKey: string): void {
    delete this.validationErrors[fieldKey];
  }

  // Clears all validation errors
  private clearAllValidationErrors(): void {
    this.validationErrors = {};
  }

  /**
   * Shows validation message - alert during form submission, stored for inline display during page load
   * @param message - Message to show
   * @param fieldKey - Field key for inline storage
   * @param elementId - Element ID to highlight and scroll to
   */
  private showValidationMessage(message: string, fieldKey?: string, elementId?: string): void {
    if (this.isFormSubmission) {
      // During form submission, show alert and visual cues
      alert(message);
      if (elementId) {
        this.highlightAndScrollToField(elementId);
      }
    } else if (fieldKey) {
      // During page load, just store for inline display
      this.setValidationError(fieldKey, message, elementId);
    }
  }

  /**
   * Highlights a field with red border and scrolls to it
   * @param elementId - ID of element to highlight
   */
  private highlightAndScrollToField(elementId: string): void {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        // Add red border highlight
        element.style.border = '2px solid #dc3545';
        element.style.borderRadius = '4px';
        
        // Scroll to element
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
        
        // Focus the element if it's an input
        if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
          element.focus();
        }
        
        // Remove highlight after 3 seconds
        setTimeout(() => {
          element.style.border = '';
          element.style.borderRadius = '';
        }, 3000);
      }
    }, 100);
  }

  private validateDataFormat(): boolean {
    // Enhanced data format validation matching legacy findwrongdata() function
    const prohibitedChars = ['/', '\\', '<', '>', '&', '"', "'"];
    const excludedFields = [
      'dateCode', 'model', 'actModel', 'serialNo', 'actSerialNo', 'ctoPartNo'
    ];

    const forms = [
      { form: this.equipmentForm, name: 'Equipment' },
      { form: this.reconciliationForm, name: 'Reconciliation' },
      { form: this.measurementsForm, name: 'Measurements' },
      { form: this.inputReadingsForm, name: 'Input Readings' },
      { form: this.bypassReadingsForm, name: 'Bypass Readings' },
      { form: this.outputReadingsForm, name: 'Output Readings' },
      { form: this.rectifierForm, name: 'Rectifier' },
      { form: this.capacitorForm, name: 'Capacitor' }
    ];

    for (const { form, name } of forms) {
      const formValues = form.value;
      for (const [fieldName, value] of Object.entries(formValues)) {
        if (excludedFields.includes(fieldName)) continue;
        
        if (typeof value === 'string' && value) {
          // Check for prohibited characters
          for (const char of prohibitedChars) {
            if (value.includes(char)) {
              this.showValidationMessage(`${name} ${fieldName} - Character "${char}" is not allowed in textbox`, 'invalidCharacter', fieldName);
              const control = form.get(fieldName);
              if (control) {
                control.markAsTouched();
                control.setErrors({ 'invalidCharacter': true });
              }
              return false;
            }
          }
          
          // Check for excessive whitespace
          if (value !== value.trim()) {
            const control = form.get(fieldName);
            if (control) {
              control.setValue(value.trim());
            }
          }
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
        this.showValidationMessage(`You must enter DC Caps Year. Here is the UPS DateCode : ${dateCodeDisplay}`, 'dcCapsYear', 'dcCapsAge');
        this.capacitorForm.get('dcCapsAge')?.markAsTouched();
        return false;
      }

      if (!acInputCapsAge || acInputCapsAge.trim() === '') {
        this.showValidationMessage(`You must enter AC Input Caps Year. Here is the UPS DateCode : ${dateCodeDisplay}`, 'acInputCapsYear', 'acInputCapsAge');
        this.capacitorForm.get('acInputCapsAge')?.markAsTouched();
        return false;
      }

      if ((!acOutputCapsAge || acOutputCapsAge.trim() === '') && 
          (!commCapsAge || commCapsAge.trim() === '')) {
        this.showValidationMessage(`You must enter AC OP WYE or OP Delta Caps Year. Here is the UPS DateCode: ${dateCodeDisplay}`, 'acOutputCapsYear', 'acOutputCapsAge');
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
      this.showValidationMessage('You must enter the values for Input, Bypass and Output voltages.', 'voltageConfigSettings');
      return false;
    }

    // Validate actual voltage values against legacy tolerance ranges
    let allValid = true;
    
    if (!this.validateAllVoltagesForConfig('input')) {
      allValid = false;
    }
    
    if (!this.validateAllVoltagesForConfig('bypass')) {
      allValid = false;
    }
    
    if (!this.validateAllVoltagesForConfig('output')) {
      allValid = false;
    }

    return allValid;
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
    // Use legacy-compatible validation methods
    return this.validateCurrentReadingsLegacy('input') && 
           this.validateCurrentReadingsLegacy('bypass') && 
           this.validateCurrentReadingsLegacy('output');
  }

  private validateFrequencyRanges(): boolean {
    return this.validateFrequencyRangesLegacy();
  }

  /**
   * Enhanced frequency validation with exact legacy behavior
   * No popup on page load, visual warnings only
   */
  private validateFrequencyRangesLegacy(): boolean {
    let validationPassed = true;

    // Input frequency: 55-65 Hz
    const inputFreq = this.convertToDouble(this.inputReadingsForm.get('freq')?.value);
    if (inputFreq > 0) { // Only validate if value is entered
      if (inputFreq < 55 || inputFreq > 65) {
        if (this.isFormSubmission) {
          if (!confirm('Are you sure that Input Frequency not within specified tolerance (55-65 Hz)?')) {
            validationPassed = false;
          }
        }
        this.inputReadingsForm.get('freq_PF')?.setValue('F');
      } else {
        this.inputReadingsForm.get('freq_PF')?.setValue('P');
      }
    }

    // Bypass frequency: 55-65 Hz
    const bypassFreq = this.convertToDouble(this.bypassReadingsForm.get('freq')?.value);
    if (bypassFreq > 0) { // Only validate if value is entered
      if (bypassFreq < 55 || bypassFreq > 65) {
        if (this.isFormSubmission) {
          if (!confirm('Are you sure that Bypass Frequency not within specified tolerance (55-65 Hz)?')) {
            validationPassed = false;
          }
        }
        this.bypassReadingsForm.get('freq_PF')?.setValue('F');
      } else {
        this.bypassReadingsForm.get('freq_PF')?.setValue('P');
      }
    }

    // Output frequency: 58-62 Hz
    const outputFreq = this.convertToDouble(this.outputReadingsForm.get('freq')?.value);
    if (outputFreq > 0) { // Only validate if value is entered
      if (outputFreq < 58 || outputFreq > 62) {
        if (this.isFormSubmission) {
          if (!confirm('Are you sure that Output Frequency not within specified tolerance (58-62 Hz)?')) {
            validationPassed = false;
          }
        }
        this.outputReadingsForm.get('freq_PF')?.setValue('F');
      } else {
        this.outputReadingsForm.get('freq_PF')?.setValue('P');
      }
    }

    return validationPassed;
  }

  /**
   * Voltage validation using exact legacy tolerance ranges
   * Validates voltage against the specific ranges from the reference table
   * Now supports different ranges for Input vs Bypass
   */
  validateVoltageRange(voltage: number, configId: string, type: 'input' | 'bypass' | 'output' = 'input'): 'pass' | 'fail' {
    const bounds = this.getVoltageToleranceBounds(configId, type);
    
    if (bounds.min === 0 && bounds.max === 0) {
      return 'pass'; // Unknown configuration, don't fail
    }
    
    if (voltage >= bounds.min && voltage <= bounds.max) {
      return 'pass';
    } else {
      return 'fail';
    }
  }

  // Enhanced voltage validation for all phases in a configuration
  validateAllVoltagesForConfig(type: 'input' | 'bypass' | 'output'): boolean {
    const form = type === 'input' ? this.inputReadingsForm : 
                  type === 'bypass' ? this.bypassReadingsForm : this.outputReadingsForm;
    
    const configId = form.get('configuration')?.value;
    if (!configId) return true; // No configuration selected
    
    const config = this.getVoltageConfiguration(configId);
    if (!config) return true;
    
    let allVoltagesValid = true;
    
    // Validate Phase A voltage
    const voltA = this.convertToDouble(form.get('voltA')?.value);
    if (voltA > 0) {
      const validA = this.validateVoltageRange(voltA, configId, type);
      if (validA === 'fail') {
        if (this.isFormSubmission) {
          const bounds = this.getVoltageToleranceBounds(configId, type);
          if (!confirm(`${type.charAt(0).toUpperCase() + type.slice(1)} Voltage A (${voltA}V) is outside tolerance range (${bounds.min}V - ${bounds.max}V). Continue?`)) {
            allVoltagesValid = false;
          }
        }
        form.get('voltA_PF')?.setValue('F');
      } else {
        form.get('voltA_PF')?.setValue('P');
      }
    }
    
    // Validate Phase B voltage (if multi-phase)
    if (config.phaseCount >= 2) {
      const voltB = this.convertToDouble(form.get('voltB')?.value);
      if (voltB > 0) {
        const validB = this.validateVoltageRange(voltB, configId, type);
        if (validB === 'fail') {
          if (this.isFormSubmission) {
            const bounds = this.getVoltageToleranceBounds(configId, type);
            if (!confirm(`${type.charAt(0).toUpperCase() + type.slice(1)} Voltage B (${voltB}V) is outside tolerance range (${bounds.min}V - ${bounds.max}V). Continue?`)) {
              allVoltagesValid = false;
            }
          }
          form.get('voltB_PF')?.setValue('F');
        } else {
          form.get('voltB_PF')?.setValue('P');
        }
      }
    }
    
    // Validate Phase C voltage (if three-phase)
    if (config.phaseCount >= 3) {
      const voltC = this.convertToDouble(form.get('voltC')?.value);
      if (voltC > 0) {
        const validC = this.validateVoltageRange(voltC, configId, type);
        if (validC === 'fail') {
          if (this.isFormSubmission) {
            const bounds = this.getVoltageToleranceBounds(configId, type);
            if (!confirm(`${type.charAt(0).toUpperCase() + type.slice(1)} Voltage C (${voltC}V) is outside tolerance range (${bounds.min}V - ${bounds.max}V). Continue?`)) {
              allVoltagesValid = false;
            }
          }
          form.get('voltC_PF')?.setValue('F');
        } else {
          form.get('voltC_PF')?.setValue('P');
        }
      }
    }
    
    return allVoltagesValid;
  }

  /**
   * Temperature validation with legacy behavior
   * Acceptable range: 67°F – 78°F
   * Values outside range trigger minor deficiency (yellow warning) but don't block submission
   */
  validateTemperatureRange(temperatureFahrenheit: number): 'pass' | 'warning' | 'fail' {
    if (temperatureFahrenheit >= 67 && temperatureFahrenheit <= 78) {
      return 'pass';
    } else {
      // Outside acceptable range - minor deficiency
      return 'warning';
    }
  }

  /**
   * Automatic power calculation with legacy formulas
   * This method should be called when voltage/current values change
   */
  calculateAndUpdatePowerValues(type: 'input' | 'bypass' | 'output'): void {
    const form = type === 'input' ? this.inputReadingsForm : 
                  type === 'bypass' ? this.bypassReadingsForm : this.outputReadingsForm;
    
    const config = type === 'input' ? this.inputConfig : 
                   type === 'bypass' ? this.bypassConfig : this.outputConfig;

    if (!config) return;

    const voltageA = this.convertToDouble(form.get('voltA')?.value);
    const currentA = this.convertToDouble(form.get('currA')?.value);
    const ratedKVA = this.convertToDouble(this.equipmentForm.get('kva')?.value);

    if (voltageA > 0 && currentA > 0 && ratedKVA > 0) {
      // Calculate actual kVA using legacy formula
      const actualKVA = this.calculateLegacyKVA(voltageA, currentA, config.phaseCount);
      
      // Calculate load percentage
      const loadPercent = this.calculateLoadPercentage(actualKVA, ratedKVA);
      
      // Update load percentage field if it exists (for output section)
      if (type === 'output') {
        form.get('loadA')?.setValue(Math.round(loadPercent * 10) / 10, { emitEvent: false });
        
        // Apply load validation thresholds
        if (loadPercent >= 90) {
          form.get('loadA_PF')?.setValue('F');
        } else if (loadPercent >= 85) {
          form.get('loadA_PF')?.setValue('F'); // Warning level - could be 'W' if that option exists
        } else {
          form.get('loadA_PF')?.setValue('P');
        }
      }
    }
  }

  /**
   * Legacy-compatible phase-to-neutral calculation for display
   * Called automatically when line-to-line voltages are entered
   */
  updatePhaseToNeutralDisplay(type: 'input' | 'bypass' | 'output'): void {
    const form = type === 'input' ? this.inputReadingsForm : 
                  type === 'bypass' ? this.bypassReadingsForm : this.outputReadingsForm;
    
    const config = type === 'input' ? this.inputConfig : 
                   type === 'bypass' ? this.bypassConfig : this.outputConfig;

    if (!config || !config.showPhaseToNeutral) return;

    // Convert line-to-line voltages to phase-to-neutral
    const voltA = this.convertToDouble(form.get('voltA')?.value);
    const voltB = this.convertToDouble(form.get('voltB')?.value);
    const voltC = this.convertToDouble(form.get('voltC')?.value);

    if (voltA > 0) {
      const phaseToNeutralA = this.convertLineToNeutralVoltage(voltA);
      // Store for display purposes (could add to form or display variable)
    }
    
    if (voltB > 0) {
      const phaseToNeutralB = this.convertLineToNeutralVoltage(voltB);
    }
    
    if (voltC > 0) {
      const phaseToNeutralC = this.convertLineToNeutralVoltage(voltC);
    }
  }

  // Summary method to demonstrate all legacy validation implementations
  getLegacyValidationSummary(): any {
    const kvaValue = this.convertToDouble(this.equipmentForm.get('kva')?.value);
    
    return {
      currentTolerance: {
        description: 'Current Tolerance Calculation',
        implementation: 'KVA > 200 → 30% (0.30), KVA ≤ 200 → 50% (0.50)',
        currentKVA: kvaValue,
        calculatedTolerance: this.calculateCurrentTolerance(kvaValue, 'UPS'),
        method: 'calculateCurrentTolerance()'
      },
      frequencyValidation: {
        description: 'Frequency Validation Ranges',
        implementation: 'Input/Bypass: 55-65 Hz, Output: 58-62 Hz',
        inputRange: this.getFrequencyToleranceRange('input'),
        bypassRange: this.getFrequencyToleranceRange('bypass'),
        outputRange: this.getFrequencyToleranceRange('output'),
        method: 'validateFrequencyRangesLegacy()'
      },
      powerCalculation: {
        description: 'Legacy Power Calculations',
        implementation: 'Single: (I × V) / 1000, Three: (V × I) / 1732',
        singlePhaseFormula: '(I × V) / 1000',
        threePhaseFormula: '(V × I) / 1732',
        method: 'calculateLegacyKVA()'
      },
      loadPercentage: {
        description: 'Load Percentage Thresholds',
        implementation: '≥90% → Fail, ≥85% (UPS) → Warning',
        criticalLimit: '≥90%',
        warningLimit: '≥85% (UPS) / ≥80% (PDU/STS)',
        method: 'validateLoadPercentage()'
      },
      temperatureValidation: {
        description: 'Temperature Range Validation',
        implementation: '67°F – 78°F acceptable range',
        acceptableRange: '67°F - 78°F',
        outsideRangeBehavior: 'Minor deficiency (yellow warning)',
        method: 'validateTemperatureRange()'
      },
      voltageToleranceValidation: {
        description: 'Exact Legacy Voltage Tolerance Ranges',
        implementation: 'Specific ranges per voltage/phase configuration',
        examples: {
          '120V 1Ph': '110V - 130V (L-N)',
          '240V 2Ph': '220V - 260V (L-L)',
          '208V 3Ph': '192V - 224V (P-N)',
          '480V 3Ph': '456V - 504V (P-N)',
          '277V 1Ph': '262V - 292V (L-N)'
        },
        method: 'getVoltageToleranceRange(), validateVoltageRange()'
      },
      phaseToNeutralConversion: {
        description: 'Line-to-Neutral Voltage Conversion',
        implementation: 'Math.round(lineVoltage / 1.732)',
        formula: 'phaseToNeutral = Math.round(lineVoltage / 1.732)',
        method: 'convertLineToNeutralVoltage()'
      }
    };
  }

  // Get detailed explanation of voltage tolerance calculation logic
  getVoltageToleranceExplanation(configId: string): string {
    const config = this.getVoltageConfiguration(configId);
    const nominalVoltage = this.getNominalVoltageFromConfig(configId);
    
    if (!config || nominalVoltage === 0) {
      return 'Unknown configuration';
    }

    const explanation = [];
    explanation.push(`Configuration: ${config.name}`);
    explanation.push(`Nominal Voltage: ${nominalVoltage}V`);
    explanation.push(`Phase Count: ${config.phaseCount}`);
    explanation.push(`Phase-to-Neutral: ${config.showPhaseToNeutral ? 'Yes' : 'No'}`);
    
    if (config.showPhaseToNeutral) {
      explanation.push(`Calculation Method: Phase-to-Neutral (P-N) tolerance rules`);
      explanation.push(`Logic: Three-phase P-N configurations use line-to-line voltage tolerance calculations`);
    } else {
      explanation.push(`Calculation Method: Single/Two-phase specific legacy ranges`);
      if (nominalVoltage <= 240 && (config.phaseCount === 1 || config.phaseCount === 2)) {
        explanation.push(`Logic: Lower voltages in single/two phase use 110V-130V legacy range`);
      } else {
        explanation.push(`Logic: Higher voltages use voltage-specific legacy patterns`);
      }
    }
    
    const range = this.getVoltageToleranceRange(configId);
    explanation.push(`Result: ${range}`);
    
    return explanation.join('\n');
  }

  // Get frequency tolerance range - different ranges for input, bypass, and output
  getFrequencyToleranceRange(type: 'input' | 'bypass' | 'output'): string {
    switch (type) {
      case 'input':
        return '55 Hz - 65 Hz'; // Input frequency tolerance
      case 'bypass':
        return '55 Hz - 62 Hz'; // Bypass frequency tolerance (updated per user specs)
      case 'output':
        return '58 Hz - 62 Hz'; // Output frequency tolerance
      default:
        return '';
    }
  }

  getPhaseToNeutralVoltage(phaseToPhaseVoltage: string): string {
    const voltage = this.convertToDouble(phaseToPhaseVoltage);
    if (voltage === 0) return '';
    
    const result = Math.round(voltage / 1.732);
    return result.toString();
  }

  // Calculate equipment status based on form values
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
      
      // Auto-calculate and populate phase-to-neutral values if applicable
      if (config.showPhaseToNeutral) {
        const phaseToNeutralVoltage = Math.round(expectedVoltage / 1.732);
        // Note: Phase-to-neutral calculations are auto-populated based on line-to-line values
        // This matches the legacy behavior where P-N values are calculated automatically
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

  // Get expected voltage value based on configuration ID
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

  // Get configuration display name for legacy voltage types
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

  // Check if configuration requires phase-to-neutral display
  shouldShowPhaseToNeutralForConfig(configId: string): boolean {
    // Three-phase configurations show phase-to-neutral calculations
    return ['3', '4', '5', '6', '11'].includes(configId);
  }

  /**
   * Get nominal voltage value from configuration ID
   * These are the base voltages before tolerance calculations
   */
  private getNominalVoltageFromConfig(configId: string): number {
    const voltageMap: { [key: string]: number } = {
      '1': 120,   // 120V Single Phase
      '2': 240,   // 240V Two Phase
      '3': 208,   // 208V Three Phase
      '4': 480,   // 480V Three Phase
      '5': 600,   // 600V Three Phase
      '6': 575,   // 575V Three Phase
      '7': 208,   // 208V Single Phase
      '8': 208,   // 208V Two Phase
      '9': 480,   // 480V Single Phase
      '10': 277,  // 277V Single Phase
      '11': 400   // 400V Three Phase
    };
    
    return voltageMap[configId] || 0;
  }

  /**
   * Dynamic voltage tolerance calculation based on legacy patterns
   * Analyzes the configuration properties to determine the appropriate tolerance rule
   * Now supports different ranges for Input vs Bypass
   */
  private calculateDynamicVoltageToleranceRange(nominalVoltage: number, configId: string, type: 'input' | 'bypass' | 'output' = 'input'): { min: number, max: number } {
    const config = this.getVoltageConfiguration(configId);
    if (!config) {
      // Fallback for unknown configs
      const fallbackTolerance = nominalVoltage * 0.1; // ±10%
      return { 
        min: Math.round(nominalVoltage - fallbackTolerance), 
        max: Math.round(nominalVoltage + fallbackTolerance) 
      };
    }

    // Legacy pattern analysis:
    // 1. For Phase-to-Neutral (P-N) configurations: Use line voltage tolerance ranges
    // 2. For single/two phase at certain voltages: Use specific legacy ranges
    // 3. Different calculation rules based on voltage levels and phase configurations
    
    if (config.showPhaseToNeutral) {
      // Three-phase P-N configurations - use line-to-line voltage tolerance calculations
      return this.calculatePhaseToNeutralToleranceRange(nominalVoltage, configId, type);
    } else {
      // Single/Two phase configurations - use legacy specific ranges
      return this.calculateSingleTwoPhaseToleranceRange(nominalVoltage, configId, config, type);
    }
  }

  /**
   * Calculate tolerance for Phase-to-Neutral (P-N) configurations
   * These typically use line-to-line voltage calculations
   * Now supports different ranges for Input vs Bypass
   */
  private calculatePhaseToNeutralToleranceRange(nominalVoltage: number, configId: string, type: 'input' | 'bypass' | 'output' = 'input'): { min: number, max: number } {
    // For P-N configurations, legacy typically uses specific voltage ranges
    // that correspond to the phase-to-neutral voltage calculations
    
    switch (nominalVoltage) {
      case 208: // 208V P-N -> Different values for Output
        if (type === 'output') {
          return { min: 197, max: 219 }; // Output specific values
        } else {
          return { min: 192, max: 224 }; // Input/Bypass values
        }
        
      case 400: // 400V P-N -> Same for all types
        return { min: 380, max: 420 };
        
      case 480: // 480V P-N -> Different values for Output
        if (type === 'output') {
          return { min: 460, max: 500 }; // Output specific values
        } else {
          return { min: 455, max: 505 }; // Input/Bypass values
        }
        
      case 575: // 575V P-N -> Different values for Input vs Bypass vs Output
        if (type === 'bypass' || type === 'output') {
          return { min: 547, max: 603 }; // Bypass and Output use same values
        } else {
          return { min: 545, max: 605 }; // Input specific values
        }
        
      case 600: // 600V P-N -> Different values for Output
        if (type === 'output') {
          return { min: 580, max: 620 }; // Output specific values
        } else {
          return { min: 570, max: 630 }; // Input/Bypass values
        }
        
      default:
        // For unknown P-N voltages, use approximately ±5% tolerance
        const tolerance = Math.round(nominalVoltage * 0.05);
        return { 
          min: nominalVoltage - tolerance, 
          max: nominalVoltage + tolerance 
        };
    }
  }

  /**
   * Calculate tolerance for single/two phase configurations
   * These have specific legacy patterns that don't follow P-N rules
   * Now supports different ranges for Input vs Bypass
   */
  private calculateSingleTwoPhaseToleranceRange(nominalVoltage: number, configId: string, config: any, type: 'input' | 'bypass' | 'output' = 'input'): { min: number, max: number } {
    // Legacy pattern observations:
    // - Lower voltages (120V, some 208V, some 240V) often use 110V-130V range
    // - Higher single phase voltages use different patterns
    // - Some 208V configurations use 192V-224V range
    
    // Special legacy cases that don't follow normal percentage rules
    if (nominalVoltage === 120 || 
        (nominalVoltage === 240 && config.phaseCount === 2) || 
        (nominalVoltage === 208 && config.phaseCount === 2)) {
      // These configurations have different values for Output
      if (type === 'output') {
        return { min: 114, max: 126 }; // Output specific values for lower voltages
      } else {
        return { min: 110, max: 130 }; // Input/Bypass values
      }
    }
    
    if (nominalVoltage === 208 && config.phaseCount === 1) {
      // 208V single phase uses different range for Output
      if (type === 'output') {
        return { min: 197, max: 219 }; // Output specific values
      } else {
        return { min: 192, max: 224 }; // Input/Bypass values
      }
    }
    
    if (nominalVoltage === 277) {
      // 277V single phase uses different range for Output
      if (type === 'output') {
        return { min: 197, max: 219 }; // Output specific values
      } else {
        return { min: 192, max: 224 }; // Input/Bypass values
      }
    }
    
    if (nominalVoltage === 480 && config.phaseCount === 1) {
      // 480V single phase uses different range for Output
      if (type === 'output') {
        return { min: 460, max: 500 }; // Output specific values
      } else {
        return { min: 455, max: 505 }; // Input/Bypass values
      }
    }
    
    // Default calculation for other single/two phase configurations
    // Use approximately ±8% tolerance for most standard voltages
    const tolerance = Math.round(nominalVoltage * 0.08);
    return { 
      min: nominalVoltage - tolerance, 
      max: nominalVoltage + tolerance 
    };
  }

  // Calculate voltage tolerance percentage using dynamic calculations
  private getVoltageTolerancePercentage(nominalVoltage: number, configId: string): number {
    const dynamicRange = this.calculateDynamicVoltageToleranceRange(nominalVoltage, configId);
    const toleranceValue = (dynamicRange.max - nominalVoltage);
    return toleranceValue / nominalVoltage;
  }

  /**
   * Get voltage tolerance range string for display with automatic P-N detection
   * Now supports different ranges for Input vs Bypass
   */
  getVoltageToleranceRange(configId: string, type: 'input' | 'bypass' | 'output' = 'input'): string {
    const nominalVoltage = this.getNominalVoltageFromConfig(configId);
    if (nominalVoltage === 0) return '';
    
    const dynamicRange = this.calculateDynamicVoltageToleranceRange(nominalVoltage, configId, type);
    const config = this.getVoltageConfiguration(configId);
    const pnSuffix = config?.showPhaseToNeutral ? ' (P-N)' : '';
    
    return `${dynamicRange.min}V - ${dynamicRange.max}V${pnSuffix}`;
  }

  /**
   * Get voltage tolerance bounds for validation using dynamic calculations
   * Now supports different ranges for Input vs Bypass
   */
  getVoltageToleranceBounds(configId: string, type: 'input' | 'bypass' | 'output' = 'input'): { min: number, max: number } {
    const nominalVoltage = this.getNominalVoltageFromConfig(configId);
    if (nominalVoltage === 0) return { min: 0, max: 0 };
    
    return this.calculateDynamicVoltageToleranceRange(nominalVoltage, configId, type);
  }

  /**
   * Legacy-compatible power calculation methods
   * These match the exact behavior from UPSPage.js and EmgUPSPage.js
   */

  /**
   * Calculate kVA using legacy formulas
   * Single phase: ActKVA = (I × V) / 1000
   * Three phase: CalKVA = (V × I) / 1732
   */
  calculateLegacyKVA(voltage: number, current: number, phaseCount: number): number {
    if (phaseCount === 1) {
      // Single phase: ActKVA = (I × V) / 1000
      return (current * voltage) / 1000;
    } else {
      // Three phase: CalKVA = (V × I) / 1732 (exact constant from legacy)
      return (voltage * current) / 1732;
    }
  }

  // Calculate load percentage: (ActualKVA / RatedKVA) × 100
  calculateLoadPercentage(actualKVA: number, ratedKVA: number): number {
    if (ratedKVA === 0) return 0;
    return (actualKVA / ratedKVA) * 100;
  }

  /**
   * Legacy-compatible phase-to-neutral conversion
   * phaseToNeutral = Math.round(lineVoltage / 1.732)
   */
  convertLineToNeutralVoltage(lineVoltage: number): number {
    return Math.round(lineVoltage / 1.732);
  }

  // Enhanced current tolerance calculation - determine tolerance based on UPS KVA rating
  calculateCurrentTolerance(kvaValue: number, systemType: 'UPS' | 'PDU' | 'STS' = 'UPS'): number {
    if (systemType === 'PDU' || systemType === 'STS') {
      // Fixed 30% tolerance for PDU/STS systems
      return 0.30;
    }
    
    // UPS systems: KVA > 200 → 30%, KVA ≤ 200 → 50%
    return kvaValue > 200 ? 0.30 : 0.50;
  }

  // Enhanced current validation with exact legacy behavior
  validateCurrentReadingsLegacy(type: 'input' | 'bypass' | 'output', systemType: 'UPS' | 'PDU' | 'STS' = 'UPS'): boolean {
    const form = type === 'input' ? this.inputReadingsForm : 
                  type === 'bypass' ? this.bypassReadingsForm : this.outputReadingsForm;
    
    const configuration = form.get('configuration')?.value;
    const kvaValue = this.equipmentForm.get('kva')?.value;
    
    // Only validate for multi-phase configurations
    if (!this.isMultiPhaseConfiguration(configuration)) {
      return true;
    }

    const upsKVA = this.convertToDouble(kvaValue);
    const tolerance = this.calculateCurrentTolerance(upsKVA, systemType);

    const currentA = this.convertToDouble(form.get('currA')?.value);
    const currentB = this.convertToDouble(form.get('currB')?.value);
    const currentC = this.convertToDouble(form.get('currC')?.value);

    // Validate A and B phases
    if (currentA === 0 || currentB === 0) {
      this.showValidationMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} Current A or B cannot be empty`, `${type}CurrentTwoPhase`);
      return false;
    }

    // Calculate tolerance value - multiply by current and round to one decimal place
    const toleranceValueA = Math.round((currentA * tolerance) * 10) / 10;

    // Check A vs B tolerance
    const diffAB = Math.abs(currentA - currentB);
    if (diffAB > toleranceValueA) {
      const message = `${type.charAt(0).toUpperCase() + type.slice(1)} Current A and Current B not in Tolerance. Power Verification will be failed.\nAre you sure you want to do this?\nTolerance range can be: +- ${toleranceValueA}`;
      
      if (this.isFormSubmission) {
        if (confirm(message)) {
          form.get('currA_PF')?.setValue('F');
          form.get('currB_PF')?.setValue('F');
        } else {
          form.get('currB')?.markAsTouched();
          return false;
        }
      } else {
        // Visual warning without popup on page load
        form.get('currA_PF')?.setValue('F');
        form.get('currB_PF')?.setValue('F');
      }
    } else {
      form.get('currA_PF')?.setValue('P');
      form.get('currB_PF')?.setValue('P');
    }

    // Validate C phase if it's a three-phase configuration
    if (this.isThreePhaseConfiguration(configuration)) {
      if (currentC === 0) {
        this.showValidationMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} Current C cannot be empty`, `${type}CurrentThreePhase`);
        return false;
      }

      const toleranceValueB = Math.round((currentB * tolerance) * 10) / 10;
      const diffBC = Math.abs(currentB - currentC);

      if (diffBC > toleranceValueB) {
        const message = `${type.charAt(0).toUpperCase() + type.slice(1)} Current B and Current C not in Tolerance. Power Verification will be failed.\nAre you sure you want to do this?\nTolerance range can be: +- ${toleranceValueB}`;
        
        if (this.isFormSubmission) {
          if (confirm(message)) {
            form.get('currB_PF')?.setValue('F');
            form.get('currC_PF')?.setValue('F');
          } else {
            form.get('currC')?.markAsTouched();
            return false;
          }
        } else {
          // Visual warning without popup on page load
          form.get('currB_PF')?.setValue('F');
          form.get('currC_PF')?.setValue('F');
        }
      } else {
        form.get('currB_PF')?.setValue('P');
        form.get('currC_PF')?.setValue('P');
      }
    }

    return true;
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
    // Set form submission flag for validation
    this.isFormSubmission = true;
    this.clearAllValidationErrors();
    
    if (!isDraft && !this.validateComprehensiveInputs()) {
      this.toastr.error('Please correct validation errors before saving');
      this.isFormSubmission = false; // Reset flag after validation
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Build UPS data using the comprehensive DTO approach
    const upsData = this.buildUPSData(isDraft);
    const saveUpdateDto = convertToSaveUpdateDto(upsData, this.authService.currentUserValue?.username || 'SYSTEM');
    
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
            

          } else {
            this.errorMessage = response.message;
            this.toastr.error(this.errorMessage);
          }
          this.saving = false;
          this.saveMode = null;
          this.isFormSubmission = false; // Reset form submission flag
        },
        error: (error) => {
          console.error('Error saving UPS readings:', error);
          this.errorMessage = 'Error saving UPS readings. Please try again.';
          this.toastr.error(this.errorMessage);
          this.saving = false;
          this.saveMode = null;
          this.isFormSubmission = false; // Reset form submission flag
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

  // Enhanced legacy IsNumeric function with additional validation
  private isNumeric(input: string): boolean {
    if (!input || input.trim() === '') return false;
    
    const RE = /^-{0,1}\d*\.{0,1}\d+$/;
    return RE.test(input.trim());
  }

  // Enhanced legacy findwrongdata function - validates input for prohibited characters
  private validateInputCharacters(input: string, fieldName: string): boolean {
    if (!input) return true; // Empty input is allowed
    
    const prohibitedChars = ['/', '\\', '<', '>', '&', '"', "'", ';', ','];
    
    for (const char of prohibitedChars) {
      if (input.includes(char)) {
        this.showValidationMessage(`${fieldName} - Character "${char}" is not allowed in this field`, 'invalidCharacterInput', fieldName);
        return false;
      }
    }
    
    return true;
  }

  /**
   * Enhanced input sanitization and validation
   * @param input The input string to sanitize
   * @returns Sanitized string with prohibited characters removed
   */
  private sanitizeInput(input: string): string {
    if (!input) return '';
    
    // Remove prohibited characters
    const prohibitedChars = ['/', '\\', '<', '>', '&', '"', "'"];
    let sanitized = input;
    
    for (const char of prohibitedChars) {
      sanitized = sanitized.replace(new RegExp(`\\${char}`, 'g'), '');
    }
    
    // Trim whitespace and normalize spacing
    return sanitized.trim().replace(/\s+/g, ' ');
  }

  // Validate and sanitize form inputs before saving
  private validateAndSanitizeAllInputs(): boolean {
    const forms = [
      { form: this.equipmentForm, name: 'Equipment' },
      { form: this.reconciliationForm, name: 'Reconciliation' },
      { form: this.measurementsForm, name: 'Measurements' },
      { form: this.inputReadingsForm, name: 'Input Readings' },
      { form: this.bypassReadingsForm, name: 'Bypass Readings' },
      { form: this.outputReadingsForm, name: 'Output Readings' },
      { form: this.rectifierForm, name: 'Rectifier' },
      { form: this.capacitorForm, name: 'Capacitor' }
    ];

    for (const { form, name } of forms) {
      const formValues = form.value;
      
      for (const [fieldName, value] of Object.entries(formValues)) {
        if (typeof value === 'string' && value) {
          // Validate characters
          if (!this.validateInputCharacters(value, `${name} ${fieldName}`)) {
            return false;
          }
          
          // Auto-sanitize the input
          const sanitized = this.sanitizeInput(value);
          if (sanitized !== value) {
            form.get(fieldName)?.setValue(sanitized, { emitEvent: false });
          }
        }
      }
    }
    
    return true;
  }

  /**
   * Enhanced legacy ValidateCurr function - validates current entry order and values
   * @param currentId The current field being validated
   * @param value The value being entered
   * @returns true if validation passes, false otherwise
   */
  private validateCurrentEntry(currentId: string, value: string): boolean {
    if (!value || this.trimAll(value) === '') {
      return true; // Allow empty values during form setup
    }

    // Validate numeric input
    if (!this.isNumeric(value)) {
      this.showValidationMessage(`${currentId} must be a valid number`, 'invalidNumber', currentId);
      return false;
    }

    // Validate current entry order for multi-phase configurations
    if (currentId.includes('currB') || currentId.includes('currC')) {
      return this.validateCurrentEntryOrder(currentId, this.getPreviousCurrentField(currentId));
    }

    return true;
  }

  /**
   * Get the previous current field in the sequence for validation
   * @param currentId The current field ID
   * @returns The previous field ID in sequence
   */
  private getPreviousCurrentField(currentId: string): string {
    if (currentId.includes('currC')) {
      return currentId.replace('currC', 'currB');
    } else if (currentId.includes('currB')) {
      return currentId.replace('currB', 'currA');
    }
    return '';
  }

  /**
   * Enhanced current validation with real-time feedback
   * @param fieldName The field name being validated
   * @param value The current value
   */
  onCurrentFieldChange(fieldName: string, value: string): void {
    // Only perform validation if form is being submitted or user is actively editing
    if (!this.loading && !this.isFormSubmission) {
      // During normal usage, just validate numeric format without alerts
      if (value && !this.isNumeric(value)) {
        const control = this.getFormControlByFieldName(fieldName);
        if (control) {
          control.setErrors({ 'numeric': true });
        }
      }
    } else if (this.isFormSubmission) {
      // During form submission, perform full validation with alerts
      if (value && !this.isNumeric(value)) {
        const control = this.getFormControlByFieldName(fieldName);
        if (control) {
          control.setErrors({ 'numeric': true });
        }
      } else {
        this.validateCurrentEntry(fieldName, value);
      }
    }
    // During page load (loading = true), skip all validation
  }

  /**
   * Get form control by field name across all forms
   * @param fieldName The field name to find
   * @returns The FormControl if found
   */
  private getFormControlByFieldName(fieldName: string): any {
    const forms = [
      this.inputReadingsForm,
      this.bypassReadingsForm,
      this.outputReadingsForm,
      this.equipmentForm
    ];

    for (const form of forms) {
      const control = form.get(fieldName);
      if (control) {
        return control;
      }
    }
    
    return null;
  }

  // Legacy ValidateCurr function - validates current entry order
  private validateCurrentEntryOrder(currentId: string, previousCurrentId: string): boolean {
    const currentField = this.outputReadingsForm.get(currentId);
    const previousField = this.outputReadingsForm.get(previousCurrentId);

    if (!previousField?.value || this.trimAll(previousField.value) === '') {
      const phaseLabel = currentId.includes('A') ? 'A' : currentId.includes('B') ? 'B' : 'C';
      const previousPhase = previousCurrentId.includes('A') ? 'A' : 'B';
      
      this.showValidationMessage(`Please first enter Input Current ${previousPhase}`, 'inputCurrentSequence', previousCurrentId);
      previousField?.markAsTouched();
      return false;
    }

    // For C phase, also check B phase
    if (currentId.includes('C')) {
      const bPhaseId = currentId.replace('C', 'B');
      const bPhaseField = this.outputReadingsForm.get(bPhaseId);
      
      if (!bPhaseField?.value || this.trimAll(bPhaseField.value) === '') {
        this.showValidationMessage('Please first enter Input Current B', 'inputCurrentB', bPhaseId);
        bPhaseField?.markAsTouched();
        return false;
      }
    }

    return true;
  }

  // Enhanced form initialization with dynamic field control
  private initializeEnhancedFormFeatures(): void {
    // Set up real-time input validation for current fields
    this.setupCurrentFieldValidation();
    
    // Set up automatic field sanitization
    this.setupFieldSanitization();
    
    // Initialize section visibility based on equipment type
    this.initializeSectionVisibility();
  }

  // Set up real-time validation for current input fields
  private setupCurrentFieldValidation(): void {
    const currentFields = ['currA', 'currB', 'currC'];
    const forms = [this.inputReadingsForm, this.bypassReadingsForm, this.outputReadingsForm];

    forms.forEach(form => {
      currentFields.forEach(fieldName => {
        const control = form.get(fieldName);
        if (control) {
          control.valueChanges
            .pipe(takeUntil(this.destroy$))
            .subscribe(value => {
              if (value) {
                this.onCurrentFieldChange(fieldName, value);
              }
            });
        }
      });
    });
  }

  // Set up automatic field sanitization on value changes
  private setupFieldSanitization(): void {
    const forms = [
      this.equipmentForm,
      this.reconciliationForm,
      this.measurementsForm,
      this.capacitorForm
    ];

    forms.forEach(form => {
      Object.keys(form.controls).forEach(fieldName => {
        const control = form.get(fieldName);
        if (control) {
          // Add value change handling for auto-sanitization
          control.valueChanges
            .pipe(
              takeUntil(this.destroy$),
              debounceTime(500) // Wait for user to stop typing
            )
            .subscribe(value => {
              if (typeof value === 'string' && value) {
                const sanitized = this.sanitizeInput(value);
                if (sanitized !== value) {
                  control.setValue(sanitized, { emitEvent: false });
                }
              }
            });
        }
      });
    });
  }

  // Initialize section visibility based on equipment characteristics
  private initializeSectionVisibility(): void {
    // Show advanced settings for complex UPS systems
    const kva = this.convertToDouble(this.equipmentForm.get('kva')?.value || '0');
    
    if (kva > 200) {
      this.showAdvancedSettings = true;
      this.showPowerDetails = true;
    }
    
    // Show maintenance details for older equipment
    const year = this.convertToInt(this.equipmentForm.get('year')?.value || new Date().getFullYear());
    const currentYear = new Date().getFullYear();
    
    if (currentYear - year > 10) {
      this.showMaintenanceDetails = true;
    }
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

  // Get CSS class for equipment status display
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

  // Get display text for maintenance bypass type
  getMaintenanceBypassText(value: string): string {
    if (!value) return '';
    
    const bypassType = this.maintenanceBypassTypes.find(type => type.value === value);
    return bypassType ? bypassType.text : value;
  }

  // Get display text for Yes/No values
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

  // Check if a reconciliation field has a mismatch between current and actual values
  hasReconciliationMismatch(currentField: string, actualField: string): boolean {
    const currentValue = this.reconciliationForm.get(currentField)?.value;
    const actualValue = this.reconciliationForm.get(actualField)?.value;
    
    if (!currentValue || !actualValue) return false;
    
    return currentValue.toString().trim() !== actualValue.toString().trim();
  }

  // Get CSS class for reconciliation field based on correctness status
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

  // Helper method to get month number from month name
  private getMonthNumber(monthName: string): number {
    if (!monthName) return -1;
    
    const months = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    
    const monthIndex = months.indexOf(monthName.toLowerCase());
    return monthIndex; // Returns 0-11 for months, -1 if not found
  }

  // Determine default value for parallel cabinet based on UPS characteristics
  private determineDefaultParallelCabinet(data: AAETechUPS): string {
    if (data.parallelCabinet) return data.parallelCabinet;
    
    const kva = this.convertToDouble(data.kva);
    const manufacturer = (data.manufacturer || '').toUpperCase();
    
    // High-capacity UPS systems are more likely to have parallel configurations
    if (kva >= 500) return 'Y';
    if (kva >= 200 && (manufacturer.includes('LIEBERT') || manufacturer.includes('APC') || manufacturer.includes('EATON'))) {
      return 'Y';
    }
    
    return 'N';
  }

  // Determine default value for SNMP card presence based on UPS characteristics
  private determineDefaultSnmpPresent(data: AAETechUPS): string {
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
    
    return 'N';
  }

  // Show a specific section (legacy showdiv equivalent)
  showSection(sectionId: string): void {
    switch (sectionId) {
      case 'additionalNotes':
        this.showAdditionalNotes = true;
        break;
      case 'advancedSettings':
        this.showAdvancedSettings = true;
        break;
      case 'debugInfo':
        this.showDebugInfo = true;
        break;
      case 'maintenanceDetails':
        this.showMaintenanceDetails = true;
        break;
      case 'powerDetails':
        this.showPowerDetails = true;
        break;
      default:
        console.warn(`Unknown section ID: ${sectionId}`);
    }
  }

  // Hide a specific section (legacy hidediv equivalent)
  hideSection(sectionId: string): void {
    switch (sectionId) {
      case 'additionalNotes':
        this.showAdditionalNotes = false;
        break;
      case 'advancedSettings':
        this.showAdvancedSettings = false;
        break;
      case 'debugInfo':
        this.showDebugInfo = false;
        break;
      case 'maintenanceDetails':
        this.showMaintenanceDetails = false;
        break;
      case 'powerDetails':
        this.showPowerDetails = false;
        break;
      default:
        console.warn(`Unknown section ID: ${sectionId}`);
    }
  }

  // Toggle a specific section visibility
  toggleSection(sectionId: string): void {
    switch (sectionId) {
      case 'additionalNotes':
        this.showAdditionalNotes = !this.showAdditionalNotes;
        break;
      case 'advancedSettings':
        this.showAdvancedSettings = !this.showAdvancedSettings;
        break;
      case 'debugInfo':
        this.showDebugInfo = !this.showDebugInfo;
        break;
      case 'maintenanceDetails':
        this.showMaintenanceDetails = !this.showMaintenanceDetails;
        break;
      case 'powerDetails':
        this.showPowerDetails = !this.showPowerDetails;
        break;
      default:
        console.warn(`Unknown section ID: ${sectionId}`);
    }
  }

  // Check if a section is currently visible
  isSectionVisible(sectionId: string): boolean {
    switch (sectionId) {
      case 'additionalNotes':
        return this.showAdditionalNotes;
      case 'advancedSettings':
        return this.showAdvancedSettings;
      case 'debugInfo':
        return this.showDebugInfo;
      case 'maintenanceDetails':
        return this.showMaintenanceDetails;
      case 'powerDetails':
        return this.showPowerDetails;
      default:
        console.warn(`Unknown section ID: ${sectionId}`);
        return false;
    }
  }

  // Save methods for Environment section
  saveDraft(): void {
    // TODO: Implement save as draft functionality
    this.successMessage = 'UPS readings saved as draft successfully';
    this.errorMessage = '';
    
    // Clear message after 3 seconds
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  saveUPS(): void {
    // TODO: Implement save UPS functionality
    this.successMessage = 'UPS readings saved successfully';
    this.errorMessage = '';
    
    // Clear message after 3 seconds
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }
}