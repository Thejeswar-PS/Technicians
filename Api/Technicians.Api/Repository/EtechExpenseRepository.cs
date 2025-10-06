using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

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






    }
}
