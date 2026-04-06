using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using Technicians.Api.Repository;
using Technicians.Api.Models;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/AccMgrPerformanceReport")]
    public class AccMgrPerformanceReportController : ControllerBase
    {
        private readonly IAccMgrPerformanceReportRepository _repo;
        private readonly CommonRepository _commonRepository;

        public AccMgrPerformanceReportController(IAccMgrPerformanceReportRepository repo, CommonRepository commonRepository)
        {
            _repo = repo;
            _commonRepository = commonRepository;
        }

        // =========================
        // MASTER API (REQUIRED) - Enhanced with role-based filtering
        // =========================
        [HttpGet("report")]
        public async Task<IActionResult> GetReport(
            [FromQuery] string officeId,
            [FromQuery] string? roJobs,
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            if (string.IsNullOrWhiteSpace(officeId))
                return BadRequest("officeId is required");

            try
            {
                // Apply role-based filtering
                var filteredOfficeId = await ApplyRoleBasedFiltering(officeId, userEmpID, windowsID);
                
                var result = await _repo.GetReportAsync(
                    filteredOfficeId,
                    roJobs ?? ""   // convert null → empty for SQL
                );

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving account manager performance report: {ex.Message}" });
            }
        }

        // New POST endpoint for the report
        [HttpPost("report")]
        public async Task<IActionResult> GetReportPost([FromBody] AccMgrPerformanceReportRequestDto request)
        {
            if (request == null || string.IsNullOrWhiteSpace(request.OfficeId))
                return BadRequest("Invalid request or officeId is required");

            try
            {
                // Apply role-based filtering
                var filteredOfficeId = await ApplyRoleBasedFiltering(request.OfficeId, request.UserEmpID, request.WindowsID);
                request.OfficeId = filteredOfficeId;
                
                var result = await _repo.GetReportAsync(request);
                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving account manager performance report: {ex.Message}" });
            }
        }

        // =========================
        // SLICE APIs (UI CONVENIENCE) - Enhanced with role-based filtering
        // =========================
        [HttpGet("completed-not-returned")]
        public async Task<IActionResult> CompletedNotReturned(
            [FromQuery][Required] string officeId,
            [FromQuery] string? roJobs = null,
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            if (string.IsNullOrWhiteSpace(officeId))
                return BadRequest("officeId is required");

            try
            {
                var filteredOfficeId = await ApplyRoleBasedFiltering(officeId, userEmpID, windowsID);
                var r = await _repo.GetReportAsync(filteredOfficeId, roJobs ?? "");
                return Ok(r.CompletedNotReturned);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("returned-for-processing")]
        public async Task<IActionResult> ReturnedForProcessing(
            [FromQuery][Required] string officeId,
            [FromQuery] string? roJobs = null,
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            if (string.IsNullOrWhiteSpace(officeId))
                return BadRequest("officeId is required");

            try
            {
                var filteredOfficeId = await ApplyRoleBasedFiltering(officeId, userEmpID, windowsID);
                var r = await _repo.GetReportAsync(filteredOfficeId, roJobs ?? "");
                return Ok(r.ReturnedForProcessing);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("jobs-today")]
        public async Task<IActionResult> JobsToday(
            [FromQuery][Required] string officeId,
            [FromQuery] string? roJobs = null,
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            if (string.IsNullOrWhiteSpace(officeId))
                return BadRequest("officeId is required");

            try
            {
                var filteredOfficeId = await ApplyRoleBasedFiltering(officeId, userEmpID, windowsID);
                var r = await _repo.GetReportAsync(filteredOfficeId, roJobs ?? "");
                return Ok(r.JobsScheduledToday);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("confirmed-next-120-hours")]
        public async Task<IActionResult> ConfirmedNext120Hours(
            [FromQuery][Required] string officeId,
            [FromQuery] string? roJobs = "",
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            if (string.IsNullOrWhiteSpace(officeId))
                return BadRequest("officeId is required");

            try
            {
                var filteredOfficeId = await ApplyRoleBasedFiltering(officeId, userEmpID, windowsID);
                var r = await _repo.GetReportAsync(filteredOfficeId, roJobs ?? "");
                return Ok(r.JobsConfirmedNext120Hours);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        [HttpGet("past-due-unscheduled")]
        public async Task<IActionResult> PastDueUnscheduled(
            [FromQuery][Required] string officeId,
            [FromQuery] string? roJobs = "",
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            if (string.IsNullOrWhiteSpace(officeId))
                return BadRequest("officeId is required");

            try
            {
                var filteredOfficeId = await ApplyRoleBasedFiltering(officeId, userEmpID, windowsID);
                var r = await _repo.GetReportAsync(filteredOfficeId, roJobs ?? "");
                return Ok(r.PastDueUnscheduled);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // Add summary endpoint
        [HttpGet("summary")]
        public async Task<IActionResult> GetReportSummary(
            [FromQuery][Required] string officeId,
            [FromQuery] string? roJobs = null,
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            if (string.IsNullOrWhiteSpace(officeId))
                return BadRequest("officeId is required");

            try
            {
                var filteredOfficeId = await ApplyRoleBasedFiltering(officeId, userEmpID, windowsID);
                var report = await _repo.GetReportAsync(filteredOfficeId, roJobs ?? "");
                var summary = report.GetSummary();
                return Ok(summary);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // Private helper methods for role-based filtering
        private async Task<(string EmpID, string Status)?> GetEmployeeStatusAsync(string windowsID)
        {
            try
            {
                var employeeStatusList = await _commonRepository.GetEmployeeStatusForJobListAsync(windowsID);
                var firstResult = employeeStatusList?.FirstOrDefault();
                
                if (firstResult != null)
                {
                    var empId = ((dynamic)firstResult).EmpID?.ToString() ?? string.Empty;
                    var status = ((dynamic)firstResult).Status?.ToString() ?? string.Empty;
                    return (empId, status);
                }
                
                return null;
            }
            catch (Exception)
            {
                return null;
            }
        }

        private async Task<string> ApplyRoleBasedFiltering(string requestedOfficeId, string? userEmpID, string? windowsID)
        {
            if (string.IsNullOrEmpty(userEmpID) && string.IsNullOrEmpty(windowsID))
            {
                return requestedOfficeId; // No user context, return as-is
            }

            try
            {
                var windowsId = windowsID ?? userEmpID ?? "";
                var employeeStatusData = await GetEmployeeStatusAsync(windowsId);
                
                if (employeeStatusData == null)
                {
                    return requestedOfficeId;
                }

                var normalizedStatus = (employeeStatusData.Value.Status ?? "").Trim().ToLower();
                var userEmp = (userEmpID ?? "").Trim();

                if (IsTechnicianRole(normalizedStatus))
                {
                    // Technicians cannot access account manager performance reports
                    throw new UnauthorizedAccessException("Access denied: Technicians do not have access to account manager performance reports.");
                }
                else if (IsManagerRole(normalizedStatus) || IsEmployeeRole(normalizedStatus))
                {
                    // Managers (EmpStatus='M') and Employees (EmpStatus='E') both have full access
                    // Matches legacy behavior: EmpStatus in ('M', 'E') - can view any office, dropdown is pre-populated but changeable
                    return requestedOfficeId;
                }

                // All other unknown roles are denied
                throw new UnauthorizedAccessException("Access denied: You do not have permission to access account manager performance reports.");
            }
            catch (UnauthorizedAccessException)
            {
                throw; // Re-throw authorization exceptions
            }
            catch (Exception ex)
            {
                // Log the actual error for debugging but don't expose to client
                // If error occurs, return original office ID for now
                return requestedOfficeId;
            }
        }

        private static bool IsTechnicianRole(string normalizedStatus)
        {
            return normalizedStatus == "technician" || 
                   normalizedStatus == "techmanager" || 
                   normalizedStatus == "tech manager" || 
                   normalizedStatus.Contains("tech");
        }

        private static bool IsManagerRole(string normalizedStatus)
        {
            return normalizedStatus == "manager" || 
                   normalizedStatus == "other" || 
                   normalizedStatus.Contains("manager");
        }

        private static bool IsEmployeeRole(string normalizedStatus)
        {
            // Matches legacy EmpStatus = 'E' (Employee)
            return normalizedStatus == "employee" || normalizedStatus == "e";
        }
    }
}
