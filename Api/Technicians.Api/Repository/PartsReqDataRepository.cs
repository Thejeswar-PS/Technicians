//using Dapper;
//using Microsoft.Data.SqlClient;
//using Microsoft.EntityFrameworkCore;
//using Microsoft.EntityFrameworkCore.Query.Internal;
//using Microsoft.Extensions.Configuration;
//using System.Data;
//using System.Xml.Linq;
//using Technicians.Api.Models;

//namespace Technicians.Api.Repository
//{
//    public class PartsReqDataRepository
//    {
//        private readonly string _connectionString;

//        public PartsReqDataRepository(IConfiguration configuration)
//        {
//            _connectionString = configuration.GetConnectionString("DefaultConnection");
//        }

//        public async Task<IEnumerable<PartsReqDataDto>> GetPartsReqDataAsync(string callNbr, int scidInc)
//        {
//            using (var conn = new SqlConnection(_connectionString))
//            {
//                var parameters = new DynamicParameters();
//                parameters.Add("@CallNbr", callNbr);
//                parameters.Add("@SCID_Inc", scidInc);

//                var result = await conn.QueryAsync<PartsReqDataDto>(
//                    "GetPartsReqData",
//                    parameters,
//                    commandType: CommandType.StoredProcedure
//                );

//                return result;
//            }
//        }
//    }
//}
