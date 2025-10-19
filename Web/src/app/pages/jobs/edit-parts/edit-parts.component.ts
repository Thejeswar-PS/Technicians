import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { JobPartsService } from 'src/app/core/services/job-parts.service';
import { PartsRequest, ShippingPart, TechPart } from 'src/app/core/model/job-parts.model';

@Component({
  selector: 'app-edit-parts',
  templateUrl: './edit-parts.component.html',
  styleUrls: ['./edit-parts.component.scss']
})
export class EditPartsComponent implements OnInit {
  editForm!: FormGroup;
  displayMode: number = 1; // 1=Parts Request, 2=Shipping Parts, 3=Tech Parts
  mode: 'add' | 'edit' = 'add';
  scidInc?: number;
  callNbr: string = '';
  isLoading: boolean = false;
  isSaving: boolean = false;
  isCheckingInventory: boolean = false;
  inventoryCheckResult: { exists: boolean; description: string } | null = null;
  showAddAnother: boolean = false;

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
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    // Get query parameters
    this.route.queryParams.subscribe(params => {
      this.callNbr = params['CallNbr'] || '';
      this.displayMode = parseInt(params['Display']) || 1;
      this.mode = params['Mode'] === 'edit' ? 'edit' : 'add';
      this.scidInc = params['ScidInc'] ? parseInt(params['ScidInc']) : undefined;

      this.initializeForm();

      if (this.mode === 'edit' && this.scidInc) {
        this.loadPartData();
      }
    });
  }

  initializeForm(): void {
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
      dcPartNum: ['', Validators.maxLength(50)],
      qty: [1, [Validators.required, Validators.min(1)]],
      description: ['', Validators.maxLength(200)],
      location: ['', Validators.maxLength(100)],
      destination: ['', Validators.maxLength(100)],
      requiredDate: [''],
      shippingMethod: ['', Validators.maxLength(50)],
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
      qty: [1, [Validators.required, Validators.min(1)]],
      description: ['', Validators.maxLength(200)],
      shippingCompany: ['', Validators.maxLength(100)],
      trackingNum: ['', Validators.maxLength(100)],
      shipmentType: ['', Validators.maxLength(50)],
      shippingCost: [0, [Validators.min(0)]],
      courierCost: [0, [Validators.min(0)]],
      shipDate: [''],
      eta: [''],
      shippedFrom: ['', Validators.maxLength(100)],
      backOrder: [false]
    });
  }

  initTechPartsForm(): void {
    this.editForm = this.fb.group({
      scidInc: [null],
      serviceCallID: [this.callNbr, Validators.required],
      partNum: ['', [Validators.required, Validators.maxLength(50)]],
      dcPartNum: ['', Validators.maxLength(50)],
      totalQty: [1, [Validators.required, Validators.min(1)]],
      description: ['', Validators.maxLength(200)],
      installedParts: [0, [Validators.min(0)]],
      unusedParts: [0, [Validators.min(0)]],
      faultyParts: [0, [Validators.min(0)]],
      unusedDesc: ['', Validators.maxLength(500)],
      faultyDesc: ['', Validators.maxLength(500)],
      isReceived: [false],
      brandNew: [false]
    });

    // Setup value change listeners for auto-calculations
    if (this.displayMode === 3) {
      this.setupTechPartsCalculations();
    }
  }

  setupTechPartsCalculations(): void {
    // Auto-calculate Unused = Total - Installed
    this.editForm.get('installedParts')?.valueChanges.subscribe(() => {
      this.calculateUnusedParts();
    });

    this.editForm.get('totalQty')?.valueChanges.subscribe(() => {
      this.calculateUnusedParts();
    });

    // Brand new checkbox disables faulty dropdown
    this.editForm.get('brandNew')?.valueChanges.subscribe((brandNew) => {
      if (brandNew) {
        this.editForm.get('faultyParts')?.setValue(0);
        this.editForm.get('faultyParts')?.disable();
        this.editForm.get('faultyDesc')?.setValue('');
        this.editForm.get('faultyDesc')?.disable();
      } else {
        this.editForm.get('faultyParts')?.enable();
        this.editForm.get('faultyDesc')?.enable();
      }
    });
  }

  calculateUnusedParts(): void {
    const total = this.editForm.get('totalQty')?.value || 0;
    const installed = this.editForm.get('installedParts')?.value || 0;
    const unused = Math.max(0, total - installed);
    this.editForm.get('unusedParts')?.setValue(unused, { emitEvent: false });
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
          this.editForm.patchValue(part);
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
          this.editForm.patchValue(part);
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
          this.editForm.patchValue(part);
          // Disable quantity field in edit mode
          if (this.mode === 'edit') {
            this.editForm.get('totalQty')?.disable();
          }
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
    const partNum = this.editForm.get('partNum')?.value;
    
    if (!partNum || !partNum.trim()) {
      this.toastr.warning('Please enter a part number');
      return;
    }

    this.isCheckingInventory = true;
    this.inventoryCheckResult = null;

    this.jobPartsService.checkInventoryItem(partNum).subscribe({
      next: (result) => {
        this.inventoryCheckResult = result;
        this.isCheckingInventory = false;

        if (result.exists) {
          this.toastr.success('Part found in inventory!');
          // Auto-populate description if empty
          if (!this.editForm.get('description')?.value && result.description) {
            this.editForm.get('description')?.setValue(result.description);
          }
        } else {
          this.toastr.info('Part not found in inventory');
        }
      },
      error: (error) => {
        console.error('Error checking inventory:', error);
        this.toastr.error('Failed to check inventory');
        this.isCheckingInventory = false;
      }
    });
  }

  onDelete(): void {
    if (!this.scidInc) {
      this.toastr.error('Cannot delete: No part ID found');
      return;
    }

    if (confirm('Are you sure you want to delete this part?')) {
      this.jobPartsService.deletePart(this.displayMode, this.scidInc).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastr.success('Part deleted successfully');
            this.router.navigate(['/jobs/parts'], {
              queryParams: { CallNbr: this.callNbr }
            });
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
    this.editForm.reset({
      serviceCallID: this.callNbr,
      qty: 1,
      totalQty: 1,
      installedParts: 0,
      unusedParts: 0,
      faultyParts: 0,
      urgent: false,
      backOrder: false,
      isReceived: false,
      brandNew: false,
      shippingCost: 0,
      courierCost: 0
    });
    
    // Re-enable quantity field
    if (this.displayMode === 3) {
      this.editForm.get('totalQty')?.enable();
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
    const formData = this.editForm.value;

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
    // In real implementation, this would call the API
    // For now, we'll show success and show "Add Another" button
    this.toastr.success('Parts request saved successfully');
    this.isSaving = false;
    this.showAddAnother = true;
  }

  saveShippingPart(data: ShippingPart): void {
    // In real implementation, this would call the API
    this.toastr.success('Shipping part saved successfully');
    this.isSaving = false;
    this.showAddAnother = true;
  }

  saveTechPart(data: TechPart): void {
    // In real implementation, this would call the API
    this.toastr.success('Tech part saved successfully');
    this.isSaving = false;
    this.showAddAnother = true;
  }

  validateForm(): boolean {
    const formValue = this.editForm.value;

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
    if (!data.qty || data.qty < 1) {
      this.toastr.error('Quantity must be at least 1');
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
    if (data.shippingCost && isNaN(data.shippingCost)) {
      this.toastr.error('Shipping cost must be a valid number');
      return false;
    }
    if (data.courierCost && isNaN(data.courierCost)) {
      this.toastr.error('Courier cost must be a valid number');
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
      this.toastr.error('Total quantity must equal Faulty + Unused (when not brand new)');
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

    // Validation: Faulty parts cannot exceed total
    if (faulty > total) {
      this.toastr.error('Faulty parts cannot exceed total quantity');
      return false;
    }

    // Validation: If received is checked, must have tracking info or description
    if (data.isReceived) {
      if (!data.unusedDesc || !data.unusedDesc.trim()) {
        this.toastr.error('Please provide a description for parts marked as received');
        return false;
      }
    }

    return true;
  }

  goBack(): void {
    this.router.navigate(['/jobs/parts'], {
      queryParams: {
        CallNbr: this.callNbr
      }
    });
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
    return '';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      partNum: 'Part Number',
      dcPartNum: 'DC Part Number',
      qty: 'Quantity',
      totalQty: 'Total Quantity',
      description: 'Description',
      location: 'Location',
      destination: 'Destination',
      requiredDate: 'Required Date',
      shippingMethod: 'Shipping Method',
      techName: 'Tech Name',
      shippingCompany: 'Shipping Company',
      trackingNum: 'Tracking Number',
      shipmentType: 'Shipment Type',
      shippingCost: 'Shipping Cost',
      courierCost: 'Courier Cost',
      shipDate: 'Ship Date',
      eta: 'ETA',
      shippedFrom: 'Shipped From',
      installedParts: 'Installed Parts',
      unusedParts: 'Unused Parts',
      faultyParts: 'Faulty Parts',
      unusedDesc: 'Unused Description',
      faultyDesc: 'Faulty Description'
    };
    return labels[fieldName] || fieldName;
  }
}
