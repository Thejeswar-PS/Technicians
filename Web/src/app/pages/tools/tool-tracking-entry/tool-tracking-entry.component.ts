import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToolTrackingService } from 'src/app/core/services/tool-tracking.service';
import { TechToolsTrackingDto, TechsInfoDto, ToolTrackingApiResponse, ToolTrackingCountApiResponse, ToolsTrackingTechsDto, EquipmentFileDto, SaveEquipmentFileRequestDto, ToolsCalendarTrackingDto, ToolsCalendarTrackingApiResponse } from 'src/app/core/model/tool-tracking.model';
import { AuthHelper } from 'src/app/core/utils/auth-helper';

@Component({
  selector: 'app-tool-tracking-entry',
  templateUrl: './tool-tracking-entry.component.html',
  styleUrls: ['./tool-tracking-entry.component.scss']
})
export class ToolTrackingEntryComponent implements OnInit {
  readonly pageSizeOptions: number[] = [10, 25, 50, 100];
  techId: string = '';
  selectedTech: string = 'All';
  technicians: ToolsTrackingTechsDto[] = [];
  trackingData: TechToolsTrackingDto[] = [];
  calendarDrillDownEntries: ToolsCalendarTrackingDto[] = [];
  techInfo: TechsInfoDto | null = null;
  toolsCount: number = 0;
  showCount: boolean = false;
  loading: boolean = false;
  loadingDrillDown: boolean = false;
  loadingCount: boolean = false;
  loadingTechnicians: boolean = false;
  error: string = '';
  successMessage: string = '';
  isSaving: boolean = false;
  modifiedRows = new Set<number>();
  selectedBucket: string = '';
  trackingCurrentPage: number = 1;
  trackingPageSize: number = 25;
  drillDownCurrentPage: number = 1;
  drillDownPageSize: number = 25;
  drillDownFilters = {
    toolName: 'All',
    serialNo: 'All',
    techFilter: '0',
    startDate: '',
    endDate: ''
  };
  
  // File attachment properties - BLOB storage like legacy
  equipmentFiles: EquipmentFileDto[] = [];
  selectedFiles: File[] = [];
  uploadingFiles: boolean = false;
  
  // Role-based filtering
  private userContext: { userEmpID?: string; windowsID?: string } = {};
  
  constructor(
    private toolTrackingService: ToolTrackingService, 
    private router: Router, 
    private route: ActivatedRoute,
    private authHelper: AuthHelper
  ) {}

  ngOnInit(): void {
    // Get user context for role-based filtering
    this.userContext = this.authHelper.getUserContext();
    
    this.loadTechnicians();
    
    // Check for TechID query parameter from calendar navigation
    this.route.queryParams.subscribe(params => {
      const techID = params['TechID'];
      const bucket = params['bucket'];

      this.selectedBucket = bucket || '';
      this.drillDownFilters = {
        toolName: params['toolName'] || 'All',
        serialNo: params['serialNo'] || 'All',
        techFilter: params['techFilter'] || techID || '0',
        startDate: params['startDate'] || '',
        endDate: params['endDate'] || ''
      };

      if (techID) {
        // Pre-select the technician from calendar navigation
        this.selectedTech = techID;
        this.techId = techID;
        // Load tools automatically after technicians are loaded
        setTimeout(() => {
          this.autoLoadTools();
        }, 500);
      }

      if (bucket) {
        this.loadCalendarDrillDown();
      } else {
        this.calendarDrillDownEntries = [];
      }
    });
  }

  loadTechnicians(): void {
    this.loadingTechnicians = true;
    // Pass user context for role-based filtering
    this.toolTrackingService.getToolsTrackingTechs(this.userContext.userEmpID, this.userContext.windowsID).subscribe({
      next: (response) => {
        this.loadingTechnicians = false;
        if (response.success) {
          this.technicians = response.data;
          
          // Auto-select if technicians list is filtered to single user (technician role)
          if (response.isFiltered && this.technicians.length === 1) {
            this.selectedTech = this.technicians[0].techID;
            this.techId = this.technicians[0].techID;
            // Auto-load tools for single technician
            setTimeout(() => {
              this.autoLoadTools();
            }, 300);
          }
        } else {
          console.error('Failed to load technicians:', response.message);
        }
      },
      error: (err) => {
        this.loadingTechnicians = false;
        if (err.status === 403) {
          this.error = 'Access denied: You do not have permission to view this data.';
        } else {
          console.error('Error loading technicians:', err);
        }
      }
    });
  }

  onTechnicianChange(selectedTechId: string): void {
    this.clearCalendarDrillDown();
    this.resetTrackingPagination();

    // Clear existing data when technician changes
    this.trackingData = [];
    this.techInfo = null;
    this.toolsCount = 0;
    this.showCount = false;
    this.error = '';
    
    // If a valid technician is selected (not 'All'), automatically load their tools
    if (selectedTechId && selectedTechId !== 'All') {
      this.techId = selectedTechId;
      this.autoLoadTools();
    }
  }

  autoLoadTools(): void {
    this.loading = true;
    this.error = '';

    // Pass user context for role-based filtering
    this.toolTrackingService.getTechToolsTracking(this.selectedTech, this.userContext.userEmpID, this.userContext.windowsID).subscribe({
      next: (response: ToolTrackingApiResponse) => {
        this.loading = false;
        if (response.success) {
          this.trackingData = response.data;
          this.resetTrackingPagination();
          // Automatically load count and files as well
          this.loadToolsCount();
          this.loadToolsTrackingFiles();
        } else {
          this.error = response.message || 'Failed to retrieve data';
        }
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 403) {
          this.error = 'Access denied: You can only access your own tech tools data.';
        } else {
          this.error = err.error?.message || 'An error occurred while fetching data';
        }
        console.error('Error fetching tool tracking data:', err);
      }
    });
  }

  onSearch(): void {
    this.clearCalendarDrillDown();
    this.resetTrackingPagination();

    if (this.selectedTech === 'All' || !this.selectedTech) {
      this.error = 'Please select a technician';
      return;
    }

    this.techId = this.selectedTech;
    this.loading = true;
    this.error = '';
    this.trackingData = [];
    this.techInfo = null;
    this.toolsCount = 0;
    this.showCount = false;

    // Pass user context for role-based filtering
    this.toolTrackingService.getTechToolsTracking(this.selectedTech, this.userContext.userEmpID, this.userContext.windowsID).subscribe({
      next: (response: ToolTrackingApiResponse) => {
        this.loading = false;
        if (response.success) {
          this.trackingData = response.data;
          this.resetTrackingPagination();
          // Load count and files after successful tracking data retrieval
          this.loadToolsCount();
          this.loadToolsTrackingFiles();
        } else {
          this.error = response.message || 'Failed to retrieve data';
        }
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 403) {
          this.error = 'Access denied: You can only access your own tech tools data.';
        } else {
          this.error = err.error?.message || 'An error occurred while fetching data';
        }
        console.error('Error fetching tool tracking data:', err);
      }
    });
  }

  loadToolsCount(): void {
    if (!this.techId.trim()) return;

    this.loadingCount = true;
    
    // Pass user context for role-based filtering
    this.toolTrackingService.getToolsTrackingCount(this.techId.trim(), this.userContext.userEmpID, this.userContext.windowsID).subscribe({
      next: (response: ToolTrackingCountApiResponse) => {
        this.loadingCount = false;
        if (response.success) {
          this.toolsCount = response.count;
          this.showCount = true;
        }
      },
      error: (err) => {
        this.loadingCount = false;
        console.error('Error fetching tools tracking count:', err);
        // Don't show error for count, just log it
      }
    });
  }

  onGetCount(): void {
    if (this.selectedTech === 'All' || !this.selectedTech) {
      this.error = 'Please select a technician';
      return;
    }

    this.techId = this.selectedTech;
    this.loadToolsCount();
  }

  onClear(): void {
    this.clearCalendarDrillDown();
    this.resetTrackingPagination();
    this.techId = '';
    this.selectedTech = 'All';
    this.trackingData = [];
    this.techInfo = null;
    this.toolsCount = 0;
    this.showCount = false;
    this.error = '';
  }

  getSelectedTechName(): string {
    if (this.selectedTech === 'All' || !this.selectedTech) {
      return 'All Technicians';
    }
    
    const selectedTechnician = this.technicians.find(tech => tech.techID === this.selectedTech);
    return selectedTechnician ? `${selectedTechnician.techname} (${selectedTechnician.techID})` : this.selectedTech;
  }

  loadCalendarDrillDown(): void {
    this.loadingDrillDown = true;
    this.error = '';

    this.toolTrackingService.getToolsCalendarTracking(
      this.drillDownFilters.startDate || undefined,
      this.drillDownFilters.endDate || undefined,
      this.drillDownFilters.toolName,
      this.drillDownFilters.serialNo,
      this.drillDownFilters.techFilter,
      this.selectedBucket,
      this.userContext.userEmpID,
      this.userContext.windowsID
    ).subscribe({
      next: (response: ToolsCalendarTrackingApiResponse) => {
        this.loadingDrillDown = false;
        if (response.success) {
          this.calendarDrillDownEntries = response.data?.trackingData || [];
          this.resetDrillDownPagination();
        } else {
          this.calendarDrillDownEntries = [];
          this.error = response.message || 'Failed to load drill-down entries';
        }
      },
      error: (err) => {
        this.loadingDrillDown = false;
        this.calendarDrillDownEntries = [];
        if (err.status === 403) {
          this.error = 'Access denied: You can only access allowed drill-down entries.';
        } else {
          this.error = err.error?.message || 'An error occurred while loading drill-down entries';
        }
        console.error('Error loading calendar drill-down entries:', err);
      }
    });
  }

  openDrillDownEntry(entry: ToolsCalendarTrackingDto): void {
    this.selectedTech = entry.techID;
    this.techId = entry.techID;
    this.autoLoadTools();
  }

  getDrillDownTitle(): string {
    return this.getBucketLabel(this.selectedBucket);
  }

  getBucketLabel(bucket: string): string {
    switch ((bucket || '').toLowerCase()) {
      case 'overdue':
        return 'Overdue';
      case 'due15':
        return 'Due in 15 Days';
      case 'due30':
        return 'Due in 30 Days';
      case 'due45':
        return 'Due in 45 Days';
      case 'due60':
        return 'Due in 60 Days';
      default:
        return 'Drill-down';
    }
  }

  getDrillDownBadgeClass(): string {
    switch ((this.selectedBucket || '').toLowerCase()) {
      case 'overdue':
        return 'bg-danger';
      case 'due15':
        return 'bg-warning text-dark';
      case 'due30':
        return 'bg-primary';
      case 'due45':
        return 'bg-success';
      case 'due60':
        return 'bg-info text-dark';
      default:
        return 'bg-secondary';
    }
  }

  clearCalendarDrillDown(): void {
    this.selectedBucket = '';
    this.calendarDrillDownEntries = [];
    this.resetDrillDownPagination();
  }

  formatDrillDownFilters(): string[] {
    const filters: string[] = [];

    if (this.drillDownFilters.toolName && this.drillDownFilters.toolName !== 'All') {
      filters.push(`Tool: ${this.drillDownFilters.toolName}`);
    }

    if (this.drillDownFilters.serialNo && this.drillDownFilters.serialNo !== 'All') {
      filters.push(`Serial: ${this.drillDownFilters.serialNo}`);
    }

    if (this.drillDownFilters.techFilter && this.drillDownFilters.techFilter !== '0') {
      filters.push(`Tech: ${this.drillDownFilters.techFilter}`);
    }

    return filters;
  }

  onSave(): void {
    if (this.modifiedRows.size === 0) {
      alert('No changes to save');
      return;
    }

    if (!this.techId || this.techId === 'All') {
      this.error = 'Please select a technician';
      return;
    }

    this.isSaving = true;
    this.error = '';

    // Backend save uses a legacy DELETE-INSERT pattern, so we must send the
    // full technician dataset. Sending only modified rows deletes the rest.
    const toolTrackingItems = this.trackingData.map(item => ({
      techID: item.techID,
      toolName: item.toolName,
      serialNo: item.serialNo,
      dueDt: item.dueDt,
      columnOrder: item.columnOrder,
      status: item.status,
      createdDate: item.createdDate,
      modifiedDate: item.modifiedDate,
      notes: item.notes,
      received: item.received,
      newMTracking: item.newMTracking,
      oldMSerialNo: item.oldMSerialNo,
      oldMTracking: item.oldMTracking
    }));

    // Get the current user (you may need to adjust this based on your auth service)
    const modifiedBy = this.authHelper.getCurrentUserDisplayName() || localStorage.getItem('currentUser') || 'System';

    const saveRequest = {
      techID: this.techId,
      modifiedBy: modifiedBy,
      toolTrackingItems
    };

    console.log('Saving full tool tracking data set:', saveRequest);

    // Pass user context for role-based filtering
    this.toolTrackingService.saveTechToolsTracking(saveRequest, this.userContext.userEmpID, this.userContext.windowsID).subscribe({
      next: (response) => {
        this.isSaving = false;
        if (response.success) {
          this.modifiedRows.clear();
          this.successMessage = `Successfully saved ${response.data.recordsProcessed} tool records`;
          
          // Reload the data to verify it was saved
          setTimeout(() => {
            this.successMessage = '';
            this.autoLoadTools();
          }, 1500);
        } else {
          this.error = response.data.message || 'Failed to save tool tracking data';
        }
      },
      error: (err) => {
        this.isSaving = false;
        if (err.status === 403) {
          this.error = 'Access denied: You can only modify your own tech tools data.';
        } else {
          this.error = err.error?.message || 'An error occurred while saving data';
        }
        console.error('Error saving tool tracking data:', err);
      }
    });
  }

  // Simple methods for editable grid functionality
  toggleEdit(index: number): void {
    // Store original values before editing
    if (!this.trackingData[index].isEditing) {
      this.trackingData[index].originalValues = { ...this.trackingData[index] };
    }
    this.trackingData[index].isEditing = !this.trackingData[index].isEditing;
  }

  saveRow(index: number): void {
    this.trackingData[index].isEditing = false;
    // Mark this row as modified for bulk save
    this.modifiedRows.add(index);
    // Remove original values since we're tracking this for save
    this.trackingData[index].originalValues = undefined;
    console.log('Row marked for saving:', this.trackingData[index]);
    console.log('Total modified rows:', this.modifiedRows.size);
  }

  cancelEdit(index: number): void {
    // Reset to original values if they exist
    if (this.trackingData[index].originalValues) {
      const originalData = this.trackingData[index].originalValues!;
      this.trackingData[index] = { 
        ...originalData,
        isEditing: false,
        originalValues: undefined
      };
    } else {
      this.trackingData[index].isEditing = false;
    }
  }

  // File attachment methods - Database BLOB storage (matching legacy)
  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      this.selectedFiles = Array.from(files);
      console.log('Files selected:', this.selectedFiles.length);
    }
  }

  loadToolsTrackingFiles(): void {
    if (!this.techId || this.techId === 'All') {
      return;
    }
    
    // Load files from file system storage - Pass user context for role-based filtering
    this.toolTrackingService.getToolsTrackingFiles(this.techId, this.userContext.userEmpID, this.userContext.windowsID).subscribe({
      next: (response) => {
        if (response.success) {
          this.equipmentFiles = response.data.map(file => ({
            tecID: this.techId,
            fileName: file.fileName,
            fileSizeKB: file.fileSizeKB,
            uploadedOn: file.uploadedOn,
            filePath: file.filePath
          } as any));
          console.log('Tools tracking files loaded:', this.equipmentFiles.length);
        } else {
          console.error('Failed to load files:', response.message);
        }
      },
      error: (err) => {
        if (err.status === 403) {
          console.warn('Access denied: Cannot view files for this technician.');
        } else {
          console.error('Error loading files:', err);
        }
      }
    });
  }

  downloadFile(file: any): void {
    // Download file from file system storage - Pass user context for role-based filtering
    this.toolTrackingService.downloadToolsTrackingFile(this.techId, file.fileName, this.userContext.userEmpID, this.userContext.windowsID).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      error: (err) => {
        if (err.status === 403) {
          this.error = 'Access denied: You do not have permission to download this file.';
        } else {
          console.error('File download error:', err);
          this.error = 'Failed to download file';
        }
      }
    });
  }

  viewFile(file: any): void {
    // View file from file system storage - Pass user context for role-based filtering
    this.toolTrackingService.downloadToolsTrackingFile(this.techId, file.fileName, this.userContext.userEmpID, this.userContext.windowsID).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Clean up URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: (err) => {
        if (err.status === 403) {
          this.error = 'Access denied: You do not have permission to view this file.';
        } else {
          console.error('File view error:', err);
          this.error = 'Failed to view file';
        }
      }
    });
  }

  deleteFileAttachment(fileName: string): void {
    if (confirm(`Are you sure you want to delete "${fileName}"?`)) {
      // Pass user context for role-based filtering
      this.toolTrackingService.deleteToolsTrackingFile(this.techId, fileName, this.userContext.userEmpID, this.userContext.windowsID).subscribe({
        next: (response) => {
          if (response.success) {
            this.successMessage = `File "${fileName}" deleted successfully`;
            // Reload files list
            this.loadToolsTrackingFiles();
            setTimeout(() => {
              this.successMessage = '';
            }, 2000);
          } else {
            this.error = response.message || 'Failed to delete file';
          }
        },
        error: (err) => {
          if (err.status === 403) {
            this.error = 'Access denied: You do not have permission to delete this file.';
          } else {
            console.error('File delete error:', err);
            this.error = 'Failed to delete file';
          }
        }
      });
    }
  }

  async uploadFiles(): Promise<void> {
    if (!this.techId || this.techId === 'All') {
      this.error = 'Please select a technician first';
      return;
    }

    if (this.selectedFiles.length === 0) {
      this.error = 'Please select files to upload';
      return;
    }

    this.uploadingFiles = true;
    this.error = '';
    let successCount = 0;
    let failedCount = 0;

    for (const file of this.selectedFiles) {
      try {
        await this.uploadSingleFile(file);
        successCount++;
      } catch (error) {
        failedCount++;
        console.error(`Failed to upload ${file.name}:`, error);
      }
    }

    this.uploadingFiles = false;

    if (successCount > 0) {
      this.successMessage = `Successfully uploaded ${successCount} file(s)`;
      this.selectedFiles = [];
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }

      // Reload files list
      this.loadToolsTrackingFiles();
      
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    }

    if (failedCount > 0) {
      this.error = `Failed to upload ${failedCount} file(s)`;
    }
  }

  private async uploadSingleFile(file: File): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Pass user context for role-based filtering
      this.toolTrackingService.uploadToolsTrackingFile(this.techId, file, this.userContext.userEmpID, this.userContext.windowsID).subscribe({
        next: (response) => {
          if (response.success) {
            console.log('File uploaded successfully:', file.name);
            resolve();
          } else {
            reject(new Error(response.data.message || 'Upload failed'));
          }
        },
        error: (err) => {
          console.error('File upload error:', err);
          if (err.status === 403) {
            reject(new Error('Access denied: You do not have permission to upload files for this technician.'));
          } else {
            reject(err);
          }
        }
      });
    });
  }

  removeFile(index: number): void {
    if (confirm('Are you sure you want to remove this file from upload?')) {
      this.selectedFiles.splice(index, 1);
    }
  }

  getFileExtension(filename: string): string {
    return filename.substring(filename.lastIndexOf('.') + 1);
  }

  updateReceived(item: TechToolsTrackingDto, event: any, index: number): void {
    // Convert checkbox boolean to string as expected by backend
    const isChecked = event.target.checked;
    item.received = isChecked ? 'true' : 'false';
    
    // Track this row as modified
    this.modifiedRows.add(index);
    
    // Ensure the value is properly set for immediate UI update
    if (isChecked) {
      item.received = 'true';
    } else {
      item.received = 'false';
    }
  }

  // Helper methods for the new modern design
  isReceivedTrue(received: any): boolean {
    if (received == null || received === undefined) return false;
    
    // Handle different possible true values (case-insensitive for strings)
    const normalizedValue = typeof received === 'string' ? received.toLowerCase() : received;
    return normalizedValue === 'true' || normalizedValue === true || normalizedValue === 1 || normalizedValue === '1';
  }

  getReceivedCount(): number {
    if (!this.trackingData) return 0;
    return this.trackingData.filter(item => this.isReceivedTrue(item.received)).length;
  }

  getPendingCount(): number {
    if (!this.trackingData) return 0;
    return this.trackingData.filter(item => !this.isReceivedTrue(item.received)).length;
  }

  isDueDateOverdue(dueDate: any): boolean {
    if (!dueDate) return false;
    const today = new Date();
    const due = new Date(dueDate);
    return due < today;
  }

  formatDate(date: any): string {
    if (!date) return 'No Date Set';
    const dateObj = new Date(date);
    return dateObj.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  formatDateForInput(date: any): string {
    if (!date) return '';
    
    const dateObj = new Date(date);
    
    // Check if date is invalid
    if (isNaN(dateObj.getTime())) return '';
    
    // Check if date is from 1900 or earlier (commonly used as "empty" dates in databases)
    if (dateObj.getFullYear() <= 1900) return '';
    
    return dateObj.toISOString().split('T')[0];
  }

  startEditing(item: TechToolsTrackingDto, index: number): void {
    // Store original values for cancel functionality
    item.originalValues = { ...item };
    item.isEditing = true;
  }

  saveEditing(item: TechToolsTrackingDto, index: number): void {
    // Here you would typically call an API to save the changes
    item.isEditing = false;
    delete item.originalValues;
    console.log('Saving tool data:', item);
  }

  cancelEditing(item: TechToolsTrackingDto): void {
    if (item.originalValues) {
      // Restore original values
      Object.assign(item, item.originalValues);
      delete item.originalValues;
    }
    item.isEditing = false;
  }

  onDelete(item: TechToolsTrackingDto, index: number): void {
    if (confirm(`Are you sure you want to delete the tool "${item.toolName}"?`)) {
      this.trackingData.splice(index, 1);
      console.log('Tool deleted:', item);
    }
  }

  // Additional helper methods for the legacy UI
  formatTableDate(dateValue: string | Date): string {
    if (!dateValue) return '';
    
    try {
      const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
      if (isNaN(date.getTime())) return dateValue.toString();
      
      // Format as MM/dd/yyyy to match legacy display
      return date.toLocaleDateString('en-US');
    } catch (error) {
      return dateValue.toString();
    }
  }

  trackByFn(index: number, item: TechToolsTrackingDto): any {
    return index; // Use stable index to prevent re-rendering during edits
  }

  // New methods for the redesigned UI
  goBack(): void {
    this.router.navigate(['/tools']); // Navigate back to tools listing or appropriate page
  }

  getFilterBadgeClass(): string {
    if (this.trackingData.length === 0) {
      return 'badge-light-secondary';
    } else if (this.trackingData.length <= 5) {
      return 'badge-light-success';
    } else if (this.trackingData.length <= 10) {
      return 'badge-light-warning';
    } else {
      return 'badge-light-primary';
    }
  }

  toggleEditItem(item: TechToolsTrackingDto): void {
    if (item.isEditing) {
      this.saveItemEdit(item);
    } else {
      this.startItemEdit(item);
    }
  }

  startItemEdit(item: TechToolsTrackingDto): void {
    // Store original values for cancel functionality
    item.originalValues = { ...item };
    item.isEditing = true;
  }

  saveItemEdit(item: TechToolsTrackingDto): void {
    // Save the individual item changes
    item.isEditing = false;
    delete item.originalValues;
    
    // Show success message temporarily
    this.successMessage = 'Tool information updated successfully';
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  // New methods for the redesigned edit buttons
  startEditItem(item: TechToolsTrackingDto): void {
    // Store original values for cancel functionality
    item.originalValues = { ...item };
    item.isEditing = true;
  }

  saveEditItem(item: TechToolsTrackingDto): void {
    // Save the individual item changes
    item.isEditing = false;
    delete item.originalValues;
    
    // Show success message temporarily
    this.successMessage = 'Tool information updated successfully';
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }

  cancelEditItem(item: TechToolsTrackingDto): void {
    // Restore original values
    if (item.originalValues) {
      Object.assign(item, item.originalValues);
      delete item.originalValues;
    }
    item.isEditing = false;
  }

  clearMessages(): void {
    this.error = '';
    this.successMessage = '';
  }

  // Bulk editing methods
  onFieldChange(index: number, field: string, value: any): void {
    // Update the field value
    (this.trackingData[index] as any)[field] = value;
    
    // Track this row as modified
    this.modifiedRows.add(index);
  }

  getInputValue(event: any): string {
    return (event.target as HTMLInputElement)?.value || '';
  }

  get pagedTrackingData(): TechToolsTrackingDto[] {
    const startIndex = (this.trackingCurrentPage - 1) * this.trackingPageSize;
    return this.trackingData.slice(startIndex, startIndex + this.trackingPageSize);
  }

  get pagedDrillDownEntries(): ToolsCalendarTrackingDto[] {
    const startIndex = (this.drillDownCurrentPage - 1) * this.drillDownPageSize;
    return this.calendarDrillDownEntries.slice(startIndex, startIndex + this.drillDownPageSize);
  }

  get trackingTotalPages(): number {
    return Math.max(1, Math.ceil(this.trackingData.length / this.trackingPageSize));
  }

  get drillDownTotalPages(): number {
    return Math.max(1, Math.ceil(this.calendarDrillDownEntries.length / this.drillDownPageSize));
  }

  get trackingStartRecord(): number {
    if (this.trackingData.length === 0) {
      return 0;
    }

    return (this.trackingCurrentPage - 1) * this.trackingPageSize + 1;
  }

  get trackingEndRecord(): number {
    return Math.min(this.trackingCurrentPage * this.trackingPageSize, this.trackingData.length);
  }

  get drillDownStartRecord(): number {
    if (this.calendarDrillDownEntries.length === 0) {
      return 0;
    }

    return (this.drillDownCurrentPage - 1) * this.drillDownPageSize + 1;
  }

  get drillDownEndRecord(): number {
    return Math.min(this.drillDownCurrentPage * this.drillDownPageSize, this.calendarDrillDownEntries.length);
  }

  onTrackingPageSizeChange(pageSize: string | number): void {
    this.trackingPageSize = Number(pageSize);
    this.trackingCurrentPage = 1;
  }

  onDrillDownPageSizeChange(pageSize: string | number): void {
    this.drillDownPageSize = Number(pageSize);
    this.drillDownCurrentPage = 1;
  }

  goToTrackingPage(page: number): void {
    this.trackingCurrentPage = Math.min(Math.max(1, page), this.trackingTotalPages);
  }

  goToDrillDownPage(page: number): void {
    this.drillDownCurrentPage = Math.min(Math.max(1, page), this.drillDownTotalPages);
  }

  private resetTrackingPagination(): void {
    this.trackingCurrentPage = 1;
  }

  private resetDrillDownPagination(): void {
    this.drillDownCurrentPage = 1;
  }

}