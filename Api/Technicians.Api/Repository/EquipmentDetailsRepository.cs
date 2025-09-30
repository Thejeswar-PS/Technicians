using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;


namespace Technicians.Api.Repository
{
    public class EquipmentDetailsRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public EquipmentDetailsRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }

        public List<EquipmentDetailsDto> GetEquipmentDetails(string callNbr)
        {
            using (var con = new SqlConnection(_connectionString))
            {
                var parameters = new DynamicParameters();
                parameters.Add("@CallNbr", callNbr);

                return con.Query<EquipmentDetailsDto>(
                    "GetEquipmentDetails",
                    parameters,
                    commandType: CommandType.StoredProcedure).ToList();


            }

        }
    }
}
