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

                // Map full status names to codes using repository method
                string mappedStatus = _repository.MapStatusToCode(status);

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

                var validStatuses = new[] { "INP", "NCR", "MPJ", "COM", "Inp", "Def", "Wos", "All" };
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
        /// Saves or updates a stripping unit
        /// </summary>
        /// <param name="dto">The stripping unit data to save or update</param>
        /// <returns>Success response</returns>
        [HttpPost("SaveUpdateStrippingUnit")]
        public async Task<ActionResult> SaveUpdateStrippingUnit([FromBody] StrippedUnitsStatusDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Invalid request payload" 
                    });
                }

                // Basic validation using repository method
                var validationErrors = _repository.ValidateSaveUpdateRequest(dto);
                if (validationErrors.Any())
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Validation failed",
                        errors = validationErrors
                    });
                }

                _logger.LogInformation("Saving/updating stripping unit - RowIndex: {RowIndex}, SerialNo: {SerialNo}", 
                    dto.RowIndex, dto.SerialNo);

                var success = await _repository.SaveUpdateStrippingUnitAsync(dto);

                if (success)
                {
                    _logger.LogInformation("Successfully saved/updated stripping unit - RowIndex: {RowIndex}", dto.RowIndex);
                    
                    return Ok(new
                    {
                        success = true,
                        message = dto.RowIndex > 0 ? "Stripping unit updated successfully" : "Stripping unit created successfully",
                        rowIndex = dto.RowIndex
                    });
                }
                else
                {
                    _logger.LogWarning("Failed to save/update stripping unit - RowIndex: {RowIndex}", dto.RowIndex);
                    
                    return StatusCode(500, new { 
                        success = false, 
                        message = "Failed to save/update stripping unit" 
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving/updating stripping unit - RowIndex: {RowIndex}", dto?.RowIndex);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to save/update stripping unit", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Updates a stripping unit by RowIndex
        /// </summary>
        /// <param name="rowIndex">The RowIndex of the unit to update</param>
        /// <param name="dto">The updated stripping unit data</param>
        /// <returns>Success response</returns>
        [HttpPut("UpdateStrippingUnit/{rowIndex}")]
        public async Task<ActionResult> UpdateStrippingUnit(int rowIndex, [FromBody] StrippedUnitsStatusDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Invalid request payload" 
                    });
                }

                if (rowIndex <= 0)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Invalid RowIndex. RowIndex must be greater than 0." 
                    });
                }

                // Ensure the RowIndex in the URL matches the request body
                dto.RowIndex = rowIndex;

                // Basic validation using repository method
                var validationErrors = _repository.ValidateSaveUpdateRequest(dto);
                if (validationErrors.Any())
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Validation failed",
                        errors = validationErrors
                    });
                }

                _logger.LogInformation("Updating stripping unit - RowIndex: {RowIndex}, SerialNo: {SerialNo}", 
                    rowIndex, dto.SerialNo);

                var success = await _repository.SaveUpdateStrippingUnitAsync(dto);

                if (success)
                {
                    _logger.LogInformation("Successfully updated stripping unit - RowIndex: {RowIndex}", rowIndex);
                    
                    return Ok(new
                    {
                        success = true,
                        message = "Stripping unit updated successfully",
                        rowIndex = rowIndex
                    });
                }
                else
                {
                    _logger.LogWarning("Failed to update stripping unit - RowIndex: {RowIndex}", rowIndex);
                    
                    return StatusCode(500, new { 
                        success = false, 
                        message = "Failed to update stripping unit" 
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating stripping unit - RowIndex: {RowIndex}", rowIndex);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to update stripping unit", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Saves or updates stripped parts in unit
        /// </summary>
        /// <param name="dto">The stripped parts in unit data to save or update</param>
        /// <returns>Success response</returns>
        [HttpPost("SaveUpdateStrippedPartsInUnit")]
        public async Task<ActionResult> SaveUpdateStrippedPartsInUnit([FromBody] StrippedPartsInUnitDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Invalid request payload" 
                    });
                }

                // Basic validation using repository method
                var validationErrors = _repository.ValidateStrippedPartsInUnitRequest(dto);
                if (validationErrors.Any())
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Validation failed",
                        errors = validationErrors
                    });
                }

                _logger.LogInformation("Saving/updating stripped parts in unit - MasterRowIndex: {MasterRowIndex}, RowIndex: {RowIndex}, DCGPartNo: {DCGPartNo}", 
                    dto.MasterRowIndex, dto.RowIndex, dto.DCGPartNo);

                var success = await _repository.SaveUpdateStrippedPartsInUnitAsync(dto);

                if (success)
                {
                    _logger.LogInformation("Successfully saved/updated stripped parts in unit - MasterRowIndex: {MasterRowIndex}, RowIndex: {RowIndex}", 
                        dto.MasterRowIndex, dto.RowIndex);
                    
                    return Ok(new
                    {
                        success = true,
                        message = dto.RowIndex > 0 ? "Stripped parts in unit updated successfully" : "Stripped parts in unit created successfully",
                        masterRowIndex = dto.MasterRowIndex,
                        rowIndex = dto.RowIndex
                    });
                }
                else
                {
                    _logger.LogWarning("Failed to save/update stripped parts in unit - MasterRowIndex: {MasterRowIndex}, RowIndex: {RowIndex}", 
                        dto.MasterRowIndex, dto.RowIndex);
                    
                    return StatusCode(500, new { 
                        success = false, 
                        message = "Failed to save/update stripped parts in unit" 
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving/updating stripped parts in unit - MasterRowIndex: {MasterRowIndex}, RowIndex: {RowIndex}", 
                    dto?.MasterRowIndex, dto?.RowIndex);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to save/update stripped parts in unit", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Updates stripped parts in unit by MasterRowIndex and RowIndex
        /// </summary>
        /// <param name="masterRowIndex">The MasterRowIndex of the unit</param>
        /// <param name="rowIndex">The RowIndex of the parts record to update</param>
        /// <param name="dto">The updated stripped parts in unit data</param>
        /// <returns>Success response</returns>
        [HttpPut("UpdateStrippedPartsInUnit/{masterRowIndex}/{rowIndex}")]
        public async Task<ActionResult> UpdateStrippedPartsInUnit(int masterRowIndex, int rowIndex, [FromBody] StrippedPartsInUnitDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Invalid request payload" 
                    });
                }

                if (masterRowIndex <= 0)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Invalid MasterRowIndex. MasterRowIndex must be greater than 0." 
                    });
                }

                if (rowIndex <= 0)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Invalid RowIndex. RowIndex must be greater than 0." 
                    });
                }

                // Ensure the parameters in the URL match the request body
                dto.MasterRowIndex = masterRowIndex;
                dto.RowIndex = rowIndex;

                // Basic validation using repository method
                var validationErrors = _repository.ValidateStrippedPartsInUnitRequest(dto);
                if (validationErrors.Any())
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Validation failed",
                        errors = validationErrors
                    });
                }

                _logger.LogInformation("Updating stripped parts in unit - MasterRowIndex: {MasterRowIndex}, RowIndex: {RowIndex}, DCGPartNo: {DCGPartNo}", 
                    masterRowIndex, rowIndex, dto.DCGPartNo);

                var success = await _repository.SaveUpdateStrippedPartsInUnitAsync(dto);

                if (success)
                {
                    _logger.LogInformation("Successfully updated stripped parts in unit - MasterRowIndex: {MasterRowIndex}, RowIndex: {RowIndex}", 
                        masterRowIndex, rowIndex);
                    
                    return Ok(new
                    {
                        success = true,
                        message = "Stripped parts in unit updated successfully",
                        masterRowIndex = masterRowIndex,
                        rowIndex = rowIndex
                    });
                }
                else
                {
                    _logger.LogWarning("Failed to update stripped parts in unit - MasterRowIndex: {MasterRowIndex}, RowIndex: {RowIndex}", 
                        masterRowIndex, rowIndex);
                    
                    return StatusCode(500, new { 
                        success = false, 
                        message = "Failed to update stripped parts in unit" 
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating stripped parts in unit - MasterRowIndex: {MasterRowIndex}, RowIndex: {RowIndex}", 
                    masterRowIndex, rowIndex);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to update stripped parts in unit", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Gets strip part codes for dropdown population
        /// </summary>
        /// <returns>List of strip part codes with Code and Name</returns>
        [HttpGet("GetStripPartCodes")]
        public async Task<ActionResult<IEnumerable<StripPartCodeDto>>> GetStripPartCodes()
        {
            try
            {
                _logger.LogInformation("Getting strip part codes for dropdown");

                var stripPartCodes = await _repository.GetStripPartCodesAsync();

                _logger.LogInformation("Successfully retrieved {Count} strip part codes", stripPartCodes.Count());

                return Ok(new
                {
                    success = true,
                    data = stripPartCodes,
                    count = stripPartCodes.Count()
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting strip part codes");
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve strip part codes", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Deletes an entry by RowIndex and Source without using DTO
        /// </summary>
        /// <param name="rowIndex">The RowIndex of the entry to delete</param>
        /// <param name="source">Source type: PartsTest, UnitTest, OrderRequest, or other for StrippingUnit</param>
        /// <returns>Delete operation result</returns>
        [HttpDelete("Delete/{rowIndex}")]
        public async Task<ActionResult> DeleteBySource(int rowIndex, [FromQuery] string source = "StrippingUnit")
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

                if (string.IsNullOrWhiteSpace(source))
                {
                    source = "StrippingUnit"; // Default to StrippingUnit if not provided
                }

                _logger.LogInformation("Deleting entry - RowIndex: {RowIndex}, Source: {Source}", rowIndex, source);

                var result = await _repository.DeleteBySourceAsync(rowIndex, source);

                // Check if result indicates success (no error message)
                bool isSuccess = !result.Contains("Error Occured");

                if (isSuccess)
                {
                    _logger.LogInformation("Successfully deleted entry - RowIndex: {RowIndex}, Source: {Source}", rowIndex, source);
                    
                    return Ok(new
                    {
                        success = true,
                        message = result,
                        rowIndex = rowIndex,
                        source = source
                    });
                }
                else
                {
                    _logger.LogWarning("Delete operation returned error - RowIndex: {RowIndex}, Source: {Source}, Error: {Error}", 
                        rowIndex, source, result);
            
                    return BadRequest(new
                    {
                        success = false,
                        message = result,
                        rowIndex = rowIndex,
                        source = source
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting entry - RowIndex: {RowIndex}, Source: {Source}", rowIndex, source);
        
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to delete entry", 
                    error = ex.Message,
                    rowIndex = rowIndex,
                    source = source
                });
            }
        }

        /// <summary>
        /// Gets stripped parts in unit details using the GetStrippedPartsInUnit stored procedure
        /// </summary>
        /// <param name="masterRowIndex">The MasterRowIndex to retrieve parts for</param>
        /// <returns>Complete stripped parts in unit data including parts details, group counts, cost analysis, and location</returns>
        [HttpGet("GetStrippedPartsInUnit/{masterRowIndex}")]
        public async Task<ActionResult<StrippedPartsInUnitResponse>> GetStrippedPartsInUnit(int masterRowIndex)
        {
            try
            {
                if (masterRowIndex <= 0)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid MasterRowIndex. MasterRowIndex must be greater than 0."
                    });
                }

                _logger.LogInformation("Getting stripped parts in unit for MasterRowIndex: {MasterRowIndex}", masterRowIndex);

                var results = await _repository.GetStrippedPartsInUnitAsync(masterRowIndex);

                if (!results.HasData)
                {
                    _logger.LogWarning("No stripped parts found for MasterRowIndex: {MasterRowIndex}", masterRowIndex);
                    return NotFound(new
                    {
                        success = false,
                        message = "No stripped parts found for the specified MasterRowIndex",
                        masterRowIndex = masterRowIndex
                    });
                }

                _logger.LogInformation("Successfully retrieved stripped parts in unit - PartsCount: {PartsCount}, GroupCountsCount: {GroupCountsCount}, CostAnalysisCount: {CostAnalysisCount}, LocationsCount: {LocationsCount}",
                    results.PartsDetails.Count, results.GroupCounts.Count, results.CostAnalysis.Count, results.PartsLocations.Count);

                return Ok(new
                {
                    success = true,
                    data = results,
                    masterRowIndex = masterRowIndex,
                    summary = new
                    {
                        totalParts = results.PartsDetails.Count,
                        totalGroups = results.GroupCounts.Count,
                        totalCostAnalysisItems = results.CostAnalysis.Count,
                        totalLocations = results.PartsLocations.Count,
                        hasData = results.HasData
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting stripped parts in unit for MasterRowIndex: {MasterRowIndex}", masterRowIndex);

                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to retrieve stripped parts in unit",
                    error = ex.Message,
                    masterRowIndex = masterRowIndex
                });
            }
        }

    }
}