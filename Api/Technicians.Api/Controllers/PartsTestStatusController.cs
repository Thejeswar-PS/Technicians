using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Repository;
using Technicians.Api.Models;

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
        /// Gets parts test status data using GET with query parameters
        /// </summary>
        /// <param name="jobType">Job type filter (use 'All' or empty for no filter)</param>
        /// <param name="priority">Priority filter (use 'All' or empty for no filter)</param>
        /// <param name="archive">Archive filter (default: false)</param>
        /// <param name="make">Make filter (use 'All' or empty for no filter)</param>
        /// <param name="model">Model filter (use 'All' or empty for no filter)</param>
        /// <returns>Parts test status data with distinct makes and models</returns>
        [HttpGet("GetPartsTestStatus")]
        public async Task<ActionResult<PartsTestStatusResponse>> GetPartsTestStatus(
            [FromQuery] string jobType = "",
            [FromQuery] string priority = "",
            [FromQuery] bool archive = false,
            [FromQuery] string make = "",
            [FromQuery] string model = "")
        {
            try
            {
                _logger.LogInformation("Getting parts test status - JobType: {JobType}, Priority: {Priority}, Archive: {Archive}, Make: {Make}, Model: {Model}", 
                    jobType, priority, archive, make, model);

                var request = new PartsTestStatusRequest
                {
                    JobType = jobType,
                    Priority = priority,
                    Archive = archive,
                    Make = make,
                    Model = model
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
                        model = model
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting parts test status with filters: JobType={JobType}, Priority={Priority}, Archive={Archive}, Make={Make}, Model={Model}", 
                    jobType, priority, archive, make, model);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve parts test status", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Gets parts test status data using POST with request body
        /// </summary>
        /// <param name="request">Request containing filter parameters</param>
        /// <returns>Parts test status data with distinct makes and models</returns>
        [HttpPost("GetPartsTestStatus")]
        public async Task<ActionResult<PartsTestStatusResponse>> GetPartsTestStatus([FromBody] PartsTestStatusRequest request)
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

                _logger.LogInformation("Getting parts test status - JobType: {JobType}, Priority: {Priority}, Archive: {Archive}, Make: {Make}, Model: {Model}", 
                    request.JobType, request.Priority, request.Archive, request.Make, request.Model);

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
                _logger.LogError(ex, "Error getting parts test status with request: {@Request}", request);
                
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
        /// <param name="make">Make to filter models by</param>
        /// <returns>List of distinct models for the specified make</returns>
        [HttpGet("GetDistinctModelsByMake")]
        public async Task<ActionResult<IEnumerable<MakeModelDto>>> GetDistinctModelsByMake([FromQuery] string make)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(make))
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Make parameter is required" 
                    });
                }

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
    }
}