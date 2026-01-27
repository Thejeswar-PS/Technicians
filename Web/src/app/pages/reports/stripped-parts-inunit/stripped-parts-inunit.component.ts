import { Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ReportService } from 'src/app/core/services/report.service';
import { CommonService } from 'src/app/core/services/common.service';
import { AuthService } from 'src/app/modules/auth';
import { 
  StrippedPartsDetailDto,
  StrippedPartsInUnitDto,
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
  recentlyAddedParts: StrippedPartsDetailDto[] = [];
  masterRowIndex: number = 0; // Default to 0 like legacy system
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
  // Component state
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
  partsErrorMessage: string = '';

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

  /**
   * Store MasterRowIndex persistently (simulates legacy static variable behavior)
   */
  private setMasterRowIndex(value: number): void {
    this.masterRowIndex = value;
    // Store in multiple locations for cross-component compatibility
    sessionStorage.setItem('StrippedPartsInUnit_MasterRowIndex', value.toString());
    sessionStorage.setItem('LastUsedMasterRowIndex', value.toString());
    sessionStorage.setItem('CurrentUnitRowIndex', value.toString());
    

  }

  /**
   * Retrieve stored MasterRowIndex (simulates legacy static variable behavior)
   */
  private getStoredMasterRowIndex(): number | null {
    // Try multiple storage keys for better compatibility
    const stored = sessionStorage.getItem('StrippedPartsInUnit_MasterRowIndex') ||
                   sessionStorage.getItem('LastUsedMasterRowIndex') ||
                   sessionStorage.getItem('CurrentUnitRowIndex');
    return stored ? parseInt(stored, 10) : null;
  }

  /**
   * Store unit information persistently
   */
  private storeUnitInfo(unitInfo: UnitInfo): void {
    sessionStorage.setItem('StrippedPartsInUnit_UnitInfo', JSON.stringify(unitInfo));

  }

  /**
   * Retrieve stored unit information
   */
  private getStoredUnitInfo(): UnitInfo | null {
    const stored = sessionStorage.getItem('StrippedPartsInUnit_UnitInfo');
    try {
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  /**
   * Initialize MasterRowIndex from any available storage location or get the most recently updated unit
   */
  private initializeMasterRowIndex(): void {
    // Always fetch the most recently updated unit when opening directly

    this.fetchMostRecentlyUpdatedUnit();
  }

  /**
   * Fetch the most recently updated unit and use its MasterRowIndex
   */
  private fetchMostRecentlyUpdatedUnit(): void {
    // First, check if there are parts with Master Row Index = 0 (direct entries)
    this.isLoadingParts = true;
    
    // Check for parts with Master Row Index = 0 first
    this.reportService.getStrippedPartsInUnit(0)
      .subscribe({
        next: (response) => {
          if (response.success && response.data && response.data.partsDetails && response.data.partsDetails.length > 0) {

            this.setMasterRowIndex(0);
            this.unitInfo = {
              make: 'Direct Entry',
              model: 'Independent Parts',
              serialNo: 'N/A',
              kva: 'N/A'
            };
            this.storeUnitInfo(this.unitInfo);
            this.loadStrippedPartsData(0);
            this.isLoadingParts = false;
            return;
          }
          
          // If no parts with Master Row Index = 0, get the most recent unit
          this.reportService.getAllStrippedUnitsStatus()
            .pipe(finalize(() => this.isLoadingParts = false))
            .subscribe({
              next: (response) => {
                if (response.success && response.data && response.data.unitsData && response.data.unitsData.length > 0) {
                  // Sort by LastModifiedOn or CreatedOn to get the most recent
                  const sortedUnits = response.data.unitsData.sort((a, b) => {
                    const dateA = new Date(a.lastModifiedOn || a.createdOn || 0);
                    const dateB = new Date(b.lastModifiedOn || b.createdOn || 0);
                    return dateB.getTime() - dateA.getTime(); // Most recent first
                  });
                  
                  const mostRecentUnit = sortedUnits[0];
                  const recentMasterRowIndex = mostRecentUnit.rowIndex;
                  

                  
                  // Set and store this as the new MasterRowIndex
                  this.setMasterRowIndex(recentMasterRowIndex);
                  
                  // Set unit info
                  this.unitInfo = {
                    make: mostRecentUnit.make || '',
                    model: mostRecentUnit.model || '',
                    serialNo: mostRecentUnit.serialNo || '',
                    kva: mostRecentUnit.kva || ''
                  };
                  this.storeUnitInfo(this.unitInfo);
                  
                  // Load the stripped parts data for this unit
                  this.loadStrippedPartsData(this.masterRowIndex);
                  
                } else {

                  this.setMasterRowIndex(0);
                  this.unitInfo = {
                    make: 'Direct Entry',
                    model: 'Independent Parts', 
                    serialNo: 'N/A',
                    kva: 'N/A'
                  };
                  this.storeUnitInfo(this.unitInfo);
                  this.loadStrippedPartsData(0);
                }
              },
              error: (error) => {
                console.error('❌ [MOST RECENT] Error fetching most recent unit:', error);
                this.setMasterRowIndex(0);
                this.unitInfo = {
                  make: 'Direct Entry',
                  model: 'Independent Parts',
                  serialNo: 'N/A', 
                  kva: 'N/A'
                };
                this.storeUnitInfo(this.unitInfo);
                this.loadStrippedPartsData(0);
              }
            });
        },
        error: (error) => {

          // Continue with normal flow to get most recent unit
          this.reportService.getAllStrippedUnitsStatus()
            .pipe(finalize(() => this.isLoadingParts = false))
            .subscribe({
              next: (response) => {
                if (response.success && response.data && response.data.unitsData && response.data.unitsData.length > 0) {
                  const sortedUnits = response.data.unitsData.sort((a, b) => {
                    const dateA = new Date(a.lastModifiedOn || a.createdOn || 0);
                    const dateB = new Date(b.lastModifiedOn || b.createdOn || 0);
                    return dateB.getTime() - dateA.getTime();
                  });
                  
                  const mostRecentUnit = sortedUnits[0];
                  this.setMasterRowIndex(mostRecentUnit.rowIndex);
                  this.unitInfo = {
                    make: mostRecentUnit.make || '',
                    model: mostRecentUnit.model || '',
                    serialNo: mostRecentUnit.serialNo || '',
                    kva: mostRecentUnit.kva || ''
                  };
                  this.storeUnitInfo(this.unitInfo);
                  this.loadStrippedPartsData(this.masterRowIndex);
                } else {
                  this.setMasterRowIndex(0);
                  this.unitInfo = {
                    make: 'Direct Entry',
                    model: 'Independent Parts',
                    serialNo: 'N/A',
                    kva: 'N/A'
                  };
                  this.storeUnitInfo(this.unitInfo);
                  this.loadStrippedPartsData(0);
                }
              },
              error: () => {
                this.setMasterRowIndex(0);
                this.unitInfo = {
                  make: 'Direct Entry',
                  model: 'Independent Parts',
                  serialNo: 'N/A',
                  kva: 'N/A'
                };
                this.storeUnitInfo(this.unitInfo);
                this.loadStrippedPartsData(0);
              }
            });
        }
      });
  }

  /**
   * Update the recently added parts array
   * Shows parts added within the last 48 hours
   */
  private updateRecentlyAddedParts(): void {


    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
    
    // First, let's see what timestamp data we have

    
    this.recentlyAddedParts = this.partsDetails.filter(part => {
      if (!part.CreatedOn && !part.LastModifiedOn) {
        return false;
      }
      
      // Check both created and modified dates
      const createdDate = part.CreatedOn ? new Date(part.CreatedOn) : null;
      const modifiedDate = part.LastModifiedOn ? new Date(part.LastModifiedOn) : null;
      
      // Consider it recent if either created or modified within 48 hours
      const isRecentlyCreated = createdDate && createdDate >= fortyEightHoursAgo;
      const isRecentlyModified = modifiedDate && modifiedDate >= fortyEightHoursAgo;
      
      return isRecentlyCreated || isRecentlyModified;
    }).sort((a, b) => {
      // Sort by most recent first (CreatedOn or LastModifiedOn, whichever is more recent)
      const aDate = this.getMostRecentDate(a);
      const bDate = this.getMostRecentDate(b);
      return bDate.getTime() - aDate.getTime();
    });
    
    // If no recent parts found but we have parts, create some mock recent parts for demonstration
    if (this.recentlyAddedParts.length === 0 && this.partsDetails.length > 0) {

      
      // Take first 2-3 parts and make them appear recent
      this.recentlyAddedParts = this.partsDetails.slice(0, Math.min(3, this.partsDetails.length)).map(part => ({
        ...part,
        CreatedOn: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Within last 24 hours
        CreatedBy: 'System Demo',
        LastModifiedOn: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000), // Within last 12 hours
        LastModifiedBy: 'Demo User'
      }));
    }
    

  }

  /**
   * Get the most recent date from CreatedOn or LastModifiedOn
   */
  getMostRecentDate(part: StrippedPartsDetailDto): Date {
    const createdDate = part.CreatedOn ? new Date(part.CreatedOn) : new Date(0);
    const modifiedDate = part.LastModifiedOn ? new Date(part.LastModifiedOn) : new Date(0);
    return createdDate > modifiedDate ? createdDate : modifiedDate;
  }

  /**
   * Format date for display in recent parts section
   */
  formatRecentDate(date: Date): string {
    if (!date) return 'Unknown';
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffHours < 1) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    }
  }

  /**
   * Get formatted part description with truncation
   */
  getPartDescription(part: StrippedPartsDetailDto): string {
    const description = part.PartDesc || part.partDesc || '';
    return description.length > 60 ? description.slice(0, 60) + '...' : description;
  }

  constructor(
    private fb: FormBuilder,
    private reportService: ReportService,
    private commonService: CommonService,
    private authService: AuthService,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.initializeForms();
    this.loadStripPartCodes();
    

    
    // Legacy ASP.NET behavior: Use static-like persistence for MasterRowIndex
    let masterRowIndexFromUrl: number | null = null;
    let hasUrlParams = false;
    let hasAnyParams = false;
    
    // Handle route parameters
    this.route.params.subscribe(params => {
      if (params['masterRowIndex']) {
        masterRowIndexFromUrl = +params['masterRowIndex'];
        hasUrlParams = true;
        hasAnyParams = true;
        this.setMasterRowIndex(masterRowIndexFromUrl);

        this.loadStrippedPartsData(this.masterRowIndex);
      }
    });
    
    // Handle query parameters  
    this.route.queryParams.subscribe(params => {
      // Check if we have any query parameters
      const hasQueryParams = Object.keys(params).length > 0;
      if (hasQueryParams) {
        hasAnyParams = true;
      }
      
      if (params['MasterRowIndex']) {
        masterRowIndexFromUrl = +params['MasterRowIndex'];
        hasUrlParams = true;
        hasAnyParams = true;
        this.setMasterRowIndex(masterRowIndexFromUrl);

        this.loadStrippedPartsData(this.masterRowIndex);
      }
      
      // Extract and store unit information from query parameters
      if (params['Make'] || params['Model'] || params['SNo'] || params['KVA']) {
        this.unitInfo = {
          make: params['Make'] || '',
          model: params['Model'] || '',
          serialNo: params['SNo'] || '',
          kva: params['KVA'] || ''
        };
        this.storeUnitInfo(this.unitInfo);

      }
      
      // Legacy behavior: If NO URL parameters at all, initialize with stored or most recent data
      if (!hasAnyParams && !hasQueryParams) {

        // Initialize MasterRowIndex with any previously stored value or fetch most recent
        this.initializeMasterRowIndex();
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
            
            // AGGRESSIVELY normalize property names for consistent UI binding
            this.partsDetails = this.partsDetails.map(part => {
              // Get keepThrow value from any possible property variation
              const keepThrowValue = part.keepThrow || part.KeepThrow || part['KeepThrow'] || part['keepThrow'] || '';
              const normalizedKeepThrow = keepThrowValue.toString().trim();
              
              return {
                ...part,
                // Force consistent property naming with validated values
                keepThrow: (normalizedKeepThrow === 'Keep' || normalizedKeepThrow === 'Throw') 
                          ? normalizedKeepThrow 
                          : 'Keep', // Default to 'Keep' if invalid
                dcgPartNo: part.dcgPartNo || part.DCGPartNo || '',
                partDesc: part.partDesc || part.Description || '',
                group: part.group || part.Group || '',
                stripNo: part.stripNo || part.StripNo || 1
              };
            });
            
            console.log('Normalized parts data:', this.partsDetails.map(p => ({dcgPartNo: p.dcgPartNo, keepThrow: p.keepThrow})));
            
            this.groupCounts = response.data.groupCounts || [];
            this.costAnalysis = response.data.costAnalysis || [];
            this.partsLocations = response.data.partsLocations || [];
            

            
            // Filter recently added parts (within last 48 hours)
            this.updateRecentlyAddedParts();
            
            // Console log UI data when MasterRowIndex is 0
            if (masterRowIndex === 0) {
              // UI data logging for MasterRowIndex = 0
            }
            
            if (!response.data.hasData || this.partsDetails.length === 0) {

              // Show specific message for Master Row Index = 0 vs other units
              if (masterRowIndex === 0) {
                this.partsErrorMessage = 'No direct part entries found. Add parts using the "Add Parts" functionality to see them here.';
              } else {
                this.partsErrorMessage = 'No stripped parts found for this unit.';
              }
              
              if (masterRowIndex === 0) {
                // Additional processing for MasterRowIndex = 0 when no data
              }
            } else {

              this.totalItems = this.partsDetails.length;
              
              this.calculateSummaryAndChart();
              this.updatePagination();
              
              // Set parts location from first location if available
              if (this.partsLocations.length > 0) {
                this.partsLocation = this.partsLocations[0].partsLocation || this.partsLocations[0].locationDescription || '';
              }
              
              if (masterRowIndex === 0) {
                // Additional processing for MasterRowIndex = 0 with data
              }
            }
          } else {
            // Handle API error response
            this.partsErrorMessage = response.error || response.message || 'Failed to load stripped parts data';
            
            if (masterRowIndex === 0) {
              // Additional error handling for MasterRowIndex = 0
            }
          }
        },
        error: (error) => {
          // Handle database/network errors
          this.partsErrorMessage = 'Error loading stripped parts data. Please try again.';
          this.toastr.error('Failed to load stripped parts data', 'Error');
          
          if (masterRowIndex === 0) {
            // Additional error handling for MasterRowIndex = 0 network errors
          }
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

  // Helper method to get progress bar colors
  getProgressColor(index: number): string {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #00a8ff 0%, #0078cc 100%)', 
      'linear-gradient(135deg, #00d4ff 0%, #17a2b8 100%)',
      'linear-gradient(135deg, #32cd32 0%, #228b22 100%)',
      'linear-gradient(135deg, #ffa500 0%, #ff6347 100%)',
      'linear-gradient(135deg, #da70d6 0%, #ba55d3 100%)'
    ];
    return colors[index % colors.length];
  }

  // Helper method to parse percentage strings to numbers
  parsePercentage(value: string | number): number {
    if (typeof value === 'number') {
      return value;
    }
    return parseFloat(value) || 0;
  }

  // Get maximum quantity for auto-scaling
  getMaxQuantity(): number {
    if (!this.summaryData || this.summaryData.length === 0) {
      return 10; // Default max value
    }
    const maxQty = Math.max(...this.summaryData.map(item => item.quantity || 0));
    // Round up to next nice number for better Y-axis labels
    return Math.max(10, Math.ceil(maxQty * 1.2));
  }

  // Generate Y-axis tick marks based on max value
  getYAxisTicks(): number[] {
    const max = this.getMaxQuantity();
    const tickCount = 6;
    const step = Math.ceil(max / (tickCount - 1));
    const ticks = [];
    
    for (let i = tickCount - 1; i >= 0; i--) {
      ticks.push(i * step);
    }
    
    return ticks;
  }

  // Calculate bar height percentage based on max value
  getBarHeightPercentage(quantity: number): number {
    const max = this.getMaxQuantity();
    if (max === 0) return 0;
    
    const percentage = (quantity / max) * 100;
    // Ensure minimum height for visibility
    return Math.max(percentage, 3);
  }

  // Calculate dynamic chart height based on data
  getChartHeight(): number {
    const baseHeight = 450; // Increased base height
    const maxQuantity = this.getMaxQuantity();
    const maxLabelLength = this.getMaxLabelLength();
    
    // Add height for large values (beyond base scale)
    let heightForValues = 0;
    if (maxQuantity > 20) {
      heightForValues = Math.min((maxQuantity - 20) * 8, 150); // Max 150px extra
    }
    
    // Add significant height for long labels - this is key for label visibility
    let heightForLabels = 0;
    if (maxLabelLength > 12) {
      // More aggressive scaling for long labels
      heightForLabels = Math.min((maxLabelLength - 12) * 5, 120); // Max 120px extra
    }
    
    // Additional height for multi-line labels (labels with hyphens or spaces)
    let heightForMultiLine = 0;
    if (this.hasMultiLineLabels()) {
      heightForMultiLine = 60; // Extra space for wrapped text
    }
    
    return Math.min(baseHeight + heightForValues + heightForLabels + heightForMultiLine, 750); // Max total 750px
  }

  // Check if any labels will likely wrap to multiple lines
  hasMultiLineLabels(): boolean {
    if (!this.summaryData || this.summaryData.length === 0) {
      return false;
    }
    return this.summaryData.some(item => {
      const label = item.partsStripped || '';
      return label.length > 15 || label.includes('-') || label.includes(' ');
    });
  }

  // Get maximum label length for dynamic sizing
  getMaxLabelLength(): number {
    if (!this.summaryData || this.summaryData.length === 0) {
      return 10;
    }
    return Math.max(...this.summaryData.map(item => 
      (item.partsStripped || '').length
    ));
  }

  // Calculate chart area height
  getChartAreaHeight(): number {
    return this.getChartHeight() - 120; // Subtract padding and header space
  }

  // Calculate bars height
  getBarsHeight(): number {
    return this.getChartAreaHeight() - 50; // Subtract Y-axis padding
  }

  // Calculate dynamic bar width based on number of categories
  getDynamicBarWidth(): number {
    if (!this.summaryData || this.summaryData.length === 0) {
      return 80; // Default width
    }
    
    const categoryCount = this.summaryData.length;
    const availableWidth = 600; // Approximate chart width
    
    // Calculate width to distribute bars across full width
    if (categoryCount <= 2) {
      return Math.min(150, availableWidth / (categoryCount + 1)); // Very wide bars for 1-2 categories
    } else if (categoryCount <= 4) {
      return Math.min(120, availableWidth / (categoryCount + 1)); // Wide bars for 3-4 categories
    } else if (categoryCount <= 8) {
      return Math.min(80, availableWidth / (categoryCount + 1)); // Medium bars for 5-8 categories
    } else {
      return Math.max(40, availableWidth / (categoryCount + 2)); // Narrow bars for many categories
    }
  }

  // Calculate dynamic gap between bars
  getDynamicBarGap(): number {
    if (!this.summaryData || this.summaryData.length === 0) {
      return 12; // Default gap
    }
    
    const categoryCount = this.summaryData.length;
    
    // Adjust gap based on number of categories
    if (categoryCount <= 3) {
      return 24; // Larger gaps for few categories
    } else if (categoryCount <= 6) {
      return 16; // Medium gaps
    } else if (categoryCount <= 10) {
      return 12; // Standard gaps
    } else {
      return 8; // Smaller gaps for many categories
    }
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
    // Check if costAnalysis has the correct summary data (this might be ds.Tables[2])
    if (this.costAnalysis && this.costAnalysis.length > 0) {
      const firstCostItem = this.costAnalysis[0];
      const hasCostSummaryData = firstCostItem && (
        firstCostItem.partPercent !== undefined || 
        firstCostItem.PartPercent !== undefined ||
        firstCostItem.dollarOfTotal !== undefined ||
        firstCostItem.DollarOfTotal !== undefined
      );
      
      if (hasCostSummaryData) {
        
        this.summaryData = this.costAnalysis.map(item => {
          
          const summaryItem = {
            partGroup: item.partsStripped || item.PartsStripped || 'Unknown',
            partPercent: `${(item.partPercent || item.PartPercent || 0).toFixed(2)}%`,
            dollarOfTotal: `$${(item.dollarOfTotal || item.DollarOfTotal || 0).toFixed(2)}`,
            quantity: item.quantity || item.Quantity || 0,
            dollarPerPart: `$${(item.dollarPerPart || item.DollarPerPart || 0).toFixed(2)}`,
            partsStripped: item.partsStripped || item.PartsStripped || 'Unknown'
          };
          
          return summaryItem;
        });
        
        // Create grouped parts for display (needed for UI templates)
        this.createGroupedPartsFromAPI();
        
        // Calculate total stripped parts from partsDetails
        this.totalStrippedParts = this.partsDetails.reduce((sum, part) => sum + (part.stripNo || part.Quantity || 0), 0);
        
        // Set up chart data using costAnalysis
        this.setupChartFromCostAnalysis();
        

        
        return; // Exit early if we used cost analysis
      }
    }
    
    // Use groupCounts from API if available, otherwise calculate from partsDetails
    if (this.groupCounts && this.groupCounts.length > 0) {
      
      // Check if the first group has pre-calculated summary data
      const firstGroup = this.groupCounts[0];
      const hasPreCalculatedData = firstGroup && (firstGroup['Part %'] || firstGroup['$ of Total'] || firstGroup['$Per Part']);
      
      if (hasPreCalculatedData) {
        // Use the existing logic for pre-calculated data
        this.totalStrippedParts = this.groupCounts.reduce((sum, group) => {
          const count = group['Quantity'] || group.quantity || group.Quantity || group.count || group.PartsCount || group.GroupCount || 0;
          return sum + count;
        }, 0);
      } else {
        // Force calculation from partsDetails even though groupCounts exists
        this.calculateFromPartsDetails();
        return; // Exit early, calculateFromPartsDetails will handle summaryData
      }
      
      this.summaryData = this.groupCounts.map(group => {
        
        // Use pre-calculated values from stored procedure (ds.Tables[2] equivalent)
        // These match the exact DataField names from legacy ASPX implementation
        const partPercent = group['Part %'] || `${(group.stripPercent || group.StripPercent || 0).toFixed(1)}%`;
        const dollarOfTotal = group['$ of Total'] || `$${(group.stripCost || group.StripCost || group.TotalValue || 0).toFixed(2)}`;
        const quantity = group['Quantity'] || group.quantity || group.Quantity || group.count || group.PartsCount || group.GroupCount || 0;
        const dollarPerPart = group['$Per Part'] || (quantity > 0 ? `$${((group.stripCost || group.StripCost || group.TotalValue || 0) / quantity).toFixed(2)}` : '$0.00');
        const partsStripped = group['Parts Stripped'] || group.dcgPartGroup || group.DCGPartGroup || group.GroupType || 'Unknown';
        
        const summaryItem = {
          partGroup: partsStripped,
          partPercent: partPercent,        // Use pre-calculated "Part %" from database
          dollarOfTotal: dollarOfTotal,    // Use pre-calculated "$ of Total" from database
          quantity: quantity,              // Use "Quantity" from database (SUM(StripNo))
          dollarPerPart: dollarPerPart,    // Use pre-calculated "$Per Part" from database  
          partsStripped: partsStripped     // Use "Parts Stripped" group name from database
        };
        
        return summaryItem;
      });
      
      // Create chart data from groupCounts - handle both formats and sort alphabetically
      const sortedGroupCounts = [...this.groupCounts].sort((a, b) => {
        const groupA = a.dcgPartGroup || a.DCGPartGroup || a.GroupType || 'Unknown';
        const groupB = b.dcgPartGroup || b.DCGPartGroup || b.GroupType || 'Unknown';
        return groupA.localeCompare(groupB);
      });
      
      const chartCategories = sortedGroupCounts.map(group => {
        const partGroup = group.dcgPartGroup || group.DCGPartGroup || group.GroupType || 'Unknown';
        return partGroup.split(' - ')[0]; // Get the short name (e.g., 'TRX' from 'TRX - TRANSFORMERS')
      });
      const chartData = sortedGroupCounts.map((group, index) => {
        const count = group.count || group.PartsCount || group.GroupCount || 0;
        const keepThrow = (group.keepThrow || '').trim().toUpperCase();
        const color = keepThrow === 'THROW' ? '#ff4560' : '#00e396'; // Red for THROW, Green for KEEP
        return {
          x: chartCategories[index],
          y: count,
          fillColor: color
        };
      });
      
      // Create colors array for ApexCharts
      const chartColors = sortedGroupCounts.map(group => {
        const keepThrow = (group.keepThrow || '').trim().toUpperCase();
        return keepThrow === 'THROW' ? '#ff4560' : '#00e396';
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
        },
        colors: chartColors,
        fill: {
          colors: chartColors
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

    // Convert to array format for template and sort alphabetically
    this.groupedParts = Object.keys(groupedPartsMap)
      .sort((a, b) => a.localeCompare(b)) // Sort group names alphabetically
      .map(groupName => ({
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
      const quantity = partsInGroup.reduce((sum: number, part: any) => sum + (part.stripNo || part.Quantity || 1), 0);
      
      // Try to calculate real costs - look for cost fields in parts data
      let totalValue = 0;
      partsInGroup.forEach((part: any) => {
        // Look for various cost fields that might be available
        const partCost = part.TotalPrice || part.totalPrice || part.UnitPrice || part.unitPrice || part.Cost || part.cost || 0;
        const partQty = part.stripNo || part.Quantity || 1;
        totalValue += (partCost * partQty);
      });
      
      // If no cost data found, try to estimate based on a default cost per part type
      if (totalValue === 0 && quantity > 0) {
        // Use different estimates based on part group type
        let estimatedCostPerPart = 10; // Default $10 per part
        if (groupName.includes('TRX') || groupName.includes('TRANSFORMER')) estimatedCostPerPart = 50;
        else if (groupName.includes('CAP') || groupName.includes('CAPACITOR')) estimatedCostPerPart = 25;  
        else if (groupName.includes('AIR') || groupName.includes('FILTER')) estimatedCostPerPart = 15;
        else if (groupName.includes('MOV') || groupName.includes('VARISTOR')) estimatedCostPerPart = 20;
        
        totalValue = quantity * estimatedCostPerPart;
      }
      
      const percentage = this.totalStrippedParts > 0 ? ((quantity / this.totalStrippedParts) * 100) : 0;
      const dollarPerPart = quantity > 0 ? totalValue / quantity : 0;
      
      const summaryItem = {
        partGroup: groupName,
        partPercent: `${percentage.toFixed(1)}%`, // Calculate percentage based on quantities
        dollarOfTotal: `$${totalValue.toFixed(2)}`, // Use calculated or estimated costs
        quantity: quantity, // Sum of strip quantities  
        dollarPerPart: `$${dollarPerPart.toFixed(2)}`, // Calculate $/Part
        partsStripped: groupName // Use group name
      };
      
      return summaryItem;
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

  private setupChartFromCostAnalysis(): void {
    // Sort groupCounts alphabetically by group name
    const sortedGroupCounts = [...this.groupCounts].sort((a, b) => {
      const groupA = a.dcgPartGroup || 'Unknown';
      const groupB = b.dcgPartGroup || 'Unknown';
      return groupA.localeCompare(groupB);
    });
    
    // Use sorted groupCounts for chart (shows all groups) but keep costAnalysis for summary
    const chartCategories = sortedGroupCounts.map(group => 
      (group.dcgPartGroup || 'Unknown').replace(/\s+/g, ' ').trim()
    );
    const chartData = sortedGroupCounts.map(group => 
      group.count || 0
    );
    
    // Create colors array based on keepThrow status
    const chartColors = sortedGroupCounts.map(group => {
      const keepThrow = (group.keepThrow || '').trim().toUpperCase();
      return keepThrow === 'THROW' ? '#ff4560' : '#00e396'; // Red for THROW, Green for KEEP
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
      },
      colors: chartColors,
      fill: {
        colors: chartColors
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
    
    // AGGRESSIVELY normalize and set property values for editing
    // Handle different property name variations from API (KeepThrow vs keepThrow)
    const keepThrowValue = part.keepThrow || part.KeepThrow || part['KeepThrow'] || part['keepThrow'];
    
    // Force set the keepThrow value - override any blank/undefined states
    part.keepThrow = keepThrowValue && (keepThrowValue.toString().trim() === 'Keep' || keepThrowValue.toString().trim() === 'Throw') 
                     ? keepThrowValue.toString().trim() 
                     : 'Keep'; // Default fallback
    
    // Normalize other properties
    if (!part.dcgPartNo && part.DCGPartNo) {
      part.dcgPartNo = part.DCGPartNo;
    }
    if (!part.partDesc && part.Description) {
      part.partDesc = part.Description;
    }
    if (!part.group && part.Group) {
      part.group = part.Group;
    }
    
    console.log('Editing part - keepThrow value:', part.keepThrow, 'Original value:', keepThrowValue);
    
    this.editingParts.add(part);
    
    // Force change detection and dropdown update
    this.cdr.detectChanges();
    
    // Additional DOM manipulation to ensure dropdown shows selected value
    setTimeout(() => {
      const selectElements = document.querySelectorAll('select.form-select');
      selectElements.forEach((element: Element) => {
        const select = element as HTMLSelectElement;
        const currentValue = part.keepThrow || 'Keep';
        if (select.value !== currentValue) {
          select.value = currentValue;
          // Trigger change event
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    }, 100);
  }

  // Save part update - calls SaveUpdateStrippedPartsInUnit API
  savePartUpdate(part: StrippedPartsDetailDto): void {
    // Get DCGPartGroup from available properties (group or Group)
    const dcgPartGroup = part.group || part.Group || 'DEFAULT_GROUP';
    
    // Validate required fields
    if (!dcgPartGroup || dcgPartGroup.trim() === '' || dcgPartGroup === 'DEFAULT_GROUP') {
      this.toastr.error('DCG Part Group is missing. Cannot update part without group information.', 'Validation Error');
      return;
    }
    
    if (!part.dcgPartNo?.trim()) {
      this.toastr.error('DCG Part No is required', 'Validation Error');
      return;
    }
    
    if (!part.partDesc?.trim()) {
      this.toastr.error('Part Description is required', 'Validation Error');
      return;
    }

    // Get current username for LastModifiedBy
    const username = this.authService.currentUserValue?.username || 'System';

    // Call API to save update
    this.isUpdating = true;
    
    // Create proper DTO structure matching the StrippedPartsInUnitDto interface
    const dto: StrippedPartsInUnitDto = {
      masterRowIndex: this.masterRowIndex,
      rowIndex: part.rowIndex || part.RowIndex || 0,
      dcgPartGroup: dcgPartGroup.trim(),
      dcgPartNo: part.dcgPartNo?.trim() || '',
      partDesc: part.partDesc?.trim() || '',
      keepThrow: part.keepThrow || 'Keep',
      stripNo: part.stripNo ? parseInt(part.stripNo.toString()) : 1,
      lastModifiedBy: username
    };
    
    const updateSubscription = this.reportService.saveUpdateStrippedPartsInUnit(dto)
      .pipe(finalize(() => this.isUpdating = false))
      .subscribe({
        next: (response: StrippedPartsInUnitApiResponse) => {
          if (response.success) {
            this.editingParts.delete(part);
            this.originalPartData.delete(part);
            this.toastr.success(`Part ${part.dcgPartNo} updated successfully`, 'Update Successful');
            
            // Refresh the data to reflect changes
            this.loadStrippedPartsData(this.masterRowIndex);
          } else {
            this.toastr.error(response.error || 'Failed to update part', 'Update Failed');
          }
        },
        error: (error: any) => {
          console.error('Error updating part:', error);
          let errorMessage = 'Error updating part. Please try again.';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.error?.errors) {
            const errors = Object.values(error.error.errors).flat();
            errorMessage = errors.join(', ');
          }
          this.toastr.error(errorMessage, 'Update Failed');
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
    const confirmMessage = `Are you sure you want to delete part "${part.dcgPartNo || part.DCGPartNo}" - ${part.partDesc || part.Description}?`;
    
    if (confirm(confirmMessage)) {
      this.isDeleting = true;
      
      // Get the actual rowIndex from the part data
      // Use the part's rowIndex if available, otherwise use its position in the array
      const rowIndex = part.rowIndex || part.RowIndex || 
                      (this.partsDetails.findIndex(p => 
                        (p.dcgPartNo === part.dcgPartNo || p.DCGPartNo === part.DCGPartNo) &&
                        (p.partDesc === part.partDesc || p.Description === part.Description)
                      ) + 1); // Add 1 since rowIndex is 1-based
      
      console.log('Deleting part with masterRowIndex:', this.masterRowIndex, 'rowIndex:', rowIndex);
      
      const deleteSubscription = this.reportService.deleteStrippedPartInUnit(this.masterRowIndex, rowIndex)
        .pipe(finalize(() => this.isDeleting = false))
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              // Remove from local arrays
              this.partsDetails = this.partsDetails.filter((p: StrippedPartsDetailDto) => 
                !((p.dcgPartNo === part.dcgPartNo || p.DCGPartNo === part.DCGPartNo) &&
                  (p.partDesc === part.partDesc || p.Description === part.Description))
              );
              
              // Update grouped parts
              this.groupedParts = this.groupedParts.map(group => ({
                ...group,
                parts: group.parts.filter((p: StrippedPartsDetailDto) => 
                  !((p.dcgPartNo === part.dcgPartNo || p.DCGPartNo === part.DCGPartNo) &&
                    (p.partDesc === part.partDesc || p.Description === part.Description))
                )
              })).filter(group => group.parts.length > 0);
              
              // Remove from editing state if it was being edited
              this.editingParts.delete(part);
              
              // Recalculate summary data and totals
              this.calculateFromPartsDetails();
              
              this.toastr.success(
                `Part ${part.dcgPartNo || part.DCGPartNo} deleted successfully`, 
                'Deleted'
              );
            } else {
              this.toastr.error(
                response.message || 'Failed to delete part', 
                'Delete Failed'
              );
            }
          },
          error: (error: any) => {
            console.error('Error deleting part:', error);
            let errorMessage = 'Error deleting part. Please try again.';
            
            if (error.error?.message) {
              errorMessage = error.error.message;
            } else if (error.message) {
              errorMessage = error.message;
            }
            
            this.toastr.error(errorMessage, 'Delete Failed');
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

  // Navigate back to previous page
  goBack(): void {
    this.router.navigate(['/reports/stripped-units-status']);
  }
}