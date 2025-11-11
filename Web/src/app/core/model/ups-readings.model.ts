/**
 * UPS Readings Data Models
 * Converted from C# UPSReadings.aspx.cs data structures
 */

export interface ManufacturerOption {
  value: string;
  text: string;
}

export interface EquipReconciliationInfo {
  callNbr: string;
  equipId: number;
  make: string;
  makeCorrect: string;
  actMake: string;
  model: string;
  modelCorrect: string;
  actModel: string;
  serialNo: string;
  serialNoCorrect: string;
  actSerialNo: string;
  kva: string;
  kvaCorrect: string;
  actKVA: string;
  ascStringsNo: number;
  ascStringsCorrect: string;
  actASCStringNo: number;
  battPerString: number;
  battPerStringCorrect: string;
  actBattPerString: number;
  totalEquips: number;
  totalEquipsCorrect: string;
  actTotalEquips: number;
  verified: boolean;
}

export interface AAETechUPS {
  upsId: string;
  callNbr: string;
  equipId: number;
  manufacturer: string;
  kva: string;
  multiModule: string;
  maintByPass: string;
  other: string;
  modelNo: string;
  serialNo: string;
  location: string;
  status: string;
  statusReason: string;
  parallelCabinet: string;
  snmpPresent: string;
  modularUPS: string;
  ctoPartNo?: string; // Added CTO/Part No field
  upsType?: string; // Added UPS Type field
  
  // Measurement flags
  measure_Input: string;
  measure_LCD: string;
  measure_Load: string;
  measure_3Phase: string;
  measure_KVA: string;
  measure_Normal: string;
  measure_Caliberation: string;
  measure_EOL: string;
  
  // Visual inspection flags
  visual_NoAlarms: string;
  visual_Tightness: string;
  visual_Broken: string;
  visual_Vaccum: string;
  visual_EPO: string;
  visual_Noise: string;
  visual_FansAge: string;
  visual_ReplaceFilters: string;
  
  // Environment flags
  environment_RoomTemp: string;
  environment_Saftey: string;
  environment_Clean: string;
  environment_Space: string;
  environment_Circuit: string;
  
  // Transfer test flags
  transfer_Major: string;
  transfer_Static: string;
  transfer_ByPass: string;
  transfer_Wave: string;
  transfer_Normal: string;
  transfer_Alarm: string;
  
  // Comments
  comments1: string;
  comments2: string;
  comments3: string;
  comments4: string;
  comments5: string;
  
  // Air filter data
  afLength: string;
  afWidth: string;
  afThick: string;
  afQty: string;
  afLength1: string;
  afWidth1: string;
  afThick1: string;
  afQty1: string;
  
  // Date information
  monthName: string;
  year: number;
  
  // Input voltage configuration and readings
  input: string;
  inputVoltA_T: number;
  inputVoltA_PF: string;
  inputVoltB_T: number;
  inputVoltB_PF: string;
  inputVoltC_T: number;
  inputVoltC_PF: string;
  inputCurrA_T: number;
  inputCurrA_PF: string;
  inputCurrB_T: number;
  inputCurrB_PF: string;
  inputCurrC_T: number;
  inputCurrC_PF: string;
  inputFreq_T: number;
  inputFreq_PF: string;
  
  // Bypass voltage configuration and readings
  bypass: string;
  bypassVoltA_T: number;
  bypassVoltA_PF: string;
  bypassVoltB_T: number;
  bypassVoltB_PF: string;
  bypassVoltC_T: number;
  bypassVoltC_PF: string;
  bypassCurrA_T: number;
  bypassCurrA_PF: string;
  bypassCurrB_T: number;
  bypassCurrB_PF: string;
  bypassCurrC_T: number;
  bypassCurrC_PF: string;
  bypassFreq_T: number;
  bypassFreq_PF: string;
  
  // Output voltage configuration and readings
  output: string;
  outputVoltA_T: number;
  outputVoltA_PF: string;
  outputVoltB_T: number;
  outputVoltB_PF: string;
  outputVoltC_T: number;
  outputVoltC_PF: string;
  outputCurrA_T: number;
  outputCurrA_PF: string;
  outputCurrB_T: number;
  outputCurrB_PF: string;
  outputCurrC_T: number;
  outputCurrC_PF: string;
  outputFreq_T: number;
  outputFreq_PF: string;
  outputLoadA: number;
  outputLoadA_PF: string;
  outputLoadB: number;
  outputLoadB_PF: string;
  outputLoadC: number;
  outputLoadC_PF: string;
  totalLoad: number;
  
  // Rectifier readings
  rectFloatVolt_PF: string;
  dcVoltage_T: number;
  dcVoltage_PF: string;
  acRipple_T: number;
  acRipple_PF: string;
  dcCurrent_T: number;
  dcCurrent_PF: string;
  acRippleVolt_T: number;
  acRippleVolt_PF: string;
  posToGND_T: number;
  posToGND_PF: string;
  acRippleCurr_T: number;
  acRippleCurr_PF: string;
  negToGND_T: number;
  negToGND_PF: string;
  
  // Capacitor information
  dcCapsLeak_PF: string;
  dcCapsAge_PF: string;
  dcCapsYear: number;
  acInputCapsLeak_PF: string;
  acInputCapsAge_PF: string;
  acInputCapsYear: number;
  acOutputCapsLeak_PF: string;
  acOutputCapsAge_PF: string;
  acOutputCapsYear: number;
  commCapsLeak_PF: string;
  commCapsAge_PF: string;
  commCapsYear: number;
  
  // Fan information
  fansYear: number;
  
  // Action items
  dcgAction1: string;
  custAction1: string;
  manufSpecification: string;
  dcgAction2: string;
  custAction2: string;
  
  // Service description and maintenance info
  svcDescr: string;
  maintAuthId: string;
  saveAsDraft: boolean;
  
  // Battery string info
  batteryStringID: number;
  
  // Check flags
  chkDCBreak: boolean;
  chkFault: boolean;
  chkOverLoad: boolean;
  chkTransfer: boolean;
}

export interface VoltageConfiguration {
  id: string;
  name: string;
  phaseCount: number;
  showPhaseToNeutral: boolean;
  fields: VoltageField[];
}

export interface VoltageField {
  id: string;
  label: string;
  type: 'voltage' | 'current' | 'frequency' | 'load';
  required: boolean;
}

export interface UpdateEquipStatus {
  callNbr: string;
  equipId: number;
  status: string;
  notes?: string;
  tableName: string;
  manufacturer?: string;
  modelNo?: string;
  serialNo?: string;
  location?: string;
  maintAuthID?: string;
  monthName?: string;
  year: number;
  readingType?: string;
  batteriesPerString: number;
  batteriesPerPack: number;
  vfSelection?: string;
}

export interface StatusOption {
  value: string;
  text: string;
}

export interface PassFailOption {
  value: string;
  text: string;
}

export interface UPSReadingsFormData {
  // Equipment verification section
  manufacturer: string;
  kva: string;
  multiModule: string;
  maintByPass: string;
  other: string;
  model: string;
  serialNo: string;
  location: string;
  dateCode: string;
  status: string;
  statusNotes: string;
  
  // Equipment reconciliation
  reconciliation: EquipReconciliationInfo;
  
  // UPS readings data
  upsData: AAETechUPS;
  
  // Form state
  isDraft: boolean;
  isValid: boolean;
}

// Voltage configuration constants
export const VOLTAGE_CONFIGURATIONS: VoltageConfiguration[] = [
  // Single Phase (Phase I)
  {
    id: '1',
    name: '120 I Phase',
    phaseCount: 1,
    showPhaseToNeutral: false,
    fields: [
      { id: 'voltA', label: 'Voltage A', type: 'voltage', required: true },
      { id: 'currA', label: 'Current A', type: 'current', required: true },
      { id: 'freq', label: 'Frequency', type: 'frequency', required: true }
    ]
  },
  {
    id: '7',
    name: '208 I Phase',
    phaseCount: 1,
    showPhaseToNeutral: false,
    fields: [
      { id: 'voltA', label: 'Voltage A', type: 'voltage', required: true },
      { id: 'currA', label: 'Current A', type: 'current', required: true },
      { id: 'freq', label: 'Frequency', type: 'frequency', required: true }
    ]
  },
  {
    id: '10',
    name: '277 I Phase',
    phaseCount: 1,
    showPhaseToNeutral: false,
    fields: [
      { id: 'voltA', label: 'Voltage A', type: 'voltage', required: true },
      { id: 'currA', label: 'Current A', type: 'current', required: true },
      { id: 'freq', label: 'Frequency', type: 'frequency', required: true }
    ]
  },
  {
    id: '9',
    name: '480 I Phase',
    phaseCount: 1,
    showPhaseToNeutral: false,
    fields: [
      { id: 'voltA', label: 'Voltage A', type: 'voltage', required: true },
      { id: 'currA', label: 'Current A', type: 'current', required: true },
      { id: 'freq', label: 'Frequency', type: 'frequency', required: true }
    ]
  },
  // Two Phase (Phase II)
  {
    id: '2',
    name: '240 II Phase',
    phaseCount: 2,
    showPhaseToNeutral: false,
    fields: [
      { id: 'voltA', label: 'Voltage A', type: 'voltage', required: true },
      { id: 'currA', label: 'Current A', type: 'current', required: true },
      { id: 'voltB', label: 'Voltage B', type: 'voltage', required: true },
      { id: 'currB', label: 'Current B', type: 'current', required: true },
      { id: 'freq', label: 'Frequency', type: 'frequency', required: true }
    ]
  },
  {
    id: '8',
    name: '208 II Phase',
    phaseCount: 2,
    showPhaseToNeutral: false,
    fields: [
      { id: 'voltA', label: 'Voltage A', type: 'voltage', required: true },
      { id: 'currA', label: 'Current A', type: 'current', required: true },
      { id: 'voltB', label: 'Voltage B', type: 'voltage', required: true },
      { id: 'currB', label: 'Current B', type: 'current', required: true },
      { id: 'freq', label: 'Frequency', type: 'frequency', required: true }
    ]
  },
  // Three Phase (Phase III)
  {
    id: '3',
    name: '208 III Phase',
    phaseCount: 3,
    showPhaseToNeutral: true,
    fields: [
      { id: 'voltAtoB', label: 'Voltage A to B', type: 'voltage', required: true },
      { id: 'currA', label: 'Current A', type: 'current', required: true },
      { id: 'voltBtoC', label: 'Voltage B to C', type: 'voltage', required: true },
      { id: 'currB', label: 'Current B', type: 'current', required: true },
      { id: 'voltCtoA', label: 'Voltage C to A', type: 'voltage', required: true },
      { id: 'currC', label: 'Current C', type: 'current', required: true },
      { id: 'freq', label: 'Frequency', type: 'frequency', required: true }
    ]
  },
  {
    id: '11',
    name: '400 III Phase',
    phaseCount: 3,
    showPhaseToNeutral: true,
    fields: [
      { id: 'voltAtoB', label: 'Voltage A to B', type: 'voltage', required: true },
      { id: 'currA', label: 'Current A', type: 'current', required: true },
      { id: 'voltBtoC', label: 'Voltage B to C', type: 'voltage', required: true },
      { id: 'currB', label: 'Current B', type: 'current', required: true },
      { id: 'voltCtoA', label: 'Voltage C to A', type: 'voltage', required: true },
      { id: 'currC', label: 'Current C', type: 'current', required: true },
      { id: 'freq', label:'Frequency', type: 'frequency', required: true }
    ]
  },
  {
    id: '4',
    name: '480 III Phase',
    phaseCount: 3,
    showPhaseToNeutral: true,
    fields: [
      { id: 'voltAtoB', label: 'Voltage A to B', type: 'voltage', required: true },
      { id: 'currA', label: 'Current A', type: 'current', required: true },
      { id: 'voltBtoC', label: 'Voltage B to C', type: 'voltage', required: true },
      { id: 'currB', label: 'Current B', type: 'current', required: true },
      { id: 'voltCtoA', label: 'Voltage C to A', type: 'voltage', required: true },
      { id: 'currC', label: 'Current C', type: 'current', required: true },
      { id: 'freq', label: 'Frequency', type: 'frequency', required: true }
    ]
  },
  {
    id: '6',
    name: '575 III Phase',
    phaseCount: 3,
    showPhaseToNeutral: true,
    fields: [
      { id: 'voltAtoB', label: 'Voltage A to B', type: 'voltage', required: true },
      { id: 'currA', label: 'Current A', type: 'current', required: true },
      { id: 'voltBtoC', label: 'Voltage B to C', type: 'voltage', required: true },
      { id: 'currB', label: 'Current B', type: 'current', required: true },
      { id: 'voltCtoA', label: 'Voltage C to A', type: 'voltage', required: true },
      { id: 'currC', label: 'Current C', type: 'current', required: true },
      { id: 'freq', label: 'Frequency', type: 'frequency', required: true }
    ]
  },
  {
    id: '5',
    name: '600 III Phase',
    phaseCount: 3,
    showPhaseToNeutral: true,
    fields: [
      { id: 'voltAtoB', label: 'Voltage A to B', type: 'voltage', required: true },
      { id: 'currA', label: 'Current A', type: 'current', required: true },
      { id: 'voltBtoC', label: 'Voltage B to C', type: 'voltage', required: true },
      { id: 'currB', label: 'Current B', type: 'current', required: true },
      { id: 'voltCtoA', label: 'Voltage C to A', type: 'voltage', required: true },
      { id: 'currC', label: 'Current C', type: 'current', required: true },
      { id: 'freq', label: 'Frequency', type: 'frequency', required: true }
    ]
  }
];

export const PASS_FAIL_OPTIONS: PassFailOption[] = [
  { value: 'P', text: 'Pass' },
  { value: 'F', text: 'Fail' },
  { value: 'N', text: 'N/A' }
];

export const POWER_VERIFICATION_OPTIONS: PassFailOption[] = [
  { value: 'P', text: 'Pass' },
  { value: 'F', text: 'Fail' },
  { value: 'N', text: 'N/A' }
];

export const YES_NO_OPTIONS = [
  { value: 'YES', text: 'Yes' },
  { value: 'NO', text: 'No' }
];

export const SNMP_OPTIONS = [
  { value: 'PS', text: 'Select' },
  { value: 'NO', text: 'No' },
  { value: 'YS', text: 'Yes' }
];

export const STATUS_OPTIONS: StatusOption[] = [
  { value: 'Online', text: 'On-Line' },
  { value: 'CriticalDeficiency', text: 'Critical Deficiency' },
  { value: 'ReplacementRecommended', text: 'Replacement Recommended' },
  { value: 'ProactiveReplacement', text: 'Proactive Replacement' },
  { value: 'OnLine(MajorDeficiency)', text: 'On-Line(Major Deficiency)' },
  { value: 'OnLine(MinorDeficiency)', text: 'On-Line(Minor Deficiency)' },
  { value: 'Offline', text: 'Off-Line' }
];

export interface EquipFilterCurrents {
  callNbr: string;
  equipId: number;
  chkIPFilter?: boolean;
  chkIPTHD?: boolean;
  
  // Input Filter Current Phase A
  ipFilterCurrA_T?: number;
  ipFilterCurrA_PF?: string;
  
  // Input Filter Current Phase B
  ipFilterCurrB_T?: number;
  ipFilterCurrB_PF?: string;
  
  // Input Filter Current Phase C
  ipFilterCurrC_T?: number;
  ipFilterCurrC_PF?: string;
  
  // Input Filter THD Phase A
  ipFilterThdA_T?: number;
  ipFilterThdA_PF?: string;
  
  // Input Filter THD Phase B
  ipFilterThdB_T?: number;
  ipFilterThdB_PF?: string;
  
  // Input Filter THD Phase C
  ipFilterThdC_T?: number;
  ipFilterThdC_PF?: string;
  
  chkOPFilter?: boolean;
  chkOPTHD?: boolean;
  
  // Output Filter Current Phase A
  opFilterCurrA_T?: number;
  opFilterCurrA_PF?: string;
  
  // Output Filter Current Phase B
  opFilterCurrB_T?: number;
  opFilterCurrB_PF?: string;
  
  // Output Filter Current Phase C
  opFilterCurrC_T?: number;
  opFilterCurrC_PF?: string;
  
  // Output Filter THD Phase A
  opFilterThdA_T?: number;
  opFilterThdA_PF?: string;
  
  // Output Filter THD Phase B
  opFilterThdB_T?: number;
  opFilterThdB_PF?: string;
  
  // Output Filter THD Phase C
  opFilterThdC_T?: number;
  opFilterThdC_PF?: string;
  
  modifiedBy?: string;
}

/**
 * SaveUpdateaaETechUPS DTO - Comprehensive UPS data for save/update operations
 * Maps to the C# SaveUpdateaaETechUPSDto model and stored procedure parameters
 */
export interface SaveUpdateaaETechUPSDto {
  // Required Keys
  callNbr: string;
  equipId: number;
  upsId: string;

  // Basic info - Match C# backend field names (PascalCase)
  Manufacturer?: string;
  KVA?: string;
  MultiModule?: string;
  MaintByPass?: string;
  Other?: string;
  ModelNo?: string;
  SerialNo?: string;
  Status?: string;
  ParallelCabinet?: string;

  // Measurement info - Match C# backend field names (PascalCase)
  Measure_Input?: string;
  Measure_LCD?: string;
  Measure_Load?: string;
  Measure_3Phase?: string;
  Measure_KVA?: string;
  Measure_Normal?: string;
  Measure_Caliberation?: string;
  Measure_EOL?: string;

  // Visual info - Match C# backend field names (PascalCase)
  Visual_NoAlarms?: string;
  Visual_Tightness?: string;
  Visual_Broken?: string;
  Visual_Vaccum?: string;
  Visual_EPO?: string;
  Visual_Noise?: string;
  Visual_FansAge?: string;
  Visual_ReplaceFilters?: string;

  // Environment info - Match C# backend field names (PascalCase)
  Environment_RoomTemp?: string;
  Environment_Saftey?: string;
  Environment_Clean?: string;
  Environment_Space?: string;
  Environment_Circuit?: string;

  // Transfer info - Match C# backend field names (PascalCase)
  Transfer_Major?: string;
  Transfer_Static?: string;
  Transfer_ByPass?: string;
  Transfer_Wave?: string;
  Transfer_Normal?: string;
  Transfer_Alarm?: string;

  // Comments - Match C# backend field names (PascalCase)
  Comments1?: string;
  Comments2?: string;
  Comments3?: string;
  Comments4?: string;
  Comments5?: string;

  // Date Code - Match C# backend field names (PascalCase)
  DateCodeMonth?: string;
  DateCodeYear: number;
  StatusReason?: string;

  // Checkboxes
  chkDCBreak: boolean;
  chkOverLoad: boolean;
  chkTransfer: boolean;
  chkFault: boolean;

  // Battery / Air Filter - Match C# backend field names (PascalCase)
  BatteryStringID: number;
  AFLength: number;
  AFWidth: number;
  AFThickness: number;
  AFQty: number;
  AFLength1: number;
  AFWidth1: number;
  AFThickness1: number;
  AFQty1: number;
  
  // Required field with default - Match C# backend field name
  Maint_Auth_ID: string;

  // Input/Output readings - Match C# backend field names (PascalCase)
  Input?: string;
  InputVoltA_T: number;
  InputVoltA_PF?: string;
  InputVoltB_T: number;
  InputVoltB_PF?: string;
  InputVoltC_T: number;
  InputVoltC_PF?: string;
  InputCurrA_T: number;
  InputCurrA_PF?: string;
  InputCurrB_T: number;
  InputCurrB_PF?: string;
  InputCurrC_T: number;
  InputCurrC_PF?: string;
  InputFreq_T: number;
  InputFreq_PF?: string;

  // Bypass - Match C# backend field names (PascalCase)
  Bypass?: string;
  BypassVoltA_T: number;
  BypassVoltA_PF?: string;
  BypassVoltB_T: number;
  BypassVoltB_PF?: string;
  BypassVoltC_T: number;
  BypassVoltC_PF?: string;
  BypassCurrA_T: number;
  BypassCurrA_PF?: string;
  BypassCurrB_T: number;
  BypassCurrB_PF?: string;
  BypassCurrC_T: number;
  BypassCurrC_PF?: string;
  BypassFreq_T: number;
  BypassFreq_PF?: string;

  // Output - Match C# backend field names (PascalCase)
  Output?: string;
  OutputVoltA_T: number;
  OutputVoltA_PF?: string;
  OutputVoltB_T: number;
  OutputVoltB_PF?: string;
  OutputVoltC_T: number;
  OutputVoltC_PF?: string;
  OutputCurrA_T: number;
  OutputCurrA_PF?: string;
  OutputCurrB_T: number;
  OutputCurrB_PF?: string;
  OutputCurrC_T: number;
  OutputCurrC_PF?: string;
  OutputFreq_T: number;
  OutputFreq_PF?: string;
  OutputLoadA: number;
  OutputLoadB: number;
  OutputLoadC: number;
  TotalLoad: number;

  // Capacitors / DC/AC - Match C# backend field names (PascalCase)
  RectFloatVolt_PF?: string;
  DCVoltage_T: number;
  DCVoltage_PF?: string;
  ACRipple_T: number;
  ACRipple_PF?: string;
  DCCurrent_T: number;
  DCCurrent_PF?: string;
  ACRippleVolt_T: number;
  ACRippleVolt_PF?: string;
  POStoGND_T: number;
  POStoGND_PF?: string;
  ACRippleCurr_T: number;
  ACRippleCurr_PF?: string;
  NEGtoGND_T: number;
  NEGtoGND_PF?: string;
  OutputLoadA_PF?: string;
  OutputLoadB_PF?: string;
  OutputLoadC_PF?: string;

  DCCapsLeak_PF?: string;
  DCCapsAge_PF?: string;
  ACInputCapsLeak_PF?: string;
  ACInputCapsAge_PF?: string;
  ACOutputCapsLeak_PF?: string;
  ACOutputCapsAge_PF?: string;
  CommCapsLeak_PF?: string;
  CommCapsAge_PF?: string;
  DCGAction1?: string;
  CustAction1?: string;
  ManufSpecification?: string;
  DCGAction2?: string;
  CustAction2?: string;

  DCCapsYear: number;
  ACInputCapsYear: number;
  ACOutputCapsYear: number;
  CommCapsYear: number;
  FansYear: number;

  Location?: string;
  SNMPPresent?: string;
  SaveAsDraft: boolean;
  ModularUPS?: string;
}

/**
 * Response interface for SaveUpdateaaETechUPS API
 */
export interface SaveUpdateUPSResponse {
  success: boolean;
  message: string;
  rowsAffected?: number;
  callNbr?: string;
  equipId?: number;
  upsId?: string;
}