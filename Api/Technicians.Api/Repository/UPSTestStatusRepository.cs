using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class UPSTestStatusRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;
        private readonly ErrorLogRepository _errorLog;
        private readonly ILogger<UPSTestStatusRepository> _logger;

        private const string LoggerName = "Technicians.UPSTestStatusRepository";

        public UPSTestStatusRepository(
            IConfiguration configuration,
            ErrorLogRepository errorLog,
            ILogger<UPSTestStatusRepository> logger)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection") ??
                throw new InvalidOperationException("DefaultConnection string not found in configuration");
            _errorLog = errorLog;
            _logger = logger;
        }

        /// <summary>
        /// Main method - handles all filtering scenarios
        /// </summary>
        public async Task<UPSTestStatusResponse> GetNewUPSTestStatusAsync(UPSTestStatusRequest request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@AssignedTo", request.AssignedTo ?? "All", DbType.AnsiString, size: 25);
                parameters.Add("@Status", request.Status ?? "All", DbType.AnsiStringFixedLength, size: 5);
                parameters.Add("@Priority", request.Priority ?? "All", DbType.AnsiStringFixedLength, size: 15);
                parameters.Add("@Archive", request.Archive, DbType.Boolean);

                using var multi = await connection.QueryMultipleAsync("GetNewUPSTestStatus", parameters, commandType: CommandType.StoredProcedure);

                var response = new UPSTestStatusResponse();

                try
                {
                    // First result set: UPS test units data
                    response.UnitsData = (await multi.ReadAsync<UPSTestStatusDto>()).ToList();

                    // Second result set: Make counts 
                    if (!multi.IsConsumed)
                    {
                        response.MakeCounts = (await multi.ReadAsync<MakeCountDto>()).ToList();
                    }
                }
                catch (Exception ex)
                {
                    await _errorLog.LogErrorAsync(LoggerName, ex, "GetNewUPSTestStatusAsync", "Result mapping error");
                    _logger.LogError(ex, "Error mapping result set for UPS test status");
                    throw new Exception($"Error mapping result set: {ex.Message}. This may be due to column type mismatches.", ex);
                }

                _logger.LogInformation("Successfully retrieved UPS test status data - Units: {UnitsCount}, Makes: {MakesCount}", 
                    response.UnitsData.Count, response.MakeCounts.Count);
                return response;
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "GetNewUPSTestStatusAsync", $"{request.AssignedTo}|{request.Status}|{request.Priority}");
                _logger.LogError(sqlEx, "SQL error retrieving UPS test status");
                throw new Exception($"Database error retrieving UPS test status: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetNewUPSTestStatusAsync", $"{request.AssignedTo}|{request.Status}|{request.Priority}");
                _logger.LogError(ex, "Error retrieving UPS test status");
                throw new Exception($"Error retrieving UPS test status: {ex.Message}", ex);
            }
        }

        public async Task<IEnumerable<string>> GetAssignedTechniciansAsync()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                const string query = @"
                    SELECT DISTINCT RTRIM(AssignedTo) AS AssignedTo 
                    FROM dbo.UPSTestUnits 
                    WHERE AssignedTo IS NOT NULL AND AssignedTo <> '' AND AssignedTo <> 'NULL'
                    UNION
                    SELECT DISTINCT RTRIM(AssignedTo) AS AssignedTo 
                    FROM DCGETechArchive.dbo.UPSTestUnits 
                    WHERE AssignedTo IS NOT NULL AND AssignedTo <> '' AND AssignedTo <> 'NULL'
                    ORDER BY AssignedTo";

                var result = await connection.QueryAsync<string>(query);
                _logger.LogInformation("Retrieved {Count} assigned technicians", result.Count());
                return result;
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetAssignedTechniciansAsync");
                _logger.LogError(ex, "Error retrieving assigned technicians");
                throw new Exception($"Error retrieving assigned technicians: {ex.Message}", ex);
            }
        }

        public async Task<IEnumerable<MakeCountDto>> GetUPSTestMakeCountsAsync(bool archive = false)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var query = @"
                    SELECT Make, COUNT(*) as MakeCount 
                    FROM dbo.UPSTestUnits 
                    WHERE Archive = @Archive AND Make <> 'NULL' 
                    GROUP BY Make 
                    HAVING Make <> 'NULL'
                    UNION
                    SELECT Make, COUNT(*) as MakeCount 
                    FROM DCGETechArchive.dbo.UPSTestUnits 
                    WHERE Archive = @Archive AND Make <> 'NULL' 
                    GROUP BY Make 
                    HAVING Make <> 'NULL'";

                return await connection.QueryAsync<MakeCountDto>(query, new { Archive = archive });
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving UPS test make counts: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Maps status names to database codes for New Units Test Status specifically
        /// Only supports statuses available in the New Units Test Status page
        /// </summary>
        public string MapStatusToCode(string status)
        {
            if (string.IsNullOrEmpty(status))
                return "All";

            return status.ToUpper().Trim() switch
            {
                // New Units Test Status specific mappings
                "ALL" => "All",
                "INP" => "INP",
                "NCR" => "NCR", 
                "MPJ" => "MPJ",
                
                // Legacy friendly mappings for New Units Test Status
                "IN PROGRESS" => "INP",
                "NEEDS COMPONENTS FOR REPAIR" => "NCR",
                "MISSING PARTS FROM JOB" => "MPJ",
                "MISSING" => "MPJ", // Legacy mapping
                
                // Return as-is if already correct
                _ => status.ToUpper()
            };
        }

        /// <summary>
        /// Validates request for New Units Test Status specifically
        /// </summary>
        public List<string> ValidateRequest(UPSTestStatusRequest request)
        {
            var errors = new List<string>();

            if (request == null)
            {
                errors.Add("Request cannot be null");
                return errors;
            }

            if (!string.IsNullOrWhiteSpace(request.Status) && request.Status != "All")
            {
                // Only valid status codes for New Units Test Status
                var validStatuses = new[] { 
                    "All", "INP", "NCR", "MPJ", // Database codes
                    "In Progress", "Needs Components for Repair", "Missing Parts from Job", "Missing" // Legacy names
                };
                
                if (!validStatuses.Contains(request.Status, StringComparer.OrdinalIgnoreCase))
                {
                    errors.Add($"Invalid status for New Units Test Status. Valid values are: All, INP, NCR, MPJ, or Missing");
                }
            }

            return errors;
        }

        /// <summary>
        /// Updates status summary query to handle New Units Test Status codes
        /// </summary>
        public async Task<Dictionary<string, int>> GetStatusSummaryAsync(string assignedTo = "All", bool archive = false)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var whereClause = archive ? "WHERE Archive = 1" : "WHERE Archive = 0";
                if (!string.IsNullOrEmpty(assignedTo) && assignedTo != "All")
                {
                    whereClause += " AND AssignedTo LIKE @AssignedTo + '%'";
                }

                var query = $@"
                    SELECT 
                        Status as OriginalStatus,
                        CASE 
                            WHEN Status IS NULL THEN 'Unknown'
                            WHEN RTRIM(Status) = '' THEN 'Unknown'
                            -- New Units Test Status specific mappings
                            WHEN Status = 'INP' THEN 'In Progress'
                            WHEN Status = 'NCR' THEN 'Needs Components for Repair'
                            WHEN Status = 'MPJ' THEN 'Missing Parts from Job'
                            -- Handle legacy stored procedure mappings if they exist
                            WHEN Status = 'Inp' THEN 'In Progress'
                            WHEN Status = 'Nos' THEN 'Not Started'
                            WHEN Status = 'Def' THEN 'Deferred'
                            WHEN Status = 'Com' THEN 'Completed'
                            ELSE ISNULL(RTRIM(Status), 'Unknown')
                        END AS StatusName,
                        COUNT(*) AS Count
                    FROM (
                        SELECT ISNULL(Status, 'Unknown') as Status FROM dbo.UPSTestUnits {whereClause}
                        UNION ALL
                        SELECT ISNULL(Status, 'Unknown') as Status FROM DCGETechArchive.dbo.UPSTestUnits {whereClause}
                    ) AS CombinedStatus
                    GROUP BY Status
                    ORDER BY StatusName";

                var results = await connection.QueryAsync(query, new { AssignedTo = assignedTo });
                
                var statusSummary = new Dictionary<string, int>();
                foreach (var result in results)
                {
                    string statusName = result.StatusName?.ToString() ?? "Unknown";
                    int count = Convert.ToInt32(result.Count);
                    
                    if (statusSummary.ContainsKey(statusName))
                    {
                        statusSummary[statusName] += count;
                    }
                    else
                    {
                        statusSummary[statusName] = count;
                    }
                }

                return statusSummary;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving status summary: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Maps database status codes back to display names
        /// </summary>
        public string MapStatusFromCode(string statusCode)
        {
            if (string.IsNullOrEmpty(statusCode))
                return "All";

            return statusCode.ToUpper().Trim() switch
            {
                "NOS" => "Not Started",
                "INP" => "In Progress",
                "DEF" => "Deferred", 
                "COM" => "Completed",
                "NCR" => "Needs Components for Repair",
                "MPJ" => "Missing Parts from Job",
                "ALL" => "All",
                _ => statusCode
            };
        }
    }
}