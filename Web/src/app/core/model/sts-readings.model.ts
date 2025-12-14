// STS (Static Switch) Readings Models
export interface STSReadings {
  stsId: string;
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
  comments?: string;
  
  // Reconciliation
  recModel: string;
  recModelCorrect: string;
  actModel: string;
  
  recSerialNo: string;
  recSerialNoCorrect: string;
  actSerialNo: string;
  
  kvaSize: string;
  kvaCorrect: string;
  actKVA: string;
  
  totalEquips: number;
  totalEquipsCorrect: string;
  actTotalEquips: number;
  
  verified: boolean;
  
  // Visual and Mechanical Verification
  busswork: string;
  transformers: string;
  powerConn: string;
  mainCirBreaks: string;
  subfeedCirBreaks: string;
  currentCTs: string;
  circuitBoards: string;
  filterCapacitors: string;
  fanCapacitors?: string;
  epoConn: string;
  wiringConn: string;
  ribbonCables: string;
  compAirClean: string;
  frontPanel: string;
  internalPower: string;
  localMonitoring: string;
  localEPO: string;
  comments1: string;
  
  // Power Verification - Input Source 1
  inputSource1: string;
  inputSrc1VoltA_T: number;
  inputSrc1VoltA_PF: string;
  inputSrc1VoltB_T: number;
  inputSrc1VoltB_PF: string;
  inputSrc1VoltC_T: number;
  inputSrc1VoltC_PF: string;
  inputSrc1CurrA_T: number;
  inputSrc1CurrA_PF: string;
  inputSrc1CurrB_T: number;
  inputSrc1CurrB_PF: string;
  inputSrc1CurrC_T: number;
  inputSrc1CurrC_PF: string;
  inputSrc1Freq_T: number;
  inputSrc1Freq_PF: string;

  // Legacy API naming for Input Source 1 (align POST with GET payload)
  input?: string;
  inputVoltA_T?: number;
  inputVoltA_PF?: string;
  inputVoltB_T?: number;
  inputVoltB_PF?: string;
  inputVoltC_T?: number;
  inputVoltC_PF?: string;
  inputCurrA_T?: number;
  inputCurrA_PF?: string;
  inputCurrB_T?: number;
  inputCurrB_PF?: string;
  inputCurrC_T?: number;
  inputCurrC_PF?: string;
  inputFreq_T?: number;
  inputFreq_PF?: string;
  
  // Power Verification - Input Source 2
  inputSource2: string;
  inputSrc2VoltA_T: number;
  inputSrc2VoltA_PF: string;
  inputSrc2VoltB_T: number;
  inputSrc2VoltB_PF: string;
  inputSrc2VoltC_T: number;
  inputSrc2VoltC_PF: string;
  inputSrc2CurrA_T: number;
  inputSrc2CurrA_PF: string;
  inputSrc2CurrB_T: number;
  inputSrc2CurrB_PF: string;
  inputSrc2CurrC_T: number;
  inputSrc2CurrC_PF: string;
  inputSrc2Freq_T: number;
  inputSrc2Freq_PF: string;

  // Legacy API naming for Input Source 2 (align POST with GET payload)
  srcTwo?: string;
  srcTwoVoltA_T?: number;
  srcTwoVoltA_PF?: string;
  srcTwoVoltB_T?: number;
  srcTwoVoltB_PF?: string;
  srcTwoVoltC_T?: number;
  srcTwoVoltC_PF?: string;
  srcTwoCurrA_T?: number;
  srcTwoCurrA_PF?: string;
  srcTwoCurrB_T?: number;
  srcTwoCurrB_PF?: string;
  srcTwoCurrC_T?: number;
  srcTwoCurrC_PF?: string;
  srcTwoFreq_T?: number;
  srcTwoFreq_PF?: string;
  
  // Power Verification - Output
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
  
  // Load Percentages
  outputLoadA: number;
  outputLoadA_PF: string;
  outputLoadB: number;
  outputLoadB_PF: string;
  outputLoadC: number;
  outputLoadC_PF: string;
  totalLoad: number;
  
  // Transfer Verification
  transferVerification: string;
  prefAlter: string;
  transByPass: string;
  stsByPass: string;
  verifyAlarm: string;
  tVerification?: string;
  
  comments5: string;
  
  // Draft Status
  saveAsDraft: boolean;
  maint_Auth_Id: string;
}

export interface STSReconciliationInfo {
  callNbr: string;
  equipId: number;
  
  model: string;
  modelCorrect: string;
  actModel: string;
  
  serialNo: string;
  serialNoCorrect: string;
  actSerialNo: string;
  
  kva: string;
  kvaCorrect: string;
  actKva: string;
  
  totalEquips: number;
  totalEquipsCorrect: string;
  actTotalEquips: number;
  
  verified: boolean;
  modifiedBy: string;
}

export interface STSEquipInfo {
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

export const STS_VOLTAGE_CONFIGS: VoltageConfiguration[] = [
  { value: '0', label: 'Select', tolerance: '', phaseToNeutral: '', freqTolerance: '' },
  { value: '1', label: '120', tolerance: '110V - 130V', phaseToNeutral: '', freqTolerance: '55 Hz - 65 Hz' },
  { value: '2', label: '240', tolerance: '110V - 130V', phaseToNeutral: '', freqTolerance: '55 Hz - 65 Hz' },
  { value: '3', label: '208', tolerance: '192V - 224V', phaseToNeutral: '120V', freqTolerance: '55 Hz - 65 Hz' },
  { value: '4', label: '480', tolerance: '455V - 505V', phaseToNeutral: '277V', freqTolerance: '55 Hz - 65 Hz' },
  { value: '6', label: '575', tolerance: '545V - 605V', phaseToNeutral: '346V', freqTolerance: '55 Hz - 65 Hz' },
  { value: '5', label: '600', tolerance: '570V - 630V', phaseToNeutral: '346V', freqTolerance: '55 Hz - 65 Hz' }
];

export const STS_OUTPUT_VOLTAGE_CONFIGS: VoltageConfiguration[] = [
  { value: '0', label: 'Select', tolerance: '', phaseToNeutral: '', freqTolerance: '' },
  { value: '1', label: '120', tolerance: '114V - 126V', phaseToNeutral: '', freqTolerance: '58 Hz - 62 Hz' },
  { value: '2', label: '240', tolerance: '114V - 126V', phaseToNeutral: '', freqTolerance: '58 Hz - 62 Hz' },
  { value: '3', label: '208', tolerance: '197V - 219V', phaseToNeutral: '120V', freqTolerance: '58 Hz - 62 Hz' },
  { value: '4', label: '480', tolerance: '460V - 500V', phaseToNeutral: '277V', freqTolerance: '58 Hz - 62 Hz' },
  { value: '6', label: '575', tolerance: '547V - 603V', phaseToNeutral: '346V', freqTolerance: '58 Hz - 62 Hz' },
  { value: '5', label: '600', tolerance: '580V - 620V', phaseToNeutral: '346V', freqTolerance: '58 Hz - 62 Hz' }
];
