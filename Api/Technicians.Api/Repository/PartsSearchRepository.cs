
using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public interface IPartsSearchRepository
    {
        Task<PartsSearchDataResponse> GetPartsSearchDataAsync(PartsSearchRequestDto request);
    }

    public class PartsSearchRepository : IPartsSearchRepository
    {
        private readonly string _connectionString;
        private readonly ILogger<PartsSearchRepository> _logger;

        public PartsSearchRepository(IConfiguration configuration, ILogger<PartsSearchRepository> logger)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection not found");
            _logger = logger;
        }

        public async Task<PartsSearchDataResponse> GetPartsSearchDataAsync(PartsSearchRequestDto request)
        {
            try
            {
                // Validate that at least one search parameter is provided (matching legacy logic exactly)
                if (IsEmptySearchRequest(request))
                {
                    return new PartsSearchDataResponse
                    {
                        Success = false,
                        Message = "At least one search parameter must be provided",
                        Data = new List<PartsSearchDataDto>(),
                        TotalRecords = 0
                    };
                }

                using var connection = new SqlConnection(_connectionString);

                var parameters = new DynamicParameters();
                // Pass parameters as-is like legacy code - SP handles empty strings with wildcards
                parameters.Add("@Address", request.Address ?? string.Empty);
                parameters.Add("@Status", request.Status ?? string.Empty);
                parameters.Add("@SiteID", request.SiteID ?? string.Empty);
                parameters.Add("@Make", request.Make ?? string.Empty);
                parameters.Add("@Model", request.Model ?? string.Empty);
                parameters.Add("@KVA", request.KVA ?? string.Empty);
                parameters.Add("@IPVoltage", request.IPVoltage ?? string.Empty);
                parameters.Add("@OPVoltage", request.OPVoltage ?? string.Empty);
                parameters.Add("@ManufPartNo", request.ManufPartNo ?? string.Empty);
                parameters.Add("@DCGPartNo", request.DCGPartNo ?? string.Empty);

                // Use dynamic query to handle column mapping
                var dynamicResults = await connection.QueryAsync(
                    "GetPartsSearchData",
                    parameters,
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 1000
                );

                // Manually map the results to handle the I/OVolt column
                var data = dynamicResults.Select(row => new PartsSearchDataDto
                {
                    CallNbr = row.CallNbr ?? string.Empty,
                    CUSTNMBR = row.CUSTNMBR ?? string.Empty,
                    Status = row.Status ?? string.Empty,
                    Address = row.Address ?? string.Empty,
                    Make = row.Make ?? string.Empty,
                    Model = row.Model ?? string.Empty,
                    KVA = row.KVA ?? string.Empty,
                    IOVolt = row["I/OVolt"] ?? string.Empty, // Handle the special column name
                    ManufPartNo = row.ManufPartNo ?? string.Empty,
                    DCGPartNo = row.DCGPartNo ?? string.Empty,
                    TechName = row.TechName ?? string.Empty,
                    JobType = row.JobType ?? string.Empty,
                    RequestedDate = row.RequestedDate
                }).ToList();

                return new PartsSearchDataResponse
                {
                    Success = true,
                    Data = data,
                    TotalRecords = data.Count
                };
            }
            catch (SqlException sqlEx)
            {
                _logger.LogError(sqlEx, "SQL error occurred in GetPartsSearchDataAsync: {Message}", sqlEx.Message);
                return new PartsSearchDataResponse
                {
                    Success = false,
                    Message = $"Database error: {sqlEx.Message}",
                    Data = new List<PartsSearchDataDto>(),
                    TotalRecords = 0
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in GetPartsSearchDataAsync: {Message}", ex.Message);
                return new PartsSearchDataResponse
                {
                    Success = false,
                    Message = "An unexpected error occurred while searching parts data",
                    Data = new List<PartsSearchDataDto>(),
                    TotalRecords = 0
                };
            }
        }

        private bool IsEmptySearchRequest(PartsSearchRequestDto request)
        {
            // Match legacy logic exactly: check if ALL fields are empty strings
            // Legacy: if (Address.Length > 0 || Status.Length > 0 || SiteID.Length > 0 || ...)
            // Inverse: return true if ALL are empty (Address.Length == 0 AND Status.Length == 0 AND ...)
            return string.IsNullOrEmpty(request.Address) &&
                   string.IsNullOrEmpty(request.Status) &&
                   string.IsNullOrEmpty(request.SiteID) &&
                   string.IsNullOrEmpty(request.Make) &&
                   string.IsNullOrEmpty(request.Model) &&
                   string.IsNullOrEmpty(request.KVA) &&
                   string.IsNullOrEmpty(request.IPVoltage) &&
                   string.IsNullOrEmpty(request.OPVoltage) &&
                   string.IsNullOrEmpty(request.ManufPartNo) &&
                   string.IsNullOrEmpty(request.DCGPartNo);
        }
    }
}