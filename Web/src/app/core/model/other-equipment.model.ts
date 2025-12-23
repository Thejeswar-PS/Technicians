export interface OtherEquipment {
  callNbr: string;
  equipId: number;
  equipNo: string;
  manufacturer: string;
  modelNo: string;
  serialNo: string;
  location: string;
  equipMonth: string;
  equipYear: number;
  status: string;
  statusNotes: string;
  comments: string;
}

export interface SaveUpdateOtherDto {
  SprocName: string;
  SCCId: string;
  CallNbr: string;
  EquipId: number;
  Manufacturer: string;
  ModelNo: string;
  SerialNo: string;
  Status: string;
  StatusNotes: string;
  Comments: string;
}
