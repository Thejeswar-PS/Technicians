export interface Job {
  jobID: string;
  custNmbr: string | null;
  contNbr: string | null;
  custName: string | null;
  svcDescr: string | null;
  city: string | null;
  zip: string;
  accMgr: string | null;
  status: string | null;
  responseDate: string;
  startDt: string;
  description: string | null;
  originalAge: number;
  changeAge: number;
  jobType: string | null;
  createdBy: string | null;
  notes: string | null;
  modifiedBy: string | null;
  createdOn: string;
  modifiedOn: string;
  rowIndex: number;
  groupCheck: string | null;
  contactName: string | null;
  blog: string | null;
  notificationStopDays: number;
  address: string;
  state: string | null;
}
