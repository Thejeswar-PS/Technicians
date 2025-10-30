import { Component, OnInit, Input, Optional } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { JobPartsService } from 'src/app/core/services/job-parts.service';
import { PartsRequest, ShippingPart, TechPart } from 'src/app/core/model/job-parts.model';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-edit-parts',
  templateUrl: './edit-parts.component.html',
  styleUrls: ['./edit-parts.component.scss']
})
export class EditPartsComponent implements OnInit {
  editForm!: FormGroup;
  @Input() displayMode: number = 1; // 1=Parts Request, 2=Shipping Parts, 3=Tech Parts
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() scidInc?: number;
  @Input() callNbr: string = '';
  @Input() modalContext: boolean = false;
  @Input() source: string = '';
  @Input() empId: string = '';
  @Input() techName: string = '';
  @Input() isTechnician: boolean = false;
  isLoading: boolean = false;
  isSaving: boolean = false;
  isCheckingInventory: boolean = false;
  inventoryCheckResult: { exists: boolean; description: string } | null = null;
  showAddAnother: boolean = false;
  lastModifiedBy: string = '';
  lastModifiedOn: string = '';
  // Tracks whether any successful save occurred while modal is open so parent can refresh
  private needsRefresh: boolean = false;
  private faultyEditedByUser: boolean = false;
  private lastInventoryLookup: string | null = null;

  readonly shippingMethodOptions: string[] = [
    'Ground',
    '3 Day',
    '2nd Day',
    'Next Day',
    'Next Day Early AM',
    'Saturday',
    'Same Day'
  ];

  readonly partSourceOptions: { value: string; label: string }[] = [
    { value: '76', label: 'Customer Furnished' },
    { value: '75', label: 'DC Group Sent to Site' },
    { value: '133', label: 'DC Group sent to Technician' },
    { value: '134', label: 'Purchased locally' },
    { value: '132', label: 'Trunk Stock' },
    { value: '77', label: 'Unknown' }
  ];

  readonly partsInfoOptions: string[] = ['None', 'Trunk Stock', 'Disposed', 'Sent back to DCG'];
  readonly faultyInfoOptions: string[] = ['None', 'Disposed', 'Sent back to DCG'];
  readonly receivedStatusOptions: { value: 'Yes' | 'No' | 'NA'; label: string }[] = [
    { value: 'Yes', label: 'Yes' },
    { value: 'No', label: 'No' },
    { value: 'NA', label: 'N/A' }
  ];

  // Display mode titles
  get pageTitle(): string {
    const prefix = this.mode === 'add' ? 'Add' : 'Edit';
    switch (this.displayMode) {
      case 1: return `${prefix} Parts Request`;
      case 2: return `${prefix} Shipping Part`;
      case 3: return `${prefix} Tech Part`;
      default: return `${prefix} Part`;
    }
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private jobPartsService: JobPartsService,
    private toastr: ToastrService,
    @Optional() public activeModal?: NgbActiveModal
  ) {}

  ngOnInit(): void {
    this.initializeEmpId();

    if (this.modalContext) {
      this.techName = (this.techName || '').trim();
      this.initializeForm();
      if (this.mode === 'edit' && this.scidInc) {
        this.loadPartData();
      }
      return;
    }

    // Fallback for routed usage
    this.route.queryParams.subscribe(params => {
      this.callNbr = params['CallNbr'] || '';
      this.displayMode = parseInt(params['Display']) || 1;
      this.mode = params['Mode'] === 'edit' ? 'edit' : 'add';
      this.scidInc = params['ScidInc'] ? parseInt(params['ScidInc']) : undefined;
    this.source = params['Source'] || '';
  this.techName = params['TechName'] || '';
      this.initializeEmpId();

      this.initializeForm();

      if (this.mode === 'edit' && this.scidInc) {
        this.loadPartData();
      }
    });
  }

  initializeForm(): void {
    this.lastModifiedBy = '';
    this.lastModifiedOn = '';
    this.faultyEditedByUser = false;

    switch (this.displayMode) {
      case 1:
        this.initPartsRequestForm();
        break;
      case 2:
        this.initShippingPartsForm();
        break;
      case 3:
        this.initTechPartsForm();
        break;
    }
  }

  initPartsRequestForm(): void {
    this.editForm = this.fb.group({
      scidInc: [null],
      serviceCallID: [this.callNbr, Validators.required],
      partNum: ['', [Validators.required, Validators.maxLength(50)]],
      dcPartNum: ['', [Validators.required, Validators.maxLength(50)]],
      qty: [1, [Validators.required, Validators.min(1), Validators.pattern(/^[0-9]+$/)]],
      description: ['', Validators.maxLength(200)],
      location: ['', Validators.maxLength(100)],
      destination: ['', [Validators.required, Validators.maxLength(100)]],
      requiredDate: ['', Validators.required],
      shippingMethod: ['Ground', Validators.maxLength(50)],
      urgent: [false],
      backOrder: [false],
      techName: ['', Validators.maxLength(100)]
    });
  }

  initShippingPartsForm(): void {
    this.editForm = this.fb.group({
      scidInc: [null],
      serviceCallID: [this.callNbr, Validators.required],
      partNum: ['', [Validators.required, Validators.maxLength(50)]],
      dcPartNum: ['', Validators.maxLength(50)],
      qty: [1, [Validators.required, Validators.min(1), Validators.pattern(/^[0-9]+$/)]],
      description: ['', Validators.maxLength(200)],
      destination: ['', [Validators.required, Validators.maxLength(250)]],
      shippingCompany: ['', [Validators.required, Validators.maxLength(100)]],
      trackingNum: ['', Validators.maxLength(100)],
  shipmentType: ['', Validators.maxLength(50)],
      shippingCost: [0, [Validators.min(0)]],
      shipDate: ['', Validators.required],
      eta: ['', Validators.required],
      shippedFrom: ['', [Validators.required, Validators.maxLength(100)]]
    });
  }

  initTechPartsForm(): void {
    this.editForm = this.fb.group({
      scidInc: [null],
      serviceCallID: [this.callNbr, Validators.required],
      partNum: ['', [Validators.required, Validators.maxLength(50)]],
      dcPartNum: ['', Validators.maxLength(50)],
      totalQty: [1, [Validators.required, Validators.min(1), Validators.pattern(/^[0-9]+$/)]],
      description: ['', Validators.maxLength(200)],
      partSource: ['75', Validators.required],
      installedParts: [0, [Validators.required, Validators.min(0), Validators.pattern(/^[0-9]+$/)]],
      unusedParts: [0, [Validators.required, Validators.min(0), Validators.pattern(/^[0-9]+$/)]],
      faultyParts: [0, [Validators.required, Validators.min(0), Validators.pattern(/^[0-9]+$/)]],
      manufacturer: ['', Validators.maxLength(100)],
      unusedDesc: ['None', Validators.required],
      faultyDesc: ['None', Validators.required],
      receivedStatus: ['No', Validators.required],
      isReceived: [false],
      brandNew: [false],
      partsLeft: [false],
      trackingInfo: ['', Validators.maxLength(250)],
      modelNo: ['', Validators.maxLength(150)]
    });

    // Setup value change listeners for auto-calculations
    if (this.displayMode === 3) {
      this.setupTechPartsCalculations();
    }
  }

  setupTechPartsCalculations(): void {
    const installedControl = this.editForm.get('installedParts');
    const totalControl = this.editForm.get('totalQty');
    const faultyControl = this.editForm.get('faultyParts');
    const faultyDescControl = this.editForm.get('faultyDesc');
    const unusedDescControl = this.editForm.get('unusedDesc');

    installedControl?.valueChanges.subscribe(() => {
      this.calculateTechPartQuantities();
    });

    totalControl?.valueChanges.subscribe(() => {
      this.calculateTechPartQuantities();
    });

    faultyControl?.valueChanges.subscribe(() => {
      if (!this.updatingFaultyProgrammatically) {
        this.faultyEditedByUser = true;
      }
      this.syncPartsInfoDefaults();
    });

    this.editForm.get('unusedParts')?.valueChanges.subscribe(() => {
      this.syncPartsInfoDefaults();
    });

    this.editForm.get('brandNew')?.valueChanges.subscribe((brandNew) => {
      if (brandNew) {
        this.faultyEditedByUser = false;
        this.updatingFaultyProgrammatically = true;
        faultyControl?.setValue(0, { emitEvent: false });
        faultyControl?.disable({ emitEvent: false });
        faultyDescControl?.setValue('None', { emitEvent: false });
        faultyDescControl?.disable({ emitEvent: false });
        this.updatingFaultyProgrammatically = false;
      } else {
        faultyControl?.enable({ emitEvent: false });
        faultyDescControl?.enable({ emitEvent: false });
      }
      this.syncPartsInfoDefaults();
    });

    this.editForm.get('receivedStatus')?.valueChanges.subscribe((status: 'Yes' | 'No' | 'NA') => {
      const isReceived = status === 'Yes';
      this.editForm.get('isReceived')?.setValue(isReceived, { emitEvent: false });
    });

    this.syncPartsInfoDefaults();
    this.calculateTechPartQuantities();
  }

  private updatingFaultyProgrammatically: boolean = false;

  private calculateTechPartQuantities(): void {
    const total = Number(this.editForm.get('totalQty')?.value) || 0;
    const installed = Number(this.editForm.get('installedParts')?.value) || 0;
    const unused = Math.max(0, total - installed);
    this.editForm.get('unusedParts')?.setValue(unused, { emitEvent: false });

    if (!this.faultyEditedByUser && !this.editForm.get('brandNew')?.value) {
      this.updatingFaultyProgrammatically = true;
      this.editForm.get('faultyParts')?.setValue(Math.max(0, installed), { emitEvent: false });
      this.updatingFaultyProgrammatically = false;
    }

    this.syncPartsInfoDefaults();
  }

  private syncPartsInfoDefaults(): void {
    const faultyQty = Number(this.editForm.get('faultyParts')?.value) || 0;
    const unusedQty = Number(this.editForm.get('unusedParts')?.value) || 0;

    if (faultyQty === 0) {
      this.editForm.get('faultyDesc')?.setValue('None', { emitEvent: false });
    }

    if (unusedQty === 0) {
      this.editForm.get('unusedDesc')?.setValue('None', { emitEvent: false });
    }
  }
  
  private toDateOnly(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    // Handles both 'YYYY-MM-DDTHH:mm:ss' and 'YYYY-MM-DD' formats
    return value.split('T')[0];
  }
  
  private formatDisplayDate(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return value;
    }

    return date.toLocaleString();
  }

  loadPartData(): void {
    if (!this.scidInc) return;

    this.isLoading = true;

    switch (this.displayMode) {
      case 1:
        this.loadPartsRequest();
        break;
      case 2:
        this.loadShippingPart();
        break;
      case 3:
        this.loadTechPart();
        break;
    }
  }

  loadPartsRequest(): void {
    this.jobPartsService.getPartsRequests(this.callNbr).subscribe({
      next: (parts) => {
        const part = parts.find(p => p.scidInc === this.scidInc);
        if (part) {
          this.editForm.patchValue({
            ...part,
            requiredDate: this.toDateOnly(part.requiredDate)
          });
          if (this.mode === 'edit') {
            this.editForm.get('qty')?.disable({ emitEvent: false });
          }
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading parts request:', error);
        this.toastr.error('Failed to load parts request data');
        this.isLoading = false;
      }
    });
  }

  loadShippingPart(): void {
    this.jobPartsService.getShippingParts(this.callNbr).subscribe({
      next: (parts) => {
        const part = parts.find(p => p.scidInc === this.scidInc);
        if (part) {
          this.editForm.patchValue({
            scidInc: part.scidInc,
            serviceCallID: part.serviceCallID,
            partNum: part.partNum,
            dcPartNum: part.dcPartNum,
            qty: part.qty,
            description: part.description,
            destination: part.destination,
            shippingCompany: part.shippingCompany,
            trackingNum: part.trackingNum,
            shipmentType: part.shipmentType,
            shippingCost: part.shippingCost,
            shipDate: this.toDateOnly(part.shipDate),
            eta: this.toDateOnly(part.eta),
            shippedFrom: part.shippedFrom
          });
          if (this.mode === 'edit') {
            this.editForm.get('qty')?.disable({ emitEvent: false });
          }
          this.lastModifiedBy = part.maintAuthID ?? '';
          this.lastModifiedOn = this.formatDisplayDate(part.lastModified);
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading shipping part:', error);
        this.toastr.error('Failed to load shipping part data');
        this.isLoading = false;
      }
    });
  }

  loadTechPart(): void {
    this.jobPartsService.getTechParts(this.callNbr).subscribe({
      next: (parts) => {
        const part = parts.find(p => p.scidInc === this.scidInc);
        if (part) {
          this.faultyEditedByUser = true;
          this.editForm.patchValue({
            scidInc: part.scidInc,
            serviceCallID: part.serviceCallID,
            partNum: part.partNum,
            dcPartNum: part.dcPartNum,
            totalQty: part.totalQty,
            description: part.description,
            partSource: part.partSource || '75',
            installedParts: part.installedParts ?? 0,
            unusedParts: part.unusedParts ?? 0,
            faultyParts: part.faultyParts ?? 0,
            manufacturer: part.manufacturer ?? '',
            unusedDesc: part.unusedDesc || 'None',
            faultyDesc: part.faultyDesc || 'None',
            receivedStatus: part.isReceived ? 'Yes' : (part.receivedStatus || 'No'),
            isReceived: part.isReceived,
            brandNew: part.brandNew,
            partsLeft: part.partsLeft,
            trackingInfo: part.trackingInfo ?? '',
            modelNo: part.modelNo ?? ''
          }, { emitEvent: false });
          this.faultyEditedByUser = false;
          this.lastModifiedBy = part.maintAuthID ?? '';
          this.lastModifiedOn = this.formatDisplayDate(part.lastModified);
          // Disable quantity field in edit mode
          if (this.mode === 'edit') {
            this.editForm.get('totalQty')?.disable();
          }
          this.faultyEditedByUser = true;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading tech part:', error);
        this.toastr.error('Failed to load tech part data');
        this.isLoading = false;
      }
    });
  }

  checkInventory(): void {
    const dcPartNum = this.editForm.get('dcPartNum')?.value;

    if (!dcPartNum || !dcPartNum.trim()) {
      this.toastr.warning('Please enter a DC Group part number');
      this.inventoryCheckResult = null;
      this.lastInventoryLookup = null;
      return;
    }

    this.isCheckingInventory = true;
    this.inventoryCheckResult = null;

    this.jobPartsService.checkInventoryItem(dcPartNum).subscribe({
      next: (result) => {
        this.inventoryCheckResult = result;
        this.lastInventoryLookup = dcPartNum;
        this.isCheckingInventory = false;

        if (result.exists) {
          this.toastr.success('Part found in inventory!');
          // Auto-populate description if empty
          if (!this.editForm.get('description')?.value && result.description) {
            this.editForm.get('description')?.setValue(result.description);
          }
        } else {
          this.toastr.error('DC Group part number not found in inventory');
        }
      },
      error: (error) => {
        console.error('Error checking inventory:', error);
        this.toastr.error('Failed to check inventory');
        this.isCheckingInventory = false;
      }
    });
  }

  onDCPartNumBlur(): void {
    if (this.displayMode !== 1) {
      return;
    }

    const dcPartNum = (this.editForm.get('dcPartNum')?.value || '').trim();
    if (!dcPartNum) {
      this.inventoryCheckResult = null;
      this.lastInventoryLookup = null;
      return;
    }

    if (this.lastInventoryLookup === dcPartNum) {
      return;
    }

    this.checkInventory();
  }

  onDelete(): void {
    if (!this.scidInc) {
      this.toastr.error('Cannot delete: No part ID found');
      return;
    }

    if (!this.callNbr) {
      this.toastr.error('Cannot delete: Missing call number context');
      return;
    }

    if (confirm('Are you sure you want to delete this part?')) {
      this.jobPartsService.deletePart(this.callNbr, this.scidInc, this.displayMode, this.empId).subscribe({
        next: (response) => {
          if (response.success) {
            const successMessage = response.message || 'Part deleted successfully';
            this.toastr.success(successMessage);
            if (this.modalContext && this.activeModal) {
              this.activeModal.close({ refresh: true });
            } else {
              this.router.navigate(['/jobs/parts'], {
                queryParams: this.buildNavigationQueryParams()
              });
            }
          } else {
            this.toastr.error(response.message || 'Failed to delete part');
          }
        },
        error: (error) => {
          console.error('Error deleting part:', error);
          this.toastr.error('Failed to delete part');
        }
      });
    }
  }

  onAddAnother(): void {
    this.showAddAnother = false;
    this.mode = 'add';
    this.scidInc = undefined;
    this.inventoryCheckResult = null;
    this.lastModifiedBy = '';
    this.lastModifiedOn = '';
    this.faultyEditedByUser = false;

    this.initializeForm();

    // Ensure display-specific defaults remain enabled
    if (this.displayMode === 3) {
      this.editForm.get('totalQty')?.enable({ emitEvent: false });
    }
  }

  onSave(): void {
    if (this.editForm.invalid) {
      this.toastr.error('Please fill in all required fields');
      Object.keys(this.editForm.controls).forEach(key => {
        const control = this.editForm.get(key);
        if (control?.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    if (!this.validateForm()) {
      return;
    }

    this.isSaving = true;
    const formData = this.editForm.getRawValue();

    // Call appropriate save method based on display mode
    switch (this.displayMode) {
      case 1:
        this.savePartsRequest(formData);
        break;
      case 2:
        this.saveShippingPart(formData);
        break;
      case 3:
        this.saveTechPart(formData);
        break;
    }
  }

  savePartsRequest(data: PartsRequest): void {
    const payload = this.buildPartsRequestPayload(data);
    const normalizedSource = (this.source || '').trim().toLowerCase();

    if (!this.empId) {
      this.isSaving = false;
      this.toastr.error('Unable to save: missing employee ID context');
      return;
    }

    const executeSave = () => {
      // Auto-create shipping part only when adding (not editing) and Source != "Pen"
      const shouldAutoCreateShipping = this.mode === 'add' && normalizedSource !== 'pen';

      this.jobPartsService.savePartsRequest(payload, this.empId).subscribe({
        next: (response) => {
          if (response?.success === false) {
            this.isSaving = false;
            this.toastr.error(response.message || 'Failed to save parts request');
            return;
          }

          const resolvedScidInc = this.resolveScidInc(response, payload.scidInc);
          if (resolvedScidInc) {
            payload.scidInc = resolvedScidInc;
            this.scidInc = resolvedScidInc;
          }

          // Only auto-create shipping part for new parts requests (not edits)
          if (!shouldAutoCreateShipping) {
            this.handleSaveSuccess('Parts request saved successfully');
            return;
          }

          const autoShippingData = this.buildAutoShippingPayloadFromRequest(payload);
          this.jobPartsService.saveShippingPart(autoShippingData, this.empId).subscribe({
            next: (shippingResponse) => {
              if (shippingResponse?.success === false) {
                this.isSaving = false;
                this.toastr.error(shippingResponse.message || 'Failed to save shipping part');
                return;
              }
              this.handleSaveSuccess('Parts request saved successfully');
            },
            error: (error) => {
              this.isSaving = false;
              this.toastr.error(error.error?.message || 'Failed to save shipping part');
            }
          });
        },
        error: (error) => {
          this.isSaving = false;
          this.toastr.error(error.error?.message || 'Failed to save parts request');
        }
      });
    };

    const handleDuplicateCheck = () => {
      if (this.mode !== 'add' || normalizedSource === 'pen') {
        executeSave();
        return;
      }

      this.jobPartsService.checkPartRequestExists(this.callNbr, payload.dcPartNum).subscribe({
        next: (result) => {
          if (result?.exists) {
            this.isSaving = false;
            this.toastr.error('Error: Please make sure job status is equal to Initiated.');
            return;
          }
          executeSave();
        },
        error: (error) => {
          this.isSaving = false;
          this.toastr.error(error.error?.message || 'Unable to verify existing part requests');
        }
      });
    };

    this.jobPartsService.checkInventoryItem(payload.dcPartNum).subscribe({
      next: (result) => {
        this.inventoryCheckResult = result;
        this.lastInventoryLookup = payload.dcPartNum;

        if (!result?.exists) {
          this.isSaving = false;
          this.toastr.error('DC Group part number does not exist in Inventory');
          return;
        }

        if (!payload.description && result.description) {
          const description = result.description.trim();
          payload.description = description;
          this.editForm.get('description')?.setValue(description, { emitEvent: false });
        }

        handleDuplicateCheck();
      },
      error: (error) => {
        this.isSaving = false;
        this.toastr.error(error.error?.message || 'Unable to verify inventory for this part');
      }
    });
  }

  private initializeEmpId(): void {
    if (this.empId && this.empId.trim()) {
      this.empId = this.empId.trim();
      return;
    }

    try {
      const userDataRaw = localStorage.getItem('userData');
      if (!userDataRaw) {
        this.empId = '';
        return;
      }

      const userData = JSON.parse(userDataRaw);
      const resolvedEmpId = ((userData?.empID ?? userData?.empId) || '').toString().trim();
      this.empId = resolvedEmpId;
    } catch (error) {
      console.error('Error loading employee ID from storage:', error);
      this.empId = '';
    }
  }

  saveShippingPart(data: ShippingPart): void {
    const payload = this.buildShippingPartPayload(data);

    if (!this.empId) {
      this.isSaving = false;
      this.toastr.error('Unable to save: missing employee ID context');
      return;
    }

    this.jobPartsService.saveShippingPart(payload, this.empId).subscribe({
      next: (response) => {
        if (response?.success === false) {
          this.isSaving = false;
          this.toastr.error(response.message || 'Failed to save shipping part');
          return;
        }

        const resolvedScidInc = this.resolveScidInc(response, payload.scidInc);
        if (resolvedScidInc) {
          payload.scidInc = resolvedScidInc;
          this.scidInc = resolvedScidInc;
        }

        if (this.mode === 'edit') {
          this.syncTechPartFromShipping(payload);
          return;
        }

        this.handleSaveSuccess('Shipping part saved successfully');
      },
      error: (error) => {
        this.isSaving = false;
        this.toastr.error(error.error?.message || 'Failed to save shipping part');
      }
    });
  }

  private syncTechPartFromShipping(shippingPayload: any): void {
    this.jobPartsService.getTechParts(this.callNbr).subscribe({
      next: (techParts) => {
        const existingTechPart = techParts.find(part => Number(part.scidInc) === Number(shippingPayload.scidInc));
        const techPayload = this.buildTechPartPayloadFromShipping(shippingPayload, existingTechPart);

        this.jobPartsService.saveTechPart(techPayload, this.empId, "Ship").subscribe({
          next: (techResponse) => {
            if (techResponse?.success === false) {
              this.isSaving = false;
              this.toastr.error(techResponse.message || 'Failed to sync tech part');
              return;
            }
            this.handleSaveSuccess('Shipping part saved successfully');
          },
          error: (error) => {
            console.error('Error saving tech part from shipping update:', error);
            this.isSaving = false;
            this.toastr.error(error.error?.message || 'Failed to sync tech part');
          }
        });
      },
      error: (error) => {
        console.error('Error loading tech part for shipping sync:', error);
        this.isSaving = false;
        this.toastr.error(error.error?.message || 'Failed to sync tech part');
      }
    });
  }

  saveTechPart(data: TechPart): void {
    const payload = this.buildTechPartPayload(data);

    this.jobPartsService.saveTechPart(payload, this.empId, "Tech").subscribe({
      next: (response) => {
        if (response?.success === false) {
          this.isSaving = false;
          this.toastr.error(response.message || 'Failed to save tech part');
          return;
        }
        this.handleSaveSuccess('Tech part saved successfully');
      },
      error: (error) => {
        this.isSaving = false;
        this.toastr.error(error.error?.message || 'Failed to save tech part');
      }
    });
  }

  validateForm(): boolean {
  const formValue = this.editForm.getRawValue();

    // Check for invalid characters (quotes, semicolons, commas)
    const invalidCharsRegex = /[';,]/;
    const stringFields = Object.keys(formValue).filter(key => 
      typeof formValue[key] === 'string'
    );

    for (const field of stringFields) {
      if (invalidCharsRegex.test(formValue[field])) {
        this.toastr.error(`Field "${field}" contains invalid characters (', ;, or ,)`);
        return false;
      }
    }

    // Display mode specific validation
    switch (this.displayMode) {
      case 1:
        return this.validatePartsRequest(formValue);
      case 2:
        return this.validateShippingPart(formValue);
      case 3:
        return this.validateTechPart(formValue);
    }

    return true;
  }

  validatePartsRequest(data: any): boolean {
    if (!data.partNum) {
      this.toastr.error('Part Number is required');
      return false;
    }
    if (!data.dcPartNum) {
      this.toastr.error('DC Group Part Number is required');
      return false;
    }
    if (!data.qty || data.qty < 1) {
      this.toastr.error('Quantity must be at least 1');
      return false;
    }
    if (!/^[0-9]+$/.test(String(data.qty))) {
      this.toastr.error('Quantity must be a whole number');
      return false;
    }
    if (!data.requiredDate) {
      this.toastr.error('Required Date is required');
      return false;
    }
    if (!data.destination) {
      this.toastr.error('Destination is required');
      return false;
    }
    const requiredDate = new Date(data.requiredDate);
    if (isNaN(requiredDate.getTime())) {
      this.toastr.error('Required Date is invalid');
      return false;
    }
    return true;
  }

  validateShippingPart(data: any): boolean {
    if (!data.partNum) {
      this.toastr.error('Part Number is required');
      return false;
    }
    if (!data.qty || data.qty < 1) {
      this.toastr.error('Quantity must be at least 1');
      return false;
    }
    if (!/^[0-9]+$/.test(String(data.qty))) {
      this.toastr.error('Quantity must be a whole number');
      return false;
    }
    if (!data.destination) {
      this.toastr.error('Destination is required');
      return false;
    }
    if (!data.shippedFrom) {
      this.toastr.error('Shipped From is required');
      return false;
    }
    if (!data.shippingCompany) {
      this.toastr.error('Shipping Company is required');
      return false;
    }
    if (data.shippingCost && isNaN(data.shippingCost)) {
      this.toastr.error('Shipping cost must be a valid number');
      return false;
    }
    if (!data.shipDate) {
      this.toastr.error('Ship Date is required');
      return false;
    }
    if (!data.eta) {
      this.toastr.error('ETA Date is required');
      return false;
    }
    const shipDate = new Date(data.shipDate);
    const etaDate = new Date(data.eta);
    if (isNaN(shipDate.getTime()) || isNaN(etaDate.getTime())) {
      this.toastr.error('Please enter valid Ship Date and ETA Date values');
      return false;
    }
    if (etaDate < shipDate) {
      this.toastr.error('ETA Date should be greater than or equal to Ship Date');
      return false;
    }
    return true;
  }

  validateTechPart(data: any): boolean {
    if (!data.partNum) {
      this.toastr.error('Part Number is required');
      return false;
    }
    if (!data.totalQty || data.totalQty < 1) {
      this.toastr.error('Total quantity must be at least 1');
      return false;
    }
    if (!data.partSource) {
      this.toastr.error('Source of Parts is required');
      return false;
    }

    const total = data.totalQty || 0;
    const installed = data.installedParts || 0;
    const unused = data.unusedParts || 0;
    const faulty = data.faultyParts || 0;
    const brandNew = data.brandNew || false;

    // Validation: Total must equal Installed + Unused
    if (total !== installed + unused) {
      this.toastr.error('Total quantity must equal Installed + Unused');
      return false;
    }

    // Validation: If not brand new, Total must equal Faulty + Unused
    if (!brandNew && total !== faulty + unused) {
      this.toastr.error('Total quantity must equal Defective + Unused (when not brand new)');
      return false;
    }

    // Validation: Installed parts cannot exceed total
    if (installed > total) {
      this.toastr.error('Installed parts cannot exceed total quantity');
      return false;
    }

    // Validation: Unused parts cannot exceed total
    if (unused > total) {
      this.toastr.error('Unused parts cannot exceed total quantity');
      return false;
    }

    // Validation: Defective parts cannot exceed total
    if (faulty > total) {
      this.toastr.error('Defective parts cannot exceed total quantity');
      return false;
    }

    if (faulty > 0 && (!data.faultyDesc || data.faultyDesc === 'None')) {
      this.toastr.error('Please select a Defective Parts info value');
      return false;
    }

    if (unused > 0 && (!data.unusedDesc || data.unusedDesc === 'None')) {
      this.toastr.error('Please select an Unused Parts info value');
      return false;
    }

    const requiresTracking = [data.faultyDesc, data.unusedDesc].includes('Sent back to DCG');
    if (requiresTracking && !data.partsLeft && !data.trackingInfo) {
      this.toastr.error('Please enter tracking info or indicate parts left at site');
      return false;
    }

    if (data.receivedStatus === 'Yes') {
      if (data.faultyDesc !== 'Sent back to DCG' && data.unusedDesc !== 'Sent back to DCG') {
        this.toastr.error('Received parts must have info set to "Sent back to DCG"');
        return false;
      }
    }

    return true;
  }

  goBack(): void {
    if (this.modalContext && this.activeModal) {
      // If we saved any changes while modal was open, notify parent to refresh.
      if (this.needsRefresh) {
        this.activeModal.close({ refresh: true });
      } else {
        this.activeModal.dismiss('cancel');
      }
      return;
    }

    this.router.navigate(['/jobs/parts'], {
      queryParams: this.buildNavigationQueryParams()
    });
  }

  private buildNavigationQueryParams(): any {
    const queryParams: Record<string, string> = {};

    if (this.callNbr) {
      queryParams.CallNbr = this.callNbr;
    }

    if (this.techName) {
      queryParams.TechName = this.techName;
    }

    if (this.source) {
      queryParams.Source = this.source;
    }

    return queryParams;
  }

  private handleSaveSuccess(message: string): void {
    this.toastr.success(message);
    this.isSaving = false;

    // Mark that we've changed data so the parent can refresh when the modal finally closes
    this.needsRefresh = true;

    // If running inside a modal and we're adding a new part, keep the modal open so the
    // user can continue adding parts. For edits, close the modal and notify the parent.
    if (this.modalContext && this.activeModal) {
      if (this.mode === 'add') {
        // Prepare form for another add (preserves legacy 'Add Another' behaviour while
        // keeping the modal open). Do not close the modal here.
        const normalizedSource = (this.source || '').trim().toLowerCase();
        this.showAddAnother = normalizedSource !== 'pen';
        // Reset form for next add
        this.onAddAnother();
        return;
      } else {
        // For non-add modes (edits), close and request parent refresh
        this.activeModal.close({ refresh: true });
        return;
      }
    }

    // Non-modal flow: show Add Another button for adds, or navigate back for edits
    if (this.mode === 'add') {
      const normalizedSource = (this.source || '').trim().toLowerCase();
      this.showAddAnother = normalizedSource !== 'pen';
    } else {
      this.goBack();
    }
  }

  // Helper method to check if a field has errors
  hasError(fieldName: string, errorType: string): boolean {
    const field = this.editForm.get(fieldName);
    return !!(field?.hasError(errorType) && (field?.dirty || field?.touched));
  }

  // Helper method to get error message
  getErrorMessage(fieldName: string): string {
    const field = this.editForm.get(fieldName);
    if (!field) return '';

    if (field.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (field.hasError('min')) {
      return `${this.getFieldLabel(fieldName)} must be at least ${field.getError('min').min}`;
    }
    if (field.hasError('maxlength')) {
      return `${this.getFieldLabel(fieldName)} is too long`;
    }
    if (field.hasError('pattern')) {
      const numericFields = ['qty', 'totalQty', 'installedParts', 'unusedParts', 'faultyParts'];
      if (numericFields.includes(fieldName)) {
        return `${this.getFieldLabel(fieldName)} must be a whole number`;
      }
      return `${this.getFieldLabel(fieldName)} has an invalid format`;
    }
    return '';
  }

  private toLegacyDateTime(value: string | Date | null | undefined): string {
    if (!value) {
      return '';
    }

    let date: Date | null = null;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return '';
      }

      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        date = parsed;
      } else {
        const isoLike = trimmed.replace(' ', 'T');
        const parsedIso = new Date(isoLike);
        if (!isNaN(parsedIso.getTime())) {
          date = parsedIso;
        } else {
          return trimmed;
        }
      }
    }

    if (!date || isNaN(date.getTime())) {
      return '';
    }

    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');
    const seconds = `${date.getSeconds()}`.padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  }

  private normalizeString(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value).trim();
  }

  private toNumber(value: any, defaultValue: number = 0): number {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    const parsed = Number(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }

  private buildPartsRequestPayload(data: any): any {
    return {
      scidInc: data.scidInc ?? 999999999,
      callNbr: this.callNbr,
      serviceCallID: data.serviceCallID || this.callNbr,
      partNum: this.normalizeString(data.partNum),
      dcPartNum: this.normalizeString(data.dcPartNum),
      qty: this.toNumber(data.qty, 0),
      description: this.normalizeString(data.description),
      location: this.normalizeString(data.location),
      destination: this.normalizeString(data.destination),
      requiredDate: this.toLegacyDateTime(data.requiredDate),
      shippingMethod: this.normalizeString(data.shippingMethod || 'Ground'),
      urgent: !!data.urgent,
      backOrder: !!data.backOrder,
      techName: this.normalizeString(data.techName)
    };
  }

  private buildShippingPartPayload(data: any): any {
    return {
      scidInc: data.scidInc ?? 999999999,
      callNbr: this.callNbr,
      serviceCallID: data.serviceCallID || this.callNbr,
      partNum: this.normalizeString(data.partNum),
      dcPartNum: this.normalizeString(data.dcPartNum),
      qty: this.toNumber(data.qty, 0),
      description: this.normalizeString(data.description),
      destination: this.normalizeString(data.destination),
      shippingCompany: this.normalizeString(data.shippingCompany),
      trackingNum: this.normalizeString(data.trackingNum),
  shipmentType: this.normalizeString(data.shipmentType),
      shippingCost: this.toNumber(data.shippingCost, 0),
      courierCost: this.toNumber(data.courierCost, 0),
      shipDate: this.toLegacyDateTime(data.shipDate),
      eta: this.toLegacyDateTime(data.eta),
      shippedFrom: this.normalizeString(data.shippedFrom),
      backOrder: !!data.backOrder
    };
  }

  private resolveScidInc(response: any, fallback?: number): number {
    const candidates = [
      response?.scidInc,
      response?.scid_Inc,
      response?.sciD_Inc,
      response?.sciDInc,
      response?.data?.scidInc,
      response?.result?.scidInc,
      response?.payload?.scidInc
    ];

    for (const candidate of candidates) {
      const parsed = Number(candidate);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }

    const fallbackValue = Number(fallback);
    if (!isNaN(fallbackValue) && fallbackValue > 0) {
      return fallbackValue;
    }

    return 0;
  }

  private buildAutoShippingPayloadFromRequest(partsPayload: any): any {
    const scidInc = Number(partsPayload.scidInc ?? this.scidInc ?? 999999999) || 999999999;

    const autoShippingData = {
      scidInc,
      serviceCallID: partsPayload.serviceCallID || this.callNbr,
      partNum: partsPayload.partNum,
      dcPartNum: partsPayload.dcPartNum,
      qty: partsPayload.qty,
      description: partsPayload.description,
      destination: partsPayload.destination,
      shippingCompany: '',
      trackingNum: '',
      shipmentType: partsPayload.shippingMethod,
      shippingCost: 0,
      courierCost: 0,
      shipDate: new Date(),
      eta: partsPayload.requiredDate,
      shippedFrom: '',
      backOrder: !!partsPayload.backOrder
    };

    return this.buildShippingPartPayload(autoShippingData);
  }

  private buildTechPartPayloadFromShipping(shippingPayload: any, existingTechPart?: TechPart | null): any {
    const resolvedScidInc = Number(shippingPayload.scidInc ?? existingTechPart?.scidInc ?? this.scidInc ?? 999999999) || 999999999;
    const existingTotalQty = existingTechPart ? this.toNumber(existingTechPart.totalQty, 0) : 0;
    const totalQtyFromShipping = this.toNumber(shippingPayload.qty, existingTotalQty);
    const hasExisting = !!existingTechPart;

    const normalizedPartSource = this.normalizeString(existingTechPart?.partSource ?? '75') || '75';
    const installedParts = hasExisting ? this.toNumber(existingTechPart?.installedParts, 0) : 0;
    const unusedParts = hasExisting
      ? Math.max(this.toNumber(existingTechPart?.unusedParts, 0), 0)
      : Math.max(totalQtyFromShipping, 0);
    const faultyParts = hasExisting ? this.toNumber(existingTechPart?.faultyParts, 0) : 0;

    const techFormLikeData = {
      scidInc: resolvedScidInc,
      serviceCallID: shippingPayload.serviceCallID || this.callNbr,
      partNum: shippingPayload.partNum ?? existingTechPart?.partNum ?? '',
      dcPartNum: shippingPayload.dcPartNum ?? existingTechPart?.dcPartNum ?? '',
      totalQty: totalQtyFromShipping,
      description: shippingPayload.description ?? existingTechPart?.description ?? '',
      partSource: normalizedPartSource,
      installedParts,
      unusedParts,
      faultyParts,
      manufacturer: this.normalizeString(existingTechPart?.manufacturer ?? ''),
      unusedDesc: this.normalizeString(existingTechPart?.unusedDesc ?? 'None') || 'None',
      faultyDesc: this.normalizeString(existingTechPart?.faultyDesc ?? 'None') || 'None',
      receivedStatus: this.resolveTechReceivedStatus(existingTechPart),
      brandNew: !!existingTechPart?.brandNew,
      partsLeft: !!existingTechPart?.partsLeft,
      trackingInfo: this.normalizeString(existingTechPart?.trackingInfo ?? ''),
      modelNo: this.normalizeString(existingTechPart?.modelNo ?? '')
    };

    return this.buildTechPartPayload(techFormLikeData);
  }

  private resolveTechReceivedStatus(existingTechPart?: TechPart | null): 'Yes' | 'No' | 'NA' {
    if (!existingTechPart) {
      return 'No';
    }

    const status = (existingTechPart.receivedStatus || '').toString().trim().toUpperCase();

    switch (status) {
      case 'YES':
        return 'Yes';
      case 'NO':
        return 'No';
      case 'NA':
        return 'NA';
      default:
        return existingTechPart.isReceived ? 'Yes' : 'No';
    }
  }

  private buildTechPartPayload(data: any): any {
    const receivedStatus: 'Yes' | 'No' | 'NA' = data.receivedStatus || (data.isReceived ? 'Yes' : 'No');

    return {
      scidInc: data.scidInc ?? 999999999,
      callNbr: this.callNbr,
      serviceCallID: data.serviceCallID || this.callNbr,
      partNum: this.normalizeString(data.partNum),
      dcPartNum: this.normalizeString(data.dcPartNum),
      totalQty: this.toNumber(data.totalQty, 0),
      description: this.normalizeString(data.description),
      partSource: this.normalizeString(data.partSource || '75'),
      installedParts: this.toNumber(data.installedParts, 0),
      unusedParts: this.toNumber(data.unusedParts, 0),
      faultyParts: this.toNumber(data.faultyParts, 0),
      unusedDesc: this.normalizeString(data.unusedDesc || 'None'),
      faultyDesc: this.normalizeString(data.faultyDesc || 'None'),
      manufacturer: this.normalizeString(data.manufacturer),
      isReceived: receivedStatus === 'Yes',
      receivedStatus,
      brandNew: !!data.brandNew,
      partsLeft: !!data.partsLeft,
      trackingInfo: this.normalizeString(data.trackingInfo),
      modelNo: this.normalizeString(data.modelNo)
    };
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      partNum: 'Manuf Part Number',
      dcPartNum: 'DCG Part No',
      qty: 'Quantity',
      totalQty: 'Quantity',
      description: 'Description',
      location: 'Location',
      destination: 'Destination',
      requiredDate: 'Required Date',
      shippingMethod: 'Shipping Method',
      techName: 'Technician',
      shippingCompany: 'Shipping Company',
      trackingNum: 'Tracking Number',
      shipmentType: 'Shipped Type',
      shippingCost: 'Shipping Cost',
      courierCost: 'Courier Cost',
      shipDate: 'Ship Date',
      eta: 'ETA Date',
      shippedFrom: 'Shipped From',
      installedParts: 'Installed Qty',
      unusedParts: 'Unused Qty',
      faultyParts: 'Defective Qty',
      unusedDesc: 'Unused Parts Info',
      faultyDesc: 'Defective Info',
      partSource: 'Source of Parts',
      receivedStatus: 'Received This Part?',
      trackingInfo: 'Tracking Info',
      manufacturer: 'Manufacturer',
      modelNo: 'Model No'
    };
    return labels[fieldName] || fieldName;
  }
}
