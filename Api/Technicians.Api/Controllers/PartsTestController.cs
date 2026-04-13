using Microsoft.AspNetCore.Mvc;
using System.Data;
using Technicians.Api.Repository;
using Technicians.Api.Models;
using Microsoft.Data.SqlClient; 


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

        /// Gets the maximum test row index from PartsTestList table
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

        /// Saves or updates a parts test list entry
        /// <param name="request">The parts test data to save or update</param>
        [HttpPost("SaveUpdatePartsTestList")]
        public async Task<IActionResult> SaveUpdatePartsTestList([FromBody] PartsTestDto request)
        {
            if (request == null)
                return BadRequest(new
                {
                    success = false,
                    message = "Request body cannot be null"
                });

            if (request.RowIndex <= 0)
                return BadRequest(new
                {
                    success = false,
                    message = "Invalid RowIndex"
                });

            try
            {
                _logger.LogInformation("Saving parts test RowIndex: {RowIndex}", request.RowIndex);

                await _repository.SaveUpdatePartsTestAsync(request);

                var currentUser = System.Security.Principal.WindowsIdentity.GetCurrent()?.Name?.Split('\\')?.LastOrDefault() ?? Environment.UserName;

                return Ok(new
                {
                    success = true,
                    message = "Parts test saved successfully",
                    rowIndex = request.RowIndex,
                    modifiedBy = currentUser,
                    inventorySpecialist = !string.IsNullOrEmpty(request.InvUserID) ? request.InvUserID : currentUser
                });
            }
            catch (SqlException sqlEx)
            {
                _logger.LogError(sqlEx, "SQL Error for RowIndex {RowIndex}", request.RowIndex);

                return StatusCode(500, new
                {
                    success = false,
                    message = "Database error occurred",
                    detail = sqlEx.Message
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error for RowIndex {RowIndex}", request.RowIndex);

                return StatusCode(500, new
                {
                    success = false,
                    message = "Unexpected error occurred",
                    detail = ex.Message
                });
            }
        }

        /// Gets employee names by department using GET with query parameter
        /// <param name="department">Department code (T=Technicians, A=Admin, AM=Asset Management, etc.)</param>
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

        /// DEBUGGING:
        //[HttpGet("GetStoredProcDefinition")]
        //public async Task<IActionResult> GetStoredProcDefinition()
        //{
        //    try
        //    {
        //        var definition = await _repository.GetStoredProcedureDefinitionAsync();
        //        return Ok(new { definition = definition });
        //    }
        //    catch (Exception ex)
        //    {
        //        return Ok(new { error = ex.Message });
        //    }
        //}

        /// Deletes parts test list entry using DELETE with query parameters
        /// <param name="rowIndex">Row index of the entry to delete</param>
        /// <param name="source">Source type - defaults to "PartsTest" (primary focus)</param>
        [HttpDelete("DeletePartsTestList")]
        public async Task<IActionResult> DeletePartsTestList(
            [FromQuery] int rowIndex,
            [FromQuery] string source = "PartsTest")  // ? Clear default focus
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

        /// Check if job exists in system
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

       
        /// Get submitted date for job
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
        /// Archive parts test record (Final Approval) - Enhanced with validation
        /// </summary>
        [HttpPost("ArchiveRecord")]
        public async Task<IActionResult> ArchiveRecord([FromBody] ArchiveRecordRequest request)
        {
            try
            {
                if (request == null || request.RowIndex <= 0)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Valid RowIndex is required" 
                    });
                }

                var currentUser = System.Security.Principal.WindowsIdentity.GetCurrent()?.Name?.Split('\\')?.LastOrDefault() ?? Environment.UserName;
                
                _logger.LogInformation("User {UserId} attempting final approval/archive for RowIndex: {RowIndex}", currentUser, request.RowIndex);

                // Use enhanced archive method with validation
                var (success, message, validationErrors) = await _repository.ArchivePartsTestRecordAsync(request.RowIndex, validateFinalApproval: true);

                if (success)
                {
                    return Ok(new
                    {
                        success = true,
                        message = message, // "Final Approval Successful"
                        rowIndex = request.RowIndex,
                        archivedBy = currentUser,
                        archivedOn = DateTime.Now
                    });
                }
                else
                {
                    // Check if it's a validation error or system error
                    var statusCode = validationErrors.Any(e => e.Contains("validation") || e.Contains("must be") || e.Contains("Please select")) 
                        ? 400 // Bad Request for validation errors
                        : 500; // Internal Server Error for system errors

                    return StatusCode(statusCode, new
                    {
                        success = false,
                        message = message,
                        validationErrors = validationErrors,
                        rowIndex = request.RowIndex
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during final approval for RowIndex: {RowIndex}", request?.RowIndex ?? 0);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to process final approval", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Simple Archive (without validation) - for cases where you just want to archive
        /// </summary>
        [HttpPost("SimpleArchive")]
        public async Task<IActionResult> SimpleArchive([FromBody] ArchiveRecordRequest request)
        {
            try
            {
                if (request == null || request.RowIndex <= 0)
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Valid RowIndex is required" 
                    });
                }

                var currentUser = System.Security.Principal.WindowsIdentity.GetCurrent()?.Name?.Split('\\')?.LastOrDefault() ?? Environment.UserName;
                
                // Use archive method without validation
                var (success, message, _) = await _repository.ArchivePartsTestRecordAsync(request.RowIndex, validateFinalApproval: false);

                if (success)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Record archived successfully",
                        rowIndex = request.RowIndex,
                        archivedBy = currentUser
                    });
                }
                else
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = message
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error archiving record for RowIndex: {RowIndex}", request?.RowIndex ?? 0);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to archive record", 
                    error = ex.Message 
                });
            }
        }

        /// Gets dashboard chart data for Parts Test Status - LEGACY FUNCTIONALITY
        [HttpGet("GetPartsTestDashboard")]
        public async Task<IActionResult> GetPartsTestDashboard()
        {
            try
            {
                // Get parameters directly from query string to avoid any model binding issues
                var request = HttpContext.Request;
                var jobType = request.Query["jobType"].FirstOrDefault() ?? "";
                var priority = request.Query["priority"].FirstOrDefault() ?? "All";
                var archive = request.Query["archive"].FirstOrDefault() ?? "0";
                var make = request.Query["make"].FirstOrDefault() ?? "";
                var model = request.Query["model"].FirstOrDefault() ?? "";
                var assignedTo = request.Query["assignedTo"].FirstOrDefault() ?? "";

                _logger.LogInformation("Dashboard request - JobType: {JobType}, Priority: {Priority}, Archive: {Archive}, Make: {Make}, Model: {Model}, AssignedTo: {AssignedTo}", 
                    jobType, priority, archive, make, model, assignedTo);

                var dashboard = await _repository.GetPartsTestDashboardAsync(
                    jobType, 
                    priority == "All" ? "All" : priority, 
                    archive, 
                    make, 
                    model, 
                    assignedTo
                );
                
                return Ok(new
                {
                    success = true,
                    statusCounts = dashboard.StatusCounts,
                    jobTypeDistribution = dashboard.JobTypeDistribution,
                    message = "Dashboard data retrieved successfully"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting parts test dashboard");
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to retrieve dashboard data", 
                    error = ex.Message 
                });
            }
        }

        
        /// <param name="rowIndex">Row index for the parts test list</param>
        /// <param name="source">Source system - defaults to "PartsTest" (primary focus)</param>
        [HttpGet("GetPartsTestList")]
        public async Task<ActionResult<DataSet>> GetPartsTestList(
            [FromQuery] int rowIndex = 0,
            [FromQuery] string source = "PartsTest")  // ? Clear default focus
        {
            try
            {
                _logger.LogInformation("Getting parts test list for RowIndex: {RowIndex}, Source: {Source}", 
                    rowIndex, source);

                var results = await _repository.GetPartsTestListAsync(rowIndex, source);

                // Match legacy behavior - check for data existence
                if (results?.Tables?.Count == 0 || results?.Tables[0]?.Rows?.Count == 0)
                {
                    _logger.LogWarning("No data found for RowIndex: {RowIndex}, Source: {Source}", 
                        rowIndex, source);
                    
                    // Return success with empty data (matches legacy)
                    return Ok(new { 
                        success = true, 
                        message = "No data found for the specified parameters",
                        tables = new object[0]  // Empty array instead of null
                    });
                }

                _logger.LogInformation("Successfully retrieved parts test list with {TableCount} table(s) for RowIndex: {RowIndex}, Source: {Source}", 
                    results.Tables.Count, rowIndex, source);

                // Convert DataSet to JSON-serializable format - EXACTLY like legacy expects
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
                
                // Match legacy error handling - return error info but don't fail completely
                return Ok(new { 
                    success = false, 
                    message = "API failed to process the request", 
                    error = ex.Message,
                    tables = new object[0]  // Empty array for consistency
                });
            }
        }

        /// <summary>
        /// Gets complete job information including submitted date and inventory specialist
        /// Combines functionality similar to legacy DisplayData() method
        /// </summary>
        [HttpGet("GetJobInfo")]
        public async Task<IActionResult> GetJobInfo([FromQuery] string jobNo, [FromQuery] int rowIndex = 0)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(jobNo))
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Job number is required"
                    });
                }

                // Get submitted date (like legacy LoadSubmittedDate)
                var submittedDate = await _repository.LoadSubmittedDateAsync(jobNo);

                string inventorySpecialist = "";

                // If we have a rowIndex, get the inventory specialist from existing record
                if (rowIndex > 0)
                {
                    var results = await _repository.GetPartsTestListAsync(rowIndex, "PartsTest");
                    if (results?.Tables?.Count > 0 && results.Tables[0].Rows.Count > 0)
                    {
                        var row = results.Tables[0].Rows[0];
                        inventorySpecialist = row["InvUserID"]?.ToString() ?? "";
                    }
                }

                return Ok(new
                {
                    success = true,
                    jobNo = jobNo,
                    submittedDate = submittedDate,
                    inventorySpecialist = inventorySpecialist,
                    isNewEntry = rowIndex == 0
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting job info for JobNo: {JobNo}, RowIndex: {RowIndex}", jobNo, rowIndex);

                return StatusCode(500, new
                {
                    success = false,
                    submittedDate = "NA",
                    inventorySpecialist = "",
                    message = "Failed to get job information",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Debug endpoint to check if a specific record exists and get available records
        /// </summary>
        [HttpGet("DebugRecord/{rowIndex}")]
        public async Task<IActionResult> DebugRecord(int rowIndex)
        {
            try
            {
                var (recordExists, recordDetails, availableRowIndexes) = await _repository.DebugCheckRecordAsync(rowIndex);
                var (totalRecords, maxRowIndex, minRowIndex) = await _repository.GetTableStatsAsync();

                return Ok(new
                {
                    searchedRowIndex = rowIndex,
                    recordExists = recordExists,
                    recordDetails = recordDetails,
                    availableRowIndexes = availableRowIndexes,
                    tableStats = new
                    {
                        totalRecords = totalRecords,
                        maxRowIndex = maxRowIndex,
                        minRowIndex = minRowIndex
                    }
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error debugging record {RowIndex}", rowIndex);
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to debug record", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Get recent records for testing
        /// </summary>
        [HttpGet("GetRecentRecords")]
        public async Task<IActionResult> GetRecentRecords()
        {
            try
            {
                var results = await _repository.GetPartsTestListAsync(0, "PartsTest"); // Get all records
                
                if (results?.Tables?.Count > 0 && results.Tables[0].Rows.Count > 0)
                {
                    var recentRecords = results.Tables[0].AsEnumerable()
                        .Take(10)
                        .Select(row => new
                        {
                            RowIndex = row["RowIndex"],
                            CallNbr = row["CallNbr"]?.ToString(),
                            SiteID = row["SiteID"]?.ToString(),
                            Make = row["Make"]?.ToString(),
                            Model = row["Model"]?.ToString(),
                            Archive = row["Archive"]
                        })
                        .ToList();

                    return Ok(new
                    {
                        success = true,
                        recordCount = results.Tables[0].Rows.Count,
                        recentRecords = recentRecords
                    });
                }
                else
                {
                    return Ok(new
                    {
                        success = true,
                        recordCount = 0,
                        recentRecords = new List<object>()
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting recent records");
                
                return StatusCode(500, new { 
                    success = false, 
                    message = "Failed to get recent records", 
                    error = ex.Message 
                });
            }
        }

        /// <summary>
        /// Debug endpoint to check DCG_Employees table data for troubleshooting GetEmployeeNamesByDept
        /// </summary>
        //[HttpGet("DebugEmployeeData")]
        //public async Task<IActionResult> DebugEmployeeData([FromQuery] string department = "Assembly")
        //{
        //    try
        //    {
        //        var debugInfo = await _repository.DebugEmployeeDataAsync(department);
                
        //        return Ok(new
        //        {
        //            success = true,
        //            department = department,
        //            debugInfo = debugInfo
        //        });
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error debugging employee data for department: {Department}", department);
                
        //        return StatusCode(500, new { 
        //            success = false, 
        //            message = "Failed to debug employee data", 
        //            error = ex.Message 
        //        });
        //    }
        //}
    }
}