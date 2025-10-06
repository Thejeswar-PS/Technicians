export interface Job {
  // Primary properties matching JobDto (camelCase conversion from PascalCase)
  callNbr: string;
  description: string | null;
  custName: string | null;
  status: string | null;
  techName: string | null;
  techId: string | null;
  address: string | null;
  accMgr: string | null;
  archive: string | null;
  svcDescr: string | null;
  strDate: string | null; // Maps to StrDate from DTO
  strtTime: string | null; // Maps to StrtTime from DTO  
  returnJob: string | null; // Maps to ReturnJob from DTO
  
  // Additional properties for backward compatibility
  jobID?: string; // Fallback for job.callNbr || job.jobID
  techID?: string; // Fallback for job.techId
  strtDate?: string; // Fallback for job.strDate
  
  // Keep some existing properties that might still be used
  custNmbr?: string | null;
  contNbr?: string | null;
  city?: string | null;
  zip?: string;
  responseDate?: string;
  startDt?: string;
  originalAge?: number;
  changeAge?: number;
  jobType?: string | null;
  createdBy?: string | null;
  notes?: string | null;
  modifiedBy?: string | null;
  createdOn?: string;
  modifiedOn?: string;
  rowIndex?: number;
  groupCheck?: string | null;
  contactName?: string | null;
  blog?: string | null;
  notificationStopDays?: number;
  state?: string | null;
}
