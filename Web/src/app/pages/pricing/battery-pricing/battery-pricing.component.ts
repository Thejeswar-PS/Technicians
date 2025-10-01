import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DcgBatteryPrice } from 'src/app/core/model/dcg-battery-pricing-model';
import { PricingService } from 'src/app/core/services/pricing.service';
import { QuantityComponent } from './quantity/quantity.component';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';

@Component({
  selector: 'app-battery-pricing',
  templateUrl: './battery-pricing.component.html',
  styleUrls: ['./battery-pricing.component.scss']
})
export class BatteryPricingComponent implements OnInit {

  dcgBatteryPricingList : DcgBatteryPrice[] = [];
  dcgBatteryPricingRequest: any = {};
  dcgBatteryIds: number[] = [];
  dcgBatteryPricingFilterForm: FormGroup;
  modalRef: any;

  sortedColumn: string = '';
 sortDirection: number = 1;

 sortTable(column: string): void {
  if (this.sortedColumn === column) {
    this.sortDirection = -this.sortDirection;
  } else {
    this.sortedColumn = column;
    this.sortDirection = 1;
  }

  this.dcgBatteryPricingList.sort((a, b) => {
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
    private pricingService: PricingService,
    private filterDashboardService: DashboardFilterSharedService,
    private modalService: NgbModal) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadDcgPricingList(true);
    this.filterDashboardService.setHomePage(false);
  }
  initializeForm(){
    this.dcgBatteryPricingFilterForm = this.fb.group({
      make: new FormControl(''),
      model: new FormControl(''),
      dimensions: new FormControl(''),
      ampHour: new FormControl(''),
      dcgPartNo: new FormControl(''),
      weight: new FormControl('')
  
    })
  }
  openEnterQuantityModal(){
   const modalRef =  this.modalService.open(QuantityComponent, { centered: true})
   modalRef.componentInstance.dcgIds = this.dcgBatteryIds;
   console.log("battery pricing Id's ====>>>>>",this.dcgBatteryIds)

  }
  getId(Id: number){
    this.dcgBatteryIds.push(Id);
  }

  filterCapFanList(){
    this.loadDcgPricingList(true)
  }

  loadDcgPricingList(initialLoad: boolean = false){
    if(initialLoad) this.dcgBatteryPricingRequest = this.dcgBatteryPricingFilterForm.value;

    this.pricingService.getDcgPriceDetails(this.dcgBatteryPricingRequest).subscribe(res => { this.dcgBatteryPricingList = res

    })
  }

  isQuoteSelected(param: DcgBatteryPrice): boolean {
    return true
  }

}
