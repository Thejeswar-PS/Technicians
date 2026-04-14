using Dapper;
using Microsoft.AspNetCore.Mvc;
using System.Transactions;
using Technicians.Api.Models;
using Technicians.Api.Repository;

namespace Technicians.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TestEngineerJobsController : ControllerBase
    {
        private readonly ITestEngineerJobsRepository _repository;
        private readonly ILogger<TestEngineerJobsController> _logger;

        public TestEngineerJobsController(ITestEngineerJobsRepository repository, ILogger<TestEngineerJobsController> logger)
        {
            _repository = repository;
            _logger = logger;
        }

        /// <summary>
        /// Gets employee department information by Active Directory/Windows user ID
        /// Uses GetEmployeeDeptByUserID stored procedure for Test Engineer Jobs authorization
        /// GET /api/TestEngineerJobs/department-by-userid/john.doe
        /// </summary>
        [HttpGet("department-by-userid/{adUserId}")]
        public async Task<ActionResult<EmployeeDepartmentResponse>> GetEmployeeDepartmentByUserId(string adUserId)
        {
            if (string.IsNullOrWhiteSpace(adUserId))
            {
                return BadRequest(new EmployeeDepartmentResponse
                {
                    Success = false,
                    Message = "AD User ID cannot be empty"
                });
            }

            try
            {
                _logger.LogInformation("Getting employee department for AD User ID: {ADUserID}", adUserId);

                var result = await _repository.GetEmployeeDeptByUserIdAsync(adUserId);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting employee department for AD User ID: {ADUserID}", adUserId);
                
                return StatusCode(500, new EmployeeDepartmentResponse
                {
                    Success = false,
                    Message = "Failed to retrieve employee department information"
                });
            }
        }

        [HttpGet]
        public async Task<ActionResult<TestEngineerJobsResponse>> GetTestEngineerJobs(
            [FromQuery] string? engineer = null,
            [FromQuery] string? status = null,
            [FromQuery] string? location = null,
            [FromQuery] string? search = null,
            [FromQuery] string sortColumn = "ProjectedDate",
            [FromQuery] string sortDirection = "DESC")
        {
            try
            {
                var request = new TestEngineerJobsRequestDto
                {
                    Engineer = engineer ?? string.Empty,
                    Status = status ?? string.Empty,
                    Location = location ?? string.Empty,
                    Search = search ?? string.Empty,
                    SortColumn = sortColumn,
                    SortDirection = sortDirection
                };

                _logger.LogInformation("GetTestEngineerJobs called with: Engineer='{Engineer}', Status='{Status}', Location='{Location}', Search='{Search}'", 
                    request.Engineer, request.Status, request.Location, request.Search);

                var result = await _repository.GetTestEngineerJobsAsync(request);
                
                // Add detailed logging for debugging
                _logger.LogInformation("Repository returned: Success={Success}, Message='{Message}', RecordCount={RecordCount}", 
                    result.Success, result.Message, result.Data?.Count ?? 0);
                
                if (!result.Success)
                {
                    _logger.LogWarning("Repository failed with message: {Message}", result.Message);
                }
                
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting test engineer jobs: {Message}", ex.Message);
                return StatusCode(500, new TestEngineerJobsResponse
                {
                    Success = false,
                    Message = $"Failed to retrieve test engineer jobs: {ex.Message}"
                });
            }
        }

        [HttpPost]
        public async Task<ActionResult<TestEngineerJobsResponse>> GetTestEngineerJobs([FromBody] TestEngineerJobsRequestDto? request)
        {
            try
            {
                if (request == null)
                {
                    request = new TestEngineerJobsRequestDto(); // Use defaults if null
                }

                var result = await _repository.GetTestEngineerJobsAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting test engineer jobs via POST");
                return StatusCode(500, new TestEngineerJobsResponse
                {
                    Success = false,
                    Message = "Failed to retrieve test engineer jobs"
                });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TestEngineerJobsEntryResponse>> GetTestEngineerJobById(int id)
        {
            try
            {
                _logger.LogInformation("GetTestEngineerJobById called with id: {Id}", id);
                var result = await _repository.GetTestEngineerJobByIdAsync(id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting test engineer job by id: {Id}", id);
                return StatusCode(500, new TestEngineerJobsEntryResponse
                {
                    Success = false,
                    Message = "Failed to retrieve test engineer job"
                });
            }
        }

        [HttpPost("create")]
        public async Task<ActionResult<TestEngineerJobsEntryResponse>> CreateTestEngineerJob([FromBody] SaveUpdateTestEngineerJobsDto request)
        {
            try
            {
                _logger.LogInformation("CreateTestEngineerJob called for JobNumber: {JobNumber}", request.JobNumber);
                var result = await _repository.CreateTestEngineerJobAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating test engineer job");
                return StatusCode(500, new TestEngineerJobsEntryResponse
                {
                    Success = false,
                    Message = "Failed to create test engineer job"
                });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<TestEngineerJobsEntryResponse>> UpdateTestEngineerJob(int id, [FromBody] SaveUpdateTestEngineerJobsDto request)
        {
            try
            {
                request.RowID = id;
                _logger.LogInformation("UpdateTestEngineerJob called for id: {Id}", id);
                var result = await _repository.UpdateTestEngineerJobAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating test engineer job with id: {Id}", id);
                return StatusCode(500, new TestEngineerJobsEntryResponse
                {
                    Success = false,
                    Message = "Failed to update test engineer job"
                });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult<TestEngineerJobsEntryResponse>> DeleteTestEngineerJob(int id)
        {
            try
            {
                _logger.LogInformation("DeleteTestEngineerJob called for id: {Id}", id);
                var result = await _repository.DeleteTestEngineerJobAsync(id);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting test engineer job with id: {Id}", id);
                return StatusCode(500, new TestEngineerJobsEntryResponse
                {
                    Success = false,
                    Message = "Failed to delete test engineer job"
                });
            }
        }

        [HttpGet("nextrowid")]
        public async Task<ActionResult<NextRowIdResponse>> GetNextRowId()
        {
            try
            {
                _logger.LogInformation("GetNextRowId called");
                var result = await _repository.GetNextRowIdAsync();
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting next row id");
                return StatusCode(500, new NextRowIdResponse
                {
                    Success = false,
                    Message = "Failed to get next row id"
                });
            }
        }

        [HttpGet("charts")]
        public async Task<ActionResult<TestEngineerJobsChartsResponse>> GetChartData(
            [FromQuery] string? engineer = null,
            [FromQuery] string? status = null,
            [FromQuery] string? location = null,
            [FromQuery] string? search = null)
        {
            try
            {
                var request = new TestEngineerJobsRequestDto
                {
                    Engineer = engineer ?? string.Empty,
                    Status = status ?? string.Empty,
                    Location = location ?? string.Empty,
                    Search = search ?? string.Empty
                };

                var chartData = await _repository.GetChartDataAsync(request);
                return Ok(new { success = true, data = chartData });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting chart data");
                return StatusCode(500, new { success = false, message = "Failed to retrieve chart data" });
            }
        }

        [HttpGet("engineers")]
        public async Task<ActionResult<IEnumerable<EngineerDto>>> GetEngineers()
        {
            try
            {
                var engineers = await _repository.GetEngineersAsync();
                return Ok(new { success = true, engineers = engineers });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting engineers");
                return StatusCode(500, new { success = false, message = "Failed to retrieve engineers" });
            }
        }

        #region FILE MANAGEMENT

        /// <summary>
        /// Uploads a file for a Test Engineer Job
        /// POST /api/TestEngineerJobs/{jobId}/upload
        /// </summary>
        [HttpPost("{jobId}/upload")]
        public async Task<ActionResult<FileOperationResponse>> UploadFile(int jobId, [FromForm] IFormFile file, [FromForm] string jobNumber)
        {
            try
            {
                if (file == null)
                {
                    return BadRequest(new FileOperationResponse
                    {
                        Success = false,
                        Message = "No file provided"
                    });
                }

                if (string.IsNullOrWhiteSpace(jobNumber))
                {
                    return BadRequest(new FileOperationResponse
                    {
                        Success = false,
                        Message = "Job number is required"
                    });
                }

                _logger.LogInformation("Uploading file {FileName} for job {JobId} ({JobNumber})", file.FileName, jobId, jobNumber);

                var request = new FileUploadRequestDto
                {
                    JobId = jobId,
                    JobNumber = jobNumber,
                    File = file
                };

                var result = await _repository.UploadFileAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error uploading file for job {JobId}", jobId);
                return StatusCode(500, new FileOperationResponse
                {
                    Success = false,
                    Message = "Failed to upload file"
                });
            }
        }

        /// <summary>
        /// Gets all files for a specific job
        /// GET /api/TestEngineerJobs/{jobId}/files?jobNumber=xxx
        /// </summary>
        [HttpGet("{jobId}/files")]
        public async Task<ActionResult<FileOperationResponse>> GetJobFiles(int jobId, [FromQuery] string jobNumber)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(jobNumber))
                {
                    return BadRequest(new FileOperationResponse
                    {
                        Success = false,
                        Message = "Job number is required"
                    });
                }

                _logger.LogInformation("Getting files for job {JobId} ({JobNumber})", jobId, jobNumber);

                var result = await _repository.GetJobFilesAsync(jobId, jobNumber);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting files for job {JobId}", jobId);
                return StatusCode(500, new FileOperationResponse
                {
                    Success = false,
                    Message = "Failed to retrieve files"
                });
            }
        }

        /// <summary>
        /// Downloads a specific file
        /// GET /api/TestEngineerJobs/download?filePath=xxx
        /// </summary>
        [HttpGet("download")]
        public async Task<ActionResult> DownloadFile([FromQuery] string filePath)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(filePath))
                {
                    return BadRequest("File path is required");
                }

                _logger.LogInformation("Downloading file: {FilePath}", filePath);

                var result = await _repository.DownloadFileAsync(filePath);

                if (!result.Success || result.FileContent == null)
                {
                    return NotFound(result.Message);
                }

                return File(result.FileContent, result.ContentType, result.FileName);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error downloading file {FilePath}", filePath);
                return StatusCode(500, "Failed to download file");
            }
        }

        /// <summary>
        /// Deletes a specific file
        /// DELETE /api/TestEngineerJobs/files?filePath=xxx
        /// </summary>
        [HttpDelete("files")]
        public async Task<ActionResult<FileOperationResponse>> DeleteFile([FromQuery] string filePath)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(filePath))
                {
                    return BadRequest(new FileOperationResponse
                    {
                        Success = false,
                        Message = "File path is required"
                    });
                }

                _logger.LogInformation("Deleting file: {FilePath}", filePath);

                var result = await _repository.DeleteFileAsync(filePath);
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting file {FilePath}", filePath);
                return StatusCode(500, new FileOperationResponse
                {
                    Success = false,
                    Message = "Failed to delete file"
                });
            }
        }

        #endregion

        //[HttpGet("debug")]
        //public async Task<ActionResult> DebugDatabase()
        //{
        //    try
        //    {
        //        // Using ReadOnlyTransactionScope to ensure the connection is read-only
        //        using var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);
        //        using var connection = new Microsoft.Data.SqlClient.SqlConnection("Server=DCG-SQL-DEV;Database=DCGETech;User Id=sa;Password=DcG-S@l-D3v-22!!;MultipleActiveResultSets=True;Encrypt=False");
        //        await connection.OpenAsync();
                
        //        // Check if table exists
        //        var tableExists = await connection.QuerySingleOrDefaultAsync<int?>(
        //            "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'TestEngineerJobs'"
        //        ) ?? 0;
                
        //        if (tableExists == 0)
        //        {
        //            return Ok(new { 
        //                success = false, 
        //                message = "TestEngineerJobs table does not exist in DCGETech database",
        //                database = "DCGETech"
        //            });
        //        }
                
        //        // Check row count
        //        var rowCount = await connection.QuerySingleAsync<int>("SELECT COUNT(*) FROM TestEngineerJobs");
                
        //        // Get sample data
        //        var sampleData = await connection.QueryAsync("SELECT TOP 3 * FROM TestEngineerJobs");
                
        //        scope.Complete(); // Mark the transaction scope as complete
                
        //        return Ok(new { 
        //            success = true,
        //            tableExists = true,
        //            rowCount = rowCount,
        //            sampleData = sampleData,
        //            database = "DCGETech"
        //        });
        //    }
        //    catch (Exception ex)
        //    {
        //        return Ok(new { 
        //            success = false, 
        //            error = ex.Message,
        //            connectionString = "Server=DCG-SQL-DEV;Database=DCGETech;..."
        //        });
        //    }
        //}

        //  endpoint to test the repository directly
        //[HttpGet("test-connection")]
        //public async Task<ActionResult> TestConnection()
        //{
        //    try
        //    {
        //        _logger.LogInformation("Testing database connection and repository...");
                
        //        // Test the repository method directly
        //        var testRequest = new TestEngineerJobsRequestDto();
        //        var result = await _repository.GetTestEngineerJobsAsync(testRequest);
                
        //        return Ok(new
        //        {
        //            success = true,
        //            repositorySuccess = result.Success,
        //            message = result.Message,
        //            recordCount = result.Data?.Count ?? 0,
        //            totalRecords = result.TotalRecords
        //        });
        //    }
        //    catch (Exception ex)
        //    {
        //        _logger.LogError(ex, "Error testing connection: {Message}", ex.Message);
        //        return Ok(new
        //        {
        //            success = false,
        //            error = ex.Message,
        //            stackTrace = ex.StackTrace
        //        });
        //    }
        //}
    }
}