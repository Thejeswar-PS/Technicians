export interface ExtranetUserClassesDto {
  classID: string;
}

export interface ExtranetCustNumbersDto {
  custNmbr: string;
}

export interface ExtranetUserInfoDto {
  login: string;
  password: string;
  classID: string;
  customerName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  contactName: string;
  email: string;
  viewFinancial: boolean;
  underContract: boolean;
}

export interface ExtranetAddCustnmbrResult {
  message: string;
}

export interface ExtranetSaveUpdateUserDto {
  login: string;
  password: string;
  classID: string;
  customerName: string;
  contactName: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  viewFinancial: boolean;
  underContract: boolean;
}

export interface ExtranetSaveUpdateUserResponse {
  success: boolean;
  message: string;
}

export interface ExtranetDeleteUserResponse {
  message: string;
}

export interface ExtranetDeleteCustnmbrResponse {
  message: string;
}

export interface ExtranetUserClassesApiResponse {
  success: boolean;
  data: ExtranetUserClassesDto[];
  totalRecords: number;
  message: string;
}