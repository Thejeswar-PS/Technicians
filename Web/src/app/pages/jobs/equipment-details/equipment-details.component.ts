import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { EquipmentDetail, UploadInfo, EquipmentDetailsParams, UploadResponse, ValidationResult } from 'src/app/core/model/equipment-details.model';
import { EquipmentService } from 'src/app/core/services/equipment.service';
import { AuthService } from 'src/app/modules/auth';

@Component({
  selector: 'app-equipment-details',
  templateUrl: './equipment-details.component.html',
  styleUrls: ['./equipment-details.component.scss']
})
export class EquipmentDetailsComponent implements OnInit {
  // Page parameters
  params: EquipmentDetailsParams = {
    callNbr: '',
    techName: '',
    techId: '',
    archive: '',
    year: ''
  };

  // Data
  equipmentList: EquipmentDetail[] = [];
  uploadInfo: UploadInfo[] = [];
  
  // UI state
  loading = false;
  errorMessage = '';
  successMessage = '';
  
  // Button states
  uploadJobEnabled = true;
  uploadJobVisible = true;        // Always visible like legacy
  uploadExpenseVisible = true;   // Controlled by server logic
  uploadExpenseEnabled = true;
  uploadFilesVisible = true;      // Always visible like legacy  
  enableExpenseVisible = true;   // Controlled by server logic
  helpButtonVisible = false;      // Controlled by server logic
  
    // File upload modal state
  showFileUploadModal = false;
  
  // Getter for template usage
  get jobId(): string {
    return this.params.callNbr;
  }
  
  // User info
  userRole = '';
  currentUserId = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private equipmentService: EquipmentService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadRouteParams();
    this.loadData();
  }

  private loadUserInfo(): void {
    // For now, use placeholder methods until AuthService is properly implemented
    this.userRole = 'Manager'; // Default role for testing
    this.currentUserId = '1'; // Default user ID for testing
  }

  private loadRouteParams(): void {
    this.route.queryParams.subscribe(params => {
      this.params = {
        callNbr: params['CallNbr'] || '',
        techName: params['TechName'] || '',
        techId: params['Tech'] || '',
        archive: params['Archive'] || '',
        year: params['Year'] || ''
      };
      
      if (!this.params.callNbr) {
        this.errorMessage = 'Invalid job number provided';
        return;
      }
    });
  }

  private loadData(): void {
    if (!this.params.callNbr) return;
    
    this.loading = true;
    this.errorMessage = '';
    
    // Load equipment info and upload info in parallel
    Promise.all([
      this.loadEquipmentInfo(),
      this.loadUploadInfo(),
      this.setupButtonStates()
    ]).finally(() => {
      this.loading = false;
    });
  }

  private async loadEquipmentInfo(): Promise<void> {
    try {
      const equipment = await this.equipmentService.getEquipmentInfo(this.params.callNbr).toPromise();
      this.equipmentList = equipment || [];
    } catch (error: any) {
      console.error('Error loading equipment info:', error);
      this.errorMessage = error.message || 'Failed to load equipment information';
    }
  }

  private async loadUploadInfo(): Promise<void> {
    try {
      const uploadInfo = await this.equipmentService.getUploadInfo(this.params.callNbr, this.params.techId).toPromise();
      this.uploadInfo = uploadInfo || [];
    } catch (error: any) {
      console.error('Error loading upload info:', error);
      this.errorMessage = error.message || 'Failed to load upload information';
    }
  }

  private async setupButtonStates(): Promise<void> {
    try {
      const buttonStates = await this.equipmentService.getButtonStates(this.params.callNbr, this.params.techId).toPromise();
      if (buttonStates) {
        this.uploadJobEnabled = buttonStates.uploadJobEnabled;
        this.uploadExpenseVisible = buttonStates.uploadExpenseVisible;
        this.uploadExpenseEnabled = buttonStates.uploadExpenseEnabled;
        this.enableExpenseVisible = buttonStates.enableExpenseVisible;
      }
    } catch (error: any) {
      console.error('Error setting up button states:', error);
    }
  }

  // Navigation methods
  goBack(): void {
    if (this.params.year) {
      this.router.navigate(['/jobs'], {
        queryParams: {
          CallNbr: this.params.callNbr,
          Year: this.params.year,
          Tech: this.params.techId,
          Archive: this.params.archive
        }
      });
    } else {
      this.router.navigate(['/jobs'], {
        queryParams: { CallNbr: this.params.callNbr }
      });
    }
  }

  // Equipment type navigation
  navigateToEquipmentReadings(equipment: EquipmentDetail): void {
    const baseParams: any = {
      CallNbr: this.params.callNbr,
      EquipNo: equipment.equipNo,
      EquipId: equipment.equipId.toString(),
      Tech: this.params.techId,
      TechName: this.params.techName
    };

    let route = '';
    let params: any = { ...baseParams };

    switch (equipment.equipType?.trim()) {
      case 'BATTERY':
        route = equipment.scheduled === 'T' ? '/equipment/battery-readings-temp' : '/equipment/battery-readings';
        params = {
          ...params,
          ReadingType: equipment.readingType || '',
          BattNum: equipment.batteriesPerString?.toString() || '0',
          BattPack: equipment.batteriesPerPack?.toString() || '0'
        };
        break;
        
      case 'UPS':
        if (equipment.probcde?.includes('EMGSERV')) {
          route = '/equipment/emg-ups-readings';
        } else if (equipment.probcde?.includes('STARTUPGAM')) {
          route = '/equipment/gamatronics';
          params = { ...params, UnitNo: equipment.equipNo };
        } else {
          route = '/jobs/ups-readings';
          params = { 
            callNbr: this.params.callNbr,
            equipId: equipment.equipId.toString(),
            upsId: encodeURIComponent(equipment.equipNo),
            techId: this.params.techId,
            techName: this.params.techName,
            archive: this.params.archive,
            year: this.params.year,
            KVA: equipment.upskva?.toString() || '0'
          };
        }
        break;
        
      case 'PDU':
        route = '/equipment/pdu-readings';
        params = { ...params, PDUId: equipment.equipNo };
        break;
        
      case 'RECTIFIER':
        route = '/equipment/rectifier-readings';
        params = { ...params, RectifierId: equipment.equipNo };
        break;
        
      case 'GENERATOR':
        route = '/equipment/generator-readings';
        break;
        
      case 'ATS':
        route = '/equipment/ats-readings';
        break;
        
      case 'SCC':
      case 'CONTROL CABINET':
      case 'SYSTEM CONTROL CABINET':
        route = '/equipment/scc-readings';
        break;
        
      case 'HVAC':
        route = '/equipment/hvac';
        break;
        
      case 'FLYWHEEL':
        route = '/equipment/flywheel-pm';
        break;
        
      case 'STATIC SWITCH':
        route = '/equipment/sts-readings';
        params = { ...params, STSId: equipment.equipNo };
        break;
        
      default:
        route = '/equipment/other-equipment';
        break;
    }

    this.router.navigate([route], { queryParams: params });
  }

  // Action methods
  navigateToEquipmentSummary(equipment: EquipmentDetail): void {
    this.router.navigate(['/equipment/summary'], {
      queryParams: {
        CallNbr: this.params.callNbr,
        EquipNo: equipment.equipNo,
        EquipID: equipment.equipId.toString(),
        Type: equipment.equipType || '',
        Tech: this.params.techId,
        TechName: this.params.techName
      }
    });
  }

  navigateToFileUpload(equipment: EquipmentDetail): void {
    this.router.navigate(['/equipment/file-upload'], {
      queryParams: {
        EquipId: equipment.equipId.toString(),
        TechID: this.params.techId
      }
    });
  }

  navigateToImageUpload(equipment: EquipmentDetail): void {
    this.router.navigate(['/equipment/images'], {
      queryParams: {
        CallNbr: this.params.callNbr,
        EquipNo: equipment.equipNo,
        EquipId: equipment.equipId.toString(),
        Tech: this.params.techId,
        TechName: this.params.techName
      }
    });
  }

  navigateToEditEquipment(equipment: EquipmentDetail): void {
    this.router.navigate(['/equipment/edit'], {
      queryParams: {
        CallNbr: this.params.callNbr,
        EquipNo: equipment.equipNo,
        EquipId: equipment.equipId.toString(),
        Tech: this.params.techId,
        TechName: this.params.techName
      }
    });
  }

  openUploadFiles(): void {
    this.showFileUploadModal = true;
  }

  closeFileUploadModal(): void {
    this.showFileUploadModal = false;
    // Refresh upload info after closing modal (equivalent to legacy parent window refresh)
    this.loadUploadInfo();
  }

  showHelp(): void {
    // Display help information for the equipment details page
    alert('Equipment Details Help:\n\n' +
          '• Upload Job: Upload the current job data to the server\n' +
          '• Upload Expenses: Upload expense data for this job\n' +
          '• Upload Files: Attach files to this job\n' +
          '• Enable Expenses: Enable expense functionality for this job\n\n' +
          'Click on equipment numbers to view detailed readings and information.');
  }

  // Upload methods
  async uploadJob(): Promise<void> {
    if (!confirm('Are you sure you want to upload Job?')) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';
    let notes = '';
    let jobType = '';

    try {
      // Step 1: Get PM Visual Notes and Job Type (equivalent to da.GetPMVisualNotes)
      console.log('Getting PM Visual Notes...');
      try {
        const pmNotesResult = await this.equipmentService.getPMVisualNotes(this.params.callNbr, this.params.techName).toPromise();
        if (pmNotesResult && pmNotesResult.length > 0) {
          // Extract notes and jobType from first record (matching legacy while loop logic)
          notes = pmNotesResult[0]?.pmVisualNotes || '';
          jobType = pmNotesResult[0]?.SvcDescr || '';
        } else {
          notes = '';
          jobType = '';
        }
      } catch (ex: any) {
        console.error('Error in GetPMVisualNotes:', ex);
        // Set empty values on error, just like legacy code
        notes = '';
        jobType = '';
      }

      // Step 2: Check Pre Job Safety completion (equivalent to da.IsPreJobSafetyDone)
      console.log('Validating Pre Job Safety...');
      const preJobSafetyResult = await this.equipmentService.validatePreJobSafety(this.params.callNbr).toPromise();
      console.log('Pre Job Safety Result:', preJobSafetyResult);
      console.log('Is Pre Job Safety Completed:', preJobSafetyResult?.isCompleted);
      if (!preJobSafetyResult) {
        this.errorMessage = 'Job Upload Failed : Pre Job Safety list must be completed before uploading job.<br/>' +
                           `<a style="font-size:8pt;color:#7bb752;font-family:arial;cursor:pointer;" href="/#/jobs/job-safety?CallNbr=${this.params.callNbr}">Go to Job Safety Page</a>`;
        return;
      }

      // Step 3: PM Job specific validations
      if (jobType.toLowerCase().includes('pm')) {
        console.log('Validating PM Job requirements...');
        
        // Check Save As Draft status (equivalent to da.CheckSaveAsDraft)
        const draftResult = await this.equipmentService.checkSaveAsDraft(this.params.callNbr).toPromise();
        if (draftResult && draftResult.trim() !== '') {
          this.errorMessage = `Job Upload Failed : ${draftResult}`;
          return;
        }

        // Get equipment info and validate readings for each equipment (equivalent to da.GetEquipInfo)
        const equipmentList = await this.equipmentService.getEquipmentInfo(this.params.callNbr).toPromise();
        if (equipmentList && equipmentList.length > 0) {
          for (const equipment of equipmentList) {
            // For UPS equipment in major PM jobs, check caps parts info
            if (equipment.equipType?.trim() === 'UPS') {
              if (jobType.toLowerCase().includes('major')) {
                const capsResult = await this.equipmentService.checkCapsPartsInfo(this.params.callNbr, equipment.equipId).toPromise();
                if (!capsResult?.hasInfo) {
                  this.errorMessage = 'Caps Parts information must be filled or comments must be entered.' +
                                     'Please click on pencil to enter missing information';
                  return;
                }
              }
            }

            // Check if readings exist for all equipment (equivalent to da.ReadingsExist)
            const readingsResult = await this.equipmentService.checkReadingsExist(
              this.params.callNbr, 
              equipment.equipId, 
              equipment.equipType?.trim() || ''
            ).toPromise();
            
            if (!readingsResult?.exists) {
              this.errorMessage = `This Job is ${jobType.toUpperCase()}<br/>` +
                                 'You will have to fill the readings for all below Equipments';
              return;
            }
          }
        }
      }

      // Step 4: Check if parts are returned by tech (equivalent to da.IsPartsReturnedbyTech)
      console.log('Validating parts return...');
      const partsResult = await this.equipmentService.validatePartsReturned(this.params.callNbr).toPromise();
      if (!partsResult?.isReturned) {
        this.errorMessage = 'Job Upload Failed : Parts usage info must be updated by Technician or Account Manager<br/>' +
                           `<a style="font-size:8pt;color:#7bb752;font-family:arial" href="../DTechJobParts.aspx?CallNbr=${this.params.callNbr}&TechName=${this.params.techName}">Go to Parts Page</a>`;
        return;
      }

      // Step 5: Check for duplicate hours/expenses (equivalent to da.CheckDuplicateHours)
      console.log('Checking duplicate hours/expenses...');
      const duplicateResult = await this.equipmentService.checkDuplicateHours(this.params.callNbr, this.params.techName).toPromise();
      if (duplicateResult?.hasDuplicates) {
        let errorMsg = `Job Upload Failed : ${duplicateResult.message}`;
        if (duplicateResult.message.includes('food')) {
          errorMsg += '<br/> Please go to the Expenses page and edit your expenses';
        } else {
          errorMsg += '<br/> Please go to the Expenses page and edit your hours';
        }
        this.errorMessage = errorMsg;
        return;
      }

      // Step 6: Check if technician notes are provided
      if (notes.trim() === '') {
        const techNameEncoded = this.params.techName.replace(/\s/g, '%20');
        this.errorMessage = 'You must enter Technician Notes in Job Info Page<br/>' +
                           `<a style="color:#00B27A;" href="JobNotesInfo.aspx?CallNbr=${this.params.callNbr}&TechName=${techNameEncoded}">Click here</a> to go to Job Notes Info Page`;
        return;
      }

      // Step 7: Perform final upload to GP (equivalent to da.UploadJobToGP)
      console.log('Uploading job to GP...');
      const result = await this.equipmentService.uploadJob(
        this.params.callNbr,
        this.params.techId,
        this.params.techName
      ).toPromise();

      console.log('UploadJob API Response:', result);

      // Handle response - check success property first
      if (result?.success) {
        // Success case
        this.successMessage = result.message || 'Job Uploaded Successfully.';
        this.toastr.success(this.successMessage);
        this.loadUploadInfo(); // Equivalent to GetUploadedInfo()
        this.uploadJobEnabled = false; // Equivalent to CmdUploadJob.Enabled = false
      } else {
        // Error case - handle specific GP error messages
        let errorMsg = result?.message || 'Failed to upload job';
        if (errorMsg.includes("Cannot insert the value NULL into column 'ARRIVDTE'")) {
          errorMsg = 'Job Upload Failed : <br/>Tech Arrival date and time prior than Start date and time. Please make sure that Arrival time is greater than or equal to Start time in Expenses';
        }
        this.errorMessage = errorMsg;
        this.toastr.error(errorMsg);
      }

    } catch (error: any) {
      console.error('UploadJob API Error:', error);
      
      // Handle specific error messages
      let errorMsg = error.message || 'Failed to upload job';
      if (errorMsg.includes("Cannot insert the value NULL into column 'ARRIVDTE'")) {
        errorMsg = 'Job Upload Failed : <br/>Tech Arrival date and time prior than Dispatch time. Please make sure that Arrival time is greater than dispatch time';
      }
      
      this.errorMessage = errorMsg;
      this.toastr.error(errorMsg);
    } finally {
      this.loading = false;
    }
  }

  async uploadExpenses(): Promise<void> {
    if (!confirm('Are you sure you want to upload Expenses?\nBy clicking OK you cannot upload Expenses for this job again in future.')) {
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      // Step 1: Check for duplicate hours/expenses (equivalent to da.CheckDuplicateHours)
      console.log('Checking duplicate hours/expenses...');
      const duplicateResult = await this.equipmentService.checkDuplicateHours(this.params.callNbr, this.params.techName).toPromise();
      if (duplicateResult?.hasDuplicates) {
        this.errorMessage = `Upload Failed : ${duplicateResult.message}<br/> Please go to the Expenses page and edit tech expenses`;
        this.toastr.error(this.errorMessage);
        return;
      }

      // Step 2: Validate expense upload requirements (equivalent to da.ValidateExpenseUpload)
      console.log('Validating expense upload requirements...');
      const validationResult = await this.equipmentService.validateExpenseUpload(this.params.callNbr).toPromise();
      
      if (validationResult === 'Success') {
        // Step 3: Perform actual expense upload (equivalent to da.UploadExpensesToGP)
        console.log('Uploading expenses to GP...');
        const result = await this.equipmentService.uploadExpenses(
          this.params.callNbr,
          this.params.techName
        ).toPromise();

        console.log('UploadExpenses API Response:', result);

        // Handle response - check success property first
        if (result?.success) {
          // Success case
          this.successMessage = result.message || 'Expenses Uploaded Successfully.';
          this.toastr.success(this.successMessage);
          this.loadUploadInfo(); // Equivalent to GetUploadedInfo()
          this.uploadExpenseEnabled = false; // Equivalent to CmdUploadExpense.Enabled = false
        } else {
          // Error case - show message if available
          this.errorMessage = result?.message || 'Failed to upload expenses';
          this.toastr.error(this.errorMessage);
        }
      } else {
        // Validation failed - display the error message from validation
        this.errorMessage = validationResult || 'Expense validation failed';
        this.toastr.error(this.errorMessage);
      }

    } catch (error: any) {
      console.error('UploadExpenses API Error:', error);
      this.errorMessage = error.message || 'Failed to upload expenses';
      this.toastr.error(this.errorMessage);
    } finally {
      this.loading = false;
    }
  }

  async enableExpenses(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      const result = await this.equipmentService.enableExpenses(this.params.callNbr).toPromise();
      
      console.log('EnableExpenses API Response:', result); // Debug log

      // Handle successful response - check if success property exists and is true, or if response is truthy without success property
      if ((result && result.success) || (result && !result.hasOwnProperty('success'))) {
        this.successMessage = result?.message || 'Expenses enabled successfully';
        this.toastr.success('Expenses enabled successfully');
        this.setupButtonStates(); // Refresh button states
      } else {
        // API returned 200 but with success: false
        this.errorMessage = result?.message || 'Failed to enable expenses';
        this.toastr.error(result?.message || 'Failed to enable expenses');
      }
    } catch (error: any) {
      console.error('EnableExpenses API Error:', error); // Debug log
      this.errorMessage = error.message || 'Failed to enable expenses';
      this.toastr.error(this.errorMessage);
    } finally {
      this.loading = false;
    }
  }

  // Utility methods
  getEquipmentStatusDisplay(status: string): { text: string; color: string } {
    switch (status?.trim()) {
      case 'Offline':
        return { text: 'Off-Line', color: '#dc3545' };
      case 'CriticalDeficiency':
        return { text: 'Critical Deficiency', color: '#FF3300' };
      case 'ReplacementRecommended':
        return { text: 'Replacement Recommended', color: '#B8860B' };
      case 'ProactiveReplacement':
        return { text: 'Proactive Replacement', color: '#00cdcd' };
      case 'OnLine(MajorDeficiency)':
        return { text: 'On-Line(Major Deficiency)', color: '#B8860B' };
      case 'OnLine(MinorDeficiency)':
        return { text: 'On-Line(Minor Deficiency)', color: '#DAA520' };
      default:
        return { text: 'On-Line', color: '#000000' };
    }
  }

  getModeDisplay(saveStatus: string): string {
    return saveStatus === 'True' ? 'Draft' : 'None';
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
