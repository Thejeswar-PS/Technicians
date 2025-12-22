using Microsoft.AspNetCore.Mvc;
using Swashbuckle.AspNetCore.Annotations;
using System.Data;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{

    [ApiController]
    [Route("api/[controller]")]
    public class JobsController : ControllerBase
    {
        private readonly JobRepository _jobRepository;
        public JobsController(JobRepository jobRepository)
        {
            _jobRepository = jobRepository;
        }

        [HttpGet("GetJobs")]
        public IActionResult GetJobs(
            [FromQuery] string empId,
            [FromQuery] string mgrId,
            [FromQuery] string techId,
            [FromQuery] int rbButton,
            [FromQuery] int currentYear,
            [FromQuery] int month)
        {
            try
            {
                // Adjusted method call to match the correct overload
                var jobs = _jobRepository.GetJobs(empId, mgrId, techId, rbButton, currentYear, month, out string errorMessage);

                if (!string.IsNullOrEmpty(errorMessage))
                {
                    return BadRequest(errorMessage);
                }

                return Ok(jobs);
            }
            catch (Exception ex)
            {
                // Log the exception (not implemented here for brevity)
                return StatusCode(500, $"An error occurred while processing your request: {ex.Message}");
            }
        }

        [HttpGet("GetSearchedJob")]
        public IActionResult GetSearchedJobs(
            [FromQuery] string jobId,
            [FromQuery] string techId,
            [FromQuery] string empId)
        {
            try
            {
                // Adjusted method call to match the correct overload
                var jobs = _jobRepository.GetSearchedJob(jobId, techId, empId, out string errorMessage);

                if (!string.IsNullOrEmpty(errorMessage))
                {
                    return BadRequest(errorMessage);
                }

                return Ok(jobs);
            }
            catch (Exception ex)
            {
                // Log the exception (not implemented here for brevity)
                return StatusCode(500, $"An error occurred while processing your request: {ex.Message}");
            }
        }

        [HttpGet("GetCalenderJobData")]
        [SwaggerResponse(StatusCodes.Status200OK, "Return Calender Job data", typeof(List<GetCalenderJobDataVM>))]
        public async Task<ActionResult> GetCalenderJobData([FromQuery] DateTime startDate,
        [FromQuery] DateTime endDate,
        [FromQuery] string ownerId,
        [FromQuery] string tech,
        [FromQuery] string state,
        [FromQuery] string type)
        {
            var result = await _jobRepository.GetCalenderJobData(startDate, endDate, ownerId, tech, state, type);
            return Ok(result);
        }
    }
}
