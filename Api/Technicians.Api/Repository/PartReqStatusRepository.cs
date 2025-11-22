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
    }
}