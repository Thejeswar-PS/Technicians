import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { JobService } from 'src/app/core/services/job.service';
import { ToastrService } from 'ngx-toastr';
import { MobileReceipt } from 'src/app/core/model/mobile-receipt.model';

@Component({
  selector: 'app-mobile-receipts',
  templateUrl: './mobile-receipts.component.html',
  styleUrls: ['./mobile-receipts.component.scss']
})
export class MobileReceiptsComponent implements OnInit {
  callNbr: string = '';
  techName: string = '';
  techID: string = '';
  digest: string = '';
  
  receipts: MobileReceipt[] = [];
  errorMessage: string = '';
  loading: boolean = false;
  
  // Zoom functionality
  zoomedImageUrl: string = '';
  showZoomedImage: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private jobService: JobService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.callNbr = params['CallNbr'] || '';
      this.techName = params['TechName'] || '';
      this.techID = params['TechID'] || '';
      this.digest = params['Digest'] || '';
      
      console.log('Mobile Receipts - Received params:', {
        callNbr: this.callNbr,
        techName: this.techName,
        techID: this.techID,
        digest: this.digest
      });
      
      if (this.callNbr && this.techID) {
        this.loadMobileReceipts();
      } else {
        this.errorMessage = 'Missing required parameters: CallNbr or TechID';
      }
    });
  }

  loadMobileReceipts(): void {
    this.loading = true;
    this.errorMessage = '';
    
    console.log('Loading mobile receipts for CallNbr:', this.callNbr, 'TechID:', this.techID);
    
    this.jobService.getMobileReceipts(this.callNbr, this.techID).subscribe({
      next: (data: MobileReceipt[]) => {
        console.log('Mobile receipts loaded:', data);
        this.receipts = data || [];
        this.loading = false;
        
        if (this.receipts.length === 0) {
          this.errorMessage = 'No mobile receipts found for this job.';
        }
      },
      error: (error: any) => {
        console.error('Error loading mobile receipts:', error);
        this.loading = false;
        this.errorMessage = 'Error loading mobile receipts: ' + (error.error?.message || error.message || 'Unknown error');
        this.receipts = [];
      }
    });
  }

  getReceiptImageUrl(receipt: MobileReceipt): string {
    // If we have base64 data, use it directly
    if (receipt.receiptBase64) {
      return `data:image/jpeg;base64,${receipt.receiptBase64}`;
    }
    // Fallback to API endpoint if no base64 data
    return `/api/receipts/show?id=${receipt.expenseTableIndex}&ViewMode=Thumbnail`;
  }

  getFullImageUrl(receipt: MobileReceipt): string {
    if (receipt.receiptBase64) {
      return `data:image/jpeg;base64,${receipt.receiptBase64}`;
    }
    return `/api/receipts/show?id=${receipt.expenseTableIndex}&ViewMode=Full`;
  }

  onImageClick(receipt: MobileReceipt): void {
    this.zoomedImageUrl = this.getFullImageUrl(receipt);
    this.showZoomedImage = true;
  }

  closeZoomedImage(): void {
    this.showZoomedImage = false;
    this.zoomedImageUrl = '';
  }

  goBack(): void {
    this.router.navigate(['/jobs/expenses'], {
      queryParams: {
        CallNbr: this.callNbr,
        TechName: this.techName,
        TechID: this.techID,
        Digest: this.digest
      }
    });
  }

  formatReceiptDescription(receipt: MobileReceipt): string {
    let description = `Purpose: ${receipt.codeDesc}`;
    
    if (receipt.techPaid !== undefined && receipt.techPaid !== null) {
      description += `<br/><br/>Tech Paid: $${receipt.techPaid.toFixed(2)}`;
    }
    
    if (receipt.companyPaid !== undefined && receipt.companyPaid !== null) {
      description += `<br/><br/>Company Paid: $${receipt.companyPaid.toFixed(2)}`;
    }
    
    return description;
  }

  onImageError(event: any): void {
    console.error('Error loading receipt image:', event);
    event.target.src = 'assets/media/icons/no-image.png'; // Fallback image
  }

  trackByIndex(index: number, item: MobileReceipt): number {
    return item.expenseTableIndex || index;
  }
}