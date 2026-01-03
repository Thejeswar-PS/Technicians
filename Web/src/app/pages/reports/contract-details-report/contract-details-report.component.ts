import { Component, OnInit } from '@angular/core';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ReportService } from 'src/app/core/services/report.service';

interface ContractDetailRow {
  customerNo: string;
  customerName: string;
  address: string;
  salesPerson: string;
  contractNo: string;
  poNumber: string;
  type: string;
  invoicedOn: string | null;
  amount: number | null;
}

interface CategoryOption {
  key: string;
  label: string;
}

@Component({
  selector: 'app-contract-details-report',
  templateUrl: './contract-details-report.component.html',
  styleUrls: ['./contract-details-report.component.scss']
})
export class ContractDetailsReportComponent implements OnInit {

  loading = false;
  errorMessage = '';
  contractRows: ContractDetailRow[] = [];
  selectedCategory = 'Non Liebert Contracts not billed as of yesterday';

  categoryOptions: CategoryOption[] = [
    {
      key: 'Non Liebert Contracts not billed as of yesterday',
      label: 'Non Liebert Contracts not billed as of yesterday'
    },
    {
      key: 'Non Liebert Contracts to be billed in next 30 days',
      label: 'Non Liebert Contracts to be billed in next 30 days'
    },
    {
      key: 'Non Liebert Contracts to be billed in next 60 days',
      label: 'Non Liebert Contracts to be billed in next 60 days'
    }
  ];

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';
    this.contractRows = [];

    this.reportService.getContractDetails(this.selectedCategory).pipe(
      map(rows => this.normalizeRows(rows || [])),
      catchError(err => {
        console.error('Contract details load failed', err);
        this.errorMessage = 'Unable to load contract details right now. Please try again.';
        return of([] as ContractDetailRow[]);
      })
    ).subscribe(rows => {
      this.contractRows = rows;
      this.loading = false;
    });
  }

  onCategoryChange(): void {
    this.loadData();
  }

  private normalizeRows(rows: any[]): ContractDetailRow[] {
    return rows.map((row: any) => {
      const invoicedOn = row?.['Invoiced On'] ?? row?.invoicedOn ?? row?.invoiceDate ?? null;
      const amount = row?.['Amount'] ?? row?.amount ?? null;

      return {
        customerNo: row?.['Customer No'] ?? row?.customerNo ?? row?.customer ?? '',
        customerName: row?.['Customer Name'] ?? row?.customerName ?? '',
        address: row?.['Address'] ?? row?.address ?? '',
        salesPerson: row?.['SalesPerson'] ?? row?.salesPerson ?? '',
        contractNo: row?.['Contract No'] ?? row?.contractNo ?? '',
        poNumber: row?.['PORDNMBR'] ?? row?.poNumber ?? '',
        type: row?.['Type'] ?? row?.type ?? '',
        invoicedOn: invoicedOn,
        amount: amount !== null && amount !== undefined ? Number(amount) : null
      } as ContractDetailRow;
    });
  }

  trackByRow(index: number, row: ContractDetailRow): string {
    return `${row.contractNo}-${row.customerNo}-${row.poNumber}-${index}`;
  }
}
