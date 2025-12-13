import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportService } from '../../../core/services/report.service';
import { 
  PartsTestInfo, 
  PartsTestRequest, 
  PartsTestResponse, 
  PartsTestFilter, 
  PartsTestTable, 
  PartsTestRow,
  SaveUpdatePartsTestDto,
  SaveUpdatePartsTestResponse,
  EmployeeDto,
  EmployeeRequest,
  EmployeeResponse,
  DeletePartsTestResponse
} from '../../../core/model/parts-test-info.model';

@Component({
  selector: 'app-parts-test-info',
  templateUrl: './parts-test-info.component.html',
  styleUrls: ['./parts-test-info.component.scss']
})
export class PartsTestInfoComponent implements OnInit {

  partsTestList: PartsTestInfo[] = [];
  rawApiResponse: PartsTestResponse | null = null;
  sortedColumn: string = '';
  sortDirection: number = 1;
  isLoading: boolean = false;
  errorMessage: string = '';
  maxRowIndex: number = 1;
  isLoadingMaxRowIndex: boolean = false;
  
  // Editing functionality
  editMode: boolean = true;
  editingItem: PartsTestInfo | null = null;
  editForm: FormGroup;
  isSaving: boolean = false;
  saveMessage: string = '';
  saveError: string = '';
  
  // Employee functionality
  employees: EmployeeDto[] = [];
  isLoadingEmployees: boolean = false;
  selectedDepartment: string = 'TC'; // Default to TC department
  
  // Conditional display flags based on job type (matching legacy logic)
  showBoardSetup: boolean = false;
  showComponentWork: boolean = true;
  showAssemblyQC: boolean = false;
  
  // Delete functionality
  isDeleting: boolean = false;
  deleteMessage: string = '';
  deleteError: string = '';
  showDeleteConfirm: boolean = false;
  itemToDelete: PartsTestInfo | null = null;
  
  // Department options - adjust these based on your organization
  departmentOptions = [
    { value: 'TC', label: 'Technical' },
    { value: 'QC', label: 'Quality Control' },
    { value: 'AS', label: 'Assembly' },
    { value: 'MG', label: 'Management' },
    { value: 'WH', label: 'Warehouse' }
  ];
  
  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 50;
  totalRecords: number = 0;
  displayedData: PartsTestInfo[] = [];

  // Filter form
  filterForm: FormGroup = this.fb.group({
    source: ['PartsTest'],
    rowIndex: [0],
    searchTerm: [''],
    status: ['All']
  });

  // Source options matching backend enum
  sourceOptions = [
    { value: 'PartsTest', label: 'Parts Test' },
    { value: 'OrderRequest', label: 'Order Request' },
    { value: 'NewUniTest', label: 'New Uni Test' }
  ];

  // Status options (will be populated based on actual data)
  statusOptions: string[] = ['All'];

  // Table columns configuration
  displayColumns = [
    { key: 'partNumber', label: 'Part Number', sortable: true },
    { key: 'description', label: 'Description', sortable: true },
    { key: 'quantity', label: 'Quantity', sortable: true },
    { key: 'status', label: 'Status', sortable: true },
    { key: 'testDate', label: 'Test Date', sortable: true },
    { key: 'testResult', label: 'Test Result', sortable: true },
    { key: 'technician', label: 'Technician', sortable: true },
    { key: 'orderNumber', label: 'Order Number', sortable: true },
    { key: 'location', label: 'Location', sortable: true }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reportService: ReportService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.editForm = this.createEditForm();
  }

  ngOnInit(): void {
    this.handleQueryParams();
    this.loadMaxRowIndex();
    this.loadEmployees(this.selectedDepartment);
    // Start in edit mode like the legacy form
    this.createNewItem();
    // Setup subscriptions after form is created
    this.setupFormSubscriptions();
  }

  handleQueryParams(): void {
    this.route.queryParamMap.subscribe((params) => {
      if (params.has('source')) {
        const source = params.get('source');
        this.filterForm.patchValue({ source });
      }
      
      if (params.has('rowIndex')) {
        const rowIndex = parseInt(params.get('rowIndex') || '0', 10);
        this.filterForm.patchValue({ rowIndex });
      }
    });
  }

  setupFormSubscriptions(): void {
    this.filterForm.valueChanges.subscribe(() => {
      // Debounce the search to avoid too many API calls
      this.debounceSearch();
    });

    // Subscribe to job type changes in the edit form with immediate response
    this.editForm.get('jobFrom')?.valueChanges.subscribe(jobType => {
      if (jobType) {
        this.onJobTypeChange(jobType);
      }
    });
  }

  private searchTimeout: any;
  debounceSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.loadPartsTestData();
    }, 500);
  }

  loadMaxRowIndex(): void {
    this.isLoadingMaxRowIndex = true;
    this.reportService.getMaxTestRowIndex().subscribe({
      next: (response) => {
        if (response.success) {
          this.maxRowIndex = response.maxRowIndex;
          // Auto-set the row index if it's still at default (0)
          if (this.filterForm.get('rowIndex')?.value === 0) {
            this.filterForm.patchValue({ rowIndex: this.maxRowIndex });
          }
        }
        this.isLoadingMaxRowIndex = false;
      },
      error: (error) => {
        console.error('Error loading max row index:', error);
        this.isLoadingMaxRowIndex = false;
        // Use fallback value
        this.maxRowIndex = 1;
      }
    });
  }

  loadPartsTestData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    const formValue = this.filterForm.value;
    const request: PartsTestRequest = {
      rowIndex: formValue.rowIndex || 0,
      source: formValue.source || 'PartsTest'
    };

    // Use POST method as it matches the backend implementation
    this.reportService.getPartsTestList(request).subscribe({
      next: (response: PartsTestResponse) => {
        this.rawApiResponse = response;
        if (response.success && response.tables && response.tables.length > 0) {
          this.processApiResponse(response.tables);
        } else {
          this.partsTestList = [];
          this.errorMessage = response.message || '';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading parts test data:', error);
        this.errorMessage = 'Failed to load parts test data. Please try again.';
        this.partsTestList = [];
        this.isLoading = false;
        
        // Load mock data for development
        this.loadMockData();
      }
    });
  }

  processApiResponse(tables: PartsTestTable[]): void {
    this.partsTestList = [];
    
    // Process all tables from the response
    tables.forEach((table, tableIndex) => {
      table.rows.forEach((row, rowIndex) => {
        const partsTestInfo = this.mapRowToPartsTestInfo(row, tableIndex, rowIndex);
        this.partsTestList.push(partsTestInfo);
      });
    });

    // Extract unique statuses for filter dropdown
    this.updateStatusOptions();
    
    // Apply client-side filtering
    this.applyFilters();
    
    // Update pagination
    this.currentPage = 1;
    this.updateDisplayedData();
  }

  mapRowToPartsTestInfo(row: PartsTestRow, tableIndex: number, rowIndex: number): PartsTestInfo {
    // Map the API response row to our display interface
    // This mapping includes all fields from SaveUpdatePartsTestDto for comprehensive data handling
    return {
      id: row['ID'] || row['Id'] || row['id'] || (tableIndex * 1000 + rowIndex),
      partNumber: row['PartNumber'] || row['Part_Number'] || row['partNumber'] || row['part_number'] || row['ManufPartNo'] || row['manufPartNo'],
      description: row['Description'] || row['description'] || row['DESCRIPTION'],
      quantity: this.parseNumber(row['Quantity'] || row['quantity'] || row['QTY'] || row['qty']),
      status: row['Status'] || row['status'] || row['STATUS'] || row['BoardStatus'] || row['boardStatus'] || 'Unknown',
      testDate: this.parseDate(row['TestDate'] || row['Test_Date'] || row['testDate'] || row['test_date'] || row['DueDate'] || row['dueDate']),
      testResult: row['TestResult'] || row['Test_Result'] || row['testResult'] || row['test_result'] || (row['IsPassed'] ? 'Pass' : 'Fail'),
      technician: row['Technician'] || row['technician'] || row['TECHNICIAN'] || row['TechName'] || row['AssignedTo'] || row['assignedTo'],
      notes: row['Notes'] || row['notes'] || row['NOTES'] || row['Comments'] || row['ProblemNotes'] || row['problemNotes'],
      orderNumber: row['OrderNumber'] || row['Order_Number'] || row['orderNumber'] || row['order_number'] || row['CallNbr'] || row['callNbr'],
      serialNumber: row['SerialNumber'] || row['Serial_Number'] || row['serialNumber'] || row['serial_number'] || row['SerialNo'] || row['serialNo'],
      location: row['Location'] || row['location'] || row['LOCATION'] || row['SiteID'] || row['siteID'],
      vendor: row['Vendor'] || row['vendor'] || row['VENDOR'],
      // Additional fields from SaveUpdatePartsTestDto
      jobFrom: row['JobFrom'] || row['jobFrom'] || row['job_from'],
      callNbr: row['CallNbr'] || row['callNbr'] || row['call_nbr'],
      siteID: row['SiteID'] || row['siteID'] || row['site_id'],
      make: row['Make'] || row['make'],
      model: row['Model'] || row['model'],
      manufPartNo: row['ManufPartNo'] || row['manufPartNo'] || row['manuf_part_no'],
      dcgPartNo: row['DCGPartNo'] || row['dcgPartNo'] || row['dcg_part_no'],
      serialNo: row['SerialNo'] || row['serialNo'] || row['serial_no'],
      workType: row['WorkType'] || row['workType'] || row['work_type'],
      priority: row['Priority'] || row['priority'],
      assignedTo: row['AssignedTo'] || row['assignedTo'] || row['assigned_to'],
      dueDate: this.parseDate(row['DueDate'] || row['dueDate'] || row['due_date']),
      kva: row['KVA'] || row['kva'],
      voltage: row['Voltage'] || row['voltage'],
      problemNotes: row['ProblemNotes'] || row['problemNotes'] || row['problem_notes'],
      resolveNotes: row['ResolveNotes'] || row['resolveNotes'] || row['resolve_notes'],
      rowIndex: this.parseNumber(row['RowIndex'] || row['rowIndex'] || row['row_index']) || (tableIndex * 1000 + rowIndex),
      boardStatus: row['BoardStatus'] || row['boardStatus'] || row['board_status'],
      compWorkDone: row['CompWorkDone'] || row['compWorkDone'] || row['comp_work_done'],
      compWorkStatus: row['CompWorkStatus'] || row['compWorkStatus'] || row['comp_work_status'],
      testWorkDone: row['TestWorkDone'] || row['testWorkDone'] || row['test_work_done'],
      testWorkStatus: row['TestWorkStatus'] || row['testWorkStatus'] || row['test_work_status'],
      completedBy: row['CompletedBy'] || row['completedBy'] || row['completed_by'],
      reviewedBy: row['ReviewedBy'] || row['reviewedBy'] || row['reviewed_by'],
      isPassed: this.parseBoolean(row['IsPassed'] || row['isPassed'] || row['is_passed']),
      assyWorkDone: row['AssyWorkDone'] || row['assyWorkDone'] || row['assy_work_done'],
      assyProcFollowed: row['AssyProcFollowed'] || row['assyProcFollowed'] || row['assy_proc_followed'],
      assyWorkStatus: row['AssyWorkStatus'] || row['assyWorkStatus'] || row['assy_work_status'],
      qcWorkDone: row['QCWorkDone'] || row['qcWorkDone'] || row['qc_work_done'],
      qcProcFollowed: row['QCProcFollowed'] || row['qcProcFollowed'] || row['qc_proc_followed'],
      qcApproved: row['QCApproved'] || row['qcApproved'] || row['qc_approved'],
      qcWorkStatus: row['QCWorkStatus'] || row['qcWorkStatus'] || row['qc_work_status'],
      createdBy: row['CreatedBy'] || row['createdBy'] || row['created_by'],
      approved: this.parseBoolean(row['Approved'] || row['approved']),
      lastModifiedBy: row['LastModifiedBy'] || row['lastModifiedBy'] || row['last_modified_by']
    };
  }

  parseNumber(value: any): number | undefined {
    if (value === null || value === undefined || value === '') return undefined;
    const num = parseFloat(value);
    return isNaN(num) ? undefined : num;
  }

  parseDate(value: any): Date | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    return isNaN(date.getTime()) ? undefined : date;
  }

  parseBoolean(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
    }
    if (typeof value === 'number') return value !== 0;
    return false;
  }

  updateStatusOptions(): void {
    const statusSet = new Set(this.partsTestList.map(item => item.status).filter(Boolean));
    const uniqueStatuses: string[] = [];
    statusSet.forEach(status => uniqueStatuses.push(status as string));
    this.statusOptions = ['All', ...uniqueStatuses.sort()];
  }

  applyFilters(): void {
    const formValue = this.filterForm.value;
    let filtered = [...this.partsTestList];

    // Apply search term filter
    if (formValue.searchTerm && formValue.searchTerm.trim()) {
      const searchTerm = formValue.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.partNumber?.toLowerCase().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm) ||
        item.technician?.toLowerCase().includes(searchTerm) ||
        item.orderNumber?.toLowerCase().includes(searchTerm) ||
        item.serialNumber?.toLowerCase().includes(searchTerm) ||
        item.location?.toLowerCase().includes(searchTerm) ||
        item.vendor?.toLowerCase().includes(searchTerm)
      );
    }

    // Apply status filter
    if (formValue.status && formValue.status !== 'All') {
      filtered = filtered.filter(item => item.status === formValue.status);
    }

    this.partsTestList = filtered;
  }

  loadMockData(): void {
    // Mock data for development and testing
    this.partsTestList = [
      {
        id: 1,
        partNumber: 'PT001',
        description: 'Battery Test Unit',
        quantity: 5,
        status: 'Passed',
        testDate: new Date('2024-12-10'),
        testResult: 'Pass',
        technician: 'John Smith',
        notes: 'All tests completed successfully',
        orderNumber: 'ORD001',
        serialNumber: 'SN001',
        location: 'Warehouse A',
        vendor: 'ABC Corp'
      },
      {
        id: 2,
        partNumber: 'PT002',
        description: 'UPS Component',
        quantity: 3,
        status: 'Failed',
        testDate: new Date('2024-12-09'),
        testResult: 'Fail',
        technician: 'Jane Doe',
        notes: 'Voltage test failed',
        orderNumber: 'ORD002',
        serialNumber: 'SN002',
        location: 'Warehouse B',
        vendor: 'XYZ Industries'
      },
      {
        id: 3,
        partNumber: 'PT003',
        description: 'Capacitor Bank',
        quantity: 2,
        status: 'In Progress',
        testDate: new Date('2024-12-11'),
        testResult: 'Pending',
        technician: 'Mike Johnson',
        notes: 'Testing in progress',
        orderNumber: 'ORD003',
        serialNumber: 'SN003',
        location: 'Test Lab',
        vendor: 'Tech Solutions'
      }
    ];
    
    this.updateStatusOptions();
    this.currentPage = 1;
    this.updateDisplayedData();
    this.isLoading = false;
  }

  sortTable(column: string): void {
    if (this.sortedColumn === column) {
      this.sortDirection = -this.sortDirection;
    } else {
      this.sortedColumn = column;
      this.sortDirection = 1;
    }

    this.partsTestList.sort((a: any, b: any) => {
      let aValue = a[column];
      let bValue = b[column];

      // Handle null or undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1 * this.sortDirection;
      if (bValue == null) return -1 * this.sortDirection;

      // Handle different data types
      if (column === 'quantity') {
        aValue = aValue || 0;
        bValue = bValue || 0;
      } else if (column === 'testDate') {
        aValue = aValue ? new Date(aValue).getTime() : 0;
        bValue = bValue ? new Date(bValue).getTime() : 0;
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return -1 * this.sortDirection;
      if (aValue > bValue) return 1 * this.sortDirection;
      return 0;
    });

    this.currentPage = 1;
    this.updateDisplayedData();
  }

  sortIcon(column: string): string {
    if (this.sortedColumn === column) {
      return this.sortDirection === 1 ? 'bi-arrow-up' : 'bi-arrow-down';
    }
    return 'bi-arrow-down-up';
  }

  getSortClass(column: string): string {
    if (this.sortedColumn === column) {
      return this.sortDirection === 1 ? 'sorted-asc' : 'sorted-desc';
    }
    return '';
  }

  getStatusBadgeClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'passed':
      case 'pass':
        return 'badge bg-success';
      case 'failed':
      case 'fail':
        return 'badge bg-danger';
      case 'in progress':
      case 'pending':
        return 'badge bg-warning';
      case 'cancelled':
        return 'badge bg-secondary';
      default:
        return 'badge bg-primary';
    }
  }

  refreshData(): void {
    this.loadMaxRowIndex();
    this.loadPartsTestData();
  }

  setNextRowIndex(): void {
    this.loadMaxRowIndex();
    // The loadMaxRowIndex method will automatically update the form
  }

  clearFilters(): void {
    this.filterForm.patchValue({
      source: 'PartsTest',
      rowIndex: this.maxRowIndex,
      searchTerm: '',
      status: 'All'
    });
    this.currentPage = 1;
  }

  exportToExcel(): void {
    if (this.partsTestList.length === 0) {
      return;
    }

    const csvData = this.convertToCSV(this.partsTestList);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Parts_Test_Info_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private convertToCSV(data: PartsTestInfo[]): string {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = [
      'Part Number',
      'Description', 
      'Quantity',
      'Status',
      'Test Date',
      'Test Result',
      'Technician',
      'Order Number',
      'Serial Number',
      'Location',
      'Vendor',
      'Notes'
    ];

    const csvRows = data.map(item => [
      item.partNumber || '',
      item.description || '',
      item.quantity?.toString() || '',
      item.status || '',
      item.testDate ? new Date(item.testDate).toLocaleDateString() : '',
      item.testResult || '',
      item.technician || '',
      item.orderNumber || '',
      item.serialNumber || '',
      item.location || '',
      item.vendor || '',
      item.notes || ''
    ]);

    const allRows = [headers, ...csvRows];
    
    return allRows.map(row => 
      row.map(field => {
        if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      }).join(',')
    ).join('\n');
  }

  // Pagination methods
  updateDisplayedData(): void {
    this.totalRecords = this.partsTestList.length;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, this.totalRecords);
    this.displayedData = this.partsTestList.slice(startIndex, endIndex);
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.updateDisplayedData();
  }

  onPageSizeChange(event: any): void {
    const size = parseInt(event.target.value, 10);
    this.pageSize = size;
    this.currentPage = 1;
    this.updateDisplayedData();
  }

  getTotalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize);
  }

  getStartRecord(): number {
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  getEndRecord(): number {
    return Math.min(this.currentPage * this.pageSize, this.totalRecords);
  }

  goBack(): void {
    this.router.navigate(['/reports']);
  }

  viewDetails(item: PartsTestInfo): void {
    // Navigate to detailed view or open modal
    console.log('View details for:', item);
  }

  trackByFn(index: number, item: PartsTestInfo): any {
    return item.id || index;
  }

  // Edit functionality methods
  createEditForm(): FormGroup {
    return this.fb.group({
      // Auto Generated ID fields
      autoGenYr: [''],
      autoGenMon: [''],
      autoGenDay: [''],
      autoGenID: [''],
      
      // Basic Information
      jobFrom: ['3', Validators.required], // Default to Inventory
      jobNumber: [''],
      siteID: [''],
      make: [''],
      model: [''],
      kva: [''],
      voltage: [''],
      manufPartNo: ['', Validators.required],
      dcgPartNo: ['', Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      serialNo: [''],
      
      // Work Type Checkboxes (12 total from legacy)
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
      
      // Assignment and Date fields
      createdBy: ['', Validators.required],
      assignedTo: ['', Validators.required],
      dueDate: [null, Validators.required],
      description: [''],
      problemNotes: ['', Validators.required],
      approved: [false],
      
      // Board Setup Status (conditional)
      boardStatus: ['0'],
      boardSetupStatus: ['0'],
      
      // Common completion fields
      completionDate: [null],
      resolveNotes: [''], // txtResolveNotes - Always visible
      
      // Component Work (conditional)
      compWork1: [false], // Cleaned
      compWork2: [false], // Refurbished
      compWork3: [false], // Parts Replaced
      compWork4: [false], // Repaired
      compWork5: [false], // Inspected for Damage
      compWork6: [false], // Not Repairable
      partRepairStatus: ['0'],
      
      // Testing Work (conditional)
      testWork1: [false], // Testing In Unit
      testWork2: [false], // Load Tested
      testWork3: [false], // No Unit To Test
      testWorkStatus: ['0'],
      
      // Assembly & QC (conditional)
      completedBy: [''],
      assyWork1: [false], // Cleaned
      assyWork2: [false], // Parts Replaced
      assyWork4: [false], // Inspected For Damage
      assyWork5: [false], // Refurbished
      assyWork6: [false], // Repaired
      assyWork7: [false], // Not Repairable
      assyProcFollowed: [''],
      assyWorkStatus: ['0'],
      reviewedBy: [''],
      isPassed: [false],
      
      // Quality Check
      qcWork1: [false], // Cleaned
      qcWork2: [false], // Torqued
      qcWork3: [false], // Inspected
      qcProcFollowed: [''],
      qcApproved: [''],
      qcWorkStatus: ['0'],
      
      // Main Inspection Fields
      procedureFollowed: [''],
      assemblyStatus: ['0'],
      qualityApproved: [''],
      
      // Legacy compatibility fields
      callNbr: [''],
      workType: [''],
      priority: ['Normal'], // Default to Normal priority
      rowIndex: [0],
      compWorkDone: [''],
      compWorkStatus: [''],
      testWorkDone: [''],
      assyWorkDone: [''],
      qcWorkDone: [''],
      lastModifiedBy: ['']
    });
  }

  editItem(item: PartsTestInfo): void {
    this.editingItem = { ...item };
    this.editMode = true;
    this.saveMessage = '';
    this.saveError = '';
    
    // Populate the form with current item data
    this.populateEditForm(item);
    
    // Set conditional display based on job type
    this.onJobTypeChange(item.jobFrom || '3');
  }

  populateEditForm(item: PartsTestInfo): void {
    this.editForm.patchValue({
      jobFrom: item.jobFrom || '',
      callNbr: item.callNbr || '',
      siteID: item.siteID || '',
      make: item.make || '',
      model: item.model || '',
      manufPartNo: item.partNumber || '',
      dcgPartNo: item.dcgPartNo || '',
      serialNo: item.serialNumber || '',
      quantity: item.quantity || 0,
      workType: item.workType || '',
      description: item.description || '',
      priority: item.priority || '',
      assignedTo: item.assignedTo || '',
      dueDate: item.testDate ? new Date(item.testDate) : null,
      kva: item.kva || '',
      voltage: item.voltage || '',
      problemNotes: item.problemNotes || '',
      resolveNotes: item.resolveNotes || '',
      rowIndex: item.rowIndex || this.maxRowIndex,
      boardStatus: item.boardStatus || '',
      compWorkDone: item.compWorkDone || '',
      compWorkStatus: item.compWorkStatus || '',
      testWorkDone: item.testWorkDone || '',
      testWorkStatus: item.testWorkStatus || '',
      completedBy: item.completedBy || '',
      reviewedBy: item.reviewedBy || '',
      isPassed: item.isPassed || false,
      assyWorkDone: item.assyWorkDone || '',
      assyProcFollowed: item.assyProcFollowed || '',
      assyWorkStatus: item.assyWorkStatus || '',
      qcWorkDone: item.qcWorkDone || '',
      qcProcFollowed: item.qcProcFollowed || '',
      qcApproved: item.qcApproved || '',
      qcWorkStatus: item.qcWorkStatus || '',
      createdBy: item.createdBy || '',
      approved: item.approved || false,
      lastModifiedBy: item.lastModifiedBy || ''
    });
  }

  createNewItem(): void {
    this.editingItem = null;
    this.editMode = true;
    this.saveMessage = '';
    this.saveError = '';
    
    // Reset form and set default values
    this.editForm.reset();
    
    // Generate auto ID
    this.generateAutoId();
    
    // Set default values matching legacy form
    this.editForm.patchValue({
      jobFrom: '3', // Default to Inventory
      quantity: 1,
      isPassed: false,
      approved: false,
      createdBy: '', // Will be selected from dropdown
      assignedTo: '', // Will be selected from dropdown
      boardStatus: '0',
      boardSetupStatus: '0',
      partRepairStatus: '0',
      testWorkStatus: '0',
      assyWorkStatus: '0',
      qcWorkStatus: '0'
    });
    
    // Set initial conditional display - Default to Inventory which shows divGrp1 (Component Work)
    this.onJobTypeChange('3');
  }

  saveItem(): void {
    // Legacy validation checks
    if (!this.validateLegacyForm()) {
      return;
    }

    this.isSaving = true;
    this.saveError = '';
    this.saveMessage = '';
    
    const formValue = this.editForm.value;
    
    // Build work type string from checkboxes
    const workTypeArray = [];
    for (let i = 1; i <= 12; i++) {
      if (formValue[`workType${i}`]) {
        workTypeArray.push(i.toString());
      }
    }
    const workTypeString = workTypeArray.join(',');
    
    const dto: SaveUpdatePartsTestDto = {
      jobFrom: formValue.jobFrom || '',
      callNbr: formValue.jobNumber || '',
      siteID: formValue.siteID || '',
      make: formValue.make || '',
      model: formValue.model || '',
      manufPartNo: formValue.manufPartNo || '',
      dcgPartNo: formValue.dcgPartNo || '',
      serialNo: formValue.serialNo || '',
      quantity: formValue.quantity || 0,
      workType: workTypeString,
      description: formValue.description || '',
      priority: this.getPriorityFromDueDate(formValue.dueDate),
      assignedTo: formValue.assignedTo || '',
      dueDate: formValue.dueDate || undefined,
      kva: formValue.kva || '',
      voltage: formValue.voltage || '',
      problemNotes: formValue.problemNotes || '',
      resolveNotes: formValue.resolveNotes || '',
      rowIndex: this.maxRowIndex + 1,
      boardStatus: formValue.boardStatus === '0' ? '' : formValue.boardStatus,
      compWorkDone: this.buildCompWorkDoneString(formValue),
      compWorkStatus: formValue.partRepairStatus === '0' ? '' : formValue.partRepairStatus,
      testWorkDone: this.buildTestWorkDoneString(formValue),
      testWorkStatus: formValue.testWorkStatus === '0' ? '' : formValue.testWorkStatus,
      completedBy: formValue.completedBy || '',
      reviewedBy: formValue.reviewedBy || '',
      isPassed: formValue.isPassed || false,
      assyWorkDone: this.buildAssyWorkDoneString(formValue),
      assyProcFollowed: formValue.assyProcFollowed || '',
      assyWorkStatus: formValue.assyWorkStatus === '0' ? '' : formValue.assyWorkStatus,
      qcWorkDone: this.buildQCWorkDoneString(formValue),
      qcProcFollowed: formValue.qcProcFollowed || '',
      qcApproved: formValue.qcApproved || '',
      qcWorkStatus: formValue.qcWorkStatus === '0' ? '' : formValue.qcWorkStatus,
      createdBy: formValue.createdBy || '',
      approved: formValue.approved || false,
      lastModifiedBy: formValue.createdBy || ''
    };

    this.reportService.saveUpdatePartsTestList(dto).subscribe({
      next: (response: SaveUpdatePartsTestResponse) => {
        if (response.success) {
          this.saveMessage = response.message || 'Parts test entry saved successfully!';
          this.saveError = '';
          
          // Refresh the data to show updated results
          setTimeout(() => {
            this.loadPartsTestData();
            this.cancelEdit();
          }, 1500);
        } else {
          this.saveError = response.message || 'Failed to save parts test entry.';
          this.saveMessage = '';
        }
        this.isSaving = false;
      },
      error: (error) => {
        console.error('Error saving parts test entry:', error);
        this.saveError = error.error?.message || 'Failed to save parts test entry. Please try again.';
        this.saveMessage = '';
        this.isSaving = false;
      }
    });
  }
  
  validateLegacyForm(): boolean {
    const formValue = this.editForm.value;
    
    // Required field validations matching legacy JavaScript
    if (!formValue.manufPartNo?.trim()) {
      alert('One or more of the required fields is incomplete.\nPlease enter \'Manuf Part Number\' and resave your Part.');
      return false;
    }
    
    if (!formValue.dcgPartNo?.trim()) {
      alert('One or more of the required fields is incomplete.\nPlease enter \'DCGroup Part Number\' and resave your Part.');
      return false;
    }
    
    if (!formValue.quantity || formValue.quantity <= 0) {
      alert('One or more of the required fields is incomplete.\nPlease enter \'Quantity\' and resave your Part.');
      return false;
    }
    
    if (!this.validateWorkTypeSelection()) {
      alert('You must check at least one checkbox in Work Type');
      return false;
    }
    
    if (!formValue.createdBy || formValue.createdBy === 'PS') {
      alert('One or more of the required fields is incomplete.\nPlease select \'Created By\' and resave your Part.');
      return false;
    }
    
    if (!formValue.assignedTo || formValue.assignedTo === 'PS') {
      alert('One or more of the required fields is incomplete.\nPlease select \'Assigned To\' and resave your Part.');
      return false;
    }
    
    if (!formValue.dueDate) {
      alert('One or more of the required fields is incomplete.\nPlease enter \'Due Date\' and resave your Part.');
      return false;
    }
    
    if (!formValue.problemNotes?.trim()) {
      alert('One or more of the required fields is incomplete.\nPlease enter \'Deficiency\' and resave your Part.');
      return false;
    }

    // Due date validation for new entries (must be greater than today)
    if (!formValue.testRowIndex || formValue.testRowIndex === 0) {
      const today = new Date();
      const dueDate = new Date(formValue.dueDate);
      today.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);
      
      if (dueDate <= today) {
        alert('Due Date must be greater than today\'s date for new entries.');
        return false;
      }
    }

    // Priority vs Due Date validation
    if (formValue.priority) {
      const today = new Date();
      const dueDate = new Date(formValue.dueDate);
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (formValue.priority === 'Urgent' && daysDiff > 7) {
        alert('Due date must be within 7 days for Urgent priority.');
        return false;
      } else if (formValue.priority === 'High' && daysDiff > 30) {
        alert('Due date must be within 30 days for High priority.');
        return false;
      } else if (formValue.priority === 'Normal' && daysDiff > 90) {
        alert('Due date must be within 90 days for Normal priority.');
        return false;
      }
    }

    // Conditional resolve notes validation (when status is completed)
    if (formValue.testWorkStatus === '1' || formValue.assyWorkStatus === '1' || formValue.qcWorkStatus === '1') {
      if (!formValue.resolveNotes?.trim()) {
        alert('After Testing Notes are required when status is set to Completed.');
        return false;
      }
    }
    
    // QC validation for specific job types
    if (formValue.jobFrom === '1' || formValue.jobFrom === '2' || formValue.jobFrom === '4') {
      if (formValue.qcWorkStatus === '1') {
        if (!this.validateQCWorkSelection(formValue)) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  validateQCWorkSelection(formValue: any): boolean {
    if (!formValue.qcWork1 && !formValue.qcWork2 && !formValue.qcWork3) {
      alert('You cannot update without checking QC - WorkDone');
      return false;
    }
    
    if (!formValue.qcProcFollowed) {
      alert('You cannot update without checking QC - Procedures Followed');
      return false;
    }
    
    if (!formValue.qcApproved) {
      alert('You cannot update without checking Quality Approved');
      return false;
    }
    
    return true;
  }
  
  getPriorityFromDueDate(dueDate: Date | null): string {
    if (!dueDate) return 'Normal';
    
    const today = new Date();
    const diffTime = new Date(dueDate).getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 7) return 'Urgent';
    if (diffDays <= 30) return 'High';
    return 'Normal';
  }
  
  buildCompWorkDoneString(formValue: any): string {
    const workDone = [];
    if (formValue.compWork1) workDone.push('Cleaned');
    if (formValue.compWork2) workDone.push('Refurbished');
    if (formValue.compWork3) workDone.push('Parts Replaced');
    if (formValue.compWork4) workDone.push('Repaired');
    if (formValue.compWork5) workDone.push('Inspected for Damage');
    if (formValue.compWork6) workDone.push('Not Repairable');
    return workDone.join(', ');
  }
  
  buildTestWorkDoneString(formValue: any): string {
    const workDone = [];
    if (formValue.testWork1) workDone.push('Testing In Unit');
    if (formValue.testWork2) workDone.push('Load Tested');
    if (formValue.testWork3) workDone.push('No Unit To Test');
    return workDone.join(', ');
  }
  
  buildAssyWorkDoneString(formValue: any): string {
    const workDone = [];
    if (formValue.assyWork1) workDone.push('Cleaned');
    if (formValue.assyWork2) workDone.push('Parts Replaced');
    if (formValue.assyWork4) workDone.push('Inspected For Damage');
    if (formValue.assyWork5) workDone.push('Refurbished');
    if (formValue.assyWork6) workDone.push('Repaired');
    if (formValue.assyWork7) workDone.push('Not Repairable');
    return workDone.join(', ');
  }
  
  buildQCWorkDoneString(formValue: any): string {
    const workDone = [];
    if (formValue.qcWork1) workDone.push('Cleaned');
    if (formValue.qcWork2) workDone.push('Torqued');
    if (formValue.qcWork3) workDone.push('Inspected');
    return workDone.join(', ');
  }

  cancelEdit(): void {
    this.editMode = false;
    this.editingItem = null;
    this.saveMessage = '';
    this.saveError = '';
    this.editForm.reset();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.editForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(fieldName: string): string {
    const field = this.editForm.get(fieldName);
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName} is required.`;
      }
      if (field.errors['maxlength']) {
        return `${fieldName} is too long.`;
      }
      if (field.errors['min']) {
        return `${fieldName} must be greater than ${field.errors['min'].min}.`;
      }
    }
    return '';
  }

  // Employee management methods
  loadEmployees(department: string): void {
    if (!department) return;
    
    this.isLoadingEmployees = true;
    this.reportService.getEmployeeNamesByDept(department).subscribe({
      next: (response: EmployeeResponse) => {
        if (response.success && response.employees) {
          this.employees = response.employees;
        } else {
          this.employees = [];
          console.warn('No employees found for department:', department);
        }
        this.isLoadingEmployees = false;
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.employees = [];
        this.isLoadingEmployees = false;
        
        // Load mock employees for development
        this.loadMockEmployees();
      }
    });
  }

  onDepartmentChange(department: string): void {
    this.selectedDepartment = department;
    this.loadEmployees(department);
  }

  loadMockEmployees(): void {
    // Mock employee data for development
    this.employees = [
      { empID: 'EMP001', empName: 'John Smith', email: 'john.smith@company.com', windowsID: 'jsmith' },
      { empID: 'EMP002', empName: 'Jane Doe', email: 'jane.doe@company.com', windowsID: 'jdoe' },
      { empID: 'EMP003', empName: 'Mike Johnson', email: 'mike.johnson@company.com', windowsID: 'mjohnson' },
      { empID: 'EMP004', empName: 'Sarah Wilson', email: 'sarah.wilson@company.com', windowsID: 'swilson' },
      { empID: 'EMP005', empName: 'David Brown', email: 'david.brown@company.com', windowsID: 'dbrown' }
    ];
  }

  getEmployeeOptions(): EmployeeDto[] {
    return this.employees || [];
  }

  getEmployeeDisplayName(employee: EmployeeDto): string {
    return `${employee.empName} (${employee.empID})`;
  }

  refreshEmployees(): void {
    this.loadEmployees(this.selectedDepartment);
  }

  // Delete functionality methods
  confirmDeleteItem(item: PartsTestInfo): void {
    this.itemToDelete = item;
    this.showDeleteConfirm = true;
    this.deleteMessage = '';
    this.deleteError = '';
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.itemToDelete = null;
    this.deleteMessage = '';
    this.deleteError = '';
  }

  deleteItem(): void {
    if (!this.itemToDelete || !this.itemToDelete.rowIndex) {
      this.deleteError = 'Invalid item selected for deletion.';
      return;
    }

    this.isDeleting = true;
    this.deleteError = '';
    this.deleteMessage = '';
    
    const rowIndex = this.itemToDelete.rowIndex;
    const source = this.filterForm.get('source')?.value || 'PartsTest';

    this.reportService.deletePartsTestList(rowIndex, source).subscribe({
      next: (response: DeletePartsTestResponse) => {
        if (response.success) {
          this.deleteMessage = response.message || 'Parts test entry deleted successfully!';
          this.deleteError = '';
          
          // Refresh the data to show updated results
          setTimeout(() => {
            this.loadPartsTestData();
            this.cancelDelete();
          }, 1500);
        } else {
          this.deleteError = response.message || 'Failed to delete parts test entry.';
          this.deleteMessage = '';
        }
        this.isDeleting = false;
      },
      error: (error) => {
        console.error('Error deleting parts test entry:', error);
        this.deleteError = error.error?.message || 'Failed to delete parts test entry. Please try again.';
        this.deleteMessage = '';
        this.isDeleting = false;
      }
    });
  }

  bulkDeleteSelected(): void {
    // Future implementation for bulk delete if needed
    console.log('Bulk delete functionality can be implemented here');
  }
  
  // Legacy form methods
  onJobTypeChange(jobType: string): void {
    if (!jobType) return;
    
    // Matching legacy JavaScript OnChangeDDL() logic for conditional display
    // Reset all flags first for clean state
    this.showBoardSetup = false;
    this.showComponentWork = false;
    this.showAssemblyQC = false;

    // Set the appropriate flag based on job type
    if (jobType === '7') { // Board Setup
      this.showBoardSetup = true;
    } else if (jobType === '1' || jobType === '2' || jobType === '4') { // Fan Rebuild, Cap Assy, Batt Module
      this.showAssemblyQC = true;
    } else if (jobType === '3' || jobType === '6') { // Inventory, Retest
      this.showComponentWork = true;
    }
    
    // Trigger immediate change detection for instant UI update
    this.cdr.detectChanges();
    
    // Update form validation asynchronously to not block UI updates
    setTimeout(() => this.updateFormValidation(jobType), 0);
  }

  openTestProcedure(event?: Event): void {
    // Prevent default navigation if this is called from an anchor tag
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Create a temporary anchor element and trigger download/view
    const pdfUrl = '/DCG%20Procedures/DCG-QPM-FRM0065%20-%20ASSEMBLY-QUALITY%20CHECK%20LIST.pdf';
    
    // Try to open in new tab first
    try {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      
      // Programmatically click the link
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      // Fallback: Direct window navigation  
      window.open(pdfUrl, '_blank');
    }
  }
  
  updateFormValidation(jobType: string): void {
    // Add conditional validation based on job type - only update relevant fields
    const completedByControl = this.editForm.get('completedBy');
    const reviewedByControl = this.editForm.get('reviewedBy');
    
    if (jobType === '1' || jobType === '2' || jobType === '4') {
      // Fan Rebuild, Cap Assy, Batt Module require QC fields
      completedByControl?.setValidators([Validators.required]);
      reviewedByControl?.setValidators([Validators.required]);
    } else {
      // Other job types don't require these fields
      completedByControl?.clearValidators();
      reviewedByControl?.clearValidators();
    }
    
    // Only update validity for the changed controls, not all controls
    completedByControl?.updateValueAndValidity({ emitEvent: false });
    reviewedByControl?.updateValueAndValidity({ emitEvent: false });
  }
  
  onPassedCheck(): void {
    // Legacy validation for "Passed" checkbox
    const isPassed = this.editForm.get('isPassed')?.value;
    if (isPassed) {
      const reviewedBy = this.editForm.get('reviewedBy')?.value;
      const assyWorkStatus = this.editForm.get('assyWorkStatus')?.value;
      const completedBy = this.editForm.get('completedBy')?.value;
      
      if (!reviewedBy || reviewedBy === 'PS') {
        alert('You cannot check this till you select the Reviewed By dropdown.');
        this.editForm.patchValue({ isPassed: false });
        return;
      }
      
      if (assyWorkStatus !== '1') {
        alert('You cannot check this till you select the Assembly Status is completed.');
        this.editForm.patchValue({ isPassed: false });
        return;
      }
      
      if (!completedBy || completedBy === 'PS') {
        alert('You cannot check this till you select the Completed By dropdown.');
        this.editForm.patchValue({ isPassed: false });
        return;
      }
    }
  }
  
  validateWorkTypeSelection(): boolean {
    // Check if at least one work type is selected
    const workTypes = [
      'workType1', 'workType2', 'workType3', 'workType4',
      'workType5', 'workType6', 'workType7', 'workType8',
      'workType9', 'workType10', 'workType11', 'workType12'
    ];
    
    return workTypes.some(type => this.editForm.get(type)?.value);
  }
  
  generateAutoId(): void {
    // Generate auto ID similar to legacy form
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const id = Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    
    this.editForm.patchValue({
      autoGenYr: year,
      autoGenMon: month,
      autoGenDay: day,
      autoGenID: id
    });
  }

  clearForm(): void {
    // Reset form to initial state
    this.editForm.reset();
    this.createEditForm();
    this.generateAutoId();
    
    // Reset display conditions
    this.showBoardSetup = false;
    this.showComponentWork = false;
    this.showAssemblyQC = false;
    
    // Clear messages
    this.saveMessage = '';
    this.saveError = '';
  }
}