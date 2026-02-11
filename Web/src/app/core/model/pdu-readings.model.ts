// PDU Readings Models
export interface PDUReadings {
  pduId: string;
  callNbr: string;
  equipId: number;
  
  // Equipment Verification
  manufacturer: string;
  modelNo: string;
  serialNo: string;
  location: string;
  month: string;
  year: number;
  temp: number;
  status: string;
  statusNotes: string;
  kva: string;
  
  // Visual and Mechanical Verification
  busswork: string;
  transformers: string;
  powerConn: string;
  mainCirBreaks: string;
  subfeedCirBreaks: string;
  currentCTs: string;
  circuitBoards: string;
  filterCapacitors: string;
  epoConn: string;
  wiringConn: string;
  ribbonCables: string;
  compAirClean: string;
  staticSwitch: string;
  frontPanel: string;
  internalPower: string;
  localMonitoring: string;
  localEPO: string;
  comments: string;
  
  // Neutral and Ground
  neutral_T: number;
  ground_T: number;
  
  // Input/Output Configuration
  input: string;
  output: string;
  
  // Input Measurements
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
  
  // Output Measurements
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
  
  // Load Percentages
  outputLoadA: number;
  outputLoadA_PF: string;
  outputLoadB: number;
  outputLoadB_PF: string;
  outputLoadC: number;
  outputLoadC_PF: string;
  totalLoad: number;
  
  // Additional Comments
  comments1: string;
  comments5: string;
  
  // Draft Status
  saveAsDraft: boolean;
  maint_Auth_Id: string;
}

export interface PDUReconciliationInfo {
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
  actKva: string;
  ascStringsNo: number;
  ascStringsCorrect: string;
  actAscStringNo: number;
  battPerString: number;
  battPerStringCorrect: string;
  actBattPerString: number;
  
  totalEquips: number;
  totalEquipsCorrect: string;
  actTotalEquips: number;
  
  verified: boolean;
  modifiedBy: string;
}

export interface PDUEquipInfo {
  serialNo: string;
  model: string;
  kva: string;
  location: string;
  equipYear: number;
  equipMonth: string;
  vendorId: string;
}

export interface VoltageConfiguration {
  id?: string;        // Unique identifier for the configuration
  name?: string;      // Display name like "120 I Phase", "208 III Phase"
  value?: string;
  label: string;
  tolerance: string;
  phaseToNeutral: string;
  freqTolerance: string;
}

export const VOLTAGE_CONFIGS: VoltageConfiguration[] = [
  { id: '1', name: '120 I Phase', value: '1', label: '120 I Phase', tolerance: '110V - 130V', phaseToNeutral: '', freqTolerance: '55 Hz - 65 Hz' },
  { id: '2', name: '240 II Phase', value: '2', label: '240 II Phase', tolerance: '110V - 130V', phaseToNeutral: '', freqTolerance: '55 Hz - 65 Hz' },
  { id: '7', name: '208 I Phase', value: '7', label: '208 I Phase', tolerance: '192V - 224V', phaseToNeutral: '', freqTolerance: '55 Hz - 65 Hz' },
  { id: '8', name: '208 II Phase', value: '8', label: '208 II Phase', tolerance: '192V - 224V', phaseToNeutral: '', freqTolerance: '55 Hz - 65 Hz' },
  { id: '3', name: '208 III Phase', value: '3', label: '208 III Phase', tolerance: '192V - 224V', phaseToNeutral: '120V', freqTolerance: '55 Hz - 65 Hz' },
  { id: '4', name: '480 III Phase', value: '4', label: '480 III Phase', tolerance: '455V - 505V', phaseToNeutral: '277V', freqTolerance: '55 Hz - 65 Hz' },
  { id: '6', name: '575 III Phase', value: '6', label: '575 III Phase', tolerance: '545V - 605V', phaseToNeutral: '346V', freqTolerance: '55 Hz - 65 Hz' },
  { id: '5', name: '600 III Phase', value: '5', label: '600 III Phase', tolerance: '570V - 630V', phaseToNeutral: '346V', freqTolerance: '55 Hz - 65 Hz' }
];

export const OUTPUT_VOLTAGE_CONFIGS: VoltageConfiguration[] = [
  { id: '1', name: '120 I Phase', value: '1', label: '120 I Phase', tolerance: '114V - 126V', phaseToNeutral: '', freqTolerance: '58 Hz - 62 Hz' },
  { id: '2', name: '240 II Phase', value: '2', label: '240 II Phase', tolerance: '114V - 126V', phaseToNeutral: '', freqTolerance: '58 Hz - 62 Hz' },
  { id: '7', name: '208 I Phase', value: '7', label: '208 I Phase', tolerance: '197V - 219V', phaseToNeutral: '', freqTolerance: '58 Hz - 62 Hz' },
  { id: '8', name: '208 II Phase', value: '8', label: '208 II Phase', tolerance: '197V - 219V', phaseToNeutral: '', freqTolerance: '58 Hz - 62 Hz' },
  { id: '3', name: '208 III Phase', value: '3', label: '208 III Phase', tolerance: '197V - 219V', phaseToNeutral: '120V', freqTolerance: '58 Hz - 62 Hz' },
  { id: '4', name: '480 III Phase', value: '4', label: '480 III Phase', tolerance: '460V - 500V', phaseToNeutral: '277V', freqTolerance: '58 Hz - 62 Hz' },
  { id: '6', name: '575 III Phase', value: '6', label: '575 III Phase', tolerance: '547V - 603V', phaseToNeutral: '346V', freqTolerance: '58 Hz - 62 Hz' },
  { id: '5', name: '600 III Phase', value: '5', label: '600 III Phase', tolerance: '580V - 620V', phaseToNeutral: '346V', freqTolerance: '58 Hz - 62 Hz' }
];
