import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToolTrackingService } from 'src/app/core/services/tool-tracking.service';
import { TechToolsTrackingDto, TechsInfoDto, ToolTrackingApiResponse, ToolTrackingCountApiResponse, ToolsTrackingTechsDto } from 'src/app/core/model/tool-tracking.model';

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
  uploadedFiles: File[] = [];  // Added for file handling
  
  constructor(private toolTrackingService: ToolTrackingService, private router: Router) {}

  ngOnInit(): void {
    this.loadTechnicians();
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
    console.log('Saving tool tracking data:', this.trackingData);
    // TODO: Implement save functionality with API call
    alert('Save functionality will be implemented with backend integration');
  }

  goBack(): void {
    this.router.navigate(['/tools']);
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

  // File handling methods
  onFileSelected(event: any): void {
    const files = event.target.files;
    if (files && files.length > 0) {
      console.log('Files selected:', files.length);
    }
  }

  uploadFiles(): void {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    if (fileInput && fileInput.files && fileInput.files.length > 0) {
      // Convert FileList to Array and add to uploaded files
      const newFiles = Array.from(fileInput.files);
      this.uploadedFiles.push(...newFiles);
      console.log('Files uploaded:', newFiles.length);
      
      // Clear the file input
      fileInput.value = '';
      
      // Show success message
      alert(`${newFiles.length} file(s) uploaded successfully`);
    } else {
      alert('Please select files to upload');
    }
  }

  viewFile(index: number): void {
    const file = this.uploadedFiles[index];
    if (file) {
      // Create object URL and open in new window
      const url = URL.createObjectURL(file);
      window.open(url, '_blank');
    }
  }

  downloadFile(index: number): void {
    const file = this.uploadedFiles[index];
    if (file) {
      // Create download link
      const url = URL.createObjectURL(file);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.name;
      link.click();
      URL.revokeObjectURL(url);
    }
  }

  removeFile(index: number): void {
    if (confirm('Are you sure you want to remove this file?')) {
      this.uploadedFiles.splice(index, 1);
    }
  }

  updateReceived(item: TechToolsTrackingDto, event: any): void {
    // Convert checkbox boolean to string as expected by backend
    item.received = event.target.checked ? 'true' : 'false';
  }

  // Helper methods for the new modern design
  getReceivedCount(): number {
    if (!this.trackingData) return 0;
    return this.trackingData.filter(item => item.received === 'true').length;
  }

  getPendingCount(): number {
    if (!this.trackingData) return 0;
    return this.trackingData.filter(item => item.received !== 'true').length;
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
    return item.toolName + item.serialNo; // Unique identifier for tracking
  }

}