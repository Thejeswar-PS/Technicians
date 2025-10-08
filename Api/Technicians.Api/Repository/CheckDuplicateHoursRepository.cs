using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class CheckDuplicateHoursRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public CheckDuplicateHoursRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<string> CheckDuplicateHoursAsync(string callNbr, string techName)
        {
            using var conn = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand("CheckDuplicateHours", conn)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@CallNbr", callNbr ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@TechName", techName ?? (object)DBNull.Value);

            await conn.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return reader[0]?.ToString() ?? "None";
            }
            return "None";
        }
    }
}
