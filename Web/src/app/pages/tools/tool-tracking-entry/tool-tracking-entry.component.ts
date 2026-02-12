import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ToolTrackingService } from 'src/app/core/services/tool-tracking.service';
import { TechToolsTrackingDto, TechsInfoDto, ToolTrackingApiResponse, ToolTrackingCountApiResponse, ToolsTrackingTechsDto, EquipmentFileDto, SaveEquipmentFileRequestDto } from 'src/app/core/model/tool-tracking.model';

@Component({
  selector: 'app-tool-tracking-entry',
  templateUrl: './tool-tracking-entry.component.html',
  styleUrls: ['./tool-tracking-entry.component.scss']
})
export class ToolTrackingEntryComponent implements OnInit {
  techId: string = '';
  selectedTech: string = 'All';
  technicians: ToolsTrackingTechsDto[] = [];
  trackingData: TechToolsTrackingDto[] = [];
  techInfo: TechsInfoDto | null = null;
  toolsCount: number = 0;
  showCount: boolean = false;
  loading: boolean = false;
  loadingCount: boolean = false;
  loadingTechnicians: boolean = false;
  error: string = '';
  successMessage: string = '';
  isSaving: boolean = false;
  modifiedRows = new Set<number>();
  
  // File attachment properties - BLOB storage like legacy
  equipmentFiles: EquipmentFileDto[] = [];
  selectedFiles: File[] = [];
  uploadingFiles: boolean = false;
  
  constructor(private toolTrackingService: ToolTrackingService, private router: Router, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.loadTechnicians();
    
    // Check for TechID query parameter from calendar navigation
    this.route.queryParams.subscribe(params => {
      const techID = params['TechID'];
      if (techID) {
        // Pre-select the technician from calendar navigation
        this.selectedTech = techID;
        this.techId = techID;
        // Load tools automatically after technicians are loaded
        setTimeout(() => {
          this.autoLoadTools();
        }, 500);
      }
    });
  }

  loadTechnicians(): void {
    this.loadingTechnicians = true;
    this.toolTrackingService.getToolsTrackingTechs().subscribe({
      next: (response) => {
        this.loadingTechnicians = false;
        if (response.success) {
          this.technicians = response.data;
        } else {
          console.error('Failed to load technicians:', response.message);
        }
      },
      error: (err) => {
        this.loadingTechnicians = false;
        console.error('Error loading technicians:', err);
      }
    });
  }

  onTechnicianChange(selectedTechId: string): void {
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

    this.toolTrackingService.getTechToolsTracking(this.selectedTech).subscribe({
      next: (response: ToolTrackingApiResponse) => {
        this.loading = false;
        if (response.success) {
          this.trackingData = response.data;
          this.techInfo = response.techInfo;
          // Automatically load count as well
          this.loadToolsCount();
        } else {
          this.error = response.message || 'Failed to retrieve data';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'An error occurred while fetching data';
        console.error('Error fetching tool tracking data:', err);
      }
    });
  }

  onSearch(): void {
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

    this.toolTrackingService.getTechToolsTracking(this.selectedTech).subscribe({
      next: (response: ToolTrackingApiResponse) => {
        this.loading = false;
        if (response.success) {
          this.trackingData = response.data;
          this.techInfo = response.techInfo;
          // Load count after successful tracking data retrieval
          this.loadToolsCount();
        } else {
          this.error = response.message || 'Failed to retrieve data';
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'An error occurred while fetching data';
        console.error('Error fetching tool tracking data:', err);
      }
    });
  }

  loadToolsCount(): void {
    if (!this.techId.trim()) return;

    this.loadingCount = true;
    
    this.toolTrackingService.getToolsTrackingCount(this.techId.trim()).subscribe({
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

  onSave(): void {
    if (this.modifiedRows.size === 0) {
      this.error = 'No changes to save';
      return;
    }

    this.isSaving = true;
    this.error = '';

    // Get only the modified rows
    const modifiedData = Array.from(this.modifiedRows).map(index => this.trackingData[index]);

    console.log('Saving modified tool tracking data:', modifiedData);

    // Call the actual API to save the data
    this.toolTrackingService.saveToolTrackingBulk(modifiedData).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        
        if (response.success) {
          this.modifiedRows.clear();
          this.successMessage = `Successfully saved ${modifiedData.length} tool records`;
          
          setTimeout(() => {
            this.successMessage = '';
          }, 3000);
        } else {
          this.error = response.message || 'Failed to save tool tracking data';
        }
      },
      error: (err: any) => {
        this.isSaving = false;
        this.error = err.error?.message || 'An error occurred while saving the data';
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
    // Remove original values since changes are saved
    this.trackingData[index].originalValues = undefined;
    console.log('Saving row data:', this.trackingData[index]);
    // TODO: Implement API call to save changes
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

  async uploadFiles(): Promise<void> {
    if (this.selectedFiles.length === 0) {
      alert('Please select files to upload');
      return;
    }

    this.uploadingFiles = true;
    const uploadPromises: Promise<void>[] = [];

    for (const file of this.selectedFiles) {
      const promise = this.uploadSingleFile(file);
      uploadPromises.push(promise);
    }

    try {
      await Promise.all(uploadPromises);
      this.successMessage = `${this.selectedFiles.length} file(s) uploaded successfully to database`;
      this.selectedFiles = [];
      
      // Clear file input
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      
      // Auto-hide success message
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
      
    } catch (error) {
      console.error('File upload error:', error);
      this.error = 'Failed to upload files to database';
    } finally {
      this.uploadingFiles = false;
    }
  }

  private async uploadSingleFile(file: File): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          // Convert to base64 for BLOB storage (matching legacy Img_Stream)
          const base64Data = (reader.result as string).split(',')[1];
          
          const fileData: SaveEquipmentFileRequestDto = {
            equipID: 0, // Will be set based on selected tool
            techID: this.techId,
            img_Title: file.name,           // Original filename
            img_Type: file.type || this.getFileExtension(file.name), // MIME type or extension
            img_Stream: base64Data,         // Base64 encoded binary data (BLOB)
            createdBy: this.techId || 'system'
          };
          
          // Save to database via API (matches legacy SaveEquipmentFiles)
          this.toolTrackingService.saveEquipmentFile(fileData).subscribe({
            next: (response) => {
              if (response.success) {
                console.log('File saved to database:', file.name);
                resolve();
              } else {
                reject(new Error(response.message));
              }
            },
            error: (err) => {
              console.error('Database save error:', err);
              reject(err);
            }
          });
          
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  private getFileExtension(filename: string): string {
    return filename.substring(filename.lastIndexOf('.') + 1);
  }

  loadEquipmentFiles(equipID: number): void {
    // Load files from database BLOB storage (matches legacy GetEquipmentFiles)
    this.toolTrackingService.getEquipmentFiles(equipID).subscribe({
      next: (response) => {
        if (response.success) {
          this.equipmentFiles = response.data;
          console.log('Equipment files loaded from database:', this.equipmentFiles.length);
        } else {
          console.error('Failed to load equipment files:', response.message);
        }
      },
      error: (err) => {
        console.error('Error loading equipment files:', err);
      }
    });
  }

  downloadFile(file: EquipmentFileDto): void {
    // Download file from database BLOB storage
    this.toolTrackingService.downloadEquipmentFile(file.equipID, file.img_Title).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = file.img_Title;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('File download error:', err);
        this.error = 'Failed to download file from database';
      }
    });
  }

  viewFile(file: EquipmentFileDto): void {
    // View file from database BLOB storage
    this.toolTrackingService.downloadEquipmentFile(file.equipID, file.img_Title).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        // Clean up URL after a delay
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      },
      error: (err) => {
        console.error('File view error:', err);
        this.error = 'Failed to view file from database';
      }
    });
  }

  removeFile(index: number): void {
    if (confirm('Are you sure you want to remove this file?')) {
      this.selectedFiles.splice(index, 1);
    }
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

}