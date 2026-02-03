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
    }
}