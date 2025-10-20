export interface EditEquipmentInfo {
  // Basic Equipment Info - matching your legacy DisplayEquipment() method
  callNbr?: string;
  equipId: number;
  equipNo: string;
  serialID?: string; // Maps to txtSvcSID
  location?: string; // Maps to txtLocation
  vendorId?: string; // Maps to txtVendorID
  version?: string; // Maps to txtVersion
  svC_Asset_Tag?: string; // Maps to txtTag - matches API response case
  contract?: string; // Maps to txtContract
  codeEquipmentStatus?: string; // Maps to ddlStatus
  taskDescription?: string; // Maps to txtDesc
  upskva?: number; // Maps to txtKVA
  readingType?: string; // Maps to ddlReadingType
  batteriesPerString?: number; // Maps to txtBattNo
  equipType?: string; // Maps to ddlEquipType
  equipMonth?: string; // Maps to txtDateCodeMonth
  equipYear?: number; // Maps to txtDateCodeYear
  
  // Capacitor Information - matching your legacy code
  dcfCapsPartNo?: string; // Maps to txtDCFCapsNo
  acfipCapsPartNo?: string; // Maps to txtACFIPCapsNo
  dcfQty?: number; // Maps to txtDCFQty
  acfipQty?: number; // Maps to txtACFQty
  dcfCapsMonthName?: string; // Maps to txtDCFMonth
  acfipCapsMonthName?: string; // Maps to txtACFMonth
  dcfCapsYear?: number; // Maps to txtDCFYear
  acfipYear?: number; // Maps to txtACFYear
  
  dcCommCapsPartNo?: string; // Maps to txtDCCommPartNo
  acfopCapsPartNo?: string; // Maps to txtACFOPPartsNo
  dcCommQty?: number; // Maps to txtCommQty
  acfopQty?: number; // Maps to txtACFOPQty
  dcCommCapsMonthName?: string; // Maps to txtCommMonth
  acfopCapsMonthName?: string; // Maps to txtACFOPMonth
  dcCommCapsYear?: number; // Maps to txtCommYear
  acfopYear?: number; // Maps to txtACFOPYear
  
  batteriesPerPack?: number; // Maps to txtPackNo
  vfSelection?: string; // Maps to ddlFloatVoltS
  
  // Fans, Blowers, Miscellaneous
  fansPartNo?: string; // Maps to txtFansPartsNo
  fansQty?: number; // Maps to txtFansQty
  fansMonth?: string; // Maps to txtFansMonth
  fansYear?: number; // Maps to txtFansYear
  
  blowersPartNo?: string; // Maps to txtBlowersPartsNo
  blowersQty?: number; // Maps to txtBlowersQty
  blowersMonth?: string; // Maps to txtBlowersMonth
  blowersYear?: number; // Maps to txtBlowersYear
  
  miscPartNo?: string; // Maps to txtMiscPartNo
  miscQty?: number; // Maps to txtMiscQty
  miscMonth?: string; // Maps to txtMiscMonth
  miscYear?: number; // Maps to txtMiscYear
  
  // Comments
  comments?: string; // Maps to txtCapsComments
  
  // Metadata
  lastModifiedOn?: Date;
  lastModifiedBy?: string;
}

export interface EquipBoardDetail {
  equipNo: string;
  equipID: number;
  rowID: number;
  partNo: string;
  description: string;
  qty?: number;
  comments: string;
  lastModifiedOn?: Date;
  lastModifiedBy?: string;
}

export interface UpdateEquipmentRequest {
  // Parameter names must match stored procedure exactly
  CallNbr: string;
  EquipId: number;
  EquipNo: string;
  VendorId?: string;
  EquipType: string;
  Version?: string;
  SerialID?: string;
  SVC_Asset_Tag?: string;
  Location?: string;
  ReadingType?: string;
  Contract?: string;
  TaskDesc?: string;
  BatPerStr?: number;
  EquipStatus: string;
  MaintAuth?: string;
  KVA?: string;
  EquipMonth?: string;
  EquipYear?: number;
  DCFCapsPartNo?: string;
  ACFIPCapsPartNo?: string;
  DCFQty?: number;
  ACFIPQty?: number;
  DCFCapsMonthName?: string;
  ACFIPCapsMonthName?: string;
  DCFCapsYear?: number;  // Backend DTO uses DCFCapsYear (with F)
  ACFIPYear?: number;
  DCCommCapsPartNo?: string;
  ACFOPCapsPartNo?: string;
  DCCommQty?: number;
  ACFOPQty?: number;
  DCCommCapsMonthName?: string;
  ACFOPCapsMonthName?: string;
  DCCommCapsYear?: number;
  ACFOPYear?: number;
  BatteriesPerPack?: number;
  VFSelection?: string;
  FansPartNo?: string;
  FansQty?: number;
  FansMonth?: string;
  FansYear?: number;
  BlowersPartNo?: string;
  BlowersQty?: number;
  BlowersMonth?: string;
  BlowersYear?: number;
  MiscPartNo?: string;
  MiscQty?: number;
  MiscMonth?: string;
  MiscYear?: number;
  Comments?: string;
}

export interface UpdateEquipmentResponse {
  success: boolean;
  message: string;
  equipId?: number;
  errorCode?: string;
}

// Constants for dropdowns
export const EQUIPMENT_STATUS_OPTIONS = [
  { value: 'Online', label: 'On-Line' },
  { value: 'CriticalDeficiency', label: 'Critical Deficiency' },
  { value: 'ReplacementRecommended', label: 'Replacement Recommended' },
  { value: 'ProactiveReplacement', label: 'Proactive Replacement' },
  { value: 'OnLine(MajorDeficiency)', label: 'On-Line(Major Deficiency)' },
  { value: 'OnLine(MinorDeficiency)', label: 'On-Line(Minor Deficiency)' },
  { value: 'Offline', label: 'Off-Line' }
];

export const EQUIPMENT_TYPE_OPTIONS = [
  { value: 'SELECT', label: 'Please select type' },
  { value: 'ATS', label: 'ATS' },
  { value: 'BATTERY', label: 'BATTERY' },
  { value: 'FLYWHEEL', label: 'FLYWHEEL' },
  { value: 'GENERATOR', label: 'GENERATOR' },
  { value: 'INVERTER', label: 'INVERTER' },
  { value: 'HVAC', label: 'HVAC' },
  { value: 'PDU', label: 'PDU' },
  { value: 'RECTIFIER', label: 'RECTIFIER' },
  { value: 'REMOTE STATUS PANEL', label: 'REMOTE STATUS PANEL' },
  { value: 'SCC', label: 'SCC' },
  { value: 'STATIC SWITCH', label: 'STATIC SWITCH' },
  { value: 'SYSTEM CONTROL CABINET', label: 'SYSTEM CONTROL CABINET' },
  { value: 'UPS', label: 'UPS' }
];

export const FLOAT_VOLTAGE_OPTIONS = [
  { value: 'PS', label: 'Please Select' },
  { value: 'OF', label: 'Offline' },
  { value: 'ON', label: 'Online' },
  { value: 'BP', label: 'Battery Packs' }
];

export const READING_TYPE_OPTIONS = [
  { value: '1', label: 'Multimeter' },
  { value: '2', label: 'Midtronics / Fluke' },
  { value: '3', label: 'Battery Packs' }
];

// Form validation interface
export interface EditEquipmentFormData {
  basicInfo: {
    callNbr: string;
    equipNo: string;
    serialId: string;
    location: string;
    dateCodeMonth: string;
    dateCodeYear: number | null;
    status: string;
    equipType: string;
    floatVoltageSelection: string;
    batteryPackCount: number | null;
    batteriesPerString: number | null;
    readingType: string;
    kva: number | null;
    vendorId: string;
    version: string;
    tag: string;
    contract: string;
    taskDescription: string;
  };
  
  capacitorInfo: {
    dcfCapsPartNo: string;
    dcfQty: number | null;
    dcfMonth: string;
    dcfYear: number | null;
    acfipCapsPartNo: string;
    acfQty: number | null;
    acfMonth: string;
    acfYear: number | null;
    dcCommCapsPartNo: string;
    commQty: number | null;
    commMonth: string;
    commYear: number | null;
    acfopCapsPartNo: string;
    acfopQty: number | null;
    acfopMonth: string;
    acfopYear: number | null;
    fansPartNo: string;
    fansQty: number | null;
    fansMonth: string;
    fansYear: number | null;
    blowersPartNo: string;
    blowersQty: number | null;
    blowersMonth: string;
    blowersYear: number | null;
    miscPartNo: string;
    miscQty: number | null;
    miscMonth: string;
    miscYear: number | null;
    comments: string;
  };
}