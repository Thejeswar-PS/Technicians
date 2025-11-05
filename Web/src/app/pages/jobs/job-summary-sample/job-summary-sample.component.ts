import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { EquipmentService } from '../../../core/services/equipment.service';
import { 
  JobSummarySampleRequest, 
  JobSummarySampleResponse, 
  JobSummarySampleState,
  JobSummarySampleUtils
} from '../../../core/model/job-summary-sample.model';

@Component({
  selector: 'app-job-summary-sample',
  template: '<div><!-- Integration Only Component --></div>'
})
export class JobSummarySampleComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Route parameters for integration
  @Input() callNbr: string = '';
  @Input() equipId: string = '';
  @Input() equipType: string = '';
  @Input() techId: string = '';
  @Input() techName: string = '';
  @Input() archive: string = '';
  @Input() year: string = '';

  // Component state
  state: JobSummarySampleState = {
    loading: false,
    error: null,
    data: null
  };

  constructor(
    private route: ActivatedRoute,
    private equipmentService: EquipmentService
  ) {}

  ngOnInit(): void {
    this.initializeFromRoute();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialize component parameters from route query params
   */
  private initializeFromRoute(): void {
    this.route.queryParams.pipe(
      takeUntil(this.destroy$)
    ).subscribe(params => {
      this.callNbr = params['callNbr'] || '';
      this.equipId = params['equipId'] || '';
      this.equipType = params['equipType'] || '';
      this.techId = params['techId'] || '';
      this.techName = params['techName'] || '';
      this.archive = params['archive'] || '';
      this.year = params['year'] || '';

      // Auto-load data if we have required parameters
      if (this.callNbr && this.equipId) {
        this.loadJobSummarySample();
      }
    });
  }

  /**
   * Load job summary sample data from backend
   * Main integration method for fetching data
   */
  loadJobSummarySample(): Promise<JobSummarySampleResponse | null> {
    return new Promise((resolve, reject) => {
      if (!this.callNbr || !this.equipId) {
        const error = 'Missing required parameters: callNbr and equipId are required';
        this.state.error = error;
        reject(new Error(error));
        return;
      }

      const request: JobSummarySampleRequest = {
        callNbr: this.callNbr,
        equipId: parseInt(this.equipId, 10),
        equipType: this.equipType,
        scheduled: 'Y' // Default to scheduled
      };

      // Validate request
      const validationErrors = JobSummarySampleUtils.validateRequest(request);
      if (validationErrors.length > 0) {
        const error = `Validation errors: ${validationErrors.join(', ')}`;
        this.state.error = error;
        reject(new Error(error));
        return;
      }

      this.state.loading = true;
      this.state.error = null;

      this.equipmentService.getJobSummarySample(request)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => this.state.loading = false)
        )
        .subscribe({
          next: (response) => {
            if (response.success && response.data) {
              this.state.data = response.data;
              resolve(response.data);
            } else {
              const error = response.message || 'Failed to load job summary sample data';
              this.state.error = error;
              reject(new Error(error));
            }
          },
          error: (error) => {
            const errorMessage = `Error loading job summary sample: ${error.message || error}`;
            this.state.error = errorMessage;
            reject(new Error(errorMessage));
          }
        });
    });
  }

  /**
   * Get current component state
   * Useful for integration to check loading status and errors
   */
  getState(): JobSummarySampleState {
    return { ...this.state };
  }

  /**
   * Get current data
   * Useful for integration to access processed data
   */
  getData(): JobSummarySampleResponse | null {
    return this.state.data;
  }

  /**
   * Set component parameters programmatically
   * Useful for integration without route parameters
   */
  setParameters(params: {
    callNbr: string;
    equipId: string;
    equipType: string;
    techId?: string;
    techName?: string;
    archive?: string;
    year?: string;
  }): void {
    this.callNbr = params.callNbr;
    this.equipId = params.equipId;
    this.equipType = params.equipType;
    this.techId = params.techId || '';
    this.techName = params.techName || '';
    this.archive = params.archive || '';
    this.year = params.year || '';
  }

  /**
   * Reset component state
   * Useful for integration to clear previous data
   */
  reset(): void {
    this.state = {
      loading: false,
      error: null,
      data: null
    };
  }

  /**
   * Check if component has valid data
   * Useful for integration to verify data availability
   */
  hasData(): boolean {
    return this.state.data !== null && !this.state.loading && !this.state.error;
  }

  /**
   * Check if component is currently loading
   * Useful for integration to show loading states
   */
  isLoading(): boolean {
    return this.state.loading;
  }

  /**
   * Get current error message if any
   * Useful for integration error handling
   */
  getError(): string | null {
    return this.state.error;
  }
}