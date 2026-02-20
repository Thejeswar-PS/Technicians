using Microsoft.AspNetCore.Mvc;
using System.Data;
using Technicians.Api.Repository;
using Technicians.Api.Models;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PartsTestController : ControllerBase
    {
        private readonly PartsTestRepository _repository;
        private readonly ILogger<PartsTestController> _logger;

        public PartsTestController(
            PartsTestRepository repository, 
            ILogger<PartsTestController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        /// <summary>
        /// Gets parts test list data using GET with query parameters
        /// </summary>
        /// <param name="rowIndex">Row index parameter (defaults to 0)</param>
        /// <param name="source">Source type: PartsTest, OrderRequest, or other (defaults to PartsTest)</param>
        /// <returns>DataSet containing the results</returns>
        [HttpGet("GetPartsTestList")]
        public async Task<ActionResult<DataSet>> GetPartsTestList(
            [FromQuery] int rowIndex = 0,
            [FromQuery] string source = "PartsTest")
        {
            try
            {
                _logger.LogInformation("Getting parts test list for RowIndex: {RowIndex}, Source: {Source}", 
                    rowIndex, source);

                var results = await _repository.GetPartsTestListAsync(rowIndex, source);

                if (results == null || results.Tables.Count == 0)
                {
                    _logger.LogWarning("No data found for RowIndex: {RowIndex}, Source: {Source}", 
                        rowIndex, source);
                    return Ok(new { 
                        success = false, 
                        message = "No data found for the specified parameters" 
                    });
                }

                _logger.LogInformation("Successfully retrieved parts test list with {TableCount} table(s) for RowIndex: {RowIndex}, Source: {Source}", 
                    results.Tables.Count, rowIndex, source);

                // Convert DataSet to JSON-serializable format
                var jsonResult = new
                {
                    success = true,
                    tables = results.Tables.Cast<DataTable>().Select(table => new
                    {
                        tableName = table.TableName,
                        rows = table.Rows.Cast<DataRow>().Select(row => 
                            table.Columns.Cast<DataColumn>()
                                .ToDictionary(column => column.ColumnName, column => row[column] ?? DBNull.Value))
                    })
                };

                return Ok(jsonResult);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting parts test list for RowIndex: {RowIndex}, Source: {Source}", 
                    rowIndex, source);
                
                return NotFound(new { 
                    success = false, 
                    message = "API failed to process the request", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Gets parts test list data using POST with request body
        /// </summary>
        /// <param name="request">Request containing rowIndex and source parameters</param>
        /// <returns>DataSet containing the results</returns>
        [HttpPost("GetPartsTestList")]
        public async Task<ActionResult<DataSet>> GetPartsTestList([FromBody] PartsTestRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest("Invalid request payload.");
                }

                _logger.LogInformation("Getting parts test list for RowIndex: {RowIndex}, Source: {Source}", 
                    request.RowIndex, request.Source);

                var results = await _repository.GetPartsTestListAsync(request.RowIndex, request.Source ?? "PartsTest");

                if (results == null || results.Tables.Count == 0)
                {
                    _logger.LogWarning("No data found for RowIndex: {RowIndex}, Source: {Source}", 
                        request.RowIndex, request.Source);
                    return Ok(new { 
                        success = false, 
                        message = "No data found for the specified parameters" 
                    });
                }

                _logger.LogInformation("Successfully retrieved parts test list with {TableCount} table(s) for RowIndex: {RowIndex}, Source: {Source}", 
                    results.Tables.Count, request.RowIndex, request.Source);

                // Convert DataSet to JSON-serializable format
                var jsonResult = new
                {
                    success = true,
                    tables = results.Tables.Cast<DataTable>().Select(table => new
                    {
                        tableName = table.TableName,
                        rows = table.Rows.Cast<DataRow>().Select(row => 
                            table.Columns.Cast<DataColumn>()
                                .ToDictionary(column => column.ColumnName, column => row[column] ?? DBNull.Value))
                    })
                };

                return Ok(jsonResult);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting parts test list for RowIndex: {RowIndex}, Source: {Source}", 
                    request.RowIndex, request.Source);
                
                return NotFound(new { 
                    success = false, 
                    message = "API failed to process the request", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Gets the maximum test row index from PartsTestList table
        /// </summary>
        /// <returns>The next available row index</returns>
        [HttpGet("GetMaxTestRowIndex")]
        public async Task<ActionResult<int>> GetMaxTestRowIndex()
        {
            try
            {
                _logger.LogInformation("Getting maximum test row index");

                var maxRowIndex = await _repository.GetMaxTestRowIndexAsync();

                _logger.LogInformation("Successfully retrieved maximum test row index: {MaxRowIndex}", maxRowIndex);

                return Ok(new
                {
                    success = true,
                    maxRowIndex = maxRowIndex
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting maximum test row index");
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve maximum test row index", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Saves or updates a parts test list entry
        /// </summary>
        /// <param name="request">The parts test data to save or update</param>
        /// <returns>Success response</returns>
        [HttpPost("SaveUpdatePartsTestList")]
        public async Task<IActionResult> SaveUpdatePartsTestList([FromBody] SaveUpdatePartsTestDto request)
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

                _logger.LogInformation("Saving/updating parts test list for RowIndex: {RowIndex}", request.RowIndex);

                await _repository.SaveUpdatePartsTestListAsync(request);

                _logger.LogInformation("Successfully saved/updated parts test list for RowIndex: {RowIndex}", request.RowIndex);

                return Ok(new
                {
                    success = true,
                    message = "Parts test list saved/updated successfully",
                    rowIndex = request.RowIndex
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving/updating parts test list for RowIndex: {RowIndex}", request?.RowIndex ?? 0);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to save/update parts test list", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Gets employee names by department using GET with query parameter
        /// </summary>
        /// <param name="department">Department code (T=Technicians, A=Admin, AM=Asset Management, etc.)</param>
        /// <returns>List of employees in the specified department</returns>
        [HttpGet("GetEmployeeNamesByDept")]
        public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetEmployeeNamesByDept([FromQuery] string department)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(department))
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Department parameter is required" 
                    });
                }

                _logger.LogInformation("Getting employees for department: {Department}", department);

                var employees = await _repository.GetEmployeeNamesByDeptAsync(department);

                _logger.LogInformation("Successfully retrieved {Count} employees for department: {Department}", 
                    employees.Count(), department);

                return Ok(new
                {
                    success = true,
                    department = department,
                    employees = employees
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting employees for department: {Department}", department);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve employees", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Gets employee names by department using POST with request body
        /// </summary>
        /// <param name="request">Request containing department parameter</param>
        /// <returns>List of employees in the specified department</returns>
        [HttpPost("GetEmployeeNamesByDept")]
        public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetEmployeeNamesByDept([FromBody] EmployeeRequest request)
        {
            try
            {
                if (request == null || string.IsNullOrWhiteSpace(request.Department))
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Invalid request payload or missing department parameter" 
                    });
                }

                _logger.LogInformation("Getting employees for department: {Department}", request.Department);

                var employees = await _repository.GetEmployeeNamesByDeptAsync(request.Department);

                _logger.LogInformation("Successfully retrieved {Count} employees for department: {Department}", 
                    employees.Count(), request.Department);

                return Ok(new
                {
                    success = true,
                    department = request.Department,
                    employees = employees
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting employees for department: {Department}", request?.Department ?? "null");
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve employees", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Deletes parts test list entry using DELETE with query parameters
        /// </summary>
        /// <param name="rowIndex">Row index of the entry to delete</param>
        /// <param name="source">Source type: PartsTest, UnitTest, OrderRequest, or other (defaults to PartsTest)</param>
        /// <returns>Result message from the delete operation</returns>
        [HttpDelete("DeletePartsTestList")]
        public async Task<IActionResult> DeletePartsTestList(
            [FromQuery] int rowIndex,
            [FromQuery] string source = "PartsTest")
        {
            try
            {
                if (rowIndex <= 0)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Valid RowIndex parameter is required" 
                    });
                }

                _logger.LogInformation("Deleting parts test list for RowIndex: {RowIndex}, Source: {Source}", 
                    rowIndex, source);

                var result = await _repository.DeletePartsTestListAsync(rowIndex, source);

                _logger.LogInformation("Delete operation completed for RowIndex: {RowIndex}, Source: {Source}, Result: {Result}", 
                    rowIndex, source, result);

                // Check if the result indicates an error
                if (result.Contains("Error Occured"))
                {
                    return StatusCode(500, new
                    {
                        success = false,
                        message = "Failed to delete parts test list",
                        result = result,
                        rowIndex = rowIndex,
                        source = source
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Parts test list deleted successfully",
                    result = result,
                    rowIndex = rowIndex,
                    source = source
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting parts test list for RowIndex: {RowIndex}, Source: {Source}", 
                    rowIndex, source);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to delete parts test list", 
                    error = ex.Message,
                    rowIndex = rowIndex,
                    source = source
                });
            }
        }

        /// <summary>
        /// Check if job exists in system
        /// </summary>
        [HttpGet("CheckJobExists")]
        public async Task<IActionResult> CheckJobExists([FromQuery] string jobNo)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(jobNo))
                {
                    return BadRequest(new { 
                        success = false, 
                        exists = false,
                        message = "Job number is required" 
                    });
                }

                var exists = await _repository.CheckJobExistsAsync(jobNo);

                return Ok(new
                {
                    success = true,
                    exists = exists,
                    jobNo = jobNo
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking job existence for JobNo: {JobNo}", jobNo);
                
                return StatusCode(500, new { 
                    success = false, 
                    exists = false,
                    message = "Failed to check job existence", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Get submitted date for job
        /// </summary>
        [HttpGet("GetSubmittedDate")]
        public async Task<IActionResult> GetSubmittedDate([FromQuery] string jobNo)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(jobNo))
                {
                    return BadRequest(new { 
                        success = false, 
                        submittedDate = "NA",
                        message = "Job number is required" 
                    });
                }

                var submittedDate = await _repository.LoadSubmittedDateAsync(jobNo);

                return Ok(new
                {
                    success = true,
                    submittedDate = submittedDate,
                    jobNo = jobNo
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting submitted date for JobNo: {JobNo}", jobNo);
                
                return StatusCode(500, new { 
                    success = false, 
                    submittedDate = "NA",
                    message = "Failed to get submitted date", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Archive parts test record (Final Approval)
        /// </summary>
        [HttpPost("ArchiveRecord")]
        public async Task<IActionResult> ArchiveRecord([FromBody] int rowIndex)
        {
            try
            {
                if (rowIndex <= 0)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Valid RowIndex is required" 
                    });
                }

                var success = await _repository.ArchivePartsTestRecordAsync(rowIndex);

                if (success)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Record archived successfully",
                        rowIndex = rowIndex
                    });
                }
                else
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Failed to archive record"
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error archiving record for RowIndex: {RowIndex}", rowIndex);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to archive record", 
                    error = ex.Message 
                });
            }
        }
    }
}