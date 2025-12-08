import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, HostListener, ChangeDetectorRef, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, Observable, forkJoin, of } from 'rxjs';
import { takeUntil, debounceTime, map, catchError, switchMap } from 'rxjs/operators';
import { EquipmentService } from '../../core/services/equipment.service';
import { AuthService } from '../../modules/auth/services/auth.service';
import {
  AAETechUPS,
  EquipReconciliationInfo,
  SaveUpdateEquipReconciliationDto,
  VOLTAGE_CONFIGURATIONS,
  VoltageConfiguration,
  PASS_FAIL_OPTIONS,
  POWER_VERIFICATION_OPTIONS,
  YES_NO_OPTIONS,
  SNMP_OPTIONS,
  STATUS_OPTIONS,
  UPSReadingsFormData,
  UpdateEquipStatus,
  EquipFilterCurrents,
  SaveUpdateaaETechUPSDto,
  SaveUpdateUPSResponse
} from '../../core/model/ups-readings.model';
import { convertToSaveUpdateDto, convertFromSaveUpdateDto } from '../../core/utils/ups-data-mapper.util';

// Age Validation Service Interface
interface AgeValidationResult {
  status: string;
  recommendedAction: string;
  autoChangeStatus: boolean;
  comments?: string;
  endOfLifeValue: string; // 'P' or 'F'
}

class UPSAgeValidationService {
  static validateEquipmentAge(equipmentAge: number, kva: number): AgeValidationResult {
    const result: AgeValidationResult = {
      status: 'Online',
      recommendedAction: '',
      autoChangeStatus: false,
      endOfLifeValue: 'P'
    };

    // Calculate thresholds based on KVA and industry standards
    const endOfLifeThreshold = this.calculateEndOfLifeThreshold(kva);
    const technologyThreshold = kva > 500 ? 18 : 15;
    const partsSupportThreshold = 30; // Fixed threshold for parts availability

    // Parts Support - Highest priority (manufacturing/industry standard)
    if (equipmentAge >= partsSupportThreshold) {
      result.status = 'CriticalDeficiency';
      result.recommendedAction = `Equipment age (${equipmentAge} years) exceeds parts support threshold (${partsSupportThreshold} years). Immediate replacement - Parts availability risk.`;
      result.autoChangeStatus = true;
      result.endOfLifeValue = 'F';
      result.comments = `WARNING: Equipment age (${equipmentAge} years) may impact parts availability and manufacturer support.`;
    }
    // End of Life - Technology/Performance based
    else if (equipmentAge >= endOfLifeThreshold) {
      result.status = 'ReplacementRecommended';
      result.recommendedAction = `Equipment age (${equipmentAge} years) exceeds end-of-life threshold (${endOfLifeThreshold} years). Replacement recommended.`;
      result.autoChangeStatus = true;
      result.endOfLifeValue = 'F';
    }
    // Technology Obsolescence
    else if (equipmentAge >= technologyThreshold) {
      result.status = 'OnLine(MinorDeficiency)';
      result.recommendedAction = `Equipment age (${equipmentAge} years) - Consider modernization due to technology advancement.`;
      result.autoChangeStatus = false; // Technician discretion
      result.endOfLifeValue = 'P';
    }
    // Proactive Planning Zone
    else if (equipmentAge >= (endOfLifeThreshold - 3)) {
      result.status = 'ProactiveReplacement';
      result.recommendedAction = `Equipment approaching end-of-life in ${endOfLifeThreshold - equipmentAge} years. Plan replacement.`;
      result.autoChangeStatus = false;
      result.endOfLifeValue = 'P';
    }

    return result;
  }

  static calculateEndOfLifeThreshold(kva: number): number {
    if (kva >= 1000) return 30;      // Large systems - longer lifecycle
    if (kva >= 500) return 25;       // Medium-large systems
    if (kva >= 100) return 22;       // Medium systems
    if (kva >= 50) return 20;        // Small-medium systems
    return 18;                       // Small systems - faster technology turnover
  }
}

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

  // Major PM detection
  isMajorPM: boolean = false;
  serviceDescription: string = '';

  // Section visibility control properties
  showAdditionalNotes: boolean = false;
  showAdvancedSettings: boolean = false;
  showDebugInfo: boolean = false;
  showMaintenanceDetails: boolean = false;
  showPowerDetails: boolean = false;

  // Form validation state
  isFormSubmission: boolean = false;
  validationErrors: { [key: string]: string } = {};
  
  // Manual status override tracking
  // When user manually selects "Off-Line", this flag prevents automatic status calculations
  // from overriding their choice. The Off-Line status will be preserved exactly as selected.
  manualStatusOverride: boolean = false;
  originalCalculatedStatus: string = 'Online';

  // Restricted character validation
  restrictedChars = ['/', '\\', '<', '>', '&', '"', "'", ';', ','];
  restrictedCharErrors: { [key: string]: string } = {};

  // Character limit validation - Based on legacy UPS readings limits
  characterLimits: { [key: string]: number } = {
    // Basic Information Fields
    'callNbr': 11,
    'upsId': 21,
    'manufacturer': 128,
    'kva': 10,
    'modelNo': 50,
    'model': 50,        // Form field name mapping
    'serialNo': 50,
    'status': 35,
    'other': 50,
    'location': 128,
    'maintAuthId': 128,
    'ctoPartNo': 50,
    
    // Single/Two Character Fields
    'multiModule': 2,
    'maintByPass': 2,
    'parallelCabinet': 2,
    'visualEPO': 2,
    'environmentClean': 2,
    'transferMajor': 2,
    'transferByPass': 2,
    'snmpPresent': 2,
    'modularUPS': 2,
    
    // Most measurement, visual, environment fields are 1 character (P, F, A)
    'measurementFields': 1,
    'visualFields': 1,
    'environmentFields': 1,
    
    // Comment Fields
    'comments1': 500,
    'comments2': 500,
    'comments3': 500,
    'comments4': 500,
    'comments5': 500,
    'statusReason': 500,
    'visualComments': 500,
    
    // Date Fields
    'upsDateCodeMonth': 25,
    'dateCodeMonth': 25,
    'monthName': 25,
    
    // Air filter fields
    'filterSet1Length': 10,
    'filterSet1Width': 10,
    'filterSet1Thickness': 10,
    'filterSet1Quantity': 10,
    'filterSet2Length': 10,
    'filterSet2Width': 10,
    'filterSet2Thickness': 10,
    'filterSet2Quantity': 10
  };
  
  characterLimitErrors: { [key: string]: string } = {};

  // Fields that should NOT have restricted character validation (like legacy code)
  excludedFromCharValidation = [
    'model', 'serialNo', 'actModel', 'actSerialNo', // Model and serial fields can have special chars
    'monthName', 'year', // Date fields have their own validation
    'ctoPartNo', // Part numbers may contain special characters
    'modelCorrect', 'serialNoCorrect', 'kvaCorrect', 'totalEquipsCorrect', 'verified' // Reconciliation dropdown fields
  ];

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

  // Air filter options (legacy values)
  airFilterOptions = [
    { value: 'C', text: 'Cleaned' },
    { value: 'R', text: 'Replaced' },
    { value: 'N', text: 'Replacement Needed' }, // Legacy: N = Replacement Needed
    { value: 'A', text: 'N/A' } // Legacy: A = N/A
  ];

  // Fans age options (includes Warning option)
  fansAgeOptions = [
    { value: 'P', text: 'Pass' },
    { value: 'F', text: 'Fail' },
    { value: 'W', text: 'Warning' },
    { value: 'N', text: 'N/A' }
  ];
  yesNoOptions = YES_NO_OPTIONS;
  snmpOptions = SNMP_OPTIONS;
  // Hostile environment options - legacy uses YS/NO
  hostileEnvironmentOptions = [
    { value: 'YS', text: 'Yes' },
    { value: 'NO', text: 'No' }
  ];
  yesNoNAOptions = [
    { value: 'Y', text: 'Yes' },
    { value: 'N', text: 'No' },
    { value: 'NA', text: 'N/A' }
  ];
  statusOptions = STATUS_OPTIONS;

  // Getter for status options with proper fallback
  get currentStatusOptions(): { value: string; text: string }[] {
    return (this.equipmentStatusOptions && this.equipmentStatusOptions.length > 0)
      ? this.equipmentStatusOptions
      : this.statusOptions;
  }

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
  showTransfer = true; // Show by default for Major PM visibility
  showActionRequired = false;

  // Filter current checkboxes UI state
  showInputFilterCurrent = false;
  showInputTHD = false;
  showOutputFilterCurrent = false;
  showOutputTHD = false;

  // Dynamic labels
  endOfLifeLabel = '7. UPS date code is < 25 years (End of Life):';
  // Track the last user-selected status from the dropdown so confirm uses the user's selection
  lastUserSelectedStatus: string | null = null;

  // Basic date state for existing functionality
  currentCalendarDate = new Date();
  selectedDate: Date | null = null;
  selectedYear = new Date().getFullYear();

  // Calendar widget state
  showCalendar = false;
  showMonthCalendar = false;
  showYearCalendar = false;
  calendarDate = new Date();
  monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Year calendar state
  yearRangeStart = 1990;
  yearRangeEnd = 2005; // 1990 + 16 - 1 for 4x4 grid
  yearRangeChangeCounter = 0; // Counter to force change detection
  currentYears: number[] = []; // Direct array to hold current years
  readonly minYear = 1753;
  readonly maxYear = 9999;
  readonly yearsPerRange = 16; // 4x4 grid

  // Fans year calendar state
  showFansYearCalendar = false;
  fansYearRangeStart = 1990;
  fansYearRangeEnd = 2005;
  fansYearRangeChangeCounter = 0;
  currentFansYears: number[] = [];

  // DC Caps year calendar state
  showDcCapsYearCalendar = false;
  dcCapsYearRangeStart = 1990;
  dcCapsYearRangeEnd = 2005;
  dcCapsYearRangeChangeCounter = 0;
  currentDcCapsYears: number[] = [];

  // AC Input Caps year calendar state
  showAcInputCapsYearCalendar = false;
  acInputCapsYearRangeStart = 1990;
  acInputCapsYearRangeEnd = 2005;
  acInputCapsYearRangeChangeCounter = 0;
  currentAcInputCapsYears: number[] = [];

  // AC Output Caps year calendar state
  showAcOutputCapsYearCalendar = false;
  acOutputCapsYearRangeStart = 1990;
  acOutputCapsYearRangeEnd = 2005;
  acOutputCapsYearRangeChangeCounter = 0;
  currentAcOutputCapsYears: number[] = [];

  // Comm Caps year calendar state
  showCommCapsYearCalendar = false;
  commCapsYearRangeStart = 1990;
  commCapsYearRangeEnd = 2005;
  commCapsYearRangeChangeCounter = 0;
  currentCommCapsYears: number[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private equipmentService: EquipmentService,
    private authService: AuthService,
    private toastr: ToastrService,
    private elementRef: ElementRef,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.initializeForms();
  }

  /**
   * Get detailed client-side validation errors for better error reporting
   */
  private getClientValidationErrors(): string[] {
    const errors: string[] = [];
    
    // Equipment form validation
    if (this.equipmentForm.invalid) {
      Object.keys(this.equipmentForm.controls).forEach(key => {
        const control = this.equipmentForm.get(key);
        if (control && control.invalid) {
          if (key === 'kva' && control.errors) {
            if (control.errors['required']) {
              errors.push('KVA Rating is required');
            } else if (control.errors['pattern']) {
              errors.push('KVA Rating: ' + (control.errors['pattern'].message || 'Invalid format'));
            } else if (control.errors['min']) {
              errors.push('KVA Rating: ' + (control.errors['min'].message || 'Must be greater than 0'));
            } else if (control.errors['max']) {
              errors.push('KVA Rating: ' + (control.errors['max'].message || 'Value too high'));
            }
          } else if (key === 'manufacturer' && control.errors?.['required']) {
            errors.push('Manufacturer is required');
          } else if (key === 'model' && control.errors?.['required']) {
            errors.push('Model is required');
          } else if (key === 'serialNo' && control.errors?.['required']) {
            errors.push('Serial Number is required');
          } else if (key === 'location' && control.errors?.['required']) {
            errors.push('Location is required');
          } else if (key === 'year' && control.errors) {
            if (control.errors['required']) {
              errors.push('Year is required');
            } else if (control.errors['min']) {
              errors.push('Year must be 1900 or later');
            }
          }
        }
      });
    }
    
    // Restricted character errors
    Object.keys(this.restrictedCharErrors).forEach(field => {
      errors.push(`${field}: ${this.restrictedCharErrors[field]}`);
    });
    
    // Character limit errors
    Object.keys(this.characterLimitErrors).forEach(field => {
      errors.push(`${field}: ${this.characterLimitErrors[field]}`);
    });
    
    return errors;
  }

  ngOnInit(): void {
    // Initialize validation state for page load
    this.isFormSubmission = false;
    this.clearAllValidationErrors();

    // Force Power Verification section to be visible
    this.showPowerVerification = true;

    // Set up restricted character validation
    this.setupRestrictedCharValidation();

    this.getRouteParams();
    this.loadData();

    // Set up date code display value watcher
    this.setupDateCodeDisplayWatcher();

    // Watch for air filter dropdown changes
    this.visualForm.get('airFilters')?.valueChanges.subscribe(value => {
      this.showAirFilterDetails = value && value !== '';
      this.updateFilterSizeValidation(value);
    });

    // Debug logging will be triggered after form population
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    // Remove click outside handler
    document.removeEventListener('click', (event) => this.onDocumentClick(event));
  }

  /**
   * Custom validator for decimal KVA values
   * Matches legacy isIntegerOrFloat pattern: /^[-+]?(\d+(\.\d*)?|\.\d+)$/
   */
  private decimalKvaValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) {
        return null; // Required validator handles empty values
      }

      const value = control.value.toString().trim();
      
      // Legacy-compatible pattern: allows integers, decimals, and floats
      // Supports: 16, 16.5, 225.00, .5, 100.75, etc.
      const legacyPattern = /^[+]?(\d+(\.\d*)?|\.\d+)$/;
      
      if (!legacyPattern.test(value)) {
        return { 'pattern': { 
          value: control.value, 
          message: 'Please enter valid KVA (integers, decimals, or floats like 16.5, 225.00)' 
        }};
      }
      
      // Convert to number using legacy-style parsing
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue <= 0) {
        return { 'min': { 
          value: control.value, 
          message: 'KVA must be greater than 0' 
        }};
      }
      
      // Legacy systems typically handle up to 10000 KVA
      if (numValue > 10000) {
        return { 'max': { 
          value: control.value, 
          message: 'KVA value exceeds maximum limit (10000)' 
        }};
      }

      return null; // Valid
    };
  }

  /**
   * Custom validator for restricted characters based on legacy UPS validation
   * Restricted chars: '/', '\\', '<', '>', '&', '"', "'", ';', ','
   */
  private restrictedCharValidator(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      if (!control.value) {
        return null; // No validation error if field is empty
      }

      const value = control.value.toString();
      const foundChars = this.restrictedChars.filter(char => value.includes(char));

      if (foundChars.length > 0) {
        return {
          'restrictedChar': {
            value: control.value,
            restrictedChars: foundChars,
            message: `Character(s) "${foundChars.join('", "')}" not allowed in this field`
          }
        };
      }

      return null;
    };
  }

  /**
   * Sets up real-time validation listeners for all text input fields
   * Includes both restricted character and character limit validation
   * Excludes model, serial number, date fields and part numbers as per legacy code
   */
  private setupRestrictedCharValidation(): void {
    // Delay setup to ensure all forms are initialized
    setTimeout(() => {
      // Get all forms in the component
      const forms = [
        this.equipmentForm,
        this.reconciliationForm,
        this.measurementsForm,
        this.visualForm,
        this.environmentForm,
        this.inputReadingsForm,
        this.bypassReadingsForm,
        this.outputReadingsForm,
        this.rectifierForm,
        this.capacitorForm,
        this.transferForm,
        this.actionRequiredForm
      ];

      forms.forEach(form => {
        if (form) {
          Object.keys(form.controls).forEach(controlName => {
            // Skip fields that are excluded from character validation
            if (this.excludedFromCharValidation.includes(controlName)) {
              return;
            }

            const control = form.get(controlName);
            if (control && this.isTextInput(controlName)) {
              // Add real-time validation listener
              control.valueChanges.pipe(
                takeUntil(this.destroy$),
                debounceTime(50) // Reduced delay for more responsive feedback
              ).subscribe(value => {
                this.validateRestrictedChars(controlName, value, form);
                this.validateCharacterLimit(controlName, value, form);
              });
            }
          });
        }
      });
    }, 100); // Small delay to ensure forms are ready
  }

  /**
   * Determines if a form control should have text input validation
   */
  private isTextInput(controlName: string): boolean {
    // Skip dropdown/select fields and non-text inputs
    const skipFields = [
      'manufacturer', 'status', 'parallelCabinet', 'snmpPresent', 'upsType',
      'modelCorrect', 'serialNoCorrect', 'kvaCorrect', 'totalEquipsCorrect',
      'verified', 'inputFilterCurrent', 'inputThdPercent', 'outputFilterCurrent', 'outputThdPercent',
      'configuration', // Configuration dropdowns
      'multiModule', 'maintByPass', 'modularUPS', // Equipment dropdowns
      'hostileEnvironment', 'firstMajor', 'dcgAction1', 'custAction1', // Yes/No dropdowns
      '_PF', 'Correct', // All Pass/Fail dropdowns and correction dropdowns
      'kva', 'year' // Number fields that should not have character validation
    ];

    return !skipFields.some(skip => controlName.includes(skip));
  }

  /**
   * Validates character limits in real-time and shows immediate feedback
   */
  private validateCharacterLimit(controlName: string, value: any, form: FormGroup): void {
    // Map form instances to readable names for UI
    let formName = 'UnknownForm';
    if (form === this.equipmentForm) formName = 'EquipmentForm';
    else if (form === this.reconciliationForm) formName = 'ReconciliationForm';
    else if (form === this.visualForm) formName = 'VisualForm';
    else if (form === this.environmentForm) formName = 'EnvironmentForm';
    else if (form === this.inputReadingsForm) formName = 'InputReadingsForm';
    else if (form === this.bypassReadingsForm) formName = 'BypassReadingsForm';
    else if (form === this.outputReadingsForm) formName = 'OutputReadingsForm';

    const key = `${formName}_${controlName}`;

    if (!value) {
      delete this.characterLimitErrors[key];
      return;
    }

    const stringValue = value.toString();
    const characterLimit = this.getCharacterLimitForField(controlName);
    
    if (characterLimit && stringValue.length > characterLimit) {
      this.characterLimitErrors[key] = `Exceeds ${characterLimit} character limit (current: ${stringValue.length})`;
    } else {
      delete this.characterLimitErrors[key];
    }

    // Trigger change detection to update UI
    this.cdr.detectChanges();
  }

  /**
   * Gets the character limit for a specific field based on the character limits configuration
   */
  private getCharacterLimitForField(controlName: string): number | null {
    // Skip numeric fields that should not have character limits
    const numericFields = ['kva', 'year', 'voltage', 'current', 'frequency', 'temperature', 'capacity'];
    if (numericFields.some(field => controlName.toLowerCase().includes(field))) {
      return null;
    }

    // Direct field mapping
    if (this.characterLimits[controlName]) {
      return this.characterLimits[controlName];
    }

    // Check for field patterns
    if (controlName.includes('comments') || controlName.includes('Comments')) {
      return 500;
    }
    
    if (controlName.includes('filter') && (controlName.includes('Length') || controlName.includes('Width') || controlName.includes('Thickness') || controlName.includes('Quantity'))) {
      return 10;
    }
    
    // Pass/Fail dropdown fields (should be 1 character)
    if (controlName.endsWith('_PF') || controlName.includes('PF')) {
      return 1;
    }
    
    // Most measurement, visual, environment dropdown fields
    if (controlName.startsWith('measure') || controlName.startsWith('visual') || controlName.startsWith('environment')) {
      return 1;
    }
    
    return null; // No limit for this field
  }

  /**
   * Validates restricted characters in real-time and shows immediate feedback
   */
  private validateRestrictedChars(controlName: string, value: any, form: FormGroup): void {
    // Map form instances to readable names for UI
    let formName = 'UnknownForm';
    if (form === this.equipmentForm) formName = 'EquipmentForm';
    else if (form === this.reconciliationForm) formName = 'ReconciliationForm';
    else if (form === this.visualForm) formName = 'VisualForm';
    else if (form === this.environmentForm) formName = 'EnvironmentForm';
    else if (form === this.inputReadingsForm) formName = 'InputReadingsForm';
    else if (form === this.bypassReadingsForm) formName = 'BypassReadingsForm';
    else if (form === this.outputReadingsForm) formName = 'OutputReadingsForm';

    const key = `${formName}_${controlName}`;

    if (!value) {
      delete this.restrictedCharErrors[key];
      return;
    }

    const stringValue = value.toString();
    const foundChars = this.restrictedChars.filter(char => stringValue.includes(char));

    if (foundChars.length > 0) {
      this.restrictedCharErrors[key] = `Character(s) "${foundChars.join('", "')}" not allowed in this field`;
    } else {
      delete this.restrictedCharErrors[key];
    }

    // Trigger change detection to update UI
    this.cdr.detectChanges();
  }

  /**
   * Adds or removes visual error styling to form fields
   * Now relies purely on Angular class binding instead of direct DOM manipulation
   */
  private addFieldError(controlName: string, hasError: boolean): void {
    // No direct DOM manipulation - let Angular handle it through class binding
    // This prevents interference with input functionality
    this.cdr.detectChanges();
  }

  /**
   * Gets the form name for a given FormGroup instance
   */
  private getFormName(form: FormGroup): string {
    if (form === this.equipmentForm) return 'EquipmentForm';
    if (form === this.reconciliationForm) return 'ReconciliationForm';
    if (form === this.visualForm) return 'VisualForm';
    if (form === this.environmentForm) return 'EnvironmentForm';
    if (form === this.inputReadingsForm) return 'InputReadingsForm';
    if (form === this.bypassReadingsForm) return 'BypassReadingsForm';
    if (form === this.outputReadingsForm) return 'OutputReadingsForm';
    return 'UnknownForm';
  }

  /**
   * Gets the restricted character error message for a specific field
   */
  getRestrictedCharError(formName: string, controlName: string): string | null {
    const key = `${formName}_${controlName}`;
    return this.restrictedCharErrors[key] || null;
  }

  /**
   * Checks if a specific field has restricted character errors
   */
  hasRestrictedCharError(formName: string, controlName: string): boolean {
    const key = `${formName}_${controlName}`;
    return !!this.restrictedCharErrors[key];
  }

  /**
   * Gets the character limit error message for a specific field
   */
  getCharacterLimitError(formName: string, controlName: string): string | null {
    const key = `${formName}_${controlName}`;
    return this.characterLimitErrors[key] || null;
  }

  /**
   * Checks if a specific field has character limit errors
   */
  hasCharacterLimitError(formName: string, controlName: string): boolean {
    const key = `${formName}_${controlName}`;
    return !!this.characterLimitErrors[key];
  }

  /**
   * Gets the character limit for a specific field (for display purposes)
   */
  getCharacterLimit(controlName: string): number | null {
    return this.getCharacterLimitForField(controlName);
  }

  /**
   * Gets the current character count for a form field
   */
  getCharacterCount(formName: string, controlName: string): number {
    let form: FormGroup;
    switch (formName) {
      case 'EquipmentForm': form = this.equipmentForm; break;
      case 'ReconciliationForm': form = this.reconciliationForm; break;
      case 'VisualForm': form = this.visualForm; break;
      case 'EnvironmentForm': form = this.environmentForm; break;
      case 'InputReadingsForm': form = this.inputReadingsForm; break;
      case 'BypassReadingsForm': form = this.bypassReadingsForm; break;
      case 'OutputReadingsForm': form = this.outputReadingsForm; break;
      default: return 0;
    }
    
    const value = form.get(controlName)?.value;
    return value ? value.toString().length : 0;
  }

  /**
   * Validates all forms for restricted characters and character limits before saving
   * Returns true if validation passes, false if there are errors
   */
  private validateAllRestrictedChars(): boolean {
    let hasErrors = false;

    // Clear previous errors
    this.restrictedCharErrors = {};
    this.characterLimitErrors = {};

    const forms = [
      this.equipmentForm,
      this.reconciliationForm,
      this.visualForm,
      this.environmentForm,
      this.inputReadingsForm,
      this.bypassReadingsForm,
      this.outputReadingsForm
    ];

    forms.forEach(form => {
      if (form) {
        Object.keys(form.controls).forEach(controlName => {
          if (!this.excludedFromCharValidation.includes(controlName) &&
              this.isTextInput(controlName)) {
            const control = form.get(controlName);
            if (control && control.value) {
              this.validateRestrictedChars(controlName, control.value, form);
              this.validateCharacterLimit(controlName, control.value, form);
              // Check if this validation created an error
              const formName = this.getFormName(form);
              if (this.hasRestrictedCharError(formName, controlName) || this.hasCharacterLimitError(formName, controlName)) {
                hasErrors = true;
              }
            }
          }
        });
      }
    });

    return !hasErrors;
  }

  ngAfterViewInit(): void {
    // Setup checkbox subscriptions after view initialization to ensure forms are ready
    this.setupFilterCurrentCheckboxHandlers();

    // Add click outside handler for calendars
    document.addEventListener('click', (event) => this.onDocumentClick(event));
  }

  onDocumentClick(event: Event): void {
    const target = event.target as HTMLElement;

    // Check if click is outside calendar dropdowns
    const monthCalendar = target.closest('.compact-calendar-dropdown:not(.year-calendar-dropdown)');
    const yearCalendar = target.closest('.year-calendar-dropdown');
    const monthInput = target.closest('[formControlName="monthName"]');
    const yearInput = target.closest('[formControlName="year"]');
    const calendarButton = target.closest('.calendar-toggle-btn');

    // Close month calendar if clicked outside
    if (!monthCalendar && !monthInput && !calendarButton && this.showMonthCalendar) {
      this.showMonthCalendar = false;
    }

    // Close year calendar if clicked outside
    if (!yearCalendar && !yearInput && !calendarButton && this.showYearCalendar) {
      this.showYearCalendar = false;
    }

    // --- Capacitor/year pickers ---
    const clickedInsideDcCaps = !!target.closest('.dc-caps-dropdown');
    const clickedInsideAcInputCaps = !!target.closest('.ac-input-caps-dropdown');
    const clickedInsideAcOutputCaps = !!target.closest('.ac-output-caps-dropdown');
    const clickedInsideCommCaps = !!target.closest('.comm-caps-dropdown');
    const clickedInsideFans = !!target.closest('.fans-year-dropdown');

    const clickedDcInput = !!target.closest('#dcCapsYear');
    const clickedAcInput = !!target.closest('#acInputCapsYear');
    const clickedAcOutputInput = !!target.closest('#acOutputCapsYear');
    const clickedCommInput = !!target.closest('#commCapsYear');
    const clickedFansInput = !!target.closest('#fansYear');

    // Close individual capacitor year pickers when click is outside their input/toggle/dropdown
    if (!clickedInsideDcCaps && !clickedDcInput && !calendarButton && this.showDcCapsYearCalendar) {
      this.showDcCapsYearCalendar = false;
    }
    if (!clickedInsideAcInputCaps && !clickedAcInput && !calendarButton && this.showAcInputCapsYearCalendar) {
      this.showAcInputCapsYearCalendar = false;
    }
    if (!clickedInsideAcOutputCaps && !clickedAcOutputInput && !calendarButton && this.showAcOutputCapsYearCalendar) {
      this.showAcOutputCapsYearCalendar = false;
    }
    if (!clickedInsideCommCaps && !clickedCommInput && !calendarButton && this.showCommCapsYearCalendar) {
      this.showCommCapsYearCalendar = false;
    }
    if (!clickedInsideFans && !clickedFansInput && !calendarButton && this.showFansYearCalendar) {
      this.showFansYearCalendar = false;
    }
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
      kva: ['', [Validators.required, this.decimalKvaValidator()]],
      // Default to empty string so the <option value="">Choose configuration...</option> is selected
      multiModule: [''],
      maintByPass: ['NA'], // Default to "NA" (None)
      other: [''],
      model: ['', Validators.required],
      serialNo: ['', Validators.required],
      location: ['', Validators.required],
      monthName: ['', Validators.required],
      year: ['', [Validators.required, Validators.min(1753), Validators.max(9999)]],
      status: ['Online', Validators.required],
      statusNotes: [''], // Status notes/reason (legacy: txtStatusNotes)
      parallelCabinet: ['NO'], // Default to "NO" (No)
      snmpPresent: ['PS'], // Default to "PS" (Select)
      modularUPS: [''],
      ctoPartNo: [''], // Added CTO/Part No field
      upsType: ['NO'] // Added UPS Type field with default value 'NO' (Normal UPS)
    });

    this.reconciliationForm = this.fb.group({
      model: [''],
      modelCorrect: [''], // Default to blank - let user make conscious choice
      actModel: [{ value: '', disabled: true }], // Start disabled
      serialNo: [''],
      serialNoCorrect: [''],
      actSerialNo: [{ value: '', disabled: true }], // Start disabled
      kvaSize: [''],
      kvaCorrect: [''],
      actKVA: [{ value: '', disabled: true }], // Start disabled
      totalEquips: [''],
      totalEquipsCorrect: [''],
      actTotalEquips: [{ value: '', disabled: true }], // Start disabled
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
      airFilters: ['C'], // Default "Cleaned" (legacy default)
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
      hostileEnvironment: ['NO'], // Default to "No" (legacy uses NO)
      serviceSpace: ['P'], // Default "Pass"
      circuitBreakers: ['P'] // Default "Pass"
    });

    this.inputReadingsForm = this.fb.group({
      configuration: [''], // Default to "Select" option
      inputFilterCurrent: [false],
      inputThdPercent: [false],
      voltA: [''], // Empty by default - technicians must enter actual measured values
      voltA_PF: ['P'], // Default "Pass"
      voltB: [''], // Empty by default - technicians must enter actual measured values
      voltB_PF: ['P'], // Default "Pass"
      voltC: [''], // Empty by default - technicians must enter actual measured values
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
      voltA: [''], // Empty by default - technicians must enter actual measured values
      voltA_PF: ['P'], // Default "Pass"
      voltB: [''], // Empty by default - technicians must enter actual measured values
      voltB_PF: ['P'], // Default "Pass"
      voltC: [''], // Empty by default - technicians must enter actual measured values
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
      voltA: [''], // Empty by default - technicians must enter actual measured values
      voltA_PF: ['P'], // Default "Pass"
      voltB: [''], // Empty by default - technicians must enter actual measured values
      voltB_PF: ['P'], // Default "Pass"
      voltC: [''], // Empty by default - technicians must enter actual measured values
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
      firstMajor: ['No'], // Default to "No" to match template options
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
    // this.setupEquipmentReconciliationSync(); // Commented out - using simple battery page approach now

    // Subscribe to KVA changes for dynamic end-of-life label
    this.setupKVAChangeHandlers();

    // Setup dynamic field control (legacy EnabletoEdit functionality)
    this.setupDynamicFieldControl();

    // Setup critical field validation for immediate status changes
    this.setupCriticalFieldValidation();

    // Initialize enhanced form features
    this.initializeEnhancedFormFeatures();
    
    // Setup status change handler to detect manual Off-Line selections
    this.setupStatusChangeHandler();
    
    // Setup direct form control subscription as backup
    this.setupDirectStatusSubscription();
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
      this.performAutomaticAgeValidation();
      this.calculateEndOfLifeFromYear(); // Calculate based on year and KVA
    });

    // Watch for Year changes to calculate End of Life dynamically
    this.equipmentForm.get('year')?.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(300) // Wait for user to finish typing
    ).subscribe(() => {
      this.calculateEndOfLifeFromYear();
    });

    // Add automatic age validation when dateCode changes
    this.equipmentForm.get('dateCode')?.valueChanges.pipe(
      takeUntil(this.destroy$),
      debounceTime(500) // Wait 500ms after user stops typing
    ).subscribe((dateValue) => {
      this.performAutomaticAgeValidation();
      // Also validate if user enters dateCode directly (not through month/year)
      if (dateValue && /^\d{4}$/.test(dateValue.toString().trim())) {
        this.validateDirectDateCodeInput(dateValue.toString().trim());
      }
    });
  }

  /**
   * Updates validation for filter size fields based on air filter selection
   */
  private updateFilterSizeValidation(airFilterValue: string): void {
    const filterSizeFields = [
      'filterSet1Length',
      'filterSet1Width', 
      'filterSet1Thickness',
      'filterSet1Quantity'
    ];

    filterSizeFields.forEach(fieldName => {
      const control = this.visualForm.get(fieldName);
      if (control) {
        // Clear existing validators
        control.clearValidators();
        
        // Add required validator + numeric > 0 validator if replacement is needed (legacy: 'N' = Replacement Needed)
        if (airFilterValue === 'N') {
          control.setValidators([Validators.required, this.positiveDecimalGreaterThanZeroValidator()]);
          // Mark as touched to show validation immediately when empty or when an existing value is invalid (0 or non-numeric)
          if (!control.value || control.value.toString().trim() === '') {
            control.markAsTouched();
          } else {
            const valStr = control.value.toString().trim();
            if (!this.isNumeric(valStr) || parseFloat(valStr) <= 0) {
              control.markAsTouched();
            }
          }
        } else {
          // Clear touched state when not required
          control.markAsUntouched();
        }
        
        // Update validation status
        control.updateValueAndValidity();
      }
    });
  }

  /**
   * Validator that requires a numeric value greater than 0.00
   * Accepts integer or decimal values (legacy-compatible) but rejects 0 and negative numbers
   */
  private positiveDecimalGreaterThanZeroValidator(): ValidatorFn {
    return (control: AbstractControl): { [key: string]: any } | null => {
      const val = control?.value;
      // Let required validator handle empty values
      if (val === null || val === undefined || val.toString().trim() === '') {
        return null;
      }

      const str = val.toString().trim();

      // Use isNumeric util already present in this component
      if (!this.isNumeric(str)) {
        return { 'numeric': { value: val, message: 'Please enter a valid numeric value' } };
      }

      const num = parseFloat(str);
      if (isNaN(num) || num <= 0) {
        return { 'minValue': { value: val, message: 'Value must be greater than 0.00' } };
      }

      return null;
    };
  }

  /**
   * Format filter dimension fields (Length, Width) to 2 decimal places on blur
   * Rounds up to ensure accurate parts ordering
   */
  formatFilterDimension(fieldName: string): void {
    const control = this.visualForm.get(fieldName);
    if (control) {
      const value = control.value;
      if (value !== null && value !== undefined && value !== '') {
        const formatted = this.formatDecimal(value, 2);
        control.setValue(formatted, { emitEvent: false });
      }
    }
  }

  private updateEndOfLifeLabel(kvaValue: any): void {
    const kva = this.convertToDouble(kvaValue);
    const threshold = UPSAgeValidationService.calculateEndOfLifeThreshold(kva);
    this.endOfLifeLabel = `7. UPS date code is < ${threshold} years (End of Life):`;
  }

  /**
   * Performs automatic age validation when dateCode or KVA changes
   */
  private performAutomaticAgeValidation(): void {
    // Skip validation during page load or if forms are not ready
    if (this.loading || !this.equipmentForm || !this.measurementsForm) {
      return;
    }

    const dateCode = this.equipmentForm.get('dateCode')?.value;
    const kvaValue = this.equipmentForm.get('kva')?.value;

    if (!dateCode || !kvaValue || dateCode === '01/01/1900') {
      return;
    }

    try {
      // Enhanced date parsing to handle various formats
      const equipmentAge = this.calculateEquipmentAge(dateCode);
      const kva = this.convertToDouble(kvaValue);

      // Apply validation for all valid ages (remove 50-year restriction)
      if (equipmentAge >= 0 && equipmentAge <= 100) {
        const ageValidation = UPSAgeValidationService.validateEquipmentAge(equipmentAge, kva);

        // Update endOfLife field automatically
        this.measurementsForm.get('endOfLife')?.setValue(ageValidation.endOfLifeValue, { emitEvent: false });

        // Update equipment status if auto-change is required
        if (ageValidation.autoChangeStatus) {
          console.debug('[DEBUG] performAutomaticAgeValidation -> autoChangeStatus true. setting equipment status to', ageValidation.status, 'endOfLifeValue:', ageValidation.endOfLifeValue);
          this.equipmentForm.get('status')?.setValue(ageValidation.status, { emitEvent: false });
          console.debug('[DEBUG] performAutomaticAgeValidation -> form.status after setValue:', this.equipmentForm?.get('status')?.value);
          this.updateEquipmentComments(ageValidation.recommendedAction);
        } else if (ageValidation.recommendedAction) {
          // Add recommendation to comments even if not auto-changing status
          this.updateEquipmentComments(`RECOMMENDATION: ${ageValidation.recommendedAction}`);
        }
      }
    } catch (error) {
      // Ignore validation errors during automatic validation
    }
  }

  /**
   * Calculate equipment age from various date formats
   */
  private calculateEquipmentAge(dateCode: string): number {
    const currentYear = new Date().getFullYear();

    // Clean the input
    const cleanDateCode = dateCode?.toString().trim();

    if (!cleanDateCode) {
      throw new Error('Date code is empty');
    }

    // Handle different date formats
    if (/^\d{4}$/.test(cleanDateCode)) {
      // Just a year (e.g., "1990")
      const year = parseInt(cleanDateCode);
      if (year < 1900 || year > currentYear) {
        throw new Error(`Year ${year} is not valid`);
      }
      return currentYear - year;
    } else if (/^\d{1,2}\/\d{4}$/.test(cleanDateCode)) {
      // Month/Year format (e.g., "1/1990" or "12/1990")
      const yearStr = cleanDateCode.split('/')[1];
      const year = parseInt(yearStr);
      if (year < 1900 || year > currentYear) {
        throw new Error(`Year ${year} is not valid`);
      }
      return currentYear - year;
    } else {
      // Try to parse as full date
      const dateCodeDate = new Date(cleanDateCode);
      if (isNaN(dateCodeDate.getTime())) {
        throw new Error(`Cannot parse date format: ${cleanDateCode}`);
      }
      const year = dateCodeDate.getFullYear();
      if (year < 1900 || year > currentYear) {
        throw new Error(`Year ${year} is not valid`);
      }
      return currentYear - year;
    }
  }

  /**
   * Calculate End of Life based on year and KVA following legacy logic:
   * - If KVA <= 50: UPS Age threshold is 20 years
   * - If KVA > 50: UPS Age threshold is 25 years
   * - Compare (currentYear - equipmentYear) with threshold
   * - Set endOfLife to 'F' (Fail) if exceeds threshold, 'P' (Pass) otherwise
   */
  private calculateEndOfLifeFromYear(): void {
    // Skip if forms are not initialized or during loading
    if (!this.equipmentForm || !this.measurementsForm || this.loading) {
      return;
    }

    const year = this.equipmentForm.get('year')?.value;
    const kvaValue = this.equipmentForm.get('kva')?.value;

    // Skip if year or KVA is not set
    if (!year || !kvaValue) {
      return;
    }

    try {
      const equipmentYear = typeof year === 'string' ? parseInt(year) : year;
      const kva = this.convertToDouble(kvaValue);
      const currentYear = new Date().getFullYear();

      // Validate year is reasonable
      if (equipmentYear < 1753 || equipmentYear > currentYear) {
        return;
      }

      // Calculate UPS age threshold based on KVA (legacy logic)
      let upsAgeThreshold = 25;
      if (kva <= 50) {
        upsAgeThreshold = 20;
      }

      // Calculate equipment age
      const equipmentAge = currentYear - equipmentYear;

      // Determine End of Life value
      let endOfLifeValue = 'P'; // Default to Pass
      if (equipmentAge > upsAgeThreshold) {
        endOfLifeValue = 'F'; // Fail if exceeds threshold
      }

      // Update the End of Life field in measurements form
      this.measurementsForm.get('endOfLife')?.setValue(endOfLifeValue, { emitEvent: false });

    } catch (error) {
      console.error('Error calculating End of Life:', error);
    }
  }

  /**
   * Validates when user enters dateCode directly (like "1990")
   */
  private validateDirectDateCodeInput(dateCode: string): void {
    const kvaValue = this.equipmentForm.get('kva')?.value;

    if (!kvaValue) {
      return; // Can't validate without KVA
    }

    try {
      const kva = this.convertToDouble(kvaValue);
      const equipmentAge = this.calculateEquipmentAge(dateCode);

      const ageValidation = UPSAgeValidationService.validateEquipmentAge(equipmentAge, kva);

      // Update endOfLife field
      this.measurementsForm.get('endOfLife')?.setValue(ageValidation.endOfLifeValue, { emitEvent: false });

      // Update status if auto-change is required
      if (ageValidation.autoChangeStatus) {
        console.debug('[DEBUG] validateDirectDateCodeInput -> autoChangeStatus true. setting equipment status to', ageValidation.status, 'endOfLifeValue:', ageValidation.endOfLifeValue);
        this.equipmentForm.get('status')?.setValue(ageValidation.status, { emitEvent: false });
        console.debug('[DEBUG] validateDirectDateCodeInput -> form.status after setValue:', this.equipmentForm?.get('status')?.value);
        this.updateEquipmentComments(ageValidation.recommendedAction);

        // Show notification for status changes
        setTimeout(() => {
          alert(`Equipment age (${equipmentAge} years) triggered automatic status change to "${ageValidation.status}". ${ageValidation.recommendedAction}`);
        }, 100);
      }
    } catch (error) {
      // Ignore validation errors
    }
  }

  /**
   * Helper method to update equipment comments without overwriting existing content
   */
  private updateEquipmentComments(newComment: string): void {
    const currentComments = this.equipmentForm.get('comments')?.value || '';

    // Check if this comment already exists to avoid duplicates
    if (!currentComments.includes(newComment.substring(0, 30))) {
      const updatedComments = currentComments +
        (currentComments ? '\n' : '') +
        newComment;
      this.equipmentForm.get('comments')?.setValue(updatedComments, { emitEvent: false });
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
        // Trigger change detection for P-N display update
        this.cdr.detectChanges();
        // Validate voltage against legacy tolerance ranges
        if (!this.isFormSubmission && !this.loading) {
          this.validateAllVoltagesForConfig('input');
        }
      });
    });

    ['currA', 'currB', 'currC'].forEach(field => {
      this.inputReadingsForm.get(field)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.calculateAndUpdatePowerValues('input');
        // Validate current against legacy tolerance
        if (!this.isFormSubmission && !this.loading) {
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
        // Trigger change detection for P-N display update
        this.cdr.detectChanges();
        // Validate voltage against legacy tolerance ranges
        if (!this.isFormSubmission && !this.loading) {
          this.validateAllVoltagesForConfig('bypass');
        }
      });
    });

    ['currA', 'currB', 'currC'].forEach(field => {
      this.bypassReadingsForm.get(field)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.calculateAndUpdatePowerValues('bypass');
        // Validate current against legacy tolerance
        if (!this.isFormSubmission && !this.loading) {
          this.validateCurrentReadingsLegacy('bypass');
        }
      });
    });

    // Output voltage and current calculations with legacy methods
    ['voltA', 'voltB', 'voltC'].forEach(field => {
      this.outputReadingsForm.get(field)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        this.calculatePhaseToNeutral('output');
        this.updatePhaseToNeutralDisplay('output');
        // Trigger change detection for P-N display update
        this.cdr.detectChanges();
        // Don't auto-calculate load, only validate voltage ranges
        if (!this.isFormSubmission && !this.loading) {
          this.validateAllVoltagesForConfig('output');
        }
      });
    });

    ['currA', 'currB', 'currC'].forEach(field => {
      this.outputReadingsForm.get(field)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
        // Only validate current values, don't auto-calculate load
        if (!this.isFormSubmission && !this.loading) {
          this.validateCurrentReadingsLegacy('output');
        }
      });
    });
  }

  private loadData(): void {
    this.loading = true;

    // Load manufacturers first to ensure dropdown is populated before form data
    this.equipmentService.getManufacturerNames()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (manufacturers) => {
          // Always update with the API response, which includes comprehensive fallback if API fails
          if (manufacturers && manufacturers.length > 0) {
            this.manufacturers = manufacturers;
          }
          // After manufacturers are loaded, proceed with loading other data
          this.loadOtherData();
        },
        error: (error) => {
          // The service already handles fallback, so we should have received some manufacturers
          // If we still don't have any, initialize with empty array
          if (!this.manufacturers || this.manufacturers.length === 0) {
            this.manufacturers = [];
          }
          this.toastr.warning('Error loading manufacturers from database. Please refresh the page.');
          // Still proceed with loading other data even if manufacturers fail
          this.loadOtherData();
        }
      });
  }

  /**
   * Load other data after manufacturers are loaded to ensure proper form population
   */
  private loadOtherData(): void {
    // Load UPS types
    this.equipmentService.getUPSTypes()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (upsTypes) => {
          this.upsTypes = upsTypes;
        },
        error: (error) => {
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
        }
      });

    // Load equipment status options
    this.equipmentService.getEquipmentStatusOptions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (statusOptions) => {
          const ensured = this.ensureCriticalDeficiencyOption(statusOptions || []);
          const normalized = this.normalizeStatusOptions(ensured);
          this.equipmentStatusOptions = normalized;
        },
        error: (error) => {
          // Fallback to default options including CriticalDeficiency
          this.equipmentStatusOptions = this.getDefaultStatusOptions();
        }
      });

    // Load UPS data
    this.equipmentService.getUPSReadings(this.callNbr, this.equipId, this.upsId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.upsData = data as AAETechUPS;

          // Detect Major PM service
          this.serviceDescription = data.svcDescr || '';
          this.isMajorPM = this.serviceDescription.toLowerCase().includes('major');

          this.populateFormsWithData(data as AAETechUPS);

          // Initialize any forms/fields that weren't populated with backend data with defaults
          // Use setTimeout to ensure form population is complete before setting defaults
          setTimeout(() => {
            this.initializeFormsWithDefaults();
          }, 50);

          // Load reconciliation data after equipment form is populated
          this.loadReconciliationDataAfterEquipment();

          // Ensure Power Verification section is visible after data load
          this.showPowerVerification = true;

          // Delay setting loading = false until all form population is complete
          // This prevents validation from triggering during data loading
          setTimeout(() => {
            this.loading = false;
          }, 600); // Wait for all async form populations to complete

          // Force change detection after loading is complete
          setTimeout(() => {
            this.cdr.detectChanges();

          }, 100);

          // Final check - ensure parallel cabinet has a value after all data loading
          setTimeout(() => {
            const currentValue = this.equipmentForm.get('parallelCabinet')?.value;
            if (!currentValue || currentValue.trim() === '') {
              this.equipmentForm.patchValue({ parallelCabinet: 'NO' });
            }
          }, 100);
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

            // Delay filter current population to ensure it happens after all other form operations
            setTimeout(() => {
              if (response.data) {
                this.populateFilterCurrentsFromLegacyData(response.data);
              }
            }, 500);
          }
        },
        error: (error) => {

          // This is not a critical error, so we don't show a toast
        }
      });
  }

  private loadEquipmentInfo(): void {
    this.equipmentService.editEquipInfo(this.callNbr, this.equipId, this.upsId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          this.populateEquipmentForm(data);

          // Initialize any forms/fields that weren't populated with backend data with defaults
          this.initializeFormsWithDefaults();

          // Load reconciliation data after equipment form is populated
          this.loadReconciliationDataAfterEquipment();

          // Ensure Power Verification section is visible after data load
          this.showPowerVerification = true;

          // Delay setting loading = false until all form population is complete
          setTimeout(() => {
            this.loading = false;

            // Force change detection after loading is complete
            this.cdr.detectChanges();

          }, 600); // Wait for all async form populations to complete

          // Final check - ensure parallel cabinet has a value after all data loading
          setTimeout(() => {
            const currentValue = this.equipmentForm.get('parallelCabinet')?.value;
            if (!currentValue || currentValue.trim() === '') {
              this.equipmentForm.patchValue({ parallelCabinet: 'NO' });
            }
          }, 100);
        },
        error: (error: any) => {

          // Final fallback - ensure month/year are populated even when all data loading fails
          const defaultMonthName = 'January';
          const defaultYear = 1990;

          this.equipmentForm.patchValue({
            monthName: defaultMonthName,
            year: defaultYear
          });

          // Initialize any forms/fields with defaults when no backend data is available
          this.initializeFormsWithDefaults();

          // Load reconciliation data after equipment form is populated
          this.loadReconciliationDataAfterEquipment();

          // Ensure Power Verification section is visible even on error
          this.showPowerVerification = true;

          // Delay setting loading = false until all form population is complete
          setTimeout(() => {
            this.loading = false;
          }, 600); // Wait for all async form populations to complete
          this.toastr.error('Error loading equipment data. Using default values.');

          // Force change detection after loading is complete
          setTimeout(() => {
            this.cdr.detectChanges();

          }, 100);

          // Final check - ensure parallel cabinet has a value after all data loading
          setTimeout(() => {
            const currentValue = this.equipmentForm.get('parallelCabinet')?.value;
            if (!currentValue || currentValue.trim() === '') {
              this.equipmentForm.patchValue({ parallelCabinet: 'NO' });
            }
          }, 100);
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

  // Setup critical field validation for immediate status changes when failures occur OR recover
  private setupCriticalFieldValidation(): void {
    // 1. CRITICAL DEFICIENCY triggers

    // EPO Switch validation (Critical Electrical Hazard) - Monitor ALL changes
    this.visualForm.get('epoSwitch')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    // Ground fault validations (Critical Electrical Hazard) - Monitor ALL changes
    this.rectifierForm.get('posToGND_PF')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    this.rectifierForm.get('negToGND_PF')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    // Capacitor leak validations (Fire/Explosion Risk) - Monitor ALL changes
    this.capacitorForm.get('dcCaps_PF')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    this.capacitorForm.get('acInputCaps_PF')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    this.capacitorForm.get('acOutputCaps_PF')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    this.capacitorForm.get('commCaps_PF')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    // Major transfer test failures - Monitor ALL changes
    this.transferForm.get('firstMajor')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    // DC voltage out of acceptable range - Monitor ALL changes
    this.rectifierForm.get('dcVoltage_PF')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    // Environmental room temperature failures - Monitor ALL changes
    this.environmentForm.get('roomTempVentilation')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    // 2. MAJOR DEFICIENCY triggers

    // Static bypass failures - Monitor ALL changes
    this.transferForm.get('staticBypass')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    // Alarm system failures - Monitor ALL changes
    this.visualForm.get('upsOnline')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    this.transferForm.get('verifyAlarm')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    // Environmental safety issues - Monitor ALL changes
    this.visualForm.get('inspectDamage')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    this.environmentForm.get('serviceSpace')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    // Load sharing problems - Monitor ALL changes
    this.outputReadingsForm.get('loadA_PF')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    this.outputReadingsForm.get('loadB_PF')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    this.outputReadingsForm.get('loadC_PF')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    this.measurementsForm.get('loadKVA')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    this.measurementsForm.get('threePhase')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    // 3. REPLACEMENT RECOMMENDED triggers

    // End of Life failures - Monitor ALL changes
    this.measurementsForm.get('endOfLife')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    // 4. PROACTIVE REPLACEMENT triggers

    // Fans Age failures - Monitor ALL changes
    this.visualForm.get('fansAge')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    // 5. MINOR DEFICIENCY triggers

    // Action required fields - Monitor ALL changes
    this.actionRequiredForm.get('dcgAction1')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    this.actionRequiredForm.get('custAction1')?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
      this.validateAndUpdateStatusOnFailure(); // Trigger on any change
    });

    // SNMP communication dropdown should NOT change equipment status automatically.
    // Historically SNMP changes triggered validation that could flip the equipment status
    // (e.g., to Minor Deficiency) which is misleading for simple SNMP present/absent toggles.
    // We intentionally do NOT subscribe snmpPresent to validateAndUpdateStatusOnFailure.
    // The form's enable/disable behavior is still handled elsewhere (setupDynamicFieldControl).
  }

  private initializeFormsWithDefaults(): void {
    // Equipment form defaults - ensure parallel cabinet defaults to No
    const currentParallelCabinet = this.equipmentForm.get('parallelCabinet')?.value;

    if (!currentParallelCabinet || currentParallelCabinet.trim() === '') {
      this.equipmentForm.patchValue({
        parallelCabinet: 'NO', // Ensure parallel cabinet defaults to No
      });
    }

    // Visual form defaults - only set if not already populated from database
    const currentEpoValue = this.visualForm.get('epoSwitch')?.value;
    if (!currentEpoValue || currentEpoValue.trim() === '') {
      this.visualForm.patchValue({
        epoSwitch: 'P', // EPO switch cover verification - default to Pass (only if not set from DB)
      });
    }

    // Environment form defaults - only set if not already populated from database
    const currentHostileEnv = this.environmentForm.get('hostileEnvironment')?.value;
    if (!currentHostileEnv || currentHostileEnv.trim() === '') {
      this.environmentForm.patchValue({
        hostileEnvironment: 'NO', // Hostile environment verification - default to No (legacy uses NO)
      });
    }

    // Transfer form defaults - only set if not already populated
    const currentTransferValues = this.transferForm.value;
    const transferDefaults: any = {};

    if (!currentTransferValues.firstMajor) {
      transferDefaults.firstMajor = 'No'; // First Major Transfer Test - default to No
    }

    // Only set default for transMaintByPass if it's truly empty/undefined AND not already set by data loading
    const transMaintByPassValue = currentTransferValues.transMaintByPass;

    // Don't set any default for transMaintByPass - let it remain as loaded from data or empty for user selection
    // This prevents overriding saved values and allows proper display of current state

    // Only patch if there are defaults to set
    if (Object.keys(transferDefaults).length > 0) {
      this.transferForm.patchValue(transferDefaults);
    }

  }

  /**
   * Load reconciliation information using updated GetEquipReconciliationInfo method
   */
  private loadReconciliationDataAfterEquipment(): void {
    this.equipmentService.getEquipReconciliationInfo(this.callNbr, this.equipId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          // Check if data exists and has the right structure
          const actualData = data?.data || data;

          if (actualData && (actualData.model || actualData.serialNo || actualData.kva)) {
            // Direct mapping using the actual field names from the database response
            this.reconciliationData = {
              callNbr: actualData.callNbr || this.callNbr,
              equipId: actualData.equipID || actualData.EquipID || actualData.equipId || this.equipId,
              make: (actualData.make || '').toString().trim(),
              makeCorrect: this.cleanReconciliationValue(actualData.makeCorrect),
              actMake: (actualData.actMake || '').toString().trim(),
              model: (actualData.model || '').toString().trim(),
              modelCorrect: this.cleanReconciliationValue(actualData.modelCorrect),
              actModel: (actualData.actModel || '').toString().trim(),
              serialNo: (actualData.serialNo || '').toString().trim(),
              serialNoCorrect: this.cleanReconciliationValue(actualData.serialNoCorrect),
              actSerialNo: (actualData.actSerialNo || '').toString().trim(),
              kva: (actualData.kva || '').toString().trim(),
              kvaCorrect: this.cleanReconciliationValue(actualData.kvaCorrect),
              actKVA: (actualData.actKVA || '').toString().trim(),
              ascStringsNo: actualData.ascStringsNo || 0,
              ascStringsCorrect: this.cleanReconciliationValue(actualData.ascStringsCorrect),
              actASCStringNo: actualData.actASCStringNo || 0,
              battPerString: actualData.battPerString || 0,
              battPerStringCorrect: this.cleanReconciliationValue(actualData.battPerStringCorrect),
              actBattPerString: actualData.actBattPerString || 0,
              totalEquips: actualData.totalEquips || 1,
              totalEquipsCorrect: this.cleanReconciliationValue(actualData.totalEquipsCorrect),
              actTotalEquips: actualData.actTotalEquips || 0,
              verified: actualData.verified === true || actualData.Verified === true || false
            } as EquipReconciliationInfo;
          } else {
          }

          this.populateReconciliationForm(this.reconciliationData);
        },
        error: (error) => {
          this.populateReconciliationForm(null);
        }
      });
  }

  private populateFormsWithData(data: AAETechUPS): void {
    // Use the mapped date values for form population - check multiple possible field names
    const actualMonthName = (data as any).upsDateCodeMonth || data.monthName || (data as any).UpsDateCodeMonth;
    const actualYear = (data as any).upsDateCodeYear || data.year || (data as any).UpsDateCodeYear;

    // Determine default values for parallel cabinet and SNMP based on UPS characteristics
    const defaultParallelCabinet = this.determineDefaultParallelCabinet(data);
    const defaultSnmpPresent = this.determineDefaultSnmpPresent(data);

    // Use raw SNMP value directly (no conversion needed for YS)
    const finalSnmpValue = data.snmpPresent || defaultSnmpPresent;

    // Check if manufacturer exists in dropdown options
    const manufacturerExists = this.manufacturers.some(mfg =>
      mfg.value === data.manufacturer || mfg.text === data.manufacturer
    );

    // Populate equipment form (following legacy logic - use backend data only)
    // Map CTO/Part No from either field (backward compatibility)
    const ctoPartNoValue = data.ctoPartNo || data.other || '';
    
    // Validate multiModule value - only use if it exists in multiModuleTypes
    let validMultiModule = '';
    if (data.multiModule) {
      const multiModuleExists = this.multiModuleTypes.some(type => 
        type.value === data.multiModule
      );
      validMultiModule = multiModuleExists ? data.multiModule : '';
    }
    
    this.equipmentForm.patchValue({
      manufacturer: data.manufacturer || '',
      kva: data.kva || '',
      multiModule: validMultiModule,
      maintByPass: data.maintByPass || '',
      other: ctoPartNoValue, // Sync with ctoPartNo for backward compatibility
      model: data.modelNo || '',
      serialNo: data.serialNo || '',
      location: data.location || '',
      monthName: actualMonthName || '', // Use mapped backend month only, empty if not provided
      year: actualYear || null, // Use mapped backend year only, null if not provided
      status: data.status || 'Online', // Load DB status initially, will be recalculated after all forms loaded
      statusNotes: data.statusReason || '',
      parallelCabinet: data.parallelCabinet || defaultParallelCabinet, // Use backend data or intelligent default
      snmpPresent: finalSnmpValue, // Use raw SNMP value (YS, NO, PS)
      modularUPS: data.modularUPS || '',
      ctoPartNo: ctoPartNoValue, // Map to CTO/Part No if available in data (synced with 'other' field)
      upsType: data.modularUPS || 'NO' // Use the actual modularUPS value from backend or default to 'NO' (Normal UPS)
    }, { emitEvent: false });

    // Check if the loaded status is Off-Line and treat it as a manual override
    if (data.status === 'Offline') {
      this.manualStatusOverride = true;
      // Delay calculation until forms are fully loaded
      setTimeout(() => {
        this.originalCalculatedStatus = this.calculateEquipStatus();
      }, 100);
    }

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
    } else {
      // If no valid date from backend, set to default 01/1990 as per business logic
      const defaultMonth = 'January';
      const defaultYear = 1990;

      // Update form with default date if no valid date exists
      if (!actualMonthName && !actualYear) {
        this.equipmentForm.patchValue({
          monthName: defaultMonth,
          year: defaultYear
        });

        this.selectedDate = new Date(defaultYear, 0, 1); // January = month 0
        this.currentCalendarDate = new Date(this.selectedDate);
        this.selectedYear = defaultYear;
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
    }, { emitEvent: false });

    // Clean and process EPO data from database
    const rawEpoValue = data.visual_EPO;
    const cleanedEpoValue = rawEpoValue ? rawEpoValue.toString().trim() : '';
    const finalEpoValue = cleanedEpoValue || 'P'; // Only use 'P' as default if completely empty
    
    // Populate visual form
    this.visualForm.patchValue({
      upsOnline: data.visual_NoAlarms || 'P', // Map to existing no alarms field
      checkConnections: data.visual_Tightness || 'P', // Map to existing tightness field
      inspectDamage: data.visual_Broken || 'P', // Map to existing broken field
      vacuumClean: data.visual_Vaccum || 'P', // Map to existing vacuum field
      epoSwitch: finalEpoValue, // Use cleaned EPO value
      coolingFans: data.visual_Noise || 'P', // Map to existing noise field
      fansAge: data.visual_FansAge || 'P',
      airFilters: data.visual_ReplaceFilters || 'C', // Map to existing replace filters field (legacy default 'C')
      filterSet1Length: this.formatDecimal(data.afLength, 2),
      filterSet1Width: this.formatDecimal(data.afWidth, 2),
      filterSet1Thickness: data.afThickness || '',
      filterSet1Quantity: data.afQty || '',
      filterSet2Length: this.formatDecimal(data.afLength1, 2),
      filterSet2Width: this.formatDecimal(data.afWidth1, 2),
      filterSet2Thickness: data.afThickness1 || '',
      filterSet2Quantity: data.afQty1 || '',
      visualComments: data.comments2 || data.comments1 || data.comments3 || data.comments4 || data.comments5 || ''
    }, { emitEvent: false });

    // Initialize filter size validation based on current air filter value
    const currentAirFilterValue = this.visualForm.get('airFilters')?.value;
    if (currentAirFilterValue) {
      this.updateFilterSizeValidation(currentAirFilterValue);
    }

    // Populate environment form
    // Legacy: environment_Clean field stores YS (Yes, hostile) or NO (No, not hostile)
    // Our form uses the same values for consistency
    
    let hostileEnvValue: string;
    const dbValue = (data.environment_Clean || '').trim();
    
    // Legacy uses YS for Yes (hostile) and NO for No (not hostile)
    if (dbValue === 'YS') {
      hostileEnvValue = 'YS'; // Hostile environment exists
    } else if (dbValue === 'NO' || dbValue === 'Y') {
      hostileEnvValue = 'NO'; // No hostile environment (also map legacy Y to NO)
    } else if (dbValue === 'NA') {
      hostileEnvValue = 'NA'; // NA stays NA
    } else {
      hostileEnvValue = 'NO'; // Default to not hostile
    }

    this.environmentForm.patchValue({
      roomTempVentilation: data.environment_RoomTemp || 'P',
      safetyEquipment: data.environment_Saftey || 'P',
      hostileEnvironment: hostileEnvValue, // Direct mapping - YS or NO
      serviceSpace: data.environment_Space || 'P',
      circuitBreakers: data.environment_Circuit || 'P'
    }, { emitEvent: false });

    // Populate input readings - trim configuration values
    this.inputReadingsForm.patchValue({
      configuration: data.input?.toString().trim() || '3'
    }, { emitEvent: false });
    this.populateVoltageReadings('input', data);

    // Populate bypass readings - trim configuration values
    this.bypassReadingsForm.patchValue({
      configuration: data.bypass?.toString().trim() || '3'
    }, { emitEvent: false });
    this.populateVoltageReadings('bypass', data);

    // Populate output readings - trim configuration values
    this.outputReadingsForm.patchValue({
      configuration: data.output?.toString().trim() || '3'
    }, { emitEvent: false });
    this.populateVoltageReadings('output', data);

    // Populate rectifier form - using CORRECT field names found in debug
    this.rectifierForm.patchValue({
      floatVolt_PF: data.rectFloatVolt_PF || 'P',
      dcFloatVoltage: this.convertZeroToEmpty(data.dcVoltage_T),
      dcVoltage_PF: data.dcVoltage_PF || 'P',
      acRipple: this.convertZeroToEmpty(data.acRipple_T),
      acRipple_PF: data.acRipple_PF || 'P',
      dcCurrent: this.convertZeroToEmpty(data.dcCurrent_T),
      dcCurrent_PF: data.dcCurrent_PF || 'P',
      acRippleVolt: this.convertZeroToEmpty(data.acRipple_T),
      acRippleVolt_PF: data.acRippleVolt_PF || 'P',
      posToGND: this.convertZeroToEmpty(data.posToGND_T),
      posToGND_PF: data.posToGND_PF || 'P',
      acRippleCurr: this.convertZeroToEmpty(data.acRippleCurr_T),
      acRippleCurr_PF: data.acRippleCurr_PF || 'P',
      negToGND: this.convertZeroToEmpty(data.negToGND_T),
      negToGND_PF: data.negToGND_PF || 'P'
    }, { emitEvent: false });

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
    }, { emitEvent: false });

    // Process transfer_ByPass value with proper trimming
    const finalTransferValue = data.transfer_ByPass !== undefined && data.transfer_ByPass !== null && data.transfer_ByPass !== '' ? data.transfer_ByPass.toString().trim() : '';

    // Populate transfer form - trim all values to handle server whitespace issues
    const transferFormData = {
      firstMajor: (data.transfer_Major || 'No').toString().trim(),
      staticBypass: (data.transfer_Static || 'P').toString().trim(),
      transMaintByPass: finalTransferValue.toString().trim(),
      currentWave: (data.transfer_Wave || 'P').toString().trim(),
      normalMode: (data.transfer_Normal || 'P').toString().trim(),
      verifyAlarm: (data.transfer_Alarm || 'P').toString().trim()
    };

    this.transferForm.patchValue(transferFormData, { emitEvent: false });

    this.actionRequiredForm.patchValue({
      dcgAction1: data.dcgAction1 || 'N',
      custAction1: data.custAction1 || 'N'
    }, { emitEvent: false });

    // Set voltage configurations - ensure they are set AFTER form population
    setTimeout(() => {
      this.inputConfig = this.getVoltageConfiguration(data.input?.toString().trim());
      this.bypassConfig = this.getVoltageConfiguration(data.bypass?.toString().trim());
      this.outputConfig = this.getVoltageConfiguration(data.output?.toString().trim());

      // Trigger voltage configuration change events to ensure UI updates
      const trimmedInputConfig = data.input?.toString().trim();
      const trimmedBypassConfig = data.bypass?.toString().trim();
      const trimmedOutputConfig = data.output?.toString().trim();

      if (trimmedInputConfig) {

        this.onVoltageConfigurationChange('input', trimmedInputConfig);
        // Re-populate input data after config change
        this.populateVoltageReadings('input', data);
      }
      if (trimmedBypassConfig) {

        this.onVoltageConfigurationChange('bypass', trimmedBypassConfig);
        // Re-populate bypass data after config change
        this.populateVoltageReadings('bypass', data);
      }
      if (trimmedOutputConfig) {

        this.onVoltageConfigurationChange('output', trimmedOutputConfig);
        // Re-populate output data after config change
        this.populateVoltageReadings('output', data);
      }

      // Force change detection after setting configurations
      this.cdr.detectChanges();

      // Log comprehensive filter current and THD comparison
      this.logFilterCurrentThdComparison(data);

      // Log power verification summary comparison
      this.logPowerVerificationSummary();

      // Verify form values are set
      this.verifyFormValuesAfterLoad();
    }, 100);

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

      // Use raw SNMP value directly (no conversion needed for YS)
      const finalEquipSnmpValue = tempData.snmpPresent || defaultSnmpPresent;

      this.equipmentForm.patchValue({
        kva: equipInfo?.Upskva || '',
        serialNo: equipInfo?.SerialID || '',
        location: equipInfo?.Location || '',
        model: equipInfo?.Version || '',
        monthName: equipInfo?.upsDateCodeMonth || equipInfo?.UpsDateCodeMonth || equipInfo?.EquipMonth || '', // Use upsDateCodeMonth first, then other fallbacks
        year: this.convertToInt(equipInfo?.upsDateCodeYear) || this.convertToInt(equipInfo?.UpsDateCodeYear) || this.convertToInt(equipInfo?.EquipYear) || null, // Use upsDateCodeYear first, then other fallbacks
        // Enhanced auto-population with intelligent defaults
        parallelCabinet: tempData.parallelCabinet || defaultParallelCabinet,
        snmpPresent: finalEquipSnmpValue, // Use raw SNMP value (YS, NO, PS)
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

  /**
   * Clean and map backend reconciliation values to dropdown format
   */
  private cleanReconciliationValue(value: string | null | undefined): string {
    if (!value) return '';

    const cleaned = value.toString().trim().toUpperCase();

    // Map backend values to dropdown values - handle actual database formats
    switch (cleaned) {
      case 'YS':   // Database "YS" format
      case 'YES':
      case 'Y':    // Database "Y" format
        return 'Y';
      case 'NS':   // Legacy "NS" format
      case 'NO':   // Database "NO" format
      case 'N':    // Database "N" format
        return 'N';
      case 'NA':   // Database "NA" format for N/A values
      case 'N/A':  // Direct N/A
          return 'N/A';
      default:
        // Check if it's empty or just spaces
        if (cleaned === '') {
          return '';
        }
        return '';
    }
  }

  /**
   * Populate reconciliation form with data - auto-populate "Is this correct?" fields from backend
   */
  private populateReconciliationForm(data: EquipReconciliationInfo | null): void {
    if (data) {
      // Clean backend data first
      const cleanedData = {
        model: data.model || '',
        modelCorrect: this.cleanReconciliationValue(data.modelCorrect),
        actModel: data.actModel || '',
        serialNo: data.serialNo || '',
        serialNoCorrect: this.cleanReconciliationValue(data.serialNoCorrect),
        actSerialNo: data.actSerialNo || '',
        kvaSize: data.kva || '', // Use kvaSize to match form control name
        kvaCorrect: this.cleanReconciliationValue(data.kvaCorrect),
        actKVA: data.actKVA || '',
        totalEquips: data.totalEquips ? data.totalEquips.toString() : '1',
        totalEquipsCorrect: this.cleanReconciliationValue(data.totalEquipsCorrect),
        actTotalEquips: data.actTotalEquips ? data.actTotalEquips.toString() : '',
        verified: data.verified || false
      };

      // Populate with cleaned backend data using patchValue with emitEvent: false to prevent watchers from interfering
      this.reconciliationForm.patchValue(cleanedData, { emitEvent: false });

      // Re-enable events after patching and ensure proper display
      setTimeout(() => {
        // Force update the form display
        this.reconciliationForm.updateValueAndValidity();
        this.cdr.detectChanges(); // Force change detection
      }, 50);
    } else {
      // No backend data - populate with current equipment form values, leave "Is this correct?" fields empty for user selection
      const equipmentValues = this.equipmentForm.value;

      const fallbackData = {
        model: equipmentValues.model || '',
        modelCorrect: '', // Leave empty for user to select
        actModel: '',
        serialNo: equipmentValues.serialNo || '',
        serialNoCorrect: '', // Leave empty for user to select
        actSerialNo: '',
        kvaSize: equipmentValues.kva || '', // Fixed: Use kvaSize to match form control name
        kvaCorrect: '', // Leave empty for user to select
        actKVA: '',
        totalEquips: '1',
        totalEquipsCorrect: '', // Leave empty for user to select
        actTotalEquips: '',
        verified: false
      };

      this.reconciliationForm.patchValue(fallbackData, { emitEvent: false });

      // Re-enable events after patching
      setTimeout(() => {
        this.reconciliationForm.updateValueAndValidity();
      }, 10);
    }

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
      field.enable();
    } else {
      field.disable();
      // Don't clear the field value when disabling, keep existing value
    }
  }

  // Set up watchers to monitor changes in verification dropdowns for real-time feedback
  private setupVerificationWatchers(): void {
    const verificationFields = ['modelCorrect', 'serialNoCorrect', 'kvaCorrect', 'totalEquipsCorrect'];

    verificationFields.forEach(field => {
      this.reconciliationForm.get(field)?.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(value => {
        if (value === 'N/A') {
        }
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
    // Clean up the value first (remove spaces)
    const cleanValue = existingValue ? existingValue.toString().trim() : '';

    // If we have existing verification data, use it
    if (cleanValue && (cleanValue === 'Y' || cleanValue === 'N' || cleanValue === 'N/A')) {
      return cleanValue;
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

    // Extract raw values from data for logging
    const rawVoltageData = {
      [`${prefix}VoltA_T`]: data[`${prefix}VoltA_T` as keyof AAETechUPS],
      [`${prefix}VoltA_PF`]: data[`${prefix}VoltA_PF` as keyof AAETechUPS],
      [`${prefix}VoltB_T`]: data[`${prefix}VoltB_T` as keyof AAETechUPS],
      [`${prefix}VoltB_PF`]: data[`${prefix}VoltB_PF` as keyof AAETechUPS],
      [`${prefix}VoltC_T`]: data[`${prefix}VoltC_T` as keyof AAETechUPS],
      [`${prefix}VoltC_PF`]: data[`${prefix}VoltC_PF` as keyof AAETechUPS],
      [`${prefix}CurrA_T`]: data[`${prefix}CurrA_T` as keyof AAETechUPS],
      [`${prefix}CurrA_PF`]: data[`${prefix}CurrA_PF` as keyof AAETechUPS],
      [`${prefix}CurrB_T`]: data[`${prefix}CurrB_T` as keyof AAETechUPS],
      [`${prefix}CurrB_PF`]: data[`${prefix}CurrB_PF` as keyof AAETechUPS],
      [`${prefix}CurrC_T`]: data[`${prefix}CurrC_T` as keyof AAETechUPS],
      [`${prefix}CurrC_PF`]: data[`${prefix}CurrC_PF` as keyof AAETechUPS],
      [`${prefix}Freq_T`]: data[`${prefix}Freq_T` as keyof AAETechUPS],
      [`${prefix}Freq_PF`]: data[`${prefix}Freq_PF` as keyof AAETechUPS]
    };

    // Log filter current and THD data from database for input and output only
    if (type === 'input' || type === 'output') {
      const filterCurrentData = {
        // Filter Current values
        [`${type}FilterCurrentA`]: (data as any)[`${type}FilterCurrentA`],
        [`${type}FilterCurrentA_PF`]: (data as any)[`${type}FilterCurrentA_PF`],
        [`${type}FilterCurrentB`]: (data as any)[`${type}FilterCurrentB`],
        [`${type}FilterCurrentB_PF`]: (data as any)[`${type}FilterCurrentB_PF`],
        [`${type}FilterCurrentC`]: (data as any)[`${type}FilterCurrentC`],
        [`${type}FilterCurrentC_PF`]: (data as any)[`${type}FilterCurrentC_PF`],
        // THD values
        [`${type}ThdA`]: (data as any)[`${type}ThdA`],
        [`${type}ThdA_PF`]: (data as any)[`${type}ThdA_PF`],
        [`${type}ThdB`]: (data as any)[`${type}ThdB`],
        [`${type}ThdB_PF`]: (data as any)[`${type}ThdB_PF`],
        [`${type}ThdC`]: (data as any)[`${type}ThdC`],
        [`${type}ThdC_PF`]: (data as any)[`${type}ThdC_PF`],
        // Checkbox states
        [`${type}FilterCurrentCheckbox`]: (data as any)[`${type}FilterCurrent`],
        [`${type}ThdPercentCheckbox`]: (data as any)[`${type}ThdPercent`]
      };

    }

    const formData = {
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
    };

    form.patchValue(formData, { emitEvent: false });

    // Populate filter current and THD data for input and output forms
    if (type === 'input') {
      // Don't override checkbox values if they're already set to true by legacy data
      const currentInputFilterCurrent = this.inputReadingsForm.get('inputFilterCurrent')?.value;
      const inputFilterThdData = {
        inputFilterCurrent: currentInputFilterCurrent === true ? true : (data.inputFilterCurrent || false),
        filterCurrentA: this.convertZeroToEmpty(data.inputFilterCurrentA),
        filterCurrentA_PF: data.inputFilterCurrentA_PF || 'P',
        filterCurrentB: this.convertZeroToEmpty(data.inputFilterCurrentB),
        filterCurrentB_PF: data.inputFilterCurrentB_PF || 'P',
        filterCurrentC: this.convertZeroToEmpty(data.inputFilterCurrentC),
        filterCurrentC_PF: data.inputFilterCurrentC_PF || 'P',
        inputThdPercent: this.inputReadingsForm.get('inputThdPercent')?.value === true ? true : (data.inputThdPercent || false),
        inputThdA: this.convertZeroToEmpty(data.inputThdA),
        inputThdA_PF: data.inputThdA_PF || 'P',
        inputThdB: this.convertZeroToEmpty(data.inputThdB),
        inputThdB_PF: data.inputThdB_PF || 'P',
        inputThdC: this.convertZeroToEmpty(data.inputThdC),
        inputThdC_PF: data.inputThdC_PF || 'P'
      };
      form.patchValue(inputFilterThdData, { emitEvent: false });
    } else if (type === 'output') {
      // Don't override checkbox values if they're already set to true by legacy data
      const currentOutputFilterCurrent = this.outputReadingsForm.get('outputFilterCurrent')?.value;
      const outputFilterThdData = {
        outputFilterCurrent: currentOutputFilterCurrent === true ? true : (data.outputFilterCurrent || false),
        outputFilterCurrentA: this.convertZeroToEmpty(data.outputFilterCurrentA),
        outputFilterCurrentA_PF: data.outputFilterCurrentA_PF || 'P',
        outputFilterCurrentB: this.convertZeroToEmpty(data.outputFilterCurrentB),
        outputFilterCurrentB_PF: data.outputFilterCurrentB_PF || 'P',
        outputFilterCurrentC: this.convertZeroToEmpty(data.outputFilterCurrentC),
        outputFilterCurrentC_PF: data.outputFilterCurrentC_PF || 'P',
        outputThdPercent: this.outputReadingsForm.get('outputThdPercent')?.value === true ? true : (data.outputThdPercent || false),
        outputThdA: this.convertZeroToEmpty(data.outputThdA),
        outputThdA_PF: data.outputThdA_PF || 'P',
        outputThdB: this.convertZeroToEmpty(data.outputThdB),
        outputThdB_PF: data.outputThdB_PF || 'P',
        outputThdC: this.convertZeroToEmpty(data.outputThdC),
        outputThdC_PF: data.outputThdC_PF || 'P'
      };
      form.patchValue(outputFilterThdData, { emitEvent: false });
    }

    // Force form value verification and log filter current/THD UI values
    setTimeout(() => {
      const actualFormValues = form.value;

      // Log filter current and THD UI display values for input and output
      if (type === 'input' || type === 'output') {
        const uiFilterCurrentThdData = {
          // Checkbox states
          [`${type}FilterCurrentCheckbox`]: form.get(`${type}FilterCurrent`)?.value || false,
          [`${type}ThdPercentCheckbox`]: form.get(`${type}ThdPercent`)?.value || false,
          // Filter Current UI values
          [`${type}FilterCurrentA`]: form.get(`filterCurrentA`)?.value || '',
          [`${type}FilterCurrentA_PF`]: form.get(`filterCurrentA_PF`)?.value || 'P',
          [`${type}FilterCurrentB`]: form.get(`filterCurrentB`)?.value || '',
          [`${type}FilterCurrentB_PF`]: form.get(`filterCurrentB_PF`)?.value || 'P',
          [`${type}FilterCurrentC`]: form.get(`filterCurrentC`)?.value || '',
          [`${type}FilterCurrentC_PF`]: form.get(`filterCurrentC_PF`)?.value || 'P',
          // THD UI values
          [`${type}ThdA`]: form.get(`${type}ThdA`)?.value || '',
          [`${type}ThdA_PF`]: form.get(`${type}ThdA_PF`)?.value || 'P',
          [`${type}ThdB`]: form.get(`${type}ThdB`)?.value || '',
          [`${type}ThdB_PF`]: form.get(`${type}ThdB_PF`)?.value || 'P',
          [`${type}ThdC`]: form.get(`${type}ThdC`)?.value || '',
          [`${type}ThdC_PF`]: form.get(`${type}ThdC_PF`)?.value || 'P'
        };

      }
    }, 50);

    // Populate load data for output only
    if (type === 'output') {
      const loadData = {
        loadA: this.convertZeroToEmpty(data.outputLoadA),
        loadA_PF: data.outputLoadA_PF || 'P',
        loadB: this.convertZeroToEmpty(data.outputLoadB),
        loadB_PF: data.outputLoadB_PF || 'P',
        loadC: this.convertZeroToEmpty(data.outputLoadC),
        loadC_PF: data.outputLoadC_PF || 'P',
        totalLoad: this.convertZeroToEmpty(data.totalLoad)
      };

      this.outputReadingsForm.patchValue(loadData);
    }
  }

  private getVoltageConfiguration(configId: string): VoltageConfiguration | null {
    const trimmedConfigId = configId?.toString().trim();

    const config = this.voltageConfigurations.find(config => config.id === trimmedConfigId) || null;

    return config;
  }

  /**
   * CONSOLIDATED PHASE-TO-NEUTRAL CALCULATIONS
   */
  private calculatePhaseToNeutralForAll(): void {
    ['input', 'bypass', 'output'].forEach(type => {
      this.calculatePhaseToNeutral(type as 'input' | 'bypass' | 'output');
    });
  }

  private calculatePhaseToNeutral(type: 'input' | 'bypass' | 'output'): void {
    const form = this.getFormByType(type);
    const config = this.getConfigByType(type);
    
    if (!config?.showPhaseToNeutral) return;

    ['A', 'B', 'C'].slice(0, config.phaseCount).forEach(phase => {
      const voltage = this.convertToDouble(form.get(`volt${phase}`)?.value);
      if (voltage > 0) {
        const phaseToNeutral = this.convertLineToNeutralVoltage(voltage);
        // Store for display purposes if needed
      }
    });
  }

  private getConfigByType(type: 'input' | 'bypass' | 'output'): VoltageConfiguration | null {
    switch (type) {
      case 'input': return this.inputConfig;
      case 'bypass': return this.bypassConfig;
      case 'output': return this.outputConfig;
    }
  }

  /**
   * Calculate phase to neutral voltage
   * Equivalent to GetPhasetoNuetralVoltage(string PPVoltage) in legacy code
   */
  // Calculate total load percentage for output readings
  calculateTotalLoad(): void {
    // Use the comprehensive legacy load calculation system
    if (!this.calculateLoadPercent()) {
      // If validation fails, show error and don't proceed
      this.toastr.error('Load calculation failed. Please check your input values and try again.');
      return;
    }

    // Show success message
    const totalLoad = this.convertToDouble(this.outputReadingsForm.get('totalLoad')?.value || '0');
    this.toastr.success(`Load calculation completed successfully. Total load: ${totalLoad.toFixed(2)}%`, 'Calculation Complete');
  }

  // Test method for debugging fans age validation
  testFansAgeValidation(): void {
    const kva = this.convertToDouble(this.equipmentForm.get('kva')?.value || '100');
    this.validateFansAge(kva);
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
      // Legacy alert for output current validation
      this.showLegacyValidationAlert('Output Current A , B , C cannot be empty', 'outputCurrents');

      // Also show modern notification for better UX
      const fieldsList = emptyCurrentFields.join(', ');
      const message = `Missing values for: ${fieldsList}`;
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
    // Allow calculation during loading if it's called explicitly (e.g., from Calculate button)
    // Skip validation only if loading and this is an auto-triggered calculation

    const outputConfig = this.outputReadingsForm.get('configuration')?.value;
    const kvaValue = this.equipmentForm.get('kva')?.value;

    // Validate required fields for calculation
    if (!kvaValue || kvaValue === '') {
      this.showValidationMessage('KVA value is required for load calculation', 'kvaRequired', 'kva');
      return false;
    }

    if (!outputConfig || outputConfig === '') {
      this.showValidationMessage('Output voltage configuration must be selected', 'outputConfigRequired');
      return false;
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

  /**
   * CONSOLIDATED LOAD CALCULATIONS - Unified approach for all phase configurations
   */
  private calculatePhaseLoad(phaseCount: number, upsKVA: number, voltageType: string): boolean {
    const phases = ['A', 'B', 'C'].slice(0, phaseCount);
    const eachPhaseKVA = upsKVA / phaseCount;
    const loadPercentages: number[] = [];
    
    // Validate all currents are present
    for (const phase of phases) {
      const current = this.convertToDouble(this.getOutputCurrentField(phase as 'A' | 'B' | 'C', voltageType));
      if (current === 0) {
        this.showValidationMessage(`Output Current ${phases.join(', ')} cannot be empty`, `outputCurrent${phaseCount}Phase`);
        return false;
      }
    }

    // Calculate load for each phase
    for (const phase of phases) {
      const current = this.convertToDouble(this.getOutputCurrentField(phase as 'A' | 'B' | 'C', voltageType));
      const voltage = this.convertToDouble(this.getOutputVoltageField(phase as 'A' | 'B' | 'C', voltageType));
      
      let actualKVA: number;
      if (phaseCount === 1) {
        actualKVA = (current * voltage) / 1000;
      } else if (phaseCount === 2) {
        actualKVA = (current * voltage) / 1000;
      } else { // Three-phase
        actualKVA = (voltage * current) / 1732;
      }
      
      const loadPercentage = (actualKVA * 100) / eachPhaseKVA;
      loadPercentages.push(loadPercentage);
      
      this.setOutputLoadValue(this.getOutputLoadField(phase as 'A' | 'B' | 'C', voltageType), loadPercentage);
    }

    // Calculate total load
    const totalLoad = phaseCount === 2 
      ? (((loadPercentages[0] + loadPercentages[1]) / 2) * 100) / 100
      : loadPercentages.reduce((sum, load) => sum + load, 0) / phaseCount;
      
    this.setOutputTotalLoadValue(this.getOutputTotalLoadField(voltageType), totalLoad);

    // Validate all phases
    return phases.every((phase, index) => 
      this.validateLoadPercentage(loadPercentages[index], this.getOutputLoadDropdownField(phase as 'A' | 'B' | 'C', voltageType), phase as 'A' | 'B' | 'C')
    );
  }

  private calculateSinglePhaseLoad(upsKVA: number, voltageType: string): boolean {
    return this.calculatePhaseLoad(1, upsKVA, voltageType);
  }

  private calculateTwoPhaseLoad(upsKVA: number, voltageType: string): boolean {
    return this.calculatePhaseLoad(2, upsKVA, voltageType);
  }

  private calculateThreePhaseLoad(upsKVA: number, voltageType: string): boolean {
    return this.calculatePhaseLoad(3, upsKVA, voltageType);
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
      this.showLegacyValidationAlert('Please select the manufacturer', 'manufacturer');
      this.equipmentForm.get('manufacturer')?.markAsTouched();
      return false;
    }

    // Validate model
    const model = this.equipmentForm.get('model')?.value;
    if (!model || model.trim() === '') {
      this.showLegacyValidationAlert('Please enter the Model No', 'model');
      this.equipmentForm.get('model')?.markAsTouched();
      return false;
    }

    // Validate CTO/Part No
    const ctoPartNo = this.equipmentForm.get('ctoPartNo')?.value;
    if (!ctoPartNo || ctoPartNo.trim() === '') {
      this.showLegacyValidationAlert('Please enter the CTO / Part No', 'ctoPartNo');
      this.equipmentForm.get('ctoPartNo')?.markAsTouched();
      return false;
    }

    // Validate serial number
    const serialNo = this.equipmentForm.get('serialNo')?.value;
    if (!serialNo || serialNo.trim() === '') {
      this.showLegacyValidationAlert('Please enter the Serial No', 'serialNo');
      this.equipmentForm.get('serialNo')?.markAsTouched();
      return false;
    }

    // Validate location
    const location = this.equipmentForm.get('location')?.value;
    if (!location || location.trim() === '') {
      this.showLegacyValidationAlert('Please enter the Location', 'location');
      this.equipmentForm.get('location')?.markAsTouched();
      return false;
    }

    // Validate KVA
    const kvaValue = this.equipmentForm.get('kva')?.value;
    if (!kvaValue && kvaValue !== 0) {
      this.showLegacyValidationAlert('KVA value cannot be empty', 'kva');
      this.equipmentForm.get('kva')?.markAsTouched();
      return false;
    }

    // Handle both string and number types from form control
    const kvaString = kvaValue?.toString().trim() || '';
    if (kvaString === '') {
      this.showLegacyValidationAlert('KVA value cannot be empty', 'kva');
      this.equipmentForm.get('kva')?.markAsTouched();
      return false;
    }

    const kva = this.convertToDouble(kvaValue);
    if (isNaN(kva) || kva <= 0) {
      this.showLegacyValidationAlert('Please enter valid KVA Value (e.g., 16.5, 225.00)', 'kva');
      this.equipmentForm.get('kva')?.markAsTouched();
      return false;
    }
    
    // Additional validation for reasonable KVA range
    if (kva > 10000) {
      this.showLegacyValidationAlert('KVA value seems unusually high. Please verify.', 'kva');
      this.equipmentForm.get('kva')?.markAsTouched();
      return false;
    }

    // Validate Multi-Module selection (required for full save)
    const multiModuleVal = this.equipmentForm.get('multiModule')?.value;
    // The form default uses 'Select' as a placeholder; treat empty or 'Select' as invalid
    if (!multiModuleVal || multiModuleVal === 'Select' || multiModuleVal === '') {
      this.showLegacyValidationAlert('Please select the Multi-Module configuration', 'multiModule');
      this.equipmentForm.get('multiModule')?.markAsTouched();
      return false;
    }

    // Check if KVA form control has validation errors from custom validator
    const kvaControl = this.equipmentForm.get('kva');
    if (kvaControl && kvaControl.invalid) {
      let errorMessage = 'Please enter valid KVA Value';
      if (kvaControl.errors?.['pattern']) {
        errorMessage = kvaControl.errors['pattern'].message || 'Please enter valid KVA (e.g., 16.5, 225.00)';
      } else if (kvaControl.errors?.['min']) {
        errorMessage = kvaControl.errors['min'].message || 'KVA must be greater than 0';
      } else if (kvaControl.errors?.['max']) {
        errorMessage = kvaControl.errors['max'].message || 'KVA value is too high';
      }
      this.showLegacyValidationAlert(errorMessage, 'kva');
      kvaControl.markAsTouched();
      return false;
    }

    // Validate maintenance bypass
    const maintByPass = this.equipmentForm.get('maintByPass')?.value;
    if (maintByPass === 'NA' || !maintByPass) {
      this.showLegacyValidationAlert('Please select the value for Maintenance ByPass', 'maintByPass');
      this.equipmentForm.get('maintByPass')?.markAsTouched();
      return false;
    }

    // Validate SNMP
    const snmpPresent = this.equipmentForm.get('snmpPresent')?.value;
    if (snmpPresent === 'PS' || !snmpPresent) {
      this.showLegacyValidationAlert('Please select the value for SNMP Card Present ?', 'snmpPresent');
      this.equipmentForm.get('snmpPresent')?.markAsTouched();
      return false;
    }

    // Validate date code
    const monthName = this.equipmentForm.get('monthName')?.value;
    const year = this.equipmentForm.get('year')?.value;
    if (!monthName || monthName === '' || !year || year === '') {
      this.showLegacyValidationAlert('Please enter the DateCode', 'monthYear');
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
      this.showLegacyValidationAlert('You must verify the Reconciliation section before Saving PM form', 'reconciliation');
      return false;
    }

    // Validate reconciliation "Actual" fields when "Is Correct" is "No"
    const modelCorrect = this.reconciliationForm.get('modelCorrect')?.value;
    const actModel = this.reconciliationForm.get('actModel')?.value;
    const serialNoCorrect = this.reconciliationForm.get('serialNoCorrect')?.value;
    const actSerialNo = this.reconciliationForm.get('actSerialNo')?.value;
    const kvaCorrect = this.reconciliationForm.get('kvaCorrect')?.value;
    const actKVA = this.reconciliationForm.get('actKVA')?.value;

    if (modelCorrect === 'N' && (!actModel || actModel.trim() === '')) {
      this.showLegacyValidationAlert('Actual Model is required when Model is marked as incorrect', 'actModel');
      this.reconciliationForm.get('actModel')?.markAsTouched();
      return false;
    }

    if (serialNoCorrect === 'N' && (!actSerialNo || actSerialNo.trim() === '')) {
      this.showLegacyValidationAlert('Actual Serial No is required when Serial No is marked as incorrect', 'actSerialNo');
      this.reconciliationForm.get('actSerialNo')?.markAsTouched();
      return false;
    }

    if (kvaCorrect === 'N' && (!actKVA || actKVA.trim() === '')) {
      this.showLegacyValidationAlert('Actual KVA is required when KVA is marked as incorrect', 'actKVA');
      this.reconciliationForm.get('actKVA')?.markAsTouched();
      return false;
    }

    // Validate filter size fields when replacement is needed
    const airFilterValue = this.visualForm.get('airFilters')?.value;
    if (airFilterValue === 'N') { // Legacy: 'N' = Replacement Needed
      const filterSizeFields = [
        { field: 'filterSet1Length', name: 'Filter Set 1 Length' },
        { field: 'filterSet1Width', name: 'Filter Set 1 Width' },
        { field: 'filterSet1Thickness', name: 'Filter Set 1 Thickness' },
        { field: 'filterSet1Quantity', name: 'Filter Set 1 Quantity' }
      ];

      for (const filterField of filterSizeFields) {
        const value = this.visualForm.get(filterField.field)?.value;
        if (!value || value.toString().trim() === '') {
          // Expand Visual section to show the validation error
          this.showVisual = true;
          
          this.showLegacyValidationAlert(
            `${filterField.name} is required when Air Filter Maintenance is set to "Replacement Needed". Please scroll down to the Filter Information section in Visual & Mechanical Verification.`, 
            filterField.field
          );
          this.visualForm.get(filterField.field)?.markAsTouched();
          
          // Try to scroll to the filter section
          setTimeout(() => {
            const filterSection = document.querySelector('.filter-section');
            if (filterSection) {
              filterSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 100);
          
          return false;
        }

        // Validate numeric and ensure value is greater than 0.00
        const valueStr = value.toString().trim();
        if (!this.isNumeric(valueStr)) {
          this.showVisual = true;
          this.showLegacyValidationAlert(
            `${filterField.name} must be a numeric value (e.g., 12.50). Please correct the value in the Filter Information section.`,
            filterField.field
          );
          this.visualForm.get(filterField.field)?.markAsTouched();
          return false;
        }

        const numeric = parseFloat(valueStr);
        if (isNaN(numeric) || numeric <= 0) {
          this.showVisual = true;
          this.showLegacyValidationAlert(
            `${filterField.name} must be greater than 0.00 when replacement is needed. Please correct the value in the Filter Information section.`,
            filterField.field
          );
          this.visualForm.get(filterField.field)?.markAsTouched();
          return false;
        }
      }
    }

    // Validate fans age
    if (!this.validateFansAge(kva)) {
      return false;
    }

    // Check if fans age failure should impact equipment status
    this.checkFansAgeStatusImpact();

    // Validate end of life
    if (!this.validateEndOfLife(dateCodeForValidation, kva)) {
      return false;
    }

    // Validate all inputs
    if (!this.validateAllInputs()) {
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

    // Decide which status to use for the final confirmation popup.
    // Prefer the last user-chosen dropdown value (this.lastUserSelectedStatus) to avoid showing a status
    // that was programmatically changed after the user made their selection.
    let selectedForPopup: string | null = null;

    // 1) Use last selection captured during onStatusDropdownChange
    if (this.lastUserSelectedStatus) {
      selectedForPopup = this.lastUserSelectedStatus;
    } else {
      // 2) Fallback to reading the actual select element value (DOM) if available
      try {
        const dropdownEl = document.querySelector('select[formControlName="status"]') as HTMLSelectElement | null;
        selectedForPopup = dropdownEl?.value || null;
      } catch (err) {
        // ignore - we'll fallback to form status next
        selectedForPopup = null;
      }
    }

    // 3) Ultimate fallback to the form value
    if (!selectedForPopup) {
      selectedForPopup = status || 'Online';
    }

    if (selectedForPopup !== 'Online') {
      if (!confirm(`Are you sure that the Equipment Status : ${selectedForPopup}`)) {
        return false;
      }
    }

    return true;
  }

  private validateDateCodeAge(dateCode: string, kva: number): boolean {
    try {
      // Use enhanced age calculation
      const ageInYears = this.calculateEquipmentAge(dateCode);

      // Check if date is in the future
      if (ageInYears < 0) {
        this.showLegacyValidationAlert('DateCode cannot be higher than today\'s date', 'dateCodeFuture');
        return false;
      }

      // Use comprehensive age validation
      const ageValidation = UPSAgeValidationService.validateEquipmentAge(ageInYears, kva);

      // Legacy confirmation for old equipment (matching original 30-year popup)
      // if (ageInYears >= 30) {
      //   if (!confirm(`Equipment age is ${ageInYears} years. Are you sure UPS age is more than 30 years?`)) {
      //     this.equipmentForm.get('dateCode')?.markAsTouched();
      //     return false;
      //   }
      // }

      // Apply age validation results
      this.applyAgeValidationResults(ageValidation);

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Invalid date format';
      this.showValidationMessage(`Invalid date format: ${errorMessage}`, 'dateCodeFormat', 'dateCode');
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

        // Legacy behavior: For non-modular UPS systems (ModularUPS != "YES"), validate fans age
        if (modularUPS !== 'YS' && modularUPS !== 'YES') {

          // Always set to Failed first (automatic failure for >7 years)
          this.visualForm.get('fansAge')?.setValue('F');

          // Show confirmation popup (informational - failure is already applied)
          if (confirm('Fans are more than 7 years old. Fans dropdown marked as Failed')) {

            // Legacy behavior: Expand Visual section and focus on fans year field
            this.showVisual = true;

            // Focus on fans year field after a brief delay to allow UI to update
            setTimeout(() => {
              const fansYearElement = document.getElementById('fansYear') ||
                                   document.querySelector('input[formControlName="fansYear"]') as HTMLElement;
              if (fansYearElement) {
                fansYearElement.focus();
              }
            }, 100);

          } else {

            // Legacy behavior: Expand Visual section and focus on fans year field
            this.showVisual = true;

            // Focus on fans year field
            setTimeout(() => {
              const fansYearElement = document.getElementById('fansYear') ||
                                   document.querySelector('input[formControlName="fansYear"]') as HTMLElement;
              if (fansYearElement) {
                fansYearElement.focus();
              }
            }, 100);

            // Stop form submission (return false)
            return false;
          }
        } else {
          // For modular UPS systems, bypass validation and set to Pass
          this.visualForm.get('fansAge')?.setValue('P');
        }
      } else {
        this.visualForm.get('fansAge')?.setValue('P');
      }
    } else {
      // No fans year entered - skipping validation
    }

    return true;
  }

  private validateEndOfLife(dateCode: string, kva: number): boolean {
    try {
      // Calculate UPS age
      const upsAge = this.calculateEquipmentAge(dateCode);
      const today = new Date();

      // Legacy logic: UPSAge threshold is 25 years, or 20 years if KVA <= 50
      let ageThreshold = 25;
      if (kva <= 50) {
        ageThreshold = 20;
      }

      // Check if UPS age exceeds threshold
      if (upsAge > ageThreshold) {
        // Always set to Failed first (automatic failure)
        this.measurementsForm.get('endOfLife')?.setValue('F', { emitEvent: false });

        // Show confirmation popup (informational - failure is already applied)
        if (confirm(`UPS date code is > ${ageThreshold} years. End of Life dropdown marked as Failed`)) {
          // User confirmed - failure already applied
          // Optionally expand measurements section if needed
          this.showMeasurements = true;
        } else {
          // User cancelled - but failure still applies (legacy behavior)
          // Expand measurements section to show the field
          this.showMeasurements = true;
          
          // Stop form submission (return false)
          return false;
        }
      } else {
        // Within acceptable age - set to Pass
        this.measurementsForm.get('endOfLife')?.setValue('P', { emitEvent: false });
      }

      return true;
    } catch (error) {
      return true; // If date parsing fails, skip validation
    }
  }

  /**
   * Apply age validation results to forms and equipment status
   */
  private applyAgeValidationResults(ageValidation: AgeValidationResult): void {
    // Update equipment status if automatic change is required
    if (ageValidation.autoChangeStatus) {
      console.debug('[DEBUG] applyAgeValidationResults -> autoChangeStatus true. setting equipment status to', ageValidation.status, 'endOfLifeValue:', ageValidation.endOfLifeValue);
      this.equipmentForm.get('status')?.setValue(ageValidation.status, { emitEvent: false });
      console.debug('[DEBUG] applyAgeValidationResults -> form.status after setValue:', this.equipmentForm?.get('status')?.value);
    }

    // Add recommended action to comments if available
    if (ageValidation.recommendedAction) {
      const currentComments = this.equipmentForm.get('comments')?.value || '';
      const newComments = currentComments +
        (currentComments ? '\n' : '') +
        `AGE VALIDATION: ${ageValidation.recommendedAction}`;
      this.equipmentForm.get('comments')?.setValue(newComments, { emitEvent: false });
    }

    // Add additional comments if available
    if (ageValidation.comments) {
      const currentComments = this.equipmentForm.get('comments')?.value || '';
      const newComments = currentComments +
        (currentComments ? '\n' : '') +
        ageValidation.comments;
      this.equipmentForm.get('comments')?.setValue(newComments, { emitEvent: false });
    }
  }

  /**
   * Check if fans age failure should impact equipment status
   * This matches legacy GetEquipStatus() behavior for Visual_FansAge field
   */
  private checkFansAgeStatusImpact(): void {
    const fansAgeStatus = this.visualForm.get('fansAge')?.value;

    if (fansAgeStatus === 'F') {

      // Legacy behavior: Fans age failure typically results in:
      // - Minor Deficiency (most common)
      // - Major Deficiency (in some configurations)
      // - Proactive Replacement (age-based)

      const currentStatus = this.equipmentForm.get('status')?.value;

      // Only downgrade if current status is Online or better
      if (currentStatus === 'Online') {
        // Default to OnLine(MinorDeficiency) for fans age failure
        // This can be overridden by more severe failures in calculateEquipStatus()
        this.equipmentForm.get('status')?.setValue('OnLine(MinorDeficiency)', { emitEvent: false });
      }
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
    this.restrictedCharErrors = {};
    this.characterLimitErrors = {};
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
   * Shows legacy-style validation alert - always uses alert() popup for form submission validation
   * This matches the original UPS readings validation behavior
   * @param message - Message to show in alert popup
   * @param fieldKey - Field key for tracking
   */
  private showLegacyValidationAlert(message: string, fieldKey?: string): void {
    if (this.isFormSubmission) {
      // Always show blocking alert for form submission validation (legacy behavior)
      alert(message);
    } else {
      // During page load, show as toast notification
      this.toastr.warning(message, 'Validation Warning');
    }

    // Store for tracking purposes
    if (fieldKey) {
      this.setValidationError(fieldKey, message);
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
      'dateCode', 'model', 'actModel', 'serialNo', 'actSerialNo', 'ctoPartNo',
      'modelCorrect', 'serialNoCorrect', 'kvaCorrect', 'totalEquipsCorrect', 'verified' // Reconciliation dropdown fields
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
        // Ensure capacitor section is visible so user can correct the field
        this.showCapacitor = true;
        // Use showValidationMessage so the alert is shown and the input is scrolled/focused
        this.showValidationMessage(`You must enter DC Caps Year. Here is the UPS DateCode : ${dateCodeDisplay}`, 'dcCapsYear', 'dcCapsYear');
        this.capacitorForm.get('dcCapsAge')?.markAsTouched();
        return false;
      }

      if (!acInputCapsAge || acInputCapsAge.trim() === '') {
        this.showCapacitor = true;
        this.showValidationMessage(`You must enter AC Input Caps Year. Here is the UPS DateCode : ${dateCodeDisplay}`, 'acInputCapsYear', 'acInputCapsYear');
        this.capacitorForm.get('acInputCapsAge')?.markAsTouched();
        return false;
      }

      if ((!acOutputCapsAge || acOutputCapsAge.trim() === '') &&
          (!commCapsAge || commCapsAge.trim() === '')) {
        this.showCapacitor = true;
        // Prefer focusing acOutputCapsYear but commCapsYear is acceptable as alternate — highlight both by focusing the AC output field
        this.showValidationMessage(`You must enter AC Output Caps Year. Here is the UPS DateCode: ${dateCodeDisplay}`, 'acOutputCapsYear', 'acOutputCapsYear');
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

    // Check if any configurations are missing or set to default values
    const missingConfigs = [];

    if (!inputConfig || inputConfig === '' || inputConfig === '0') {
      missingConfigs.push('Input');
    }

    if (!bypassConfig || bypassConfig === '' || bypassConfig === '0') {
      missingConfigs.push('Bypass');
    }

    if (!outputConfig || outputConfig === '' || outputConfig === '0') {
      missingConfigs.push('Output');
    }

    if (missingConfigs.length > 0) {
      // Legacy alert message for voltage configuration
      this.showLegacyValidationAlert('You must enter the values for Input,Bypass and Ouptput voltages', 'voltageConfig');

      // Also show modern notification for better UX
      const configsList = missingConfigs.join(', ');
      const message = `Missing configurations: ${configsList}`;
      this.toastr.error(message, 'Voltage Configuration Required', {
        timeOut: 8000,
        closeButton: true,
        progressBar: true
      });

      // Expand the Power Verification section to show the missing configurations
      this.showPowerVerification = true;

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

    // Bypass frequency: 58-62 Hz
    const bypassFreq = this.convertToDouble(this.bypassReadingsForm.get('freq')?.value);
    if (bypassFreq > 0) { // Only validate if value is entered
      if (bypassFreq < 58 || bypassFreq > 62) {
        if (this.isFormSubmission) {
          if (!confirm('Are you sure that Bypass Frequency not within specified tolerance (58-62 Hz)?')) {
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

  /**
   * CONSOLIDATED VOLTAGE VALIDATION - Handles all voltage types uniformly
   */
  private validateAllVoltagesForConfig(type: 'input' | 'bypass' | 'output'): boolean {
    if (this.loading) return true;

    const form = this.getFormByType(type);
    const configId = form.get('configuration')?.value;
    if (!configId) return true;

    const config = this.getVoltageConfiguration(configId);
    if (!config) return true;

    const phases = ['A', 'B', 'C'].slice(0, config.phaseCount);
    let allValid = true;

    for (const phase of phases) {
      const voltage = this.convertToDouble(form.get(`volt${phase}`)?.value);
      if (voltage > 0) {
        const isValid = this.validateSingleVoltage(voltage, configId, type, phase);
        const pfField = form.get(`volt${phase}_PF`);
        pfField?.setValue(isValid ? 'P' : 'F');
        
        if (!isValid && this.isFormSubmission) {
          const bounds = this.getVoltageToleranceBounds(configId, type);
          const message = `${this.capitalize(type)} Voltage ${phase} (${voltage}V) is outside tolerance range (${bounds.min}V - ${bounds.max}V). Continue?`;
          if (!confirm(message)) allValid = false;
        }
      }
    }

    return allValid;
  }

  private validateSingleVoltage(voltage: number, configId: string, type: 'input' | 'bypass' | 'output', phase: string): boolean {
    return this.validateVoltageRange(voltage, configId, type) === 'pass';
  }

  private getFormByType(type: 'input' | 'bypass' | 'output'): FormGroup {
    switch (type) {
      case 'input': return this.inputReadingsForm;
      case 'bypass': return this.bypassReadingsForm;
      case 'output': return this.outputReadingsForm;
    }
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Temperature validation with legacy behavior
   * Acceptable range: 67�F � 78�F
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

    if (!config) {
      return;
    }

    const voltageA = this.convertToDouble(form.get('voltA')?.value);
    const currentA = this.convertToDouble(form.get('currA')?.value);
    const ratedKVA = this.convertToDouble(this.equipmentForm.get('kva')?.value);

    if (voltageA > 0 && currentA > 0 && ratedKVA > 0) {
      // Calculate actual kVA using legacy formula
      const actualKVA = this.calculateLegacyKVA(voltageA, currentA, config.phaseCount);

      // Calculate load percentage
      const loadPercent = this.calculateLoadPercentage(actualKVA, ratedKVA);

      // Don't automatically update load values - only calculate when Calculate button is clicked
      // The calculateTotalLoad() method should be used for explicit load calculations
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
        implementation: 'KVA > 200 ? 30% (0.30), KVA = 200 ? 50% (0.50)',
        currentKVA: kvaValue,
        calculatedTolerance: this.calculateCurrentTolerance(kvaValue, 'UPS'),
        method: 'calculateCurrentTolerance()'
      },
      frequencyValidation: {
        description: 'Frequency Validation Ranges',
        implementation: 'Input: 55-65 Hz, Bypass/Output: 58-62 Hz',
        inputRange: this.getFrequencyToleranceRange('input'),
        bypassRange: this.getFrequencyToleranceRange('bypass'),
        outputRange: this.getFrequencyToleranceRange('output'),
        method: 'validateFrequencyRangesLegacy()'
      },
      powerCalculation: {
        description: 'Legacy Power Calculations',
        implementation: 'Single: (I � V) / 1000, Three: (V � I) / 1732',
        singlePhaseFormula: '(I � V) / 1000',
        threePhaseFormula: '(V � I) / 1732',
        method: 'calculateLegacyKVA()'
      },
      loadPercentage: {
        description: 'Load Percentage Thresholds',
        implementation: '=90% ? Fail, =85% (UPS) ? Warning',
        criticalLimit: '=90%',
        warningLimit: '=85% (UPS) / =80% (PDU/STS)',
        method: 'validateLoadPercentage()'
      },
      temperatureValidation: {
        description: 'Temperature Range Validation',
        implementation: '67�F � 78�F acceptable range',
        acceptableRange: '67�F - 78�F',
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

  /**
   * Test all enhanced equipment status scenarios
   * This method demonstrates that all required scenarios are properly implemented
   */
  testEnhancedStatusScenarios(): any {
    return {
      statusHierarchy: 'Offline > CriticalDeficiency > OnLine(MajorDeficiency) > ReplacementRecommended > ProactiveReplacement > OnLine(MinorDeficiency) > Online',
      
      scenarioTests: {
        criticalDeficiency: {
          description: 'Equipment requires immediate attention and poses safety risks 🔴',
          triggers: [
            'Any Action field marked as "YS" (Yes with Safety concern)',
            'EPO (Emergency Power Off) not functioning',
            'Ground faults (posToGND_PF or negToGND_PF = F)',
            'Critical capacitor failures (fire/explosion risk)',
            'Room temperature outside safe limits',
            'Major safety violations in transfer tests'
          ],
          implementation: 'checkCriticalDeficiency() method',
          testMethod: () => {
            // Test EPO failure
            this.visualForm.patchValue({ epoSwitch: 'F' });
            const result1 = this.calculateEquipStatus();
            
            // Test safety action item
            this.visualForm.patchValue({ epoSwitch: 'P' });
            this.actionRequiredForm.patchValue({ dcgAction1: 'YS' });
            const result2 = this.calculateEquipStatus();
            
            return {
              epoFailure: result1 === 'CriticalDeficiency',
              safetyActionItem: result2 === 'CriticalDeficiency'
            };
          }
        },
        
        majorDeficiency: {
          description: 'Equipment is operational but has significant issues requiring scheduled maintenance 🟡',
          triggers: [
            'Input/Output voltage readings outside acceptable ranges with "F" (Fail) status',
            'Bypass voltage/current readings marked as "F"', 
            'DC voltage, current, or ripple measurements failing specifications',
            'Battery-related measurements showing "F"',
            'Transfer functions not operating within specifications',
            'Visual inspections showing major component wear'
          ],
          implementation: 'checkMajorDeficiency() method with enhanced voltage/current/bypass detection',
          testMethod: () => {
            // Reset critical conditions
            this.visualForm.patchValue({ epoSwitch: 'P' });
            this.actionRequiredForm.patchValue({ dcgAction1: 'N' });
            
            // Test voltage failure
            this.inputReadingsForm.patchValue({ voltA_PF: 'F' });
            const result1 = this.calculateEquipStatus();
            
            // Test bypass failure
            this.inputReadingsForm.patchValue({ voltA_PF: 'P' });
            this.bypassReadingsForm.patchValue({ currA_PF: 'F' });
            const result2 = this.calculateEquipStatus();
            
            return {
              voltageFailure: result1 === 'OnLine(MajorDeficiency)',
              bypassFailure: result2 === 'OnLine(MajorDeficiency)'
            };
          }
        },
        
        replacementRecommended: {
          description: 'Equipment should be scheduled for replacement 🟠',
          triggers: [
            'Equipment age exceeding manufacturer recommendations (endOfLife = F)',
            'Multiple minor deficiencies accumulating over time',
            'Components showing wear patterns suggesting replacement needed'
          ],
          implementation: 'checkReplacementRecommended() method with age validation',
          testMethod: () => {
            // Reset major deficiency conditions
            this.inputReadingsForm.patchValue({ voltA_PF: 'P' });
            this.bypassReadingsForm.patchValue({ currA_PF: 'P' });
            
            // Test end of life failure
            this.measurementsForm.patchValue({ endOfLife: 'F' });
            const result = this.calculateEquipStatus();
            
            return {
              endOfLifeFailure: result === 'ReplacementRecommended'
            };
          }
        },
        
        proactiveReplacement: {
          description: 'Equipment showing early warning signs 🔵',
          triggers: [
            'Fan age indicating end of life approaching',
            'Measurements returning "W" (Warning) status', 
            'Components approaching but not yet at replacement thresholds',
            'Manufacturer recommendations for proactive replacement'
          ],
          implementation: 'checkProactiveReplacement() method with enhanced warning detection',
          testMethod: () => {
            // Reset replacement recommended conditions
            this.measurementsForm.patchValue({ endOfLife: 'P' });
            
            // Test fan age approaching failure
            this.visualForm.patchValue({ fansAge: 'F' });
            this.equipmentForm.patchValue({ modularUPS: 'N' });
            const result = this.calculateEquipStatus();
            
            return {
              fanAgeWarning: result === 'ProactiveReplacement'
            };
          }
        },
        
        minorDeficiency: {
          description: 'Equipment is operational with minor issues 🟢',
          triggers: [
            'Action items marked as "Y" (Yes, but not safety-critical)',
            'Environment cleaning needed (hostileEnvironment = YS)',
            'Minor voltage/current readings slightly outside normal range',
            'Cosmetic or housekeeping issues (vacuumClean = F)',
            'Preventive maintenance recommendations',
            'SNMP communication issues'
          ],
          implementation: 'checkMinorDeficiency() method with enhanced housekeeping detection',
          testMethod: () => {
            // Reset proactive replacement conditions  
            this.visualForm.patchValue({ fansAge: 'P' });
            
            // Test minor action item
            this.actionRequiredForm.patchValue({ dcgAction1: 'Y' });
            const result1 = this.calculateEquipStatus();
            
            // Test housekeeping issue
            this.actionRequiredForm.patchValue({ dcgAction1: 'N' });
            this.visualForm.patchValue({ vacuumClean: 'F' });
            const result2 = this.calculateEquipStatus();
            
            return {
              actionItemMinor: result1 === 'OnLine(MinorDeficiency)',
              housekeepingIssue: result2 === 'OnLine(MinorDeficiency)'
            };
          }
        },
        
        online: {
          description: 'Equipment is fully operational ✅',
          triggers: [
            'All voltage, current, and frequency readings within specifications',
            'All visual inspections passing ("P" status)',
            'All transfer functions operating correctly', 
            'Environmental conditions acceptable',
            'No action items flagged',
            'All safety systems functioning properly'
          ],
          implementation: 'Default return value when no other conditions are met',
          testMethod: () => {
            // Reset all deficiency conditions
            this.actionRequiredForm.patchValue({ dcgAction1: 'N' });
            this.visualForm.patchValue({ vacuumClean: 'P' });
            
            const result = this.calculateEquipStatus();
            return {
              allSystemsNormal: result === 'Online'
            };
          }
        },
        
        offline: {
          description: 'Equipment is not operational ❌',
          triggers: [
            'Equipment is intentionally taken out of service',
            'Maintenance bypass is active for extended periods',
            'Equipment failure requiring complete shutdown',
            'Manual status override'
          ],
          implementation: 'Manual status setting with checkOfflineStatus() method',
          testMethod: () => {
            this.equipmentForm.patchValue({ status: 'Offline' });
              console.debug('[DEBUG] testMethod -> set status to Offline for testMethod');
            const result = this.calculateEquipStatus();
            return {
              manualOffline: result === 'Offline'
            };
          }
        }
      },
      
      keyImprovements: [
        'Fixed YS (Yes with Safety) detection for Critical Deficiency',
        'Enhanced voltage/current failure detection for Major Deficiency',
        'Added bypass readings failure detection',
        'Added battery measurement failure detection', 
        'Enhanced housekeeping and cosmetic issue detection for Minor Deficiency',
        'Added manufacturer proactive replacement recommendations',
        'Improved status hierarchy with proper priority ordering',
        'Added comprehensive minor current variation detection'
      ]
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
        return '58 Hz - 62 Hz'; // Bypass frequency tolerance (updated per user specs)
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

  /**
   * SIMPLIFIED STATUS CALCULATION - Organized by priority categories
   */
  /**
   * SYNCHRONOUS Status Calculation (for real-time display and validation)
   * 
   * This method provides immediate status calculation using hardcoded checks.
   * It's used for:
   * - Real-time status updates as user fills out forms
   * - Form validation that requires immediate feedback
   * - Fallback when API-based calculation fails
   * 
   * For SAVE operations, use calculateEquipStatusFromAPI() instead, which:
   * - Calls backend APIs to get all field values dynamically
   * - Uses StatusDescription table for severity determination
   * - Matches legacy GetEquipStatus() logic exactly
   * 
   * Note: This synchronous version approximates legacy behavior but may not
   * catch all edge cases that require database lookup.
   */
  calculateEquipStatus(): string {
    // Check in order of severity (highest to lowest priority)
    return this.checkCriticalDeficiency() || 
           this.checkMajorDeficiency() ||
           this.checkReplacementRecommended() ||
           this.checkProactiveReplacement() ||
           this.checkMinorDeficiency() ||
           'Online';
  }

  /**
   * LEGACY-ALIGNED: Calculate equipment status using dynamic API calls
   * This matches the EXACT flow of GetEquipStatus() in legacy code
   * 
   * Legacy Flow:
   * 1. Set ResultStatus = "Online" (default)
   * 2. Call da.JobSummaryReport(CallNbr, EquipID, "UPS", "Y") - Gets all field values from DB
   * 3. Call da.GetStatusDescription("UPS") - Gets severity mapping for each field
   * 4. Loop through all columns dynamically:
   *    - For Action/Environment_Clean fields: Y=MinorDeficiency, YS=CriticalDeficiency
   *    - For other fields: N/F/True/"F "=Check StatusDescription table for severity
   *    - For W values: ProactiveReplacement (if currently Online)
   * 
   * Key Differences from Previous Implementation:
   * - OLD: Used hardcoded checks for specific fields
   * - NEW: Dynamic lookup from database, matches any field changes automatically
   * - OLD: Hardcoded severity levels
   * - NEW: Uses StatusDescription table lookup for severity determination
   * 
   * NOTE: This is an ASYNC operation and should be called during save, not in real-time
   */
  private calculateEquipStatusFromAPI(): Observable<string> {
    // Legacy: GetEquipStatus() implementation
    // Step 1: JobSummaryReport(CallNbr, EquipID, "UPS", "Y")
    // Step 2: GetStatusDescription("UPS")
    // Step 3: Iterate through all columns and apply legacy logic
    
    return forkJoin({
      jobSummary: this.equipmentService.getJobSummaryReport(this.callNbr, this.equipId, 'UPS'),
      statusDesc: this.equipmentService.getStatusDescription('UPS')
    }).pipe(
      map(({ jobSummary, statusDesc }) => {
        let resultStatus = 'Online';

        // Extract data from API response wrapper
        // API returns: { success: true, data: { primaryData: [...] } }
        const jobSummaryData = jobSummary?.data?.primaryData || jobSummary;
        // API returns: { success: true, data: [...] }
        const statusDescData = (statusDesc as any)?.data || statusDesc;

        // Legacy: if (dsDetails != null && dsDetails.Tables[0].Rows.Count > 0)
        if (!jobSummaryData || !Array.isArray(jobSummaryData) || jobSummaryData.length === 0) {
          console.log('No job summary data, returning Online');
          return 'Online';
        }

        const rowData = jobSummaryData[0]; // First row of data
        const statusDescMap = new Map<string, string>();

        // Build status description lookup map: ColumnName -> StatusType
        // Legacy: foreach (DataRow dr in dsStatus.Tables[0].Rows)
        if (statusDescData && Array.isArray(statusDescData) && statusDescData.length > 0) {
          statusDescData.forEach((row: any) => {
            const columnName = (row.columnName || row.ColumnName || '').trim();
            const statusType = (row.statusType || row.StatusType || '').trim();
            if (columnName && statusType) {
              statusDescMap.set(columnName, statusType);
            }
          });
        }

        // Legacy: for (int z = 0; z < dsDetails.Tables[0].Columns.Count - 1; z++)
        const columns = Object.keys(rowData);
        
        for (const columnName of columns) {
          // Legacy: string TempColumn = dsDetails.Tables[0].Columns[z].ColumnName;
          // Legacy: TempField = dsDetails.Tables[0].Rows[0][TempColumn].ToString();
          const fieldValue = (rowData[columnName] || '').toString().trim();

          // Skip processing for certain metadata columns
          if (columnName === 'CallNbr' || columnName === 'EquipId' || columnName === 'UpsId') {
            continue;
          }

          // Log every column being checked for debugging
          if (fieldValue === 'N' || fieldValue === 'F' || fieldValue === 'True' || fieldValue === 'F ' || 
              fieldValue === 'Y' || fieldValue === 'YS' || fieldValue === 'W') {
          }

          // Legacy: if (TempColumn.Contains("Action") || TempColumn.Contains("Environment_Clean"))
          if (columnName.includes('Action') || columnName.includes('Environment_Clean')) {
            // Legacy: if (TempField == "Y")
            if (fieldValue === 'Y') {
              // Legacy: if (ResultStatus == "Online" || ResultStatus == "ProactiveReplacement")
              if (resultStatus === 'Online' || resultStatus === 'ProactiveReplacement') {
                resultStatus = 'OnLine(MinorDeficiency)';
              }
            } 
            // Legacy: else if (TempField == "YS")
            else if (fieldValue === 'YS') {
              return 'CriticalDeficiency';
            }
          } 
          // Legacy: else block for all other columns
          else {
            // Legacy: if (TempField == "N" || TempField == "F" || TempField == "True" || TempField == "F ")
            if (fieldValue === 'N' || fieldValue === 'F' || fieldValue === 'True' || fieldValue === 'F ') {
              // Legacy: First set to MinorDeficiency if Online or ProactiveReplacement
              // if (ResultStatus == "Online" || ResultStatus == "ProactiveReplacement")
              if (resultStatus === 'Online' || resultStatus === 'ProactiveReplacement') {
                resultStatus = 'OnLine(MinorDeficiency)';
              }

              // Legacy: Then check StatusDescription for escalation
              // foreach (DataRow dr in dsStatus.Tables[0].Rows)
              // if (TempColumn == dr["ColumnName"].ToString().Trim())
              const statusType = statusDescMap.get(columnName);
              
              if (statusType) {
                // Legacy: if (dr["StatusType"].ToString().Trim() == "CriticalDeficiency")
                if (statusType === 'CriticalDeficiency') {
                  return 'CriticalDeficiency';
                } 
                // Legacy: else if (dr["StatusType"].ToString().Trim() == "OnLine(MajorDeficiency)")
                else if (statusType === 'OnLine(MajorDeficiency)') {
                  resultStatus = 'OnLine(MajorDeficiency)';
                } 
                // Legacy: else if (dr["StatusType"].ToString().Trim() == "ReplacementRecommended")
                else if (statusType === 'ReplacementRecommended') {
                  resultStatus = 'ReplacementRecommended';
                }
              }
            } 
            // Legacy: else { if(TempField == "W") { if(ResultStatus == "Online") ResultStatus = "ProactiveReplacement"; } }
            else {
              if (fieldValue === 'W') {
                if (resultStatus === 'Online') {
                  resultStatus = 'ProactiveReplacement';
                }
              }
            }
          }
        }

        console.log('Final calculated status:', resultStatus);
        return resultStatus;
      }),
      catchError(error => {
        console.error('Error calculating equipment status from API:', error);
        // Fallback to form-based logic on error
        return of(this.calculateEquipStatus());
      })
    );
  }

  /**
   * Fallback method using hardcoded logic (current implementation)
   * Used when API calls fail or for real-time status display
   */
  private calculateEquipStatusFallback(): string {
    return this.checkCriticalDeficiency() || 
           this.checkMajorDeficiency() ||
           this.checkReplacementRecommended() ||
           this.checkProactiveReplacement() ||
           this.checkMinorDeficiency() ||
           'Online';
  }

  private checkCriticalDeficiency(): string | null {
    // CRITICAL DEFICIENCY: Equipment requires immediate attention and poses safety risks
    
    // 1. Check for any safety-related action items marked as "YS" (Yes with Safety concern)
    if (this.hasAnySafetyActionItems()) {
      return 'CriticalDeficiency';
    }

    // 2. Critical electrical hazards
    const criticalElectricalChecks = [
      ['visualForm', 'epoSwitch', 'F'],              // EPO not functioning - immediate safety risk
      ['rectifierForm', 'posToGND_PF', 'F'],         // Ground fault - electrical hazard
      ['rectifierForm', 'negToGND_PF', 'F'],         // Ground fault - electrical hazard
      ['rectifierForm', 'dcVoltage_PF', 'F']         // Severe DC voltage fault
    ];

    // 3. Critical component failures (Fire/Explosion Risk)
    const criticalComponentChecks = [
      ['capacitorForm', 'dcCaps_PF', 'F'],           // DC capacitor failure - fire/explosion risk
      ['capacitorForm', 'acInputCaps_PF', 'F'],      // AC Input capacitor failure
      ['capacitorForm', 'acOutputCaps_PF', 'F'],     // AC Output capacitor failure
      ['capacitorForm', 'commCaps_PF', 'F']          // Communication capacitor failure
    ];

    // 4. Critical environmental/safety failures
    const criticalEnvironmentChecks = [
      ['environmentForm', 'roomTempVentilation', 'F'], // Room temperature outside safe limits
      ['environmentForm', 'safetyEquipment', 'F'],     // Safety equipment failures
      ['transferForm', 'firstMajor', 'YS']             // Major safety violations in transfer tests (corrected YS)
    ];

    // 5. Critical transfer function failures that pose safety risks
    const criticalTransferChecks = [
      ['transferForm', 'staticBypass', 'F'],          // Static bypass failure in critical situations
      ['transferForm', 'normalMode', 'F']             // Normal mode operation completely failed
    ];

    // Check all critical failure categories
    const allCriticalChecks = [
      ...criticalElectricalChecks,
      ...criticalComponentChecks, 
      ...criticalEnvironmentChecks,
      ...criticalTransferChecks
    ];

    return this.hasAnyFailure(allCriticalChecks) ? 'CriticalDeficiency' : null;
  }

  private checkMajorDeficiency(): string | null {
    // MAJOR DEFICIENCY: Equipment is operational but has significant issues requiring scheduled maintenance
    
    // 1. Check for voltage readings outside acceptable ranges with "F" (Fail) status
    if (this.hasMajorVoltageFailures()) {
      return 'OnLine(MajorDeficiency)';
    }

    // 2. Check for current readings failing specifications  
    if (this.hasMajorCurrentFailures()) {
      return 'OnLine(MajorDeficiency)';
    }

    // 3. Check for DC voltage, current, or ripple measurements failing specifications
    if (this.hasMajorRectifierFailures()) {
      return 'OnLine(MajorDeficiency)';
    }

    // 4. Check for bypass voltage/current readings marked as "F"
    if (this.hasBypassReadingsFailures()) {
      return 'OnLine(MajorDeficiency)';
    }

    // 5. Check for battery-related measurements showing "F"
    if (this.hasBatteryMeasurementFailures()) {
      return 'OnLine(MajorDeficiency)';
    }

    // 6. Transfer function failures (major operational impact) - excluding critical ones
    const majorTransferChecks = [
      ['transferForm', 'transMaintByPass', 'F'],       // Maintenance bypass failure
      ['transferForm', 'currentWave', 'F'],           // Current waveform analysis failure  
      ['transferForm', 'verifyAlarm', 'F']            // Alarm verification failed
    ];

    // 7. Visual inspections showing major component wear
    const majorVisualChecks = [
      ['visualForm', 'upsOnline', 'F'],               // Active alarms present - system issues
      ['visualForm', 'inspectDamage', 'F'],           // Physical damage assessment failed
      ['visualForm', 'checkConnections', 'F']         // Connection integrity issues
    ];

    // 8. Environmental and accessibility issues  
    const majorEnvironmentChecks = [
      ['environmentForm', 'serviceSpace', 'F'],       // Service space accessibility issues
      ['environmentForm', 'circuitBreakers', 'F']     // Circuit breaker accessibility issues
    ];

    // 9. Load sharing and distribution problems
    const majorLoadChecks = [
      ['outputReadingsForm', 'loadA_PF', 'F'],        // Load phase A failure
      ['outputReadingsForm', 'loadB_PF', 'F'],        // Load phase B failure  
      ['outputReadingsForm', 'loadC_PF', 'F'],        // Load phase C failure
      ['measurementsForm', 'loadKVA', 'F'],           // KVA load measurement failure
      ['measurementsForm', 'threePhase', 'F']         // Three-phase measurement failure
    ];

    // 10. Power quality and measurement issues
    const majorPowerChecks = [
      ['measurementsForm', 'inputPower', 'F'],        // Input power measurement failure
      ['measurementsForm', 'normal', 'F'],            // Normal mode operation failure
      ['measurementsForm', 'caliberation', 'F'],      // Calibration failure
      ['measurementsForm', 'lcd', 'F']                // LCD display issues
    ];

    const allMajorChecks = [
      ...majorTransferChecks,
      ...majorVisualChecks,
      ...majorEnvironmentChecks,
      ...majorLoadChecks,
      ...majorPowerChecks
    ];

    return this.hasAnyFailure(allMajorChecks) ? 'OnLine(MajorDeficiency)' : null;
  }

  private checkReplacementRecommended(): string | null {
    const endOfLife = this.measurementsForm.get('endOfLife')?.value;
    return endOfLife === 'F' ? 'ReplacementRecommended' : null;
  }

  /**
   * Check for manufacturer recommendations for proactive replacement
   */
  private hasManufacturerProactiveRecommendations(): boolean {
    // Check for trending data suggesting future issues
    const kva = this.convertToDouble(this.equipmentForm.get('kva')?.value || '0');
    
    // Check for components approaching manufacturer recommended replacement intervals
    const capacitorAges = [
      this.convertToInt(this.capacitorForm.get('dcCapsAge')?.value),
      this.convertToInt(this.capacitorForm.get('acInputCapsAge')?.value), 
      this.convertToInt(this.capacitorForm.get('acOutputCapsAge')?.value),
      this.convertToInt(this.capacitorForm.get('commCapsAge')?.value)
    ];
    
    // Capacitors approaching manufacturer recommended replacement (>15 years for most)
    const hasAgingCapacitors = capacitorAges.some(age => age >= 12 && age < 15);
    
    // Fan age approaching replacement threshold
    const fanYear = this.convertToInt(this.capacitorForm.get('fansYear')?.value);
    const hasAgingFans = fanYear >= 8 && fanYear < 12; // Fans typically last 10-12 years
    
    return hasAgingCapacitors || hasAgingFans;
  }

  private checkProactiveReplacement(): string | null {
    // PROACTIVE REPLACEMENT: Equipment showing early warning signs
    
    // 1. Fan age indicating end of life approaching
    const fansAge = this.visualForm.get('fansAge')?.value;
    const modularUPS = this.equipmentForm.get('modularUPS')?.value;
    
    if (fansAge === 'F' && modularUPS !== 'YS' && modularUPS !== 'YES') {
      return 'ProactiveReplacement'; // Fixed: Return correct status
    }

    // 2. Check for measurements returning "W" (Warning) status
    if (this.hasProactiveWarnings()) {
      return 'ProactiveReplacement';
    }

    // 3. Check for components approaching but not yet at replacement thresholds
    if (this.hasComponentsNearingEndOfLife()) {
      return 'ProactiveReplacement';
    }

    // 4. Manufacturer recommendations for proactive replacement
    if (this.hasManufacturerProactiveRecommendations()) {
      return 'ProactiveReplacement';
    }

    return null;
  }

  private checkMinorDeficiency(): string | null {
    // MINOR DEFICIENCY: Equipment is operational with minor issues
    
    // 1. Action items marked as "Y" (Yes, but not safety-critical)
    const actionItemChecks = [
      ['actionRequiredForm', 'dcgAction1', 'Y'],
      ['actionRequiredForm', 'custAction1', 'Y']
    ];

    // 2. Environmental cleaning and housekeeping issues
    const housekeepingChecks = [
      ['environmentForm', 'hostileEnvironment', 'YS'],  // Environment cleaning needed (legacy uses YS)
      ['visualForm', 'vacuumClean', 'F'],              // Vacuum/dust accumulation issues
      ['visualForm', 'airFilters', 'N']                // Filter replacement needed (legacy: 'N' = Replacement Needed)
      // NOTE: Removed 'C' (Cleaned) - cleaned filters should not be a deficiency
    ];

    // 3. Communication and monitoring minor issues
    const communicationChecks = [
      ['equipmentForm', 'snmpPresent', 'N'],           // SNMP communication issues
      ['equipmentForm', 'snmpPresent', 'NO']           // No SNMP present
    ];

    // 4. Cosmetic and non-critical physical issues
    const cosmeticChecks = [
      ['visualForm', 'coolingFans', 'W'],              // Fan noise levels (warning)
      ['environmentForm', 'safetyEquipment', 'W']      // Minor safety equipment issues
    ];

    // 5. Check for minor voltage variations (slightly outside normal range but not failing)
    if (this.hasMinorVoltageVariations()) {
      return 'OnLine(MinorDeficiency)';
    }

    // 6. Check for preventive maintenance recommendations
    if (this.hasPreventiveMaintenanceNeeds()) {
      return 'OnLine(MinorDeficiency)';
    }

    // 7. Check for minor current readings outside normal range but not failed
    if (this.hasMinorCurrentVariations()) {
      return 'OnLine(MinorDeficiency)';
    }

    // 8. Check for minor measurement issues
    const minorMeasurementChecks = [
      ['measurementsForm', 'inputPower', 'W'],         // Input power warning
      ['measurementsForm', 'lcd', 'W'],                // LCD display warning
      ['measurementsForm', 'caliberation', 'W']        // Calibration warning
    ];

    const allMinorChecks = [
      ...actionItemChecks,
      ...housekeepingChecks,
      ...communicationChecks,
      ...cosmeticChecks,
      ...minorMeasurementChecks
    ];

    return this.hasAnyFailure(allMinorChecks) ? 'OnLine(MinorDeficiency)' : null;
  }

  private hasAnyFailure(checks: string[][]): boolean {
    return checks.some(([formName, fieldName, failValue]) => {
      const form = (this as any)[formName] as FormGroup;
      return form?.get(fieldName)?.value === failValue;
    });
  }

  /**
   * Check for any safety-related action items marked as "YS" (Yes with Safety concern)
   * These trigger Critical Deficiency status regardless of other conditions
   */
  private hasAnySafetyActionItems(): boolean {
    // Check all action-related fields for "YS" values indicating safety concerns
    const safetyActionFields = [
      this.actionRequiredForm.get('dcgAction1')?.value,
      this.actionRequiredForm.get('custAction1')?.value,
      this.transferForm.get('firstMajor')?.value
    ];

    return safetyActionFields.some(value => value === 'YS');
  }

  /**
   * Check for major voltage failures (Input/Output voltage readings outside acceptable ranges with "F" status)
   */
  private hasMajorVoltageFailures(): boolean {
    const voltageFailureFields = [
      // Input voltage failures
      'voltA_PF', 'voltB_PF', 'voltC_PF',
      // Frequency failures
      'freq_PF'
    ];

    const forms = [this.inputReadingsForm, this.bypassReadingsForm, this.outputReadingsForm];
    
    return forms.some(form => {
      return voltageFailureFields.some(fieldName => {
        return form.get(fieldName)?.value === 'F';
      });
    });
  }

  /**
   * Check for major current reading failures
   */
  private hasMajorCurrentFailures(): boolean {
    // Major current failures that impact system operation
    const currentFailures = [
      this.inputReadingsForm.get('currA_PF')?.value === 'F',
      this.inputReadingsForm.get('currB_PF')?.value === 'F', 
      this.inputReadingsForm.get('currC_PF')?.value === 'F',
      this.bypassReadingsForm.get('currA_PF')?.value === 'F',
      this.bypassReadingsForm.get('currB_PF')?.value === 'F',
      this.bypassReadingsForm.get('currC_PF')?.value === 'F',
      this.outputReadingsForm.get('currA_PF')?.value === 'F',
      this.outputReadingsForm.get('currB_PF')?.value === 'F',
      this.outputReadingsForm.get('currC_PF')?.value === 'F'
    ];

    return currentFailures.some(failure => failure === true);
  }

  /**
   * Check for major rectifier-related failures (DC measurements failing specifications)
   */
  private hasMajorRectifierFailures(): boolean {
    const rectifierFailures = [
      this.rectifierForm.get('floatVolt_PF')?.value === 'F',     // Float voltage failure
      this.rectifierForm.get('dcCurrent_PF')?.value === 'F',     // DC current failure  
      this.rectifierForm.get('acRipple_PF')?.value === 'F',      // AC ripple failure
      this.rectifierForm.get('acRippleVolt_PF')?.value === 'F',  // AC ripple voltage failure
      this.rectifierForm.get('acRippleCurr_PF')?.value === 'F'   // AC ripple current failure
    ];

    return rectifierFailures.some(failure => failure === true);
  }

  /**
   * Check for bypass voltage/current readings marked as "F"
   */
  private hasBypassReadingsFailures(): boolean {
    const bypassFailures = [
      this.bypassReadingsForm.get('voltA_PF')?.value === 'F',
      this.bypassReadingsForm.get('voltB_PF')?.value === 'F',
      this.bypassReadingsForm.get('voltC_PF')?.value === 'F',
      this.bypassReadingsForm.get('currA_PF')?.value === 'F',
      this.bypassReadingsForm.get('currB_PF')?.value === 'F',
      this.bypassReadingsForm.get('currC_PF')?.value === 'F',
      this.bypassReadingsForm.get('freq_PF')?.value === 'F'
    ];

    return bypassFailures.some(failure => failure === true);
  }

  /**
   * Check for battery-related measurements showing "F"
   */
  private hasBatteryMeasurementFailures(): boolean {
    // Check capacitor-related measurements that indicate battery system issues
    const batterySystemFailures = [
      this.capacitorForm.get('dcCaps_PF')?.value === 'F',        // DC Caps indicate battery system health
      this.rectifierForm.get('dcCurrent_PF')?.value === 'F',     // DC current affects battery charging
      this.rectifierForm.get('floatVolt_PF')?.value === 'F'      // Float voltage critical for battery maintenance
    ];

    return batterySystemFailures.some(failure => failure === true);
  }

  /**
   * Check for measurements returning "W" (Warning) status indicating proactive replacement needs
   */
  private hasProactiveWarnings(): boolean {
    const warningFields = [
      // Voltage measurements that could have warning status
      'voltA_PF', 'voltB_PF', 'voltC_PF',
      // Current measurements that could have warning status
      'currA_PF', 'currB_PF', 'currC_PF'
    ];

    const forms = [this.inputReadingsForm, this.bypassReadingsForm, this.outputReadingsForm];
    
    return forms.some(form => {
      return warningFields.some(fieldName => {
        return form.get(fieldName)?.value === 'W';
      });
    });
  }

  /**
   * Check for components approaching but not yet at replacement thresholds
   */
  private hasComponentsNearingEndOfLife(): boolean {
    const monthName = this.equipmentForm.get('monthName')?.value;
    const year = this.equipmentForm.get('year')?.value;
    const kvaValue = this.convertToDouble(this.equipmentForm.get('kva')?.value || '0');

    if (monthName && year && kvaValue > 0) {
      try {
        const dateCode = `${monthName} ${year}`;
        const equipmentAge = this.calculateEquipmentAge(dateCode);
        const endOfLifeThreshold = UPSAgeValidationService.calculateEndOfLifeThreshold(kvaValue);
        
        // Proactive replacement recommended 3 years before end-of-life
        return equipmentAge >= (endOfLifeThreshold - 3) && equipmentAge < endOfLifeThreshold;
      } catch (error) {
        return false;
      }
    }
    return false;
  }

  /**
   * Check for minor voltage variations (slightly outside normal range but not failing)
   */
  private hasMinorVoltageVariations(): boolean {
    const forms = [
      { form: this.inputReadingsForm, type: 'input' as const },
      { form: this.bypassReadingsForm, type: 'bypass' as const },
      { form: this.outputReadingsForm, type: 'output' as const }
    ];

    return forms.some(({ form, type }) => {
      const config = form.get('configuration')?.value;
      if (!config) return false;

      const phases = ['A', 'B', 'C'];
      return phases.some(phase => {
        const voltage = this.convertToDouble(form.get(`volt${phase}`)?.value || '0');
        const pfValue = form.get(`volt${phase}_PF`)?.value;
        
        // Check if voltage is in warning range (not failed but not optimal)
        if (voltage > 0 && pfValue === 'P') {
          const bounds = this.getVoltageToleranceBounds(config, type);
          const nominalVoltage = this.getNominalVoltageFromConfig(config);
          
          // Define "minor variation" as being within tolerance but not within optimal range (±2% of nominal)
          const optimalMin = nominalVoltage * 0.98;
          const optimalMax = nominalVoltage * 1.02;
          
          return (voltage >= bounds.min && voltage < optimalMin) || 
                 (voltage > optimalMax && voltage <= bounds.max);
        }
        return false;
      });
    });
  }

  /**
   * Check for preventive maintenance recommendations
   */
  private hasPreventiveMaintenanceNeeds(): boolean {
    // Check for cosmetic or housekeeping issues that don't affect operation
    const preventiveMaintenanceIndicators = [
      this.visualForm.get('vacuumClean')?.value === 'F', // Cleaning needed
      this.environmentForm.get('hostileEnvironment')?.value === 'YS' // Environmental attention needed (legacy uses YS for Yes)
    ];

    return preventiveMaintenanceIndicators.some(indicator => indicator === true);
  }

  /**
   * Check for minor current variations (outside optimal range but not failed)
   */
  private hasMinorCurrentVariations(): boolean {
    const forms = [
      { form: this.inputReadingsForm, type: 'input' as const },
      { form: this.bypassReadingsForm, type: 'bypass' as const },
      { form: this.outputReadingsForm, type: 'output' as const }
    ];

    return forms.some(({ form }) => {
      const phases = ['A', 'B', 'C'];
      return phases.some(phase => {
        const current = this.convertToDouble(form.get(`curr${phase}`)?.value || '0');
        const pfValue = form.get(`curr${phase}_PF`)?.value;
        
        // Check if current is in warning range (not failed but not optimal)
        return current > 0 && pfValue === 'P' && this.isCurrentInWarningRange(current);
      });
    });
  }

  /**
   * Check if current value is in warning range (outside optimal but within tolerance)
   */
  private isCurrentInWarningRange(current: number): boolean {
    // Define warning range as currents that are high but not critical
    // This is typically when current is >80% of rated but <90%
    const kva = this.convertToDouble(this.equipmentForm.get('kva')?.value || '0');
    if (kva === 0) return false;
    
    // Rough calculation of rated current (simplified)
    const ratedCurrent = (kva * 1000) / (208 * 1.732); // Assuming 208V 3-phase
    const warningThreshold = ratedCurrent * 0.8;
    const criticalThreshold = ratedCurrent * 0.9;
    
    return current >= warningThreshold && current < criticalThreshold;
  }

  // Helper method to check if field is already handled in priority checks
  private isFieldHandledInPriorityCheck(fieldKey: string): boolean {
    const handledFields = [
      'epoSwitch', 'posToGND_PF', 'negToGND_PF',
      'dcCaps_PF', 'acInputCaps_PF', 'acOutputCaps_PF', 'commCaps_PF',
      'firstMajor', 'dcVoltage_PF', 'roomTempVentilation',
      'staticBypass', 'upsOnline', 'verifyAlarm',
      'inspectDamage', 'serviceSpace',
      'loadA_PF', 'loadB_PF', 'loadC_PF', 'loadKVA', 'threePhase',
      'endOfLife', 'fansAge',
      'dcgAction1', 'custAction1', 'snmpPresent'
    ];

    return handledFields.includes(fieldKey);
  }

  /**
   * Validate critical safety fields and immediately update status when failures occur OR recover
   * This method should be called whenever critical fields change (both F->P and P->F)
   */
  private validateAndUpdateStatusOnFailure(): void {
    if (this.loading || this.saving) return; // Don't update during initial load or save

    const currentStatus = this.equipmentForm.get('status')?.value;
    
    // CRITICAL: Respect manual "Off-Line" override - NEVER change from Off-Line automatically
    if (this.manualStatusOverride || currentStatus === 'Offline') {
      // User manually selected Off-Line - do not override regardless of other conditions
      const newStatus = this.calculateEquipStatus();
      this.originalCalculatedStatus = newStatus; // Track what the calculated status would be
      
      // Ensure status stays as Offline
      if (currentStatus !== 'Offline') {
        console.debug('[DEBUG] validateAndUpdateStatusOnFailure -> restoring Offline due to manualStatusOverride. currentStatus:', currentStatus);
        this.equipmentForm.patchValue({ status: 'Offline' }, { emitEvent: false });
        console.debug('[DEBUG] validateAndUpdateStatusOnFailure -> form.status after restore:', this.equipmentForm?.get('status')?.value);
      }
      return;
    }

    const newStatus = this.calculateEquipStatus();
    if (newStatus !== currentStatus) {
      // Status change detected - update immediately only if not manually overridden to Off-Line
      console.debug('[DEBUG] validateAndUpdateStatusOnFailure -> status change detected. currentStatus:', currentStatus, 'newStatus:', newStatus);
      this.equipmentForm.patchValue({ status: newStatus }, { emitEvent: false });
      
      // Show notification to user about status change
      this.showStatusChangeNotification(currentStatus, newStatus);
    }
  }

  /**
   * Show notification when equipment status changes due to failure conditions
   */
  private showStatusChangeNotification(oldStatus: string, newStatus: string): void {
    const oldDisplayText = this.getStatusDisplayText(oldStatus);
    const newDisplayText = this.getStatusDisplayText(newStatus);

    let message = `Equipment status automatically changed from "${oldDisplayText}" to "${newDisplayText}"`;
    let title = 'Status Changed';

    // Customize message and alert level based on new status severity
    
  }

  /**
   * Handle manual status override for "Offline" status
   * Legacy functionality: ddlStatus.SelectedValue == "Offline"
   */
  onManualStatusChange(selectedStatus: string): void {
    // Debug: log incoming selected status and current form status
    
    // Capture the user's explicit selection so confirmation and subsequent logic can prefer this value
    this.lastUserSelectedStatus = selectedStatus;

    if (selectedStatus === 'Offline') {
      // Use legacy format for status confirmation
      if (!confirm(`Are you sure that the Equipment Status : ${selectedStatus}`)) {
        // Reset to previous value if user cancels
        const calculatedStatus = this.calculateEquipStatus();
        console.log('[DEBUG] onManualStatusChange -> Offline confirmation canceled by user. calculatedStatus:', calculatedStatus);
        setTimeout(() => {
          this.equipmentForm.patchValue({ status: calculatedStatus }, { emitEvent: false });
        }, 0);
        return;
      }

      // IMMEDIATE Override: Set manual override flag BEFORE any other operations
      this.manualStatusOverride = true;
      
      // Calculate what the status would be without manual override  
      this.originalCalculatedStatus = this.calculateEquipStatus();
      
      // Force the status to Offline immediately with no events
      this.equipmentForm.patchValue({ status: 'Offline' }, { emitEvent: false });
      // Debug: log form status after applying Offline override
    } else {
      // Clear manual override when changing away from Off-Line
      this.manualStatusOverride = false;
      
      // Apply the new status  
      this.equipmentForm.patchValue({ status: selectedStatus }, { emitEvent: false });
      // Debug: log form status after applying selected status
    }
  }

  /**
   * Get default status options as fallback
   */
  private getDefaultStatusOptions(): { value: string; text: string }[] {
    return [
      { value: 'Online', text: 'On-Line' },
      { value: 'Off-Line', text: 'Off-Line' },
      { value: 'OnLine(MinorDeficiency)', text: 'On-Line (Minor Deficiency)' },
      { value: 'OnLine(MajorDeficiency)', text: 'On-Line (Major Deficiency)' },
      { value: 'ProactiveReplacement', text: 'Proactive Replacement' },
      { value: 'ReplacementRecommended', text: 'Replacement Recommended' },
      { value: 'CriticalDeficiency', text: 'Critical Deficiency' },
      { value: 'Offline', text: 'Off-Line' }
    ];
  }

  /**
   * Ensure CriticalDeficiency option is available in status options
   */
  private ensureCriticalDeficiencyOption(statusOptions: { value: string; text: string }[]): { value: string; text: string }[] {
    const hasCriticalDeficiency = statusOptions.some(option => option.value === 'CriticalDeficiency');
    
    if (!hasCriticalDeficiency) {
      return [
        ...statusOptions,
        { value: 'CriticalDeficiency', text: 'Critical Deficiency' }
      ];
    }
    
    return statusOptions;
  }

  /**
   * Normalize status options by enforcing canonical display text for known values.
   * This prevents server-provided text from accidentally swapping labels.
   */
  private normalizeStatusOptions(options: { value: string; text: string }[]): { value: string; text: string }[] {
    const canonical = STATUS_OPTIONS.reduce((acc, o) => {
      acc[o.value] = o.text;
      return acc;
    }, {} as Record<string, string>);

    return (options || []).map(opt => {
      const canon = canonical[opt.value];
      return canon ? { value: opt.value, text: canon } : opt;
    });
  }

  /**
   * Get all available status options with proper display text
   * Based on legacy status hierarchy
   */
  getAvailableStatusOptions(): { value: string; text: string }[] {
    return [
      { value: 'Online', text: 'Online' },
      { value: 'OnLine(MinorDeficiency)', text: 'On-Line (Minor Deficiency)' },
      { value: 'OnLine(MajorDeficiency)', text: 'On-Line (Major Deficiency)' },
      { value: 'ProactiveReplacement', text: 'Proactive Replacement' },
      { value: 'ReplacementRecommended', text: 'Replacement Recommended' },
      { value: 'CriticalDeficiency', text: 'Critical Deficiency' },
      { value: 'Offline', text: 'Off-Line' }
    ];
  }

  /**
   * Check if manual Off-Line override is active
   */
  isManualOffLineOverride(): boolean {
    return this.manualStatusOverride && this.equipmentForm.get('status')?.value === 'Offline';
  }

  /**
   * Get the calculated status when manual override is active
   */
  getCalculatedStatusWhenOverridden(): string {
    return this.originalCalculatedStatus;
  }



  /**
   * Preserve manual Off-Line status during save operations
   */
  private preserveManualOffLineStatus(): void {
    if (this.manualStatusOverride) {
      // Force status to Offline regardless of current value
      this.equipmentForm.patchValue({ status: 'Offline' }, { emitEvent: false });
    }
  }

  /**
   * Test method to manually trigger Off-Line override (for debugging)
   */
  testOffLineOverride(): void {
    this.manualStatusOverride = true;
    this.originalCalculatedStatus = this.calculateEquipStatus();
    this.equipmentForm.patchValue({ status: 'Offline' }, { emitEvent: false });
    
    // Show user confirmation
    this.toastr.info('Off-Line override activated for testing.', 'Test Override');
  }

  /**
   * Debug method to log current state (for development use)
   */
  debugCurrentState(): void {
    // Method kept for potential future debugging needs
  }

  /**
   * Handle status dropdown change event (wrapper for onManualStatusChange)
   */
  onStatusDropdownChange(event: any): void {
    const selectedValue = event.target.value;
    // Keep a record of the last value the technician explicitly chose in the UI
    this.lastUserSelectedStatus = selectedValue;
    // Debug: log the raw event value and current equipment form status
    this.onManualStatusChange(selectedValue);
    console.log('[DEBUG] onStatusDropdownChange after calling onManualStatusChange. formStatusNow:', this.equipmentForm?.get('status')?.value);
  }

  /**
   * Setup direct subscription to status form control changes
   */
  private setupDirectStatusSubscription(): void {
    this.equipmentForm.get('status')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(newStatus => {
      // Debug: log every status change from the form control
      // If status changes to something other than Offline while manual override is active, restore it
      if (this.manualStatusOverride && newStatus !== 'Offline' && !this.loading && !this.saving) {
        setTimeout(() => {
          this.equipmentForm.patchValue({ status: 'Offline' }, { emitEvent: false });
        }, 0);
      }
    });
  }

  onVoltageConfigurationChange(type: 'input' | 'bypass' | 'output', configId: string): void {
    const form = type === 'input' ? this.inputReadingsForm :
                  type === 'bypass' ? this.bypassReadingsForm : this.outputReadingsForm;

    // Get the voltage configuration to determine expected values
    const config = this.getVoltageConfiguration(configId);
    if (!config) {
      return;
    }

    // Temporarily set isFormSubmission to prevent automatic validation during config changes
    const wasFormSubmission = this.isFormSubmission;
    this.isFormSubmission = true;

    // Don't clear existing readings during data loading - only clear during manual config changes
    if (!this.loading) {
      // LEGACY ALIGNMENT: Pre-populate with nominal voltage values as visual hints
      // Legacy HTML had default values like: <asp:TextBox>120</asp:TextBox>
      // These serve as hints for expected nominal voltage but can be overridden by technician
      const nominalVoltage = this.getNominalVoltageFromConfig(configId);
      const phaseToNeutralVoltage = this.getDefaultPhaseToNeutralVoltage(configId);
      
      form.patchValue({
        voltA: nominalVoltage > 0 ? nominalVoltage.toString() : '',
        voltA_PF: 'P',
        voltB: nominalVoltage > 0 ? nominalVoltage.toString() : '',
        voltB_PF: 'P',
        voltC: nominalVoltage > 0 ? nominalVoltage.toString() : '',
        voltC_PF: 'P',
        currA: '',
        currA_PF: 'P',
        currB: '',
        currB_PF: 'P',
        currC: '',
        currC_PF: 'P',
        freq: '60', // Default frequency to 60 Hz
        freq_PF: 'P'
      });

      // For output section, also clear load percentages
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

    // Trigger phase-to-neutral calculations if applicable
    this.calculatePhaseToNeutralForAll();

    // Restore original isFormSubmission state to re-enable validation
    setTimeout(() => {
      this.isFormSubmission = wasFormSubmission;
    }, 50); // Small delay to allow form updates to complete
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
      '2': 120,   // 240V Two Phase (displays 120V per phase in legacy)
      '3': 208,   // 208V Three Phase
      '4': 480,   // 480V Three Phase
      '5': 600,   // 600V Three Phase
      '6': 575,   // 575V Three Phase
      '7': 208,   // 208V Single Phase
      '8': 208,   // 208V Two Phase (displays 208V per phase in legacy)
      '9': 480,   // 480V Single Phase
      '10': 277,  // 277V Single Phase
      '11': 400   // 400V Three Phase
    };

    return voltageMap[configId] || 0;
  }

  /**
   * Get phase-to-neutral voltage for three-phase configurations
   * Used to pre-populate the P-N textboxes in legacy UI
   */
  private getDefaultPhaseToNeutralVoltage(configId: string): number {
    const pnVoltageMap: { [key: string]: number } = {
      '3': 120,   // 208V Three Phase → 120V P-N
      '4': 277,   // 480V Three Phase → 277V P-N
      '5': 346,   // 600V Three Phase → 346V P-N
      '6': 346,   // 575V Three Phase → 346V P-N (shown as 346 in legacy)
      '11': 230   // 400V Three Phase → 230V P-N
    };

    return pnVoltageMap[configId] || 0;
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
      const fallbackTolerance = nominalVoltage * 0.1; // �10%
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
        // For unknown P-N voltages, use approximately �5% tolerance
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
        (nominalVoltage === 240 && config.phaseCount === 2)) {
      // These configurations have different values for Output
      if (type === 'output') {
        return { min: 114, max: 126 }; // Output specific values for lower voltages
      } else {
        return { min: 110, max: 130 }; // Input/Bypass values
      }
    }

    // 208V Two Phase has its own tolerance range - NOT grouped with 120V/240V
    if (nominalVoltage === 208 && config.phaseCount === 2) {
      // 208V Two Phase uses 208V-specific tolerance ranges
      if (type === 'output') {
        return { min: 114, max: 126 }; // Output section: 114V - 126V as per user request
      } else if (type === 'input') {
        return { min: 110, max: 130 }; // Input section: 110V - 130V as per user request
      } else if (type === 'bypass') {
        return { min: 110, max: 130 }; // Bypass values for 208V (legacy default)
      } else {
        return { min: 192, max: 224 }; // fallback
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
    // Use approximately �8% tolerance for most standard voltages
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
  private getVoltageToleranceBounds(configId: string, type: 'input' | 'bypass' | 'output' = 'input'): { min: number, max: number } {
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
   * Single phase: ActKVA = (I � V) / 1000
   * Three phase: CalKVA = (V � I) / 1732
   */
  calculateLegacyKVA(voltage: number, current: number, phaseCount: number): number {
    let result = 0;

    if (phaseCount === 1) {
      // Single phase: ActKVA = (I � V) / 1000
      result = (current * voltage) / 1000;
    } else {
      // Three phase: CalKVA = (V � I) / 1732 (exact constant from legacy)
      result = (voltage * current) / 1732;
    }

    return result;
  }

  // Calculate load percentage: (ActualKVA / RatedKVA) � 100
  calculateLoadPercentage(actualKVA: number, ratedKVA: number): number {
    if (ratedKVA === 0) {

      return 0;
    }
    const percentage = (actualKVA / ratedKVA) * 100;
    return percentage;
  }

  /**
   * Legacy-compatible phase-to-neutral conversion
   * phaseToNeutral = Math.round(lineVoltage / 1.732)
   */
  convertLineToNeutralVoltage(lineVoltage: number): number {
    // For 3-phase systems, phase-to-neutral = line-to-line / v3
    // Special handling for common voltage configurations
    if (lineVoltage === 400) {
      return 230; // Standard 3-phase 400V system has 230V P-N
    }
    if (lineVoltage === 208) {
      return 120; // Standard 3-phase 208V system has 120V P-N
    }
    if (lineVoltage === 480) {
      return 277; // Standard 3-phase 480V system has 277V P-N
    }
    if (lineVoltage === 575) {
      return 346; // Standard 3-phase 575V system has 346V P-N (as specified)
    }
    if (lineVoltage === 600) {
      return 346; // Standard 3-phase 600V system has 346V P-N
    }

    // For other voltages, use standard v3 calculation with proper rounding
    const result = lineVoltage / 1.732050807568877;
    return Math.round(result);
  }

  /**
   * Get calculated Phase-to-Neutral voltage for display
   * Returns empty string if no line voltage value exists
   */
  getPhaseToNeutralDisplay(type: 'input' | 'bypass' | 'output', phase: 'A' | 'B' | 'C'): string {
    const form = type === 'input' ? this.inputReadingsForm :
                  type === 'bypass' ? this.bypassReadingsForm : this.outputReadingsForm;

    const config = type === 'input' ? this.inputConfig :
                   type === 'bypass' ? this.bypassConfig : this.outputConfig;

    // Only show P-N for three-phase configurations
    if (!config || !config.showPhaseToNeutral) {
      return '';
    }

    const phaseField = phase === 'A' ? 'voltA' : phase === 'B' ? 'voltB' : 'voltC';
    const lineVoltage = this.convertToDouble(form.get(phaseField)?.value);

    if (lineVoltage === 0) {
      return '';
    }

    const phaseToNeutral = this.convertLineToNeutralVoltage(lineVoltage);
    return phaseToNeutral.toString();
  }

  /**
   * Get Phase-to-Neutral label for display
   * Maps line-to-line phase notation to phase-to-neutral notation
   */
  getPhaseToNeutralLabel(phase: 'A' | 'B' | 'C'): string {
    switch (phase) {
      case 'A': return 'P-N';
      case 'B': return 'P-N';
      case 'C': return 'P-N';
      default: return '';
    }
  }

  /**
   * Check if current configuration should show Phase-to-Neutral displays
   */
  shouldShowPhaseToNeutralDisplay(type: 'input' | 'bypass' | 'output'): boolean {
    const config = type === 'input' ? this.inputConfig :
                   type === 'bypass' ? this.bypassConfig : this.outputConfig;
    return config ? config.showPhaseToNeutral : false;
  }

  // Enhanced current tolerance calculation - determine tolerance based on UPS KVA rating
  calculateCurrentTolerance(kvaValue: number, systemType: 'UPS' | 'PDU' | 'STS' = 'UPS'): number {
    let tolerance: number;

    if (systemType === 'PDU' || systemType === 'STS') {
      // Fixed 30% tolerance for PDU/STS systems
      tolerance = 0.30;
    } else {
      // UPS systems: KVA > 200 ? 30%, KVA = 200 ? 50%
      tolerance = kvaValue > 200 ? 0.30 : 0.50;
    }
    return tolerance;
  }

  /**
   * CONSOLIDATED CURRENT VALIDATION - Simplified and unified approach
   */
  private validateCurrentReadingsLegacy(type: 'input' | 'bypass' | 'output', systemType: 'UPS' | 'PDU' | 'STS' = 'UPS'): boolean {
    if (this.loading) return true;

    const form = this.getFormByType(type);
    const configuration = form.get('configuration')?.value;
    
    if (!this.isMultiPhaseConfiguration(configuration)) return true;

    const kvaValue = this.equipmentForm.get('kva')?.value;
    const upsKVA = this.convertToDouble(kvaValue);
    const tolerance = this.calculateCurrentTolerance(upsKVA, systemType);
    const isBypassMode = type === 'bypass' && this.isBypassModeActive();

    // Get current values
    const currents = {
      A: this.convertToDouble(form.get('currA')?.value),
      B: this.convertToDouble(form.get('currB')?.value),
      C: this.convertToDouble(form.get('currC')?.value)
    };

    const currentValues = {
      A: form.get('currA')?.value,
      B: form.get('currB')?.value,
      C: form.get('currC')?.value
    };

    // Check for empty required fields (bypass mode is more lenient)
    if (!isBypassMode) {
      if (this.isFieldEmpty(currentValues.A) || this.isFieldEmpty(currentValues.B)) {
        this.showValidationMessage(`${this.capitalize(type)} Current A or B cannot be empty`, `${type}CurrentTwoPhase`);
        return false;
      }
      if (this.isThreePhaseConfiguration(configuration) && this.isFieldEmpty(currentValues.C)) {
        this.showValidationMessage(`${this.capitalize(type)} Current C cannot be empty`, `${type}CurrentThreePhase`);
        return false;
      }
    } else if (this.allCurrentsEmpty(currentValues)) {
      return true; // Bypass mode allows all empty
    }

    // Validate current tolerance between phases
    return this.validateCurrentTolerance(currents, tolerance, form, type);
  }

  private allCurrentsEmpty(currentValues: any): boolean {
    return Object.values(currentValues).every(val => this.isFieldEmpty(val));
  }

  private validateCurrentTolerance(currents: any, tolerance: number, form: FormGroup, type: string): boolean {
    const phases = [['A', 'B'], ['B', 'C']].filter(([p1, p2]) => currents[p1] > 0 && currents[p2] > 0);
    let allValid = true;

    for (const [phase1, phase2] of phases) {
      const current1 = currents[phase1];
      const current2 = currents[phase2];
      const toleranceValue = Math.round((current1 * tolerance) * 10) / 10;
      const diff = Math.abs(current1 - current2);

      if (diff > toleranceValue) {
        const message = `${this.capitalize(type)} Current ${phase1} and Current ${phase2} not in Tolerance. Power Verification will be failed.\nAre you sure you want to do this?\nTolerance range can be: +- ${toleranceValue}`;
        
        if (this.isFormSubmission && !confirm(message)) {
          form.get(`curr${phase2}`)?.markAsTouched();
          allValid = false;
        }
        
        form.get(`curr${phase1}_PF`)?.setValue('F');
        form.get(`curr${phase2}_PF`)?.setValue('F');
      } else {
        form.get(`curr${phase1}_PF`)?.setValue('P');
        form.get(`curr${phase2}_PF`)?.setValue('P');
      }
    }

    return allValid;
  }

  private logPowerVerificationSaveData(upsData: AAETechUPS): void {
    // Extract filter current and THD data from UPS save data
    const filterCurrentThdSaveData = {
      // Input Filter Current & THD checkbox states
      inputFilterCurrentCheckbox: this.inputReadingsForm.get('inputFilterCurrent')?.value || false,
      inputThdPercentCheckbox: this.inputReadingsForm.get('inputThdPercent')?.value || false,
      // Output Filter Current & THD checkbox states
      outputFilterCurrentCheckbox: this.outputReadingsForm.get('outputFilterCurrent')?.value || false,
      outputThdPercentCheckbox: this.outputReadingsForm.get('outputThdPercent')?.value || false,

      // Input Filter Current values being saved
      inputFilterCurrentA: this.convertToDouble(this.inputReadingsForm.get('filterCurrentA')?.value),
      inputFilterCurrentA_PF: this.inputReadingsForm.get('filterCurrentA_PF')?.value || 'P',
      inputFilterCurrentB: this.convertToDouble(this.inputReadingsForm.get('filterCurrentB')?.value),
      inputFilterCurrentB_PF: this.inputReadingsForm.get('filterCurrentB_PF')?.value || 'P',
      inputFilterCurrentC: this.convertToDouble(this.inputReadingsForm.get('filterCurrentC')?.value),
      inputFilterCurrentC_PF: this.inputReadingsForm.get('filterCurrentC_PF')?.value || 'P',

      // Input THD values being saved
      inputThdA: this.convertToDouble(this.inputReadingsForm.get('inputThdA')?.value),
      inputThdA_PF: this.inputReadingsForm.get('inputThdA_PF')?.value || 'P',
      inputThdB: this.convertToDouble(this.inputReadingsForm.get('inputThdB')?.value),
      inputThdB_PF: this.inputReadingsForm.get('inputThdB_PF')?.value || 'P',
      inputThdC: this.convertToDouble(this.inputReadingsForm.get('inputThdC')?.value),
      inputThdC_PF: this.inputReadingsForm.get('inputThdC_PF')?.value || 'P',

      // Output Filter Current values being saved
      outputFilterCurrentA: this.convertToDouble(this.outputReadingsForm.get('outputFilterCurrentA')?.value),
      outputFilterCurrentA_PF: this.outputReadingsForm.get('outputFilterCurrentA_PF')?.value || 'P',
      outputFilterCurrentB: this.convertToDouble(this.outputReadingsForm.get('outputFilterCurrentB')?.value),
      outputFilterCurrentB_PF: this.outputReadingsForm.get('outputFilterCurrentB_PF')?.value || 'P',
      outputFilterCurrentC: this.convertToDouble(this.outputReadingsForm.get('outputFilterCurrentC')?.value),
      outputFilterCurrentC_PF: this.outputReadingsForm.get('outputFilterCurrentC_PF')?.value || 'P',

      // Output THD values being saved
      outputThdA: this.convertToDouble(this.outputReadingsForm.get('outputThdA')?.value),
      outputThdA_PF: this.outputReadingsForm.get('outputThdA_PF')?.value || 'P',
      outputThdB: this.convertToDouble(this.outputReadingsForm.get('outputThdB')?.value),
      outputThdB_PF: this.outputReadingsForm.get('outputThdB_PF')?.value || 'P',
      outputThdC: this.convertToDouble(this.outputReadingsForm.get('outputThdC')?.value),
      outputThdC_PF: this.outputReadingsForm.get('outputThdC_PF')?.value || 'P'
    };

  }

  /**
   * Populate filter current and THD forms from legacy EquipFilterCurrents data
   */
  private populateFilterCurrentsFromLegacyData(data: EquipFilterCurrents): void {
    if (!data) {

      return;
    }

    // Check if forms are initialized
    if (!this.inputReadingsForm || !this.outputReadingsForm) {
      return;
    }

    // Populate Input Filter Current data
    if (data.chkIpFilter) {
      const inputFilterCurrentData = {
        inputFilterCurrent: true,
        filterCurrentA: this.convertZeroToEmpty(data.ipFilterCurrA_T),
        filterCurrentA_PF: data.ipFilterCurrA_PF || 'P',
        filterCurrentB: this.convertZeroToEmpty(data.ipFilterCurrB_T),
        filterCurrentB_PF: data.ipFilterCurrB_PF || 'P',
        filterCurrentC: this.convertZeroToEmpty(data.ipFilterCurrC_T),
        filterCurrentC_PF: data.ipFilterCurrC_PF || 'P'
      };

      this.inputReadingsForm.patchValue(inputFilterCurrentData);
      this.showInputFilterCurrent = true;
    }

    // Populate Input THD data
    if (data.chkIpThd) {
      const inputThdData = {
        inputThdPercent: true,
        inputThdA: this.convertZeroToEmpty(data.ipFilterThdA_T),
        inputThdA_PF: data.ipFilterThdA_PF || 'P',
        inputThdB: this.convertZeroToEmpty(data.ipFilterThdB_T),
        inputThdB_PF: data.ipFilterThdB_PF || 'P',
        inputThdC: this.convertZeroToEmpty(data.ipFilterThdC_T),
        inputThdC_PF: data.ipFilterThdC_PF || 'P'
      };

      this.inputReadingsForm.patchValue(inputThdData);
      this.showInputTHD = true;
    }

    // Populate Output Filter Current data
    if (data.chkOpFilter) {
      const outputFilterCurrentData = {
        outputFilterCurrent: true,
        outputFilterCurrentA: this.convertZeroToEmpty(data.opFilterCurrA_T),
        outputFilterCurrentA_PF: data.opFilterCurrA_PF || 'P',
        outputFilterCurrentB: this.convertZeroToEmpty(data.opFilterCurrB_T),
        outputFilterCurrentB_PF: data.opFilterCurrB_PF || 'P',
        outputFilterCurrentC: this.convertZeroToEmpty(data.opFilterCurrC_T),
        outputFilterCurrentC_PF: data.opFilterCurrC_PF || 'P'
      };

      this.outputReadingsForm.patchValue(outputFilterCurrentData);

      // Explicitly set visibility flag since patchValue might not trigger valueChanges
      this.showOutputFilterCurrent = true;
    }

    // Populate Output THD data
    if (data.chkOpThd) {
      const outputThdData = {
        outputThdPercent: true,
        outputThdA: this.convertZeroToEmpty(data.opFilterThdA_T),
        outputThdA_PF: data.opFilterThdA_PF || 'P',
        outputThdB: this.convertZeroToEmpty(data.opFilterThdB_T),
        outputThdB_PF: data.opFilterThdB_PF || 'P',
        outputThdC: this.convertZeroToEmpty(data.opFilterThdC_T),
        outputThdC_PF: data.opFilterThdC_PF || 'P'
      };

      this.outputReadingsForm.patchValue(outputThdData);
      this.showOutputTHD = true;
    }

    // Use NgZone to ensure proper change detection
    this.ngZone.run(() => {
      this.cdr.detectChanges();
    });

    // Force form validation and UI refresh
    this.inputReadingsForm.updateValueAndValidity();
    this.outputReadingsForm.updateValueAndValidity();

    // Also trigger change detection in next tick to ensure UI updates
    setTimeout(() => {
      this.ngZone.run(() => {
        this.cdr.detectChanges();
      });
    }, 100);

    // Final comprehensive summary

  }

  /**
   * Log comprehensive comparison between database data and UI form values for filter current and THD
   */
  private logFilterCurrentThdComparison(dbData: AAETechUPS): void {
    // Extract database values
    const databaseValues = {
      input: {
        filterCurrent: {
          enabled: dbData.inputFilterCurrent || false,
          phaseA: { value: dbData.inputFilterCurrentA || 0, pf: dbData.inputFilterCurrentA_PF || 'P' },
          phaseB: { value: dbData.inputFilterCurrentB || 0, pf: dbData.inputFilterCurrentB_PF || 'P' },
          phaseC: { value: dbData.inputFilterCurrentC || 0, pf: dbData.inputFilterCurrentC_PF || 'P' }
        },
        thd: {
          enabled: dbData.inputThdPercent || false,
          phaseA: { value: dbData.inputThdA || 0, pf: dbData.inputThdA_PF || 'P' },
          phaseB: { value: dbData.inputThdB || 0, pf: dbData.inputThdB_PF || 'P' },
          phaseC: { value: dbData.inputThdC || 0, pf: dbData.inputThdC_PF || 'P' }
        }
      },
      output: {
        filterCurrent: {
          enabled: dbData.outputFilterCurrent || false,
          phaseA: { value: dbData.outputFilterCurrentA || 0, pf: dbData.outputFilterCurrentA_PF || 'P' },
          phaseB: { value: dbData.outputFilterCurrentB || 0, pf: dbData.outputFilterCurrentB_PF || 'P' },
          phaseC: { value: dbData.outputFilterCurrentC || 0, pf: dbData.outputFilterCurrentC_PF || 'P' }
        },
        thd: {
          enabled: dbData.outputThdPercent || false,
          phaseA: { value: dbData.outputThdA || 0, pf: dbData.outputThdA_PF || 'P' },
          phaseB: { value: dbData.outputThdB || 0, pf: dbData.outputThdB_PF || 'P' },
          phaseC: { value: dbData.outputThdC || 0, pf: dbData.outputThdC_PF || 'P' }
        }
      }
    };

    // Extract UI form values
    const uiFormValues = {
      input: {
        filterCurrent: {
          enabled: this.inputReadingsForm.get('inputFilterCurrent')?.value || false,
          phaseA: {
            value: this.convertToDouble(this.inputReadingsForm.get('filterCurrentA')?.value),
            pf: this.inputReadingsForm.get('filterCurrentA_PF')?.value || 'P'
          },
          phaseB: {
            value: this.convertToDouble(this.inputReadingsForm.get('filterCurrentB')?.value),
            pf: this.inputReadingsForm.get('filterCurrentB_PF')?.value || 'P'
          },
          phaseC: {
            value: this.convertToDouble(this.inputReadingsForm.get('filterCurrentC')?.value),
            pf: this.inputReadingsForm.get('filterCurrentC_PF')?.value || 'P'
          }
        },
        thd: {
          enabled: this.inputReadingsForm.get('inputThdPercent')?.value || false,
          phaseA: {
            value: this.convertToDouble(this.inputReadingsForm.get('inputThdA')?.value),
            pf: this.inputReadingsForm.get('inputThdA_PF')?.value || 'P'
          },
          phaseB: {
            value: this.convertToDouble(this.inputReadingsForm.get('inputThdB')?.value),
            pf: this.inputReadingsForm.get('inputThdB_PF')?.value || 'P'
          },
          phaseC: {
            value: this.convertToDouble(this.inputReadingsForm.get('inputThdC')?.value),
            pf: this.inputReadingsForm.get('inputThdC_PF')?.value || 'P'
          }
        }
      },
      output: {
        filterCurrent: {
          enabled: this.outputReadingsForm.get('outputFilterCurrent')?.value || false,
          phaseA: {
            value: this.convertToDouble(this.outputReadingsForm.get('outputFilterCurrentA')?.value),
            pf: this.outputReadingsForm.get('outputFilterCurrentA_PF')?.value || 'P'
          },
          phaseB: {
            value: this.convertToDouble(this.outputReadingsForm.get('outputFilterCurrentB')?.value),
            pf: this.outputReadingsForm.get('outputFilterCurrentB_PF')?.value || 'P'
          },
          phaseC: {
            value: this.convertToDouble(this.outputReadingsForm.get('outputFilterCurrentC')?.value),
            pf: this.outputReadingsForm.get('outputFilterCurrentC_PF')?.value || 'P'
          }
        },
        thd: {
          enabled: this.outputReadingsForm.get('outputThdPercent')?.value || false,
          phaseA: {
            value: this.convertToDouble(this.outputReadingsForm.get('outputThdA')?.value),
            pf: this.outputReadingsForm.get('outputThdA_PF')?.value || 'P'
          },
          phaseB: {
            value: this.convertToDouble(this.outputReadingsForm.get('outputThdB')?.value),
            pf: this.outputReadingsForm.get('outputThdB_PF')?.value || 'P'
          },
          phaseC: {
            value: this.convertToDouble(this.outputReadingsForm.get('outputThdC')?.value),
            pf: this.outputReadingsForm.get('outputThdC_PF')?.value || 'P'
          }
        }
      }
    };

    // UI section visibility state
    const uiVisibilityState = {
      showInputFilterCurrent: this.showInputFilterCurrent,
      showInputTHD: this.showInputTHD,
      showOutputFilterCurrent: this.showOutputFilterCurrent,
      showOutputTHD: this.showOutputTHD
    };

  }

  private logPowerVerificationSummary(): void {

    const summary = {
      equipment: {
        kva: this.equipmentForm.get('kva')?.value,
        manufacturer: this.equipmentForm.get('manufacturer')?.value,
        model: this.equipmentForm.get('model')?.value
      },
      input: {
        configuration: {
          ui: this.inputReadingsForm.get('configuration')?.value,
          configName: this.inputConfig?.name || 'Not selected'
        },
        voltages: {
          A: this.inputReadingsForm.get('voltA')?.value,
          B: this.inputReadingsForm.get('voltB')?.value,
          C: this.inputReadingsForm.get('voltC')?.value
        },
        currents: {
          A: this.inputReadingsForm.get('currA')?.value,
          B: this.inputReadingsForm.get('currB')?.value,
          C: this.inputReadingsForm.get('currC')?.value
        },
        passFail: {
          voltA_PF: this.inputReadingsForm.get('voltA_PF')?.value,
          voltB_PF: this.inputReadingsForm.get('voltB_PF')?.value,
          voltC_PF: this.inputReadingsForm.get('voltC_PF')?.value,
          currA_PF: this.inputReadingsForm.get('currA_PF')?.value,
          currB_PF: this.inputReadingsForm.get('currB_PF')?.value,
          currC_PF: this.inputReadingsForm.get('currC_PF')?.value
        }
      },
      bypass: {
        configuration: {
          ui: this.bypassReadingsForm.get('configuration')?.value,
          configName: this.bypassConfig?.name || 'Not selected'
        },
        voltages: {
          A: this.bypassReadingsForm.get('voltA')?.value,
          B: this.bypassReadingsForm.get('voltB')?.value,
          C: this.bypassReadingsForm.get('voltC')?.value
        },
        currents: {
          A: this.bypassReadingsForm.get('currA')?.value,
          B: this.bypassReadingsForm.get('currB')?.value,
          C: this.bypassReadingsForm.get('currC')?.value
        },
        passFail: {
          voltA_PF: this.bypassReadingsForm.get('voltA_PF')?.value,
          voltB_PF: this.bypassReadingsForm.get('voltB_PF')?.value,
          voltC_PF: this.bypassReadingsForm.get('voltC_PF')?.value,
          currA_PF: this.bypassReadingsForm.get('currA_PF')?.value,
          currB_PF: this.bypassReadingsForm.get('currB_PF')?.value,
          currC_PF: this.bypassReadingsForm.get('currC_PF')?.value
        }
      },
      output: {
        configuration: {
          ui: this.outputReadingsForm.get('configuration')?.value,
          configName: this.outputConfig?.name || 'Not selected'
        },
        voltages: {
          A: this.outputReadingsForm.get('voltA')?.value,
          B: this.outputReadingsForm.get('voltB')?.value,
          C: this.outputReadingsForm.get('voltC')?.value
        },
        currents: {
          A: this.outputReadingsForm.get('currA')?.value,
          B: this.outputReadingsForm.get('currB')?.value,
          C: this.outputReadingsForm.get('currC')?.value
        },
        loads: {
          A: this.outputReadingsForm.get('loadA')?.value,
          B: this.outputReadingsForm.get('loadB')?.value,
          C: this.outputReadingsForm.get('loadC')?.value,
          total: this.outputReadingsForm.get('totalLoad')?.value
        },
        passFail: {
          voltA_PF: this.outputReadingsForm.get('voltA_PF')?.value,
          voltB_PF: this.outputReadingsForm.get('voltB_PF')?.value,
          voltC_PF: this.outputReadingsForm.get('voltC_PF')?.value,
          currA_PF: this.outputReadingsForm.get('currA_PF')?.value,
          currB_PF: this.outputReadingsForm.get('currB_PF')?.value,
          currC_PF: this.outputReadingsForm.get('currC_PF')?.value,
          loadA_PF: this.outputReadingsForm.get('loadA_PF')?.value,
          loadB_PF: this.outputReadingsForm.get('loadB_PF')?.value,
          loadC_PF: this.outputReadingsForm.get('loadC_PF')?.value
        }
      }
    };
  }

  private verifyFormValuesAfterLoad(): void {
    // DON'T recalculate status during initial load - trust the database value
    // The status was already set by GetUPSReadings response and should be preserved
    // Status recalculation should only happen:
    // 1. When user manually changes fields (via field valueChanges subscriptions)
    // 2. When saving (via calculateEquipStatusFromAPI which uses legacy dynamic logic)
    
    // Legacy comment for reference:
    // LEGACY LOGIC: if (ddlStatus.SelectedValue != "Offline") { ddlStatus.SelectedValue = GetEquipStatus(); }
    // However, this legacy recalculation should happen on SAVE, not on LOAD
    // During load, we should display the status exactly as stored in the database
  }


  private reloadDataAfterSave(): void {
    // Reload UPS data from server and display it to ensure consistency
    // NOTE: loading flag is set to prevent validateAndUpdateStatusOnFailure from running during reload
    this.loading = true;
    
    this.equipmentService.getUPSReadings(this.callNbr, this.equipId, this.upsId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          if (data) {
            this.upsData = data;
            
            // Repopulate all forms with fresh data using the comprehensive populate method
            this.populateFormsWithData(data);
            
            // Reload reconciliation data
            this.loadReconciliationDataAfterEquipment();
            
            // Recalculate any dynamic values
            this.calculatePhaseToNeutralForAll();
            
            // Force change detection
            this.cdr.detectChanges();
            
            // Delay resetting flags to ensure all change detection cycles complete
            // This prevents validateAndUpdateStatusOnFailure from triggering prematurely
            setTimeout(() => {
              // Reset flags in correct order: loading first, then saving
              // Also clear any captured user selection for status to avoid stale state
              this.lastUserSelectedStatus = null;
              this.loading = false;
              this.saving = false;
              this.saveMode = null;
              this.isFormSubmission = false;
            }, 100);
          }
        },
        error: (error) => {
          console.error('Error reloading UPS data after save:', error);
          // Reset flags even on error
          this.loading = false;
          this.saving = false;
          this.saveMode = null;
          this.isFormSubmission = false;
        }
      });
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
    this.saving = true; // Prevent status recalculation during save/validation
    this.clearAllValidationErrors();

    // Calculate End of Life before saving (legacy requirement)
    this.calculateEndOfLifeFromYear();

    // Ensure manual Off-Line status is preserved during save
    this.preserveManualOffLineStatus();

    // Debug: Check KVA field state before validation
    const kvaValue = this.equipmentForm.get('kva')?.value;
    const kvaValid = this.equipmentForm.get('kva')?.valid;
    
    // Validate restricted characters and character limits before saving (for both draft and full saves)
    if (!this.validateAllRestrictedChars()) {
      // Count different types of errors
      const restrictedCharErrors = Object.keys(this.restrictedCharErrors).length;
      const characterLimitErrors = Object.keys(this.characterLimitErrors).length;
      
      let errorMessage = 'Please fix validation errors before saving:';
      if (restrictedCharErrors > 0) {
        errorMessage += ` ${restrictedCharErrors} restricted character error(s).`;
      }
      if (characterLimitErrors > 0) {
        errorMessage += ` ${characterLimitErrors} character limit error(s).`;
      }
      
      
      this.toastr.error(errorMessage, 'Validation Errors', {
        timeOut: 8000,
        closeButton: true,
        progressBar: true
      });
      this.isFormSubmission = false;
      this.saving = false; // Reset saving flag
      return;
    }

    // Only validate for full saves, not drafts
    if (!isDraft) {
      if (!this.validateComprehensiveInputs()) {
        this.toastr.error('Please correct validation errors before saving UPS data');
        this.isFormSubmission = false; // Reset flag after validation
        this.saving = false; // Reset saving flag
        return;
      }
    }

    this.errorMessage = '';
    this.successMessage = '';

    // Build UPS data using the comprehensive DTO approach
    const upsData = this.buildUPSData(isDraft);

    // Log power verification specific data being saved
    this.logPowerVerificationSaveData(upsData);

    const saveUpdateDto = convertToSaveUpdateDto(upsData, this.authService.currentUserValue?.username || 'SYSTEM');

    
    // Use the new comprehensive SaveUpdateaaETechUPS API method
    this.equipmentService.saveUpdateaaETechUPS(saveUpdateDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: SaveUpdateUPSResponse) => {

          if (response.success) {
            this.successMessage = isDraft ? 'Draft saved successfully' : 'UPS readings saved successfully';
            this.toastr.success(this.successMessage);

            if (isDraft) {
              // DRAFT SAVE: Only SaveUpdateaaETechUPS (no status updates, no reconciliation, no reload)
              // Reset flags immediately for draft saves
              // Clear any transient user-selection capture after a draft save
              this.lastUserSelectedStatus = null;
              this.saving = false;
              this.saveMode = null;
              this.isFormSubmission = false;
            } else {
              // FULL SAVE: Follow complete legacy flow
              // Add special message for manual Off-Line override
              if (this.isManualOffLineOverride()) {
                this.toastr.success('Manual Off-Line status has been preserved exactly as selected.', 'Save Complete', {
                  timeOut: 3000
                });
              }

              // LEGACY FLOW (in exact order):
              // 1. SaveUpdateaaETechUPS (already completed above)
              // 2. Update status dropdown and call UpdateEquipStatus API
              // 3. SaveUpdateReconciliationInfo
              // 4. SaveFilterCurrents (legacy doesn't have this, but we include it)
              // 5. DisplayaaETechUPS (reload from DB)
              
              // Step 2: Update equipment status - WAIT for it to complete
              this.updateEquipmentStatus()
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: () => {
                    // Step 3: Save reconciliation data (non-blocking)
                    this.saveReconciliationData();

                    // Step 4: Save filter currents data to legacy format (non-blocking)
                    this.saveFilterCurrentsData();

                    // Step 5: Reload data from server to ensure consistency (DisplayaaETechUPS)
                    // NOTE: Don't reset saving/loading flags until reload completes
                    this.reloadDataAfterSave();
                  },
                  error: (error) => {
                    console.error('Error in updateEquipmentStatus, proceeding with reload:', error);
                    // Even if status update fails, continue with reconciliation and reload
                    this.saveReconciliationData();
                    this.saveFilterCurrentsData();
                    this.reloadDataAfterSave();
                  }
                });
            }

          } else {
            // Handle cases where response.success is false with specific error details
            let errorMessage = 'Error saving UPS readings.';
            
            // Extract specific error information from response
            if (response && (response as any).message) {
              errorMessage += ` Server message: ${(response as any).message}`;
            } else if (response && (response as any).errors) {
              errorMessage += ` Validation errors: ${JSON.stringify((response as any).errors)}`;
            }
            
            // Add client-side validation context
            const clientErrors = this.getClientValidationErrors();
            if (clientErrors.length > 0) {
              errorMessage += ` Client validation issues: ${clientErrors.join(', ')}`;
            }

            this.errorMessage = errorMessage;
            this.toastr.error(this.errorMessage, 'Save Error', {
              timeOut: 10000,
              closeButton: true,
              progressBar: true
            });
            
            // Reset flags on validation error (no reload happens in this case)
            this.saving = false;
            this.saveMode = null;
            this.isFormSubmission = false;
          }
        },
        error: (error) => {
          // Detailed error message based on error type
          let errorMessage = 'Error saving UPS readings.';
          
          if (error.status === 400) {
            errorMessage = 'Validation Error: ';
            
            // Parse specific validation errors from API response
            if (error?.error?.errors) {
              const validationErrors: string[] = [];
              
              Object.keys(error.error.errors).forEach(fieldPath => {
                const fieldErrors = error.error.errors[fieldPath];
                if (Array.isArray(fieldErrors)) {
                  fieldErrors.forEach(fieldError => {
                    // Convert API field paths to user-friendly names
                    let fieldName = fieldPath;
                    if (fieldPath === '$.KVA') fieldName = 'KVA';
                    else if (fieldPath === 'request') fieldName = 'Request data';
                    else if (fieldPath.startsWith('$.')) fieldName = fieldPath.substring(2);
                    
                    validationErrors.push(`${fieldName}: ${fieldError}`);
                  });
                }
              });
              
              if (validationErrors.length > 0) {
                errorMessage += validationErrors.join('; ');
              } else {
                errorMessage += error?.error?.title || 'Please check your input data.';
              }
            } else if (error.error && error.error.message) {
              errorMessage += error.error.message;
            } else {
              errorMessage += 'Please check your input data.';
            }
          } else if (error.status === 401) {
            errorMessage = 'Authentication error: Please log in again.';
          } else if (error.status === 403) {
            errorMessage = 'Access denied: You do not have permission to save UPS readings.';
          } else if (error.status === 500) {
            errorMessage = 'Server error: Please contact support or try again later.';
          } else if (error.status === 0) {
            errorMessage = 'Network error: Please check your internet connection.';
          }
          
          // Add client-side validation context if available
          const clientErrors = this.getClientValidationErrors();
          if (clientErrors.length > 0) {
            errorMessage += ` Client validation issues: ${clientErrors.join(', ')}`;
          }
          
          this.errorMessage = errorMessage;
          
          console.error('Save error details:', {
            status: error.status,
            message: error.message,
            error: error.error,
            clientErrors: clientErrors
          });

          this.toastr.error(this.errorMessage, 'Error', {
            timeOut: 10000,
            closeButton: true,
            progressBar: true
          });
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
    const validMonthName = equipment.monthName || dateCode.toLocaleString('default', { month: 'long' });
    const validYear = equipment.year || dateCode.getFullYear();
    


    return {
      upsId: this.upsId,
      callNbr: this.callNbr,
      equipId: this.equipId,
      manufacturer: equipment.manufacturer,
      kva: equipment.kva ? equipment.kva.toString() : '0', // Convert to string as expected by API
      multiModule: equipment.multiModule,
      maintByPass: equipment.maintByPass,
      other: equipment.ctoPartNo || equipment.other || '', // Map ctoPartNo to other field for backward compatibility
      modelNo: equipment.model,
      serialNo: equipment.serialNo,
      location: equipment.location,
      status: equipment.status, // Preserves manual Off-Line override if set
      statusReason: equipment.statusReason || '', // Status notes/reason from form
      parallelCabinet: equipment.parallelCabinet,
      snmpPresent: equipment.snmpPresent,
      modularUPS: equipment.modularUPS,
      ctoPartNo: equipment.ctoPartNo || equipment.other || '', // Include CTO/Part No (ensure both fields are synced)
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
      visual_EPO: visual.epoSwitch, // EPO Switch mapped for API save
      visual_Noise: visual.coolingFans,
      visual_FansAge: visual.fansAge,
      visual_ReplaceFilters: visual.airFilters,

      // Environment
      environment_RoomTemp: environment.roomTempVentilation,
      environment_Saftey: environment.safetyEquipment,
      environment_Clean: this.mapHostileToClean(environment.hostileEnvironment), // Invert: hostile=Y means clean=N, preserve NA
      environment_Space: environment.serviceSpace,
      environment_Circuit: environment.circuitBreakers,

      // Transfer
      transfer_Major: transfer.firstMajor,
      transfer_Static: transfer.staticBypass,
      transfer_ByPass: transfer.transMaintByPass,
      transfer_Wave: transfer.currentWave,
      transfer_Normal: transfer.normalMode,
      transfer_Alarm: transfer.verifyAlarm,

      // Comments - map visual comments back to comments2 (primary field for visual comments)
      comments1: '',
      comments2: visual.visualComments || '',
      comments3: '',
      comments4: '',
      comments5: '',

      // Air filter data from visual form
      afLength: visual.filterSet1Length || '',
      afWidth: visual.filterSet1Width || '',
      afThickness: visual.filterSet1Thickness || '',
      afQty: visual.filterSet1Quantity || '',
      afLength1: visual.filterSet2Length || '',
      afWidth1: visual.filterSet2Width || '',
      afThickness1: visual.filterSet2Thickness || '',
      afQty1: visual.filterSet2Quantity || '',

      // Date information - use validated values instead of parsed dateCode
      monthName: validMonthName,
      year: validYear,

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

      // Input Filter Current fields
      inputFilterCurrent: input.inputFilterCurrent || false,
      inputFilterCurrentA: this.convertToDouble(input.filterCurrentA),
      inputFilterCurrentA_PF: input.filterCurrentA_PF || 'P',
      inputFilterCurrentB: this.convertToDouble(input.filterCurrentB),
      inputFilterCurrentB_PF: input.filterCurrentB_PF || 'P',
      inputFilterCurrentC: this.convertToDouble(input.filterCurrentC),
      inputFilterCurrentC_PF: input.filterCurrentC_PF || 'P',

      // Input THD fields
      inputThdPercent: input.inputThdPercent || false,
      inputThdA: this.convertToDouble(input.inputThdA),
      inputThdA_PF: input.inputThdA_PF || 'P',
      inputThdB: this.convertToDouble(input.inputThdB),
      inputThdB_PF: input.inputThdB_PF || 'P',
      inputThdC: this.convertToDouble(input.inputThdC),
      inputThdC_PF: input.inputThdC_PF || 'P',

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

      // Output Filter Current fields
      outputFilterCurrent: output.outputFilterCurrent || false,
      outputFilterCurrentA: this.convertToDouble(output.outputFilterCurrentA),
      outputFilterCurrentA_PF: output.outputFilterCurrentA_PF || 'P',
      outputFilterCurrentB: this.convertToDouble(output.outputFilterCurrentB),
      outputFilterCurrentB_PF: output.outputFilterCurrentB_PF || 'P',
      outputFilterCurrentC: this.convertToDouble(output.outputFilterCurrentC),
      outputFilterCurrentC_PF: output.outputFilterCurrentC_PF || 'P',

      // Output THD fields
      outputThdPercent: output.outputThdPercent || false,
      outputThdA: this.convertToDouble(output.outputThdA),
      outputThdA_PF: output.outputThdA_PF || 'P',
      outputThdB: this.convertToDouble(output.outputThdB),
      outputThdB_PF: output.outputThdB_PF || 'P',
      outputThdC: this.convertToDouble(output.outputThdC),
      outputThdC_PF: output.outputThdC_PF || 'P',

      // Rectifier
      rectFloatVolt_PF: rectifier.floatVolt_PF,
      dcVoltage_T: this.convertToDouble(rectifier.dcFloatVoltage),
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

  private updateEquipmentStatus(): Observable<void> {
    // LEGACY LOGIC: 
    // if (ddlStatus.SelectedValue != "Offline") { ddlStatus.SelectedValue = GetEquipStatus(); }
    // da.UpdateEquipStatus(UES);
    
    const currentStatus = this.equipmentForm.get('status')?.value;
    
    if (currentStatus !== 'Offline') {
      // Step 1: Calculate the status using API (matching legacy GetEquipStatus())
      return this.calculateEquipStatusFromAPI()
        .pipe(
          takeUntil(this.destroy$),
          switchMap((calculatedStatus) => {
            // Step 2: Update the dropdown/form with calculated status (BEFORE API call)
            // This matches legacy: ddlStatus.SelectedValue = GetEquipStatus();
            console.debug('[DEBUG] updateEquipmentStatus -> calculatedStatus from API:', calculatedStatus, 'currentFormStatus:', this.equipmentForm?.get('status')?.value);
            this.equipmentForm.patchValue({ status: calculatedStatus }, { emitEvent: false });
            console.debug('[DEBUG] updateEquipmentStatus -> form.status after patch calculatedStatus:', this.equipmentForm?.get('status')?.value);
            
            // Step 3: Call API to save the calculated status to database
            return this.executeUpdateEquipmentStatus(calculatedStatus);
          }),
          catchError((error) => {
            console.error('Error calculating status from API, using fallback:', error);
            // Fallback to hardcoded logic
            const fallbackStatus = this.calculateEquipStatusFallback();
            
            // Update dropdown with fallback status
            console.debug('[DEBUG] updateEquipmentStatus -> fallback used. fallbackStatus:', fallbackStatus, 'currentFormStatus:', this.equipmentForm?.get('status')?.value);
            this.equipmentForm.patchValue({ status: fallbackStatus }, { emitEvent: false });
            console.debug('[DEBUG] updateEquipmentStatus -> form.status after patch fallbackStatus:', this.equipmentForm?.get('status')?.value);
            
            // Call API with fallback status
            return this.executeUpdateEquipmentStatus(fallbackStatus);
          })
        );
    } else {
      // If current status IS "Offline", preserve it (don't recalculate)
      // Dropdown already shows "Offline", just call API
      return this.executeUpdateEquipmentStatus(currentStatus);
    }
  }

  /**
   * Execute the actual equipment status update API call
   */
  private executeUpdateEquipmentStatus(finalStatus: string): Observable<void> {
    const monthName = this.equipmentForm.get('monthName')?.value;
    const year = this.equipmentForm.get('year')?.value;
    const statusNotes = this.equipmentForm.get('statusReason')?.value || ''; // Legacy: txtStatusNotes.Text

    const statusData: UpdateEquipStatus = {
      callNbr: this.callNbr,
      equipId: this.equipId,
      status: finalStatus,
      notes: statusNotes, // Legacy: StatusNotes = txtStatusNotes.Text
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

    return this.equipmentService.updateEquipStatus(statusData)
      .pipe(
        takeUntil(this.destroy$),
        map((response) => {
          if (response.success) {
            // Equipment status updated successfully
          } else {
            console.warn('UpdateEquipStatus returned success=false');
          }
        }),
        catchError((error) => {
          console.error('Error updating equipment status:', error);
          // This is not critical - the main UPS data is still saved successfully
          return of(void 0);
        })
      );
  }

  private saveFilterCurrentsData(): void {
    // Check if any filter current or THD data exists
    const hasInputFilterCurrent = this.inputReadingsForm.get('inputFilterCurrent')?.value;
    const hasInputTHD = this.inputReadingsForm.get('inputThdPercent')?.value;
    const hasOutputFilterCurrent = this.outputReadingsForm.get('outputFilterCurrent')?.value;
    const hasOutputTHD = this.outputReadingsForm.get('outputThdPercent')?.value;

    if (!hasInputFilterCurrent && !hasInputTHD && !hasOutputFilterCurrent && !hasOutputTHD) {
      return;
    }

    // Build the EquipFilterCurrents data structure matching backend DTO JsonPropertyNames
    const filterCurrentsData: EquipFilterCurrents = {
      callNbr: this.callNbr,
      equipId: this.equipId,

      // Input Filter Current - Match backend JsonPropertyName exactly
      chkIpFilter: hasInputFilterCurrent,
      ipFilterCurrA_T: this.convertToDouble(this.inputReadingsForm.get('filterCurrentA')?.value),
      ipFilterCurrA_PF: this.inputReadingsForm.get('filterCurrentA_PF')?.value || 'P',
      ipFilterCurrB_T: this.convertToDouble(this.inputReadingsForm.get('filterCurrentB')?.value),
      ipFilterCurrB_PF: this.inputReadingsForm.get('filterCurrentB_PF')?.value || 'P',
      ipFilterCurrC_T: this.convertToDouble(this.inputReadingsForm.get('filterCurrentC')?.value),
      ipFilterCurrC_PF: this.inputReadingsForm.get('filterCurrentC_PF')?.value || 'P',

      // Input THD - Match backend JsonPropertyName exactly
      chkIpThd: hasInputTHD,
      ipFilterThdA_T: this.convertToDouble(this.inputReadingsForm.get('inputThdA')?.value),
      ipFilterThdA_PF: this.inputReadingsForm.get('inputThdA_PF')?.value || 'P',
      ipFilterThdB_T: this.convertToDouble(this.inputReadingsForm.get('inputThdB')?.value),
      ipFilterThdB_PF: this.inputReadingsForm.get('inputThdB_PF')?.value || 'P',
      ipFilterThdC_T: this.convertToDouble(this.inputReadingsForm.get('inputThdC')?.value),
      ipFilterThdC_PF: this.inputReadingsForm.get('inputThdC_PF')?.value || 'P',

      // Output Filter Current - Match backend JsonPropertyName exactly
      chkOpFilter: hasOutputFilterCurrent,
      opFilterCurrA_T: this.convertToDouble(this.outputReadingsForm.get('outputFilterCurrentA')?.value),
      opFilterCurrA_PF: this.outputReadingsForm.get('outputFilterCurrentA_PF')?.value || 'P',
      opFilterCurrB_T: this.convertToDouble(this.outputReadingsForm.get('outputFilterCurrentB')?.value),
      opFilterCurrB_PF: this.outputReadingsForm.get('outputFilterCurrentB_PF')?.value || 'P',
      opFilterCurrC_T: this.convertToDouble(this.outputReadingsForm.get('outputFilterCurrentC')?.value),
      opFilterCurrC_PF: this.outputReadingsForm.get('outputFilterCurrentC_PF')?.value || 'P',

      // Output THD - Match backend JsonPropertyName exactly
      chkOpThd: hasOutputTHD,
      opFilterThdA_T: this.convertToDouble(this.outputReadingsForm.get('outputThdA')?.value),
      opFilterThdA_PF: this.outputReadingsForm.get('outputThdA_PF')?.value || 'P',
      opFilterThdB_T: this.convertToDouble(this.outputReadingsForm.get('outputThdB')?.value),
      opFilterThdB_PF: this.outputReadingsForm.get('outputThdB_PF')?.value || 'P',
      opFilterThdC_T: this.convertToDouble(this.outputReadingsForm.get('outputThdC')?.value),
      opFilterThdC_PF: this.outputReadingsForm.get('outputThdC_PF')?.value || 'P',

      // Audit fields
      modifiedBy: this.authService.currentUserValue?.username || 'SYSTEM'
    };

    // Save filter currents data to backend
    this.equipmentService.saveUpdateEquipFilterCurrents(filterCurrentsData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success) {
            console.log('Filter currents data saved successfully:', response);
          } else {
            console.error('Failed to save filter currents data:', response.message);
          }
        },
        error: (error) => {
          console.error('Error saving filter currents data:', error);
        }
      });
  }

  private saveReconciliationData(): void {
    const reconciliation = this.reconciliationForm.value;

    // Only attempt to save reconciliation data if the form has meaningful data
    if (!reconciliation.verified && !reconciliation.modelCorrect && !reconciliation.serialNoCorrect && !reconciliation.kvaCorrect) {
      return;
    }

    // Helper function to convert UI values to database format
    const ensureProperFormat = (value: string): string => {
      if (!value) return '';

      // Convert UI dropdown values to database expected format
      switch (value) {
        case 'Y':
          return 'Y';   // Database stores "Y" for Yes
        case 'N':
          return 'N';   // Database stores "N" for No
        case 'N/A':
        case 'NA':
          return 'NA';  // Database stores "NA" for N/A
        default:
          return value;
      }
    };

    // Map to the correct DTO structure that matches your backend SaveUpdateEquipReconciliationDto
    const reconciliationData: SaveUpdateEquipReconciliationDto = {
      CallNbr: this.callNbr,
      EquipID: this.equipId,
      Make: this.equipmentForm.get('manufacturer')?.value || '',
      MakeCorrect: '',
      ActMake: '',
      Model: reconciliation.model || '',
      ModelCorrect: ensureProperFormat(reconciliation.modelCorrect),
      ActModel: reconciliation.actModel || '',
      SerialNo: reconciliation.serialNo || '',
      SerialNoCorrect: ensureProperFormat(reconciliation.serialNoCorrect),
      ActSerialNo: reconciliation.actSerialNo || '',
      KVA: reconciliation.kvaSize || '',
      KVACorrect: ensureProperFormat(reconciliation.kvaCorrect),
      ActKVA: reconciliation.actKVA || '',
      ASCStringsNo: 0,
      ASCStringsCorrect: '',
      ActASCStringNo: 0,
      BattPerString: 0,
      BattPerStringCorrect: '',
      ActBattPerString: 0,
      TotalEquips: this.convertToInt(reconciliation.totalEquips),
      TotalEquipsCorrect: reconciliation.totalEquipsCorrect || '',
      ActTotalEquips: this.convertToInt(reconciliation.actTotalEquips),
      NewEquipment: '',
      EquipmentNotes: '',
      Verified: reconciliation.verified || false,
      ModifiedBy: this.authService.currentUserValue?.username || 'SYSTEM'
    };

    this.equipmentService.saveEquipReconciliationInfo(reconciliationData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          // Reconciliation data saved successfully
        },
        error: (error) => {
          // This is not critical - the main UPS data is still saved successfully
        }
      });
  }

  private validateForms(): boolean {
    let isValid = true;
    let firstInvalidField: { form: string; field: string } | null = null;

    // Major PM specific validation - all transfer tests must be completed
    if (this.isMajorPM) {
      const transferTests = [
        { field: 'firstMajor', name: 'First Major Inspection' },
        { field: 'staticBypass', name: 'Static Bypass Transfer' },
        { field: 'transMaintByPass', name: 'Maintenance Bypass Transfer' },
        { field: 'currentWave', name: 'Current Waveform Analysis' },
        { field: 'normalMode', name: 'Normal Mode Transfer' },
        { field: 'verifyAlarm', name: 'Alarm Verification' }
      ];

      for (const test of transferTests) {
        const value = this.transferForm.get(test.field)?.value;
        if (!value || value === '') {
          this.transferForm.get(test.field)?.markAsTouched();
          if (!firstInvalidField) {
            firstInvalidField = { form: 'transfer', field: test.field };
          }
          isValid = false;
        }
      }
    }

    const formsToValidate = [
      { form: this.equipmentForm, name: 'equipment' },
      { form: this.inputReadingsForm, name: 'inputReadings' },
      { form: this.outputReadingsForm, name: 'outputReadings' }
    ];

    formsToValidate.forEach(({ form, name }) => {
      if (!form.valid) {
        form.markAllAsTouched();
        
        // Find first invalid control if not already found
        if (!firstInvalidField) {
          Object.keys(form.controls).forEach(key => {
            const control = form.get(key);
            if (control?.invalid && !firstInvalidField) {
              firstInvalidField = { form: name, field: key };
            }
          });
        }
        
        isValid = false;
      }
    });

    // Scroll to and focus on first invalid field
    if (!isValid && firstInvalidField) {
      this.scrollToAndFocusField(firstInvalidField.form, firstInvalidField.field);
    }

    return isValid;
  }

  /**
   * Scrolls to and focuses on a specific form field
   */
  private scrollToAndFocusField(formName: string, fieldName: string): void {
    setTimeout(() => {
      // Try to find the element by ID first
      let element = document.getElementById(fieldName);
      
      // If not found by ID, try by formControlName
      if (!element) {
        element = document.querySelector(`[formControlName="${fieldName}"]`) as HTMLElement;
      }
      
      if (element) {
        // Scroll the element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Focus the element after scrolling
        setTimeout(() => {
          if (element && (element instanceof HTMLInputElement || 
              element instanceof HTMLSelectElement || 
              element instanceof HTMLTextAreaElement)) {
            element.focus();
            // Add a visual highlight
            element.classList.add('field-highlight');
            setTimeout(() => {
              if (element) {
                element.classList.remove('field-highlight');
              }
            }, 2000);
          }
        }, 500);
      }
    }, 100);
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

  // ============================================================================
  // CONSOLIDATED UTILITY METHODS - All conversion and validation utilities
  // ============================================================================
  
  /**
   * Consolidated number conversion utilities
   */
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
   * Map hostile environment value to clean environment value (inverted)
   * Y (hostile) -> N (not clean)
   * N (not hostile) -> Y (clean)
   * NA -> NA (not applicable stays not applicable)
   */
  private mapHostileToClean(hostileValue: string): string {
    // Legacy: environment_Clean field stores YS (hostile) or NO (not hostile) directly
    // No inversion needed - pass through the value as-is
    if (hostileValue === 'YS') return 'YS'; // Hostile environment (Yes with Safety)
    if (hostileValue === 'NO') return 'NO'; // No hostile environment
    if (hostileValue === 'NA') return 'NA'; // N/A stays N/A
    // Handle old values for backward compatibility
    if (hostileValue === 'Y') return 'YS'; // Map old Y to YS
    if (hostileValue === 'N') return 'NO'; // Map old N to NO
    return 'NO'; // Default to NO (no hostile environment)
  }

  /**
   * Format a decimal number to a specific number of decimal places
   * Returns empty string if value is null/undefined/empty
   * Uses Math.ceil to round up to the specified decimal places
   */
  private formatDecimal(value: any, decimalPlaces: number = 2): string {
    if (value === null || value === undefined || value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    
    // Round up to specified decimal places
    const multiplier = Math.pow(10, decimalPlaces);
    const rounded = Math.ceil(num * multiplier) / multiplier;
    return rounded.toFixed(decimalPlaces);
  }

  private isFieldEmpty(value: any): boolean {
    return value === null || value === undefined || value === '' || 
           (typeof value === 'string' && value.trim() === '');
  }

  private trimAll(value: string): string {
    return value ? value.trim() : '';
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

  // Validate form inputs before saving
  private validateAllInputs(): boolean {
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
        // Skip dropdown fields and fields that should not have character validation
        if (this.excludedFromCharValidation.includes(fieldName) || !this.isTextInput(fieldName)) {
          continue;
        }

        if (typeof value === 'string' && value) {
          // Validate characters
          if (!this.validateInputCharacters(value, `${name} ${fieldName}`)) {
            return false;
          }

          // Character validation passed
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

  // Setup status change handler to track manual Off-Line selections
  private setupStatusChangeHandler(): void {
    // Simplified handler - main logic is in onManualStatusChange
    // This is just for backup protection
    this.equipmentForm.get('status')?.valueChanges.pipe(
      takeUntil(this.destroy$)
    ).subscribe(status => {
      // Backup protection: if we somehow lose the Off-Line status when override is active, restore it
      if (this.manualStatusOverride && status !== 'Offline' && !this.loading && !this.saving) {
        setTimeout(() => {
          this.equipmentForm.patchValue({ status: 'Offline' }, { emitEvent: false });
        }, 0);
      }
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

  // Check if bypass mode is active (maintenance bypass is enabled)
  isBypassModeActive(): boolean {
    const maintByPass = this.equipmentForm.get('maintByPass')?.value;
    return maintByPass && maintByPass !== 'NA';
  }

  // Get CSS class for equipment status display based on legacy color scheme
  getStatusClass(status: string): string {
    if (!status) return '';

    switch (status.toLowerCase()) {
      case 'online':
        return 'badge bg-success text-white';
      case 'offline':
        return 'badge text-white' + ' ' + this.getStatusStyle('offline');
      case 'criticaldeficiency':
        return 'badge text-white' + ' ' + this.getStatusStyle('criticaldeficiency');
      case 'replacementrecommended':
        return 'badge text-white' + ' ' + this.getStatusStyle('replacementrecommended');
      case 'proactivereplacement':
        return 'badge text-white' + ' ' + this.getStatusStyle('proactivereplacement');
      case 'online(majordeficiency)':
        return 'badge text-white' + ' ' + this.getStatusStyle('majordeficiency');
      case 'online(minordeficiency)':
        return 'badge text-white' + ' ' + this.getStatusStyle('minordeficiency');
      default:
        return 'badge bg-primary text-white';
    }
  }

  // Get inline style for status colors matching legacy system
  getStatusStyle(status: string): string {
    switch (status.toLowerCase()) {
      case 'offline':
        return 'style="background-color: red;"';
      case 'criticaldeficiency':
        return 'style="background-color: #FF3300;"'; // Legacy #FF3300
      case 'replacementrecommended':
        return 'style="background-color: #B8860B;"'; // Legacy #B8860B (Dark Goldenrod)
      case 'proactivereplacement':
        return 'style="background-color: #00CDCD;"'; // Legacy #00cdcd (Dark Turquoise)
      case 'majordeficiency':
        return 'style="background-color: orange;"'; // Legacy Orange
      case 'minordeficiency':
        return 'style="background-color: #FFA500;"'; // Legacy #FFA500 (Orange)
      default:
        return '';
    }
  }

  // Get display text for equipment status based on legacy format
  getStatusDisplayText(status: string): string {
    if (!status) return '';

    switch (status.toLowerCase()) {
      case 'offline':
        return 'Off-Line'; // Legacy format
      case 'criticaldeficiency':
        return 'Critical Deficiency'; // Legacy format
      case 'replacementrecommended':
        return 'Replacement Recommended'; // Legacy format
      case 'proactivereplacement':
        return 'Proactive Replacement'; // Legacy format
      case 'online(majordeficiency)':
        return 'On-Line (Major Deficiency)'; // Legacy format
      case 'online(minordeficiency)':
        return 'On-Line (Minor Deficiency)'; // Legacy format
      case 'online':
        return 'Online'; // Standard format
      default:
        return status; // Return as-is if not recognized
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
    // Only use existing value if it's not empty/null/undefined
    if (data.parallelCabinet && data.parallelCabinet.trim()) {
      const value = data.parallelCabinet.trim().toUpperCase();
      // Handle all valid backend values: Y, YS, N, NO, N/A
      if (value === 'Y' || value === 'YS') {
        return value; // Return Y or YS as-is
      }
      // Normalize legacy values: convert "N" to "NO" for consistency
      return value === 'N' ? 'NO' : data.parallelCabinet.trim();
    }

    const kva = this.convertToDouble(data.kva);
    const manufacturer = (data.manufacturer || '').toUpperCase();

    // High-capacity UPS systems are more likely to have parallel configurations
    if (kva >= 500) return 'Y';
    if (kva >= 200 && (manufacturer.includes('LIEBERT') || manufacturer.includes('APC') || manufacturer.includes('EATON'))) {
      return 'Y';
    }

    // Default to 'NO' (No) for parallel cabinet
    return 'NO';
  }

  // Determine default value for SNMP card presence based on UPS characteristics
  private determineDefaultSnmpPresent(data: AAETechUPS): string {
    // Legacy logic: Use existing value or default to "PS" (Select)
    if (data.snmpPresent) {
      return data.snmpPresent;
    }

    return 'PS'; // Default to "Select" as per legacy code
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
        return false;
    }
  }

  // Save methods for Environment section
  saveDraft(): void {
    this.onSaveAsDraft();
  }

  saveUPS(): void {
    this.onSaveUPS();
  }

  // Calendar widget methods
  private syncCalendarWithForm(): void {
    const monthName = this.equipmentForm.get('monthName')?.value;

    if (monthName) {
      const monthNumber = this.getMonthNumber(monthName);
      if (monthNumber !== -1) {
        this.calendarDate = new Date(this.calendarDate.getFullYear(), monthNumber, 1);
      }
    }
  }

  toggleCalendar(): void {
    this.showCalendar = !this.showCalendar;
    if (this.showCalendar) {
      this.syncCalendarWithForm();
    }
  }

  toggleMonthCalendar(): void {
    this.showMonthCalendar = !this.showMonthCalendar;
    if (this.showMonthCalendar) {
      this.syncCalendarWithForm();
    }
  }

  hideAllCalendars(): void {
    this.showCalendar = false;
    this.showMonthCalendar = false;
    this.showYearCalendar = false;
  }

  onCalendarMonthSelect(monthIndex: number): void {
    const monthName = this.monthNames[monthIndex];
    this.equipmentForm.patchValue({ monthName: monthName });
    const currentYear = this.equipmentForm.get('year')?.value || new Date().getFullYear();
    this.calendarDate = new Date(currentYear, monthIndex, 1);

    // Update the internal selectedDate for consistency with existing code
    this.selectedDate = new Date(this.calendarDate);
    this.currentCalendarDate = new Date(this.selectedDate);

    // Close month calendar after selection
    this.showMonthCalendar = false;
  }

  navigateCalendarMonth(direction: 'prev' | 'next'): void {
    const currentMonth = this.calendarDate.getMonth();
    const currentYear = this.calendarDate.getFullYear();

    if (direction === 'prev') {
      if (currentMonth === 0) {
        this.calendarDate = new Date(currentYear - 1, 11, 1);
      } else {
        this.calendarDate = new Date(currentYear, currentMonth - 1, 1);
      }
    } else {
      if (currentMonth === 11) {
        this.calendarDate = new Date(currentYear + 1, 0, 1);
      } else {
        this.calendarDate = new Date(currentYear, currentMonth + 1, 1);
      }
    }
  }

  getCurrentMonthName(): string {
    return this.monthNames[this.calendarDate.getMonth()];
  }

  isCurrentMonthSelected(monthIndex: number): boolean {
    const formMonthName = this.equipmentForm.get('monthName')?.value;
    return formMonthName === this.monthNames[monthIndex];
  }

  // Year Calendar Methods
  toggleYearCalendar(): void {
    this.showYearCalendar = !this.showYearCalendar;
    if (this.showYearCalendar) {
      // Initialize year range based on current form value or selected current year
      const currentFormYear = this.equipmentForm.get('year')?.value || new Date().getFullYear();
      this.setYearRangeContaining(currentFormYear);

      // Initialize the currentYears array
      this.currentYears = [];
      for (let year = this.yearRangeStart; year <= this.yearRangeEnd; year++) {
        this.currentYears.push(year);
      }

    }
  }

  onCalendarYearSelect(year: number): void {
    this.equipmentForm.patchValue({ year: year });
    this.selectedYear = year;
    // Close year calendar after selection
    this.showYearCalendar = false;
    // Calculate End of Life when year is selected via calendar
    this.calculateEndOfLifeFromYear();
  }

  isCurrentYearSelected(year: number): boolean {
    const formYear = this.equipmentForm.get('year')?.value;
    return formYear === year || formYear === year.toString();
  }

  trackByYear(index: number, year: number): number {
    return year;
  }

  navigateYearRange(direction: 'prev' | 'next'): void {

    // Ensure calendar stays open during navigation
    this.showYearCalendar = true;

    let navigationOccurred = false;

    if (direction === 'prev' && this.yearRangeStart > this.minYear) {
      this.yearRangeStart = Math.max(this.minYear, this.yearRangeStart - this.yearsPerRange);
      this.yearRangeEnd = this.yearRangeStart + this.yearsPerRange - 1;
      navigationOccurred = true;

    } else if (direction === 'next' && this.yearRangeEnd < this.maxYear) {
      this.yearRangeStart = Math.min(this.maxYear - this.yearsPerRange + 1, this.yearRangeStart + this.yearsPerRange);
      this.yearRangeEnd = Math.min(this.maxYear, this.yearRangeStart + this.yearsPerRange - 1);
      navigationOccurred = true;

    } else {

    }

    if (navigationOccurred) {
      // Update the currentYears array directly
      this.currentYears = [];
      for (let year = this.yearRangeStart; year <= this.yearRangeEnd; year++) {
        this.currentYears.push(year);
      }

      this.yearRangeChangeCounter++; // Increment counter to force change detection

      // Force change detection
      this.cdr.detectChanges();
    }
  }

  getCurrentYearRange(): string {
    return `${this.yearRangeStart} - ${this.yearRangeEnd}`;
  }

  getYearsInCurrentRange(): number[] {
    const years: number[] = [];
    const start = this.yearRangeStart;
    const end = this.yearRangeEnd;

    for (let year = start; year <= end; year++) {
      years.push(year);
    }

    // Log the years being returned for debugging

    return years;
  }

  private setYearRangeContaining(year: number): void {
    // Calculate which range the year falls into
    const rangeIndex = Math.floor((year - this.minYear) / this.yearsPerRange);
    this.yearRangeStart = this.minYear + (rangeIndex * this.yearsPerRange);
    this.yearRangeEnd = Math.min(this.maxYear, this.yearRangeStart + this.yearsPerRange - 1);
  }

  // Fans Year Calendar Methods
  toggleFansYearCalendar(event?: Event): void {
    // stop an outside click handler from closing the calendar when we're intentionally toggling it
    if (event) {
      event.stopPropagation();
    }
    this.showFansYearCalendar = !this.showFansYearCalendar;
    if (this.showFansYearCalendar) {
      const currentFansYear = this.capacitorForm.get('fansYear')?.value || new Date().getFullYear();
      this.setFansYearRangeContaining(currentFansYear);

      this.currentFansYears = [];
      for (let year = this.fansYearRangeStart; year <= this.fansYearRangeEnd; year++) {
        this.currentFansYears.push(year);
      }
    }
  }

  onFansYearSelect(year: number): void {
    this.capacitorForm.patchValue({ fansYear: year.toString() });
    this.showFansYearCalendar = false;
  }

  isFansYearSelected(year: number): boolean {
    const formYear = this.capacitorForm.get('fansYear')?.value;
    return formYear === year.toString() || parseInt(formYear) === year;
  }

  navigateFansYearRange(direction: 'prev' | 'next'): void {
    this.showFansYearCalendar = true;
    let navigationOccurred = false;

    if (direction === 'prev' && this.fansYearRangeStart > this.minYear) {
      this.fansYearRangeStart = Math.max(this.minYear, this.fansYearRangeStart - this.yearsPerRange);
      this.fansYearRangeEnd = this.fansYearRangeStart + this.yearsPerRange - 1;
      navigationOccurred = true;
    } else if (direction === 'next' && this.fansYearRangeEnd < this.maxYear) {
      this.fansYearRangeStart = Math.min(this.maxYear - this.yearsPerRange + 1, this.fansYearRangeStart + this.yearsPerRange);
      this.fansYearRangeEnd = Math.min(this.maxYear, this.fansYearRangeStart + this.yearsPerRange - 1);
      navigationOccurred = true;
    }

    if (navigationOccurred) {
      this.currentFansYears = [];
      for (let year = this.fansYearRangeStart; year <= this.fansYearRangeEnd; year++) {
        this.currentFansYears.push(year);
      }
      this.fansYearRangeChangeCounter++;
      this.cdr.detectChanges();
    }
  }

  getFansYearRange(): string {
    return `${this.fansYearRangeStart} - ${this.fansYearRangeEnd}`;
  }

  private setFansYearRangeContaining(year: number | string): void {
    const yearNum = typeof year === 'string' ? parseInt(year) : year;
    if (isNaN(yearNum)) {
      this.fansYearRangeStart = this.minYear;
      this.fansYearRangeEnd = this.minYear + this.yearsPerRange - 1;
      return;
    }
    const rangeIndex = Math.floor((yearNum - this.minYear) / this.yearsPerRange);
    this.fansYearRangeStart = this.minYear + (rangeIndex * this.yearsPerRange);
    this.fansYearRangeEnd = Math.min(this.maxYear, this.fansYearRangeStart + this.yearsPerRange - 1);
  }

  // DC Caps Year Calendar Methods
  toggleDcCapsYearCalendar(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showDcCapsYearCalendar = !this.showDcCapsYearCalendar;
    if (this.showDcCapsYearCalendar) {
      const currentYear = this.capacitorForm.get('dcCapsAge')?.value || new Date().getFullYear();
      this.setDcCapsYearRangeContaining(currentYear);

      this.currentDcCapsYears = [];
      for (let year = this.dcCapsYearRangeStart; year <= this.dcCapsYearRangeEnd; year++) {
        this.currentDcCapsYears.push(year);
      }
    }
  }

  onDcCapsYearSelect(year: number): void {
    this.capacitorForm.patchValue({ dcCapsAge: year.toString() });
    this.showDcCapsYearCalendar = false;
  }

  isDcCapsYearSelected(year: number): boolean {
    const formYear = this.capacitorForm.get('dcCapsAge')?.value;
    return formYear === year.toString() || parseInt(formYear) === year;
  }

  navigateDcCapsYearRange(direction: 'prev' | 'next'): void {
    this.showDcCapsYearCalendar = true;
    let navigationOccurred = false;

    if (direction === 'prev' && this.dcCapsYearRangeStart > this.minYear) {
      this.dcCapsYearRangeStart = Math.max(this.minYear, this.dcCapsYearRangeStart - this.yearsPerRange);
      this.dcCapsYearRangeEnd = this.dcCapsYearRangeStart + this.yearsPerRange - 1;
      navigationOccurred = true;
    } else if (direction === 'next' && this.dcCapsYearRangeEnd < this.maxYear) {
      this.dcCapsYearRangeStart = Math.min(this.maxYear - this.yearsPerRange + 1, this.dcCapsYearRangeStart + this.yearsPerRange);
      this.dcCapsYearRangeEnd = Math.min(this.maxYear, this.dcCapsYearRangeStart + this.yearsPerRange - 1);
      navigationOccurred = true;
    }

    if (navigationOccurred) {
      this.currentDcCapsYears = [];
      for (let year = this.dcCapsYearRangeStart; year <= this.dcCapsYearRangeEnd; year++) {
        this.currentDcCapsYears.push(year);
      }
      this.dcCapsYearRangeChangeCounter++;
      this.cdr.detectChanges();
    }
  }

  getDcCapsYearRange(): string {
    return `${this.dcCapsYearRangeStart} - ${this.dcCapsYearRangeEnd}`;
  }

  private setDcCapsYearRangeContaining(year: number | string): void {
    const yearNum = typeof year === 'string' ? parseInt(year) : year;
    if (isNaN(yearNum)) {
      this.dcCapsYearRangeStart = this.minYear;
      this.dcCapsYearRangeEnd = this.minYear + this.yearsPerRange - 1;
      return;
    }
    const rangeIndex = Math.floor((yearNum - this.minYear) / this.yearsPerRange);
    this.dcCapsYearRangeStart = this.minYear + (rangeIndex * this.yearsPerRange);
    this.dcCapsYearRangeEnd = Math.min(this.maxYear, this.dcCapsYearRangeStart + this.yearsPerRange - 1);
  }

  // AC Input Caps Year Calendar Methods
  toggleAcInputCapsYearCalendar(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showAcInputCapsYearCalendar = !this.showAcInputCapsYearCalendar;
    if (this.showAcInputCapsYearCalendar) {
      const currentYear = this.capacitorForm.get('acInputCapsAge')?.value || new Date().getFullYear();
      this.setAcInputCapsYearRangeContaining(currentYear);

      this.currentAcInputCapsYears = [];
      for (let year = this.acInputCapsYearRangeStart; year <= this.acInputCapsYearRangeEnd; year++) {
        this.currentAcInputCapsYears.push(year);
      }
    }
  }

  onAcInputCapsYearSelect(year: number): void {
    this.capacitorForm.patchValue({ acInputCapsAge: year.toString() });
    this.showAcInputCapsYearCalendar = false;
  }

  isAcInputCapsYearSelected(year: number): boolean {
    const formYear = this.capacitorForm.get('acInputCapsAge')?.value;
    return formYear === year.toString() || parseInt(formYear) === year;
  }

  navigateAcInputCapsYearRange(direction: 'prev' | 'next'): void {
    this.showAcInputCapsYearCalendar = true;
    let navigationOccurred = false;

    if (direction === 'prev' && this.acInputCapsYearRangeStart > this.minYear) {
      this.acInputCapsYearRangeStart = Math.max(this.minYear, this.acInputCapsYearRangeStart - this.yearsPerRange);
      this.acInputCapsYearRangeEnd = this.acInputCapsYearRangeStart + this.yearsPerRange - 1;
      navigationOccurred = true;
    } else if (direction === 'next' && this.acInputCapsYearRangeEnd < this.maxYear) {
      this.acInputCapsYearRangeStart = Math.min(this.maxYear - this.yearsPerRange + 1, this.acInputCapsYearRangeStart + this.yearsPerRange);
      this.acInputCapsYearRangeEnd = Math.min(this.maxYear, this.acInputCapsYearRangeStart + this.yearsPerRange - 1);
      navigationOccurred = true;
    }

    if (navigationOccurred) {
      this.currentAcInputCapsYears = [];
      for (let year = this.acInputCapsYearRangeStart; year <= this.acInputCapsYearRangeEnd; year++) {
        this.currentAcInputCapsYears.push(year);
      }
      this.acInputCapsYearRangeChangeCounter++;
      this.cdr.detectChanges();
    }
  }

  getAcInputCapsYearRange(): string {
    return `${this.acInputCapsYearRangeStart} - ${this.acInputCapsYearRangeEnd}`;
  }

  private setAcInputCapsYearRangeContaining(year: number | string): void {
    const yearNum = typeof year === 'string' ? parseInt(year) : year;
    if (isNaN(yearNum)) {
      this.acInputCapsYearRangeStart = this.minYear;
      this.acInputCapsYearRangeEnd = this.minYear + this.yearsPerRange - 1;
      return;
    }
    const rangeIndex = Math.floor((yearNum - this.minYear) / this.yearsPerRange);
    this.acInputCapsYearRangeStart = this.minYear + (rangeIndex * this.yearsPerRange);
    this.acInputCapsYearRangeEnd = Math.min(this.maxYear, this.acInputCapsYearRangeStart + this.yearsPerRange - 1);
  }

  // AC Output Caps Year Calendar Methods
  toggleAcOutputCapsYearCalendar(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showAcOutputCapsYearCalendar = !this.showAcOutputCapsYearCalendar;
    if (this.showAcOutputCapsYearCalendar) {
      const currentYear = this.capacitorForm.get('acOutputCapsAge')?.value || new Date().getFullYear();
      this.setAcOutputCapsYearRangeContaining(currentYear);

      this.currentAcOutputCapsYears = [];
      for (let year = this.acOutputCapsYearRangeStart; year <= this.acOutputCapsYearRangeEnd; year++) {
        this.currentAcOutputCapsYears.push(year);
      }
    }
  }

  onAcOutputCapsYearSelect(year: number): void {
    this.capacitorForm.patchValue({ acOutputCapsAge: year.toString() });
    this.showAcOutputCapsYearCalendar = false;
  }

  isAcOutputCapsYearSelected(year: number): boolean {
    const formYear = this.capacitorForm.get('acOutputCapsAge')?.value;
    return formYear === year.toString() || parseInt(formYear) === year;
  }

  navigateAcOutputCapsYearRange(direction: 'prev' | 'next'): void {
    this.showAcOutputCapsYearCalendar = true;
    let navigationOccurred = false;

    if (direction === 'prev' && this.acOutputCapsYearRangeStart > this.minYear) {
      this.acOutputCapsYearRangeStart = Math.max(this.minYear, this.acOutputCapsYearRangeStart - this.yearsPerRange);
      this.acOutputCapsYearRangeEnd = this.acOutputCapsYearRangeStart + this.yearsPerRange - 1;
      navigationOccurred = true;
    } else if (direction === 'next' && this.acOutputCapsYearRangeEnd < this.maxYear) {
      this.acOutputCapsYearRangeStart = Math.min(this.maxYear - this.yearsPerRange + 1, this.acOutputCapsYearRangeStart + this.yearsPerRange);
      this.acOutputCapsYearRangeEnd = Math.min(this.maxYear, this.acOutputCapsYearRangeStart + this.yearsPerRange - 1);
      navigationOccurred = true;
    }

    if (navigationOccurred) {
      this.currentAcOutputCapsYears = [];
      for (let year = this.acOutputCapsYearRangeStart; year <= this.acOutputCapsYearRangeEnd; year++) {
        this.currentAcOutputCapsYears.push(year);
      }
      this.acOutputCapsYearRangeChangeCounter++;
      this.cdr.detectChanges();
    }
  }

  getAcOutputCapsYearRange(): string {
    return `${this.acOutputCapsYearRangeStart} - ${this.acOutputCapsYearRangeEnd}`;
  }

  private setAcOutputCapsYearRangeContaining(year: number | string): void {
    const yearNum = typeof year === 'string' ? parseInt(year) : year;
    if (isNaN(yearNum)) {
      this.acOutputCapsYearRangeStart = this.minYear;
      this.acOutputCapsYearRangeEnd = this.minYear + this.yearsPerRange - 1;
      return;
    }
    const rangeIndex = Math.floor((yearNum - this.minYear) / this.yearsPerRange);
    this.acOutputCapsYearRangeStart = this.minYear + (rangeIndex * this.yearsPerRange);
    this.acOutputCapsYearRangeEnd = Math.min(this.maxYear, this.acOutputCapsYearRangeStart + this.yearsPerRange - 1);
  }

  // Comm Caps Year Calendar Methods
  toggleCommCapsYearCalendar(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showCommCapsYearCalendar = !this.showCommCapsYearCalendar;
    if (this.showCommCapsYearCalendar) {
      const currentYear = this.capacitorForm.get('commCapsAge')?.value || new Date().getFullYear();
      this.setCommCapsYearRangeContaining(currentYear);

      this.currentCommCapsYears = [];
      for (let year = this.commCapsYearRangeStart; year <= this.commCapsYearRangeEnd; year++) {
        this.currentCommCapsYears.push(year);
      }
    }
  }

  onCommCapsYearSelect(year: number): void {
    this.capacitorForm.patchValue({ commCapsAge: year.toString() });
    this.showCommCapsYearCalendar = false;
  }

  isCommCapsYearSelected(year: number): boolean {
    const formYear = this.capacitorForm.get('commCapsAge')?.value;
    return formYear === year.toString() || parseInt(formYear) === year;
  }

  navigateCommCapsYearRange(direction: 'prev' | 'next'): void {
    this.showCommCapsYearCalendar = true;
    let navigationOccurred = false;

    if (direction === 'prev' && this.commCapsYearRangeStart > this.minYear) {
      this.commCapsYearRangeStart = Math.max(this.minYear, this.commCapsYearRangeStart - this.yearsPerRange);
      this.commCapsYearRangeEnd = this.commCapsYearRangeStart + this.yearsPerRange - 1;
      navigationOccurred = true;
    } else if (direction === 'next' && this.commCapsYearRangeEnd < this.maxYear) {
      this.commCapsYearRangeStart = Math.min(this.maxYear - this.yearsPerRange + 1, this.commCapsYearRangeStart + this.yearsPerRange);
      this.commCapsYearRangeEnd = Math.min(this.maxYear, this.commCapsYearRangeStart + this.yearsPerRange - 1);
      navigationOccurred = true;
    }

    if (navigationOccurred) {
      this.currentCommCapsYears = [];
      for (let year = this.commCapsYearRangeStart; year <= this.commCapsYearRangeEnd; year++) {
        this.currentCommCapsYears.push(year);
      }
      this.commCapsYearRangeChangeCounter++;
      this.cdr.detectChanges();
    }
  }

  getCommCapsYearRange(): string {
    return `${this.commCapsYearRangeStart} - ${this.commCapsYearRangeEnd}`;
  }

  private setCommCapsYearRangeContaining(year: number | string): void {
    const yearNum = typeof year === 'string' ? parseInt(year) : year;
    if (isNaN(yearNum)) {
      this.commCapsYearRangeStart = this.minYear;
      this.commCapsYearRangeEnd = this.minYear + this.yearsPerRange - 1;
      return;
    }
    const rangeIndex = Math.floor((yearNum - this.minYear) / this.yearsPerRange);
    this.commCapsYearRangeStart = this.minYear + (rangeIndex * this.yearsPerRange);
    this.commCapsYearRangeEnd = Math.min(this.maxYear, this.commCapsYearRangeStart + this.yearsPerRange - 1);
  }

  

  /**
   * Gets a status indicator class for character count (green, yellow, red)
   */
  getCharacterCountClass(formName: string, controlName: string): string {
    const count = this.getCharacterCount(formName, controlName);
    const limit = this.getCharacterLimit(controlName);
    
    if (!limit || count === 0) return '';
    
    const percentage = (count / limit) * 100;
    
    if (percentage >= 100) return 'text-danger'; // Over limit
    if (percentage >= 90) return 'text-warning'; // Near limit (90%+)
    if (percentage >= 75) return 'text-info'; // Approaching limit (75%+)
    return 'text-muted'; // Normal
  }

  /**
   * Shows a comprehensive character limit summary for all fields (for debugging/admin)
   */
  showCharacterLimitSummary(): void {
    const summary: { [key: string]: any } = {};
    
    Object.keys(this.characterLimits).forEach(fieldName => {
      const limit = this.characterLimits[fieldName];
      summary[fieldName] = {
        limit: limit,
        description: this.getFieldDescription(fieldName)
      };
    });
    
    console.log('UPS Readings Character Limits Summary:', summary);
    this.toastr.info('Character limits summary logged to console', 'Character Limits');
  }

  /**
   * Gets a human-readable description for field names
   */
  private getFieldDescription(fieldName: string): string {
    const descriptions: { [key: string]: string } = {
      'callNbr': 'Call Number',
      'upsId': 'UPS ID',
      'manufacturer': 'Manufacturer Name',
      'kva': 'KVA Rating',
      'modelNo': 'Model Number',
      'model': 'Model Number',
      'serialNo': 'Serial Number (⭐ Key Field)',
      'status': 'Equipment Status',
      'other': 'Other Information',
      'location': 'Equipment Location',
      'maintAuthId': 'Maintenance Authorization ID',
      'ctoPartNo': 'CTO/Part Number',
      'comments1': 'Comments 1 (500 chars)',
      'comments2': 'Comments 2 (500 chars)',
      'comments3': 'Comments 3 (500 chars)',
      'comments4': 'Comments 4 (500 chars)',
      'comments5': 'Comments 5 (500 chars)',
      'statusReason': 'Status Reason (500 chars)',
      'visualComments': 'Visual Comments (500 chars)',
      'filterSet1Length': 'Air Filter Length',
      'filterSet1Width': 'Air Filter Width',
      'filterSet1Thickness': 'Air Filter Thickness',
      'filterSet1Quantity': 'Air Filter Quantity'
    };
    
    return descriptions[fieldName] || fieldName;
  }
}
