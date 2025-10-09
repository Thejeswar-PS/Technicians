using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using System.Data;
using System.Threading.Tasks;

namespace Technicians.Api.Repository
{
    public class CheckSaveAsDraftEquipRepository
    {
        private readonly string _connectionString;

        public CheckSaveAsDraftEquipRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<string> CheckSaveAsDraftEquipAsync(string callNbr)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var parameters = new DynamicParameters();
                parameters.Add("@CallNbr", callNbr, DbType.String, ParameterDirection.Input);
                var result = await connection.ExecuteScalarAsync<string>(
                    "[dbo].[CheckSaveAsDraftEquip]",
                    parameters,
                    commandType: CommandType.StoredProcedure);
                return result;
            }
        }
    }
}