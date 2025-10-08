using Microsoft.Extensions.Configuration;
using System.Data;
using System.Data.SqlClient;
using System.Threading.Tasks;
using Technicians.Api.Models;
using Dapper;

namespace Technicians.Api.Repository
{
    public class DeficiencyNotesRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public DeficiencyNotesRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }
        public async Task InsertOrUpdateDeficiencyNoteAsync(DeficiencyNoteRequestDto noteRequest)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                using (var cmd = new SqlCommand("InsertDeficiencyNotes", connection))
                {
                    cmd.CommandType = CommandType.StoredProcedure;
                    cmd.Parameters.AddWithValue("@CallNbr", noteRequest.CallNbr);
                    cmd.Parameters.AddWithValue("@TechName", noteRequest.TechName);
                    cmd.Parameters.AddWithValue("@SystemNotes", noteRequest.SystemNotes);
                    cmd.Parameters.AddWithValue("@NotesType", noteRequest.NotesType);

                    await connection.OpenAsync();
                    await cmd.ExecuteNonQueryAsync();
                }
            }
        }
    }
}
