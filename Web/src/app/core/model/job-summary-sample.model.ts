/**
 * Models for Job Summary Sample functionality
 * Based on GetJobSummarySample API and DTOs
 */

/**
 * Request DTO for GetJobSummarySample API
 */
export interface JobSummarySampleRequest {
  callNbr: string;
  equipId: number;
  equipType: string;
  scheduled: string; // 'Y' or 'N'
}

/**
 * Response DTO for GetJobSummarySample API
 */
export interface JobSummarySampleResponse {
  equipType: string;
  primaryData: any;
  secondaryData?: any;
  hasSecondaryData: boolean;
}

/**
 * Battery String DTO for BATTERY equipment type primary data
 */
export interface BatteryString {
  callNbr: string;
  equipId: number;
  stringId: number;
  battPerString: number;
  voltageV?: number;
  voltageS?: number;
  floatVoltV?: number;
  floatVoltS?: number;
  discharge?: string;
  dischargeTime?: string;
  condition?: string;
  notes?: string;
  targetVoltage?: number;
  batteryType?: string;
  batteryHousing?: string;
  created?: Date;
  maintAuthID?: string;
  [key: string]: any; // Add index signature for dynamic access
}

/**
 * Battery Details DTO for BATTERY equipment type secondary data
 */
export interface BatteryDetails {
  callNbr: string;
  equipId: number;
  stringId: number;
  batteryNo: number;
  voltageV?: number;
  voltageS?: number;
  condition?: string;
  replacementNeeded?: string;
  monitoringBattery?: string;
  cracks?: string;
  notes?: string;
  created?: Date;
  [key: string]: any; // Add index signature for dynamic access
}

/**
 * Dynamic data for non-BATTERY equipment types
 */
export interface DynamicEquipmentData {
  [key: string]: any;
}

/**
 * Common equipment type definitions
 */
export const EQUIPMENT_TYPES = {
  BATTERY: 'BATTERY',
  UPS: 'UPS',
  ATS: 'ATS',
  PDU: 'PDU',
  RECTIFIER: 'RECTIFIER',
  GENERATOR: 'GENERATOR',
  HVAC: 'HVAC',
  SCC: 'SCC',
  STATIC_SWITCH: 'STATIC SWITCH',
  STS: 'STS'
} as const;

export type EquipmentType = typeof EQUIPMENT_TYPES[keyof typeof EQUIPMENT_TYPES];

/**
 * Component state interface for Job Summary Sample
 */
export interface JobSummarySampleState {
  loading: boolean;
  error: string | null;
  data: JobSummarySampleResponse | null;
}

/**
 * Filter options for job summary data
 */
export interface JobSummaryFilters {
  equipType: string;
  scheduled: string;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
}

/**
 * Display configuration for different equipment types
 */
export interface EquipmentDisplayConfig {
  equipType: string;
  primaryColumns: ColumnConfig[];
  secondaryColumns?: ColumnConfig[];
  showSecondaryData: boolean;
}

/**
 * Column configuration for data tables
 */
export interface ColumnConfig {
  key: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  format?: string; // For dates, numbers, etc.
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
}

/**
 * Battery-specific display configurations
 */
export const BATTERY_PRIMARY_COLUMNS: ColumnConfig[] = [
  { key: 'stringId', label: 'String ID', type: 'number', sortable: true },
  { key: 'battPerString', label: 'Batteries per String', type: 'number', sortable: true },
  { key: 'voltageV', label: 'Voltage V', type: 'number', format: '1.2-2', sortable: true },
  { key: 'voltageS', label: 'Voltage S', type: 'number', format: '1.2-2', sortable: true },
  { key: 'floatVoltV', label: 'Float Volt V', type: 'number', format: '1.2-2', sortable: true },
  { key: 'floatVoltS', label: 'Float Volt S', type: 'number', format: '1.2-2', sortable: true },
  { key: 'discharge', label: 'Discharge', type: 'string', sortable: true },
  { key: 'dischargeTime', label: 'Discharge Time', type: 'string', sortable: true },
  { key: 'condition', label: 'Condition', type: 'string', sortable: true },
  { key: 'targetVoltage', label: 'Target Voltage', type: 'number', format: '1.2-2', sortable: true },
  { key: 'batteryType', label: 'Battery Type', type: 'string', sortable: true },
  { key: 'batteryHousing', label: 'Battery Housing', type: 'string', sortable: true },
  { key: 'created', label: 'Created', type: 'date', format: 'short', sortable: true }
];

export const BATTERY_SECONDARY_COLUMNS: ColumnConfig[] = [
  { key: 'stringId', label: 'String ID', type: 'number', sortable: true },
  { key: 'batteryNo', label: 'Battery No', type: 'number', sortable: true },
  { key: 'voltageV', label: 'Voltage V', type: 'number', format: '1.2-2', sortable: true },
  { key: 'voltageS', label: 'Voltage S', type: 'number', format: '1.2-2', sortable: true },
  { key: 'condition', label: 'Condition', type: 'string', sortable: true },
  { key: 'replacementNeeded', label: 'Replacement Needed', type: 'string', sortable: true },
  { key: 'monitoringBattery', label: 'Monitoring Battery', type: 'string', sortable: true },
  { key: 'cracks', label: 'Cracks', type: 'string', sortable: true },
  { key: 'notes', label: 'Notes', type: 'string', width: '200px' },
  { key: 'created', label: 'Created', type: 'date', format: 'short', sortable: true }
];

/**
 * Equipment display configurations
 */
export const EQUIPMENT_DISPLAY_CONFIGS: { [key: string]: EquipmentDisplayConfig } = {
  [EQUIPMENT_TYPES.BATTERY]: {
    equipType: EQUIPMENT_TYPES.BATTERY,
    primaryColumns: BATTERY_PRIMARY_COLUMNS,
    secondaryColumns: BATTERY_SECONDARY_COLUMNS,
    showSecondaryData: true
  },
  // Other equipment types will use dynamic columns based on API response
  [EQUIPMENT_TYPES.UPS]: {
    equipType: EQUIPMENT_TYPES.UPS,
    primaryColumns: [], // Will be populated dynamically
    showSecondaryData: false
  },
  [EQUIPMENT_TYPES.ATS]: {
    equipType: EQUIPMENT_TYPES.ATS,
    primaryColumns: [], // Will be populated dynamically
    showSecondaryData: false
  },
  [EQUIPMENT_TYPES.PDU]: {
    equipType: EQUIPMENT_TYPES.PDU,
    primaryColumns: [], // Will be populated dynamically
    showSecondaryData: false
  },
  [EQUIPMENT_TYPES.RECTIFIER]: {
    equipType: EQUIPMENT_TYPES.RECTIFIER,
    primaryColumns: [], // Will be populated dynamically
    showSecondaryData: false
  },
  [EQUIPMENT_TYPES.GENERATOR]: {
    equipType: EQUIPMENT_TYPES.GENERATOR,
    primaryColumns: [], // Will be populated dynamically
    showSecondaryData: false
  },
  [EQUIPMENT_TYPES.HVAC]: {
    equipType: EQUIPMENT_TYPES.HVAC,
    primaryColumns: [], // Will be populated dynamically
    showSecondaryData: false
  },
  [EQUIPMENT_TYPES.SCC]: {
    equipType: EQUIPMENT_TYPES.SCC,
    primaryColumns: [], // Will be populated dynamically
    showSecondaryData: false
  },
  [EQUIPMENT_TYPES.STATIC_SWITCH]: {
    equipType: EQUIPMENT_TYPES.STATIC_SWITCH,
    primaryColumns: [], // Will be populated dynamically
    showSecondaryData: false
  },
  [EQUIPMENT_TYPES.STS]: {
    equipType: EQUIPMENT_TYPES.STS,
    primaryColumns: [], // Will be populated dynamically
    showSecondaryData: false
  }
};

/**
 * Utility functions for Job Summary Sample
 */
export class JobSummarySampleUtils {
  /**
   * Check if equipment type is BATTERY
   */
  static isBatteryType(equipType: string): boolean {
    return equipType?.toUpperCase() === EQUIPMENT_TYPES.BATTERY;
  }

  /**
   * Get display configuration for equipment type
   */
  static getDisplayConfig(equipType: string): EquipmentDisplayConfig {
    return EQUIPMENT_DISPLAY_CONFIGS[equipType?.toUpperCase()] || {
      equipType,
      primaryColumns: [],
      showSecondaryData: false
    };
  }

  /**
   * Generate dynamic columns from data
   */
  static generateDynamicColumns(data: any[]): ColumnConfig[] {
    if (!data || data.length === 0) return [];

    const firstRow = data[0];
    const columns: ColumnConfig[] = [];

    Object.keys(firstRow).forEach(key => {
      const value = firstRow[key];
      let type: 'string' | 'number' | 'date' | 'boolean' = 'string';

      // Determine column type based on value
      if (typeof value === 'number') {
        type = 'number';
      } else if (typeof value === 'boolean') {
        type = 'boolean';
      } else if (value instanceof Date || this.isDateString(value)) {
        type = 'date';
      }

      columns.push({
        key,
        label: this.formatColumnLabel(key),
        type,
        sortable: true,
        filterable: true
      });
    });

    return columns;
  }

  /**
   * Check if string value represents a date
   */
  private static isDateString(value: any): boolean {
    if (typeof value !== 'string') return false;
    
    // Common date patterns
    const datePatterns = [
      /^\d{4}-\d{2}-\d{2}/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}/, // MM/DD/YYYY
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/ // ISO datetime
    ];

    return datePatterns.some(pattern => pattern.test(value));
  }

  /**
   * Format column key to readable label
   */
  private static formatColumnLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()) // Capitalize first letter
      .trim();
  }

  /**
   * Validate job summary sample request
   */
  static validateRequest(request: JobSummarySampleRequest): string[] {
    const errors: string[] = [];

    if (!request.callNbr?.trim()) {
      errors.push('Call Number is required');
    }

    if (!request.equipId || request.equipId <= 0) {
      errors.push('Valid Equipment ID is required');
    }

    if (!request.equipType?.trim()) {
      errors.push('Equipment Type is required');
    }

    if (request.scheduled && !['Y', 'N'].includes(request.scheduled.toUpperCase())) {
      errors.push('Scheduled must be Y or N');
    }

    return errors;
  }

  /**
   * Format equipment type for display
   */
  static formatEquipmentType(equipType: string): string {
    if (!equipType) return '';
    
    return equipType
      .split(/[\s_]+/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}