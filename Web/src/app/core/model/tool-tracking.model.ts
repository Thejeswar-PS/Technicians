// Commented out - replaced with tracking endpoint
// export interface TechToolsMiscKitDto {
//   toolKitPNMisc: string;
//   description: string;
//   techValue: string;
//   columnOrder: number;
// }

export interface ToolsTrackingTechsDto {
  techID: string;
  techname: string;
}

export interface ToolsTrackingTechsApiResponse {
  success: boolean;
  data: ToolsTrackingTechsDto[];
  totalRecords: number;
  message: string;
}

export interface TechsInfoDto {
  techID: string;
  techName: string;
  empName: string;
  department: string;
  status: string;
}

// export interface TechToolsMiscKitResultDto {
//   toolKitData: TechToolsMiscKitDto[];
//   techInfo: TechsInfoDto;
// }

export interface ToolsTrackingCountDto {
  count: number;
}

export interface ToolTrackingCountApiResponse {
  success: boolean;
  data: ToolsTrackingCountDto;
  techId: string;
  count: number;
  message: string;
}

// New tracking DTOs
export interface TechToolsTrackingDto {
  techID: string;
  toolName: string;
  serialNo: string;
  dueDt: Date | string;           // Backend: DueDt
  columnOrder: number;           // Backend: ColumnOrder
  status: string;                // Backend: Status
  createdDate: Date;            // Backend: CreatedDate
  modifiedDate: Date;           // Backend: ModifiedDate
  notes: string;                // Backend: Notes
  received: string;             // Backend: Received (string, not boolean)
  newMTracking: string;         // Backend: NewMTracking
  oldMSerialNo: string;         // Backend: OldMSerialNo
  oldMTracking: string;         // Backend: OldMTracking
  // UI-specific properties for inline editing
  isEditing?: boolean;
  originalValues?: TechToolsTrackingDto;
}

export interface ToolTrackingApiResponse {
  success: boolean;
  data: TechToolsTrackingDto[];
  totalRecords: number;
  techInfo: TechsInfoDto;
  techId: string;
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

// Equipment file attachment models - matching legacy BLOB storage
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