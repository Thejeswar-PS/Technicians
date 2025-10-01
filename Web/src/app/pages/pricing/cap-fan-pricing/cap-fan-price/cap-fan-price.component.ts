import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CalculatePriceDetails } from 'src/app/core/model/cap-fan-price-calculate.model';
import { CapFanPriceDetails } from 'src/app/core/model/cap-fan-pricing-model';
import { PricingService } from 'src/app/core/services/pricing.service';
import { AuthService } from 'src/app/modules/auth';
import { ToastrService } from 'ngx-toastr';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';
@Component({
  selector: 'app-cap-fan-price',
  templateUrl: './cap-fan-price.component.html',
  styleUrls: ['./cap-fan-price.component.scss']
})
export class CapFanPriceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  capFanPriceDetails: CapFanPriceDetails[] = [];

  newCapFanPriceDetails: CapFanPriceDetails = {};
  @Input() rowIndex: number | null;
  @Input() quantity: number | null;
  @Input() pricing: string | null;
  @Input() freight: string | null;
  @Input() showTotals: boolean=true;
  @Input() type: string;// 'Edit' | 'ReadOnly'
  rowIndexViaParam: number;
  isShowCalculatedValues: boolean = false;
  calculatedPriceDetails: CalculatePriceDetails ={
    dcgCost: 0,
    salePrice: 0,
    totalCost: 0,
    totalSale: 0,
  }
  calculatedPriceDetailsViewOnly: CalculatePriceDetails ={
    dcgCost: 0,
    salePrice: 0,
    totalCost: 0,
    totalSale: 0,
  }

  sortedColumn: string = '';
 sortDirection: number = 1;
 addNewSubmitted: boolean = false;
 currentUser: any;

 constructor(
  private pricingService: PricingService,
  private activatedRoute: ActivatedRoute,
  private _authService: AuthService,
  private _toastrService: ToastrService,
  private filterDashboardService: DashboardFilterSharedService,
) { }

 ngOnInit(): void {
  this.activatedRoute.queryParams.subscribe(params => {
    this.rowIndexViaParam = params['rowIndex'];
    console.log("activatedRoute param",this.rowIndexViaParam)
    if(this.rowIndexViaParam !== undefined) this.loadCapFanPriceDetails(this.rowIndexViaParam);
  })
  if(this.rowIndex !== undefined) this.loadCapFanPriceDetails(this.rowIndex as number);
  this.currentUser = this._authService.currentUserValue;
  this.filterDashboardService.setHomePage(false);
}


 sortTable(column: string): void {
  if (this.sortedColumn === column) {
    this.sortDirection = -this.sortDirection;
  } else {
    this.sortedColumn = column;
    this.sortDirection = 1;
  }

  this.capFanPriceDetails.sort((a, b) => {
    const aValue = (a as any)[column];
      const bValue = (b as any)[column];

    if (aValue < bValue) {
      return -1 * this.sortDirection;
    } else if (aValue > bValue) {
      return 1 * this.sortDirection;
    } else {
      return 0;
    }

  });
}

sortIcon(column: string): string {
  if (this.sortedColumn === column) {
    return this.sortDirection === 1 ? 'fa-sort-up' : 'fa-sort-down';
  }
  return 'fa-sort';
}

  onOrderQuantityChange(capFanPricingDetail: any)
  {
    capFanPricingDetail.totalCost = parseFloat(
      (capFanPricingDetail.qtyToOrder * capFanPricingDetail.dcgCost).toFixed(2)
    );
    capFanPricingDetail.totalSale = parseFloat(
      (capFanPricingDetail.qtyToOrder * capFanPricingDetail.salePrice).toFixed(2)
    );
    this.calculateTotal();
    this.getCalculateTotalViewOnly();
    console.log(this.calculatedPriceDetailsViewOnly.totalCost);
  }
  calculateTotal(){
    this.calculatedPriceDetailsViewOnly.salePrice = 0;
    this.calculatedPriceDetailsViewOnly.dcgCost = 0;
    this.calculatedPriceDetailsViewOnly.totalCost = 0;
    this.calculatedPriceDetailsViewOnly.totalSale = 0;
    for(const ele of this.capFanPriceDetails)
    {
      this.calculatedPriceDetailsViewOnly.salePrice += ele.salePrice != undefined ? ele.salePrice : 0;
      this.calculatedPriceDetailsViewOnly.dcgCost += ele.dcgCost != undefined ? ele.dcgCost : 0;
      this.calculatedPriceDetailsViewOnly.totalCost += ele.totalCost != undefined ? ele.totalCost : 0;
      this.calculatedPriceDetailsViewOnly.totalSale += ele.totalSale != undefined ? ele.totalSale : 0;
    }
    this.isShowCalculatedValues = false;
  }
  getCalculateTotalViewOnly()
  {
    this.calculatedPriceDetailsViewOnly.salePrice = 0;
    this.calculatedPriceDetailsViewOnly.dcgCost = 0;
    this.calculatedPriceDetailsViewOnly.totalCost = 0;
    this.calculatedPriceDetailsViewOnly.totalSale = 0;
    for(const ele of this.capFanPriceDetails)
    {
      this.calculatedPriceDetailsViewOnly.salePrice += ele.salePrice != undefined ? ele.salePrice : 0;
      this.calculatedPriceDetailsViewOnly.dcgCost += ele.dcgCost != undefined ? ele.dcgCost : 0;
      this.calculatedPriceDetailsViewOnly.totalCost += ele.totalCost != undefined ? ele.totalCost : 0;
      this.calculatedPriceDetailsViewOnly.totalSale += ele.totalSale != undefined ? ele.totalSale : 0;
    }
  }
  formatDecimal() {
    // for(const ele of this.capFanPriceDetails)
    //   {
    //     let p  = (ele.dcgCost ?? 0).toFixed(2);
    //     ele.dcgCost = parseFloat((ele.dcgCost ?? 0).toFixed(2));
    //     ele.salePrice = parseFloat((ele.salePrice ?? 0).toFixed(2));
    //     // this.calculatedPriceDetailsViewOnly.dcgCost += ele.dcgCost != undefined ? ele.dcgCost : 0;
    //     // this.calculatedPriceDetailsViewOnly.totalCost += ele.totalCost != undefined ? ele.totalCost : 0;
    //     // this.calculatedPriceDetailsViewOnly.totalSale += ele.totalSale != undefined ? ele.totalSale : 0;
    //   }
  }
  formatAllDecimals() {
    // Format all properties on page load
    // this.formatDecimal('dcgCost');
    // this.formatDecimal('salePrice');
    // this.formatDecimal('totalCost');
    // this.formatDecimal('totalSale');
  }
  loadCapFanPriceDetails(index:number){
    this.pricingService.getCapFanPriceDetails(index).pipe(
      takeUntil(this.destroy$)
    ).subscribe(details => {
        this.capFanPriceDetails = details;
        if(this.currentUser.empLevel === 1)
        {
        this.getCalculateTotalViewOnly();
        }
        this.formatDecimal();
      })
  }
  addNewChild()
  {
    this.addNewSubmitted = true;
    if(this.isUndefinedOrEmpty(this.newCapFanPriceDetails.partName) || this.isUndefinedOrEmpty(this.newCapFanPriceDetails.oemPartNo) || this.isUndefinedOrEmpty(this.newCapFanPriceDetails.dcgPartNo))
    {
      return;
    }
    this.addNewSubmitted = false;
    this.newCapFanPriceDetails.createdBy = this.currentUser.empName;
    this.newCapFanPriceDetails.rowIndex = this.rowIndexViaParam;
    this.pricingService.addNewChild(this.newCapFanPriceDetails).subscribe(res => {
      if(res)
      {
        this.loadCapFanPriceDetails(this.rowIndexViaParam as number);
        this.newCapFanPriceDetails = {}
        this._toastrService.success('Added', 'New data added successfully');
      }
      else{
        this._toastrService.error('Error!', 'Something went wrong');
      }
    })
  }
  updateChild(details: CapFanPriceDetails)
  {
    this.pricingService.updateChild(details).subscribe(res => {
      if(res)
      {
        this._toastrService.success('Updated', 'Data updated successfully');
      }
      else{
        this._toastrService.error('Error!', 'Something went wrong');
      }
    })
  }
  updateBulkChild()
  {
    this.pricingService.updateBulkChild(this.capFanPriceDetails).subscribe(res => {
      if(res)
      {
        this._toastrService.success('Updated', 'Data updated successfully');
      }
      else{
        this._toastrService.error('Error!', 'Something went wrong');
      }

    })
  }
  deleteChild(details: CapFanPriceDetails)
  {
    this.pricingService.deleteChild(details).subscribe(res => {
      if(res)
      {
        this.loadCapFanPriceDetails(this.rowIndexViaParam as number);
        this._toastrService.success('Deleted', 'Data deleted successfully');
      }
      else{
        this._toastrService.error('Error!', 'Something went wrong');
      }
    })
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  isUndefinedOrEmpty(data: any)
  {
    if(data === undefined || data === '')
      {
        return true;
      }
      return false;
  }

}


