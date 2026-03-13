using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class NewDisplayCallsGraphRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;
        private readonly ErrorLogRepository _errorLog;
        private readonly ILogger<NewDisplayCallsGraphRepository> _logger;

        private const string LoggerName = "Technicians.NewDisplayCallsGraphRepository";

        public NewDisplayCallsGraphRepository(
            IConfiguration configuration,
            ErrorLogRepository errorLog,
            ILogger<NewDisplayCallsGraphRepository> logger)
        {
            _configuration = configuration;
            _connectionString = configuration.GetConnectionString("ETechConnString")
                ?? throw new InvalidOperationException("ETechConnString not found");
            _errorLog = errorLog;
            _logger = logger;
        }

        public async Task<AcctStatusGraphDto?> GetAcctStatusAsync()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var result = await connection.QueryFirstOrDefaultAsync<AcctStatusGraphDto>(
                    "NewDisplayCallsGraph",
                    new { pDetailPage = "AcctStatus" },
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 120
                );

                _logger.LogInformation("Retrieved account status graph data - Success: {Success}", result != null);
                return result;
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "GetAcctStatusAsync", "AcctStatus");
                _logger.LogError(sqlEx, "SQL error retrieving account status graph data");
                throw new Exception($"Database error retrieving account status graph data: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetAcctStatusAsync", "AcctStatus");
                _logger.LogError(ex, "Error retrieving account status graph data");
                throw;
            }
        }

        public async Task<AccMgmtGraphDto?> GetAccMgmtAsync()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var result = await connection.QueryFirstOrDefaultAsync<AccMgmtGraphDto>(
                    "NewDisplayCallsGraph",
                    new { pDetailPage = "AccMgmtGraph" },
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 120
                );

                _logger.LogInformation("Retrieved account management graph data - Success: {Success}", result != null);
                return result;
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "GetAccMgmtAsync", "AccMgmtGraph");
                _logger.LogError(sqlEx, "SQL error retrieving account management graph data");
                throw new Exception($"Database error retrieving account management graph data: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetAccMgmtAsync", "AccMgmtGraph");
                _logger.LogError(ex, "Error retrieving account management graph data");
                throw;
            }
        }

        public async Task<IEnumerable<AccountManagerPaperworkDto>> GetAccountManagerPaperworkAsync()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var result = await connection.QueryAsync<AccountManagerPaperworkDto>(
                    "DisplayActMngrGraph",
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 120
                );

                var resultList = result.ToList();
                _logger.LogInformation("Retrieved {Count} account manager paperwork records", resultList.Count);
                return resultList;
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "GetAccountManagerPaperworkAsync");
                _logger.LogError(sqlEx, "SQL error retrieving account manager paperwork data");
                throw new Exception($"Database error retrieving account manager paperwork data: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetAccountManagerPaperworkAsync");
                _logger.LogError(ex, "Error retrieving account manager paperwork data");
                throw;
            }
        }

        public async Task<IEnumerable<AccountManagerPaperworkDto>> GetAccountManagerQuoteGraphAsync()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var result = await connection.QueryAsync<AccountManagerPaperworkDto>(
                    "DisplayActMngrQuoteGraph",
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 120
                );

                var resultList = result.ToList();
                _logger.LogInformation("Retrieved {Count} account manager quote graph records", resultList.Count);
                return resultList;
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "GetAccountManagerQuoteGraphAsync");
                _logger.LogError(sqlEx, "SQL error retrieving account manager quote graph data");
                throw new Exception($"Database error retrieving account manager quote graph data: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetAccountManagerQuoteGraphAsync");
                _logger.LogError(ex, "Error retrieving account manager quote graph data");
                throw;
            }
        }

        public async Task<IEnumerable<AccountManagerPaperworkDto>> GetAccountManagerUnscheduledGraphAsync()
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var result = await connection.QueryAsync<AccountManagerPaperworkDto>(
                    "DisplayActMngrUnschGraph",
                    commandType: CommandType.StoredProcedure,
                    commandTimeout: 120
                );

                var resultList = result.ToList();
                _logger.LogInformation("Retrieved {Count} account manager unscheduled graph records", resultList.Count);
                return resultList;
            }
            catch (SqlException sqlEx)
            {
                await _errorLog.LogErrorAsync(LoggerName, sqlEx, "GetAccountManagerUnscheduledGraphAsync");
                _logger.LogError(sqlEx, "SQL error retrieving account manager unscheduled graph data");
                throw new Exception($"Database error retrieving account manager unscheduled graph data: {sqlEx.Message}", sqlEx);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetAccountManagerUnscheduledGraphAsync");
                _logger.LogError(ex, "Error retrieving account manager unscheduled graph data");
                throw;
            }
        }
    }
}
