import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroup, FormBuilder, FormControl, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { Subject, takeUntil } from 'rxjs';
import { BatteryContact } from 'src/app/core/model/battery-contact.modal';
import { PricingProfile } from 'src/app/core/model/pricing-profile';
import { PricingService } from 'src/app/core/services/pricing.service';
import { AuthService } from 'src/app/modules/auth';

@Component({
  selector: 'app-pricing-profile-edit',
  templateUrl: './pricing-profile-edit.component.html',
  styleUrls: ['./pricing-profile-edit.component.scss']
})
export class PricingProfileEditComponent implements OnInit, OnDestroy {
  pricingProfileForm: FormGroup;

  @Input() id: any;
  @Input() pricingProfile: PricingProfile;

  isDisable: boolean = false;
  batteryContacts: BatteryContact = {};
  currentUser: any;
  private destroy$ = new Subject<void>();
  constructor(public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private pricingService: PricingService,
    private _toastrService: ToastrService,
    private _authService: AuthService) { }

  get formControls()  {
    return this.pricingProfileForm.controls;
  }

  ngOnInit(): void {
    this.initForm();
    this.currentUser = this._authService.currentUserValue;
  }
  isRequired(field: string){
    return this.formControls[field].invalid && (this.formControls[field].dirty || this.formControls[field].touched)
  }

  initForm(){
   this.pricingProfileForm =  this.fb.group({
    quantity: new FormControl(this.pricingProfile.quantity, [Validators.required]),
    profitGuide: new FormControl(this.pricingProfile.profitGuide,[Validators.required]),
    laborHours: new FormControl(this.pricingProfile.laborHours, [Validators.required]),
    frieghtEst: new FormControl(this.pricingProfile.frieghtEst, [Validators.required]),
    laborReady: new FormControl(this.pricingProfile.laborReady, [Validators.required]),
    priceGroup: new FormControl({value : this.pricingProfile.priceGroup, disabled: true}, [Validators.required]),
    qty: new FormControl(this.pricingProfile.qty, [Validators.required]),
    })
  }

  OnCloseModal(){
    this.activeModal.close('cancel');
  }

  onUpdate(){
    this.pricingProfileForm.enable();
    let payload = { ...this.pricingProfileForm.value, ...{ modifiedBy: this.currentUser.empName, id: this.id } }
    this.pricingService.updatePricingDetails(payload).pipe(
      takeUntil(this.destroy$)
    ).subscribe(res => {
      this._toastrService.success('Data updated successessfully', 'Updated');
      this.activeModal.close('update');
    })
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}



