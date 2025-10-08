using Microsoft.Extensions.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Threading.Tasks;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class CheckExpUploadElgibilityRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public CheckExpUploadElgibilityRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<string> CheckExpUploadElgibilityAsync(string callNbr)
        {
            using var conn = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand("CheckExpUploadElgibility", conn)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@CallNbr", callNbr ?? (object)DBNull.Value);

            await conn.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return reader["Result"]?.ToString() ?? "No result found.";
            }
            return "No result found.";
        }
    }
}

