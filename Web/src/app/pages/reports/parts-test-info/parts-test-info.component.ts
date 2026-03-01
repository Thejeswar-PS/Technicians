import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { Subject, forkJoin, Observable, of } from 'rxjs';
import { takeUntil, finalize, map, catchError, debounceTime } from 'rxjs/operators';

import { ReportService } from '../../../core/services/report.service';
import { AuthService } from '../../../modules/auth/services/auth.service';
import { 
  PartsTestInfo,
  SaveUpdatePartsTestDto,
  SaveUpdatePartsTestResponse,
  EmployeeDto,
  DeletePartsTestResponse,
  PartsTestResponse,
  PartsTestRequest,
  JobExistsResponse,
  SubmittedDateResponse,
  ArchiveRecordResponse
} from '../../../core/model/parts-test-info.model';

@Component({
  selector: 'app-parts-test-info',
  templateUrl: './parts-test-info.component.html',
  styleUrls: ['./parts-test-info.component.scss']
})
export class PartsTestInfoComponent implements OnInit, OnDestroy {

  // Form and data
  editForm: FormGroup;
  editingItem: PartsTestInfo | null = null;
  rowIndex: number = 0;
  
  // Employee data
  ptEmployees: EmployeeDto[] = []; // P and T department employees for Created By
  tcEmployees: EmployeeDto[] = []; // T department employees for other assignments
  isLoadingEmployees: boolean = false;
  isLoadingCreatedByEmployees: boolean = false;
  
  // Raw data storage for re-processing after employees load
  rawDatabaseRow: any = null;
  
  // Auto-generated ID components
  autoGenYear: string = '';
  autoGenMonth: string = '';
  autoGenDay: string = '';
  autoGenId: string = '';
  
  // UI states
  isSaving: boolean = false;
  isLoading: boolean = false;
  saveMessage: string = '';
  errorMessage: string = '';
  showBoardSetup: boolean = false;
  showDeleteConfirm: boolean = false;
  showComponentWork: boolean = false; // divGrp1
  showAssemblyQC: boolean = false; // divGrp3
  isValidatingJob: boolean = false;
  jobValidationMessage: string = '';
  
  // Job type options matching legacy exactly
  jobTypeOptions = [
    { value: '1', label: 'Fan Rebuild' },
    { value: '2', label: 'Cap Assy.' },
    { value: '4', label: 'Batt Module' },
    { value: '3', label: 'Inventory' },
    { value: '7', label: 'Board Setup' },
    { value: '6', label: 'Retest' }
  ];
  
  // Board setup status options (Job Type 7 only)
  boardSetupOptions = [
    { value: '0', label: 'Please Select' },
    { value: '1', label: 'Completed' },
    { value: '3', label: 'In Progress' },
    { value: '4', label: 'Need Parts' }
  ];
  
  // Part repair status options
  partRepairStatusOptions = [
    { value: '0', label: 'Please Select' },
    { value: '1', label: 'Ready For Test' },
    { value: '2', label: 'Non Repairable' },
    { value: '3', label: 'Need Parts' },
    { value: '4', label: 'In Progress' }
  ];
  
  // Testing final status options
  testingStatusOptions = [
    { value: '0', label: 'Please Select' },
    { value: '1', label: 'Completed' },
    { value: '2', label: 'In Progress' },
    { value: '3', label: 'Needs Unit' },
    { value: '4', label: 'Non Testable' }
  ];
  
  // Assembly status options
  assemblyStatusOptions = [
    { value: '0', label: 'Please Select' },
    { value: '1', label: 'Completed' },
    { value: '2', label: 'In Progress' },
    { value: '3', label: 'Waiting on Parts' }
  ];
  
  // QC status options
  qcStatusOptions = [
    { value: '0', label: 'Please Select' },
    { value: '1', label: 'Completed' },
    { value: '2', label: 'In Progress' },
    { value: '3', label: 'Not Acceptable' }
  ];
  
  // Priority options matching legacy system
  priorityOptions = [
    { value: 'Urgent', label: 'Within 7 days' },
    { value: 'High', label: 'Within 14 Days' },
    { value: 'Normal', label: 'Within 30 Days' },
    { value: 'Atc', label: 'Within 60+ Days' }
  ];
  
  // Component lifecycle
  private destroy$ = new Subject<void>();
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private reportService: ReportService,
    private authService: AuthService,
    private toastr: ToastrService
  ) {
    this.initializeForm();
  }
  
  ngOnInit(): void {
    // Load required data and setup component
    this.loadEmployeeData();
    this.setupQueryParamSubscription();
    this.setupJobTypeSubscription();
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private initializeForm(): void {
    const today = new Date();
    
    this.editForm = this.fb.group({
      // Basic job information
      jobFrom: ['1', Validators.required],
      jobNumber: ['', [Validators.maxLength(10)]],
      submittedOn: [{ value: '', disabled: true }],
      inventorySpecialist: [{ value: '', disabled: true }],
      siteID: ['', Validators.required],
      make: ['', Validators.required],
      model: ['', Validators.required],
      kva: ['', Validators.required],
      voltage: [''],
      quantity: [1, [Validators.required]],
      serialNo: [''],
      
      // Part information
      manufPartNo: ['', Validators.required],
      dcgPartNo: ['', Validators.required],  
      
      // Emergency flag
      emergency: [false],
      
      // Work type selections
      workType1: [false],
      workType2: [false],
      workType3: [false],
      workType4: [false],
      workType5: [false],
      workType6: [false],
      workType7: [false],
      workType8: [false],
      workType9: [false],
      workType10: [false],
      workType11: [false],
      workType12: [false],
      
      // Assignment and priority
      assignedTo: ['', Validators.required],
      priority: ['M'],
      dueDate: [today.toISOString().split('T')[0], Validators.required],
      
      // Descriptions and notes
      description: [''],
      resolveNotes: [''],
      
      // Board setup section (Job Type 7 only)
      boardSetup: ['0'],
      
      // Component work section
      compWorkDone1: [false],
      compWorkDone2: [false],
      compWorkDone3: [false],
      compWorkDone4: [false],
      compWorkDone5: [false],
      compWorkDone6: [false],
      compQualityStatus: ['0'],
      compApprovedBy: [''],
      compPassed: [false],
      compQualityWorkDone1: [false],
      compQualityWorkDone2: [false],
      compQualityWorkDone3: [false],
      compQualityProcFollowed1: [false],
      compQualityProcFollowed2: [false],
      compQualityProcFollowed3: [false],
      compQualityApproved1: [false],
      compQualityApproved2: [false],
      compQualityApproved3: [false],
      partRepairStatus: ['0'],
      
      // Testing work section  
      testWorkDone1: [false],
      testWorkDone2: [false],
      testWorkDone3: [false],
      testWorkStatus: ['0'],
      
      // Assembly work section (Job Types 1,2,4 only)
      completedBy: [''],
      assyWorkDone1: [false],
      assyWorkDone2: [false],
      assyWorkDone3: [false],
      assyWorkDone4: [false],
      assyWorkDone5: [false],
      assyWorkDone6: [false],
      assyProcFollowed1: [false],
      assyProcFollowed2: [false],
      assyProcFollowed3: [false],
      assyWorkStatus: ['0'],
      reviewedBy: [''],
      isPassed: [{ value: false, disabled: true }],
      
      // Board setup quality section
      boardQualityWorkDone1: [false],
      boardQualityWorkDone2: [false],
      boardQualityWorkDone3: [false],
      boardQualityProcFollowed1: [false],
      boardQualityProcFollowed2: [false],
      boardQualityProcFollowed3: [false],
      boardQualityApproved1: [false],
      boardQualityApproved2: [false],
      boardQualityApproved3: [false],
      boardQualityStatus: ['0'],
      boardApprovedBy: [''],
      boardPassed: [false],
      
      // QC work section
      qcWorkDone1: [false],
      qcWorkDone2: [false],
      qcWorkDone3: [false],
      qcProcFollowed1: [false],
      qcProcFollowed2: [false],
      qcProcFollowed3: [false],
      qcApproved1: [false],
      qcApproved2: [false],
      qcApproved3: [false],
      qcWorkStatus: ['0'],
      qcApprovedBy: [''],
      qcPassed: [{ value: false, disabled: true }],
      
      // Status flags
      archive: [false],
      finalApproval: [false],
    });
  }
  
  private setupQueryParamSubscription(): void {
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['rowIndex']) {
        this.rowIndex = parseInt(params['rowIndex'], 10);
        this.displayData();
      } else {
        this.rowIndex = 0;
        this.prepareNewEntry();
      }
    });
  }

  private setupJobTypeSubscription(): void {
    // Listen for job type changes - update visibility only, NO form value clearing
    // LEGACY BEHAVIOR: When user changes job type, inspection values persist from database
    this.editForm.get('jobFrom')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((value) => this.applyJobTypeVisibility(value));
    
    // Setup workflow rules subscriptions
    this.editForm.get('assyWorkStatus')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyWorkflowRules());
      
    this.editForm.get('qcWorkStatus')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyWorkflowRules());
      
    this.editForm.get('boardQualityStatus')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyWorkflowRules());
      
    this.editForm.get('compQualityStatus')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.applyWorkflowRules());
      
    // Setup job number change subscription for submitted date loading
    this.editForm.get('jobNumber')?.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(500) // Wait 500ms after user stops typing
      )
      .subscribe((jobNo) => {
        if (jobNo && jobNo.trim().length > 0) {
          this.loadSubmittedDateForJob(jobNo.trim());
        } else {
          this.editForm.get('submittedOn')?.setValue('');
        }
      });
  }
  
  private loadEmployeeData(): void {
    this.isLoadingEmployees = true;
    this.isLoadingCreatedByEmployees = true;
    
    // Load employees from both P and T departments for Created By dropdown
    forkJoin({
      ptEmployees: this.reportService.getEmployeeNamesByDept('P'),
      tEmployees: this.reportService.getEmployeeNamesByDept('T')
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.isLoadingEmployees = false;
        this.isLoadingCreatedByEmployees = false;
      })
    ).subscribe({
      next: (responses) => {
        if (responses.ptEmployees.success && responses.tEmployees.success) {
          // Combine P and T employees for Created By dropdown
          this.ptEmployees = [...responses.ptEmployees.employees, ...responses.tEmployees.employees];
          // Only T employees for other assignments
          this.tcEmployees = responses.tEmployees.employees;
          
          // Re-populate form if we have raw data waiting
          if (this.rawDatabaseRow) {
            this.populateFormFromData(this.rawDatabaseRow);
          }
        } else {
          this.handleError('Failed to load employee data');
        }
      },
      error: (error) => {
        this.handleError('Error loading employees: ' + (error.message || 'Unknown error'));
      }
    });
  }
  
  displayData(): void {
    // LEGACY BEHAVIOR: Data is loaded ONLY on page load for existing records (RowIndex > 0)
    // When user changes job type after load, inspection values persist from database
    if (this.rowIndex <= 0) {
      this.prepareNewEntry();
      return;
    }
    
    this.isLoading = true;
    
    // Load existing record from database - matching DisplayData() in legacy ASP.NET
    this.reportService.getPartsTestListByParams(this.rowIndex, 'PartsTest').pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (response: PartsTestResponse) => {
        if (response.success && response.tables && response.tables.length > 0) {
          const table = response.tables[0];
          if (table.rows && table.rows.length > 0) {
            const row = table.rows[0];
            // Store raw data for potential re-population after employees load
            this.rawDatabaseRow = row;
            
            // Populate form with all database values including inspection results
            // These values will PERSIST when user changes job type (no reset on job type change)
            if (this.ptEmployees.length > 0) {
              this.populateFormFromData(row);
            }
            
            this.editingItem = this.convertRowToPartsTestInfo(row);
            this.saveMessage = ''; // Clear any previous messages
          } else {
            this.handleError('No data found for the specified entry');
          }
        } else {
          this.handleError(response.error || response.message || 'Failed to load data');
        }
      },
      error: (error) => {
        this.handleError('Error loading data: ' + (error.message || 'Unknown error'));
      }
    });
  }
  
  private prepareNewEntry(): void {
    // Get max row index for new entry
    this.reportService.getMaxTestRowIndex().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.success) {
          const today = new Date();
          this.autoGenYear = today.getFullYear().toString();
          this.autoGenMonth = (today.getMonth() + 1).toString();
          this.autoGenDay = today.getDate().toString();
          this.autoGenId = response.maxRowIndex.toString();
          this.rowIndex = response.maxRowIndex;  // Set rowIndex for save operation
          
          this.editingItem = null;
          this.applyJobTypeVisibility(this.editForm.get('jobFrom')?.value || '1');
          this.saveMessage = '';
          this.errorMessage = '';
        }
      },
      error: (error) => {
        this.handleError('Error getting max row index: ' + (error.message || 'Unknown error'));
      }
    });
  }
  
  private populateFormFromData(row: any): void {
    // LEGACY BEHAVIOR: Data is loaded ONLY on page load for existing records (RowIndex > 0)
    // All fields including Quality checkboxes auto-populate from database and PERSIST when Job Type is changed
    
    // If employees aren't loaded yet, store data and return (will be re-called later)
    if (this.ptEmployees.length === 0) {
      this.rawDatabaseRow = row;
      return;
    }
    
    // Set auto-generated ID from existing data  
    const createdOn = new Date(row.CreatedOn || row.createdOn);
    this.autoGenYear = createdOn.getFullYear().toString();
    this.autoGenMonth = (createdOn.getMonth() + 1).toString();
    this.autoGenDay = createdOn.getDate().toString();
    this.autoGenId = this.rowIndex.toString();
    
    const manufPartNoValue = row.ManufpartNo || row.manufPartNo || row.ManufPartNo || row.MANUFPARTNO || '';
    const createdByValue = row.CreatedBy || row.createdBy || '';
    const jobFromValue = String(row.JobFrom || row.jobFrom || '1');
    const priorityValue = (row.Priority || row.priority || 'M').toString().trim();
    
    const resolvedCreatedBy = this.resolveEmployeeValue(createdByValue, this.ptEmployees, true);
    
    // Find matching assigned employee by case-insensitive name, ID, or Windows ID
    const assignedToValue = row.AssignedTo || row.assignedTo || '';
    const resolvedAssignedTo = this.resolveEmployeeValue(assignedToValue, this.tcEmployees);
    
    // Resolve employee assignments for QC/Board/Component sections
    const resolvedCompletedBy = this.resolveEmployeeValue(row.CompletedBy || row.completedBy || '', this.tcEmployees);
    const resolvedReviewedBy = this.resolveEmployeeValue(row.ReviewedBy || row.reviewedBy || '', this.tcEmployees);
    const resolvedQcApprovedBy = this.resolveEmployeeValue(row.QCApprovedBy || row.qcApprovedBy || '', this.tcEmployees);
    // For Board Setup jobs (JobFrom=7), use QCApprovedBy for Board Approved By
    const resolvedBoardApprovedBy = jobFromValue === '7' 
      ? this.resolveEmployeeValue(row.QCApprovedBy || row.qcApprovedBy || '', this.tcEmployees)
      : this.resolveEmployeeValue(row.BoardApprovedBy || row.boardApprovedBy || '', this.tcEmployees);
    const resolvedCompApprovedBy = this.resolveEmployeeValue(row.CompApprovedBy || row.compApprovedBy || '', this.tcEmployees);
    
    // Prepare job number and submitted date variables
    const jobNumber = row.CallNbr || row.callNbr || '';
    const submittedDate = row.SubmittedOn || row.submittedOn || row.SubmittedDate || row.submittedDate || '';
    
    // POPULATE ALL FIELDS - matching legacy exactly
    // Populate basic information
    this.editForm.patchValue({
      jobFrom: jobFromValue,
      jobNumber: jobNumber,
      submittedOn: submittedDate || this.formatDateForInput(row.CreatedOn || row.createdOn),
      inventorySpecialist: row.InvUserID || row.invUserID || '',
      siteID: row.SiteID || row.siteID || '',
      make: row.Make || row.make || '',
      model: row.Model || row.model || '',
      kva: row.KVA || row.kva || '',
      voltage: row.Voltage || row.voltage || '',
      quantity: parseInt(row.Quantity || row.quantity) || 1,
      serialNo: row.SerialNo || row.serialNo || '',
      manufPartNo: manufPartNoValue,
      dcgPartNo: row.DCGPartNo || row.dcgPartNo || '',
      priority: priorityValue,
      
      // Emergency flag (matching legacy chkEmergency)
      emergency: this.isUrgentPriority(priorityValue),
      
      assignedTo: resolvedAssignedTo,
      dueDate: this.formatDateForInput(row.DueDate || row.dueDate),
      description: row.Description || row.description || '',
      
      // Work stages - these auto-populate and persist when job type changes
      boardSetup: row.BoardSetupStatus || row.boardSetupStatus || '0',
      partRepairStatus: row.CompWorkStatus || row.compWorkStatus || '0', 
      testWorkStatus: row.TestWorkStatus || row.testWorkStatus || '0',
      assyWorkStatus: String(row.AssyWorkStatus || row.assyWorkStatus || '0'),
      qcWorkStatus: String(row.QCWorkStatus || row.qcWorkStatus || '0'),
      
      // Quality Status - auto-populates and persists across job type changes
      boardQualityStatus: jobFromValue === '7' ? String(row.QCWorkStatus || row.qcWorkStatus || '0') : (row.BoardQualityStatus || row.boardQualityStatus || '0'),
      compQualityStatus: jobFromValue === '3' || jobFromValue === '6' ? String(row.QCWorkStatus || row.qcWorkStatus || '0') : (row.CompQualityStatus || row.compQualityStatus || '0'),
      
      // Employee assignments - auto-populate and persist
      completedBy: resolvedCompletedBy,
      reviewedBy: resolvedReviewedBy,
      isPassed: this.convertToBoolean(row.IsPassed || row.isPassed),
      qcApprovedBy: resolvedQcApprovedBy,
      qcPassed: this.convertToBoolean(row.QCPassed || row.qcPassed),
      
      // Board Setup Approved By and Passed - auto-populate from QC fields for Board Setup jobs
      boardApprovedBy: resolvedBoardApprovedBy,
      boardPassed: jobFromValue === '7' 
        ? this.convertToBoolean(row.QCPassed || row.qcPassed)
        : this.convertToBoolean(row.BoardPassed || row.boardPassed),
      
      // Component Approved By and Passed - auto-populate
      compApprovedBy: resolvedCompApprovedBy,
      compPassed: this.convertToBoolean(row.CompPassed || row.compPassed),
      
      // Resolution notes - auto-populate and persist
      resolveNotes: row.ResolveNotes || row.resolveNotes || '',
      
      // Archive and approval status
      archive: this.convertToBoolean(row.Archive || row.archive),
      finalApproval: this.convertToBoolean(row.FinalApproval || row.finalApproval)
    });
    
    // Populate work type checkboxes from comma-separated string
    this.populateWorkTypeCheckboxes(row.WorkType || row.workType || '');
    
    // AUTO-POPULATE ALL QUALITY CHECKBOXES - Work Done, Procedure Followed, Approved
    // These populate BEFORE job type visibility is applied, so they load correctly for all job types
    // Then persist in form values even when job type is changed
    this.populateWorkStageCheckboxes(row);
    
    // Apply job type visibility - shows correct sections (doesn't affect populated form values)
    this.applyJobTypeVisibility(this.editForm.get('jobFrom')?.value || '1');
    
    // Apply workflow rules after data population to enable/disable controls based on status
    this.applyWorkflowRules();
    
    // Load submitted date from API using jobNumber (already declared above)
    if (jobNumber && jobNumber.trim().length > 0) {
      this.loadSubmittedDateForJob(jobNumber.trim());
    }
    
    // Check if record is archived and disable controls
    if (this.convertToBoolean(row.Archive || row.archive)) {
      this.disableAllControls();
    }
    
    // Clear any validation messages when loading existing data
    this.jobValidationMessage = '';
  }
  
  private populateWorkTypeCheckboxes(workType: string): void {
    const selectedTypes = workType.split(',').map(t => t.trim()).filter(t => t);
    const workTypeMap: { [key: string]: string } = {
      '1': 'workType1', '2': 'workType2', '3': 'workType3', '4': 'workType4',
      '5': 'workType5', '6': 'workType6', '7': 'workType7', '8': 'workType8',
      '9': 'workType9', '10': 'workType10', '11': 'workType11', '12': 'workType12'
    };
    
    Object.keys(workTypeMap).forEach(key => {
      const isSelected = selectedTypes.includes(key);
      this.editForm.get(workTypeMap[key])?.setValue(isSelected);
    });
  }
  
  private populateWorkStageCheckboxes(row: any): void {
    // AUTO-POPULATE ALL QUALITY CHECKBOXES FOR ALL JOB TYPES
    // These fields populate from database and PERSIST across job type changes (legacy behavior)
    
    // Component work done checkboxes (1-6, contiguous)
    const compWorkDone = (row.CompWorkDone || row.compWorkDone || row.CompWOrkDone || '')
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t);
    this.populateCheckboxGroup('compWorkDone', compWorkDone, ['1', '2', '3', '4', '5', '6']);
    
    // Test work done checkboxes (1-3, contiguous)
    const testWorkDone = (row.TestWorkDone || row.testWorkDone || '')
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t);
    this.populateCheckboxGroup('testWorkDone', testWorkDone, ['1', '2', '3']);
    
    // Assembly work done checkboxes (NON-CONTIGUOUS: 1,2,4,5,6,7 - matching legacy exactly!)
    const assyWorkDone = (row.AssyWorkDone || row.assyWorkDone || '')
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t);
    this.populateCheckboxGroup('assyWorkDone', assyWorkDone, ['1', '2', '4', '5', '6', '7']);
    
    // Assembly procedure followed (1-3, as individual checkboxes)
    const assyProcFollowed = (row.AssyProcFollowed || row.assyProcFollowed || '')
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t);
    this.populateCheckboxGroup('assyProcFollowed', assyProcFollowed, ['1', '2', '3']);
    
    // QC work done checkboxes (1-3, contiguous) - used for Assembly jobs
    const qcWorkDone = (row.QCWorkDone || row.qcWorkDone || '')
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t);
    this.populateCheckboxGroup('qcWorkDone', qcWorkDone, ['1', '2', '3']);
    
    // QC procedure followed (1-3, as individual checkboxes)
    const qcProcFollowed = (row.QCProcFollowed || row.qcProcFollowed || '')
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t);
    this.populateCheckboxGroup('qcProcFollowed', qcProcFollowed, ['1', '2', '3']);
    
    // QC approved (1-3, as individual checkboxes) - Pass/Fail/N/A
    const qcApproved = (row.QCApproved || row.qcApproved || '')
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t);
    this.populateCheckboxGroup('qcApproved', qcApproved, ['1', '2', '3']);

    // AUTO-POPULATE JOB-TYPE-SPECIFIC QUALITY CHECKBOXES
    // These map to the correct UI sections based on job type and persist across job type changes
    const jobType = String(row.JobFrom || row.jobFrom || this.editForm.get('jobFrom')?.value || '1');
    
    if (jobType === '7') {
      // Board Setup jobs (JobFrom=7):
      // - Use AssyWorkDone → boardQualityWorkDone (Cleaned, Torqued, Inspected)
      // - Use AssyProcFollowed → boardQualityProcFollowed (Yes, No, N/A)
      // - Use QCApproved → boardQualityApproved (Pass, Fail, N/A)
      this.populateCheckboxGroup('boardQualityWorkDone', assyWorkDone, ['1', '2', '3']);
      this.populateCheckboxGroup('boardQualityProcFollowed', assyProcFollowed, ['1', '2', '3']);
      this.populateCheckboxGroup('boardQualityApproved', qcApproved, ['1', '2', '3']);
    }
    
    if (jobType === '3' || jobType === '6') {
      // Component/Testing jobs (JobFrom=3 Inventory, 6=Retest):
      // - Use QCWorkDone → compQualityWorkDone (Cleaned, Torqued, Inspected)
      // - Use QCProcFollowed → compQualityProcFollowed (Yes, No, N/A)
      // - Use QCApproved → compQualityApproved (Pass, Fail, N/A)
      this.populateCheckboxGroup('compQualityWorkDone', qcWorkDone, ['1', '2', '3']);
      this.populateCheckboxGroup('compQualityProcFollowed', qcProcFollowed, ['1', '2', '3']);
      this.populateCheckboxGroup('compQualityApproved', qcApproved, ['1', '2', '3']);
    }
    
    // For Assembly jobs (JobFrom=1,2,4), the qcWorkDone/qcProcFollowed/qcApproved checkboxes
    // are already populated above and will display in the Assembly QC section
  }

  private remapQualityFieldsForJobType(newJobType: string, row: any): void {
    // When job type changes, re-populate quality checkboxes for the NEW job type section
    // using the same database values that were originally loaded
    
    // Extract quality data from database (same extraction as populateWorkStageCheckboxes)
    const assyWorkDone = (row.AssyWorkDone || row.assyWorkDone || '')
      .split(',').map((t: string) => t.trim()).filter((t: string) => t);
    const assyProcFollowed = (row.AssyProcFollowed || row.assyProcFollowed || '')
      .split(',').map((t: string) => t.trim()).filter((t: string) => t);
    const qcWorkDone = (row.QCWorkDone || row.qcWorkDone || '')
      .split(',').map((t: string) => t.trim()).filter((t: string) => t);
    const qcProcFollowed = (row.QCProcFollowed || row.qcProcFollowed || '')
      .split(',').map((t: string) => t.trim()).filter((t: string) => t);
    const qcApproved = (row.QCApproved || row.qcApproved || '')
      .split(',').map((t: string) => t.trim()).filter((t: string) => t);
    
    // Resolve employee for approved by (always from QCApprovedBy in database)
    const resolvedQcApprovedBy = this.resolveEmployeeValue(row.QCApprovedBy || row.qcApprovedBy || '', this.tcEmployees);
    const qcWorkStatus = String(row.QCWorkStatus || row.qcWorkStatus || '0');
    const qcPassed = this.convertToBoolean(row.QCPassed || row.qcPassed);
    
    // Re-populate based on NEW job type
    if (newJobType === '7') {
      // Changed TO Board Setup: populate board quality checkboxes
      this.populateCheckboxGroup('boardQualityWorkDone', assyWorkDone, ['1', '2', '3']);
      this.populateCheckboxGroup('boardQualityProcFollowed', assyProcFollowed, ['1', '2', '3']);
      this.populateCheckboxGroup('boardQualityApproved', qcApproved, ['1', '2', '3']);
      
      // Update board quality status, approved by, and passed (from QC fields)
      this.editForm.patchValue({
        boardQualityStatus: qcWorkStatus,
        boardApprovedBy: resolvedQcApprovedBy,
        boardPassed: qcPassed
      });
    } else if (newJobType === '3' || newJobType === '6') {
      // Changed TO Component/Testing: populate component quality checkboxes
      this.populateCheckboxGroup('compQualityWorkDone', qcWorkDone, ['1', '2', '3']);
      this.populateCheckboxGroup('compQualityProcFollowed', qcProcFollowed, ['1', '2', '3']);
      this.populateCheckboxGroup('compQualityApproved', qcApproved, ['1', '2', '3']);
      
      // Update component quality status, approved by, and passed (from QC fields)
      this.editForm.patchValue({
        compQualityStatus: qcWorkStatus,
        compApprovedBy: resolvedQcApprovedBy,
        compPassed: qcPassed
      });
    } else if (newJobType === '1' || newJobType === '2' || newJobType === '4') {
      // Changed TO Assembly: QC checkboxes already populated in populateWorkStageCheckboxes
      // Update QC status, approved by, and passed
      this.editForm.patchValue({
        qcWorkStatus: qcWorkStatus,
        qcApprovedBy: resolvedQcApprovedBy,
        qcPassed: qcPassed
      });
    }
  }
  
  private populateCheckboxGroup(prefix: string, selectedValues: string[], availableValues: string[]): void {
    availableValues.forEach((value, index) => {
      const controlName = `${prefix}${index + 1}`;
      const isSelected = selectedValues.includes(value);
      this.editForm.get(controlName)?.setValue(isSelected);
    });
  }

  private resolveEmployeeValue(value: string, employees: EmployeeDto[], preferWindowsId: boolean = false): string {
    if (!value) return '';
    const normalizedValue = value.toLowerCase().replace(/\./g, ' ');
    const match = employees.find(emp => {
      const normalizedEmpName = emp.empName.toLowerCase();
      const normalizedEmpID = emp.empID.toLowerCase();
      const normalizedWindowsID = (emp.windowsID || '').toLowerCase();
      return normalizedEmpName === normalizedValue || normalizedEmpID === normalizedValue || normalizedWindowsID === normalizedValue;
    });
    if (!match) return value;
    return preferWindowsId ? (match.windowsID || value) : (match.empName || value);
  }

  private isUrgentPriority(priority: string): boolean {
    const normalized = priority.trim().toLowerCase();
    return normalized === 'urgent' || normalized === 'u' || normalized === 'emergency' || normalized === 'e';
  }
  
  private convertRowToPartsTestInfo(row: any): PartsTestInfo {
    return {
      id: row.RowIndex || row.rowIndex,
      partNumber: row.DCGPartNo || row.dcgPartNo,
      description: row.Description || row.description,
      quantity: parseInt(row.Quantity || row.quantity) || 1,
      serialNumber: row.SerialNo || row.serialNo,
      // Add other fields as needed
    };
  }
  
  saveItem(): void {
    if (!this.editForm.valid) {
      this.markFormGroupTouched(this.editForm);
      this.toastr.error('Please correct the validation errors', 'Form Invalid');
      return;
    }
    
    // Run comprehensive validation before save (matching legacy)
    if (!this.validateBeforeSave()) {
      return;
    }
    
    this.isSaving = true;
    this.errorMessage = '';
    
    const dto = this.buildSaveUpdateDto();
    
    this.reportService.saveUpdatePartsTestList(dto).pipe(
      takeUntil(this.destroy$),
      finalize(() => this.isSaving = false)
    ).subscribe({
      next: (response: SaveUpdatePartsTestResponse) => {
        if (response.success) {
          this.saveMessage = response.message || 'Entry saved successfully';
          this.toastr.success(this.saveMessage, 'Success');
          
          if (response.rowIndex && response.rowIndex > 0) {
            // Update URL with new rowIndex for newly created entries
            if (this.rowIndex === 0) {
              this.rowIndex = response.rowIndex;
              this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { rowIndex: this.rowIndex },
                queryParamsHandling: 'merge'
              });
            }
          }
        } else {
          this.handleError(response.error || response.message || 'Failed to save entry');
        }
      },
      error: (error) => {
        this.handleError('Error saving entry: ' + (error.message || 'Unknown error'));
      }
    });
  }
  
  private buildSaveUpdateDto(): SaveUpdatePartsTestDto {
    const formValue = this.editForm.value;
    const currentWindowsId = this.authService.currentUserValue?.windowsID || this.authService.currentUserValue?.userName || 'System';
    
    // Build DTO matching EXACTLY what backend expects (39 parameters)
    const dto = {
      // Core fields (PascalCase to match backend DTO properties)
      jobFrom: formValue.jobFrom || '1',
      callNbr: this.addPrefixToCallNbr(formValue.jobNumber || ''),
      siteID: formValue.siteID || '',
      make: formValue.make || '',
      model: formValue.model || '',
      manufPartNo: (formValue.manufPartNo || '').toUpperCase(),
      dcgPartNo: (formValue.dcgPartNo || '').toUpperCase(),
      serialNo: formValue.serialNo || '',
      quantity: parseInt(formValue.quantity) || 1,
      workType: this.getSelectedWorkTypes(),
      description: formValue.description || '',
      priority: formValue.emergency ? 'Urgent' : (formValue.priority || 'M'),
      assignedTo: formValue.assignedTo || '',
      dueDate: new Date(formValue.dueDate),
      KVA: formValue.kva || '',  // ← Fixed case: kva → KVA
      Voltage: formValue.voltage || '',  // ← Fixed case: voltage → Voltage
      resolveNotes: formValue.resolveNotes || '',
      rowIndex: this.rowIndex,
      
      // Work status fields
      boardStatus: formValue.boardSetup || '0',
      compWorkDone: this.getCompWorkDoneValue(),
      compWorkStatus: formValue.partRepairStatus || '',
      testWorkDone: this.getTestWorkDoneValue(),
      testWorkStatus: formValue.testWorkStatus || '0',
      completedBy: formValue.completedBy || '',
      reviewedBy: formValue.reviewedBy || '',
      isPassed: formValue.isPassed || false,
      assyWorkDone: this.getAssyWorkDoneValue(),
      assyProcFollowed: this.getAssyProcFollowedValue(),
      assyWorkStatus: formValue.assyWorkStatus || '0',
      qcWorkDone: (() => {
        const jobType = this.getJobTypeValue();
        const isBoardSetup = jobType === '7';
        const isComponent = jobType === '3' || jobType === '6';
        const isAssembly = jobType === '1' || jobType === '2' || jobType === '4';
        
        if (isBoardSetup) return this.getBoardQualityWorkDoneValue() || '';
        if (isComponent) return this.getCompQualityWorkDoneValue() || '';
        if (isAssembly) return this.getQcWorkDoneValue() || '';
        return '';
      })(),
      qcProcFollowed: (() => {
        const jobType = this.getJobTypeValue();
        const isBoardSetup = jobType === '7';
        const isComponent = jobType === '3' || jobType === '6';
        const isAssembly = jobType === '1' || jobType === '2' || jobType === '4';
        
        if (isBoardSetup) return this.getBoardQualityProcFollowedValue() || '';
        if (isComponent) return this.getCompQualityProcFollowedValue() || '';
        if (isAssembly) return this.getQcProcFollowedValue() || '';
        return '';
      })(),
      qcApproved: (() => {
        const jobType = this.getJobTypeValue();
        const isBoardSetup = jobType === '7';
        const isComponent = jobType === '3' || jobType === '6';
        const isAssembly = jobType === '1' || jobType === '2' || jobType === '4';
        
        if (isBoardSetup) return this.getBoardQualityApprovedValue() || '';
        if (isComponent) return this.getCompQualityApprovedValue() || '';
        if (isAssembly) return this.getQcApprovedValue() || '';
        return '';
      })(),
      qcWorkStatus: (() => {
        const jobType = this.getJobTypeValue();
        const isBoardSetup = jobType === '7';
        const isComponent = jobType === '3' || jobType === '6';
        const isAssembly = jobType === '1' || jobType === '2' || jobType === '4';
        
        if (isBoardSetup) return formValue.boardQualityStatus || '';
        if (isComponent) return formValue.compQualityStatus || '';
        if (isAssembly) return formValue.qcWorkStatus || '';
        return '';
      })(),
      qcApprovedBy: (() => {
        const jobType = this.getJobTypeValue();
        const isBoardSetup = jobType === '7';
        const isComponent = jobType === '3' || jobType === '6';
        const isAssembly = jobType === '1' || jobType === '2' || jobType === '4';
        
        if (isBoardSetup) return formValue.boardApprovedBy || '';
        if (isComponent) return formValue.compApprovedBy || '';
        if (isAssembly) return formValue.qcApprovedBy || '';
        return '';
      })(),
      qcPassed: (() => {
        const jobType = this.getJobTypeValue();
        const isBoardSetup = jobType === '7';
        const isComponent = jobType === '3' || jobType === '6';
        const isAssembly = jobType === '1' || jobType === '2' || jobType === '4';
        
        if (isBoardSetup) return formValue.boardPassed || false;
        if (isComponent) return formValue.compPassed || false;
        if (isAssembly) return formValue.qcPassed || false;
        return false;
      })(),
      
      // Backend audit fields (matching stored procedure exactly)
      CreatedBy: currentWindowsId,
      Approved: false,  // Always false since checkbox was removed from UI
      LastModifiedBy: currentWindowsId
      
      // REMOVED: SubmittedDate, CreatedOn, Archive, FinalApproval (not in backend)
    };
    
    return dto;
  }
  
  private getSelectedWorkTypes(): string {
    const formValue = this.editForm.value;
    const selectedTypes: string[] = [];
    
    for (let i = 1; i <= 12; i++) {
      if (formValue[`workType${i}`]) {
        selectedTypes.push(i.toString());
      }
    }
    
    return selectedTypes.join(',');
  }
  
  private addPrefixToCallNbr(searchJob: string): string {
    const trimmedJob = searchJob.trim();
    
    if (trimmedJob.length === 0) {
      return '';
    }
    
    if (trimmedJob.length >= 10) {
      return trimmedJob.substring(0, 10);
    }
    
    // Pad with leading zeros to make it 10 characters
    const zerosNeeded = 10 - trimmedJob.length;
    return '0'.repeat(zerosNeeded) + trimmedJob;
  }
  
  confirmDeleteItem(item: PartsTestInfo | null): void {
    if (!item || !this.rowIndex) {
      return;
    }
    
    this.showDeleteConfirm = true;
  }
  
  deleteItem(): void {
    this.showDeleteConfirm = false;
    
    this.reportService.deletePartsTestList(this.rowIndex, 'PartsTest').pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: DeletePartsTestResponse) => {
        if (response.success) {
          this.toastr.success(response.message || 'Entry deleted successfully', 'Success');
          this.goBack(); // Navigate back to list
        } else {
          this.handleError(response.error || response.message || 'Failed to delete entry');
        }
      },
      error: (error) => {
        this.handleError('Error deleting entry: ' + (error.message || 'Unknown error'));
      }
    });
  }
  
  createNewItem(): void {
    // Navigate to new entry mode
    this.router.navigate(['/reports/parts-test-info'], {
      queryParams: {}
    });
  }
  
  clearForm(): void {
    if (this.editingItem && this.saveMessage) {
      // Create new mode after successful save
      this.createNewItem();
    } else {
      // Just clear the current form
      this.editForm.reset();
      this.initializeForm();
    }
  }
  
  goBack(): void {
    this.router.navigate(['/reports/parts-test-status']);
  }
  
  // Form helper methods
  isFieldInvalid(fieldName: string): boolean {
    const field = this.editForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
  
  getFieldError(fieldName: string): string {
    const field = this.editForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      const errors = field.errors;
      if (errors['required']) return `${this.getFieldLabel(fieldName)} is required`;
      if (errors['maxlength']) return `${this.getFieldLabel(fieldName)} is too long`;
      if (errors['min']) return `${this.getFieldLabel(fieldName)} must be at least ${errors['min'].min}`;
      if (errors['max']) return `${this.getFieldLabel(fieldName)} cannot exceed ${errors['max'].max}`;
    }
    return '';
  }
  
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      jobFrom: 'Job Type',
      manufPartNo: 'Manufacturer Part Number',
      dcgPartNo: 'DCG Part Number',
      quantity: 'Quantity',
      createdBy: 'Created By',
      assignedTo: 'Assigned To',
      dueDate: 'Due Date',
      resolveNotes: 'Resolution Notes'
    };
    return labels[fieldName] || fieldName;
  }
  
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
  
  get isAddEntryEnabled(): boolean {
    return !this.isLoading && !this.isSaving;
  }

  get isBoardSetupJob(): boolean {
    return this.getJobTypeValue() === '7';
  }

  get isAssemblyJob(): boolean {
    const jobType = this.getJobTypeValue();
    return jobType === '1' || jobType === '2' || jobType === '4';
  }

  get isComponentJob(): boolean {
    return !this.isBoardSetupJob && !this.isAssemblyJob;
  }
  
  // Employee helper methods
  getEmployeeOptions(): EmployeeDto[] {
    return this.tcEmployees;
  }
  
  getCreatedByEmployeeOptions(): EmployeeDto[] {
    return this.ptEmployees;
  }
  
  getEmployeeDisplayName(employee: EmployeeDto): string {
    return employee.empName;
  }
  
  // Auto-generated ID display
  getFormattedAutoGenId(): string {
    return `${this.autoGenYear}-${this.autoGenMonth.padStart(2, '0')}-${this.autoGenDay.padStart(2, '0')}-${this.autoGenId}`;
  }
  
  // Utility methods  
  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    return charCode >= 48 && charCode <= 57; // Allow only numbers
  }
  
  onlyNumbersAndDecimal(event: KeyboardEvent): boolean {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode === 46) { // Allow decimal point
      const target = event.target as HTMLInputElement;
      return target.value.indexOf('.') === -1; // Only one decimal point
    }
    return charCode >= 48 && charCode <= 57; // Allow numbers
  }
  
  onPasteNumbers(event: ClipboardEvent): void {
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData?.getData('text') || '';
    if (!/^\d+$/.test(pastedText)) {
      event.preventDefault();
    }
  }
  
  onPasteDecimals(event: ClipboardEvent): void {
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData?.getData('text') || '';
    if (!/^\d*\.?\d*$/.test(pastedText)) {
      event.preventDefault();
    }
  }
  
  onJobTypeChange(jobType: string): void {
    // LEGACY BEHAVIOR: When user manually changes job type, update visibility AND re-map quality checkboxes
    // Do NOT clear any inspection values, approval info, or other loaded data
    // Database values persist and re-populate for the new job type section
    
    // Re-populate quality checkboxes for the new job type if we have database data
    if (this.rawDatabaseRow) {
      this.remapQualityFieldsForJobType(jobType, this.rawDatabaseRow);
    }
    
    this.applyJobTypeVisibility(jobType);
    
    // Re-apply workflow rules to enable/disable controls based on new job type's status
    this.applyWorkflowRules();
  }
  
  // Utility methods for data conversion
  private convertToBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1';
    return !!value;
  }
  
  private formatDateForInput(date: any): string {
    if (!date) return new Date().toISOString().split('T')[0];
    
    const d = new Date(date);
    if (isNaN(d.getTime())) return new Date().toISOString().split('T')[0];
    
    return d.toISOString().split('T')[0];
  }

  // Format date for display as DD-mon-YYYY (e.g., 03-oct-2025)
  private formatDisplayDate(date: string | Date | null | undefined): string {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    
    const day = d.getDate().toString().padStart(2, '0');
    const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    const month = monthNames[d.getMonth()];
    const year = d.getFullYear();
    
    return `${day}-${month}-${year}`;
  }
  
  // Enhanced error handling for API failures
  private handleError(message: string): void {
    this.errorMessage = message;
    this.toastr.error(message, 'Error');
    console.error('PartsTestInfo Error:', message);
    
    // Auto-clear error message after 5 seconds
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
  }
  
  // Additional methods referenced in HTML template
  
  openTestProcedure(): void {
    // Open test procedure document - could be a PDF or link
    window.open('/assets/dcg-procedures/test-procedure.pdf', '_blank');
  }
  
  // Passed checkbox validation (matching legacy IsPassedCheck)
  onPassedCheckboxClick(checkboxType: 'assembly' | 'qc'): boolean {
    const formValue = this.editForm.value;
    
    if (checkboxType === 'assembly') {
      const assyStatus = formValue.assyWorkStatus;
      const reviewedBy = formValue.reviewedBy;
      
      if (assyStatus !== '1') {
        this.toastr.error('Assembly Status must be Completed before marking Passed.', 'Validation');
        this.editForm.get('isPassed')?.setValue(false);
        return false;
      }
      
      if (!reviewedBy || reviewedBy === 'PS' || reviewedBy === '0' || reviewedBy === '') {
        this.toastr.error('Please select Reviewed By before marking Passed.', 'Validation');
        this.editForm.get('isPassed')?.setValue(false);
        return false;
      }
    }
    
    if (checkboxType === 'qc') {
      const qcStatus = formValue.qcWorkStatus;
      const qcApprovedBy = formValue.qcApprovedBy;
      
      if (qcStatus !== '1') {
        this.toastr.error('Quality Status must be Completed before marking Passed.', 'Validation');
        this.editForm.get('qcPassed')?.setValue(false);
        return false;
      }
      
      if (!qcApprovedBy || qcApprovedBy === 'PS' || qcApprovedBy === '0' || qcApprovedBy === '') {
        this.toastr.error('Please select Approved By before marking Passed.', 'Validation');
        this.editForm.get('qcPassed')?.setValue(false);
        return false;
      }
    }
    
    return true;
  }



  private applyJobTypeVisibility(jobType: string): void {
    // LEGACY BEHAVIOR: When job type changes, ONLY visibility is affected - NO form values are cleared
    // Result of Inspection values (quality checkboxes, approved by, etc) remain loaded from database
    const normalizedJobType = String(jobType || '').trim();
    
    // Hide all sections first (matching legacy $('#brdSetup,#divGrp1,#divGrp3').hide();)
    this.showBoardSetup = false;
    this.showComponentWork = false;
    this.showAssemblyQC = false;
    
    // Show appropriate section based on job type (matching legacy exactly)
    // NOTE: Form values are NOT reset or cleared - they persist from database
    if (normalizedJobType === '7') {
      // Board Setup only
      this.showBoardSetup = true;
    } else if (normalizedJobType === '1' || normalizedJobType === '2' || normalizedJobType === '4') {
      // Fan Rebuild, Cap Assy., Batt Module -> Assembly & QC
      this.showAssemblyQC = true;
    } else {
      // All other job types (Inventory, Retest) -> Component & Testing
      this.showComponentWork = true;
    }
  }

  private applyWorkflowRules(): void {
    const assyWorkStatus = String(this.editForm.get('assyWorkStatus')?.value || '0');
    const qcWorkStatus = String(this.editForm.get('qcWorkStatus')?.value || '0');
    const boardQualityStatus = String(this.editForm.get('boardQualityStatus')?.value || '0');
    const compQualityStatus = String(this.editForm.get('compQualityStatus')?.value || '0');
    
    const assemblyDone = assyWorkStatus === '1'; // Completed
    const qcDone = qcWorkStatus === '1'; // Completed
    const boardDone = boardQualityStatus === '1'; // Passed
    const compDone = compQualityStatus === '1'; // Passed

    // Board quality-driven controls (matching legacy exactly)
    const boardApprovedByControl = this.editForm.get('boardApprovedBy');
    const boardPassedControl = this.editForm.get('boardPassed');
    
    if (boardDone) {
      boardApprovedByControl?.enable();
      boardPassedControl?.enable();
    } else {
      boardApprovedByControl?.disable();
      boardApprovedByControl?.setValue('');
      boardPassedControl?.disable();
      boardPassedControl?.setValue(false);
    }

    // Component quality-driven controls (matching legacy exactly)
    const compApprovedByControl = this.editForm.get('compApprovedBy');
    const compPassedControl = this.editForm.get('compPassed');
    
    if (compDone) {
      compApprovedByControl?.enable();
      compPassedControl?.enable();
    } else {
      compApprovedByControl?.disable();
      compApprovedByControl?.setValue('');
      compPassedControl?.disable();
      compPassedControl?.setValue(false);
    }

    // Assembly-driven controls (matching legacy exactly)
    const reviewedByControl = this.editForm.get('reviewedBy');
    const isPassedControl = this.editForm.get('isPassed');
    
    if (assemblyDone) {
      reviewedByControl?.enable();
      isPassedControl?.enable();
    } else {
      reviewedByControl?.disable();
      reviewedByControl?.setValue('');
      isPassedControl?.disable();
      isPassedControl?.setValue(false);
    }

    // QC-driven controls (matching legacy exactly)
    const qcApprovedByControl = this.editForm.get('qcApprovedBy');
    const qcPassedControl = this.editForm.get('qcPassed');
    
    if (qcDone) {
      qcApprovedByControl?.enable();
      qcPassedControl?.enable();
    } else {
      qcApprovedByControl?.disable();
      qcApprovedByControl?.setValue('');
      qcPassedControl?.disable();
      qcPassedControl?.setValue(false);
    }
  }

  // Comprehensive final approval validation matching legacy exactly
  private validateFinalApproval(): boolean {
    const formValue = this.editForm.value;
    const jobType = this.getJobTypeValue();
    
    // Board Setup validation (Job Type 7)
    if (jobType === '7') {
      if (formValue.boardQualityStatus !== '1') {
        this.toastr.error('Board Quality Status must be Completed for Final Approval.', 'Validation');
        return false;
      }
      
      if (!formValue.boardApprovedBy || formValue.boardApprovedBy === 'PS' || formValue.boardApprovedBy === '0') {
        this.toastr.error('Board Approved By must be selected for Final Approval.', 'Validation');
        return false;
      }
      
      if (!formValue.boardPassed) {
        this.toastr.error('Board Setup must be Passed before Final Approval.', 'Validation');
        return false;
      }
      
      // Check board quality work done
      if (!this.isAnyBoardQualityWorkDoneChecked()) {
        this.toastr.error('Select at least one Board Quality Work Done.', 'Validation');
        return false;
      }
      
      // Check board quality procedure followed
      if (!this.isAnyBoardQualityProcFollowedChecked()) {
        this.toastr.error('Select Board Quality Procedure Followed.', 'Validation');
        return false;
      }
      
      // Check board quality approved
      if (!this.isAnyBoardQualityApprovedChecked()) {
        this.toastr.error('Select Board Quality Approved status.', 'Validation');
        return false;
      }
    }
    // Component/Testing validation (Job Types 3, 6 - Inventory, Retest)
    else if (jobType === '3' || jobType === '6') {
      if (formValue.compQualityStatus !== '1') {
        this.toastr.error('Component Quality Status must be Completed for Final Approval.', 'Validation');
        return false;
      }
      
      if (!formValue.compApprovedBy || formValue.compApprovedBy === 'PS' || formValue.compApprovedBy === '0') {
        this.toastr.error('Component Approved By must be selected for Final Approval.', 'Validation');
        return false;
      }
      
      if (!formValue.compPassed) {
        this.toastr.error('Component Testing must be Passed before Final Approval.', 'Validation');
        return false;
      }
      
      // Check component quality work done
      if (!this.isAnyCompQualityWorkDoneChecked()) {
        this.toastr.error('Select at least one Component Quality Work Done.', 'Validation');
        return false;
      }
      
      // Check component quality procedure followed
      if (!this.isAnyCompQualityProcFollowedChecked()) {
        this.toastr.error('Select Component Quality Procedure Followed.', 'Validation');
        return false;
      }
      
      // Check component quality approved
      if (!this.isAnyCompQualityApprovedChecked()) {
        this.toastr.error('Select Component Quality Approved status.', 'Validation');
        return false;
      }
    }
    // Assembly validation (Job Types 1, 2, 4 - Fan Rebuild, Cap Assy, Batt Module)
    else if (jobType === '1' || jobType === '2' || jobType === '4') {
      if (formValue.assyWorkStatus !== '1') {
        this.toastr.error('Assembly Status must be Completed for Final Approval.', 'Validation');
        return false;
      }
      
      if (!formValue.reviewedBy || formValue.reviewedBy === 'PS' || formValue.reviewedBy === '0') {
        this.toastr.error('Reviewed By must be selected for Final Approval.', 'Validation');
        return false;
      }
      
      if (!formValue.isPassed) {
        this.toastr.error('Assembly must be Passed before Final Approval.', 'Validation');
        return false;
      }
      
      // Check assembly work done
      if (!this.isAnyAssyWorkDoneChecked()) {
        this.toastr.error('Select at least one Assembly Work Done.', 'Validation');
        return false;
      }
      
      // Check assembly procedure followed
      if (!this.isAnyAssyProcFollowedChecked()) {
        this.toastr.error('Select Assembly Procedure Followed.', 'Validation');
        return false;
      }
      
      // Quality validation (matching legacy)
      if (formValue.qcWorkStatus !== '1') {
        this.toastr.error('Quality Status must be Completed for Final Approval.', 'Validation');
        return false;
      }
      
      if (!formValue.qcApprovedBy || formValue.qcApprovedBy === 'PS' || formValue.qcApprovedBy === '0') {
        this.toastr.error('Approved By must be selected for Final Approval.', 'Validation');
        return false;
      }
      
      if (!formValue.qcPassed) {
        this.toastr.error('Quality must be Passed before Final Approval.', 'Validation');
        return false;
      }
      
      // Check QC work done
      if (!this.isAnyQCWorkDoneChecked()) {
        this.toastr.error('Select at least one Quality Work Done.', 'Validation');
        return false;
      }
      
      // Check QC procedure followed
      if (!this.isAnyQCProcFollowedChecked()) {
        this.toastr.error('Select Quality Procedure Followed.', 'Validation');
        return false;
      }
      
      // Check QC approved status
      if (!this.isAnyQCApprovedChecked()) {
        this.toastr.error('Select Quality Approved status.', 'Validation');
        return false;
      }
    } else {
      this.toastr.error('Invalid job type for final approval.', 'Validation');
      return false;
    }
    
    // Final confirmation (matching legacy)
    return confirm('Are you sure you want to Final Approve this job?');
  }
  
  private isAnyAssyWorkDoneChecked(): boolean {
    const formValue = this.editForm.value;
    return formValue.assyWorkDone1 || formValue.assyWorkDone2 || formValue.assyWorkDone3 || 
           formValue.assyWorkDone4 || formValue.assyWorkDone5 || formValue.assyWorkDone6;
  }
  
  private isAnyAssyProcFollowedChecked(): boolean {
    const formValue = this.editForm.value;
    return formValue.assyProcFollowed1 || formValue.assyProcFollowed2 || formValue.assyProcFollowed3;
  }
  
  private isAnyQCWorkDoneChecked(): boolean {
    const formValue = this.editForm.value;
    return formValue.qcWorkDone1 || formValue.qcWorkDone2 || formValue.qcWorkDone3;
  }
  
  private isAnyQCProcFollowedChecked(): boolean {
    const formValue = this.editForm.value;
    return formValue.qcProcFollowed1 || formValue.qcProcFollowed2 || formValue.qcProcFollowed3;
  }
  
  private isAnyQCApprovedChecked(): boolean {
    const formValue = this.editForm.value;
    return formValue.qcApproved1 || formValue.qcApproved2 || formValue.qcApproved3;
  }

  // Board Quality validation helpers
  private isAnyBoardQualityWorkDoneChecked(): boolean {
    const formValue = this.editForm.value;
    return formValue.boardQualityWorkDone1 || formValue.boardQualityWorkDone2 || formValue.boardQualityWorkDone3;
  }

  private isAnyBoardQualityProcFollowedChecked(): boolean {
    const formValue = this.editForm.value;
    return formValue.boardQualityProcFollowed1 || formValue.boardQualityProcFollowed2 || formValue.boardQualityProcFollowed3;
  }

  private isAnyBoardQualityApprovedChecked(): boolean {
    const formValue = this.editForm.value;
    return formValue.boardQualityApproved1 || formValue.boardQualityApproved2 || formValue.boardQualityApproved3;
  }

  // Component Quality validation helpers
  private isAnyCompQualityWorkDoneChecked(): boolean {
    const formValue = this.editForm.value;
    return formValue.compQualityWorkDone1 || formValue.compQualityWorkDone2 || formValue.compQualityWorkDone3;
  }

  private isAnyCompQualityProcFollowedChecked(): boolean {
    const formValue = this.editForm.value;
    return formValue.compQualityProcFollowed1 || formValue.compQualityProcFollowed2 || formValue.compQualityProcFollowed3;
  }

  private isAnyCompQualityApprovedChecked(): boolean {
    const formValue = this.editForm.value;
    return formValue.compQualityApproved1 || formValue.compQualityApproved2 || formValue.compQualityApproved3;
  }

  // Board setup approval validation (matching legacy CheckApproved)
  private validateBoardSetupApproval(): boolean {
    const formValue = this.editForm.value;
    
    if (formValue.jobFrom === '7' && formValue.boardSetup !== '1') {
      this.toastr.error('Board Setup must be completed.', 'Validation');
      return false;
    }
    
    return true;
  }
  
  // Emergency flag styling (matching legacy bindEmergencyToggle)
  toggleEmergencyFlag(): void {
    const isEmergency = this.editForm.get('emergency')?.value;
    this.editForm.get('priority')?.setValue(isEmergency ? 'Urgent' : 'M');
    // Emergency styling should be handled in the HTML template
  }
  
  // Save validation (matching legacy validatePassedBeforeSave)
  private validateBeforeSave(): boolean {
    const formValue = this.editForm.value;
    
    // Work type validation (matching legacy validateWorkType)
    if (this.getSelectedWorkTypes().length === 0) {
      this.toastr.error('Select at least one Work Type.', 'Validation');
      return false;
    }
    
    // Assigned To validation (matching legacy - cannot be "PS" or empty)
    if (!formValue.assignedTo || formValue.assignedTo === 'PS' || formValue.assignedTo === '0' || formValue.assignedTo.trim() === '') {
      this.toastr.error('Please select a valid employee in Assigned To field.', 'Validation');
      return false;
    }
    
    // Job number validation if provided
    const jobNo = formValue.jobNumber;
    if (jobNo && jobNo.trim().length > 0 && this.jobValidationMessage.includes('⚠')) {
      this.toastr.error('Job number not found in system. Please verify the job number.', 'Validation');
      return false;
    }
    
    // Board setup validation for job type 7
    if (!this.validateBoardSetupApproval()) {
      return false;
    }
    
    // Due date validation (matching legacy rules)
    const dueDateValue = formValue.dueDate ? new Date(formValue.dueDate) : null;
    if (!dueDateValue || isNaN(dueDateValue.getTime())) {
      this.toastr.error('Please enter Due Date', 'Validation');
      return false;
    }
    
    // New entry date validation with priority-based limits (matching legacy rules)
    if (this.rowIndex === 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (dueDateValue < today) {
        this.toastr.error("Due Date must be greater than today's date", 'Validation');
        return false;
      }
      
      // Priority-based due date limits (matching legacy validation)
      const daysDiff = Math.floor((Date.UTC(dueDateValue.getFullYear(), dueDateValue.getMonth(), dueDateValue.getDate())
        - Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())) / (1000 * 60 * 60 * 24));
      const priority = formValue.priority;
      const limitMap: { [key: string]: number } = {
        'Urgent': 7,
        'High': 30,
        'Normal': 90
      };
      const limit = limitMap[priority];
      if (limit && daysDiff > limit) {
        this.toastr.error(`If you select priority as ${priority} then Due Date must be within ${limit} Days.`, 'Validation');
        return false;
      }
    }

    // Test work status validation (matching legacy)
    if (formValue.testWorkStatus === '1' && !formValue.resolveNotes) {
      this.toastr.error('Please enter after testing notes and resave your Part', 'Validation');
      return false;
    }

    // QC validation for specific job types (matching legacy)
    const jobType = this.getJobTypeValue();
    
    // Board Setup validation (Job Type 7)
    if (jobType === '7') {
      // Check board quality work done
      if (!this.isAnyBoardQualityWorkDoneChecked()) {
        this.toastr.error('You cannot update without checking Board Quality - Work Done', 'Validation');  
        return false;
      }
      // Check board quality procedures followed
      if (!this.isAnyBoardQualityProcFollowedChecked()) {
        this.toastr.error('You cannot update without checking Board Quality - Procedure Followed', 'Validation');
        return false;
      }
      // Check board quality approved
      if (!this.isAnyBoardQualityApprovedChecked()) {
        this.toastr.error('You cannot update without checking Board Quality - Approved (Pass, Fail, or N/A)', 'Validation');
        return false;
      }
    }
    
    // Component/Testing validation (Job Types 3, 6)
    if (jobType === '3' || jobType === '6') {
      // Check component quality work done
      if (!this.isAnyCompQualityWorkDoneChecked()) {
        this.toastr.error('You cannot update without checking Component Quality - Work Done', 'Validation');  
        return false;
      }
      // Check component quality procedures followed
      if (!this.isAnyCompQualityProcFollowedChecked()) {
        this.toastr.error('You cannot update without checking Component Quality - Procedure Followed', 'Validation');
        return false;
      }
      // Check component quality approved
      if (!this.isAnyCompQualityApprovedChecked()) {
        this.toastr.error('You cannot update without checking Component Quality - Approved (Pass, Fail, or N/A)', 'Validation');
        return false;
      }
    }
    
    // Assembly validation (Job Types 1, 2, 4)
    if (jobType === '1' || jobType === '2' || jobType === '4') {
      if (formValue.qcWorkStatus === '1') {
        // Check QC work done
        if (!this.isAnyQCWorkDoneChecked()) {
          this.toastr.error('You cannot update without checking QC - WorkDone', 'Validation');  
          return false;
        }
        // Check QC procedures followed
        if (!this.isAnyQCProcFollowedChecked()) {
          this.toastr.error('You cannot update without checking QC - Procedures Followed', 'Validation');
          return false;
        }
        // Check QC approved
        if (!this.isAnyQCApprovedChecked()) {
          this.toastr.error('You cannot update without checking Quality Approved', 'Validation');
          return false;
        }
      }
    }

    return true;
  }

  private getJobTypeValue(): string {
    return String(this.editForm.get('jobFrom')?.value || '');
  }
  
  onTextareaInput(event: Event): void {
    // Handle textarea input if auto-resize is needed
    const textarea = event.target as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }
  
  // Handle isPassed checkbox change (matching legacy behavior)
  onPassedCheck(): void {
    const isPassedValue = this.editForm.get('isPassed')?.value;
    // Additional logic for when test is marked as passed/failed can be added here
    // This matches the legacy onPassedCheck functionality
  }
  
  cancelDelete(): void {
    this.showDeleteConfirm = false;
  }

  // Final approval with comprehensive validation
  onFinalApprove(): void {
    if (!this.rowIndex) {
      this.toastr.error('Cannot approve: No record selected', 'Error');
      return;
    }

    // Run comprehensive final approval validation (matching legacy validateFinalApproval)
    if (!this.validateFinalApproval()) {
      return;
    }

    this.isSaving = true;
    this.archiveRecord(this.rowIndex).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastr.success(response.message || 'Final Approval Successful', 'Success');
          this.editForm.get('finalApproval')?.setValue(true);
          this.editForm.get('archive')?.setValue(true);
          this.disableAllControls();
        } else if (response.validationErrors && response.validationErrors.length > 0) {
          this.toastr.error(response.validationErrors.join(' | '), 'Validation');
        } else {
          this.toastr.error(response.message || 'Failed to archive record', 'Error');
        }
        this.isSaving = false;
      },
      error: (error) => {
        this.handleError('Error during final approval: ' + (error.message || 'Unknown error'));
        this.isSaving = false;
      }
    });
  }

  // Job number validation with user feedback
  onJobNumberBlur(): void {
    const jobNo = this.editForm.get('jobNumber')?.value;
    if (!jobNo || jobNo.trim().length === 0) {
      this.jobValidationMessage = '';
      return;
    }

    this.isValidatingJob = true;
    this.jobValidationMessage = '';
    
    this.validateJobNumber(jobNo.trim()).subscribe({
      next: (isValid) => {
        if (isValid) {
          this.jobValidationMessage = '✓ Job number exists';
        } else {
          this.jobValidationMessage = '⚠ Job number not found';
        }
        this.isValidatingJob = false;
      },
      error: (error) => {
        this.jobValidationMessage = 'Error validating job number';
        this.isValidatingJob = false;
      }
    });
  }
  loadSubmittedDateForJob(jobNo: string): void {
    if (!jobNo || jobNo.trim().length === 0) {
      this.editForm.get('submittedOn')?.setValue('');
      return;
    }

    this.reportService.getSubmittedDate(jobNo).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: SubmittedDateResponse) => {
        if (response.success && response.submittedDate) {
          // Format date as DD-mon-YYYY (e.g., 03-oct-2025)
          const formattedDate = this.formatDisplayDate(response.submittedDate);
          this.editForm.get('submittedOn')?.setValue(formattedDate);
        } else {
          this.editForm.get('submittedOn')?.setValue('NA');
        }
      },
      error: (error) => {
        console.error('Error loading submitted date:', error);
        this.editForm.get('submittedOn')?.setValue('NA');
      }
    });
  }

  // Job validation method
  validateJobNumber(jobNo: string): Observable<boolean> {
    if (!jobNo || jobNo.trim().length === 0) {
      return of(false);
    }
    
    return this.reportService.checkJobExists(jobNo).pipe(
      map(response => response.success && response.exists),
      catchError(error => {
        console.error('Error validating job number:', error);
        return of(false);
      })
    );
  }

  private archiveRecord(rowIndex: number): Observable<ArchiveRecordResponse> {
    return this.reportService.archivePartsTestRecord(rowIndex).pipe(
      catchError(error => {
        console.error('Archive error:', error);
        const response = error?.error || {};
        return of({
          success: false,
          message: response.message || 'Failed to archive record',
          validationErrors: response.validationErrors || [],
          rowIndex
        });
      })
    );
  }

  private disableAllControls(): void {
    Object.keys(this.editForm.controls).forEach(key => {
      if (key !== 'finalApproval' && key !== 'archive') {
        this.editForm.get(key)?.disable();
      }
    });
  }

  get isArchived(): boolean {
    return this.editForm.get('archive')?.value || false;
  }

  get jobValidationClass(): string {
    if (this.isValidatingJob) return 'text-info';
    if (this.jobValidationMessage.includes('✓')) return 'text-success';
    if (this.jobValidationMessage.includes('⚠')) return 'text-warning';
    if (this.jobValidationMessage.includes('❌')) return 'text-danger';
    return '';
  }

  get canFinalApprove(): boolean {
    return this.rowIndex > 0 && !this.isArchived && !this.isSaving;
  }

  // Helper methods to get selected checkbox values for save operations
  private getSelectedCheckboxValues(prefix: string, optionValues: string[]): string {
    const selected: string[] = [];
    optionValues.forEach((value, index) => {
      const controlName = `${prefix}${index + 1}`;
      if (this.editForm.get(controlName)?.value === true) {
        selected.push(value);
      }
    });
    return selected.join(',');
  }

  // Board Setup Quality Work Done values
  private getBoardQualityWorkDoneValue(): string {
    return this.getSelectedCheckboxValues('boardQualityWorkDone', ['1', '2', '3']);
  }

  // Board Setup Quality Procedure Followed values
  private getBoardQualityProcFollowedValue(): string {
    return this.getSelectedCheckboxValues('boardQualityProcFollowed', ['1', '2', '3']);
  }

  // Board Setup Quality Approved values
  private getBoardQualityApprovedValue(): string {
    return this.getSelectedCheckboxValues('boardQualityApproved', ['1', '2', '3']);
  }

  // Component Quality Work Done values
  private getCompQualityWorkDoneValue(): string {
    return this.getSelectedCheckboxValues('compQualityWorkDone', ['1', '2', '3']);
  }

  // Component Quality Procedure Followed values
  private getCompQualityProcFollowedValue(): string {
    return this.getSelectedCheckboxValues('compQualityProcFollowed', ['1', '2', '3']);
  }

  // Component Quality Approved values
  private getCompQualityApprovedValue(): string {
    return this.getSelectedCheckboxValues('compQualityApproved', ['1', '2', '3']);
  }
  
  private getCompWorkDoneValue(): string {
    return this.getSelectedCheckboxValues('compWorkDone', ['1', '2', '3', '4', '5', '6']);
  }
  
  private getTestWorkDoneValue(): string {
    return this.getSelectedCheckboxValues('testWorkDone', ['1', '2', '3']);
  }
  
  // Assembly uses non-contiguous values: 1,2,4,5,6,7 (no 3 - matching legacy exactly!)
  private getAssyWorkDoneValue(): string {
    return this.getSelectedCheckboxValues('assyWorkDone', ['1', '2', '4', '5', '6', '7']);
  }
  
  private getAssyProcFollowedValue(): string {
    return this.getSelectedCheckboxValues('assyProcFollowed', ['1', '2', '3']);
  }
  
  private getQcWorkDoneValue(): string {
    return this.getSelectedCheckboxValues('qcWorkDone', ['1', '2', '3']);
  }
  
  private getQcProcFollowedValue(): string {
    return this.getSelectedCheckboxValues('qcProcFollowed', ['1', '2', '3']);
  }
  
  private getQcApprovedValue(): string {
    return this.getSelectedCheckboxValues('qcApproved', ['1', '2', '3']);
  }
}
