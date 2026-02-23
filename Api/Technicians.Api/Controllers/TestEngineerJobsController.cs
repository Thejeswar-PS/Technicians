using Dapper;
using Microsoft.AspNetCore.Mvc;
using System.Transactions;
using Technicians.Api.Models;
using Technicians.Api.Repositories;
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