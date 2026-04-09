using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    /// <summary>
    /// Interface for Past Due Graph repository operations
    /// </summary>
    public interface IPastDueGraphRepository
    {
        /// <summary>
        /// Get filtered past due job details based on Account Manager and category
        /// </summary>
        /// <param name="accountManager">Account Manager to filter by (optional)</param>
        /// <param name="category">Category filter: "PastDue" or "Billable" (optional)</param>
        /// <returns>Filtered list of past due job details</returns>
        Task<List<PastDueJobDetailDto>> GetFilteredPastDueJobsDetailAsync(string? accountManager, string? category);

        /// <summary>
        /// Gets comprehensive past due jobs information and analytics
        /// </summary>
        /// <returns>Complete past due jobs data with analytics</returns>
        Task<PastDueGraphResponseDto> GetPastDueJobsInfoAsync();
    }

    /// <summary>
    /// Repository implementation for Past Due Graph operations using PDueUnscheduledJobsInfo stored procedure
    /// </summary>  
    public class PastDueGraphRepository : IPastDueGraphRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;
        private readonly ErrorLogRepository _errorLog;
        private readonly ILogger<PastDueGraphRepository> _logger;

        private const string LoggerName = "Technicians.PastDueGraphRepository";
        private const int CACHE_EXPIRY_MINUTES = 15;

        public PastDueGraphRepository(
            IConfiguration configuration,
            ErrorLogRepository errorLog,
            ILogger<PastDueGraphRepository> logger)
        {
            _configuration = configuration;
            _connectionString = configuration.GetConnectionString("ETechGreatPlainsConnString")
                ?? throw new InvalidOperationException("ETechGreatPlainsConnString not found");
            _errorLog = errorLog;
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<PastDueGraphResponseDto> GetPastDueJobsInfoAsync()
        {
            try
            {
                _logger.LogInformation("Getting past due jobs information and analytics");

                using var connection = new SqlConnection(_connectionString);
                using var multi = await connection.QueryMultipleAsync(
                    "PDueUnscheduledJobsInfo",
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 120
                );

                var response = new PastDueGraphResponseDto
                {
                    Success = true,
                    GeneratedAt = DateTime.UtcNow
                };

                // Read result sets in order as per the stored procedure execution:

                // 1. Call Status details (from: select * from @CallStatus order by AccMgr,ChangeAge)
                response.CallStatus = (await multi.ReadAsync<PastDueCallStatusDto>()).ToList();

                // 2. Past Due Jobs Summary (from: select offname as AccMgr,PastDueJobs,Couldbebilled from @PDueJobs)
                response.PastDueJobsSummary = (await multi.ReadAsync<PastDueJobsSummaryDto>()).ToList();

                // 3. Scheduled Percentages (from: select offid,count as 'Scheduled %' from @SchedPerc)
                response.ScheduledPercentages = (await multi.ReadAsync<ScheduledPercentageDto>()).ToList();

                // 4. Total Unscheduled Jobs (from: select offid, count as TotalJobs from @TotalUnschedJobs)
                response.TotalUnscheduledJobs = (await multi.ReadAsync<TotalJobsDto>()).ToList();

                // 5. Total Scheduled Jobs (from: select offid, count as TotalJobs from @TotalScheduledJobs)
                response.TotalScheduledJobs = (await multi.ReadAsync<TotalJobsDto>()).ToList();

                _logger.LogInformation("Successfully retrieved past due jobs data - CallStatus: {CallStatusCount}, PastDueJobs: {PastDueCount}, ScheduledPercentages: {ScheduledCount}", 
                    response.CallStatus.Count, response.PastDueJobsSummary.Count, response.ScheduledPercentages.Count);

                return response;
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "GetPastDueJobsInfoAsync");
                _logger.LogError(sqlEx, "SQL error getting past due jobs information: {SqlState} {ErrorNumber}", sqlEx.State, sqlEx.Number);
                return new PastDueGraphResponseDto
                {
                    Success = false,
                    Message = $"Database error retrieving past due jobs information: {sqlEx.Message}",
                    GeneratedAt = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetPastDueJobsInfoAsync");
                _logger.LogError(ex, "Error getting past due jobs information");
                return new PastDueGraphResponseDto
                {
                    Success = false,
                    Message = $"Error retrieving past due jobs information: {ex.Message}",
                    GeneratedAt = DateTime.UtcNow
                };
            }
        }

        /// <summary>
        /// Get filtered past due job details based on Account Manager and category
        /// </summary>
        /// <param name="accountManager">Account Manager to filter by (optional)</param>
        /// <param name="category">Category filter: "PastDue" or "Billable" (optional)</param>
        /// <returns>Filtered list of past due job details</returns>
        public async Task<List<PastDueJobDetailDto>> GetFilteredPastDueJobsDetailAsync(string? accountManager, string? category)
        {
            using var connection = new SqlConnection(_connectionString);

            var command = new SqlCommand("PDueUnscheduledJobsInfo", connection)
            {
                CommandType = CommandType.StoredProcedure,
                CommandTimeout = 120
            };

            await connection.OpenAsync();
            using var reader = await command.ExecuteReaderAsync();

            var result = new List<PastDueJobDetailDto>();

            while (await reader.ReadAsync())
            {
                var accMgr = GetSafeString(reader, "AccMgr");
                var description = GetSafeString(reader, "Description", "description").Trim();


                // ?? FILTER EARLY (performance fix)
                if (!string.IsNullOrWhiteSpace(accountManager) &&
                    !string.Equals(accMgr?.Trim(), accountManager.Trim(), StringComparison.OrdinalIgnoreCase))
                    continue;

                if (!string.IsNullOrWhiteSpace(category))
                {
                    if (category.Equals("Billable", StringComparison.OrdinalIgnoreCase) &&
                        !string.Equals(description?.Trim(), "Could be billed", StringComparison.OrdinalIgnoreCase))
                        continue;

                    if (category.Equals("PastDue", StringComparison.OrdinalIgnoreCase) &&
                        string.Equals(description?.Trim(), "Could be billed", StringComparison.OrdinalIgnoreCase))
                        continue;
                }

                // ? MAP ONLY FILTERED ROWS
                var job = new PastDueJobDetailDto
                {
                    CallNbr = GetSafeString(reader, "callnbr"),
                    CustName = GetSafeString(reader, "custname"),
                    CustNmbr = GetSafeString(reader, "custnmbr"),
                    AccMgr = accMgr,
                    JobStatus = GetSafeString(reader, "jobstatus"),
                    TechName = GetSafeString(reader, "TechName"),
                    CustClas = GetSafeString(reader, "custclas"),

                    // ?? FIXED COLUMN NAME
                    ContNbr = GetSafeString(reader, "Contract No", "contnbr"),

                    Description = description,

                    ScheduledStart = GetSafeDateTimeFromString(reader, "scheduledstart"),
                    ScheduledEnd = GetSafeDateTimeFromString(reader, "scheduledend"),

                    ChangeAge = GetSafeInt(reader, "ChangeAge"),
                    OrigAge = GetSafeInt(reader, "OrigAge")
                };

                result.Add(job);
            }

            return result
                .OrderBy(x => x.AccMgr)
                .ThenByDescending(x => x.ChangeAge)
                .ToList();
        }

        // Helper methods for safe column access
        private string GetSafeString(SqlDataReader reader, params string[] columnNames)
        {
            foreach (var columnName in columnNames)
            {
                try
                {
                    var ordinal = reader.GetOrdinal(columnName);

                    if (reader.IsDBNull(ordinal))
                        return string.Empty;

                    var value = reader.GetValue(ordinal);

                    return value?.ToString()?.Trim() ?? string.Empty;
                }
                catch
                {
                    continue;
                }
            }

            return string.Empty;
        }

        private DateTime GetSafeDateTime(SqlDataReader reader, params string[] columnNames)
        {
            foreach (var columnName in columnNames)
            {
                try
                {
                    var ordinal = reader.GetOrdinal(columnName);
                    return reader.IsDBNull(ordinal) ? DateTime.MinValue : reader.GetDateTime(ordinal);
                }
                catch (IndexOutOfRangeException)
                {
                    continue; // Try next column name
                }
                catch (Exception)
                {
                    continue; // Try next column name
                }
            }
            return DateTime.MinValue;
        }

        // New method to handle date strings from the stored procedure
        private DateTime GetSafeDateTimeFromString(SqlDataReader reader, params string[] columnNames)
        {
            foreach (var columnName in columnNames)
            {
                try
                {
                    var ordinal = reader.GetOrdinal(columnName);

                    if (reader.IsDBNull(ordinal))
                        return DateTime.MinValue;

                    var value = reader.GetValue(ordinal);

                    // ?? Handle both string AND datetime
                    if (value is DateTime dt)
                        return dt;

                    if (value is string str && !string.IsNullOrWhiteSpace(str))
                    {
                        if (DateTime.TryParse(str, out var parsed))
                            return parsed;
                    }
                }
                catch
                {
                    continue;
                }
            }

            return DateTime.MinValue;
        }

        private int GetSafeInt(SqlDataReader reader, params string[] columnNames)
        {
            foreach (var columnName in columnNames)
            {
                try
                {
                    var ordinal = reader.GetOrdinal(columnName);
                    return reader.IsDBNull(ordinal) ? 0 : reader.GetInt32(ordinal);
                }
                catch (IndexOutOfRangeException)
                {
                    continue; // Try next column name
                }
                catch (Exception)
                {
                    continue; // Try next column name
                }
            }
            return 0;
        }
    }
}

