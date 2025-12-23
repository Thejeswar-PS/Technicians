import { DatePipe,Location, DOCUMENT  } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { Calendar, CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Subject, map, takeUntil } from 'rxjs';
import { CalendarJobDetails, CalendarResponse, CalendarStatistics } from 'src/app/core/model/calendar-job-details.model';
import { CommonService } from 'src/app/core/services/common.service';
import { JobService } from 'src/app/core/services/job.service';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';
import { AuthService } from 'src/app/modules/auth';

interface IEvent{
  title: string,
  start: string,
  color: string,
  allDay: boolean,
  url?: string,
  classNames?: string[]
}
@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})
export class CalendarComponent implements OnInit, OnDestroy, AfterViewInit{
  @ViewChild('calendar') calendarComponent: FullCalendarComponent;
  destroy$ = new Subject<void>();
  jobDetailList: CalendarJobDetails[] = [];
  statistics: CalendarStatistics | null = null;
  calendarOptions: CalendarOptions;
  accountManagers: any[] = [];
  technicians: any;
  locations: any;
  appTypes = appTypes;
  calendarApi: any;
  calendarPayload = {
    startDate: '',
    endDate: '',
  }
  jobFilterForm = this.fb.group({
    ownerId : ['All'],
    tech : ['All'],
    state : ['All'],
    type : ['All']
});
payload : any;
calendarEvent: Array<IEvent> =[];
currentUser: any;
  constructor(@Inject(DOCUMENT) private document: Document,
  private fb: FormBuilder,
  private commonServices: CommonService,
  private jobService: JobService,
  private datePipe: DatePipe,
  private cdr: ChangeDetectorRef,
  private location: Location,
  private filterDashboardService: DashboardFilterSharedService,
  private route: ActivatedRoute,
  private authService: AuthService) { }
  ngAfterViewInit(): void {
    this.calendarApi = this.calendarComponent.getApi();
    // Load data if a specific filter is already set (e.g., for technicians)
    if (this.jobFilterForm.controls.ownerId.value !== 'All' || 
        this.jobFilterForm.controls.tech.value !== 'All') {
      this.SearchJobs();
    }
  }
  ngOnDestroy(): void {
   this.destroy$.next();
   this.destroy$.complete();
  }

  ngOnInit(): void {
    console.log('[Calendar] ngOnInit called');
    this.initCalendar();
    this.InitFilters();
    this.filterDashboardService.setHomePage(false);
    console.log('[Calendar] ngOnInit completed');
  }


  initCalendar(){
   this.calendarOptions  = {
    headerToolbar: {
      right: "prev,next",
      center: "title",
      left: "today",
    },
      initialView: 'dayGridMonth',
      plugins: [dayGridPlugin],
      events: [],
      displayEventTime : false,
      select: function(info: any) {
        //alert('selected ' + info.startStr + ' to ' + info.endStr);
      },
      eventClick: this.handleDateClick.bind(this),
      customButtons: {
        prev: {
          text: 'PREV',
          click: () => {
          this.calendarApi.prev();
          this.checkOwnerValue();
          this.SearchJobs();
          // this.getCalendarData(this.payload);
        }
        },
        next: {
          text: 'NEXT',
          click: () => {
          this.calendarApi.next();
          this.checkOwnerValue();
          // this.getCalendarData(this.payload);
          this.SearchJobs();
         }
       },
       today: {
        text: 'TODAY',
        click: () => {
        const calendarApi = this.calendarComponent.getApi();
        calendarApi.today();
        this.checkOwnerValue();
        // this.getCalendarData(this.payload);
        this.SearchJobs();
       }
     },
    }
  }
}

   getCalendarData(payload: any){
    if(payload.ownerId === 'All' && payload.tech === 'All' && payload.state === 'All')
    {
      alert('You must select at least one name');
      return;
    }
    
    // Calculate date range: previous month 15th to next month 15th (matching legacy)
    const visibleDate = this.calendarApi.view.currentStart;
    const currentYear = visibleDate.getFullYear();
    const currentMonth = visibleDate.getMonth(); // 0-based
    
    let firstDate: Date;
    if (currentMonth === 0) { // January
      firstDate = new Date(currentYear - 1, 11, 15); // Previous year December 15
    } else {
      firstDate = new Date(currentYear, currentMonth - 1, 15); // Previous month 15th
    }
    
    let lastDate: Date;
    if (currentMonth === 11 || currentMonth === 10) { // November or December
      lastDate = new Date(currentYear + 1, 0, 15); // Next year January 15
    } else {
      lastDate = new Date(currentYear, currentMonth + 1, 15); // Next month 15th
    }
    
    payload['startDate'] = firstDate.toISOString().split('T')[0];
    payload['endDate'] = lastDate.toISOString().split('T')[0];
    
    // Match legacy sproc selection: use Updated version if account manager dropdown is enabled
    const isAccMgrEnabled = !this.jobFilterForm.controls.ownerId.disabled;
    payload['sproc'] = isAccMgrEnabled ? 'aaTechCalendar_Module_Updated' : 'aaTechCalendar_Module';
    
    console.log('[Calendar] API payload', { startDate: payload['startDate'], endDate: payload['endDate'], sproc: payload['sproc'], tech: payload['tech'], ownerId: payload['ownerId'] });
    
    this.jobService.getCalenderJobData(payload).pipe(takeUntil(this.destroy$),
    ).subscribe(res => {
      const response = res as CalendarResponse | any;

      // Support both legacy (jobDetails/statistics) and current (calendarJobs/summary) payloads
      const jobs = response?.calendarJobs || response?.jobDetails || res;
      const stats = response?.summary || response?.statistics || null;

      this.jobDetailList = jobs;
      this.statistics = stats;

      if (this.statistics) {
        console.log('[Calendar] Summary statistics', this.statistics);
      }
      this.expandMultiDayEvents();
      this.formatEvents(this.jobDetailList);
    })
  }

  // Legacy implementation: split multi-day events into separate rows for each day
  expandMultiDayEvents() {
    const expandedEvents: CalendarJobDetails[] = [];
    
    for (const event of this.jobDetailList) {
      const startDate = new Date(event.startDate);
      const endDate = new Date(event.endDate);
      const endTime = new Date(event.endTime);
      
      const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 0) {
        // Add original event
        expandedEvents.push(event);
        
        // Create entries for each additional day
        for (let j = 1; j <= daysDiff; j++) {
          const newDate = new Date(startDate);
          newDate.setDate(startDate.getDate() + j);
          
          const newEvent: CalendarJobDetails = {
            ...event,
            startDate: newDate,
            startTime: new Date('1900-01-01T00:00:00'),
            endDate: newDate,
            endTime: j === daysDiff ? endTime : new Date('1900-01-01T23:59:00')
          };
          
          expandedEvents.push(newEvent);
        }
      } else {
        expandedEvents.push(event);
      }
    }
    
    this.jobDetailList = expandedEvents;
  }

  formatEvents(details: CalendarJobDetails[]){
    this.calendarEvent = [];

    for (const list of details) {
      const rawStart = list.startDate as any;
      const startDate = new Date(rawStart);
      const startIso = isNaN(startDate.getTime())
        ? (typeof rawStart === 'string' ? rawStart.split('T')[0] : '')
        : startDate.toISOString().slice(0, 10);

      const description = list.description || '';
      const formattedTitle = this.formatEventTitle(description);
      const call = (list.callNbr || '').toString().trim();
      const isNumericCall = /^\d+$/.test(call);

      // Determine color and CSS class based on call/description
      let color = '#6bc6e1';
      let classNames: string[] = [];

      const descUpper = description.toUpperCase();
      if (!isNumericCall) {
        if (call.toUpperCase() === 'FEDERAL HOLIDAY' || descUpper.includes('FED HOLIDAY') || descUpper.includes('FEDERAL HOLIDAY')) {
          color = '#76b007';
          classNames = ['fedtxt'];
        } else if (descUpper.includes('VACATION')) {
          color = '#fddbf9';
          classNames = ['vacationtxt'];
        } else if (descUpper.includes('DRUGTEST') || descUpper.includes('DRUG TEST')) {
          color = '#e60000';
          classNames = ['drugtext'];
        } else if (descUpper.includes('APPT')) {
          color = '#fddbf9';
          classNames = ['appttxt'];
        } else {
          classNames = ['cellText'];
        }
      } else {
        // Numeric call numbers -> regular jobs
        classNames = ['cellText'];
      }

      const safeTitle = (formattedTitle || '').trim() || (!isNumericCall ? (call || 'Special Event') : 'Job');

      const event: IEvent = {
        title: safeTitle,
        start: startIso,
        color,
        allDay: false,
        classNames
      };

      // Add URL only for numeric call numbers (real jobs)
      if (isNumericCall) {
        const techName = encodeURIComponent(((list.techName as any) || '').toString().trim());
        event.url = `${this.document.location.origin}/#/jobs/job-notes-info?CallNbr=${call}&TechName=${techName}`;
      }

      if (!isNumericCall) {
        console.log('[Calendar] Non-numeric callNbr event', { call, startIso, classNames, title: safeTitle });
      }
      this.calendarEvent.push(event);
    }
    this.calendarOptions.events = this.calendarEvent;
  }

  formatEventTitle(title: string): string {
    return title.replace(/<br\s*\/?>/gi, '\n');
  }

  InitFilters(){
    console.log('[Calendar] InitFilters called');
    this.currentUser = this.authService.currentUserValue;
    console.log('[Calendar] Current user:', this.currentUser);
    
    if(this.accountManagers.length <= 0) {
      this.accountManagers = JSON.parse(localStorage.getItem("AccountManagers")!);
    }
    console.log('[Calendar] Account Managers loaded:', this.accountManagers);
    console.log('[Calendar] First Account Manager:', this.accountManagers?.[0]);
    console.log('[Calendar] Account Managers length:', this.accountManagers?.length);

    // Load technicians and states
    this.commonServices.getTechnicians().pipe(takeUntil(this.destroy$)).subscribe(data=> {
      console.log('[Calendar] Technicians API response:', data);
      this.technicians = data;
      console.log('[Calendar] Technicians assigned:', this.technicians);
      
      // After loading techs, check employee status (matching legacy GetValue)
      this.setDefaultFiltersBasedOnRole();
    });
    
    this.commonServices.getStates().subscribe(state => {
      console.log('[Calendar] States API response:', state);
      this.locations = state;
      console.log('[Calendar] Locations assigned:', this.locations);
    });
  }

  // Legacy GetValue implementation: set defaults based on employee status
  setDefaultFiltersBasedOnRole() {
    console.log('[Calendar] setDefaultFiltersBasedOnRole called');
    const empStatus = this.currentUser?.status || '';
    const empID = (this.currentUser?.empID || '').trim();
    console.log('[Calendar] Employee Status:', empStatus, 'Employee ID:', empID);
    
    if (empStatus === 'Technician') {
      console.log('[Calendar] User is Technician, looking for match in:', this.technicians);
      // Find tech in dropdown and select them (API returns techID)
      const techExists = this.technicians?.find((t: any) => t.techID?.toString().trim() === empID.toString().trim());
      console.log('[Calendar] Tech found:', techExists);
      
      if (techExists) {
        console.log('[Calendar] Setting tech dropdown to:', empID.toString().trim());
        this.jobFilterForm.patchValue({
          tech: empID.toString().trim(),
          ownerId: 'All',
          state: 'All',
          type: 'All'
        });
        
        // Disable dropdowns for technicians (legacy behavior)
        this.jobFilterForm.controls.tech.disable();
        this.jobFilterForm.controls.ownerId.disable();
      } else {
        console.log('[Calendar] Tech not found, setting to All');
        this.jobFilterForm.patchValue({
          tech: 'All',
          ownerId: 'All'
        });
      }
    } else if (empStatus === 'Manager' || empStatus === 'Other') {
      console.log('[Calendar] User is Manager/Other, looking in account managers:', this.accountManagers);
      // Check if user is in account managers list
      const mgrExists = this.accountManagers?.find((m: any) => {
        const offid = m.offid?.toString().trim();
        const managerEmpId = m.empID?.toString().trim();
        return offid === empID || managerEmpId === empID;
      });
      console.log('[Calendar] Manager found:', mgrExists);
      
      if (mgrExists) {
        console.log('[Calendar] Setting owner dropdown to:', empID.toString().trim());
        this.jobFilterForm.patchValue({
          ownerId: empID.toString().trim(),
          tech: 'All',
          state: 'All',
          type: 'All'
        });
      } else {
        console.log('[Calendar] Manager not found, setting all to All');
        this.jobFilterForm.patchValue({
          ownerId: 'All',
          tech: 'All',
          state: 'All',
          type: 'All'
        });
      }
      
      // Enable both dropdowns for managers
      this.jobFilterForm.controls.tech.enable();
      this.jobFilterForm.controls.ownerId.enable();
    }
    console.log('[Calendar] Final form values:', this.jobFilterForm.getRawValue());
  }

  handleDateClick(arg: any) {
    const url = arg?.event?.url;
    if (url) {
      window.open(url, '_blank');
      arg.jsEvent?.preventDefault();
      return;
    }
    console.log(this.document.location.origin);
  }

  formInit(){

  }
  SearchJobs(){
    // Get raw values to include disabled controls (for technicians)
    const formValue = this.jobFilterForm.getRawValue();
    
    // Match legacy: convert tech 'All' to '0'
    const tech = formValue.tech === 'All' ? '0' : formValue.tech;
    
    this.payload = {...this.calendarPayload, ...formValue, tech};
    this.getCalendarData(this.payload);
  }
  
  checkOwnerValue() {
    const formValue = this.jobFilterForm.getRawValue();
    const { ownerId, tech, state } = formValue;
  
    if (ownerId === 'All' && tech === 'All' && state === 'All') {
      alert('You must select at least one name');
      return false;
    }
  
    return true;
  }  
}
const appTypes : any[] = [
  {Text : 'All', value:'All'},
  {Text : 'CON', value:'CON'},
  {Text : 'FCD', value:'FCD'},
  {Text : 'APPT', value:'APPT'},
  {Text : 'VACATION', value:'VACATION'},
  {Text : 'TRAINING', value:'TRAINING'},
  {Text : 'CONFERENCE', value:'CONFERENCE'},
  {Text : 'SICK', value:'SICK'},
  {Text : 'TRAVEL', value:'TRAVEL'}
];
