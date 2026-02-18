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
                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting test engineer jobs");
                return StatusCode(500, new TestEngineerJobsResponse
                {
                    Success = false,
                    Message = "Failed to retrieve test engineer jobs"
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

        [HttpGet("debug")]
        public async Task<ActionResult> DebugDatabase()
        {
            try
            {
                // Using ReadOnlyTransactionScope to ensure the connection is read-only
                using var scope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);
                using var connection = new Microsoft.Data.SqlClient.SqlConnection("Server=DCG-SQL-DEV;Database=DCGETech;User Id=sa;Password=DcG-S@l-D3v-22!!;MultipleActiveResultSets=True;Encrypt=False");
                await connection.OpenAsync();
                
                // Check if table exists
                var tableExists = await connection.QuerySingleOrDefaultAsync<int?>(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'TestEngineerJobs'"
                ) ?? 0;
                
                if (tableExists == 0)
                {
                    return Ok(new { 
                        success = false, 
                        message = "TestEngineerJobs table does not exist in DCGETech database",
                        database = "DCGETech"
                    });
                }
                
                // Check row count
                var rowCount = await connection.QuerySingleAsync<int>("SELECT COUNT(*) FROM TestEngineerJobs");
                
                // Get sample data
                var sampleData = await connection.QueryAsync("SELECT TOP 3 * FROM TestEngineerJobs");
                
                scope.Complete(); // Mark the transaction scope as complete
                
                return Ok(new { 
                    success = true,
                    tableExists = true,
                    rowCount = rowCount,
                    sampleData = sampleData,
                    database = "DCGETech"
                });
            }
            catch (Exception ex)
            {
                return Ok(new { 
                    success = false, 
                    error = ex.Message,
                    connectionString = "Server=DCG-SQL-DEV;Database=DCGETech;..."
                });
            }
        }
    }
}