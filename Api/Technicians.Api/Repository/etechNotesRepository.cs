using Dapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Threading.Tasks;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class etechNotesRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public etechNotesRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<IEnumerable<etechNotesDto>> GetEtechNotesAsync(string callId, string techName)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var parameters = new { CallId = callId, TechName = techName };
                var result = await connection.QueryAsync<etechNotesDto>(
                    "dbo.etechNotes", parameters, commandType: CommandType.StoredProcedure);
                return result;
            }
        }
    }
}
