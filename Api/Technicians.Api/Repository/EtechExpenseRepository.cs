using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory.Database;

namespace Technicians.Api.Repository
{
    public class EtechExpenseRepository
    {
        private readonly IConfiguration _configuration;
        private readonly String _connectionString;

        public EtechExpenseRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }

        public List<EtechExpenseDto> GetEtechExpenses(DateTime dt1, DateTime dt2, string techName, int tableIndex)
        {
            using (var con = new SqlConnection(_connectionString))
            {
                var parameters = new DynamicParameters();
                parameters.Add("@dt1", dt1);
                parameters.Add("@dt2", dt2);
                parameters.Add("@techName", techName);
                parameters.Add("@TableIdx", tableIndex);

                return con.Query<EtechExpenseDto>(
                    "GetEtechExpenses",
                    parameters,
                    commandType: CommandType.StoredProcedure).ToList();
            }
        }


        public async Task<IEnumerable<MobileReceiptDto>> GetMobileReceiptsAsync(string callNbr, string techId)
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

            return receipts;
        }

        public List<EtechExpenseDto> GetExpenseDetail(string callNbr, int tableIndex)
        {
            using (var con = new SqlConnection(_connectionString))
            {
                var parameters = new DynamicParameters();
                parameters.Add("@CallId", callNbr);
                parameters.Add("@intIndex", tableIndex);

                return con.Query<EtechExpenseDto>(
                    "etechExpenseDetail",
                    parameters,
                    commandType: CommandType.StoredProcedure).ToList();
            }
        }

        public async Task<string> EnableExpenses(string callNbr)
        {
            const string query = @"Update EtechJobUpload set Uploaded='N',Type='Expense1' where CallNbr='"" + CallNbr + ""' and Type='Expense'";

            try
            {
                await using var conn = new SqlConnection(_connectionString);
                await conn.OpenAsync();

                await using var cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@CallNbr", callNbr);

                int rowsAffected = await cmd.ExecuteNonQueryAsync();

                //return rowsAffected > 0 ? "Enabled Expenses Successfully": "No matching record found.";
                return "Enabled Expenses Successfully";
            }
            catch (Exception ex)
            {
                // Log exception here if needed
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
            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();

            // Build query exactly like legacy (you can also parameterize if you want extra safety)
            var query = "SELECT dbo.CheckValidFoodExpenses(@CallNbr, @TechName, @ExpAmount, @CurrentAmount, @Type, @Date)";
            using var cmd = new SqlCommand(query, conn);

            cmd.Parameters.AddWithValue("@CallNbr", callNbr ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@TechName", techName ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@ExpAmount", expAmount);
            cmd.Parameters.AddWithValue("@CurrentAmount", currentAmount);
            cmd.Parameters.AddWithValue("@Type", type ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Date", date);

            var result = await cmd.ExecuteScalarAsync();
            return result?.ToString() ?? string.Empty;
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
            }
            catch (Exception ex)
            {
                // Optional: Log exception
                result = string.Empty;
            }

            return result;
        }






    }
}
