import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { JobService } from 'src/app/core/services/job.service';
import { ToastrService } from 'ngx-toastr';

export interface ExpenseTypeOption {
  text: string;
  value: string;
}

export interface TravelByOption {
  text: string;
  value: string;
}

export interface PurposeOption {
  text: string;
  value: string;
}

export interface NotesOption {
  text: string;
  value: string;
}

export interface ExpenseFormData {
  callNbr: string;
  techName: string;
  techID: string;
  tableIdx: number;
  expType: string;
  travelBy: string;
  purpose: string;
  payType: string;
  mileage: number;
  expenseAmount: number;
  startDateTime: string;
  endDateTime: string;
  notes: string;
  otherReason: string;
  hasFile: boolean;
  file?: File;
}

@Component({
  selector: 'app-edit-expense',
  templateUrl: './edit-expense.component.html',
  styleUrls: ['./edit-expense.component.scss']
})
export class EditExpenseComponent implements OnInit {
  // Route Parameters
  callNbr: string = '';
  techName: string = '';
  techID: string = '';
  tableIdx: number = 0;
  digest: string = '';
  
  // Form and UI state
  expenseForm: FormGroup;
  isEditMode: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  foodLimitMessage: string = '';
  
  // Conditional Panel Visibility
  showTravelPanel: boolean = false;
  showExpensePanel1: boolean = false; // Purpose
  showExpensePanel2: boolean = false; // Amount
  showExpensePanel3: boolean = false; // Pay Type & File Upload
  showTravelPanel1: boolean = false;  // Mileage
  showEndDateTime: boolean = true;
  showNotesDropdown: boolean = true;
  showOtherReason: boolean = false;
  
  // Dropdown Options
  expenseTypes: ExpenseTypeOption[] = [
    { text: 'Assignment Hours', value: '20' },
    { text: 'Travel Hours', value: '21' },
    { text: 'Hotel Stay', value: '23' },
    { text: 'Expenses', value: '22' },
    { text: 'Time Off Hours', value: '68' }
  ];
  
  travelByOptions: TravelByOption[] = [
    { text: 'Rental Car', value: '1' },
    { text: 'Personal Car', value: '2' },
    { text: 'Company Car', value: '3' },
    { text: 'Taxi', value: '4' },
    { text: 'Flight', value: '5' }
  ];
  
  purposeOptions: PurposeOption[] = [
    { text: 'Gas', value: '27' },
    { text: 'Food', value: '26' },
    { text: 'Airline Tickets', value: '23' },
    { text: 'Auto Rental', value: '24' },
    { text: 'Baggage', value: '37' },
    { text: 'Fax', value: '25' },
    { text: 'Hotel', value: '28' },
    { text: 'Office Supplies', value: '29' },
    { text: 'Other', value: '30' },
    { text: 'Paperwork', value: '74' },
    { text: 'Parking', value: '73' },
    { text: 'Parts', value: '31' },
    { text: 'Taxi', value: '32' },
    { text: 'Telephone', value: '33' },
    { text: 'Tolls', value: '34' },
    { text: 'Tools', value: '35' },
    { text: 'Training', value: '36' }
  ];
  
  notesOptions: NotesOption[] = [
    { text: 'Please Select', value: 'PS' },
    { text: 'At Site', value: 'At Site' },
    { text: 'Home to Site', value: 'Home to Site' },
    { text: 'Site to Home', value: 'Site to Home' },
    { text: 'Hotel to Home', value: 'Hotel to Home' },
    { text: 'Home to Hotel', value: 'Home to Hotel' },
    { text: 'Site to Hotel', value: 'Site to Hotel' },
    { text: 'Hotel to Site', value: 'Hotel to Site' },
    { text: 'Site to Site', value: 'Site to Site' },
    { text: 'At Hotel', value: 'At Hotel' },
    { text: 'In Flight', value: 'In Flight' },
    { text: 'Other', value: 'Other' },
    { text: 'Flight/Rental/Taxi', value: 'OtherT' }
  ];
  
  payTypeOptions = [
    { text: 'Company Paid Card', value: '1' },
    { text: 'Technician Paid', value: '3' }
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private jobService: JobService,
    private toastr: ToastrService
  ) {
    this.expenseForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.callNbr = params['CallNbr'] || '';
      this.techName = params['TechName'] || '';
      this.techID = params['TechID'] || '';
      this.tableIdx = parseInt(params['TableIdx']) || 0;
      this.digest = params['Digest'] || '';
      
      this.isEditMode = this.tableIdx > 0;
      
      console.log('Edit Expense - Received params:', {
        callNbr: this.callNbr,
        techName: this.techName,
        techID: this.techID,
        tableIdx: this.tableIdx,
        isEditMode: this.isEditMode
      });
      
      if (this.isEditMode) {
        this.loadExpenseData();
      } else {
        // Set default values for new expense
        this.onExpenseTypeChange();
      }
    });
    
    // Subscribe to form changes for dynamic behavior
    this.setupFormSubscriptions();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      expType: ['20', Validators.required],
      travelBy: ['2'],
      purpose: [''],
      payType: ['1'],
      mileage: [0],
      expenseAmount: [0],
      startDateTime: ['', Validators.required],
      endDateTime: [''],
      notes: ['PS'],
      otherReason: ['']
    });
  }

  private setupFormSubscriptions(): void {
    // Watch expense type changes
    this.expenseForm.get('expType')?.valueChanges.subscribe(() => {
      this.onExpenseTypeChange();
    });
    
    // Watch travel by changes
    this.expenseForm.get('travelBy')?.valueChanges.subscribe(() => {
      this.onTravelByChange();
    });
    
    // Watch purpose changes
    this.expenseForm.get('purpose')?.valueChanges.subscribe(() => {
      this.onPurposeChange();
    });
    
    // Watch notes changes
    this.expenseForm.get('notes')?.valueChanges.subscribe(() => {
      this.onNotesChange();
    });
  }

  loadExpenseData(): void {
    this.isLoading = true;
    this.jobService.getExpenseDetail(this.callNbr, this.tableIdx).subscribe({
      next: (data: any) => {
        if (data) {
          this.populateForm(data);
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading expense data:', error);
        this.errorMessage = 'Error loading expense data: ' + (error.error?.message || error.message);
        this.isLoading = false;
      }
    });
  }

  private populateForm(data: any): void {
    // Parse start and end date/time
    const startDate = new Date(data.strtDate);
    const startTime = data.strtTime;
    const endDate = new Date(data.endDate);
    const endTime = data.endTime;
    
    const startDateTime = this.formatDateTime(startDate, startTime);
    const endDateTime = this.formatDateTime(endDate, endTime);
    
    // Parse notes field
    let notes = 'PS';
    let otherReason = '';
    if (data.notes) {
      if (data.expType === '22' && data.purpose === '30') {
        otherReason = data.notes;
      } else {
        const noteParts = data.notes.split(':');
        notes = noteParts[0] || 'PS';
        otherReason = noteParts.length > 1 ? noteParts[1] : '';
      }
    }
    
    // Calculate expense amount
    const expenseAmount = (data.techPaid || 0) + (data.companyPaid || 0);
    
    this.expenseForm.patchValue({
      expType: data.expType,
      travelBy: data.travelBy || '2',
      purpose: data.purpose || '',
      payType: data.payType || '1',
      mileage: data.mileage || 0,
      expenseAmount: expenseAmount,
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      notes: notes,
      otherReason: otherReason
    });
    
    // Update visibility after form is populated
    this.onExpenseTypeChange();
  }

  private formatDateTime(date: Date, time: string): string {
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = time ? time : '00:00:00';
    return `${dateStr}T${timeStr}`;
  }

  onExpenseTypeChange(): void {
    const expType = this.expenseForm.get('expType')?.value;
    
    // Reset all panels
    this.showTravelPanel = false;
    this.showExpensePanel1 = false;
    this.showExpensePanel2 = false;
    this.showExpensePanel3 = false;
    this.showTravelPanel1 = false;
    this.showEndDateTime = true;
    this.showNotesDropdown = true;
    
    switch (expType) {
      case '21': // Travel Hours
        this.showTravelPanel = true;
        this.showTravelPanel1 = true;
        this.showEndDateTime = true;
        this.showNotesDropdown = true;
        break;
        
      case '22': // Expenses
        this.showExpensePanel1 = true;
        this.showExpensePanel2 = true;
        this.showExpensePanel3 = true;
        this.showEndDateTime = false;
        this.showNotesDropdown = false;
        break;
        
      case '20': // Assignment Hours
        this.expenseForm.patchValue({ notes: 'At Site' });
        break;
        
      case '23': // Hotel Stay
        this.expenseForm.patchValue({ notes: 'At Hotel' });
        break;
        
      default:
        // Default case for other types
        break;
    }
    
    // Reset notes to default when changing types
    if (expType !== '22') {
      this.expenseForm.patchValue({ notes: 'PS' });
    }
    
    this.onTravelByChange();
    this.onPurposeChange();
  }

  onTravelByChange(): void {
    const expType = this.expenseForm.get('expType')?.value;
    const travelBy = this.expenseForm.get('travelBy')?.value;
    
    if (expType === '21') {
      if (['1', '4', '5'].includes(travelBy)) {
        // Rental Car, Taxi, Flight
        this.expenseForm.patchValue({ 
          mileage: 0,
          notes: 'OtherT'
        });
        this.expenseForm.get('mileage')?.disable();
        this.expenseForm.get('notes')?.disable();
      } else {
        // Personal Car, Company Car
        this.expenseForm.get('mileage')?.enable();
        this.expenseForm.get('notes')?.enable();
        this.expenseForm.patchValue({ notes: 'PS' });
      }
    }
  }

  onPurposeChange(): void {
    const purpose = this.expenseForm.get('purpose')?.value;
    
    if (purpose === '30') {
      this.showOtherReason = true;
    } else {
      this.showOtherReason = false;
      this.expenseForm.patchValue({ otherReason: '' });
    }
    
    // Check food limit
    if (purpose === '26') {
      this.checkFoodLimit();
    } else {
      this.foodLimitMessage = '';
    }
  }

  onNotesChange(): void {
    const notes = this.expenseForm.get('notes')?.value;
    
    if (notes === 'Other') {
      this.showOtherReason = true;
    } else {
      this.showOtherReason = false;
      this.expenseForm.patchValue({ otherReason: '' });
    }
  }

  checkFoodLimit(): void {
    if (this.callNbr && this.techName) {
      this.jobService.getAllowedAmountForFoodExpenses(this.callNbr, this.techName).subscribe({
        next: (result: string) => {
          this.foodLimitMessage = result;
        },
        error: (error: any) => {
          console.error('Error checking food limit:', error);
        }
      });
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (2MB limit)
      if (file.size > 2000000) {
        this.toastr.error('File is too big. Image size cannot exceed 2MB');
        event.target.value = '';
        return;
      }
      
      // Validate file type
      const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(fileExtension)) {
        this.toastr.error('Please choose only .jpg, .png and .gif image types!');
        event.target.value = '';
        return;
      }
    }
  }

  onSave(): void {
    if (!this.validateForm()) {
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    
    const formData = this.prepareFormData();
    
    this.jobService.saveExpense(formData).subscribe({
      next: (response: any) => {
        this.successMessage = 'Update Successful.';
        this.isLoading = false;
        
        // If it's a new expense, we might want to stay on the form
        // If it's an edit, we could redirect back to expenses list
        if (!this.isEditMode) {
          this.toastr.success('Expense saved successfully!');
        }
      },
      error: (error: any) => {
        console.error('Error saving expense:', error);
        this.errorMessage = 'Error saving expense: ' + (error.error?.message || error.message);
        this.isLoading = false;
      }
    });
  }

  onDelete(): void {
    if (!confirm('Are you sure you want to delete?\\nBy clicking OK you will be directed to Main Expenses Page.')) {
      return;
    }
    
    this.isLoading = true;
    
    this.jobService.deleteExpense(this.callNbr, this.tableIdx).subscribe({
      next: (response: any) => {
        this.toastr.success('Expense deleted successfully!');
        this.goBack();
      },
      error: (error: any) => {
        console.error('Error deleting expense:', error);
        this.errorMessage = 'Error deleting expense: ' + (error.error?.message || error.message);
        this.isLoading = false;
      }
    });
  }

  private validateForm(): boolean {
    const formValue = this.expenseForm.value;
    const expType = formValue.expType;
    
    // Basic required field validation
    if (!formValue.startDateTime) {
      this.toastr.error('Please enter the Start date and Time.');
      return false;
    }
    
    if (expType !== '22') {
      if (!formValue.endDateTime) {
        this.toastr.error('Please enter the End date and Time.');
        return false;
      }
      
      // Date validation
      const startDate = new Date(formValue.startDateTime);
      const endDate = new Date(formValue.endDateTime);
      
      if (startDate >= endDate) {
        this.toastr.error('Start date and time should be less than End date and time.');
        return false;
      }
      
      // 24-hour limit validation
      const timeDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      if (timeDiff > 24) {
        this.toastr.error('If difference between Start Date and End Date more than 24 Hours then You must add new Expense Entry.');
        return false;
      }
      
      // Notes validation
      if (formValue.notes === 'PS') {
        this.toastr.error('Please select the notes.');
        return false;
      }
      
      if (formValue.notes === 'Other' && !formValue.otherReason.trim()) {
        this.toastr.error('Notes must be entered when you select other.');
        return false;
      }
      
      if (formValue.otherReason && formValue.otherReason.includes(':')) {
        this.toastr.error('Notes do not accept colon(:).');
        return false;
      }
    }
    
    // Travel-specific validations
    if (expType === '21') {
      if (['2', '3'].includes(formValue.travelBy) && (!formValue.mileage || formValue.mileage <= 0)) {
        this.toastr.error('Mileage cannot be empty or zero.');
        return false;
      }
    }
    
    // Expense-specific validations
    if (expType === '22') {
      if (!formValue.expenseAmount || formValue.expenseAmount <= 0) {
        this.toastr.error('Expenses cannot be empty or zero.');
        return false;
      }
      
      if (formValue.purpose === '30' && !formValue.otherReason.trim()) {
        this.toastr.error('Notes must be entered when you select other.');
        return false;
      }
      
      // Food expense limit validation
      if (formValue.purpose === '26' && formValue.expenseAmount > 75) {
        this.toastr.error('Food expenses cannot be more than daily limit of 75 dollars.');
        return false;
      }
    }
    
    return true;
  }

  private prepareFormData(): ExpenseFormData {
    const formValue = this.expenseForm.value;
    
    return {
      callNbr: this.callNbr,
      techName: this.techName,
      techID: this.techID,
      tableIdx: this.tableIdx,
      expType: formValue.expType,
      travelBy: formValue.travelBy || '',
      purpose: formValue.purpose || '',
      payType: formValue.payType || '1',
      mileage: formValue.mileage || 0,
      expenseAmount: formValue.expenseAmount || 0,
      startDateTime: formValue.startDateTime,
      endDateTime: formValue.endDateTime || formValue.startDateTime,
      notes: formValue.notes || '',
      otherReason: formValue.otherReason || '',
      hasFile: false // File upload to be implemented
    };
  }

  goBack(): void {
    this.router.navigate(['/jobs/expenses'], {
      queryParams: {
        CallNbr: this.callNbr,
        TechName: this.techName,
        TechID: this.techID,
        Digest: this.digest
      }
    });
  }

  // Utility methods for template
  isFieldVisible(field: string): boolean {
    switch (field) {
      case 'travelBy': return this.showTravelPanel;
      case 'purpose': return this.showExpensePanel1;
      case 'expenseAmount': return this.showExpensePanel2;
      case 'payType': return this.showExpensePanel3;
      case 'fileUpload': return this.showExpensePanel3;
      case 'mileage': return this.showTravelPanel1;
      case 'endDateTime': return this.showEndDateTime;
      case 'notes': return this.showNotesDropdown;
      case 'otherReason': return this.showOtherReason;
      default: return true;
    }
  }

  get canDelete(): boolean {
    return this.isEditMode && this.tableIdx > 0;
  }

  get canSave(): boolean {
    return !this.isLoading;
  }
}