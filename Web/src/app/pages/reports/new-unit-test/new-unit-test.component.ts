import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit, NgZone, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { NewUnitTestService } from '../../../core/services/new-unit-test.service';
import { UPSTestStatusService } from '../../../core/services/ups-test-status.service';
import { CommonService } from 'src/app/core/services/common.service';
import { AuthService } from 'src/app/modules/auth';
import { ToastrService } from 'ngx-toastr';
import { 
  UPSTestStatusDto, 
  MakeCountDto,
  UPSTestMetadataResponse
} from '../../../core/model/ups-test-status.model';
import {
  NewUniTestResponse,
  NewUniTestApiResponse,
  MoveUnitToStrippingDto,
  MoveUnitToStrippingApiResponse,
  SaveUpdateNewUnitTestDto,
  SaveUpdateUnitTestResponse,
  SaveUpdateNewUnitResultDto,
  SaveUpdateUnitTestResultResponse
} from '../../../core/model/new-unit-test.model';
import { StrippedUnitsStatusDto } from '../../../core/model/stripped-units-status.model';

@Component({
  selector: 'app-new-unit-test',
  templateUrl: './new-unit-test.component.html',
  styleUrls: ['./new-unit-test.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NewUnitTestComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('chartContainer') chartContainer!: ElementRef;

  // Observables and Subscriptions
  private destroy$ = new Subject<void>();
  private formSubscription?: Subscription;
  private routeSubscription?: Subscription;

  // Form and Search
  filterForm!: FormGroup;
  searchTerm: string = '';

  // Data Management
  allData: UPSTestStatusDto[] = [];
  filteredData: UPSTestStatusDto[] = [];
  displayedData: UPSTestStatusDto[] = [];
  makeSummary: { [key: string]: number } = {};
  statusSummary: { [key: string]: number } = {};
  totalRecords: number = 0;
  isFiltered: boolean = false;
  filteredRowIndex: number = 0;

  // UI State
  isLoading = false;
  errorMessage = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50, 100];

  // Sorting
  sortColumn = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  // Cache for performance
  private cachedMakeChartData: {make: string, count: number}[] = [];
  private cachedYAxisTicks: number[] = [];
  private originalData: UPSTestStatusDto[] = [];

  public Math = Math;

  // View modes
  viewMode: 'list' | 'details' = 'list';
  selectedUnit: UPSTestStatusDto | null = null;

  // Move to Stripping functionality
  showMoveConfirmModal = false;
  unitToMove: UPSTestStatusDto | null = null;
  movingUnits: Set<number> = new Set();
  moveResults: { [rowIndex: number]: { success: boolean; message: string } } = {};

  // Edit/Create functionality
  showEditModal = false;
  editForm!: FormGroup;
  editingUnit: UPSTestStatusDto | null = null;
  isCreatingNew = false;
  savingUnit = false;
  isLoadedFromApi = false; // Track if unit was loaded from API

  // Result Update functionality
  showResultModal = false;
  resultForm!: FormGroup;
  updatingResult = false;
  resultUnit: UPSTestStatusDto | null = null;

  // Status options matching backend - New Units Test system
  statusOptions = [
    { value: 'All', label: 'All' },
    { value: 'INP', label: 'In Progress' },
    { value: 'NCR', label: 'Needs Components for Repair' },
    { value: 'MPJ', label: 'Missing Parts from Job' }
  ];
  
  // Priority options
  priorityOptions = [
    { value: 'All', label: 'All' },
    { value: 'High', label: 'High' },
    { value: 'Normal', label: 'Normal' },
    { value: 'Low', label: 'Low' },
    { value: 'At Convenience', label: 'At Convenience' }
  ];

  // Technician options (populated from API)
  technicianOptions: { value: string; label: string }[] = [
    { value: 'All', label: 'All Technicians' }
  ];
  
  // Chart colors - same as stripped parts component
  private chartColors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
  ];

  // Chart options
  public barChartOptions: any = {
    chart: { type: 'bar', height: 350 },
    dataLabels: { enabled: false },
    plotOptions: {},
    xaxis: { categories: [] },
    yaxis: {},
    colors: [],
    tooltip: {},
    grid: {},
    theme: {}
  };
  
  public donutChartOptions: any = {
    series: [],
    chart: { type: 'donut', height: 350 },
    labels: [],
    colors: [],
    legend: {},
    tooltip: {},
    plotOptions: {},
    dataLabels: {},
    responsive: []
  };

  // Make Chart Options - initialized in setupMakeChartOptions()
  public makeBarChartOptions: any = {};

  constructor(
    private formBuilder: FormBuilder,
    private newUnitTestService: NewUnitTestService,
    private upsTestStatusService: UPSTestStatusService,
    private commonService: CommonService,
    private location: Location,
    private router: Router,
    private route: ActivatedRoute,
    private auth: AuthService,
    private toastr: ToastrService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForm();
  }

  // Getter to retrieve current row index from route parameters
  get currentRowIndex(): string | null {
    // Use route snapshot for current value, but this will update when route changes
    return this.route.snapshot.params['rowIndex'] || null;
  }

  // Custom Validators based on legacy validation requirements
  
  // Validator for numeric fields (validates only integer values)
  private numericValidator(control: any) {
    if (!control.value) return null; // Allow empty values
    const isNumeric = /^[0-9]+$/.test(control.value.toString());
    return isNumeric ? null : { numeric: true };
  }

  // Validator for Assigned To field (cannot be "PS" - Please Select)
  private notPSValidator(control: any) {
    if (!control.value) return null; // Required validator will handle empty values
    return control.value === 'PS' ? { notPS: true } : null;
  }

  // Comprehensive validation method for edit form (equivalent to legacy onSaveClick())
  private validateEditForm(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const formValue = this.editForm.value;

    // 1. Make - Cannot be empty or null
    if (!formValue.make || formValue.make.trim() === '') {
      errors.push('Make is required and cannot be empty.');
    }

    // 2. Model - Cannot be empty or null
    if (!formValue.model || formValue.model.trim() === '') {
      errors.push('Model is required and cannot be empty.');
    }

    // 3. Serial No - Cannot be empty or null
    if (!formValue.serialNo || formValue.serialNo.trim() === '') {
      errors.push('Serial No is required and cannot be empty.');
    }

    // 4. Assigned To - Cannot be "PS" (Please Select) or null
    if (!formValue.assignedTo || formValue.assignedTo === 'PS' || formValue.assignedTo.trim() === '') {
      errors.push('Please select a valid technician from Assigned To dropdown.');
    }

    // 5. Due Date - Cannot be empty
    if (!formValue.dueDate || formValue.dueDate === '') {
      errors.push('Due Date is required.');
    }

    // 6. Deficiency Notes - Cannot be empty or null
    if (!formValue.deficiencyNotes || formValue.deficiencyNotes.trim() === '') {
      errors.push('Deficiency Notes are required and cannot be empty.');
    }

    // 13. KVA Field - Must be numeric if provided
    if (formValue.kva && formValue.kva.trim() !== '') {
      if (!/^[0-9]+$/.test(formValue.kva)) {
        errors.push('KVA must be a numeric value.');
      }
    }

    // Numeric validation for cost fields
    if (formValue.unitCost && formValue.unitCost.trim() !== '') {
      const cleanCost = formValue.unitCost.replace(/[$,]/g, '');
      if (!/^[0-9.]+$/.test(cleanCost)) {
        errors.push('Unit Cost must be a valid number.');
      }
    }

    if (formValue.shipCost && formValue.shipCost.trim() !== '') {
      const cleanCost = formValue.shipCost.replace(/[$,]/g, '');
      if (!/^[0-9.]+$/.test(cleanCost)) {
        errors.push('Ship Cost must be a valid number.');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // Validation method for result form (equivalent to legacy onSaveInspClick())
  private validateResultForm(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const resultValue = this.resultForm.value;
    const currentStatus = resultValue.currentStatus || resultValue.Status;

    // 7. & 9. Inspection Notes - Required only when Status = "COM" (Completed)
    if (currentStatus === 'COM') {
      if (!resultValue.inspectionNotes || resultValue.inspectionNotes.trim() === '') {
        errors.push('Inspection Notes are required when status is Completed.');
      }

      // 8. Test Engineer - Required when Status = "COM"
      if (!resultValue.testEngineer || resultValue.testEngineer.trim() === '') {
        errors.push('Test Engineer is required when status is Completed.');
      }
    }

    return { valid: errors.length === 0, errors };
  }

  // Workflow validation methods
  
  // 10. Approved Checkbox - Can only be checked when Status = "COM"
  private validateApprovedCheckbox(): boolean {
    const resultValue = this.resultForm.value;
    const editValue = this.editForm.value;
    const currentStatus = resultValue.currentStatus || resultValue.Status;
    
    if (editValue.approved && currentStatus !== 'COM') {
      this.toastr.warning('You cannot approve this because the testing status of this Unit is not completed.', 'Validation Warning');
      // Uncheck the approved checkbox
      this.editForm.patchValue({ approved: false });
      return false;
    }
    return true;
  }

  // 11. Move to Archive - Can only be checked when unit is approved
  private validateMoveToArchive(): boolean {
    const editValue = this.editForm.value;
    
    if (editValue.moveToArchive && !editValue.approved) {
      this.toastr.warning('You cannot move to archive this because the unit is not approved by technical director.', 'Validation Warning');
      // Uncheck the move to archive checkbox
      this.editForm.patchValue({ moveToArchive: false });
      return false;
    }
    return true;
  }

  // 12. Move to Strip - Can only be checked when unit is approved
  private validateMoveToStrip(): boolean {
    const editValue = this.editForm.value;
    
    if (editValue.moveToStrip && !editValue.approved) {
      this.toastr.warning('You cannot move to strip this because the unit is not approved by technical director.', 'Validation Warning');
      // Uncheck the move to strip checkbox
      this.editForm.patchValue({ moveToStrip: false });
      return false;
    }
    return true;
  }

  // Method to save unit data to localStorage for persistence
  private saveUnitDataToStorage(unitData: UPSTestStatusDto): void {
    try {
      localStorage.setItem('newUnitTest_unitData', JSON.stringify(unitData));
      localStorage.setItem('newUnitTest_timestamp', Date.now().toString());
    } catch (error) {
      console.warn('Failed to save unit data to localStorage:', error);
    }
  }

  // Method to load unit data from localStorage
  private loadUnitDataFromStorage(): UPSTestStatusDto | null {
    try {
      const unitDataStr = localStorage.getItem('newUnitTest_unitData');
      const timestampStr = localStorage.getItem('newUnitTest_timestamp');
      
      if (!unitDataStr || !timestampStr) return null;
      
      // Check if data is less than 1 hour old to avoid stale data
      const timestamp = parseInt(timestampStr);
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - timestamp > oneHour) {
        this.clearStoredUnitData();
        return null;
      }
      
      return JSON.parse(unitDataStr);
    } catch (error) {
      console.warn('Failed to load unit data from localStorage:', error);
      return null;
    }
  }

  // Method to clear stored unit data
  private clearStoredUnitData(): void {
    try {
      localStorage.removeItem('newUnitTest_unitData');
      localStorage.removeItem('newUnitTest_timestamp');
    } catch (error) {
      console.warn('Failed to clear unit data from localStorage:', error);
    }
  }

  ngOnInit(): void {
    // Setup chart options first
    this.initializeCharts();
    
    this.setupFormSubscriptions();
    this.loadMetadata();
    this.loadNewUnitTestData();
    
    // Always check route parameters first (for direct URL access or refresh)
    this.handleRouteParameters();
    
    // Make debug method available in browser console
    (window as any).debugNewUnitChart = () => this.debugChartData();
  }

  ngAfterViewInit(): void {
    // Additional initialization after view is ready
    setTimeout(() => {
      this.updateCharts();
    }, 100);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    if (this.formSubscription) {
      this.formSubscription.unsubscribe();
    }
    
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    
    // Clear stored unit data when component is destroyed
    // This ensures data doesn't persist across different unit selections
    this.clearStoredUnitData();
  }

  // Method to clear all form data and start fresh
  // Method to update existing unit information
  public onUpdateUnit(): void {
    // Perform comprehensive validation
    const editValidation = this.validateEditForm();
    const resultValidation = this.validateResultForm();
    
    // Check all validations
    const allErrors = [...editValidation.errors, ...resultValidation.errors];
    
    if (!editValidation.valid || !resultValidation.valid) {
      // Display all validation errors
      allErrors.forEach(error => this.toastr.error(error, 'Validation Error'));
      return;
    }

    // Validate workflow constraints
    if (!this.validateApprovedCheckbox() || !this.validateMoveToArchive() || !this.validateMoveToStrip()) {
      return;
    }

    if (!this.selectedUnit) {
      this.toastr.error('No unit selected for update');
      return;
    }

    this.savingUnit = true;
    const formData = this.editForm.value;

    // Use existing save method for now - can be extended later
    this.newUnitTestService.saveUpdateUnitTest(formData)
      .subscribe({
        next: (response: any) => {
          this.savingUnit = false;
          if (response.success) {
            this.toastr.success('Unit updated successfully!');
            // Update local data
            if (this.selectedUnit) {
              const updatedUnit = { ...this.selectedUnit, ...formData };
              this.selectedUnit = updatedUnit;
              this.saveUnitDataToStorage(updatedUnit);
            }
            this.cdr.detectChanges();
          } else {
            this.toastr.error(response.message || 'Failed to update unit');
          }
        },
        error: (error: any) => {
          this.savingUnit = false;
          this.toastr.error('Error updating unit: ' + error.message);
        }
      });
  }

  // Method to delete existing unit
  public onDeleteUnit(): void {
    if (!this.selectedUnit) {
      this.toastr.error('No unit selected for deletion');
      return;
    }

    if (!confirm('Are you sure you want to delete this unit? This action cannot be undone.')) {
      return;
    }

    // For now, just clear the data (can be extended with actual delete API later)
    this.toastr.success('Unit cleared successfully!');
    this.clearAllData();
  }

  // Method to update test results for existing unit
  public onUpdateResults(): void {
    // Perform comprehensive validation for result form
    const resultValidation = this.validateResultForm();
    
    if (!resultValidation.valid) {
      // Display all validation errors
      resultValidation.errors.forEach(error => this.toastr.error(error, 'Validation Error'));
      return;
    }

    if (!this.selectedUnit) {
      this.toastr.error('No unit selected for update');
      return;
    }

    this.updatingResult = true;
    const formData = this.resultForm.value;

    // Use existing save method for now - can be extended later
    this.newUnitTestService.saveUpdateUnitTestResult(formData)
      .subscribe({
        next: (response: any) => {
          this.updatingResult = false;
          if (response.success) {
            this.toastr.success('Test results updated successfully!');
            // Update local data
            if (this.selectedUnit) {
              const updatedUnit = { ...this.selectedUnit, ...formData };
              this.selectedUnit = updatedUnit;
              this.saveUnitDataToStorage(updatedUnit);
            }
            this.cdr.detectChanges();
          } else {
            this.toastr.error(response.message || 'Failed to update test results');
          }
        },
        error: (error: any) => {
          this.updatingResult = false;
          this.toastr.error('Error updating test results: ' + error.message);
        }
      });
  }

  public clearAllData(): void {
    // Clear stored data
    this.clearStoredUnitData();
    
    // Reset forms to initial state
    this.initializeForm();
    
    // Clear any loaded unit data
    this.selectedUnit = null;
    
    // Force change detection
    this.cdr.detectChanges();
    
    console.log('✅ All data cleared - starting fresh');
  }

  // Real-time validation methods for checkbox interactions

  // Handle approved checkbox change
  public onApprovedChange(): void {
    this.validateApprovedCheckbox();
  }

  // Handle move to archive checkbox change  
  public onMoveToArchiveChange(): void {
    this.validateMoveToArchive();
  }

  // Handle move to strip checkbox change
  public onMoveToStripChange(): void {
    this.validateMoveToStrip();
  }

  // Helper method to check if form field has error
  public hasFieldError(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  // Helper method to get field error message
  public getFieldErrorMessage(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return `${fieldName} is required.`;
    if (field.errors['maxlength']) return `${fieldName} exceeds maximum length.`;
    if (field.errors['numeric']) return `${fieldName} must be a numeric value.`;
    if (field.errors['notPS']) return `Please select a valid option.`;
    
    return 'Invalid value.';
  }

  private initializeForm(): void {
    this.filterForm = this.formBuilder.group({
      assignedTo: ['All'],
      status: ['All'],
      priority: ['All'],
      rowIndex: [0]
    });

    // Initialize edit form with UPS Test Status fields
    this.editForm = this.formBuilder.group({
      rowIndex: [0],
      make: ['', [Validators.required, Validators.maxLength(50)]], // Required - Cannot be empty or null
      model: ['', [Validators.required, Validators.maxLength(50)]], // Required - Cannot be empty or null
      kva: ['', [Validators.maxLength(3), this.numericValidator]], // Limited to 3 characters maximum, must be numeric
      voltage: ['', [Validators.maxLength(10)]],
      serialNo: ['', [Validators.required, Validators.maxLength(50)]], // Required - Cannot be empty or null
      poNumber: ['', [Validators.maxLength(50)]],
      unitCost: ['', [Validators.maxLength(20), this.numericValidator]],
      shippingPO: ['', [Validators.maxLength(50)]],
      shipCost: ['', [Validators.maxLength(20), this.numericValidator]],
      priority: ['Normal', [Validators.maxLength(15)]],
      assignedTo: ['', [Validators.required, this.notPSValidator, Validators.maxLength(50)]], // Required - Cannot be "PS" or null
      dueDate: ['', [Validators.required]], // Required - Cannot be empty
      deficiencyNotes: ['', [Validators.required, Validators.maxLength(1000)]], // Required - Cannot be empty or null
      approved: [false],
      moveToArchive: [false],
      moveToStrip: [false]
    });

    // Initialize result update form with test result fields
    this.resultForm = this.formBuilder.group({
      RowIndex: [0, [Validators.required, Validators.min(1)]],
      Status: ['', [Validators.required, Validators.maxLength(5)]],
      resolveNotes: ['', [Validators.maxLength(2000)]], // Will be required conditionally when Status = "COM"
      testProcedures: ['', [Validators.maxLength(1)]],
      TestedBy: ['', [Validators.maxLength(50)]], // Will be required conditionally when Status = "COM"
      followedProcedure: ['', [Validators.maxLength(20)]],
      currentStatus: ['', [Validators.maxLength(20)]],
      testEngineer: ['', [Validators.maxLength(50)]], // Will be required conditionally when Status = "COM"
      inspectionNotes: ['', [Validators.maxLength(2000)]] // Will be required conditionally when Status = "COM"
    });
  }

  private initializeCharts(): void {
    this.setupMakeChartOptions();
    this.setupBarChartOptions();
    this.setupDonutChartOptions();
  }

  private setupFormSubscriptions(): void {
    // Watch for form changes
    this.formSubscription = this.filterForm.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.applyFilters();
      });
  }

  private setupMakeChartOptions(): void {
    console.log('🔧 Setting up make chart options...');
    
    this.makeBarChartOptions = {
      series: [{
        name: 'Units Count',
        data: []
      }],
      chart: {
        type: 'bar',
        height: 350,
        toolbar: {
          show: false
        },
        background: 'transparent'
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          endingShape: 'rounded',
          borderRadius: 4,
          dataLabels: {
            position: 'top'
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function (val: any) {
          return val;
        },
        offsetY: -20,
        style: {
          fontSize: '12px',
          fontFamily: 'inherit',
          colors: ['#304758']
        }
      },
      xaxis: {
        categories: [],
        labels: {
          rotate: -45,
          rotateAlways: false,
          hideOverlappingLabels: true,
          showDuplicates: false,
          trim: false,
          minHeight: undefined,
          maxHeight: 120,
          style: {
            colors: [],
            fontSize: '11px',
            fontFamily: 'inherit',
            fontWeight: 400,
            cssClass: 'apexcharts-xaxis-label'
          },
          offsetX: 0,
          offsetY: 0,
          format: undefined
        },
        axisBorder: {
          show: false
        },
        axisTicks: {
          show: false
        }
      },
      yaxis: {
        title: {
          text: 'Number of Units',
          style: {
            color: '#304758',
            fontSize: '12px',
            fontFamily: 'inherit',
            fontWeight: 400
          }
        },
        labels: {
          style: {
            colors: '#304758',
            fontSize: '11px',
            fontFamily: 'inherit'
          },
          formatter: function (val: any) {
            return Math.floor(val);
          }
        }
      },
      colors: this.chartColors,
      tooltip: {
        shared: true,
        intersect: false,
        style: {
          fontSize: '12px',
          fontFamily: 'inherit'
        },
        onDatasetHover: {
          highlightDataSeries: false
        },
        x: {
          show: true,
          format: 'dd MMM',
          formatter: undefined
        },
        y: {
          formatter: function (val: any) {
            return val + ' units';
          },
          title: {
            formatter: (seriesName: any) => seriesName + ': '
          }
        },
        z: {
          formatter: undefined,
          title: 'Size: '
        },
        marker: {
          show: true
        }
      },
      grid: {
        show: true,
        borderColor: '#e7e7e7',
        row: {
          colors: ['#f3f3f3', 'transparent'],
          opacity: 0.5
        }
      },
      title: {
        text: 'New Unit Test Count by Manufacturer',
        align: 'center',
        style: {
          fontSize: '16px',
          fontWeight: 'bold',
          fontFamily: 'inherit',
          color: '#263238'
        }
      },
      legend: {
        show: false
      },
      theme: {}
    };
    
    console.log('✅ Chart options setup complete!');
  }

  private setupBarChartOptions(): void {
    // Similar to UPS test status component
    this.barChartOptions = {
      chart: { type: 'bar', height: 350 },
      dataLabels: { enabled: false },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%'
        }
      },
      xaxis: { categories: [] },
      yaxis: {},
      colors: this.chartColors,
      tooltip: {},
      grid: {},
      theme: {}
    };
  }

  private setupDonutChartOptions(): void {
    this.donutChartOptions = {
      series: [],
      chart: { type: 'donut', height: 350 },
      labels: [],
      colors: this.chartColors,
      legend: {
        position: 'bottom'
      },
      tooltip: {},
      plotOptions: {
        pie: {
          donut: {
            size: '65%'
          }
        }
      },
      dataLabels: {
        enabled: true
      },
      responsive: []
    };
  }

  private loadMetadata(): void {
    this.upsTestStatusService.getUPSTestMetadata(false).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response: UPSTestMetadataResponse) => {
        console.log('Technician metadata loaded:', response);
        if (response.success && response.technicians) {
          // Update technician dropdown options (exclude 'All' for edit form and filter out 'PS')
          this.technicianOptions = [
            ...response.technicians
              .filter(tech => tech.toUpperCase() !== 'PS') // Remove PS from the list
              .map(tech => ({ value: tech, label: tech }))
          ];
          
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        // Continue with default options if metadata loading fails
      }
    });
  }

  private handleRouteParameters(): void {
    // Handle route parameters (rowIndex from URL path) - this works for both navigation and direct access/refresh
    this.route.params.subscribe(routeParams => {
      if (routeParams['rowIndex']) {
        const rowIndex = parseInt(routeParams['rowIndex']);
        console.log('🔍 Route parameter detected - Row Index:', rowIndex);
        
        // Check query parameters for additional data
        this.route.queryParams.subscribe(queryParams => {
          const archive = queryParams['archive'] === 'true';
          const loadFromApi = queryParams['loadFromApi'] === 'true';
          
          // Always load fresh data from API when route parameter is present
          // This ensures database changes are reflected on page refresh or direct URL access
          console.log('🔄 Loading fresh unit data from API for rowIndex:', rowIndex);
          this.loadUnitFromApi(rowIndex, archive);
          
          // Clear query parameters after processing to keep URL clean, but keep the rowIndex in the path
          if (loadFromApi) {
            setTimeout(() => {
              this.router.navigate([], {
                relativeTo: this.route,
                queryParams: {},
                replaceUrl: true
              });
            }, 100);
          }
        });
      } else {
        // No route parameter - check for stored data or legacy query parameters
        const storedUnitData = this.loadUnitDataFromStorage();
        if (storedUnitData) {
          console.log('🔄 Loading stored unit data (no route param)');
          this.populateFormFromUnitData(storedUnitData);
        } else {
          // Handle legacy query parameters for backward compatibility
          this.handleLegacyQueryParameters();
        }
      }
    });
  }

  private handleLegacyQueryParameters(): void {
    this.routeSubscription = this.route.queryParams.subscribe(params => {
      if (Object.keys(params).length > 0) {
        
        // If we have loadFromApi flag and rowIndex, fetch data from API
        if (params['loadFromApi'] === 'true' && params['rowIndex']) {
          const rowIndex = parseInt(params['rowIndex']);
          const archive = params['archive'] === 'true';
          this.loadUnitFromApi(rowIndex, archive);
        }
        // If we have unit data from UPS Test Status (fallback), populate the edit form and show modal
        else if (params['rowIndex'] || params['make']) {
          // Populate the form first with the data from query params
          this.populateFormFromQueryParams(params);
          
          // Then show the modal without resetting the form
          this.isCreatingNew = true;
          this.editingUnit = null;
          this.showEditModal = true;
          
          // Clear query parameters after processing to keep URL clean
          setTimeout(() => {
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: {},
              replaceUrl: true
            });
          }, 100);
        }
      }
    });
  }

  private loadUnitFromApi(rowIndex: number, archive: boolean = false): void {
    console.log('🔄 Loading unit data from API - rowIndex:', rowIndex, 'archive:', archive);
    
    this.newUnitTestService.getNewUniTestByRowIndex(rowIndex, archive).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          
          // Show the modal first without resetting the form
          this.isCreatingNew = true;
          this.editingUnit = null;
          this.showEditModal = true;
          this.isLoadedFromApi = true; // Mark as loaded from API
          
          // If unit has test result data, also prepare result form
          if (response.data.testedBy || response.data.resolveNotes || response.data.testProcedures) {
            this.resultUnit = response.data;
          }
          
          // Wait for modal to be displayed then populate the form
          setTimeout(() => {
            this.populateFormFromUnitData(response.data);
          }, 150);
          
          // Clear query parameters after processing
          setTimeout(() => {
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: {},
              replaceUrl: true
            });
          }, 300);
          
        } else {
          // If not found and we haven't tried archive yet, try with archive=true
          if (!archive) {
            console.log('🔄 Unit not found in active data, trying archived data...');
            this.loadUnitFromApi(rowIndex, true);
          } else {
            this.toastr.error(`Unit with Row Index ${rowIndex} not found`, 'Unit Not Found');
          }
        }
      },
      error: (error) => {
        console.error('API Error:', error);
        // If not found and we haven't tried archive yet, try with archive=true
        if (!archive) {
          console.log('🔄 API error with active data, trying archived data...');
          this.loadUnitFromApi(rowIndex, true);
        } else {
          this.toastr.error('Failed to load unit data from API', 'Error');
        }
      }
    });
  }

  private populateFormFromUnitData(unitData: UPSTestStatusDto): void {
    console.log('🔍 FULL API RESPONSE DATA:', JSON.stringify(unitData, null, 2));
    console.log('🔍 Available API fields:', Object.keys(unitData));
    
    // Save unit data to localStorage for persistence
    this.saveUnitDataToStorage(unitData);
    
    // Set selectedUnit so buttons will show
    this.selectedUnit = unitData;
    
    // Helper function to clean currency values for number inputs
    const cleanCurrencyValue = (value: string | undefined): string => {
      if (!value) return '';
      // Remove $ sign, commas, and any other non-numeric characters except decimal point
      return value.replace(/[$,]/g, '').trim();
    };

    // Helper function to map assigned to values
    const mapAssignedToValue = (value: string | undefined): string => {
      if (!value || value.toUpperCase() === 'PS') return '';
      return value;
    };

    // Helper function to map test procedures value
    const mapTestProceduresValue = (value: string | undefined): string => {
      if (!value) return '';
      const trimmedValue = value.trim().toUpperCase();
      switch (trimmedValue) {
        case 'Y':
        case 'YES':
          return 'Yes';
        case 'N':
        case 'NO':
          return 'No';
        case 'N/A':
        case 'NA':
        case 'A':  // Database stores 'A' for N/A
          return 'N/A';
        default:
          return value.trim();
      }
    };

    // Helper function to format date for date input
    const formatDateForInput = (dateValue: string | Date | undefined): string => {
      if (!dateValue) return '';
      try {
        const date = new Date(dateValue);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      } catch {
        return '';
      }
    };

    // Helper function to map status values from API to dropdown values
    const mapStatusValue = (value: string | undefined): string => {
      if (!value) return '';
      const trimmedValue = value.trim().toUpperCase();
      switch (trimmedValue) {
        case 'INP':
        case 'IN PROGRESS':
          return 'INP';
        case 'NCR':
        case 'NEEDS COMPONENTS FOR REPAIR':
          return 'NCR';
        case 'MPJ':
        case 'MISSING PARTS FROM JOB':
          return 'MPJ';
        case 'COM':
        case 'COMPLETED':
          return 'COM';
        default:
          // Handle mixed case like "Inp" -> "INP"
          return trimmedValue;
      }
    };

    // Populate the edit form with the unit data from API
    const formData = {
      rowIndex: unitData.rowIndex || 0,
      make: unitData.make || '',
      model: unitData.model || '',
      kva: unitData.kva?.trim() || '',
      voltage: unitData.voltage?.trim() || '',
      serialNo: unitData.serialNo || '',
      poNumber: unitData.poNumber?.trim() || '',
      unitCost: cleanCurrencyValue(unitData.unitCost),
      shippingPO: unitData.shippingPO?.trim() || '',
      shipCost: cleanCurrencyValue(unitData.shipCost),
      priority: unitData.priority?.trim() || 'Normal',
      assignedTo: mapAssignedToValue(unitData.assignedTo?.trim()),
      dueDate: formatDateForInput(unitData.dueDate), // Use dueDate field from API
      deficiencyNotes: unitData.problemNotes || '', // Use problemNotes directly, empty if not provided
      approved: unitData.approved || false, // Use API value instead of hardcoding to false
      moveToArchive: unitData.archive === true, // Only true if archive field is explicitly true
      moveToStrip: unitData.stripSNo ? true : false // Set based on stripSNo field presence
    };
    
    // Populate the result form with test result data from API
    const resultFormData = {
      RowIndex: unitData.rowIndex || 0,
      Status: mapStatusValue(unitData.status), // Apply status mapping
      resolveNotes: unitData.resolveNotes || '',
      testProcedures: unitData.testProcedures?.trim() || '',
      TestedBy: unitData.testedBy || '',
      followedProcedure: mapTestProceduresValue(unitData.testProcedures), // Map Y to Yes for dropdown
      currentStatus: mapStatusValue(unitData.status), // Apply status mapping
      testEngineer: unitData.testedBy || '', // Map testedBy to testEngineer
      inspectionNotes: unitData.resolveNotes || '' // Map resolveNotes to inspection notes
    };
    
    // Use setValue instead of patchValue to ensure all fields are set
    try {
      this.editForm.setValue(formData);
    } catch (error) {
      this.editForm.patchValue(formData);
    }

    // Populate result form as well
    try {
      this.resultForm.setValue(resultFormData);
      console.log('✅ Result form setValue successful');
    } catch (error) {
      console.log('⚠️ Result form setValue failed, using patchValue:', error);
      this.resultForm.patchValue(resultFormData);
    }
    this.cdr.detectChanges();
  }

  private populateFormFromQueryParams(params: any): void {
    // Create a unit object from query params
    const unitData: Partial<UPSTestStatusDto> = {
      rowIndex: params['rowIndex'] ? parseInt(params['rowIndex']) : 0,
      make: params['make'] || '',
      model: params['model'] || '',
      serialNo: params['serialNo'] || '',
      kva: params['kva'] || '',
      voltage: params['voltage'] || '',
      poNumber: params['poNumber'] || '',
      unitCost: params['unitCost'] || '',
      shippingPO: params['shippingPO'] || '',
      shipCost: params['shipCost'] || '',
      priority: params['priority'] || 'Normal',
      assignedTo: params['assignedTo'] || '',
      status: params['status'] || '',
      testedBy: params['testedBy'] || '',
      stripSNo: params['stripSNo'] || ''
    };

    // Populate the edit form with the unit data
    const formData = {
      rowIndex: unitData.rowIndex,
      make: unitData.make,
      model: unitData.model,
      kva: unitData.kva,
      voltage: unitData.voltage,
      serialNo: unitData.serialNo,
      poNumber: unitData.poNumber,
      unitCost: unitData.unitCost,
      shippingPO: unitData.shippingPO,
      shipCost: unitData.shipCost,
      priority: unitData.priority,
      assignedTo: unitData.assignedTo,
      dueDate: '',
      deficiencyNotes: `Unit imported from UPS Test Status. Original Status: ${unitData.status || 'N/A'}`,
      approved: false,
      moveToArchive: false,
      moveToStrip: false
    };

    this.editForm.patchValue(formData);
    this.cdr.detectChanges();
  }

  loadNewUnitTestData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    const rowIndex = this.filterForm.get('rowIndex')?.value || 0;
    
    this.newUnitTestService.getNewUniTestList(rowIndex)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: NewUniTestApiResponse) => {
          if (response.success && response.data) {
            this.allData = response.data.unitsData || [];
            this.totalRecords = response.totalRecords;
            this.isFiltered = response.isFiltered;
            this.filteredRowIndex = response.filteredRowIndex;
            
            this.originalData = [...this.allData];
            this.processData();
            this.applyFilters();
            
            this.toastr.success(`Loaded ${this.totalRecords} new unit test records`, 'Success');
          } else {
            this.errorMessage = response.message || 'Failed to load new unit test data';
            this.toastr.error(this.errorMessage, 'Error');
          }
        },
        error: (error) => {
          this.errorMessage = 'Failed to load new unit test data. Please try again.';
          this.toastr.error(this.errorMessage, 'Error');
        },
        complete: () => {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  private processData(): void {
    // Calculate make summary
    this.makeSummary = {};
    this.statusSummary = {};
    
    this.allData.forEach(item => {
      // Make counts
      const make = item.make || 'Unknown';
      this.makeSummary[make] = (this.makeSummary[make] || 0) + 1;
      
      // Status counts
      const status = item.status || 'Unknown';
      this.statusSummary[status] = (this.statusSummary[status] || 0) + 1;
    });
    
    this.updateCharts();
  }

  private applyFilters(): void {
    let filtered = [...this.allData];
    
    const formValue = this.filterForm.value;
    
    // Apply assigned to filter
    if (formValue.assignedTo && formValue.assignedTo !== 'All') {
      filtered = filtered.filter(item => 
        item.assignedTo && item.assignedTo.toLowerCase().includes(formValue.assignedTo.toLowerCase())
      );
    }
    
    // Apply status filter
    if (formValue.status && formValue.status !== 'All') {
      filtered = filtered.filter(item => 
        item.status && item.status.toLowerCase().includes(formValue.status.toLowerCase())
      );
    }
    
    // Apply priority filter
    if (formValue.priority && formValue.priority !== 'All') {
      filtered = filtered.filter(item => 
        item.priority && item.priority.toLowerCase().includes(formValue.priority.toLowerCase())
      );
    }
    
    // Apply search term filter
    if (this.searchTerm) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        Object.values(item).some(value => 
          value && value.toString().toLowerCase().includes(searchLower)
        )
      );
    }
    
    this.filteredData = filtered;
    this.currentPage = 1; // Reset to first page
    this.updateDisplayedData();
  }

  private updateDisplayedData(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedData = this.filteredData.slice(startIndex, endIndex);
    this.cdr.detectChanges();
  }

  private updateCharts(): void {
    this.updateMakeChart();
    this.updateStatusChart();
    this.cdr.detectChanges();
  }

  private updateMakeChart(): void {
    const makeData = Object.entries(this.makeSummary).map(([make, count]) => ({
      make: make || 'Unknown',
      count: count as number
    }));
    
    // Sort by count descending
    makeData.sort((a, b) => b.count - a.count);
    
    this.makeBarChartOptions.series = [{
      name: 'Units Count',
      data: makeData.map(item => item.count)
    }];
    
    this.makeBarChartOptions.xaxis = {
      ...this.makeBarChartOptions.xaxis,
      categories: makeData.map(item => item.make)
    };
  }

  private updateStatusChart(): void {
    const statusData = Object.entries(this.statusSummary);
    
    this.donutChartOptions.series = statusData.map(([, count]) => count as number);
    this.donutChartOptions.labels = statusData.map(([status]) => status || 'Unknown');
  }

  // Event handlers
  onSearch(event: any): void {
    this.searchTerm = event.target.value;
    this.applyFilters();
  }

  onPageSizeChange(event: any): void {
    this.pageSize = parseInt(event.target.value);
    this.currentPage = 1;
    this.updateDisplayedData();
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedData();
    }
  }

  onRowIndexChange(): void {
    this.loadNewUnitTestData();
  }

  goBack(): void {
    this.location.back();
  }

  // Utility methods
  get totalPages(): number {
    return Math.ceil(this.filteredData.length / this.pageSize);
  }

  getVisiblePages(): number[] {
    const totalPages = this.totalPages;
    const current = this.currentPage;
    const delta = 2; // Number of pages to show on each side
    
    let start = Math.max(1, current - delta);
    let end = Math.min(totalPages, current + delta);
    
    // Adjust if we're near the beginning or end
    if (end - start < 2 * delta) {
      if (start === 1) {
        end = Math.min(totalPages, start + 2 * delta);
      } else {
        start = Math.max(1, end - 2 * delta);
      }
    }
    
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  trackByIndex(index: number): number {
    return index;
  }

  sortData(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.filteredData.sort((a, b) => {
      const aVal = this.getColumnValue(a, column);
      const bVal = this.getColumnValue(b, column);
      
      let comparison = 0;
      if (aVal > bVal) {
        comparison = 1;
      } else if (aVal < bVal) {
        comparison = -1;
      }
      
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });

    this.updateDisplayedData();
  }

  private getColumnValue(item: UPSTestStatusDto, column: string): any {
    switch (column) {
      case 'unitCost':
      case 'shipCost':
        return this.parseNumericValue(item[column as keyof UPSTestStatusDto] as string);
      case 'kva':
        return this.parseNumericValue(item.kva);
      default:
        return item[column as keyof UPSTestStatusDto] || '';
    }
  }

  private parseNumericValue(value: string): number {
    if (!value) return 0;
    const cleaned = value.toString().replace(/[$,]/g, '');
    return parseFloat(cleaned) || 0;
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) {
      return 'bi-arrow-down-up';
    }
    return this.sortDirection === 'asc' ? 'bi-arrow-up' : 'bi-arrow-down';
  }

  getFilterBadgeClass(): string {
    const formValue = this.filterForm.value;
    const hasFilters = formValue.status !== 'All' || 
                      formValue.priority !== 'All' ||
                      this.searchTerm;
    
    return hasFilters ? 'badge-light-primary' : 'badge-light-secondary';
  }

  getStatusIconClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'passed':
        return 'text-success';
      case 'in progress':
      case 'inp':
      case 'testing':
        return 'text-warning';
      case 'failed':
      case 'error':
        return 'text-danger';
      case 'pending':
      case 'waiting':
        return 'text-info';
      default:
        return 'text-secondary';
    }
  }

  getStatusBadgeClass(status: string): string {
    if (!status) return 'badge-light-secondary';
    
    const normalizedStatus = status.toLowerCase().trim();
    
    // Handle specific status values
    switch (normalizedStatus) {
      case 'nos':
      case 'not started':
      case 'not_started':
      case 'pending':
        return 'badge-light-secondary';
        
      case 'inp':
      case 'in progress':
      case 'in_progress':
      case 'inprogress':
      case 'active':
      case 'working':
        return 'badge-light-primary'; // Soft Blue
        
      case 'needs components for repair':
      case 'needs_components_for_repair':
      case 'ncr':
      case 'needs components':
      case 'awaiting components':
        return 'badge-light-warning'; // Soft Orange
        
      case 'missing parts from job':
      case 'missing_parts_from_job':
      case 'mpj':
      case 'missing parts':
        return 'badge-light-danger'; // Soft Red
        
      case 'completed':
      case 'complete':
      case 'done':
      case 'finished':
        return 'badge-light-success';
        
      default:
        return 'badge-light-secondary';
    }
  }

  getPriorityBadgeClass(priority: string): string {
    if (!priority) return 'badge-light-secondary';
    
    switch (priority.toLowerCase().trim()) {
      case 'high':
      case 'urgent':
        return 'badge-light-danger';
      case 'normal':
      case 'medium':
        return 'badge-light-primary';
      case 'low':
        return 'badge-light-info';
      case 'at convenience':
        return 'badge-light-secondary';
      default:
        return 'badge-light-secondary';
    }
  }

  formatCurrency(value: string): string {
    if (!value) return '$0.00';
    const numValue = this.parseNumericValue(value);
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(numValue);
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString; // Return original if parsing fails
    }
  }

  formatDateTime(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleString();
    } catch {
      return dateString; // Return original if parsing fails
    }
  }

  // Chart helper methods
  public getMakeChartData(): {make: string, count: number}[] {
    if (this.cachedMakeChartData.length > 0) {
      return this.cachedMakeChartData;
    }
    
    this.cachedMakeChartData = Object.entries(this.makeSummary).map(([make, count]) => ({
      make,
      count
    }));
    
    return this.cachedMakeChartData;
  }

  public getYAxisTicks(): number[] {
    if (this.cachedYAxisTicks.length > 0) {
      return this.cachedYAxisTicks;
    }
    
    // Always show 0-100 range regardless of data
    this.cachedYAxisTicks = [0, 20, 40, 60, 80, 100];
    return this.cachedYAxisTicks;
  }

  public getBarHeightPercentage(value: number): number {
    // Use fixed scale of 100 instead of dynamic max value
    return Math.min((value / 100) * 100, 100);
  }

  getMakeIconClass(make: string): string {
    // Return different icon classes for different manufacturers
    const iconMap: { [key: string]: string } = {
      'APC': 'text-primary',
      'Tripp Lite': 'text-info',
      'Eaton': 'text-success',
      'CyberPower': 'text-warning',
      'Liebert': 'text-danger'
    };
    return iconMap[make] || 'text-secondary';
  }

  getMakePercentage(make: string): number {
    const total = this.filteredData.length;
    const makeCount = this.makeSummary[make] || 0;
    return total > 0 ? Math.round((makeCount / total) * 100) : 0;
  }

  // Debug method
  debugChartData(): void {
    console.log('🔍 Debug Chart Data:');
    console.log('Make Summary:', this.makeSummary);
    console.log('Status Summary:', this.statusSummary);
    console.log('Chart Options:', this.makeBarChartOptions);
    console.log('All Data:', this.allData);
    console.log('Filtered Data:', this.filteredData);
  }

  // Move to Stripping functionality
  /**
   * Opens confirmation modal for moving unit to stripping
   */
  openMoveConfirmModal(unit: UPSTestStatusDto): void {
    this.unitToMove = unit;
    this.showMoveConfirmModal = true;
  }

  /**
   * Closes the move confirmation modal
   */
  closeMoveConfirmModal(): void {
    this.showMoveConfirmModal = false;
    this.unitToMove = null;
  }

  /**
   * Confirms and executes the move to stripping operation
   */
  confirmMoveToStripping(): void {
    if (!this.unitToMove) return;

    const unit = this.unitToMove;
    this.closeMoveConfirmModal();
    
    this.moveUnitToStripping(unit);
  }

  /**
   * Moves a unit to stripping
   */
  moveUnitToStripping(unit: UPSTestStatusDto): void {
    const currentUser = this.auth.currentUserValue?.userName || 'System';
    
    // Add to moving units set to show loading state
    this.movingUnits.add(unit.rowIndex);
    
    const moveDto: MoveUnitToStrippingDto = {
      rowIndex: unit.rowIndex,
      make: unit.make || '',
      model: unit.model || '',
      kva: unit.kva || '',
      voltage: unit.voltage || '',
      serialNo: unit.serialNo || '',
      poNumber: unit.poNumber || '',
      shippingPO: unit.shippingPO || '',
      unitCost: unit.unitCostDecimal,
      shipCost: unit.shipCostDecimal,
      createdBy: currentUser
    };

    this.newUnitTestService.moveUnitToStripping(moveDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: MoveUnitToStrippingApiResponse) => {
          this.movingUnits.delete(unit.rowIndex);
          
          if (response.success) {
            this.moveResults[unit.rowIndex] = {
              success: true,
              message: response.message || 'Unit moved to stripping successfully'
            };
            
            this.toastr.success(
              `${unit.make} ${unit.model} (S/N: ${unit.serialNo}) moved to stripping successfully`,
              'Move Successful'
            );
            
            // Refresh the data to remove the moved unit from the list
            this.loadNewUnitTestData();
            
            // Clear the result after 5 seconds
            setTimeout(() => {
              delete this.moveResults[unit.rowIndex];
              this.cdr.detectChanges();
            }, 5000);
            
          } else {
            this.moveResults[unit.rowIndex] = {
              success: false,
              message: response.message || 'Failed to move unit to stripping'
            };
            
            this.toastr.error(
              response.message || 'Failed to move unit to stripping',
              'Move Failed'
            );
          }
          
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.movingUnits.delete(unit.rowIndex);
          
          console.error('❌ Error moving unit to stripping:', error);
          
          this.moveResults[unit.rowIndex] = {
            success: false,
            message: 'An error occurred while moving the unit'
          };
          
          this.toastr.error(
            'An error occurred while moving the unit to stripping',
            'Move Failed'
          );
          
          this.cdr.detectChanges();
        }
      });
  }

  // Checks if a unit is currently being moved
  isUnitMoving(rowIndex: number): boolean {
    return this.movingUnits.has(rowIndex);
  }

  /**
   * Gets the move result for a unit
   */
  getMoveResult(rowIndex: number): { success: boolean; message: string } | null {
    return this.moveResults[rowIndex] || null;
  }

  //Checks if unit can be moved (has required fields)
  
  canMoveUnit(unit: UPSTestStatusDto): boolean {
    return !!(unit.make && unit.model && unit.serialNo && unit.rowIndex > 0);
  }

  /**
   * Gets tooltip text for move button
   */
  getMoveTooltip(unit: UPSTestStatusDto): string {
    if (!this.canMoveUnit(unit)) {
      return 'Unit missing required fields (Make, Model, Serial No)';
    }
    if (this.isUnitMoving(unit.rowIndex)) {
      return 'Moving unit to stripping...';
    }
    return `Move ${unit.make} ${unit.model} to stripping`;
  }

  // Opens the edit modal for creating a new unit test
  openCreateModal(): void {
    this.isCreatingNew = true;
    this.editingUnit = null;
    this.isLoadedFromApi = false; // Reset flag for manual creation
    this.editForm.reset({
      rowIndex: 0,
      make: '',
      model: '',
      kva: '',
      voltage: '',
      serialNo: '',
      priority: 'Normal',
      assignedTo: '',
      dueDate: '',
      problemNotes: '',
      approved: false,
      archive: false
    });
    this.showEditModal = true;
  }

  /**
   * Opens the edit modal for updating an existing unit test
   */
  openEditModal(unit: UPSTestStatusDto): void {
    this.isCreatingNew = false;
    this.editingUnit = unit;
    this.isLoadedFromApi = false; 
    
    // Convert date to proper format if needed
    let dueDateValue = '';
    if (unit.lastModifiedOn) {
      const date = new Date(unit.lastModifiedOn);
      if (!isNaN(date.getTime())) {
        dueDateValue = date.toISOString().split('T')[0];
      }
    }

    this.editForm.patchValue({
      rowIndex: unit.rowIndex,
      make: unit.make || '',
      model: unit.model || '',
      kva: unit.kva || '',
      voltage: unit.voltage || '',
      serialNo: unit.serialNo || '',
      priority: unit.priority || 'Normal',
      assignedTo: unit.assignedTo || '',
      dueDate: dueDateValue,
      problemNotes: '', // Not available in UPSTestStatusDto, user can add new notes
      approved: false, // Default value
      archive: false // Default value
    });
    
    this.showEditModal = true;
  }

  /**
   * Closes the edit modal
   */
  closeEditModal(): void {
    this.showEditModal = false;
    this.editingUnit = null;
    this.isCreatingNew = false;
    this.isLoadedFromApi = false;
    this.editForm.reset();
  }

  /**
   * Clears the edit form
   */
  clearForm(): void {
    this.editForm.reset({
      rowIndex: 0,
      make: '',
      model: '',
      kva: '',
      voltage: '',
      serialNo: '',
      poNumber: '',
      unitCost: '',
      shippingPO: '',
      shipCost: '',
      priority: 'High',
      assignedTo: '',
      dueDate: '',
      problemNotes: '',
      approved: false,
      archive: false
    });
  }

  /**
   * Deletes the current unit
   */
  deleteUnit(): void {
    if (!this.editingUnit) return;
    
    const confirmMessage = `Are you sure you want to delete ${this.editingUnit.make}?\nBy clicking OK you will be directed to Testing Parts Graph Page.`;
    
    if (confirm(confirmMessage)) {
      // Implement delete functionality here
      this.toastr.info('Delete functionality will be implemented', 'Info');
      this.closeEditModal();
    }
  }

  /**
   * Saves or updates the unit test
   */
  saveUnitTest(): void {
    if (this.editForm.invalid) {
      this.markFormGroupTouched(this.editForm);
      return;
    }

    this.savingUnit = true;
    const currentUser = this.auth.currentUserValue?.userName || 'System';
    
    const formValue = this.editForm.value;
    const saveDto: SaveUpdateNewUnitTestDto = {
      rowIndex: formValue.rowIndex || 0,
      make: formValue.make || '',
      model: formValue.model || '',
      kva: formValue.kva || '',
      voltage: formValue.voltage || '',
      serialNo: formValue.serialNo || '',
      priority: formValue.priority || 'Normal',
      assignedTo: formValue.assignedTo || '',
      dueDate: formValue.dueDate ? new Date(formValue.dueDate) : undefined,
      problemNotes: formValue.problemNotes || '',
      approved: formValue.approved || false,
      archive: formValue.archive || false,
      lastModifiedBy: currentUser
    };

    this.newUnitTestService.saveUpdateUnitTest(saveDto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: SaveUpdateUnitTestResponse) => {
          this.savingUnit = false;
          
          if (response.success) {
            this.toastr.success(
              response.message,
              this.isCreatingNew ? 'Unit Test Created' : 'Unit Test Updated'
            );
            
            this.closeEditModal();
            this.loadNewUnitTestData(); // Refresh the list
            
          } else {
            this.toastr.error(
              response.message || 'Failed to save unit test',
              'Save Failed'
            );
          }
        },
        error: (error) => {
          this.savingUnit = false;
          console.error('❌ Error saving unit test:', error);
          
          this.toastr.error(
            'An error occurred while saving the unit test',
            'Save Failed'
          );
        }
      });
  }

  /**
   * Marks all form controls as touched to show validation errors
   */
  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Gets validation error message for a form field
   */
  getFieldError(fieldName: string): string {
    const control = this.editForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${fieldName} is required`;
      }
      if (control.errors['maxlength']) {
        return `${fieldName} exceeds maximum length of ${control.errors['maxlength'].requiredLength} characters`;
      }
    }
    return '';
  }

  openResultUpdateModal(unit: UPSTestStatusDto): void {
    this.resultUnit = unit;
    this.resultForm.patchValue({
      RowIndex: unit.rowIndex,
      Status: unit.status || '',
      resolveNotes: unit.resolveNotes || '',
      testProcedures: unit.testProcedures || '',
      TestedBy: unit.testedBy || ''
    });
    this.showResultModal = true;
    this.cdr.detectChanges();
  }

  /**
   * Closes the result update modal
   */
  closeResultModal(): void {
    this.showResultModal = false;
    this.resultUnit = null;
    this.resultForm.reset();
    this.updatingResult = false;
    this.cdr.detectChanges();
  }

  /**
   * Updates the unit test result
   */
  updateUnitTestResult(): void {
    if (this.resultForm.invalid) {
      this.markResultFormGroupTouched(this.resultForm);
      this.toastr.warning('Please fill in all required fields correctly.', 'Validation Error');
      return;
    }

    this.updatingResult = true;
    this.cdr.detectChanges();

    const dto: SaveUpdateNewUnitResultDto = this.resultForm.value;
    
    this.newUnitTestService.saveUpdateUnitTestResult(dto).subscribe({
      next: (response: SaveUpdateUnitTestResultResponse) => {
        if (response.success) {
          this.toastr.success(response.message, 'Result Updated');
          
          // Update the local data
          if (this.resultUnit) {
            const index = this.allData.findIndex(unit => unit.rowIndex === dto.RowIndex);
            if (index !== -1) {
              this.allData[index] = { ...this.allData[index], 
                status: dto.Status, 
                resolveNotes: dto.ResolveNotes || '',
                testProcedures: dto.TestProcedures || '',
                testedBy: dto.TestedBy || ''
              };
            }
          }

          // Refresh data and close modal
          this.applyFilters();
          this.updateCharts();
          this.closeResultModal();
        } else {
          this.toastr.error(response.message || 'Failed to update unit test result', 'Update Failed');
        }
      },
      error: (error) => {
        console.error('Error updating unit test result:', error);
        this.toastr.error('Failed to update unit test result. Please try again.', 'Error');
      },
      complete: () => {
        this.updatingResult = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Marks all controls in result form as touched for validation display
   */
  private markResultFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Gets validation error message for a result form field
   */
  getResultFieldError(fieldName: string): string {
    const control = this.resultForm.get(fieldName);
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return `${fieldName} is required`;
      }
      if (control.errors['maxlength']) {
        return `${fieldName} exceeds maximum length of ${control.errors['maxlength'].requiredLength} characters`;
      }
      if (control.errors['min']) {
        return `${fieldName} must be greater than ${control.errors['min'].min}`;
      }
    }
    return '';
  }

  /**
   * Checks if a result form field has errors
   */
  hasResultFieldError(fieldName: string): boolean {
    const control = this.resultForm.get(fieldName);
    return !!(control?.errors && control.touched);
  }

  // #endregion

  // #region Navigation and UI Methods

  /**
   * Navigates back to the previous page or unit test list
   */
  onBack(): void {
    this.location.back();
  }

  /**
   * Opens the edit modal for a unit
   */
  onEditUnit(): void {
    if (!this.selectedUnit) return;
    
    this.editingUnit = this.selectedUnit;
    this.editForm.patchValue({
      rowIndex: this.selectedUnit.rowIndex,
      make: this.selectedUnit.make || '',
      model: this.selectedUnit.model || '',
      kva: this.selectedUnit.kva || '',
      voltage: this.selectedUnit.voltage || '',
      serialNo: this.selectedUnit.serialNo || '',
      poNumber: this.selectedUnit.poNumber || '',
      unitCost: this.selectedUnit.unitCost || '',
      shippingPO: this.selectedUnit.shippingPO || '',
      shipCost: this.selectedUnit.shipCost || '',
      assignedTo: this.selectedUnit.assignedTo || '',
      priority: this.selectedUnit.priority || 'Normal',
      dueDate: '',
      deficiencyNotes: '',
      approved: false,
      moveToArchive: false,
      moveToStrip: false
    });
    this.showEditModal = true;
    this.viewMode = 'details';
    this.cdr.detectChanges();
  }

  /**
   * Views the UPS test procedure
   */
  onViewTestProcedure(): void {
    this.toastr.info('UPS Test Procedure would be displayed here', 'Test Procedure');
  }

  /**
   * Saves the unit information
   */
  onSaveUnit(): void {
    if (this.editForm.invalid) {
      this.markFormGroupTouched(this.editForm);
      this.toastr.warning('Please fill in all required fields correctly.', 'Validation Error');
      return;
    }

    this.savingUnit = true;
    this.cdr.detectChanges();

    const dto: SaveUpdateNewUnitTestDto = this.editForm.value;
    
    this.newUnitTestService.saveUpdateUnitTest(dto).subscribe({
      next: (response: SaveUpdateUnitTestResponse) => {
        if (response.success) {
          this.toastr.success(response.message, 'Unit Updated');
          
          // Update the local data
          if (this.editingUnit) {
            const index = this.allData.findIndex(unit => unit.rowIndex === dto.rowIndex);
            if (index !== -1) {
              this.allData[index] = { ...this.allData[index], ...dto };
              this.selectedUnit = this.allData[index];
            }
          }

          // Refresh data and close modal
          this.applyFilters();
          this.updateCharts();
          this.onCancelEdit();
        } else {
          this.toastr.error(response.message || 'Failed to update unit', 'Update Failed');
        }
      },
      error: (error) => {
        console.error('Error updating unit:', error);
        this.toastr.error('Failed to update unit. Please try again.', 'Error');
      },
      complete: () => {
        this.savingUnit = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Cancels the edit operation
   */
  onCancelEdit(): void {
    this.showEditModal = false;
    this.editingUnit = null;
    this.editForm.reset();
    this.savingUnit = false;
    this.viewMode = 'details';
    this.cdr.detectChanges();
  }

  /**
   * Cancels the create operation
   */
  onCancelCreate(): void {
    this.isCreatingNew = false;
    this.editForm.reset();
    this.savingUnit = false;
    this.selectedUnit = null;
    this.viewMode = 'list';
    this.cdr.detectChanges();
  }

  /**
   * Creates a new unit
   */
  onCreateUnit(): void {
    if (this.editForm.invalid) {
      this.markFormGroupTouched(this.editForm);
      this.toastr.warning('Please fill in all required fields correctly.', 'Validation Error');
      return;
    }

    this.savingUnit = true;
    this.cdr.detectChanges();

    const dto: SaveUpdateNewUnitTestDto = {
      ...this.editForm.value,
      rowIndex: 0 // New unit
    };
    
    this.newUnitTestService.saveUpdateUnitTest(dto).subscribe({
      next: (response: SaveUpdateUnitTestResponse) => {
        if (response.success) {
          this.toastr.success(response.message, 'Unit Created');
          
          // Reload data to include the new unit
          this.loadNewUnitTestData();
          this.onCancelCreate();
        } else {
          this.toastr.error(response.message || 'Failed to create unit', 'Create Failed');
        }
      },
      error: (error) => {
        console.error('Error creating unit:', error);
        this.toastr.error('Failed to create unit. Please try again.', 'Error');
      },
      complete: () => {
        this.savingUnit = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Saves the test results
   */
  onSaveResults(): void {
    if (this.resultForm.invalid) {
      this.markResultFormGroupTouched(this.resultForm);
      this.toastr.warning('Please fill in all required fields correctly.', 'Validation Error');
      return;
    }

    this.updatingResult = true;
    this.cdr.detectChanges();

    const dto: SaveUpdateNewUnitResultDto = this.resultForm.value;
    
    this.newUnitTestService.saveUpdateUnitTestResult(dto).subscribe({
      next: (response: SaveUpdateUnitTestResultResponse) => {
        if (response.success) {
          this.toastr.success(response.message, 'Results Updated');
          
          // Update the local data
          if (this.resultUnit) {
            const index = this.allData.findIndex(unit => unit.rowIndex === dto.RowIndex);
            if (index !== -1) {
              this.allData[index] = { ...this.allData[index], 
                status: dto.Status, 
                resolveNotes: dto.ResolveNotes || '',
                testProcedures: dto.TestProcedures || '',
                testedBy: dto.TestedBy || ''
              };
              this.selectedUnit = this.allData[index];
            }
          }

          // Refresh data and close modal
          this.applyFilters();
          this.updateCharts();
          this.onCancelResultUpdate();
        } else {
          this.toastr.error(response.message || 'Failed to update results', 'Update Failed');
        }
      },
      error: (error) => {
        console.error('Error updating results:', error);
        this.toastr.error('Failed to update results. Please try again.', 'Error');
      },
      complete: () => {
        this.updatingResult = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Cancels the result update operation
   */
  onCancelResultUpdate(): void {
    this.showResultModal = false;
    this.resultUnit = null;
    this.resultForm.reset();
    this.updatingResult = false;
    this.cdr.detectChanges();
  }

  /**
   * Clears the unit form
   */
  onClearUnitForm(): void {
    this.editForm.reset({
      rowIndex: 0,
      priority: 'Normal',
      approved: false,
      moveToArchive: false,
      moveToStrip: false
    });
    this.cdr.detectChanges();
  }

  /**
   * Adds a new unit
   */
  onAddUnit(): void {
    if (this.editForm.invalid) {
      this.markFormGroupTouched(this.editForm);
      this.toastr.warning('Please fill in all required fields correctly.', 'Validation Error');
      return;
    }

    this.savingUnit = true;
    this.cdr.detectChanges();

    const dto: SaveUpdateNewUnitTestDto = {
      ...this.editForm.value,
      rowIndex: 0 // New unit
    };
    
    this.newUnitTestService.saveUpdateUnitTest(dto).subscribe({
      next: (response: SaveUpdateUnitTestResponse) => {
        if (response.success) {
          this.toastr.success(response.message, 'Unit Added');
          
          // Reload data to include the new unit
          this.loadNewUnitTestData();
          this.onClearUnitForm();
        } else {
          this.toastr.error(response.message || 'Failed to add unit', 'Add Failed');
        }
      },
      error: (error) => {
        console.error('Error adding unit:', error);
        this.toastr.error('Failed to add unit. Please try again.', 'Error');
      },
      complete: () => {
        this.savingUnit = false;
        this.cdr.detectChanges();
      }
    });
  }

  // #endregion
}