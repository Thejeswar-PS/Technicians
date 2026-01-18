export interface EmergencyJobDto {
  callnbr: string;
  offid: string;
  techid: string;
  custnmbr: string;
  custname: string;
  city: string;
  state: string;
  dispdte?: Date | null;
  accountManager: string;
  name: string; // Technician Name
  changeDate?: Date | null;
  priorityLevel: string;
  jobStatus: string;
  changeAge: number;
}

export interface EmergencyJobsResponseDto {
  success: boolean;
  message: string;
  generatedAt: Date;
  emergencyJobs: EmergencyJobDto[];
  totalRecords: number;
}

export interface EmergencyJobsRequest {
  // Add any filter parameters if needed in the future
}