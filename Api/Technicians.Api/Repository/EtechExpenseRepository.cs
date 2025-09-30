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



    }
}
