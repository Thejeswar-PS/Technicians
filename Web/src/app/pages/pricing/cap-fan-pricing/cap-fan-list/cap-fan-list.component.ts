import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { CapFanPrice } from 'src/app/core/model/cap-fan-pricing-list-model';
import { PricingService } from 'src/app/core/services/pricing.service';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';
import { AuthService } from 'src/app/modules/auth';

@Component({
  selector: 'app-cap-fan-list',
  templateUrl: './cap-fan-list.component.html',
  styleUrls: ['./cap-fan-list.component.scss']
})
export class CapFanListComponent implements OnInit {

  capFanPricingList : CapFanPrice[] = [];
  capFanPricingRequest: any = {};
  isOpenPricingDetailModel: { [key: number]: boolean } = {};
  selectedIndex: number;
  pricingFilterForm: FormGroup;
  currentUser: any;
  sortedColumn: string = '';
 sortDirection: number = 1;

 sortTable(column: string): void {
  if (this.sortedColumn === column) {
    this.sortDirection = -this.sortDirection;
  } else {
    this.sortedColumn = column;
    this.sortDirection = 1;
  }

  this.capFanPricingList.sort((a, b) => {
    const aValue = (a as any)[column];
      const bValue = (b as any)[column];

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

  constructor(private fb: FormBuilder,
    private _authService: AuthService,
    private filterDashboardService: DashboardFilterSharedService,
    private pricingService: PricingService) { }

  ngOnInit(): void {
    this.currentUser = this._authService.currentUserValue;
    this.initializeForm();
    this.loadPricingList(true);
    this.filterDashboardService.setHomePage(false);
  }

  initializeForm(){
    this.pricingFilterForm = this.fb.group({
      make: new FormControl(''),
      model: new FormControl(''),
      kva: new FormControl(''),
      partName: new FormControl(''),
      dcgPartNo: new FormControl(''),
      oemPartNo: new FormControl(''),
      capfanpart: new FormControl(''),
      status: new FormControl(''),

    })
  }

  loadPricingList(initialLoad: boolean = false){
    if(initialLoad) this.capFanPricingRequest = this.pricingFilterForm.value;
    this.pricingService.getCapFanPriceList(this.capFanPricingRequest).subscribe(res =>{
      this.capFanPricingList = res
      console.log("api response ===>>>>>>>>>>>>>", res)
    })
  }
  filterCapFanList(){
    this.loadPricingList(true);
  }

  openPricingDetailModel(rowIndex: number, index: number){
    this.selectedIndex = index;
    this.isOpenPricingDetailModel[index] = !this.isOpenPricingDetailModel[index];
  }

  isQuoteSelected(param: CapFanPrice): boolean {
    return true
  }

  delete(rowIndex: number, event?: Event) {
    const confirmed = confirm("Are you sure you want to delete this price entry?");
    if (confirmed) {
      this.pricingService.deleteCapFanPrice(rowIndex).subscribe({
        next: () => this.loadPricingList(true),
        error: (err) => console.error('Failed to delete:', err)
      });
    } else {
      event?.preventDefault();
    }
  }
  // delete(rowIndex: number)
  // {
  //   this.pricingService.deleteCapFanPrice(rowIndex).subscribe(res => {
  //     this.loadPricingList(true);
  //   })
  // }

}
