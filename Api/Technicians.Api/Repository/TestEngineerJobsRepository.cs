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

        public async Task<TestEngineerJobsChartsResponse> GetChartDataAsync(TestEngineerJobsRequestDto request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var sql = @"
                    SELECT AssignedEngineer, Status, COUNT(*) AS JobCount
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
                    GROUP BY AssignedEngineer, Status";

                var parameters = new DynamicParameters();
                parameters.Add("@Engineer", request.Engineer ?? string.Empty);
                parameters.Add("@Status", request.Status ?? string.Empty);
                parameters.Add("@Location", request.Location ?? string.Empty);
                parameters.Add("@Search", request.Search ?? string.Empty);

                var dynamicResults = await connection.QueryAsync(sql, parameters, commandTimeout: 30);

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

                // Add hardcoded engineer
                engineers.Add(new EngineerDto { EmpName = "Senthil Munuswamy" });

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
            var allowedColumns = new[] { "JobNumber", "AssignedEngineer", "Status", "Location", "WorkType", "ProjectedDate", "CreatedOn" };
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
    }
}