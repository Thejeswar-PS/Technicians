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

        //1. GetPartReqStatus

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

        //2. GetPartReqStatusByKey

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

        //3. GetPartReqList

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

        //4.GetPartCounts

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

        //5. GetAllParts

        [HttpGet("GetAllParts")]
        public async Task<IActionResult> GetAllParts(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All")
        {
            return await GetPartReqList(0, invUserID, offName);
        }

        //6. GetStagingParts

        [HttpGet("GetStagingParts")]
        public async Task<IActionResult> GetStagingParts(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All")
        {
            return await GetPartReqList(1, invUserID, offName);
        }


        //7.GetSubmittedParts

        [HttpGet("GetSubmittedParts")]
        public async Task<IActionResult> GetSubmittedParts(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All")
        {
            return await GetPartReqList(2, invUserID, offName);
        }

        //8. GetUrgentParts

        [HttpGet("GetUrgentParts")]
        public async Task<IActionResult> GetUrgentParts(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All")
        {
            return await GetPartReqList(3, invUserID, offName);
        }

        //9. GetPartsNeedingAttention

        [HttpGet("GetPartsNeedingAttention")]
        public async Task<IActionResult> GetPartsNeedingAttention(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All")
        {
            return await GetPartReqList(4, invUserID, offName);
        }

        //10. GetPartsOrderedTrackingRequired

        [HttpGet("GetPartsOrderedTrackingRequired")]
        public async Task<IActionResult> GetPartsOrderedTrackingRequired(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All")
        {
            return await GetPartReqList(5, invUserID, offName);
        }

        //11. GetShippedParts

        [HttpGet("GetShippedParts")]
        public async Task<IActionResult> GetShippedParts(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All")
        {
            return await GetPartReqList(6, invUserID, offName);
        }

        //12. GetDeliveredParts

        [HttpGet("GetDeliveredParts")]
        public async Task<IActionResult> GetDeliveredParts(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All")
        {
            return await GetPartReqList(7, invUserID, offName);
        }

        //13. GetInitiatedParts

        [HttpGet("GetInitiatedParts")]
        public async Task<IActionResult> GetInitiatedParts(
            [FromQuery] string? invUserID = "All",
            [FromQuery] string? offName = "All")
        {
            return await GetPartReqList(8, invUserID, offName);
        }

        //14.GetEmployeeStatusForJobList

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

        //15. GetEmployeeStatusForJobList

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

        //16. GetAccountManagerNames

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

        //17.GetInventoryUserNames

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
