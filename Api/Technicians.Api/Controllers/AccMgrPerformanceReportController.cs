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
