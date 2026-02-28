using Dapper;
using System.Data;
using System.Data.SqlClient;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class NewDisplayCallsDetailRepository
    {
        private readonly string _connectionString;

        public NewDisplayCallsDetailRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("ETechGreatPlainsConnString");
        }

        public async Task<NewDisplayCallsDetailResponse> GetAsync(NewDisplayCallsDetailRequest request)
        {
            using var connection = new SqlConnection(_connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@pDetailPage", request.DetailPage);
            parameters.Add("@pOffID", request.OffId ?? string.Empty);

            using var multi = await connection.QueryMultipleAsync(
                "dbo.NewDisplayCallsDetail",
                parameters,
                commandType: CommandType.StoredProcedure);

            var response = new NewDisplayCallsDetailResponse();

            var result = (await multi.ReadAsync()).ToList();

            // Limit rows to prevent Swagger / UI crash
            response.Data = result.Take(500);
            if (!multi.IsConsumed)
            {
                response.Totals = await multi.ReadAsync();
            }

            return response;
        }
    }
}