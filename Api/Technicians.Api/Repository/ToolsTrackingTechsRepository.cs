using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class ToolsTrackingTechsRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public ToolsTrackingTechsRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection") ??
                throw new InvalidOperationException("DefaultConnection string not found in configuration");
        }

        /// <summary>
        /// Gets tools tracking technicians data using the ToolsTrackingTechs stored procedure
        /// </summary>
        public async Task<List<ToolsTrackingTechsDto>> GetToolsTrackingTechsAsync()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var techsData = await connection.QueryAsync<ToolsTrackingTechsDto>(
                    "ToolsTrackingTechs",
                    commandType: CommandType.StoredProcedure);

                return techsData.ToList();
            }
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error retrieving tools tracking techs data: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving tools tracking techs data: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets tool serial numbers using the GetTechToolSerialNos stored procedure
        /// </summary>
        /// <param name="toolName">Tool name to filter by (use "All" for all tools)</param>
        public async Task<List<TechToolSerialNoDto>> GetTechToolSerialNosAsync(string toolName)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var serialNosData = await connection.QueryAsync<TechToolSerialNoDto>(
                    "GetTechToolSerialNos",
                    new { pToolName = toolName },
                    commandType: CommandType.StoredProcedure);

                return serialNosData.ToList();
            }
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error retrieving tool serial numbers for tool '{toolName}': {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving tool serial numbers for tool '{toolName}': {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets tools calendar tracking data using the aaToolsCalendar_Tracking stored procedure
        /// </summary>
        /// <param name="startDate">Start date for filtering</param>
        /// <param name="endDate">End date for filtering</param>
        /// <param name="toolName">Tool name to filter by (use "All" for all tools)</param>
        /// <param name="serialNo">Serial number to filter by (use "All" for all serial numbers)</param>
        /// <param name="techFilter">Tech filter (use "All" or "0" or "1" for all techs)</param>
        public async Task<ToolsCalendarTrackingResultDto> GetToolsCalendarTrackingAsync(
            DateTime startDate,
            DateTime endDate,
            string toolName = "All",
            string serialNo = "All",
            string techFilter = "All")
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                using var multi = await connection.QueryMultipleAsync(
                    "aaToolsCalendar_Tracking",
                    new
                    {
                        pStartDate = startDate,
                        pEndDate = endDate,
                        pToolName = toolName,
                        pSerialNo = serialNo,
                        pTechFilter = techFilter
                    },
                    commandType: CommandType.StoredProcedure);

                // Read first result set - tracking data
                var trackingData = (await multi.ReadAsync<ToolsCalendarTrackingDto>()).ToList();

                // Read second result set - due counts
                var dueCounts = await multi.ReadFirstOrDefaultAsync<ToolsCalendarDueCountsDto>() 
                    ?? new ToolsCalendarDueCountsDto();

                return new ToolsCalendarTrackingResultDto
                {
                    TrackingData = trackingData,
                    DueCounts = dueCounts
                };
            }
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error retrieving tools calendar tracking data: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving tools calendar tracking data: {ex.Message}", ex);
            }
        }
    }
}