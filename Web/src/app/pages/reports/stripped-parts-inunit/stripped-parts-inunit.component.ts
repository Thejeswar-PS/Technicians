import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
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

// Interface for unit information
interface UnitInfo {
  make: string;
  model: string;
  serialNo: string;
  kva: string;
}

@Component({
  selector: 'app-stripped-parts-inunit',
  templateUrl: './stripped-parts-inunit.component.html', // Template file path
  styleUrls: ['./stripped-parts-inunit.component.scss'],
  animations: [
    trigger('slideAnimation', [
      transition(':enter', [
        style({ height: '0', overflow: 'hidden', opacity: 0 }),
        animate('300ms ease-out', style({ height: '*', opacity: 1 }))
      ]),
      transition(':leave', [
        style({ height: '*', overflow: 'hidden', opacity: 1 }),
        animate('300ms ease-in', style({ height: '0', opacity: 0 }))
      ])
    ])
  ]
})
export class StrippedPartsInunitComponent implements OnInit, OnDestroy, AfterViewInit {

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
  unitInfo: UnitInfo | null = null;

  // Chart and Summary Data
  public chartOptions: any = {
    series: [],
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false
        }
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      },
      events: {
        dataPointSelection: (event: any, chartContext: any, config: any) => {
          if (config.dataPointIndex >= 0 && this.groupCounts[config.dataPointIndex]) {
            const item = this.groupCounts[config.dataPointIndex];
            this.onChartItemClick(item);
          }
        }
      }
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 12,
        borderRadiusApplication: 'end',
        borderRadiusWhenStacked: 'last',
        dataLabels: {
          position: 'top'
        },
        distributed: true,
        rangeBarOverlap: true,
        rangeBarGroupRows: false
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function (val: any) {
        return val;
      },
      offsetY: -20,
      style: {
        fontSize: '12px',
        fontFamily: 'inherit',
        colors: ['#304758']
      }
    },
    xaxis: {
      categories: [],
      labels: {
        rotate: -45,
        rotateAlways: false,
        hideOverlappingLabels: true,
        showDuplicates: false,
        trim: false,
        minHeight: undefined,
        maxHeight: 120,
        style: {
          colors: [],
          fontSize: '11px',
          fontFamily: 'inherit',
          fontWeight: 400,
          cssClass: 'apexcharts-xaxis-label'
        },
        offsetX: 0,
        offsetY: 0,
        format: undefined
      },
      axisBorder: {
        show: false
      },
      axisTicks: {
        show: false
      }
    },
    yaxis: {
      title: {
        text: 'Number of Parts',
        style: {
          color: '#304758',
          fontSize: '12px',
          fontFamily: 'inherit',
          fontWeight: 400
        }
      },
      labels: {
        style: {
          colors: '#304758',
          fontSize: '11px',
          fontFamily: 'inherit',
          fontWeight: 400
        }
      }
    },
    colors: ['#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0', '#546E7A', '#26a69a', '#D10CE8'],
    tooltip: {
      enabled: true,
      shared: false,
      followCursor: false,
      intersect: false,
      inverseOrder: false,
      custom: undefined,
      fillSeriesColor: false,
      theme: false,
      style: {
        fontSize: '12px',
        fontFamily: 'inherit'
      },
      onDatasetHover: {
        highlightDataSeries: false
      },
      x: {
        show: true,
        format: 'dd MMM',
        formatter: undefined
      },
      y: {
        formatter: function (val: any) {
          return val + ' parts';
        },
        title: {
          formatter: (seriesName: any) => seriesName + ': '
        }
      },
      z: {
        formatter: undefined,
        title: 'Size: '
      },
      marker: {
        show: true
      }
    },
    grid: {
      borderColor: '#e7e7e7',
      row: {
        colors: ['#f3f3f3', 'transparent'],
        opacity: 0.5
      }
    },
    title: {
      text: 'Stripped Parts Count by Category',
      align: 'center',
      style: {
        fontSize: '16px',
        fontWeight: 'bold',
        fontFamily: 'inherit',
        color: '#263238'
      }
    },
    legend: {
      show: false
    }
  };
  summaryData: any[] = [];
  totalStrippedParts: number = 0;
  partsLocation: string = '';
  groupedParts: any[] = [];

  // Chart colors - same as stripped units status
  private chartColors = [
    '#008FFB', '#00E396', '#FEB019', '#FF4560', '#775DD0',
    '#546E7A', '#26a69a', '#D10CE8', '#FF6C00', '#1E90FF',
    '#FF1493', '#32CD32', '#FFD700', '#9370DB', '#FF6347',
    '#14b8a6', '#f97316', '#a855f7', '#22c55e', '#3b82f6'
  ];

  // Loading and error states
  isLoading: boolean = false;
  isLoadingParts: boolean = false;
  isSavingPart: boolean = false;
  isUpdating: boolean = false;
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
    this.initializeForms();
    this.loadStripPartCodes();
    
    // Handle both route parameters and query parameters like legacy ASP.NET version
    this.route.params.subscribe(params => {
      if (params['masterRowIndex']) {
        // Route parameter approach: /reports/stripped-parts-inunit/3637
        this.masterRowIndex = +params['masterRowIndex'];
        this.loadStrippedPartsData(this.masterRowIndex);
      }
    });
    
    // Also check query parameters like legacy ASP.NET version
    this.route.queryParams.subscribe(params => {
      // Extract unit information from query parameters
      if (params['Make'] || params['Model'] || params['SNo'] || params['KVA']) {
        this.unitInfo = {
          make: params['Make'] || '',
          model: params['Model'] || '',
          serialNo: params['SNo'] || '',
          kva: params['KVA'] || ''
        };
      }
      
      if (params['MasterRowIndex'] && !this.masterRowIndex) {
        // Query parameter approach: /reports/stripped-parts-inunit?MasterRowIndex=3637&Make=POWERWARE...
        this.masterRowIndex = +params['MasterRowIndex'];
        this.loadStrippedPartsData(this.masterRowIndex);
      }
      
      // If no masterRowIndex found in either route or query params
      if (!this.masterRowIndex && !params['MasterRowIndex']) {
        this.errorMessage = 'No unit specified. Please provide a MasterRowIndex parameter in the URL (e.g., /reports/stripped-parts-inunit?MasterRowIndex=12345) or select a unit from the stripped units status page.';
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
    this.isLoadingParts = true;
    this.errorMessage = '';
    this.partsErrorMessage = '';
    
    const apiCall = this.reportService.getStrippedPartsInUnit(masterRowIndex)
      .pipe(finalize(() => this.isLoadingParts = false))
      .subscribe({
        next: (response: StrippedPartsInUnitApiResponse) => {
          if (response.success && response.data) {
            this.strippedPartsResponse = response.data;
            
            // Map API response properties to component properties
            this.partsDetails = response.data.partsDetails || [];
            this.groupCounts = response.data.groupCounts || [];
            this.costAnalysis = response.data.costAnalysis || [];
            this.partsLocations = response.data.partsLocations || [];
            
            if (!response.data.hasData || this.partsDetails.length === 0) {
              this.partsErrorMessage = 'No stripped parts found for this unit.';
            } else {
              this.totalItems = this.partsDetails.length;
              
              this.calculateSummaryAndChart();
              this.updatePagination();
              
              // Set parts location from first location if available
              if (this.partsLocations.length > 0) {
                this.partsLocation = this.partsLocations[0].partsLocation || this.partsLocations[0].locationDescription || '';
              }
            }
          } else {
            this.partsErrorMessage = response.error || response.message || 'Failed to load stripped parts data';
          }
        },
        error: (error) => {
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

  // Chart and Summary Calculation Methods
  private calculateSummaryAndChart(): void {
    // Use groupCounts from API if available, otherwise calculate from partsDetails
    if (this.groupCounts && this.groupCounts.length > 0) {
      // Use API data - handle both database and API property formats
      this.totalStrippedParts = this.groupCounts.reduce((sum, group) => {
        const count = group.count || group.PartsCount || group.GroupCount || 0;
        return sum + count;
      }, 0);
      
      this.summaryData = this.groupCounts.map(group => {
        const partGroup = group.dcgPartGroup || group.DCGPartGroup || group.GroupType || 'Unknown';
        const count = group.count || group.PartsCount || group.GroupCount || 0;
        return {
          partGroup: partGroup,
          partPercent: this.totalStrippedParts > 0 ? `${((count / this.totalStrippedParts) * 100).toFixed(1)}%` : '0.0%',
          dollarOfTotal: '$0.00',
          quantity: count,
          dollarPerPart: '$0.00',
          partsStripped: this.getPartsInGroup(partGroup)
        };
      });

      // Create chart data from groupCounts - handle both formats
      const chartCategories = this.groupCounts.map(group => {
        const partGroup = group.dcgPartGroup || group.DCGPartGroup || group.GroupType || 'Unknown';
        return partGroup.split(' - ')[0]; // Get the short name (e.g., 'TRX' from 'TRX - TRANSFORMERS')
      });
      const chartData = this.groupCounts.map((group, index) => {
        const count = group.count || group.PartsCount || group.GroupCount || 0;
        return {
          x: chartCategories[index],
          y: count,
          fillColor: this.chartColors[index % this.chartColors.length]
        };
      });
      
      this.chartOptions = {
        ...this.chartOptions,
        series: [{
          name: 'Parts Count',
          data: chartData
        }],
        xaxis: {
          ...this.chartOptions.xaxis,
          categories: chartCategories
        }
      };
      
      // Create grouped parts for display
      this.createGroupedPartsFromAPI();
    } else {
      // Fallback: calculate from partsDetails if groupCounts not available
      this.calculateFromPartsDetails();
    }
  }

  private createGroupedPartsFromAPI(): void {
    // Group parts by group type using both database and API property names
    const groupedPartsMap = this.partsDetails.reduce((groups: any, part) => {
      const group = part.group || part.Group || part.GroupType || 'Unknown';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(part);
      return groups;
    }, {});

    // Convert to array format for template
    this.groupedParts = Object.keys(groupedPartsMap).map(groupName => ({
      groupName: groupName,
      parts: groupedPartsMap[groupName]
    }));

    // Initialize collapse state after groupedParts is populated
    this.initializeGroupCollapseState();
  }

  private calculateFromPartsDetails(): void {
    this.totalStrippedParts = this.partsDetails.reduce((sum, part) => sum + (part.stripNo || part.Quantity || 0), 0);
    
    const groupedPartsMap = this.partsDetails.reduce((groups: any, part) => {
      const group = part.group || part.Group || part.GroupType || 'Unknown';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(part);
      return groups;
    }, {});

    this.groupedParts = Object.keys(groupedPartsMap).map(groupName => ({
      groupName: `${groupName} - ${this.getGroupDescription(groupName)}`,
      parts: groupedPartsMap[groupName]
    }));

    // Initialize collapse state after groupedParts is populated
    this.initializeGroupCollapseState();

    this.summaryData = Object.keys(groupedPartsMap).map(groupName => {
      const partsInGroup = groupedPartsMap[groupName];
      const quantity = partsInGroup.reduce((sum: number, part: any) => sum + (part.stripNo || part.Quantity || 0), 0);
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
    // Use correct property names from both database and API response formats
    const partsInGroup = this.partsDetails.filter(part => {
      const partGroup = part.group || part.Group || part.GroupType || '';
      return partGroup === groupType;
    });
    return partsInGroup.map(part => {
      return part.dcgPartNo || part.DCGPartNo || '';
    }).join(', ');
  }

  // Update pagination based on current parts data
  private updatePagination(): void {
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    
    this.paginatedParts = this.partsDetails.slice(startIndex, endIndex);
  }

  // Inline editing properties and methods
  private editingParts = new Set<StrippedPartsDetailDto>();
  private originalPartData = new Map<StrippedPartsDetailDto, StrippedPartsDetailDto>();

  // Check if a specific part is being edited
  isEditingPart(part: StrippedPartsDetailDto): boolean {
    return this.editingParts.has(part);
  }

  // Start editing a specific part
  startEditingPart(part: StrippedPartsDetailDto): void {
    // Store original data for potential cancellation
    this.originalPartData.set(part, { ...part });
    this.editingParts.add(part);
  }

  // Save part update - calls SaveUpdateStrippedPartsInUnit API
  savePartUpdate(part: StrippedPartsDetailDto): void {
    // Validate required fields
    if (!part.dcgPartNo?.trim() || !part.partDesc?.trim()) {
      this.toastr.error('DCG Part No and Description are required', 'Validation Error');
      return;
    }

    // Call API to save update
    this.isUpdating = true;
    
    // Make actual API call to SaveUpdateStrippedPartsInUnit
    const dto = {
      masterRowIndex: this.masterRowIndex || undefined,
      dcgPartNo: part.dcgPartNo,
      partDesc: part.partDesc,
      stripNo: part.stripNo,
      keepThrow: part.keepThrow
    };
    
    const updateSubscription = this.reportService.saveUpdateStrippedPartsInUnit(dto)
      .pipe(finalize(() => this.isUpdating = false))
      .subscribe({
        next: (response: StrippedPartsInUnitApiResponse) => {
          if (response.success) {
            this.editingParts.delete(part);
            this.originalPartData.delete(part);
            this.toastr.success(`Part ${part.dcgPartNo} updated successfully`, 'Update Successful');
            
            // Refresh the data
            this.calculateFromPartsDetails();
          } else {
            this.toastr.error(response.error || 'Failed to update part', 'Update Failed');
          }
        },
        error: (error: any) => {
          console.error('Error updating part:', error);
          this.toastr.error('Error updating part. Please try again.', 'Update Failed');
        }
      });
    
    this.subscriptions.add(updateSubscription);
  }

  // Cancel editing and restore original data
  cancelEditingPart(part: StrippedPartsDetailDto): void {
    const originalData = this.originalPartData.get(part);
    if (originalData) {
      // Restore original values
      Object.assign(part, originalData);
      this.originalPartData.delete(part);
    }
    this.editingParts.delete(part);
  }

  // Delete confirmation and API call - calls DeleteStrippedPartsInUnit API
  deletePartConfirm(part: StrippedPartsDetailDto): void {
    const confirmMessage = `Are you sure you want to delete part "${part.dcgPartNo}" - ${part.partDesc}?`;
    
    if (confirm(confirmMessage)) {
      this.isDeleting = true;
      
      // Make actual API call to DeleteStrippedPartInUnit
      // Note: Need to determine rowIndex - using part's index in array for now
      const partIndex = this.partsDetails.findIndex(p => p.dcgPartNo === part.dcgPartNo);
      
      const deleteSubscription = this.reportService.deleteStrippedPartInUnit(this.masterRowIndex || 0, partIndex)
        .pipe(finalize(() => this.isDeleting = false))
        .subscribe({
          next: (response: StrippedPartsInUnitApiResponse) => {
            if (response.success) {
              // Remove from local arrays
              this.partsDetails = this.partsDetails.filter((p: StrippedPartsDetailDto) => 
                p.dcgPartNo !== part.dcgPartNo || p.DCGPartNo !== part.dcgPartNo
              );
              
              // Update grouped parts
              this.groupedParts = this.groupedParts.map(group => ({
                ...group,
                parts: group.parts.filter((p: StrippedPartsDetailDto) => 
                  p.dcgPartNo !== part.dcgPartNo || p.DCGPartNo !== part.dcgPartNo
                )
              })).filter(group => group.parts.length > 0);
              
              this.calculateFromPartsDetails(); // Recalculate totals
              this.toastr.success(`Part ${part.dcgPartNo} deleted successfully`, 'Deleted');
            } else {
              this.toastr.error(response.error || 'Failed to delete part', 'Delete Failed');
            }
          },
          error: (error: any) => {
            console.error('Error deleting part:', error);
            this.toastr.error('Error deleting part. Please try again.', 'Delete Failed');
          }
        });
      
      this.subscriptions.add(deleteSubscription);
    }
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
    return partStatus?.trim().toUpperCase() === 'THROW';
  }

  // Chart interaction handler
  onChartItemClick(item: StrippedPartsGroupCountDto): void {
    // Scroll to the specific group section
    const groupName = item.dcgPartGroup || item.DCGPartGroup || item.GroupType || 'Unknown';
    const element = document.querySelector(`[data-group="${groupName}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Optional: Show a toast message
    this.toastr.info(`Showing ${item.count || item.PartsCount || item.GroupCount || 0} parts in ${groupName}`, 'Group Selected');
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

  // Group collapse state tracking
  groupCollapseState: { [key: number]: boolean } = {};

  // Initialize collapse state when grouped parts are loaded
  private initializeGroupCollapseState(): void {
    if (this.groupedParts && this.groupedParts.length > 0) {
      this.groupedParts.forEach((group, index) => {
        if (this.groupCollapseState[index] === undefined) {
          this.groupCollapseState[index] = true; // Start expanded
        }
      });
    }
  }

  // Expand/Collapse Group Functionality
  ngAfterViewInit(): void {
    // Initialize all groups as expanded
    this.initializeGroupCollapseState();
  }

  // Toggle group collapse state
  toggleGroupCollapse(groupIndex: number): void {
    // Ensure state is initialized first
    if (this.groupCollapseState[groupIndex] === undefined) {
      this.groupCollapseState[groupIndex] = true;
    }
    
    // Toggle the state
    const currentState = this.groupCollapseState[groupIndex];
    this.groupCollapseState[groupIndex] = !currentState;
    
    // Force change detection by creating a new object reference
    this.groupCollapseState = { ...this.groupCollapseState };
  }

  // Check if group is expanded
  isGroupExpanded(groupIndex: number): boolean {
    // Default to true (expanded) if not initialized
    return this.groupCollapseState[groupIndex] !== false;
  }
}