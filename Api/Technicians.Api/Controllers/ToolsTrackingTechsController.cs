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
        /// Gets tools tracking technicians data from the database
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<List<ToolsTrackingTechsDto>>> GetToolsTrackingTechs()
        {
            try
            {
                _logger.LogInformation("Getting tools tracking techs data");

                var results = await _repository.GetToolsTrackingTechsAsync();

                _logger.LogInformation("Successfully retrieved tools tracking techs data - RecordCount: {RecordCount}",
                    results.Count);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalRecords = results.Count,
                    message = "Tools tracking techs data retrieved successfully"
                });
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
        /// Gets tool serial numbers by tool name
        /// </summary>
        /// <param name="toolName">Tool name to filter by (optional, defaults to "All")</param>
        [HttpGet("serial-numbers")]
        public async Task<ActionResult<List<TechToolSerialNoDto>>> GetTechToolSerialNos([FromQuery] string toolName = "All")
        {
            try
            {
                _logger.LogInformation("Getting tool serial numbers for tool: {ToolName}", toolName);

                var results = await _repository.GetTechToolSerialNosAsync(toolName);

                _logger.LogInformation("Successfully retrieved tool serial numbers - RecordCount: {RecordCount}",
                    results.Count);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalRecords = results.Count,
                    message = $"Tool serial numbers retrieved successfully for tool: {toolName}"
                });
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
        /// Gets tools calendar tracking data with due counts
        /// Uses legacy date logic: 15th of previous month to 15th of next month
        /// </summary>
        /// <param name="startDate">Start date for filtering (optional, defaults to 15th of previous month)</param>
        /// <param name="endDate">End date for filtering (optional, defaults to 15th of next month)</param>
        /// <param name="toolName">Tool name to filter by (optional, defaults to "All")</param>
        /// <param name="serialNo">Serial number to filter by (optional, defaults to "All")</param>
        /// <param name="techFilter">Tech filter (optional, defaults to "All")</param>
        [HttpGet("calendar-tracking")]
        public async Task<ActionResult<ToolsCalendarTrackingResultDto>> GetToolsCalendarTracking(
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string toolName = "All",
            [FromQuery] string serialNo = "All",
            [FromQuery] string techFilter = "All")
        {
            try
            {
                // Legacy date logic: 15th of previous month to 15th of next month
                var today = DateTime.Today;
                
                var effectiveStartDate = startDate ?? new DateTime(
                    today.Year,
                    today.Month,
                    15).AddMonths(-1); // 15th of previous month
                
                var effectiveEndDate = endDate ?? new DateTime(
                    today.Year,
                    today.Month,
                    15).AddMonths(1); // 15th of next month

                _logger.LogInformation(
                    "Getting tools calendar tracking data - StartDate: {StartDate}, EndDate: {EndDate}, ToolName: {ToolName}, SerialNo: {SerialNo}, TechFilter: {TechFilter}",
                    effectiveStartDate, effectiveEndDate, toolName, serialNo, techFilter);

                var results = await _repository.GetToolsCalendarTrackingAsync(
                    effectiveStartDate, effectiveEndDate, toolName, serialNo, techFilter);

                _logger.LogInformation(
                    "Successfully retrieved tools calendar tracking data - TrackingRecords: {TrackingRecords}, OverDue: {OverDue}, Due15: {Due15}, Due30: {Due30}, Due45: {Due45}, Due60: {Due60}",
                    results.TrackingData.Count, 
                    results.DueCounts.OverDue, 
                    results.DueCounts.Due15, 
                    results.DueCounts.Due30,
                    results.DueCounts.Due45,
                    results.DueCounts.Due60);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalTrackingRecords = results.TrackingData.Count,
                    dueCounts = results.DueCounts,
                    dateRange = new
                    {
                        startDate = effectiveStartDate,
                        endDate = effectiveEndDate,
                        windowType = "legacy-compatible",
                        description = "15th of previous month to 15th of next month"
                    },
                    filters = new
                    {
                        toolName,
                        serialNo,
                        techFilter
                    },
                    message = "Tools calendar tracking data retrieved successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex,
                    "Error getting tools calendar tracking data - StartDate: {StartDate}, EndDate: {EndDate}, ToolName: {ToolName}, SerialNo: {SerialNo}, TechFilter: {TechFilter}",
                    startDate, endDate, toolName, serialNo, techFilter);

                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve tools calendar tracking data",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Gets tech tools misc kit data by tech ID
        /// </summary>
        /// <param name="techId">Tech ID to retrieve misc kit data for (required)</param>
        //[HttpGet("misc-kit/{techId}")]
        //public async Task<ActionResult<TechToolsMiscKitResultDto>> GetTechToolsMiscKitByTechId(string techId)
        //{
        //    if (string.IsNullOrWhiteSpace(techId))
        //        return BadRequest("Tech ID is required.");

        //    try
        //    {
        //        _logger.LogInformation("Getting tech tools misc kit data for tech ID: {TechId}", techId);

        //        var results = await _repository.GetTechToolsMiscKitByTechIdAsync(techId);

        //        _logger.LogInformation(
        //            "Successfully retrieved tech tools misc kit data - TechId: {TechId}, ToolKitRecords: {ToolKitRecords}, TechInfo: {TechInfo}",
        //            techId, results.ToolKitData.Count, results.TechInfo.TechID);

        //        return Ok(new
        //        {
        //            success = true,
        //            data = results,
        //            totalToolKitRecords = results.ToolKitData.Count,
        //            techInfo = results.TechInfo,
        //            techId = techId,
        //            message = $"Tech tools misc kit data retrieved successfully for tech ID: {techId}"
        //        });
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error getting tech tools misc kit data for tech ID: {TechId}", techId);

        //        return StatusCode(500, new
        //        {
        //            success = false,
        //            message = "Failed to retrieve tech tools misc kit data",
        //            error = ex.Message
        //        });
        //    }
        //}

        /// <summary>
        /// Gets tools tracking count by tech ID
        /// </summary>
        /// <param name="techId">Tech ID to get count for (required)</param>
        [HttpGet("count/{techId}")]
        public async Task<ActionResult<ToolsTrackingCountDto>> GetToolsTrackingCount(string techId)
        {
            if (string.IsNullOrWhiteSpace(techId))
                return BadRequest("Tech ID is required.");

            try
            {
                _logger.LogInformation("Getting tools tracking count for tech ID: {TechId}", techId);

                var count = await _repository.GetToolsTrackingCountAsync(techId);

                _logger.LogInformation(
                    "Successfully retrieved tools tracking count - TechId: {TechId}, Count: {Count}",
                    techId, count);

                return Ok(new
                {
                    success = true,
                    data = new ToolsTrackingCountDto { Count = count },
                    techId = techId,
                    count = count,
                    message = $"Tools tracking count retrieved successfully for tech ID: {techId}"
                });
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
        /// Executes insert tech tools query
        /// </summary>
        /// <param name="request">Query execution request</param>
        [HttpPost("execute-query")]
        public async Task<ActionResult<ExecuteInsertTechToolsQueryResultDto>> ExecuteInsertTechToolsQuery(
            [FromBody] ExecuteInsertTechToolsQueryDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.Query))
                return BadRequest("Query is required.");

            try
            {
                _logger.LogInformation("Executing insert tech tools query - Query length: {QueryLength}", 
                    request.Query.Length);

                var result = await _repository.ExecuteInsertTechToolsQueryAsync(request.Query);

                _logger.LogInformation(
                    "Query execution completed - Success: {Success}, ReturnValue: {ReturnValue}",
                    result.Success, result.ReturnValue);

                if (result.Success)
                {
                    return Ok(new
                    {
                        success = true,
                        data = result,
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
        /// Deletes tools tracking data by tech ID
        /// </summary>
        /// <param name="techId">Tech ID to delete tracking data for (required)</param>
        [HttpDelete("delete/{techId}")]
        public async Task<ActionResult<DeleteToolsTrackingResultDto>> DeleteToolsTracking(string techId)
        {
            if (string.IsNullOrWhiteSpace(techId))
                return BadRequest("Tech ID is required.");

            try
            {
                _logger.LogInformation("Deleting tools tracking data for tech ID: {TechId}", techId);

                var result = await _repository.DeleteToolsTrackingAsync(techId);

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
        /// Gets tech tools tracking data by tech ID
        /// </summary>
        /// <param name="techId">Tech ID to retrieve tracking data for (required)</param>
        [HttpGet("tracking/{techId}")]
        public async Task<ActionResult<List<TechToolsTrackingDto>>> GetTechToolsTrackingByTechId(string techId)
        {
            if (string.IsNullOrWhiteSpace(techId))
                return BadRequest("Tech ID is required.");

            try
            {
                _logger.LogInformation("Getting tech tools tracking data for tech ID: {TechId}", techId);

                var results = await _repository.GetTechToolsTrackingByTechIdAsync(techId);

                _logger.LogInformation(
                    "Successfully retrieved tech tools tracking data - TechId: {TechId}, RecordCount: {RecordCount}",
                    techId, results.Count);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalRecords = results.Count,
                    techId = techId,
                    message = $"Tech tools tracking data retrieved successfully for tech ID: {techId}"
                });
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
        /// Saves/Updates tech tools tracking data
        /// </summary>
        /// <param name="request">Save request containing tech ID and tool tracking items</param>
        //[HttpPost("save-tracking")]
        //public async Task<ActionResult<SaveTechToolsTrackingResultDto>> SaveTechToolsTracking(
        //    [FromBody] SaveTechToolsTrackingRequestDto request)
        //{
        //    if (request == null)
        //        return BadRequest("Request body is required.");

        //    if (string.IsNullOrWhiteSpace(request.TechID))
        //        return BadRequest("Tech ID is required.");

        //    if (string.IsNullOrWhiteSpace(request.ModifiedBy))
        //        return BadRequest("Modified By is required.");

        //    if (!request.ToolTrackingItems.Any())
        //        return BadRequest("At least one tool tracking item is required.");

        //    try
        //    {
        //        _logger.LogInformation(
        //            "Saving tech tools tracking data - TechId: {TechId}, ItemCount: {ItemCount}, ModifiedBy: {ModifiedBy}",
        //            request.TechID, request.ToolTrackingItems.Count, request.ModifiedBy);

        //        var result = await _repository.SaveTechToolsTrackingAsync(request);

        //        _logger.LogInformation(
        //            "Tech tools tracking save completed - TechId: {TechId}, Success: {Success}, RecordsProcessed: {RecordsProcessed}",
        //            request.TechID, result.Success, result.RecordsProcessed);

        //        if (result.Success)
        //        {
        //            return Ok(new
        //            {
        //                success = true,
        //                data = result,
        //                message = result.Message
        //            });
        //        }
        //        else
        //        {
        //            return StatusCode(422, new
        //            {
        //                success = false,
        //                data = result,
        //                message = result.Message
        //            });
        //        }
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, 
        //            "Error saving tech tools tracking data - TechId: {TechId}", request.TechID);

        //        return StatusCode(500, new
        //        {
        //            success = false,
        //            message = "Failed to save tech tools tracking data",
        //            error = ex.Message
        //        });
        //    }
        //}
    }
}