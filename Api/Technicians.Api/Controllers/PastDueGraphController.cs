using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PastDueGraphController : ControllerBase
    {
        private readonly IPastDueGraphRepository _repository;
        private readonly ILogger<PastDueGraphController> _logger;

        public PastDueGraphController(
            IPastDueGraphRepository repository,
            ILogger<PastDueGraphController> logger)
        {
            _repository = repository ?? throw new ArgumentNullException(nameof(repository));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Get all past due jobs information - main endpoint
        /// </summary>
        [HttpGet("info")]
        public async Task<IActionResult> GetPastDueJobsInfo()
        {
            try
            {
                var result = await _repository.GetPastDueJobsInfoAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing past due jobs information request");
                return StatusCode(500, new PastDueGraphResponseDto
                {
                    Success = false,
                    Message = "An error occurred while processing the past due jobs information request"
                });
            }
        }

        /// <summary>
        /// Get call status details (first result set)
        /// </summary>
        [HttpGet("call-status")]
        public async Task<IActionResult> GetCallStatus()
        {
            try
            {
                var result = await _repository.GetPastDueJobsInfoAsync();
                return Ok(result.CallStatus);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving call status");
                return StatusCode(500, "An error occurred while retrieving call status");
            }
        }

        /// <summary>
        /// Get past due jobs summary by account manager (second result set)
        /// </summary>
        [HttpGet("summary")]
        public async Task<IActionResult> GetPastDueJobsSummary()
        {
            try
            {
                var result = await _repository.GetPastDueJobsInfoAsync();
                return Ok(result.PastDueJobsSummary);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving past due jobs summary");
                return StatusCode(500, "An error occurred while retrieving past due jobs summary");
            }
        }

        /// <summary>
        /// Get scheduled percentages by office (third result set)
        /// </summary>
        [HttpGet("scheduled-percentages")]
        public async Task<IActionResult> GetScheduledPercentages()
        {
            try
            {
                var result = await _repository.GetPastDueJobsInfoAsync();
                return Ok(result.ScheduledPercentages);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving scheduled percentages");
                return StatusCode(500, "An error occurred while retrieving scheduled percentages");
            }
        }

        /// <summary>
        /// Get total unscheduled jobs by office (fourth result set)
        /// </summary>
        [HttpGet("total-unscheduled-jobs")]
        public async Task<IActionResult> GetTotalUnscheduledJobs()
        {
            try
            {
                var result = await _repository.GetPastDueJobsInfoAsync();
                return Ok(result.TotalUnscheduledJobs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving total unscheduled jobs");
                return StatusCode(500, "An error occurred while retrieving total unscheduled jobs");
            }
        }

        /// <summary>
        /// Get total scheduled jobs by office (fifth result set)
        /// </summary>
        [HttpGet("total-scheduled-jobs")]
        public async Task<IActionResult> GetTotalScheduledJobs()
        {
            try
            {
                var result = await _repository.GetPastDueJobsInfoAsync();
                return Ok(result.TotalScheduledJobs);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving total scheduled jobs");
                return StatusCode(500, "An error occurred while retrieving total scheduled jobs");
            }
        }
    }
}