using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Repository;
using Technicians.Api.Models;
using System.ComponentModel.DataAnnotations;

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
        /// Gets parts test status data using GET with query parameters - ALL PARAMETERS OPTIONAL
        /// </summary>
        /// <param name="jobType">Job type filter (optional)</param>
        /// <param name="priority">Priority filter (optional)</param>
        /// <param name="archive">Archive filter (default: false)</param>
        /// <param name="make">Make filter (optional)</param>
        /// <param name="model">Model filter (optional)</param>
        /// <param name="assignedTo">AssignedTo filter (optional)</param>
        /// <returns>Parts test status data with distinct makes and models</returns>
        [HttpGet("GetPartsTestStatus")]
        public async Task<ActionResult<PartsTestStatusResponse>> GetPartsTestStatus(
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

                var results = await _repository.GetPartsTestStatusAsync(request);

                _logger.LogInformation("Successfully retrieved parts test status - PartsCount: {PartsCount}, MakesCount: {MakesCount}, ModelsCount: {ModelsCount}", 
                    results.PartsTestData.Count, results.DistinctMakes.Count, results.DistinctModels.Count);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalRecords = results.PartsTestData.Count,
                    filters = new
                    {
                        jobType = jobType,
                        priority = priority,
                        archive = archive,
                        make = make,
                        model = model,
                        assignedTo = assignedTo
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting parts test status with filters: JobType={JobType}, Priority={Priority}, Archive={Archive}, Make={Make}, Model={Model}, AssignedTo={AssignedTo}", 
                    jobType, priority, archive, make, model, assignedTo);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve parts test status", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Gets parts test status data using POST with request body - BYPASSES VALIDATION
        /// </summary>
        /// <param name="request">Request containing filter parameters (all optional)</param>
        /// <returns>Parts test status data with distinct makes and models</returns>
        [HttpPost("GetPartsTestStatus")]
        public async Task<ActionResult<PartsTestStatusResponse>> GetPartsTestStatus([FromBody] object? requestData)
        {
            try
            {
                PartsTestStatusRequest request;
                
                // Handle cases where request is null or empty
                if (requestData == null)
                {
                    request = new PartsTestStatusRequest();
                }
                else
                {
                    // Try to deserialize the request data manually to avoid validation
                    try
                    {
                        var jsonString = System.Text.Json.JsonSerializer.Serialize(requestData);
                        request = System.Text.Json.JsonSerializer.Deserialize<PartsTestStatusRequest>(jsonString) ?? new PartsTestStatusRequest();
                    }
                    catch
                    {
                        // If deserialization fails, create a default request
                        request = new PartsTestStatusRequest();
                    }
                }

                _logger.LogInformation("Getting parts test status - JobType: {JobType}, Priority: {Priority}, Archive: {Archive}, Make: {Make}, Model: {Model}, AssignedTo: {AssignedTo}", 
                    request.JobType, request.Priority, request.Archive, request.Make, request.Model, request.AssignedTo);

                var results = await _repository.GetPartsTestStatusAsync(request);

                _logger.LogInformation("Successfully retrieved parts test status - PartsCount: {PartsCount}, MakesCount: {MakesCount}, ModelsCount: {ModelsCount}", 
                    results.PartsTestData.Count, results.DistinctMakes.Count, results.DistinctModels.Count);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalRecords = results.PartsTestData.Count,
                    filters = request
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting parts test status with request: {@RequestData}", requestData);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve parts test status", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Gets all parts test status data with no filters (unarchived only)
        /// </summary>
        /// <returns>All unarchived parts test status data</returns>
        [HttpGet("GetAllPartsTestStatus")]
        public async Task<ActionResult<PartsTestStatusResponse>> GetAllPartsTestStatus()
        {
            try
            {
                _logger.LogInformation("Getting all parts test status data");

                var results = await _repository.GetPartsTestStatusAsync();

                _logger.LogInformation("Successfully retrieved all parts test status - PartsCount: {PartsCount}, MakesCount: {MakesCount}, ModelsCount: {ModelsCount}", 
                    results.PartsTestData.Count, results.DistinctMakes.Count, results.DistinctModels.Count);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalRecords = results.PartsTestData.Count
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
        /// Gets only distinct makes from PartsTestList
        /// </summary>
        /// <returns>List of distinct makes</returns>
        [HttpGet("GetDistinctMakes")]
        public async Task<ActionResult<IEnumerable<MakeModelDto>>> GetDistinctMakes()
        {
            try
            {
                _logger.LogInformation("Getting distinct makes");

                var makes = await _repository.GetDistinctMakesAsync();

                _logger.LogInformation("Successfully retrieved {Count} distinct makes", makes.Count());

                return Ok(new
                {
                    success = true,
                    makes = makes,
                    count = makes.Count()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting distinct makes");
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve distinct makes", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Gets only distinct models from PartsTestList
        /// </summary>
        /// <returns>List of distinct models</returns>
        [HttpGet("GetDistinctModels")]
        public async Task<ActionResult<IEnumerable<MakeModelDto>>> GetDistinctModels()
        {
            try
            {
                _logger.LogInformation("Getting distinct models");

                var models = await _repository.GetDistinctModelsAsync();

                _logger.LogInformation("Successfully retrieved {Count} distinct models", models.Count());

                return Ok(new
                {
                    success = true,
                    models = models,
                    count = models.Count()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting distinct models");
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve distinct models", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Gets distinct models filtered by make
        /// </summary>
        /// <param name="make">Make to filter models by (optional)</param>
        /// <returns>List of distinct models for the specified make</returns>
        [HttpGet("GetDistinctModelsByMake")]
        public async Task<ActionResult<IEnumerable<MakeModelDto>>> GetDistinctModelsByMake([FromQuery] string? make = null)
        {
            try
            {
                _logger.LogInformation("Getting distinct models for make: {Make}", make);

                var models = await _repository.GetDistinctModelsByMakeAsync(make);

                _logger.LogInformation("Successfully retrieved {Count} distinct models for make: {Make}", models.Count(), make);

                return Ok(new
                {
                    success = true,
                    make = make,
                    models = models,
                    count = models.Count()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting distinct models for make: {Make}", make);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve distinct models for make", 
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