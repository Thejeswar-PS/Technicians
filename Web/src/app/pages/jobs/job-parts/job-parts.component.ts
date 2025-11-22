import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { JobPartsService } from 'src/app/core/services/job-parts.service';
import {
  JobPartsInfo,
  PartsRequest,
  ShippingPart,
  TechPart,
  PartsEquipInfo,
  TechReturnInfo,
  FileAttachment,
  mapJobPartsInfo
} from 'src/app/core/model/job-parts.model';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonService } from 'src/app/core/services/common.service';
import { EditPartsComponent } from '../edit-parts/edit-parts.component';

@Component({
  selector: 'app-job-parts',
  templateUrl: './job-parts.component.html',
  styleUrls: ['./job-parts.component.scss']
})
export class JobPartsComponent implements OnInit {
  // Route parameters
  callNbr: string = '';
  techName: string = '';
  source: string = '';

  // Active tab
  activeTab: 'techInfo' | 'siteInfo' | 'equipInfo' = 'techInfo';

  // Loading states
  isLoading: boolean = false;
  isUploadingFile: boolean = false;

  // Data
  jobPartsInfo: JobPartsInfo | null = null;
  partsRequests: PartsRequest[] = [];
  shippingParts: ShippingPart[] = [];
  techParts: TechPart[] = [];
  equipInfo: PartsEquipInfo | null = null;
  techReturnInfo: TechReturnInfo | null = null;
  fileAttachments: FileAttachment[] = [];

  // File upload
  selectedFile: File | null = null;
  isUploading: boolean = false;

  // Current user context
  currentEmpId: string = '';

  // Forms
  techInfoForm: FormGroup;
  siteInfoForm: FormGroup;
  equipInfoForm: FormGroup;
  techReturnForm: FormGroup;
  techNotesForm: FormGroup;

  // Calculated values
  unusedSent: number = 0;
  faultySent: number = 0;
  showTechReturnPanel: boolean = false;

  // UI control
  errorMessage: string = '';
  successMessage: string = '';
  techReturnMessage: string = '';
  receivedMessage: string = '';
  originallyReceivedParts: Set<number> = new Set<number>();
  techPartsSuccessMessage: string = '';
  
  // Permissions
  canEditTechInfo: boolean = true;
  canEditShipping: boolean = true;
  canAddParts: boolean = true;
  canEditParts: boolean = true;
  showProcessButton: boolean = false;
  // Role flag
  isTechnicianFlag: boolean = false;

  // Dropdown options
  shippingStatusOptions = [
    { value: 'Initiated', text: 'Initiated' },
    { value: 'Submitted', text: 'Submitted' },
    { value: 'Needs Attention', text: 'Needs Attention' },
    { value: 'Staging', text: 'Staging' },
    { value: 'InAssembly', text: 'In Assembly' },
    { value: 'OrderedTrackingReq', text: 'Ordered - Tracking Required' },
    { value: 'Shipped', text: 'Shipped' },
    { value: 'Delivered', text: 'Delivered' },
    { value: 'Canceled', text: 'Canceled' }
  ];

  techReturnStatusOptions = [
    { value: 'Select', text: 'Please Select' },
    { value: 'Returned', text: 'Returned' },
    { value: 'Pending', text: 'Pending' },
    { value: 'Not Required', text: 'Not Required' },
    { value: 'Lost', text: 'Lost Package' },
    { value: 'In Progress', text: 'In Progress' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private jobPartsService: JobPartsService,
    private toastr: ToastrService,
    private modalService: NgbModal
    , private _commonService: CommonService
  ) {
    this.techInfoForm = this.createTechInfoForm();
    this.siteInfoForm = this.createSiteInfoForm();
    this.equipInfoForm = this.createEquipInfoForm();
    this.techReturnForm = this.createTechReturnForm();
    this.techNotesForm = this.createTechNotesForm();
  }

  ngOnInit(): void {
    this.loadCurrentUserEmpId();
    // Determine employee status (Technician or not) early
    this.determineEmployeeStatus();
    this.route.queryParams.subscribe(params => {
      this.callNbr = params['CallNbr'] || '';
      this.techName = params['TechName'] || '';
      this.source = params['Source'] || '';

      if (this.callNbr) {
        this.loadAllData();
      }
    });
  }

  private determineEmployeeStatus(): void {
    try {
      const userDataRaw = localStorage.getItem('userData');
      if (!userDataRaw) return;
      const userData = JSON.parse(userDataRaw);
      const windowsID = userData?.windowsID || userData?.WindowsID || null;
      if (!windowsID) return;

      this._commonService.getEmployeeStatusForJobList(windowsID).subscribe({
        next: (statusData: any) => {
          if (statusData && Array.isArray(statusData) && statusData.length > 0) {
            const status = statusData[0].Status || '';
            this.isTechnicianFlag = (status === 'Technician' || status === 'TechManager');
          }
          // If technician, enforce UI restrictions
          if (this.isTechnicianFlag) {
            this.canEditShipping = false;
            this.canAddParts = false;
            this.canEditParts = false;
            this.canEditTechInfo = false;
            // hide process button for technicians
            this.showProcessButton = false;
            // hide tech return panel
            this.showTechReturnPanel = false;
          }
        },
        error: (err) => {
          console.error('Error getting employee status for job parts:', err);
        }
      });
    } catch (err) {
      console.error('Error determining employee status:', err);
    }
  }

  private createTechInfoForm(): FormGroup {
    return this.fb.group({
      technician: ['', Validators.required],
      techID: ['', Validators.required],
      notes: ['']
    });
  }

  private createSiteInfoForm(): FormGroup {
    return this.fb.group({
      contactName: ['', Validators.required],
      contactPh: ['', [
        Validators.required,
        Validators.pattern(/^[0-9-]+$/)  // Only numbers and dashes
      ]],
      verifyPh: [false, Validators.requiredTrue],
      shippingStatus: ['Initiated'],
      shippingNotes: ['']
    });
  }

  private createEquipInfoForm(): FormGroup {
    return this.fb.group({
      equipNo: [''],
      make: ['', Validators.required],
      model: ['', Validators.required],
      kva: [0, [Validators.required, Validators.min(1)]],
      inputVolt: [0, [Validators.required, Validators.min(1)]],
      outputVolt: [0, [Validators.required, Validators.min(1)]],
      addInfo: [''],
      equipNo1: [''],
      make1: [''],
      model1: [''],
      kva1: [0],
      inputVolt1: [0],
      outputVolt1: [0],
      addInfo1: ['']
    });
  }

  private createTechReturnForm(): FormGroup {
    return this.fb.group({
      unusedSent: [0],
      faultySent: [0],
      returnStatus: ['Select', Validators.required],
      returnNotes: ['']
    });
  }

  private createTechNotesForm(): FormGroup {
    return this.fb.group({
      emgNotes: ['']
    });
  }

  private loadAllData(): void {
    this.isLoading = true;
  this.errorMessage = '';
  this.techReturnMessage = '';
  this.receivedMessage = '';

    // Load job info
    this.jobPartsService.getJobPartsInfo(this.callNbr).subscribe({
      next: (data) => {
        const normalized = Array.isArray(data) ? data[0] : data;
        this.jobPartsInfo = mapJobPartsInfo(normalized);
        this.populateForms();
      },
      error: (error) => {
        console.error('Error loading job info:', error);
        this.errorMessage = 'Error loading job information';
      }
    });

    // Load parts requests
    this.jobPartsService.getPartsRequests(this.callNbr).subscribe({
      next: (data) => {
        this.partsRequests = data;
      },
      error: (error) => {
        console.error('Error loading parts requests:', error);
      }
    });

    // Load shipping parts
    this.jobPartsService.getShippingParts(this.callNbr).subscribe({
      next: (data) => {
        // Show all shipping parts, including backorders. Previously we filtered out backOrder items.
        this.shippingParts = data;
      },
      error: (error) => {
        console.error('Error loading shipping parts:', error);
      }
    });

    // Load tech parts
    this.jobPartsService.getTechParts(this.callNbr).subscribe({
      next: (data) => {
        this.techParts = data;
        this.originallyReceivedParts = new Set(
          this.techParts
            .filter(part => part.isReceived)
            .map(part => part.scidInc)
        );
        this.calculateTechReturnValues();
      },
      error: (error) => {
        console.error('Error loading tech parts:', error);
      }
    });

    // Load equipment info
    this.jobPartsService.getPartsEquipInfo(this.callNbr).subscribe({
      next: (data) => {
        this.equipInfo = data;
        this.populateEquipmentForm();
      },
      error: (error) => {
        console.error('Error loading equipment info:', error);
      }
    });

    // Load tech return info
    this.jobPartsService.getTechReturnInfo(this.callNbr).subscribe({
      next: (data) => {
        this.techReturnInfo = data;
        this.populateTechReturnForm();
      },
      error: (error) => {
        console.error('Error loading tech return info:', error);
      },
      complete: () => {
        this.isLoading = false;
      }
    });

    // Load file attachments
    this.loadFileAttachments();
  }

  private populateForms(): void {
    if (!this.jobPartsInfo) return;

    this.techInfoForm.patchValue({
      technician: this.jobPartsInfo.techName ?? '',
      techID: this.jobPartsInfo.techID ?? '',
      notes: this.jobPartsInfo.reqNote ?? ''
    });

    this.siteInfoForm.patchValue({
      contactName: this.jobPartsInfo.contactName ?? '',
      contactPh: this.jobPartsInfo.contactPh ?? '',
      verifyPh: !!this.jobPartsInfo.verifyPh,
      shippingStatus: this.jobPartsInfo.shippingStatus ?? 'Initiated',
      shippingNotes: this.jobPartsInfo.shippingNote ?? ''
    });
  }

  private populateEquipmentForm(): void {
    if (!this.equipInfo) return;

    this.equipInfoForm.patchValue({
      equipNo: this.equipInfo.equipNo ?? '',
      make: this.equipInfo.make ?? '',
      model: this.equipInfo.model ?? '',
      kva: this.equipInfo.kva ?? 0,
      inputVolt: this.equipInfo.ipVolt ?? 0,
      outputVolt: this.equipInfo.opVolt ?? 0,
      addInfo: this.equipInfo.addInfo ?? '',
      equipNo1: this.equipInfo.equipNo1 ?? '',
      make1: this.equipInfo.make1 ?? '',
      model1: this.equipInfo.model1 ?? '',
      kva1: this.equipInfo.kva1 ?? 0,
      inputVolt1: this.equipInfo.ipVolt1 ?? 0,
      outputVolt1: this.equipInfo.opVolt1 ?? 0,
      addInfo1: this.equipInfo.addInfo1 ?? ''
    });

    this.techNotesForm.patchValue({
      emgNotes: this.equipInfo.emgNotes ?? ''
    });
  }

  private populateTechReturnForm(): void {
    if (!this.techReturnInfo) return;

    if (this.techReturnInfo.unusedSentBack !== 9999) {
      this.techReturnForm.patchValue({
        unusedSent: this.techReturnInfo.unusedSentBack ?? 0,
        faultySent: this.techReturnInfo.faultySentBack ?? 0,
        returnStatus: this.techReturnInfo.returnStatus ?? 'Select',
        returnNotes: this.techReturnInfo.returnNotes ?? ''
      });
    }
  }

  private calculateTechReturnValues(): void {
    this.unusedSent = 0;
    this.faultySent = 0;

    this.techParts.forEach(part => {
      if (part.unusedDesc === 'Sent back to DCG') {
        this.unusedSent += part.unusedParts;
      }
      if (part.faultyDesc === 'Sent back to DCG') {
        this.faultySent += part.faultyParts;
      }
    });

    this.showTechReturnPanel = (this.unusedSent + this.faultySent) > 0;
    // Ensure technicians never see the Tech Return panel (legacy behavior)
    if (this.isTechnicianFlag) {
      this.showTechReturnPanel = false;
    }
    
    this.techReturnForm.patchValue({
      unusedSent: this.unusedSent,
      faultySent: this.faultySent
    });

    // Check if process button should be shown
  this.showProcessButton = this.techParts.some(part => !this.originallyReceivedParts.has(part.scidInc));
  }

  private loadCurrentUserEmpId(): void {
    try {
      const userDataRaw = localStorage.getItem('userData');
      if (!userDataRaw) {
        return;
      }

      const userData = JSON.parse(userDataRaw);
      const empId = (userData?.empID ?? userData?.empId ?? '').trim();
      this.currentEmpId = empId;
    } catch (error) {
      console.error('Error loading user data for empId:', error);
      this.currentEmpId = '';
    }
  }

  // Tab navigation
  selectTab(tab: 'techInfo' | 'siteInfo' | 'equipInfo'): void {
    this.activeTab = tab;
    this.errorMessage = '';
    this.successMessage = '';
  }

  // Navigation
  goBack(): void {
    if (this.source === 'ReturnReport') {
      this.router.navigate(['/part-return-status']);
    } else {
      this.router.navigate(['/jobs'], {
        queryParams: { CallNbr: this.callNbr }
      });
    }
  }

  // Update functions
  onUpdateTechInfo(): void {
    if (!this.validateTechInfo()) return;

    const formValue = this.techInfoForm.value;
    const data = {
      callNbr: this.callNbr,
      techName: formValue.technician,
      techID: formValue.techID,
      notes: formValue.notes,
      contactName: this.siteInfoForm.value.contactName,
      contactPh: this.siteInfoForm.value.contactPh,
      verifyPh: this.siteInfoForm.value.verifyPh,
      shippingNotes: this.siteInfoForm.value.shippingNotes,
      shippingStatus: this.siteInfoForm.value.shippingStatus,
      source: 1
    };

  this.jobPartsService.updateJobPartsInfo(data, this.currentEmpId).subscribe({
      next: () => {
        this.toastr.success('Tech information updated successfully');
        this.successMessage = 'Tech information updated successfully';
        this.errorMessage = '';
        this.loadAllData();
      },
      error: (error) => {
        const message = 'Error updating tech information: ' + (error.error?.message || error.message);
        this.toastr.error(message);
        this.errorMessage = message;
        this.successMessage = '';
      }
    });
  }

  onUpdateSiteInfo(): void {
    if (!this.validateSiteInfo()) return;

    const formValue = this.siteInfoForm.value;
    const source = this.determineSiteUpdateSource(formValue);
    const data = {
      callNbr: this.callNbr,
      techName: this.techInfoForm.value.technician,
      techID: this.techInfoForm.value.techID,
      notes: this.techInfoForm.value.notes,
      contactName: formValue.contactName,
      contactPh: formValue.contactPh,
      verifyPh: formValue.verifyPh,
      shippingNotes: formValue.shippingNotes,
      shippingStatus: formValue.shippingStatus,
      source
    };

  this.jobPartsService.updateJobPartsInfo(data, this.currentEmpId).subscribe({
      next: () => {
        this.toastr.success('Site information updated successfully');
        this.successMessage = 'Site information updated successfully';
        this.errorMessage = '';
        this.loadAllData();
      },
      error: (error) => {
        const message = 'Error updating site information: ' + (error.error?.message || error.message);
        this.toastr.error(message);
        this.errorMessage = message;
        this.successMessage = '';
      }
    });
  }

  private determineSiteUpdateSource(formValue: any): number {
    if (!this.jobPartsInfo) {
      return 2;
    }

    const originalStatus = String(this.jobPartsInfo.shippingStatus ?? '').trim();
    const originalNotes = String(this.jobPartsInfo.shippingNote ?? '').trim();
    const currentStatus = String(formValue?.shippingStatus ?? '').trim();
    const currentNotes = String(formValue?.shippingNotes ?? '').trim();

    const shippingUnchanged = currentStatus === originalStatus && currentNotes === originalNotes;

    return shippingUnchanged ? 1 : 2;
  }

  onUpdateEquipInfo(): void {
    if (!this.validateEquipInfo()) return;

    const formValue = this.equipInfoForm.value;
    const notesValue = this.techNotesForm.value;
    
    const data: PartsEquipInfo = {
      callNbr: this.callNbr,
      techID: this.techInfoForm.value.techID,
      techName: this.techInfoForm.value.technician,
      equipNo: formValue.equipNo,
      make: formValue.make,
      model: formValue.model,
      kva: formValue.kva,
      ipVolt: formValue.inputVolt,
      opVolt: formValue.outputVolt,
  addInfo: formValue.addInfo,
      equipNo1: formValue.equipNo1,
      make1: formValue.make1,
      model1: formValue.model1,
      kva1: formValue.kva1,
      ipVolt1: formValue.inputVolt1,
      opVolt1: formValue.outputVolt1,
      addInfo1: formValue.addInfo1,
      emgNotes: notesValue.emgNotes
    };

    this.jobPartsService.updatePartsEquipInfo(data, this.currentEmpId).subscribe({
      next: () => {
        this.toastr.success('Updated successfully');
        this.successMessage = 'Updated successfully';
        this.errorMessage = '';
      },
      error: (error) => {
        const message = 'Error updating information: ' + (error.error?.message || error.message);
        this.toastr.error(message);
        this.errorMessage = message;
        this.successMessage = '';
      }
    });
  }

  onUpdateTechNotes(): void {
    // Reuse equipment info update
    this.onUpdateEquipInfo();
  }

  onUpdateTechReturn(): void {
    if (!this.validateTechReturn()) return;

    const formValue = this.techReturnForm.value;
    
    // Calculate TrunkStock by summing unusedParts where unusedDesc is "Trunk Stock"
    // This matches legacy logic: if (args.Row.Cells[7].Text == "Trunk Stock") { TrunkStock += ... }
    const trunkStock = this.techParts
      .filter(part => part.unusedDesc === 'Trunk Stock')
      .reduce((sum, part) => sum + (part.unusedParts || 0), 0);

    const data = {
      callNbr: this.callNbr,
      techName: this.techInfoForm.value.technician,
      techID: this.techInfoForm.value.techID,
      trunkStock: trunkStock, // Calculated value matching legacy
      unusedSent: Number(formValue.unusedSent || 0),
      faultySent: Number(formValue.faultySent || 0),
      returnStatus: formValue.returnStatus,
      returnNotes: formValue.returnNotes
    };

    // Check if status is "Returned"
    if (formValue.returnStatus === 'Returned') {
      this.jobPartsService.isAllPartsReceivedByWH(this.callNbr).subscribe({
        next: (result) => {
          if (result === 1) {
            this.updateTechReturn(data);
          } else {
            this.techReturnMessage = 'You cannot set to returned until you received all parts from technician.';
          }
        },
        error: (error) => {
          this.toastr.error('Error checking parts status: ' + error.message);
        }
      });
    } else {
      this.updateTechReturn(data);
    }
  }

  private updateTechReturn(data: any): void {
    this.jobPartsService.updateTechReturnInfo(data, this.currentEmpId).subscribe({
      next: () => {
        this.toastr.success('Tech return information updated successfully');
        this.techReturnMessage = '';
        this.successMessage = 'Tech return information updated successfully';
        this.errorMessage = '';
        this.loadAllData();
      },
      error: (error) => {
        this.techReturnMessage = 'Error updating tech return information: ' + (error.error?.message || error.message);
        this.successMessage = '';
      }
    });
  }

  onProcessReceivedParts(): void {
    this.receivedMessage = '';
    this.techPartsSuccessMessage = '';

    const scidIncs = this.techParts
      .filter(part => part.isReceived && !this.originallyReceivedParts.has(part.scidInc))
      .map(part => part.scidInc.toString());


    this.jobPartsService.updateTechPartsReceived(this.callNbr, scidIncs.join(','), this.currentEmpId).subscribe({
      next: () => {
        this.toastr.success('Parts received status updated successfully');
        this.receivedMessage = '';
        this.techPartsSuccessMessage = 'Parts received status updated successfully';
        this.successMessage = '';
        this.errorMessage = '';
        this.loadAllData();
      },
      error: (error) => {
        this.receivedMessage = 'Error updating parts received status: ' + (error.error?.message || error.message);
        this.techPartsSuccessMessage = '';
        this.successMessage = '';
      }
    });
  }

  onReUploadJob(): void {
    if (!confirm('Are you sure you want to upload Job?')) {
      return;
    }

    this.jobPartsService.reUploadJobToGP(this.callNbr, this.techInfoForm.value.techID).subscribe({
      next: () => {
        this.toastr.success('Job uploaded successfully');
        this.techReturnMessage = '';
        this.successMessage = 'Job uploaded successfully';
        this.errorMessage = '';
      },
      error: (error) => {
        this.techReturnMessage = 'Error uploading job: ' + (error.error?.message || error.message);
        this.successMessage = '';
      }
    });
  }

  // Navigation to edit pages
  navigateToAddPartRequest(): void {
    // Check validations first
    this.jobPartsService.isUPSTaskedForJob(this.callNbr).subscribe({
      next: (resultCount) => {
        if (resultCount > 0) {
          this.jobPartsService.isEquipInfoInPartReq(this.callNbr).subscribe({
            next: (message) => {
              if (message && message.length > 0) {
                this.errorMessage = message;
                this.successMessage = '';
                this.activeTab = 'equipInfo';
              } else {
                this.navigateToEditParts('add', 1);
              }
            },
            error: (err) => {
              console.error('Error checking equipment info:', err);
              this.toastr.error('Error checking equipment info');
            }
          });
        } else {
          this.navigateToEditParts('add', 1);
        }
      }
    });
  }

  navigateToAddShipment(): void {
    this.navigateToEditParts('add', 2);
  }

  navigateToAddTechPart(): void {
    this.navigateToEditParts('add', 3);
  }

  navigateToEditPartRequest(scidInc: number): void {
    this.navigateToEditParts('edit', 1, scidInc);
  }

  navigateToEditShipment(scidInc: number): void {
    this.navigateToEditParts('edit', 2, scidInc);
  }

  navigateToEditTechPart(scidInc: number): void {
    this.navigateToEditParts('edit', 3, scidInc);
  }

  navigateToEditParts(mode: 'add' | 'edit', display: number, scidInc?: number): void {
    const modalRef = this.modalService.open(EditPartsComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false
    });

    modalRef.componentInstance.modalContext = true;
    modalRef.componentInstance.callNbr = this.callNbr;
    modalRef.componentInstance.displayMode = display;
    modalRef.componentInstance.mode = mode;
    modalRef.componentInstance.source = this.source;
    modalRef.componentInstance.empId = this.currentEmpId;
    modalRef.componentInstance.techName = this.techName;
    modalRef.componentInstance.isTechnician = this.isTechnicianFlag;
    if (scidInc !== undefined) {
      modalRef.componentInstance.scidInc = scidInc;
    }

    modalRef.closed.subscribe((result: { refresh?: boolean }) => {
      if (!result?.refresh) {
        return;
      }
      this.loadAllData();
    });
  }

  // File upload
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file
    if (!this.isValidFile(file.name)) {
      this.toastr.error('Invalid file format. File must be of format jpg, gif, doc, bmp, xls, png, txt, xlsx, docx, pdf, jpeg');
      return;
    }

    if (file.name.includes(' ')) {
      this.toastr.error('File name should not contain spaces. It should be all one word.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB
      this.toastr.error('File size cannot exceed 5MB');
      return;
    }

    this.uploadFile(file);
  }

  private uploadFile(file: File): void {
    this.isUploadingFile = true;

    this.jobPartsService.uploadFileAttachment(this.callNbr, file).subscribe({
      next: () => {
        this.toastr.success('File uploaded successfully');
        this.loadFileAttachments();
      },
      error: (error) => {
        this.toastr.error('File upload failed: ' + (error.error?.message || error.message));
      },
      complete: () => {
        this.isUploadingFile = false;
      }
    });
  }

  private loadFileAttachments(): void {
    this.jobPartsService.getFileAttachments(this.callNbr).subscribe({
      next: (data) => {
        this.fileAttachments = data;
      },
      error: (error) => {
        console.error('Error loading file attachments:', error);
      }
    });
  }

  getFileUrl(fileName: string): string {
    return this.jobPartsService.getFileUrl(this.callNbr, fileName);
  }

  // Validation functions
  private validateTechInfo(): boolean {
    const formValue = this.techInfoForm.value;

    if (!formValue.technician || formValue.technician.trim() === '') {
      this.toastr.error('You must enter Technician Name');
      return false;
    }

    if (this.containsInvalidChars(formValue.technician)) {
      this.toastr.error('Technician Name cannot contain the following characters: Single quote, comma, semi-colon');
      return false;
    }

    if (!formValue.techID || formValue.techID.trim() === '') {
      this.toastr.error('You must enter Technician ID');
      return false;
    }

    if (this.containsInvalidChars(formValue.techID)) {
      this.toastr.error('Technician ID cannot contain the following characters: Single quote, comma, semi-colon');
      return false;
    }

    if (formValue.notes && formValue.notes.includes("'")) {
      this.toastr.error('Requisition Notes cannot contain the following characters: Single quote');
      return false;
    }

    return true;
  }

  private validateSiteInfo(): boolean {
    // Check if form is valid (including phone pattern validation)
    if (this.siteInfoForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.keys(this.siteInfoForm.controls).forEach(key => {
        this.siteInfoForm.get(key)?.markAsTouched();
      });
      
      if (this.siteInfoForm.get('contactPh')?.errors?.['pattern']) {
        this.toastr.error('Please enter a valid phone number (only numbers and dashes)');
      } else if (this.siteInfoForm.get('contactPh')?.errors?.['required']) {
        this.toastr.error('Contact phone number is required');
      } else {
        this.toastr.error('Please fix all validation errors before updating');
      }
      return false;
    }

    const formValue = this.siteInfoForm.value;

    if (formValue.shippingNotes && formValue.shippingNotes.includes("'")) {
      this.toastr.error('Shipping Notes cannot contain the following characters: Single quote');
      return false;
    }

    if (!formValue.verifyPh) {
      this.toastr.error('You must verify the Site Contact Name and Phone Number and Check Verify');
      return false;
    }

    if (!formValue.contactName || formValue.contactName.trim() === '') {
      this.toastr.error('You must enter Site Contact Name');
      return false;
    }

    if (!formValue.contactPh || formValue.contactPh.trim() === '') {
      this.toastr.error('You must enter Site Contact Phone Number');
      return false;
    }

    return true;
  }

  private validateEquipInfo(): boolean {
    const formValue = this.equipInfoForm.value;

    if (!formValue.make || formValue.make.trim() === '') {
      this.toastr.error('You must enter Equipment Make');
      return false;
    }

    if (!formValue.model || formValue.model.trim() === '') {
      this.toastr.error('You must enter Equipment Model');
      return false;
    }

    if (!this.isNumeric(formValue.kva)) {
      this.toastr.error('KVA must be an integer');
      return false;
    }

    if (formValue.kva <= 0) {
      this.toastr.error('You must enter Equipment KVA');
      return false;
    }

    if (formValue.inputVolt <= 0) {
      this.toastr.error('You must enter Equipment Input Voltage');
      return false;
    }

    if (!this.isNumeric(formValue.inputVolt)) {
      this.toastr.error('Input Voltage must be an integer');
      return false;
    }

    if (formValue.outputVolt <= 0) {
      this.toastr.error('You must enter Equipment Output Voltage');
      return false;
    }

    if (!this.isNumeric(formValue.outputVolt)) {
      this.toastr.error('Output Voltage must be an integer');
      return false;
    }

    return true;
  }

  private validateTechReturn(): boolean {
    const formValue = this.techReturnForm.value;

    if (formValue.returnStatus === 'Select') {
      this.toastr.error('Please select appropriate value from dropdown');
      return false;
    }

    return true;
  }

  // Utility functions
  private containsInvalidChars(value: string): boolean {
    return value.includes("'") || value.includes(',') || value.includes(';');
  }

  private isNumeric(value: any): boolean {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  private isValidFile(fileName: string): boolean {
    const validExtensions = ['jpg', 'gif', 'doc', 'bmp', 'xls', 'png', 'txt', 'xlsx', 'docx', 'pdf', 'jpeg'];
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension ? validExtensions.includes(extension) : false;
  }

  getSiteAddressUrl(): string {
    const address = this.jobPartsInfo?.address?.trim();
    if (!address) {
      return '';
    }
    return `https://www.google.com/maps/place/${encodeURIComponent(address)}`;
  }

  // Permission check - isTechnician
  get isTechnician(): boolean {
    return this.isTechnicianFlag;
  }

  // Handle received checkbox change
  onReceivedCheckChange(part: TechPart, event: any): void {
    part.isReceived = event.target.checked;
    this.receivedMessage = '';
    this.techPartsSuccessMessage = '';
  }

  // File upload method
  onUploadFile(): void {
    if (!this.selectedFile) {
      this.toastr.error('Please select a file to upload');
      return;
    }

    this.isUploading = true;
    this.jobPartsService.uploadFileAttachment(this.callNbr, this.selectedFile).subscribe({
      next: () => {
        this.toastr.success('File uploaded successfully');
        this.selectedFile = null;
        this.isUploading = false;
        this.loadFileAttachments();
      },
      error: (error) => {
        console.error('Error uploading file:', error);
        this.toastr.error('Failed to upload file');
        this.isUploading = false;
      }
    });
  }

  // Re-upload to GP
  onReUploadToGP(): void {
    if (!this.jobPartsInfo?.techID) {
      this.toastr.error('Tech ID not found');
      return;
    }

    if (confirm('Are you sure you want to re-upload this job to Great Plains?')) {
      this.jobPartsService.reUploadJobToGP(this.callNbr, this.jobPartsInfo.techID).subscribe({
        next: () => {
          this.toastr.success('Job re-uploaded to GP successfully');
          this.successMessage = 'Job re-uploaded to GP successfully';
          this.errorMessage = '';
        },
        error: (error) => {
          console.error('Error re-uploading to GP:', error);
          const message = 'Failed to re-upload job to GP';
          this.toastr.error(message);
          this.errorMessage = message;
          this.successMessage = '';
        }
      });
    }
  }

  // Inline delete for parts, shipping, tech
  onDeletePart(display: number, scidInc: number): void {
    if (!confirm('Are you sure you want to delete this item?')) return;
    this.jobPartsService.deletePart(this.callNbr, scidInc, display, this.currentEmpId).subscribe({
      next: (res) => {
        if (res.success) {
          const successMessage = res.message || 'Deleted successfully';
          this.toastr.success(successMessage);
          this.loadAllData();
        } else {
          this.toastr.error(res.message || 'Delete failed');
        }
      },
      error: (err) => {
        this.toastr.error('Delete failed: ' + (err.error?.message || err.message));
      }
    });
  }

  // Inventory check for part number (for icon display)
  inventoryCheckResults: { [partNum: string]: boolean | null } = {};
  checkInventoryForPart(partNum: string): void {
    if (!partNum) return;
    if (this.inventoryCheckResults[partNum] !== undefined) return; // already checked
    this.jobPartsService.checkInventoryItem(partNum).subscribe({
      next: (res) => {
        this.inventoryCheckResults[partNum] = res.exists;
      },
      error: () => {
        this.inventoryCheckResults[partNum] = null;
      }
    });
  }
}

