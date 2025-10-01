import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators, FormArray } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { debounceTime, distinctUntilChanged, filter, Subject, takeUntil } from 'rxjs';
import { PriceGroup } from 'src/app/core/model/price-group.model';
import { PricingProfile } from 'src/app/core/model/pricing-profile';
import { PricingService } from 'src/app/core/services/pricing.service';
import { AuthService } from 'src/app/modules/auth';

@Component({
  selector: 'app-battery-pricing-add',
  templateUrl: './battery-pricing-add.component.html',
  styleUrls: ['./battery-pricing-add.component.scss']
})
export class BatteryPricingAddComponent implements OnInit, OnDestroy {
  @ViewChild('priceGroupSelect') priceGroupSelect!: ElementRef<HTMLSelectElement>;

  private destroy$ = new Subject<void>();
  batteryForm: FormGroup;
  public priceGroups: PriceGroup[];
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
    this.currentUser = this._authService.currentUserValue;
    this.initializeForm();
    this.getPricingGroup();
    this.handlePriceGroupChange();


    this.type = this.currentUser.empLevel == 0 ? "ReadOnly" : "Edit";
  }

  initializeForm() {
    this.batteryForm = this.fb.group({
      make: [null, Validators.required],
      model: [null, Validators.required],
      dcgPartNo: [null, Validators.required],
      ampHour: [null, Validators.required],
      wattsPerCell: ['', Validators.required],
      cost: ['', Validators.required],
      terminal: [null],
      dimensions: [null],
      weight: [''],
      warranty: [''],
      vendor: [null],
      notes: [null, Validators.required],
      priceGroup: [null],
      rowColor: [null, Validators.required],
      pricingProfiles: this.fb.array([])
    });

  }

  handlePriceGroupChange() {
    this.batteryForm.get('rowColor')?.valueChanges.pipe(
      filter(val => !!val),
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(selectedGroup => {
      const selectedLabel = this.priceGroupSelect.nativeElement
        .selectedOptions[0].text;
        this.batteryForm.patchValue({priceGroup : selectedLabel});
      this.pricingService.getProfitGuideByPriceGroup(selectedLabel).pipe(
        takeUntil(this.destroy$)
      ).subscribe((res: PricingProfile[]) => {
        this.setPricingProfiles(res);
      })
    });
  }
  setPricingProfiles(profiles: PricingProfile[]) {
    const formArray = this.fb.array<FormGroup>([]);
    for (const profile of profiles) {
      formArray.push(this.fb.group({
        quantity: [{ value : profile.quantity, disabled: true }, Validators.required],
        profitGuide: [profile.profitGuide, Validators.required],
        laborHours: [String(profile.laborHours), Validators.required],
        frieghtEst: [String(profile.frieghtEst), Validators.required],
        laborReady: [profile.laborReady, Validators.required],
        priceGroup: [{ value: profile.priceGroup, disabled: true }, Validators.required],
        qty: [{ value: profile.qty, disabled: true }, Validators.required],
        modifiedBy:[this.currentUser.empName]

      }));
    }
    this.batteryForm.setControl('pricingProfiles', formArray);
  }
  getPricingGroup() {
    this.pricingService.getPricingGroup().pipe(
      takeUntil(this.destroy$)
    ).subscribe((res: PriceGroup[]) => {
      this.priceGroups = res;
    })
  }

  get pricingProfiles(): FormArray {
    return this.batteryForm?.get('pricingProfiles') as FormArray ?? this.fb.array([]);
  }


  onSave() {
    this.batteryForm.enable();
    let payload = this.batteryForm.value;
    this.pricingService.AddDcgPricing(payload).pipe(
      takeUntil(this.destroy$)
    ).subscribe(res => {
      if(res === -2)
      {
        this._toastService.error('Battery, make and model already exist', 'Error!');
        return;
      }
      this._toastService.success('Battery pricing added successessfully', 'Created');
      this.batteryForm.reset();
      this.batteryForm.setControl('pricingProfiles', this.fb.array([]));

      this.router.navigate(['pricing/battery-pricing-edit'],{ queryParams: { id: res}});
    })
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack() {
    window.history.back(); // Go back one step in the browser history

  }

}

