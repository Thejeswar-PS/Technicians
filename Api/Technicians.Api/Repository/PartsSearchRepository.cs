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

        public PartsSearchRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("DefaultConnection not found");
        }

        public async Task<PartsSearchDataResponse> GetPartsSearchDataAsync(PartsSearchRequestDto request)
        {
            using var connection = new SqlConnection(_connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@Address", request.Address);
            parameters.Add("@Status", request.Status);
            parameters.Add("@SiteID", request.SiteID); // Corrected: Now maps to @SiteID parameter
            parameters.Add("@Make", request.Make);
            parameters.Add("@Model", request.Model);
            parameters.Add("@KVA", request.KVA);
            parameters.Add("@IPVoltage", request.IPVoltage);
            parameters.Add("@OPVoltage", request.OPVoltage);
            parameters.Add("@ManufPartNo", request.ManufPartNo);
            parameters.Add("@DCGPartNo", request.DCGPartNo);

            var data = await connection.QueryAsync<PartsSearchDataDto>(
                "GetPartsSearchData",
                parameters,
                commandType: CommandType.StoredProcedure,
                commandTimeout: 1000
            );

            return new PartsSearchDataResponse
            {
                Success = true,
                Data = data.ToList(),
                TotalRecords = data.Count()
            };
        }
    }
}
