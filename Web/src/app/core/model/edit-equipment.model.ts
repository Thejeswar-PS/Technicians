export interface EditEquipmentInfo {
  // Basic Equipment Info - matching C# DTO exactly
  callNbr: string; // Required in C# DTO
  equipId: number; // Required in C# DTO
  equipNo: string; // Required in C# DTO
  serialID?: string; // Maps to txtSvcSID
  location?: string; // Maps to txtLocation
  vendorId: string; // Required in C# DTO
  version?: string; // Maps to txtVersion
  svC_Asset_Tag?: string; // Maps to txtTag - matches API response case (sometimes lowercase 'tag')
  svC_Asset_tag?: string; // Alternative casing for API compatibility
  contract?: string; // Maps to txtContract
  codeEquipmentStatus?: string; // Maps to ddlStatus
  taskDescription?: string; // Maps to txtDesc
  upskva?: string; // Changed to string to match C# DTO with NumericToStringConverter
  readingType?: string; // Maps to ddlReadingType
  batteriesPerString?: number; // Maps to txtBattNo (BatPerStr in C# DTO)
  equipType: string; // Required in C# DTO
  equipMonth?: string; // Maps to txtDateCodeMonth
  equipYear?: number; // Maps to txtDateCodeYear
  maint_Auth_ID?: string; // Missing property from C# DTO
  
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
  // Parameter names must match C# DTO exactly
  callNbr: string; // Required
  equipId: number; // Required
  equipNo: string; // Required
  vendorId: string; // Required
  equipType: string; // Required
  version?: string;
  serialID?: string;
  svC_Asset_Tag?: string;
  svC_Asset_tag?: string; // Alternative casing for API compatibility
  SVC_Asset_Tag?: string; // Exact casing expected by C# API
  location?: string;
  readingType?: string;
  contract?: string;
  taskDescription?: string;
  batteriesPerString?: number; // BatPerStr in C# DTO
  codeEquipmentStatus?: string; // EquipStatus in C# DTO
  maint_Auth_ID?: string; // MaintAuth in C# DTO
  upskva?: string; // KVA in C# DTO - string type with converter
  equipMonth?: string;
  equipYear?: number;
  dcfCapsPartNo?: string;
  acfipCapsPartNo?: string;
  dcfQty?: number;
  acfipQty?: number;
  dcfCapsMonthName?: string;
  acfipCapsMonthName?: string;
  dcfCapsYear?: number;
  acfipYear?: number;
  dcCommCapsPartNo?: string;
  acfopCapsPartNo?: string;
  dcCommQty?: number;
  acfopQty?: number;
  dcCommCapsMonthName?: string;
  acfopCapsMonthName?: string;
  dcCommCapsYear?: number;
  acfopYear?: number;
  batteriesPerPack?: number;
  vfSelection?: string;
  fansPartNo?: string;
  fansQty?: number;
  fansMonth?: string;
  fansYear?: number;
  blowersPartNo?: string;
  blowersQty?: number;
  blowersMonth?: string;
  blowersYear?: number;
  miscPartNo?: string;
  miscQty?: number;
  miscMonth?: string;
  miscYear?: number;
  comments?: string;
}

// Interface that exactly matches the C# DTO for API requests
export interface EquipmentInsertUpdateDto {
  callNbr: string; // Required - max length 11
  equipId: number; // Required
  equipNo: string; // Required - max length 21
  vendorId: string; // Required - max length 50
  equipType: string; // Required - max length 50
  version?: string; // Optional - max length 50
  serialID?: string; // Optional - max length 50
  svC_Asset_Tag?: string; // Optional - max length 50
  location?: string; // Optional - max length 128
  readingType?: string; // Optional - max length 25
  contract?: string; // Optional - max length 11
  taskDescription?: string; // Optional - max length 128
  batteriesPerString?: number; // Optional - maps to BatPerStr
  codeEquipmentStatus?: string; // Optional - max length 35
  maint_Auth_ID?: string; // Optional - max length 128
  upskva?: string; // Optional - max length 10 - with NumericToStringConverter
  equipMonth?: string; // Optional - max length 50
  equipYear?: number; // Optional
  dcfCapsPartNo?: string; // Optional - max length 50
  acfipCapsPartNo?: string; // Optional - max length 50
  dcfQty?: number; // Optional
  acfipQty?: number; // Optional
  dcfCapsMonthName?: string; // Optional - max length 50
  acfipCapsMonthName?: string; // Optional - max length 50
  dcfCapsYear?: number; // Optional
  acfipYear?: number; // Optional
  dcCommCapsPartNo?: string; // Optional - max length 50
  acfopCapsPartNo?: string; // Optional - max length 50
  dcCommQty?: number; // Optional
  acfopQty?: number; // Optional
  dcCommCapsMonthName?: string; // Optional - max length 50
  acfopCapsMonthName?: string; // Optional - max length 50
  dcCommCapsYear?: number; // Optional
  acfopYear?: number; // Optional
  batteriesPerPack?: number; // Optional
  vfSelection?: string; // Optional - max length 2
  fansPartNo?: string; // Optional - max length 100
  fansQty?: number; // Optional
  fansMonth?: string; // Optional - max length 50
  fansYear?: number; // Optional
  blowersPartNo?: string; // Optional - max length 100
  blowersQty?: number; // Optional
  blowersMonth?: string; // Optional - max length 50
  blowersYear?: number; // Optional
  miscPartNo?: string; // Optional - max length 100
  miscQty?: number; // Optional
  miscMonth?: string; // Optional - max length 50
  miscYear?: number; // Optional
  comments?: string; // Optional - max length 1000
}

export interface UpdateEquipmentResponse {
  Message?: string; // Your API returns { Message: "Equipment inserted or updated successfully" }
  success?: boolean; // Optional for backward compatibility
  message?: string; // Alternative lowercase version
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
    serialID: string;
    location: string;
    equipMonth: string;
    equipYear: number | null;
    codeEquipmentStatus: string;
    equipType: string;
    vfSelection: string;
    batteriesPerPack: number | null;
    batteriesPerString: number | null;
    readingType: string;
    upskva: string | null; // Changed to string to match C# DTO
    vendorId: string;
    version: string;
    svC_Asset_Tag: string;
    contract: string;
    taskDescription: string;
    maint_Auth_ID: string; // Added missing property
  };
  
  capacitorInfo: {
    dcfCapsPartNo: string;
    dcfQty: number | null;
    dcfCapsMonthName: string;
    dcfCapsYear: number | null;
    acfipCapsPartNo: string;
    acfipQty: number | null;
    acfipCapsMonthName: string;
    acfipYear: number | null;
    dcCommCapsPartNo: string;
    dcCommQty: number | null;
    dcCommCapsMonthName: string;
    dcCommCapsYear: number | null;
    acfopCapsPartNo: string;
    acfopQty: number | null;
    acfopCapsMonthName: string;
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

// Board Details Update Request - matching backend DTOs
export interface UpdateEquipBoardInfoRequest {
  equipNo: string;
  equipId: number;
  rows: EquipBoardRow[];
}

export interface EquipBoardRow {
  partNo: string;
  description: string;
  qty: number;
  comments: string;
}