export interface TechToolsData {
  techID: string;
  modifiedBy?: string;
  
  // Badges
  rapidGate: string;
  twic: string;
  mineSafety: string;
  cprfaaed: string;
  osha10: string;
  swac: string;
  
  // Meters
  clampMeter: string;
  clampMeterDt: string;
  multimeter: string;
  multimeterDt: string;
  torqueWrench: string;
  torqueWrenchDt: string;
  irGun: string;
  irGunDt: string;
  midtronics6000: string;
  midtronics6000Dt: string;
  phSeqTester: string;
  phSeqRecvdDt: string;
  
  // PPE/Clothing
  arcFlashSuitSize: string;
  arcFlashSuitDate: string;
  arc40FlashSize: string;
  arc40FlashDate: string;
  gloveSize: string;
  gloveRecDate: string;
  chFrJacket: string;
  chFrJacketDate: string;
  kleinProTechBP: string;
  cal12IUSoftHood: string;
  linemansSleeves: string;
  linemannSlStraps: string;
  nitrileGloves: string;
  hardHatFaceSh: string;
  rubberGloves: string;
  acidApron: string;
  acidFaceShield: string;
  acidFSHeadGear: string;
  acidSleeves: string;
  bagForGloves: string;
  bagForFaceSh: string;
  
  // Misc Items
  tsaLocks: string;
  dcgCarMagnet: string;
  chickenWire: string;
  potentiometer: string;
  dewalt: string;
  techToolBox: string;
  meterHKit: string;
  fluke225: string;
  fuseKit: string;
  panduitLockout: string;
  neikoToolSet: string;
  usbCamera: string;
  vacuum: string;
  lockoutKit: string;
  batterySpillKit: string;
  heatSinkPaste: string;
  gfciCord: string;
  miniGrabber2: string;
  miniGrabber4: string;
  compactFAKit: string;
  insMagnTool: string;
  mattedFloorMat: string;
  clearPVC: string;
  insMirror: string;
  
  // Notes
  notes: string;
}

export interface TechnicianInfo {
  techID: string;
  name: string;
  address: string;
  phone: string;
  techEmail: string;
  manager: string;
}

export interface ToolKitItem {
  toolKitPNMisc: string;
  description: string;
  techValue: string;
  columnOrder: number;
  groupName: string;
}

export interface Technician {
  techID: string;
  techname: string;
}

export interface ToolsTrackingTechsDto {
  techID: string;
  techname: string;
}

export interface TechToolSerialNoDto {
  serialNo: string;
}

// New interfaces for calendar tracking API
export interface ToolsCalendarTrackingDto {
  empName: string;
  techID: string;
  toolName: string;
  serialNo: string;
  dueDt: string; // ISO date string from backend
}

export interface ToolsCalendarDueCountsDto {
  counter: number;
  overDue: number;
  due15: number;
  due30: number;
  due45: number;
  due60: number;
}

export interface ToolsCalendarTrackingResultDto {
  trackingData: ToolsCalendarTrackingDto[];
  dueCounts: ToolsCalendarDueCountsDto;
}
