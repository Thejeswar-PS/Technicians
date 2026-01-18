// Account Manager Graph Models
export interface AcctStatusGraphDto {
  completedcosting: number;
  invoicedyesterdate: number;
  completedFScosting: number;
  invoicedtoday: number;
  invoicemonthtodate: number;
  contractInvoicemonthtodate: number;
  completedparts: number;
  completedTechReview: number;
  completedMngrReview: number;
  missingData: number;
  liebertJobsToInvoice: number;
  nonFSJobstoInvoice: number;
  fsJobstoInvoice: number;
  waitingForContract: number;
  miscpos: number;
  pos: number;
}

export interface AccMgmtGraphDto {
  pastUnscheduled: number;
  unscheduledNext90: number;
  pending30: number;
  scheduled30: number;
  scheduled60: number;
  scheduled7days: number;
  scheduled72hours: number;
  scheduledtoday: number;
  completednotreturned: number;
  completedreturned: number;
  missingData: number;
  quotesToComplete: number;
  downSites: number;
  problemDownSites: number;
}

export interface AccountManagerPaperworkDto {
  offid: string;
  jobs: number;
}

export interface AccountManagerGraphResponse {
  success: boolean;
  message?: string;
  data?: AcctStatusGraphDto | AccMgmtGraphDto | AccountManagerPaperworkDto[];
}