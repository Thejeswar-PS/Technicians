import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, NavigationStart } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { catchError, EMPTY } from 'rxjs';
import { QuoteChartDetails } from 'src/app/_metronic/partials/content/widgets/charts/charts-custom-widget/charts-custom-widget.component';
import { Job } from 'src/app/core/model/job-model';
import { JobListRequest } from 'src/app/core/request-model/job-list-req';
import { CommonService } from 'src/app/core/services/common.service';
import { JobService } from 'src/app/core/services/job.service';
import { QuotesService } from 'src/app/core/services/quotes.service';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';
import { AuthService } from 'src/app/modules/auth';
import { QuoteDetailsModalComponent } from 'src/app/modules/quotes/modal/quote-details/quote-details.component';
import { QuoteSharedService } from 'src/app/modules/quotes/quote-shared.service';
import { JobEditComponent } from '../job-edit/job-edit.component';
import { ToastrService } from 'ngx-toastr';
import { GetNotes } from 'src/app/core/model/get-notes.model';
import { NotesViewComponent } from '../modal/notes-view/notes-view.component';
@Component({
  selector: 'app-job-list',
  templateUrl: './job-list.component.html',
  styleUrls: ['./job-list.component.scss']
})
export class JobListComponent implements OnInit {
  employeeStatus: string = '';
  pendingInitialLoad: boolean = false;
  selectedJobId:string | null = null;
  isOpenEquipementDetailModel: { [key: string]: boolean } = {};
  jobList : Job[] = [] ;
  jobListRequest : JobListRequest | any= {};
  accountManagers : any = [];
  technicians: any = [];
  quoteOwner: any;
  jobStatus: any[];
  quoteStatus : any = [];
  chartData : QuoteChartDetails[];
  fiscalYears : Array<string> = [];
  keyword: string = '';
  errorMessage: string = '';
  empID: string = '';
  userRole: string = '';
  fromEditPage: boolean = false;

  jobFilterForm: FormGroup;
  // Removed pagination - legacy doesn't use it
  // initialValues = {
  //   ownerId : ['All'],
  //   status : ['All'],
  //   year : [(new Date().getFullYear()).toString()],
  //   month : ['All'],
  //   type: ['All'],
  //   jobType : ['0'],
  //   serviceType: [''],
  //   jobId: [''],
  // }
  

  empName: string = '';

  months : any[] = [
     {Text : 'January',value:1 }
    ,{Text : 'February',value:2 }
    ,{Text : 'March',value:3 }
    ,{Text : 'April',value:4 }
    ,{Text : 'May',value:5 }
    ,{Text : 'June',value:6 }
    ,{Text : 'July',value:7 }
    ,{Text : 'August',value:8 }
    ,{Text : 'September',value:9 }
    ,{Text : 'October',value:10}
    ,{Text : 'November',value:11}
    ,{Text : 'December',value:12}
    ,{Text : 'All',value:0}
  ];
  sortedColumn: string = '';
  sortDirection: number = 1;

  sortTable(column: string): void {
    if (this.sortedColumn === column) {
      this.sortDirection = -this.sortDirection;
    } else {
      this.sortedColumn = column;
      this.sortDirection = 1;
    }
  
    this.jobList.sort((a, b) => {
      const aValue = (a as any)[column];
      const bValue = (b as any)[column];
  
      // Normalize nulls or undefined to a consistent value for sorting
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return 1 * this.sortDirection;  // push nulls to bottom
      if (bValue == null) return -1 * this.sortDirection;
  
      if (aValue < bValue) return -1 * this.sortDirection;
      if (aValue > bValue) return 1 * this.sortDirection;
      return 0;
    });
  }
  

  sortIcon(column: string): string {
    if (this.sortedColumn === column) {
      return this.sortDirection === 1 ? 'fa-sort-up' : 'fa-sort-down';
    }
    return 'fa-sort';
  }





  constructor(
    private fb: FormBuilder,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private router: Router,
    private quoteSharedService: QuoteSharedService,
    private filterDashboardService: DashboardFilterSharedService,
    private _jobService: JobService,
    private _toastrService: ToastrService,
    private _commonService: CommonService

    ) {

      router.events.subscribe((event) => {
        if (event instanceof NavigationStart) {
          let browserRefresh = !router.navigated;
        }
      });
    }

  ngOnInit(): void {
    let loadDefault = true;
    
    this.initializeFilterForm();
    this.LoadFilters();
    this.LoadFiscalYears();
    this.onFilterChanges();

    this.filterDashboardService.setHomePage(false);
    this.subscribeSharedServiceData();

    this.route.queryParamMap.subscribe((params) => {
      if(params.has('jobId') || params.has('CallNbr'))
      {
        // If the URL contains a jobId or CallNbr we should avoid the default Load
        // and instead let handleQueryParameters perform the search after filters are loaded
        loadDefault = false;
      }

    }
    );
    if(loadDefault)
    {
      this.Load(true);
    }
  }
  setQueryParamToFilter()
  {
      this.route.queryParamMap.subscribe((params) => {
        
        if(params.has('jobId'))
        {
          
          // this.SearchJobs();
        }

      }
    );
  }
  initializeFilterForm()
  {
    let userData = JSON.parse(localStorage.getItem("userData")!);
    console.log('User data from localStorage:', userData);
    console.log('userData.empID raw:', userData.empID);
    console.log('userData.empID type:', typeof userData.empID);
    console.log('userData.empID length:', userData.empID ? userData.empID.length : 'undefined');
    if (userData.empID) {
      console.log('userData.empID chars:', userData.empID.split('').map((c: string, i: number) => `${i}: '${c}' (${c.charCodeAt(0)})`));
    }
    this.empID = (userData.empID || '').trim();
    this.userRole = userData.role || '';
    console.log('Set empID to:', this.empID);
    console.log('empID length after trim:', this.empID.length);
    console.log('User role:', this.userRole);
    
    // Initialize based on user role like legacy
    let techId = 'All';
    let mgrId = 'All';
    let currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-based, API expects 1-based
    
    if (this.userRole === 'Technician' || this.userRole === 'TechManager') {
      techId = this.empID;
      currentMonth = 0; // Set to 'All' when tech is selected
    } else if (this.userRole === 'Manager' || this.userRole === 'Other') {
      mgrId = this.empID;
      currentMonth = 0; // Set to 'All' when manager is selected
    }
    
    // Initialize previous values for change detection
    this.previousTechId = techId;
    this.previousMgrId = mgrId;
    
    this.jobFilterForm = this.fb.group({
      empId: [this.empID],
      techId: [techId],
      mgrId: [mgrId],
      rbButton: [0], // 0=Active, 1=Archive
      currentYear: [new Date().getFullYear()],
      month: [currentMonth],
      jobId: [''],
    });
    
    console.log('Form initialized with empId:', this.jobFilterForm.get('empId')?.value);
    console.log('Form values:', this.jobFilterForm.value);
  }

  // Update openEquipementDetailModel to use consistent property name
  openEquipementDetailModel(callNbr: string, techName: string){
    const uniqueKey = `${callNbr}_${techName}`; // Create unique key using callNbr and techName
    console.log('Toggling equipment details for:', uniqueKey);
    this.selectedJobId = callNbr;
    this.isOpenEquipementDetailModel[uniqueKey] = !this.isOpenEquipementDetailModel[uniqueKey];
    console.log('Equipment details expanded:', this.isOpenEquipementDetailModel[uniqueKey]);
    
    // Load equipment data when expanding for the first time
    if (this.isOpenEquipementDetailModel[uniqueKey] && !this.equipmentCache[uniqueKey]) {
      console.log('Loading equipment data for:', callNbr);
      this._jobService.getEquipmentDetailsByCallNbr(callNbr).subscribe(data => {
        console.log('Equipment data loaded:', data);
        this.equipmentCache[uniqueKey] = data;
      });
    }
  }
  subscribeSharedServiceData()
  {
    this.quoteSharedService.setIsFromEdit$.subscribe((isFromEdit : boolean) => {
      if(isFromEdit)
      {
        this.fromEditPage = true;
      }
     });
  }

public Load(initialLoad: boolean = false)
{
  // If this is the initial load but we don't yet have employeeStatus or technicians, defer it
  if (initialLoad && (!this.employeeStatus || (Array.isArray(this.technicians) && this.technicians.length === 0))) {
    console.log('Deferring initial Load until employeeStatus and technicians are available');
    this.pendingInitialLoad = true;
    return;
  }

  // Always set jobListRequest with correct values before API call
  // Use get() to include disabled controls (disabled controls are omitted from form.value)
  const empId = this.jobFilterForm.get('empId')?.value ?? '';
  let techId = this.jobFilterForm.get('techId')?.value ?? '';
  let mgrId = this.jobFilterForm.get('mgrId')?.value ?? '';
  const rbButton = this.jobFilterForm.get('rbButton')?.value ?? 0;
  const currentYear = this.jobFilterForm.get('currentYear')?.value ?? new Date().getFullYear();
  const month = this.jobFilterForm.get('month')?.value ?? 0;

  const status = this.employeeStatus || this.userRole;
  if (status === 'Technician' || status === 'TechManager') {
    // Force techId to empId and mgrId to 'All'
    techId = empId;
    mgrId = 'All';
    // Ensure form controls reflect this state (without emitting change events)
    if (this.jobFilterForm.get('techId')?.value !== empId) {
      this.jobFilterForm.patchValue({ techId: empId }, { emitEvent: false });
    }
    if (this.jobFilterForm.get('mgrId')?.value !== 'All') {
      this.jobFilterForm.patchValue({ mgrId: 'All' }, { emitEvent: false });
    }
  }

  this.jobListRequest = {
    empId: empId,
    techId: techId,
    mgrId: mgrId,
    rbButton: rbButton,
    currentYear: currentYear,
    month: month
    // Exclude jobId - that's only for search
  };
  // Debugging: show the values that will be sent to the API
  console.log('Load pre-request values:', {
    empId: empId,
    techId: techId,
    mgrId: mgrId,
    rbButton: rbButton,
    currentYear: currentYear,
    month: month,
    userRole: this.userRole,
    employeeStatus: this.employeeStatus,
    techniciansLength: Array.isArray(this.technicians) ? this.technicians.length : 0,
    techniciansSample: Array.isArray(this.technicians) ? this.technicians.slice(0,3) : []
  });
  console.log('Load method - jobListRequest:', this.jobListRequest);
  console.log('Load method - form values:', this.jobFilterForm.value);
  this._jobService.getJobs(this.jobListRequest).pipe(
    catchError((err: any) => {
      let getList = localStorage.getItem('joblist');
      if(getList) this.jobList = JSON.parse(getList);
      this.errorMessage = 'Error loading jobs: ' + (err.message || 'Unknown error');
      return EMPTY;
    }
  )).subscribe((data: any)=> {
    if (data && data.length > 0) {
      this.jobList = data;
      this.errorMessage = '';
    } else {
      this.jobList = [];
      this.errorMessage = 'No results found';
    }
    localStorage.setItem("joblist", JSON.stringify(data))
  })
}
  private previousTechId: string = '';
  private previousMgrId: string = '';

  public onFilterChanges()
  {
    this.jobFilterForm.valueChanges.subscribe(selectedValue  => {
      console.log('Filter changed - selectedValue:', selectedValue);
      
      // Check if tech or manager filter changed (not month)
      const techChanged = this.previousTechId !== selectedValue.techId;
      const mgrChanged = this.previousMgrId !== selectedValue.mgrId;
      
      let effectiveMonth = parseInt(selectedValue.month);
      
      // Only auto-adjust month when tech or manager changes, not when month is manually selected
      if (techChanged || mgrChanged) {
        if (selectedValue.mgrId !== 'All' || selectedValue.techId !== 'All') {
          // Set month to 0 when either manager or tech is selected
          effectiveMonth = 0;
          this.jobFilterForm.patchValue({ month: 0 }, { emitEvent: false });
        } else if (selectedValue.mgrId === 'All' && selectedValue.techId === 'All') {
          // Reset to current month when both are set back to 'All'
          const currentMonth = new Date().getMonth() + 1;
          effectiveMonth = currentMonth;
          this.jobFilterForm.patchValue({ month: currentMonth }, { emitEvent: false });
        }
      }
      
      // Update previous values for next change detection
      this.previousTechId = selectedValue.techId;
      this.previousMgrId = selectedValue.mgrId;

      // Now set the request values with the effective month
      this.jobListRequest.empId = selectedValue.empId;
      this.jobListRequest.techId = selectedValue.techId;
      this.jobListRequest.mgrId = selectedValue.mgrId;
      this.jobListRequest.rbButton = parseInt(selectedValue.rbButton!);
      this.jobListRequest.currentYear = selectedValue.currentYear;
      this.jobListRequest.month = effectiveMonth; // Use the effective month
      
      console.log('Job request object:', this.jobListRequest);

      // Only load regular job list when jobId is empty (filter changes)
      if(selectedValue.jobId === '' || selectedValue.jobId == null)
      {
        this.Load(false);
      }
      // Don't automatically search when jobId changes - only on button click
    })
  }
  public SearchJobs()
  {
    let jobId = this.jobFilterForm.value.jobId;
    if (!jobId || jobId.trim() === '') {
      this._toastrService.error('Please enter a Job ID to search');
      return;
    }
    
    // Add prefix to job ID like legacy
    jobId = this.addPrefixToCallNbr(jobId);
    this.jobFilterForm.patchValue({ jobId: jobId }, { emitEvent: false });
    
    // Get current form values for techId and empId
    const techId = this.jobFilterForm.value.techId || 'All';
    const empId = this.empID;
    
    console.log('SearchJobs - Calling GetSearchedJob API with:', { jobId, techId, empId });

    // Call the new GetSearchedJob API (equivalent to GetJobInfo in legacy)
    this._jobService.getSearchedJob(jobId, techId, empId).pipe(
      catchError((error) => {
        console.error('Error searching jobs:', error);
        this.errorMessage = 'Error searching jobs: ' + (error.error?.message || error.message || 'Unknown error');
        this.jobList = [];
        return EMPTY;
      })
    ).subscribe((data: any) => {
      console.log('Search results received:', data);
      if (data && data.length > 0) {
        this.jobList = data;
        this.errorMessage = '';
        console.log('Found', data.length, 'job(s)');
      } else {
        this.jobList = [];
        this.errorMessage = 'No results found';
      }
      // Don't store search results in localStorage - they're temporary
    });
  }

  // Method to clear search and return to filtered list
  public clearSearch(): void {
    this.jobFilterForm.patchValue({ jobId: '' }, { emitEvent: false });
    this.Load(false); // Reload the filtered list
  }

  public LoadFilters()
  {
    let userData = JSON.parse(localStorage.getItem("userData")!);
    console.log('LoadFilters - User data from localStorage:', userData);
    this.empID = (userData.empID || '').trim();
    this.userRole = userData.role || '';
    console.log('LoadFilters - Set empID to:', this.empID);
    console.log('LoadFilters - User role:', this.userRole);

    // Update the form with the correct empID
    if (this.jobFilterForm) {
      this.jobFilterForm.patchValue({ empId: this.empID }, { emitEvent: false });
      console.log('Updated form empId to:', this.jobFilterForm.get('empId')?.value);
    }

    // Step 1: Load Account Managers first
    this.loadAccountManagers(userData);
  }

  private loadAccountManagers(userData: any) {
    // Try loading from localStorage first if not already loaded
    if (this.accountManagers.length <= 0) {
      try {
        const storedManagers = JSON.parse(localStorage.getItem("AccountManagers")!);
        if (storedManagers && storedManagers.length > 0) {
          console.log('Loading account managers from localStorage initially:', storedManagers);
          this.accountManagers = storedManagers;
          console.log('Sample manager structure:', storedManagers[0]);
        }
      } catch (e) {
        console.log('No valid account managers in localStorage, will load from API');
      }
    }

    // Load Account Managers from API
    this._commonService.getAccountManagers().pipe(
      catchError((error) => {
        console.error('Error loading account managers:', error);
        // Fallback to localStorage like other components
        try {
          const storedManagers = JSON.parse(localStorage.getItem("AccountManagers")!);
          if (storedManagers && storedManagers.length > 0) {
            console.log('Loading account managers from localStorage (fallback):', storedManagers);
            console.log('Sample manager from localStorage:', storedManagers[0]);
            this.accountManagers = storedManagers;
          }
        } catch (e) {
          console.error('Error loading from localStorage:', e);
        }
        return EMPTY;
      })
    ).subscribe((data: any)  => {
      console.log('Account Managers loaded from API:', data);
      if (data && data.length > 0) {
        console.log('Sample manager from API:', data[0]);
        this.accountManagers = data;
        // Store in localStorage for future fallback
        localStorage.setItem("AccountManagers", JSON.stringify(data));
      }
      console.log('Account Managers array:', this.accountManagers);
      
      // Step 2: After Account Managers are loaded, get Employee Status
      this.getEmployeeStatus(userData);
    });
  }

  private getEmployeeStatus(userData: any) {
    console.log('Step 2: Getting employee status for windowsID:', userData.windowsID);
    
    // Call GetEmployeeStatusForJobList with windowsID
    this._commonService.getEmployeeStatusForJobList(userData.windowsID).pipe(
      catchError((error) => {
        console.error('Error getting employee status:', error);
        // If error, proceed with default status or fallback
        this.loadTechnicians(userData, 'Active'); // Default status
        return EMPTY;
      })
    ).subscribe((statusData: any) => {
      console.log('Employee status received:', statusData);
      
      // Extract status from response array: [{"EmpID":"KARMA","Status":"Manager"}]
      let employeeStatus = 'Active'; // Default fallback
      if (statusData && Array.isArray(statusData) && statusData.length > 0) {
        employeeStatus = statusData[0].Status || 'Active';
        console.log('Extracted employee status:', employeeStatus);
      } else {
        console.log('No status data found, using default:', employeeStatus);
      }
      // Store employeeStatus for later use
      this.employeeStatus = employeeStatus;
      // Step 3: Load Technicians with EmpID and Status
      this.loadTechnicians(userData, employeeStatus);
    });
  }

  private loadTechnicians(userData: any, status: string) {
    console.log('Step 3: Loading technicians with EmpID:', this.empID, 'and Status:', status);
    
    // Call GetTechNamesByEmpID with EmpID and Status
    this._commonService.getTechNamesByEmpID(this.empID, status).pipe(
      catchError((error) => {
        console.error('Error loading technicians:', error);
        return EMPTY;
      })
    ).subscribe((data: any)  => {
      console.log('Technicians loaded:', data);
      console.log('Technicians array length:', data?.length);
      if (data && data.length > 0) {
        console.log('Sample technician:', data[0]);
        console.log('Sample technician TechID:', data[0].TechID);
        console.log('Sample technician TechName:', data[0].TechName);
      }
      this.technicians = data;
      console.log('Component technicians array:', this.technicians);
      
      // Set user role based selection logic after technicians are loaded
      this.setUserRoleBasedDefaults(userData);
      
      // Handle query parameters for specific job search
      this.handleQueryParameters();
      
      // If an initial load was deferred earlier because employeeStatus/technicians weren't ready, run it now
      if (this.pendingInitialLoad) {
        this.pendingInitialLoad = false;
        console.log('Running deferred initial Load now that technicians and employeeStatus are available');
        this.Load(true);
      }
    });
  }

  private setUserRoleBasedDefaults(userData: any) {
    // Set user role based selection logic using employeeStatus
    // Fallback to this.userRole if employeeStatus is not set
    const status = this.employeeStatus || this.userRole;
    if (status === 'Technician' || status === 'TechManager') {
      // Set techId to empID and restrict tech dropdown to only this tech
      this.jobFilterForm.patchValue({ techId: this.empID }, { emitEvent: false });
      // Remove 'All' and keep only the logged-in tech in technicians array
      if (Array.isArray(this.technicians)) {
        this.technicians = this.technicians.filter((t: any) => t.TechID === this.empID);
      }
      // Set mgrId to 'All' and disable AM dropdown
      this.jobFilterForm.patchValue({ mgrId: 'All' }, { emitEvent: false });
      if (this.jobFilterForm.get('mgrId')) {
        this.jobFilterForm.get('mgrId')?.disable({ emitEvent: false });
      }
      // Ensure month is 'All' (0) for technicians/managers
      if (this.jobFilterForm.get('month')?.value !== 0) {
        this.jobFilterForm.patchValue({ month: 0 }, { emitEvent: false });
      }
    } else if (status === 'Manager' || status === 'Other') {
      // Check if current user exists in account managers list
      const userManager = this.accountManagers.find((mgr: any) => 
        mgr.offid === this.empID || (mgr.offname && mgr.offname.trim() === this.empID)
      );
      if (userManager) {
        // The template sets option [value] to mgr.offname?.toUpperCase(), so set the form value to match
        const mgrValue = (userManager.offname || '').toUpperCase();
        this.jobFilterForm.patchValue({ mgrId: mgrValue }, { emitEvent: false });
      } else {
        this.jobFilterForm.patchValue({ mgrId: 'All' }, { emitEvent: false });
      }
      // Enable AM dropdown for managers/others
      if (this.jobFilterForm.get('mgrId')) {
        this.jobFilterForm.get('mgrId')?.enable({ emitEvent: false });
      }
      if (this.jobFilterForm.get('month')?.value !== 0) {
        this.jobFilterForm.patchValue({ month: 0 }, { emitEvent: false });
      }
    }
  }

  private handleQueryParameters() {
    // Handle query parameters for specific job search
    this.route.queryParamMap.subscribe((params) => {
      // Support both legacy 'jobId' and 'CallNbr' query params
      const incomingCall = params.get('jobId') || params.get('CallNbr');
      if (incomingCall) {
        // Patch the search field with the provided call number (trimmed)
        const callValue = (incomingCall || '').toString().trim();
        // If the incoming value looks like a numeric ID shorter than 10, let SearchJobs add leading zeros
        const normalized = this.addPrefixToCallNbr(callValue);

        // Decide sensible defaults for techId/mgrId:
        // If current user is a Technician (employeeStatus/userRole), set techId to their empID.
        // Otherwise default to 'All'. For managers, mgrId may be set to empID earlier in setUserRoleBasedDefaults.
        const isTech = (this.employeeStatus === 'Technician' || this.employeeStatus === 'TechManager' || this.userRole === 'Technician' || this.userRole === 'TechManager');
        const defaultTech = isTech ? (this.empID || 'All') : 'All';
        const defaultMgr = (this.employeeStatus === 'Manager' || this.userRole === 'Manager') ? (this.empID || 'All') : 'All';

        this.jobFilterForm.patchValue({
          jobId: normalized,
          techId: defaultTech,
          mgrId: defaultMgr
        }, { emitEvent: false });

        // Trigger the search after small delay to ensure form state settled
        setTimeout(() => this.SearchJobs(), 50);
      }
    });
  }

  LoadFiscalYears()
  {
    // Legacy logic: populate fiscal year dropdown with previous years
    var year = new Date().getFullYear();
    var yearTo = -2; // Can be made configurable like legacy (-10 for archived)
    
    for (let i = yearTo; i <= 1; i++)
    {
      this.fiscalYears.push((year + i).toString());
    }
  }

  // Legacy helper methods
  addPrefixToCallNbr(searchJob: string): string {
    let returnJob = '';
    try {
      const trimmed = searchJob.trim();
      if (trimmed.length > 0 && trimmed.length < 10) {
        const zeros = '0'.repeat(10 - trimmed.length);
        returnJob = zeros + trimmed;
      } else if (trimmed.length >= 10) {
        returnJob = trimmed.substring(0, 10);
      }
    } catch {
      returnJob = '';
    }
    return returnJob;
  }

  getStatusIcon(status: string | null): { icon: string, tooltip: string, color: string, symbol: string } {
    const safeStatus = status || '';
    switch (safeStatus) {
      case 'A': return { icon: '', tooltip: 'Off-Line', color: '#dc3545', symbol: '🔴' }; // Red
      case 'B': return { icon: '', tooltip: 'On-Line(Major Deficiency)', color: '#fd7e14', symbol: '🟠' }; // Orange
      case 'C': return { icon: '', tooltip: 'On-Line(Minor Deficiency)', color: '#ffc107', symbol: '🟡' }; // Yellow
      case 'E': return { icon: '', tooltip: 'Critical Deficiency', color: '#dc3545', symbol: '🔴' }; // Red
      case 'F': return { icon: '', tooltip: 'Replacement Recommended', color: '#fd7e14', symbol: '🟠' }; // Orange
      case 'G': return { icon: '', tooltip: 'Proactive Replacement', color: '#00cdcd', symbol: '🔵' }; // Blue
      default: return { icon: '', tooltip: 'On-Line', color: '#198754', symbol: '🟢' }; // Green
    }
  }

  isAccountManagerColumnVisible(): boolean {
    // Show AccMgr column if user is not a Technician
    return this.userRole !== 'Technician';
  }

  // Equipment management for expanded rows
  equipmentCache: { [key: string]: any[] } = {}; // Changed to use unique key instead of just jobId
  
  getEquipmentForJob(callNbr: string, techName: string): any[] {
    const uniqueKey = `${callNbr}_${techName}`;
    // Simply return cached data (already loaded in openEquipementDetailModel)
    return this.equipmentCache[uniqueKey] || [];
  }

  // Navigation methods for action icons
  navigateToExpenses(callNbr: string, techName: string | null, techID: string | null): void {
    // Navigate to job expenses page with parameters matching legacy DTechJobExpenses.aspx
    console.log('Navigating to expenses for:', { callNbr, techName, techID });
    
    const safeTechName = (techName || '').trim();
    const safeTechID = (techID || '').trim();
    const safeCallNbr = callNbr.trim();
    
    // Route to job expenses page with query parameters
    this.router.navigate(['/jobs/expenses'], {
      queryParams: {
        CallNbr: safeCallNbr,
        TechName: safeTechName,
        TechID: safeTechID
      }
    });
  }

  navigateToParts(callNbr: string, techName: string | null): void {
    // Navigate to job parts page with CallNbr and TechName parameters
    // Equivalent to: "DTechJobParts.aspx?CallNbr=" + CallNbr + "&TechName=" + TechName
    const safeTechName = techName || '';
    console.log('Navigating to parts page for:', callNbr, safeTechName);
    this.router.navigate(['/jobs/parts'], {
      queryParams: {
        CallNbr: callNbr,
        TechName: safeTechName
      }
    });
  }

  navigateToJobInfo(callNbr: string, techName: string | null): void {
    // Navigate to job notes info page
    const safeTechName = techName || '';
    this.router.navigate(['/jobs/job-notes-info'], {
      queryParams: {
        CallNbr: callNbr,
        TechName: safeTechName
      }
    });
  }

  navigateToSafety(callNbr: string): void {
    // Navigate to job safety page with CallNbr parameter
    // Equivalent to: "DTechJobSafety.aspx?CallNbr=" + CallNbr
    console.log('Navigating to safety page for:', callNbr);
    this.router.navigate(['/jobs/job-safety'], { queryParams: { CallNbr: callNbr } });
  }

  openQuoteDetailsModal(jobId: any) {
    const modalRef = this.modalService.open(QuoteDetailsModalComponent,{ fullscreen : "lg", centered: true});
    modalRef.componentInstance.jobId = jobId;


  }



  getNotes(jobId: any, siteId: any)
  {
    let model =
    {
      jobId : jobId.trim(),
      siteId : siteId
    }
    this._jobService.getNotes(model).subscribe((res: GetNotes) =>{
      const modalRef = this.modalService.open(NotesViewComponent,{ fullscreen : "lg", centered: true});
      modalRef.componentInstance.jobId = jobId;
      modalRef.componentInstance.siteId = siteId;
      modalRef.componentInstance.note = res;
      modalRef.result.then((data) => {
        if(data)
        {
          this.Load(false);
        }
      }, (reason) => {

      });
    })
  }


  get selectedOwnerId(): string|null {
    const ownerIdControl = this.jobFilterForm.get('ownerId');
    if (ownerIdControl) {
      return ownerIdControl.value;
    } else {
      return '';
    }
  }

  getColorByStatus(status: string|null): string {
    switch (status) {
      case 'Email Sent':
        return '#E8A90E';
      case 'Viewed':
        return '#008ed6';
      case 'In Discussion':
        return '#cc00cc';
      case 'Accepted':
        return '#00b300';
      case 'Confirmed':
        return '#958C02';
      case 'Job Scheduled':
        return '#00b300';
        //return '#e60000';
      case 'To Be Sent':
        return '#958C02';
      case 'Draft':
        return '#808080'

      case 'Cancelled':
            return '#730202';
      default:
        return '#730202';
    }
  }
  getColorByPriority(status: string): string {
    switch (status) {
      case 'Critical':
            return 'red';
      default:
        return 'black';
    }

  }

  validateEmails(emails: string[]): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const email of emails) {
      if (!emailRegex.test(email)) {
        return false;
      }
    }
    return true;
  }

  edit(rowIndex: any)
  {
    const modalRef = this.modalService.open(JobEditComponent,{ windowClass: 'job-edit-modal-width', centered: true});
    modalRef.componentInstance.rowIndex = rowIndex;
    modalRef.result.then((data) => {
      if(data)
      {
        this.Load(false);
      }
    }, (reason) => {

    });
  }

  // Check if upload date is valid (not the default '01-Jan-1900' date)
  isValidUploadDate(dateValue: any): boolean {
    if (!dateValue) {
      return false;
    }
    
    // Convert to string for comparison
    const dateStr = dateValue.toString();
    
    // Check for various formats of the default date
    const invalidDates = [
      '01-Jan-1900',
      '1900-01-01',
      '1/1/1900',
      '01/01/1900',
      '1900-01-01T00:00:00',
      '1900-01-01T00:00:00.000Z'
    ];
    
    // Check if it's one of the invalid default dates
    if (invalidDates.some(invalid => dateStr.includes(invalid))) {
      return false;
    }
    
    // Try to parse as date and check if it's the 1900 date
    try {
      const date = new Date(dateValue);
      if (date.getFullYear() === 1900 && date.getMonth() === 0 && date.getDate() === 1) {
        return false;
      }
    } catch (error) {
      return false;
    }
    
    return true;
  }

  // Status class for cyberpunk design
  getStatusClass(status: string): string {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'status-cyber status-completed';
      case 'in progress':
      case 'in-progress':
        return 'status-cyber status-active';
      case 'pending':
        return 'status-cyber status-pending';
      case 'cancelled':
        return 'status-cyber status-cancelled';
      default:
        return 'status-cyber status-active';
    }
  }

  // Navigate to equipment details page
  navigateToEquipmentDetails(callNbr: string, techName: string, techId: string): void {
    console.log('Navigating to equipment details for:', { callNbr, techName, techId });
    
    const safeTechName = (techName || '').trim();
    const safeTechId = (techId || '').trim();
    const safeCallNbr = (callNbr || '').trim();
    
    if (!safeCallNbr) {
      console.error('Cannot navigate to equipment details: Invalid call number');
      return;
    }
    
    // Get current filter values to pass along
    const currentFilters = this.jobFilterForm.value;
    
    // Route to equipment details page with query parameters matching legacy DTechEquipDetails.aspx
    this.router.navigate(['/jobs/equipment-details'], {
      queryParams: {
        CallNbr: safeCallNbr,
        TechName: safeTechName,
        Tech: safeTechId,
        Archive: currentFilters.rbButton || '0',
        Year: currentFilters.currentYear || new Date().getFullYear().toString()
      }
    });
  }
}

