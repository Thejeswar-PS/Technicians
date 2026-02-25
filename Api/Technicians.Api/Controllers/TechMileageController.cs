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
        //[HttpGet("Debug")]
        //public async Task<ActionResult> DebugStoredProcedure(
        //    [FromQuery, Required] string startDate,
        //    [FromQuery, Required] string endDate,
        //    [FromQuery] string? techName = null)
        //{
        //    try
        //    {
        //        var debugResult = await _repository.GetRawStoredProcedureDataAsync(new TechMileageRequestDto
        //        {
        //            StartDate = startDate,
        //            EndDate = endDate,
        //            TechName = techName
        //        });

        //        return Ok(new
        //        {
        //            success = true,
        //            message = "Raw stored procedure data",
        //            totalRecords = debugResult.Count,
        //            sampleRecord = debugResult.FirstOrDefault(),
        //            allColumnNames = debugResult.FirstOrDefault()?.Keys.ToList(),
        //            allRecords = debugResult
        //        });
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error in debug endpoint");
                
        //        return StatusCode(500, new { 
        //            success = false, 
        //            message = "Failed to retrieve debug data", 
        //            error = ex.Message 
        //        });
        //    }
        //}

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

                var request = new TechMileageRequestDto
                {
                    StartDate = startDate,
                    EndDate = endDate,
                    TechName = techName
                };

                var results = await _repository.GetTechMileageReportAsync(request);

                _logger.LogInformation("Successfully retrieved tech mileage report - RecordsCount: {RecordsCount}, TotalMiles: {TotalMiles}, TotalHours: {TotalHours}", 
                    results.MileageRecords.Count, results.TotalMiles, results.TotalHours);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalRecords = results.MileageRecords.Count,
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
                _logger.LogError(ex, "Error getting tech mileage report");
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve tech mileage report", 
                    error = ex.Message 
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
                if (!ModelState.IsValid)
                {
                    return BadRequest(ModelState);
                }

                var results = await _repository.GetTechMileageReportAsync(request);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalRecords = results.MileageRecords.Count,
                    filters = request
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tech mileage report with request: {@Request}", request);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve tech mileage report", 
                    error = ex.Message 
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
                // Calculate current quarter dates like legacy
                DateTime today = DateTime.Today;
                int quarter = (today.Month - 1) / 3 + 1;
                DateTime start = new DateTime(today.Year, (quarter - 1) * 3 + 1, 1);
                DateTime end = start.AddMonths(3).AddDays(-1);

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
                _logger.LogError(ex, "Error getting current quarter mileage report");
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve current quarter mileage report" 
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
                var technicians = await _repository.GetTechniciansAsync();

                return Ok(new
                {
                    success = true,
                    data = technicians,
                    count = technicians.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting technicians list");
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve technicians", 
                    error = ex.Message 
                });
            }
        }
    }
}