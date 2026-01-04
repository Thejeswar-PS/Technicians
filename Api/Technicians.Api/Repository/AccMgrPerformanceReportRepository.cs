using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public interface IAccMgrPerformanceReportRepository
    {
        Task<AccMgrPerformanceReportResponseDto> GetReportAsync(string officeId, string roJobs);
    }

    public class AccMgrPerformanceReportRepository : IAccMgrPerformanceReportRepository
    {
        private readonly string _connectionString;

        public AccMgrPerformanceReportRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection missing");
        }

        public async Task<AccMgrPerformanceReportResponseDto> GetReportAsync(string officeId, string roJobs)
        {
            using var conn = new SqlConnection(_connectionString);

            using var multi = await conn.QueryMultipleAsync(
                "DisplayPerformanceEmail",
                new { pOffid = officeId, ROJobs = roJobs },
                commandType: CommandType.StoredProcedure,
                commandTimeout: 120
            );

            return new AccMgrPerformanceReportResponseDto
            {
                OfficeId = officeId,
                GeneratedAt = DateTime.UtcNow,

                CompletedNotReturned = (await multi.ReadAsync<AccMgrCallStatusDto>()).ToList(),
                ReturnedForProcessing = (await multi.ReadAsync<AccMgrReturnedForProcessingDto>()).ToList(),
                JobsScheduledToday = (await multi.ReadAsync<AccMgrJobsScheduledTodayDto>()).ToList(),
                JobsConfirmedNext120Hours = (await multi.ReadAsync<AccMgrJobsConfirmedNext120HoursDto>()).ToList(),
                ReturnedWithIncompleteData = (await multi.ReadAsync<AccMgrCallStatusDto>()).ToList(),
                PastDueUnscheduled = (await multi.ReadAsync<AccMgrUnscheduledJobDto>()).ToList(),
                FirstMonth = (await multi.ReadAsync<AccMgrUnscheduledJobDto>()).ToList(),
                SecondMonth = (await multi.ReadAsync<AccMgrUnscheduledJobDto>()).ToList(),
                ThirdMonth = (await multi.ReadAsync<AccMgrUnscheduledJobDto>()).ToList(),
                FourthMonth = (await multi.ReadAsync<AccMgrUnscheduledJobDto>()).ToList(),
                FifthMonth = (await multi.ReadAsync<AccMgrUnscheduledJobDto>()).ToList(),

            };
        }
    }
}



//using Dapper;
//using Microsoft.Data.SqlClient;
//using System.Data;
//using Technicians.Api.Models;

//namespace Technicians.Api.Repository
//{
//    /// <summary>
//    /// Interface for Account Manager Performance Report repository operations
//    /// </summary>
//    public interface IAccMgrPerformanceReportRepository
//    {
//        /// <summary>
//        /// Gets comprehensive Account Manager Performance Report data for a specific office
//        /// </summary>
//        /// <param name="officeId">Office ID</param>
//        /// <returns>Complete Account Manager Performance Report data</returns>
//        Task<AccMgrPerformanceReportResponseDto> GetAccMgrPerformanceReportDataAsync(string officeId);

//        /// <summary>
//        /// Gets summary statistics for Account Manager Performance Report data
//        /// </summary>
//        /// <param name="officeId">Office ID</param>
//        /// <returns>Summary statistics</returns>
//        Task<AccMgrPerformanceReportSummaryDto> GetAccMgrPerformanceReportSummaryAsync(string officeId);

//        /// <summary>
//        /// Gets only completed jobs not returned from technician
//        /// </summary>
//        /// <param name="officeId">Office ID</param>
//        /// <returns>List of completed but not returned jobs</returns>
//        Task<List<AccMgrCompletedNotReturnedDto>> GetCompletedNotReturnedAsync(string officeId);

//        /// <summary>
//        /// Gets jobs returned from technician for processing by account manager
//        /// </summary>
//        /// <param name="officeId">Office ID</param>
//        /// <returns>List of jobs returned for processing</returns>
//        Task<List<AccMgrReturnedForProcessingDto>> GetReturnedForProcessingAsync(string officeId);

//        /// <summary>
//        /// Gets past due unscheduled jobs
//        /// </summary>
//        /// <param name="officeId">Office ID</param>
//        /// <returns>List of past due unscheduled jobs</returns>
//        Task<List<AccMgrPastDueUnscheduledDto>> GetPastDueUnscheduledAsync(string officeId);

//        /// <summary>
//        /// Gets jobs scheduled today
//        /// </summary>
//        /// <param name="officeId">Office ID</param>
//        /// <returns>List of jobs scheduled today</returns>
//        Task<List<AccMgrJobsScheduledTodayDto>> GetJobsScheduledTodayAsync(string officeId);

//        /// <summary>
//        /// Gets jobs confirmed for next 120 hours
//        /// </summary>
//        /// <param name="officeId">Office ID</param>
//        /// <returns>List of jobs confirmed for next 120 hours</returns>
//        Task<List<AccMgrJobsConfirmedNext120HoursDto>> GetJobsConfirmedNext120HoursAsync(string officeId);

//        /// <summary>
//        /// Gets jobs returned with incomplete data
//        /// </summary>
//        /// <param name="officeId">Office ID</param>
//        /// <returns>List of jobs returned with incomplete data</returns>
//        Task<List<AccMgrReturnedWithIncompleteDataDto>> GetReturnedWithIncompleteDataAsync(string officeId);

//        /// <summary>
//        /// Gets monthly unscheduled jobs by month index
//        /// </summary>
//        /// <param name="monthIndex">Month index (1-5)</param>
//        /// <param name="officeId">Office ID</param>
//        /// <returns>List of monthly unscheduled jobs</returns>
//        Task<List<AccMgrMonthlyUnscheduledJobsDto>> GetMonthlyUnscheduledJobsAsync(int monthIndex, string officeId);
//    }

//    /// <summary>
//    /// Repository implementation for Account Manager Performance Report operations using DisplayPerformanceEmail stored procedure
//    /// </summary>
//    public class AccMgrPerformanceReportRepository : IAccMgrPerformanceReportRepository
//    {
//        private readonly string _connectionString;
//        private readonly ILogger<AccMgrPerformanceReportRepository> _logger;

//        public AccMgrPerformanceReportRepository(IConfiguration configuration, ILogger<AccMgrPerformanceReportRepository> logger)
//        {
//            _connectionString = configuration.GetConnectionString("DefaultConnection")
//                ?? throw new InvalidOperationException("DefaultConnection not found");
//            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
//        }

//        public async Task<AccMgrPerformanceReportResponseDto> GetAccMgrPerformanceReportDataAsync(string officeId)
//        {
//            try
//            {
//                _logger.LogInformation("Getting Account Manager Performance Report data for office: {OfficeId}", officeId);

//                using var connection = new SqlConnection(_connectionString);
//                using var multi = await connection.QueryMultipleAsync(
//                    "DisplayPerformanceEmail",
//                    new { pOffid = officeId, ROJobs = "" }, // ROJobs commented out but kept as empty string
//                    commandType: CommandType.StoredProcedure,
//                    commandTimeout: 120
//                );

//                var response = new AccMgrPerformanceReportResponseDto
//                {
//                    Success = true,
//                    OfficeId = officeId,
//                    // ROJobs = "", // Commented out
//                    GeneratedAt = DateTime.UtcNow
//                };

//                // Read result sets in order as per the stored procedure
//                // 1. Completed not returned from tech
//                response.CompletedNotReturned = (await multi.ReadAsync<AccMgrCompletedNotReturnedDto>()).ToList();

//                // 2. Returned from Technician for processing by Account Manager
//                response.ReturnedForProcessing = (await multi.ReadAsync<AccMgrReturnedForProcessingDto>()).ToList();

//                // 3. Jobs Today
//                response.JobsScheduledToday = (await multi.ReadAsync<AccMgrJobsScheduledTodayDto>()).ToList();

//                // 4. Customer confirmed next 120 hours
//                response.JobsConfirmedNext120Hours = (await multi.ReadAsync<AccMgrJobsConfirmedNext120HoursDto>()).ToList();

//                // 5. Returned with Incomplete Data
//                response.ReturnedWithIncompleteData = (await multi.ReadAsync<AccMgrReturnedWithIncompleteDataDto>()).ToList();

//                // 6. Past Due Unscheduled
//                response.PastDueUnscheduled = (await multi.ReadAsync<AccMgrPastDueUnscheduledDto>()).ToList();

//                // 7-11. Monthly unscheduled jobs (First Month through Fifth Month)
//                response.FirstMonth = (await multi.ReadAsync<AccMgrMonthlyUnscheduledJobsDto>()).ToList();
//                response.SecondMonth = (await multi.ReadAsync<AccMgrMonthlyUnscheduledJobsDto>()).ToList();
//                response.ThirdMonth = (await multi.ReadAsync<AccMgrMonthlyUnscheduledJobsDto>()).ToList();
//                response.FourthMonth = (await multi.ReadAsync<AccMgrMonthlyUnscheduledJobsDto>()).ToList();
//                response.FifthMonth = (await multi.ReadAsync<AccMgrMonthlyUnscheduledJobsDto>()).ToList();

//                _logger.LogInformation("Successfully retrieved Account Manager Performance Report data. Total records: {TotalRecords}", 
//                    response.TotalRecords);

//                return response;
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting Account Manager Performance Report data for office: {OfficeId}", officeId);

//                return new AccMgrPerformanceReportResponseDto
//                {
//                    Success = false,
//                    Message = $"Error retrieving Account Manager Performance Report data: {ex.Message}",
//                    OfficeId = officeId
//                    // ROJobs = "" // Commented out
//                };
//            }
//        }

//        public async Task<AccMgrPerformanceReportSummaryDto> GetAccMgrPerformanceReportSummaryAsync(string officeId)
//        {
//            try
//            {
//                var data = await GetAccMgrPerformanceReportDataAsync(officeId);

//                var summary = new AccMgrPerformanceReportSummaryDto
//                {
//                    CompletedNotReturnedCount = data.CompletedNotReturned.Count,
//                    ReturnedForProcessingCount = data.ReturnedForProcessing.Count,
//                    JobsScheduledTodayCount = data.JobsScheduledToday.Count,
//                    JobsConfirmedNext120HoursCount = data.JobsConfirmedNext120Hours.Count,
//                    ReturnedWithIncompleteDataCount = data.ReturnedWithIncompleteData.Count,
//                    PastDueUnscheduledCount = data.PastDueUnscheduled.Count,
//                    OfficeId = officeId,
//                    // ROJobsFilter = "", // Commented out
//                    GeneratedAt = DateTime.UtcNow
//                };

//                summary.MonthlyScheduledCounts = new Dictionary<string, int>
//                {
//                    ["FirstMonth"] = data.FirstMonth.Count,
//                    ["SecondMonth"] = data.SecondMonth.Count,
//                    ["ThirdMonth"] = data.ThirdMonth.Count,
//                    ["FourthMonth"] = data.FourthMonth.Count,
//                    ["FifthMonth"] = data.FifthMonth.Count
//                };

//                summary.TotalJobs = data.TotalRecords;

//                return summary;
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting Account Manager Performance Report summary for office: {OfficeId}", officeId);
//                throw;
//            }
//        }

//        public async Task<List<AccMgrCompletedNotReturnedDto>> GetCompletedNotReturnedAsync(string officeId)
//        {
//            try
//            {
//                var data = await GetAccMgrPerformanceReportDataAsync(officeId);
//                return data.CompletedNotReturned;
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting completed not returned jobs for office: {OfficeId}", officeId);
//                throw;
//            }
//        }

//        public async Task<List<AccMgrReturnedForProcessingDto>> GetReturnedForProcessingAsync(string officeId)
//        {
//            try
//            {
//                var data = await GetAccMgrPerformanceReportDataAsync(officeId);
//                return data.ReturnedForProcessing;
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting returned for processing jobs for office: {OfficeId}", officeId);
//                throw;
//            }
//        }

//        public async Task<List<AccMgrPastDueUnscheduledDto>> GetPastDueUnscheduledAsync(string officeId)
//        {
//            try
//            {
//                var data = await GetAccMgrPerformanceReportDataAsync(officeId);
//                return data.PastDueUnscheduled;
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting past due unscheduled jobs for office: {OfficeId}", officeId);
//                throw;
//            }
//        }

//        public async Task<List<AccMgrJobsScheduledTodayDto>> GetJobsScheduledTodayAsync(string officeId)
//        {
//            try
//            {
//                var data = await GetAccMgrPerformanceReportDataAsync(officeId);
//                return data.JobsScheduledToday;
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting jobs scheduled today for office: {OfficeId}", officeId);
//                throw;
//            }
//        }

//        public async Task<List<AccMgrJobsConfirmedNext120HoursDto>> GetJobsConfirmedNext120HoursAsync(string officeId)
//        {
//            try
//            {
//                var data = await GetAccMgrPerformanceReportDataAsync(officeId);
//                return data.JobsConfirmedNext120Hours;
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting jobs confirmed for next 120 hours for office: {OfficeId}", officeId);
//                throw;
//            }
//        }

//        public async Task<List<AccMgrReturnedWithIncompleteDataDto>> GetReturnedWithIncompleteDataAsync(string officeId)
//        {
//            try
//            {
//                var data = await GetAccMgrPerformanceReportDataAsync(officeId);
//                return data.ReturnedWithIncompleteData;
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting jobs returned with incomplete data for office: {OfficeId}", officeId);
//                throw;
//            }
//        }

//        public async Task<List<AccMgrMonthlyUnscheduledJobsDto>> GetMonthlyUnscheduledJobsAsync(int monthIndex, string officeId)
//        {
//            try
//            {
//                var data = await GetAccMgrPerformanceReportDataAsync(officeId);

//                return monthIndex switch
//                {
//                    1 => data.FirstMonth,
//                    2 => data.SecondMonth,
//                    3 => data.ThirdMonth,
//                    4 => data.FourthMonth,
//                    5 => data.FifthMonth,
//                    _ => throw new ArgumentException($"Invalid month index: {monthIndex}. Must be between 1 and 5.")
//                };
//            }
//            catch (Exception ex)
//            {
//                _logger.LogError(ex, "Error getting monthly unscheduled jobs for month {MonthIndex}, office: {OfficeId}", monthIndex, officeId);
//                throw;
//            }
//        }
//    }
//}