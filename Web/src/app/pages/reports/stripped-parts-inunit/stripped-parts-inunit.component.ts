import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportService } from 'src/app/core/services/report.service';
import { CommonService } from 'src/app/core/services/common.service';
import { AuthService } from 'src/app/modules/auth';
import { 
  StrippedPartsInUnitDto,
  StrippedPartsInUnitListResponse,
  StrippedPartsInUnitApiResponse,
  KEEP_THROW_OPTIONS,
  StripPartCodeDto,
  StripPartCodeApiResponse
} from 'src/app/core/model/stripped-units-status.model';
import { ToastrService } from 'ngx-toastr';
import { Subscription, finalize } from 'rxjs';

@Component({
  selector: 'app-stripped-parts-inunit',
  templateUrl: './stripped-parts-inunit.component.html', // Template file path
  styleUrls: ['./stripped-parts-inunit.component.scss']
})
export class StrippedPartsInunitComponent implements OnInit, OnDestroy {

  // Forms
  searchForm: FormGroup;
  strippedPartsForm: FormGroup;

  // Data properties
  strippedParts: StrippedPartsInUnitDto[] = [];
  currentStrippedPart: StrippedPartsInUnitDto | null = null;
  stripPartCodes: StripPartCodeDto[] = [];
  masterRowIndex: number | null = null;

  // Chart and Summary Data
  chartOptions: any = {
    series: [{
      name: 'Parts Count',
      data: []
    }],
    chart: {
      type: 'column',
      height: 350,
      background: '#E3E3E3',
      toolbar: { show: false }
    },
    title: {
      text: 'Parts Count',
      align: 'center'
    },
    xaxis: {
      categories: [],
      labels: {
        style: {
          colors: '#0000FF',
          fontSize: '10px'
        }
      }
    },
    yaxis: {
      title: { text: '' }
    },
    colors: ['#428bca'],
    dataLabels: { enabled: true }
  };
  summaryData: any[] = [];
  totalStrippedParts: number = 0;
  partsLocation: string = '';
  groupedParts: any[] = [];

  // Loading and error states
  isLoading: boolean = false;
  isLoadingParts: boolean = false;
  isSavingPart: boolean = false;
  isLoadingStripPartCodes: boolean = false;
  isDeleting: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  partsErrorMessage: string = '';
  partsSuccessMessage: string = '';

  // UI state
  isPartsEditMode: boolean = false;
  isNewPart: boolean = false;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 25;
  totalItems: number = 0;
  totalPages: number = 0;
  paginatedParts: StrippedPartsInUnitDto[] = [];

  // Subscription management
  private subscriptions: Subscription = new Subscription();

  // Make Math available in template
  public Math = Math;

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private commonService: CommonService,
    private authService: AuthService,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    console.log('StrippedPartsInunitComponent - ngOnInit called');
    // Check for masterRowIndex in query parameters
    this.subscriptions.add(
      this.route.queryParams.subscribe(params => {
        if (params['masterRowIndex']) {
          this.masterRowIndex = parseInt(params['masterRowIndex']);
          this.loadStrippedPartsForUnit();
        }
      })
    );

    this.loadStripPartCodes();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeForms(): void {
    // Search form for finding parts by master row index
    this.searchForm = this.fb.group({
      masterRowIndex: ['', [Validators.required, Validators.min(1)]]
    });

    // Form for adding/editing stripped parts
    this.strippedPartsForm = this.fb.group({
      dcgPartGroup: ['', [Validators.required, Validators.maxLength(50)]],
      dcgPartNo: ['', [Validators.required, Validators.maxLength(100)]],
      partDesc: ['', [Validators.required, Validators.maxLength(255)]],
      keepThrow: ['', [Validators.required]],
      stripNo: [1, [Validators.required, Validators.min(1)]]
    });
  }

  // Search Methods
  onSearch(): void {
    if (this.searchForm.valid) {
      this.masterRowIndex = this.searchForm.get('masterRowIndex')?.value;
      this.loadStrippedPartsForUnit();
    } else {
      this.toastr.error('Please enter a valid Master Row Index');
    }
  }

  onClearSearch(): void {
    this.searchForm.reset();
    this.masterRowIndex = null;
    this.strippedParts = [];
    this.updatePagination();
    this.successMessage = '';
    this.errorMessage = '';
  }

  // Data Loading Methods
  private loadStrippedPartsForUnit(): void {
    if (!this.masterRowIndex) {
      console.log('⚠️ [PARTS LOAD] No masterRowIndex available to load parts for');
      return;
    }

    console.log('🔄 [PARTS LOAD] Loading parts for unit with masterRowIndex:', this.masterRowIndex);
    this.isLoadingParts = true;
    this.partsErrorMessage = '';
    this.partsSuccessMessage = '';

    const subscription = this.reportService.getStrippedPartsInUnit(this.masterRowIndex)
      .pipe(finalize(() => this.isLoadingParts = false))
      .subscribe({
        next: (response: StrippedPartsInUnitListResponse) => {
          console.log('📦 [DB RESPONSE] Stripped parts data from database:', response);
          if (response.success) {
            this.strippedParts = response.data || [];
            this.totalItems = this.strippedParts.length;
            console.log('✅ [PARTS DATA] Loaded parts for UI display:', this.strippedParts);
            console.log('📊 [PARTS COUNT] Total parts found:', this.strippedParts.length);
            
            if (this.strippedParts.length === 0) {
              console.log('📭 [PARTS EMPTY] No parts found for this unit in database');
              this.partsSuccessMessage = 'No stripped parts found for this unit.';
            } else {
              this.partsSuccessMessage = `Found ${this.strippedParts.length} stripped parts for this unit.`;
              this.calculateSummaryAndChart();
            }
            
            this.updatePagination();
          } else {
            console.error('❌ [PARTS ERROR] Failed to load parts:', response.message);
            this.partsErrorMessage = response.message || 'Failed to load stripped parts';
            this.strippedParts = [];
            this.updatePagination();
          }
        },
        error: (error) => {
          console.error('💥 [PARTS ERROR] Error loading stripped parts:', error);
          this.partsErrorMessage = 'Failed to load stripped parts. Please try again.';
          this.strippedParts = [];
          this.updatePagination();
        }
      });

    this.subscriptions.add(subscription);
  }

  private loadStripPartCodes(): void {
    this.isLoadingStripPartCodes = true;
    
    const subscription = this.reportService.getStripPartCodes()
      .pipe(finalize(() => this.isLoadingStripPartCodes = false))
      .subscribe({
        next: (response: StripPartCodeApiResponse) => {
          if (response.success) {
            this.stripPartCodes = response.data || [];
            console.log('✅ [PART CODES] Loaded strip part codes:', this.stripPartCodes);
          } else {
            console.error('❌ [PART CODES] Failed to load strip part codes:', response.message);
            this.toastr.error('Failed to load part codes');
          }
        },
        error: (error) => {
          console.error('💥 [PART CODES] Error loading strip part codes:', error);
          this.toastr.error('Failed to load part codes');
        }
      });

    this.subscriptions.add(subscription);
  }

  // Part Management Methods
  onAddStrippedPart(): void {
    if (!this.masterRowIndex) {
      this.toastr.error('Please search for a unit first');
      return;
    }

    this.isNewPart = true;
    this.isPartsEditMode = true;
    this.currentStrippedPart = null;
    this.resetPartsForm();
    this.partsErrorMessage = '';
    this.partsSuccessMessage = '';
  }

  onEditStrippedPart(part: StrippedPartsInUnitDto): void {
    this.isNewPart = false;
    this.isPartsEditMode = true;
    this.currentStrippedPart = part;
    this.loadPartToForm(part);
    this.partsErrorMessage = '';
    this.partsSuccessMessage = '';
  }

  onCancelPartEdit(): void {
    this.isPartsEditMode = false;
    this.isNewPart = false;
    this.currentStrippedPart = null;
    this.resetPartsForm();
    this.partsErrorMessage = '';
  }

  onSaveStrippedPart(): void {
    if (!this.strippedPartsForm.valid || !this.masterRowIndex) {
      this.toastr.error('Please fill in all required fields');
      return;
    }

    this.isSavingPart = true;
    this.partsErrorMessage = '';

    const formValue = this.strippedPartsForm.value;
    const partData: StrippedPartsInUnitDto = {
      masterRowIndex: this.masterRowIndex,
      rowIndex: this.isNewPart ? 0 : (this.currentStrippedPart?.rowIndex || 0),
      dcgPartGroup: formValue.dcgPartGroup,
      dcgPartNo: formValue.dcgPartNo,
      partDesc: formValue.partDesc,
      keepThrow: formValue.keepThrow,
      stripNo: formValue.stripNo || 1,
      lastModifiedBy: this.authService.currentUserValue?.userName || 'System',
      createdBy: this.authService.currentUserValue?.userName || 'System'
    };

    console.log('💾 [SAVE PART] Saving part data:', partData);

    const saveObservable = this.isNewPart
      ? this.reportService.saveStrippedPartInUnit(partData)
      : this.reportService.updateStrippedPartInUnit(partData);

    const subscription = saveObservable
      .pipe(finalize(() => this.isSavingPart = false))
      .subscribe({
        next: (response: StrippedPartsInUnitApiResponse) => {
          if (response.success) {
            const action = this.isNewPart ? 'added' : 'updated';
            this.toastr.success(`Part ${action} successfully`);
            this.partsSuccessMessage = `Part ${action} successfully`;
            this.onCancelPartEdit();
            this.loadStrippedPartsForUnit(); // Reload the parts list
          } else {
            this.partsErrorMessage = response.message || `Failed to save part`;
            this.toastr.error(this.partsErrorMessage);
          }
        },
        error: (error) => {
          console.error('💥 [SAVE ERROR] Error saving part:', error);
          this.partsErrorMessage = 'Failed to save part. Please try again.';
          this.toastr.error(this.partsErrorMessage);
        }
      });

    this.subscriptions.add(subscription);
  }

  onDeleteStrippedPart(part: StrippedPartsInUnitDto): void {
    if (!confirm(`Are you sure you want to delete this part: ${part.dcgPartNo}?`)) {
      return;
    }

    this.isDeleting = true;
    const subscription = this.reportService.deleteStrippedPartInUnit(part.masterRowIndex, part.rowIndex)
      .pipe(finalize(() => this.isDeleting = false))
      .subscribe({
        next: (response: StrippedPartsInUnitApiResponse) => {
          if (response.success) {
            this.toastr.success('Part deleted successfully');
            this.partsSuccessMessage = 'Part deleted successfully';
            this.loadStrippedPartsForUnit(); // Reload the parts list
          } else {
            this.toastr.error(response.message || 'Failed to delete part');
          }
        },
        error: (error) => {
          console.error('💥 [DELETE ERROR] Error deleting part:', error);
          this.toastr.error('Failed to delete part');
        }
      });

    this.subscriptions.add(subscription);
  }

  // Form Helper Methods
  private loadPartToForm(part: StrippedPartsInUnitDto): void {
    this.strippedPartsForm.patchValue({
      dcgPartGroup: part.dcgPartGroup,
      dcgPartNo: part.dcgPartNo,
      partDesc: part.partDesc,
      keepThrow: part.keepThrow,
      stripNo: part.stripNo
    });
  }

  private resetPartsForm(): void {
    this.strippedPartsForm.reset({
      dcgPartGroup: '',
      dcgPartNo: '',
      partDesc: '',
      keepThrow: '',
      stripNo: 1
    });
  }

  // Validation Methods
  isPartsFieldInvalid(fieldName: string): boolean {
    const field = this.strippedPartsForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getPartsFieldError(fieldName: string): string {
    const field = this.strippedPartsForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['maxlength']) return `${fieldName} is too long`;
      if (field.errors['min']) return `${fieldName} must be greater than 0`;
    }
    return '';
  }

  // Pagination Methods
  updatePagination(): void {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedParts = this.strippedParts.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  // Utility Methods
  getKeepThrowOptions() {
    return KEEP_THROW_OPTIONS;
  }

  trackByRowIndex(index: number, item: StrippedPartsInUnitDto): number {
    return item.rowIndex;
  }

  hasPartContent(): boolean {
    const partFormValue = this.strippedPartsForm.value;
    const hasContent = !!(partFormValue.dcgPartGroup || partFormValue.dcgPartNo || partFormValue.partDesc);
    return hasContent;
  }

  // Chart and Summary Calculation Methods
  private calculateSummaryAndChart(): void {
    this.totalStrippedParts = this.strippedParts.reduce((sum, part) => sum + (part.stripNo || 0), 0);
    
    // Group parts by Part Group
    const groupedPartsMap = this.strippedParts.reduce((groups: any, part) => {
      const group = part.dcgPartGroup || 'Unknown';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(part);
      return groups;
    }, {});

    // Convert to array format for template
    this.groupedParts = Object.keys(groupedPartsMap).map(groupName => ({
      groupName: `${groupName} - ${groupName}`,
      parts: groupedPartsMap[groupName]
    }));

    // Calculate summary data for each group
    this.summaryData = Object.keys(groupedPartsMap).map(groupName => {
      const partsInGroup = groupedPartsMap[groupName];
      const quantity = partsInGroup.reduce((sum: number, part: any) => sum + (part.stripNo || 0), 0);
      const percentage = this.totalStrippedParts > 0 ? ((quantity / this.totalStrippedParts) * 100).toFixed(1) : '0.0';
      
      return {
        partGroup: groupName,
        partPercent: `${percentage}%`,
        dollarOfTotal: '$0.00', // Placeholder - would need pricing data
        quantity: quantity,
        dollarPerPart: '$0.00', // Placeholder - would need pricing data
        partsStripped: partsInGroup.map((p: any) => p.dcgPartNo).join(', ')
      };
    });

    // Create chart data - matching original design
    const chartData = Object.keys(groupedPartsMap).map(groupName => 
      groupedPartsMap[groupName].reduce((sum: number, part: any) => sum + (part.stripNo || 0), 0)
    );
    const chartCategories = Object.keys(groupedPartsMap);
    
    console.log('🎯 [CHART DEBUG] Chart categories:', chartCategories);
    console.log('🎯 [CHART DEBUG] Chart data:', chartData);
    
    this.chartOptions = {
      series: [{
        name: 'Parts Count',
        data: chartData
      }],
      chart: {
        type: 'column',
        height: 350,
        background: '#E3E3E3',
        toolbar: {
          show: false
        }
      },
      title: {
        text: 'Parts Count',
        align: 'center',
        style: {
          fontSize: '14px',
          fontWeight: 'bold',
          color: '#333'
        }
      },
      xaxis: {
        categories: chartCategories,
        labels: {
          style: {
            colors: '#0000FF',
            fontSize: '10px',
            fontFamily: 'Trebuchet MS'
          },
          rotate: 0
        },
        axisBorder: {
          color: '#404040'
        },
        axisTicks: {
          color: '#404040'
        }
      },
      yaxis: {
        title: {
          text: ''
        },
        labels: {
          style: {
            fontSize: '8.25px',
            fontFamily: 'Trebuchet MS'
          }
        },
        min: 0
      },
      colors: ['#428bca'],
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '10px',
          fontFamily: 'Trebuchet MS',
          colors: ['#000']
        }
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'left',
        fontSize: '8px',
        fontFamily: 'Trebuchet MS',
        fontWeight: 'bold',
        labels: {
          colors: ['#000']
        }
      },
      plotOptions: {
        bar: {
          borderRadius: 0,
          dataLabels: {
            position: 'top'
          }
        }
      },
      grid: {
        borderColor: '#404040'
      }
    };

    // Set parts location
    this.partsLocation = this.masterRowIndex ? `Unit-${this.masterRowIndex}-Location` : 'None';
  }

  // Helper method to determine if a part should be highlighted (THROW items)
  isThrowItem(keepThrow: string): boolean {
    return keepThrow?.toUpperCase() === 'THROW';
  }

  // Navigation Methods
  goBack(): void {
    this.router.navigate(['/reports']);
  }
}