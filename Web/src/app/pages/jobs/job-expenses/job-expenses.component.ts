import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { JobService } from 'src/app/core/services/job.service';
import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EditExpenseComponent } from '../edit-expense/edit-expense.component';

export interface JobExpense {
  expType: string;
  description: string;
  strtDate: string;
  strtTime: string;
  endDate: string;
  endTime: string;
  techPaid?: number | null;
  companyPaid?: number | null;
  mileage?: number | null;
  hours?: number | null;
  travelBy?: string;
  changeLast: string;
  changeBy: string;
  callNbr: string;
  tableIndex: number;
  purpose?: string;
  foodLimit?: number;
}

@Component({
  selector: 'app-job-expenses',
  templateUrl: './job-expenses.component.html',
  styleUrls: ['./job-expenses.component.scss']
})
export class JobExpensesComponent implements OnInit {
  callNbr: string = '';
  techName: string = '';
  techID: string = '';
  
  expenses: JobExpense[] = [];
  filteredExpenses: JobExpense[] = [];
  
  dateFilterForm: FormGroup;
  errorMessage: string = '';
  
  // Totals
  techPaidTotal: number = 0;
  companyPaidTotal: number = 0;
  mileageTotal: number = 0;
  hoursTotal: number = 0;
  showJobNumberColumn = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private jobService: JobService,
    private toastr: ToastrService,
    private modalService: NgbModal
  ) {
    this.dateFilterForm = this.fb.group({
      startDate: [''],
      endDate: ['']
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.callNbr = params['CallNbr'] || '';
      this.techName = params['TechName'] || '';
      this.techID = params['TechID'] || '';
      
      console.log('Job Expenses - Received params:', { 
        callNbr: this.callNbr, 
        techName: this.techName, 
        techID: this.techID 
      });
      
      if (this.callNbr) {
        this.loadExpenses();
      }
    });
  }

  loadExpenses(): void {
    console.log('Loading expenses for CallNbr:', this.callNbr, 'TechName:', this.techName);
    
    this.jobService.getExpenseInfo(this.callNbr, this.techName).subscribe({
      next: (data: JobExpense[]) => {
        console.log('All expenses loaded:', data);
        
        // Debug: Log the first expense to check data structure
        if (data && data.length > 0) {
          console.log('First expense object:', data[0]);
          console.log('Tech Paid value:', data[0].techPaid, 'Type:', typeof data[0].techPaid);
          console.log('Company Paid value:', data[0].companyPaid, 'Type:', typeof data[0].companyPaid);
        }
        
        // Filter expenses by callNbr if we're viewing expenses for a specific job
        if (this.callNbr && this.callNbr.trim() !== '') {
          this.expenses = data.filter(expense => expense.callNbr === this.callNbr);
          console.log('Filtered expenses for job:', this.callNbr, this.expenses);
        } else {
          this.expenses = data;
        }
        
        this.filteredExpenses = this.expenses;
        this.calculateTotals();
        this.errorMessage = this.expenses.length === 0 ? 'No expenses found for this job.' : '';
      },
      error: (error: any) => {
        console.error('Error loading expenses:', error);
        this.errorMessage = 'Error loading expenses: ' + (error.error?.message || error.message || 'Unknown error');
        this.expenses = [];
        this.filteredExpenses = [];
      }
    });
  }

  filterExpensesByDate(): void {
    const startDate = this.dateFilterForm.value.startDate;
    const endDate = this.dateFilterForm.value.endDate;
    
    if (!startDate || !endDate) {
      this.toastr.error('Please enter both Start date and End date.');
      return;
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start > end) {
      this.toastr.error('Start date should be less than End date.');
      return;
    }
    
    console.log('Filtering expenses by date range:', startDate, 'to', endDate);
    this.showJobNumberColumn = true;
    
    this.jobService.getExpenseInfoByDateRange(this.techName, start, end).subscribe({
      next: (data: JobExpense[]) => {
        console.log('Filtered expenses loaded:', data);
        this.filteredExpenses = data;
        this.calculateTotals();
        this.errorMessage = data.length > 0 ? '' : 'No results found.';
      },
      error: (error: any) => {
        console.error('Error filtering expenses:', error);
        if (error.status === 404) {
          this.errorMessage = 'No expenses found for the selected date range.';
        } else {
          this.errorMessage = 'Error filtering expenses: ' + (error.error?.message || error.message || 'Unknown error');
        }
        this.filteredExpenses = [];
      }
    });
  }

  calculateTotals(): void {
    this.techPaidTotal = 0;
    this.companyPaidTotal = 0;
    this.mileageTotal = 0;
    this.hoursTotal = 0;
    
    this.filteredExpenses.forEach(expense => {
      this.techPaidTotal += expense.techPaid || 0;
      this.companyPaidTotal += expense.companyPaid || 0;
      this.mileageTotal += expense.mileage || 0;
      this.hoursTotal += expense.hours || 0;
    });
  }

  // Helper method to safely get currency values with default $0.00
  getCurrencyValue(value: number | null | undefined): number {
    const numValue = Number(value);
    console.log(`Currency value input: ${value}, converted: ${numValue}, isNaN: ${isNaN(numValue)}`);
    return isNaN(numValue) ? 0 : numValue;
  }

  // Helper method to safely get numeric values with default 0
  getNumericValue(value: number | null | undefined): number {
    const numValue = Number(value);
    return isNaN(numValue) ? 0 : numValue;
  }

  formatHours(totalMinutes: number): string {
    if (!totalMinutes) return '0.00 Hrs';
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = ((totalMinutes / 60) - hours) * 60 / 100;
    const total = hours + minutes;
    
    const result = total.toFixed(2);
    if (result.endsWith('.00')) {
      return result + ' Hrs';
    } else {
      return result.replace('.', ' Hr:') + ' Mi';
    }
  }

  formatExpenseHours(totalMinutes: number): string {
    return this.formatHours(totalMinutes);
  }

  addNewExpense(): void {
    console.log('Opening modal to add new expense for CallNbr:', this.callNbr);
    
    const modalRef = this.modalService.open(EditExpenseComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      scrollable: true
    });
    
    // Pass data to modal
    modalRef.componentInstance.callNbr = this.callNbr;
    modalRef.componentInstance.techName = this.techName;
    modalRef.componentInstance.techID = this.techID;
    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.tableIdx = 0;
    
    // Handle modal result
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        if (result === 'saved') {
          // Reload expenses after save
          this.loadExpenses();
        }
      },
      (reason) => {
        console.log('Modal dismissed with reason:', reason);
      }
    );
  }

  editExpense(expense: JobExpense): void {
    console.log('Opening modal to edit expense:', expense);
    
    const modalRef = this.modalService.open(EditExpenseComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      scrollable: true
    });
    
    // Pass data to modal
    modalRef.componentInstance.callNbr = expense.callNbr;
    modalRef.componentInstance.techName = this.techName;
    modalRef.componentInstance.techID = this.techID;
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.tableIdx = expense.tableIndex;
    
    // Handle modal result
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        if (result === 'saved' || result === 'deleted') {
          // Reload expenses after save or delete
          this.loadExpenses();
        }
      },
      (reason) => {
        console.log('Modal dismissed with reason:', reason);
      }
    );
  }

  viewMobileReceipts(): void {
    console.log('Viewing mobile receipts for CallNbr:', this.callNbr);
    this.router.navigate(['/jobs/mobile-receipts'], {
      queryParams: {
        CallNbr: this.callNbr,
        TechName: this.techName,
        TechID: this.techID
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/jobs'], {
      queryParams: {
        CallNbr: this.callNbr
      }
    });
  }

  shouldHideField(expType: string, field: string): boolean {
    // Logic to hide specific fields based on expense type (matching legacy behavior)
    const normalizedExpType = expType.trim().toLowerCase().replace(/\s+/g, ' ');
    
    let shouldHide = false;
    switch (normalizedExpType) {
      case 'labor':
      case 'assignment hours':
        shouldHide = ['mileage'].includes(field); // Only hide mileage for labor types
        break;
      case 'expenses':
        shouldHide = ['mileage', 'hours'].includes(field);
        break;
      case 'travel':
      case 'travel hours':
        shouldHide = ['techPaid', 'companyPaid'].includes(field);
        break;
      case 'hotel stay':
        shouldHide = ['techPaid', 'companyPaid', 'mileage'].includes(field);
        break;
      default:
        shouldHide = false; // Show all fields for other types
    }
    
    // Debug logging
    if (field === 'techPaid' || field === 'companyPaid') {
      console.log(`ExpType: "${expType}" (normalized: "${normalizedExpType}"), Field: ${field}, Hide: ${shouldHide}`);
    }
    
    return shouldHide;
  }

  getRowClass(expType: string): string {
    if (expType.trim().toLowerCase() === 'hotel stay') {
      return 'table-danger text-white';
    }
    return '';
  }

  trackByTableIndex(index: number, expense: JobExpense): any {
    return expense.tableIndex || index;
  }
}