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
  return {
    // Required Keys
    callNbr: upsData.callNbr,
    equipId: upsData.equipId,
    upsId: upsData.upsId,

    // Basic info
    manufacturer: upsData.manufacturer || undefined,
    kva: upsData.kva || undefined,
    multiModule: upsData.multiModule || undefined,
    maintByPass: upsData.maintByPass || undefined,
    other: upsData.other || undefined,
    modelNo: upsData.modelNo || undefined,
    serialNo: upsData.serialNo || undefined,
    status: upsData.status || undefined,
    parallelCabinet: upsData.parallelCabinet || undefined,

    // Measurement info
    measure_Input: upsData.measure_Input || undefined,
    measure_LCD: upsData.measure_LCD || undefined,
    measure_Load: upsData.measure_Load || undefined,
    measure_3Phase: upsData.measure_3Phase || undefined,
    measure_KVA: upsData.measure_KVA || undefined,
    measure_Normal: upsData.measure_Normal || undefined,
    measure_Caliberation: upsData.measure_Caliberation || undefined,
    measure_EOL: upsData.measure_EOL || undefined,

    // Visual info
    visual_NoAlarms: upsData.visual_NoAlarms || undefined,
    visual_Tightness: upsData.visual_Tightness || undefined,
    visual_Broken: upsData.visual_Broken || undefined,
    visual_Vaccum: upsData.visual_Vaccum || undefined,
    visual_EPO: upsData.visual_EPO || undefined,
    visual_Noise: upsData.visual_Noise || undefined,
    visual_FansAge: upsData.visual_FansAge || undefined,
    visual_ReplaceFilters: upsData.visual_ReplaceFilters || undefined,

    // Environment info
    environment_RoomTemp: upsData.environment_RoomTemp || undefined,
    environment_Saftey: upsData.environment_Saftey || undefined,
    environment_Clean: upsData.environment_Clean || undefined,
    environment_Space: upsData.environment_Space || undefined,
    environment_Circuit: upsData.environment_Circuit || undefined,

    // Transfer info
    transfer_Major: upsData.transfer_Major || undefined,
    transfer_Static: upsData.transfer_Static || undefined,
    transfer_ByPass: upsData.transfer_ByPass || undefined,
    transfer_Wave: upsData.transfer_Wave || undefined,
    transfer_Normal: upsData.transfer_Normal || undefined,
    transfer_Alarm: upsData.transfer_Alarm || undefined,

    // Comments
    comments1: upsData.comments1 || undefined,
    comments2: upsData.comments2 || undefined,
    comments3: upsData.comments3 || undefined,
    comments4: upsData.comments4 || undefined,
    comments5: upsData.comments5 || undefined,

    // Date Code - handle conversion from monthName to dateCodeMonth
    dateCodeMonth: upsData.monthName || undefined,
    dateCodeYear: upsData.year || 0,
    statusReason: upsData.statusReason || undefined,

    // Checkboxes
    chkDCBreak: upsData.chkDCBreak || false,
    chkOverLoad: upsData.chkOverLoad || false,
    chkTransfer: upsData.chkTransfer || false,
    chkFault: upsData.chkFault || false,

    // Battery / Air Filter - handle string to number conversion and field name mapping
    batteryStringID: upsData.batteryStringID || 0,
    afLength: parseFloat(upsData.afLength) || 0,
    afWidth: parseFloat(upsData.afWidth) || 0,
    afThickness: parseFloat(upsData.afThick) || 0, // Note: afThick -> afThickness
    afQty: parseFloat(upsData.afQty) || 0,
    afLength1: parseFloat(upsData.afLength1) || 0,
    afWidth1: parseFloat(upsData.afWidth1) || 0,
    afThickness1: parseFloat(upsData.afThick1) || 0, // Note: afThick1 -> afThickness1
    afQty1: parseFloat(upsData.afQty1) || 0,
    
    // Required field with default
    maint_Auth_ID: maintAuthId,

    // Input/Output readings
    input: upsData.input || undefined,
    inputVoltA_T: upsData.inputVoltA_T || 0,
    inputVoltA_PF: upsData.inputVoltA_PF || undefined,
    inputVoltB_T: upsData.inputVoltB_T || 0,
    inputVoltB_PF: upsData.inputVoltB_PF || undefined,
    inputVoltC_T: upsData.inputVoltC_T || 0,
    inputVoltC_PF: upsData.inputVoltC_PF || undefined,
    inputCurrA_T: upsData.inputCurrA_T || 0,
    inputCurrA_PF: upsData.inputCurrA_PF || undefined,
    inputCurrB_T: upsData.inputCurrB_T || 0,
    inputCurrB_PF: upsData.inputCurrB_PF || undefined,
    inputCurrC_T: upsData.inputCurrC_T || 0,
    inputCurrC_PF: upsData.inputCurrC_PF || undefined,
    inputFreq_T: upsData.inputFreq_T || 0,
    inputFreq_PF: upsData.inputFreq_PF || undefined,

    // Bypass
    bypass: upsData.bypass || undefined,
    bypassVoltA_T: upsData.bypassVoltA_T || 0,
    bypassVoltA_PF: upsData.bypassVoltA_PF || undefined,
    bypassVoltB_T: upsData.bypassVoltB_T || 0,
    bypassVoltB_PF: upsData.bypassVoltB_PF || undefined,
    bypassVoltC_T: upsData.bypassVoltC_T || 0,
    bypassVoltC_PF: upsData.bypassVoltC_PF || undefined,
    bypassCurrA_T: upsData.bypassCurrA_T || 0,
    bypassCurrA_PF: upsData.bypassCurrA_PF || undefined,
    bypassCurrB_T: upsData.bypassCurrB_T || 0,
    bypassCurrB_PF: upsData.bypassCurrB_PF || undefined,
    bypassCurrC_T: upsData.bypassCurrC_T || 0,
    bypassCurrC_PF: upsData.bypassCurrC_PF || undefined,
    bypassFreq_T: upsData.bypassFreq_T || 0,
    bypassFreq_PF: upsData.bypassFreq_PF || undefined,

    // Output
    output: upsData.output || undefined,
    outputVoltA_T: upsData.outputVoltA_T || 0,
    outputVoltA_PF: upsData.outputVoltA_PF || undefined,
    outputVoltB_T: upsData.outputVoltB_T || 0,
    outputVoltB_PF: upsData.outputVoltB_PF || undefined,
    outputVoltC_T: upsData.outputVoltC_T || 0,
    outputVoltC_PF: upsData.outputVoltC_PF || undefined,
    outputCurrA_T: upsData.outputCurrA_T || 0,
    outputCurrA_PF: upsData.outputCurrA_PF || undefined,
    outputCurrB_T: upsData.outputCurrB_T || 0,
    outputCurrB_PF: upsData.outputCurrB_PF || undefined,
    outputCurrC_T: upsData.outputCurrC_T || 0,
    outputCurrC_PF: upsData.outputCurrC_PF || undefined,
    outputFreq_T: upsData.outputFreq_T || 0,
    outputFreq_PF: upsData.outputFreq_PF || undefined,
    outputLoadA: upsData.outputLoadA || 0,
    outputLoadB: upsData.outputLoadB || 0,
    outputLoadC: upsData.outputLoadC || 0,
    totalLoad: upsData.totalLoad || 0,

    // Capacitors / DC/AC - handle field name mappings
    rectFloatVolt_PF: upsData.rectFloatVolt_PF || undefined,
    dcVoltage_T: upsData.dcVoltage_T || 0,
    dcVoltage_PF: upsData.dcVoltage_PF || undefined,
    acRipple_T: upsData.acRipple_T || 0,
    acRipple_PF: upsData.acRipple_PF || undefined,
    dcCurrent_T: upsData.dcCurrent_T || 0,
    dcCurrent_PF: upsData.dcCurrent_PF || undefined,
    acRippleVolt_T: upsData.acRippleVolt_T || 0,
    acRippleVolt_PF: upsData.acRippleVolt_PF || undefined,
    postoGND_T: upsData.posToGND_T || 0, // Note: posToGND_T -> postoGND_T
    postoGND_PF: upsData.posToGND_PF || undefined,
    acRippleCurr_T: upsData.acRippleCurr_T || 0,
    acRippleCurr_PF: upsData.acRippleCurr_PF || undefined,
    negtoGND_T: upsData.negToGND_T || 0, // Note: negToGND_T -> negtoGND_T
    negtoGND_PF: upsData.negToGND_PF || undefined,
    outputLoadA_PF: upsData.outputLoadA_PF || undefined,
    outputLoadB_PF: upsData.outputLoadB_PF || undefined,
    outputLoadC_PF: upsData.outputLoadC_PF || undefined,

    dcCapsLeak_PF: upsData.dcCapsLeak_PF || undefined,
    dcCapsAge_PF: upsData.dcCapsAge_PF || undefined,
    acInputCapsLeak_PF: upsData.acInputCapsLeak_PF || undefined,
    acInputCapsAge_PF: upsData.acInputCapsAge_PF || undefined,
    acOutputCapsLeak_PF: upsData.acOutputCapsLeak_PF || undefined,
    acOutputCapsAge_PF: upsData.acOutputCapsAge_PF || undefined,
    commCapsLeak_PF: upsData.commCapsLeak_PF || undefined,
    commCapsAge_PF: upsData.commCapsAge_PF || undefined,
    dcgAction1: upsData.dcgAction1 || undefined,
    custAction1: upsData.custAction1 || undefined,
    manufSpecification: upsData.manufSpecification || undefined,
    dcgAction2: upsData.dcgAction2 || undefined,
    custAction2: upsData.custAction2 || undefined,

    dcCapsYear: upsData.dcCapsYear || 0,
    acInputCapsYear: upsData.acInputCapsYear || 0,
    acOutputCapsYear: upsData.acOutputCapsYear || 0,
    commCapsYear: upsData.commCapsYear || 0,
    fansYear: upsData.fansYear || 0,

    location: upsData.location || undefined,
    snmpPresent: upsData.snmpPresent || undefined,
    saveAsDraft: upsData.saveAsDraft || false,
    modularUPS: upsData.modularUPS || undefined
  };
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

    // Basic info
    manufacturer: dto.manufacturer || '',
    kva: dto.kva || '',
    multiModule: dto.multiModule || '',
    maintByPass: dto.maintByPass || '',
    other: dto.other || '',
    modelNo: dto.modelNo || '',
    serialNo: dto.serialNo || '',
    location: dto.location || '',
    status: dto.status || '',
    statusReason: dto.statusReason || '',
    parallelCabinet: dto.parallelCabinet || '',
    snmpPresent: dto.snmpPresent || '',
    modularUPS: dto.modularUPS || '',

    // Measurement flags
    measure_Input: dto.measure_Input || '',
    measure_LCD: dto.measure_LCD || '',
    measure_Load: dto.measure_Load || '',
    measure_3Phase: dto.measure_3Phase || '',
    measure_KVA: dto.measure_KVA || '',
    measure_Normal: dto.measure_Normal || '',
    measure_Caliberation: dto.measure_Caliberation || '',
    measure_EOL: dto.measure_EOL || '',

    // Visual inspection flags
    visual_NoAlarms: dto.visual_NoAlarms || '',
    visual_Tightness: dto.visual_Tightness || '',
    visual_Broken: dto.visual_Broken || '',
    visual_Vaccum: dto.visual_Vaccum || '',
    visual_EPO: dto.visual_EPO || '',
    visual_Noise: dto.visual_Noise || '',
    visual_FansAge: dto.visual_FansAge || '',
    visual_ReplaceFilters: dto.visual_ReplaceFilters || '',

    // Environment flags
    environment_RoomTemp: dto.environment_RoomTemp || '',
    environment_Saftey: dto.environment_Saftey || '',
    environment_Clean: dto.environment_Clean || '',
    environment_Space: dto.environment_Space || '',
    environment_Circuit: dto.environment_Circuit || '',

    // Transfer test flags
    transfer_Major: dto.transfer_Major || '',
    transfer_Static: dto.transfer_Static || '',
    transfer_ByPass: dto.transfer_ByPass || '',
    transfer_Wave: dto.transfer_Wave || '',
    transfer_Normal: dto.transfer_Normal || '',
    transfer_Alarm: dto.transfer_Alarm || '',

    // Comments
    comments1: dto.comments1 || '',
    comments2: dto.comments2 || '',
    comments3: dto.comments3 || '',
    comments4: dto.comments4 || '',
    comments5: dto.comments5 || '',

    // Air filter data - convert numbers back to strings
    afLength: dto.afLength?.toString() || '',
    afWidth: dto.afWidth?.toString() || '',
    afThick: dto.afThickness?.toString() || '', // Note: afThickness -> afThick
    afQty: dto.afQty?.toString() || '',
    afLength1: dto.afLength1?.toString() || '',
    afWidth1: dto.afWidth1?.toString() || '',
    afThick1: dto.afThickness1?.toString() || '', // Note: afThickness1 -> afThick1
    afQty1: dto.afQty1?.toString() || '',

    // Date information - convert back
    monthName: dto.dateCodeMonth || '',
    year: dto.dateCodeYear || 0,

    // Input voltage configuration and readings
    input: dto.input || '',
    inputVoltA_T: dto.inputVoltA_T || 0,
    inputVoltA_PF: dto.inputVoltA_PF || '',
    inputVoltB_T: dto.inputVoltB_T || 0,
    inputVoltB_PF: dto.inputVoltB_PF || '',
    inputVoltC_T: dto.inputVoltC_T || 0,
    inputVoltC_PF: dto.inputVoltC_PF || '',
    inputCurrA_T: dto.inputCurrA_T || 0,
    inputCurrA_PF: dto.inputCurrA_PF || '',
    inputCurrB_T: dto.inputCurrB_T || 0,
    inputCurrB_PF: dto.inputCurrB_PF || '',
    inputCurrC_T: dto.inputCurrC_T || 0,
    inputCurrC_PF: dto.inputCurrC_PF || '',
    inputFreq_T: dto.inputFreq_T || 0,
    inputFreq_PF: dto.inputFreq_PF || '',

    // Bypass voltage configuration and readings
    bypass: dto.bypass || '',
    bypassVoltA_T: dto.bypassVoltA_T || 0,
    bypassVoltA_PF: dto.bypassVoltA_PF || '',
    bypassVoltB_T: dto.bypassVoltB_T || 0,
    bypassVoltB_PF: dto.bypassVoltB_PF || '',
    bypassVoltC_T: dto.bypassVoltC_T || 0,
    bypassVoltC_PF: dto.bypassVoltC_PF || '',
    bypassCurrA_T: dto.bypassCurrA_T || 0,
    bypassCurrA_PF: dto.bypassCurrA_PF || '',
    bypassCurrB_T: dto.bypassCurrB_T || 0,
    bypassCurrB_PF: dto.bypassCurrB_PF || '',
    bypassCurrC_T: dto.bypassCurrC_T || 0,
    bypassCurrC_PF: dto.bypassCurrC_PF || '',
    bypassFreq_T: dto.bypassFreq_T || 0,
    bypassFreq_PF: dto.bypassFreq_PF || '',

    // Output voltage configuration and readings
    output: dto.output || '',
    outputVoltA_T: dto.outputVoltA_T || 0,
    outputVoltA_PF: dto.outputVoltA_PF || '',
    outputVoltB_T: dto.outputVoltB_T || 0,
    outputVoltB_PF: dto.outputVoltB_PF || '',
    outputVoltC_T: dto.outputVoltC_T || 0,
    outputVoltC_PF: dto.outputVoltC_PF || '',
    outputCurrA_T: dto.outputCurrA_T || 0,
    outputCurrA_PF: dto.outputCurrA_PF || '',
    outputCurrB_T: dto.outputCurrB_T || 0,
    outputCurrB_PF: dto.outputCurrB_PF || '',
    outputCurrC_T: dto.outputCurrC_T || 0,
    outputCurrC_PF: dto.outputCurrC_PF || '',
    outputFreq_T: dto.outputFreq_T || 0,
    outputFreq_PF: dto.outputFreq_PF || '',
    outputLoadA: dto.outputLoadA || 0,
    outputLoadA_PF: dto.outputLoadA_PF || '',
    outputLoadB: dto.outputLoadB || 0,
    outputLoadB_PF: dto.outputLoadB_PF || '',
    outputLoadC: dto.outputLoadC || 0,
    outputLoadC_PF: dto.outputLoadC_PF || '',
    totalLoad: dto.totalLoad || 0,

    // Rectifier readings - handle field name mappings
    rectFloatVolt_PF: dto.rectFloatVolt_PF || '',
    dcVoltage_T: dto.dcVoltage_T || 0,
    dcVoltage_PF: dto.dcVoltage_PF || '',
    acRipple_T: dto.acRipple_T || 0,
    acRipple_PF: dto.acRipple_PF || '',
    dcCurrent_T: dto.dcCurrent_T || 0,
    dcCurrent_PF: dto.dcCurrent_PF || '',
    acRippleVolt_T: dto.acRippleVolt_T || 0,
    acRippleVolt_PF: dto.acRippleVolt_PF || '',
    posToGND_T: dto.postoGND_T || 0, // Note: postoGND_T -> posToGND_T
    posToGND_PF: dto.postoGND_PF || '',
    acRippleCurr_T: dto.acRippleCurr_T || 0,
    acRippleCurr_PF: dto.acRippleCurr_PF || '',
    negToGND_T: dto.negtoGND_T || 0, // Note: negtoGND_T -> negToGND_T
    negToGND_PF: dto.negtoGND_PF || '',

    // Capacitor information
    dcCapsLeak_PF: dto.dcCapsLeak_PF || '',
    dcCapsAge_PF: dto.dcCapsAge_PF || '',
    dcCapsYear: dto.dcCapsYear || 0,
    acInputCapsLeak_PF: dto.acInputCapsLeak_PF || '',
    acInputCapsAge_PF: dto.acInputCapsAge_PF || '',
    acInputCapsYear: dto.acInputCapsYear || 0,
    acOutputCapsLeak_PF: dto.acOutputCapsLeak_PF || '',
    acOutputCapsAge_PF: dto.acOutputCapsAge_PF || '',
    acOutputCapsYear: dto.acOutputCapsYear || 0,
    commCapsLeak_PF: dto.commCapsLeak_PF || '',
    commCapsAge_PF: dto.commCapsAge_PF || '',
    commCapsYear: dto.commCapsYear || 0,

    // Fan information
    fansYear: dto.fansYear || 0,

    // Action items
    dcgAction1: dto.dcgAction1 || '',
    custAction1: dto.custAction1 || '',
    manufSpecification: dto.manufSpecification || '',
    dcgAction2: dto.dcgAction2 || '',
    custAction2: dto.custAction2 || '',

    // Service description and maintenance info
    svcDescr: '', // Not available in DTO
    maintAuthId: dto.maint_Auth_ID || '',
    saveAsDraft: dto.saveAsDraft || false,

    // Battery string info
    batteryStringID: dto.batteryStringID || 0,

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
    dateCodeYear: new Date().getFullYear(),
    maint_Auth_ID: maintAuthId,

    // Boolean fields with defaults
    chkDCBreak: false,
    chkOverLoad: false,
    chkTransfer: false,
    chkFault: false,
    saveAsDraft: false,

    // Numeric fields with defaults
    batteryStringID: 0,
    afLength: 0,
    afWidth: 0,
    afThickness: 0,
    afQty: 0,
    afLength1: 0,
    afWidth1: 0,
    afThickness1: 0,
    afQty1: 0,

    // Input readings with defaults
    inputVoltA_T: 0,
    inputVoltB_T: 0,
    inputVoltC_T: 0,
    inputCurrA_T: 0,
    inputCurrB_T: 0,
    inputCurrC_T: 0,
    inputFreq_T: 0,

    // Bypass readings with defaults
    bypassVoltA_T: 0,
    bypassVoltB_T: 0,
    bypassVoltC_T: 0,
    bypassCurrA_T: 0,
    bypassCurrB_T: 0,
    bypassCurrC_T: 0,
    bypassFreq_T: 0,

    // Output readings with defaults
    outputVoltA_T: 0,
    outputVoltB_T: 0,
    outputVoltC_T: 0,
    outputCurrA_T: 0,
    outputCurrB_T: 0,
    outputCurrC_T: 0,
    outputFreq_T: 0,
    outputLoadA: 0,
    outputLoadB: 0,
    outputLoadC: 0,
    totalLoad: 0,

    // DC/AC readings with defaults
    dcVoltage_T: 0,
    acRipple_T: 0,
    dcCurrent_T: 0,
    acRippleVolt_T: 0,
    postoGND_T: 0,
    acRippleCurr_T: 0,
    negtoGND_T: 0,

    // Year fields with defaults
    dcCapsYear: 0,
    acInputCapsYear: 0,
    acOutputCapsYear: 0,
    commCapsYear: 0,
    fansYear: 0
  };
}