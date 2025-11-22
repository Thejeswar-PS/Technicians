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

        /// <summary>
        /// Get part request status with complete response including counts
        /// </summary>
        [HttpPost("GetPartReqStatus")]
        public async Task<IActionResult> GetPartReqStatus([FromBody] PartReqStatusRequestDto request)
        {
            if (request == null)
                return BadRequest("Invalid request payload.");

            try
            {
                var result = await _repository.GetPartReqStatusAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving part request status: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get part request status by query parameters
        /// </summary>
        [HttpGet("GetPartReqStatusByKey")]
        public async Task<IActionResult> GetPartReqStatusByKey(
            [FromQuery] int key,
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All")
        {
            try
            {
                var request = new PartReqStatusRequestDto
                {
                    Key = key,
                    InvUserID = invUserID ?? "All",
                    OffName = offName ?? "All"
                };

                var result = await _repository.GetPartReqStatusAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving part request status: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get only the part request list without counts
        /// </summary>
        [HttpGet("GetPartReqList")]
        public async Task<IActionResult> GetPartReqList(
            [FromQuery] int key,
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All")
        {
            try
            {
                var result = await _repository.GetPartReqStatusListAsync(key, invUserID ?? "All", offName ?? "All");

                if (result == null || !result.Any())
                    return NotFound($"No part requests found for key: {key}");

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving part request list: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get part counts (crash kit and load bank) only
        /// </summary>
        [HttpGet("GetPartCounts")]
        public async Task<IActionResult> GetPartCounts([FromQuery] string? invUserID = "All")
        {
            try
            {
                var result = await _repository.GetPartCountsAsync(invUserID ?? "All");
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving part counts: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get all parts with status 'All'
        /// Key = 0: All parts except delivered, canceled, returned, tracked
        /// </summary>
        [HttpGet("GetAllParts")]
        public async Task<IActionResult> GetAllParts(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All")
        {
            return await GetPartReqList(0, invUserID, offName);
        }

        /// <summary>
        /// Get parts with status 'Staging'
        /// Key = 1: Parts with status 'Staging'
        /// </summary>
        [HttpGet("GetStagingParts")]
        public async Task<IActionResult> GetStagingParts(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All")
        {
            return await GetPartReqList(1, invUserID, offName);
        }

        /// <summary>
        /// Get parts with status 'Submitted'
        /// Key = 2: Parts with status 'Submitted'
        /// </summary>
        [HttpGet("GetSubmittedParts")]
        public async Task<IActionResult> GetSubmittedParts(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All")
        {
            return await GetPartReqList(2, invUserID, offName);
        }

        /// <summary>
        /// Get urgent parts
        /// Key = 3: Parts marked as urgent
        /// </summary>
        [HttpGet("GetUrgentParts")]
        public async Task<IActionResult> GetUrgentParts(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All")
        {
            return await GetPartReqList(3, invUserID, offName);
        }

        /// <summary>
        /// Get parts that need attention
        /// Key = 4: Parts with status 'Needs Attention'
        /// </summary>
        [HttpGet("GetPartsNeedingAttention")]
        public async Task<IActionResult> GetPartsNeedingAttention(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All")
        {
            return await GetPartReqList(4, invUserID, offName);
        }

        /// <summary>
        /// Get parts with tracking required
        /// Key = 5: Parts with status 'OrderedTrackingReq'
        /// </summary>
        [HttpGet("GetPartsOrderedTrackingRequired")]
        public async Task<IActionResult> GetPartsOrderedTrackingRequired(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All")
        {
            return await GetPartReqList(5, invUserID, offName);
        }

        /// <summary>
        /// Get shipped parts
        /// Key = 6: Parts with status 'Shipped'
        /// </summary>
        [HttpGet("GetShippedParts")]
        public async Task<IActionResult> GetShippedParts(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All")
        {
            return await GetPartReqList(6, invUserID, offName);
        }

        /// <summary>
        /// Get delivered parts
        /// Key = 7: Parts with status 'Delivered'
        /// </summary>
        [HttpGet("GetDeliveredParts")]
        public async Task<IActionResult> GetDeliveredParts(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All")
        {
            return await GetPartReqList(7, invUserID, offName);
        }

        /// <summary>
        /// Get initiated parts
        /// Key = 8: Parts with status 'Initiated'
        /// </summary>
        [HttpGet("GetInitiatedParts")]
        public async Task<IActionResult> GetInitiatedParts(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All")
        {
            return await GetPartReqList(8, invUserID, offName);
        }

        /// <summary>
        /// POST employee status for job list based on AD User ID
        /// </summary>
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

        /// <summary>
        /// Get employee status for job list using query parameter
        /// </summary>
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

        /// <summary>
        /// Get account manager names for UI binding (dropdown lists)
        /// Replaces legacy AccountManagerNames method
        /// </summary>
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

        /// <summary>
        /// Get inventory user names for dropdown binding
        /// </summary>
        [HttpGet("GetInventoryUserNames")]
        public async Task<IActionResult> GetInventoryUserNames()
        {
            try
            {
                var inventoryUsers = await _repository.GetInventoryUserNamesAsync();

                if (inventoryUsers == null || !inventoryUsers.Any())
                    return Ok(new List<InventoryUserDto>());

                return Ok(inventoryUsers);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving inventory user names: {ex.Message}" });
            }
        }
    }
}
