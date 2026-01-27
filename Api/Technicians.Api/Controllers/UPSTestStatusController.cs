using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Repository;
using Technicians.Api.Models;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UPSTestStatusController : ControllerBase
    {
        private readonly UPSTestStatusRepository _repository;
        private readonly ILogger<UPSTestStatusController> _logger;

        public UPSTestStatusController(
            UPSTestStatusRepository repository, 
            ILogger<UPSTestStatusController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        /// <param name="assignedTo">Technician filter or "All" (default: All)</param>
        /// <param name="status">Status filter: All, INP, NCR, MPJ (default: All)</param>
        /// <param name="priority">Priority filter: Atc, or All (default: All)</param>
        /// <param name="archive">Include archived records (default: false)</param>
        /// <returns>UPS test status data with make counts</returns>
        [HttpGet]
        public async Task<ActionResult<UPSTestStatusResponse>> GetUPSTestStatus(
            [FromQuery] string assignedTo = "All",
            [FromQuery] string status = "All",
            [FromQuery] string priority = "All",
            [FromQuery] bool archive = false)
        {
            try
            {
                _logger.LogInformation("Getting UPS test status - AssignedTo: {AssignedTo}, Status: {Status}, Priority: {Priority}, Archive: {Archive}", 
                    assignedTo, status, priority, archive);

                // Map full names to codes using repository methods
                string mappedStatus = _repository.MapStatusToCode(status);
                string mappedPriority = priority;

                var request = new UPSTestStatusRequest
                {
                    AssignedTo = assignedTo,
                    Status = mappedStatus,
                    Priority = mappedPriority,
                    Archive = archive
                };

                // Validate request
                var validationErrors = _repository.ValidateRequest(request);
                if (validationErrors.Any())
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Validation failed",
                        errors = validationErrors,
                        validStatuses = new[] { "All", "INP", "NCR", "MPJ" },
                        statusMappings = new Dictionary<string, string>
                        {
                            { "All", "All units" },
                            { "INP", "In Progress" },
                            { "NCR", "Needs Components for Repair" },
                            { "MPJ", "Missing Parts from Job" },
                            { "Missing", "Maps to MPJ" }
                        }
                    });
                }

                var results = await _repository.GetNewUPSTestStatusAsync(request);

                _logger.LogInformation("Successfully retrieved UPS test status - UnitsCount: {UnitsCount}, MakeCountsCount: {MakeCountsCount}", 
                    results.UnitsData.Count, results.MakeCounts.Count);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalRecords = results.UnitsData.Count,
                    filters = new
                    {
                        originalAssignedTo = assignedTo,
                        originalStatus = status,
                        originalPriority = priority,
                        mappedStatus = mappedStatus,
                        mappedPriority = mappedPriority,
                        archive = archive
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting UPS test status");
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve UPS test status", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// POST version for complex filtering (if needed)
        /// </summary>
        [HttpPost]
        public async Task<ActionResult<UPSTestStatusResponse>> GetUPSTestStatus([FromBody] UPSTestStatusRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Invalid request payload" 
                    });
                }

                _logger.LogInformation("Getting UPS test status via POST - {@Request}", request);

                var validationErrors = _repository.ValidateRequest(request);
                if (validationErrors.Any())
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Validation failed",
                        errors = validationErrors
                    });
                }

                var results = await _repository.GetNewUPSTestStatusAsync(request);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalRecords = results.UnitsData.Count,
                    filters = request
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting UPS test status via POST");
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve UPS test status", 
                    error = ex.Message 
                });
            }
        }

        /// Gets metadata for dropdown populations and dashboard summaries
        /// Based on actual New Units Test Status legacy system
        [HttpGet("metadata")]
        public async Task<ActionResult> GetMetadata([FromQuery] bool archive = false)
        {
            try
            {
                _logger.LogInformation("Getting UPS test metadata");

                var techniciansTask = _repository.GetAssignedTechniciansAsync();
                var makeCountsTask = _repository.GetUPSTestMakeCountsAsync(archive);
                var statusSummaryTask = _repository.GetStatusSummaryAsync("All", archive);

                await Task.WhenAll(techniciansTask, makeCountsTask, statusSummaryTask);

                var result = new
                {
                    success = true,
                    technicians = await techniciansTask,
                    makeCounts = await makeCountsTask,
                    statusSummary = await statusSummaryTask,
                    
                    // Correct New Units Test Status values
                    validStatuses = new[] { "All", "INP", "NCR", "MPJ" },
                    validPriorities = new[] { "All", "Atc" },
                    
                    // Correct status labels for New Units Test Status
                    statusLabels = new Dictionary<string, string>
                    {
                        { "All", "All" },
                        { "INP", "In Progress" },
                        { "NCR", "Needs Components for Repair" },
                        { "MPJ", "Missing Parts from Job" }
                    },
                    
                    priorityLabels = new Dictionary<string, string>
                    {
                        { "All", "All" },
                        { "Atc", "At Convenience" }
                    },
                    
                    // Legacy mappings for New Units Test Status specifically
                    legacyStatusMappings = new Dictionary<string, string>
                    {
                        { "Missing", "MPJ" },
                        { "Missing Parts from Job", "MPJ" },
                        { "In Progress", "INP" },
                        { "Needs Components for Repair", "NCR" },
                        { "All", "All" }
                    },
                    
                    // Note about other system status codes
                    systemInfo = new
                    {
                        pageType = "New Units Test Status",
                        note = "Status codes Nos, Inp, Def, Com are used by Parts Test Status, not New Units Test Status",
                        supportedStatuses = "All, INP, NCR, MPJ only"
                    }
                };

                _logger.LogInformation("Successfully retrieved UPS test metadata");
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting UPS test metadata");
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve metadata", 
                    error = ex.Message 
                });
            }
        }
    }
}