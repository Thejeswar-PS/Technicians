import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { QuotesService } from 'src/app/core/services/quotes.service';
import { QuoteChartDetails } from 'src/app/_metronic/partials/content/widgets/charts/charts-custom-widget/charts-custom-widget.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// import { QuoteDetailsModalComponent } from '../modal/quote-details/quote-details.component';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { filter, pairwise, startWith } from 'rxjs/operators'
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';

interface Quote {
  [key: string]: string;
  custNmbr: string;
  custName: string;
  stopDaysCount: string;
  reminderType: string;
  modifiedBy: string;
  modifiedDate: string;
}

@Component({
  selector: 'app-site-maintenance-list',
  templateUrl: './list.component.html',
  styleUrls: []
})
export class ListComponent implements OnInit {
  quotesList : Quote[] = [] ;
  accountManagers : any = [];
  quoteOwner: any;
  Type : any = [{}];
  selectedQuotes: string[] = [];
  quotefilterForm = this.fb.group({
    AccountManager : ['A'],
    Type : ['A'],
    SearchText : null
  });

  sortedColumn: string = '';
  sortDirection: number = 1;

  sortTable(column: string): void {
    if (this.sortedColumn === column) {
      this.sortDirection = -this.sortDirection;
    } else {
      this.sortedColumn = column;
      this.sortDirection = 1;
    }

    this.quotesList.sort((a, b) => {
      const aValue = a[column];
      const bValue = b[column];




      if (aValue < bValue) {
        //console.log("b greater");
        return -1 * this.sortDirection;
      } else if (aValue > bValue) {
        //console.log("a greater");
        return 1 * this.sortDirection;
      } else {
        return 0;
      }

  // Handle other cases here, if needed

    });
  }

  sortIcon(column: string): string {
    if (this.sortedColumn === column) {
      return this.sortDirection === 1 ? 'fa-sort-up' : 'fa-sort-down';
    }
    return 'fa-sort';
  }

  selectAllRows(event: any): void {
    if (event.target.checked) {
      // Select all quotes
      this.selectedQuotes = this.quotesList.map(quote => quote.quoteID);
    } else {
      // Deselect all quotes
      this.selectedQuotes = [];
    }
  }

  isQuoteSelected(quote: Quote): boolean {
    return this.selectedQuotes.includes(quote.custNmbr);
  }

  constructor(
    private quotesService : QuotesService,
    private fb: FormBuilder,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private router: Router,
    private filterDashboardService: DashboardFilterSharedService
    ) {

      router.events.subscribe((event) => {
        if (event instanceof NavigationStart) {
          let browserRefresh = !router.navigated;
        }
      });
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
    if(params.has('Type'))
    {
      this.quotefilterForm.controls['Type'].setValue(params.get('Type'));
    }
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
  }

  public LoadData()
  {
    var quotesRequestBody;
    quotesRequestBody = JSON.parse(JSON.stringify(this.quotefilterForm.value));


    this.quotesService.getReports(quotesRequestBody).subscribe((data: any)  => {
      this.quotesList = data && data.length > 0 ? data.slice(0,100) : [];
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


  openQuoteDetailsModal(quoteId: any) {


  }

  rowSelect(quote: any)
  {
    if(this.selectedQuotes.includes(quote.custNmbr.trim()))
    {
      this.selectedQuotes.splice(this.selectedQuotes.indexOf(quote.custNmbr.trim()),1);
    }
    else{
      this.selectedQuotes.push(quote.custNmbr.trim());
    }
  }
  changeStatus()
  {

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
  search()
  {
    this.quotesService.GetSearchedSiteDetails(this.quotefilterForm.value.SearchText).subscribe((data: any)  => {
      this.quotesList = data && data.length > 0 ? data.slice(0,10) : [];
    })
  }
}
