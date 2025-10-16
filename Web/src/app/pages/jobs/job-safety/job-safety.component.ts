import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { JobSafetyService } from 'src/app/core/services/job-safety.service';
import { PreJobSafety, SAFETY_DROPDOWN_OPTIONS } from 'src/app/core/model/job-safety.model';
import { AuthService } from 'src/app/modules/auth';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-job-safety',
  templateUrl: './job-safety.component.html',
  styleUrls: ['./job-safety.component.scss']
})
export class JobSafetyComponent implements OnInit {
  safetyForm!: FormGroup;
  callNbr: string = '';
  loading: boolean = false;
  saving: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  
  // Dropdown options
  dropdownOptions = SAFETY_DROPDOWN_OPTIONS;
  
  // Conditional section visibility flags
  showLockoutSection: boolean = false;
  showChemicalSection: boolean = false;
  showConfinedSpaceSection: boolean = false;
  showCustomerProcSection: boolean = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private jobSafetyService: JobSafetyService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Get CallNbr from query parameters
    this.route.queryParams.subscribe(params => {
      this.callNbr = params['CallNbr'] || '';
      if (this.callNbr) {
        this.initializeForm();
        this.loadSafetyData();
      } else {
        this.errorMessage = 'Call Number is required';
      }
    });
  }

  /**
   * Initialize the reactive form with all safety checklist fields
   */
  private initializeForm(): void {
    this.safetyForm = this.fb.group({
      // Main questions (1-21)
      respReviewed: ['S', Validators.required],
      wpRequired: ['S', Validators.required],
      slipTripFail: ['S', Validators.required],
      noiseHazard: ['S', Validators.required],
      eyeInjury: ['S', Validators.required],
      dustMistFume: ['S', Validators.required],
      tempHazard: ['S', Validators.required],
      fireHazard: ['S', Validators.required],
      fireExtHazard: ['S', Validators.required],
      electricHazard: ['S', Validators.required],
      workingOverhead: ['S', Validators.required],
      trafficHazard: ['S', Validators.required],
      dcgIsolated: ['S', Validators.required],
      barricadeReqd: ['S', Validators.required],
      lockoutReqd: ['S', Validators.required],
      chemicalHazard: ['S', Validators.required],
      spaceRequired: ['S', Validators.required],
      custJobProcedure: ['S', Validators.required],
      protEquipReqd: ['S', Validators.required],
      otherContractors: ['S', Validators.required],
      anyOtherHazards: ['S', Validators.required],
      
      // Conditional sub-questions
      lockProcReqd: ['A'],           // Lockout section
      chemIdentified: ['A'],         // Chemical hazard section
      msdsReviewed: ['A'],
      healthHazard: ['A'],
      safetyShower: ['A'],
      hazardousWaste: ['A'],
      spaceProcReqd: ['A'],          // Confined space section
      safetyProcRevewed: ['A'],      // Customer procedure section
      specialEquipReqd: ['A'],
      toolsInspected: ['A'],
      apprLockouts: ['A'],
      
      // Comments
      comments: ['']
    });

    // Subscribe to conditional field changes
    this.setupConditionalSections();
  }

  /**
   * Set up conditional section display logic
   */
  private setupConditionalSections(): void {
    // Lockout section
    this.safetyForm.get('lockoutReqd')?.valueChanges.subscribe(value => {
      this.showLockoutSection = value === 'Y';
    });

    // Chemical hazard section
    this.safetyForm.get('chemicalHazard')?.valueChanges.subscribe(value => {
      this.showChemicalSection = value === 'Y';
    });

    // Confined space section
    this.safetyForm.get('spaceRequired')?.valueChanges.subscribe(value => {
      this.showConfinedSpaceSection = value === 'Y';
    });

    // Customer procedure section
    this.safetyForm.get('custJobProcedure')?.valueChanges.subscribe(value => {
      this.showCustomerProcSection = value === 'Y';
    });
  }

  /**
   * Load existing safety data for the job
   */
  private async loadSafetyData(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const safetyData = await this.jobSafetyService.getPreJobSafetyInfo(this.callNbr).toPromise();
      
      if (safetyData && safetyData.callNbr) {
        // Populate form with loaded data
        this.safetyForm.patchValue({
          respReviewed: safetyData.respReviewed || 'S',
          wpRequired: safetyData.wpRequired || 'S',
          slipTripFail: safetyData.slipTripFail || 'S',
          noiseHazard: safetyData.noiseHazard || 'S',
          eyeInjury: safetyData.eyeInjury || 'S',
          dustMistFume: safetyData.dustMistFume || 'S',
          tempHazard: safetyData.tempHazard || 'S',
          fireHazard: safetyData.fireHazard || 'S',
          fireExtHazard: safetyData.fireExtHazard || 'S',
          electricHazard: safetyData.electricHazard || 'S',
          workingOverhead: safetyData.workingOverhead || 'S',
          trafficHazard: safetyData.trafficHazard || 'S',
          dcgIsolated: safetyData.dcgIsolated || 'S',
          barricadeReqd: safetyData.barricadeReqd || 'S',
          lockoutReqd: safetyData.lockoutReqd || 'S',
          lockProcReqd: safetyData.lockProcReqd || 'A',
          chemicalHazard: safetyData.chemicalHazard || 'S',
          chemIdentified: safetyData.chemIdentified || 'A',
          msdsReviewed: safetyData.msdsReviewed || 'A',
          healthHazard: safetyData.healthHazard || 'A',
          safetyShower: safetyData.safetyShower || 'A',
          hazardousWaste: safetyData.hazardousWaste || 'A',
          spaceRequired: safetyData.spaceRequired || 'S',
          spaceProcReqd: safetyData.spaceProcReqd || 'A',
          custJobProcedure: safetyData.custJobProcedure || 'S',
          safetyProcRevewed: safetyData.safetyProcRevewed || 'A',
          specialEquipReqd: safetyData.specialEquipReqd || 'A',
          toolsInspected: safetyData.toolsInspected || 'A',
          apprLockouts: safetyData.apprLockouts || 'A',
          protEquipReqd: safetyData.protEquipReqd || 'S',
          otherContractors: safetyData.otherContractors || 'S',
          anyOtherHazards: safetyData.anyOtherHazards || 'S',
          comments: safetyData.comments || ''
        });

        // Update conditional section visibility
        this.showLockoutSection = safetyData.lockoutReqd === 'Y';
        this.showChemicalSection = safetyData.chemicalHazard === 'Y';
        this.showConfinedSpaceSection = safetyData.spaceRequired === 'Y';
        this.showCustomerProcSection = safetyData.custJobProcedure === 'Y';
      } else {
        // No existing safety data found
        this.successMessage = 'No Information Found. Please fill out the safety checklist.';
      }
    } catch (error) {
      console.error('Error loading safety data:', error);
      this.errorMessage = 'Error loading safety data. Please try again.';
      this.toastr.error(this.errorMessage, 'Error');
    } finally {
      this.loading = false;
    }
  }

  /**
   * Validate all dropdowns before saving
   */
  private validateForm(): boolean {
    let isValid = true;
    let errorMsg = '';

    // Check all main question dropdowns
    const mainQuestions = [
      'respReviewed', 'wpRequired', 'slipTripFail', 'noiseHazard', 'eyeInjury',
      'dustMistFume', 'tempHazard', 'fireHazard', 'fireExtHazard', 'electricHazard',
      'workingOverhead', 'trafficHazard', 'dcgIsolated', 'barricadeReqd', 'lockoutReqd',
      'chemicalHazard', 'spaceRequired', 'custJobProcedure', 'protEquipReqd',
      'otherContractors', 'anyOtherHazards'
    ];

    for (const field of mainQuestions) {
      const value = this.safetyForm.get(field)?.value;
      if (!value || value === 'S') {
        isValid = false;
        errorMsg = 'Please select a value from all dropdowns.';
        break;
      }
    }

    if (!isValid) {
      this.toastr.error(errorMsg, 'Validation Error');
    }

    return isValid;
  }

  /**
   * Save the safety checklist data
   */
  async onSave(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const formValues = this.safetyForm.value;
      const safetyData: PreJobSafety = {
        callNbr: this.callNbr,
        ...formValues
      };

      // Get empId from localStorage
      const userData = JSON.parse(localStorage.getItem("userData") || '{}');
      const empId = (userData.empID || '').trim();

      if (!empId) {
        this.errorMessage = 'Employee ID not found. Please login again.';
        this.toastr.error(this.errorMessage, 'Error');
        return;
      }

      const response = await this.jobSafetyService.saveUpdatePreJobSafety(safetyData, empId).toPromise();

      if (response?.success) {
        this.successMessage = 'Update Successful';
        this.toastr.success('Safety checklist saved successfully', 'Success');
      } else {
        this.errorMessage = response?.message || 'Error saving data';
        this.toastr.error(this.errorMessage, 'Error');
      }
    } catch (error: any) {
      console.error('Error saving safety data:', error);
      this.errorMessage = error?.error?.message || 'Error saving safety data. Please try again.';
      this.toastr.error(this.errorMessage, 'Error');
    } finally {
      this.saving = false;
    }
  }

  /**
   * Navigate back to job list
   */
  onGoBack(): void {
    this.router.navigate(['/jobs/job-list'], { queryParams: { CallNbr: this.callNbr } });
  }

  /**
   * Get page title with call number
   */
  get pageTitle(): string {
    return `Safety Checklist -- ${this.callNbr}`;
  }
}
