using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query.Internal;
using Microsoft.Extensions.Configuration;
using System.Data;
using System.Data.Common;
using System.Xml.Linq;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class ReconciliationEmailNotesRepository
    {
        private readonly string _connectionString;

        public ReconciliationEmailNotesRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<IEnumerable<ReconciliationEmailNoteDto>> GetReconciliationEmailNotesAsync(string callNbr)
        {
            var sql = "EXEC dbo.GetReconciliationEmailNotes @CallNbr";
            using (var connection = new SqlConnection(_connectionString))
            {
                return await connection.QueryAsync<ReconciliationEmailNoteDto>(sql, new { CallNbr = callNbr });
            }
        }
    }
}
