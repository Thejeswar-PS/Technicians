using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Threading.Tasks;
using Technicians.Api.Models;
using System.Data;

namespace Technicians.Api.Repository
{
    public class UploadJobToGPRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public UploadJobToGPRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<int> UploadJobToGPAsync(string callNbr, string strUser, string loggedInUser)
        {
            using var conn = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand("UploadJobToGP", conn)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@CallNbr", callNbr ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@strUser", strUser ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@LoggedInUser", loggedInUser ?? (object)DBNull.Value);

            await conn.OpenAsync();
            var result = await cmd.ExecuteScalarAsync(); // Or ExecuteNonQueryAsync if no return value
            return result != null ? Convert.ToInt32(result) : 0;
        }
    }
}

