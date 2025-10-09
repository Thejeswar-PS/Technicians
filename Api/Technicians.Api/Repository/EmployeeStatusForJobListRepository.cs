using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class EmployeeStatusForJobListRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public EmployeeStatusForJobListRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<EmployeeStatusForJobListDto> GetEmployeeStatusForJobListAsync(string adUserId)
        {
            using (var connection = new SqlConnection(_connectionString))
            using (var command = new SqlCommand("GetEmployeeStatusForJobList", connection))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@ADUserID", adUserId);

                await connection.OpenAsync();

                using (var reader = await command.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                    {
                        return new EmployeeStatusForJobListDto
                        {
                            EmpID = reader["EmpID"].ToString(),
                            Status = reader["Status"].ToString()
                        };
                    }
                }
            }
            return null;
        }
    }
}