using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class EtechUploadExpensesRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public EtechUploadExpensesRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<int> UploadExpensesAsync(EtechUploadExpensesDto request)
        {
            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand("EtechUploadExpenses", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@CallNbr", request.CallNumber);
                cmd.Parameters.AddWithValue("@strUser", request.User);

                await conn.OpenAsync();
                var result = await cmd.ExecuteNonQueryAsync();
                return result; 
            }
        }
    }
}
