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
  actKVA: string;
  
  totalEquips: number;
  totalEquipsCorrect: string;
  actTotalEquips: number;
  
  verified: boolean;
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
  value: string;
  label: string;
  tolerance: string;
  phaseToNeutral: string;
  freqTolerance: string;
}

export const VOLTAGE_CONFIGS: VoltageConfiguration[] = [
  { value: '0', label: 'Select', tolerance: '', phaseToNeutral: '', freqTolerance: '' },
  { value: '1', label: '120', tolerance: '110V - 130V', phaseToNeutral: '', freqTolerance: '55 Hz - 65 Hz' },
  { value: '2', label: '240', tolerance: '110V - 130V', phaseToNeutral: '', freqTolerance: '55 Hz - 65 Hz' },
  { value: '3', label: '208', tolerance: '192V - 224V', phaseToNeutral: '120V', freqTolerance: '55 Hz - 65 Hz' },
  { value: '4', label: '480', tolerance: '455V - 505V', phaseToNeutral: '277V', freqTolerance: '55 Hz - 65 Hz' },
  { value: '6', label: '575', tolerance: '545V - 605V', phaseToNeutral: '346V', freqTolerance: '55 Hz - 65 Hz' },
  { value: '5', label: '600', tolerance: '570V - 630V', phaseToNeutral: '346V', freqTolerance: '55 Hz - 65 Hz' }
];

export const OUTPUT_VOLTAGE_CONFIGS: VoltageConfiguration[] = [
  { value: '0', label: 'Select', tolerance: '', phaseToNeutral: '', freqTolerance: '' },
  { value: '1', label: '120', tolerance: '114V - 126V', phaseToNeutral: '', freqTolerance: '58 Hz - 62 Hz' },
  { value: '2', label: '240', tolerance: '114V - 126V', phaseToNeutral: '', freqTolerance: '58 Hz - 62 Hz' },
  { value: '3', label: '208', tolerance: '197V - 219V', phaseToNeutral: '120V', freqTolerance: '58 Hz - 62 Hz' },
  { value: '4', label: '480', tolerance: '460V - 500V', phaseToNeutral: '277V', freqTolerance: '58 Hz - 62 Hz' },
  { value: '6', label: '575', tolerance: '547V - 603V', phaseToNeutral: '346V', freqTolerance: '58 Hz - 62 Hz' },
  { value: '5', label: '600', tolerance: '580V - 620V', phaseToNeutral: '346V', freqTolerance: '58 Hz - 62 Hz' }
];
