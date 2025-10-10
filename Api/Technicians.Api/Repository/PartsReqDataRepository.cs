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
    public class PartsReqDataRepository
    {
        private readonly string _connectionString;

        public PartsReqDataRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<IEnumerable<PartsReqDataDto>> GetPartsReqData(string callNbr, int scidInc)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                var parameters = new DynamicParameters();
                parameters.Add("@CallNbr", callNbr, DbType.String);
                parameters.Add("@SCID_Inc", scidInc, DbType.Int32);

                return await conn.QueryAsync<PartsReqDataDto>(
                    "[dbo].[GetPartsReqData]",
                    parameters,
                    commandType: CommandType.StoredProcedure
                );
            }
        }
    }
}
