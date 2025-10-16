import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { JobNotesInfoService } from '../../../core/services/job-notes-info.service';
import { AuthService } from '../../../modules/auth/services/auth.service';
import {
  JobInformation,
  EquipReconciliationInfo,
  EquipmentDetail,
  TechNote,
  JobNotesFormData,
  UpdateJobRequest,
  JobNotesParams,
  QUOTE_PRIORITY_OPTIONS,
  RECONCILIATION_OPTIONS
} from '../../../core/model/job-notes-info.model';

@Component({
  selector: 'app-job-notes-info',
  templateUrl: './job-notes-info.component.html',
  styleUrls: ['./job-notes-info.component.scss']
})
export class JobNotesInfoComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Route parameters
  callNbr: string = '';
  techName: string = '';
  status: string = '';

  // Forms
  jobNotesForm!: FormGroup;

  // Data
  jobInfo: JobInformation | null = null;
  reconciliationInfo: EquipReconciliationInfo | null = null;
  equipmentList: EquipmentDetail[] = [];
  otherTechs: string[] = [];
  deficiencyNotes: string = '';
  systemNotes: string = '';
  
  // Options
  quotePriorityOptions = QUOTE_PRIORITY_OPTIONS;
  reconciliationOptions = RECONCILIATION_OPTIONS;

  // UI State
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';
  showReconciliationNotes = false;
  isReadOnlyMode = false;

  // Tech notes
  techNotesArray: TechNote[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private jobNotesInfoService: JobNotesInfoService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {
    this.initializeForm();
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
      this.callNbr = params['CallNbr'] || '';
      this.techName = params['TechName'] || '';
      this.status = params['Status'] || '';

      // Set read-only mode if status is CON
      this.isReadOnlyMode = this.status === 'CON';
    });
  }

  private initializeForm(): void {
    this.jobNotesForm = this.fb.group({
      quotePriority: ['', Validators.required],
      reconciliationNewEquip: ['', Validators.required],
      reconciliationNotes: [''],
      deficiencyNotesVerified: [false, Validators.requiredTrue],
      techNotes: this.fb.array([])
    });

    // Watch reconciliation changes to show/hide notes field
    this.jobNotesForm.get('reconciliationNewEquip')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(value => {
        this.showReconciliationNotes = value === 'YS';
        if (this.showReconciliationNotes) {
          this.jobNotesForm.get('reconciliationNotes')?.setValidators([Validators.required]);
        } else {
          this.jobNotesForm.get('reconciliationNotes')?.clearValidators();
        }
        this.jobNotesForm.get('reconciliationNotes')?.updateValueAndValidity();
      });
  }

  private async loadData(): Promise<void> {
    if (!this.callNbr) {
      this.errorMessage = 'Invalid job number provided';
      this.loading = false;
      return;
    }

    try {
      this.loading = true;

      // Load job information
      await this.loadJobInformation();

      // Load reconciliation info
      await this.loadReconciliationInfo();

      // Load other technicians
      await this.loadOtherTechs();

      // Load equipment details and tech notes
      await this.loadEquipmentDetails();

      // Load deficiency notes
      await this.loadDeficiencyNotes();

      this.loading = false;
    } catch (error) {
      console.error('Error loading data:', error);
      this.errorMessage = 'Error loading job information';
      this.loading = false;
    }
  }

  private async loadJobInformation(): Promise<void> {
    try {
      this.jobInfo = await this.jobNotesInfoService.getJobInformation(this.callNbr, this.techName).toPromise() || null;
      
      if (this.jobInfo) {
        // Populate form with loaded data
        this.jobNotesForm.patchValue({
          quotePriority: this.jobInfo.qtePriority,
          deficiencyNotesVerified: this.jobInfo.defCheck
        });
      }
    } catch (error) {
      console.error('Error loading job information:', error);
      throw error;
    }
  }

  private async loadReconciliationInfo(): Promise<void> {
    try {
      this.reconciliationInfo = await this.jobNotesInfoService.getJobReconciliationInfo(this.callNbr, 0).toPromise() || null;
      
      if (this.reconciliationInfo) {
        this.jobNotesForm.patchValue({
          reconciliationNewEquip: this.reconciliationInfo.newEquipment,
          reconciliationNotes: this.reconciliationInfo.equipmentNotes
        });
        
        // Trigger show/hide logic for reconciliation notes
        this.showReconciliationNotes = this.reconciliationInfo.newEquipment === 'YS';
      }
    } catch (error) {
      console.error('Error loading reconciliation info:', error);
      // Don't throw - this might not exist for all jobs
    }
  }

  private async loadOtherTechs(): Promise<void> {
    try {
      this.otherTechs = await this.jobNotesInfoService.getDistinctTechs(this.callNbr, this.techName).toPromise() || [];
    } catch (error) {
      console.error('Error loading other techs:', error);
      this.otherTechs = [];
    }
  }

  private async loadEquipmentDetails(): Promise<void> {
    try {
      this.equipmentList = await this.jobNotesInfoService.getJobEquipmentInfo(this.callNbr).toPromise() || [];
      
      // Initialize tech notes form array
      this.initializeTechNotesForm();
    } catch (error) {
      console.error('Error loading equipment details:', error);
      this.equipmentList = [];
    }
  }

  private initializeTechNotesForm(): void {
    const techNotesArray = this.jobNotesForm.get('techNotes') as FormArray;
    techNotesArray.clear();

    // Parse existing tech notes from job info
    const existingNotes = this.parseExistingTechNotes();

    this.equipmentList.forEach((equipment, index) => {
      const noteText = existingNotes[index] || '';
      
      const techNoteGroup = this.fb.group({
        equipID: [equipment.equipID],
        equipNo: [equipment.equipNo],
        vendorId: [equipment.vendorId],
        version: [equipment.version],
        rating: [equipment.rating],
        serialID: [equipment.serialID],
        location: [equipment.location],
        noteText: [noteText, Validators.required]
      });

      techNotesArray.push(techNoteGroup);
    });
  }

  private parseExistingTechNotes(): string[] {
    if (!this.jobInfo?.pmVisualNotes) return [];

    try {
      // Parse the HTML table format from legacy system
      const notes: string[] = [];
      const techNotes = this.jobInfo.pmVisualNotes;
      
      // Extract notes from the ||</td></tr> pattern
      const matches = techNotes.split('||</td></tr>');
      
      matches.forEach(match => {
        // Extract text after the color style
        const colorIndex = match.indexOf('#2984c5');
        if (colorIndex >= 0) {
          const noteText = match.substring(colorIndex).replace("#2984c5'>", "").trim();
          if (noteText) {
            notes.push(noteText);
          }
        }
      });

      return notes;
    } catch (error) {
      console.error('Error parsing tech notes:', error);
      return [];
    }
  }

  private async loadDeficiencyNotes(): Promise<void> {
    try {
      // First try to get existing deficiency notes
      this.deficiencyNotes = await this.jobNotesInfoService.getDeficiencyNotes(this.callNbr).toPromise() || '';
      
      if (!this.deficiencyNotes) {
        // If no deficiency notes exist, check if tech entered readings
        const techEnteredReadings = this.didTechEnterReadings();
        
        if (techEnteredReadings) {
          // Generate system notes based on equipment info
          this.systemNotes = await this.jobNotesInfoService.getEquipInfoForDeficiencyNotes(this.callNbr).toPromise() || '';
        }
      } else {
        this.systemNotes = this.deficiencyNotes;
      }
    } catch (error) {
      console.error('Error loading deficiency notes:', error);
    }
  }

  /**
   * Check if tech entered readings by examining form checkboxes
   * Equivalent to DidTechEnterReadings() in legacy code which checked UI checkbox states
   */
  private didTechEnterReadings(): boolean {
    const techNotesArray = this.jobNotesForm.get('techNotes') as FormArray;
    
    // Check if any equipment has readings checkboxes checked
    for (let i = 0; i < techNotesArray.length; i++) {
      const control = techNotesArray.at(i);
      
      // Check various reading checkboxes based on equipment type
      if (control.get('chkMotor')?.value || 
          control.get('chkCompressor')?.value || 
          control.get('chkCondenser')?.value || 
          control.get('chkBlower')?.value || 
          control.get('chkReadings')?.value ||
          control.get('chkCapacitor')?.value) {
        return true;
      }
    }
    
    return false;
  }

  get techNotesFormArray(): FormArray {
    return this.jobNotesForm.get('techNotes') as FormArray;
  }

  async onRefreshNotes(): Promise<void> {
    try {
      this.systemNotes = await this.jobNotesInfoService.getEquipInfoForDeficiencyNotes(this.callNbr).toPromise() || '';
      
      // Insert the refreshed notes
      const result = await this.jobNotesInfoService.insertDeficiencyNotes(
        this.callNbr, 
        this.techName, 
        this.systemNotes, 
        'Deficiency'
      ).toPromise();

      if (result?.success) {
        this.toastr.success('Notes updated successfully');
      } else {
        this.errorMessage = result?.message || 'Error updating notes';
      }
    } catch (error) {
      console.error('Error refreshing notes:', error);
      this.errorMessage = 'Error updating notes';
    }
  }

  async onSave(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    try {
      this.saving = true;
      this.errorMessage = '';

      // Build tech notes HTML
      const techNotesHtml = this.buildTechNotesHtml();

      // Update job information
      const updateRequest: UpdateJobRequest = {
        callNbr: this.callNbr,
        svcDescr: this.jobInfo?.svcDescr || '',
        pmVisualNotes: techNotesHtml,
        techName: this.techName,
        qtePriority: this.jobNotesForm.get('quotePriority')?.value,
        chkNotes: this.jobNotesForm.get('deficiencyNotesVerified')?.value
      };

      const updateResult = await this.jobNotesInfoService.updateJobInformation(updateRequest).toPromise();

      if (updateResult?.success) {
        // Insert deficiency notes
        if (this.systemNotes) {
          const notesResult = await this.jobNotesInfoService.insertDeficiencyNotes(
            this.callNbr,
            this.techName,
            this.systemNotes,
            'Deficiency'
          ).toPromise();

          if (!notesResult?.success) {
            this.errorMessage = notesResult?.message || 'Error saving deficiency notes';
            this.saving = false;
            return;
          }
        }

        // Save reconciliation info
        await this.saveReconciliationInfo();

        this.successMessage = 'Update Successful';
        this.toastr.success('Job information updated successfully');
      } else {
        this.errorMessage = updateResult?.message || 'Error updating job information';
      }
    } catch (error) {
      console.error('Error saving:', error);
      this.errorMessage = 'Error occurred while updating job information';
    } finally {
      this.saving = false;
    }
  }

  private validateForm(): boolean {
    let isValid = true;
    let errorMsg = '';

    // Check if at least one quote priority is selected
    if (!this.jobNotesForm.get('quotePriority')?.value) {
      errorMsg += 'At least one Quote Priority must be selected\n';
      isValid = false;
    }

    // Check reconciliation selection
    if (!this.jobNotesForm.get('reconciliationNewEquip')?.value) {
      errorMsg += 'At least one checkbox value must be selected\n';
      isValid = false;
    }

    // Check reconciliation notes if "Yes" is selected
    if (this.showReconciliationNotes && !this.jobNotesForm.get('reconciliationNotes')?.value?.trim()) {
      errorMsg += 'Please enter the new equipment details\n';
      isValid = false;
    }

    // Check deficiency notes verification
    if (!this.jobNotesForm.get('deficiencyNotesVerified')?.value) {
      errorMsg += 'Please check that you have verified the deficiency notes and corrective action\n';
      isValid = false;
    }

    // Check tech notes for all equipment
    const techNotesArray = this.jobNotesForm.get('techNotes') as FormArray;
    for (let i = 0; i < techNotesArray.length; i++) {
      const noteControl = techNotesArray.at(i).get('noteText');
      if (!noteControl?.value?.trim()) {
        errorMsg += 'You must enter notes for all equipment\n';
        isValid = false;
        break;
      }
    }

    if (!isValid) {
      alert(errorMsg);
    }

    return isValid;
  }

  private buildTechNotesHtml(): string {
    let techNotesHtml = "<table class='tblform'>";

    const techNotesArray = this.jobNotesForm.get('techNotes') as FormArray;
    techNotesArray.controls.forEach(control => {
      const equipNo = control.get('equipNo')?.value;
      const vendorId = control.get('vendorId')?.value;
      const version = control.get('version')?.value;
      const rating = control.get('rating')?.value;
      const serialID = control.get('serialID')?.value;
      const location = control.get('location')?.value;
      const noteText = control.get('noteText')?.value;

      const labelText = `<b><u>${equipNo}</b> - Make : <b>${vendorId}</b> - Model : <b>${version}</b> - KVA / Batt : <b>${rating}</b> - Serial No : <b>${serialID}</b> - Location : <b>${location}<u></b>`;

      techNotesHtml += `<tr><td>${labelText}</td></tr><tr><td style='color:#2984c5'>${noteText}||</td></tr>`;
    });

    techNotesHtml += "</table>";
    return techNotesHtml;
  }

  private async saveReconciliationInfo(): Promise<void> {
    try {
      const reconciliationData: EquipReconciliationInfo = {
        callNbr: this.callNbr,
        equipID: 0,
        newEquipment: this.jobNotesForm.get('reconciliationNewEquip')?.value,
        equipmentNotes: this.jobNotesForm.get('reconciliationNotes')?.value || ''
      };

      const result = await this.jobNotesInfoService.saveUpdateJobReconciliationInfo(reconciliationData).toPromise();
      
      if (!result?.success) {
        this.errorMessage = result?.message || 'Error saving reconciliation information';
      }
    } catch (error) {
      console.error('Error saving reconciliation info:', error);
      this.errorMessage = 'Error saving reconciliation information';
    }
  }

  onGoBack(): void {
    const queryParams: any = {
      CallNbr: this.callNbr
    };

    this.router.navigate(['/jobs/job-list'], { queryParams });
  }

  // Helper methods for template
  get jobTitle(): string {
    if (!this.jobInfo) return '';
    
    return `Job Id : ${this.callNbr} -- Job Type: ${this.jobInfo.svcDescr || ''}`;
  }

  get otherTechsDisplay(): string {
    return this.otherTechs.length > 0 ? this.otherTechs.join(', ') : 'None';
  }

  getSiteHistoryUrl(): string {
    if (!this.jobInfo?.custNmbr) return '#';
    
    const custNmbr = this.jobInfo.custNmbr.includes('&') 
      ? this.jobInfo.custNmbr.replace('&', '%20')
      : this.jobInfo.custNmbr;
    
    return `MiscellaneousTasks.aspx?CustNmbr=${custNmbr}`;
  }

  getJobSummary(): string {
    return `Job Id: ${this.callNbr} - Tech: ${this.techName}`;
  }
}