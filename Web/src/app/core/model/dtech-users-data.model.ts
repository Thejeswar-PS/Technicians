export interface DTechUsersDataRequest {
  login?: string;
  siteID?: string;
  custName?: string;
  address?: string;
  phone?: string;
  email?: string;
  contact?: string;
  svcSerialId?: string;
}

export interface DTechUsersDataDto {
  login: string;
  password: string;
  siteID: string;
  custName: string;
  address: string;
  contact: string;
  phone: string;
  email: string;
  lastLoggedIn: Date;
  lastChangedPwd: Date;
}

export interface DTechUsersDataResponse {
  usersData: DTechUsersDataDto[];
  totalRecords: number;
  isFiltered: boolean;
  filterCriteria?: DTechUsersDataRequest;
}

export interface DTechUsersDataApiResponse {
  success: boolean;
  data: DTechUsersDataResponse;
  totalRecords: number;
  isFiltered: boolean;
  filterCriteria?: DTechUsersDataRequest;
  message?: string;
  error?: string;
}

export interface DTechUsersDataSummary {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  usersBySite: { [key: string]: number };
  lastLoginDate?: Date;
  oldestPasswordDate?: Date;
}

// Filter options for the UI
export interface DTechUsersDataFilter {
  login: string;
  siteID: string;
  custName: string;
  address: string;
  email: string;
  contact: string;
  svcSerialId: string;
}