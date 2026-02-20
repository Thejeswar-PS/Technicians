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

        public TestEngineerJobsRepository(IConfiguration configuration, ILogger<TestEngineerJobsRepository> logger)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection not found");
            _logger = logger;
        }

        public async Task<TestEngineerJobsResponse> GetTestEngineerJobsAsync(TestEngineerJobsRequestDto request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var sql = @"
                    SELECT *
                    FROM TestEngineerJobs
                    WHERE
                        (@Engineer = '' OR AssignedEngineer = @Engineer)
                    AND (@Status = '' OR Status = @Status)
                    AND (@Location = '' OR Location = @Location)
                    AND (
                        @Search = '' OR
                        JobNumber LIKE '%' + @Search + '%' OR
                        AssignedEngineer LIKE '%' + @Search + '%'
                    )
                    ORDER BY " + GetSafeSortColumn(request.SortColumn) + " " + GetSafeSortDirection(request.SortDirection);

                var parameters = new DynamicParameters();
                parameters.Add("@Engineer", request.Engineer ?? string.Empty);
                parameters.Add("@Status", request.Status ?? string.Empty);
                parameters.Add("@Location", request.Location ?? string.Empty);
                parameters.Add("@Search", request.Search ?? string.Empty);

                var dynamicResults = await connection.QueryAsync(sql, parameters, commandTimeout: 30);

                var data = dynamicResults.Select(row =>
                {
                    var rowDict = (IDictionary<string, object>)row;

                    var job = new TestEngineerJobDto
                    {
                        JobNumber = GetSafeStringValue(rowDict, "JobNumber"),
                        AssignedEngineer = GetSafeStringValue(rowDict, "AssignedEngineer"),
                        Status = GetSafeStringValue(rowDict, "Status"),
                        Location = GetSafeStringValue(rowDict, "Location"),
                        WorkType = GetSafeStringValue(rowDict, "WorkType"),
                        ProjectedDate = GetSafeDateTimeValue(rowDict, "ProjectedDate"),
                        CreatedOn = GetSafeDateTimeValue(rowDict, "CreatedOn"),
                        Description = GetSafeStringValue(rowDict, "Description"),
                        Customer = GetSafeStringValue(rowDict, "Customer")
                    };

                    // Apply business logic for overdue and emergency status
                    var isClosed = job.Status?.Equals("Closed", StringComparison.OrdinalIgnoreCase) == true;
                    var isOverdue = !isClosed &&
                                   job.ProjectedDate.HasValue &&
                                   job.ProjectedDate.Value.Date < DateTime.Today;
                    var isEmergency = job.WorkType?.Equals("Emergency", StringComparison.OrdinalIgnoreCase) == true;

                    job.IsOverdue = isOverdue;
                    job.IsEmergency = isEmergency && !isOverdue; // Emergency only if not overdue

                    return job;
                }).ToList();

                return new TestEngineerJobsResponse
                {
                    Success = true,
                    Data = data,
                    TotalRecords = data.Count
                };
            }
            catch (SqlException sqlEx)
            {
                _logger.LogError(sqlEx, "SQL error occurred in GetTestEngineerJobsAsync: {Message}", sqlEx.Message);
                return new TestEngineerJobsResponse
                {
                    Success = false,
                    Message = $"Database error: {sqlEx.Message}",
                    Data = new List<TestEngineerJobDto>(),
                    TotalRecords = 0
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in GetTestEngineerJobsAsync: {Message}", ex.Message);
                return new TestEngineerJobsResponse
                {
                    Success = false,
                    Message = "An unexpected error occurred while retrieving test engineer jobs",
                    Data = new List<TestEngineerJobDto>(),
                    TotalRecords = 0
                };
            }
        }

        public async Task<TestEngineerJobsEntryResponse> GetTestEngineerJobByIdAsync(int id)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var sql = "SELECT * FROM TestEngineerJobs WHERE RowID = @Id";
                var parameters = new DynamicParameters();
                parameters.Add("@Id", id);

                var dynamicResult = await connection.QuerySingleOrDefaultAsync(sql, parameters, commandTimeout: 30);

                if (dynamicResult == null)
                {
                    return new TestEngineerJobsEntryResponse
                    {
                        Success = false,
                        Message = "Test engineer job not found"
                    };
                }

                var rowDict = (IDictionary<string, object>)dynamicResult;
                var entry = new TestEngineerJobsEntryDto
                {
                    RowID = GetSafeIntValue(rowDict, "RowID"),
                    JobNumber = GetSafeStringValue(rowDict, "JobNumber"),
                    WorkType = GetSafeStringValue(rowDict, "WorkType"),
                    AssignedEngineer = GetSafeStringValue(rowDict, "AssignedEngineer"),
                    Status = GetSafeStringValue(rowDict, "Status"),
                    ProjectedDate = GetSafeDateTimeValue(rowDict, "ProjectedDate"),
                    CompletedDate = GetSafeDateTimeValue(rowDict, "CompletedDate"),
                    EmergencyETA = GetSafeDateTimeValue(rowDict, "EmergencyETA"),
                    DescriptionNotes = GetSafeStringValue(rowDict, "DescriptionNotes"),
                    Location = GetSafeStringValue(rowDict, "Location"),
                    // Fixed mapping: Database columns are QCCleaned, QCTorque, QCInspected (no underscores)
                    // but TestEngineerJobsEntryDto uses QC_Cleaned, QC_Torque, QC_Inspected (with underscores)
                    QC_Cleaned = GetSafeBoolValue(rowDict, "QCCleaned"),
                    QC_Torque = GetSafeBoolValue(rowDict, "QCTorque"),
                    QC_Inspected = GetSafeBoolValue(rowDict, "QCInspected"),
                    CreatedOn = GetSafeDateTimeValue(rowDict, "CreatedOn"),
                    ModifiedOn = GetSafeDateTimeValue(rowDict, "ModifiedOn"),
                    CreatedBy = GetSafeStringValue(rowDict, "CreatedBy"),
                    ModifiedBy = GetSafeStringValue(rowDict, "ModifiedBy")
                };

                return new TestEngineerJobsEntryResponse
                {
                    Success = true,
                    Data = entry
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetTestEngineerJobByIdAsync for id: {Id}", id);
                return new TestEngineerJobsEntryResponse
                {
                    Success = false,
                    Message = $"Error retrieving test engineer job: {ex.Message}"
                };
            }
        }

        public async Task<TestEngineerJobsEntryResponse> CreateTestEngineerJobAsync(SaveUpdateTestEngineerJobsDto request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var sql = @"
                    INSERT INTO TestEngineerJobs 
                    (JobNumber, WorkType, EmergencyETA, AssignedEngineer, Location, ProjectedDate, 
                     CompletedDate, DescriptionNotes, Status, QCCleaned, QCTorque, QCInspected, 
                     CreatedBy, CreatedOn, ModifiedBy, ModifiedOn)
                    VALUES 
                    (@JobNumber, @WorkType, @EmergencyETA, @AssignedEngineer, @Location, @ProjectedDate, 
                     @CompletedDate, @DescriptionNotes, @Status, @QCCleaned, @QCTorque, @QCInspected, 
                     @CreatedBy, GETDATE(), @ModifiedBy, GETDATE());
                    
                    SELECT SCOPE_IDENTITY();";

                var parameters = new DynamicParameters();
                parameters.Add("@JobNumber", request.JobNumber);
                parameters.Add("@WorkType", request.WorkType);
                parameters.Add("@EmergencyETA", request.EmergencyETA);
                parameters.Add("@AssignedEngineer", request.AssignedEngineer);
                parameters.Add("@Location", request.Location);
                parameters.Add("@ProjectedDate", request.ProjectedDate);
                parameters.Add("@CompletedDate", request.CompletedDate);
                parameters.Add("@DescriptionNotes", request.DescriptionNotes);
                parameters.Add("@Status", request.Status);
                parameters.Add("@QCCleaned", request.QCCleaned);
                parameters.Add("@QCTorque", request.QCTorque);
                parameters.Add("@QCInspected", request.QCInspected);
                parameters.Add("@CreatedBy", request.CreatedBy);
                parameters.Add("@ModifiedBy", request.ModifiedBy);

                var newId = await connection.QuerySingleAsync<int>(sql, parameters, commandTimeout: 30);

                // Return the created entry
                return await GetTestEngineerJobByIdAsync(newId);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in CreateTestEngineerJobAsync");
                return new TestEngineerJobsEntryResponse
                {
                    Success = false,
                    Message = $"Error creating test engineer job: {ex.Message}"
                };
            }
        }

        public async Task<TestEngineerJobsEntryResponse> UpdateTestEngineerJobAsync(SaveUpdateTestEngineerJobsDto request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var sql = @"
                    UPDATE TestEngineerJobs 
                    SET JobNumber = @JobNumber,
                        WorkType = @WorkType,
                        EmergencyETA = @EmergencyETA,
                        AssignedEngineer = @AssignedEngineer,
                        Location = @Location,
                        ProjectedDate = @ProjectedDate,
                        CompletedDate = @CompletedDate,
                        DescriptionNotes = @DescriptionNotes,
                        Status = @Status,
                        QCCleaned = @QCCcleaned,
                        QCTorque = @QCTorque,
                        QCInspected = @QCInspected,
                        ModifiedBy = @ModifiedBy,
                        ModifiedOn = GETDATE()
                    WHERE RowID = @RowID";

                var parameters = new DynamicParameters();
                parameters.Add("@RowID", request.RowID);
                parameters.Add("@JobNumber", request.JobNumber);
                parameters.Add("@WorkType", request.WorkType);
                parameters.Add("@EmergencyETA", request.EmergencyETA);
                parameters.Add("@AssignedEngineer", request.AssignedEngineer);
                parameters.Add("@Location", request.Location);
                parameters.Add("@ProjectedDate", request.ProjectedDate);
                parameters.Add("@CompletedDate", request.CompletedDate);
                parameters.Add("@DescriptionNotes", request.DescriptionNotes);
                parameters.Add("@Status", request.Status);
                parameters.Add("@QCCleaned", request.QCCleaned);
                parameters.Add("@QCTorque", request.QCTorque);
                parameters.Add("@QCInspected", request.QCInspected);
                parameters.Add("@ModifiedBy", request.ModifiedBy);

                var rowsAffected = await connection.ExecuteAsync(sql, parameters, commandTimeout: 30);

                if (rowsAffected == 0)
                {
                    return new TestEngineerJobsEntryResponse
                    {
                        Success = false,
                        Message = "Test engineer job not found or no changes made"
                    };
                }

                // Return the updated entry
                return await GetTestEngineerJobByIdAsync(request.RowID);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in UpdateTestEngineerJobAsync for RowID: {RowID}", request.RowID);
                return new TestEngineerJobsEntryResponse
                {
                    Success = false,
                    Message = $"Error updating test engineer job: {ex.Message}"
                };
            }
        }

        public async Task<TestEngineerJobsEntryResponse> DeleteTestEngineerJobAsync(int id)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                // First get the entry to return it
                var entryToDelete = await GetTestEngineerJobByIdAsync(id);
                if (!entryToDelete.Success)
                {
                    return entryToDelete;
                }

                var sql = "DELETE FROM TestEngineerJobs WHERE RowID = @Id";
                var parameters = new DynamicParameters();
                parameters.Add("@Id", id);

                var rowsAffected = await connection.ExecuteAsync(sql, parameters, commandTimeout: 30);

                if (rowsAffected == 0)
                {
                    return new TestEngineerJobsEntryResponse
                    {
                        Success = false,
                        Message = "Test engineer job not found"
                    };
                }

                return new TestEngineerJobsEntryResponse
                {
                    Success = true,
                    Message = "Test engineer job deleted successfully",
                    Data = entryToDelete.Data
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in DeleteTestEngineerJobAsync for id: {Id}", id);
                return new TestEngineerJobsEntryResponse
                {
                    Success = false,
                    Message = $"Error deleting test engineer job: {ex.Message}"
                };
            }
        }

        public async Task<NextRowIdResponse> GetNextRowIdAsync()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var sql = "SELECT ISNULL(MAX(RowID), 0) + 1 FROM TestEngineerJobs";
                var nextId = await connection.QuerySingleAsync<int>(sql, commandTimeout: 30);

                return new NextRowIdResponse
                {
                    Success = true,
                    NextRowId = nextId
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetNextRowIdAsync");
                return new NextRowIdResponse
                {
                    Success = false,
                    Message = $"Error getting next row ID: {ex.Message}"
                };
            }
        }

        public async Task<TestEngineerJobsChartsResponse> GetChartDataAsync(TestEngineerJobsRequestDto request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                // ?? SIMPLIFIED QUERY - Remove filtering when no parameters are provided
                var sql = @"
                    SELECT AssignedEngineer, Status, COUNT(*) AS JobCount
                    FROM TestEngineerJobs
                    WHERE
                        (@Engineer = '' OR @Engineer IS NULL OR AssignedEngineer = @Engineer)
                    AND (@Status = '' OR @Status IS NULL OR Status = @Status)
                    AND (@Location = '' OR @Location IS NULL OR Location = @Location)
                    AND (
                        @Search = '' OR @Search IS NULL OR
                        JobNumber LIKE '%' + @Search + '%' OR
                        AssignedEngineer LIKE '%' + @Search + '%'
                    )
                    GROUP BY AssignedEngineer, Status";

                var parameters = new DynamicParameters();
                parameters.Add("@Engineer", string.IsNullOrEmpty(request.Engineer) ? null : request.Engineer);
                parameters.Add("@Status", string.IsNullOrEmpty(request.Status) ? null : request.Status);
                parameters.Add("@Location", string.IsNullOrEmpty(request.Location) ? null : request.Location);
                parameters.Add("@Search", string.IsNullOrEmpty(request.Search) ? null : request.Search);

                // ?? ADD LOGGING TO SEE WHAT'S HAPPENING
                _logger.LogInformation("Chart query parameters: Engineer={Engineer}, Status={Status}, Location={Location}, Search={Search}", 
                    parameters.Get<string>("@Engineer"), 
                    parameters.Get<string>("@Status"), 
                    parameters.Get<string>("@Location"), 
                    parameters.Get<string>("@Search"));

                var dynamicResults = await connection.QueryAsync(sql, parameters, commandTimeout: 30);

                _logger.LogInformation("Chart query returned {Count} rows", dynamicResults.Count());

                var engineerData = dynamicResults.Select(row =>
                {
                    var rowDict = (IDictionary<string, object>)row;
                    return new EngineerChartDto
                    {
                        Engineer = GetSafeStringValue(rowDict, "AssignedEngineer"),
                        Status = GetSafeStringValue(rowDict, "Status"),
                        Count = GetSafeIntValue(rowDict, "JobCount")
                    };
                }).ToList();

                var statusData = engineerData
                    .GroupBy(e => e.Status)
                    .Select(g => new StatusChartDto
                    {
                        Status = g.Key,
                        Count = g.Sum(e => e.Count)
                    }).ToList();

                _logger.LogInformation("Processed chart data: {EngineerCount} engineers, {StatusCount} statuses", 
                    engineerData.Count, statusData.Count);

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

                // Add hardcoded engineers
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

        private static string GetSafeSortColumn(string sortColumn)
        {
            var allowedColumns = new[] { "RowID", "JobNumber", "AssignedEngineer", "Status", "Location", "WorkType", "ProjectedDate", "CreatedOn" };
            return allowedColumns.Contains(sortColumn, StringComparer.OrdinalIgnoreCase) ? sortColumn : "ProjectedDate";
        }

        private static string GetSafeSortDirection(string sortDirection)
        {
            return sortDirection?.ToUpper() == "ASC" ? "ASC" : "DESC";
        }

        private static string GetSafeStringValue(IDictionary<string, object> row, string columnName)
        {
            if (row.TryGetValue(columnName, out var value) && value != null && value != DBNull.Value)
            {
                return value.ToString() ?? string.Empty;
            }
            return string.Empty;
        }

        private static DateTime? GetSafeDateTimeValue(IDictionary<string, object> row, string columnName)
        {
            if (row.TryGetValue(columnName, out var value) && value != null && value != DBNull.Value)
            {
                if (DateTime.TryParse(value.ToString(), out var dateValue))
                {
                    return dateValue;
                }
            }
            return null;
        }

        private static int GetSafeIntValue(IDictionary<string, object> row, string columnName)
        {
            if (row.TryGetValue(columnName, out var value) && value != null && value != DBNull.Value)
            {
                if (int.TryParse(value.ToString(), out var intValue))
                {
                    return intValue;
                }
            }
            return 0;
        }

        private static bool GetSafeBoolValue(IDictionary<string, object> row, string columnName)
        {
            if (row.TryGetValue(columnName, out var value) && value != null && value != DBNull.Value)
            {
                if (bool.TryParse(value.ToString(), out var boolValue))
                {
                    return boolValue;
                }
                // Handle bit fields (0/1)
                if (int.TryParse(value.ToString(), out var intValue))
                {
                    return intValue != 0;
                }
            }
            return false;
        }
    }
}