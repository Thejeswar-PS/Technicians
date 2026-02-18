import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ReportService } from 'src/app/core/services/report.service';
import { CommonService } from 'src/app/core/services/common.service';
import { AuthService } from 'src/app/modules/auth';
import {
  DTechUsersDataRequest,
  DTechUsersDataDto,
  DTechUsersDataResponse,
  DTechUsersDataFilter
} from 'src/app/core/model/dtech-users-data.model';

@Component({
  selector: 'app-dtech-users-data',
  templateUrl: './dtech-users-data.component.html',
  styleUrls: ['./dtech-users-data.component.scss']
})
export class DTechUsersDataComponent implements OnInit {

  // Data properties
  dtechUsersData: DTechUsersDataDto[] = [];
  filteredData: DTechUsersDataDto[] = [];
  originalData: DTechUsersDataDto[] = [];
  
  // UI State properties
  isLoading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  showFilters: boolean = false;
  
  // Sorting properties
  sortedColumn: string = '';
  sortDirection: number = 1; // 1 for ascending, -1 for descending
  
  // Pagination properties
  currentPage: number = 1;
  pageSize: number = 25;
  totalRecords: number = 0;
  displayedData: DTechUsersDataDto[] = [];
  pageSizeOptions: number[] = [10, 25, 50, 100];
  
  // Filter properties
  isFiltered: boolean = false;
  activeFilters: string[] = [];
  
  // Forms
  filterForm: FormGroup = this.fb.group({
    login: [''],
    siteID: [''],
    custName: [''],
    address: [''],
    phone: [''],
    email: [''],
    contact: [''],
    svcSerialId: ['']
  });

  // Search properties
  globalSearchTerm: string = '';
  
  // Statistics
  statistics = {
    totalUsers: 0,
    usersWithRecentLogin: 0,
    usersWithOldPasswords: 0,
    uniqueSites: 0
  };

  // Template helper properties
  Math = Math;
  
  // Date comparison helpers
  private thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
  private ninetyDaysAgo = new Date(Date.now() - (90 * 24 * 60 * 60 * 1000));

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private commonService: CommonService,
    private authService: AuthService,
    public router: Router
  ) { }

  ngOnInit(): void {
    // Don't load data automatically - user must search first
  }

  /**
   * Load DTech users data with current filters
   */
  loadDTechUsersData(filters?: DTechUsersDataRequest): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const requestFilters = filters || this.getFormFilters();

    this.reportService.getDTechUsersData(requestFilters).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.dtechUsersData = response.data.usersData;
          this.originalData = [...response.data.usersData];
          this.totalRecords = response.totalRecords;
          this.isFiltered = response.isFiltered;
          
          this.applyGlobalSearch();
          this.calculateStatistics();
          this.updateDisplayedData();
          
          this.updateActiveFilters();
        } else {
          this.errorMessage = response.message || 'Failed to load DTech users data';
          this.dtechUsersData = [];
        }
      },
      error: (error) => {
        console.error('Error loading DTech users data:', error);
        this.errorMessage = 'Error loading DTech users data. Please try again.';
        this.dtechUsersData = [];
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  /**
   * Apply filters from the form
   */
  applyFilters(): void {
    const filters = this.getFormFilters();
    
    if (!filters) {
      this.errorMessage = 'Please enter at least one search criteria.';
      return;
    }
    
    this.loadDTechUsersData(filters);
  }

  /**
   * Search users based on form criteria
   */
  searchUsers(): void {
    this.applyFilters();
  }

  /**
   * Clear all filters and reset data
   */
  clearFilters(): void {
    this.filterForm.reset();
    this.globalSearchTerm = '';
    this.dtechUsersData = [];
    this.filteredData = [];
    this.displayedData = [];
    this.totalRecords = 0;
    this.isFiltered = false;
    this.activeFilters = [];
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Get filter values from form
   */
  private getFormFilters(): DTechUsersDataRequest | undefined {
    const formValue = this.filterForm.value;
    
    // Check if any filter has a value
    const hasFilters = Object.values(formValue).some(value => value && typeof value === 'string' && value.toString().trim() !== '');
    
    if (!hasFilters) {
      return undefined;
    }

    const filters: DTechUsersDataRequest = {};
    
    if (formValue.login?.trim()) {
      filters.login = formValue.login.trim();
    }
    if (formValue.siteID?.trim()) {
      filters.siteID = formValue.siteID.trim();
    }
    if (formValue.custName?.trim()) {
      filters.custName = formValue.custName.trim();
    }
    if (formValue.address?.trim()) {
      filters.address = formValue.address.trim();
    }
    if (formValue.phone?.trim()) {
      filters.phone = formValue.phone.trim();
    }
    if (formValue.email?.trim()) {
      filters.email = formValue.email.trim();
    }
    if (formValue.contact?.trim()) {
      filters.contact = formValue.contact.trim();
    }
    if (formValue.svcSerialId?.trim()) {
      filters.svcSerialId = formValue.svcSerialId.trim();
    }

    return filters;
  }

  /**
   * Update active filters display
   */
  private updateActiveFilters(): void {
    const formValue = this.filterForm.value;
    this.activeFilters = [];

    if (formValue.login?.trim()) {
      this.activeFilters.push(`Login: ${formValue.login}`);
    }
    if (formValue.siteID?.trim()) {
      this.activeFilters.push(`Site ID: ${formValue.siteID}`);
    }
    if (formValue.custName?.trim()) {
      this.activeFilters.push(`Customer: ${formValue.custName}`);
    }
    if (formValue.address?.trim()) {
      this.activeFilters.push(`Address: ${formValue.address}`);
    }
    if (formValue.phone?.trim()) {
      this.activeFilters.push(`Phone: ${formValue.phone}`);
    }
    if (formValue.email?.trim()) {
      this.activeFilters.push(`Email: ${formValue.email}`);
    }
    if (formValue.contact?.trim()) {
      this.activeFilters.push(`Contact: ${formValue.contact}`);
    }
    if (formValue.svcSerialId?.trim()) {
      this.activeFilters.push(`Service Serial: ${formValue.svcSerialId}`);
    }
    if (this.globalSearchTerm?.trim()) {
      this.activeFilters.push(`Search: ${this.globalSearchTerm}`);
    }
  }

  /**
   * Apply global search across all visible data
   */
  applyGlobalSearch(): void {
    if (!this.globalSearchTerm?.trim()) {
      this.filteredData = [...this.dtechUsersData];
    } else {
      const searchTerm = this.globalSearchTerm.toLowerCase();
      this.filteredData = this.dtechUsersData.filter(user =>
        user.login.toLowerCase().includes(searchTerm) ||
        user.siteID.toLowerCase().includes(searchTerm) ||
        user.custName.toLowerCase().includes(searchTerm) ||
        user.address.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.contact.toLowerCase().includes(searchTerm) ||
        user.phone.toLowerCase().includes(searchTerm)
      );
    }
    
    this.updateDisplayedData();
    this.updateActiveFilters();
  }

  /**
   * Handle global search input
   */
  onGlobalSearch(): void {
    this.currentPage = 1;
    this.applyGlobalSearch();
  }

  /**
   * Sort data by column
   */
  sortData(column: string): void {
    if (this.sortedColumn === column) {
      this.sortDirection *= -1;
    } else {
      this.sortedColumn = column;
      this.sortDirection = 1;
    }

    this.filteredData.sort((a, b) => {
      let aValue: any = this.getPropertyValue(a, column);
      let bValue: any = this.getPropertyValue(b, column);

      // Handle dates
      if (column === 'lastLoggedIn' || column === 'lastChangedPwd') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }
      // Handle strings
      else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return -1 * this.sortDirection;
      if (aValue > bValue) return 1 * this.sortDirection;
      return 0;
    });

    this.updateDisplayedData();
  }

  /**
   * Get property value from object using dot notation
   */
  private getPropertyValue(obj: any, property: string): any {
    return property.split('.').reduce((o, p) => o && o[p], obj);
  }

  /**
   * Update paginated displayed data
   */
  updateDisplayedData(): void {
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.displayedData = this.filteredData.slice(startIndex, endIndex);
    this.totalRecords = this.filteredData.length;
  }

  /**
   * Handle page change
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.updateDisplayedData();
  }

  /**
   * Handle page size change
   */
  onPageSizeChange(): void {
    this.currentPage = 1;
    this.updateDisplayedData();
  }

  /**
   * Calculate statistics
   */
  private calculateStatistics(): void {
    this.statistics.totalUsers = this.dtechUsersData.length;
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const ninetyDaysAgo = new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));
    
    this.statistics.usersWithRecentLogin = this.dtechUsersData.filter(user => 
      user.lastLoggedIn > thirtyDaysAgo
    ).length;
    
    this.statistics.usersWithOldPasswords = this.dtechUsersData.filter(user => 
      user.lastChangedPwd < ninetyDaysAgo
    ).length;
    
    const uniqueSites = new Set(this.dtechUsersData.map(user => user.siteID));
    this.statistics.uniqueSites = uniqueSites.size;
  }

  /**
   * Toggle filter panel visibility
   */
  toggleFilters(): void {
    this.showFilters = !this.showFilters;
  }

  /**
   * Export data to CSV
   */
  exportToCSV(): void {
    try {
      const headers = ['Login', 'Password', 'Site ID', 'Customer Name', 'Address', 'Contact', 'Phone', 'Email', 'Last Logged In', 'Last Changed Password'];
      const csvData = this.filteredData.map(user => [
        user.login,
        user.password ? 'Protected' : 'N/A',
        user.siteID,
        user.custName,
        user.address,
        user.contact,
        user.phone,
        user.email,
        user.lastLoggedIn.toLocaleDateString(),
        user.lastChangedPwd.toLocaleDateString()
      ]);

      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dtech-users-data-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);

      this.successMessage = 'Data exported successfully';
    } catch (error) {
      this.errorMessage = 'Error exporting data';
    }
  }

  /**
   * Get total pages count
   */
  getTotalPages(): number {
    return Math.ceil(this.totalRecords / this.pageSize);
  }

  /**
   * Get page numbers for pagination
   */
  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    
    return pages;
  }

  /**
   * Format date for display
   */
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  /**
   * Format date and time for display
   */
  formatDateTime(date: Date): string {
    return new Date(date).toLocaleString();
  }

  /**
   * Clear messages
   */
  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  /**
   * Refresh data
   */
  refreshData(): void {
    this.loadDTechUsersData(this.getFormFilters());
  }

  /**
   * Check if password was changed recently (within 30 days)
   */
  isPasswordRecent(lastChangedPwd: Date): boolean {
    return new Date(lastChangedPwd) > this.thirtyDaysAgo;
  }

  /**
   * Check if password is old (older than 90 days)
   */
  isPasswordOld(lastChangedPwd: Date): boolean {
    return new Date(lastChangedPwd) < this.ninetyDaysAgo;
  }
}