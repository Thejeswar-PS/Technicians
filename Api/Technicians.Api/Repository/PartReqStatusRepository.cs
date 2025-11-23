using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class PartReqStatusRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;
        private readonly string _gpConnectionString;

        public PartReqStatusRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
            _gpConnectionString = _configuration.GetConnectionString("ETechGreatPlainsConnString");
        }

        /// <summary>
        /// Creates and returns a new SQL connection to the Great Plains database
        /// </summary>
        /// <returns>SqlConnection to GP database</returns>
        public SqlConnection GetGPSqlConn()
        {
            try
            {
                if (string.IsNullOrEmpty(_gpConnectionString))
                {
                    throw new InvalidOperationException("ETechGreatPlainsConnString is not configured in appsettings.json");
                }

                return new SqlConnection(_gpConnectionString);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error while creating GP database connection: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Get inventory user names for dropdown binding
        /// </summary>
        /// <returns>List of inventory users with ID and username</returns>
        public async Task<List<InventoryUserDto>> GetInventoryUserNamesAsync()
        {
            var users = new List<InventoryUserDto>();

            try
            {
                using var connection = GetGPSqlConn();
                await connection.OpenAsync();

                const string query = @"
                    SELECT DISTINCT 
                        RTRIM(a.InvUserID) AS InvUserID,
                        RTRIM(b.username) AS Username
                    FROM aaOfficeIDStateAssignments a 
                    JOIN dynamics.dbo.sy01400 b ON a.InvUserID = b.userid";

                using var command = new SqlCommand(query, connection);
                using var reader = await command.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    users.Add(new InventoryUserDto
                    {
                        InvUserID = reader["InvUserID"]?.ToString(),
                        Username = reader["Username"]?.ToString()
                    });
                }

                // Add "All" option
                users.Add(new InventoryUserDto { InvUserID = "All", Username = "All" });
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving inventory user names: {ex.Message}", ex);
            }

            return users;
        }

        public async Task<PartReqStatusResponseDto> GetPartReqStatusAsync(PartReqStatusRequestDto request)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var parameters = new DynamicParameters();
            parameters.Add("@Key", request.Key, DbType.Int32);
            parameters.Add("@InvUserID", string.IsNullOrEmpty(request.InvUserID) ? "All" : request.InvUserID, DbType.String);
            parameters.Add("@OffName", string.IsNullOrEmpty(request.OffName) ? "All" : request.OffName, DbType.String);

            using var multi = await connection.QueryMultipleAsync(
                "PartReqStatus",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            var response = new PartReqStatusResponseDto();

            // Read the first result set (part requests)
            var partRequests = await multi.ReadAsync<PartReqStatusDto>();
            response.PartRequests = partRequests.ToList();

            // Read the crash kit count
            var crashKitResult = await multi.ReadSingleOrDefaultAsync<dynamic>();
            response.CrashKitCount = crashKitResult?.CrashKit ?? 0;

            // Read the load bank count
            var loadBankResult = await multi.ReadSingleOrDefaultAsync<dynamic>();
            response.LoadBankCount = loadBankResult?.LoadBank ?? 0;

            return response;
        }

        public async Task<List<PartReqStatusDto>> GetPartReqStatusListAsync(int key, string invUserID = "All", string offName = "All")
        {
            using var connection = new SqlConnection(_connectionString);
            
            var parameters = new DynamicParameters();
            parameters.Add("@Key", key, DbType.Int32);
            parameters.Add("@InvUserID", invUserID, DbType.String);
            parameters.Add("@OffName", offName, DbType.String);

            using var multi = await connection.QueryMultipleAsync(
                "PartReqStatus",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            // Read only the first result set (part requests)
            var partRequests = await multi.ReadAsync<PartReqStatusDto>();
            return partRequests.ToList();
        }

        public async Task<Dictionary<string, int>> GetPartCountsAsync(string invUserID = "All")
        {
            using var connection = new SqlConnection(_connectionString);
            
            var parameters = new DynamicParameters();
            parameters.Add("@Key", 0, DbType.Int32); // Use key 0 to get main results
            parameters.Add("@InvUserID", invUserID, DbType.String);
            parameters.Add("@OffName", "All", DbType.String);

            using var multi = await connection.QueryMultipleAsync(
                "PartReqStatus",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            // Skip the main result set
            await multi.ReadAsync<PartReqStatusDto>();

            var counts = new Dictionary<string, int>();

            // Read crash kit count
            var crashKitResult = await multi.ReadSingleOrDefaultAsync<dynamic>();
            counts["CrashKit"] = crashKitResult?.CrashKit ?? 0;

            // Read load bank count
            var loadBankResult = await multi.ReadSingleOrDefaultAsync<dynamic>();
            counts["LoadBank"] = loadBankResult?.LoadBank ?? 0;

            return counts;
        }

        /// <summary>
        /// Get employee status for job list based on AD User ID
        /// </summary>
        public async Task<EmployeeStatusDto> GetEmployeeStatusForJobListAsync(string adUserID)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var parameters = new DynamicParameters();
            parameters.Add("@ADUserID", adUserID, DbType.String);

            var result = await connection.QuerySingleOrDefaultAsync<EmployeeStatusDto>(
                "GetEmployeeStatusForJobList",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return result ?? new EmployeeStatusDto();
        }

        /// <summary>
        /// Get parts received by warehouse staff for a given year
        /// </summary>
        public async Task<PartsReceivedByWHResponseDto> GetPartsReceivedByWHAsync(int year)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var parameters = new DynamicParameters();
            parameters.Add("@Year", year, DbType.Int32);

            using var multi = await connection.QueryMultipleAsync(
                "DisplayPartsReceivedByWH",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            var response = new PartsReceivedByWHResponseDto();

            // Read the first result set (warehouse staff data)
            var staffData = await multi.ReadAsync<PartsReceivedByWHDto>();
            response.StaffData = staffData.ToList();

            // Read the second result set (summary totals)
            var summary = await multi.ReadSingleOrDefaultAsync<PartsReceivedByWHSummaryDto>();
            response.Summary = summary ?? new PartsReceivedByWHSummaryDto();

            return response;
        }

        /// <summary>
        /// Get parts to be received by warehouse staff for a given year
        /// </summary>
        public async Task<PartsTobeReceivedByWHResponseDto> GetPartsTobeReceivedByWHAsync(int year)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var parameters = new DynamicParameters();
            parameters.Add("@year", year, DbType.Int32);

            using var multi = await connection.QueryMultipleAsync(
                "DisplayPartsTobeReceivedbyWH",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            var response = new PartsTobeReceivedByWHResponseDto();

            // Read the first result set (warehouse staff data)
            var staffData = await multi.ReadAsync<PartsTobeReceivedByWHDto>();
            response.StaffData = staffData.ToList();

            // Read the second result set (summary totals)
            var summary = await multi.ReadSingleOrDefaultAsync<PartsTobeReceivedByWHSummaryDto>();
            response.Summary = summary ?? new PartsTobeReceivedByWHSummaryDto();

            return response;
        }

        /// <summary>
        /// Get weekly parts returned count data
        /// </summary>
        /// <returns>Weekly data with unused and faulty parts returned</returns>
        public async Task<WeeklyPartsReturnedResponseDto> GetWeeklyPartsReturnedCountAsync()
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var weeklyData = await connection.QueryAsync<WeeklyPartsReturnedDto>(
                "GetWeeklyPartsReturnedCount",
                commandType: CommandType.StoredProcedure
            );

            var response = new WeeklyPartsReturnedResponseDto
            {
                WeeklyData = weeklyData.ToList()
            };

            return response;
        }

        /// <summary>
        /// Get part return status data based on key, source, user ID and year
        /// </summary>
        public async Task<PartReturnStatusResponseDto> GetPartReturnStatusAsync(PartReturnStatusRequestDto request)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var parameters = new DynamicParameters();
            parameters.Add("@Key", request.Key, DbType.Int32);
            parameters.Add("@Source", request.Source ?? "Web", DbType.String);
            parameters.Add("@InvUserID", string.IsNullOrEmpty(request.InvUserID) ? "All" : request.InvUserID, DbType.String);
            parameters.Add("@Year", request.Year, DbType.Int32);

            var parts = await connection.QueryAsync<PartReturnStatusDto>(
                "PartReturnStatus",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            var response = new PartReturnStatusResponseDto
            {
                Parts = parts.ToList(),
                TotalCount = parts.Count(),
                RequestedKey = request.Key.ToString(),
                Source = request.Source ?? "Web"
            };

            return response;
        }

        /// <summary>
        /// Get part return status list only (without wrapper)
        /// </summary>
        public async Task<List<PartReturnStatusDto>> GetPartReturnStatusListAsync(int key, string source = "Web", string invUserID = "All", int year = 0)
        {
            if (year == 0) year = DateTime.Now.Year;

            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var parameters = new DynamicParameters();
            parameters.Add("@Key", key, DbType.Int32);
            parameters.Add("@Source", source, DbType.String);
            parameters.Add("@InvUserID", invUserID, DbType.String);
            parameters.Add("@Year", year, DbType.Int32);

            var parts = await connection.QueryAsync<PartReturnStatusDto>(
                "PartReturnStatus",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return parts.ToList();
        }

        /// <summary>
        /// Get part return status for graph/chart data
        /// </summary>
        public async Task<List<PartReturnStatusDto>> GetPartReturnStatusForGraphAsync(string invUserID = "All", int year = 0)
        {
            if (year == 0) year = DateTime.Now.Year;

            var request = new PartReturnStatusRequestDto
            {
                Key = 0, // Key doesn't matter for graph source
                Source = "Graph",
                InvUserID = invUserID,
                Year = year
            };

            var response = await GetPartReturnStatusAsync(request);
            return response.Parts;
        }

        /// <summary>
        /// Get parts return data by week number for the current year
        /// </summary>
        public async Task<PartsReturnDataByWeekResponseDto> GetPartsReturnDataByWeekAsync(int weekNo)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var parameters = new DynamicParameters();
            parameters.Add("@WeekNo", weekNo, DbType.Int32);

            var partsReturnData = await connection.QueryAsync<PartsReturnDataByWeekDto>(
                "GetPartsReturnDataByWeekNo",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            var dataList = partsReturnData.ToList();

            // Calculate week start and end dates (same logic as in SP)
            var currentYear = DateTime.Now.Year;
            var yearStart = new DateTime(currentYear, 1, 1);
            var weekStart = yearStart.AddDays((weekNo - 1) * 7);
            var weekEnd = yearStart.AddDays(weekNo * 7).AddDays(-1);

            var response = new PartsReturnDataByWeekResponseDto
            {
                PartsReturnData = dataList,
                TotalCount = dataList.Count,
                WeekNo = weekNo,
                WeekStart = weekStart,
                WeekEnd = weekEnd,
                TotalUnusedSentBack = dataList.Sum(x => x.UnusedSentBack),
                TotalFaultySentBack = dataList.Sum(x => x.FaultySentBack)
            };

            return response;
        }

        /// <summary>
        /// Get parts return data by week number - list only (without wrapper)
        /// </summary>
        public async Task<List<PartsReturnDataByWeekDto>> GetPartsReturnDataByWeekListAsync(int weekNo)
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var parameters = new DynamicParameters();
            parameters.Add("@WeekNo", weekNo, DbType.Int32);

            var partsReturnData = await connection.QueryAsync<PartsReturnDataByWeekDto>(
                "GetPartsReturnDataByWeekNo",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return partsReturnData.ToList();
        }
    }
}