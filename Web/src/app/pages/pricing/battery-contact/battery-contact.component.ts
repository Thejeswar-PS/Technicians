import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BatteryContactAddUpdateComponent } from './battery-contact-add-update/battery-contact-add-update.component';
import { PricingService } from 'src/app/core/services/pricing.service';
import { BatteryContact } from 'src/app/core/model/battery-contact.modal';
import { EMPTY, Subject, catchError, takeUntil } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'src/app/modules/auth';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';

@Component({
  selector: 'app-battery-contact',
  templateUrl: './battery-contact.component.html',
  styleUrls: ['./battery-contact.component.scss']
})
export class BatteryContactComponent implements OnInit, OnDestroy {
  destroy$ = new Subject<void>();
  vendorContactList: BatteryContact[] = [];
  filteredVendor?: BatteryContact;
  currentUser?: any;
  sortedColumn: string = '';
 sortDirection: number = 1;

 sortTable(column: string): void {
  if (this.sortedColumn === column) {
    this.sortDirection = -this.sortDirection;
  } else {
    this.sortedColumn = column;
    this.sortDirection = 1;
  }

  this.vendorContactList.sort((a, b) => {
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

  constructor(private dialogService: NgbModal,
    private pricingService: PricingService,
    private _snackBar: MatSnackBar,
    private filterDashboardService: DashboardFilterSharedService,
    private _authService: AuthService ) { }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnInit(): void {
    this.getVendorLists();
    this.currentUser = this._authService.currentUserValue;
    this.filterDashboardService.setHomePage(false);
  }
  deleteRecord(vendor: BatteryContact){
    if(confirm("Are you sure you want to delete?"))
    {
      vendor.modifiedBy = this.currentUser.empName;
      this.pricingService.deleteBatteryContactDetails(vendor).pipe(takeUntil(this.destroy$),
      catchError((err:any) =>{
        return EMPTY
      })
      ).subscribe((res: any) => {
        this.getVendorLists();
      })
    }
    else
    {
      event?.preventDefault();
    }
    
  }
  getVendorLists(){
    this.pricingService.getBatteryContacts().subscribe(res => {
      this.vendorContactList = res;
    })
  }
  searchVendor(email: string){
    this.filteredVendor = this.vendorContactList.find(vendor => vendor.email === email);
  }
  openAddNewDialog(){
    let dialogRef = this.dialogService.open(BatteryContactAddUpdateComponent, {centered: true});
    dialogRef.componentInstance.formType = {new: true, update: false}
    dialogRef.result.then((result) =>{
      if(result === 'add'){
        this.getVendorLists();
        dialogRef.close();
        this._snackBar.open("Contact added")
      }
      this.getVendorLists();
    }).catch((reason) =>{
      console.log(reason)
    })

  }
  openEditDialog(email: any){
    this.searchVendor(email);
    let dialogRef = this.dialogService.open(BatteryContactAddUpdateComponent, {centered: true, modalDialogClass: 'dialog-max-width'});
    dialogRef.componentInstance.contactDetails =  this.filteredVendor;
    dialogRef.componentInstance.formType = {new: false, update: true};
    dialogRef.result.then((result) =>{
      if(result === 'update'){
        this.getVendorLists();
        dialogRef.close();
        //this._snackBar.open("Contact updated")
        this.getVendorLists();
      }
    }).catch((reason) =>{
      console.log(reason)
    })

  }


}


