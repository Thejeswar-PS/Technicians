using Microsoft.AspNetCore.Mvc;
using Technicians.Api.Repository;
using Technicians.Api.Models;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NewUniTestController : ControllerBase
    {
        private readonly NewUniTestRepository _repository;
        private readonly ILogger<NewUniTestController> _logger;

        public NewUniTestController(
            NewUniTestRepository repository, 
            ILogger<NewUniTestController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        /// <summary>
        /// Gets new unit test list data - returns UPSTestStatusDto to reuse existing structure
        /// </summary>
        /// <param name="rowIndex">Row index to filter by (0 returns all records ordered by LastModifiedOn)</param>
        /// <returns>New unit test data using existing UPSTestStatusDto</returns>
        [HttpGet]
        public async Task<ActionResult<NewUniTestResponse>> GetNewUniTestList(
            [FromQuery] int rowIndex = 0)
        {
            try
            {
                _logger.LogInformation("Getting new unit test list - RowIndex: {RowIndex}", rowIndex);

                var request = new NewUniTestRequest { RowIndex = rowIndex };

                // Validate request
                var validationErrors = _repository.ValidateRequest(request);
                if (validationErrors.Any())
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Validation failed",
                        errors = validationErrors
                    });
                }

                var results = await _repository.GetNewUniTestListAsync(rowIndex);

                _logger.LogInformation("Successfully retrieved new unit test list - RecordCount: {RecordCount}, IsFiltered: {IsFiltered}", 
                    results.TotalRecords, results.IsFiltered);

                return Ok(new
                {
                    success = true,
                    data = results,
                    totalRecords = results.TotalRecords,
                    isFiltered = results.IsFiltered,
                    filteredRowIndex = results.FilteredRowIndex
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting new unit test list for RowIndex: {RowIndex}", rowIndex);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve new unit test list", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Gets a specific unit test by row index
        /// </summary>
        /// <param name="rowIndex">The row index to retrieve</param>
        /// <returns>Single UPSTestStatusDto record or not found</returns>
        [HttpGet("{rowIndex}")]
        public async Task<ActionResult<UPSTestStatusDto>> GetNewUniTestByRowIndex(int rowIndex)
        {
            try
            {
                _logger.LogInformation("Getting new unit test by RowIndex: {RowIndex}", rowIndex);

                if (rowIndex <= 0)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "RowIndex must be greater than 0" 
                    });
                }

                var result = await _repository.GetNewUniTestByRowIndexAsync(rowIndex);

                if (result == null)
                {
                    return NotFound(new { 
                        success = false, 
                        message = $"Unit test with RowIndex {rowIndex} not found" 
                    });
                }

                _logger.LogInformation("Successfully retrieved new unit test for RowIndex: {RowIndex}", rowIndex);

                return Ok(new
                {
                    success = true,
                    data = result
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting new unit test for RowIndex: {RowIndex}", rowIndex);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve unit test", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Gets summary statistics and metadata for the new unit tests
        /// </summary>
        /// <returns>Summary statistics including counts by status, make, etc.</returns>
        [HttpGet("summary")]
        public async Task<ActionResult> GetSummary()
        {
            try
            {
                _logger.LogInformation("Getting new unit test summary");

                var summary = await _repository.GetNewUniTestSummaryAsync();

                _logger.LogInformation("Successfully retrieved new unit test summary");

                return Ok(new
                {
                    success = true,
                    data = summary
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting new unit test summary");
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve summary", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Checks if a unit test exists for the given row index
        /// </summary>
        [HttpGet("exists/{rowIndex}")]
        public async Task<ActionResult> CheckUnitTestExists(int rowIndex)
        {
            try
            {
                _logger.LogInformation("Checking if unit test exists for RowIndex: {RowIndex}", rowIndex);

                if (rowIndex <= 0)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "RowIndex must be greater than 0" 
                    });
                }

                var exists = await _repository.UnitTestExistsAsync(rowIndex);

                return Ok(new
                {
                    success = true,
                    exists = exists,
                    rowIndex = rowIndex
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking if unit test exists for RowIndex: {RowIndex}", rowIndex);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to check unit test existence", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// MAIN API: Moves a unit to stripping using the MoveUnitToStripping stored procedure
        /// This is the only endpoint needed for the move operation
        /// </summary>
        /// <param name="dto">Unit data to move to stripping</param>
        /// <returns>Success or failure response with result message</returns>
        [HttpPost("move-to-stripping")]
        public async Task<ActionResult<MoveUnitToStrippingResponse>> MoveUnitToStripping([FromBody] MoveUnitToStrippingDto dto)
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

                _logger.LogInformation("Moving unit to stripping - RowIndex: {RowIndex}, Make: {Make}, SerialNo: {SerialNo}", 
                    dto.RowIndex, dto.Make, dto.SerialNo);

                // Validate the request
                var validationErrors = _repository.ValidateMoveRequest(dto);
                if (validationErrors.Any())
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Validation failed",
                        errors = validationErrors
                    });
                }

                // Check if unit already exists in stripping (built into the SP logic)
                var result = await _repository.MoveUnitToStrippingAsync(dto);

                if (result.Success)
                {
                    _logger.LogInformation("Successfully moved unit to stripping - RowIndex: {RowIndex}, Result: {Result}", 
                        dto.RowIndex, result.Result);
                    
                    return Ok(new
                    {
                        success = true,
                        message = result.Result,
                        data = result
                    });
                }
                else
                {
                    _logger.LogWarning("Unit move failed - RowIndex: {RowIndex}, Result: {Result}", 
                        dto.RowIndex, result.Result);
                    
                    return BadRequest(new
                    {
                        success = false,
                        message = result.Result,
                        data = result
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error moving unit to stripping - RowIndex: {RowIndex}", dto?.RowIndex);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to move unit to stripping", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// MAIN API: Saves or updates a new unit test using the SaveUpdateNewUnitTest stored procedure
        /// Handles both INSERT (new records) and UPDATE (existing records) automatically
        /// </summary>
        /// <param name="dto">Unit test data to save or update</param>
        /// <returns>Success or failure response with operation details</returns>
        [HttpPost("save-update")]
        public async Task<ActionResult> SaveUpdateNewUnitTest([FromBody] SaveUpdateNewUnitTestDto dto)
        {
            try
            {
                if (dto == null)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Invalid request payload"
                    });
                }

                _logger.LogInformation("Saving/updating unit test - RowIndex: {RowIndex}, Make: {Make}, SerialNo: {SerialNo}",
                    dto.RowIndex, dto.Make, dto.SerialNo);

                // Validate the request
                var validationErrors = _repository.ValidateSaveUpdateRequest(dto);
                if (validationErrors.Any())
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Validation failed",
                        errors = validationErrors
                    });
                }

                // Execute the save/update operation (SP handles INSERT vs UPDATE automatically)
                var success = await _repository.SaveUpdateNewUnitTestAsync(dto);

                if (success)
                {
                    _logger.LogInformation("Successfully saved/updated unit test - RowIndex: {RowIndex}", dto.RowIndex);

                    return Ok(new
                    {
                        success = true,
                        message = dto.RowIndex > 0 ? "Unit test updated successfully" : "Unit test created successfully",
                        rowIndex = dto.RowIndex
                    });
                }
                else
                {
                    return StatusCode(500, new
                    {
                        success = false,
                        message = "Failed to save/update unit test"
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving/updating unit test - RowIndex: {RowIndex}", dto?.RowIndex);

                return StatusCode(500, new
                {
                    success = false,
                    message = "Failed to save/update unit test",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// MAIN API: Updates unit test result using the SaveUpdateNewUnitResult stored procedure
        /// Updates test status, resolve notes, test procedures, and tester information
        /// </summary>
        /// <param name="dto">Unit test result data to update</param>
        /// <returns>Success or failure response</returns>
        [HttpPost("update-result")]
        public async Task<ActionResult> SaveUpdateNewUnitResult([FromBody] SaveUpdateNewUnitResultDto dto)
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

                _logger.LogInformation("Updating unit test result - RowIndex: {RowIndex}, Status: {Status}, TestedBy: {TestedBy}", 
                    dto.RowIndex, dto.Status, dto.TestedBy);

                // Validate the request
                var validationErrors = _repository.ValidateUpdateResultRequest(dto);
                if (validationErrors.Any())
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Validation failed",
                        errors = validationErrors
                    });
                }

                // Check if the unit test exists
                var unitExists = await _repository.UnitTestExistsAsync(dto.RowIndex);
                if (!unitExists)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = $"Unit test with RowIndex {dto.RowIndex} not found"
                    });
                }

                // Execute the update operation
                var success = await _repository.SaveUpdateNewUnitResultAsync(dto);

                if (success)
                {
                    _logger.LogInformation("Successfully updated unit test result - RowIndex: {RowIndex}, Status: {Status}", 
                        dto.RowIndex, dto.Status);
                    
                    var message = dto.Status == "COM" 
                        ? "Unit test result updated successfully and completion email sent"
                        : "Unit test result updated successfully";
                    
                    return Ok(new
                    {
                        success = true,
                        message = message,
                        rowIndex = dto.RowIndex,
                        status = dto.Status,
                        emailSent = dto.Status == "COM"
                    });
                }
                else
                {
                    return StatusCode(500, new
                    {
                        success = false,
                        message = "Failed to update unit test result"
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating unit test result - RowIndex: {RowIndex}", dto?.RowIndex);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to update unit test result", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// MAIN API: Deletes a unit test using the DeleteNewUnitTest stored procedure
        /// </summary>
        /// <param name="rowIndex">The RowIndex of the unit test to delete</param>
        /// <returns>Success or failure response with result message</returns>
        [HttpDelete("{rowIndex}")]
        public async Task<ActionResult<DeleteNewUnitTestResponse>> DeleteNewUnitTest(int rowIndex)
        {
            try
            {
                _logger.LogInformation("Deleting unit test - RowIndex: {RowIndex}", rowIndex);

                // Validate the request
                var validationErrors = _repository.ValidateDeleteRequest(rowIndex);
                if (validationErrors.Any())
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Validation failed",
                        errors = validationErrors
                    });
                }

                // Check if the unit test exists before attempting delete
                var unitExists = await _repository.UnitTestExistsAsync(rowIndex);
                if (!unitExists)
                {
                    _logger.LogWarning("Unit test not found for deletion - RowIndex: {RowIndex}", rowIndex);
                    return NotFound(new
                    {
                        success = false,
                        message = "Unit test not found",
                        rowIndex = rowIndex
                    });
                }

                // Execute the delete operation
                var result = await _repository.DeleteNewUnitTestAsync(rowIndex);

                if (result.Success)
                {
                    _logger.LogInformation("Successfully deleted unit test - RowIndex: {RowIndex}, Result: {Result}", 
                        rowIndex, result.Result);
                    
                    return Ok(new
                    {
                        success = true,
                        message = result.Result,
                        data = result
                    });
                }
                else
                {
                    _logger.LogWarning("Unit test deletion failed - RowIndex: {RowIndex}, Result: {Result}", 
                        rowIndex, result.Result);
                    
                    return BadRequest(new
                    {
                        success = false,
                        message = result.Result,
                        data = result
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting unit test - RowIndex: {RowIndex}", rowIndex);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to delete unit test", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Creates a new unit test record (separate from save-update)
        /// </summary>
        [HttpPost("create")]
        public async Task<ActionResult<CreateNewUnitResponse>> CreateNewUnit([FromBody] CreateNewUnitDto dto)
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

                _logger.LogInformation("Creating new unit - Make: {Make}, Model: {Model}, SerialNo: {SerialNo}", 
                    dto.Make, dto.Model, dto.SerialNo);

                // Validate the request
                var validationErrors = _repository.ValidateCreateNewUnitRequest(dto);
                if (validationErrors.Any())
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Validation failed",
                        errors = validationErrors
                    });
                }

                // Check if serial number already exists
                var serialExists = await _repository.SerialNumberExistsAsync(dto.SerialNo);
                if (serialExists)
                {
                    return Conflict(new
                    {
                        success = false,
                        message = $"A unit with serial number '{dto.SerialNo}' already exists"
                    });
                }

                // Create the new unit
                var result = await _repository.CreateNewUnitAsync(dto);

                _logger.LogInformation("Successfully created new unit - RowIndex: {RowIndex}, Make: {Make}, SerialNo: {SerialNo}", 
                    result.NewRowIndex, result.Make, result.SerialNo);
                
                return CreatedAtAction(
                    nameof(GetNewUniTestByRowIndex), 
                    new { rowIndex = result.NewRowIndex }, 
                    new
                    {
                        success = true,
                        message = result.Message,
                        data = result
                    });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating new unit - Make: {Make}, SerialNo: {SerialNo}", 
                    dto?.Make, dto?.SerialNo);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to create new unit", 
                    error = ex.Message 
                });
            }
        }
    }
}