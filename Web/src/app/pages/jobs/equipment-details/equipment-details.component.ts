import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { EquipmentDetail, UploadInfo, EquipmentDetailsParams, UploadResponse, ValidationResult } from 'src/app/core/model/equipment-details.model';
import { EquipmentService } from 'src/app/core/services/equipment.service';
import { JobNotesInfoService } from 'src/app/core/services/job-notes-info.service';
import { AuthService } from 'src/app/modules/auth';
import { FileUploadComponent } from '../file-upload/file-upload.component';

@Component({
  selector: 'app-equipment-details',
  templateUrl: './equipment-details.component.html',
  styleUrls: ['./equipment-details.component.scss']
})
export class EquipmentDetailsComponent implements OnInit {
  @ViewChild('fileUploadComponent') fileUploadComponent?: FileUploadComponent;
  
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
  selectedEquipment: EquipmentDetail | null = null; // Track selected equipment for uploads
  
  // UI state
  loading = false;
  errorMessage = '';
  successMessage = '';
  showJobNotesLink = false;
  showJobSafetyLink = false;
  uploadingExpenses = false;
  expenseUploadProgress = 0;
  
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
  isEquipmentFileUpload = false;  // Track if current upload is for equipment
  
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
    private jobNotesInfoService: JobNotesInfoService,
    private authService: AuthService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
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
      console.log('Loading upload info for callNbr:', this.params.callNbr, 'techId:', this.params.techId);
      const uploadInfo = await this.equipmentService.getUploadInfo(this.params.callNbr, this.params.techId).toPromise();
      this.uploadInfo = uploadInfo || [];
      console.log('Loaded upload info:', this.uploadInfo);
      
      // Trigger change detection to ensure UI updates
      this.cdr.detectChanges();
      
      // If no upload info found, try again after a short delay (for timing issues)
      if (this.uploadInfo.length === 0) {
        console.log('No upload info found, retrying in 2 seconds...');
        setTimeout(async () => {
          try {
            const retryUploadInfo = await this.equipmentService.getUploadInfo(this.params.callNbr, this.params.techId).toPromise();
            this.uploadInfo = retryUploadInfo || [];
            console.log('Retry upload info result:', this.uploadInfo);
            
            // Trigger change detection after retry
            this.cdr.detectChanges();
            
            if (this.uploadInfo.length === 0) {
              console.warn('Still no upload info found after retry. Check API endpoint and database.');
            }
          } catch (retryError: any) {
            console.error('Error during upload info retry:', retryError);
          }
        }, 2000);
      }
    } catch (error: any) {
      console.error('Error loading upload info:', error);
      console.error('API URL being called:', `${this.equipmentService['apiUrl']}/EquipmentDetails/uploaded-info`);
      console.error('Parameters:', { callNbr: this.params.callNbr, techId: this.params.techId });
      if (error.status === 404) {
        console.error('Upload info API endpoint not found (404)');
      } else if (error.status === 500) {
        console.error('Server error (500) when calling upload info API');
      }
      // Don't set error message for upload info failures, just log them
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

  navigateToJobNotes(): void {
    this.router.navigate(['/jobs/job-notes-info'], {
      queryParams: {
        CallNbr: this.params.callNbr,
        TechName: this.params.techName
      }
    });
  }

  navigateToJobSafety(): void {
    this.router.navigate(['/jobs/job-safety'], {
      queryParams: {
        CallNbr: this.params.callNbr
      }
    });
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

  navigateToFileUpload(equipment: EquipmentDetail): void {
    // Use modal instead of navigation for better UX
    this.openEquipmentUploadFiles(equipment);
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
    this.router.navigate(['/equipment/edit-equipment'], {
      queryParams: {
        CallNbr: this.params.callNbr,
        EquipId: equipment.equipId.toString(),
        EquipNo: equipment.equipNo,
        Tech: this.params.techId,
        TechName: this.params.techName,
        Digest: '' // Add digest if available
      }
    });
  }

  openUploadFiles(): void {
    // Make header upload work exactly like equipment upload
    // Use the first equipment if available, or create a default one
    if (this.equipmentList && this.equipmentList.length > 0) {
      this.isEquipmentFileUpload = true;
      this.selectedEquipment = this.equipmentList[0]; // Use first equipment
    } else {
      // If no equipment available, still set equipment mode with default values
      this.isEquipmentFileUpload = true;
      this.selectedEquipment = {
        equipId: 1, // Default equipment ID
        equipNo: 'DEFAULT',
        equipType: 'JOB',
        // ... other default properties
      } as EquipmentDetail;
    }
    this.showFileUploadModal = true;
  }

  openEquipmentUploadFiles(equipment: EquipmentDetail): void {
    this.isEquipmentFileUpload = true;
    this.selectedEquipment = equipment;
    this.showFileUploadModal = true;
  }

  closeFileUploadModal(): void {
    this.showFileUploadModal = false;
    this.isEquipmentFileUpload = false;
    this.selectedEquipment = null;
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
        console.log('PM Notes API response:', pmNotesResult);
        if (pmNotesResult && pmNotesResult.length > 0) {
          // Extract notes and jobType from first record (matching legacy while loop logic)
          notes = pmNotesResult[0]?.pmVisualNotes || '';
          jobType = pmNotesResult[0]?.SvcDescr || '';
          console.log('Initial PM notes extracted:', notes);
          console.log('Job type extracted:', jobType);
        } else {
          notes = '';
          jobType = '';
          console.log('No PM notes found in response');
        }
        
        // If PM notes are empty, also check for deficiency notes
        if (notes.trim() === '') {
          console.log('PM notes empty, checking for deficiency notes...');
          try {
            const deficiencyNotes = await this.jobNotesInfoService.getDeficiencyNotes(this.params.callNbr).toPromise();
            if (deficiencyNotes && deficiencyNotes.trim() !== '') {
              notes = deficiencyNotes.trim();
              console.log('Initial deficiency notes found:', notes.substring(0, 50) + '...');
            }
          } catch (defEx: any) {
            console.error('Error getting deficiency notes:', defEx);
          }
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
                           `<a style="font-size:8pt;color:#7bb752;font-family:arial" href="/jobs/parts?CallNbr=${this.params.callNbr}&TechName=${encodeURIComponent(this.params.techName)}">Go to Parts Page</a>`;
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
      // Refresh notes right before validation to ensure we have the latest data
      console.log('Re-checking technician notes before upload...');
      try {
        const latestNotesResult = await this.equipmentService.getPMVisualNotes(this.params.callNbr, this.params.techName).toPromise();
        if (latestNotesResult && latestNotesResult.length > 0) {
          notes = latestNotesResult[0]?.pmVisualNotes || '';
          console.log('Latest PM notes retrieved:', notes);
        }
        
        // Also check for deficiency notes if PM notes are empty
        if (notes.trim() === '') {
          console.log('PM notes empty, checking deficiency notes...');
          const deficiencyNotes = await this.jobNotesInfoService.getDeficiencyNotes(this.params.callNbr).toPromise();
          if (deficiencyNotes && deficiencyNotes.trim() !== '') {
            notes = deficiencyNotes.trim();
            console.log('Deficiency notes found:', notes.substring(0, 50) + '...');
          }
        }
      } catch (ex: any) {
        console.error('Error refreshing notes:', ex);
      }
      
      if (notes.trim() === '') {
        console.log('No technician notes found, showing error message');
        this.errorMessage = 'You must enter Technician Notes in Job Info Page';
        this.showJobNotesLink = true;
        return;
      }
      
      console.log('Technician notes validation passed:', notes.substring(0, 50) + '...');

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
        console.log('Job upload successful, refreshing upload info...');
        
        // Add a longer delay to ensure database is updated before refreshing
        setTimeout(async () => {
          console.log('Attempting to refresh upload info after job upload...');
          await this.loadUploadInfo(); // Equivalent to GetUploadedInfo()
          console.log('Upload info refreshed, current uploadInfo:', this.uploadInfo);
        }, 1500); // Increased delay to 1.5 seconds
        
        this.uploadJobEnabled = false; // Equivalent to CmdUploadJob.Enabled = false
        
        // Refresh file upload component upload info if it exists
        if (this.fileUploadComponent) {
          setTimeout(() => {
            console.log('Refreshing upload info after job upload');
            this.loadUploadInfo();
          }, 1500); // Match the delay
        }
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
          console.log('Expense upload successful, refreshing upload info...');
          
          // Add a small delay to ensure database is updated before refreshing
          setTimeout(() => {
            this.loadUploadInfo(); // Equivalent to GetUploadedInfo()
          }, 500);
          
          this.uploadExpenseEnabled = false; // Equivalent to CmdUploadExpense.Enabled = false
          
          // Refresh upload info after successful expense upload
          if (this.fileUploadComponent) {
            setTimeout(() => {
              this.loadUploadInfo();
            }, 500);
          }
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
    this.showJobNotesLink = false;
  }
}