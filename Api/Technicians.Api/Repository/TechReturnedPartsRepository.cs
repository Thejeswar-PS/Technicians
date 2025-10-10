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
    public class TechReturnedPartsRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public TechReturnedPartsRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }

        public async Task SaveOrUpdateTechReturnedPartsAsync(TechReturnedPartsDto dto)
        {
            using (var connection = new SqlConnection(_connectionString))
            using (var command = new SqlCommand("SaveUpdateTechReturnedParts", connection))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@Service_Call_ID", dto.Service_Call_ID);
                command.Parameters.AddWithValue("@UnusedSentBack", dto.UnusedSentBack);
                command.Parameters.AddWithValue("@FaultySentBack", dto.FaultySentBack);
                command.Parameters.AddWithValue("@ReturnStatus", dto.ReturnStatus ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@ReturnNotes", dto.ReturnNotes ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@TruckStock", dto.TruckStock);
                command.Parameters.AddWithValue("@TechName", dto.TechName ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@Maint_Auth_ID", dto.Maint_Auth_ID ?? (object)DBNull.Value);

                await connection.OpenAsync();
                await command.ExecuteNonQueryAsync();
            }
        }
    }
}
