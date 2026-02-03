import { Component, OnInit, OnDestroy } from '@angular/core';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { TechToolsService } from '../../../core/services/tech-tools.service';
import { ToolsTrackingTechsDto, TechToolSerialNoDto } from '../../../core/model/tech-tools.model';

interface CalendarDay {
  date: Date;
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  toolEntries: ToolEntry[];
}

interface ToolEntry {
  techID: string;
  empName: string; // TechName
  toolName: string;
  serialNo: string;
  dueDate: Date;
  dueDt: string;
  status: 'overdue' | 'due15' | 'due30' | 'due45' | 'due60' | 'normal';
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
  technicians: ToolsTrackingTechsDto[] = [];
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
  toolsData: ToolEntry[] = [];
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
    this.loadStatistics();
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
    
    const sub = this.techToolsService.getToolsTrackingTechs().subscribe({
      next: (technicians: ToolsTrackingTechsDto[]) => {
        this.technicians = technicians;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = 'Error loading technicians: ' + (error.message || error);
        this.isLoading = false;
        console.error('Error fetching technicians:', error);
      }
    });
    
    this.subscription.add(sub);
  }

  /**
   * Select a technician from the list
   */
  selectTechnician(technician: ToolsTrackingTechsDto): void {
    this.selectedTechnician = technician;
  }

  /**
   * Clear the selected technician
   */
  clearSelection(): void {
    this.selectedTechnician = null;
  }

  /**
   * Refresh the technicians list
   */
  refreshTechnicians(): void {
    this.loadTechnicians();
  }

  /**
   * Load tool serial numbers for selected tool
   */
  loadToolSerialNumbers(): void {
    this.isLoadingSerialNumbers = true;
    this.serialNumbersErrorMessage = '';
    
    const sub = this.techToolsService.getTechToolSerialNos(this.selectedToolType).subscribe({
      next: (serialNumbers: TechToolSerialNoDto[]) => {
        this.toolSerialNumbers = serialNumbers;
        this.isLoadingSerialNumbers = false;
      },
      error: (error) => {
        this.serialNumbersErrorMessage = 'Error loading tool serial numbers: ' + (error.message || error);
        this.isLoadingSerialNumbers = false;
        console.error('Error fetching tool serial numbers:', error);
      }
    });
    
    this.subscription.add(sub);
  }

  /**
   * Handle tool selection change
   */
  onToolSelectionChange(): void {
    this.loadToolSerialNumbers();
  }

  /**
   * Handle technician selection change
   */
  onTechnicianChange(): void {
    if (this.selectedTech && this.selectedTech !== 'All') {
      const selected = this.technicians.find(t => t.techID === this.selectedTech);
      this.selectedTechnician = selected || null;
    } else {
      this.selectedTechnician = null;
    }
    this.refreshCalendar();
  }

  /**
   * Handle serial number selection change
   */
  onSerialNoChange(): void {
    this.refreshCalendar();
  }

  /**
   * Get filtered data and refresh calendar
   */
  onGetData(): void {
    this.refreshCalendar();
  }

  /**
   * Generate calendar for current month
   */
  generateCalendar(): void {
    this.calendarDays = [];
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Get first day of month and how many days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    // Generate 42 days (6 weeks)
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const calendarDay: CalendarDay = {
        date: new Date(currentDate),
        dayNumber: currentDate.getDate(),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: this.isSameDay(currentDate, new Date()),
        toolEntries: this.getToolEntriesForDate(currentDate)
      };
      
      this.calendarDays.push(calendarDay);
    }
  }

  /**
   * Get tool entries for a specific date (mock data for now)
   */
  getToolEntriesForDate(date: Date): ToolEntry[] {
    // Mock data - replace with actual API call
    const mockEntries: ToolEntry[] = [];
    const random = Math.random();
    
    if (random > 0.7) {
      entries.push({
        techID: 'T001',
        empName: 'John Smith',
        toolName: 'Multimeter',
        serialNo: 'MM001',
        dueDate: date,
        dueDt: date.toISOString(),
        status: this.calculateStatus(date)
      });
    }
    
    if (random > 0.85) {
      mockEntries.push({
        techName: 'Mary Doe',
        toolName: 'Oscilloscope',
        serialNo: 'OSC002',
        dueDate: date,
        status: this.getDueStatus(date),
        techID: 'TECH002'
      });
    }
    
    return mockEntries;
  }

  /**
   * Calculate status based on due date (Legacy logic from Calendar1_DayRender)
   */
  private calculateStatus(dueDate: Date): 'overdue' | 'due15' | 'due30' | 'due45' | 'due60' | 'normal' {
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Legacy logic: (e.Day.Date - DateTime.Today).TotalDays
    if (diffDays <= 0) return 'overdue';
    if (diffDays >= 15) return 'due15';
    if (diffDays >= 30) return 'due30';
    if (diffDays >= 45) return 'due45';
    if (diffDays >= 60) return 'due60';
    return 'normal';
  }

  /**
   * Calculate date range for data loading (Legacy FillHolidayDataset logic)
   */
  private calculateDateRange(): void {
    const currentYear = this.currentDate.getFullYear();
    const currentMonth = this.currentDate.getMonth();
    
    if (this.currentDate.getMonth() === 0) { // January
      this.firstDate = new Date(currentYear - 1, 11, 15); // Previous December 15th
    } else {
      this.firstDate = new Date(currentYear, currentMonth - 1, 15); // Previous month 15th
    }
    
    // Get first day of next month logic
    let monthNumber: number, yearNumber: number;
    if (this.currentDate.getMonth() === 11 || this.currentDate.getMonth() === 10) { // Nov or Dec
      monthNumber = 0; // January
      yearNumber = this.currentDate.getFullYear() + 1;
    } else {
      monthNumber = this.currentDate.getMonth() + 1;
      yearNumber = this.currentDate.getFullYear();
    }
    this.lastDate = new Date(yearNumber, monthNumber, 15);
  }

  /**
   * Load tools data for date range (Legacy GetCurrentMonthData)
   */
  private loadToolsData(): void {
    this.isLoadingCalendar = true;
    this.errorMessage = '';
    
    // Mock data for now - replace with actual service call
    setTimeout(() => {
      this.toolsData = this.generateMockToolsData();
      this.updateMockStatistics();
      this.isLoadingCalendar = false;
    }, 500);
  }

  /**
   * Generate mock tools data for testing
   */
  private generateMockToolsData(): ToolEntry[] {
    const mockData: ToolEntry[] = [];
    const tools = this.availableTools.slice(1); // Remove 'All'
    const techs = this.technicians;
    
    // Generate random tool entries for current month
    for (let i = 0; i < 20; i++) {
      const randomDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), Math.floor(Math.random() * 28) + 1);
      const tech = techs[Math.floor(Math.random() * techs.length)];
      const tool = tools[Math.floor(Math.random() * tools.length)];
      
      mockData.push({
        techID: tech?.techname || 'T001',
        empName: tech?.techname || 'Test Tech',
        toolName: tool,
        serialNo: 'SN' + (1000 + i),
        dueDate: randomDate,
        dueDt: randomDate.toISOString(),
        status: 'normal'
      });
    }
    
    return mockData;
  }

  /**
   * Update mock statistics
   */
  private updateMockStatistics(): void {
    this.statistics = {
      overdue: 5,
      due15Days: 12,
      due30Days: 8,
      due45Days: 3,
      due60Days: 1
    };
  }

  /**
   * Check if tool passes current filter criteria
   */
  private passesCurrentFilters(tool: ToolEntry): boolean {
    // Technician filter
    if (this.selectedTech !== 'All' && tool.empName !== this.selectedTech) {
      return false;
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
   * Load statistics for dashboard
   */
  loadStatistics(): void {
    // Mock statistics - replace with actual API call
    this.statistics = {
      overdue: 5,
      due15Days: 12,
      due30Days: 8,
      due45Days: 3,
      due60Days: 1
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
   * Go to current month
   */
  goToToday(): void {
    this.currentDate = new Date();
    this.generateCalendar();
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
   * Check if two dates are the same day
   */
  isSameDay(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  /**
   * Get status class for calendar cell
   */
  getStatusClass(entries: ToolEntry[]): string {
    if (entries.length === 0) return '';
    
    const priorities = ['overdue', 'due15', 'due30', 'due45', 'due60'];
    for (const priority of priorities) {
      if (entries.some(entry => entry.status === priority)) {
        return priority;
      }
    }
    return '';
  }

  /**
   * Handle tool entry click
   */
  onToolEntryClick(entry: ToolEntry): void {
    // Navigate to tool details or open modal
    console.log('Tool entry clicked:', entry);
  }

  /**
   * Refresh calendar with current filters
   */
  refreshCalendar(): void {
    this.isLoadingCalendar = true;
    // Simulate loading delay
    setTimeout(() => {
      this.generateCalendar();
      this.loadStatistics();
      this.isLoadingCalendar = false;
    }, 500);
  }

  /**
   * Handle filter changes (Legacy dropdown events)
   */
  onFilterChange(): void {
    // Like legacy: ddlTools_SelectedIndexChanged calls BindSerialNo() and FillHolidayDataset()
    if (this.selectedToolType) {
      this.loadToolSerialNumbers(); // Reload serial numbers for selected tool
    }
    this.generateCalendar(); // Equivalent to FillHolidayDataset()
  }
  
  /**
   * Handle technician filter change
   */
  onTechnicianChange(): void {
    // Like legacy: ddlCalTech_SelectedIndexChanged calls FillHolidayDataset()
    this.generateCalendar();
  }

  /**
   * Go back to previous page
   */
  goBack(): void {
    this.location.back();
  }

  /**
   * Handle filter changes (Legacy dropdown events)
   */
  onFilterChange(): void {
    // Like legacy: ddlTools_SelectedIndexChanged calls BindSerialNo() and FillHolidayDataset()
    if (this.selectedToolType) {
      this.loadToolSerialNumbers(); // Reload serial numbers for selected tool
    }
    this.generateCalendar(); // Equivalent to FillHolidayDataset()
  }
  
  /**
   * Handle technician filter change
   */
  onTechnicianChange(): void {
    // Like legacy: ddlCalTech_SelectedIndexChanged calls FillHolidayDataset()
    this.generateCalendar();
  }

  /**
   * Calculate date range for data loading (Legacy FillHolidayDataset logic)
   */
  private calculateDateRange(): void {
    const currentYear = this.currentDate.getFullYear();
    const currentMonth = this.currentDate.getMonth();
    
    if (this.currentDate.getMonth() === 0) { // January
      this.firstDate = new Date(currentYear - 1, 11, 15); // Previous December 15th
    } else {
      this.firstDate = new Date(currentYear, currentMonth - 1, 15); // Previous month 15th
    }
    
    // Get first day of next month logic
    let monthNumber: number, yearNumber: number;
    if (this.currentDate.getMonth() === 11 || this.currentDate.getMonth() === 10) { // Nov or Dec
      monthNumber = 0; // January
      yearNumber = this.currentDate.getFullYear() + 1;
    } else {
      monthNumber = this.currentDate.getMonth() + 1;
      yearNumber = this.currentDate.getFullYear();
    }
    this.lastDate = new Date(yearNumber, monthNumber, 15);
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
   * Track by function for calendar days
   */
  trackByDate(index: number, day: CalendarDay): string {
    return day.date.toISOString();
  }

  /**
   * Open tool details (Legacy navigation: ToolsTracking.aspx?TechID=)
   */
  openToolDetails(entry: ToolEntry): void {
    // Legacy: string url = "ToolsTracking.aspx?TechID=" + TechID;
    // Navigate to tools tracking page with techID parameter
    const url = `/pages/tools/tech-tools?techID=${entry.techID}`;
    window.open(url, '_blank');
  }

  /**
   * Load tools data for date range (Legacy GetCurrentMonthData)
   */
  private loadToolsData(): void {
    this.isLoadingCalendar = true;
    this.errorMessage = '';
    
    // Prepare filter parameters like legacy
    const techFilter = this.selectedTech === 'All' ? '0' : this.selectedTech;
    
    // Call service method that mimics: exec dbo.aaToolsCalendar_Tracking
    const sub = this.techToolsService.getToolsCalendarData(
      this.firstDate,
      this.lastDate, 
      this.selectedToolType,
      this.selectedSerialNo,
      techFilter
    ).subscribe({
      next: (data: any) => {
        // data[0] = tools data, data[1] = statistics
        if (data && data.length > 0) {
          this.toolsData = data[0] || [];
          this.updateStatistics(data[1]);
        }
        this.isLoadingCalendar = false;
      },
      error: (error) => {
        this.errorMessage = 'Error while getting the current month data- ' + (error.message || error);
        this.isLoadingCalendar = false;
        console.error('Error loading tools data:', error);
      }
    });
    
    this.subscription.add(sub);
  }
  
  /**
   * Update statistics from service data
   */
  private updateStatistics(statsData: any): void {
    if (statsData && statsData.length > 0) {
      const stats = statsData[0];
      this.statistics = {
        overdue: parseInt(stats.OverDue || '0'),
        due15Days: parseInt(stats.Due15 || '0'),
        due30Days: parseInt(stats.Due30 || '0'),
        due45Days: parseInt(stats.Due45 || '0'),
        due60Days: parseInt(stats.Due60 || '0')
      };
    }
  }
  
  /**
   * Open tool details (Legacy navigation: ToolsTracking.aspx?TechID=)
   */
  openToolDetails(entry: ToolEntry): void {
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