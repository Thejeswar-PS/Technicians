import { DatePipe,Location, DOCUMENT  } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { Calendar, CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import { Subject, map, takeUntil } from 'rxjs';
import { CalendarJobDetails } from 'src/app/core/model/calendar-job-details.model';
import { CommonService } from 'src/app/core/services/common.service';
import { JobService } from 'src/app/core/services/job.service';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';

interface IEvent{
  title: string,
  start: string,
  // end: string,
  color: string,
  // forecolor: string,
  allDay: boolean
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
  constructor(@Inject(DOCUMENT) private document: Document,
  private fb: FormBuilder,
  private commonServices: CommonService,
  private jobService: JobService,
  private datePipe: DatePipe,
  private cdr: ChangeDetectorRef,
  private location: Location,
  private filterDashboardService: DashboardFilterSharedService,
  private route: ActivatedRoute,) { }
  ngAfterViewInit(): void {
    this.calendarApi = this.calendarComponent.getApi();
    if (this.jobFilterForm.controls.ownerId.value !== 'All') {
      this.SearchJobs();
    }
  }
  ngOnDestroy(): void {
   this.destroy$.next();
   this.destroy$.complete();
  }

  ngOnInit(): void {
    this.initCalendar();
    this.InitFilters();
    this.filterDashboardService.setHomePage(false);
  }


  initCalendar(){
   this.calendarOptions  = {
    headerToolbar: {
      right: "today prev,next",
      center: "title",
      left: "dayGridMonth",
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
    if(payload.ownerId === 'All' && payload.tech === 'All' && payload.state === 'All' && payload.type === 'All')
    {
      alert('Please select at least one filter');
      return;
    }
    // conssole.log(this.calendarApi.view.currentStart.toDateString());
    this.payload['startDate'] = this.calendarApi.view.currentStart.toDateString()
    this.jobService.getCalenderJobData(payload).pipe(takeUntil(this.destroy$),
    ).subscribe(res => {
      this.jobDetailList = res;
      this.formatEvents(this.jobDetailList)
    })
  }

  formatEvents(details: CalendarJobDetails[]){
    this.calendarEvent = [];

    for (const list of details) {
      let start = list.startDate.toString().split("T");
      // let start = list.startDate.toISOString().replace(/T.*$/, '');
      let end = list.endDate.toString().split("T");
      // let formattedTitle = `${this.datePipe.transform(list.startTime,'h:mm a') as string} - ${this.datePipe.transform(list.endTime,'h:mm a') as string}
      //                         ${list.custName}`;
      let formattedTitle = this.formatEventTitle(list.description);
      let event = {
        id: list.callNbr,
        title: formattedTitle,
        start: start[0] ,
        // end: start[0],
        textColor: '#0000cd',
        allDay : false,
        color: formattedTitle.includes("FCD") ? '#0000cd' :'#ed143d',
        url: formattedTitle.includes("FCD") ? this.document.location.origin + '/#/jobs?jobId=' + list.callNbr.trim() + '&techName=' + list.techName.trim() : ''
        // time: (this.datePipe.transform(list.startTime,'h:mm a') as string)
        // forecolor: list.foreColor
      };
      this.calendarEvent.push(event);
    }
    this.calendarOptions.events = this.calendarEvent;
  }

  formatEventTitle(title: string): string {
    return title.replace(/<br\s*\/?>/gi, '\n');
  }

  InitFilters(){
    // this.commonServices.getAccountManagers().pipe(takeUntil(this.destroy$)).subscribe(managers => {
    //   this.accountManagers = managers;
    // })

    let userData = JSON.parse(localStorage.getItem("userData")!);
    if(this.accountManagers.length <= 0)
    {
      this.accountManagers = JSON.parse(localStorage.getItem("AccountManagers")!);
    }

    var searchIndex = this.accountManagers.find((item : any) => item.empName.trim() === userData.empName.trim());
    if(searchIndex === undefined)
    {
      this.jobFilterForm.patchValue({
        ownerId: 'All'
      });
    }
    else{
      this.jobFilterForm.patchValue({
        ownerId: userData.empID.trim()
      });
    }

    this.commonServices.getTechnicians().pipe(takeUntil(this.destroy$)).subscribe(data=> {
      this.technicians = data;
    })
    this.commonServices.getStates().subscribe(state => {
      this.locations = state;
    })
  }

  handleDateClick(arg:any) {
    console.log(this.document.location.origin);
  }

  formInit(){

  }
  SearchJobs(){
    this.payload = {...this.calendarPayload, ...this.jobFilterForm.value}
    this.getCalendarData(this.payload);
  }
  checkOwnerValue() {
    const { ownerId, tech, state, type } = this.jobFilterForm.controls;
  
    if (
      ownerId.value === 'All' &&
      tech.value === 'All' &&
      state.value === 'All' &&
      type.value === 'All'
    ) {
      alert('Please select at least one filter');
      return false;
    }
  
    return true;
  }  
}
const appTypes : any[] = [
  {Text : 'All',value:'All'}
 ,{Text : 'CON',value:'CON' }
 ,{Text : 'FCD',value:'FCD' }
 ,{Text : 'APPT',value:'3APPT' }
 ,{Text : 'VACATION',value:'VACATION' }
 ,{Text : 'TRAINING',value:'TRAINING' }
 ,{Text : 'CONFERENCE',value:'CONFERENCE' }
 ,{Text : 'SICK',value:'SICK' }
 ,{Text : 'TRAVEL',value:'TRAVEL' }
];
