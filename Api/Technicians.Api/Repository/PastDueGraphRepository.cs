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
        private readonly string _connectionString;
        private readonly ILogger<PastDueGraphRepository> _logger;

        public PastDueGraphRepository(IConfiguration configuration, ILogger<PastDueGraphRepository> logger)
        {
            _connectionString = configuration.GetConnectionString("ETechConnString")
                ?? throw new InvalidOperationException("ETechConnString not found");
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

                _logger.LogInformation("Successfully retrieved past due jobs information. Total records: {TotalRecords}", 
                    response.TotalRecords);

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting past due jobs information");

                return new PastDueGraphResponseDto
                {
                    Success = false,
                    Message = $"Error retrieving past due jobs information: {ex.Message}"
                };
            }
        }
    }
}