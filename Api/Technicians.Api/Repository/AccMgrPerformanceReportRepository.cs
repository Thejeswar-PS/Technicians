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
            try
            {
                using var conn = new SqlConnection(_connectionString);
                await conn.OpenAsync();

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
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error retrieving performance report for OfficeId '{officeId}': {sqlEx.Message}", sqlEx);
            }
            catch (InvalidOperationException ioEx) when (ioEx.Message.Contains("connection") || ioEx.Message.Contains("timeout"))
            {
                throw new Exception($"Connection or timeout error while retrieving performance report for OfficeId '{officeId}': {ioEx.Message}", ioEx);
            }
            catch (TimeoutException timeoutEx)
            {
                throw new Exception($"Query timeout occurred while retrieving performance report for OfficeId '{officeId}'. The stored procedure may be taking longer than the 120-second timeout.", timeoutEx);
            }
            catch (Exception ex)
            {
                throw new Exception($"Unexpected error retrieving performance report for OfficeId '{officeId}': {ex.Message}", ex);
            }
        }
    }
}
