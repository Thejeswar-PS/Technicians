import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { JobNotesInfoService } from '../../../core/services/job-notes-info.service';
import { AuthService } from '../../../modules/auth/services/auth.service';
import {
  JobInformation,
  EquipReconciliationInfo,
  EquipmentDetail,
  TechNote,
  DeficiencyNote,
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
  empId: string = '';

  // Forms
  jobNotesForm!: FormGroup;

  // Data
  jobInfo: JobInformation | null = null;
  reconciliationInfo: EquipReconciliationInfo | null = null;
  equipmentList: EquipmentDetail[] = [];
  otherTechs: string[] = [];
  deficiencyNotes: string = '';
  systemNotes: string = '';
  systemNotesHtml: SafeHtml | null = null;
  
  // Options
  quotePriorityOptions = QUOTE_PRIORITY_OPTIONS;
  reconciliationOptions = RECONCILIATION_OPTIONS;

  // UI State
  loading = true;
  saving = false;
  refreshing = false;
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
    private toastr: ToastrService,
    private sanitizer: DomSanitizer
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadUserContext();
    this.getRouteParams();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserContext(): void {
    try {
      const stored = localStorage.getItem('userData');
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);
      const possibleEmpId = (parsed?.empID ?? parsed?.empId ?? parsed?.EmpId ?? '').toString().trim();
      if (possibleEmpId) {
        this.empId = possibleEmpId;
      }
    } catch (error) {
      console.warn('Unable to load user context for empId:', error);
    }
  }

  private getRouteParams(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.callNbr = (params['CallNbr'] || '').trim();
      this.techName = (params['TechName'] || '').trim();
      this.status = (params['Status'] || '').trim();

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
  this.equipmentList = this.normalizeEquipmentList(this.equipmentList);
      
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
      const equipIdValue = this.getEquipmentIdValue(equipment);
      
      const techNoteGroup = this.fb.group({
        equipID: [equipIdValue],
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

      if (this.deficiencyNotes) {
        this.updateSystemNotes(this.deficiencyNotes);
        return;
      }

      // If no deficiency notes exist, check if tech entered readings
      const techEnteredReadings = this.didTechEnterReadings();

      if (techEnteredReadings) {
        const generatedNotes = await this.generateSystemNotesFromLegacyLogic();
        this.deficiencyNotes = generatedNotes;
        this.updateSystemNotes(generatedNotes);
      } else {
        this.updateSystemNotes('');
      }
    } catch (error) {
      console.error('Error loading deficiency notes:', error);
      this.updateSystemNotes('');
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

  private updateSystemNotes(notes: string): void {
    this.systemNotes = notes || '';
    this.systemNotesHtml = this.systemNotes
      ? this.sanitizer.bypassSecurityTrustHtml(this.systemNotes)
      : null;
  }

  private getEquipmentIdValue(equipment: EquipmentDetail): number {
    const rawValue = (equipment as any)?.equipID ?? (equipment as any)?.equipId ?? (equipment as any)?.EquipID ?? (equipment as any)?.EquipId;

    if (typeof rawValue === 'string') {
      const parsed = parseInt(rawValue.trim(), 10);
      return Number.isFinite(parsed) ? parsed : 0;
    }

    if (typeof rawValue === 'number') {
      return Number.isFinite(rawValue) ? rawValue : 0;
    }

    return 0;
  }

  private normalizeEquipmentList(equipment: EquipmentDetail[]): EquipmentDetail[] {
    return (equipment || []).map(item => {
      const normalizedId = this.getEquipmentIdValue(item);
      return {
        ...item,
        equipID: normalizedId,
        equipId: normalizedId
      } as EquipmentDetail;
    });
  }

  private async generateSystemNotesFromLegacyLogic(): Promise<string> {
    const safeValue = (value: any): string => (value ?? '').toString().trim();
    const jobDescriptionLower = (this.jobInfo?.svcDescr || '').toLowerCase();
    const countryCode = safeValue(this.jobInfo?.country).toUpperCase();
    const techTitle = countryCode === 'CANADA' ? 'Field Service Technician' : 'Field Service Engineer';

    let equipmentData: EquipmentDetail[] = this.equipmentList && this.equipmentList.length
      ? this.equipmentList
      : [];

    if (!equipmentData.length) {
      try {
        equipmentData = await this.jobNotesInfoService.getJobEquipmentInfo(this.callNbr).toPromise() || [];
        this.equipmentList = this.normalizeEquipmentList(equipmentData);
        equipmentData = this.equipmentList;
      } catch (error) {
        console.error('Error loading equipment details for deficiency notes:', error);
        return '';
      }
    }

    if (!equipmentData.length) {
      return '';
    }

    const noDeficiencyTable =
      "<table class='tblform'><tr><td  style='font-family:arial;font-size:9pt; color:Red;font-weight:bold;'><u><b>DEFICIENCIES NOTED</b></u></td></tr>" +
      "<tr><td style='font-family:arial;font-size:12pt; color:Green;font-weight:bold;'> No Problems Found</td></tr></table>";

    let finalNotes = '';
    let battStringCount = 0;

    for (const equipment of equipmentData) {
      const equipTypeRaw = safeValue(equipment.equipType);
      let equipType = equipTypeRaw.replace('MAINTENANCE', '').trim();
      const equipTypeUpper = equipType.toUpperCase();
      const pmType = safeValue(equipment.taskDescription);
      const vendor = safeValue(equipment.vendorId);
      const model = safeValue(equipment.version);
      const rating = safeValue(equipment.rating);
      const serial = safeValue(equipment.serialID);
      const location = safeValue(equipment.location);
  const dateCode = safeValue((equipment as any).dateCode ?? (equipment as any).DateCode);
  const equipId = this.getEquipmentIdValue(equipment);

      let heading = "<table class='tblform'><tr><td style='font-family:arial;font-size:9pt;font-weight:bold;'><u><b>PREVENTATIVE</b></u> </td></tr>" +
        `<tr><td>The DC Group ${techTitle} successfully performed all facets of the preventative inspection protocol as delineated in the preventative inspection procedure.</br></td></tr></table>`;

      let equipDetails = '';

      if (equipTypeUpper.includes('UPS')) {
        equipDetails = `<tr><td>Make : <b>${vendor}</b> - Model : <b>${model}</b> - Serial No : <b>${serial}</b> - KVA : <b>${rating} </b> - Location : <b>${location}</b>`;
      } else if (equipTypeUpper.includes('BATTERY')) {
        const isFullReplacement = jobDescriptionLower.includes('full battery replacement') ||
          jobDescriptionLower.includes('battery replacement (full)') ||
          jobDescriptionLower.includes('battery replacement - full');

        if (isFullReplacement) {
          heading = "<table class='tblform'><tr><td style='font-family:arial;font-size:9pt;'><u><b>FULL BATTERY REPLACEMENT</b></u> </td></tr>" +
            `<tr><td>The DC Group ${techTitle} successfully installed <b>(${rating}) ${vendor} ${model} </b>  batteries into the power system in accordance with the diagram of the battery layout and interconnect cables as previously prepared.</br></td></tr>` +
            "<tr><td style='font-family:arial;font-size:9pt;'>After thoroughly cleaning the connector posts, the bolts, washers, and nuts were replaced as needed and coated with antioxidant grease before installing new cabling as required. The bolts were then torqued to manufacturer's specifications and the battery plant was reconnected to the UPS. The float voltage was verified and modified to meet manufacturer's specifications. The defective batteries were carefully disconnected from the UPS and removed. The defective batteries were taken to an Environmental Protection Agency certified battery depot for disposal.</td></tr>" +
            "<tr><td style='font-family:arial;font-size:9pt;'><br/>The batteries mentioned above were installed into the customer's</td></tr></table>";
        } else {
          equipDetails = `<tr><td>Make : <b>${vendor}</b> - Model : <b>${model}</b> - Serial No : <b>${serial}</b> - No of Batteries : <b>${rating} </b> - Location : <b>${location}</b>`;
        }
      } else {
        equipDetails = `<tr><td>Make : <b>${vendor}</b> - Model : <b>${model}</b> - Serial No : <b>${serial}</b> - Location : <b>${location}</b>`;
      }

      let pmHeading = 'PREVENTATIVE MAINTENANCE';
      if (pmType.includes('Major')) {
        pmHeading = `MAJOR ${equipType} PREVENTATIVE MAINTENANCE`;
      } else if (pmType.includes('Minor') || pmType.includes('Online')) {
        pmHeading = `MINOR ${equipType} PREVENTATIVE MAINTENANCE`;
      } else if (pmType) {
        pmHeading = pmType.toUpperCase();
      }
      pmHeading = pmHeading.replace(/\s+/g, ' ').trim();
      heading = heading.replace('PREVENTATIVE', pmHeading).replace('preventative', pmHeading.toLowerCase());

      let deficiencyNotes: DeficiencyNote[] = [];
      if (equipId > 0) {
        try {
          deficiencyNotes = await this.jobNotesInfoService
            .getAutoTechNotesByEquipType(this.callNbr, equipId, equipType)
            .toPromise() || [];
        } catch (error) {
          console.error(`Error loading auto tech notes for equipment ${equipId}:`, error);
          deficiencyNotes = [];
        }
      }

      let result = '';
      let bodyDef = '';
      let bodyAction = '';
      let battDesc = '';
      let newColumnName = '';
      let oldColumnName = '';
      let upsDesc = '';
      let upsCapAction = '';
      let defCount = 0;
      let count = 1;
      let actionCount = 1;

      const isBattery = equipType.trim().toUpperCase() === 'BATTERY';
      const isUps = equipTypeUpper.includes('UPS');

      if (deficiencyNotes.length > 0) {
        if (isBattery) {
          battStringCount += 1;
          defCount = Math.max(deficiencyNotes.length - 1, 0);
          result += heading;
          if (battStringCount > 1) {
            result = '';
          }
          bodyDef += `<table class='tblform'><tr><td><b> String # ${battStringCount}</b></td></tr>${equipDetails} </b></td></tr></td></tr><tr><td  style='font-family:arial;font-size:9pt; color:Red;font-weight:bold;'><u><b>DEFICIENCIES NOTED</b></u></td></tr>`;
        } else {
          defCount = deficiencyNotes.length;
          result += `${heading}<table class='tblform'>${equipDetails}</b></br></td></tr></table>`;
          bodyDef += "<table class='tblform'><tr><td  style='font-family:arial;font-size:9pt; color:Red;font-weight:bold;'><u><b>DEFICIENCIES NOTED</b></u></td></tr>";
        }

        bodyAction += "<table class='tblform'><tr><td  style='font-family:arial;font-size:9pt; color:Green;font-weight:bold;'><u><b>CORRECTIVE ACTION</b></u></td></tr>";

        for (let k = 0; k < defCount; k++) {
          const note = deficiencyNotes[k];
          const columnName = safeValue(note.columnName);
          const batteryId = safeValue(note.batteryID);
          const deficiencyText = safeValue(note.deficiency);
          const actionText = safeValue(note.action);
          const statusText = safeValue(note.status);

          if (isBattery) {
            let battDef = deficiencyText;
            if (columnName === 'DateCode' || columnName === 'BattProActiveReplace') {
              battDef = `${deficiencyText} (Date Code: ${dateCode})`;
            }

            if (columnName !== '') {
              if (columnName === oldColumnName) {
                battDesc = battDesc ? `${battDesc},${batteryId}` : batteryId;
              } else {
                battDesc = batteryId;
              }

              if (batteryId === '0') {
                bodyDef += `<tr><td class='border1'>${count}. ${battDef}</td> </tr>`;
                bodyAction += `<tr><td class='border1'>${actionCount}. ${actionText}</td> </tr>`;
                actionCount += 1;
                count += 1;
              } else {
                const nextNote = deficiencyNotes[k + 1];
                const nextColumnName = nextNote ? safeValue(nextNote.columnName) : '';

                if (columnName !== nextColumnName) {
                  bodyDef += `<tr><td class='border1'><b>${count}. Battery No:${battDesc} </b>: ${battDef}</td> </tr>`;
                  if (actionText.length > 0) {
                    bodyAction += `<tr><td class='border1'><b>${actionCount}. Battery No:${battDesc} </b>: ${actionText}</td> </tr>`;
                    actionCount += 1;
                  }
                  count += 1;
                }
              }
            }

            oldColumnName = columnName;
          } else if (isUps) {
            if (columnName.includes('CapsAge') && statusText === 'ReplacementRecommended') {
              if (k === defCount - 1) {
                upsDesc += deficiencyText.replace('Capacitors have reached end of life status due to age', '');
                upsCapAction = actionText;
                const prefix = upsDesc.length > 1 ? upsDesc.substring(0, upsDesc.length - 1) : upsDesc;
                bodyDef += `<tr> <td class='border1'><b>${count}. ${prefix}</b> Capacitors have reached end of life status due to age</td> </tr>`;
                bodyAction += `<tr><td class='border1'><b>${count}.</b> ${upsCapAction}</td> </tr>`;
                actionCount += 1;
                count += 1;
              } else {
                upsDesc += deficiencyText.replace('Capacitors have reached end of life status due to age', '') + ' / ';
                upsCapAction = actionText;
              }
            } else if (columnName.includes('CapsAge') && statusText === 'ProactiveReplacement') {
              if (k === defCount - 1) {
                upsDesc += deficiencyText.replace('Capacitors will reach their recommended replacement age within a year', '');
                upsCapAction = actionText;
                const prefix = upsDesc.length > 1 ? upsDesc.substring(0, upsDesc.length - 1) : upsDesc;
                bodyDef += `<tr> <td class='border1'><b>${count}. ${prefix}</b> Capacitors will reach their recommended replacement age within a year</td> </tr>`;
                bodyAction += `<tr><td class='border1'><b>${count}. </b> ${upsCapAction}</td> </tr>`;
                actionCount += 1;
                count += 1;
              } else {
                upsDesc += deficiencyText.replace('Capacitors will reach their recommended replacement age within a year', '') + ' / ';
                upsCapAction = actionText;
              }
            } else {
              if (upsDesc.length > 0) {
                const trimmedDesc = upsDesc.length > 2 ? upsDesc.substring(0, upsDesc.length - 2) : upsDesc;
                const prevStatus = k > 0 ? safeValue(deficiencyNotes[k - 1]?.status) : '';
                if (prevStatus === 'ProactiveReplacement') {
                  bodyDef += `<tr> <td class='border1'><b>${count}. ${trimmedDesc} </b> Capacitors will reach their recommended replacement age within a year</td> </tr>`;
                } else {
                  bodyDef += `<tr> <td class='border1'><b>${count}. ${trimmedDesc} </b> Capacitors have reached end of life status due to age</td> </tr>`;
                }
                bodyAction += `<tr><td class='border1'>${actionCount}. ${upsCapAction}<br/></td> </tr>`;
                actionCount += 1;
                count += 1;
                upsDesc = '';
              }

              bodyDef += `<tr> <td class='border1'>${count}. ${deficiencyText}</td> </tr>`;
              bodyAction += `<tr><td class='border1'>${actionCount}. ${actionText}</td> </tr>`;
              actionCount += 1;
              count += 1;
            }
          } else {
            bodyDef += `<tr> <td class='border1'>${count}. ${deficiencyText}</td> </tr>`;
            bodyAction += `<tr><td class='border1'>${actionCount}. ${actionText}</td> </tr>`;
            count += 1;
            actionCount += 1;
          }

          if (k === defCount - 1) {
            bodyDef += '<tr><td></td></tr>';
            bodyAction += '<tr><td></td></tr>';
          }
        }

        if (defCount > 0) {
          result += bodyDef + bodyAction + '</table>';
        } else {
          let noDefResult = `${result}<table class='tblform'> ${equipDetails}</b></br></td></tr><tr><td>${noDeficiencyTable} </td></tr></table>`;
          if (isBattery) {
            if (battStringCount > 1) {
              noDefResult = `<table class='tblform'> <tr><td><b>String #${battStringCount}</b></td></tr>${equipDetails}</b></br></td></tr><tr><td>${noDeficiencyTable} </td></tr></table>`;
            } else {
              const isFullReplacement = jobDescriptionLower.includes('full battery replacement') ||
                jobDescriptionLower.includes('battery replacement (full)') ||
                jobDescriptionLower.includes('battery replacement - full');
              noDefResult = isFullReplacement
                ? heading
                : heading + `<table class='tblform'> <tr><td><b>String #${battStringCount}</b></td></tr>${equipDetails}</b></br></td></tr><tr><td>${noDeficiencyTable} </td></tr></table>`;
            }
          }
          result = noDefResult;
        }
      } else {
        let noDefResult = `${heading}<table class='tblform'> ${equipDetails}</b></br></td></tr><tr><td>${noDeficiencyTable} </td></tr></table>`;
        if (isBattery) {
          battStringCount += 1;
          if (battStringCount > 1) {
            noDefResult = `<table class='tblform'> <tr><td><b>String #${battStringCount}</b></td></tr>${equipDetails}</b></br></td></tr><tr><td>${noDeficiencyTable} </td></tr></table>`;
          } else {
            const isFullReplacement = jobDescriptionLower.includes('full battery replacement') ||
              jobDescriptionLower.includes('battery replacement (full)') ||
              jobDescriptionLower.includes('battery replacement - full');
            noDefResult = isFullReplacement
              ? heading
              : heading + `<table class='tblform'> <tr><td><b>String #${battStringCount}</b></td></tr>${equipDetails}</b></br></td></tr><tr><td>${noDeficiencyTable} </td></tr></table>`;
          }
        }
        result = noDefResult;
      }

      finalNotes += result;
    }

    return finalNotes
      .replace(/class='tblform'/g, "style='width:100%; font-family:Arial; font-size:9pt;'")
      .replace(/class='border1'/g, "style='border:solid 1px #e3e3e3;'");
  }

  get techNotesFormArray(): FormArray {
    return this.jobNotesForm.get('techNotes') as FormArray;
  }

  async onRefreshNotes(): Promise<void> {
    try {
      this.refreshing = true;
      this.errorMessage = '';

      const refreshedNotes = await this.generateSystemNotesFromLegacyLogic();
      this.updateSystemNotes(refreshedNotes);
      this.deficiencyNotes = this.systemNotes;

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
    } finally {
      this.refreshing = false;
    }
  }

  async onSave(): Promise<void> {
    console.log('onSave called - form state:', {
      quotePriority: this.jobNotesForm.get('quotePriority')?.value,
      quotePriorityDirty: this.jobNotesForm.get('quotePriority')?.dirty,
      quotePriorityTouched: this.jobNotesForm.get('quotePriority')?.touched,
      reconciliationNewEquip: this.jobNotesForm.get('reconciliationNewEquip')?.value,
      reconciliationDirty: this.jobNotesForm.get('reconciliationNewEquip')?.dirty,
      reconciliationTouched: this.jobNotesForm.get('reconciliationNewEquip')?.touched,
      deficiencyNotesVerified: this.jobNotesForm.get('deficiencyNotesVerified')?.value
    });

    if (!this.validateForm()) {
      return;
    }

    try {
      this.saving = true;
      this.errorMessage = '';
      this.successMessage = '';

      // Build tech notes HTML
      const techNotesHtml = this.buildTechNotesHtml();

      // Normalize values and log for debugging
      const rawQuote = this.jobNotesForm.get('quotePriority')?.value;
      const rawRecon = this.jobNotesForm.get('reconciliationNewEquip')?.value;
      const rawChk = this.jobNotesForm.get('deficiencyNotesVerified')?.value;

      // Coerce to expected shapes: empty string when not selected, strict boolean for checkbox
      const qtePriority = rawQuote || '';
      const chkNotes = rawChk === true;

      console.log('Saving JobNotes - normalized values:', {
        qtePriority,
        reconciliationNewEquip: rawRecon || '',
        chkNotes,
        types: {
          qtePriority: typeof qtePriority,
          reconciliationNewEquip: typeof rawRecon,
          chkNotes: typeof chkNotes
        }
      });

      // Update job information
      const updateRequest: UpdateJobRequest = {
        callNbr: this.callNbr,
        svcDescr: this.jobInfo?.svcDescr || '',
        pmVisualNotes: techNotesHtml,
        techName: this.techName,
        qtePriority,
        chkNotes,
        changeby: this.empId?.trim() || ''
      };

      const errors: string[] = [];
      let updateSuccess = false;
      let deficiencySuccess = true;

      const updateResult = await this.jobNotesInfoService.updateJobInformation(updateRequest, this.empId).toPromise();
      if (updateResult?.success) {
        updateSuccess = true;
      } else {
        errors.push(updateResult?.message || 'Error updating job information.');
      }

      const reconciliationOutcome = await this.saveReconciliationInfo();
      if (!reconciliationOutcome.success) {
        errors.push(reconciliationOutcome.message || 'Error saving reconciliation information.');
      }

      if (updateSuccess) {
        const notesResult = await this.jobNotesInfoService.insertDeficiencyNotes(
          this.callNbr,
          this.techName,
          this.systemNotes ?? '',
          'Deficiency'
        ).toPromise();

        if (!notesResult?.success) {
          deficiencySuccess = false;
          errors.push(notesResult?.message || 'Error saving deficiency notes.');
        } else {
          this.deficiencyNotes = this.systemNotes ?? '';
        }
      }

      if (updateSuccess && deficiencySuccess && reconciliationOutcome.success && errors.length === 0) {
        this.successMessage = 'Update Successful.';
        this.toastr.success('Update Successful.');
      } else if (errors.length > 0) {
        this.errorMessage = errors.join(' ');
      }
    } catch (error) {
      console.error('Error saving:', error);
      this.errorMessage = 'Error occurred while updating job information.';
    } finally {
      this.saving = false;
    }
  }

  private validateForm(): boolean {
    let isValid = true;
    let errorMsg = '';

    // Require at least one of the two radio groups (Quote Priority OR Reconciliation)
    const quoteVal = this.jobNotesForm.get('quotePriority')?.value;
    const reconVal = this.jobNotesForm.get('reconciliationNewEquip')?.value;
    if (!quoteVal && !reconVal) {
      errorMsg += 'At least one of Quote Priority or Equipment Reconciliation must be selected\n';
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

  private async saveReconciliationInfo(): Promise<{ success: boolean; message?: string }> {
    try {
      const reconciliationData: EquipReconciliationInfo = {
        callNbr: this.callNbr,
        equipID: 0,
        newEquipment: this.jobNotesForm.get('reconciliationNewEquip')?.value,
        equipmentNotes: this.jobNotesForm.get('reconciliationNotes')?.value || ''
      };

      const result = await this.jobNotesInfoService.saveUpdateJobReconciliationInfo(reconciliationData).toPromise();
      
      if (!result?.success) {
        return { success: false, message: result?.message || 'Error saving reconciliation information' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving reconciliation info:', error);
      return { success: false, message: 'Error saving reconciliation information' };
    }
  }

  onGoBack(): void {
    const queryParams: any = {
      CallNbr: this.callNbr
    };

    this.router.navigate(['/jobs'], { queryParams });
  }

  // Helper methods for template
  get jobTitle(): string {
    if (!this.jobInfo) return '';
    
    return `Job Id : ${this.callNbr} -- Job Type: ${this.jobInfo.svcDescr || ''}`;
  }

  get otherTechsDisplay(): string {
    return this.otherTechs.length > 0 ? this.otherTechs.join(', ') : 'None';
  }

  /**
   * Returns true when both radio groups have a non-empty (trimmed) value.
   * This is used by the template to enable Save/Update when both options are selected
   * even if they were prefilled by server data (no need to be "touched").
   */
  get bothRadiosSelected(): boolean {
    try {
      const q = (this.jobNotesForm.get('quotePriority')?.value || '').toString().trim();
      const r = (this.jobNotesForm.get('reconciliationNewEquip')?.value || '').toString().trim();
      return q.length > 0 && r.length > 0;
    } catch (e) {
      return false;
    }
  }

  onViewSiteHistory(): void {
    if (!this.jobInfo?.custNmbr) return;
    
    this.router.navigate(['/miscellaneous-tasks'], {
      state: {
        task: 'PSH',
        siteId: this.jobInfo.custNmbr,
        autoSearch: true
      }
    });
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