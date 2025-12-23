import { Component, OnInit, AfterViewInit, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
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
export class PartsTestInfoComponent implements OnInit, AfterViewInit {

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
  
  // Dynamic button enabling
  isAddEntryEnabled: boolean = false;
  
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
    this.loadAllEmployees(); // Load employees from all departments
    // Start in edit mode like the legacy form
    this.createNewItem();
    // Setup subscriptions after form is created
    this.setupFormSubscriptions();
    // Initialize button state
    this.updateAddEntryButtonState();
  }

  ngAfterViewInit(): void {
    // Set up auto-resize for resolution textarea
    this.setupTextareaAutoResize();
  }

  handleQueryParams(): void {
    this.route.queryParamMap.subscribe((params) => {
      if (params.has('source')) {
        const source = params.get('source');
        this.filterForm.patchValue({ source });
      }
      
      if (params.has('rowIndex')) {
        const rowIndex = parseInt(params.get('rowIndex') || '0', 10);
        const source = params.get('source') || 'PartsTest';
        
        this.filterForm.patchValue({ 
          rowIndex: rowIndex,
          source: source
        });
        
        // Load the specific part's data for editing using just rowIndex
        this.loadSpecificPartForEditing(rowIndex);
      }
    });
  }

  loadSpecificPartForEditing(rowIndex: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.saveMessage = '';
    
    // Try different API approaches to get the specific part data
    const request: PartsTestRequest = {
      rowIndex: rowIndex,
      source: 'PartsTest'
    };

    this.reportService.getPartsTestList(request).subscribe({
      next: (response: PartsTestResponse) => {
        if (response.success && response.tables && response.tables.length > 0) {
          let foundPart: PartsTestInfo | null = null;
          
          response.tables.forEach(table => {
            if (table.rows) {
              table.rows.forEach(row => {
                const currentRowIndex = row.rowIndex || row.RowIndex || row.row_index;
                if (currentRowIndex === rowIndex || currentRowIndex === rowIndex.toString()) {
                  foundPart = this.convertRowToPartsTestInfo(row, table);
                }
              });
            }
          });
          
          if (foundPart) {
            this.editingItem = foundPart;
            this.editMode = true;
            this.populateFormWithPartData(foundPart);
            this.updateConditionalDisplay();
          } else {
            this.loadFromPartsTestStatusAPI(rowIndex);
          }
        } else {
          this.loadFromPartsTestStatusAPI(rowIndex);
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.loadFromPartsTestStatusAPI(rowIndex);
        this.isLoading = false;
      }
    });
  }

  loadSpecificPartForEditingWithData(partData: any): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    const request: PartsTestRequest = {
      rowIndex: partData.rowIndex,
      source: partData.source
    };

    // Load the specific part data using comprehensive search criteria
    this.reportService.getPartsTestList(request).subscribe({
      next: (response: PartsTestResponse) => {
        if (response.success && response.tables && response.tables.length > 0) {
          // Find the specific part using multiple criteria for better matching
          let foundPart: PartsTestInfo | null = null;
          
          response.tables.forEach(table => {
            if (table.rows) {
              table.rows.forEach(row => {
                // Match using multiple criteria for more accurate identification
                const matchesRowIndex = row.rowIndex === partData.rowIndex;
                const matchesDcgPartNo = row.dcgPartNo === partData.dcgPartNo || row.dcgPartNumber === partData.dcgPartNo;
                const matchesCallNbr = !partData.callNbr || row.callNbr === partData.callNbr || row.jobNumber === partData.callNbr;
                const matchesUniqueID = !partData.uniqueID || row.uniqueID === partData.uniqueID;
                
                if (matchesRowIndex || (matchesDcgPartNo && matchesCallNbr)) {
                  foundPart = this.convertRowToPartsTestInfo(row, table);
                  // If we found a match, populate with the passed data to ensure accuracy
                  this.enhancePartWithPassedData(foundPart, partData);
                }
              });
            }
          });
          
          if (foundPart) {
            // Populate the form with the found part data
            this.editingItem = foundPart;
            this.editMode = true;
            this.populateFormWithPartData(foundPart);
          } else {
            // If not found in API, create a new item with the passed data
            this.createItemWithPassedData(partData);
          }
        } else {
          // If API fails, create a new item with the passed data
          this.createItemWithPassedData(partData);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading specific part data:', error);
        // If API fails, create a new item with the passed data
        this.createItemWithPassedData(partData);
        this.isLoading = false;
      }
    });
  }

  enhancePartWithPassedData(part: PartsTestInfo, passedData: any): void {
    // Enhance the found part with data passed from navigation to ensure accuracy
    part.callNbr = passedData.callNbr || part.callNbr;
    part.dcgPartNo = passedData.dcgPartNo || part.dcgPartNo;
    part.siteID = passedData.siteID || part.siteID;
    part.make = passedData.make || part.make;
    part.model = passedData.model || part.model;
    part.serialNo = passedData.serialNo || part.serialNo;
    part.rowIndex = passedData.rowIndex || part.rowIndex;
  }

  createItemWithPassedData(partData: any): void {
    // Create a new item with the passed data if not found in API
    this.editingItem = null;
    this.editMode = true;
    this.saveMessage = '';
    this.saveError = '';
    
    // Reset form and populate with passed data
    this.editForm.reset();
    this.generateAutoId();
    
    // Populate form with the data passed from parts-test-status using correct field names
    this.editForm.patchValue({
      jobFrom: '3', // Default to Inventory
      jobNumber: partData.callNbr || '',
      siteID: partData.siteID || '',
      make: partData.make || '',
      model: partData.model || '',
      dcgPartNo: partData.dcgPartNo || '',
      serialNo: partData.serialNo || '',
      quantity: 1,
      isPassed: false,
      approved: false,
      createdBy: '',
      assignedTo: '',
      boardStatus: '0',
      testWorkStatus: '0'
    });
    
    // Update conditional display
    this.updateConditionalDisplay();

  }

  populateFormWithPartData(part: PartsTestInfo): void {
    const rawCreatedBy = part.createdBy || (part as any).CreatedBy || '';
    const mappedCreatedBy = this.mapEmployeeName(rawCreatedBy);
    
    const formData = {
      jobFrom: part.jobFrom || '3',
      jobNumber: part.callNbr || '',
      siteID: part.siteID || '',
      make: part.make || '',
      model: part.model || '',
      voltage: part.voltage || '',
      kva: part.kva || '',
      manufPartNo: part.partNumber || part.manufPartNo || '',
      dcgPartNo: part.dcgPartNo || '',
      quantity: part.quantity || 1,
      serialNo: part.serialNo || '',
      description: part.description || '',
      problemNotes: part.problemNotes || '',
      resolveNotes: part.resolveNotes || '',
      createdBy: mappedCreatedBy,
      assignedTo: part.assignedTo || (part as any).AssignedTo || '',
      dueDate: this.formatDateForInput(part.dueDate || (part as any).DueDate),
      boardStatus: part.boardStatus || '0',
      testWorkStatus: part.testWorkStatus || '0',
      isPassed: part.isPassed || false,
      approved: part.approved || false,
      // Assembly & QC fields
      completedBy: part.completedBy || '',
      reviewedBy: part.reviewedBy || '',
      assyProcFollowed: part.assyProcFollowed || '',
      assyWorkStatus: part.assyWorkStatus || '0',
      qcProcFollowed: part.qcProcFollowed || '',
      qcApproved: part.qcApproved || '',
      qcWorkStatus: part.qcWorkStatus || '0'
    };
    
    // Populate the edit form with the part data using correct field names
    this.editForm.patchValue(formData);
    

    
    // Handle work types if available (e.g., "2,7,8,11" -> set workType2, workType7, etc.)
    if (part.workType) {

      const workTypes = part.workType.toString().split(',').map(wt => wt.trim());
      workTypes.forEach(wt => {
        const workTypeControl = `workType${wt}`;
        if (this.editForm.get(workTypeControl)) {

          this.editForm.patchValue({ [workTypeControl]: true });
        }
      });
    }

    // Handle Assembly Work Done checkboxes (e.g., "1,2,4,5" -> set assyWork1, assyWork2, etc.)
    if (part.assyWorkDone) {

      const assyWorks = part.assyWorkDone.toString().split(',').map(aw => aw.trim());
      assyWorks.forEach(aw => {
        const assyWorkControl = `assyWork${aw}`;
        if (this.editForm.get(assyWorkControl)) {

          this.editForm.patchValue({ [assyWorkControl]: true });
        }
      });
    }

    // Handle QC Work Done checkboxes (e.g., "1,2,3" -> set qcWork1, qcWork2, etc.)
    if (part.qcWorkDone) {

      const qcWorks = part.qcWorkDone.toString().split(',').map(qw => qw.trim());
      qcWorks.forEach(qw => {
        const qcWorkControl = `qcWork${qw}`;
        if (this.editForm.get(qcWorkControl)) {

          this.editForm.patchValue({ [qcWorkControl]: true });
        }
      });
    }
    

    
    // Update conditional display based on job type
    this.updateConditionalDisplay();
  }

  convertRowToPartsTestInfo(row: PartsTestRow, table: PartsTestTable): PartsTestInfo {
    const converted = {
      id: row.id || row.Id || 0,
      rowIndex: row.rowIndex || row.RowIndex || 0,
      jobFrom: row.jobFrom || row.JobFrom || '3',
      callNbr: row.callNbr || row.CallNbr || row.jobNumber || '',
      siteID: row.siteID || row.SiteID || row.siteId || '',
      make: row.make || row.Make || '',
      model: row.model || row.Model || '',
      voltage: row.voltage || row.Voltage || '',
      kva: row.kva || row.KVA || '',
      partNumber: row.partNumber || row.manufPartNo || row.ManufPartNo || '',
      manufPartNo: row.manufPartNo || row.ManufPartNo || '',
      dcgPartNo: row.dcgPartNo || row.DCGPartNo || row.dcgPartNumber || '',
      quantity: row.quantity || row.Quantity || 1,
      serialNo: row.serialNo || row.SerialNo || row.serialNumber || '',
      description: row.description || row.Description || '',
      problemNotes: row.problemNotes || row.ProblemNotes || row.deficiencyNotes || '',
      resolveNotes: row.resolveNotes || row.ResolveNotes || row.resolutionNotes || '',
      createdBy: row.createdBy || row.CreatedBy || '',
      assignedTo: row.assignedTo || row.AssignedTo || '',
      dueDate: row.dueDate || row.DueDate || null,
      priority: row.priority || row.Priority || '1',
      boardStatus: row.boardStatus || row.BoardSetupStatus || '0',
      testWorkStatus: row.testWorkStatus || row.TestWorkStatus || '0',
      isPassed: row.isPassed || row.IsPassed || false,
      approved: row.approved || row.Approved || false,
      lastModifiedBy: row.lastModifiedBy || row.LastModifiedBy || '',
      workType: row.workType || row.WorkType || '',
      // Assembly & QC fields
      completedBy: row.completedBy || row.CompletedBy || '',
      reviewedBy: row.reviewedBy || row.ReviewedBy || '',
      assyWorkDone: row.assyWorkDone || row.AssyWorkDone || '',
      assyProcFollowed: row.assyProcFollowed || row.AssyProcFollowed || '',
      assyWorkStatus: row.assyWorkStatus || row.AssyWorkStatus || '0',
      qcWorkDone: row.qcWorkDone || row.QCWorkDone || '',
      qcProcFollowed: row.qcProcFollowed || row.QCProcFollowed || '',
      qcApproved: row.qcApproved || row.QCApproved || '',
      qcWorkStatus: row.qcWorkStatus || row.QCWorkStatus || '0'
    };
    
    return converted;
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

    // Subscribe to form value changes to update Add Entry button state
    this.editForm.valueChanges.subscribe(() => {
      this.updateAddEntryButtonState();
    });
  }

  updateConditionalDisplay(): void {
    const jobType = this.editForm.get('jobFrom')?.value;
    if (jobType) {
      this.onJobTypeChange(jobType);
    }
  }

  createNewItemWithRowIndex(rowIndex: number): void {
    // Create a new item with the specific rowIndex for editing
    this.editingItem = null;
    this.editMode = true;
    this.saveMessage = '';
    this.saveError = '';
    
    // Reset form and set default values
    this.editForm.reset();
    this.generateAutoId();
    
    // Set the rowIndex in the filterForm to maintain context
    this.filterForm.patchValue({ rowIndex: rowIndex });
    
    // Set default form values for new entry
    this.editForm.patchValue({
      jobFrom: '3', // Default to Inventory
      quantity: 1,
      isPassed: false,
      approved: false,
      createdBy: '', // Will be set when user selects
      assignedTo: '',
      dueDate: null, // Will be set when user selects
      boardStatus: '0',
      testWorkStatus: '0'
    });
    
    this.updateConditionalDisplay();

  }

  loadFromPartsTestStatusAPI(rowIndex: number): void {
    const statusRequest = {
      jobType: 'All',
      priority: 'All',
      archive: false,
      make: 'All',
      model: 'All'
    };
    
    this.reportService.getPartsTestStatus(statusRequest).subscribe({
      next: (statusResponse) => {
        if (statusResponse.success && statusResponse.data?.partsTestData) {
          const matchingPart = statusResponse.data.partsTestData.find(
            part => part.rowIndex === rowIndex || part.rowIndex?.toString() === rowIndex.toString()
          );
          
          if (matchingPart) {
            this.populateFormFromStatusData(matchingPart, rowIndex);
          } else {
            this.createNewItemWithRowIndex(rowIndex);
          }
        } else {
          this.createNewItemWithRowIndex(rowIndex);
        }
      },
      error: (error) => {
        this.createNewItemWithRowIndex(rowIndex);
      }
    });
  }

  populateFormFromStatusData(statusPart: any, rowIndex: number): void {


    
    // Map job type from parts-test-status to parts-test-info format
    let jobFromValue = '3'; // Default to Inventory
    
    // You may need to adjust this mapping based on your actual job type values
    if (statusPart.callNbr && statusPart.callNbr.trim() !== '') {
      jobFromValue = '1'; // Likely from a service call/job
    }
    

    
    this.editingItem = null;
    this.editMode = true;
    this.saveMessage = '';
    this.saveError = '';
    
    // Check if editForm exists
    if (!this.editForm) {
      console.error('❌ editForm is not initialized!');
      return;
    }
    
    // Reset and populate form with status data
    this.editForm.reset();
    
    this.generateAutoId();
    
    const formData = {
      jobFrom: jobFromValue,
      jobNumber: statusPart.callNbr || '',
      siteID: statusPart.siteID || '',
      make: statusPart.make || '',
      model: statusPart.model || '',
      manufPartNo: statusPart.manufPartNo || '',
      dcgPartNo: statusPart.dcgPartNo || '',
      quantity: statusPart.quantity || 1,
      serialNo: statusPart.serialNo || '',
      description: statusPart.description || '',
      problemNotes: statusPart.problemNotes || '',
      resolveNotes: statusPart.resolveNotes || '',
      createdBy: (() => {
        const rawValue = statusPart.createdBy || statusPart.CreatedBy || '';
        const mappedValue = this.mapEmployeeName(rawValue);

        return mappedValue;
      })(),
      assignedTo: statusPart.assignedTo || statusPart.AssignedTo || '',
      dueDate: this.formatDateForInput(statusPart.dueDate || statusPart.DueDate),
      isPassed: statusPart.isPassed || false,
      approved: false,
      boardStatus: '0',
      testWorkStatus: '0'
    };
    

    
    // Check if each form control exists before patching
    Object.keys(formData).forEach(key => {
      const control = this.editForm.get(key);
      if (!control) {
        console.warn(`⚠️ Form control '${key}' not found in editForm`);
      } else {

      }
    });
    
    this.editForm.patchValue(formData);
    

    
    // Set the rowIndex in the filter form
    this.filterForm.patchValue({ rowIndex: rowIndex });

    
    this.updateConditionalDisplay();
    

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
      createdBy: row['CreatedBy'] || row['createdBy'] || row['created_by'],
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

  // Helper method to format date for HTML date input (YYYY-MM-DD format)
  formatDateForInput(value: any): string | null {
    if (!value) return null;
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
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
    this.router.navigate(['/reports/parts-test-status']);
  }

  viewDetails(item: PartsTestInfo): void {
    // Navigate to detailed view or open modal

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
    
    // Update button state after form initialization
    setTimeout(() => this.updateAddEntryButtonState(), 0);
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
    
    // Job From validation (required field)
    if (!formValue.jobFrom || formValue.jobFrom === '') {
      alert('One or more of the required fields is incomplete.\nPlease select \'Job Type\' and resave your Part.');
      return false;
    }
    
    // Required field validations matching legacy JavaScript
    if (!formValue.manufPartNo?.trim()) {
      alert('One or more of the required fields is incomplete.\nPlease enter \'Manuf Part Number\' and resave your Part.');
      return false;
    }
    
    if (!formValue.dcgPartNo?.trim()) {
      alert('One or more of the required fields is incomplete.\nPlease enter \'DCGroup Part Number\' and resave your Part.');
      return false;
    }
    
    // Quantity validation - must be numeric first
    if (formValue.quantity && isNaN(Number(formValue.quantity))) {
      alert('Please enter only numeric values for Quantity, Year, KVA, and other number fields.');
      return false;
    }
    
    if (!formValue.quantity || formValue.quantity <= 0) {
      alert('One or more of the required fields is incomplete.\nPlease enter \'Quantity\' and resave your Part.');
      return false;
    }
    
    // Quantity range validation (typical enterprise limit)
    if (formValue.quantity > 9999) {
      alert('Quantity cannot exceed 9999. Please enter a valid quantity.');
      return false;
    }
    
    // Numeric field validations
    if (formValue.kva && isNaN(Number(formValue.kva))) {
      alert('Please enter only numeric values for Quantity, Year, KVA, and other number fields.');
      return false;
    }
    
    if (formValue.voltage && isNaN(Number(formValue.voltage))) {
      alert('Please enter only numeric values for Quantity, Year, KVA, and other number fields.');
      return false;
    }
    
    // String length validations for data integrity
    if (formValue.manufPartNo && formValue.manufPartNo.length > 50) {
      alert('Manufacturer Part Number cannot exceed 50 characters.');
      return false;
    }
    
    if (formValue.dcgPartNo && formValue.dcgPartNo.length > 50) {
      alert('DCG Part Number cannot exceed 50 characters.');
      return false;
    }
    
    if (formValue.serialNo && formValue.serialNo.length > 50) {
      alert('Serial Number cannot exceed 50 characters.');
      return false;
    }
    
    // Special character validation for part numbers (common business rule)
    const partNumberPattern = /^[A-Za-z0-9\-_#\/\s]+$/;
    if (formValue.manufPartNo && !partNumberPattern.test(formValue.manufPartNo)) {
      alert('Manufacturer Part Number contains invalid characters. Only alphanumeric, hyphens, underscores, hash, slash, and spaces are allowed.');
      return false;
    }
    
    if (formValue.dcgPartNo && !partNumberPattern.test(formValue.dcgPartNo)) {
      alert('DCG Part Number contains invalid characters. Only alphanumeric, hyphens, underscores, hash, slash, and spaces are allowed.');
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
        alert('Due Date must be greater than today\'s date.');
        return false;
      }
    }

    // Priority vs Due Date validation - Calculate auto priority first
    const autoPriority = this.getPriorityFromDueDate(new Date(formValue.dueDate));
    const today = new Date();
    const dueDate = new Date(formValue.dueDate);
    const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Legacy priority validation with exact alert messages
    if (autoPriority === 'Urgent' && daysDiff > 7) {
      alert('If you select priority as Urgent then Due Date must be within 7 Days.');
      return false;
    } else if (autoPriority === 'High' && daysDiff > 30) {
      alert('If you select priority as High then Due Date must be within 30 Days.');
      return false;
    } else if (autoPriority === 'Normal' && daysDiff > 90) {
      alert('If you select priority as Normal then Due Date must be within 90 Days.');
      return false;
    }

    // Conditional resolve notes validation (when status is completed)
    if (formValue.testWorkStatus === '1' || formValue.assyWorkStatus === '1' || formValue.qcWorkStatus === '1') {
      if (!formValue.resolveNotes?.trim()) {
        alert('Please enter \'after testing notes\' and resave your Part.');
        return false;
      }
      
      // Minimum length validation for resolve notes
      if (formValue.resolveNotes.trim().length < 10) {
        alert('After Testing Notes must be at least 10 characters long when status is Completed.');
        return false;
      }
    }
    
    // Problem notes minimum length validation
    if (formValue.problemNotes && formValue.problemNotes.trim().length < 5) {
      alert('Deficiency notes must be at least 5 characters long.');
      return false;
    }
    
    // Text field length validations
    if (formValue.problemNotes && formValue.problemNotes.length > 500) {
      alert('Deficiency notes cannot exceed 500 characters.');
      return false;
    }
    
    if (formValue.resolveNotes && formValue.resolveNotes.length > 500) {
      alert('After Testing Notes cannot exceed 500 characters.');
      return false;
    }
    
    // Description length validation
    if (formValue.description && formValue.description.length > 255) {
      alert('Description cannot exceed 255 characters.');
      return false;
    }
    
    // QC validation for specific job types
    if (formValue.jobFrom === '1' || formValue.jobFrom === '2' || formValue.jobFrom === '4') {
      if (formValue.qcWorkStatus === '1') {
        if (!this.validateQCWorkSelection(formValue)) {
          return false;
        }
      }
    }
    
    // Approval validations - matching legacy logic
    if (formValue.approved === true) {
      // Board Setup jobs - different validation
      if (formValue.jobFrom === '7') {
        if (!formValue.boardSetupStatus || formValue.boardSetupStatus !== '1') {
          alert('You cannot approve this because board setup dropdown is not completed.');
          return false;
        }
      } else {
        // Other job types - all statuses must be completed
        if (formValue.testWorkStatus !== '1' || formValue.assyWorkStatus !== '1' || formValue.qcWorkStatus !== '1') {
          alert('You cannot approve this because the status of this part is not completed.');
          return false;
        }
      }
    }
    
    // Passed validations - matching legacy logic
    if (formValue.isPassed === true) {
      if (!formValue.reviewedBy || formValue.reviewedBy === 'PS') {
        alert('You cannot check this till you select the Reviewed By dropdown.');
        return false;
      }
      
      if (formValue.assyWorkStatus !== '1') {
        alert('You cannot check this till you select the Assembly Status is completed.');
        return false;
      }
      
      if (!formValue.completedBy || formValue.completedBy === 'PS') {
        alert('You cannot check this till you select the Completed By dropdown.');
        return false;
      }
    }
    
    // Board Setup validation for Job Type 7 (Board Setup jobs)
    if (formValue.jobFrom === '7') {
      if (!formValue.boardSetupStatus || formValue.boardSetupStatus === '0') {
        alert('Board Setup Status must be "Completed" for Board Setup jobs.');
        return false;
      }
    }
    
    // Complete approval validation (for non-Board Setup jobs)
    if (formValue.jobFrom !== '7') {
      if (formValue.testWorkStatus === '1' || formValue.assyWorkStatus === '1' || formValue.qcWorkStatus === '1') {
        // Ensure personnel dropdowns are not "Please Select"
        if (!formValue.completedBy || formValue.completedBy === 'PS') {
          alert('Please select "Completed By" personnel for approved entries.');
          return false;
        }
        if (!formValue.reviewedBy || formValue.reviewedBy === 'PS') {
          alert('Please select "Reviewed By" personnel for approved entries.');
          return false;
        }
        
        // Prevent same person from completing and reviewing (separation of duties)
        if (formValue.completedBy === formValue.reviewedBy) {
          alert('The same person cannot both complete and review the work. Please select different personnel.');
          return false;
        }
      }
    }
    
    // Assembly work validation - ensure at least one assy work is done if status is completed
    if (formValue.assyWorkStatus === '1') {
      if (!formValue.assyWork1 && !formValue.assyWork2 && !formValue.assyWork3) {
        alert('You must check at least one Assembly Work Done option when Assembly Status is Completed.');
        return false;
      }
      
      if (!formValue.assyProcFollowed) {
        alert('Assembly Procedures Followed must be selected when Assembly Status is Completed.');
        return false;
      }
    }
    
    // Component work validation - ensure at least one comp work is done if status is completed
    if (formValue.partRepairStatus === '1') {
      if (!formValue.compWork1 && !formValue.compWork2 && !formValue.compWork3 && !formValue.compWork4 && !formValue.compWork5) {
        alert('You must check at least one Component Work Done option when Part Repair Status is Ready For Test.');
        return false;
      }
    }
    
    // Test work validation - ensure at least one test work is done if status is completed
    if (formValue.testWorkStatus === '1') {
      if (!formValue.testWork1 && !formValue.testWork2 && !formValue.testWork3 && !formValue.testWork4 && !formValue.testWork5) {
        alert('You must check at least one Testing Work Done option when Test Work Status is Completed.');
        return false;
      }
    }
    
    // Due date business logic - cannot be more than 1 year in future
    if (formValue.dueDate) {
      const dueDate = new Date(formValue.dueDate);
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      
      if (dueDate > oneYearFromNow) {
        alert('Due date cannot be more than one year in the future.');
        return false;
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
  loadAllEmployees(): void {
    this.isLoadingEmployees = true;
    const departments = ['TC', 'QC', 'SM', 'PP', 'ALL'];
    const allEmployees: EmployeeDto[] = [];
    let completedRequests = 0;
    
    departments.forEach(department => {
      this.reportService.getEmployeeNamesByDept(department).subscribe({
        next: (response: EmployeeResponse) => {
          if (response.success && response.employees) {
            // Add employees from this department, avoiding duplicates
            response.employees.forEach(emp => {
              if (!allEmployees.find(existing => existing.empName === emp.empName)) {
                allEmployees.push(emp);
              }
            });
          }
          completedRequests++;
          
          // When all departments are loaded, set the employees list
          if (completedRequests === departments.length) {
            this.employees = allEmployees.sort((a, b) => (a.empName || '').localeCompare(b.empName || ''));
            this.isLoadingEmployees = false;
          }
        },
        error: (error) => {
          console.error(`Error loading employees from department ${department}:`, error);
          completedRequests++;
          if (completedRequests === departments.length) {
            this.employees = allEmployees.sort((a, b) => (a.empName || '').localeCompare(b.empName || ''));
            this.isLoadingEmployees = false;
          }
        }
      });
    });
  }

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
    // The employee names from the system are already in good format, just capitalize properly
    const empName = employee.empName || '';
    
    // Capitalize first letter of each word for better display
    const capitalizedName = empName.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    return capitalizedName;
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
  
  /**
   * Check if all required fields are filled (matching legacy requirements)
   */
  checkRequiredFieldsForButtonEnable(): boolean {
    if (!this.editForm) return false;
    
    const formValue = this.editForm.value;
    
    // Check all required fields based on legacy validation
    const hasManufPartNo = formValue.manufPartNo?.trim();
    const hasDcgPartNo = formValue.dcgPartNo?.trim();
    const hasValidQuantity = formValue.quantity && formValue.quantity > 0;
    const hasWorkType = this.validateWorkTypeSelection();
    const hasCreatedBy = formValue.createdBy && formValue.createdBy !== 'PS' && formValue.createdBy !== '';
    const hasAssignedTo = formValue.assignedTo && formValue.assignedTo !== 'PS' && formValue.assignedTo !== '';
    const hasDueDate = formValue.dueDate;
    const hasProblemNotes = formValue.problemNotes?.trim();
    
    return hasManufPartNo && hasDcgPartNo && hasValidQuantity && hasWorkType && 
           hasCreatedBy && hasAssignedTo && hasDueDate && hasProblemNotes;
  }
  
  /**
   * Update the Add Entry button enabled state
   */
  updateAddEntryButtonState(): void {
    this.isAddEntryEnabled = this.checkRequiredFieldsForButtonEnable();
  }
  
  /**
   * Allow only numeric input for integer fields (keypress event)
   */
  onlyNumbers(event: KeyboardEvent): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    // Allow: backspace, delete, tab, escape, enter, home, end, left, right, down, up
    if ([8, 9, 27, 13, 46, 35, 36, 37, 39, 38, 40].indexOf(charCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
        (charCode === 65 && event.ctrlKey === true) || // Ctrl+A
        (charCode === 67 && event.ctrlKey === true) || // Ctrl+C
        (charCode === 86 && event.ctrlKey === true) || // Ctrl+V
        (charCode === 88 && event.ctrlKey === true) || // Ctrl+X
        (charCode === 90 && event.ctrlKey === true)) { // Ctrl+Z
      return true;
    }
    // Ensure that it is a number and stop the keypress
    if ((charCode < 48 || charCode > 57)) {
      event.preventDefault();
      return false;
    }
    return true;
  }
  
  /**
   * Allow only positive decimal numbers (for KVA, Voltage fields)
   */
  onlyNumbersAndDecimal(event: KeyboardEvent): boolean {
    const charCode = (event.which) ? event.which : event.keyCode;
    // Allow: backspace, delete, tab, escape, enter, home, end, left, right, down, up
    if ([8, 9, 27, 13, 46, 35, 36, 37, 39, 38, 40].indexOf(charCode) !== -1 ||
        // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
        (charCode === 65 && event.ctrlKey === true) || // Ctrl+A
        (charCode === 67 && event.ctrlKey === true) || // Ctrl+C
        (charCode === 86 && event.ctrlKey === true) || // Ctrl+V
        (charCode === 88 && event.ctrlKey === true) || // Ctrl+X
        (charCode === 90 && event.ctrlKey === true)) { // Ctrl+Z
      return true;
    }
    
    const inputElement = event.target as HTMLInputElement;
    const currentValue = inputElement.value;
    
    // Allow decimal point only if there isn't one already
    if (charCode === 46 && currentValue.indexOf('.') === -1) {
      return true;
    }
    
    // Ensure that it is a number and stop the keypress
    if ((charCode < 48 || charCode > 57) && charCode !== 46) {
      event.preventDefault();
      return false;
    }
    return true;
  }
  
  /**
   * Handle paste event to ensure only numeric values are pasted
   */
  onPasteNumbers(event: ClipboardEvent): void {
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData?.getData('text') || '';
    
    // Check if pasted text contains only numbers
    if (!/^\d+$/.test(pastedText)) {
      event.preventDefault();
      return;
    }
  }
  
  /**
   * Handle paste event for decimal numbers
   */
  onPasteDecimals(event: ClipboardEvent): void {
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData?.getData('text') || '';
    
    // Check if pasted text is a valid decimal number
    if (!/^\d+\.?\d*$/.test(pastedText)) {
      event.preventDefault();
      return;
    }
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
    
    // Update button state after clearing form
    setTimeout(() => this.updateAddEntryButtonState(), 0);
  }

  // Event handler for textarea input to auto-resize
  onTextareaInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(120, textarea.scrollHeight) + 'px';
    }
  }

  // Map API employee names to actual employee names in the system
  private mapEmployeeName1(apiEmployeeName: string): string {
    if (!apiEmployeeName) {
      return '';
    }
    
    // Special case mappings for names that don't follow the standard pattern
    const specialCases: { [key: string]: string } = {
      'ADAM.KEITH': 'adam keith',
      'ANTHONY.KEITH': 'adam keith',
      'PS': 'PS',
      'DCGPARTS': 'DCGPARTS',
      'TOU LEE. CHANG': 'Tou Lee Chang',
      'ANTONIA.D\'HUYVETTER': 'Antonia D\'Huyvetter',
      'BRUCE.BISTOL': 'Bruce Bristol', // Assuming this is same as BRUCE.BRISTOL
      'BRUCE.BRISTOL': 'Bruce Bristol'
    };
    
    // Check special cases first
    const specialMatch = specialCases[apiEmployeeName.toUpperCase()];
    if (specialMatch) {
      return specialMatch;
    }
    
    // Auto-convert FIRSTNAME.LASTNAME to Firstname Lastname format
    if (apiEmployeeName.includes('.') && !apiEmployeeName.includes(' ')) {
      const parts = apiEmployeeName.split('.');
      if (parts.length === 2) {
        const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
        const lastName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
        const convertedName = `${firstName} ${lastName}`;
        
        // Check if this converted name exists in employee list
        const found = this.employees.find(emp => {
          const empName = (emp.empName || '').toLowerCase();
          const searchName = convertedName.toLowerCase();
          return empName === searchName || empName.includes(searchName) || searchName.includes(empName);
        });
        
        if (found) {
          return found.empName || '';
        }
        
        // If not found in employee list, return the converted name anyway
        return convertedName;
      }
    }
    
    // Try to find partial matches in the employee list
    const found = this.employees.find(emp => {
      const empName = (emp.empName || '').toUpperCase();
      const searchName = apiEmployeeName.toUpperCase();
      
      // Check if employee name contains parts of the search name
      const tomMatch = empName.includes('TOM') && searchName.includes('TOM') ||
                      empName.includes('PAREDES') && searchName.includes('PAREDES') ||
                      empName.includes('TPADRES') && (searchName.includes('TOM') || searchName.includes('PAREDES'));
      
      const anthonyMatch = empName.includes('AKEITH') && (searchName.includes('ANTHONY') || searchName.includes('KEITH'));
      
      const generalMatch = empName.includes(searchName.replace(/[.\s]/g, '')) ||
                          searchName.includes(empName.replace(/[.\s]/g, ''));
      
      return tomMatch || anthonyMatch || generalMatch;
    });
    
    if (found) {
      return found.empName || '';
    }
    
    // Last resort: try to find any employee with similar name parts
    if (apiEmployeeName.toUpperCase().includes('TOM')) {
      const tomEmployee = this.employees.find(emp => 
        (emp.empName || '').toUpperCase().includes('TOM') || 
        (emp.empName || '').toUpperCase().includes('TPADRES')
      );
      if (tomEmployee) {
        return tomEmployee.empName || '';
      }
    }
    
    return ''; // Return empty string so dropdown shows "Select Employee"
  }

  // Utility method to set up auto-resize for textareas
  // private setupTextareaAutoResize(): void {
  //   // Use setTimeout to ensure DOM is ready
  //   setTimeout(() => {
  //     const textarea = document.querySelector('.auto-resize-textarea') as HTMLTextAreaElement;
  //     if (textarea) {
  //       // Auto-resize function
  //       const autoResize = () => {
  //         textarea.style.height = 'auto';
  //         textarea.style.height = Math.max(120, textarea.scrollHeight) + 'px';
  //       };

  //       // Initial resize
  //       autoResize();

  //       // Add event listeners for paste events
  //       textarea.addEventListener('paste', () => setTimeout(autoResize, 0));

  //       // Also listen to form value changes for programmatic updates
  //       this.editForm.get('resolveNotes')?.valueChanges.subscribe(() => {
  //         setTimeout(autoResize, 0);
  //       });
  //     }
  //   }, 100);
  // }

  // Event handler for textarea input to auto-resize
  // onTextareaInput(event: Event): void {
  //   const textarea = event.target as HTMLTextAreaElement;
  //   if (textarea) {
  //     textarea.style.height = 'auto';
  //     textarea.style.height = Math.max(120, textarea.scrollHeight) + 'px';
  //   }
  // }

  // Map API employee names to actual employee names in the system
  private mapEmployeeName(apiEmployeeName: string): string {
    if (!apiEmployeeName) {
      return '';
    }
    
    // Special case mappings for names that don't follow the standard pattern
    const specialCases: { [key: string]: string } = {
      'ADAM.KEITH': 'adam keith',
      'ANTHONY.KEITH': 'adam keith',
      'PS': 'PS',
      'DCGPARTS': 'DCGPARTS',
      'TOU LEE. CHANG': 'Tou Lee Chang',
      'ANTONIA.D\'HUYVETTER': 'Antonia D\'Huyvetter',
      'BRUCE.BISTOL': 'Bruce Bristol', // Assuming this is same as BRUCE.BRISTOL
      'BRUCE.BRISTOL': 'Bruce Bristol'
    };
    
    // Check special cases first
    const specialMatch = specialCases[apiEmployeeName.toUpperCase()];
    if (specialMatch) {
      return specialMatch;
    }
    
    // Auto-convert FIRSTNAME.LASTNAME to Firstname Lastname format
    if (apiEmployeeName.includes('.') && !apiEmployeeName.includes(' ')) {
      const parts = apiEmployeeName.split('.');
      if (parts.length === 2) {
        const firstName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
        const lastName = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
        const convertedName = `${firstName} ${lastName}`;
        
        // Check if this converted name exists in employee list
        const found = this.employees.find(emp => {
          const empName = (emp.empName || '').toLowerCase();
          const searchName = convertedName.toLowerCase();
          return empName === searchName || empName.includes(searchName) || searchName.includes(empName);
        });
        
        if (found) {
          return found.empName || '';
        }
        
        // If not found in employee list, return the converted name anyway
        return convertedName;
      }
    }
    
    // Try to find partial matches in the employee list
    const found = this.employees.find(emp => {
      const empName = (emp.empName || '').toUpperCase();
      const searchName = apiEmployeeName.toUpperCase();
      
      // Check if employee name contains parts of the search name
      const tomMatch = empName.includes('TOM') && searchName.includes('TOM') ||
                      empName.includes('PAREDES') && searchName.includes('PAREDES') ||
                      empName.includes('TPADRES') && (searchName.includes('TOM') || searchName.includes('PAREDES'));
      
      const anthonyMatch = empName.includes('AKEITH') && (searchName.includes('ANTHONY') || searchName.includes('KEITH'));
      
      const generalMatch = empName.includes(searchName.replace(/[.\s]/g, '')) ||
                          searchName.includes(empName.replace(/[.\s]/g, ''));
      
      return tomMatch || anthonyMatch || generalMatch;
    });
    
    if (found) {
      return found.empName || '';
    }
    
    // Last resort: try to find any employee with similar name parts
    if (apiEmployeeName.toUpperCase().includes('TOM')) {
      const tomEmployee = this.employees.find(emp => 
        (emp.empName || '').toUpperCase().includes('TOM') || 
        (emp.empName || '').toUpperCase().includes('TPADRES')
      );
      if (tomEmployee) {
        return tomEmployee.empName || '';
      }
    }
    
    return ''; // Return empty string so dropdown shows "Select Employee"
  }

  // Utility method to set up auto-resize for textareas
  private setupTextareaAutoResize(): void {
    // Use setTimeout to ensure DOM is ready
    setTimeout(() => {
      const textarea = document.querySelector('.auto-resize-textarea') as HTMLTextAreaElement;
      if (textarea) {
        // Auto-resize function
        const autoResize = () => {
          textarea.style.height = 'auto';
          textarea.style.height = Math.max(120, textarea.scrollHeight) + 'px';
        };

        // Initial resize
        autoResize();

        // Add event listeners for paste events
        textarea.addEventListener('paste', () => setTimeout(autoResize, 0));

        // Also listen to form value changes for programmatic updates
        this.editForm.get('resolveNotes')?.valueChanges.subscribe(() => {
          setTimeout(autoResize, 0);
        });
      }
    }, 100);
  }
}