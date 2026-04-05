using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Repository;
using Technicians.Api.Models;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ToolsTrackingTechsController : ControllerBase
    {
        private readonly ToolsTrackingTechsRepository _repository;
        private readonly ILogger<ToolsTrackingTechsController> _logger;

        public ToolsTrackingTechsController(
            ToolsTrackingTechsRepository repository,
            ILogger<ToolsTrackingTechsController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        /// <summary>
        /// Gets tools tracking technicians data from the database - Enhanced with role-based filtering
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<ToolsTrackingTechsDto>>> GetToolsTrackingTechs(
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            try
            {
                _logger.LogInformation("Getting tools tracking techs data with role filtering");

                // Repository handles role-based filtering
                var filteredResults = await _repository.GetToolsTrackingTechsAsync(userEmpID, windowsID);

                _logger.LogInformation("Successfully retrieved tools tracking techs data - RecordCount: {RecordCount}",
                    filteredResults.Count);

                return Ok(new
                {
                    success = true,
                    data = filteredResults,
                    totalRecords = filteredResults.Count,
                    isFiltered = !string.IsNullOrEmpty(userEmpID) || !string.IsNullOrEmpty(windowsID),
                    filterCriteria = BuildFilterCriteria(userEmpID, windowsID),
                    message = "Tools tracking techs data retrieved successfully"
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tools tracking techs data");

                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve tools tracking techs data",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Gets tool serial numbers by tool name - Enhanced with role-based filtering
        /// </summary>
        /// <param name="toolName">Tool name to filter by (optional, defaults to "All")</param>
        [HttpGet("serial-numbers")]
        public async Task<ActionResult<List<TechToolSerialNoDto>>> GetTechToolSerialNos(
            [FromQuery] string toolName = "All",
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            try
            {
                _logger.LogInformation("Getting tool serial numbers for tool: {ToolName} with role filtering", toolName);

                // Repository handles role-based filtering
                var results = await _repository.GetTechToolSerialNosAsync(toolName, userEmpID, windowsID);

                _logger.LogInformation("Successfully retrieved tool serial numbers - RecordCount: {RecordCount}",
                    results.Count);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalRecords = results.Count,
                    isFiltered = !string.IsNullOrEmpty(userEmpID) || !string.IsNullOrEmpty(windowsID),
                    message = $"Tool serial numbers retrieved successfully for tool: {toolName}"
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tool serial numbers for tool: {ToolName}", toolName);

                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve tool serial numbers",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Gets tools calendar tracking data with due counts - Enhanced with role-based filtering and KPI drill-down
        /// Uses legacy date logic: 15th of previous month to 15th of next month
        /// Implements legacy logic: Technicians see only their own calendar data, disabled dropdowns
        /// Managers/Other: Can view all calendars and modify filters
        /// Enhanced KPI Drill-Down: When bucket is specified, overrides date filtering to show exact KPI records
        /// </summary>
        /// <param name="startDate">Start date for filtering (optional, defaults to 15th of previous month, ignored when bucket is specified)</param>
        /// <param name="endDate">End date for filtering (optional, defaults to 15th of next month, ignored when bucket is specified)</param>
        /// <param name="toolName">Tool name to filter by (optional, defaults to "All")</param>
        /// <param name="serialNo">Serial number to filter by (optional, defaults to "All")</param>
        /// <param name="techFilter">Tech filter (optional, defaults to "All")</param>
        /// <param name="bucket">KPI bucket for drill-down (overdue, due15, due30, due45, due60) - overrides date filtering</param>
        [HttpGet("calendar-tracking")]
        public async Task<ActionResult<ToolsCalendarTrackingResultDto>> GetToolsCalendarTracking(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string toolName = "All",
            [FromQuery] string serialNo = "All",
            [FromQuery] string techFilter = "All",
            [FromQuery] string? bucket = null,
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            try
            {
                // Enhanced KPI Drill-Down Logic:
                // When bucket is specified, we need to get ALL data without date restrictions
                // to ensure consistency with KPI calculations that use global DATEDIFF logic
                DateTime effectiveStartDate;
                DateTime effectiveEndDate;
                bool isKpiDrillDown = !string.IsNullOrEmpty(bucket);

                if (isKpiDrillDown)
                {
                    // For KPI drill-down, use a very wide date range to capture all relevant records
                    // This ensures we get the same dataset that KPI calculations use
                    effectiveStartDate = new DateTime(2000, 1, 1); // Far past date
                    effectiveEndDate = new DateTime(2099, 12, 31);   // Far future date
                    
                    _logger.LogInformation(
                        "KPI Drill-Down Mode - Using expanded date range for bucket: {Bucket}", bucket);
                }
                else
                {
                    // Legacy date logic: 15th of previous month to 15th of next month
                    var today = DateTime.Today;
                    
                    effectiveStartDate = startDate ?? new DateTime(
                        today.Year,
                        today.Month,
                        15).AddMonths(-1); // 15th of previous month
                    
                    effectiveEndDate = endDate ?? new DateTime(
                        today.Year,
                        today.Month,
                        15).AddMonths(1); // 15th of next month
                }

                _logger.LogInformation(
                    "Getting tools calendar tracking data with role filtering - StartDate: {StartDate}, EndDate: {EndDate}, ToolName: {ToolName}, SerialNo: {SerialNo}, TechFilter: {TechFilter}, Bucket: {Bucket}, KpiDrillDown: {KpiDrillDown}",
                    effectiveStartDate, effectiveEndDate, toolName, serialNo, techFilter, bucket ?? "None", isKpiDrillDown);

                // Repository handles role-based filtering
                var results = await _repository.GetToolsCalendarTrackingAsync(
                    effectiveStartDate, effectiveEndDate, toolName, serialNo, techFilter, userEmpID, windowsID);

                // Enhanced KPI Drill-Down Filtering:
                // Apply bucket filtering consistently with KPI calculation logic
                if (isKpiDrillDown && !string.IsNullOrEmpty(bucket))
                {
                    var today = DateTime.Today;
                    var originalCount = results.TrackingData.Count;

                    results.TrackingData = results.TrackingData.Where(record =>
                    {
                        // Use the same DATEDIFF logic as KPI calculations
                        var daysDifference = (record.DueDt.Date - today).Days;

                        return bucket.ToLower() switch
                        {
                            "overdue" => daysDifference < 0,
                            "due15" => daysDifference >= 0 && daysDifference < 15,
                            "due30" => daysDifference >= 15 && daysDifference < 30,
                            "due45" => daysDifference >= 30 && daysDifference < 45,
                            "due60" => daysDifference >= 45 && daysDifference < 60,
                            _ => true // Unknown bucket, return all records
                        };
                    }).ToList();

                    _logger.LogInformation(
                        "KPI Drill-Down Filtering Applied - Bucket: {Bucket}, OriginalRecords: {OriginalCount}, FilteredRecords: {FilteredCount}",
                        bucket, originalCount, results.TrackingData.Count);
                }
                else if (!isKpiDrillDown)
                {
                    // For regular (non-KPI drill-down) requests, apply legacy bucket filtering if specified
                    // This maintains backward compatibility for existing filtering functionality
                    if (!string.IsNullOrEmpty(bucket))
                    {
                        var originalCount = results.TrackingData.Count;
                        
                        results.TrackingData = results.TrackingData.Where(x =>
                        {
                            var diff = (x.DueDt.Date - DateTime.Today).Days;

                            return bucket.ToLower() switch
                            {
                                "overdue" => diff < 0,
                                "due15" => diff >= 0 && diff < 15,
                                "due30" => diff >= 15 && diff < 30,
                                "due45" => diff >= 30 && diff < 45,
                                "due60" => diff >= 45 && diff < 60,
                                _ => true
                            };
                        }).ToList();
                        
                        _logger.LogInformation(
                            "Legacy Bucket Filtering Applied - Bucket: {Bucket}, OriginalRecords: {OriginalCount}, FilteredRecords: {FilteredCount}",
                            bucket, originalCount, results.TrackingData.Count);
                    }
                }

                var responseData = new
                {
                    success = true,
                    data = results,
                    totalTrackingRecords = results.TrackingData.Count,
                    dueCounts = results.DueCounts,
                    dateRange = new
                    {
                        startDate = effectiveStartDate,
                        endDate = effectiveEndDate,
                        windowType = isKpiDrillDown ? "kpi-drill-down" : "legacy-compatible",
                        description = isKpiDrillDown 
                            ? "Expanded range for KPI drill-down consistency"
                            : "15th of previous month to 15th of next month"
                    },
                    filters = new
                    {
                        toolName,
                        serialNo,
                        techFilter,
                        bucket = bucket ?? string.Empty
                    },
                    kpiDrillDown = new
                    {
                        isKpiDrillDown,
                        selectedBucket = bucket ?? string.Empty,
                        dateFilterOverridden = isKpiDrillDown
                    },
                    roleBasedFiltering = new
                    {
                        isFiltered = !string.IsNullOrEmpty(userEmpID) || !string.IsNullOrEmpty(windowsID),
                        requestedBy = userEmpID ?? string.Empty
                    },
                    message = isKpiDrillDown 
                        ? $"KPI drill-down data retrieved successfully for bucket: {bucket}"
                        : "Tools calendar tracking data retrieved successfully"
                };

                _logger.LogInformation(
                    "Successfully retrieved tools calendar tracking data - TrackingRecords: {TrackingRecords}, OverDue: {OverDue}, Due15: {Due15}, Due30: {Due30}, Due45: {Due45}, Due60: {Due60}, KpiDrillDown: {KpiDrillDown}",
                    results.TrackingData.Count, 
                    results.DueCounts.OverDue, 
                    results.DueCounts.Due15, 
                    results.DueCounts.Due30,
                    results.DueCounts.Due45,
                    results.DueCounts.Due60,
                    isKpiDrillDown);

                return Ok(responseData);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error getting tools calendar tracking data - StartDate: {StartDate}, EndDate: {EndDate}, ToolName: {ToolName}, SerialNo: {SerialNo}, TechFilter: {TechFilter}, Bucket: {Bucket}",
                    startDate, endDate, toolName, serialNo, techFilter, bucket);

                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve tools calendar tracking data",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Gets tech tools misc kit data by tech ID - Enhanced with role-based filtering
        /// </summary>
        /// <param name="techId">Tech ID to retrieve misc kit data for (required)</param>
        [HttpGet("misc-kit/{techId}")]
        public async Task<ActionResult<TechToolsMiscKitResultDto>> GetTechToolsMiscKitByTechId(
            string techId,
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            if (string.IsNullOrWhiteSpace(techId))
                return BadRequest("Tech ID is required.");

            try
            {
                _logger.LogInformation("Getting tech tools misc kit data for tech ID: {TechId}", techId);

                // Repository handles role-based filtering
                var results = await _repository.GetTechToolsMiscKitByTechIdAsync(techId, userEmpID, windowsID);

                _logger.LogInformation(
                    "Successfully retrieved tech tools misc kit data - TechId: {TechId}, ToolKitRecords: {ToolKitRecords}",
                    techId, results.ToolKitData.Count);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalToolKitRecords = results.ToolKitData.Count,
                    techInfo = results.TechInfo,
                    techId = techId,
                    isFiltered = !string.IsNullOrEmpty(userEmpID) || !string.IsNullOrEmpty(windowsID),
                    message = $"Tech tools misc kit data retrieved successfully for tech ID: {techId}"
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tech tools misc kit data for tech ID: {TechId}", techId);

                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve tech tools misc kit data",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Gets tools tracking count by tech ID - Enhanced with role-based filtering
        /// </summary>
        /// <param name="techId">Tech ID to get count for (required)</param>
        [HttpGet("count/{techId}")]
        public async Task<ActionResult<ToolsTrackingCountDto>> GetToolsTrackingCount(
            string techId,
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            if (string.IsNullOrWhiteSpace(techId))
                return BadRequest("Tech ID is required.");

            try
            {
                _logger.LogInformation("Getting tools tracking count for tech ID: {TechId}", techId);

                // Repository handles role-based filtering
                var count = await _repository.GetToolsTrackingCountAsync(techId, userEmpID, windowsID);

                _logger.LogInformation(
                    "Successfully retrieved tools tracking count - TechId: {TechId}, Count: {Count}",
                    techId, count);

                return Ok(new
                {
                    success = true,
                    data = new ToolsTrackingCountDto { Count = count },
                    techId = techId,
                    count = count,
                    isFiltered = !string.IsNullOrEmpty(userEmpID) || !string.IsNullOrEmpty(windowsID),
                    message = $"Tools tracking count retrieved successfully for tech ID: {techId}"
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tools tracking count for tech ID: {TechId}", techId);

                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve tools tracking count",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Executes insert tech tools query - Enhanced with role-based validation
        /// </summary>
        /// <param name="request">Query execution request</param>
        [HttpPost("execute-query")]
        public async Task<ActionResult<ExecuteInsertTechToolsQueryResultDto>> ExecuteInsertTechToolsQuery(
            [FromBody] ExecuteInsertTechToolsQueryDto request,
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Query))
                return BadRequest("Query is required.");

            try
            {
                _logger.LogInformation("Executing insert tech tools query - Query length: {QueryLength}", 
                    request.Query.Length);

                // Repository handles role-based validation
                var result = await _repository.ExecuteInsertTechToolsQueryAsync(request.Query, userEmpID, windowsID);

                _logger.LogInformation(
                    "Query execution completed - Success: {Success}, ReturnValue: {ReturnValue}",
                    result.Success, result.ReturnValue);

                if (result.Success)
                {
                    return Ok(new
                    {
                        success = true,
                        data = result,
                        isFiltered = !string.IsNullOrEmpty(userEmpID) || !string.IsNullOrEmpty(windowsID),
                        message = "Query executed successfully"
                    });
                }
                else
                {
                    return StatusCode(422, new
                    {
                        success = false,
                        data = result,
                        message = "Query execution failed"
                    });
                }
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing insert tech tools query");

                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to execute insert tech tools query",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Deletes tools tracking data by tech ID - Enhanced with role-based filtering
        /// </summary>
        /// <param name="techId">Tech ID to delete tracking data for (required)</param>
        [HttpDelete("delete/{techId}")]
        public async Task<ActionResult<DeleteToolsTrackingResultDto>> DeleteToolsTracking(
            string techId,
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            if (string.IsNullOrWhiteSpace(techId))
                return BadRequest("Tech ID is required.");

            try
            {
                _logger.LogInformation("Deleting tools tracking data for tech ID: {TechId}", techId);

                // Repository handles role-based filtering
                var result = await _repository.DeleteToolsTrackingAsync(techId, userEmpID, windowsID);

                _logger.LogInformation(
                    "Tools tracking deletion completed - TechId: {TechId}, RowsAffected: {RowsAffected}, Success: {Success}",
                    techId, result.RowsAffected, result.Success);

                if (result.Success)
                {
                    return Ok(new
                    {
                        success = true,
                        data = result,
                        techId = techId,
                        rowsAffected = result.RowsAffected,
                        isFiltered = !string.IsNullOrEmpty(userEmpID) || !string.IsNullOrEmpty(windowsID),
                        message = result.Message
                    });
                }
                else
                {
                    return NotFound(new
                    {
                        success = false,
                        data = result,
                        techId = techId,
                        message = result.Message
                    });
                }
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting tools tracking data for tech ID: {TechId}", techId);

                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to delete tools tracking data",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Gets tech tools tracking data by tech ID - Enhanced with role-based filtering
        /// </summary>
        /// <param name="techId">Tech ID to retrieve tracking data for (required)</param>
        [HttpGet("tracking/{techId}")]
        public async Task<ActionResult<List<TechToolsTrackingDto>>> GetTechToolsTrackingByTechId(
            string techId,
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            if (string.IsNullOrWhiteSpace(techId))
                return BadRequest("Tech ID is required.");

            try
            {
                _logger.LogInformation("Getting tech tools tracking data for tech ID: {TechId}", techId);

                // Repository handles role-based filtering
                var results = await _repository.GetTechToolsTrackingByTechIdAsync(techId, userEmpID, windowsID);

                _logger.LogInformation(
                    "Successfully retrieved tech tools tracking data - TechId: {TechId}, RecordCount: {RecordCount}",
                    techId, results.Count);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalRecords = results.Count,
                    techId = techId,
                    isFiltered = !string.IsNullOrEmpty(userEmpID) || !string.IsNullOrEmpty(windowsID),
                    message = $"Tech tools tracking data retrieved successfully for tech ID: {techId}"
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tech tools tracking data for tech ID: {TechId}", techId);

                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve tech tools tracking data",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Saves/Updates tech tools tracking data using legacy DELETE-INSERT pattern - Enhanced with role-based filtering
        /// Replicates exact behavior of legacy btnSave_Click() and DeleteInsertTechToolsData() methods
        /// </summary>
        /// <param name="request">Save request containing tech ID and tool tracking items</param>
        [HttpPost("save-tracking")]
        public async Task<ActionResult<SaveTechToolsTrackingResultDto>> SaveTechToolsTracking(
            [FromBody] SaveTechToolsTrackingRequestDto request,
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            if (request == null)
                return BadRequest("Request body is required.");

            if (string.IsNullOrWhiteSpace(request.TechID))
                return BadRequest("Tech ID is required.");

            if (string.IsNullOrWhiteSpace(request.ModifiedBy))
                return BadRequest("Modified By is required.");

            if (!request.ToolTrackingItems.Any())
                return BadRequest("At least one tool tracking item is required.");

            try
            {
                _logger.LogInformation(
                    "Saving tech tools tracking data with role filtering - TechId: {TechId}, ItemCount: {ItemCount}, ModifiedBy: {ModifiedBy}",
                    request.TechID, request.ToolTrackingItems.Count, request.ModifiedBy);

                // Repository handles role-based filtering
                var result = await _repository.SaveTechToolsTrackingAsync(request, userEmpID, windowsID);

                _logger.LogInformation(
                    "Tech tools tracking save completed - TechId: {TechId}, Success: {Success}, RecordsProcessed: {RecordsProcessed}",
                    request.TechID, result.Success, result.RecordsProcessed);

                if (result.Success)
                {
                    return Ok(new
                    {
                        success = true,
                        data = result,
                        isFiltered = !string.IsNullOrEmpty(userEmpID) || !string.IsNullOrEmpty(windowsID),
                        message = result.Message
                    });
                }
                else
                {
                    return StatusCode(422, new
                    {
                        success = false,
                        data = result,
                        message = result.Message
                    });
                }
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, 
                    "Error saving tech tools tracking data - TechId: {TechId}", request.TechID);

                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to save tech tools tracking data",
                    error = ex.Message
                });
            }
        }

        #region File Management Endpoints (Legacy DisplayFile, SaveFile equivalent) - Enhanced with role-based filtering

        /// <summary>
        /// Gets file attachments for a tech ID (legacy DisplayFile equivalent) - Enhanced with role-based filtering
        /// </summary>
        /// <param name="techId">Tech ID to get files for (required)</param>
        [HttpGet("files/{techId}")]
        public async Task<ActionResult<List<ToolsTrackingFileDto>>> GetFiles(
            string techId,
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            if (string.IsNullOrWhiteSpace(techId))
                return BadRequest("Tech ID is required.");

            try
            {
                _logger.LogInformation("Getting files for tech ID: {TechId}", techId);

                // Repository handles role-based filtering
                var files = await _repository.GetFilesAsync(techId, userEmpID, windowsID);

                _logger.LogInformation(
                    "Successfully retrieved files - TechId: {TechId}, FileCount: {FileCount}",
                    techId, files.Count);

                return Ok(new
                {
                    success = true,
                    data = files,
                    totalFiles = files.Count,
                    techId = techId,
                    isFiltered = !string.IsNullOrEmpty(userEmpID) || !string.IsNullOrEmpty(windowsID),
                    message = $"Files retrieved successfully for tech ID: {techId}"
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting files for tech ID: {TechId}", techId);

                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve files",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Uploads a file for a tech ID (legacy SaveFile equivalent) - Enhanced with role-based filtering
        /// </summary>
        /// <param name="techId">Tech ID to upload file for</param>
        /// <param name="file">File to upload</param>
        [HttpPost("upload-file/{techId}")]
        public async Task<ActionResult<FileUploadResultDto>> UploadFile(
            string techId, 
            IFormFile file,
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            if (string.IsNullOrWhiteSpace(techId))
                return BadRequest("Tech ID is required.");

            if (file == null || file.Length == 0)
                return BadRequest("File is required and cannot be empty.");

            try
            {
                _logger.LogInformation(
                    "Uploading file - TechId: {TechId}, FileName: {FileName}, FileSize: {FileSize}",
                    techId, file.FileName, file.Length);

                using var stream = file.OpenReadStream();
                // Repository handles role-based filtering
                var result = await _repository.UploadFileAsync(techId, file.FileName, stream, userEmpID, windowsID);

                _logger.LogInformation(
                    "File upload completed - TechId: {TechId}, FileName: {FileName}, Success: {Success}",
                    techId, file.FileName, result.Success);

                if (result.Success)
                {
                    return Ok(new
                    {
                        success = true,
                        data = result,
                        isFiltered = !string.IsNullOrEmpty(userEmpID) || !string.IsNullOrEmpty(windowsID),
                        message = result.Message
                    });
                }
                else
                {
                    return BadRequest(new
                    {
                        success = false,
                        data = result,
                        message = result.Message
                    });
                }
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file for tech ID: {TechId}", techId);

                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to upload file",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Downloads a file for a tech ID - Enhanced with role-based filtering
        /// </summary>
        /// <param name="techId">Tech ID</param>
        /// <param name="fileName">File name to download</param>
        [HttpGet("download-file/{techId}/{fileName}")]
        public async Task<IActionResult> DownloadFile(
            string techId, 
            string fileName,
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            if (string.IsNullOrWhiteSpace(techId))
                return BadRequest("Tech ID is required.");

            if (string.IsNullOrWhiteSpace(fileName))
                return BadRequest("File name is required.");

            try
            {
                // For file download, we need to handle role-based filtering at controller level
                // since we need to return the file directly
                if (!string.IsNullOrEmpty(userEmpID) || !string.IsNullOrEmpty(windowsID))
                {
                    // Check if user has access to this tech ID via repository validation
                    var canAccess = true;
                    try
                    {
                        await _repository.GetFilesAsync(techId, userEmpID, windowsID);
                    }
                    catch (UnauthorizedAccessException)
                    {
                        canAccess = false;
                    }

                    if (!canAccess)
                    {
                        return Forbid("Access denied: You can only access your own tech tools files.");
                    }
                }

                var filePath = Path.Combine(@"\\dcg-file-v\home$\parts\PartsCommon\ETechPartsShipInfo", techId, fileName);
                
                if (!System.IO.File.Exists(filePath))
                    return NotFound($"File '{fileName}' not found for tech ID: {techId}");

                _logger.LogInformation(
                    "Downloading file - TechId: {TechId}, FileName: {FileName}",
                    techId, fileName);

                var fileBytes = await System.IO.File.ReadAllBytesAsync(filePath);
                var contentType = GetContentType(fileName);

                return File(fileBytes, contentType, fileName);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading file - TechId: {TechId}, FileName: {FileName}", techId, fileName);

                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to download file",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Deletes a file for a tech ID - Enhanced with role-based filtering
        /// </summary>
        /// <param name="techId">Tech ID</param>
        /// <param name="fileName">File name to delete</param>
        [HttpDelete("delete-file/{techId}/{fileName}")]
        public async Task<IActionResult> DeleteFile(
            string techId, 
            string fileName,
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            if (string.IsNullOrWhiteSpace(techId))
                return BadRequest("Tech ID is required.");

            if (string.IsNullOrWhiteSpace(fileName))
                return BadRequest("File name is required.");

            try
            {
                _logger.LogInformation(
                    "Deleting file - TechId: {TechId}, FileName: {FileName}",
                    techId, fileName);

                // Repository handles role-based filtering
                var deleted = await _repository.DeleteFileAsync(techId, fileName, userEmpID, windowsID);

                _logger.LogInformation(
                    "File deletion completed - TechId: {TechId}, FileName: {FileName}, Success: {Success}",
                    techId, fileName, deleted);

                if (deleted)
                {
                    return Ok(new
                    {
                        success = true,
                        techId = techId,
                        isFiltered = !string.IsNullOrEmpty(userEmpID) || !string.IsNullOrEmpty(windowsID),
                        message = $"File '{fileName}' deleted successfully for tech ID: {techId}"
                    });
                }
                else
                {
                    return NotFound(new
                    {
                        success = false,
                        message = $"File '{fileName}' not found for tech ID: {techId}"
                    });
                }
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file - TechId: {TechId}, FileName: {FileName}", techId, fileName);

                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to delete file",
                    error = ex.Message
                });
            }
        }

        #endregion

        #region Private Helper Methods

        private string BuildFilterCriteria(string? userEmpID, string? windowsID)
        {
            var criteria = new List<string>();
            
            if (!string.IsNullOrEmpty(userEmpID))
                criteria.Add($"UserEmpID: {userEmpID}");
                
            if (!string.IsNullOrEmpty(windowsID))
                criteria.Add($"WindowsID: {windowsID}");

            return string.Join(", ", criteria);
        }

        /// <summary>
        /// Gets content type for file download
        /// </summary>
        /// <param name="fileName">File name</param>
        private static string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName)?.ToLowerInvariant();
            return extension switch
            {
                ".pdf" => "application/pdf",
                ".doc" => "application/msword",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".xls" => "application/vnd.ms-excel",
                ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                ".jpg" or ".jpeg" => "image/jpeg",
                ".png" => "image/png",
                ".gif" => "image/gif",
                ".bmp" => "image/bmp",
                ".txt" => "text/plain",
                _ => "application/octet-stream"
            };
        }

        #endregion
    }
}