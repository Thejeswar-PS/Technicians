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
        private readonly ErrorLogRepository _errorLog;
        private readonly ILogger<OrderRequestStatusRepository> _logger;

        private const string LoggerName = "Technicians.OrderRequestStatusRepository";

        public OrderRequestStatusRepository(
            IConfiguration configuration,
            ErrorLogRepository errorLog,
            ILogger<OrderRequestStatusRepository> logger)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection") ??
                throw new InvalidOperationException("DefaultConnection string not found in configuration");
            _errorLog = errorLog;
            _logger = logger;
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

                var resultList = results.ToList();
                _logger.LogInformation("Retrieved {Count} order request status records for Status: {Status}, OrderType: {OrderType}", 
                    resultList.Count, request.Status, request.OrderType);
                return resultList;
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "GetOrderRequestStatusAsync", $"{request.Status}|{request.OrderType}");
                _logger.LogError(sqlEx, "SQL error retrieving order request status for Status: {Status}, OrderType: {OrderType}", 
                    request.Status, request.OrderType);
                throw new Exception($"Database error retrieving order request status: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetOrderRequestStatusAsync", $"{request.Status}|{request.OrderType}");
                _logger.LogError(ex, "Error retrieving order request status for Status: {Status}, OrderType: {OrderType}", 
                    request.Status, request.OrderType);
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