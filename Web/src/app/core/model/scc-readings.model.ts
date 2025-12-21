// SCC (System Control Cabinet) Readings Model

export interface SCCReadings {
  sccId: string;
  callNbr: string;
  equipId: number;
  manufacturer: string;
  modelNo: string;
  serialNo: string;
  temp: number;
  status: string;
  statusNotes: string;
  
  // Voltage Settings
  bypassVoltA: string;
  bypassVoltB: string;
  bypassVoltC: string;
  supplyVoltA: string;
  supplyVoltB: string;
  supplyVoltC: string;
  outputVoltA: string;
  outputVoltB: string;
  outputVoltC: string;
  firmwareVersion: string;
  phaseError: string;
  partNos: string;
  loadCurrent: string;
  
  comments: string;
}

export interface SCCReconciliationInfo {
  callNbr: string;
  equipId: number;
  
  // Make
  make: string;
  makeCorrect: string;
  actMake: string;
  
  // Model
  model: string;
  modelCorrect: string;
  actModel: string;
  
  // Serial Number
  serialNo: string;
  serialNoCorrect: string;
  actSerialNo: string;
  
  // Total Equipment
  totalEquips: number;
  totalEquipsCorrect: string;
  actTotalEquips: number;
  
  verified: boolean;
}
