using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Repository;
using Technicians.Api.Models;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StrippedUnitsStatusController : ControllerBase
    {
        private readonly StrippedUnitsStatusRepository _repository;
        private readonly ILogger<StrippedUnitsStatusController> _logger;

        public StrippedUnitsStatusController(
            StrippedUnitsStatusRepository repository, 
            ILogger<StrippedUnitsStatusController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        /// <summary>
        /// Gets stripped units status data using GET with query parameters
        /// </summary>
        /// <param name="status">Status filter: Inp, Def, Com, Wos, In Progress, Deferred, Completed, Waiting On Someone Else, or All (default: All)</param>
        /// <param name="rowIndex">Specific RowIndex to retrieve (default: 0 for all records)</param>
        /// <returns>Stripped units status data with make counts</returns>
        [HttpGet("GetStrippedUnitsStatus")]
        public async Task<ActionResult<StrippedUnitsStatusResponse>> GetStrippedUnitsStatus(
            [FromQuery] string status = "All",
            [FromQuery] int rowIndex = 0)
        {
            try
            {
                _logger.LogInformation("Getting stripped units status - Status: {Status}, RowIndex: {RowIndex}", status, rowIndex);

                // Map full status names to codes
                string mappedStatus = MapStatusToCode(status);

                var request = new StrippedUnitsStatusRequest
                {
                    Status = mappedStatus,
                    RowIndex = rowIndex
                };

                var results = await _repository.GetStrippedUnitsStatusAsync(request);

                _logger.LogInformation("Successfully retrieved stripped units status - UnitsCount: {UnitsCount}, MakeCountsCount: {MakeCountsCount}", 
                    results.UnitsData.Count, results.MakeCounts.Count);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalRecords = results.UnitsData.Count,
                    filters = new
                    {
                        originalStatus = status,
                        mappedStatus = mappedStatus,
                        rowIndex = rowIndex
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting stripped units status with filters: Status={Status}, RowIndex={RowIndex}", status, rowIndex);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve stripped units status", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Gets stripped units status data using POST with request body
        /// </summary>
        /// <param name="request">Request containing filter parameters</param>
        /// <returns>Stripped units status data with make counts</returns>
        [HttpPost("GetStrippedUnitsStatus")]
        public async Task<ActionResult<StrippedUnitsStatusResponse>> GetStrippedUnitsStatus([FromBody] StrippedUnitsStatusRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Invalid request payload" 
                    });
                }

                _logger.LogInformation("Getting stripped units status - Status: {Status}, RowIndex: {RowIndex}", request.Status, request.RowIndex);

                var results = await _repository.GetStrippedUnitsStatusAsync(request);

                _logger.LogInformation("Successfully retrieved stripped units status - UnitsCount: {UnitsCount}, MakeCountsCount: {MakeCountsCount}", 
                    results.UnitsData.Count, results.MakeCounts.Count);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalRecords = results.UnitsData.Count,
                    filters = request
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting stripped units status with request: {@Request}", request);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve stripped units status", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Gets all stripped units status data with no filters
        /// </summary>
        /// <returns>All stripped units status data</returns>
        [HttpGet("GetAllStrippedUnitsStatus")]
        public async Task<ActionResult<StrippedUnitsStatusResponse>> GetAllStrippedUnitsStatus()
        {
            try
            {
                _logger.LogInformation("Getting all stripped units status data");

                var results = await _repository.GetStrippedUnitsStatusAsync();

                _logger.LogInformation("Successfully retrieved all stripped units status - UnitsCount: {UnitsCount}, MakeCountsCount: {MakeCountsCount}", 
                    results.UnitsData.Count, results.MakeCounts.Count);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalRecords = results.UnitsData.Count
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all stripped units status");
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve all stripped units status", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Gets a specific stripped unit by RowIndex
        /// </summary>
        /// <param name="rowIndex">The RowIndex of the unit to retrieve</param>
        /// <returns>Single unit data</returns>
        [HttpGet("GetStrippedUnit/{rowIndex}")]
        public async Task<ActionResult<StrippedUnitsStatusResponse>> GetStrippedUnit(int rowIndex)
        {
            try
            {
                if (rowIndex <= 0)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Invalid RowIndex. RowIndex must be greater than 0." 
                    });
                }

                _logger.LogInformation("Getting stripped unit by RowIndex: {RowIndex}", rowIndex);

                var results = await _repository.GetStrippedUnitByRowIndexAsync(rowIndex);

                if (!results.UnitsData.Any())
                {
                    _logger.LogWarning("No stripped unit found for RowIndex: {RowIndex}", rowIndex);
                    return NotFound(new { 
                        success = false, 
                        message = "No stripped unit found for the specified RowIndex", 
                        rowIndex = rowIndex 
                    });
                }

                _logger.LogInformation("Successfully retrieved stripped unit for RowIndex: {RowIndex}", rowIndex);

                return Ok(new
                {
                    success = true,
                    data = results.UnitsData.FirstOrDefault(),
                    rowIndex = rowIndex
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting stripped unit by RowIndex: {RowIndex}", rowIndex);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve stripped unit", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Gets stripped units filtered by status
        /// </summary>
        /// <param name="status">Status to filter by (Inp, Def, Com, Wos)</param>
        /// <returns>Filtered units data with make counts</returns>
        [HttpGet("GetStrippedUnitsByStatus/{status}")]
        public async Task<ActionResult<StrippedUnitsStatusResponse>> GetStrippedUnitsByStatus(string status)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(status))
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Status parameter is required" 
                    });
                }

                var validStatuses = new[] { "Inp", "Def", "Com", "Wos", "All" };
                if (!validStatuses.Contains(status, StringComparer.OrdinalIgnoreCase))
                {
                    return BadRequest(new { 
                        success = false, 
                        message = $"Invalid status. Valid values are: {string.Join(", ", validStatuses)}" 
                    });
                }

                _logger.LogInformation("Getting stripped units by status: {Status}", status);

                var results = await _repository.GetStrippedUnitsByStatusAsync(status);

                _logger.LogInformation("Successfully retrieved {Count} stripped units for status: {Status}", results.UnitsData.Count, status);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalRecords = results.UnitsData.Count,
                    status = status
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting stripped units by status: {Status}", status);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve stripped units by status", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Gets only make counts for incomplete units
        /// </summary>
        /// <returns>List of make counts</returns>
        [HttpGet("GetMakeCounts")]
        public async Task<ActionResult<IEnumerable<MakeCountDto>>> GetMakeCounts()
        {
            try
            {
                _logger.LogInformation("Getting make counts for incomplete units");

                var makeCounts = await _repository.GetMakeCountsAsync();

                _logger.LogInformation("Successfully retrieved {Count} make counts", makeCounts.Count());

                return Ok(new
                {
                    success = true,
                    makeCounts = makeCounts,
                    count = makeCounts.Count()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting make counts");
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve make counts", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Gets make count data formatted for chart/graph display
        /// </summary>
        /// <returns>Chart-ready make count data</returns>
        [HttpGet("GetMakeCountsForChart")]
        public async Task<ActionResult> GetMakeCountsForChart()
        {
            try
            {
                _logger.LogInformation("Getting make counts for chart display");

                var makeCounts = await _repository.GetMakeCountsAsync();

                // Format data for common charting libraries (Chart.js, etc.)
                var chartData = new
                {
                    labels = makeCounts.Select(x => x.Make).ToArray(),
                    data = makeCounts.Select(x => x.MakeCount).ToArray(),
                    datasets = new[]
                    {
                        new
                        {
                            label = "Units by Make",
                            data = makeCounts.Select(x => x.MakeCount).ToArray(),
                            backgroundColor = new[]
                            {
                                "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", 
                                "#9966FF", "#FF9F40", "#FF6384", "#C9CBCF"
                            }
                        }
                    }
                };

                _logger.LogInformation("Successfully retrieved chart data for {Count} makes", makeCounts.Count());

                return Ok(new
                {
                    success = true,
                    chartData = chartData,
                    rawData = makeCounts
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting make counts for chart");
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve chart data", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Maps full status names to database status codes
        /// </summary>
        /// <param name="status">Full status name or code</param>
        /// <returns>Database status code</returns>
        private string MapStatusToCode(string status)
        {
            if (string.IsNullOrEmpty(status))
                return "All";

            return status.ToLower().Trim() switch
            {
                "in progress" => "Inp",
                "inp" => "Inp",
                "deferred" => "Def",
                "deffered" => "Def", // Handle the typo in your SP
                "def" => "Def",
                "completed" => "Com",
                "com" => "Com",
                "waiting on someone else" => "Wos",
                "wos" => "Wos",
                "all" => "All",
                _ => status // Return as-is if no mapping found
            };
        }
    }
}