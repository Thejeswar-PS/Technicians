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

        public PartReturnStatusController(PartReturnStatusRepository repository)
        {
            _repository = repository;
        }

        /// <summary>
        /// Get part return status data based on request parameters
        /// </summary>
        /// <param name="request">Request containing filter parameters</param>
        /// <returns>List of part return status records</returns>
        [HttpPost("GetPartReturnStatus")]
        public async Task<IActionResult> GetPartReturnStatus([FromBody] PartReturnStatusRequestDto request)
        {
            if (request == null)
                return BadRequest(new { success = false, message = "Invalid request payload." });

            // Trim the InvUserID to handle trailing spaces
            if (!string.IsNullOrEmpty(request.InvUserID))
            {
                request.InvUserID = request.InvUserID.Trim();
            }

            try
            {
                var result = await _repository.GetPartReturnStatusAsync(request);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving part return status: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get weekly parts returned count for chart display
        /// </summary>
        /// <returns>Weekly parts returned count data</returns>
        [HttpGet("GetWeeklyPartsReturnedCount")]
        public async Task<IActionResult> GetWeeklyPartsReturnedCount()
        {
            try
            {
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
        /// Get part return status for graph display
        /// </summary>
        /// <param name="invUserID">Inventory user ID filter</param>
        /// <param name="year">Year filter</param>
        /// <returns>Part return status data for graphs</returns>
        [HttpGet("GetPartReturnStatusForGraph")]
        public async Task<IActionResult> GetPartReturnStatusForGraph(
            [FromQuery] string invUserID = "All",
            [FromQuery] int? year = null)
        {
            try
            {
                // Trim invUserID to handle trailing spaces
                invUserID = invUserID?.Trim() ?? "All";
                
                var result = await _repository.GetPartReturnStatusForGraphAsync(invUserID, year);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving part return status for graph: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get parts not yet received by warehouse
        /// </summary>
        /// <param name="invUserID">Inventory user ID filter</param>
        /// <param name="year">Year filter</param>
        /// <returns>List of parts not received</returns>
        [HttpGet("GetPartsNotReceived")]
        public async Task<IActionResult> GetPartsNotReceived(
            [FromQuery] string invUserID = "All",
            [FromQuery] int? year = null)
        {
            try
            {
                // Trim invUserID to handle trailing spaces
                invUserID = invUserID?.Trim() ?? "All";
                
                var result = await _repository.GetPartsNotReceivedAsync(invUserID, year);

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
        /// Get parts with 'In Progress' return status
        /// </summary>
        /// <param name="invUserID">Inventory user ID filter</param>
        /// <param name="year">Year filter</param>
        /// <returns>List of parts in progress</returns>
        [HttpGet("GetPartsInProgress")]
        public async Task<IActionResult> GetPartsInProgress(
            [FromQuery] string invUserID = "All",
            [FromQuery] int? year = null)
        {
            try
            {
                // Trim invUserID to handle trailing spaces
                invUserID = invUserID?.Trim() ?? "All";
                
                var result = await _repository.GetPartsInProgressAsync(invUserID, year);

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
        /// Get parts with 'Pending' return status
        /// </summary>
        /// <param name="invUserID">Inventory user ID filter</param>
        /// <param name="year">Year filter</param>
        /// <returns>List of pending parts</returns>
        [HttpGet("GetPartsPending")]
        public async Task<IActionResult> GetPartsPending(
            [FromQuery] string invUserID = "All",
            [FromQuery] int? year = null)
        {
            try
            {
                // Trim invUserID to handle trailing spaces
                invUserID = invUserID?.Trim() ?? "All";
                
                var result = await _repository.GetPartsPendingAsync(invUserID, year);

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
        /// Get parts that have been returned
        /// </summary>
        /// <param name="invUserID">Inventory user ID filter</param>
        /// <param name="year">Year filter</param>
        /// <returns>List of returned parts</returns>
        [HttpGet("GetPartsReturned")]
        public async Task<IActionResult> GetPartsReturned(
            [FromQuery] string invUserID = "All",
            [FromQuery] int? year = null)
        {
            try
            {
                // Trim invUserID to handle trailing spaces
                invUserID = invUserID?.Trim() ?? "All";
                
                var result = await _repository.GetPartsReturnedAsync(invUserID, year);

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
        /// Get part return status by specific filters
        /// </summary>
        /// <param name="key">Key parameter (0-3)</param>
        /// <param name="invUserID">Inventory user ID filter</param>
        /// <param name="year">Year filter</param>
        /// <returns>List of part return status records</returns>
        [HttpGet("GetPartReturnStatusByKey")]
        public async Task<IActionResult> GetPartReturnStatusByKey(
            [FromQuery] int key,
            [FromQuery] string invUserID = "All",
            [FromQuery] int? year = null)
        {
            try
            {
                // Trim invUserID to handle trailing spaces
                invUserID = invUserID?.Trim() ?? "All";
                
                var request = new PartReturnStatusRequestDto
                {
                    Key = key,
                    Source = "Web",
                    InvUserID = invUserID,
                    Year = year ?? DateTime.Now.Year
                };

                var result = await _repository.GetPartReturnStatusAsync(request);
                return Ok(new { success = true, data = result });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"Error retrieving part return status by key: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get parts to be received by warehouse for chart display
        /// </summary>
        /// <param name="year">Year filter</param>
        /// <returns>Chart data and totals for parts to be received by warehouse</returns>
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

        /// <summary>
        /// Get parts received by warehouse for chart display
        /// </summary>
        /// <param name="year">Year filter</param>
        /// <returns>Chart data and totals for parts received by warehouse</returns>
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

        /// <summary>
        /// Get parts return data by week number
        /// </summary>
        /// <param name="weekNo">Week number of the year (1-52)</param>
        /// <returns>List of parts return data for the specified week</returns>
        [HttpGet("GetPartsReturnDataByWeekNo")]
        public async Task<IActionResult> GetPartsReturnDataByWeekNo([FromQuery] int weekNo)
        {
            if (weekNo < 1 || weekNo > 53)
                return Ok(new { success = true, data = new List<PartsReturnDataByWeekNoDto>(), count = 0, message = "Invalid week number." });

            try
            {
                var result = await _repository.GetPartsReturnDataByWeekNoAsync(weekNo);

                // Ensure non-null result
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

    }
}