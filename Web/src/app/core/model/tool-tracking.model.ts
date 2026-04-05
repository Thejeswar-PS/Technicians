/* ============ TOOLS TRACKING TECHS ============ */

export interface ToolsTrackingTechsDto {
  techID: string;
  techname: string;
}

export interface ToolsTrackingTechsApiResponse {
  success: boolean;
  data: ToolsTrackingTechsDto[];
  totalRecords: number;
  isFiltered?: boolean;
  message: string;
}

/* ============ TECH INFO ============ */

export interface TechsInfoDto {
  techID: string;
  techName: string;
  empName: string;
  department: string;
  status: string;
}

/* ============ TECH TOOL SERIAL NUMBERS ============ */

export interface TechToolSerialNoDto {
  serialNo: string;
}

export interface TechToolSerialNoApiResponse {
  success: boolean;
  data: TechToolSerialNoDto[];
  totalRecords: number;
  isFiltered?: boolean;
  message: string;
}

/* ============ TOOLS CALENDAR TRACKING ============ */

export interface ToolsCalendarTrackingDto {
  empName: string;
  techID: string;
  toolName: string;
  serialNo: string;
  dueDt: Date | string;
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

export interface ToolsCalendarTrackingApiResponse {
  success: boolean;
  data: ToolsCalendarTrackingResultDto;
  totalTrackingRecords: number;
  dueCounts: ToolsCalendarDueCountsDto;
  dateRange: {
    startDate: Date | string;
    endDate: Date | string;
    windowType: string;
    description: string;
  };
  filters: {
    toolName: string;
    serialNo: string;
    techFilter: string;
    bucket?: string;
  };
  kpiDrillDown?: {
    isKpiDrillDown: boolean;
    selectedBucket: string;
    dateFilterOverridden: boolean;
  };
  message: string;
  isFiltered?: boolean;
}

/* ============ TECH TOOLS MISC KIT ============ */

export interface TechToolsMiscKitDto {
  toolKitPNMisc: string;
  description: string;
  techValue: string;
  columnOrder: number;
}

export interface TechToolsMiscKitResultDto {
  toolKitData: TechToolsMiscKitDto[];
  techInfo: TechsInfoDto;
}

export interface TechToolsMiscKitApiResponse {
  success: boolean;
  data: TechToolsMiscKitResultDto;
  totalToolKitRecords: number;
  techInfo: TechsInfoDto;
  techId: string;
  isFiltered?: boolean;
  message: string;
}

export interface ToolsTrackingCountDto {
  count: number;
}

export interface ToolTrackingCountApiResponse {
  success: boolean;
  data: ToolsTrackingCountDto;
  techId: string;
  count: number;
  isFiltered?: boolean;
  message: string;
}

/* ============ TECH TOOLS TRACKING (Main Tracking Data) ============ */

export interface TechToolsTrackingDto {
  techID: string;
  toolName: string;
  serialNo: string;
  dueDt: Date | string;
  columnOrder: number;
  status: string;
  createdDate: Date | string;
  modifiedDate: Date | string;
  notes: string;
  received: string; // "True" or "False" as strings
  newMTracking: string;
  oldMSerialNo: string;
  oldMTracking: string;
  // UI-specific properties for inline editing
  isEditing?: boolean;
  originalValues?: TechToolsTrackingDto;
}

export interface ToolTrackingApiResponse {
  success: boolean;
  data: TechToolsTrackingDto[];
  totalRecords: number;
  techId: string;
  isFiltered?: boolean;
  message: string;
}

// Other DTOs for completeness
export interface ExecuteInsertTechToolsQueryDto {
  query: string;
}

export interface ExecuteInsertTechToolsQueryResultDto {
  success: boolean;
  returnValue: number;
  message: string;
}

export interface DeleteToolsTrackingResultDto {
  rowsAffected: number;
  success: boolean;
  message: string;
}

/* ============ SAVE/UPDATE TECH TOOLS TRACKING ============ */

export interface SaveTechToolsTrackingRequestDto {
  techID: string;
  modifiedBy: string;
  toolTrackingItems: TechToolsTrackingDto[];
}

export interface SaveTechToolsTrackingResultDto {
  success: boolean;
  message: string;
  recordsProcessed: number;
  generatedQuery: string;
}

export interface SaveTechToolsTrackingApiResponse {
  success: boolean;
  data: SaveTechToolsTrackingResultDto;
  isFiltered?: boolean;
  message: string;
}

/* ============ FILE MANAGEMENT ============ */

export interface ToolsTrackingFileDto {
  fileName: string;
  fileSizeKB: number;
  uploadedOn: string;
  filePath: string;
}

export interface ToolsTrackingFilesApiResponse {
  success: boolean;
  data: ToolsTrackingFileDto[];
  totalFiles: number;
  techId: string;
  message: string;
}

export interface FileUploadResultDto {
  success: boolean;
  message: string;
  fileName: string;
  filePath: string;
}

export interface FileUploadApiResponse {
  success: boolean;
  data: FileUploadResultDto;
  message: string;
}

/* ============ EQUIPMENT FILE ATTACHMENTS (Legacy BLOB Storage) ============ */
export interface EquipmentFileDto {
  equipID: number;           // Equipment/Tool ID
  techID: string;           // Technician ID
  img_Title: string;        // Original filename
  img_Type: string;         // File extension/MIME type
  img_Stream: string;       // Base64 encoded file data (BLOB)
  createdBy: string;        // User who uploaded
  createdDate?: Date;       // Upload timestamp
}

export interface SaveEquipmentFileRequestDto {
  equipID: number;
  techID: string;
  img_Title: string;
  img_Type: string;
  img_Stream: string;       // Base64 encoded binary data
  createdBy: string;
}

export interface EquipmentFileApiResponse {
  success: boolean;
  data: EquipmentFileDto[];
  message: string;
}

export interface SaveFileApiResponse {
  success: boolean;
  message: string;
  fileId?: number;
}