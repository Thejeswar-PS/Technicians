using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class OrderRequestStatusRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public OrderRequestStatusRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection") ??
                throw new InvalidOperationException("DefaultConnection string not found in configuration");
        }

        /// <summary>
        /// Gets order request status data using the GetOrderRequestStatus stored procedure
        /// </summary>
        /// <param name="request">Request parameters for filtering results</param>
        /// <returns>List of OrderRequestResponseDto objects</returns>
        public async Task<List<OrderRequestResponseDto>> GetOrderRequestStatusAsync(OrderRequestStatusRequestDto request)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@Status", request.Status ?? "All", DbType.String);
                parameters.Add("@OrderType", request.OrderType ?? "All", DbType.String);
                parameters.Add("@Archive", request.Archive, DbType.Boolean);

                var results = await connection.QueryAsync<OrderRequestResponseDto>(
                    "GetOrderRequestStatus",
                    parameters,
                    commandType: CommandType.StoredProcedure
                );

                return results.ToList();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving order request status: {ex.Message}", ex);
            }
        }

        /// <summary>
        /// Gets order request status data with simplified parameters
        /// </summary>
        /// <param name="status">Status filter (defaults to "All")</param>
        /// <param name="orderType">Order type filter (defaults to "All")</param>
        /// <param name="archive">Archive filter (defaults to false)</param>
        /// <returns>List of OrderRequestResponseDto objects</returns>
        public async Task<List<OrderRequestResponseDto>> GetOrderRequestStatusAsync(string status = "All", string orderType = "All", bool archive = false)
        {
            var request = new OrderRequestStatusRequestDto
            {
                Status = status,
                OrderType = orderType,
                Archive = archive
            };

            return await GetOrderRequestStatusAsync(request);
        }
    }
}