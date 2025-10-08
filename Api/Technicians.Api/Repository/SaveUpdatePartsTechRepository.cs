using System.Data;
using Dapper;
using Microsoft.Data.SqlClient;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class SaveUpdatePartsTechRepository
    {
        private readonly string _connectionString;

        public SaveUpdatePartsTechRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }
        public async Task SaveOrUpdatePartsTechAsync(SaveUpdatePartsTechDto dto)
        {
            using (var conn = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand("SaveUpdatePartsTech", conn))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Service_Call_ID", dto.Service_Call_ID);
                cmd.Parameters.AddWithValue("@SCID_Inc", dto.SCID_Inc);
                cmd.Parameters.AddWithValue("@Part_Num", dto.Part_Num ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@DC_Part_Num", dto.DC_Part_Num ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@TotalQty", dto.TotalQty);
                cmd.Parameters.AddWithValue("@Description", dto.Description ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@InstalledParts", dto.InstalledParts);
                cmd.Parameters.AddWithValue("@UnusedParts", dto.UnusedParts);
                cmd.Parameters.AddWithValue("@FaultyParts", dto.FaultyParts);
                cmd.Parameters.AddWithValue("@Unused_Desc", dto.Unused_Desc ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Faulty_Desc", dto.Faulty_Desc ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Manufacturer", dto.Manufacturer ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ModelNo", dto.ModelNo ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@PartSource", dto.PartSource);
                cmd.Parameters.AddWithValue("@Maint_Auth_ID", dto.Maint_Auth_ID ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@IsReceived", dto.IsReceived ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@SaveSource", dto.SaveSource ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@IsBrandNew", dto.IsBrandNew);
                cmd.Parameters.AddWithValue("@IsPartsLeft", dto.IsPartsLeft);
                cmd.Parameters.AddWithValue("@TrackingInfo", dto.TrackingInfo ?? (object)DBNull.Value);

                await conn.OpenAsync();
                await cmd.ExecuteNonQueryAsync();
            }
        }
    }
}
