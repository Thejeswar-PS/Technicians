import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { JobService } from 'src/app/core/services/job.service';
import { ToastrService } from 'ngx-toastr';
import { firstValueFrom } from 'rxjs';

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
  empId: string = '';
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

  // File upload state
  selectedFile: File | null = null;
  selectedFileBase64: string | null = null;
  
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
    this.loadUserContext();
    console.log('=== EDIT EXPENSE COMPONENT INIT START ===');
    console.log('Router URL:', this.router.url);
    console.log('Route snapshot:', this.route.snapshot);
    
    this.route.queryParams.subscribe(params => {
      console.log('Raw queryParams received:', params);
      this.callNbr = params['CallNbr'] || '';
      this.techName = params['TechName'] || '';
      this.techID = params['TechID'] || '';
      if (!this.empId && this.techID) {
        this.empId = this.techID.trim();
      }
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

  private loadUserContext(): void {
    try {
      const stored = localStorage.getItem('userData');
      if (!stored) {
        return;
      }

      const parsed = JSON.parse(stored);
      const possibleEmpId = (parsed?.empID ?? parsed?.empId ?? parsed?.EmpId ?? '').toString().trim();
      if (possibleEmpId) {
        this.empId = possibleEmpId;
      }
    } catch (error) {
      console.warn('Unable to load user context for empId:', error);
    }
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
    const expType = this.expenseForm.get('expType')?.value ?? '';

    // Reset all panels
    this.showTravelPanel = false;
    this.showExpensePanel1 = false;
    this.showExpensePanel2 = false;
    this.showExpensePanel3 = false;
    this.showTravelPanel1 = false;
    this.showEndDateTime = true;
    this.showNotesDropdown = true;

    let defaultNotes: string | null = null;

    switch (expType) {
      case '21': // Travel Hours
        this.showTravelPanel = true;
        this.showTravelPanel1 = true;
        this.showEndDateTime = true;
        this.showNotesDropdown = true;
        defaultNotes = 'PS';
        break;

      case '22': // Expenses
        this.showExpensePanel1 = true;
        this.showExpensePanel2 = true;
        this.showExpensePanel3 = true;
        this.showEndDateTime = false;
        this.showNotesDropdown = false;
        defaultNotes = 'PS';
        break;

      case '20': // Assignment Hours
        defaultNotes = 'At Site';
        break;

      case '23': // Hotel Stay
        defaultNotes = 'At Hotel';
        break;

      default:
        defaultNotes = 'PS';
        break;
    }

    if (expType === '22') {
      if (!this.isEditMode) {
        this.selectedFile = null;
        this.selectedFileBase64 = null;
        this.expenseForm.patchValue({
          notes: 'PS',
          otherReason: ''
        });
      }
    } else if (defaultNotes !== null) {
      this.selectedFile = null;
      this.selectedFileBase64 = null;
      const currentNotes = this.expenseForm.get('notes')?.value;
      if (!this.isEditMode || currentNotes === 'PS' || !currentNotes) {
        this.expenseForm.patchValue({ notes: defaultNotes });
      }
      if (!this.isEditMode) {
        this.expenseForm.patchValue({
          purpose: '',
          expenseAmount: 0,
          payType: '1',
          otherReason: ''
        }, { emitEvent: false });
      }
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
        const currentNotes = this.expenseForm.get('notes')?.value;
        if (!this.isEditMode || currentNotes === 'PS' || !currentNotes) {
          this.expenseForm.patchValue({ notes: 'PS' });
        }
      }
    } else {
      this.expenseForm.get('mileage')?.enable();
      this.expenseForm.get('notes')?.enable();
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

  async onFileSelected(event: any): Promise<void> {
    const file: File | undefined = event?.target?.files?.[0];

    if (!file) {
      this.selectedFile = null;
      this.selectedFileBase64 = null;
      return;
    }

    // Validate file size (2MB limit)
    if (file.size > 2000000) {
      this.toastr.error('File is too big. Image size cannot exceed 2MB');
      event.target.value = '';
      this.selectedFile = null;
      this.selectedFileBase64 = null;
      return;
    }
    
    // Validate file type
    const allowedTypes = ['.jpg', '.jpeg', '.png', '.gif'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(fileExtension)) {
      this.toastr.error('Please choose only .jpg, .png and .gif image types!');
      event.target.value = '';
      this.selectedFile = null;
      this.selectedFileBase64 = null;
      return;
    }

    try {
      this.selectedFile = file;
      this.selectedFileBase64 = await this.readFileAsBase64(file);
    } catch (error) {
      console.error('Error reading attachment:', error);
      this.toastr.error('We could not read the selected file. Please try again.');
      event.target.value = '';
      this.selectedFile = null;
      this.selectedFileBase64 = null;
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

    const formValue = this.expenseForm.getRawValue();
    const expType = formValue.expType;
    const startDate = new Date(formValue.startDateTime);
    const endDate = expType !== '22' ? new Date(formValue.endDateTime) : new Date(formValue.startDateTime);

    try {
      if (expType !== '22') {
        const existingResponse = await firstValueFrom(
          this.jobService.checkHoursSameDay(
            this.techName,
            startDate,
            endDate,
            this.tableIdx
          )
        );

        const existingExpenses = this.normalizeExpenseList(existingResponse);

        for (const exp of existingExpenses) {
          const existingTableIdx = Number(exp.tableIdx ?? exp.tableIDX ?? exp.tableIndex ?? exp.tableId ?? -1);
          if (this.isEditMode && existingTableIdx === this.tableIdx) {
            continue;
          }

          const existingExpType = (exp.expType ?? exp.ExpType ?? '').toString().trim();
          if (existingExpType === 'Expenses' || existingExpType === '22') {
            continue;
          }

          const existingStartDate = this.combineDateAndTimeStrings(exp.strtDate ?? exp.StrtDate ?? exp.startDate, exp.strtTime ?? exp.StrtTime ?? exp.startTime);
          const existingEndDate = this.combineDateAndTimeStrings(exp.endDate ?? exp.EndDate ?? exp.finishDate, exp.endTime ?? exp.EndTime ?? exp.finishTime);

          if (!this.isValidDate(existingStartDate) || !this.isValidDate(existingEndDate)) {
            continue;
          }

          if (!this.isSameDate(existingStartDate, startDate) && !this.isSameDate(existingEndDate, endDate)) {
            continue;
          }

          if (this.hasTimeConflict(startDate, endDate, existingStartDate, existingEndDate)) {
            const jobNo = (exp.callNbr ?? exp.CallNbr ?? exp.jobNo ?? exp.JobNo ?? this.callNbr).toString().trim();
            const conflictType = existingExpType || 'Expense';
            this.errorMessage = `Selected hours have already submitted for ${conflictType} -- <a href="/jobs/job-list?CallNbr=${jobNo}">Job No : ${jobNo}</a>`;
            this.isLoading = false;
            return;
          }
        }
      }

      if (formValue.purpose === '26') {
        const currentAmount = parseFloat(formValue.expenseAmount) || 0;
        const type = this.isEditMode ? 'E' : 'A';
        const expAmount = this.isEditMode ? 0 : currentAmount;

        const resultMsg = await firstValueFrom(
          this.jobService.canTechAddFoodExpenses(
            this.callNbr,
            this.techName,
            expAmount,
            currentAmount,
            type,
            startDate
          )
        );

        if (resultMsg && resultMsg.length > 0) {
          this.errorMessage = 'Error: ' + resultMsg;
          this.isLoading = false;
          return;
        }
      }

      const formData = this.prepareFormData();

      this.jobService.saveExpense(formData).subscribe({
        next: () => {
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
      this.errorMessage = 'Error: ' + (error?.message || 'Unknown error occurred');
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
    const formValue = this.expenseForm.getRawValue();
    const expType = formValue.expType;

    if (!formValue.startDateTime) {
      this.toastr.error('Please enter the Start date and Time.');
      return false;
    }

    if (expType !== '22') {
      if (!formValue.endDateTime) {
        this.toastr.error('Please enter the End date and Time.');
        return false;
      }

      const startDate = new Date(formValue.startDateTime);
      const endDate = new Date(formValue.endDateTime);

      if (startDate >= endDate) {
        this.toastr.error('Start date and time should be less than End date and time.');
        return false;
      }

      const timeDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60);
      if (timeDiff > 24) {
        this.toastr.error('If difference between Start Date and End Date more than 24 Hours then You must add new Expense Entry.');
        return false;
      }

      const trimmedOtherReason = (formValue.otherReason || '').trim();

      if (formValue.notes === 'PS') {
        this.toastr.error('Please select the notes.');
        return false;
      }

      if (formValue.notes === 'Other' && !trimmedOtherReason) {
        this.toastr.error('Notes must be entered when you select other.');
        return false;
      }

      if (trimmedOtherReason && trimmedOtherReason.includes(':')) {
        this.toastr.error('Notes do not accept colon(:).');
        return false;
      }
    }

    if (expType === '21') {
      if (['2', '3'].includes(formValue.travelBy) && (!formValue.mileage || formValue.mileage <= 0)) {
        this.toastr.error('Mileage cannot be empty or zero.');
        return false;
      }
    }

    if (expType === '22') {
      const amountValue = parseFloat(formValue.expenseAmount);
      if (!amountValue || amountValue <= 0) {
        this.toastr.error('Expenses cannot be empty or zero.');
        return false;
      }

      if (!formValue.purpose) {
        this.toastr.error('Please select the Purpose.');
        return false;
      }

      const trimmedOtherReason = (formValue.otherReason || '').trim();

      if (formValue.purpose === '30' && !trimmedOtherReason) {
        this.toastr.error('Notes must be entered when you select other.');
        return false;
      }

      if (formValue.purpose === '26' && amountValue > 75) {
        this.toastr.error('Food expenses cannot be more than daily limit of 75 dollars.');
        return false;
      }
    }

    return true;
  }

  private prepareFormData(): any {
    const formValue = this.expenseForm.getRawValue();
    const expType = formValue.expType;
    const startDate = new Date(formValue.startDateTime);
    const effectiveEndDate = expType !== '22' && formValue.endDateTime ? new Date(formValue.endDateTime) : new Date(formValue.startDateTime);
    const otherReason = (formValue.otherReason || '').trim();

  const changeByValue = this.empId?.trim();
    const imageStreamValue = this.selectedFileBase64 ?? [];

    const expenseData: any = {
      callNbr: this.callNbr,
      techName: this.techName,
      techID: this.techID,
      tableIdx: this.tableIdx,
      expType,
      strtDate: this.formatDateForApi(startDate),
      strtTime: this.formatTimeForApi(startDate),
      endDate: this.formatDateForApi(effectiveEndDate),
      endTime: this.formatTimeForApi(effectiveEndDate),
      edit: 'A',
      imageExists: this.selectedFileBase64 ? 1 : 0,
      imageStream: imageStreamValue,
      travelBy: '',
      travelType: '0',
      mileage: '',
      purpose: '',
      payType: formValue.payType || '1',
      rentalCar: false,
      companyPaid: 0,
      techPaid: 0,
      notes: '',
      description: '',
      changeby: changeByValue
    };

    if (expType === '21') {
      expenseData.travelBy = formValue.travelBy || '';
      expenseData.travelType = formValue.travelBy || '';
      const mileageValue = formValue.mileage;
      expenseData.mileage = mileageValue !== null && mileageValue !== undefined && mileageValue !== ''
        ? mileageValue.toString()
        : '';
      expenseData.rentalCar = formValue.travelBy === '1';
      expenseData.notes = this.resolveNotes(expType, formValue.notes, otherReason, formValue.travelBy || '');
    } else if (expType === '22') {
      expenseData.endDate = this.formatDateForApi(startDate);
      expenseData.endTime = this.formatTimeForApi(startDate);
      expenseData.purpose = formValue.purpose || '';
      expenseData.payType = formValue.payType || '1';

      const amountValue = parseFloat(formValue.expenseAmount) || 0;
      if (formValue.payType === '3') {
        expenseData.techPaid = amountValue;
        expenseData.companyPaid = 0;
      } else {
        expenseData.companyPaid = amountValue;
        expenseData.techPaid = 0;
      }

      expenseData.notes = formValue.purpose === '30' ? otherReason : '';
    } else {
      expenseData.notes = this.resolveNotes(expType, formValue.notes, otherReason, formValue.travelBy || '');
    }

    if (!expenseData.imageStream || (Array.isArray(expenseData.imageStream) && expenseData.imageStream.length === 0)) {
      expenseData.imageExists = 0;
      expenseData.imageStream = [];
    }

    expenseData.description = expenseData.notes;

    console.log('Prepared expense data:', expenseData);

    return expenseData;
  }

  private async readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64Data);
      };
      reader.onerror = () => reject(reader.error || new Error('Unable to read file'));
      reader.readAsDataURL(file);
    });
  }

  private formatDateForApi(date: Date): string {
    if (!this.isValidDate(date)) {
      return '';
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatTimeForApi(date: Date): string {
    if (!this.isValidDate(date)) {
      return '00:00:00';
    }
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  private combineDateAndTimeStrings(dateValue: any, timeValue: any): Date {
    try {
      const datePart = this.parseDate(dateValue);
      if (!this.isValidDate(datePart)) {
        return new Date('');
      }

      let hours = 0;
      let minutes = 0;
      let seconds = 0;

      if (timeValue) {
        let timeString = timeValue.toString();
        if (timeString.includes('T')) {
          timeString = timeString.split('T')[1];
        }
        if (timeString.includes('.')) {
          timeString = timeString.split('.')[0];
        }
        const segments = timeString.split(':');
        if (segments.length >= 1) {
          hours = parseInt(segments[0], 10) || 0;
        }
        if (segments.length >= 2) {
          minutes = parseInt(segments[1], 10) || 0;
        }
        if (segments.length >= 3) {
          seconds = parseInt(segments[2], 10) || 0;
        }
      }

      return new Date(
        datePart.getFullYear(),
        datePart.getMonth(),
        datePart.getDate(),
        hours,
        minutes,
        seconds
      );
    } catch (error) {
      console.warn('Unable to combine date and time values:', dateValue, timeValue, error);
      return new Date('');
    }
  }

  private normalizeExpenseList(data: any): any[] {
    if (data === null || data === undefined) {
      return [];
    }
    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray(data?.data)) {
      return data.data;
    }
    if (Array.isArray(data?.items)) {
      return data.items;
    }
    if (Array.isArray(data?.result)) {
      return data.result;
    }
    if (Array.isArray(data?.table)) {
      return data.table;
    }
    return [data];
  }

  private isValidDate(date: Date): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  }

  private isSameDate(first: Date, second: Date): boolean {
    return this.isValidDate(first)
      && this.isValidDate(second)
      && first.getFullYear() === second.getFullYear()
      && first.getMonth() === second.getMonth()
      && first.getDate() === second.getDate();
  }

  private hasTimeConflict(newStart: Date, newEnd: Date, existingStart: Date, existingEnd: Date): boolean {
    if (!this.isValidDate(newStart) || !this.isValidDate(newEnd) || !this.isValidDate(existingStart) || !this.isValidDate(existingEnd)) {
      return false;
    }

    if (newEnd <= existingStart) {
      return false;
    }

    if (newStart >= existingEnd) {
      return false;
    }

    return true;
  }

  private resolveNotesFromDropdown(value: string, otherReason: string): string {
    const trimmedValue = (value || '').trim();

    if (!trimmedValue || trimmedValue === 'PS') {
      return '';
    }

    if (trimmedValue === 'Other') {
      return otherReason ? `Other:${otherReason}` : 'Other';
    }

    const option = this.notesOptions.find(opt => opt.value === trimmedValue);
    if (option) {
      return option.text;
    }

    return trimmedValue;
  }

  private resolveNotes(expType: string, notesValue: string, otherReason: string, travelBy: string): string {
    switch (expType) {
      case '20':
        return 'At Site';
      case '23':
        return 'At Hotel';
      case '21':
        if (['1', '4', '5'].includes(travelBy)) {
          return this.resolveNotesFromDropdown('OtherT', otherReason);
        }
        return this.resolveNotesFromDropdown(notesValue, otherReason);
      default:
        return this.resolveNotesFromDropdown(notesValue, otherReason);
    }
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