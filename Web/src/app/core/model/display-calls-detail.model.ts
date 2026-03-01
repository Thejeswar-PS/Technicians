/**
 * Request model for NewDisplayCallsDetail API
 */
export interface NewDisplayCallsDetailRequest {
  detailPage: string;
  offId?: string;
}

/**
 * Response model for NewDisplayCallsDetail API
 */
export interface NewDisplayCallsDetailResponse {
  success: boolean;
  originalParameter?: string;
  mappedParameter?: string;
  parameterMapped?: boolean;
  data: any[];
  totals?: any[];
  executionTimeMs?: number;
  message?: string;
  validOptions?: string[];
}

/**
 * Response model for valid detail pages endpoint
 */
export interface ValidDetailPagesResponse {
  success: boolean;
  modernParameterNames: string[];
  legacyParameterMappings: { [key: string]: string };
  info: string;
}
