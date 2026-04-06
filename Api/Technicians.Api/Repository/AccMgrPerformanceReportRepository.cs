using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public interface IAccMgrPerformanceReportRepository
    {
        Task<AccMgrPerformanceReportResponseDto> GetReportAsync(string officeId, string roJobs);
        Task<AccMgrPerformanceReportResponseDto> GetReportAsync(AccMgrPerformanceReportRequestDto request);
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
            return await GetReportAsync(new AccMgrPerformanceReportRequestDto
            {
                OfficeId = officeId,
                ROJobs = roJobs
            });
        }

        public async Task<AccMgrPerformanceReportResponseDto> GetReportAsync(AccMgrPerformanceReportRequestDto request)
        {
            try
            {
                using var conn = new SqlConnection(_connectionString);
                await conn.OpenAsync();

                using var multi = await conn.QueryMultipleAsync(
                    "DisplayPerformanceEmail",
                    new { pOffid = request.OfficeId, ROJobs = request.ROJobs ?? string.Empty },
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 120
                );

                // Helper: read the next result set safely; returns empty list if no more result sets
                static async Task<List<T>> SafeRead<T>(SqlMapper.GridReader reader)
                {
                    try
                    {
                        if (reader.IsConsumed) return new List<T>();
                        return (await reader.ReadAsync<T>()).ToList();
                    }
                    catch
                    {
                        return new List<T>();
                    }
                }

                // Read each result set in order — SP may return fewer than 11 for some offices
                var completedNotReturned       = await SafeRead<AccMgrCallStatusDto>(multi);
                var returnedForProcessing      = await SafeRead<AccMgrReturnedForProcessingDto>(multi);
                var jobsScheduledToday         = await SafeRead<AccMgrJobsScheduledTodayDto>(multi);
                var jobsConfirmedNext120Hours  = await SafeRead<AccMgrJobsConfirmedNext120HoursDto>(multi);
                var returnedWithIncompleteData = await SafeRead<AccMgrCallStatusDto>(multi);
                var pastDueUnscheduled         = await SafeRead<AccMgrUnscheduledJobDto>(multi);
                var firstMonth                 = await SafeRead<AccMgrUnscheduledJobDto>(multi);
                var secondMonth                = await SafeRead<AccMgrUnscheduledJobDto>(multi);
                var thirdMonth                 = await SafeRead<AccMgrUnscheduledJobDto>(multi);
                var fourthMonth                = await SafeRead<AccMgrUnscheduledJobDto>(multi);
                var fifthMonth                 = await SafeRead<AccMgrUnscheduledJobDto>(multi);

                var response = new AccMgrPerformanceReportResponseDto
                {
                    OfficeId = request.OfficeId,
                    ROJobs = request.ROJobs ?? string.Empty,
                    GeneratedAt = DateTime.UtcNow,
                    RequestedBy = request.UserEmpID ?? string.Empty,
                    UserRole = request.UserRole ?? string.Empty,
                    IsFiltered = !string.IsNullOrEmpty(request.UserEmpID) || !string.IsNullOrEmpty(request.WindowsID),
                    FilterCriteria = BuildFilterCriteria(request),

                    CompletedNotReturned = completedNotReturned,
                    ReturnedForProcessing = returnedForProcessing,
                    JobsScheduledToday = jobsScheduledToday,
                    JobsConfirmedNext120Hours = jobsConfirmedNext120Hours,
                    ReturnedWithIncompleteData = returnedWithIncompleteData,
                    PastDueUnscheduled = pastDueUnscheduled,
                    FirstMonth = firstMonth,
                    SecondMonth = secondMonth,
                    ThirdMonth = thirdMonth,
                    FourthMonth = fourthMonth,
                    FifthMonth = fifthMonth,
                };

                // Apply additional filtering if requested
                if (request.IncludeCriticalOnly)
                {
                    ApplyCriticalOnlyFilter(response);
                }
                else if (request.IncludeUnscheduledOnly)
                {
                    ApplyUnscheduledOnlyFilter(response);
                }

                return response;
            }
            catch (SqlException sqlEx)
            {
                throw new Exception($"Database error retrieving performance report for OfficeId '{request.OfficeId}': {sqlEx.Message}", sqlEx);
            }
            catch (InvalidOperationException ioEx) when (ioEx.Message.Contains("connection") || ioEx.Message.Contains("timeout"))
            {
                throw new Exception($"Connection or timeout error while retrieving performance report for OfficeId '{request.OfficeId}': {ioEx.Message}", ioEx);
            }
            catch (TimeoutException timeoutEx)
            {
                throw new Exception($"Query timeout occurred while retrieving performance report for OfficeId '{request.OfficeId}'. The stored procedure may be taking longer than the 120-second timeout.", timeoutEx);
            }
            catch (Exception ex)
            {
                throw new Exception($"Unexpected error retrieving performance report for OfficeId '{request.OfficeId}': {ex.Message}", ex);
            }
        }

        private string BuildFilterCriteria(AccMgrPerformanceReportRequestDto request)
        {
            var criteria = new List<string>();
            
            if (!string.IsNullOrEmpty(request.OfficeId))
                criteria.Add($"OfficeId: {request.OfficeId}");
                
            if (!string.IsNullOrEmpty(request.ROJobs))
                criteria.Add($"ROJobs: {request.ROJobs}");
                
            if (!string.IsNullOrEmpty(request.UserEmpID))
                criteria.Add($"RequestedBy: {request.UserEmpID}");
                
            if (!string.IsNullOrEmpty(request.UserRole))
                criteria.Add($"UserRole: {request.UserRole}");
                
            if (request.IncludeCriticalOnly)
                criteria.Add("Filter: Critical Jobs Only");
                
            if (request.IncludeUnscheduledOnly)
                criteria.Add("Filter: Unscheduled Jobs Only");

            return string.Join(", ", criteria);
        }

        private void ApplyCriticalOnlyFilter(AccMgrPerformanceReportResponseDto response)
        {
            // Keep only critical sections, clear the rest
            response.PastDueUnscheduled.Clear();
            response.FirstMonth.Clear();
            response.SecondMonth.Clear();
            response.ThirdMonth.Clear();
            response.FourthMonth.Clear();
            response.FifthMonth.Clear();
            response.JobsScheduledToday.Clear();
            response.JobsConfirmedNext120Hours.Clear();
        }

        private void ApplyUnscheduledOnlyFilter(AccMgrPerformanceReportResponseDto response)
        {
            // Keep only unscheduled sections, clear the rest
            response.CompletedNotReturned.Clear();
            response.ReturnedForProcessing.Clear();
            response.JobsScheduledToday.Clear();
            response.JobsConfirmedNext120Hours.Clear();
            response.ReturnedWithIncompleteData.Clear();
        }
    }
}
