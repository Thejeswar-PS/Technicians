export interface EquipmentDetail {
  equipId: number;
  equipNo: string;
  vendorId: string;
  version: string;
  serialID: string;
  rating: string;
  location: string;
  codeEquipmentStatus: string;
  create_Date: string;
  last_Modifed: string;
  maint_Auth_ID: string;
  equipType: string;
  readingType: string;
  batteriesPerString: number;
  upskva: number;
  batteriesPerPack: number;
  probcde: string;
  scheduled: string;
  saveStatus: string;
  taskDescription?: string;
  dateCode?: string;
}

export interface UploadInfo {
  UploadedBy: string;
  UploadJobDt: Date;
  Type: string;
}

export interface EquipmentDetailsParams {
  callNbr: string;
  techName: string;
  techId: string;
  archive: string;
  year: string;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  errorCode?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
  redirectUrl?: string;
}

export interface EquipmentInsertUpdateDto {
  callNbr: string;
  equipId: number;
  equipNo: string;
  vendorId: string;
  equipType: string;
  version: string;
  serialID: string;
  svc_Asset_Tag: string;
  location: string;
  readingType: string;
  contract: string;
  taskDesc: string;
  batPerStr: number;
  equipStatus: string;
  maintAuth: string;
  kva: string;
  equipMonth: string;
  equipYear: number;
  dcfCapsPartNo: string;
  acfipCapsPartNo: string;
  dcfQty: number;
  acfipQty: number;
  dcfCapsMonthName: string;
  acfipCapsMonthName: string;
  dcfCapsYear: number;
  acfipYear: number;
  dcCommCapsPartNo: string;
  acfopCapsPartNo: string;
  dcCommQty: number;
  acfopQty: number;
  dcCommCapsMonthName: string;
  acfopCapsMonthName: string;
  dcCommCapsYear: number;
  acfopYear: number;
  batteriesPerPack: number;
  vfSelection: string;
  fansPartNo: string;
  fansQty: number;
  fansMonth: string;
  fansYear: number;
  blowersPartNo: string;
  blowersQty: number;
  blowersMonth: string;
  blowersYear: number;
  miscPartNo: string;
  miscQty: number;
  miscMonth: string;
  miscYear: number;
  comments: string;
}

export interface EquipBoardInfoDto {
  equipNo: string;
  equipId: number;
  rowId: number;
  partNo: string;
  description: string;
  qty?: number;
  comments: string;
  lastModifiedOn?: Date;
  lastModifiedBy: string;
}

export interface DeleteEquipmentDto {
  callNbr: string;
  equipNo: string;
  equipId: number;
}