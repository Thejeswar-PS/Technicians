import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { IReportTeam, ITrendingReportTeam } from 'src/app/core/model/trending-report-team.models';
import { ReportService } from 'src/app/core/services/report.service';
import { DashboardFilterSharedService } from 'src/app/core/services/shared-service/dashboard-filter-shared.service';
@Component({
  selector: 'app-trending-report-teams',
  templateUrl: './trending-report-teams.component.html',
  styleUrls: ['./trending-report-teams.component.scss']
})

export class TrendingReportTeamsComponent implements OnInit {
monthlyTeamData!: IReportTeam;
  filterForm = this.fb.group({
    type : ['LW'],
  });
  sortedColumn: string = '';
  sortDirection: number = 1;
  trendingReportTotal: any = {
    quotesWritten: 0,
    scheduled: 0,
    emergencyJobs: 0,
    jobsProcessed: 0,
    pastDue: 0,
    jobsInProcess: 0,
    jobsToSchedule: 0,
    jobsToBeUploaded: 0,
  }
  constructor(private fb: FormBuilder, private _reportService: ReportService,private filterDashboardService: DashboardFilterSharedService,) { }
  ngOnInit(): void {
    this.Load();
    this.onFilterChanges();
    this.filterDashboardService.setHomePage(false);
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
public Load(){
  this._reportService.getMontylyWeeklyTeams(this.filterForm.controls.type.value).subscribe(data=> {
    this.monthlyTeamData = data;
    // for (const report of this.monthlyTemadData) {
    //   this.trendingReportTotal.teamRank += report.teamRank;
    //   this.trendingReportTotal.quotesWritten += report.quotesWritten;
    //   this.trendingReportTotal.scheduled += report.jobScheduled;
    //   this.trendingReportTotal.emergencyJobs += report.emergencyJobs;
    //   this.trendingReportTotal.pastDue += report.pastDueJobs;
    //   this.trendingReportTotal.jobsProcessed += report.jobsProcessed;
    //   this.trendingReportTotal.jobsInProcess += report.jobsToBeUploaded;
    //   this.trendingReportTotal.jobsToSchedule += report.jobsToSchedule;
    //   this.trendingReportTotal.jobsToBeUploaded += report.jobsToBeUploaded;
    // }
  })
}
  public onFilterChanges(){
    this.filterForm.valueChanges.subscribe(selectedValue  => {
      this.Load();
    })
  }

}

