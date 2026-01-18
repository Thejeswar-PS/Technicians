using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class EmergencyJobsRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<EmergencyJobsRepository> _logger;

        public EmergencyJobsRepository(IConfiguration configuration, ILogger<EmergencyJobsRepository> logger)
        {
            _connectionString = configuration.GetConnectionString("ETechConnString")
                ?? throw new InvalidOperationException("ETechConnString not found");
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

                return new EmergencyJobsResponseDto
                {
                    Success = true,
                    GeneratedAt = DateTime.UtcNow,
                    EmergencyJobs = emergencyJobs.ToList()
                };
            }
            catch (Exception ex)
            {
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