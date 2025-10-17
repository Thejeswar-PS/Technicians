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
    console.log('=== EDIT EXPENSE COMPONENT INIT START ===');
    console.log('Router URL:', this.router.url);
    console.log('Route snapshot:', this.route.snapshot);
    
    this.route.queryParams.subscribe(params => {
      console.log('Raw queryParams received:', params);
      this.callNbr = params['CallNbr'] || '';
      this.techName = params['TechName'] || '';
      this.techID = params['TechID'] || '';
      this.tableIdx = parseInt(params['TableIdx']) || 0;
      this.digest = params['Digest'] || '';
      
      this.isEditMode = this.tableIdx > 0;
      
      console.log('Edit Expense - Parsed params:', {
        callNbr: this.callNbr,
        techName: this.techName,
        techID: this.techID,
        tableIdx: this.tableIdx,
        isEditMode: this.isEditMode
      });
      
      // Disable expense type field in edit mode
      if (this.isEditMode) {
        this.expenseForm.get('expType')?.disable();
      } else {
        this.expenseForm.get('expType')?.enable();
      }
      
      if (this.isEditMode) {
        console.log('Loading expense data for edit mode...');
        this.loadExpenseData();
      } else {
        console.log('Setting up for new expense...');
        // Set default values for new expense
        this.onExpenseTypeChange();
      }
    });
    
    // Subscribe to form changes for dynamic behavior
    console.log('Setting up form subscriptions...');
    this.setupFormSubscriptions();
    console.log('=== EDIT EXPENSE COMPONENT INIT END ===');
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
    console.log('=== LOAD EXPENSE DATA START ===');
    console.log('Loading data for CallNbr:', this.callNbr, 'TableIdx:', this.tableIdx);
    this.isLoading = true;
    
    this.jobService.getExpenseDetail(this.callNbr, this.tableIdx).subscribe({
      next: (data: any) => {
        console.log('Expense data loaded successfully:', data);
        console.log('Data type:', typeof data);
        console.log('Is array:', Array.isArray(data));
        if (Array.isArray(data) && data.length > 0) {
          console.log('First item in array:', data[0]);
          console.log('Date fields in first item:', {
            strtDate: data[0].strtDate,
            endDate: data[0].endDate,
            strtTime: data[0].strtTime,
            endTime: data[0].endTime
          });
          this.populateForm(data[0]); // Use first item if array
        } else if (data && !Array.isArray(data)) {
          console.log('Single object data:', data);
          console.log('Date fields:', {
            strtDate: data.strtDate,
            endDate: data.endDate,
            strtTime: data.strtTime,
            endTime: data.endTime
          });
          this.populateForm(data);
        } else {
          console.warn('No expense data found');
          this.errorMessage = 'No expense data found';
        }
        this.isLoading = false;
        console.log('=== LOAD EXPENSE DATA SUCCESS ===');
      },
      error: (error: any) => {
        console.error('=== LOAD EXPENSE DATA ERROR ===');
        console.error('Error loading expense data:', error);
        this.errorMessage = 'Error loading expense data: ' + (error.error?.message || error.message);
        this.isLoading = false;
      }
    });
  }

  private populateForm(data: any): void {
    console.log('=== POPULATE FORM START ===');
    console.log('Raw data received:', data);
    console.log('Date fields:', {
      strtDate: data.strtDate,
      strtTime: data.strtTime,
      endDate: data.endDate,
      endTime: data.endTime
    });
    
    // Parse start and end date/time with validation
    let startDateTime = '';
    let endDateTime = '';
    
    try {
      const startDate = this.parseDate(data.strtDate);
      const startTime = data.strtTime || '00:00:00';
      startDateTime = this.formatDateTime(startDate, startTime);
      console.log('Start date parsed successfully:', startDateTime);
    } catch (error) {
      console.error('Error parsing start date:', data.strtDate, error);
      startDateTime = this.getDefaultDateTime();
      console.log('Using default start datetime:', startDateTime);
    }
    
    try {
      const endDate = this.parseDate(data.endDate);
      const endTime = data.endTime || '00:00:00';
      endDateTime = this.formatDateTime(endDate, endTime);
      console.log('End date parsed successfully:', endDateTime);
    } catch (error) {
      console.error('Error parsing end date:', data.endDate, error);
      endDateTime = this.getDefaultDateTime();
      console.log('Using default end datetime:', endDateTime);
    }
    
    // Parse notes field (backend might send as 'description' or 'notes')
    const notesData = data.description || data.notes || '';
    let notes = 'PS';
    let otherReason = '';
    
    console.log('Notes/Description data:', notesData);
    
    if (notesData) {
      if (data.expType === '22' && data.purpose === '30') {
        // For expenses with "Other" purpose, entire notes is the reason
        otherReason = notesData;
      } else if (notesData.includes(':')) {
        // If notes contains colon, split it (e.g., "Other:some reason")
        const noteParts = notesData.split(':');
        notes = noteParts[0] || 'PS';
        otherReason = noteParts.length > 1 ? noteParts[1] : '';
      } else {
        // Otherwise, use as-is for notes
        notes = notesData || 'PS';
      }
    }
    
    console.log('Parsed notes:', notes, 'otherReason:', otherReason);
    
    // Calculate expense amount
    const expenseAmount = (data.techPaid || 0) + (data.companyPaid || 0);
    
    const formData = {
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
    };
    
    console.log('Patching form with data:', formData);
    this.expenseForm.patchValue(formData);
    
    console.log('Form values after patch:', this.expenseForm.value);
    console.log('startDateTime control value:', this.expenseForm.get('startDateTime')?.value);
    console.log('endDateTime control value:', this.expenseForm.get('endDateTime')?.value);
    
    // Update visibility after form is populated
    this.onExpenseTypeChange();
    console.log('=== POPULATE FORM END ===');
  }

  private formatDateTime(date: Date, time: string): string {
    // Validate date first
    if (!date || isNaN(date.getTime())) {
      console.error('Invalid date provided to formatDateTime:', date);
      throw new Error('Invalid date');
    }
    
    const dateStr = date.toISOString().split('T')[0];
    
    // Extract HH:mm from time string
    // Backend sends time as full datetime like '1900-01-01T12:54:37'
    let timeStr = '00:00';
    if (time) {
      // If time contains 'T', extract the time part after T
      if (time.includes('T')) {
        const timePart = time.split('T')[1]; // Get '12:54:37'
        const timeParts = timePart.split(':');
        if (timeParts.length >= 2) {
          timeStr = `${timeParts[0]}:${timeParts[1]}`;
        }
      } else {
        // Otherwise just split by colon
        const timeParts = time.split(':');
        if (timeParts.length >= 2) {
          timeStr = `${timeParts[0]}:${timeParts[1]}`;
        }
      }
    }
    const result = `${dateStr}T${timeStr}`;
    console.log('Formatted datetime:', result, 'from date:', date, 'time:', time);
    return result;
  }

  private parseDate(dateString: any): Date {
    console.log('Parsing date string:', dateString, 'Type:', typeof dateString);
    
    if (!dateString) {
      throw new Error('Date string is null or undefined');
    }
    
    // Handle different date formats
    let date: Date;
    
    if (typeof dateString === 'string') {
      // Remove any time component if present (we handle time separately)
      let datePart = dateString.split('T')[0];
      
      // Try parsing as-is first
      date = new Date(datePart);
      
      // If invalid, try parsing common formats
      if (isNaN(date.getTime())) {
        // Try MM/DD/YYYY format
        const mmddyyyy = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        if (mmddyyyy) {
          date = new Date(parseInt(mmddyyyy[3]), parseInt(mmddyyyy[1]) - 1, parseInt(mmddyyyy[2]));
          console.log('Parsed MM/DD/YYYY format:', date);
        }
        
        // Try YYYY-MM-DD format
        if (isNaN(date.getTime())) {
          const yyyymmdd = datePart.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
          if (yyyymmdd) {
            date = new Date(parseInt(yyyymmdd[1]), parseInt(yyyymmdd[2]) - 1, parseInt(yyyymmdd[3]));
            console.log('Parsed YYYY-MM-DD format:', date);
          }
        }
        
        // Try DD/MM/YYYY format
        if (isNaN(date.getTime())) {
          const ddmmyyyy = datePart.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
          if (ddmmyyyy) {
            // Assume DD/MM/YYYY
            date = new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
            console.log('Parsed DD/MM/YYYY format:', date);
          }
        }
      }
    } else {
      // Try treating as Date object or timestamp
      date = new Date(dateString);
    }
    
    if (isNaN(date.getTime())) {
      console.error(`Unable to parse date: ${dateString}`);
      throw new Error(`Unable to parse date: ${dateString}`);
    }
    
    console.log('Successfully parsed date:', date);
    return date;
  }

  private getDefaultDateTime(): string {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${dateStr}T${hours}:${minutes}`;
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

  async onSave(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }
    
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.foodLimitMessage = '';
    
    const formValue = this.expenseForm.value;
    const startDate = new Date(formValue.startDateTime);
    const endDate = formValue.expType !== '22' ? new Date(formValue.endDateTime) : startDate;
    
    try {
      // CRITICAL VALIDATION: Check for overlapping hours (from legacy btnSave_Click)
      if (formValue.expType !== '22') {
        const existingExpenses = await this.jobService.checkHoursSameDay(
          this.techName, 
          startDate, 
          endDate, 
          this.tableIdx
        ).toPromise();
        
        if (existingExpenses && existingExpenses.length > 0) {
          // Check for time conflicts with existing expenses
          for (const exp of existingExpenses) {
            const expType = exp.expType;
            const expJobNo = exp.callNbr;
            const expStartDate = new Date(exp.strtDate + ' ' + exp.strtTime);
            const expEndDate = new Date(exp.endDate + ' ' + exp.endTime);
            
            // Skip if this is an expense (type 22)
            if (expType === 'Expenses') {
              continue;
            }
            
            // Check for time overlap
            let hasConflict = false;
            
            // Case 1: New expense starts and ends before existing expense
            if (startDate < expStartDate && endDate <= expStartDate) {
              hasConflict = false;
            }
            // Case 2: New expense starts after existing expense ends
            else if (startDate >= expEndDate) {
              hasConflict = false;
            }
            // Case 3: New expense is completely within existing expense time
            else if (startDate >= expStartDate && endDate < expEndDate) {
              hasConflict = true;
            }
            // Any other case is a conflict
            else {
              hasConflict = true;
            }
            
            if (hasConflict) {
              this.errorMessage = `Selected hours have already submitted for ${expType} -- <a href="/jobs/job-list?CallNbr=${expJobNo}">Job No : ${expJobNo}</a>`;
              this.isLoading = false;
              return;
            }
          }
        }
      }
      
      // CRITICAL VALIDATION: Check food expense limits (from legacy btnSave_Click)
      if (formValue.purpose === '26') { // Food
        const currentAmount = parseFloat(formValue.expenseAmount) || 0;
        const type = this.isEditMode ? 'E' : 'A';
        const expAmount = this.isEditMode ? 0 : currentAmount;
        
        const resultMsg = await this.jobService.canTechAddFoodExpenses(
          this.callNbr,
          this.techName,
          expAmount,
          currentAmount,
          type,
          startDate
        ).toPromise();
        
        if (resultMsg && resultMsg.length > 0) {
          this.errorMessage = 'Error: ' + resultMsg;
          this.isLoading = false;
          return;
        }
      }
      
      // All validations passed, proceed with save
      const formData = this.prepareFormData();
      
      this.jobService.saveExpense(formData).subscribe({
        next: (response: any) => {
          this.successMessage = 'Update Successful.';
          this.isLoading = false;
          this.toastr.success('Expense saved successfully!');
        },
        error: (error: any) => {
          console.error('Error saving expense:', error);
          this.errorMessage = 'Error saving expense: ' + (error.error?.message || error.message);
          this.isLoading = false;
        }
      });
      
    } catch (error: any) {
      console.error('Error in save validation:', error);
      this.errorMessage = 'Error: ' + (error.message || 'Unknown error occurred');
      this.isLoading = false;
    }
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

  private prepareFormData(): any {
    const formValue = this.expenseForm.getRawValue(); // Use getRawValue() to include disabled fields
    const expType = formValue.expType;
    const startDate = new Date(formValue.startDateTime);
    const endDate = formValue.endDateTime ? new Date(formValue.endDateTime) : startDate;
    
    // Base data structure matching legacy SaveData() method
    const expenseData: any = {
      callNbr: this.callNbr,
      techName: this.techName,
      techID: this.techID,
      tableIdx: this.tableIdx,
      expType: expType,
      strtDate: startDate.toISOString().split('T')[0], // Short date format
      strtTime: startDate.toTimeString().split(' ')[0], // Time format
      edit: 'A', // 'A' for Add/Edit operation
      imageExists: 0,
      imgStream: null
    };
    
    // Set fields based on expense type (matching legacy logic)
    if (expType !== '21') {
      // Not travel - clear travel-related fields
      expenseData.mileage = '';
      expenseData.travelBy = '';
      expenseData.travelType = '0';
    } else {
      // Travel expense - set travel fields
      expenseData.mileage = formValue.mileage?.toString() || '0';
      expenseData.travelBy = formValue.travelBy || '';
      expenseData.travelType = formValue.travelBy || '';
      expenseData.rentalCar = formValue.travelBy === '1';
      expenseData.purpose = '';
    }
    
    if (expType === '22') {
      // Expenses type
      expenseData.endDate = expenseData.strtDate;
      expenseData.endTime = expenseData.strtTime;
      expenseData.purpose = formValue.purpose || '';
      
      // Notes handling
      if (formValue.purpose === '30') { // Other
        expenseData.notes = formValue.otherReason || '';
      } else {
        expenseData.notes = '';
      }
      
      // Payment type handling
      if (formValue.payType === '3') { // Tech Paid
        expenseData.techPaid = parseFloat(formValue.expenseAmount) || 0;
        expenseData.companyPaid = 0;
      } else { // Company Paid
        expenseData.companyPaid = parseFloat(formValue.expenseAmount) || 0;
        expenseData.techPaid = 0;
      }
      
      expenseData.payType = formValue.payType || '1';
    } else {
      // Hours-based expenses (Assignment, Travel, Hotel, Time Off)
      expenseData.endDate = endDate.toISOString().split('T')[0];
      expenseData.endTime = endDate.toTimeString().split(' ')[0];
      expenseData.purpose = '';
      expenseData.companyPaid = 0;
      expenseData.techPaid = 0;
      
      // Auto-set notes based on expense type (matching legacy logic)
      if (expType === '20') { // Assignment Hours
        expenseData.notes = 'At Site';
      } else if (expType === '23') { // Hotel Stay
        expenseData.notes = 'At Hotel';
      } else if (expType === '21') { // Travel Hours
        if (['1', '4', '5'].includes(formValue.travelBy)) {
          // Rental Car, Taxi, Flight
          expenseData.notes = 'OtherT';
        } else {
          // Personal Car, Company Car - use notes dropdown value
          if (formValue.notes === 'PS' || !formValue.notes) {
            expenseData.notes = '';
          } else if (formValue.notes === 'Other') {
            expenseData.notes = 'Other:' + (formValue.otherReason || '');
          } else {
            // Use the display text from the dropdown
            const selectedOption = this.notesOptions.find(opt => opt.value === formValue.notes);
            if (selectedOption) {
              expenseData.notes = selectedOption.text;
            } else {
              expenseData.notes = formValue.notes;
            }
          }
        }
      } else if (expType === '68') { // Time Off Hours
        // Handle notes for time off
        if (formValue.notes === 'PS' || !formValue.notes) {
          expenseData.notes = '';
        } else if (formValue.notes === 'Other') {
          expenseData.notes = 'Other:' + (formValue.otherReason || '');
        } else {
          const selectedOption = this.notesOptions.find(opt => opt.value === formValue.notes);
          if (selectedOption) {
            expenseData.notes = selectedOption.text;
          } else {
            expenseData.notes = formValue.notes;
          }
        }
      } else {
        expenseData.notes = formValue.notes || '';
      }
    }
    
    // Set description field (same as notes for backend compatibility)
    expenseData.description = expenseData.notes;
    
    console.log('Prepared expense data:', expenseData);
    
    return expenseData;
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