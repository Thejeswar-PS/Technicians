import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PricingProfile } from 'src/app/core/model/pricing-profile';
import { PricingService } from 'src/app/core/services/pricing.service';
import { QuantityComponent } from '../quantity/quantity.component';
import { PricingProfileEditComponent } from '../pricing-profile-edit/pricing-profile-edit.component';

@Component({
  selector: 'app-pricing-profile-list',
  templateUrl: './pricing-profile-list.component.html',
  styleUrls: ['./pricing-profile-list.component.scss']
})
export class PricingProfileListComponent implements OnInit {

  @Input() id: any;

  pricingProfiles : PricingProfile[] = [];
  dcgBatteryPricingRequest: any = {};
  dcgBatteryIds: number[] = [];
  // dcgBatteryPricingFilterForm: FormGroup;
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

//   this.dcgBatteryPricingList.sort((a, b) => {
//     const aValue = (a as any)[column];
//       const bValue = (b as any)[column];

//     console.log(aValue[0]);


//     if (aValue < bValue) {
//       //console.log("b greater");
//       return -1 * this.sortDirection;
//     } else if (aValue > bValue) {
//       //console.log("a greater");
//       return 1 * this.sortDirection;
//     } else {
//       return 0;
//     }

// // Handle other cases here, if needed

//   });
}

sortIcon(column: string): string {
  if (this.sortedColumn === column) {
    return this.sortDirection === 1 ? 'fa-sort-up' : 'fa-sort-down';
  }
  return 'fa-sort';
}

  constructor(private fb: FormBuilder,
    private pricingService: PricingService,
    private modalService: NgbModal) { }

  ngOnInit(): void {
    this.loadPricingProfileList(true);
  }

  openEnterQuantityModal(){
   const modalRef =  this.modalService.open(QuantityComponent, { centered: true})
   modalRef.componentInstance.dcgIds = this.dcgBatteryIds;
   console.log("battery pricing Id's ====>>>>>",this.dcgBatteryIds)

  }
  getId(Id: number){
    this.dcgBatteryIds.push(Id);
  }

  loadPricingProfileList(initialLoad: boolean = false){
    // if(initialLoad) this.dcgBatteryPricingRequest = this.dcgBatteryPricingFilterForm.value;

    this.pricingService.getProfitGuideById(this.id).subscribe(res => {
      this.pricingProfiles = res
    })
  }
  openEditDialog(data: any){

    let dialogRef = this.modalService.open(PricingProfileEditComponent, {centered: true, modalDialogClass: 'dialog-max-width'});
    dialogRef.componentInstance.id =  this.id;
    dialogRef.componentInstance.pricingProfile =  data;
    dialogRef.componentInstance.formType = {new: false, update: true};
    dialogRef.result.then((result) =>{
      if(result === 'update'){
        this.loadPricingProfileList();
        dialogRef.close();
      }
    }).catch((reason) =>{
      console.log(reason)
    })

  }
}
