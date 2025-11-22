export interface AccountManager {
  empName?: string;
  empId?: string;
  OFFNAME?: string;
  OFFID?: string;
  // Additional properties for different API response formats
  offname?: string;
  offName?: string;
  offid?: string;
  id?: string;
  name?: string;
  managerName?: string;
  username?: string;
}

export interface AccountManagerResponse {
  success: boolean;
  data: AccountManager[];
  message?: string;
}