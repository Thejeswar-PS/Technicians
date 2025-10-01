import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { QuotesService } from 'src/app/core/services/quotes.service';
import { QuoteChartDetails } from 'src/app/_metronic/partials/content/widgets/charts/charts-custom-widget/charts-custom-widget.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// import { QuoteDetailsModalComponent } from '../modal/quote-details/quote-details.component';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { filter, pairwise, startWith } from 'rxjs/operators'
import { DatePipe } from '@angular/common';
import { toInteger } from 'lodash';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';



@Component({
  selector: 'app-site-maintenance-list',
  templateUrl: './list.component.html',
  styleUrls: []
})
export class ListComponent implements OnInit {
  quotesList : any = {} ;
  accountManagers : any = [];
  quoteOwner: any;
  Type : any = [{}];
  selectedQuotes: string[] = [];
  quotefilterForm = this.fb.group({
    AccountManager : ['A']
  });
  formattedDate: string = "";





  constructor(
    private quotesService : QuotesService,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private router: Router,
    private datePipe: DatePipe,
    private filterDashboardService: DashboardFilterSharedService
    ) {

      router.events.subscribe((event) => {
        if (event instanceof NavigationStart) {
          let browserRefresh = !router.navigated;
        }
      });
      const date = new Date();
      this.formattedDate = this.formatDate(date);
    }
    search() {
    const selectedDate = (document.getElementById('datepicker') as HTMLInputElement).value;
    // Perform search action using the selected date
    console.log('Searching for:', selectedDate);
    this.formattedDate = selectedDate;
    this.LoadData();
  }


  ngOnInit(): void {

    this.filterDashboardService.setHomePage(false);
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        let pageReloading = !this.router.navigated;
        console.log(pageReloading)
      }
  });

  this.route.queryParamMap.subscribe((params) => {
    if(params.has('quoteOwner'))
    {
      this.quoteOwner = params.get('quoteOwner');
      this.quotefilterForm.controls['AccountManager'].setValue(params.get('quoteOwner'));
    }
  });


    this.LoadData();
    this.LoadFilters();
    // this.LoadFiscalYears();
    this.onFilterChanges();
    console.log( this.formattedDate);
  }

  public formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  public LoadData()
  {
    var quotesRequestBody;
    quotesRequestBody = JSON.parse(JSON.stringify(this.quotefilterForm.value));


    this.quotesService.getQuoteSummary(this.formattedDate, quotesRequestBody).subscribe((data: any)  => {
      this.quotesList = data;
      // this.paginationObj = data.paginationObj;

    })
  }

  public onFilterChanges()
  {
  // this.quotefilterForm.controls.QuoteID.enable({onlySelf: true,emitEvent:false});
    this.quotefilterForm.valueChanges.pipe(startWith(undefined), pairwise())
    .subscribe(valuesArray => {
         this.LoadData()
         this.selectedQuotes = [];

        //  if ((oldVal !== undefined && oldVal['QuoteID'] === newVal?.QuoteID)) {
        //   this.paginationObj['PageNumber'] = 1;
        //   this.LoadData(false);
        //  }
    })
  }

  public LoadFilters()
  {
    this.quotesService.getQuoteAccountManagers('A').subscribe((data: any)  => {
      this.accountManagers = data;
      const searchIndex = data.find((x: { text: string; }) => x.text.trim() == this.quoteOwner);
      if(searchIndex === undefined)
      {
        this.quotefilterForm.controls['AccountManager'].setValue('A');
      }
      else{
        this.quotefilterForm.controls['AccountManager'].setValue(this.quoteOwner);
      }
      });
  }

  splitString(str: string): string[] {
    return str.split(';');
  }


  getColorByStatus(status: string): string {
    switch (status) {
      case 'Sent':
        return '#E8A90E';
      case 'Viewed':
        return '#008ed6';
      case 'In Discussion':
        return '#cc00cc';
      case 'Accepted':
        return '#00b300';
      case 'Declined':
        return '#e60000';
      case 'To Be Sent':
          return '#958C02';
      case 'Cancelled':
            return '#730202';
      case 'Draft':
            return 'gray';

      // Add more cases for other status if needed
      default:
        return 'gray'; // Default color when the status doesn't match any case
    }
  }


  getColorByPriority(quotePriority: string): string {
    switch (quotePriority) {
      case 'Normal':
            return 'light red';
      default:
        return 'light red';
    }
  }

}
