import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { QuotesService } from 'src/app/core/services/quotes.service';
import { QuoteChartDetails } from 'src/app/_metronic/partials/content/widgets/charts/charts-custom-widget/charts-custom-widget.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// import { QuoteDetailsModalComponent } from '../modal/quote-details/quote-details.component';
import { ChangeStatusModalComponent } from '../modal/change-status-modal/change-status-modal.component';
import { ActivatedRoute, NavigationEnd, NavigationStart, Router } from '@angular/router';
import { filter, pairwise, startWith } from 'rxjs/operators'
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';

interface Quote {
  [key: string]: string;
  quoteID: string;
  custNmbr: string;
  name: string;
  quoteStatus: string;
  owner: string;
  problemCode: string;
  quotedOn: string;
  quoteAmount: string;
  age : string;
  // ... Add other properties ...
}

@Component({
  selector: 'app-list',
  templateUrl: './list.component.html',
  styleUrls: []
})
export class ListComponent implements OnInit {
  quotesList : Quote[] = [] ;
  accountManagers : any = [];
  quoteOwner: any;

  quoteStatus : any = [
    {
      statusDesc:"In Progress",
      statusCode:"IP"
    },
    {
      statusDesc:"Sent",
      statusCode:"SE"
    },
    {
      statusDesc:"Cancelled",
      statusCode:"CN"
    },
    {
      statusDesc:"Email Missing",
      statusCode:"EM"
    },
    {
      statusDesc:"Ready to Send",
      statusCode:"DR"
    },
  ];
  fiscalYears : Array<number> = [];
  selectedQuotes: string[] = [];
  fromEditPage: boolean = false;
  quotefilterForm = this.fb.group({
    AccountManager : ['A'],
    QuoteStatus : ['A'],
    Statustype : ['0'],
  });
  paginationObj  : any = {};//= {pageNumber : 1 ,pageSize : 10, totalRecordsCount : 680 };

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

      console.log(aValue[0]);


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
    return this.selectedQuotes.includes(quote.quoteID);
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
      if(params.has('isCancel'))
      {
        if(params.get('isCancel') === 'true')
        {
          this.fromEditPage = true;
        }
      }
      if(params.has('quoteOwner'))
      {
        this.quoteOwner = params.get('quoteOwner');
        this.quotefilterForm.controls['AccountManager'].setValue(params.get('quoteOwner'));
      }
    }
  );

    this.LoadData();
    this.LoadFilters();
    // this.LoadFiscalYears();
    this.onFilterChanges();
    this.sortTable('quoteStatus');
  }

  public LoadData()
  {
    var quotesRequestBody;
    if(this.fromEditPage)
    {
      quotesRequestBody = JSON.parse(localStorage.getItem('QuoteListFilter')!)
      this.quotefilterForm.patchValue(quotesRequestBody);
    }
    else
    {
      quotesRequestBody = JSON.parse(JSON.stringify(this.quotefilterForm.value));
    }

    this.quotesService.GetAppToBeSent(quotesRequestBody).subscribe((data: any)  => {
      this.quotesList = data && data.length > 0 ? data : [];
      // this.paginationObj = data.paginationObj;
    
    this.sortTable('quoteStatus');

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
  openChangeStatusModal(){
    const modalRef = this.modalService.open(ChangeStatusModalComponent,{ fullscreen : "lg", centered: true});
    modalRef.componentInstance.quoteId = this.selectedQuotes;
    modalRef.componentInstance.selectedQuoteIds = this.selectedQuotes;
  }

  rowSelect(quote: any)
  {
    if(this.selectedQuotes.includes(quote.quoteID))
    {
      this.selectedQuotes.splice(this.selectedQuotes.indexOf(quote.quoteID),1);
    }
    else{
      this.selectedQuotes.push(quote.quoteID);
    }
  }
  changeStatus()
  {

  }

  getColorByStatus(status: string): string {
    switch (status) {
      case 'Email Missing':
        return '#730202';
      case 'In Progress':
        return '#008ed6';
      case 'Ready to Send':
        return '#00b300';
      case 'Sent':
        return '#E8A90E';
      case 'Cancelled':
        return 'red';
      // Add more cases for other status if needed
      default:
        return 'black'; // Default color when the status doesn't match any case
    }
  }



}
