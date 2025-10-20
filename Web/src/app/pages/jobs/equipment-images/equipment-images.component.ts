import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { EquipmentImage, EquipmentImageUpload } from 'src/app/core/model/equipment-details.model';
import { EquipmentService } from 'src/app/core/services/equipment.service';

@Component({
  selector: 'app-equipment-images',
  templateUrl: './equipment-images.component.html',
  styleUrls: ['./equipment-images.component.scss']
})
export class EquipmentImagesComponent implements OnInit {
  // Route parameters
  callNbr = '';
  equipNo = '';
  equipId = 0;
  techId = '';
  techName = '';

  // Component state
  loading = false;
  uploading = false;
  errorMessage = '';
  successMessage = '';
  showMaxImageError = false;

  // Data
  images: EquipmentImage[] = [];
  
  // Upload form
  selectedFile: File | null = null;
  selectedDescription = 'PS'; // Default to "Please Select"

  // Description options (matching legacy dropdown)
  descriptionOptions = [
    { value: 'PS', text: 'Please Select' },
    { value: '1', text: 'UPS nametag' },
    { value: '2', text: 'External / internal MBB' },
    { value: '3', text: 'Battery nametag' },
    { value: '4', text: 'Battery terminal' },
    { value: '5', text: 'Other Equipment nametag' },
    { value: '6', text: 'Other Equipment Photo' }
  ];

  // Valid file types (matching legacy validation)
  private readonly VALID_FILE_TYPES = ['jpg', 'jpeg', 'gif', 'bmp', 'png'];
  private readonly MAX_IMAGE_COUNT = 2;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private equipmentService: EquipmentService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadRouteParams();
    this.loadImages();
  }

  private loadRouteParams(): void {
    this.route.queryParams.subscribe(params => {
      this.callNbr = params['CallNbr'] || '';
      this.equipNo = params['EquipNo'] || '';
      this.equipId = parseInt(params['EquipId']) || 0;
      this.techId = params['Tech'] || '';
      this.techName = params['TechName'] || '';
    });
  }

  private async loadImages(): Promise<void> {
    if (!this.equipId) {
      console.log('loadImages: No equipId provided');
      return;
    }

    console.log('=== LOAD IMAGES DEBUG ===');
    console.log('Loading images for equipId:', this.equipId);
    
    this.loading = true;
    this.errorMessage = '';

    try {
      const images = await this.equipmentService.getEquipmentImages(this.equipId).toPromise();
      console.log('Raw images response:', images);
      console.log('Images array length:', images ? images.length : 0);
      
      this.images = images || [];
      console.log('Component images set to:', this.images);
      console.log('=== LOAD IMAGES DEBUG END ===');
    } catch (error: any) {
      console.error('Error loading images:', error);
      console.error('Error status:', error.status);
      console.error('Error response:', error.error);
      
      // With the backend fix, this should only happen for real errors
      this.errorMessage = `Data Retrieval Failure. Error Details: ${error.message || error}`;
      this.toastr.error('Failed to load images');
    } finally {
      this.loading = false;
    }
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      if (this.isValidFile(file.name)) {
        this.selectedFile = file;
        this.errorMessage = '';
        this.showMaxImageError = false; // Clear max image error when file is selected
      } else {
        this.selectedFile = null;
        this.errorMessage = `File: ${file.name} Invalid file format. File must be of format jpg, gif, bmp or png`;
        event.target.value = ''; // Clear the file input
      }
    }
  }

  private isValidFile(fileName: string): boolean {
    const extension = this.getFileExtension(fileName);
    return this.VALID_FILE_TYPES.includes(extension.toLowerCase());
  }

  private getFileExtension(fileName: string): string {
    const lastIndex = fileName.lastIndexOf('.');
    return fileName.substring(lastIndex + 1);
  }

  async onUpload(): Promise<void> {
    // Clear previous max image error
    this.showMaxImageError = false;
    
    // Validate form
    if (!this.selectedFile) {
      this.errorMessage = 'You cannot upload without selecting the images';
      this.toastr.error('Please select a file to upload');
      return;
    }

    if (this.selectedDescription === 'PS') {
      this.errorMessage = 'You must enter the description to upload the image';
      this.toastr.error('Please select a description');
      return;
    }

    // Validate required fields
    if (!this.callNbr || !this.equipNo || !this.equipId) {
      this.errorMessage = 'Missing required equipment information. Please navigate to this page from Equipment Details.';
      this.toastr.error('Missing required information');
      return;
    }

    if (this.images.length >= this.MAX_IMAGE_COUNT) {
      this.showMaxImageError = true;
      this.toastr.error('Maximum image count reached');
      return;
    }

    this.uploading = true;
    this.errorMessage = '';

    try {
      const selectedOption = this.descriptionOptions.find(opt => opt.value === this.selectedDescription);
      const description = selectedOption ? selectedOption.text : 'Unknown';

      const uploadData: EquipmentImageUpload = {
        callNbr: this.callNbr,
        equipID: this.equipId,
        equipNo: this.equipNo,
        techName: this.techName,
        techID: this.techId,
        img_Title: description,
        img_Type: this.selectedFile.name, // Use filename instead of MIME type
        imgFile: this.selectedFile
      };

      console.log('=== UPLOAD DEBUG START ===');
      console.log('Route params:', {
        callNbr: this.callNbr,
        equipNo: this.equipNo,
        equipId: this.equipId,
        techId: this.techId,
        techName: this.techName
      });
      console.log('Upload data:', {
        callNbr: uploadData.callNbr,
        equipID: uploadData.equipID,
        equipNo: uploadData.equipNo,
        techName: uploadData.techName,
        techID: uploadData.techID,
        img_Title: uploadData.img_Title,
        img_Type: uploadData.img_Type,
        fileName: uploadData.imgFile.name,
        fileSize: uploadData.imgFile.size,
        fileType: uploadData.imgFile.type
      });
      console.log('=== UPLOAD DEBUG END ===');

      const result = await this.equipmentService.uploadEquipmentImage(uploadData).toPromise();
      
      console.log('=== BACKEND RESPONSE DEBUG ===');
      console.log('Full result:', result);
      console.log('result.success:', result?.success);
      console.log('result.message:', result?.message);
      console.log('result.rowsAffected:', result?.rowsAffected);
      console.log('=== BACKEND RESPONSE DEBUG END ===');
      
      if (result?.success) {
        this.successMessage = 'Image uploaded successfully';
        this.toastr.success('Image uploaded successfully');
        this.showMaxImageError = false; // Clear max image error on successful upload
        
        // Reset form
        this.selectedFile = null;
        this.selectedDescription = 'PS';
        const fileInput = document.getElementById('fileInput') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        
        // Small delay to ensure database transaction commits, then reload
        console.log('Upload successful, waiting 500ms before reload...');
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.loadImages();
      } else {
        this.errorMessage = result?.message || 'Upload failed';
        this.toastr.error(this.errorMessage);
      }
    } catch (error: any) {
      console.error('=== UPLOAD ERROR DEBUG ===');
      console.error('Full error object:', error);
      console.error('Error status:', error.status);
      console.error('Error message:', error.message);
      console.error('Error response:', error.error);
      console.error('=== ERROR DEBUG END ===');
      
      let errorMsg = 'Failed to upload image';
      if (error.error?.message) {
        errorMsg = error.error.message;
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      this.errorMessage = `Error: ${errorMsg}`;
      this.toastr.error(errorMsg);
    } finally {
      this.uploading = false;
    }
  }

  async onDeleteImage(image: EquipmentImage): Promise<void> {
    const confirmDelete = confirm(`Are you sure you want to delete this image ${image.img_ID}?`);
    if (!confirmDelete) return;

    console.log('=== DELETE IMAGE DEBUG START ===');
    console.log('Deleting image:', image);
    console.log('Image ID:', image.img_ID);
    console.log('=== DELETE IMAGE DEBUG START ===');

    try {
      const result = await this.equipmentService.deleteEquipmentImage(image.img_ID).toPromise();
      
      console.log('=== DELETE RESPONSE DEBUG ===');
      console.log('Delete result:', result);
      console.log('Result.success:', result?.success);
      console.log('Result.message:', result?.message);
      console.log('=== DELETE RESPONSE DEBUG END ===');
      
      if (result?.success) {
        this.toastr.success('Image deleted successfully');
        this.showMaxImageError = false; // Clear max image error when image is deleted
        await this.loadImages(); // Reload images
      } else {
        this.errorMessage = `Delete Failure. Error Details: ${result?.message || 'Unknown error'}`;
        this.toastr.error('Failed to delete image');
      }
    } catch (error: any) {
      console.error('=== DELETE ERROR DEBUG ===');
      console.error('Full error object:', error);
      console.error('Error status:', error.status);
      console.error('Error statusText:', error.statusText);
      console.error('Error message:', error.message);
      console.error('Error error:', error.error);
      console.error('Error url:', error.url);
      console.error('=== DELETE ERROR DEBUG END ===');
      
      this.errorMessage = `Delete Failure. Error Details: ${error.message || error}`;
      this.toastr.error('Failed to delete image');
    }
  }

  getImageUrl(image: EquipmentImage): string {
    if (image.img_stream) {
      return `data:image/jpg;base64,${image.img_stream}`;
    }
    return 'assets/media/misc/image.png'; // Fallback image
  }



  // Modal handling
  modalImage: EquipmentImage | null = null;

  // Drag and drop handlers
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (this.isValidFile(file.name)) {
        this.selectedFile = file;
        this.errorMessage = '';
        this.showMaxImageError = false; // Clear max image error when file is dropped
      } else {
        this.errorMessage = `File: ${file.name} Invalid file format. File must be of format jpg, gif, bmp or png`;
      }
    }
  }

  // File input trigger
  triggerFileInput(): void {
    const fileInput = document.querySelector('#fileInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  // Remove selected file
  removeSelectedFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile = null;
    const fileInput = document.getElementById('fileInput') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  // Enhanced modal functionality
  openImageModal(image: EquipmentImage): void {
    this.modalImage = image;
  }

  closeModal(): void {
    this.modalImage = null;
  }

  goBack(): void {
    this.router.navigate(['/equipment/equipment-details'], {
      queryParams: {
        CallNbr: this.callNbr,
        Tech: this.techId,
        TechName: this.techName
      }
    });
  }

  get summaryText(): string {
    return `Service Call No: ${this.callNbr} -- Equip No: ${this.equipNo} -- Id: ${this.equipId}`;
  }
}