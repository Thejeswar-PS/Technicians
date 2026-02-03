import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { TechToolsService } from '../../../core/services/tech-tools.service';
import { ToolsTrackingTechsDto, TechToolSerialNoDto, ToolsCalendarTrackingDto, ToolsCalendarDueCountsDto, ToolsCalendarTrackingResultDto } from '../../../core/model/tech-tools.model';

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
  // Filter Properties
  selectedTech: string = 'All';
  selectedToolType: string = 'All';
  selectedSerialNo: string = 'All';
  
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
  
  private subscription: Subscription = new Subscription();

  constructor(
    private techToolsService: TechToolsService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.loadTechnicians();
    this.loadToolSerialNumbers();
    this.generateCalendar();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  /**
   * Load all technicians for tools tracking
   */
  loadTechnicians(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    // Use the working tools tracking technicians endpoint
    const sub = this.techToolsService.getToolsTrackingTechs().subscribe({
      next: (response: any) => {
        // Extract the data array from the wrapped response
        const technicians = response.data || response || [];
        this.technicians = technicians;
        this.isLoading = false;
      },
      error: (error: any) => {
        this.errorMessage = 'Error loading technicians: ' + (error.message || error);
        this.isLoading = false;
        console.error('Error fetching technicians:', error);
      }
    });
    
    this.subscription.add(sub);
  }
  
  /**
   * Load tool serial numbers based on selected tool type
   */
  loadToolSerialNumbers(): void {
    this.isLoadingSerialNumbers = true;
    this.serialNumbersErrorMessage = '';
    
    const sub = this.techToolsService.getTechToolSerialNos(this.selectedToolType).subscribe({
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
   * Using CORRECTED logic with proper ranges (fixing the legacy bug)
   */
  private calculateStatus(dueDate: Date): 'overdue' | 'due15' | 'due30' | 'due45' | 'due60' | 'normal' {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time for accurate day comparison
    const dueDateOnly = new Date(dueDate);
    dueDateOnly.setHours(0, 0, 0, 0);
    
    // Legacy logic: (e.Day.Date - DateTime.Today).TotalDays
    const diffTime = dueDateOnly.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    // CORRECTED logic with proper date ranges (fixing legacy bug)
    if (diffDays <= 0) {
      return 'overdue';       // RED: <= 0 days (overdue or due today)
    } 
    else if (diffDays >= 60) {
      return 'due60';         // GREEN: >= 60 days
    }
    else if (diffDays >= 45) {
      return 'due45';         // OLIVE: 45-59 days  
    }
    else if (diffDays >= 30) {
      return 'due30';         // YELLOW: 30-44 days
    }
    else if (diffDays >= 15) {
      return 'due15';         // ORANGE: 15-29 days
    }
    
    return 'normal';          // Default: 1-14 days (no special color)
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
    
    const sub = this.techToolsService.getToolsCalendarTracking(
      startDateStr,               // Optional - backend has defaults
      endDateStr,                 // Optional - backend has defaults
      this.selectedToolType,      // ddlTools.SelectedValue
      this.selectedSerialNo,      // ddlSerialNo.SelectedValue  
      techFilter                  // Tech parameter ("0" for All)
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
        this.errorMessage = 'Error loading tools data: ' + (error.message || 'Unknown error');
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
    // Regenerate calendar grid with current tool data and new filters
    if (this.toolsData && this.toolsData.length > 0) {
      this.generateCalendarGrid();
    } else {
      this.generateCalendar(); // Load data and generate calendar
    }
  }
  
  /**
   * Handle technician filter change
   */
  onTechnicianChange(): void {
    // Like legacy: ddlCalTech_SelectedIndexChanged calls FillHolidayDataset()
    // Regenerate calendar grid with current tool data and new filters
    if (this.toolsData && this.toolsData.length > 0) {
      this.generateCalendarGrid();
    } else {
      this.generateCalendar(); // Load data and generate calendar
    }
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
   * Open tool details (Legacy navigation: ToolsTracking.aspx?TechID=)
   */
  openToolDetails(entry: ToolsCalendarTrackingDto): void {
    // Legacy: string url = "ToolsTracking.aspx?TechID=" + TechID;
    // Navigate to tools tracking page with techID parameter
    const url = `/pages/tools/tech-tools?techID=${entry.techID}`;
    window.open(url, '_blank');
  }

  /**
   * Export calendar data
   */
  exportCalendar(): void {
    // Implement export functionality
    console.log('Exporting calendar data...');
  }
}