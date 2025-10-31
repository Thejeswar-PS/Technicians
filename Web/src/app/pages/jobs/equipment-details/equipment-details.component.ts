import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { EquipmentDetail, UploadInfo, EquipmentDetailsParams, UploadResponse, ValidationResult } from 'src/app/core/model/equipment-details.model';
import { EquipmentService } from 'src/app/core/services/equipment.service';
import { JobNotesInfoService } from 'src/app/core/services/job-notes-info.service';
import { JobService } from 'src/app/core/services/job.service';
import { AuthService } from 'src/app/modules/auth';
import { FileUploadService, EquipmentFileResponseDto } from 'src/app/core/services/file-upload.service';

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
  selectedEquipment: EquipmentDetail | null = null; // Track selected equipment for uploads
  equipmentFiles: EquipmentFileResponseDto[] = []; // Files for the selected equipment
  
  // UI state
  loading = false;
  errorMessage = '';
  successMessage = '';
  showJobNotesLink = false;
  showJobSafetyLink = false;
  showPartsPageLink = false;
  showExpensesPageLink = false;
  uploadingExpenses = false;
  expenseUploadProgress = 0;
  uploadingJob = false;
  jobUploadProgress = 0;
  
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
  showUploadModal = false;  // Add this line for general upload modal control
  isEquipmentFileUpload = false;  // Track if current upload is for equipment
  selectedFiles: (File | null)[] = [null, null]; // Files selected for upload
  isUploading = false; // Track upload progress
  fileValidationError = ''; // Store validation error messages
  
  // Getter for template usage
  get jobId(): string {
    return this.params.callNbr;
  }
  
  // User info
  userRole = '';
  currentUserId = '';
  currentUserName = ''; // Add current user's name property
  
  // Track uploads made in current session
  currentSessionUploads: Set<string> = new Set(); // Track upload types made in current session

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private equipmentService: EquipmentService,
    private jobNotesInfoService: JobNotesInfoService,
    private jobService: JobService,
    private authService: AuthService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef,
    private fileUploadService: FileUploadService
  ) {}

  ngOnInit(): void {
    console.log('🚀 COMPONENT INITIALIZING - Equipment Details');
    this.loadUserInfo();
    this.loadRouteParams();
    this.loadData();
  }

  private loadUserInfo(): void {
    // Get current user from AuthService
    const currentUser = this.authService.currentUserValue;
    
    console.log('🔍 Raw currentUser object:', currentUser);
    console.log('🔍 Available properties:', currentUser ? Object.keys(currentUser) : 'No user object');
    
    if (currentUser) {
      this.userRole = 'Manager'; // You can map this from user roles if available
      this.currentUserId = currentUser.id?.toString() || currentUser.windowsID?.toString() || '1';
      
      // Get user's display name - prefer fullname, then username, then firstname + lastname
      this.currentUserName = this.getCurrentUserDisplayName(currentUser);
      
      console.log('👤 User info loaded:', { 
        userRole: this.userRole, 
        currentUserId: this.currentUserId,
        currentUserName: this.currentUserName,
        user: currentUser 
      });
    } else {
      // Fallback for when no user is authenticated
      this.userRole = 'Manager';
      this.currentUserId = '1';
      this.currentUserName = 'System User';
      console.log('👤 No authenticated user found, using defaults');
    }
  }

  // Helper method to get the current user's display name
  private getCurrentUserDisplayName(user: any): string {
    // For LoginResponse object, use empName and empLabel
    if (user.empName && user.empName.trim()) {
      return user.empName.trim();
    }
    
    if (user.empLabel && user.empLabel.trim()) {
      return user.empLabel.trim();
    }
    
    if (user.windowsID && user.windowsID.trim()) {
      return user.windowsID.trim();
    }
    
    // Fallback to UserModel properties if available
    if (user.fullname && user.fullname.trim()) {
      return user.fullname.trim();
    }
    
    if (user.firstname && user.lastname) {
      return `${user.firstname.trim()} ${user.lastname.trim()}`.trim();
    }
    
    if (user.username && user.username.trim()) {
      return user.username.trim();
    }
    
    return 'Current User';
  }

  // Public method to get current user name for template usage
  getCurrentUserName(): string {
    return this.currentUserName || 'Current User';
  }

  // Method to determine what name to display in the upload info table
  getUploadedByDisplayName(uploadInfo: UploadInfo): string {
    // Only show current user name for uploads made in the current session
    const uploadType = uploadInfo.Type;
    
    // Check if this upload type was made in current session
    if (uploadType && this.currentSessionUploads.has(uploadType)) {
      // For uploads made in current session, show current user name
      return this.getCurrentUserName();
    }
    
    // For all other uploads (previous sessions, other users), show the stored name
    return uploadInfo.UploadedBy || 'Unknown';
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
      
      console.log('📋 Route params loaded:', this.params);
      
      if (!this.params.callNbr) {
        this.errorMessage = 'Invalid job number provided';
        console.error('❌ No CallNbr provided in route params');
        return;
      }
      
      // Initial check of local storage with these params
      console.log('🔍 Initial localStorage check for expense upload status...');
      const isLocallyUploaded = this.isExpenseUploadedLocally();
      console.log('📱 Initial expense upload status from localStorage:', isLocallyUploaded);
    });
  }

  private loadData(): void {
    if (!this.params.callNbr) return;
    
    console.log('📊 Loading component data...');
    this.loading = true;
    this.errorMessage = '';
    this.showJobSafetyLink = false;
    
    // Load equipment info and upload info in parallel
    Promise.all([
      this.loadEquipmentInfo(),
      this.loadUploadInfo(),
      this.setupButtonStates()
    ]).finally(() => {
      this.loading = false;
      console.log('✅ Component data loading complete');
      
      // Final validation after all data is loaded
      setTimeout(() => {
        this.performFinalExpenseButtonValidation();
      }, 100);
    });
  }

  // Final comprehensive validation to ensure button stays hidden
  private performFinalExpenseButtonValidation(): void {
    console.log('🔒 PERFORMING FINAL EXPENSE BUTTON VALIDATION');
    
    const localStorageCheck = this.isExpenseUploadedLocally();
    
    let uploadInfoCheck = false;
    if (this.uploadInfo && this.uploadInfo.length > 0) {
      uploadInfoCheck = this.uploadInfo.some(info => 
        info.Type?.toLowerCase().includes('expense') && info.UploadJobDt
      );
    }
    
    console.log('Final validation results:', {
      localStorageCheck,
      uploadInfoCheck,
      currentButtonVisible: this.uploadExpenseVisible,
      currentButtonEnabled: this.uploadExpenseEnabled
    });
    
    // If ANY validation indicates expense was uploaded, hide the button
    if (localStorageCheck || uploadInfoCheck) {
      if (this.uploadExpenseVisible) {
        console.log('🚨 FINAL OVERRIDE: Forcing expense button to be hidden');
        this.uploadExpenseVisible = false;
        this.uploadExpenseEnabled = false;
        
        // Force change detection
        setTimeout(() => {
          console.log('🔄 Change detection triggered. Final button state:', {
            uploadExpenseVisible: this.uploadExpenseVisible,
            uploadExpenseEnabled: this.uploadExpenseEnabled
          });
        }, 50);
      } else {
        console.log('✅ Button already hidden - validation passed');
      }
    } else {
      console.log('ℹ️ No evidence of expense upload found - button can remain visible');
    }
  }

  private async loadEquipmentInfo(): Promise<void> {
    try {
      const equipment = await this.equipmentService.getEquipmentInfo(this.params.callNbr).toPromise();
      this.equipmentList = equipment || [];
    } catch (error: any) {
      console.error('Error loading equipment info:', error);
      // For 404 errors (no equipment found), just set empty array to show "no equipment found" message
      // instead of showing a technical error message
      if (error.status === 404) {
        this.equipmentList = [];
        console.log('No equipment found for this job (404), showing user-friendly message');
      } else {
        // For other errors, show the error message
        this.errorMessage = error.message || 'Failed to load equipment information';
      }
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
      
      // If no upload info found, try again after a longer delay for database consistency
      if (this.uploadInfo.length === 0) {
        console.log('No upload info found, retrying in 3 seconds...');
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
        }, 3000); // Increased delay for database consistency
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
      console.log('=== SETTING UP BUTTON STATES ===');
      const buttonStates = await this.equipmentService.getButtonStates(this.params.callNbr, this.params.techId).toPromise();
      console.log('Raw button states from server:', buttonStates);
      
      if (buttonStates) {
        this.uploadJobEnabled = buttonStates.uploadJobEnabled;
        this.uploadExpenseVisible = buttonStates.uploadExpenseVisible;
        this.uploadExpenseEnabled = buttonStates.uploadExpenseEnabled;
        this.enableExpenseVisible = buttonStates.enableExpenseVisible;
        
        console.log('Button states applied:', {
          uploadExpenseVisible: this.uploadExpenseVisible,
          uploadExpenseEnabled: this.uploadExpenseEnabled,
          uploadJobEnabled: this.uploadJobEnabled
        });
        
        // Enhanced validation: check upload info to verify expense upload status
        console.log('Checking upload info for expense upload validation...');
        console.log('Current uploadInfo:', this.uploadInfo);
        
        if (this.uploadInfo && this.uploadInfo.length > 0) {
          console.log('Upload info details:', this.uploadInfo.map(info => ({
            Type: info.Type,
            UploadJobDt: info.UploadJobDt,
            UploadedBy: info.UploadedBy
          })));
          
          const expenseUploaded = this.uploadInfo.some(info => {
            const hasExpenseType = info.Type?.toLowerCase().includes('expense');
            const hasUploadDate = !!info.UploadJobDt;
            console.log(`Checking info: Type="${info.Type}", hasExpenseType=${hasExpenseType}, hasUploadDate=${hasUploadDate}`);
            return hasExpenseType && hasUploadDate;
          });
          
          console.log('Expense uploaded (from uploadInfo):', expenseUploaded);
          
          if (expenseUploaded && this.uploadExpenseVisible) {
            console.warn('SERVER MISMATCH: Server returned uploadExpenseVisible=true but expenses already uploaded. Correcting client state.');
            this.uploadExpenseVisible = false;
            this.uploadExpenseEnabled = false;
          }
        } else {
          console.log('No upload info available for validation');
        }
        
        // Check local storage for expense upload status (backup validation)
        const localExpenseUploaded = this.isExpenseUploadedLocally();
        console.log('Expense uploaded (from localStorage):', localExpenseUploaded);
        
        if (localExpenseUploaded && this.uploadExpenseVisible) {
          console.warn('LOCAL STORAGE OVERRIDE: Local storage indicates expenses already uploaded. Hiding button.');
          this.uploadExpenseVisible = false;
          this.uploadExpenseEnabled = false;
        }
        
        console.log('Final button state after validation:', {
          uploadExpenseVisible: this.uploadExpenseVisible,
          uploadExpenseEnabled: this.uploadExpenseEnabled
        });
      } else {
        console.error('No button states received from server');
      }
    } catch (error: any) {
      console.error('Error setting up button states:', error);
    }
    console.log('=== BUTTON STATES SETUP COMPLETE ===');
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

  navigateToJobParts(): void {
    this.router.navigate(['/jobs/parts'], {
      queryParams: {
        CallNbr: this.params.callNbr,
        TechName: this.params.techName
      }
    });
  }

  navigateToJobExpenses(): void {
    this.router.navigate(['/jobs/expenses'], {
      queryParams: {
        CallNbr: this.params.callNbr,
        TechName: this.params.techName
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
    // Reset all upload state when opening modal
    this.clearFiles();
    
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

  // Called when user clicks the "Upload" button
  async openFileUploadModal(equipment?: EquipmentDetail): Promise<void> {
    // Reset all upload state when opening modal
    this.clearFiles();
    
    if (equipment) {
      this.isEquipmentFileUpload = true;
      this.selectedEquipment = equipment;
      this.showFileUploadModal = true;
      
      // Load files for this equipment
      await this.loadEquipmentFiles(equipment.equipId);
    }
    this.showUploadModal = true;
  }

  openEquipmentUploadFiles(equipment: EquipmentDetail): void {
    // Reset all upload state when opening modal
    this.clearFiles();
    
    this.isEquipmentFileUpload = true;
    this.selectedEquipment = equipment;
    this.showFileUploadModal = true;
  }

  closeFileUploadModal(): void {
    this.showFileUploadModal = false;
    this.showUploadModal = false;  // Close both modal states
    this.isEquipmentFileUpload = false;
    this.selectedEquipment = null;
    // Refresh upload info after closing modal (equivalent to legacy parent window refresh)
    this.refreshUploadInfo();
  }

  // Add a dedicated refresh method for upload info
  async refreshUploadInfo(): Promise<void> {
    console.log('Refreshing upload info...');
    try {
      const uploadInfo = await this.equipmentService.getUploadInfo(this.params.callNbr, this.params.techId).toPromise();
      this.uploadInfo = uploadInfo || [];
      console.log('Upload info refreshed successfully:', this.uploadInfo);
      
      // Force change detection
      this.cdr.detectChanges();
    } catch (error: any) {
      console.error('Error refreshing upload info:', error);
    }
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

  // Upload methods - optimized for performance
  private setJobUploadProgress(progress: number): void {
    if (this.jobUploadProgress !== progress) {
      this.jobUploadProgress = progress;
    }
  }

  private setExpenseUploadProgress(progress: number): void {
    if (this.expenseUploadProgress !== progress) {
      this.expenseUploadProgress = progress;
    }
  }

  // Local storage keys for persistent upload status
  private getExpenseUploadStorageKey(): string {
    const key = `expense_uploaded_${this.params.callNbr}_${this.params.techId}`;
    console.log('Generated storage key:', key);
    return key;
  }

  private markExpenseAsUploaded(): void {
    try {
      const key = this.getExpenseUploadStorageKey();
      localStorage.setItem(key, 'true');
      console.log('✅ MARKED EXPENSE AS UPLOADED in localStorage with key:', key);
      
      // Verify it was saved
      const saved = localStorage.getItem(key);
      console.log('✅ Verification - localStorage value:', saved);
    } catch (error) {
      console.warn('❌ Could not save expense upload status to localStorage:', error);
    }
  }

  private isExpenseUploadedLocally(): boolean {
    try {
      const key = this.getExpenseUploadStorageKey();
      const value = localStorage.getItem(key);
      const isUploaded = value === 'true';
      console.log(`🔍 Checking localStorage for key "${key}": value="${value}", isUploaded=${isUploaded}`);
      return isUploaded;
    } catch (error) {
      console.warn('❌ Could not read expense upload status from localStorage:', error);
      return false;
    }
  }

  // Debug method to dump all relevant state information
  public debugExpenseButtonState(): void {
    console.log('=== EXPENSE BUTTON DEBUG DUMP ===');
    console.log('Current Parameters:', this.params);
    console.log('Generated Storage Key:', this.getExpenseUploadStorageKey());
    console.log('LocalStorage Value:', localStorage.getItem(this.getExpenseUploadStorageKey()));
    console.log('isExpenseUploadedLocally():', this.isExpenseUploadedLocally());
    console.log('Current Button States:', {
      uploadExpenseVisible: this.uploadExpenseVisible,
      uploadExpenseEnabled: this.uploadExpenseEnabled,
      uploadJobEnabled: this.uploadJobEnabled,
      enableExpenseVisible: this.enableExpenseVisible
    });
    console.log('Upload Info:', this.uploadInfo);
    if (this.uploadInfo) {
      console.log('Upload Info Details:', this.uploadInfo.map(info => ({
        Type: info.Type,
        UploadJobDt: info.UploadJobDt,
        UploadedBy: info.UploadedBy
      })));
    }
    console.log('=== END DEBUG DUMP ===');
  }

  // Method to clear expense upload status (for testing)
  public clearExpenseUploadStatus(): void {
    try {
      const key = this.getExpenseUploadStorageKey();
      localStorage.removeItem(key);
      console.log('🗑️ Cleared expense upload status from localStorage');
      
      // Reset button states
      this.uploadExpenseVisible = true;
      this.uploadExpenseEnabled = true;
      console.log('🔄 Reset button states to visible/enabled');
    } catch (error) {
      console.warn('❌ Could not clear expense upload status from localStorage:', error);
    }
  }

  async uploadJob(): Promise<void> {
    if (!confirm('Are you sure you want to upload Job?')) {
      return;
    }

    this.uploadingJob = true;
    this.jobUploadProgress = 0;
    this.errorMessage = '';
    this.showJobSafetyLink = false;
    this.successMessage = '';
    let notes = '';
    let jobType = '';

    try {
      // Step 1: Get PM Visual Notes and Job Type + Pre Job Safety validation
      this.setJobUploadProgress(20);
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
        this.errorMessage = 'Job Upload Failed : Pre Job Safety list must be completed before uploading job.';
        this.showJobSafetyLink = true;
        return;
      }

      // Step 2.5: Check Save As Draft status for ALL jobs (equivalent to da.CheckSaveAsDraft)
      console.log('Validating Draft mode status...');
      const draftResult = await this.equipmentService.checkSaveAsDraft(this.params.callNbr).toPromise();
      if (draftResult && draftResult.trim() !== '') {
        this.errorMessage = `Job Upload Failed : ${draftResult}`;
        console.log('Job upload blocked due to draft mode:', draftResult);
        return;
      }
      console.log('Draft mode validation passed - job is not in draft mode');

      // Step 3: PM Job specific validations + Equipment validation
      this.setJobUploadProgress(40);
      if (jobType.toLowerCase().includes('pm')) {
        console.log('Validating PM Job requirements...');
        
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

      // Step 4: Parts and expenses validation
      this.setJobUploadProgress(60);
      console.log('Validating parts return...');
      const partsResult = await this.equipmentService.validatePartsReturned(this.params.callNbr).toPromise();
      if (!partsResult?.isReturned) {
        this.errorMessage = 'Job Upload Failed : Parts usage info must be updated by Technician or Account Manager';
        this.showPartsPageLink = true;
        return;
      }

      // Step 5: Check for duplicate hours/expenses (equivalent to da.CheckDuplicateHours)
      console.log('Checking duplicate hours/expenses...');
      const duplicateResult = await this.equipmentService.checkDuplicateHours(this.params.callNbr, this.params.techName).toPromise();
      if (duplicateResult?.hasDuplicates) {
        this.errorMessage = `Job Upload Failed : ${duplicateResult.message}`;
        this.showExpensesPageLink = true;
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
      this.setJobUploadProgress(80);
      console.log('Uploading job to GP...');
      
      // Get current user's name for upload attribution
      const currentUserName = this.getCurrentUserName();
      
      const result = await this.equipmentService.uploadJob(
        this.params.callNbr,
        this.params.techId,
        currentUserName // Pass current user's name instead of technician name
      ).toPromise();

      console.log('UploadJob API Response:', result);

      // Handle response - check success property first
      if (result?.success) {
        this.setJobUploadProgress(100);
        
        // Track this upload in current session
        this.currentSessionUploads.add('Job');
        
        // Success case
        this.successMessage = result.message || 'Job Uploaded Successfully.';
        this.toastr.success(this.successMessage);
        console.log('Job upload successful, refreshing upload info...');
        
        // Hide the upload job button by disabling it (visibility stays true per legacy behavior)
        this.uploadJobEnabled = false;
        
        // Add a longer delay to ensure database is updated before refreshing
        setTimeout(async () => {
          console.log('Attempting to refresh upload info after job upload...');
          await this.refreshUploadInfo();
          await this.setupButtonStates(); // Refresh button states from server
          console.log('Upload info refreshed, current uploadInfo:', this.uploadInfo);
        }, 1500); // Increased delay to 1.5 seconds
        
        // Refresh upload info after job upload
        setTimeout(() => {
          console.log('Refreshing upload info after job upload');
          this.refreshUploadInfo();
        }, 1500); // Match the delay
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
      this.uploadingJob = false;
      this.jobUploadProgress = 0;
    }
  }

  async uploadExpenses(): Promise<void> {
    if (!confirm('Are you sure you want to upload Expenses?\nBy clicking OK you cannot upload Expenses for this job again in future.')) {
      return;
    }

    this.uploadingExpenses = true;
    this.expenseUploadProgress = 0;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      // Step 0: Check if there are any expenses to upload
      this.setExpenseUploadProgress(15);
      console.log('Checking if expenses exist for this job...');
      const expenseData = await this.jobService.getExpenseInfo(this.params.callNbr, this.params.techName).toPromise();
      
      // Filter expenses by callNbr if we get data for multiple jobs
      const jobExpenses = expenseData?.filter(expense => expense.callNbr === this.params.callNbr) || [];
      
      if (!jobExpenses || jobExpenses.length === 0) {
        this.errorMessage = 'Upload Failed: No expenses found for this job. Please add expenses in the Expenses page before uploading.';
        this.showExpensesPageLink = true;
        this.toastr.error(this.errorMessage);
        console.log('No expenses found for job:', this.params.callNbr);
        return;
      }
      
      console.log(`Found ${jobExpenses.length} expense(s) for job ${this.params.callNbr}`);

      // Step 1: Check for duplicate hours/expenses (equivalent to da.CheckDuplicateHours)
      this.setExpenseUploadProgress(30);
      console.log('Checking duplicate hours/expenses...');
      const duplicateResult = await this.equipmentService.checkDuplicateHours(this.params.callNbr, this.params.techName).toPromise();
      if (duplicateResult?.hasDuplicates) {
        this.errorMessage = `Upload Failed : ${duplicateResult.message}`;
        this.showExpensesPageLink = true;
        this.toastr.error(this.errorMessage);
        return;
      }

      // Step 2: Validate expense upload requirements (equivalent to da.ValidateExpenseUpload)
      this.setExpenseUploadProgress(60);
      console.log('Validating expense upload requirements...');
      const validationResult = await this.equipmentService.validateExpenseUpload(this.params.callNbr).toPromise();
      
      if (validationResult === 'Success') {
        // Step 3: Perform actual expense upload (equivalent to da.UploadExpensesToGP)
        this.setExpenseUploadProgress(80);
        console.log('Uploading expenses to GP...');
        
        // Get current user's name for upload attribution
        const currentUserName = this.getCurrentUserName();
        
        const result = await this.equipmentService.uploadExpenses(
          this.params.callNbr,
          currentUserName // Pass current user's name instead of technician name
        ).toPromise();

        console.log('UploadExpenses API Response:', result);

        // Handle response - check success property first
        if (result?.success) {
          this.setExpenseUploadProgress(100);
          
          // Track this upload in current session
          this.currentSessionUploads.add('Expense');
          
          // Success case
          this.successMessage = result.message || 'Expenses Uploaded Successfully.';
          this.toastr.success(this.successMessage);
          console.log('Expense upload successful, refreshing upload info...');
          
          // Hide the upload expense button immediately and permanently
          this.uploadExpenseVisible = false;
          this.uploadExpenseEnabled = false;
          
          // Mark as uploaded locally for persistence
          this.markExpenseAsUploaded();
          
          // Multiple refresh attempts to ensure server state synchronization
          setTimeout(async () => {
            await this.refreshUploadInfo(); 
            await this.setupButtonStates();
            console.log('First refresh completed. Upload expense visible:', this.uploadExpenseVisible);
          }, 500);
          
          // Second refresh to ensure server state is fully synchronized
          setTimeout(async () => {
            await this.setupButtonStates();
            console.log('Second refresh completed. Upload expense visible:', this.uploadExpenseVisible);
            
            // Final failsafe - if server hasn't updated, keep client state
            if (this.uploadExpenseVisible) {
              console.warn('Server state not yet updated, maintaining client state');
              this.uploadExpenseVisible = false;
              this.uploadExpenseEnabled = false;
            }
          }, 2000);
          
          // Refresh upload info after successful expense upload
          setTimeout(() => {
            this.refreshUploadInfo();
          }, 500);
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
      this.uploadingExpenses = false;
      this.expenseUploadProgress = 0;
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
    this.showJobSafetyLink = false;
    this.showPartsPageLink = false;
    this.showExpensesPageLink = false;
  }

  // File management methods
  getFileName(file: EquipmentFileResponseDto): string {
    return file.fileName || 'Unknown File';
  }

  getFileDate(file: EquipmentFileResponseDto): string {
    if (file.createdOn) {
      return new Date(file.createdOn).toISOString();
    }
    return new Date().toISOString();
  }

  getFileCreatedBy(file: EquipmentFileResponseDto): string {
    return file.createdBy || 'Unknown User';
  }

  openAnyFile(file: EquipmentFileResponseDto): void {
    if (file.data && file.fileName && file.contentType) {
      this.fileUploadService.downloadEquipmentFile(file.data, file.fileName, file.contentType);
    } else {
      this.toastr.error('File data is not available');
    }
  }

  downloadFile(file: EquipmentFileResponseDto): void {
    this.openAnyFile(file);
  }

  // Load equipment files when modal is opened
  private async loadEquipmentFiles(equipmentId: number): Promise<void> {
    if (!equipmentId) {
      this.equipmentFiles = [];
      return;
    }

    try {
      const response = await this.fileUploadService.getEquipmentFiles(equipmentId).toPromise();
      this.equipmentFiles = response?.data || [];
    } catch (error) {
      console.error('Error loading equipment files:', error);
      this.equipmentFiles = [];
      this.toastr.error('Failed to load equipment files');
    }
  }

  // File upload methods
  onFileSelected(fileSlot: number, event: any): void {
    const file = event.target.files[0];
    
    // Clear any previous validation errors
    this.fileValidationError = '';
    
    if (file) {
      // Check if filename contains spaces
      if (file.name.includes(' ')) {
        this.fileValidationError = `File "${file.name}" contains spaces. Please rename the file using underscores (_) or hyphens (-) instead of spaces.`;
        // Clear the file input
        event.target.value = '';
        return;
      }

      // Check if file type is supported
      const supportedTypes = ['.pdf', '.jpg', '.jpeg', '.doc', '.docx', '.txt', '.pptx', '.xls', '.rtf', '.log'];
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
      
      if (!supportedTypes.includes(fileExtension)) {
        this.fileValidationError = `File type "${fileExtension}" is not supported. Supported file types: PDF, JPG, JPEG, DOC, DOCX, TXT, PPTX, XLS, RTF, LOG.`;
        // Clear the file input
        event.target.value = '';
        return;
      }

      // Check for duplicate filenames
      const existingFileNames = this.equipmentFiles.map(f => f.fileName);
      if (existingFileNames.includes(file.name)) {
        this.fileValidationError = `File "${file.name}" already exists. Duplicate filenames are not allowed. Please rename the file or choose a different file.`;
        // Clear the file input
        event.target.value = '';
        return;
      }

      // Check if this filename is already selected in another slot
      const currentlySelectedNames = this.selectedFiles
        .filter((f, index) => f !== null && index !== (fileSlot - 1))
        .map(f => f!.name);
      if (currentlySelectedNames.includes(file.name)) {
        this.fileValidationError = `File "${file.name}" is already selected for upload. Please choose a different file.`;
        // Clear the file input
        event.target.value = '';
        return;
      }
    }
    
    if (fileSlot >= 1 && fileSlot <= 2) {
      this.selectedFiles[fileSlot - 1] = file;
      // Clear any validation errors since a valid file was selected
      this.fileValidationError = '';
    }
  }

  async uploadFiles(): Promise<void> {
    // Clear any previous validation errors
    this.fileValidationError = '';
    
    if (!this.selectedEquipment) {
      this.fileValidationError = 'No equipment selected';
      return;
    }

    const filesToUpload = this.selectedFiles.filter((f): f is File => f !== null);
    if (filesToUpload.length === 0) {
      this.fileValidationError = 'Please select at least one file to upload';
      return;
    }

    // Validate that no filenames contain spaces
    const filesWithSpaces = filesToUpload.filter(file => file.name.includes(' '));
    if (filesWithSpaces.length > 0) {
      const fileNames = filesWithSpaces.map(f => f.name).join(', ');
      this.fileValidationError = `Cannot upload files with spaces in filename: ${fileNames}. Please rename using underscores (_) or hyphens (-) instead.`;
      return;
    }

    // Validate file types
    const supportedTypes = ['.pdf', '.jpg', '.jpeg', '.doc', '.docx', '.txt', '.pptx', '.xls', '.rtf', '.log'];
    const unsupportedFiles = filesToUpload.filter(file => {
      const fileName = file.name.toLowerCase();
      const fileExtension = fileName.substring(fileName.lastIndexOf('.'));
      return !supportedTypes.includes(fileExtension);
    });
    
    if (unsupportedFiles.length > 0) {
      const fileNames = unsupportedFiles.map(f => f.name).join(', ');
      this.fileValidationError = `Unsupported file types: ${fileNames}. Supported file types: PDF, JPG, JPEG, DOC, DOCX, TXT, PPTX, XLS, RTF, LOG.`;
      return;
    }

    // Validate against duplicate filenames (existing files)
    const existingFileNames = this.equipmentFiles.map(f => f.fileName);
    const duplicateFiles = filesToUpload.filter(file => existingFileNames.includes(file.name));
    if (duplicateFiles.length > 0) {
      const fileNames = duplicateFiles.map(f => f.name).join(', ');
      this.fileValidationError = `Cannot upload duplicate files: ${fileNames}. These files already exist. Please rename or choose different files.`;
      return;
    }

    // Validate against duplicate filenames within selected files
    const selectedFileNames = filesToUpload.map(f => f.name);
    const uniqueNames = new Set(selectedFileNames);
    if (selectedFileNames.length !== uniqueNames.size) {
      this.fileValidationError = `Cannot upload files with duplicate names. Please ensure all selected files have unique names.`;
      return;
    }

    // Get current logged-in user
    const currentUser = this.authService.currentUserValue;
    const createdBy = currentUser?.windowsID || this.params.techName; // Fallback to techName if no user

    this.isUploading = true;
    try {
      // Upload files using the FileUploadService
      for (const file of filesToUpload) {
        await this.fileUploadService.uploadEquipmentFile(
          this.selectedEquipment.equipId,
          this.params.techId,
          file,
          createdBy, // Use current logged-in user
          this.params.callNbr,
          this.selectedEquipment.equipNo,
          this.params.techName
        ).toPromise();
      }

      this.toastr.success('Files uploaded successfully');
      this.clearFiles();
      
      // Reload equipment files
      await this.loadEquipmentFiles(this.selectedEquipment.equipId);
      
    } catch (error) {
      console.error('Error uploading files:', error);
      this.toastr.error('Failed to upload files');
    } finally {
      this.isUploading = false;
    }
  }

  clearFiles(): void {
    this.selectedFiles = [null, null];
    this.fileValidationError = ''; // Clear validation errors
    // Clear file inputs
    const fileInput1 = document.querySelector('input[type="file"]:nth-of-type(1)') as HTMLInputElement;
    const fileInput2 = document.querySelector('input[type="file"]:nth-of-type(2)') as HTMLInputElement;
    if (fileInput1) fileInput1.value = '';
    if (fileInput2) fileInput2.value = '';
  }
}