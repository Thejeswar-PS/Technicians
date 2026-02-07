import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { Subscription } from 'rxjs';
import { ReportService } from 'src/app/core/services/report.service';
import { 
  ExtranetUserClassesDto, 
  ExtranetUserClassesApiResponse, 
  ExtranetCustNumbersDto, 
  ExtranetUserInfoDto, 
  ExtranetAddCustnmbrResult,
  ExtranetSaveUpdateUserDto,
  ExtranetSaveUpdateUserResponse,
  ExtranetDeleteUserResponse,
  ExtranetDeleteCustnmbrResponse
} from 'src/app/core/model/extranet-user-classes.model';

@Component({
  selector: 'app-extranet-user-classes',
  templateUrl: './extranet-user-classes.component.html',
  styleUrls: ['./extranet-user-classes.component.scss']
})
export class ExtranetUserClassesComponent implements OnInit, OnDestroy {
  
  // Data properties
  extranetUserClasses: ExtranetUserClassesDto[] = [];
  customerNumbers: ExtranetCustNumbersDto[] = [];
  isLoading = false;
  isLoadingCustomerNumbers = false;
  passwordValidationError = false;
  
  // UI state properties
  isSaving = false;
  isDeleting = false;
  showPassword = false;
  successMessage = '';
  errorMessage = '';
  isEditMode = false;
  isNewUser = true;
  
  // Pending user data to be set after dropdown loads
  private pendingUserData: ExtranetUserInfoDto | null = null;

  // Forms
  userForm: FormGroup;
  assignCustomerForm: FormGroup;
  
  // Selection properties
  selectedLogin = '';
  selectedUserForCustomers = '';
  selectedCustomerNumber = '';

  // Subscription management
  private subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private toastr: ToastrService
  ) {
    // Main user form 
    this.userForm = this.fb.group({
      login: ['', [Validators.required, this.usernameValidator]],
      password: ['', [Validators.required, this.passwordComplexityValidator]], 
      classID: ['Other'], 
      customerName: [''], 
      contactName: ['', [Validators.required]], 
      email: ['', [Validators.required, this.emailValidator]],
      address1: [''], 
      address2: [''], 
      city: [''],
      state: [''], 
      zip: [''], 
      phone: [''],
      viewFinancial: [false], 
      underContract: [false] 
    });

    // Assign customer form
    this.assignCustomerForm = this.fb.group({
      customerNumber: ['', [Validators.required, this.customerNumberValidator]]
    });



  }

  ngOnInit(): void {
    this.clearMessages();
    this.getCustomerClassIDs();
    // Set up username change listener
    this.userForm.get('login')?.valueChanges.subscribe((username) => {
      if (username && username.trim().length > 1) {
        this.onUsernameChange();
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Get Customer Class IDs 
   */
  getCustomerClassIDs(): void {
    this.isLoading = true;
    
    const loadSub = this.reportService.getExtranetUserClasses().subscribe({
      next: (response: ExtranetUserClassesApiResponse) => {
        if (response.success) {
          this.extranetUserClasses = response.data || [];
          // Add default "Other" option like legacy
          if (!this.extranetUserClasses.find(x => x.classID === 'Other')) {
            this.extranetUserClasses.unshift({ classID: 'Other' });
          }
          
          // If we have pending user data, set it now that dropdown options are loaded
          if (this.pendingUserData) {
            this.setUserDataToForm(this.pendingUserData);
            this.pendingUserData = null;
          }
        } else {
          this.extranetUserClasses = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading customer class IDs:', error);
        this.errorMessage = 'Error occurred while loading customer class IDs';
        this.extranetUserClasses = [];
        this.isLoading = false;
      }
    });

    this.subscriptions.push(loadSub);
  }

  /**
   * Load customer numbers 
   */
  loadCustomerNumbers(): void {
    const username = this.userForm.get('login')?.value;
    if (!username || username.trim() === '') {
      this.customerNumbers = [];
      return;
    }

    const trimmedUsername = username.trim();
    
    // Validate username like legacy (no spaces, single quotes, commas, semicolons)
    if (trimmedUsername.indexOf(' ') >= 0 || 
        trimmedUsername.length <= 1 || 
        trimmedUsername.indexOf("'") >= 0 || 
        trimmedUsername.indexOf(',') >= 0 || 
        trimmedUsername.indexOf(';') >= 0) {
      this.customerNumbers = [];
      return;
    }

    const customerSub = this.reportService.getExtranetCustomerNumbers(trimmedUsername).subscribe({
      next: (customerNumbers: ExtranetCustNumbersDto[]) => {
        this.customerNumbers = customerNumbers || [];
        this.selectedLogin = trimmedUsername;
        this.selectedUserForCustomers = trimmedUsername;
      },
      error: (error) => {
        console.error('Error loading customer numbers:', error);
        this.customerNumbers = [];
      }
    });

    this.subscriptions.push(customerSub);
  }

  /**
   * Load user details (matches legacy LoadUserDetails)
   */
  loadUserDetails(): void {
    const username = this.userForm.get('login')?.value;
    if (!username || username.trim() === '') {
      return;
    }

    const trimmedUsername = username.trim();
    
    const fetchSub = this.reportService.getExtranetUserInfo(trimmedUsername).subscribe({
      next: (user: ExtranetUserInfoDto) => {
        if (user) {
          // If dropdown options are not loaded yet, store user data for later
          if (this.extranetUserClasses.length === 0) {
            this.pendingUserData = user;
            return;
          }
          
          this.setUserDataToForm(user);
        }
      },
      error: (error) => {
        // Like legacy - clear form except username for new user
        this.resetFormExceptUsername();
        this.errorMessage = 'No Results found.';
        this.isEditMode = false;
        this.isNewUser = true;
      }
    });

    this.subscriptions.push(fetchSub);
  }

  /**
   * Set user data to form (helper method to handle timing issues)
   */
  private setUserDataToForm(user: ExtranetUserInfoDto): void {
    // If classID from DB is not in the dropdown options, add it
    if (user.classID && !this.extranetUserClasses.find(x => x.classID === user.classID)) {
      this.extranetUserClasses.push({ classID: user.classID });
    }
    
    // Populate form 
    this.userForm.patchValue({
      password: user.password || '',
      classID: user.classID || 'Other',
      email: user.email || '',
      customerName: user.customerName || '',
      contactName: user.contactName || '',
      address1: user.address1 || '',
      address2: user.address2 || '',
      city: user.city || '',
      state: user.state || '',
      zip: user.zip || '',
      phone: user.phone || '',
      viewFinancial: user.viewFinancial || false,
      underContract: user.underContract || false
    });
    
    this.isEditMode = true;
    this.isNewUser = false;
  }

  /**
   * Handle username change (like legacy txtUserName_Change)
   */
  onUsernameChange(): void {
    const username = this.userForm.get('login')?.value;
    if (username && username.trim().length > 1) {
      // Clear previous messages
      this.clearMessages();
      // Set to not new user since we have a username to work with
      this.isNewUser = false;
      // Load user details and customer numbers like legacy
      this.loadUserDetails();
      this.loadCustomerNumbers();
    } else {
      // If username is cleared or too short, reset to new user state
      this.isNewUser = true;
    }
  }

  /**
   * Validate password according to legacy requirements (exact match with C# ValidatePassword)
   */
  private validatePassword(password: string): boolean {
    if (!password) return false;
    
    let isDigit = false;
    let isLetter = false;
    let isLowerChar = false;
    let isUpperChar = false;
    let isNonAlpha = false;

    for (let i = 0; i < password.length; i++) {
      const c = password.charAt(i);
      
      if (/\d/.test(c)) {
        isDigit = true;
      }
      
      if (/[a-zA-Z]/.test(c)) {
        isLetter = true;
        if (/[a-z]/.test(c)) {
          isLowerChar = true;
        }
        if (/[A-Z]/.test(c)) {
          isUpperChar = true;
        }
      }
      
      // Match legacy regex: @"\W|_" (non-word characters or underscore)
      if (/[\W_]/.test(c)) {
        isNonAlpha = true;
      }
    }
    
    // Must have all requirements like legacy
    return isDigit && isLetter && isLowerChar && isUpperChar && isNonAlpha;
  }

  /**
   * Custom username validator (matches legacy character restrictions)
   */
  private usernameValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const username = control.value.toString().trim();
    
    // Check for invalid characters like legacy
    if (username.indexOf(' ') >= 0 || 
        username.indexOf("'") >= 0 || 
        username.indexOf(',') >= 0 || 
        username.indexOf(';') >= 0) {
      return { invalidCharacters: 'Username cannot contain spaces, quotes, commas, or semicolons' };
    }
    
    if (username.length <= 1) {
      return { tooShort: 'Username must be more than 1 character' };
    }
    
    return null;
  }

  /**
   * Custom password complexity validator (matches legacy requirements)
   */
  private passwordComplexityValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const password = control.value.toString();
    let isDigit = false;
    let isLetter = false;
    let isLowerChar = false;
    let isUpperChar = false;
    let isNonAlpha = false;

    for (let i = 0; i < password.length; i++) {
      const c = password.charAt(i);
      
      if (/\d/.test(c)) {
        isDigit = true;
      }
      
      if (/[a-zA-Z]/.test(c)) {
        isLetter = true;
        if (/[a-z]/.test(c)) {
          isLowerChar = true;
        }
        if (/[A-Z]/.test(c)) {
          isUpperChar = true;
        }
      }
      
      // Match legacy regex: @"\W|_" (non-word characters or underscore)
      if (/[\W_]/.test(c)) {
        isNonAlpha = true;
      }
    }
    
    // Must have all requirements like legacy
    if (!(isDigit && isLetter && isLowerChar && isUpperChar && isNonAlpha)) {
      return { 
        complexity: 'Password must use a combination of these:<br />I.Atleast 1 upper case letters (A – Z)<br />II.Lower case letters (a – z)<br />III.Atleast 1 number (0 – 9)<br />IV.Atleast 1 non-alphanumeric symbol (e.g. @ \'$%£!\')' 
      };
    }
    
    return null;
  }

  /**
   * Custom email validator (matches legacy validateEmail function)
   */
  private emailValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const email = control.value.toString();
    
    // Check for exactly one @ symbol
    const atCount = (email.match(/@/g) || []).length;
    if (atCount !== 1) {
      return { invalidEmail: 'Email must contain exactly one @ symbol' };
    }
    
    // Cannot start with @
    if (email.startsWith('@')) {
      return { invalidEmail: 'Email cannot start with @' };
    }
    
    // Split by @ to get local and domain parts
    const parts = email.split('@');
    if (parts.length !== 2 || parts[0].length === 0 || parts[1].length === 0) {
      return { invalidEmail: 'Invalid email format' };
    }
    
    const domain = parts[1];
    
    // Must have a period in domain name
    if (!domain.includes('.')) {
      return { invalidEmail: 'Domain must contain a period' };
    }
    
    // Cannot have consecutive periods
    if (domain.includes('..')) {
      return { invalidEmail: 'Domain cannot have consecutive periods' };
    }
    
    // Check for valid domain suffixes
    const validSuffixes = ['com', 'net', 'org', 'edu', 'gov', 'mil', 'int', 'co', 'uk', 'ca', 'au', 'de', 'fr', 'jp'];
    const domainParts = domain.split('.');
    const suffix = domainParts[domainParts.length - 1].toLowerCase();
    
    if (!validSuffixes.includes(suffix)) {
      return { invalidEmail: 'Invalid domain suffix' };
    }
    
    // Check for invalid characters and non-ASCII characters
    const validEmailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!validEmailPattern.test(email)) {
      return { invalidEmail: 'Email contains invalid characters' };
    }
    
    return null;
  }

  /**
   * Custom customer number validator (matches legacy character restrictions)
   */
  private customerNumberValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    
    const custNumber = control.value.toString().trim();
    
    // Check for invalid characters like legacy
    if (custNumber.indexOf(' ') >= 0 || 
        custNumber.indexOf("'") >= 0 || 
        custNumber.indexOf(',') >= 0 || 
        custNumber.indexOf(';') >= 0) {
      return { invalidCharacters: 'Customer number cannot contain spaces, quotes, commas, or semicolons' };
    }
    
    return null;
  }

  /**
   * Reset form except username (like legacy)
   */
  private resetFormExceptUsername(): void {
    const currentUsername = this.userForm.get('login')?.value;
    this.userForm.patchValue({
      password: '',
      classID: 'Other', // Default like legacy
      customerName: '',
      contactName: '',
      email: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
      viewFinancial: false,
      underContract: false
    });
    this.customerNumbers = [];
    this.selectedCustomerNumber = '';
    this.isEditMode = false;
    this.isNewUser = true;
  }

  /**
   * Assign customer number to login (matches legacy AddCust_Click)
   */
  assignCustomerNumber(): void {
    const login = this.selectedUserForCustomers || this.userForm.get('login')?.value;
    const custNmbr = this.assignCustomerForm.get('customerNumber')?.value;
    
    if (!login || login.trim() === '') {
      this.errorMessage = 'Please enter a username first';
      return;
    }
    
    if (!custNmbr || custNmbr.trim() === '') {
      this.errorMessage = 'Please enter a customer number to assign';
      return;
    }

    this.clearMessages();
    this.isLoadingCustomerNumbers = true;
    const trimmedLogin = login.trim();
    const trimmedCustNmbr = custNmbr.trim();

    const assignSub = this.reportService.addExtranetCustomerNumber(trimmedLogin, trimmedCustNmbr).subscribe({
      next: (result: ExtranetAddCustnmbrResult) => {
        this.isLoadingCustomerNumbers = false;
        
        if (result.message && result.message.includes('exist')) {
          // Like legacy - show error if customer already exists
          this.errorMessage = result.message.replace(trimmedCustNmbr, `'${trimmedCustNmbr}'`);
        } else {
          // Success like legacy
          this.successMessage = result.message ? result.message.replace(trimmedCustNmbr, `'${trimmedCustNmbr}'`) : 'Customer number assigned successfully';
          this.assignCustomerForm.get('customerNumber')?.reset();
          
          // Refresh customer numbers like legacy
          this.loadCustomerNumbers();
        }
      },
      error: (error) => {
        this.isLoadingCustomerNumbers = false;
        console.error('Error assigning customer number:', error);
        this.errorMessage = 'Error assigning customer number';
      }
    });

    this.subscriptions.push(assignSub);
  }

  /**
   * Save user information (with password validation like legacy)
   */
  saveUser(): void {
    this.clearMessages();
    
    if (this.userForm.invalid) {
      Object.keys(this.userForm.controls).forEach(key => {
        const control = this.userForm.get(key);
        if (control && control.invalid) {
          control.markAsTouched();
        }
      });
      this.errorMessage = 'Please fix all validation errors before saving.';
      return;
    }

    // Note: Password validation is now handled by the passwordComplexityValidator
    this.passwordValidationError = false;

    this.isSaving = true;
    const userDto: ExtranetSaveUpdateUserDto = this.userForm.value;

    const saveSub = this.reportService.saveUpdateExtranetUser(userDto).subscribe({
      next: (response: ExtranetSaveUpdateUserResponse) => {
        this.isSaving = false;
        this.successMessage = response.message || 'User saved successfully';
        
        // Refresh data like legacy LoadUserDetails and LoadCustomerNmbrs
        this.loadUserDetails();
        this.loadCustomerNumbers();
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error saving user:', error);
        this.errorMessage = 'Error saving user';
      }
    });

    this.subscriptions.push(saveSub);
  }

  /**
   * Reset form to initial state (like legacy reset)
   */
  resetForm(): void {
    this.userForm.reset({
      login: '',
      password: '',
      classID: 'Other', // Default like legacy
      customerName: '',
      contactName: '',
      email: '',
      address1: '',
      address2: '',
      city: '',
      state: '',
      zip: '',
      phone: '',
      viewFinancial: false,
      underContract: false
    });
    this.assignCustomerForm.reset({
      customerNumber: ''
    });
    this.customerNumbers = [];

    this.selectedLogin = '';
    this.selectedUserForCustomers = '';
    this.passwordValidationError = false;
    this.clearMessages();
    this.isEditMode = false;
    this.isNewUser = true;
  }

  /**
   * Delete user (like legacy DeleteUser_Click)
   */
  deleteUser(): void {
    const username = this.selectedUserForCustomers || this.userForm.get('login')?.value;
    
    if (!username || username.trim() === '') {
      this.errorMessage = 'Please enter a username to delete';
      return;
    }

    // Confirmation dialog like legacy
    if (!confirm(`Are you sure you want to delete user '${username.trim()}'? This action cannot be undone.`)) {
      return;
    }

    this.clearMessages();
    this.isDeleting = true;

    const deleteUserSub = this.reportService.deleteExtranetUser(username.trim()).subscribe({
      next: (response: any) => {
        this.isDeleting = false;
        
        // Since we're in the next callback, the delete was successful
        this.successMessage = `User '${username.trim()}' has been deleted successfully`;
        
        // Reset form and state after successful delete
        this.resetForm();
        this.isNewUser = true;
        this.selectedLogin = '';
        this.selectedUserForCustomers = '';
        
        // Clear customer numbers since user is deleted
        this.customerNumbers = [];
      },
      error: (error) => {
        this.isDeleting = false;
        
        // Only show error if it's actually an error (not a successful delete)
        if (error.status === 0 || error.status >= 400) {
          if (error.error && typeof error.error === 'string') {
            this.errorMessage = error.error;
          } else if (error.error && error.error.message) {
            this.errorMessage = error.error.message;
          } else if (error.message) {
            this.errorMessage = error.message;
          } else {
            this.errorMessage = 'Error deleting user. Please try again.';
          }
        } else {
          // If it's a 2xx status code, treat it as success
          this.successMessage = `User '${username.trim()}' has been deleted successfully`;
          this.resetForm();
          this.isNewUser = true;
          this.selectedLogin = '';
          this.selectedUserForCustomers = '';
          this.customerNumbers = [];
        }
      }
    });

    this.subscriptions.push(deleteUserSub);
  }

  /**
   * Delete customer number (matches legacy DeleteCust_Click)
   */
  deleteCustomerNumber(login: string, custNmbr: string): void {
    if (!login || login.trim() === '' || !custNmbr || custNmbr.trim() === '') {
      this.errorMessage = 'Login and customer number are required';
      return;
    }

    if (!this.confirmDialog(`Are you sure you want to delete customer number '${custNmbr}' for login '${login}'? This action cannot be undone.`)) {
      return;
    }

    this.clearMessages();
    this.isLoadingCustomerNumbers = true;

    const deleteCustSub = this.reportService.deleteExtranetCustomerNumber(login.trim(), custNmbr.trim()).subscribe({
      next: (response: ExtranetDeleteCustnmbrResponse) => {
        this.isLoadingCustomerNumbers = false;
        this.successMessage = response.message ? response.message.replace(custNmbr, `'${custNmbr}'`) : 'Customer number deleted successfully';
        
        // Refresh customer numbers list like legacy
        this.loadCustomerNumbers();
      },
      error: (error) => {
        this.isLoadingCustomerNumbers = false;
        console.error('Error deleting customer number:', error);
        this.errorMessage = 'Error deleting customer number';
      }
    });

    this.subscriptions.push(deleteCustSub);
  }

  /**
   * Navigate back
   */
  onBack(): void {
    // Navigate back to reports or previous page
    window.history.back();
  }

  /**
   * Handle save user form submission
   */
  onSaveUser(): void {
    this.saveUser();
  }

  /**
   * Handle cancel operation
   */
  onCancel(): void {
    this.resetForm();
  }

  /**
   * Handle new user creation
   */
  onNewUser(): void {
    this.isNewUser = true;
    this.isEditMode = false;
    this.resetForm();
  }

  /**
   * Handle delete user
   */
  onDeleteUser(): void {
    const username = this.selectedUserForCustomers || this.userForm.get('login')?.value;
    
    if (!username || username.trim() === '') {
      this.errorMessage = 'Please enter a username to delete';
      return;
    }

    this.deleteUser();
  }

  /**
   * Select user for customer management
   */
  onSelectUserForCustomers(classID: string): void {
    this.selectedUserForCustomers = classID;
    // Update the username in the form to load customer numbers
    this.userForm.get('login')?.setValue(classID);
    this.loadCustomerNumbers();
  }

  /**
   * Edit user
   */
  onEditUser(classID: string): void {
    this.selectedLogin = classID;
    this.isEditMode = true;
    this.isNewUser = false;
    // Set the username and trigger data loading
    this.userForm.get('login')?.setValue(classID);
    this.loadUserDetails();
    this.loadCustomerNumbers();
  }

  /**
   * Handle assign customer form submission
   */
  onAssignCustomer(): void {
    this.clearMessages();
    
    const customerNumber = this.assignCustomerForm.get('customerNumber')?.value?.trim();
    const login = (this.selectedUserForCustomers || this.userForm.get('login')?.value)?.trim();
    
    // Validate inputs
    if (!login) {
      this.errorMessage = 'Please enter a username first';
      return;
    }
    
    if (!customerNumber) {
      this.errorMessage = 'Please enter a customer number to assign';
      // Mark field as touched to show validation errors
      this.assignCustomerForm.get('customerNumber')?.markAsTouched();
      return;
    }
    
    // Validate customer number format
    const customerControl = this.assignCustomerForm.get('customerNumber');
    if (customerControl?.invalid) {
      this.errorMessage = 'Please enter a valid customer number (numbers only)';
      customerControl.markAsTouched();
      return;
    }
    
    // All validations passed, proceed with assignment
    this.assignCustomerNumber();
  }



  /**
   * Remove customer assignment
   */
  onRemoveCustomer(custNmbr: string): void {
    if (this.selectedUserForCustomers) {
      this.deleteCustomerNumber(this.selectedUserForCustomers, custNmbr);
    }
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Check if form field is invalid
   */
  isFieldInvalid(fieldName: string, form?: FormGroup): boolean {
    const targetForm = form || this.userForm;
    const field = targetForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Get field error message
   */
  getFieldError(fieldName: string, form?: FormGroup): string {
    const targetForm = form || this.userForm;
    const field = targetForm.get(fieldName);
    if (field && field.errors) {
      if (field.errors['required']) {
        return `${fieldName} is required`;
      }
      if (field.errors['email']) {
        return 'Please enter a valid email address';
      }
      if (field.errors['invalidEmail']) {
        return field.errors['invalidEmail'];
      }
      if (field.errors['invalidCharacters']) {
        return field.errors['invalidCharacters'];
      }
      if (field.errors['tooShort']) {
        return field.errors['tooShort'];
      }
      if (field.errors['complexity']) {
        return field.errors['complexity'];
      }
    }
    return '';
  }

  /**
   * TrackBy function for user classes
   */
  trackByClassId(index: number, item: ExtranetUserClassesDto): string {
    return item.classID;
  }

  /**
   * TrackBy function for customer numbers
   */
  trackByCustomerNumber(index: number, item: ExtranetCustNumbersDto): string {
    return item.custNmbr;
  }

  /**
   * Clear all messages
   */
  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  /**
   * Show confirmation dialog (matches legacy confirmation dialogs)
   */
  private confirmDialog(message: string): boolean {
    return confirm(message);
  }
}