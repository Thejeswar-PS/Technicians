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



export interface EquipmentImage {
  img_ID: number;
  callNbr: string;
  equipID: number;
  equipNo: string;
  techName: string;
  techID: string;
  img_Title: string;
  img_Type: string;
  img_stream?: string; // Base64 encoded image data
  created_On?: Date;
}

export interface EquipmentImageUpload {
  callNbr: string;
  equipID: number;
  equipNo: string;
  techName: string;
  techID: string;
  img_Title: string;
  img_Type: string;
  imgFile: File;
}

export interface DeleteEquipmentImage {
  imgId: number;
}

