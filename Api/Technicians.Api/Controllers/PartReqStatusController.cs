using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PartReqStatusController : ControllerBase
    {
        private readonly PartReqStatusRepository _repository;
        private readonly CommonRepository _commonRepository;

        public PartReqStatusController(PartReqStatusRepository repository, CommonRepository commonRepository)
        {
            _repository = repository;
            _commonRepository = commonRepository;
        }

        //1. GetPartReqStatus - Enhanced with role-based filtering

        [HttpPost("GetPartReqStatus")]
        public async Task<IActionResult> GetPartReqStatus([FromBody] PartReqStatusRequestDto request)
        {
            if (request == null)
                return BadRequest("Invalid request payload.");

            try
            {
                // Apply role-based filtering if user context is provided
                var filteredRequest = await ApplyRoleBasedFiltering(request);
                var result = await _repository.GetPartReqStatusAsync(filteredRequest);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving part request status: {ex.Message}" });
            }
        }

        //2. GetPartReqStatusByKey - Enhanced with role-based filtering

        [HttpGet("GetPartReqStatusByKey")]
        public async Task<IActionResult> GetPartReqStatusByKey(
            [FromQuery] int key,
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All",
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            try
            {
                var request = new PartReqStatusRequestDto
                {
                    Key = key,
                    InvUserID = invUserID ?? "All",
                    OffName = offName ?? "All",
                    UserEmpID = userEmpID,
                    WindowsID = windowsID
                };

                // Apply role-based filtering
                var filteredRequest = await ApplyRoleBasedFiltering(request);
                var result = await _repository.GetPartReqStatusAsync(filteredRequest);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving part request status: {ex.Message}" });
            }
        }

        //3. GetPartReqList - Enhanced with role-based filtering

        [HttpGet("GetPartReqList")]
        public async Task<IActionResult> GetPartReqList(
            [FromQuery] int key,
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All",
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            try
            {
                // Apply role-based filtering
                var request = new PartReqStatusRequestDto
                {
                    Key = key,
                    InvUserID = invUserID ?? "All",
                    OffName = offName ?? "All",
                    UserEmpID = userEmpID,
                    WindowsID = windowsID
                };

                var filteredRequest = await ApplyRoleBasedFiltering(request);
                var result = await _repository.GetPartReqStatusListAsync(
                    filteredRequest.Key, 
                    filteredRequest.InvUserID ?? "All", 
                    filteredRequest.OffName ?? "All"
                );

                if (result == null || !result.Any())
                    return NotFound($"No part requests found for key: {key}");

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving part request list: {ex.Message}" });
            }
        }

        //4. GetPartCounts - Enhanced with role-based filtering

        [HttpGet("GetPartCounts")]
        public async Task<IActionResult> GetPartCounts(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            try
            {
                // Determine the actual invUserID based on role
                var actualInvUserID = await DetermineInventoryUserByRole(invUserID, userEmpID, windowsID);
                var result = await _repository.GetPartCountsAsync(actualInvUserID);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving part counts: {ex.Message}" });
            }
        }

        //5. GetAllParts - Enhanced with role-based filtering

        [HttpGet("GetAllParts")]
        public async Task<IActionResult> GetAllParts(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All",
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            return await GetPartReqList(0, invUserID, offName, userEmpID, windowsID);
        }

        //6. GetStagingParts - Enhanced with role-based filtering

        [HttpGet("GetStagingParts")]
        public async Task<IActionResult> GetStagingParts(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All",
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            return await GetPartReqList(1, invUserID, offName, userEmpID, windowsID);
        }

        //7. GetSubmittedParts - Enhanced with role-based filtering

        [HttpGet("GetSubmittedParts")]
        public async Task<IActionResult> GetSubmittedParts(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All",
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            return await GetPartReqList(2, invUserID, offName, userEmpID, windowsID);
        }

        //8. GetUrgentParts - Enhanced with role-based filtering

        [HttpGet("GetUrgentParts")]
        public async Task<IActionResult> GetUrgentParts(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All",
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            return await GetPartReqList(3, invUserID, offName, userEmpID, windowsID);
        }

        //9. GetPartsNeedingAttention - Enhanced with role-based filtering

        [HttpGet("GetPartsNeedingAttention")]
        public async Task<IActionResult> GetPartsNeedingAttention(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All",
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            return await GetPartReqList(4, invUserID, offName, userEmpID, windowsID);
        }

        //10. GetPartsOrderedTrackingRequired - Enhanced with role-based filtering

        [HttpGet("GetPartsOrderedTrackingRequired")]
        public async Task<IActionResult> GetPartsOrderedTrackingRequired(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All",
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            return await GetPartReqList(5, invUserID, offName, userEmpID, windowsID);
        }

        //11. GetShippedParts - Enhanced with role-based filtering

        [HttpGet("GetShippedParts")]
        public async Task<IActionResult> GetShippedParts(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All",
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            return await GetPartReqList(6, invUserID, offName, userEmpID, windowsID);
        }

        //12. GetDeliveredParts - Enhanced with role-based filtering

        [HttpGet("GetDeliveredParts")]
        public async Task<IActionResult> GetDeliveredParts(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All",
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            return await GetPartReqList(7, invUserID, offName, userEmpID, windowsID);
        }

        //13. GetInitiatedParts - Enhanced with role-based filtering

        [HttpGet("GetInitiatedParts")]
        public async Task<IActionResult> GetInitiatedParts(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All",
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            return await GetPartReqList(8, invUserID, offName, userEmpID, windowsID);
        }

        //14. GetEmployeeStatusForJobList - No changes needed

        [HttpPost("GetEmployeeStatusForJobList")]
        public async Task<IActionResult> GetEmployeeStatusForJobList([FromBody] EmployeeStatusRequestDto request)
        {
            if (request == null)
                return BadRequest("Invalid request payload.");

            if (string.IsNullOrWhiteSpace(request.ADUserID))
                return BadRequest("ADUserID is required.");

            try
            {
                var result = await _repository.GetEmployeeStatusForJobListAsync(request.ADUserID);
                return Ok(result);
            }   
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving employee status: {ex.Message}" });
            }
        }

        //15. GetEmployeeStatusForJobList - No changes needed

        [HttpGet("GetEmployeeStatusForJobList")]
        public async Task<IActionResult> GetEmployeeStatusForJobList([FromQuery] string adUserID)
        {
            if (string.IsNullOrWhiteSpace(adUserID))
                return BadRequest("ADUserID is required.");

            try
            {
                var result = await _repository.GetEmployeeStatusForJobListAsync(adUserID);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving employee status: {ex.Message}" });
            }
        }

        //16. GetAccountManagerNames - No changes needed

        [HttpGet("GetAccountManagerNames")]
        public async Task<IActionResult> GetAccountManagerNames()
        {
            try
            {
                var accountManagers = await _commonRepository.GetAccountManagers();

                if (accountManagers == null || !accountManagers.Any())
                    return Ok(new List<AccountManagerVM>());

                return Ok(accountManagers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving account manager names: {ex.Message}" });
            }
        }

        //17. GetInventoryUserNames - Enhanced with role-based filtering

        [HttpGet("GetInventoryUserNames")]
        public async Task<IActionResult> GetInventoryUserNames(
            [FromQuery] string? userEmpID = null,
            [FromQuery] string? windowsID = null)
        {
            try
            {
                var inventoryUsers = await _repository.GetInventoryUserNamesAsync();

                if (inventoryUsers == null || !inventoryUsers.Any())
                    return Ok(new List<InventoryUserDto>());

                // Apply role-based filtering for inventory users
                var filteredUsers = await FilterInventoryUsersByRole(inventoryUsers, userEmpID, windowsID);

                return Ok(filteredUsers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving inventory user names: {ex.Message}" });
            }
        }

        // Private helper methods for role-based filtering

        private async Task<PartReqStatusRequestDto> ApplyRoleBasedFiltering(PartReqStatusRequestDto request)
        {
            if (string.IsNullOrEmpty(request.WindowsID) && string.IsNullOrEmpty(request.UserEmpID))
            {
                return request; // No user context provided, return as-is
            }

            try
            {
                // Get user's employee status
                var windowsID = request.WindowsID ?? request.UserEmpID ?? "";
                if (string.IsNullOrEmpty(windowsID))
                {
                    return request;
                }

                var employeeStatus = await _repository.GetEmployeeStatusForJobListAsync(windowsID);
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
                    request.OffName = "All"; // Technicians see all account managers
                }
                else if (IsManagerRole(normalizedStatus))
                {
                    // For managers: check if they exist in account managers list
                    var accountManagers = await _commonRepository.GetAccountManagers();
                    var userManager = accountManagers?.FirstOrDefault(m => 
                        string.Equals(m.OFFID?.Trim(), empID, StringComparison.OrdinalIgnoreCase) ||
                        string.Equals(m.OFFNAME?.Trim(), empID, StringComparison.OrdinalIgnoreCase));

                    if (userManager != null)
                    {
                        request.OffName = userManager.OFFNAME?.ToUpper() ?? "All";
                    }
                    // Inventory user remains as requested or "All"
                }
                // For other roles, no filtering is applied (full access)

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
                var employeeStatus = await _repository.GetEmployeeStatusForJobListAsync(windowsId);
                
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

        private async Task<List<InventoryUserDto>> FilterInventoryUsersByRole(List<InventoryUserDto> inventoryUsers, string? userEmpID, string? windowsID)
        {
            if (string.IsNullOrEmpty(windowsID) && string.IsNullOrEmpty(userEmpID))
            {
                return inventoryUsers; // No user context, return all
            }

            try
            {
                var windowsId = windowsID ?? userEmpID ?? "";
                var employeeStatus = await _repository.GetEmployeeStatusForJobListAsync(windowsId);
                
                if (employeeStatus == null)
                {
                    return inventoryUsers;
                }

                var normalizedStatus = (employeeStatus.Status ?? "").Trim().ToLower();
                var empID = (userEmpID ?? "").Trim();

                if (IsTechnicianRole(normalizedStatus))
                {
                    // For technicians: restrict to only their own inventory user entry
                    var userInventoryId = await GetUserInventoryID(empID, windowsId);
                    if (!string.IsNullOrEmpty(userInventoryId))
                    {
                        var userEntry = inventoryUsers.FirstOrDefault(u => 
                            string.Equals(u.InvUserID?.Trim(), userInventoryId, StringComparison.OrdinalIgnoreCase) ||
                            string.Equals(u.Username?.Trim(), empID, StringComparison.OrdinalIgnoreCase));

                        if (userEntry != null)
                        {
                            // Return only the user's entry (no "All" option for technicians)
                            return new List<InventoryUserDto> { userEntry };
                        }
                        else
                        {
                            // Create a fallback entry for the technician
                            return new List<InventoryUserDto> 
                            { 
                                new InventoryUserDto 
                                { 
                                    InvUserID = userInventoryId, 
                                    Username = empID 
                                } 
                            };
                        }
                    }
                }

                // For managers and other roles: return all inventory users
                return inventoryUsers;
            }
            catch (Exception)
            {
                return inventoryUsers; // If error occurs, return all users
            }
        }

        private async Task<string?> GetUserInventoryID(string empID, string windowsID)
        {
            try
            {
                var inventoryUsers = await _repository.GetInventoryUserNamesAsync();
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
