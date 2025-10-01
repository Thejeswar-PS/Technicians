import { Component, Input, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormControl, FormGroup, RequiredValidator, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { BatteryContact } from 'src/app/core/model/battery-contact.modal';
import { VendorContact } from 'src/app/core/model/vendor-contact-list.modal';
import { PricingService } from 'src/app/core/services/pricing.service';
import { AuthService } from 'src/app/modules/auth';
import { validate } from 'webpack';

interface FormType {
  new: boolean;
  update: boolean;
}
@Component({
  selector: 'app-battery-contact-add-update',
  templateUrl: './battery-contact-add-update.component.html',
  styleUrls: ['./battery-contact-add-update.component.scss']
})

export class BatteryContactAddUpdateComponent implements OnInit {
  vendarDetails: VendorContact;
  contactUpdateForm: FormGroup;
  @Input() contactDetails: BatteryContact;
  @Input() formType: FormType;
  isDisable: boolean = false;
  batteryContacts: BatteryContact = {};
currentUser: any;

  constructor(public activeModal: NgbActiveModal,
    private fb: FormBuilder, 
    private pricingService: PricingService,
    private _toastrService: ToastrService,
    private _authService: AuthService) { }

  get formControls()  {
    return this.contactUpdateForm.controls;
  }

  ngOnInit(): void {
    this.initForm();
    if(this.formType.update) this.loadForm();
    this.currentUser = this._authService.currentUserValue;
  }
  isRequired(field: string){
    return this.formControls[field].invalid && (this.formControls[field].dirty || this.formControls[field].touched)
  }

  initForm(){
   this.contactUpdateForm =  this.fb.group({
      vendor: new FormControl({value:'', disabled: this.formType.update}, [Validators.required]),
      contactName: new FormControl({value:'', disabled: this.formType.update},[Validators.required]),
      email: new FormControl('', [Validators.required]),
      officePhone: new FormControl('', [Validators.required]),
      otherPhone: new FormControl(),
      baseOperation: new FormControl(),
      notes: new FormControl(),
      modifiedBy: new FormControl()
    })
  }

  loadForm(){
    if(typeof(this.contactDetails) !== undefined){
      this.formControls['vendor'].setValue(this.contactDetails.vendor);
      this.formControls['contactName'].setValue(this.contactDetails.contactName);
      this.formControls['email'].setValue(this.contactDetails.email);
      this.formControls['officePhone'].setValue(this.contactDetails.officePhone);
      this.formControls['otherPhone'].setValue(this.contactDetails.otherPhone);
      this.formControls['baseOperation'].setValue(this.contactDetails.baseOperation);
      this.formControls['notes'].setValue(this.contactDetails.notes);

    }
  }

  OnCloseModal(){
    this.activeModal.close('cancel');
  }

  onUpdate(){
    this.batteryContacts.vendor = this.contactDetails.vendor;
    this.batteryContacts.contactName = this.contactDetails.contactName;
    this.batteryContacts.email = this.contactUpdateForm.controls['email'].value;
    this.batteryContacts.officePhone = this.contactUpdateForm.controls['officePhone'].value;
    this.batteryContacts.otherPhone = this.contactUpdateForm.controls['otherPhone'].value;
    this.batteryContacts.baseOperation = this.contactUpdateForm.controls['baseOperation'].value;
    this.batteryContacts.notes = this.contactUpdateForm.controls['notes'].value;
    this.batteryContacts.modifiedBy = this.currentUser.empName;
    this.pricingService.updateBatteryContactDetails(this.batteryContacts).subscribe(res =>{
      this.activeModal.close('update');
      this._toastrService.success("Updated successfully", "Update")
    });
  }

  addNewContact(){
    let data = this.contactUpdateForm.value;
    data.modifiedBy = this.currentUser.empName;
    this.pricingService.addBatteryContactDetails(this.contactUpdateForm.value).subscribe(res =>{
      this.activeModal.close('add');
      this._toastrService.success("Add successfully", "Add")

    });
  }
}


