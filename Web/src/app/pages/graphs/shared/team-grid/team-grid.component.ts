import { Component, Input, OnInit } from '@angular/core';
import { ITrendingReportTeam } from 'src/app/core/model/trending-report-team.models';

@Component({
  selector: 'app-team-grid',
  templateUrl: './team-grid.component.html',
  styleUrls: ['./team-grid.component.scss']
})
export class TeamGridComponent implements OnInit {

  @Input() data: any[] = [];
  @Input() gridTotal: ITrendingReportTeam;
  @Input() totalSum: ITrendingReportTeam[];
  sortedColumn: string = '';
  sortDirection: number = 1;
  constructor() { }

  ngOnInit(): void {
  }

  sortTable(column: string): void {
    if (this.sortedColumn === column) {
      this.sortDirection = -this.sortDirection;
    } else {
      this.sortedColumn = column;
      this.sortDirection = 1;
    }
  }

  sortIcon(column: string): string {
    if (this.sortedColumn === column) {
      return this.sortDirection === 1 ? 'fa-sort-up' : 'fa-sort-down';
    }
    return 'fa-sort';
  }
}
