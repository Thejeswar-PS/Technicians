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

        public UPSTestStatusRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection") ??
                throw new InvalidOperationException("DefaultConnection string not found in configuration");
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
                    throw new Exception($"Error mapping result set: {ex.Message}. This may be due to column type mismatches.", ex);
                }

                return response;
            }
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error retrieving UPS test status: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
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

                return await connection.QueryAsync<string>(query);
            }
            catch (Exception ex)
            {
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
                            WHEN Status = 'Nos' THEN 'Not Started'
                            WHEN Status = 'Inp' THEN 'In Progress'
                            WHEN Status = 'Def' THEN 'Deferred'
                            WHEN Status = 'Com' THEN 'Completed'
                            WHEN Status = 'NCR' THEN 'Needs Components for Repair'
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
                    // Additional null check and fallback
                    string statusName = result.StatusName?.ToString() ?? "Unknown";
                    int count = Convert.ToInt32(result.Count);
                    
                    // Handle potential duplicate keys (shouldn't happen but just in case)
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

        public string MapStatusToCode(string status)
        {
            if (string.IsNullOrEmpty(status))
                return "All";

            return status.ToLower().Trim() switch
            {
                "not started" => "Nos",
                "in progress" => "Inp",
                "deferred" or "deffered" => "Def",
                "completed" => "Com",
                "needs components for repair" or "needs componets for repair" => "NCR",
                _ => status
            };
        }

        public string MapPriorityToCode(string priority)
        {
            if (string.IsNullOrEmpty(priority))
                return "All";

            return priority.ToLower().Trim() switch
            {
                "at convenience" => "Atc",
                _ => priority
            };
        }

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
                var validStatuses = new[] { "Nos", "Inp", "Def", "Com", "NCR", "All" };
                if (!validStatuses.Contains(request.Status, StringComparer.OrdinalIgnoreCase))
                {
                    errors.Add("Invalid status. Valid values are: Nos, Inp, Def, Com, NCR, or All");
                }
            }

            return errors;
        }
    }
}