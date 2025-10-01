using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query.Internal;
using Microsoft.Extensions.Configuration;
using System.Data;
using System.Xml.Linq;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class PreJobSafetyListInfoRepository
    {
        private readonly string _connectionString;

        public PreJobSafetyListInfoRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<List<PreJobSafetyInfoDto>> GetPreJobSafetyListInfoAsync(string callNbr)
        {
            var result = new List<PreJobSafetyInfoDto>();
            using var conn = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand("GetPreJobSafetyListInfo", conn)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@CallNbr", callNbr ?? (object)DBNull.Value);

            await conn.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                // Map columns from reader to PreJobSafetyInfoDto
                var dto = new PreJobSafetyInfoDto
                {
                    CallNbr = reader["CallNbr"]?.ToString(),
                    // Map other columns similarly
                };
                result.Add(dto);
            }
            return result;
        }
    }
}
