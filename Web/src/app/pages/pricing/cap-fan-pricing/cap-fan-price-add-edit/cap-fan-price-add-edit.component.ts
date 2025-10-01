import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { CapFanPrice } from 'src/app/core/model/cap-fan-pricing-list-model';
import { PricingService } from 'src/app/core/services/pricing.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from 'src/app/modules/auth';

@Component({
  selector: 'app-cap-fan-price-add-edit',
  templateUrl: './cap-fan-price-add-edit.component.html',
  styleUrls: ['./cap-fan-price-add-edit.component.scss']
})
export class CapFanPriceAddEditComponent implements OnInit, OnDestroy {

  @Input() isEdit: boolean = false;

  private destroy$ = new Subject<void>();
  formCapFanPricingUpdate: FormGroup;
  private capFanPricingList: CapFanPrice[] = [];
  private filteredList: CapFanPrice;
  private capFanPricingReq: any = {};
  private rowIndex: number;
  currentUser: any;
  type: string = "ReadOnly";

  constructor(
    private fb: FormBuilder,
    private pricingService: PricingService,
    private router: Router,
    private activeRoute: ActivatedRoute,
    private _toastService: ToastrService,
    private _authService: AuthService,) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadCapFanPricingList(true);
    this.currentUser = this._authService.currentUserValue;
    this.type = this.currentUser.empLevel == 0 ? "ReadOnly" : "Edit";
  }

  getQueryParams(capFanList: CapFanPrice[]){
    if(true)//this.currentUser.empLevel == 1)
    {
      this.activeRoute.queryParams.subscribe((param: any) => {
        this.type = "addNew";
        this.rowIndex = 0;

        if (param['rowIndex']) {
          this.isEdit = true;
          this.type = "Edit";
          this.rowIndex = parseInt(param['rowIndex']);
          this.filteredList = capFanList.find(list => list.rowIndex === this.rowIndex ) as CapFanPrice;
          this.loadForm(this.filteredList);
        }
      })
    }
  }

  loadCapFanPricingList(initialLoad: boolean = false){
    if(initialLoad) this.capFanPricingReq = this.formCapFanPricingUpdate.value;
    this.pricingService.getCapFanPriceList(this.capFanPricingReq).pipe(
      takeUntil(this.destroy$)
    ).subscribe(res => {
      this.capFanPricingList = res;
      this.getQueryParams(this.capFanPricingList)
    })
  }

  get formControls(){
    return this.formCapFanPricingUpdate.controls;
  }

  loadForm(payload: CapFanPrice){
    this.formControls['make'].setValue(payload.make);
    this.formControls['modelName'].setValue(payload.modelName);
    this.formControls['model'].setValue(payload.model);
    this.formControls['kva'].setValue(payload.kva);
    this.formControls['freight'].setValue(payload.freight);
    this.formControls['inOutVolt'].setValue(payload.inOutVolt);
    this.formControls['sngParallel'].setValue(payload.sngParallel);
    this.formControls['quoteHours'].setValue(payload.quoteHours);
    this.formControls['pricing'].setValue(payload.pricing);
    this.formControls['notes'].setValue(payload.notes);
    this.formControls['rowIndex'].setValue(payload.rowIndex);
    this.formControls['serialNo'].setValue(payload.serialNo);
  }

  initializeForm(){

    this.formCapFanPricingUpdate =  this.fb.group({
      make: new FormControl(''),
      modelName: new FormControl(''),
      model: new FormControl(''),
      kva: new FormControl(''),
      freight: new FormControl(''),
      inOutVolt: new FormControl(''),
      sngParallel: new FormControl(''),
      quoteHours: new FormControl(''),
      pricing: new FormControl(''),
      rowIndex: new FormControl(''),
      notes: new FormControl(''),
      serialNo: new FormControl(''),

    })
  }



  onSave(){
    let payload = {...this.formCapFanPricingUpdate.value, ...{serialno: '', rowIndex: this.rowIndex}}
    this.pricingService.updateCapFanPrice(payload).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (res) => {
        if(res === 0)
          this._toastService.success('Data updated successfully', 'Updated');
        else if(res > 0)
          window.location.href = `${window.location.href}?rowIndex=${res}`;
        // this.router.navigate(['/pricing/CapFanPricing']);
      },
      error: (err) => {
        console.error('Error updating data:', err);
        this._toastService.error('Failed to update data. Please try again.', 'Error');
      }
    });
  }



  print(){window.print()}

  ngOnDestroy(){
    this.destroy$.next();
    this.destroy$.complete();
  }

}



