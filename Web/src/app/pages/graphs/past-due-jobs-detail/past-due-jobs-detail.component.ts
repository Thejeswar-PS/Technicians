import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PastDueJobDetailDto } from 'src/app/core/model/past-due-graph.model';
import { PastDueGraphService } from 'src/app/core/services/past-due-graph.service';

@Component({
  selector: 'app-past-due-jobs-detail',
  templateUrl: './past-due-jobs-detail.component.html',
  styleUrls: ['./past-due-jobs-detail.component.scss']
})
export class PastDueJobsDetailComponent implements OnInit {
  accountManager = '';
  category = '';
  resolvedAccountManager = 'All';
  resolvedCategory = 'All';
  totalCount = 0;
  loading = false;
  errorMessage = '';
  rows: PastDueJobDetailDto[] = [];
  filteredRows: PastDueJobDetailDto[] = [];
  searchTerm = '';
  readonly pageSizeOptions = [25, 50, 100, 250, 0];
  pageSize = 50;
  currentPage = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pastDueGraphService: PastDueGraphService
  ) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      this.accountManager = (params.get('accountManager') || '').trim();
      this.category = (params.get('category') || 'PastDue').trim();
      this.loadDetails();
    });
  }

  get totalPages(): number {
    if (this.pageSize === 0) {
      return this.filteredRows.length ? 1 : 0;
    }

    return Math.ceil(this.filteredRows.length / this.pageSize);
  }

  get paginatedRows(): PastDueJobDetailDto[] {
    if (this.pageSize === 0) {
      return this.filteredRows;
    }

    const start = (this.currentPage - 1) * this.pageSize;
    return this.filteredRows.slice(start, start + this.pageSize);
  }

  get pageStart(): number {
    if (!this.filteredRows.length) {
      return 0;
    }

    if (this.pageSize === 0) {
      return 1;
    }

    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get pageEnd(): number {
    if (!this.filteredRows.length) {
      return 0;
    }

    if (this.pageSize === 0) {
      return this.filteredRows.length;
    }

    return Math.min(this.currentPage * this.pageSize, this.filteredRows.length);
  }

  goBack(): void {
    this.router.navigate(['/graphs/past-due-graph']);
  }

  applySearch(term: string): void {
    this.searchTerm = term || '';
    const query = this.searchTerm.trim().toLowerCase();

    if (!query) {
      this.filteredRows = [...this.rows];
    } else {
      this.filteredRows = this.rows.filter(row =>
        [
          row.callNbr,
          row.custName,
          row.custNmbr,
          row.accMgr,
          row.jobStatus,
          row.techName,
          row.description,
          row.contNbr,
          row.custClas
        ].some(value => (value || '').toString().toLowerCase().includes(query))
      );
    }

    this.currentPage = 1;
  }

  changePageSize(size: number | string): void {
    this.pageSize = Number(size);
    this.currentPage = 1;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage -= 1;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage += 1;
    }
  }

  formatDate(value: Date): string {
    if (!value || isNaN(new Date(value).getTime()) || new Date(value).getFullYear() <= 1900) {
      return '';
    }

    return new Date(value).toLocaleDateString();
  }

  trackByCallNbr(index: number, row: PastDueJobDetailDto): string {
    return `${row.callNbr}-${row.accMgr}-${index}`;
  }

  private loadDetails(): void {
    this.loading = true;
    this.errorMessage = '';
    this.rows = [];
    this.filteredRows = [];

    this.pastDueGraphService.getPastDueJobsDetail(this.accountManager, this.category).subscribe({
      next: response => {
        this.rows = response.data || [];
        this.filteredRows = [...this.rows];
        this.totalCount = response.totalCount || this.rows.length;
        this.resolvedAccountManager = response.filters?.accountManager || this.accountManager || 'All';
        this.resolvedCategory = response.filters?.category || this.category || 'All';
        this.currentPage = 1;
        this.loading = false;
      },
      error: error => {
        this.errorMessage = error?.message || 'Unable to load past due job details.';
        this.loading = false;
      }
    });
  }
}