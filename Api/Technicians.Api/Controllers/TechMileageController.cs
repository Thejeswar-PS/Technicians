using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Repository;
using Technicians.Api.Models;
using System.ComponentModel.DataAnnotations;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TechMileageController : ControllerBase
    {
        private readonly TechMileageRepository _repository;
        private readonly ILogger<TechMileageController> _logger;

        public TechMileageController(
            TechMileageRepository repository,
            ILogger<TechMileageController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        /// DEBUG:
        [HttpGet("Debug")]
        public async Task<ActionResult> DebugStoredProcedure(
            [FromQuery, Required] string startDate,
            [FromQuery, Required] string endDate,
            [FromQuery] string? techName = null)
        {
            try
            {
                _logger.LogInformation("Debug endpoint called with StartDate: {StartDate}, EndDate: {EndDate}, TechName: {TechName}", 
                    startDate, endDate, techName);

                // Validate date formats first
                if (!DateTime.TryParse(startDate, out DateTime parsedStartDate))
                {
                    _logger.LogError("Invalid start date format: {StartDate}", startDate);
                    return BadRequest(new { success = false, message = $"Invalid start date format: {startDate}. Use yyyy-MM-dd format." });
                }

                if (!DateTime.TryParse(endDate, out DateTime parsedEndDate))
                {
                    _logger.LogError("Invalid end date format: {EndDate}", endDate);
                    return BadRequest(new { success = false, message = $"Invalid end date format: {endDate}. Use yyyy-MM-dd format." });
                }

                var debugResult = await _repository.GetRawStoredProcedureDataAsync(new TechMileageRequestDto
                {
                    StartDate = startDate,
                    EndDate = endDate,
                    TechName = techName
                });

                _logger.LogInformation("Debug endpoint successful. Records returned: {RecordCount}", debugResult.Count);

                return Ok(new
                {
                    success = true,
                    message = "Raw stored procedure data",
                    totalRecords = debugResult.Count,
                    sampleRecord = debugResult.FirstOrDefault(),
                    allColumnNames = debugResult.FirstOrDefault()?.Keys.ToList(),
                    allRecords = debugResult
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in debug endpoint with parameters StartDate: {StartDate}, EndDate: {EndDate}, TechName: {TechName}", 
                    startDate, endDate, techName);

                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve debug data",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        /// <summary>
        /// Gets tech mileage report data using GET with query parameters
        /// </summary>
        [HttpGet("GetTechMileageReport")]
        public async Task<ActionResult<TechMileageResponseDto>> GetTechMileageReport(
            [FromQuery, Required] string startDate,
            [FromQuery, Required] string endDate,
            [FromQuery] string? techName = null)
        {
            try
            {
                _logger.LogInformation("Getting tech mileage report - StartDate: {StartDate}, EndDate: {EndDate}, TechName: {TechName}", 
                    startDate, endDate, techName ?? "All");

                // Validate date formats
                if (!DateTime.TryParse(startDate, out DateTime parsedStartDate))
                {
                    _logger.LogError("Invalid start date format: {StartDate}", startDate);
                    return BadRequest(new { success = false, message = $"Invalid start date format: {startDate}. Use yyyy-MM-dd format." });
                }

                if (!DateTime.TryParse(endDate, out DateTime parsedEndDate))
                {
                    _logger.LogError("Invalid end date format: {EndDate}", endDate);
                    return BadRequest(new { success = false, message = $"Invalid end date format: {endDate}. Use yyyy-MM-dd format." });
                }

                var request = new TechMileageRequestDto
                {
                    StartDate = startDate,
                    EndDate = endDate,
                    TechName = techName
                };

                var results = await _repository.GetTechMileageReportAsync(request);

                _logger.LogInformation("Successfully retrieved tech mileage report - RecordsCount: {RecordsCount}, TotalMiles: {TotalMiles}, TotalHours: {TotalHours}", 
                    results.MileageRecords?.Count ?? 0, results.TotalMiles, results.TotalHours);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalRecords = results.MileageRecords?.Count ?? 0,
                    filters = new
                    {
                        startDate = startDate,
                        endDate = endDate,
                        techName = techName
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tech mileage report with parameters StartDate: {StartDate}, EndDate: {EndDate}, TechName: {TechName}", 
                    startDate, endDate, techName);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve tech mileage report", 
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        /// <summary>
        /// Gets tech mileage report data using POST with request body
        /// </summary>
        [HttpPost("GetTechMileageReport")]
        public async Task<ActionResult<TechMileageResponseDto>> GetTechMileageReport([FromBody] TechMileageRequestDto request)
        {
            try
            {
                _logger.LogInformation("POST GetTechMileageReport called with request: {@Request}", request);

                if (!ModelState.IsValid)
                {
                    _logger.LogWarning("Invalid model state: {@ModelState}", ModelState);
                    return BadRequest(ModelState);
                }

                // Validate date formats
                if (!DateTime.TryParse(request.StartDate, out DateTime parsedStartDate))
                {
                    _logger.LogError("Invalid start date format: {StartDate}", request.StartDate);
                    return BadRequest(new { success = false, message = $"Invalid start date format: {request.StartDate}. Use yyyy-MM-dd format." });
                }

                if (!DateTime.TryParse(request.EndDate, out DateTime parsedEndDate))
                {
                    _logger.LogError("Invalid end date format: {EndDate}", request.EndDate);
                    return BadRequest(new { success = false, message = $"Invalid end date format: {request.EndDate}. Use yyyy-MM-dd format." });
                }

                var results = await _repository.GetTechMileageReportAsync(request);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalRecords = results.MileageRecords?.Count ?? 0,
                    filters = request
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tech mileage report with request: {@Request}", request);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve tech mileage report", 
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        /// <summary>
        /// Gets tech mileage report for current quarter (like legacy default)
        /// </summary>
        [HttpGet("GetCurrentQuarterReport")]
        public async Task<ActionResult<TechMileageResponseDto>> GetCurrentQuarterReport([FromQuery] string? techName = null)
        {
            try
            {
                _logger.LogInformation("Getting current quarter report for TechName: {TechName}", techName);

                // Calculate current quarter dates like legacy
                DateTime today = DateTime.Today;
                int quarter = (today.Month - 1) / 3 + 1;
                DateTime start = new DateTime(today.Year, (quarter - 1) * 3 + 1, 1);
                DateTime end = start.AddMonths(3).AddDays(-1);

                _logger.LogInformation("Calculated quarter dates - Start: {StartDate}, End: {EndDate}", start, end);

                var request = new TechMileageRequestDto
                {
                    StartDate = start.ToString("yyyy-MM-dd"),
                    EndDate = end.ToString("yyyy-MM-dd"),
                    TechName = techName
                };

                return await GetTechMileageReport(request);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting current quarter mileage report for TechName: {TechName}", techName);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve current quarter mileage report",
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        /// <summary>
        /// Gets list of technicians for dropdown
        /// </summary>
        [HttpGet("GetTechnicians")]
        public async Task<ActionResult<List<TechMileageTechnicianDto>>> GetTechnicians()
        {
            try
            {
                _logger.LogInformation("Getting technicians list");

                var technicians = await _repository.GetTechniciansAsync();

                _logger.LogInformation("Successfully retrieved {Count} technicians", technicians?.Count ?? 0);

                return Ok(new
                {
                    success = true,
                    data = technicians ?? new List<TechMileageTechnicianDto>(),
                    count = technicians?.Count ?? 0
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting technicians list");
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve technicians", 
                    error = ex.Message,
                    stackTrace = ex.StackTrace
                });
            }
        }

        /// <summary>
        /// Simple health check endpoint
        /// </summary>
        [HttpGet("Health")]
        public ActionResult Health()
        {
            try
            {
                return Ok(new
                {
                    success = true,
                    message = "TechMileage controller is healthy",
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Health check failed");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Health check failed", 
                    error = ex.Message 
                });
            }
        }
    }
}