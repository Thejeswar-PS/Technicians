using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class EtechExpenseRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;
        private readonly ErrorLogRepository _errorLog;
        private readonly ILogger<EtechExpenseRepository> _logger;

        private const string LoggerName = "Technicians.EtechExpenseRepository";

        public EtechExpenseRepository(
            IConfiguration configuration,
            ErrorLogRepository errorLog,
            ILogger<EtechExpenseRepository> logger)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
            _errorLog = errorLog;
            _logger = logger;
        }

        public List<EtechExpenseDto> GetEtechExpenses(DateTime dt1, DateTime dt2, string techName, int tableIndex)
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    var parameters = new DynamicParameters();
                    parameters.Add("@dt1", dt1);
                    parameters.Add("@dt2", dt2);
                    parameters.Add("@techName", techName);
                    parameters.Add("@TableIdx", tableIndex);

                    var result = con.Query<EtechExpenseDto>(
                        "GetEtechExpenses",
                        parameters,
                        commandType: CommandType.StoredProcedure).ToList();

                    _logger.LogInformation("Retrieved {Count} etech expenses for TechName: {TechName}, TableIndex: {TableIndex}", 
                        result.Count, techName, tableIndex);
                    return result;
                }
            }
            catch (Exception ex)
            {
                _errorLog.LogErrorAsync(LoggerName, ex, "GetEtechExpenses", $"{techName}|{tableIndex}").Wait();
                _logger.LogError(ex, "Error retrieving etech expenses for TechName: {TechName}, TableIndex: {TableIndex}", 
                    techName, tableIndex);
                throw;
            }
        }

        public async Task<IEnumerable<MobileReceiptDto>> GetMobileReceiptsAsync(string callNbr, string techId)
        {
            try
            {
                var receipts = new List<MobileReceiptDto>();

                await using var connection = new SqlConnection(_connectionString);
                await connection.OpenAsync();

                using var cmd = new SqlCommand("GetMobileReceipts", connection)
                {
                    CommandType = CommandType.StoredProcedure
                };

                cmd.Parameters.AddWithValue("@CallNbr", callNbr);
                cmd.Parameters.AddWithValue("@TechID", techId);

                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var receiptBytes = reader["Receipt"] == DBNull.Value
                        ? null
                        : (byte[])reader["Receipt"];

                    receipts.Add(new MobileReceiptDto
                    {
                        CallNbr = reader["CallNbr"]?.ToString(),
                        CodeDesc = reader["CodeDesc"]?.ToString(),
                        TechPaid = reader["TechPaid"] == DBNull.Value ? null : Convert.ToDecimal(reader["TechPaid"]),
                        CompanyPaid = reader["CompanyPaid"] == DBNull.Value ? null : Convert.ToDecimal(reader["CompanyPaid"]),
                        ExpenseTableIndex = reader["ExpenseTableIndex"] == DBNull.Value ? 0 : Convert.ToInt32(reader["ExpenseTableIndex"]),
                        ReceiptBase64 = receiptBytes == null ? null : Convert.ToBase64String(receiptBytes)
                    });
                }

                _logger.LogInformation("Retrieved {Count} mobile receipts for CallNbr: {CallNbr}, TechId: {TechId}", 
                    receipts.Count, callNbr, techId);
                return receipts;
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetMobileReceiptsAsync", $"{callNbr}|{techId}");
                _logger.LogError(ex, "Error retrieving mobile receipts for CallNbr: {CallNbr}, TechId: {TechId}", 
                    callNbr, techId);
                throw;
            }
        }

        public List<EtechExpenseDto> GetExpenseDetail(string callNbr, int tableIndex)
        {
            try
            {
                using (var con = new SqlConnection(_connectionString))
                {
                    var parameters = new DynamicParameters();
                    parameters.Add("@CallId", callNbr);
                    parameters.Add("@intIndex", tableIndex);

                    var result = con.Query<EtechExpenseDto>(
                        "etechExpenseDetail",
                        parameters,
                        commandType: CommandType.StoredProcedure).ToList();

                    _logger.LogInformation("Retrieved {Count} expense details for CallNbr: {CallNbr}, TableIndex: {TableIndex}", 
                        result.Count, callNbr, tableIndex);
                    return result;
                }
            }
            catch (Exception ex)
            {
                _errorLog.LogErrorAsync(LoggerName, ex, "GetExpenseDetail", $"{callNbr}|{tableIndex}").Wait();
                _logger.LogError(ex, "Error retrieving expense details for CallNbr: {CallNbr}, TableIndex: {TableIndex}", 
                    callNbr, tableIndex);
                throw;
            }
        }

        public async Task<string> EnableExpenses(string callNbr)
        {
            try
            {
                const string query = @"Update EtechJobUpload set Uploaded='N',Type='Expense1' where CallNbr=@CallNbr and Type='Expense'";

                await using var conn = new SqlConnection(_connectionString);
                await conn.OpenAsync();

                await using var cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@CallNbr", callNbr);

                int rowsAffected = await cmd.ExecuteNonQueryAsync();

                _logger.LogInformation("Enabled expenses for CallNbr: {CallNbr}, Rows affected: {RowsAffected}", 
                    callNbr, rowsAffected);
                return "Enabled Expenses Successfully";
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "EnableExpenses", callNbr);
                _logger.LogError(ex, "Error enabling expenses for CallNbr: {CallNbr}", callNbr);
                return $"Error: {ex.Message}";
            }
        }

        public async Task<string> CanTechAddFoodExpensesAsync(
            string callNbr,
            string techName,
            decimal expAmount,
            decimal currentAmount,
            string type,
            DateTime date)
        {
            try
            {
                using var conn = new SqlConnection(_connectionString);
                await conn.OpenAsync();

                var query = "SELECT dbo.CheckValidFoodExpenses(@CallNbr, @TechName, @ExpAmount, @CurrentAmount, @Type, @Date)";
                using var cmd = new SqlCommand(query, conn);

                cmd.Parameters.AddWithValue("@CallNbr", callNbr ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@TechName", techName ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ExpAmount", expAmount);
                cmd.Parameters.AddWithValue("@CurrentAmount", currentAmount);
                cmd.Parameters.AddWithValue("@Type", type ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Date", date);

                var result = await cmd.ExecuteScalarAsync();
                var returnValue = result?.ToString() ?? string.Empty;

                _logger.LogInformation("Checked food expense validity for CallNbr: {CallNbr}, TechName: {TechName}, Result: {Result}", 
                    callNbr, techName, returnValue);
                return returnValue;
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "CanTechAddFoodExpensesAsync", $"{callNbr}|{techName}");
                _logger.LogError(ex, "Error checking food expense validity for CallNbr: {CallNbr}, TechName: {TechName}", 
                    callNbr, techName);
                throw;
            }
        }

        public string AllowedAmountForFoodExpenses(string callNbr, string techName)
        {
            string result = string.Empty;

            try
            {
                using (SqlConnection con = new SqlConnection(_connectionString))
                {
                    con.Open();
                    string query = $"select dbo.AllowedAmountForFoodExpenses('{callNbr}', '{techName}')";
                    using (SqlCommand cmd = new SqlCommand(query, con))
                    {
                        var dbResult = cmd.ExecuteScalar();
                        result = dbResult != null ? dbResult.ToString() : string.Empty;
                    }
                }

                _logger.LogInformation("Retrieved allowed food expense amount for CallNbr: {CallNbr}, TechName: {TechName}, Amount: {Amount}", 
                    callNbr, techName, result);
            }
            catch (Exception ex)
            {
                _errorLog.LogErrorAsync(LoggerName, ex, "AllowedAmountForFoodExpenses", $"{callNbr}|{techName}").Wait();
                _logger.LogError(ex, "Error retrieving allowed food expense amount for CallNbr: {CallNbr}, TechName: {TechName}", 
                    callNbr, techName);
                result = string.Empty;
            }

            return result;
        }
    }
}
