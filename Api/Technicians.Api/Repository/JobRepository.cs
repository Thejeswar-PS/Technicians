using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query.Internal;
using Microsoft.Extensions.Configuration;
using System.Data;
using System.Xml.Linq;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class JobRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;
        private readonly string _eTechConnectionString;
        private readonly ErrorLogRepository _errorLog;
        private readonly ILogger<JobRepository> _logger;

        private const string LoggerName = "Technicians.JobRepository";

        public JobRepository(
            IConfiguration configuration,
            ErrorLogRepository errorLog,
            ILogger<JobRepository> logger)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
            _eTechConnectionString = _configuration.GetConnectionString("ETechGreatPlainsConnString");
            _errorLog = errorLog;
            _logger = logger;
        }

        public List<JobDto> GetJobs(string empId, string mgrId, string techId, int rbButton, int currentYear, int month, out string errorMessage)
        {
            var jobs = new List<JobDto>();
            errorMessage = null;

            try
            {
                using (SqlConnection con = new SqlConnection(_connectionString))
                {
                    var parameters = new DynamicParameters();
                    parameters.Add("@EmpID", empId);
                    parameters.Add("@MgrID", mgrId);
                    parameters.Add("@TechID", techId);
                    parameters.Add("@rbButton", rbButton);
                    parameters.Add("@CurrentYear", currentYear);
                    parameters.Add("@Month", month);

                    jobs = con.Query<JobDto>("etechGetJobs", parameters, commandType: CommandType.StoredProcedure).ToList();
                }

                _logger.LogInformation("Retrieved {Count} jobs for EmpID: {EmpId}, TechID: {TechId}", jobs.Count, empId, techId);
            }
            catch (Exception ex)
            {
                _errorLog.LogErrorAsync(LoggerName, ex, "GetJobs", $"{empId}|{techId}").Wait();
                _logger.LogError(ex, "Error retrieving jobs for EmpID: {EmpId}, TechID: {TechId}", empId, techId);
                errorMessage = ex.Message;
            }

            return jobs;
        }

        public List<JobDto> GetSearchedJob(string jobId, string techId, string empId, out string errorMessage)
        {
            var jobs = new List<JobDto>();
            errorMessage = null;

            try
            {
                using (SqlConnection con = new SqlConnection(_connectionString))
                {
                    var parameters = new DynamicParameters();
                    parameters.Add("@JobID", jobId);
                    parameters.Add("@TechID", techId);
                    parameters.Add("@EmpID", empId);

                    jobs = con.Query<JobDto>("ETechShowSearchedJob", parameters, commandType: CommandType.StoredProcedure).ToList();
                }

                _logger.LogInformation("Retrieved {Count} searched jobs for JobID: {JobId}, TechID: {TechId}", jobs.Count, jobId, techId);
            }
            catch (Exception ex)
            {
                _errorLog.LogErrorAsync(LoggerName, ex, "GetSearchedJob", $"{jobId}|{techId}").Wait();
                _logger.LogError(ex, "Error retrieving searched job for JobID: {JobId}, TechID: {TechId}", jobId, techId);
                errorMessage = ex.Message;
            }

            return jobs;
        }

        public async Task<CalendarDataResponseDto> GetCalenderJobData(DateTime startDate, DateTime endDate, string ownerId, string tech, string state, string type, string sproc)
        {
            try
            {
                var parameter = new DynamicParameters();

                if (tech == "All")
                {
                    tech = "0";
                }
                parameter.Add("@pStartDate", startDate, DbType.String, ParameterDirection.Input);
                parameter.Add("@pEndDate", endDate, DbType.String, ParameterDirection.Input);
                parameter.Add("@pCalendarSelect", "Tech", DbType.String, ParameterDirection.Input);
                parameter.Add("@pTechFilter", tech, DbType.String, ParameterDirection.Input);
                parameter.Add("@pOffFilter", ownerId.Trim(), DbType.String, ParameterDirection.Input);
                parameter.Add("@State", state, DbType.String, ParameterDirection.Input);
                parameter.Add("@Status", type, DbType.String, ParameterDirection.Input);
                
                using (var connection = new SqlConnection(_eTechConnectionString))
                {
                    await connection.OpenAsync();
                    
                    using (var multi = await connection.QueryMultipleAsync(sproc, parameter, commandType: CommandType.StoredProcedure))
                    {
                        // Read first result set - Calendar job data
                        var calendarJobs = (await multi.ReadAsync<GetCalenderJobDataVM>()).ToList();
                        
                        // Read second result set - Summary counts
                        var summary = await multi.ReadFirstOrDefaultAsync<CalendarSummaryDto>();
                        
                        connection.Close();

                        var result = new CalendarDataResponseDto
                        {
                            CalendarJobs = calendarJobs,
                            Summary = summary ?? new CalendarSummaryDto()
                        };

                        _logger.LogInformation("Retrieved calendar job data - Jobs: {JobCount}, Tech: {Tech}, State: {State}", 
                            calendarJobs.Count, tech, state);
                        return result;
                    }
                }
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetCalenderJobData", $"{ownerId}|{tech}|{state}");
                _logger.LogError(ex, "Error retrieving calendar job data for OwnerId: {OwnerId}, Tech: {Tech}", ownerId, tech);
                throw;
            }
        }
    }
}
