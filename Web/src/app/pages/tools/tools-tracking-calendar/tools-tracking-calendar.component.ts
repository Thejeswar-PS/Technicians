import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TechToolsService } from '../../../core/services/tech-tools.service';
import { AuthHelper } from '../../../core/utils/auth-helper';
import { ToolsTrackingTechsDto, ToolsTrackingTechsApiResponse, TechToolSerialNoDto, ToolsCalendarTrackingDto, ToolsCalendarDueCountsDto, ToolsCalendarTrackingResultDto } from '../../../core/model/tech-tools.model';

export interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  toolEntries: ToolsCalendarTrackingDto[];
}

@Component({
  selector: 'app-tools-tracking-calendar',
  templateUrl: './tools-tracking-calendar.component.html',
  styleUrls: ['./tools-tracking-calendar.component.scss']
})
export class ToolsTrackingCalendarComponent implements OnInit, OnDestroy {
  private readonly drillDownStorageKeyPrefix = 'toolTrackingDrillDown:';
  readonly statusCardConfig = [
    { key: 'overdue', label: 'Overdue', icon: 'bi bi-exclamation-triangle-fill', countKey: 'overdue' },
    { key: 'due15', label: 'Due 15 Days', icon: 'bi bi-clock-fill', countKey: 'due15Days' },
    { key: 'due30', label: 'Due 30 Days', icon: 'bi bi-calendar-week', countKey: 'due30Days' },
    { key: 'due45', label: 'Due 45 Days', icon: 'bi bi-calendar2-week', countKey: 'due45Days' },
    { key: 'due60', label: 'Due 60 Days', icon: 'bi bi-calendar3-week', countKey: 'due60Days' }
  ] as const;

  // Filter Properties
  selectedTech: string = 'All';
  selectedToolType: string = 'All';
  selectedSerialNo: string = 'All';
  isTechnicianRestricted: boolean = false;
  
  // Data Arrays
  technicians: (ToolsTrackingTechsDto | { techID: string; techname: string })[] = [];
  selectedTechnician: ToolsTrackingTechsDto | null = null;
  toolSerialNumbers: TechToolSerialNoDto[] = [];
  availableTools: string[] = [
    'All', 'Fluke 62 IR', 'Fluke 376 Clamp', 'Fluke 87V', 'Torque Wrench', 
    'Flir IR Camera', 'Dent Meter', 'AEMC Meter', 'Fluke 43B', 'Fluke 125', 
    'Fluke 189', 'Fluke 289', 'Fluke 345', 'Torque Screwdriver', 'Hydrometer',
    'Midtronics Ultra', 'Midtronics Advantage', 'Fluke BT521', 'CB Tester',
    'MiscOther1', 'MiscOther2', 'MiscOther3'
  ];
  
  // Calendar Properties
  currentDate: Date = new Date();
  calendarDays: CalendarDay[] = [];
  weekDays: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Calendar data from service (mimics dsTools DataSet)
  toolsData: ToolsCalendarTrackingDto[] = [];
  dueCounts: ToolsCalendarDueCountsDto = {
    counter: 0,
    overDue: 0,
    due15: 0,
    due30: 0,
    due45: 0,
    due60: 0
  };
  firstDate: Date = new Date();
  lastDate: Date = new Date();
  
  // Statistics Dashboard
  statistics = {
    overdue: 0,
    due15Days: 0,
    due30Days: 0,
    due45Days: 0,
    due60Days: 0
  };
  startDate: Date = new Date();
  endDate: Date = new Date();
  
  // Loading States
  isLoading: boolean = false;
  isLoadingSerialNumbers: boolean = false;
  isLoadingCalendar: boolean = false;
  
  // Error Messages
  errorMessage: string = '';
  serialNumbersErrorMessage: string = '';
  
  // Role-based filtering
  private userContext: { userEmpID?: string; windowsID?: string } = {};

  // Current user identity (read from localStorage like parts-request-status)
  private empID: string = '';
  private empName: string = '';
  private empStatus: string = '';
  private userRole: string = '';
  private windowsID: string = '';
  
  private subscription: Subscription = new Subscription();

  constructor(
    private techToolsService: TechToolsService,
    private location: Location,
    private router: Router,
    private authHelper: AuthHelper
  ) {}

  ngOnInit(): void {
    // Get user context for role-based filtering
    this.userContext = this.authHelper.getUserContext();
    this.readUserDataFromStorage();
    
    this.loadTechnicians();
    this.loadToolSerialNumbers();
    this.generateCalendar();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Load all technicians for tools tracking - Enhanced with role-based filtering
   */
  loadTechnicians(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Use the working tools tracking technicians endpoint - Pass user context for role-based filtering
    const sub = this.techToolsService.getToolsTrackingTechs(this.userContext.userEmpID, this.userContext.windowsID).subscribe({
      next: (response: ToolsTrackingTechsApiResponse) => {
        const technicians = response.data || [];
        this.technicians = technicians;
        this.isTechnicianRestricted = !!response.isFiltered && technicians.length === 1;
        
        // If role-filtered to single technician, auto-select them
        if (this.isTechnicianRestricted) {
          this.selectedTech = technicians[0].techID;
          // Auto-load calendar for single technician
          setTimeout(() => {
            this.generateCalendar();
          }, 300);
        } else {
          // Client-side: auto-select current technician by matching user identity
          this.applyTechnicianDefault();
        }
        
        this.isLoading = false;
      },
      error: (error: any) => {
        if (error.status === 403) {
          this.errorMessage = 'Access denied: You do not have permission to view this data.';
        } else {
          this.errorMessage = 'Error loading technicians: ' + (error.message || error);
        }
        this.isLoading = false;
        console.error('Error fetching technicians:', error);
      }
    });
    
    this.subscription.add(sub);
  }
  
  /**
   * Read current user identity fields from localStorage (mirrors parts-request-status pattern)
   */
  private readUserDataFromStorage(): void {
    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        // LoginResponse fields: empName, empLabel, windowsID
        this.empName   = (userData.empName   || userData.empLabel || '').toString().trim();
        this.windowsID = (userData.windowsID || userData.windowsId || this.empName).toString().trim();
        // empID / empStatus / role may also be present depending on API version
        this.empID     = (userData.empID     || '').toString().trim();
        this.empStatus = (userData.empStatus || '').toString().trim().toUpperCase();
        this.userRole  = (userData.role      || '').toString().trim().toLowerCase();
      }
    } catch (e) {
      console.error('[ToolsCalendar] Error reading userData from localStorage:', e);
    }
  }

  /**
   * After loading the technicians list, auto-select the logged-in user if they
   * appear in the list (i.e. they are a technician). Managers/admins won't be
   * found in the list so the dropdown stays at 'All' — no role check needed.
   */
  private applyTechnicianDefault(): void {
    if (!this.technicians || this.technicians.length === 0) return;

    const normalize = (v: string) =>
      (v || '').toString().trim().toUpperCase().replace(/[^A-Z0-9.]/g, '');

    const windowsIdTail = (this.windowsID || '').split('\\').pop() || this.windowsID;

    const userTokens = [
      normalize(this.empID),
      normalize(this.empName),
      normalize(this.windowsID),
      normalize(windowsIdTail)
    ].filter(Boolean);

    if (userTokens.length === 0) return;

    const matched = this.technicians.find(tech => {
      const techTokens = [
        normalize(tech.techID),
        normalize(tech.techname)
      ].filter(Boolean);

      return userTokens.some(ut =>
        techTokens.some(tt =>
          ut === tt ||
          tt.startsWith(ut) ||
          ut.startsWith(tt)
        )
      );
    });

    if (matched) {
      this.selectedTech = matched.techID;
      console.log('[ToolsCalendar] Auto-selected technician by login:', matched.techID);
      this.generateCalendar();
    } else {
      console.warn('[ToolsCalendar] No technician match found for login user. UserTokens:', userTokens);
    }
  }

  /**
   * Load tool serial numbers based on selected tool type - Enhanced with role-based filtering
   */
  loadToolSerialNumbers(): void {
    this.isLoadingSerialNumbers = true;
    this.serialNumbersErrorMessage = '';
    
    // Pass user context for role-based filtering
    const sub = this.techToolsService.getTechToolSerialNos(this.selectedToolType, this.userContext.userEmpID, this.userContext.windowsID).subscribe({
      next: (serialNumbers: TechToolSerialNoDto[]) => {
        this.toolSerialNumbers = serialNumbers;
        this.isLoadingSerialNumbers = false;
      },
      error: (error: any) => {
        this.serialNumbersErrorMessage = 'Error loading serial numbers: ' + (error.message || error);
        this.isLoadingSerialNumbers = false;
        console.error('Error fetching serial numbers:', error);
      }
    });
    
    this.subscription.add(sub);
  }

  /**
   * Generate calendar days for current month view (Legacy DayRender logic)
   */
  generateCalendar(): void {
    // Calculate date range like legacy FillHolidayDataset
    this.calculateDateRange();
    
    // Load tools data for the date range (will call generateCalendarGrid when done)
    this.loadToolsData();
  }

  /**
   * Generate the actual calendar grid after data is loaded
   */
  private generateCalendarGrid(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first day of the week containing the first day of month
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // End at the last day of the week containing the last day of month
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    this.calendarDays = [];
    const currentDate = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    while (currentDate <= endDate) {
      const day: CalendarDay = {
        date: new Date(currentDate),
        dayNumber: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.getTime() === today.getTime(),
        toolEntries: this.getToolEntriesForDate(currentDate)
      };
      
      this.calendarDays.push(day);
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  /**
   * Get tool entries for a specific date (Legacy DayRender logic)
   */
  private getToolEntriesForDate(date: Date): ToolsCalendarTrackingDto[] {
    const entries: ToolsCalendarTrackingDto[] = [];
    const dateStr = date.toDateString();
    
    // Filter tools data for this specific date
    this.toolsData.forEach(tool => {
      const toolDueDate = new Date(tool.dueDt);
      if (toolDueDate.toDateString() === dateStr) {
        // Apply filtering logic
        const passesFilter = this.passesCurrentFilters(tool);
        if (passesFilter) {
          entries.push(tool);
        }
      }
    });
    
    return entries;
  }

  /**
   * Check if tool passes current filter criteria
   */
  private passesCurrentFilters(tool: ToolsCalendarTrackingDto): boolean {
    // Technician filter - now compare by techID
    if (this.selectedTech !== 'All') {
      // Find the selected technician to get the name for comparison
      const selectedTechnician = this.technicians.find(tech => 
        (tech.techID || tech.techname) === this.selectedTech
      );
      
      if (selectedTechnician && tool.empName !== selectedTechnician.techname) {
        return false;
      }
    }
    
    // Tool type filter
    if (this.selectedToolType !== 'All' && tool.toolName !== this.selectedToolType) {
      return false;
    }
    
    // Serial number filter
    if (this.selectedSerialNo !== 'All' && tool.serialNo !== this.selectedSerialNo) {
      return false;
    }
    
    return true;
  }

  /**
   * Get tool status for styling (used in template)
   */
  getToolStatus(entry: ToolsCalendarTrackingDto): string {
    const dueDate = new Date(entry.dueDt);
    return this.calculateStatus(dueDate);
  }

  /**
   * Calculate status based on due date (Legacy Calendar1_DayRender logic)
   * Using due-within buckets: overdue, <=15, <=30, <=45, <=60 days.
   */
  private calculateStatus(dueDate: Date): 'overdue' | 'due15' | 'due30' | 'due45' | 'due60' | 'normal' {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate day comparison
    const dueDateOnly = new Date(dueDate);
    dueDateOnly.setHours(0, 0, 0, 0);
    
    // Legacy logic: (e.Day.Date - DateTime.Today).TotalDays
    const diffTime = dueDateOnly.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    // Due-within bucket logic (date-only comparison)
    if (diffDays <= 0) {
      return 'overdue';       // RED: <= 0 days (overdue or due today)
    } 
    else if (diffDays <= 15) {
      return 'due15';         // ORANGE: 1-15 days
    }
    else if (diffDays <= 30) {
      return 'due30';         // YELLOW: 16-30 days
    }
    else if (diffDays <= 45) {
      return 'due45';         // OLIVE: 31-45 days
    }
    else if (diffDays <= 60) {
      return 'due60';         // GREEN: 46-60 days
    }
    
    return 'normal';          // Default: >60 days (no special color)
  }

  /**
   * Calculate date range using exact legacy rule (Legacy FillHolidayDataset logic)
   */
  private calculateDateRange(): void {
    const dateRange = this.getLegacyDateRange(this.currentDate);
    this.startDate = dateRange.startDate;
    this.endDate = dateRange.endDate;
    
    // Keep legacy property names for backwards compatibility
    this.firstDate = dateRange.startDate;
    this.lastDate = dateRange.endDate;
  }

  /**
   * Legacy date range calculation - EXACT match to C# logic
   * FillHolidayDataset() + GetFirstDayOfNextMonth()
   */
  private getLegacyDateRange(baseDate: Date = new Date()) {
    const currentYear = baseDate.getFullYear();
    const currentMonth = baseDate.getMonth() + 1; // Convert to 1-based for C# matching
    
    // START DATE: Previous month 15th (exact C# FillHolidayDataset logic)
    let startYear = currentYear;
    let startMonth = currentMonth - 1;
    if (currentMonth === 1) { // January
      startMonth = 12;
      startYear = currentYear - 1;
    }
    
    // END DATE: Next month 15th (exact C# GetFirstDayOfNextMonth logic)
    let endYear = currentYear;  
    let endMonth: number;
    if (currentMonth === 12 || currentMonth === 11) { // Nov or Dec
      endMonth = 1; // January  
      endYear = currentYear + 1;
    } else {
      endMonth = currentMonth + 1;
    }
    
    return {
      startDate: new Date(startYear, startMonth - 1, 15), // Convert back to 0-based
      endDate: new Date(endYear, endMonth - 1, 15)       // Convert back to 0-based
    };
  }

  /**
   * Load tools data for date range using backend API (Legacy GetCurrentMonthData)
   */
  private loadToolsData(): void {
    this.isLoadingCalendar = true;
    this.errorMessage = '';
    
    // Try to calculate dates first
    if (!this.startDate || !this.endDate) {
      this.calculateDateRange();
    }
    
    // Format dates for API if available (backend has defaults if not provided)
    let startDateStr: string | undefined;
    let endDateStr: string | undefined;
    
    if (this.startDate && this.endDate) {
      startDateStr = this.formatDateForApi(this.startDate);
      endDateStr = this.formatDateForApi(this.endDate);
      
      // Validate formatted dates
      if (startDateStr === 'NaN-NaN-NaN' || endDateStr === 'NaN-NaN-NaN') {
        startDateStr = undefined;
        endDateStr = undefined;
      }
    }
    
    // Legacy parameter mapping: Tech parameter: selectedTech (techID) or "0" for All
    const techFilter = this.selectedTech === 'All' ? '0' : this.selectedTech;
    
    // Pass user context for role-based filtering
    const sub = this.techToolsService.getToolsCalendarTracking(
      startDateStr,               // Optional - backend has defaults
      endDateStr,                 // Optional - backend has defaults
      this.selectedToolType,      // ddlTools.SelectedValue
      this.selectedSerialNo,      // ddlSerialNo.SelectedValue  
      techFilter,                 // Tech parameter ("0" for All)
      this.userContext.userEmpID, // Role-based filtering
      this.userContext.windowsID  // Role-based filtering
    ).subscribe({
      next: (result: ToolsCalendarTrackingResultDto) => {
        // Legacy expects Tables[0] (individual records) and Tables[1] (statistics)
        this.toolsData = result.trackingData || [];
        this.dueCounts = result.dueCounts || {
          counter: 0,
          overDue: 0,
          due15: 0,
          due30: 0,
          due45: 0,
          due60: 0
        };
        
        // Update statistics dashboard like legacy FillHolidayDataset
        this.updateStatistics();
        
        // Generate calendar grid now that we have tool data
        this.generateCalendarGrid();
        
        this.isLoadingCalendar = false;
      },
      error: (error: any) => {
        if (error.status === 403) {
          this.errorMessage = 'Access denied: You can only view your own calendar data.';
        } else {
          this.errorMessage = 'Error loading tools data: ' + (error.message || 'Unknown error');
        }
        this.isLoadingCalendar = false;
        this.toolsData = [];
        this.dueCounts = {
          counter: 0,
          overDue: 0,
          due15: 0,
          due30: 0,
          due45: 0,
          due60: 0
        };
      }
    });
    
    this.subscription.add(sub);
  }
  
  /**
   * Format date for API call (matches legacy string format)
   */
  private formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Update statistics from API data
   */
  private updateStatistics(): void {
    this.statistics = {
      overdue: this.dueCounts.overDue,
      due15Days: this.dueCounts.due15,
      due30Days: this.dueCounts.due30,
      due45Days: this.dueCounts.due45,
      due60Days: this.dueCounts.due60
    };
  }

  /**
   * Navigate to previous month (Legacy VisibleMonthChanged)
   */
  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.generateCalendar(); // Like legacy: calls FillHolidayDataset()
  }

  /**
   * Navigate to next month (Legacy VisibleMonthChanged)
   */
  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.generateCalendar(); // Like legacy: calls FillHolidayDataset()
  }

  /**
   * Get current month and year string
   */
  getCurrentMonthYear(): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                   'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
  }

  /**
   * Track by function for calendar days
   */
  trackByDate(index: number, day: CalendarDay): string {
    return day.date.toISOString();
  }

  /**
   * Handle filter changes (Legacy dropdown events)
   */
  onFilterChange(): void {
    // Like legacy: ddlTools_SelectedIndexChanged calls BindSerialNo() and FillHolidayDataset()
    if (this.selectedToolType) {
      this.loadToolSerialNumbers(); // Reload serial numbers for selected tool
    }

    // Reload from backend so statistics cards and calendar entries stay in sync
    // with the selected technician/tool/serial filters.
    this.generateCalendar();
  }
  
  /**
   * Handle technician filter change
   */
  onTechnicianChange(): void {
    // Like legacy: ddlCalTech_SelectedIndexChanged calls FillHolidayDataset()
    // Reload from backend so due counts reflect the selected technician.
    this.generateCalendar();
  }

  /**
   * TrackBy function for technicians dropdown performance
   */
  trackByTechId(index: number, tech: any): any {
    return tech.techID || index;
  }

  /**
   * Go back to previous page
   */
  goBack(): void {
    this.location.back();
  }

  /**
   * Get total number of tools
   */
  getTotalTools(): number {
    return this.statistics.overdue + this.statistics.due15Days + 
           this.statistics.due30Days + this.statistics.due45Days + 
           this.statistics.due60Days;
  }

  /**
   * Open tool details (Navigate to: /tools/tool-tracking-entry?TechID=)
   */
  openToolDetails(entry: ToolsCalendarTrackingDto): void {
    this.router.navigate(['/tools/tool-tracking-entry', entry.techID]);
  }

  /**
   * Navigate to tool tracking entry page with KPI drill-down filters.
   */
  openStatusCard(bucket: 'overdue' | 'due15' | 'due30' | 'due45' | 'due60'): void {
    const count = this.getStatusCardCount(bucket);

    if (!count) {
      return;
    }

    const selectedTechId = this.selectedTech !== 'All' ? this.selectedTech : undefined;
    const drillDownContext = {
      bucket,
      toolName: this.selectedToolType,
      serialNo: this.selectedSerialNo,
      techFilter: selectedTechId || '0',
      startDate: this.formatDateForApi(this.startDate),
      endDate: this.formatDateForApi(this.endDate)
    };

    if (selectedTechId) {
      this.router.navigate(['/tools/tool-tracking-entry', selectedTechId], {
        queryParams: {
          bucket,
          source: 'calendar-kpi'
        }
      });
      return;
    }

    this.router.navigate([
      '/tools/tool-tracking-entry/drilldown',
      this.storeDrillDownContext(drillDownContext)
    ], {
      queryParams: {
        bucket,
        source: 'calendar-kpi'
      }
    });
  }

  private storeDrillDownContext(context: {
    bucket: string;
    toolName: string;
    serialNo: string;
    techFilter: string;
    startDate: string;
    endDate: string;
  }): string {
    const contextId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(`${this.drillDownStorageKeyPrefix}${contextId}`, JSON.stringify(context));
    return contextId;
  }

  getStatusCardCount(bucket: 'overdue' | 'due15' | 'due30' | 'due45' | 'due60'): number {
    switch (bucket) {
      case 'overdue':
        return this.statistics.overdue;
      case 'due15':
        return this.statistics.due15Days;
      case 'due30':
        return this.statistics.due30Days;
      case 'due45':
        return this.statistics.due45Days;
      case 'due60':
        return this.statistics.due60Days;
      default:
        return 0;
    }
  }

  /**
   * Export calendar data
   */
  exportCalendar(): void {
    // Implement export functionality
    console.log('Exporting calendar data...');
  }
}