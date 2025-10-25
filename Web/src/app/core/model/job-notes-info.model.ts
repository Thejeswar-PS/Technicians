// Job Notes Information models based on JobNotesInfo.aspx.cs

export interface JobInformation {
  callNbr: string;
  status: string;
  custNmbr: string;
  ponumber: string;
  techName: string;
  custName: string;
  addr1: string;
  techCell: string;
  techPhone: string;
  contType: string;
  contact: string;
  techEmail: string;
  contactPhone: string;
  accMgr: string;
  strtDate: string;
  strtTime: string;
  svcDescr: string;
  recordNotes: string;
  pmVisualNotes: string;
  qtePriority: string;
  country: string;
  defCheck: number; // API returns 0 or 1, not boolean
}

export interface EquipReconciliationInfo {
  callNbr: string;
  equipID: number;
  newEquipment: string;
  equipmentNotes: string;
}

export interface EquipmentDetail {
  equipID: number;
  equipId?: number;
  equipNo: string;
  vendorId: string;
  version: string;
  rating: string;
  serialID: string;
  location: string;
  equipType: string;
  taskDescription: string;
  dateCode: string;
}

export interface TechNote {
  equipID: number;
  equipNo: string;
  vendorId: string;
  version: string;
  rating: string;
  serialID: string;
  location: string;
  noteText: string;
}

export interface DeficiencyNote {
  equipID: number;
  equipNo: string;
  columnName: string;
  batteryID: string;
  deficiency: string;
  action: string;
  status: string;
  tag: string;
  location: string;
  serialNo: string;
}

export interface JobNotesFormData {
  quotePriority: string;
  reconciliationNewEquip: string;
  reconciliationNotes: string;
  deficiencyNotesVerified: boolean;
  techNotes: TechNote[];
}

export interface UpdateJobRequest {
  callNbr: string;
  svcDescr: string;
  pmVisualNotes: string;
  techName: string;
  qtePriority: string;
  chkNotes: boolean;
  changeby?: string;
}

export interface JobNotesParams {
  callNbr: string;
  techName: string;
  status?: string;
}

// Options for form dropdowns/checkboxes
export const QUOTE_PRIORITY_OPTIONS = [
  { label: 'Normal Quote', value: 'NQ' },
  { label: 'Critical Quote', value: 'CQ' },
  { label: 'No Quote', value: 'OQ' }
];

export const RECONCILIATION_OPTIONS = [
  { label: 'Yes', value: 'YS' },
  { label: 'No', value: 'NO' }
];