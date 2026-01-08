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
