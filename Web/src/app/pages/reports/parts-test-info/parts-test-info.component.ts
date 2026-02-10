import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ToastrService } from 'ngx-toastr';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

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
  PartsTestRequest
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
  showComponentWork: boolean = true; // Show component work section
  showAssemblyQC: boolean = true; // Show assembly & QC section (hidden for retests)
  
  // Priority options matching legacy system
  priorityOptions = [
    { value: 'H', label: 'High' },
    { value: 'M', label: 'Medium' },
    { value: 'L', label: 'Low' }
  ];
  
  // Board setup status options
  boardSetupOptions = [
    { value: 'C', label: 'Complete' },
    { value: 'P', label: 'Pending' },
    { value: 'N', label: 'Not Required' }
  ];
  
  // Work status options for various stages
  workStatusOptions = [
    { value: 'C', label: 'Complete' },
    { value: 'P', label: 'Pending' },
    { value: 'N', label: 'Not Started' }
  ];
  
  // Yes/No options for procedure following and approvals
  yesNoOptions = [
    { value: 'Y', label: 'Yes' },
    { value: 'N', label: 'No' }
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
      jobNumber: ['', [Validators.maxLength(11)]],
      siteID: [''],
      make: ['', [Validators.maxLength(21)]],
      model: ['', [Validators.maxLength(21)]],
      kva: [''],
      voltage: [''],
      
      // Part information
      manufPartNo: ['', Validators.required],
      dcgPartNo: ['', Validators.required],  
      serialNo: [''],
      quantity: [1, [Validators.required, Validators.min(1), Validators.max(999)]],
      
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
      priority: ['M'], // Default to Medium
      createdBy: ['', Validators.required],
      assignedTo: ['', Validators.required],
      dueDate: [today.toISOString().split('T')[0], Validators.required], // Today's date in YYYY-MM-DD format
      submittedDate: [''], // Optional submitted date
      approved: [false],
      
      // Descriptions and notes
      description: [''],
      problemNotes: ['', Validators.required],
      resolveNotes: [''],
      
      // Component work section
      boardSetup: ['P'], // Default to Pending
      compWorkDone1: [false], // Component work checkboxes
      compWorkDone2: [false],
      compWorkDone3: [false],
      compWorkDone4: [false],
      compWorkDone5: [false],
      compWorkDone6: [false],
      partRepairStatus: [''],
      
      // Testing work section  
      testWorkDone1: [false], // Testing work checkboxes
      testWorkDone2: [false],
      testWorkDone3: [false],
      testWorkDone4: [false],
      testWorkStatus: ['N'], // Default to Not Started
      
      // Assembly work section
      assyWorkDone1: [false], // Assembly work checkboxes
      assyWorkDone2: [false],
      assyWorkDone3: [false],
      assyProcFollowed: ['N'], // Default to No
      assyWorkStatus: ['N'], // Default to Not Started
      
      // QC work section
      qcWorkDone1: [false], // QC work checkboxes
      qcWorkDone2: [false],
      qcWorkDone3: [false],
      qcProcFollowed: ['N'], // Default to No
      qcApproved: ['N'], // Default to No
      qcWorkStatus: ['N'], // Default to Not Started
      
      // Completion information
      completedBy: [''],
      reviewedBy: [''],
      isPassed: [false]
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
            this.showAssemblyQC = false; // Hide Assembly & QC section for retests
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
          this.showAssemblyQC = true; // Show Assembly & QC section for new tests
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
      
      return normalizedEmpName === normalizedCreatedBy || normalizedEmpID === normalizedCreatedBy;
    });
    
    const resolvedCreatedBy = matchingEmployee ? matchingEmployee.empID : createdByValue;
    
    // Find matching assigned employee by case-insensitive name or ID comparison
    const assignedToValue = row.AssignedTo || row.assignedTo || '';
    const normalizedAssignedTo = assignedToValue.toLowerCase().replace(/\./g, ' ');
    
    let matchingAssignedEmployee = this.tcEmployees.find(emp => {
      const normalizedEmpName = emp.empName.toLowerCase();
      const normalizedEmpID = emp.empID.toLowerCase();
      
      return normalizedEmpName === normalizedAssignedTo || normalizedEmpID === normalizedAssignedTo;
    });
    
    const resolvedAssignedTo = matchingAssignedEmployee ? matchingAssignedEmployee.empID : assignedToValue;
    
    // Populate basic information
    this.editForm.patchValue({
      jobFrom: row.JobFrom || row.jobFrom || '1',
      jobNumber: row.CallNbr || row.callNbr || '',
      siteID: row.SiteID || row.siteID || '',
      make: row.Make || row.make || '',
      model: row.Model || row.model || '',
      kva: row.KVA || row.kva || '',
      voltage: row.Voltage || row.voltage || '',
      manufPartNo: manufPartNoValue,
      dcgPartNo: row.DCGPartNo || row.dcgPartNo || '',
      serialNo: row.SerialNo || row.serialNo || '',
      quantity: parseInt(row.Quantity || row.quantity) || 1,
      priority: row.Priority || row.priority || 'M',
      createdBy: resolvedCreatedBy,
      assignedTo: resolvedAssignedTo,
      dueDate: this.formatDateForInput(row.DueDate || row.dueDate),
      submittedDate: this.formatDateForInput(
        row.CreatedOn || row.createdOn || row.SubmittedDate || row.submittedDate
      ),
      approved: this.convertToBoolean(row.Approved || row.approved),
      description: row.Description || row.description || '',
      problemNotes: row.ProblemNotes || row.problemNotes || '', 
      resolveNotes: row.ResolveNotes || row.resolveNotes || '',
      
      // Work stages
      boardSetup: row.BoardSetupStatus || row.boardSetupStatus || 'P',
      testWorkStatus: row.TestWorkStatus || row.testWorkStatus || 'N',
      partRepairStatus: row.CompWorkStatus || row.compWorkStatus || '', 
      assyWorkStatus: row.AssyWorkStatus || row.assyWorkStatus || 'N',
      assyProcFollowed: row.AssyProcFollowed || row.assyProcFollowed || 'N',
      qcWorkStatus: row.QCWorkStatus || row.qcWorkStatus || 'N',
      qcProcFollowed: row.QCProcFollowed || row.qcProcFollowed || 'N',
      qcApproved: row.QCApproved || row.qcApproved || 'N',
      
      completedBy: row.CompletedBy || row.completedBy || '',
      reviewedBy: row.ReviewedBy || row.reviewedBy || '',
      isPassed: this.convertToBoolean(row.IsPassed || row.isPassed)
    });
    
    // Populate work type checkboxes from comma-separated string
    this.populateWorkTypeCheckboxes(row.WorkType || row.workType || '');
    
    // Populate work stage checkboxes
    this.populateWorkStageCheckboxes(row);
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
    // Component work done - check multiple field name variations
    const compWorkDone = (row.CompWorkDone || row.compWorkDone || row.CompWOrkDone || '').split(',').map((t: string) => t.trim()).filter((t: string) => t);
    this.setCheckboxValues('compWorkDone', compWorkDone, 6);
    
    // Test work done
    const testWorkDone = (row.TestWorkDone || row.testWorkDone || '').split(',').map((t: string) => t.trim()).filter((t: string) => t);
    this.setCheckboxValues('testWorkDone', testWorkDone, 4);
    
    // Assembly work done
    const assyWorkDone = (row.AssyWorkDone || row.assyWorkDone || '').split(',').map((t: string) => t.trim()).filter((t: string) => t);
    this.setCheckboxValues('assyWorkDone', assyWorkDone, 3);
    
    // QC work done
    const qcWorkDone = (row.QCWorkDone || row.qcWorkDone || '').split(',').map((t: string) => t.trim()).filter((t: string) => t);
    this.setCheckboxValues('qcWorkDone', qcWorkDone, 3);
  }
  
  private setCheckboxValues(prefix: string, selectedValues: string[], maxCount: number): void {
    for (let i = 1; i <= maxCount; i++) {
      const controlName = `${prefix}${i}`;
      const isSelected = selectedValues.includes(i.toString());
      this.editForm.get(controlName)?.setValue(isSelected);
    }
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
    
    // Convert empID back to empName for backend (backend expects names)
    const createdByEmployee = this.ptEmployees.find(emp => emp.empID === formValue.createdBy);
    const assignedToEmployee = this.tcEmployees.find(emp => emp.empID === formValue.assignedTo);
    
    return {
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
      assignedTo: assignedToEmployee?.empName || formValue.assignedTo || '',
      dueDate: new Date(formValue.dueDate),
      submittedDate: formValue.submittedDate ? new Date(formValue.submittedDate) : undefined,
      kva: formValue.kva || '',
      voltage: formValue.voltage || '',
      problemNotes: formValue.problemNotes || '',
      resolveNotes: formValue.resolveNotes || '',
      rowIndex: this.rowIndex,
      boardStatus: formValue.boardSetup || 'P',
      compWorkDone: this.getSelectedWorkStageItems('compWorkDone', 6),
      compWorkStatus: 'N', // Default value since dropdown was removed
      testWorkDone: this.getSelectedWorkStageItems('testWorkDone', 4),
      testWorkStatus: formValue.testWorkStatus || 'N',
      completedBy: formValue.completedBy || '',
      reviewedBy: formValue.reviewedBy || '',
      isPassed: formValue.isPassed || false,
      assyWorkDone: this.getSelectedWorkStageItems('assyWorkDone', 3),
      assyProcFollowed: formValue.assyProcFollowed || 'N',
      assyWorkStatus: formValue.assyWorkStatus || 'N',
      qcWorkDone: this.getSelectedWorkStageItems('qcWorkDone', 3),
      qcProcFollowed: formValue.qcProcFollowed || 'N',
      qcApproved: formValue.qcApproved || 'N',
      qcWorkStatus: formValue.qcWorkStatus || 'N',
      createdBy: createdByEmployee?.empName || formValue.createdBy || '',
      approved: formValue.approved || false,
      lastModifiedBy: username
    };
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
  
  private getSelectedWorkStageItems(prefix: string, maxCount: number): string {
    const formValue = this.editForm.value;
    const selectedItems: string[] = [];
    
    for (let i = 1; i <= maxCount; i++) {
      if (formValue[`${prefix}${i}`]) {
        selectedItems.push(i.toString());
      }
    }
    
    return selectedItems.join(',');
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
    // Handle any specific logic when job type changes
    // This could include clearing or setting other fields based on job type
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
  
  private handleError(message: string): void {
    this.errorMessage = message;
    this.toastr.error(message, 'Error');
    console.error('PartsTestInfo Error:', message);
  }
  
  // Additional methods referenced in HTML template
  
  openTestProcedure(): void {
    // Open test procedure document - could be a PDF or link
    window.open('/assets/dcg-procedures/test-procedure.pdf', '_blank');
  }
  
  onPassedCheck(): void {
    // Handle passed checkbox change if needed
    const isPassed = this.editForm.get('isPassed')?.value;
    if (isPassed) {
      // Could auto-set some fields when passed is checked
    }
  }
  
  onTextareaInput(event: Event): void {
    // Handle textarea input if auto-resize is needed
    const textarea = event.target as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  }
  
  cancelDelete(): void {
    this.showDeleteConfirm = false;
  }
}
