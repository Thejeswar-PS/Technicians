import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
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
      login: ['', [Validators.required]],
      password: ['', [Validators.required]],
      classID: ['', [Validators.required]], // No default value, populated from API
      customerName: [''],
      contactName: [''],
      email: ['', [Validators.email]],
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
      login: ['', [Validators.required]],
      custNmbr: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadExtranetUserClasses();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Load ExtranetUserClasses data from the API
   */
  loadExtranetUserClasses(): void {
    this.isLoading = true;
    
    const loadSub = this.reportService.getExtranetUserClasses().subscribe({
      next: (response: ExtranetUserClassesApiResponse) => {
        if (response.success) {
          this.extranetUserClasses = response.data || [];
          this.toastr.success(response.message || 'User classes loaded successfully');
        } else {
          this.toastr.error('Failed to load user classes');
          this.extranetUserClasses = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading user classes:', error);
        this.toastr.error('Error occurred while loading user classes');
        this.extranetUserClasses = [];
        this.isLoading = false;
      }
    });

    this.subscriptions.push(loadSub);
  }

  /**
   * Handle user selection change
   */
  onUserSelectionChange(event: any): void {
    this.selectedUserForCustomers = event.target.value;
  }

  /**
   * Fetch user information by username (like legacy FetchUser_Click)
   */
  fetchUser(): void {
    const username = this.userForm.get('login')?.value;
    if (!username || username.trim() === '') {
      return;
    }

    this.isLoading = true;
    const trimmedUsername = username.trim();

    const fetchSub = this.reportService.getExtranetUserInfo(trimmedUsername).subscribe({
      next: (user: ExtranetUserInfoDto) => {
        this.populateFormWithUserData(user);
        this.loadCustomerNumbersForUser(trimmedUsername);
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error fetching user:', error);
        // Clear form except username for new user creation
        this.resetFormExceptUsername();
      }
    });

    this.subscriptions.push(fetchSub);
  }

  /**
   * Handle username change (like legacy txtUserName_Change)
   */
  onUsernameChange(): void {
    const username = this.userForm.get('login')?.value;
    if (username && username.trim().length > 1) {
      // Auto-fetch user data when username is entered (like legacy behavior)
      this.fetchUser();
    }
  }

  /**
   * Populate form with user data (like legacy LoadUserDetails)
   */
  private populateFormWithUserData(user: ExtranetUserInfoDto): void {
    this.userForm.patchValue({
      login: user.login,
      password: user.password,
      classID: user.classID,
      customerName: user.customerName,
      contactName: user.contactName,
      email: user.email,
      address1: user.address1,
      address2: user.address2,
      city: user.city,
      state: user.state,
      zip: user.zip,
      phone: user.phone,
      viewFinancial: user.viewFinancial,
      underContract: user.underContract
    });
  }

  /**
   * Load customer numbers for a specific user
   */
  private loadCustomerNumbersForUser(username: string): void {
    this.selectedLogin = username;
    this.selectedUserForCustomers = username;
    
    const customerSub = this.reportService.getExtranetCustomerNumbers(username).subscribe({
      next: (customerNumbers: ExtranetCustNumbersDto[]) => {
        this.customerNumbers = customerNumbers || [];
        // Clear selected customer number when list changes
        this.selectedCustomerNumber = '';
      },
      error: (error) => {
        console.error('Error loading customer numbers:', error);
        this.customerNumbers = [];
        this.selectedCustomerNumber = '';
      }
    });

    this.subscriptions.push(customerSub);
  }

  /**
   * Validate password according to legacy requirements
   */
  private validatePassword(password: string): boolean {
    if (!password) return false;
    
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    
    return hasUppercase && hasLowercase && hasNumber && hasSpecial;
  }

  /**
   * Reset form except username
   */
  private resetFormExceptUsername(): void {
    const currentUsername = this.userForm.get('login')?.value;
    this.userForm.reset({
      login: currentUsername,
      password: '',
      classID: '',
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
  }

  /**
   * Assign customer number to login
   */
  assignCustomerNumber(): void {
    const login = this.userForm.get('login')?.value;
    const custNmbr = this.assignCustomerForm.get('custNmbr')?.value;
    
    if (!login || login.trim() === '') {
      this.toastr.warning('Please enter a username first');
      return;
    }
    
    if (!custNmbr || custNmbr.trim() === '') {
      this.toastr.warning('Please enter a customer number to assign');
      return;
    }

    this.isLoading = true;
    const trimmedLogin = login.trim();
    const trimmedCustNmbr = custNmbr.trim();

    const assignSub = this.reportService.addExtranetCustomerNumber(trimmedLogin, trimmedCustNmbr).subscribe({
      next: (result: ExtranetAddCustnmbrResult) => {
        this.isLoading = false;
        this.toastr.success(result.message || 'Customer number assigned successfully');
        this.assignCustomerForm.get('custNmbr')?.reset();
        
        // Refresh customer numbers
        this.loadCustomerNumbersForUser(trimmedLogin);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error assigning customer number:', error);
        this.toastr.error('Error assigning customer number');
      }
    });

    this.subscriptions.push(assignSub);
  }

  /**
   * Save user information (with password validation like legacy)
   */
  saveUser(): void {
    if (this.userForm.invalid) {
      Object.keys(this.userForm.controls).forEach(key => {
        const control = this.userForm.get(key);
        if (control && control.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    // Validate password like legacy
    const password = this.userForm.get('password')?.value;
    if (!this.validatePassword(password)) {
      this.passwordValidationError = true;
      this.toastr.error('Password does not meet complexity requirements');
      return;
    }
    this.passwordValidationError = false;

    this.isLoading = true;
    const userDto: ExtranetSaveUpdateUserDto = this.userForm.value;

    const saveSub = this.reportService.saveUpdateExtranetUser(userDto).subscribe({
      next: (response: ExtranetSaveUpdateUserResponse) => {
        this.isLoading = false;
        this.toastr.success(response.message || 'User saved successfully');
        // Refresh customer numbers after save
        if (userDto.login) {
          this.loadCustomerNumbersForUser(userDto.login);
        }
        // Optionally refresh user classes list
        this.loadExtranetUserClasses();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error saving user:', error);
        this.toastr.error('Error saving user');
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
      classID: '',
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
      login: '',
      custNmbr: ''
    });
    this.customerNumbers = [];

    this.selectedLogin = '';
    this.selectedUserForCustomers = '';
    this.passwordValidationError = false;
  }

  /**
   * Delete user (like legacy DeleteUser_Click)
   */
  deleteUser(): void {
    const username = this.userForm.get('login')?.value;
    
    if (!username || username.trim() === '') {
      this.toastr.warning('Please enter a username to delete');
      return;
    }

    if (!confirm(`Are you sure you want to delete user '${username}'? This action cannot be undone.`)) {
      return;
    }

    this.isLoading = true;

    const deleteUserSub = this.reportService.deleteExtranetUser(username.trim()).subscribe({
      next: (response: ExtranetDeleteUserResponse) => {
        this.isLoading = false;
        this.toastr.success(response.message || 'User deleted successfully');
        this.resetForm();
        this.loadExtranetUserClasses();
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Error deleting user:', error);
        this.toastr.error('Error deleting user');
      }
    });

    this.subscriptions.push(deleteUserSub);
  }

  /**
   * Delete customer number
   */
  deleteCustomerNumber(login: string, custNmbr: string): void {
    if (!login || login.trim() === '' || !custNmbr || custNmbr.trim() === '') {
      this.toastr.warning('Login and customer number are required');
      return;
    }

    if (!confirm(`Are you sure you want to delete customer number '${custNmbr}' for login '${login}'? This action cannot be undone.`)) {
      return;
    }

    this.isLoadingCustomerNumbers = true;

    const deleteCustSub = this.reportService.deleteExtranetCustomerNumber(login.trim(), custNmbr.trim()).subscribe({
      next: (response: ExtranetDeleteCustnmbrResponse) => {
        this.isLoadingCustomerNumbers = false;
        this.toastr.success(response.message || 'Customer number deleted successfully');
        
        // Refresh customer numbers list
        if (this.selectedLogin && this.selectedLogin.toLowerCase() === login.toLowerCase()) {
          this.loadCustomerNumbersForUser(this.selectedLogin);
        }
      },
      error: (error) => {
        this.isLoadingCustomerNumbers = false;
        console.error('Error deleting customer number:', error);
        this.toastr.error('Error deleting customer number');
      }
    });

    this.subscriptions.push(deleteCustSub);
  }
}