import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ReportService } from 'src/app/core/services/report.service';
import { CommonService } from 'src/app/core/services/common.service';
import { AuthService } from 'src/app/modules/auth';
import { 
  StrippedPartsDetailDto,
  StrippedPartsInUnitResponse,
  StrippedPartsInUnitApiResponse,
  StrippedPartsGroupCountDto,
  StrippedPartsCostAnalysisDto,
  StrippedPartsLocationDto,
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
  strippedPartsForm: FormGroup;

  // Data properties
  strippedPartsResponse: StrippedPartsInUnitResponse | null = null;
  partsDetails: StrippedPartsDetailDto[] = [];
  groupCounts: StrippedPartsGroupCountDto[] = [];
  costAnalysis: StrippedPartsCostAnalysisDto[] = [];
  partsLocations: StrippedPartsLocationDto[] = [];
  currentStrippedPart: StrippedPartsDetailDto | null = null;
  stripPartCodes: StripPartCodeDto[] = [];
  masterRowIndex: number | null = null;

  // Chart and Summary Data
  public chartOptions: any = {
    series: [],
    chart: { type: 'column', height: 350 },
    dataLabels: { enabled: true },
    plotOptions: {
      bar: {
        columnWidth: '50%',
        dataLabels: {
          position: 'top'
        }
      }
    },
    xaxis: { categories: [] },
    yaxis: {
      title: {
        text: 'Number of Parts'
      }
    },
    colors: ['#428bca'],
    tooltip: {},
    grid: {
      borderColor: '#e7e7e7'
    },
    title: {
      text: 'Stripped Parts Count',
      align: 'center',
      style: {
        fontSize: '14px',
        fontWeight: 'bold'
      }
    }
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
  paginatedParts: StrippedPartsDetailDto[] = [];

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
    this.initializeForms();
    this.loadStripPartCodes();
    
    // Get masterRowIndex from route parameters
    this.route.params.subscribe(params => {
      if (params['masterRowIndex']) {
        this.masterRowIndex = +params['masterRowIndex'];
        this.loadStrippedPartsData(this.masterRowIndex);
      } else {
        console.warn('No masterRowIndex provided in route parameters');
        this.errorMessage = 'No unit specified. Please provide a masterRowIndex parameter in the URL (e.g., /reports/stripped-parts-inunit/12345) or select a unit from the stripped units status page.';
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeForms(): void {
    // Form for adding/editing stripped parts
    this.strippedPartsForm = this.fb.group({
      dcgPartGroup: ['', [Validators.required, Validators.maxLength(50)]],
      dcgPartNo: ['', [Validators.required, Validators.maxLength(100)]],
      partDesc: ['', [Validators.required, Validators.maxLength(255)]],
      keepThrow: ['', [Validators.required]],
      stripNo: [1, [Validators.required, Validators.min(1)]]
    });
  }

  // Load stripped parts data from API
  private loadStrippedPartsData(masterRowIndex: number): void {
    console.log('🔄 Loading stripped parts data for masterRowIndex:', masterRowIndex);
    this.isLoadingParts = true;
    this.errorMessage = '';
    this.partsErrorMessage = '';
    
    const apiCall = this.reportService.getStrippedPartsInUnit(masterRowIndex)
      .pipe(finalize(() => this.isLoadingParts = false))
      .subscribe({
        next: (response: StrippedPartsInUnitApiResponse) => {
          if (response.success && response.data) {
            console.log('✅ Stripped parts data loaded successfully:', response.data);
            this.strippedPartsResponse = response.data;
            this.partsDetails = response.data.PartsDetails || [];
            this.groupCounts = response.data.GroupCounts || [];
            this.costAnalysis = response.data.CostAnalysis || [];
            this.partsLocations = response.data.PartsLocations || [];
            
            if (!response.data.HasData) {
              this.partsErrorMessage = 'No stripped parts found for this unit.';
            } else {
              this.totalItems = this.partsDetails.length;
              this.calculateSummaryAndChart();
              this.updatePagination();
              
              // Set parts location from first location if available
              if (this.partsLocations.length > 0) {
                this.partsLocation = this.partsLocations[0].LocationDescription;
              }
            }
          } else {
            console.error('❌ Failed to load stripped parts data:', response.error || response.message);
            this.partsErrorMessage = response.error || response.message || 'Failed to load stripped parts data';
          }
        },
        error: (error) => {
          console.error('❌ Error loading stripped parts data:', error);
          this.partsErrorMessage = 'Error loading stripped parts data. Please try again.';
          this.toastr.error('Failed to load stripped parts data', 'Error');
        }
      });
    
    this.subscriptions.add(apiCall);
  }

  private loadStripPartCodes(): void {
    // For demonstration purposes, we'll use sample part codes
    this.stripPartCodes = [
      { code: 'AIR', name: 'Air Filters' },
      { code: 'OIL', name: 'Oil Components' },
      { code: 'FUEL', name: 'Fuel System' },
      { code: 'ELECTRICAL', name: 'Electrical Components' }
    ];
  }

  // Part Management Methods
  onAddStrippedPart(): void {
    this.toastr.info('Add functionality to be implemented');
  }

  onSaveStrippedPart(): void {
    this.toastr.info('Save functionality to be implemented');
  }

  // Helper method to determine if a part should be highlighted (THROW items)
  getKeepThrowOptions() {
    return KEEP_THROW_OPTIONS;
  }

  // Pagination Methods
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  // Helper methods for template
  getGroupTotal(group: any): number {
    return group.parts.reduce((sum: number, part: any) => sum + (part.stripNo || 0), 0);
  }

  getGroupName(group: any): string {
    return group.groupName.split(' - ')[0];
  }

  // Chart and Summary Calculation Methods
  private calculateSummaryAndChart(): void {
    // Use groupCounts from API if available, otherwise calculate from partsDetails
    if (this.groupCounts && this.groupCounts.length > 0) {
      // Use API data
      this.totalStrippedParts = this.groupCounts.reduce((sum, group) => sum + group.GroupCount, 0);
      this.summaryData = this.groupCounts.map(group => ({
        partGroup: group.GroupType,
        partPercent: this.totalStrippedParts > 0 ? `${((group.GroupCount / this.totalStrippedParts) * 100).toFixed(1)}%` : '0.0%',
        dollarOfTotal: `$${group.TotalValue.toFixed(2)}`,
        quantity: group.GroupCount,
        dollarPerPart: group.GroupCount > 0 ? `$${(group.TotalValue / group.GroupCount).toFixed(2)}` : '$0.00',
        partsStripped: this.getPartsInGroup(group.GroupType)
      }));

      // Create chart data from groupCounts
      const chartCategories = this.groupCounts.map(group => group.GroupType);
      const chartData = this.groupCounts.map(group => group.GroupCount);
      
      this.chartOptions = {
        ...this.chartOptions,
        series: [{
          name: 'Parts Count',
          data: chartData
        }],
        xaxis: {
          categories: chartCategories
        }
      };
      
      // Create grouped parts for display
      this.createGroupedPartsFromAPI();
    } else {
      // Fallback: calculate from partsDetails if groupCounts not available
      this.calculateFromPartsDetails();
    }
    
    console.log('📊 Chart updated with data:', this.chartOptions.series);
  }

  private createGroupedPartsFromAPI(): void {
    // Group parts by group type
    const groupedPartsMap = this.partsDetails.reduce((groups: any, part) => {
      const group = part.GroupType || 'Unknown';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(part);
      return groups;
    }, {});

    // Convert to array format for template
    this.groupedParts = Object.keys(groupedPartsMap).map(groupName => ({
      groupName: `${groupName} - ${this.getGroupDescription(groupName)}`,
      parts: groupedPartsMap[groupName]
    }));
  }

  private calculateFromPartsDetails(): void {
    this.totalStrippedParts = this.partsDetails.reduce((sum, part) => sum + (part.Quantity || 0), 0);
    
    // Group parts by group type
    const groupedPartsMap = this.partsDetails.reduce((groups: any, part) => {
      const group = part.GroupType || 'Unknown';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(part);
      return groups;
    }, {});

    // Create grouped parts for display
    this.groupedParts = Object.keys(groupedPartsMap).map(groupName => ({
      groupName: `${groupName} - ${this.getGroupDescription(groupName)}`,
      parts: groupedPartsMap[groupName]
    }));

    // Calculate summary data for each group
    this.summaryData = Object.keys(groupedPartsMap).map(groupName => {
      const partsInGroup = groupedPartsMap[groupName];
      const quantity = partsInGroup.reduce((sum: number, part: any) => sum + (part.Quantity || 0), 0);
      const totalValue = partsInGroup.reduce((sum: number, part: any) => sum + (part.TotalPrice || 0), 0);
      const percentage = this.totalStrippedParts > 0 ? ((quantity / this.totalStrippedParts) * 100).toFixed(1) : '0.0';
      
      return {
        partGroup: groupName,
        partPercent: `${percentage}%`,
        dollarOfTotal: `$${totalValue.toFixed(2)}`,
        quantity: quantity,
        dollarPerPart: quantity > 0 ? `$${(totalValue / quantity).toFixed(2)}` : '$0.00',
        partsStripped: partsInGroup.map((p: any) => p.DCGPartNo).join(', ')
      };
    });

    // Create chart data
    const chartCategories = Object.keys(groupedPartsMap);
    const chartData = Object.keys(groupedPartsMap).map(groupName => 
      groupedPartsMap[groupName].reduce((sum: number, part: any) => sum + (part.Quantity || 0), 0)
    );
    
    this.chartOptions = {
      ...this.chartOptions,
      series: [{
        name: 'Parts Count',
        data: chartData
      }],
      xaxis: {
        categories: chartCategories
      }
    };
  }

  private getGroupDescription(groupType: string): string {
    const descriptions: { [key: string]: string } = {
      'AIR': 'AIR FILTERS',
      'OIL': 'OIL COMPONENTS', 
      'FUEL': 'FUEL SYSTEM',
      'ELECTRICAL': 'ELECTRICAL COMPONENTS',
      'HYDRAULIC': 'HYDRAULIC SYSTEM',
      'COOLING': 'COOLING SYSTEM',
      'EXHAUST': 'EXHAUST SYSTEM'
    };
    return descriptions[groupType] || groupType.toUpperCase();
  }

  private getPartsInGroup(groupType: string): string {
    const partsInGroup = this.partsDetails.filter(part => part.GroupType === groupType);
    return partsInGroup.map(part => part.DCGPartNo).join(', ');
  }

  // Update pagination based on current parts data
  private updatePagination(): void {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedParts = this.partsDetails.slice(startIndex, endIndex);
  }

  onEditStrippedPart(part: StrippedPartsDetailDto): void {
    // Implementation: Open edit modal or navigate to edit form
    this.currentStrippedPart = { ...part }; // Clone the part for editing
    this.isPartsEditMode = true;
    this.isNewPart = false;
    this.toastr.info(`Edit mode for part: ${part.DCGPartNo}`, 'Edit Part');
    // Here you would typically open a modal or show an inline edit form
  }

  onDeleteStrippedPart(part: StrippedPartsDetailDto): void {
    // Implementation: Show confirmation dialog and delete
    const confirmMessage = `Are you sure you want to delete part "${part.DCGPartNo}" - ${part.Description}?`;
    
    if (confirm(confirmMessage)) {
      // Here you would call the API to delete the part
      this.isDeleting = true;
      this.toastr.warning(`Deleting part: ${part.DCGPartNo}`, 'Delete Part');
      
      // Simulate API call - replace with actual service call
      setTimeout(() => {
        // Remove from local array for now (replace with actual API integration)
        this.partsDetails = this.partsDetails.filter(p => p.DCGPartNo !== part.DCGPartNo);
        this.calculateFromPartsDetails(); // Recalculate totals
        this.isDeleting = false;
        this.toastr.success(`Part ${part.DCGPartNo} deleted successfully`, 'Deleted');
      }, 1000);
    }
  }

  // Helper method to determine if a part should be highlighted (THROW items)
  isThrowItem(partStatus: string): boolean {
    return partStatus?.toUpperCase() === 'THROW';
  }

  // Parts Location Click Handler
  onPartsLocationClick(event: Event): void {
    event.preventDefault();
    // Implementation depends on requirements - could open modal, navigate to location page, etc.
    this.toastr.info('Parts Location feature to be implemented');
  }

  // Navigation Methods
  goBack(): void {
    this.router.navigate(['/reports']);
  }
}