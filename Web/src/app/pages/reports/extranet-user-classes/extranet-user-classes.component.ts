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

  // Forms
  userForm: FormGroup;
  assignCustomerForm: FormGroup;
  
  // Selection properties
  selectedLogin = '';
  selectedUserForCustomers = '';
  showCustomerNumbers = false;

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
   * View customer numbers for selected user
   */
  viewCustomerNumbers(): void {
    if (!this.selectedUserForCustomers) {
      this.toastr.warning('Please select a user to view customer numbers');
      return;
    }

    this.isLoadingCustomerNumbers = true;
    this.selectedLogin = this.selectedUserForCustomers;
    
    const customerSub = this.reportService.getExtranetCustomerNumbers(this.selectedUserForCustomers).subscribe({
      next: (customerNumbers: ExtranetCustNumbersDto[]) => {
        this.customerNumbers = customerNumbers || [];
        this.showCustomerNumbers = true;
        this.isLoadingCustomerNumbers = false;
        
        if (this.customerNumbers.length === 0) {
          this.toastr.info(`No customer numbers found for user: ${this.selectedUserForCustomers}`);
        } else {
          this.toastr.success(`Found ${this.customerNumbers.length} customer number(s) for user: ${this.selectedUserForCustomers}`);
        }
      },
      error: (error) => {
        console.error('Error loading customer numbers:', error);
        this.toastr.error('Error loading customer numbers');
        this.customerNumbers = [];
        this.showCustomerNumbers = true;
        this.isLoadingCustomerNumbers = false;
      }
    });

    this.subscriptions.push(customerSub);
  }

  /**
   * Assign customer number to login
   */
  assignCustomerNumber(): void {
    if (this.assignCustomerForm.invalid) {
      Object.keys(this.assignCustomerForm.controls).forEach(key => {
        const control = this.assignCustomerForm.get(key);
        if (control && control.invalid) {
          control.markAsTouched();
        }
      });
      return;
    }

    this.isLoading = true;
    const { login, custNmbr } = this.assignCustomerForm.value;

    const assignSub = this.reportService.addExtranetCustomerNumber(login, custNmbr).subscribe({
      next: (result: ExtranetAddCustnmbrResult) => {
        this.isLoading = false;
        this.toastr.success(result.message || 'Customer number assigned successfully');
        this.assignCustomerForm.reset();
        
        // Refresh customer numbers if viewing the same login
        if (this.selectedLogin === login) {
          this.viewCustomerNumbers();
        }
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
   * Save user information
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

    this.isLoading = true;
    const userDto: ExtranetSaveUpdateUserDto = this.userForm.value;

    const saveSub = this.reportService.saveUpdateExtranetUser(userDto).subscribe({
      next: (response: ExtranetSaveUpdateUserResponse) => {
        this.isLoading = false;
        this.toastr.success(response.message || 'User saved successfully');
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
   * Reset form to initial state
   */
  resetForm(): void {
    this.userForm.reset({
      login: '',
      password: '',
      classID: '', // No default value
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
  }

  /**
   * Delete user
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
          this.viewCustomerNumbers();
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