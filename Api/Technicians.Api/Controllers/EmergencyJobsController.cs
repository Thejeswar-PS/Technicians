using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    /// <summary>
    /// Controller for Emergency Jobs operations
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class EmergencyJobsController : ControllerBase
    {
        private readonly EmergencyJobsRepository _repository;
        private readonly ILogger<EmergencyJobsController> _logger;

        public EmergencyJobsController(
            EmergencyJobsRepository repository,
            ILogger<EmergencyJobsController> logger)
        {
            _repository = repository ?? throw new ArgumentNullException(nameof(repository));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Get all emergency jobs for display
        /// </summary>
        /// <returns>List of emergency jobs with details</returns>
        [HttpGet]
        public async Task<IActionResult> GetEmergencyJobs()
        {
            try
            {
                var result = await _repository.GetEmergencyJobsAsync();
                
                if (result.Success)
                {
                    return Ok(result);
                }
                else
                {
                    return BadRequest(result);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing emergency jobs request");
                return StatusCode(500, new EmergencyJobsResponseDto
                {
                    Success = false,
                    Message = "An error occurred while processing the request",
                    GeneratedAt = DateTime.UtcNow
                });
            }
        }
    }
}