using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/AccMgrPerformanceReport")]
    public class AccMgrPerformanceReportController : ControllerBase
    {
        private readonly IAccMgrPerformanceReportRepository _repo;

        public AccMgrPerformanceReportController(IAccMgrPerformanceReportRepository repo)
        {
            _repo = repo;
        }

        // =========================
        // MASTER API (REQUIRED)
        // =========================
        [HttpGet("report")]
        public async Task<IActionResult> GetReport(
        [FromQuery] string officeId,
        [FromQuery] string? roJobs)
        {
            if (string.IsNullOrWhiteSpace(officeId))
                return BadRequest("officeId is required");

            var result = await _repo.GetReportAsync(
                officeId,
                roJobs ?? ""   // convert null → empty for SQL
            );

            return Ok(result);
        }


        // =========================
        // SLICE APIs (UI CONVENIENCE)
        // =========================
        [HttpGet("completed-not-returned")]
        public async Task<IActionResult> CompletedNotReturned(
        [FromQuery][Required] string officeId,
        [FromQuery] string? roJobs = null
        )
        {
            if (string.IsNullOrWhiteSpace(officeId))
                return BadRequest("officeId is required");

            var r = await _repo.GetReportAsync(officeId, roJobs ?? "");
            return Ok(r.CompletedNotReturned);
        }


        [HttpGet("returned-for-processing")]
        public async Task<IActionResult> ReturnedForProcessing(
            [FromQuery][Required] string officeId,
            [FromQuery] string? roJobs = null
        )
        {
            var r = await _repo.GetReportAsync(officeId, roJobs ?? "");
            return Ok(r.ReturnedForProcessing);
        }

        [HttpGet("jobs-today")]
        public async Task<IActionResult> JobsToday(
        [FromQuery][Required] string officeId,
        [FromQuery] string? roJobs = null
        )
        {
            var r = await _repo.GetReportAsync(officeId, roJobs ?? "");
            return Ok(r.JobsScheduledToday);
        }


        [HttpGet("confirmed-next-120-hours")]
        public async Task<IActionResult> ConfirmedNext120Hours(
            [FromQuery][Required] string officeId,
            [FromQuery] string? roJobs = "")
        {
            if (string.IsNullOrWhiteSpace(officeId))
                return BadRequest("officeId is required");

            var r = await _repo.GetReportAsync(officeId, roJobs ?? "");
            return Ok(r.JobsConfirmedNext120Hours);
        }

        [HttpGet("past-due-unscheduled")]
        public async Task<IActionResult> PastDueUnscheduled(
            [FromQuery][Required] string officeId,
            [FromQuery] string? roJobs = "")
        {
            if (string.IsNullOrWhiteSpace(officeId))
                return BadRequest("officeId is required");

            var r = await _repo.GetReportAsync(officeId, roJobs ?? "");
            return Ok(r.PastDueUnscheduled);
        }

        // =========================
        // HEALTH
        // =========================
        [HttpGet("health")]
        public IActionResult Health() => Ok("Healthy");
    }
}

//using Microsoft.AspNetCore.Mvc;
//using Microsoft.AspNetCore.Authorization;
//using System.ComponentModel.DataAnnotations;
//using Technicians.Api.Models;
//using Technicians.Api.Repository;

//namespace Technicians.Api.Controllers
//{
//    /// <summary>
//    /// Controller for handling Account Manager Performance Report and analytics
//    /// </summary>
//    [ApiController]
//    [Route("api/[controller]")]
//    public class AccMgrPerformanceReportController : ControllerBase
//    {
//        private readonly IAccMgrPerformanceReportRepository _repository;
//        private readonly ILogger<AccMgrPerformanceReportController> _logger;

//        public AccMgrPerformanceReportController(
//            IAccMgrPerformanceReportRepository repository,
//            ILogger<AccMgrPerformanceReportController> logger)
//        {
//            _repository = repository ?? throw new ArgumentNullException(nameof(repository));
//            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
//        }

//        /// <summary>
//        /// Get comprehensive Account Manager Performance Report data for a specific office
//        /// </summary>
//        /// <param name="request">Request containing office ID</param>
//        /// <returns>Complete Account Manager Performance Report data</returns>
//        [HttpPost("report")]
//        [ProducesResponseType(typeof(AccMgrPerformanceReportResponseDto), StatusCodes.Status200OK)]
//        [ProducesResponseType(StatusCodes.Status400BadRequest)]
//        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
//        public async Task<IActionResult> GetAccMgrPerformanceReport([FromBody] AccMgrPerformanceReportRequestDto request)
//        {
//            try
//            {
//                if (!ModelState.IsValid)
//                {
//                    return BadRequest(ModelState);
//                }

//                _logger.LogInformation("Processing Account Manager Performance Report for office: {OfficeId}", 
//                    request.POffId);

//                var result = await _repository.GetAccMgrPerformanceReportDataAsync(request.POffId);

//                if (!result.Success)
//                {
//                    return StatusCode(500, result);
//                }

//                return Ok(result);
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error processing Account Manager Performance Report for office: {OfficeId}", request?.POffId);
//                return StatusCode(500, new AccMgrPerformanceReportResponseDto
//                {
//                    Success = false,
//                    Message = "An error occurred while processing the Account Manager Performance Report",
//                    OfficeId = request?.POffId ?? ""
//                });
//            }
//        }

//        /// <summary>
//        /// Get Account Manager Performance Report data using query parameters
//        /// </summary>
//        /// <param name="officeId">Office ID</param>
//        /// <returns>Complete Account Manager Performance Report data</returns>
//        [HttpGet("report")]
//        [ProducesResponseType(typeof(AccMgrPerformanceReportResponseDto), StatusCodes.Status200OK)]
//        [ProducesResponseType(StatusCodes.Status400BadRequest)]
//        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
//        public async Task<IActionResult> GetAccMgrPerformanceReportByQuery(
//            [FromQuery] [Required] string officeId)
//        {
//            try
//            {
//                if (string.IsNullOrWhiteSpace(officeId))
//                {
//                    return BadRequest("Office ID parameter is required");
//                }

//                _logger.LogInformation("Processing GET Account Manager Performance Report for office: {OfficeId}", 
//                    officeId);

//                var result = await _repository.GetAccMgrPerformanceReportDataAsync(officeId);

//                return Ok(result);
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error processing GET Account Manager Performance Report for office: {OfficeId}", officeId);
//                return StatusCode(500, new AccMgrPerformanceReportResponseDto
//                {
//                    Success = false,
//                    Message = "An error occurred while processing the Account Manager Performance Report",
//                    OfficeId = officeId
//                });
//            }
//        }

//        /// <summary>
//        /// Get Account Manager Performance Report summary statistics
//        /// </summary>
//        /// <param name="officeId">Office ID</param>
//        /// <returns>Summary statistics for Account Manager Performance Report data</returns>
//        [HttpGet("summary")]
//        [ProducesResponseType(typeof(AccMgrPerformanceReportSummaryDto), StatusCodes.Status200OK)]
//        [ProducesResponseType(StatusCodes.Status400BadRequest)]
//        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
//        public async Task<IActionResult> GetAccMgrPerformanceReportSummary(
//            [FromQuery] [Required] string officeId)
//        {
//            try
//            {
//                if (string.IsNullOrWhiteSpace(officeId))
//                {
//                    return BadRequest("Office ID parameter is required");
//                }

//                _logger.LogInformation("Getting Account Manager Performance Report summary for office: {OfficeId}", 
//                    officeId);

//                var result = await _repository.GetAccMgrPerformanceReportSummaryAsync(officeId);

//                return Ok(result);
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting Account Manager Performance Report summary for office: {OfficeId}", officeId);
//                return StatusCode(500, new { 
//                    success = false, 
//                    message = "An error occurred while retrieving Account Manager Performance Report summary" 
//                });
//            }
//        }

//        #region Specific Report Endpoints

//        /// <summary>
//        /// Get completed jobs not returned from technician
//        /// </summary>
//        /// <param name="officeId">Office ID</param>
//        /// <param name="roJobs">RO Jobs filter (optional)</param>
//        [HttpGet("completed-not-returned")]
//        [ProducesResponseType(typeof(List<AccMgrCompletedNotReturnedDto>), StatusCodes.Status200OK)]
//        [ProducesResponseType(StatusCodes.Status400BadRequest)]
//        [ProducesResponseType(StatusCodes.Status500InternalServerError)]
//        public async Task<IActionResult> GetCompletedNotReturned(
//            [FromQuery] [Required] string officeId)
//        {
//            try
//            {
//                if (string.IsNullOrWhiteSpace(officeId))
//                {
//                    return BadRequest("Office ID parameter is required");
//                }

//                var result = await _repository.GetCompletedNotReturnedAsync(officeId);
//                return Ok(new
//                {
//                    success = true,
//                    data = result,
//                    totalRecords = result.Count,
//                    officeId = officeId
//                });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error retrieving completed not returned jobs for office: {OfficeId}", officeId);
//                return StatusCode(500, new { success = false, message = "An error occurred while retrieving completed not returned jobs" });
//            }
//        }

//        /// <summary>
//        /// Get jobs returned from technician for processing by account manager
//        /// </summary>
//        /// <param name="officeId">Office ID</param>
//        /// <param name="roJobs">RO Jobs filter (optional)</param>
//        [HttpGet("returned-for-processing")]
//        [ProducesResponseType(typeof(List<AccMgrReturnedForProcessingDto>), StatusCodes.Status200OK)]
//        public async Task<IActionResult> GetReturnedForProcessing(
//            [FromQuery] [Required] string officeId)
//        {
//            try
//            {
//                if (string.IsNullOrWhiteSpace(officeId))
//                {
//                    return BadRequest("Office ID parameter is required");
//                }

//                var result = await _repository.GetReturnedForProcessingAsync(officeId);
//                return Ok(new
//                {
//                    success = true,
//                    data = result,
//                    totalRecords = result.Count,
//                    officeId = officeId
//                });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error retrieving returned for processing jobs for office: {OfficeId}", officeId);
//                return StatusCode(500, new { success = false, message = "An error occurred while retrieving returned for processing jobs" });
//            }
//        }

//        /// <summary>
//        /// Get past due unscheduled jobs
//        /// </summary>
//        /// <param name="officeId">Office ID</param>
//        /// <param name="roJobs">RO Jobs filter (optional)</param>
//        [HttpGet("past-due-unscheduled")]
//        [ProducesResponseType(typeof(List<AccMgrPastDueUnscheduledDto>), StatusCodes.Status200OK)]
//        public async Task<IActionResult> GetPastDueUnscheduled(
//            [FromQuery] [Required] string officeId)
//        {
//            try
//            {
//                if (string.IsNullOrWhiteSpace(officeId))
//                {
//                    return BadRequest("Office ID parameter is required");
//                }

//                var result = await _repository.GetPastDueUnscheduledAsync(officeId);
//                return Ok(new
//                {
//                    success = true,
//                    data = result,
//                    totalRecords = result.Count,
//                    officeId = officeId
//                });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error retrieving past due unscheduled jobs for office: {OfficeId}", officeId);
//                return StatusCode(500, new { success = false, message = "An error occurred while retrieving past due unscheduled jobs" });
//            }
//        }

//        #endregion

//        #region Health Check

//        /// <summary>
//        /// Health check endpoint
//        /// </summary>
//        [HttpGet("health")]
//        [AllowAnonymous]
//        [ProducesResponseType(StatusCodes.Status200OK)]
//        public IActionResult HealthCheck()
//        {
//            return Ok(new
//            {
//                Status = "Healthy",
//                Timestamp = DateTime.UtcNow,
//                Service = "AccMgrPerformanceReportController"
//            });
//        }

//        #endregion

//        // Commented out sections from the original controller requirements can be uncommented and implemented as needed
//        /*
//        /// <summary>
//        /// Get account manager service report emails (commented from original requirements)
//        /// </summary>
//        /// <param name="officeId">Office ID</param>
//        /// <returns>Service report email candidates</returns>
//        [HttpGet("service-report-emails")]
//        public async Task<IActionResult> GetServiceReportEmails([FromQuery] [Required] string officeId)
//        {
//            try
//            {
//                // Implementation for the commented section in the stored procedure:
//                // select * from @Callstatus Callstatus 
//                // where jobstatus IN('BRV','CLS','TRV' ,'COM','INV','WCN','WPW')
//                // and offid= @pOffid and returned <> '1900-1-1 00:00:00.000'
//                // and CallNbr NOT IN(SELECT CallNbr FROM [DCG-SQL-PROD].DCTST.dbo.aaJobServiceReportEmail)
//                // and ChangeAge <= 30
//                // order by scheduledstart

//                // This would require additional DTO and repository method implementation
//                return Ok(new { message = "Service report emails endpoint - implementation pending" });
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error retrieving service report emails for office: {OfficeId}", officeId);
//                return StatusCode(500, new { success = false, message = "An error occurred while retrieving service report emails" });
//            }
//        }
//        */
//    }
//}