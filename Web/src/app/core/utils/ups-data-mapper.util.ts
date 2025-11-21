/**
 * UPS Data Mapper Utility
 * Provides conversion functions between different UPS data interfaces
 */

import { AAETechUPS, SaveUpdateaaETechUPSDto } from '../model/ups-readings.model';

/**
 * Converts AAETechUPS interface to SaveUpdateaaETechUPSDto for API submission
 * @param upsData - UPS data in AAETechUPS format
 * @param maintAuthId - Maintenance authorization ID (defaults to 'SYSTEM')
 * @returns SaveUpdateaaETechUPSDto object ready for API submission
 */
export function convertToSaveUpdateDto(upsData: AAETechUPS, maintAuthId: string = 'SYSTEM'): SaveUpdateaaETechUPSDto {
  const finalMonthName = (upsData.monthName && upsData.monthName !== 'Invalid Date' && upsData.monthName.trim() !== '') ? upsData.monthName : 'January';
  const finalYear = (upsData.year && upsData.year > 0 && upsData.year !== null && upsData.year !== undefined) ? Number(upsData.year) : 1990;

  const result = {
    // Required Keys
    callNbr: upsData.callNbr,
    equipId: upsData.equipId,
    upsId: upsData.upsId,

    // Basic info - Match C# backend field names (PascalCase)
    Manufacturer: upsData.manufacturer || undefined,
    KVA: upsData.kva || undefined,
    MultiModule: upsData.multiModule || undefined,
    MaintByPass: upsData.maintByPass || undefined,
    Other: upsData.other || undefined,
    ModelNo: upsData.modelNo || undefined,
    SerialNo: upsData.serialNo || undefined,
    Status: upsData.status || undefined,
    ParallelCabinet: upsData.parallelCabinet || undefined,

    // Measurement info - Match C# backend field names (PascalCase)
    Measure_Input: upsData.measure_Input || undefined,
    Measure_LCD: upsData.measure_LCD || undefined,
    Measure_Load: upsData.measure_Load || undefined,
    Measure_3Phase: upsData.measure_3Phase || undefined,
    Measure_KVA: upsData.measure_KVA || undefined,
    Measure_Normal: upsData.measure_Normal || undefined,
    Measure_Caliberation: upsData.measure_Caliberation || undefined,
    Measure_EOL: upsData.measure_EOL || undefined,

    // Visual info - Match C# backend field names (PascalCase)
    Visual_NoAlarms: upsData.visual_NoAlarms || undefined,
    Visual_Tightness: upsData.visual_Tightness || undefined,
    Visual_Broken: upsData.visual_Broken || undefined,
    Visual_Vaccum: upsData.visual_Vaccum || undefined,
    Visual_EPO: upsData.visual_EPO || undefined,
    Visual_Noise: upsData.visual_Noise || undefined,
    Visual_FansAge: upsData.visual_FansAge || undefined,
    Visual_ReplaceFilters: upsData.visual_ReplaceFilters || undefined,

    // Environment info - Match C# backend field names (PascalCase)
    Environment_RoomTemp: upsData.environment_RoomTemp || undefined,
    Environment_Saftey: upsData.environment_Saftey || undefined,
    Environment_Clean: upsData.environment_Clean || undefined,
    Environment_Space: upsData.environment_Space || undefined,
    Environment_Circuit: upsData.environment_Circuit || undefined,

    // Transfer info - Match C# backend field names (PascalCase)
    Transfer_Major: upsData.transfer_Major || undefined,
    Transfer_Static: upsData.transfer_Static || undefined,
    Transfer_ByPass: upsData.transfer_ByPass || undefined,
    Transfer_Wave: upsData.transfer_Wave || undefined,
    Transfer_Normal: upsData.transfer_Normal || undefined,
    Transfer_Alarm: upsData.transfer_Alarm || undefined,

    // Comments - Match C# backend field names (PascalCase)
    Comments1: upsData.comments1 || undefined,
    Comments2: upsData.comments2 || undefined,
    Comments3: upsData.comments3 || undefined,
    Comments4: upsData.comments4 || undefined,
    Comments5: upsData.comments5 || undefined,

    // Date Code - Match C# backend field names (only DateCodeMonth/Year, not UPS-specific)
    DateCodeMonth: finalMonthName,
    DateCodeYear: finalYear,
    StatusReason: upsData.statusReason || undefined,

    // Checkboxes
    chkDCBreak: upsData.chkDCBreak || false,
    chkOverLoad: upsData.chkOverLoad || false,
    chkTransfer: upsData.chkTransfer || false,
    chkFault: upsData.chkFault || false,

    // Battery / Air Filter - Match C# backend field names (PascalCase)
    BatteryStringID: upsData.batteryStringID || 0,
    AFLength: parseFloat(upsData.afLength) || 0,
    AFWidth: parseFloat(upsData.afWidth) || 0,
    AFThickness: parseFloat(upsData.afThickness) || 0, // Note: afThick -> AFThickness
    AFQty: parseFloat(upsData.afQty) || 0,
    AFLength1: parseFloat(upsData.afLength1) || 0,
    AFWidth1: parseFloat(upsData.afWidth1) || 0,
    AFThickness1: parseFloat(upsData.afThickness1) || 0, // Note: afThick1 -> AFThickness1
    AFQty1: parseFloat(upsData.afQty1) || 0,
    
    // Required field with default - Match C# backend field name
    Maint_Auth_ID: maintAuthId,

    // Input/Output readings - Match C# backend field names (PascalCase)
    Input: upsData.input || undefined,
    InputVoltA_T: upsData.inputVoltA_T || 0,
    InputVoltA_PF: upsData.inputVoltA_PF || undefined,
    InputVoltB_T: upsData.inputVoltB_T || 0,
    InputVoltB_PF: upsData.inputVoltB_PF || undefined,
    InputVoltC_T: upsData.inputVoltC_T || 0,
    InputVoltC_PF: upsData.inputVoltC_PF || undefined,
    InputCurrA_T: upsData.inputCurrA_T || 0,
    InputCurrA_PF: upsData.inputCurrA_PF || undefined,
    InputCurrB_T: upsData.inputCurrB_T || 0,
    InputCurrB_PF: upsData.inputCurrB_PF || undefined,
    InputCurrC_T: upsData.inputCurrC_T || 0,
    InputCurrC_PF: upsData.inputCurrC_PF || undefined,
    InputFreq_T: upsData.inputFreq_T || 0,
    InputFreq_PF: upsData.inputFreq_PF || undefined,

    // Bypass - Match C# backend field names (PascalCase)
    Bypass: upsData.bypass || undefined,
    BypassVoltA_T: upsData.bypassVoltA_T || 0,
    BypassVoltA_PF: upsData.bypassVoltA_PF || undefined,
    BypassVoltB_T: upsData.bypassVoltB_T || 0,
    BypassVoltB_PF: upsData.bypassVoltB_PF || undefined,
    BypassVoltC_T: upsData.bypassVoltC_T || 0,
    BypassVoltC_PF: upsData.bypassVoltC_PF || undefined,
    BypassCurrA_T: upsData.bypassCurrA_T || 0,
    BypassCurrA_PF: upsData.bypassCurrA_PF || undefined,
    BypassCurrB_T: upsData.bypassCurrB_T || 0,
    BypassCurrB_PF: upsData.bypassCurrB_PF || undefined,
    BypassCurrC_T: upsData.bypassCurrC_T || 0,
    BypassCurrC_PF: upsData.bypassCurrC_PF || undefined,
    BypassFreq_T: upsData.bypassFreq_T || 0,
    BypassFreq_PF: upsData.bypassFreq_PF || undefined,

    // Output - Match C# backend field names (PascalCase)
    Output: upsData.output || undefined,
    OutputVoltA_T: upsData.outputVoltA_T || 0,
    OutputVoltA_PF: upsData.outputVoltA_PF || undefined,
    OutputVoltB_T: upsData.outputVoltB_T || 0,
    OutputVoltB_PF: upsData.outputVoltB_PF || undefined,
    OutputVoltC_T: upsData.outputVoltC_T || 0,
    OutputVoltC_PF: upsData.outputVoltC_PF || undefined,
    OutputCurrA_T: upsData.outputCurrA_T || 0,
    OutputCurrA_PF: upsData.outputCurrA_PF || undefined,
    OutputCurrB_T: upsData.outputCurrB_T || 0,
    OutputCurrB_PF: upsData.outputCurrB_PF || undefined,
    OutputCurrC_T: upsData.outputCurrC_T || 0,
    OutputCurrC_PF: upsData.outputCurrC_PF || undefined,
    OutputFreq_T: upsData.outputFreq_T || 0,
    OutputFreq_PF: upsData.outputFreq_PF || undefined,
    OutputLoadA: upsData.outputLoadA || 0,
    OutputLoadB: upsData.outputLoadB || 0,
    OutputLoadC: upsData.outputLoadC || 0,
    TotalLoad: upsData.totalLoad || 0,

    // Capacitors / DC/AC - Match C# backend field names (PascalCase)
    RectFloatVolt_PF: upsData.rectFloatVolt_PF || undefined,
    DCVoltage_T: upsData.dcVoltage_T || 0,
    DCVoltage_PF: upsData.dcVoltage_PF || undefined,
    ACRipple_T: upsData.acRipple_T || 0,
    ACRipple_PF: upsData.acRipple_PF || undefined,
    DCCurrent_T: upsData.dcCurrent_T || 0,
    DCCurrent_PF: upsData.dcCurrent_PF || undefined,
    ACRippleVolt_T: upsData.acRippleVolt_T || 0,
    ACRippleVolt_PF: upsData.acRippleVolt_PF || undefined,
    POStoGND_T: upsData.posToGND_T || 0, // Note: posToGND_T -> POStoGND_T
    POStoGND_PF: upsData.posToGND_PF || undefined,
    ACRippleCurr_T: upsData.acRippleCurr_T || 0,
    ACRippleCurr_PF: upsData.acRippleCurr_PF || undefined,
    NEGtoGND_T: upsData.negToGND_T || 0, // Note: negToGND_T -> NEGtoGND_T
    NEGtoGND_PF: upsData.negToGND_PF || undefined,
    OutputLoadA_PF: upsData.outputLoadA_PF || undefined,
    OutputLoadB_PF: upsData.outputLoadB_PF || undefined,
    OutputLoadC_PF: upsData.outputLoadC_PF || undefined,

    DCCapsLeak_PF: upsData.dcCapsLeak_PF || undefined,
    DCCapsAge_PF: upsData.dcCapsAge_PF || undefined,
    ACInputCapsLeak_PF: upsData.acInputCapsLeak_PF || undefined,
    ACInputCapsAge_PF: upsData.acInputCapsAge_PF || undefined,
    ACOutputCapsLeak_PF: upsData.acOutputCapsLeak_PF || undefined,
    ACOutputCapsAge_PF: upsData.acOutputCapsAge_PF || undefined,
    CommCapsLeak_PF: upsData.commCapsLeak_PF || undefined,
    CommCapsAge_PF: upsData.commCapsAge_PF || undefined,
    DCGAction1: upsData.dcgAction1 || undefined,
    CustAction1: upsData.custAction1 || undefined,
    ManufSpecification: upsData.manufSpecification || undefined,
    DCGAction2: upsData.dcgAction2 || undefined,
    CustAction2: upsData.custAction2 || undefined,

    DCCapsYear: upsData.dcCapsYear || 0,
    ACInputCapsYear: upsData.acInputCapsYear || 0,
    ACOutputCapsYear: upsData.acOutputCapsYear || 0,
    CommCapsYear: upsData.commCapsYear || 0,
    FansYear: upsData.fansYear || 0,

    Location: upsData.location || undefined,
    SNMPPresent: upsData.snmpPresent || undefined,
    SaveAsDraft: upsData.saveAsDraft || false,
    modularUPS: upsData.modularUPS || undefined
  };
  
  return result;
}

/**
 * Converts SaveUpdateaaETechUPSDto back to AAETechUPS interface
 * Useful for handling API responses or form population
 * @param dto - DTO data from API
 * @returns AAETechUPS object
 */
export function convertFromSaveUpdateDto(dto: SaveUpdateaaETechUPSDto): AAETechUPS {
  return {
    // Required Keys
    callNbr: dto.callNbr,
    equipId: dto.equipId,
    upsId: dto.upsId,

    // Basic info - Use PascalCase field names from updated interface
    manufacturer: dto.Manufacturer || '',
    kva: dto.KVA || '',
    multiModule: dto.MultiModule || '',
    maintByPass: dto.MaintByPass || '',
    other: dto.Other || '',
    modelNo: dto.ModelNo || '',
    serialNo: dto.SerialNo || '',
    location: dto.Location || '',
    status: dto.Status || '',
    statusReason: dto.StatusReason || '',
    parallelCabinet: dto.ParallelCabinet || '',
    snmpPresent: dto.SNMPPresent || '',
    modularUPS: dto.ModularUPS || '',

    // Measurement flags - Use PascalCase field names from updated interface
    measure_Input: dto.Measure_Input || '',
    measure_LCD: dto.Measure_LCD || '',
    measure_Load: dto.Measure_Load || '',
    measure_3Phase: dto.Measure_3Phase || '',
    measure_KVA: dto.Measure_KVA || '',
    measure_Normal: dto.Measure_Normal || '',
    measure_Caliberation: dto.Measure_Caliberation || '',
    measure_EOL: dto.Measure_EOL || '',

    // Visual inspection flags - Use PascalCase field names from updated interface
    visual_NoAlarms: dto.Visual_NoAlarms || '',
    visual_Tightness: dto.Visual_Tightness || '',
    visual_Broken: dto.Visual_Broken || '',
    visual_Vaccum: dto.Visual_Vaccum || '',
    visual_EPO: dto.Visual_EPO || '',
    visual_Noise: dto.Visual_Noise || '',
    visual_FansAge: dto.Visual_FansAge || '',
    visual_ReplaceFilters: dto.Visual_ReplaceFilters || '',

    // Environment flags - Use PascalCase field names from updated interface
    environment_RoomTemp: dto.Environment_RoomTemp || '',
    environment_Saftey: dto.Environment_Saftey || '',
    environment_Clean: dto.Environment_Clean || '',
    environment_Space: dto.Environment_Space || '',
    environment_Circuit: dto.Environment_Circuit || '',

    // Transfer test flags - Use PascalCase field names from updated interface
    transfer_Major: dto.Transfer_Major || '',
    transfer_Static: dto.Transfer_Static || '',
    transfer_ByPass: dto.Transfer_ByPass || '',
    transfer_Wave: dto.Transfer_Wave || '',
    transfer_Normal: dto.Transfer_Normal || '',
    transfer_Alarm: dto.Transfer_Alarm || '',

    // Comments - Use PascalCase field names from updated interface
    comments1: dto.Comments1 || '',
    comments2: dto.Comments2 || '',
    comments3: dto.Comments3 || '',
    comments4: dto.Comments4 || '',
    comments5: dto.Comments5 || '',

    // Air filter data - convert numbers back to strings using PascalCase field names
    afLength: dto.AFLength?.toString() || '',
    afWidth: dto.AFWidth?.toString() || '',
    afThickness: dto.AFThickness?.toString() || '', // Note: AFThickness -> afThick
    afQty: dto.AFQty?.toString() || '',
    afLength1: dto.AFLength1?.toString() || '',
    afWidth1: dto.AFWidth1?.toString() || '',
    afThickness1: dto.AFThickness1?.toString() || '', // Note: AFThickness1 -> afThick1
    afQty1: dto.AFQty1?.toString() || '',

    // Date information - convert back using PascalCase field names
    monthName: dto.DateCodeMonth || '',
    year: dto.DateCodeYear || 0,

    // Input voltage configuration and readings - Use PascalCase field names
    input: dto.Input || '',
    inputVoltA_T: dto.InputVoltA_T || 0,
    inputVoltA_PF: dto.InputVoltA_PF || '',
    inputVoltB_T: dto.InputVoltB_T || 0,
    inputVoltB_PF: dto.InputVoltB_PF || '',
    inputVoltC_T: dto.InputVoltC_T || 0,
    inputVoltC_PF: dto.InputVoltC_PF || '',
    inputCurrA_T: dto.InputCurrA_T || 0,
    inputCurrA_PF: dto.InputCurrA_PF || '',
    inputCurrB_T: dto.InputCurrB_T || 0,
    inputCurrB_PF: dto.InputCurrB_PF || '',
    inputCurrC_T: dto.InputCurrC_T || 0,
    inputCurrC_PF: dto.InputCurrC_PF || '',
    inputFreq_T: dto.InputFreq_T || 0,
    inputFreq_PF: dto.InputFreq_PF || '',

    // Bypass voltage configuration and readings
    bypass: dto.Bypass || '',
    bypassVoltA_T: dto.BypassVoltA_T || 0,
    bypassVoltA_PF: dto.BypassVoltA_PF || '',
    bypassVoltB_T: dto.BypassVoltB_T || 0,
    bypassVoltB_PF: dto.BypassVoltB_PF || '',
    bypassVoltC_T: dto.BypassVoltC_T || 0,
    bypassVoltC_PF: dto.BypassVoltC_PF || '',
    bypassCurrA_T: dto.BypassCurrA_T || 0,
    bypassCurrA_PF: dto.BypassCurrA_PF || '',
    bypassCurrB_T: dto.BypassCurrB_T || 0,
    bypassCurrB_PF: dto.BypassCurrB_PF || '',
    bypassCurrC_T: dto.BypassCurrC_T || 0,
    bypassCurrC_PF: dto.BypassCurrC_PF || '',
    bypassFreq_T: dto.BypassFreq_T || 0,
    bypassFreq_PF: dto.BypassFreq_PF || '',

    // Output voltage configuration and readings
    output: dto.Output || '',
    outputVoltA_T: dto.OutputVoltA_T || 0,
    outputVoltA_PF: dto.OutputVoltA_PF || '',
    outputVoltB_T: dto.OutputVoltB_T || 0,
    outputVoltB_PF: dto.OutputVoltB_PF || '',
    outputVoltC_T: dto.OutputVoltC_T || 0,
    outputVoltC_PF: dto.OutputVoltC_PF || '',
    outputCurrA_T: dto.OutputCurrA_T || 0,
    outputCurrA_PF: dto.OutputCurrA_PF || '',
    outputCurrB_T: dto.OutputCurrB_T || 0,
    outputCurrB_PF: dto.OutputCurrB_PF || '',
    outputCurrC_T: dto.OutputCurrC_T || 0,
    outputCurrC_PF: dto.OutputCurrC_PF || '',
    outputFreq_T: dto.OutputFreq_T || 0,
    outputFreq_PF: dto.OutputFreq_PF || '',
    outputLoadA: dto.OutputLoadA || 0,
    outputLoadA_PF: dto.OutputLoadA_PF || '',
    outputLoadB: dto.OutputLoadB || 0,
    outputLoadB_PF: dto.OutputLoadB_PF || '',
    outputLoadC: dto.OutputLoadC || 0,
    outputLoadC_PF: dto.OutputLoadC_PF || '',
    totalLoad: dto.TotalLoad || 0,

    // Rectifier readings - handle field name mappings
    rectFloatVolt_PF: dto.RectFloatVolt_PF || '',
    dcVoltage_T: dto.DCVoltage_T || 0,
    dcVoltage_PF: dto.DCVoltage_PF || '',
    acRipple_T: dto.ACRipple_T || 0,
    acRipple_PF: dto.ACRipple_PF || '',
    dcCurrent_T: dto.DCCurrent_T || 0,
    dcCurrent_PF: dto.DCCurrent_PF || '',
    acRippleVolt_T: dto.ACRippleVolt_T || 0,
    acRippleVolt_PF: dto.ACRippleVolt_PF || '',
    posToGND_T: dto.POStoGND_T || 0, // Note: postoGND_T -> POStoGND_T
    posToGND_PF: dto.POStoGND_PF || '',
    acRippleCurr_T: dto.ACRippleCurr_T || 0,
    acRippleCurr_PF: dto.ACRippleCurr_PF || '',
    negToGND_T: dto.NEGtoGND_T || 0, // Note: negtoGND_T -> NEGtoGND_T
    negToGND_PF: dto.NEGtoGND_PF || '',

    // Capacitor information
    dcCapsLeak_PF: dto.DCCapsLeak_PF || '',
    dcCapsAge_PF: dto.DCCapsAge_PF || '',
    dcCapsYear: dto.DCCapsYear || 0,
    acInputCapsLeak_PF: dto.ACInputCapsLeak_PF || '',
    acInputCapsAge_PF: dto.ACInputCapsAge_PF || '',
    acInputCapsYear: dto.ACInputCapsYear || 0,
    acOutputCapsLeak_PF: dto.ACOutputCapsLeak_PF || '',
    acOutputCapsAge_PF: dto.ACOutputCapsAge_PF || '',
    acOutputCapsYear: dto.ACOutputCapsYear || 0,
    commCapsLeak_PF: dto.CommCapsLeak_PF || '',
    commCapsAge_PF: dto.CommCapsAge_PF || '',
    commCapsYear: dto.CommCapsYear || 0,

    // Fan information
    fansYear: dto.FansYear || 0,

    // Action items
    dcgAction1: dto.DCGAction1 || '',
    custAction1: dto.CustAction1 || '',
    manufSpecification: dto.ManufSpecification || '',
    dcgAction2: dto.DCGAction2 || '',
    custAction2: dto.CustAction2 || '',

    // Service description and maintenance info
    svcDescr: '', // Not available in DTO
    maintAuthId: dto.Maint_Auth_ID || '',
    saveAsDraft: dto.SaveAsDraft || false,

    // Battery string info
    batteryStringID: dto.BatteryStringID || 0,

    // Check flags
    chkDCBreak: dto.chkDCBreak || false,
    chkFault: dto.chkFault || false,
    chkOverLoad: dto.chkOverLoad || false,
    chkTransfer: dto.chkTransfer || false
  };
}

/**
 * Creates a default/empty SaveUpdateaaETechUPSDto with required fields populated
 * @param callNbr - Required call number
 * @param equipId - Required equipment ID
 * @param upsId - Required UPS ID
 * @param maintAuthId - Maintenance authorization ID (defaults to 'SYSTEM')
 * @returns Default DTO object with required fields
 */
export function createDefaultSaveUpdateDto(
  callNbr: string, 
  equipId: number, 
  upsId: string, 
  maintAuthId: string = 'SYSTEM'
): SaveUpdateaaETechUPSDto {
  return {
    // Required Keys
    callNbr,
    equipId,
    upsId,

    // Required fields with defaults
    DateCodeYear: new Date().getFullYear(),
    Maint_Auth_ID: maintAuthId,

    // Boolean fields with defaults
    chkDCBreak: false,
    chkOverLoad: false,
    chkTransfer: false,
    chkFault: false,
    SaveAsDraft: false,

    // Numeric fields with defaults
    BatteryStringID: 0,
    AFLength: 0,
    AFWidth: 0,
    AFThickness: 0,
    AFQty: 0,
    AFLength1: 0,
    AFWidth1: 0,
    AFThickness1: 0,
    AFQty1: 0,

    // Input readings with defaults
    InputVoltA_T: 0,
    InputVoltB_T: 0,
    InputVoltC_T: 0,
    InputCurrA_T: 0,
    InputCurrB_T: 0,
    InputCurrC_T: 0,
    InputFreq_T: 0,

    // Bypass readings with defaults
    BypassVoltA_T: 0,
    BypassVoltB_T: 0,
    BypassVoltC_T: 0,
    BypassCurrA_T: 0,
    BypassCurrB_T: 0,
    BypassCurrC_T: 0,
    BypassFreq_T: 0,

    // Output readings with defaults
    OutputVoltA_T: 0,
    OutputVoltB_T: 0,
    OutputVoltC_T: 0,
    OutputCurrA_T: 0,
    OutputCurrB_T: 0,
    OutputCurrC_T: 0,
    OutputFreq_T: 0,
    OutputLoadA: 0,
    OutputLoadB: 0,
    OutputLoadC: 0,
    TotalLoad: 0,

    // DC/AC readings with defaults
    DCVoltage_T: 0,
    ACRipple_T: 0,
    DCCurrent_T: 0,
    ACRippleVolt_T: 0,
    POStoGND_T: 0,
    ACRippleCurr_T: 0,
    NEGtoGND_T: 0,

    // Year fields with defaults
    DCCapsYear: 0,
    ACInputCapsYear: 0,
    ACOutputCapsYear: 0,
    CommCapsYear: 0,
    FansYear: 0
  };
}