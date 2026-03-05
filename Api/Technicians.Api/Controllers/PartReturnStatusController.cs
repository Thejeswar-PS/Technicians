using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PartReturnStatusController : ControllerBase
    {
        private readonly PartReturnStatusRepository _repository;
        private readonly CommonRepository _commonRepository;

        public PartReturnStatusController(PartReturnStatusRepository repository, CommonRepository commonRepository)
        {
            _repository = repository;
            _commonRepository = commonRepository;
        }

        /// <summary>
        /// Get part return status data based on request parameters - Enhanced with role-based filtering
        /// </summary>
        [HttpPost("GetPartReturnStatus")]
        public async Task<IActionResult> GetPartReturnStatus([FromBody] PartReturnStatusRequestDto request)
        {
            if (request == null)
                return BadRequest(new { success = false, message = "Invalid request payload." });

            try
            {
                // Apply role-based filtering
                var filteredRequest = await ApplyRoleBasedFiltering(request);
                var result = await _repository.GetPartReturnStatusAsync(filteredRequest);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving part return status: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get weekly parts returned count for chart display - Enhanced with role-based filtering
        /// </summary>
        [HttpGet("GetWeeklyPartsReturnedCount")]
        public async Task<IActionResult> GetWeeklyPartsReturnedCount(
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            try
            {
                // Apply role-based filtering for inventory user if needed
                var invUserID = await DetermineInventoryUserByRole("All", userEmpID, windowsID);
                var result = await _repository.GetWeeklyPartsReturnedCountAsync();
                
                if (result == null || !result.Any())
                    return Ok(new { success = true, data = new List<WeeklyPartsReturnedCountDto>(), message = "No weekly parts returned data found." });

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving weekly parts returned count: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get part return status for graph display - Enhanced with role-based filtering
        /// </summary>
        [HttpGet("GetPartReturnStatusForGraph")]
        public async Task<IActionResult> GetPartReturnStatusForGraph(
            [FromQuery] string invUserID = "All",
            [FromQuery] int? year = null,
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            try
            {
                // Apply role-based filtering
                var actualInvUserID = await DetermineInventoryUserByRole(invUserID, userEmpID, windowsID);
                var result = await _repository.GetPartReturnStatusForGraphAsync(actualInvUserID, year);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving part return status for graph: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get parts not yet received by warehouse - Enhanced with role-based filtering
        /// </summary>
        [HttpGet("GetPartsNotReceived")]
        public async Task<IActionResult> GetPartsNotReceived(
            [FromQuery] string invUserID = "All",
            [FromQuery] int? year = null,
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            try
            {
                var actualInvUserID = await DetermineInventoryUserByRole(invUserID, userEmpID, windowsID);
                var result = await _repository.GetPartsNotReceivedAsync(actualInvUserID, year);

                if (result == null || !result.Any())
                    return Ok(new { success = true, data = new List<PartReturnStatusDto>(), message = "No parts found matching the criteria." });

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving parts not received: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get parts with 'In Progress' return status - Enhanced with role-based filtering
        /// </summary>
        [HttpGet("GetPartsInProgress")]
        public async Task<IActionResult> GetPartsInProgress(
            [FromQuery] string invUserID = "All",
            [FromQuery] int? year = null,
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            try
            {
                var actualInvUserID = await DetermineInventoryUserByRole(invUserID, userEmpID, windowsID);
                var result = await _repository.GetPartsInProgressAsync(actualInvUserID, year);

                if (result == null || !result.Any())
                    return Ok(new { success = true, data = new List<PartReturnStatusDto>(), message = "No parts found with 'In Progress' status." });

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving parts in progress: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get parts with 'Pending' return status - Enhanced with role-based filtering
        /// </summary>
        [HttpGet("GetPartsPending")]
        public async Task<IActionResult> GetPartsPending(
            [FromQuery] string invUserID = "All",
            [FromQuery] int? year = null,
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            try
            {
                var actualInvUserID = await DetermineInventoryUserByRole(invUserID, userEmpID, windowsID);
                var result = await _repository.GetPartsPendingAsync(actualInvUserID, year);

                if (result == null || !result.Any())
                    return Ok(new { success = true, data = new List<PartReturnStatusDto>(), message = "No parts found with 'Pending' status." });

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving pending parts: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get parts that have been returned - Enhanced with role-based filtering
        /// </summary>
        [HttpGet("GetPartsReturned")]
        public async Task<IActionResult> GetPartsReturned(
            [FromQuery] string invUserID = "All",
            [FromQuery] int? year = null,
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            try
            {
                var actualInvUserID = await DetermineInventoryUserByRole(invUserID, userEmpID, windowsID);
                var result = await _repository.GetPartsReturnedAsync(actualInvUserID, year);

                if (result == null || !result.Any())
                    return Ok(new { success = true, data = new List<PartReturnStatusDto>(), message = "No returned parts found." });

                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving returned parts: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get part return status by specific filters - Enhanced with role-based filtering
        /// </summary>
        [HttpGet("GetPartReturnStatusByKey")]
        public async Task<IActionResult> GetPartReturnStatusByKey(
            [FromQuery] int key,
            [FromQuery] string invUserID = "All",
            [FromQuery] int? year = null,
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            try
            {
                var actualInvUserID = await DetermineInventoryUserByRole(invUserID, userEmpID, windowsID);
                
                var request = new PartReturnStatusRequestDto
                {
                    Key = key,
                    Source = "Web",
                    InvUserID = actualInvUserID,
                    Year = year ?? DateTime.Now.Year,
                    UserEmpID = userEmpID,
                    WindowsID = windowsID
                };

                var result = await _repository.GetPartReturnStatusAsync(request);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving part return status by key: {ex.Message}" });
            }
        }

        // Chart endpoints remain unchanged as they typically don't require user-specific filtering
        [HttpGet("GetPartsToBeReceivedChart")]
        public async Task<IActionResult> GetPartsToBeReceivedChart([FromQuery] int? year = null)
        {
            try
            {
                var selectedYear = year ?? DateTime.Now.Year;
                var result = await _repository.GetPartsToBeReceivedByWHAsync(selectedYear);
                
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving parts to be received chart data: {ex.Message}" });
            }
        }

        [HttpGet("GetPartsReceivedByWHChart")]
        public async Task<IActionResult> GetPartsReceivedByWHChart([FromQuery] int? year = null)
        {
            try
            {
                var selectedYear = year ?? DateTime.Now.Year;
                var result = await _repository.GetPartsReceivedByWHAsync(selectedYear);
                
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving parts received by warehouse chart data: {ex.Message}" });
            }
        }

        [HttpGet("GetPartsReturnDataByWeekNo")]
        public async Task<IActionResult> GetPartsReturnDataByWeekNo([FromQuery] int weekNo)
        {
            if (weekNo < 1 || weekNo > 53)
                return Ok(new { success = true, data = new List<PartsReturnDataByWeekNoDto>(), count = 0, message = "Invalid week number." });

            try
            {
                var result = await _repository.GetPartsReturnDataByWeekNoAsync(weekNo);
                result = result ?? new List<PartsReturnDataByWeekNoDto>();

                if (!result.Any())
                {
                    return Ok(new
                    {
                        success = true,
                        data = new List<PartsReturnDataByWeekNoDto>(),
                        count = 0,
                        message = $"No data found for week {weekNo}."
                    });
                }

                return Ok(new { success = true, data = result, count = result.Count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }

        // Private helper methods for role-based filtering
        private async Task<PartReturnStatusRequestDto> ApplyRoleBasedFiltering(PartReturnStatusRequestDto request)
        {
            if (string.IsNullOrEmpty(request.WindowsID) && string.IsNullOrEmpty(request.UserEmpID))
            {
                return request; // No user context provided, return as-is
            }

            try
            {
                var windowsID = request.WindowsID ?? request.UserEmpID ?? "";
                if (string.IsNullOrEmpty(windowsID))
                {
                    return request;
                }

                var employeeStatus = await GetEmployeeStatusAsync(windowsID);
                if (employeeStatus == null)
                {
                    return request; // No status found, return as-is
                }

                var normalizedStatus = (employeeStatus.Status ?? "").Trim().ToLower();
                var empID = (request.UserEmpID ?? "").Trim();

                // Apply filtering based on role
                if (IsTechnicianRole(normalizedStatus))
                {
                    // For technicians: restrict to their own inventory user ID
                    request.InvUserID = await GetUserInventoryID(empID, windowsID) ?? empID ?? "All";
                }

                return request;
            }
            catch (Exception)
            {
                // If role determination fails, return original request
                return request;
            }
        }

        private async Task<string> DetermineInventoryUserByRole(string? requestedInvUserID, string? userEmpID, string? windowsID)
        {
            if (string.IsNullOrEmpty(windowsID) && string.IsNullOrEmpty(userEmpID))
            {
                return requestedInvUserID ?? "All";
            }

            try
            {
                var windowsId = windowsID ?? userEmpID ?? "";
                var employeeStatus = await GetEmployeeStatusAsync(windowsId);
                
                if (employeeStatus == null)
                {
                    return requestedInvUserID ?? "All";
                }

                var normalizedStatus = (employeeStatus.Status ?? "").Trim().ToLower();

                if (IsTechnicianRole(normalizedStatus))
                {
                    // For technicians: force to their own inventory user ID
                    return await GetUserInventoryID(userEmpID?.Trim() ?? "", windowsId) ?? userEmpID ?? "All";
                }

                // For managers and other roles: use requested value
                return requestedInvUserID ?? "All";
            }
            catch (Exception)
            {
                return requestedInvUserID ?? "All";
            }
        }

        private async Task<EmployeeStatusDto?> GetEmployeeStatusAsync(string windowsID)
        {
            try
            {
                var employeeStatusList = await _commonRepository.GetEmployeeStatusForJobListAsync(windowsID);
                return employeeStatusList?.FirstOrDefault();
            }
            catch (Exception)
            {
                return null;
            }
        }

        private async Task<string?> GetUserInventoryID(string empID, string windowsID)
        {
            try
            {
                // Get inventory users from Part Request Status repository
                var partReqRepo = HttpContext.RequestServices.GetRequiredService<PartReqStatusRepository>();
                var inventoryUsers = await partReqRepo.GetInventoryUserNamesAsync();
                
                var userEntry = inventoryUsers?.FirstOrDefault(u => 
                    string.Equals(u.InvUserID?.Trim(), empID, StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(u.Username?.Trim(), empID, StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(u.InvUserID?.Trim(), windowsID, StringComparison.OrdinalIgnoreCase) ||
                    string.Equals(u.Username?.Trim(), windowsID, StringComparison.OrdinalIgnoreCase));

                return userEntry?.InvUserID ?? empID;
            }
            catch (Exception)
            {
                return empID; // Fallback to empID if lookup fails
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
    }
}