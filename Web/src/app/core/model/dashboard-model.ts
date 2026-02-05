import { ICustomerFeedback } from "./customer-feedback.model"

export interface Dashboardmodel {
  sales? : Sale,
  jobScheduleTrend? : JobScheduleTrend[] | any,
  monthlyUnscheduledJob? : MonthlyUnscheduledJob[] | any,
  recentActivityLog? : RecentActivityLog[] | any,
  customerFeedback? : ICustomerFeedback | any,
  weeklyTopPerformers? : WeeklyTopPerformers[] | any,
  todaysJobList? : any
}

export interface Sale
{
  pastDueCount: number,
  inDiscussion : number,
  toBeSchedCount: number,
  toBeCalled: number,
  toBeSentLetters: number,
  toBeEsclated: number,
  // Tech Dashboard KPI fields
  jobsScheduled?: number,
  jobsToBeUploaded?: number,
  emergencyJobs?: number,
  missingJobs?: number,
  jobsWithParts?: number,
  jobsThisWeek?: number
}
export interface JobScheduleTrend
{
  date: Date,
  jobs: number
}
export interface MonthlyUnscheduledJob
{
  monthName: string,
  jobs: number,
  year: number,
  monthNo: number
}
export interface RecentActivityLog
{
  jobID: string,
  accMgr: string,
  statusChanged: string,
  date2: string,
  message: string,
  comments: string
}
export interface WeeklyTopPerformers
{
  offName: string,
  quotesWritten: number,
  jobScheduled: number,
  jobsProcessed: number,
  teamRank: number
}
