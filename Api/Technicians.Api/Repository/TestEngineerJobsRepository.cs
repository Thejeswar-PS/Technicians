using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public interface ITestEngineerJobsRepository
    {
        Task<TestEngineerJobsResponse> GetTestEngineerJobsAsync(TestEngineerJobsRequestDto request);
        Task<TestEngineerJobsChartsResponse> GetChartDataAsync(TestEngineerJobsRequestDto request);
        Task<IEnumerable<EngineerDto>> GetEngineersAsync();
        Task<TestEngineerJobsEntryResponse> GetTestEngineerJobByIdAsync(int id);
        Task<TestEngineerJobsEntryResponse> CreateTestEngineerJobAsync(SaveUpdateTestEngineerJobsDto request);
        Task<TestEngineerJobsEntryResponse> UpdateTestEngineerJobAsync(SaveUpdateTestEngineerJobsDto request);
        Task<TestEngineerJobsEntryResponse> DeleteTestEngineerJobAsync(int id);
        Task<NextRowIdResponse> GetNextRowIdAsync();
    }

    public class TestEngineerJobsRepository : ITestEngineerJobsRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<TestEngineerJobsRepository> _logger;

        public TestEngineerJobsRepository(
            IConfiguration configuration,
            ILogger<TestEngineerJobsRepository> logger)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection not found");

            _logger = logger;
        }

        #region GET ALL (GRID)

        public async Task<TestEngineerJobsResponse> GetTestEngineerJobsAsync(TestEngineerJobsRequestDto request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                // Fixed query based on actual database schema from debug output
                var sql = $@"
                    SELECT
                        RowId as RowID,
                        JobNumber,
                        AssignedEngineer,
                        Status,
                        Location,
                        WorkType,
                        ProjectedDate,
                        CompletedDate,
                        EmergencyETA,
                        CreatedOn,
                        DescriptionNotes AS Description,
                        '' as Customer,
                        QC_Cleaned,
                        QC_Torque,
                        QC_Inspected
                    FROM TestEngineerJobs
                    WHERE
                        (@Engineer IS NULL OR @Engineer = '' OR AssignedEngineer = @Engineer)
                    AND (@Status IS NULL OR @Status = '' OR Status = @Status)
                    AND (@Location IS NULL OR @Location = '' OR Location = @Location)
                    AND (
                        @Search IS NULL OR @Search = '' OR
                        JobNumber LIKE '%' + @Search + '%' OR
                        AssignedEngineer LIKE '%' + @Search + '%'
                    )
                    ORDER BY {GetSafeSortColumn(request.SortColumn)} {GetSafeSortDirection(request.SortDirection)}";

                var parameters = new
                {
                    Engineer = string.IsNullOrWhiteSpace(request.Engineer) ? "" : request.Engineer,
                    Status = string.IsNullOrWhiteSpace(request.Status) ? "" : request.Status,
                    Location = string.IsNullOrWhiteSpace(request.Location) ? "" : request.Location,
                    Search = string.IsNullOrWhiteSpace(request.Search) ? "" : request.Search
                };

                _logger.LogInformation("Executing SQL: {SQL}", sql);
                _logger.LogInformation("Parameters: Engineer='{Engineer}', Status='{Status}', Location='{Location}', Search='{Search}'", 
                    parameters.Engineer, parameters.Status, parameters.Location, parameters.Search);

                var jobs = (await connection.QueryAsync<TestEngineerJobDto>(sql, parameters)).ToList();

                _logger.LogInformation("Query returned {Count} records", jobs.Count);

                // Compute UI fields and legacy logic
                foreach (var job in jobs)
                {
                    // CHANGED: JobNumber now gets the formatted RowID value (000001, 000002, etc.)
                    var originalJobNumber = job.JobNumber; // Store original job number
                    job.JobNumber = job.RowID.ToString("000000"); // JobNumber now shows formatted RowID
                    job.SerialNo = originalJobNumber; // SerialNo keeps the original JobNumber from database
                    
                    // COMMENTED OUT: JobNumberFormatted is no longer set
                    // job.JobNumberFormatted = job.RowID.ToString("000000");

                    var isClosed = job.Status?.Equals("Closed", StringComparison.OrdinalIgnoreCase) == true;

                    var isOverdue =
                        !isClosed &&
                        job.ProjectedDate.HasValue &&
                        job.ProjectedDate.Value.Date < DateTime.Today;

                    var isEmergency =
                        job.WorkType?.Equals("Emergency", StringComparison.OrdinalIgnoreCase) == true;

                    job.IsOverdue = isOverdue;
                    job.IsEmergency = isEmergency && !isOverdue;
                }

                return new TestEngineerJobsResponse
                {
                    Success = true,
                    Data = jobs,
                    TotalRecords = jobs.Count
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving TestEngineerJobs: {Message}", ex.Message);
                return new TestEngineerJobsResponse
                {
                    Success = false,
                    Message = $"Failed to retrieve test engineer jobs: {ex.Message}",
                    Data = new List<TestEngineerJobDto>(),
                    TotalRecords = 0
                };
            }
        }

        #endregion

        #region GET BY ID

        public async Task<TestEngineerJobsEntryResponse> GetTestEngineerJobByIdAsync(int id)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var sql = @"
                    SELECT
                        RowId as RowID,
                        JobNumber,
                        WorkType,
                        AssignedEngineer,
                        Status,
                        ProjectedDate,
                        CompletedDate,
                        EmergencyETA,
                        DescriptionNotes,
                        Location,
                        QC_Cleaned,
                        QC_Torque,
                        QC_Inspected,
                        CreatedOn,
                        ModifiedOn,
                        CreatedBy,
                        ModifiedBy
                    FROM TestEngineerJobs
                    WHERE RowId = @Id";

                var job = await connection.QuerySingleOrDefaultAsync<TestEngineerJobsEntryDto>(sql, new { Id = id });

                if (job == null)
                {
                    return new TestEngineerJobsEntryResponse
                    {
                        Success = false,
                        Message = "Record not found"
                    };
                }

                return new TestEngineerJobsEntryResponse
                {
                    Success = true,
                    Data = job
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving TestEngineerJob by ID: {Message}", ex.Message);
                return new TestEngineerJobsEntryResponse
                {
                    Success = false,
                    Message = $"Error retrieving record: {ex.Message}"
                };
            }
        }

        #endregion

        #region CREATE

        public async Task<TestEngineerJobsEntryResponse> CreateTestEngineerJobAsync(SaveUpdateTestEngineerJobsDto request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var sql = @"
                    INSERT INTO TestEngineerJobs
                    (JobNumber, WorkType, EmergencyETA, AssignedEngineer, Location,
                     ProjectedDate, CompletedDate, DescriptionNotes, Status,
                     QC_Cleaned, QC_Torque, QC_Inspected,
                     CreatedBy, CreatedOn, ModifiedBy, ModifiedOn)
                    VALUES
                    (@JobNumber, @WorkType, @EmergencyETA, @AssignedEngineer, @Location,
                     @ProjectedDate, @CompletedDate, @DescriptionNotes, @Status,
                     @QCCleaned, @QCTorque, @QCInspected,
                     @CreatedBy, GETDATE(), @ModifiedBy, GETDATE());

                    SELECT CAST(SCOPE_IDENTITY() AS INT);";

                var newId = await connection.QuerySingleAsync<int>(sql, request);

                return await GetTestEngineerJobByIdAsync(newId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating TestEngineerJob: {Message}", ex.Message);
                return new TestEngineerJobsEntryResponse
                {
                    Success = false,
                    Message = $"Error creating record: {ex.Message}"
                };
            }
        }

        #endregion

        #region UPDATE

        public async Task<TestEngineerJobsEntryResponse> UpdateTestEngineerJobAsync(SaveUpdateTestEngineerJobsDto request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var sql = @"
                    UPDATE TestEngineerJobs
                    SET
                        JobNumber = @JobNumber,
                        WorkType = @WorkType,
                        EmergencyETA = @EmergencyETA,
                        AssignedEngineer = @AssignedEngineer,
                        Location = @Location,
                        ProjectedDate = @ProjectedDate,
                        CompletedDate = @CompletedDate,
                        DescriptionNotes = @DescriptionNotes,
                        Status = @Status,
                        QC_Cleaned = @QCCleaned,
                        QC_Torque = @QCTorque,
                        QC_Inspected = @QCInspected,
                        ModifiedBy = @ModifiedBy,
                        ModifiedOn = GETDATE()
                    WHERE RowId = @RowID";

                var rows = await connection.ExecuteAsync(sql, request);

                if (rows == 0)
                {
                    return new TestEngineerJobsEntryResponse
                    {
                        Success = false,
                        Message = "Record not found"
                    };
                }

                return await GetTestEngineerJobByIdAsync(request.RowID);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating TestEngineerJob: {Message}", ex.Message);
                return new TestEngineerJobsEntryResponse
                {
                    Success = false,
                    Message = $"Error updating record: {ex.Message}"
                };
            }
        }

        #endregion

        #region DELETE

        public async Task<TestEngineerJobsEntryResponse> DeleteTestEngineerJobAsync(int id)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var sql = "DELETE FROM TestEngineerJobs WHERE RowId = @Id";

                var rows = await connection.ExecuteAsync(sql, new { Id = id });

                if (rows == 0)
                {
                    return new TestEngineerJobsEntryResponse
                    {
                        Success = false,
                        Message = "Record not found"
                    };
                }

                return new TestEngineerJobsEntryResponse
                {
                    Success = true,
                    Message = "Deleted successfully"
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting TestEngineerJob: {Message}", ex.Message);
                return new TestEngineerJobsEntryResponse
                {
                    Success = false,
                    Message = $"Error deleting record: {ex.Message}"
                };
            }
        }

        #endregion

        #region NEXT ROW ID

        public async Task<NextRowIdResponse> GetNextRowIdAsync()
        {
            using var connection = new SqlConnection(_connectionString);

            var nextId = await connection.QuerySingleAsync<int>(
                "SELECT ISNULL(MAX(RowId),0) + 1 FROM TestEngineerJobs");

            return new NextRowIdResponse
            {
                Success = true,
                NextRowId = nextId,
                FormattedRowId = nextId.ToString("000000")
            };
        }

        #endregion

        #region CHART DATA

        public async Task<TestEngineerJobsChartsResponse> GetChartDataAsync(TestEngineerJobsRequestDto request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var sql = @"
                    SELECT AssignedEngineer, Status, COUNT(*) AS JobCount
                    FROM TestEngineerJobs
                    WHERE
                        (@Engineer IS NULL OR @Engineer = '' OR AssignedEngineer = @Engineer)
                    AND (@Status IS NULL OR @Status = '' OR Status = @Status)
                    AND (@Location IS NULL OR @Location = '' OR Location = @Location)
                    AND (
                        @Search IS NULL OR @Search = '' OR
                        JobNumber LIKE '%' + @Search + '%' OR
                        AssignedEngineer LIKE '%' + @Search + '%'
                    )
                    GROUP BY AssignedEngineer, Status";

                var parameters = new
                {
                    Engineer = string.IsNullOrWhiteSpace(request.Engineer) ? "" : request.Engineer,
                    Status = string.IsNullOrWhiteSpace(request.Status) ? "" : request.Status,
                    Location = string.IsNullOrWhiteSpace(request.Location) ? "" : request.Location,
                    Search = string.IsNullOrWhiteSpace(request.Search) ? "" : request.Search
                };

                var results = await connection.QueryAsync(sql, parameters);

                var engineerData = results.Select(row => new EngineerChartDto
                {
                    Engineer = row.AssignedEngineer?.ToString() ?? "",
                    Status = row.Status?.ToString() ?? "",
                    Count = Convert.ToInt32(row.JobCount)
                }).ToList();

                var statusData = engineerData
                    .GroupBy(e => e.Status)
                    .Select(g => new StatusChartDto
                    {
                        Status = g.Key,
                        Count = g.Sum(e => e.Count)
                    }).ToList();

                return new TestEngineerJobsChartsResponse
                {
                    EngineerData = engineerData,
                    StatusData = statusData
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetChartDataAsync: {Message}", ex.Message);
                return new TestEngineerJobsChartsResponse();
            }
        }

        #endregion

        #region ENGINEERS

        public async Task<IEnumerable<EngineerDto>> GetEngineersAsync()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var parameters = new DynamicParameters();
                parameters.Add("@Department", "T");

                var dynamicResults = await connection.QueryAsync(
                    "GetEmployeeNamesByDept",
                    parameters,
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 30
                );

                var engineers = dynamicResults.Select(row =>
                {
                    var rowDict = (IDictionary<string, object>)row;
                    return new EngineerDto
                    {
                        EmpName = GetSafeStringValue(rowDict, "EmpName")
                    };
                }).ToList();

                // Add hardcoded engineers like in legacy
                engineers.Add(new EngineerDto { EmpName = "Senthil Munuswamy" });
                engineers.Add(new EngineerDto { EmpName = "Bharathi Mathivanan" });
                engineers.Add(new EngineerDto { EmpName = "Raja Ranganathan" });

                return engineers;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetEngineersAsync: {Message}", ex.Message);
                return new List<EngineerDto>();
            }
        }

        #endregion

        #region SAFE SORT

        private static string GetSafeSortColumn(string? column)
        {
            var allowed = new[]
            {
                "RowId",
                "JobNumber",
                "AssignedEngineer",
                "Status",
                "Location",
                "WorkType",
                "ProjectedDate",
                "CreatedOn"
            };

            return allowed.Contains(column, StringComparer.OrdinalIgnoreCase)
                ? column!
                : "RowId";
        }

        private static string GetSafeSortDirection(string? direction)
        {
            return direction?.ToUpper() == "ASC" ? "ASC" : "DESC";
        }

        #endregion

        #region HELPER METHODS

        private static string GetSafeStringValue(IDictionary<string, object> row, string columnName)
        {
            if (row.TryGetValue(columnName, out var value) && value != null && value != DBNull.Value)
            {
                return value.ToString() ?? string.Empty;
            }
            return string.Empty;
        }

        #endregion
    }
}