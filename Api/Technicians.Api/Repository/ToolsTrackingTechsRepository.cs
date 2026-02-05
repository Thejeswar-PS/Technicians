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

        /// <summary>
        /// Gets tech tools misc kit data by tech ID using the GetTechToolsMiscKitByTechID stored procedure
        /// </summary>
        /// <param name="techId">Tech ID to retrieve misc kit data for</param>
        //public async Task<TechToolsMiscKitResultDto> GetTechToolsMiscKitByTechIdAsync(string techId)
        //{
        //    try
        //    {
        //        using var connection = new SqlConnection(_connectionString);
        //        await connection.OpenAsync();

        //        using var multi = await connection.QueryMultipleAsync(
        //            "GetTechToolsMiscKitByTechID",
        //            new { TechID = techId },
        //            commandType: CommandType.StoredProcedure);

        //        // Read first result set - tool kit data
        //        var toolKitData = (await multi.ReadAsync<TechToolsMiscKitDto>()).ToList();

        //        // Read second result set - tech info data
        //        var techInfo = await multi.ReadFirstOrDefaultAsync<TechsInfoDto>() 
        //            ?? new TechsInfoDto();

        //        return new TechToolsMiscKitResultDto
        //        {
        //            ToolKitData = toolKitData,
        //            TechInfo = techInfo
        //        };
        //    }
        //    catch (SqlException sqlEx)
        //    {
        //        throw new Exception($"Database error retrieving tech tools misc kit data for tech ID '{techId}': {sqlEx.Message}", sqlEx);
        //    }
        //    catch (Exception ex)
        //    {
        //        throw new Exception($"Error retrieving tech tools misc kit data for tech ID '{techId}': {ex.Message}", ex);
        //    }
        //}

        /// <summary>
        /// Gets tools tracking count by tech ID using the GetToolsTrackingCount stored procedure
        /// </summary>
        /// <param name="techId">Tech ID to get count for</param>
        public async Task<int> GetToolsTrackingCountAsync(string techId)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var count = await connection.QuerySingleAsync<int>(
                    "GetToolsTrackingCount",
                    new { TechID = techId },
                    commandType: CommandType.StoredProcedure);

                return count;
            }
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error retrieving tools tracking count for tech ID '{techId}': {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving tools tracking count for tech ID '{techId}': {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Executes insert tech tools query using the ExecuteInsertTechToolsQuery stored procedure
        /// </summary>
        /// <param name="query">SQL query to execute</param>
        public async Task<ExecuteInsertTechToolsQueryResultDto> ExecuteInsertTechToolsQueryAsync(string query)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@Query", query);
                parameters.Add("@ReturnValue", dbType: DbType.Int32, direction: ParameterDirection.ReturnValue);

                await connection.ExecuteAsync(
                    "ExecuteInsertTechToolsQuery",
                    parameters,
                    commandType: CommandType.StoredProcedure);

                var returnValue = parameters.Get<int>("@ReturnValue");

                return new ExecuteInsertTechToolsQueryResultDto
                {
                    Success = returnValue == 1,
                    ReturnValue = returnValue,
                    Message = returnValue == 1 ? "Query executed successfully" : "Query execution failed"
                };
            }
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error executing insert tech tools query: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error executing insert tech tools query: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Deletes tools tracking data by tech ID using the DeleteToolsTracking stored procedure
        /// </summary>
        /// <param name="techId">Tech ID to delete tracking data for</param>
        public async Task<DeleteToolsTrackingResultDto> DeleteToolsTrackingAsync(string techId)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var rowsAffected = await connection.ExecuteAsync(
                    "DeleteToolsTracking",
                    new { TechID = techId },
                    commandType: CommandType.StoredProcedure);

                return new DeleteToolsTrackingResultDto
                {
                    RowsAffected = rowsAffected,
                    Success = rowsAffected > 0,
                    Message = rowsAffected > 0 
                        ? $"Successfully deleted {rowsAffected} tools tracking record(s) for tech ID '{techId}'"
                        : $"No tools tracking records found for tech ID '{techId}'"
                };
            }
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error deleting tools tracking data for tech ID '{techId}': {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error deleting tools tracking data for tech ID '{techId}': {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets tech tools tracking data by tech ID using the GetTechToolsTrackingByTechID stored procedure
        /// </summary>
        /// <param name="techId">Tech ID to retrieve tracking data for</param>
        public async Task<List<TechToolsTrackingDto>> GetTechToolsTrackingByTechIdAsync(string techId)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var toolsTrackingData = await connection.QueryAsync<TechToolsTrackingDto>(
                    "GetTechToolsTrackingByTechID",
                    new { TechID = techId },
                    commandType: CommandType.StoredProcedure);

                return toolsTrackingData.ToList();
            }
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error retrieving tech tools tracking data for tech ID '{techId}': {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving tech tools tracking data for tech ID '{techId}': {ex.Message}", ex);
            }
        }
    }
}