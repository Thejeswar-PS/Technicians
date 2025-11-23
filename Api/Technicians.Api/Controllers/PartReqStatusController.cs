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

        //18. GetPartsReceivedByWH

        [HttpPost("GetPartsReceivedByWH")]
        public async Task<IActionResult> GetPartsReceivedByWH([FromBody] PartsReceivedByWHRequestDto request)
        {
            if (request == null)
                return BadRequest("Invalid request payload.");

            if (request.Year <= 0)
                return BadRequest("Year must be a positive integer.");

            try
            {
                var result = await _repository.GetPartsReceivedByWHAsync(request.Year);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving parts received by warehouse: {ex.Message}" });
            }
        }

        //19. GetPartsReceivedByWH

        [HttpGet("GetPartsReceivedByWH")]
        public async Task<IActionResult> GetPartsReceivedByWH([FromQuery] int year)
        {
            if (year <= 0)
                return BadRequest("Year must be a positive integer.");

            try
            {
                var result = await _repository.GetPartsReceivedByWHAsync(year);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving parts received by warehouse: {ex.Message}" });
            }
        }

        //20. GetPartsTobeReceivedByWH

        [HttpPost("GetPartsTobeReceivedByWH")]
        public async Task<IActionResult> GetPartsTobeReceivedByWH([FromBody] PartsTobeReceivedByWHRequestDto request)
        {
            if (request == null)
                return BadRequest("Invalid request payload.");

            if (request.Year <= 0)
                return BadRequest("Year must be a positive integer.");

            try
            {
                var result = await _repository.GetPartsTobeReceivedByWHAsync(request.Year);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving parts to be received by warehouse: {ex.Message}" });
            }
        }

        //21. GetPartsTobeReceivedByWH

        [HttpGet("GetPartsTobeReceivedByWH")]
        public async Task<IActionResult> GetPartsTobeReceivedByWH([FromQuery] int year)
        {
            if (year <= 0)
                return BadRequest("Year must be a positive integer.");

            try
            {
                var result = await _repository.GetPartsTobeReceivedByWHAsync(year);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving parts to be received by warehouse: {ex.Message}" });
            }
        }


        //22. GetWeeklyPartsReturnedCount

        [HttpGet("GetWeeklyPartsReturnedCount")]
        public async Task<IActionResult> GetWeeklyPartsReturnedCount()
        {
            try
            {
                var result = await _repository.GetWeeklyPartsReturnedCountAsync();

                if (result?.WeeklyData == null || !result.WeeklyData.Any())
                    return NotFound("No weekly parts returned data found.");

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving weekly parts returned count: {ex.Message}" });
            }
        }

        //23. GetPartReturnStatus

        [HttpPost("GetPartReturnStatus")]
        public async Task<IActionResult> GetPartReturnStatus([FromBody] PartReturnStatusRequestDto request)
        {
            if (request == null)
                return BadRequest("Invalid request payload.");

            try
            {
                var result = await _repository.GetPartReturnStatusAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving part return status: {ex.Message}" });
            }
        }

        //24. GetPartReturnStatus

        [HttpGet("GetPartReturnStatus")]
        public async Task<IActionResult> GetPartReturnStatus(
            [FromQuery] int key,
            [FromQuery] string? source = "Web",
            [FromQuery] string? invUserID = "All",
            [FromQuery] int year = 0)
        {
            if (year == 0) year = DateTime.Now.Year;

            try
            {
                var request = new PartReturnStatusRequestDto
                {
                    Key = key,
                    Source = source ?? "Web",
                    InvUserID = invUserID ?? "All",
                    Year = year
                };

                var result = await _repository.GetPartReturnStatusAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving part return status: {ex.Message}" });
            }
        }


        //25. GetPartsPendingReturn

        [HttpGet("GetPartsPendingReturn")]
        public async Task<IActionResult> GetPartsPendingReturn(
            [FromQuery] string? invUserID = "All",
            [FromQuery] int year = 0)
        {
            if (year == 0) year = DateTime.Now.Year;

            try
            {
                var result = await _repository.GetPartReturnStatusListAsync(0, "Web", invUserID ?? "All", year);

                if (result == null || !result.Any())
                    return NotFound($"No parts pending return found for user: {invUserID}, year: {year}");

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving parts pending return: {ex.Message}" });
            }
        }

        //26. GetPartsReturnInProgress

        [HttpGet("GetPartsReturnInProgress")]
        public async Task<IActionResult> GetPartsReturnInProgress(
            [FromQuery] string? invUserID = "All",
            [FromQuery] int year = 0)
        {
            if (year == 0) year = DateTime.Now.Year;

            try
            {
                var result = await _repository.GetPartReturnStatusListAsync(1, "Web", invUserID ?? "All", year);

                if (result == null || !result.Any())
                    return NotFound($"No parts return in progress found for user: {invUserID}, year: {year}");

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving parts return in progress: {ex.Message}" });
            }
        }

        //27. GetPartsReturnPending

        [HttpGet("GetPartsReturnPending")]
        public async Task<IActionResult> GetPartsReturnPending(
            [FromQuery] string? invUserID = "All",
            [FromQuery] int year = 0)
        {
            if (year == 0) year = DateTime.Now.Year;

            try
            {
                var result = await _repository.GetPartReturnStatusListAsync(2, "Web", invUserID ?? "All", year);

                if (result == null || !result.Any())
                    return NotFound($"No parts return pending found for user: {invUserID}, year: {year}");

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving parts return pending: {ex.Message}" });
            }
        }

        //28. GetPartsReturned

        [HttpGet("GetPartsReturned")]
        public async Task<IActionResult> GetPartsReturned(
            [FromQuery] string? invUserID = "All",
            [FromQuery] int year = 0)
        {
            if (year == 0) year = DateTime.Now.Year;

            try
            {
                var result = await _repository.GetPartReturnStatusListAsync(3, "Web", invUserID ?? "All", year);

                if (result == null || !result.Any())
                    return NotFound($"No returned parts found for user: {invUserID}, year: {year}");

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving returned parts: {ex.Message}" });
            }
        }

        //29. GetPartReturnStatusForGraph

        [HttpGet("GetPartReturnStatusForGraph")]
        public async Task<IActionResult> GetPartReturnStatusForGraph(
            [FromQuery] string? invUserID = "All",
            [FromQuery] int year = 0)
        {
            if (year == 0) year = DateTime.Now.Year;

            try
            {
                var result = await _repository.GetPartReturnStatusForGraphAsync(invUserID ?? "All", year);

                if (result == null || !result.Any())
                    return NotFound($"No part return data found for graphs for user: {invUserID}, year: {year}");

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving part return status for graph: {ex.Message}" });
            }
        }

        //30. GetPartsReturnDataByWeek

        [HttpPost("GetPartsReturnDataByWeek")]
        public async Task<IActionResult> GetPartsReturnDataByWeek([FromBody] PartsReturnDataByWeekRequestDto request)
        {
            if (request == null)
                return BadRequest("Invalid request payload.");

            if (request.WeekNo <= 0 || request.WeekNo > 53)
                return BadRequest("Week number must be between 1 and 53.");

            try
            {
                var result = await _repository.GetPartsReturnDataByWeekAsync(request.WeekNo);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving parts return data by week: {ex.Message}" });
            }
        }

        //31. GetPartsReturnDataByWeek

        [HttpGet("GetPartsReturnDataByWeek")]
        public async Task<IActionResult> GetPartsReturnDataByWeek([FromQuery] int weekNo)
        {
            if (weekNo <= 0 || weekNo > 53)
                return BadRequest("Week number must be between 1 and 53.");

            try
            {
                var result = await _repository.GetPartsReturnDataByWeekAsync(weekNo);

                if (result?.PartsReturnData == null || !result.PartsReturnData.Any())
                    return NotFound($"No parts return data found for week: {weekNo}");

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving parts return data by week: {ex.Message}" });
            }
        }

        //32. GetPartsReturnDataByWeekList

        [HttpGet("GetPartsReturnDataByWeekList")]
        public async Task<IActionResult> GetPartsReturnDataByWeekList([FromQuery] int weekNo)
        {
            if (weekNo <= 0 || weekNo > 53)
                return BadRequest("Week number must be between 1 and 53.");

            try
            {
                var result = await _repository.GetPartsReturnDataByWeekListAsync(weekNo);

                if (result == null || !result.Any())
                    return NotFound($"No parts return data found for week: {weekNo}");

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving parts return data list by week: {ex.Message}" });
            }
        }

        //33. GetPartsReturnDataCurrentWeek

        [HttpGet("GetPartsReturnDataCurrentWeek")]
        public async Task<IActionResult> GetPartsReturnDataCurrentWeek()
        {
            try
            {
                // Calculate current week number
                var currentDate = DateTime.Now;
                var yearStart = new DateTime(currentDate.Year, 1, 1);
                var daysSinceYearStart = (currentDate - yearStart).Days;
                var currentWeek = (daysSinceYearStart / 7) + 1;

                var result = await _repository.GetPartsReturnDataByWeekAsync(currentWeek);

                if (result?.PartsReturnData == null || !result.PartsReturnData.Any())
                    return NotFound($"No parts return data found for current week: {currentWeek}");

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving current week parts return data: {ex.Message}" });
            }
        }
    }
}
