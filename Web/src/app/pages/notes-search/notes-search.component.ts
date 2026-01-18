import { Component, OnInit } from '@angular/core';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { ReportService } from 'src/app/core/services/report.service';

interface NotesSearchResult {
  jobNo: string;
  siteId: string;
  customer: string;
  technician: string;
  startDate: string | null;
  snippet: string;
}

@Component({
  selector: 'app-notes-search',
  templateUrl: './notes-search.component.html',
  styleUrls: ['./notes-search.component.scss']
})
export class NotesSearchComponent implements OnInit {

  loading = false;
  errorMessage = '';
  searchQuery = '';
  results: NotesSearchResult[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 20;
  totalMatches = 0;
  totalPages = 0;
  
  pageSizeOptions = [10, 20, 50, 100, 500];

  constructor(private reportService: ReportService) {}

  ngOnInit(): void {
    // Don't load data on init - wait for user to search
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.results = [];
      this.totalMatches = 0;
      this.totalPages = 0;
      this.errorMessage = '';
      return;
    }
    
    this.currentPage = 1;
    this.loadData();
  }

  onPageSizeChange(): void {
    this.currentPage = 1;
    if (this.searchQuery.trim()) {
      this.loadData();
    }
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.errorMessage = '';

    this.reportService.searchPMNotes(this.searchQuery, this.currentPage, this.pageSize).pipe(
      map(response => this.normalizeResponse(response || {})),
      catchError(err => {
        console.error('PM Notes search failed', err);
        this.errorMessage = 'Unable to search PM notes right now. Please try again.';
        return of({ rows: [], total: 0, totalPages: 0 });
      })
    ).subscribe(data => {
      this.results = data.rows;
      this.totalMatches = data.total;
      this.totalPages = data.totalPages || (this.pageSize > 0 ? Math.ceil(this.totalMatches / this.pageSize) : 0);
      this.loading = false;
    });
  }

  private normalizeResponse(response: any): { rows: NotesSearchResult[], total: number, totalPages: number } {
    let rows: NotesSearchResult[] = [];
    let total = 0;
    let totalPages = 0;

    // Map 'results' array from API response
    if (response.results && Array.isArray(response.results)) {
      rows = response.results.map((row: any) => this.normalizeRow(row));
    }

    // Get total count and pages
    total = response.totalMatches || 0;
    totalPages = response.totalPages || 0;

    return { rows, total, totalPages };
  }

  private normalizeRow(row: any): NotesSearchResult {
    return {
      jobNo: row?.callNbr?.trim() ?? '',
      siteId: row?.custNmbr?.trim() ?? '',
      customer: row?.custName?.trim() ?? '',
      technician: row?.techName?.trim() ?? '',
      startDate: row?.strtDate ?? null,
      snippet: this.sanitizeHtml(row?.snippet ?? '')
    };
  }

  private sanitizeHtml(html: string): string {
    if (!html) return '';
    
    // Remove script and style tags
    html = html.replace(/<(script|style)[^>]*>.*?<\/\1>/gis, '');
    
    // Remove inline event handlers
    html = html.replace(/\son[a-z]+\s*=\s*(['"]).*?\1/gi, '');
    
    // Neutralize javascript: URLs
    html = html.replace(/href\s*=\s*(['"])\s*javascript:[^\1]*\1/gi, 'href="#"');
    
    // Replace multiple consecutive \r\n or \n with single line break
    html = html.replace(/\r\n\r\n+/g, '<br>');
    html = html.replace(/\r\n/g, ' ');
    html = html.replace(/\n\n+/g, '<br>');
    html = html.replace(/\n/g, ' ');
    
    // Clean up multiple spaces
    html = html.replace(/\s{2,}/g, ' ');
    
    return html;
  }

  trackByResult(index: number, result: NotesSearchResult): string {
    return `${result.jobNo}-${result.siteId}-${index}`;
  }

  getMetaText(): string {
    if (this.totalMatches === 0) {
      return 'No results.';
    }
    const resultText = this.totalMatches === 1 ? 'result' : 'results';
    return `Found ${this.totalMatches} ${resultText} — page ${this.currentPage} of ${Math.max(this.totalPages, 1)}`;
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show first, last, and pages around current
      if (this.currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push(-1); // ellipsis
        pages.push(this.totalPages);
      } else if (this.currentPage >= this.totalPages - 2) {
        pages.push(1);
        pages.push(-1);
        for (let i = this.totalPages - 3; i <= this.totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push(-1);
        pages.push(this.currentPage - 1);
        pages.push(this.currentPage);
        pages.push(this.currentPage + 1);
        pages.push(-1);
        pages.push(this.totalPages);
      }
    }
    
    return pages;
  }
}
