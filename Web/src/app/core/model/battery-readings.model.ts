/**
 * Battery Readings Models and Interfaces
 * Converted from legacy ASP.NET BatteryReadings.aspx.cs
 */

export interface BatteryStringInfo {
  batStrId: string;
  callNbr: string;
  equipId: number;
  manufacturer: string;
  batteryHousing: string;
  modelNo: string;
  serialNo: string;
  location: string;
  batteryType: string;
  batteryTypeName: string;
  equipStatus: string;
  monthName: string;
  year: number;
  commentsUsed: string;
  bulgedCheck: boolean;
  bulgedPf: string;
  crackedCheck: boolean;
  crackedPf: string;
  debrisCheck: boolean;
  debrisPf: string;
  rotten: string;
  verifySaftey: string;
  containerComments: string;
  environmentComments: string;
  batVoltage: number;
  plusTerminal: number;
  minusTerminal: number;
  dcCharging: number;
  acRipple: number;
  acRippleCurrent: number;
  batVoltatePf: string;
  plusTerminalPf: string;
  minusTerminalPf: string;
  dcChargingPf: string;
  acRipplePf: string;
  acRippleCurrentPf: string;
  resistancePf: string;
  codeTorquePf: string;
  comment: string;
  plusWrappedPf: string;
  plusWrappedCheck: boolean;
  plusSulfatedCheck: boolean;
  plusMisPosCheck: boolean;
  missingCheck: boolean;
  missingPf: string;
  brokenCheck: boolean;
  needsCleaningCheck: boolean;
  platesComments: string;
  waterLevelV: string;
  waterLevelPf: string;
  readingType: string;
  stringType: string;
  electrolytesComments: string;
  batteryTempPf: string;
  roomTemp: number;
  battTemp: number;
  battTempPf: string;
  quantityUsed: number;
  quantityNeeded: number;
  reasonReplace: string;
  floatVoltS: string;
  floatVoltV: string;
  intercellConnector: string;
  replaceWholeString: boolean;
  chckmVac: boolean;
  chkStrap: boolean;
  maintAuthId: string;
  repMonCalc: string;
  batteryPackCount: number;
  indBattDisconnect: string;
  indBattInterConn: string;
  rackIntegrity: string;
  ventFanOperation: string;
  ddlBattTerminal: string;
  ddlBattTypeTerminal: string;
  txtBattTerminal: string;
  readingMethod: string;
  chkGraph: boolean;
  saveAsDraft: boolean;
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
  ascStringsNo: number;
  ascStringsCorrect: string;
  actAscStringNo: number;
  battPerString: number;
  battPerStringCorrect: string;
  actBattPerString: number;
  totalEquips: number;
  totalEquipsCorrect: string;
  actTotalEquips: number;
  kva: string;
  kvaCorrect: string;
  actKva: string;
  verified: boolean;
}

export interface BatteryReadingRow {
  batteryId: number;
  vdc: number;
  vac: number;
  mhos: number;
  strap1: number;
  strap2: number;
  spGravity: number;
  cracks: string;
  replacementNeeded: string;
  monitoringBattery: string;
  actionPlan: string;
  temp: number;
}

export interface BatteryData {
  callNbr: string;
  equipId: number;
  batteryStringId: string;
  batteryId: number;
  temp: number;
  vdc: number;
  mhos: number;
  strap1: number;
  strap2: number;
  spGravity: number;
  vac: number;
  cracks: string;
  replacementNeeded: string;
  monitoringBattery: string;
  actionPlan: string;
  lastModified: Date;
  maintAuthId: string;
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
  vfSelection: string;
  batteriesPerString: number;
  batteriesPerPack: number;
}

export interface BatteryTypeValue {
  batteryType: string;
  monitorStart: number;
  monitorEnd: number;
  replace: number;
}

export interface ReferenceValue {
  id: string;
  name: string;
  value1: number;
  value2: number;
}

export interface BatteryStatusResult {
  status: string;
  totalReplace: number;
  totalMonitor: number;
}
