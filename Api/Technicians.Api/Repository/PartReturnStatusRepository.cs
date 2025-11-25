using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class PartReturnStatusRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public PartReturnStatusRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("Connection string not found");
        }

        /// <summary>
        /// Get part return status data based on key, source, inventory user ID, and year
        /// </summary>
        /// <param name="request">Request containing filter parameters</param>
        /// <returns>List of part return status records</returns>
        public async Task<List<PartReturnStatusDto>> GetPartReturnStatusAsync(PartReturnStatusRequestDto request)
        {
            using var connection = new SqlConnection(_connectionString);
            
            // Ensure InvUserID is properly trimmed before sending to stored procedure
            var trimmedInvUserID = string.IsNullOrEmpty(request.InvUserID) ? "All" : request.InvUserID.Trim();
            
            var parameters = new DynamicParameters();
            parameters.Add("@Key", request.Key, DbType.Int32);
            parameters.Add("@Source", request.Source?.Trim() ?? "Web", DbType.String);
            parameters.Add("@InvUserID", trimmedInvUserID, DbType.String);
            parameters.Add("@Year", request.Year, DbType.Int32);

            var results = await connection.QueryAsync<PartReturnStatusDto>(
                "PartReturnStatus",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            // Also trim the InvUserID in the returned results to ensure consistency
            var resultList = results.ToList();
            foreach (var item in resultList)
            {
                if (!string.IsNullOrEmpty(item.InvUserID))
                {
                    item.InvUserID = item.InvUserID.Trim();
                }
                if (!string.IsNullOrEmpty(item.Technician))
                {
                    item.Technician = item.Technician.Trim();
                }
                if (!string.IsNullOrEmpty(item.Service_Call_ID))
                {
                    item.Service_Call_ID = item.Service_Call_ID.Trim();
                }
                if (!string.IsNullOrEmpty(item.Part_Num))
                {
                    item.Part_Num = item.Part_Num.Trim();
                }
                if (!string.IsNullOrEmpty(item.Dc_Part_Num))
                {
                    item.Dc_Part_Num = item.Dc_Part_Num.Trim();
                }
                if (!string.IsNullOrEmpty(item.Description))
                {
                    item.Description = item.Description.Trim();
                }
            }

            return resultList;
        }

        /// <summary>
        /// Get weekly parts returned count for chart display
        /// </summary>
        /// <returns>List of weekly parts returned count data</returns>
        public async Task<List<WeeklyPartsReturnedCountDto>> GetWeeklyPartsReturnedCountAsync()
        {
            using var connection = new SqlConnection(_connectionString);

            var results = await connection.QueryAsync<WeeklyPartsReturnedCountDto>(
                "GetWeeklyPartsReturnedCount",
                commandType: CommandType.StoredProcedure
            );

            var resultList = results.ToList();
            
            // Trim string properties if needed
            foreach (var item in resultList)
            {
                if (!string.IsNullOrEmpty(item.WkEnd))
                {
                    item.WkEnd = item.WkEnd.Trim();
                }
            }

            return resultList;
        }

        /// <summary>
        /// Get part return status for graph display
        /// </summary>
        /// <param name="invUserID">Inventory user ID filter</param>
        /// <param name="year">Year filter</param>
        /// <returns>List of part return status records for graph</returns>
        public async Task<List<PartReturnStatusDto>> GetPartReturnStatusForGraphAsync(string invUserID = "All", int? year = null)
        {
            var request = new PartReturnStatusRequestDto
            {
                Key = 0, // Not used for graph source
                Source = "Graph",
                InvUserID = invUserID?.Trim() ?? "All",
                Year = year ?? DateTime.Now.Year
            };

            return await GetPartReturnStatusAsync(request);
        }

        /// <summary>
        /// Get parts not yet received by warehouse
        /// </summary>
        /// <param name="invUserID">Inventory user ID filter</param>
        /// <param name="year">Year filter</param>
        /// <returns>List of parts not received</returns>
        public async Task<List<PartReturnStatusDto>> GetPartsNotReceivedAsync(string invUserID = "All", int? year = null)
        {
            var request = new PartReturnStatusRequestDto
            {
                Key = 0,
                Source = "Web",
                InvUserID = invUserID?.Trim() ?? "All",
                Year = year ?? DateTime.Now.Year
            };

            return await GetPartReturnStatusAsync(request);
        }

        /// <summary>
        /// Get parts with 'In Progress' return status
        /// </summary>
        /// <param name="invUserID">Inventory user ID filter</param>
        /// <param name="year">Year filter</param>
        /// <returns>List of parts in progress</returns>
        public async Task<List<PartReturnStatusDto>> GetPartsInProgressAsync(string invUserID = "All", int? year = null)
        {
            var request = new PartReturnStatusRequestDto
            {
                Key = 1,
                Source = "Web",
                InvUserID = invUserID?.Trim() ?? "All",
                Year = year ?? DateTime.Now.Year
            };

            return await GetPartReturnStatusAsync(request);
        }

        /// <summary>
        /// Get parts with 'Pending' return status
        /// </summary>
        /// <param name="invUserID">Inventory user ID filter</param>
        /// <param name="year">Year filter</param>
        /// <returns>List of pending parts</returns>
        public async Task<List<PartReturnStatusDto>> GetPartsPendingAsync(string invUserID = "All", int? year = null)
        {
            var request = new PartReturnStatusRequestDto
            {
                Key = 2,
                Source = "Web",
                InvUserID = invUserID?.Trim() ?? "All",
                Year = year ?? DateTime.Now.Year
            };

            return await GetPartReturnStatusAsync(request);
        }

        /// <summary>
        /// Get parts that have been returned
        /// </summary>
        /// <param name="invUserID">Inventory user ID filter</param>
        /// <param name="year">Year filter</param>
        /// <returns>List of returned parts</returns>
        public async Task<List<PartReturnStatusDto>> GetPartsReturnedAsync(string invUserID = "All", int? year = null)
        {
            var request = new PartReturnStatusRequestDto
            {
                Key = 3,
                Source = "Web",
                InvUserID = invUserID?.Trim() ?? "All",
                Year = year ?? DateTime.Now.Year
            };

            return await GetPartReturnStatusAsync(request);
        }

        /// <summary>
        /// Get parts to be received by warehouse for chart display
        /// </summary>
        /// <param name="year">Year filter</param>
        /// <returns>Chart data and totals for parts to be received</returns>
        public async Task<PartsToBeReceivedResponseDto> GetPartsToBeReceivedByWHAsync(int year)
        {
            using var connection = new SqlConnection(_connectionString);
            
            var parameters = new DynamicParameters();
            parameters.Add("@year", year, DbType.Int32);

            using var multi = await connection.QueryMultipleAsync(
                "DisplayPartsTobeReceivedbyWH",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            // Read first result set (chart data)
            var chartData = (await multi.ReadAsync<PartsToBeReceivedChartDto>()).ToList();
            
            // Trim string properties in chart data
            foreach (var item in chartData)
            {
                if (!string.IsNullOrEmpty(item.Name))
                {
                    item.Name = item.Name.Trim();
                }
            }

            // Read second result set (totals)
            var totalsData = await multi.ReadFirstOrDefaultAsync<PartsToBeReceivedTotalsDto>();

            return new PartsToBeReceivedResponseDto
            {
                ChartData = chartData,
                Totals = totalsData ?? new PartsToBeReceivedTotalsDto()
            };
        }

        /// <summary>
        /// Get parts received by warehouse for chart display
        /// </summary>
        /// <param name="year">Year filter</param>
        /// <returns>Chart data and totals for parts received by warehouse</returns>
        public async Task<PartsReceivedByWHResponseDto> GetPartsReceivedByWHAsync(int year)
        {
            using var connection = new SqlConnection(_connectionString);
            
            var parameters = new DynamicParameters();
            parameters.Add("@Year", year, DbType.Int32);

            using var multi = await connection.QueryMultipleAsync(
                "DisplayPartsReceivedByWH",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            // Read first result set (chart data)
            var chartData = (await multi.ReadAsync<PartsReceivedByWHChartDto>()).ToList();
            
            // Trim string properties in chart data
            foreach (var item in chartData)
            {
                if (!string.IsNullOrEmpty(item.Name))
                {
                    item.Name = item.Name.Trim();
                }
            }

            // Read second result set (totals)
            var totalsData = await multi.ReadFirstOrDefaultAsync<PartsReceivedByWHTotalsDto>();

            return new PartsReceivedByWHResponseDto
            {
                ChartData = chartData,
                Totals = totalsData ?? new PartsReceivedByWHTotalsDto()
            };
        }

        /// <summary>
        /// Get parts return data by week number
        /// </summary>
        /// <param name="weekNo">Week number of the year</param>
        /// <returns>List of parts return data for the specified week</returns>
        public async Task<List<PartsReturnDataByWeekNoDto>> GetPartsReturnDataByWeekNoAsync(int weekNo)
        {
            using var connection = new SqlConnection(_connectionString);
            
            var parameters = new DynamicParameters();
            parameters.Add("@WeekNo", weekNo, DbType.Int32);

            var results = await connection.QueryAsync<PartsReturnDataByWeekNoDto>(
                "GetPartsReturnDataByWeekNo",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            var resultList = results.ToList();
            
            // Trim string properties
            foreach (var item in resultList)
            {
                if (!string.IsNullOrEmpty(item.Service_Call_ID))
                {
                    item.Service_Call_ID = item.Service_Call_ID.Trim();
                }
                if (!string.IsNullOrEmpty(item.ReturnStatus))
                {
                    item.ReturnStatus = item.ReturnStatus.Trim();
                }
                if (!string.IsNullOrEmpty(item.ReturnNotes))
                {
                    item.ReturnNotes = item.ReturnNotes.Trim();
                }
                if (!string.IsNullOrEmpty(item.TechName))
                {
                    item.TechName = item.TechName.Trim();
                }
                if (!string.IsNullOrEmpty(item.Maint_Auth_ID))
                {
                    item.Maint_Auth_ID = item.Maint_Auth_ID.Trim();
                }
            }

            return resultList;
        }
    }
}