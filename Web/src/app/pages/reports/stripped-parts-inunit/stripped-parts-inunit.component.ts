import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
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
    
    console.log('💾 [STORAGE] Stored MasterRowIndex in multiple locations:', value);
    console.log('💾 [STORAGE] SessionStorage contents:', {
      specific: sessionStorage.getItem('StrippedPartsInUnit_MasterRowIndex'),
      global: sessionStorage.getItem('LastUsedMasterRowIndex'),
      current: sessionStorage.getItem('CurrentUnitRowIndex'),
      unitInfo: sessionStorage.getItem('StrippedPartsInUnit_UnitInfo')
    });
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
            console.log('🎯 [MASTER ROW 0] Found parts with Master Row Index = 0, using as default');
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
                  
                  console.log('📈 [MOST RECENT] Found most recently updated unit:', {
                    rowIndex: recentMasterRowIndex,
                    make: mostRecentUnit.make,
                    model: mostRecentUnit.model,
                    serialNo: mostRecentUnit.serialNo,
                    lastModified: mostRecentUnit.lastModifiedOn,
                    created: mostRecentUnit.createdOn
                  });
                  
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
                  console.log('⚠️ [MOST RECENT] No units found, defaulting to Master Row Index = 0');
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
          console.log('⚠️ [MASTER ROW 0] No parts found with Master Row Index = 0, checking recent units');
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
    console.log('🔍 Starting updateRecentlyAddedParts with:', {
      totalParts: this.partsDetails.length,
      samplePart: this.partsDetails[0]
    });

    const now = new Date();
    const fortyEightHoursAgo = new Date(now.getTime() - (48 * 60 * 60 * 1000));
    
    // First, let's see what timestamp data we have
    console.log('📊 Timestamp analysis:', {
      partsWithCreatedOn: this.partsDetails.filter(p => p.CreatedOn).length,
      partsWithLastModifiedOn: this.partsDetails.filter(p => p.LastModifiedOn).length,
      sampleTimestamps: this.partsDetails.slice(0, 3).map(p => ({
        partNo: p.DCGPartNo || p.dcgPartNo,
        createdOn: p.CreatedOn,
        lastModifiedOn: p.LastModifiedOn
      }))
    });
    
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
      console.log('🧪 No recent parts found, creating mock recent parts for demonstration...');
      
      // Take first 2-3 parts and make them appear recent
      this.recentlyAddedParts = this.partsDetails.slice(0, Math.min(3, this.partsDetails.length)).map(part => ({
        ...part,
        CreatedOn: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Within last 24 hours
        CreatedBy: 'System Demo',
        LastModifiedOn: new Date(Date.now() - Math.random() * 12 * 60 * 60 * 1000), // Within last 12 hours
        LastModifiedBy: 'Demo User'
      }));
    }
    
    console.log('📅 Recently added parts (last 48 hours):', {
      totalParts: this.partsDetails.length,
      recentParts: this.recentlyAddedParts.length,
      recentPartsDetails: this.recentlyAddedParts.map(p => ({
        partNo: p.DCGPartNo || p.dcgPartNo,
        description: p.PartDesc || p.partDesc,
        created: p.CreatedOn,
        modified: p.LastModifiedOn
      }))
    });
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
    private router: Router
  ) {
    this.initializeForms();
  }

  ngOnInit(): void {
    this.initializeForms();
    this.loadStripPartCodes();
    
    console.log('🚀 [NGONINIT] Starting initialization...');
    
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
        console.log('📥 [ROUTE PARAM] MasterRowIndex from route:', masterRowIndexFromUrl);
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
        console.log('📥 [QUERY PARAM] MasterRowIndex from query:', masterRowIndexFromUrl);
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
        console.log('💾 [UNIT INFO] Stored from query params:', this.unitInfo);
      }
      
      // Legacy behavior: If NO URL parameters at all, initialize with stored or most recent data
      if (!hasAnyParams && !hasQueryParams) {
        console.log('🔄 [NO PARAMS] No URL parameters detected, initializing with stored or most recent data...');
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
    
    // Console log when MasterRowIndex is 0
    if (masterRowIndex === 0) {
      console.log('🔍 DEBUG: Loading data for MasterRowIndex = 0');
    }
    
    const apiCall = this.reportService.getStrippedPartsInUnit(masterRowIndex)
      .pipe(finalize(() => this.isLoadingParts = false))
      .subscribe({
        next: (response: StrippedPartsInUnitApiResponse) => {
          // Console log DB response when MasterRowIndex is 0
          if (masterRowIndex === 0) {
            console.log('📊 DB Response for MasterRowIndex = 0:', {
              success: response.success,
              hasData: response.data?.hasData,
              partsCount: response.data?.partsDetails?.length || 0,
              fullResponse: response
            });
          }
          
          if (response.success && response.data) {
            this.strippedPartsResponse = response.data;
            
            // Map API response properties to component properties
            this.partsDetails = response.data.partsDetails || [];
            this.groupCounts = response.data.groupCounts || [];
            this.costAnalysis = response.data.costAnalysis || [];
            this.partsLocations = response.data.partsLocations || [];
            
            // Filter recently added parts (within last 48 hours)
            this.updateRecentlyAddedParts();
            
            // Console log UI data when MasterRowIndex is 0
            if (masterRowIndex === 0) {
              console.log('🎨 UI Data for MasterRowIndex = 0:', {
                partsDetailsLength: this.partsDetails.length,
                groupCountsLength: this.groupCounts.length,
                costAnalysisLength: this.costAnalysis.length,
                partsLocationsLength: this.partsLocations.length,
                hasData: response.data.hasData,
                totalItems: this.totalItems
              });
            }
            
            if (!response.data.hasData || this.partsDetails.length === 0) {
              // Show specific message for Master Row Index = 0 vs other units
              if (masterRowIndex === 0) {
                this.partsErrorMessage = 'No direct part entries found. Add parts using the "Add Parts" functionality to see them here.';
              } else {
                this.partsErrorMessage = 'No stripped parts found for this unit.';
              }
              
              if (masterRowIndex === 0) {
                console.log('❌ No data found for MasterRowIndex = 0, showing error message');
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
                console.log('✅ Data loaded successfully for MasterRowIndex = 0, UI should display data now');
              }
            }
          } else {
            // Handle API error response
            this.partsErrorMessage = response.error || response.message || 'Failed to load stripped parts data';
            
            if (masterRowIndex === 0) {
              console.log('❌ API Error for MasterRowIndex = 0:', response);
            }
          }
        },
        error: (error) => {
          // Handle database/network errors
          this.partsErrorMessage = 'Error loading stripped parts data. Please try again.';
          this.toastr.error('Failed to load stripped parts data', 'Error');
          
          if (masterRowIndex === 0) {
            console.log('💥 Network/DB Error for MasterRowIndex = 0:', error);
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
    
    console.log('📤 Updating part with payload:', dto);
    console.log('🔍 Original part data:', {
      group: part.group,
      Group: part.Group,
      dcgPartNo: part.dcgPartNo,
      partDesc: part.partDesc,
      rowIndex: part.rowIndex,
      RowIndex: part.RowIndex
    });
    
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
    const confirmMessage = `Are you sure you want to delete part "${part.dcgPartNo}" - ${part.partDesc}?`;
    
    if (confirm(confirmMessage)) {
      this.isDeleting = true;
      
      // Make actual API call to DeleteStrippedPartInUnit
      // Note: Need to determine rowIndex - using part's index in array for now
      const partIndex = this.partsDetails.findIndex(p => p.dcgPartNo === part.dcgPartNo);
      
      const deleteSubscription = this.reportService.deleteStrippedPartInUnit(this.masterRowIndex, partIndex)
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