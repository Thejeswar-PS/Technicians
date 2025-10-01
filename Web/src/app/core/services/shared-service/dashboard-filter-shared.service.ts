import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Dashboardmodel, JobScheduleTrend } from '../../model/dashboard-model';

@Injectable({
  providedIn: 'root'
})
export class DashboardFilterSharedService {

  private dashboardFilter$ = new BehaviorSubject<any>({});
  selectedDashboardFilter$ = this.dashboardFilter$.asObservable();

  setDashboardFilter(filters: any) {
    this.dashboardFilter$.next(filters);
  }
  resetDashboardFilters()
  {
    this.dashboardFilter$.next({});
  }



  private toBeWritten$ = new BehaviorSubject<number>(-1);
  selectedtoBeWritten$ = this.toBeWritten$.asObservable();
  settoBeWrittenData(data: any) {
    this.toBeWritten$.next(data);
  }
  resettoBeWrittenData()
  {
    this.toBeWritten$.next(-1);
  }


  private dashboardData$ = new BehaviorSubject<Dashboardmodel>({});
  selectedDashboardData$ = this.dashboardData$.asObservable();

  setDashboardData(data: Dashboardmodel) {
    this.dashboardData$.next(data);
  }
  resetDashboardData()
  {
    this.dashboardData$.next({});
  }



  private weeklyQuotes$ = new BehaviorSubject<JobScheduleTrend[]>([]);
  selectedWeeklyQuotes$ = this.weeklyQuotes$.asObservable();

  setWeeklyQuotesData(data: JobScheduleTrend[]) {
    this.weeklyQuotes$.next(data);
  }
  resetWeeklyQuotesData()
  {
    this.weeklyQuotes$.next([]);
  }



  private toBeWrittenTable$ = new BehaviorSubject<any>([]);
  selectedToBeWrittenTable$ = this.toBeWrittenTable$.asObservable();

  setToBeWrittenTableData(filters: any) {
    this.toBeWrittenTable$.next(filters);
  }
  resetToBeWrittenTableData()
  {
    this.toBeWrittenTable$.next([]);
  }


  private toBeSentTable$ = new BehaviorSubject<any>([]);
  selectedToBeSentTable$ = this.toBeSentTable$.asObservable();

  setToBeSentTableData(filters: any) {
    this.toBeSentTable$.next(filters);
  }
  resetToBeSentTableData()
  {
    this.toBeSentTable$.next([]);
  }

  private isHome$ = new BehaviorSubject<any>(null);
  isHomePage$ = this.isHome$.asObservable();

  setHomePage(isHome: boolean) {
    this.isHome$.next(isHome);
  }
  resetHomePage()
  {
    this.isHome$.next(null);
  }
}
