using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PartsTestStatusController : ControllerBase
    {
        private readonly PartsTestStatusRepository _repository;
        private readonly ILogger<PartsTestStatusController> _logger;

        public PartsTestStatusController(
            PartsTestStatusRepository repository,
            ILogger<PartsTestStatusController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        /// <summary>
        /// Gets parts test status data with filtering - MAIN ENDPOINT
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<PartsTestStatusResponse>> Get(
            [FromQuery] string? jobType = null,
            [FromQuery] string? priority = null,
            [FromQuery] bool archive = false,
            [FromQuery] string? make = null,
            [FromQuery] string? model = null,
            [FromQuery] string? assignedTo = null)
        {
            try
            {
                _logger.LogInformation("Getting parts test status - JobType: {JobType}, Priority: {Priority}, Archive: {Archive}, Make: {Make}, Model: {Model}, AssignedTo: {AssignedTo}", 
                    jobType, priority, archive, make, model, assignedTo);

                var request = new PartsTestStatusRequest
                {
                    JobType = jobType,
                    Priority = priority,
                    Archive = archive,
                    Make = make,
                    Model = model,
                    AssignedTo = assignedTo
                };

                var result = await _repository.GetPartsTestStatusAsync(request);

                _logger.LogInformation("Successfully retrieved parts test status - RecordCount: {RecordCount}", 
                    result.PartsTestData.Count);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting parts test status");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve parts test status", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Gets ALL parts test status data with no filters (unarchived only) - NEW ENDPOINT
        /// </summary>
        [HttpGet("all")]
        public async Task<ActionResult<PartsTestStatusResponse>> GetAll()
        {
            try
            {
                _logger.LogInformation("Getting all parts test status data (unarchived)");

                var result = await _repository.GetAllPartsTestStatusAsync();

                _logger.LogInformation("Successfully retrieved all parts test status - RecordCount: {RecordCount}", 
                    result.PartsTestData.Count);

                return Ok(new
                {
                    success = true,
                    data = result.PartsTestData,
                    makes = result.DistinctMakes,
                    models = result.DistinctModels,
                    totalRecords = result.PartsTestData.Count,
                    message = "All parts test status retrieved successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all parts test status");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve all parts test status", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Gets dashboard/graph data for Parts Test Status - CHARTS/GRAPHS ENDPOINT
        /// Returns data for Status Chart (Graph 1) and Job Type Chart (Graph 2) like legacy
        /// </summary>
        [HttpGet("dashboard")]
        public async Task<ActionResult<PartsTestDashboardDto>> GetDashboard(
            [FromQuery] string? jobType = null,
            [FromQuery] string? priority = null,
            [FromQuery] bool archive = false,
            [FromQuery] string? make = null,
            [FromQuery] string? model = null,
            [FromQuery] string? assignedTo = null)
        {
            try
            {
                _logger.LogInformation("Getting parts test status dashboard - JobType: {JobType}, Priority: {Priority}, Archive: {Archive}, Make: {Make}, Model: {Model}, AssignedTo: {AssignedTo}", 
                    jobType, priority, archive, make, model, assignedTo);

                var request = new PartsTestStatusRequest
                {
                    JobType = jobType,
                    Priority = priority,
                    Archive = archive,
                    Make = make,
                    Model = model,
                    AssignedTo = assignedTo
                };

                var dashboardData = await _repository.GetPartsTestStatusDashboardAsync(request);

                _logger.LogInformation("Successfully retrieved parts test status dashboard data");

                return Ok(new
                {
                    success = true,
                    statusChart = new
                    {
                        emergencyCount = dashboardData.StatusCounts?.EmergencyCount ?? 0,
                        overdueCount = dashboardData.StatusCounts?.OverdueCount ?? 0,
                        sameDayCount = dashboardData.StatusCounts?.SameDayCount ?? 0,
                        currentWeekCount = dashboardData.StatusCounts?.CurrentWeekCount ?? 0
                    },
                    jobTypeChart = dashboardData.JobTypeDistribution.Select(jt => new
                    {
                        jobType = jt.JobType,
                        totalCount = jt.TotalCount
                    }).ToList(),
                    filters = new
                    {
                        jobType = jobType,
                        priority = priority,
                        archive = archive,
                        make = make,
                        model = model,
                        assignedTo = assignedTo
                    },
                    message = "Dashboard data retrieved successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting parts test status dashboard");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve dashboard data", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Alternative POST endpoint that explicitly bypasses model validation
        /// </summary>
        /// <returns>Parts test status data</returns>
        [HttpPost("GetPartsTestStatusNoValidation")]
        public async Task<ActionResult<PartsTestStatusResponse>> GetPartsTestStatusNoValidation()
        {
            try
            {
                _logger.LogInformation("Getting parts test status with no validation");

                // Create a default request with all null values
                var request = new PartsTestStatusRequest
                {
                    JobType = null,
                    Priority = null,
                    Archive = false,
                    Make = null,
                    Model = null,
                    AssignedTo = null
                };

                var results = await _repository.GetPartsTestStatusAsync(request);

                _logger.LogInformation("Successfully retrieved parts test status - PartsCount: {PartsCount}", 
                    results.PartsTestData.Count);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalRecords = results.PartsTestData.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting parts test status with no validation");
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve parts test status", 
                    error = ex.Message 
                });
            }
        }
    }
}