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
  statusNotes: string;
  tableName: string;
  manufacturer: string;
  modelNo: string;
  serialNo: string;
  location: string;
  monthName: string;
  year: number;
  readingType: string;
  batteriesPerString: number;
  vfSelection: string;
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
  {
    id: '1',
    name: '120V Single Phase',
    phaseCount: 1,
    showPhaseToNeutral: false,
    fields: [
      { id: 'voltA', label: 'Voltage A', type: 'voltage', required: true },
      { id: 'currA', label: 'Current A', type: 'current', required: true },
      { id: 'freq', label: 'Frequency', type: 'frequency', required: true }
    ]
  },
  {
    id: '2',
    name: '240V Two Phase',
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
    id: '3',
    name: '208V Three Phase',
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
    id: '4',
    name: '480V Three Phase',
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
    name: '600V Three Phase',
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
    id: '6',
    name: '575V Three Phase',
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
    id: '7',
    name: '208V Single Phase',
    phaseCount: 1,
    showPhaseToNeutral: false,
    fields: [
      { id: 'voltA', label: 'Voltage A', type: 'voltage', required: true },
      { id: 'currA', label: 'Current A', type: 'current', required: true },
      { id: 'freq', label: 'Frequency', type: 'frequency', required: true }
    ]
  },
  {
    id: '8',
    name: '208V Two Phase',
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
    id: '9',
    name: '480V Single Phase',
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
    name: '277V Single Phase',
    phaseCount: 1,
    showPhaseToNeutral: false,
    fields: [
      { id: 'voltA', label: 'Voltage A', type: 'voltage', required: true },
      { id: 'currA', label: 'Current A', type: 'current', required: true },
      { id: 'freq', label: 'Frequency', type: 'frequency', required: true }
    ]
  },
  {
    id: '11',
    name: '400V Three Phase',
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
  { value: 'W', text: 'Warning' },
  { value: 'N', text: 'N/A' }
];

export const YES_NO_OPTIONS = [
  { value: 'Y', text: 'Yes' },
  { value: 'N', text: 'No' }
];

export const STATUS_OPTIONS: StatusOption[] = [
  { value: 'Online', text: 'Online' },
  { value: 'OnLine(MinorDeficiency)', text: 'OnLine(Minor Deficiency)' },
  { value: 'OnLine(MajorDeficiency)', text: 'OnLine(Major Deficiency)' },
  { value: 'CriticalDeficiency', text: 'Critical Deficiency' },
  { value: 'ReplacementRecommended', text: 'Replacement Recommended' },
  { value: 'ProactiveReplacement', text: 'Proactive Replacement' },
  { value: 'Offline', text: 'Offline' }
];