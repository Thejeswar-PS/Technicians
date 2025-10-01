 import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styles: [
  ]
})
export class PaginationComponent implements OnInit,OnChanges  {

  @Input() pageNum : number;
  @Input() pageSize : number;
  @Input() totalRecords : number;
  @Output() updatePagination  = new EventEmitter<number>();
  pageCount : number = 20;
  pageIndex : number = 0;
  defaultNumbers = [1,2,3,4,5];
  pageNumbers : number[];
  currentPage : number = 1;

  constructor() {

  }

  ngOnInit(): void {
    this.pageCount = this.totalRecords % this.pageSize == 0 ? this.totalRecords / this.pageSize : Math.round(this.totalRecords / this.pageSize);
    this.pageNumbers = this.defaultNumbers;
  }
  ngOnChanges(changes: SimpleChanges): void {
    if(changes.pageNum !== undefined)
    {
      this.pageNum = changes.pageNum.currentValue;
      this.currentPage = this.pageNum;
    }
    this.pageCount = Math.ceil(this.totalRecords / this.pageSize);
  }

  goToPage(pageNum : number)
  {
    this.currentPage = pageNum;
    this.pageNum = pageNum;
    this.updatePagination.emit(pageNum);
  }

  goToIndex(num : number)
  {
    this.pageIndex = this.pageIndex + num;
    this.pageNumbers = this.defaultNumbers.map(x => x + (5 *this.pageIndex));
    this.goToPage(this.pageNumbers[0]);
  }

}
