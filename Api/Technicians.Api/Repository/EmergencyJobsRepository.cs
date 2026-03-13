using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class EmergencyJobsRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;
        private readonly ErrorLogRepository _errorLog;
        private readonly ILogger<EmergencyJobsRepository> _logger;

        private const string LoggerName = "Technicians.EmergencyJobsRepository";

        public EmergencyJobsRepository(
            IConfiguration configuration,
            ErrorLogRepository errorLog,
            ILogger<EmergencyJobsRepository> logger)
        {
            _configuration = configuration;
            _connectionString = configuration.GetConnectionString("ETechGreatPlainsConnString")
                ?? throw new InvalidOperationException("ETechGreatPlainsConnString not found");
            _errorLog = errorLog;
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        public async Task<EmergencyJobsResponseDto> GetEmergencyJobsAsync()
        {
            try
            {
                _logger.LogInformation("Getting emergency jobs for display");

                using var connection = new SqlConnection(_connectionString);
                
                var emergencyJobs = await connection.QueryAsync<EmergencyJobDto>(
                    "aaEmergencyJobsForDisplay",
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 120
                );

                _logger.LogInformation("Successfully retrieved {Count} emergency jobs", emergencyJobs.Count());

                return new EmergencyJobsResponseDto
                {
                    Success = true,
                    GeneratedAt = DateTime.UtcNow,
                    EmergencyJobs = emergencyJobs.ToList(),
                    Message = $"Successfully retrieved {emergencyJobs.Count()} emergency jobs"
                };
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "GetEmergencyJobsAsync");
                _logger.LogError(sqlEx, "SQL error getting emergency jobs: {SqlState} {ErrorNumber}", sqlEx.State, sqlEx.Number);
                return new EmergencyJobsResponseDto
                {
                    Success = false,
                    Message = $"Database error retrieving emergency jobs: {sqlEx.Message}",
                    GeneratedAt = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetEmergencyJobsAsync");
                _logger.LogError(ex, "Error getting emergency jobs for display");
                return new EmergencyJobsResponseDto
                {
                    Success = false,
                    Message = $"Error retrieving emergency jobs: {ex.Message}",
                    GeneratedAt = DateTime.UtcNow
                };
            }
        }
    }
}