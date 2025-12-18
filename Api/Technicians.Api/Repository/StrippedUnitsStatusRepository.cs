using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class StrippedUnitsStatusRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public StrippedUnitsStatusRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection") ??
                throw new InvalidOperationException("DefaultConnection string not found in configuration");
        }

        /// <summary>
        /// Gets stripped units status data using the GetStrippedUnitsStatus stored procedure
        /// </summary>
        /// <param name="request">Filter parameters for the stored procedure</param>
        /// <returns>Complete response with units data and make counts</returns>
        public async Task<StrippedUnitsStatusResponse> GetStrippedUnitsStatusAsync(StrippedUnitsStatusRequest request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@Status", string.IsNullOrEmpty(request.Status) || request.Status == "All" ? "All" : request.Status, DbType.AnsiStringFixedLength, size: 5);
                parameters.Add("@RowIndex", request.RowIndex, DbType.Int32);

                // Execute stored procedure and get multiple result sets
                using var multi = await connection.QueryMultipleAsync("GetStrippedUnitsStatus", parameters, commandType: CommandType.StoredProcedure);

                var response = new StrippedUnitsStatusResponse();

                // First result set: Stripped units data
                response.UnitsData = (await multi.ReadAsync<StrippedUnitsStatusDto>()).ToList();

                // Second result set: Make counts (only if RowIndex is 0)
                if (request.RowIndex == 0)
                {
                    response.MakeCounts = (await multi.ReadAsync<MakeCountDto>()).ToList();
                }

                return response;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving stripped units status: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets stripped units status data with default parameters (All statuses, no specific RowIndex)
        /// </summary>
        /// <returns>Complete response with all units data and make counts</returns>
        public async Task<StrippedUnitsStatusResponse> GetStrippedUnitsStatusAsync()
        {
            var defaultRequest = new StrippedUnitsStatusRequest
            {
                Status = "All",
                RowIndex = 0
            };

            return await GetStrippedUnitsStatusAsync(defaultRequest);
        }

        /// <summary>
        /// Gets a specific stripped unit by RowIndex
        /// </summary>
        /// <param name="rowIndex">The specific RowIndex to retrieve</param>
        /// <returns>Single unit data response</returns>
        public async Task<StrippedUnitsStatusResponse> GetStrippedUnitByRowIndexAsync(int rowIndex)
        {
            var request = new StrippedUnitsStatusRequest
            {
                Status = "All",
                RowIndex = rowIndex
            };

            return await GetStrippedUnitsStatusAsync(request);
        }

        /// <summary>
        /// Gets stripped units filtered by status
        /// </summary>
        /// <param name="status">Status filter (Inp, Def, Com, Wos, or All)</param>
        /// <returns>Filtered units data with make counts</returns>
        public async Task<StrippedUnitsStatusResponse> GetStrippedUnitsByStatusAsync(string status)
        {
            var request = new StrippedUnitsStatusRequest
            {
                Status = status,
                RowIndex = 0
            };

            return await GetStrippedUnitsStatusAsync(request);
        }

        /// <summary>
        /// Gets only make counts for incomplete units (status not 'Com')
        /// </summary>
        /// <returns>List of make counts</returns>
        public async Task<IEnumerable<MakeCountDto>> GetMakeCountsAsync()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                const string query = @"
                    SELECT Make, COUNT(*) as MakeCount 
                    FROM dbo.StrippedUPSUnits 
                    WHERE Status <> 'Com' AND Make <> 'NULL' 
                    GROUP BY Make 
                    HAVING Make <> 'NULL'
                    UNION
                    SELECT Make, COUNT(*) as MakeCount 
                    FROM DCGETechArchive.dbo.StrippedUPSUnits 
                    WHERE Status <> 'Com' AND Make <> 'NULL' 
                    GROUP BY Make 
                    HAVING Make <> 'NULL'";

                var makeCounts = await connection.QueryAsync<MakeCountDto>(query);
                return makeCounts;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving make counts: {ex.Message}", ex);
            }
        }
    }
}