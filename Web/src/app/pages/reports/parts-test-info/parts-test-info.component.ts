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
  EmployeeRequest,
  DeletePartsTestResponse,
  PartsTestResponse,
  PartsTestRequest,
  JobExistsResponse,
  SubmittedDateResponse
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
    { value: '2', label: 'Boards Are Completed' },
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
      jobFrom: ['1', Validators.required], // Default to Fan Rebuild
      jobNumber: ['', [Validators.maxLength(10)]], // Match legacy maxlength="10"
      submittedOn: [{ value: '', disabled: true }], // Readonly like legacy
      inventorySpecialist: [{ value: '', disabled: true }], // Display only
      siteID: ['', Validators.required], // Required like legacy
      make: ['', Validators.required], // Required like legacy
      model: ['', Validators.required], // Required like legacy
      kva: ['', Validators.required], // Required like legacy
      voltage: [''],
      quantity: [1, [Validators.required]], // Required with default
      serialNo: [''],
      
      // Part information
      manufPartNo: ['', Validators.required],
      dcgPartNo: ['', Validators.required],  
      
      // Emergency flag (missing from Angular)
      emergency: [false], // Emergency checkbox like legacy chkEmergency
      
      // Work type selections (matching legacy checkboxes)
      workType1: [false], // Refurbish
      workType2: [false], // Repair
      workType3: [false], // WH Refurbish
      workType4: [false], // Field Refurbish
      workType5: [false], // Shipping Refurbish
      workType6: [false], // Shipping Damage
      workType7: [false], // Clean Parts/Components
      workType8: [false], // Parts ASSY
      workType9: [false], // Remove from Unit to Ship
      workType10: [false], // Re-test from Inventory
      workType11: [false], // Test
      workType12: [false], // Board Setup
      
      // Assignment and priority
      assignedTo: ['', Validators.required], // Required like legacy
      dueDate: [today.toISOString().split('T')[0], Validators.required], // Required like legacy
      
      // Descriptions and notes
      description: [''],
      
      // Board setup section (Job Type 7 only)
      boardSetup: ['0'], // Default to Please Select
      
      // Component work section (default job types)
      compWorkDone1: [false], // Cleaned
      compWorkDone2: [false], // Refurbished
      compWorkDone3: [false], // Parts Replaced
      compWorkDone4: [false], // Repaired
      compWorkDone5: [false], // Inspected for Damage
      compWorkDone6: [false], // Not Reparable
      partRepairStatus: ['0'], // Please Select as default
      
      // Testing work section  
      testWorkDone1: [false], // Testing In Unit
      testWorkDone2: [false], // Load Tested
      testWorkDone3: [false], // No Unit To Test
      testWorkStatus: ['0'], // Please Select as default
      
      // Assembly work section (Job Types 1,2,4 only)
      completedBy: [''], // Dropdown for completed by
      assyWorkDone1: [false], // Cleaned = 1
      assyWorkDone2: [false], // Parts Replaced = 2
      assyWorkDone3: [false], // Inspected For Damage = 4 (non-contiguous!)
      assyWorkDone4: [false], // Refurbished = 5
      assyWorkDone5: [false], // Repaired = 6
      assyWorkDone6: [false], // Not Repairable = 7
      assyProcFollowed1: [false], // Yes = 1
      assyProcFollowed2: [false], // No = 2
      assyProcFollowed3: [false], // NA = 3
      assyWorkStatus: ['0'],
      reviewedBy: [''], // Disabled by default
      isPassed: [{ value: false, disabled: true }], // Disabled by default
      
      // QC work section
      qcWorkDone1: [false], // Cleaned = 1
      qcWorkDone2: [false], // Torqued = 2
      qcWorkDone3: [false], // Inspected = 3
      qcProcFollowed1: [false], // Yes = 1
      qcProcFollowed2: [false], // No = 2
      qcProcFollowed3: [false], // NA = 3
      qcApproved1: [false], // Pass = 1
      qcApproved2: [false], // Fail = 2
      qcApproved3: [false], // NA = 3
      qcWorkStatus: ['0'],
      // qcApprovedBy: [''], // Disabled by default - COMMENTED OUT
      // qcPassed: [{ value: false, disabled: true }], // Disabled by default - COMMENTED OUT
      
      // Resolution notes
      resolveNotes: [''],
      
      // Status flags for Final Approve functionality
      approved: [false],
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
          this.editForm.get('submittedDate')?.setValue('');
        }
      });
  }
  
  private loadEmployeeData(): void {
    this.isLoadingEmployees = true;
    this.isLoadingCreatedByEmployees = true;
    
    // Load employees from both P and T departments for Created By dropdown
    const ptRequest: EmployeeRequest = { department: 'P' };
    const tRequest: EmployeeRequest = { department: 'T' };
    
    forkJoin({
      ptEmployees: this.reportService.getEmployeeNamesByDeptPost(ptRequest),
      tEmployees: this.reportService.getEmployeeNamesByDeptPost(tRequest)
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
    if (this.rowIndex <= 0) {
      this.prepareNewEntry();
      return;
    }
    
    this.isLoading = true;
    const request: PartsTestRequest = {
      rowIndex: this.rowIndex,
      source: 'PartsTest'
    };
    
    this.reportService.getPartsTestList(request).pipe(
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
            
            // Only populate form if employees are already loaded, otherwise wait for re-population
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
    
    // Find matching employee by case-insensitive name or ID comparison
    // Normalize by replacing periods with spaces for name matching
    const normalizedCreatedBy = createdByValue.toLowerCase().replace(/\./g, ' ');
    
    let matchingEmployee = this.ptEmployees.find(emp => {
      const normalizedEmpName = emp.empName.toLowerCase();
      const normalizedEmpID = emp.empID.toLowerCase();
      const normalizedWindowsID = (emp.windowsID || '').toLowerCase();
      
      return normalizedEmpName === normalizedCreatedBy
        || normalizedEmpID === normalizedCreatedBy
        || normalizedWindowsID === normalizedCreatedBy;
    });

    const resolvedCreatedBy = matchingEmployee?.windowsID || createdByValue;
    
    // Find matching assigned employee by case-insensitive name or ID comparison
    const assignedToValue = row.AssignedTo || row.assignedTo || '';
    const normalizedAssignedTo = assignedToValue.toLowerCase().replace(/\./g, ' ');
    
    let matchingAssignedEmployee = this.tcEmployees.find(emp => {
      const normalizedEmpName = emp.empName.toLowerCase();
      const normalizedEmpID = emp.empID.toLowerCase();
      
      return normalizedEmpName === normalizedAssignedTo || normalizedEmpID === normalizedAssignedTo;
    });

    const resolvedAssignedTo = matchingAssignedEmployee?.empName || assignedToValue;
    
    // Prepare job number and submitted date variables
    const jobNumber = row.CallNbr || row.callNbr || '';
    const submittedDate = row.SubmittedOn || row.submittedOn || row.SubmittedDate || row.submittedDate || '';
    
    // Populate basic information
    this.editForm.patchValue({
      jobFrom: row.JobFrom || row.jobFrom || '1',
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
      
      // Emergency flag (matching legacy chkEmergency)
      emergency: (row.Priority || row.priority || '').toString().trim() === 'Urgent',
      
      assignedTo: resolvedAssignedTo,
      dueDate: this.formatDateForInput(row.DueDate || row.dueDate),
      description: row.Description || row.description || '',
      
      // Work stages
      boardSetup: row.BoardSetupStatus || row.boardSetupStatus || '0',
      partRepairStatus: row.CompWorkStatus || row.compWorkStatus || '0', 
      testWorkStatus: row.TestWorkStatus || row.testWorkStatus || '0',
      assyWorkStatus: row.AssyWorkStatus || row.assyWorkStatus || '0',
      qcWorkStatus: row.QCWorkStatus || row.qcWorkStatus || '0',
      
      // Employee assignments
      completedBy: row.CompletedBy || row.completedBy || '',
      reviewedBy: row.ReviewedBy || row.reviewedBy || '',
      isPassed: this.convertToBoolean(row.IsPassed || row.isPassed),
      // qcApprovedBy: row.QCApprovedBy || row.qcApprovedBy || '', // COMMENTED OUT
      // qcPassed: this.convertToBoolean(row.QCPassed || row.qcPassed), // COMMENTED OUT
      
      // Resolution notes
      resolveNotes: row.ResolveNotes || row.resolveNotes || '',
      
      // Archive and approval status
      approved: this.convertToBoolean(row.Approved || row.approved),
      archive: this.convertToBoolean(row.Archive || row.archive),
      finalApproval: this.convertToBoolean(row.FinalApproval || row.finalApproval)
    });
    
    // Populate work type checkboxes from comma-separated string
    this.populateWorkTypeCheckboxes(row.WorkType || row.workType || '');
    
    // Populate work stage checkboxes
    this.populateWorkStageCheckboxes(row);
    this.applyJobTypeVisibility(this.editForm.get('jobFrom')?.value || '1');
    
    // Apply workflow rules after data population
    this.applyWorkflowRules();
    
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
    
    // QC work done checkboxes (1-3, contiguous)
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
    
    // QC approved (1-3, as individual checkboxes)
    const qcApproved = (row.QCApproved || row.qcApproved || '')
      .split(',')
      .map((t: string) => t.trim())
      .filter((t: string) => t);
    this.populateCheckboxGroup('qcApproved', qcApproved, ['1', '2', '3']);
  }
  
  private populateCheckboxGroup(prefix: string, selectedValues: string[], availableValues: string[]): void {
    availableValues.forEach((value, index) => {
      const controlName = `${prefix}${index + 1}`;
      const isSelected = selectedValues.includes(value);
      this.editForm.get(controlName)?.setValue(isSelected);
    });
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
    const username = this.authService.currentUserValue?.userName || 'System';
    
    // Created By uses WindowsID in legacy; Assigned To uses EmpName
    const createdByEmployee = this.ptEmployees.find(emp => emp.windowsID === formValue.createdBy);
    
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
      priority: formValue.priority || 'M',
      assignedTo: formValue.assignedTo || '',
      dueDate: new Date(formValue.dueDate),
      KVA: formValue.kva || '',  // ← Fixed case: kva → KVA
      Voltage: formValue.voltage || '',  // ← Fixed case: voltage → Voltage
      problemNotes: formValue.problemNotes || '',
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
      qcWorkDone: this.getQcWorkDoneValue(),
      qcProcFollowed: this.getQcProcFollowedValue(),
      qcApproved: this.getQcApprovedValue(),
      qcWorkStatus: formValue.qcWorkStatus || '0',
      
      // Backend audit fields (matching stored procedure exactly)
      CreatedBy: createdByEmployee?.windowsID || formValue.createdBy || username,
      Approved: formValue.approved || false,
      LastModifiedBy: username
      
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
      problemNotes: 'Deficiency Notes'
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
    this.applyJobTypeVisibility(jobType);
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
      // const qcApprovedBy = formValue.qcApprovedBy; // COMMENTED OUT
      
      if (qcStatus !== '1') {
        this.toastr.error('Quality Status must be Completed before marking Passed.', 'Validation');
        // this.editForm.get('qcPassed')?.setValue(false); // COMMENTED OUT
        return false;
      }
      
      // if (!qcApprovedBy || qcApprovedBy === 'PS' || qcApprovedBy === '0' || qcApprovedBy === '') {
      //   this.toastr.error('Please select Approved By before marking Passed.', 'Validation');
      //   this.editForm.get('qcPassed')?.setValue(false);
      //   return false;
      // } // COMMENTED OUT
    }
    
    return true;
  }

  onApprovedChange(): void {
    const approved = this.editForm.get('approved')?.value;
    if (!approved) {
      return;
    }

    const jobType = this.getJobTypeValue();
    const boardSetup = this.editForm.get('boardSetup')?.value;
    const testingWork = this.editForm.get('testWorkStatus')?.value;
    const assyWork = this.editForm.get('assyWorkStatus')?.value;
    const qcStatus = this.editForm.get('qcWorkStatus')?.value;
    const completedBy = this.editForm.get('completedBy')?.value;
    const reviewedBy = this.editForm.get('reviewedBy')?.value;

    if (jobType === '7') {
      if (boardSetup !== '1') {
        this.toastr.error('Board setup must be Completed before approval', 'Validation');
        this.editForm.get('approved')?.setValue(false);
      }
      return;
    }

    if (testingWork !== '1' || assyWork !== '1' || qcStatus !== '1' || !completedBy || !reviewedBy) {
      this.toastr.error('You cannot approve this because the status is not completed', 'Validation');
      this.editForm.get('approved')?.setValue(false);
    }
  }

  private applyJobTypeVisibility(jobType: string): void {
    const normalizedJobType = String(jobType || '').trim();
    
    // Hide all sections first (matching legacy $('#brdSetup,#divGrp1,#divGrp3').hide();)
    this.showBoardSetup = false;
    this.showComponentWork = false;
    this.showAssemblyQC = false;
    
    // Show appropriate section based on job type (matching legacy exactly)
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
    const assyWorkStatus = this.editForm.get('assyWorkStatus')?.value;
    const qcWorkStatus = this.editForm.get('qcWorkStatus')?.value;
    
    const assemblyDone = assyWorkStatus === '1'; // Completed
    const qcDone = qcWorkStatus === '1'; // Completed

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

    // QC-driven controls (matching legacy exactly) - COMMENTED OUT
    // const qcApprovedByControl = this.editForm.get('qcApprovedBy');
    // const qcPassedControl = this.editForm.get('qcPassed');
    
    // if (qcDone) {
    //   qcApprovedByControl?.enable();
    //   qcPassedControl?.enable();
    // } else {
    //   qcApprovedByControl?.disable();
    //   qcApprovedByControl?.setValue('');
    //   qcPassedControl?.disable();
    //   qcPassedControl?.setValue(false);
    // }
  }

  // Comprehensive final approval validation matching legacy exactly
  private validateFinalApproval(): boolean {
    const formValue = this.editForm.value;
    
    // Assembly validation (matching legacy validateFinalApproval)
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
    
    // if (!formValue.qcApprovedBy || formValue.qcApprovedBy === 'PS' || formValue.qcApprovedBy === '0') {
    //   this.toastr.error('Approved By must be selected for Final Approval.', 'Validation');
    //   return false;
    // }
    
    // if (!formValue.qcPassed) {
    //   this.toastr.error('Quality must be Passed before Final Approval.', 'Validation');
    //   return false;
    // }
    
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
    // This would trigger CSS class changes in the template
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
      next: (success) => {
        if (success) {
          this.toastr.success('Final Approval Successful', 'Success');
          this.editForm.get('finalApproval')?.setValue(true);
          this.editForm.get('archive')?.setValue(true);
          this.disableAllControls();
        } else {
          this.toastr.error('Failed to archive record', 'Error');
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
        this.jobValidationMessage = '❌ Error validating job number';
        this.isValidatingJob = false;
      }
    });
  }
  loadSubmittedDateForJob(jobNo: string): void {
    if (!jobNo || jobNo.trim().length === 0) {
      this.editForm.get('submittedDate')?.setValue('');
      return;
    }

    this.reportService.getSubmittedDate(jobNo).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: SubmittedDateResponse) => {
        if (response.success) {
          this.editForm.get('submittedDate')?.setValue(response.submittedDate);
        } else {
          this.editForm.get('submittedDate')?.setValue('NA');
        }
      },
      error: (error) => {
        console.error('Error loading submitted date:', error);
        this.editForm.get('submittedDate')?.setValue('NA');
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

  private archiveRecord(rowIndex: number): Observable<boolean> {
    return this.reportService.archivePartsTestRecord(rowIndex).pipe(
      map(response => response.success),
      catchError(error => {
        console.error('Archive error:', error);
        return of(false);
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
