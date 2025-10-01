import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { CapFanPrice } from 'src/app/core/model/cap-fan-pricing-list-model';
import { DcgBatteryPrice, DcgBatteryPriceEdit } from 'src/app/core/model/dcg-battery-pricing-model';
import { PriceGroup } from 'src/app/core/model/price-group.model';
import { PricingService } from 'src/app/core/services/pricing.service';
import { AuthService } from 'src/app/modules/auth';

@Component({
  selector: 'app-battery-pricing-edit',
  templateUrl: './battery-pricing-edit.component.html',
  styleUrls: ['./battery-pricing-edit.component.scss']
})
export class BatteryPricingEditComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  formBatteryPricingUpdate: FormGroup;
  private batteryPriceDetails: DcgBatteryPriceEdit;
  public priceGroups: PriceGroup[];
  private filteredList: CapFanPrice;
  private capFanPricingReq: any = {};
  public id: number = 0;
  currentUser: any;
  type: any;

  constructor(
    private fb: FormBuilder,
    private pricingService: PricingService,
    private router: Router,
    private activeRoute: ActivatedRoute,
    private _toastService: ToastrService,
    private _authService: AuthService,) { }

  ngOnInit(): void {
    this.initializeForm();
    this.getPricingGroup();
    this.getQueryParams();

    this.currentUser = this._authService.currentUserValue;
    this.type = this.currentUser.empLevel == 0 ? "ReadOnly" : "Edit";
  }

  getQueryParams() {
    this.activeRoute.queryParams.subscribe((param: any) => {
      this.id = parseInt(param['id']);
      this.getBatteryPricingById(this.id);
    })
  }
  initializeForm() {

    this.formBatteryPricingUpdate = this.fb.group({
      make: new FormControl({value: '', disabled: true}),
      model: new FormControl({value: '', disabled: true}),
      dcgPartNo: new FormControl({value: '', disabled: true}),
      ampHour: new FormControl(''),
      wattsPerCell: new FormControl(''),
      cost: new FormControl(''),
      terminal: new FormControl(''),
      dimensions: new FormControl(''),
      weight: new FormControl(''),
      warranty: new FormControl(''),
      vendor: new FormControl(''),
      notes: new FormControl(''),
      priceGroup: new FormControl(''),
      rowColor: new FormControl(''),

    })
  }
  getPricingGroup() {
    this.pricingService.getPricingGroup().pipe(
      takeUntil(this.destroy$)
    ).subscribe((res: PriceGroup[]) => {
      this.priceGroups = res;
    })
  }
  getBatteryPricingById(id: any) {
    this.pricingService.getBatteryPriceById(id).pipe(
      takeUntil(this.destroy$)
    ).subscribe((res: DcgBatteryPriceEdit) => {
      this.batteryPriceDetails = res;
      this.loadForm(this.batteryPriceDetails);
    })
  }

  get formControls() {
    return this.formBatteryPricingUpdate.controls;
  }

  loadForm(payload: DcgBatteryPriceEdit) {
    this.formControls['make'].setValue(payload.make);
    this.formControls['model'].setValue(payload.model);
    this.formControls['dcgPartNo'].setValue(payload.dcgPartNo);
    this.formControls['ampHour'].setValue(payload.ampHour);
    this.formControls['wattsPerCell'].setValue(payload.wattsPerCell);
    this.formControls['cost'].setValue(payload.cost);
    this.formControls['terminal'].setValue(payload.terminal);
    this.formControls['dimensions'].setValue(payload.dimensions);
    this.formControls['weight'].setValue(payload.weight);
    this.formControls['warranty'].setValue(payload.warranty);
    this.formControls['vendor'].setValue(payload.vendor);
    this.formControls['notes'].setValue(payload.notes);
    this.formControls['priceGroup'].setValue(payload.priceGroup);
    this.formControls['rowColor'].setValue(payload.rowColor);
  }





  onSave() {
    this.formBatteryPricingUpdate.enable();
    let payload = { ...this.formBatteryPricingUpdate.value, ...{ id: this.id } }
    this.pricingService.updateDcgPricingDetails(payload).pipe(
      takeUntil(this.destroy$)
    ).subscribe(res => {
      this._toastService.success('Data updated successessfully', 'Updated');

    })
  }



  print() { window.print() }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack() {
    window.history.back(); // Go back one step in the browser history
  
  }

}




