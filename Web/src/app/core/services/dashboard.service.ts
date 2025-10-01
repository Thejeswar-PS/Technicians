import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ToBeWrittenQuotes } from '../model/to-be-written-quotes';
import { ToBeSentQuotes } from '../model/to-be-sent-quotes';
import { RecentActivities } from '../model/recent-activities';
import { environment } from '../../../environments/environment';
import { Dashboardmodel, JobScheduleTrend, MonthlyUnscheduledJob, RecentActivityLog, Sale, WeeklyTopPerformers } from '../model/dashboard-model';
import { ICustomerFeedback } from '../model/customer-feedback.model';
@Injectable({
  providedIn: 'root'
})
export class DashboardService {

  constructor(private http : HttpClient) { }

  private headers = new HttpHeaders({
    'Access-Control-Allow-Origin': '*'
  });
  API : string = environment.apiUrl;

  getDashboardData(filtersObj : any) : Observable<Dashboardmodel>
  {
    return this.http.get<Dashboardmodel>(`${this.API}/Dashboard/GetDashboardData?type=${filtersObj.dateRange}&ownerId=${filtersObj.accountManager}`,{ headers : this.headers });
  }
  getMonthlyUnscheduledJobs(filtersObj : any) : Observable<MonthlyUnscheduledJob[]>
  {
    return this.http.get<MonthlyUnscheduledJob[]>(`${this.API}/Dashboard/GetMonthlyUnscheduledJobs?type=${filtersObj.dateRange}&ownerId=${filtersObj.accountManager}`,{ headers : this.headers });
  }
  getRecentActivityLog(filtersObj : any) : Observable<RecentActivityLog[]>
  {
    return this.http.get<RecentActivityLog[]>(`${this.API}/Dashboard/GetRecentActivityLog?type=${filtersObj.dateRange}&ownerId=${filtersObj.accountManager}`,{ headers : this.headers });
  }
  getSalesAsync(filtersObj : any) : Observable<Sale>
  {
    return this.http.get<Sale>(`${this.API}/Dashboard/GetSalesAsync?type=${filtersObj.dateRange}&ownerId=${filtersObj.accountManager}`,{ headers : this.headers });
  }
  getTodaysJobList(filtersObj : any) : Observable<any[]>
  {
    return this.http.get<any[]>(`${this.API}/Dashboard/GetTodaysJobList?type=${filtersObj.dateRange}&ownerId=${filtersObj.accountManager}`,{ headers : this.headers });
  }
  getWeeklyJobScheduleTrends(filtersObj : any) : Observable<JobScheduleTrend[]>
  {
    return this.http.get<JobScheduleTrend[]>(`${this.API}/Dashboard/GetWeeklyJobScheduleTrends?type=${filtersObj.dateRange}&ownerId=${filtersObj.accountManager}`,{ headers : this.headers });
  }
  getWeeklyTopPerformers(filtersObj : any) : Observable<WeeklyTopPerformers[]>
  {
    return this.http.get<WeeklyTopPerformers[]>(`${this.API}/Dashboard/GetWeeklyTopPerformers?type=${filtersObj.dateRange}&ownerId=${filtersObj.accountManager}`,{ headers : this.headers });
  }
  getCustomerFeedback(filtersObj : any) : Observable<ICustomerFeedback>
  {
    return this.http.get<ICustomerFeedback>(`${this.API}/Dashboard/GetCustomerFeedback?type=${filtersObj.dateRange}&ownerId=${filtersObj.accountManager}`,{ headers : this.headers });
  }



  getToBeWrittenData(filtersObj : any)
  {
    return this.http.get(`${this.API}/quotes/GetQuoteDashboardToBeWrittenCount/${filtersObj.dateRange}/${filtersObj.department}/${filtersObj.accountManager}`,{ headers : this.headers });
  }
  getWeeklyQuotes(filtersObj : any)
  {
    return this.http.get(`${this.API}/quotes/GetQuoteDashboardWeeklyCount/${filtersObj.department}/${filtersObj.accountManager}`,{ headers : this.headers });
  }
  getAccountManagers(dept: string)
  {
    return this.http.get(`${this.API}/quotes/GetManagers/${dept}`,{ headers : this.headers });
  }
  getToBeWrittenQuotesData(filtersObj : any)
  {
    return this.http.get<ToBeWrittenQuotes[]>(`${this.API}/quotes/GetQuoteDashboardToBeWrittenQuotes/${filtersObj.accountManager}`,{ headers : this.headers });
  }
  getRecentActivitiesData(quoteOwner : string)
  {
    return this.http.get<RecentActivities[]>(`${this.API}/quotes/GetQuoteDashBoardRecentActivityLog/${quoteOwner}`,{ headers : this.headers });
  }

  getToBeSentQuotesData(filtersObj : any)
  {
    return this.http.get<ToBeSentQuotes[]>(`${this.API}/quotes/GetQuoteDashboardToBeSentQuotes/${filtersObj.accountManager}`,{ headers : this.headers });
  }
}
