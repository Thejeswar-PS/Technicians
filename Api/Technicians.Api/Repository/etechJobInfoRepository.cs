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
    public class etechJobInfoRepository
    {

        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public etechJobInfoRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");

        }

        public async Task<etechJobInfoDto?> GetEtechJobInfoAsync(string callId, string techName)
        {
            using (var connection = new SqlConnection(_connectionString))
            using (var command = new SqlCommand("dbo.etechJobInfo", connection))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@CallId", callId);
                command.Parameters.AddWithValue("@TechName", techName);

                await connection.OpenAsync();
                using (var reader = await command.ExecuteReaderAsync())
                {
                    if (await reader.ReadAsync())
                    {
                        return new etechJobInfoDto
                        {
                            CallNbr = reader["CallNbr"]?.ToString(),
                            Status = reader["Status"]?.ToString(),
                            CustNmbr = reader["CustNmbr"]?.ToString(),
                            Ponumber = reader["Ponumber"]?.ToString(),
                            TechName = reader["TechName"]?.ToString(),
                            CustName = reader["CustName"]?.ToString(),
                            Addr1 = reader["Addr1"]?.ToString(),
                            TechCell = reader["TechCell"]?.ToString(),
                            TechPhone = reader["TechPhone"]?.ToString(),
                            Contact = reader["Contact"]?.ToString(),
                            TechEmail = reader["TechEmail"]?.ToString(),
                            ContactPhone = reader["ContactPhone"]?.ToString(),
                            AccMgr = reader["AccMgr"]?.ToString(),
                            StrtDate = reader["StrtDate"] as DateTime?,
                            StrtTime = reader["StrtTime"] as DateTime?,
                            SvcDescr = reader["SvcDescr"]?.ToString(),
                            RecordNotes = reader["Record_Notes"]?.ToString(),
                            PmVisualNotes = reader["pmVisualNotes"]?.ToString(),
                            QtePriority = reader["QtePriority"]?.ToString(),
                            ContType = reader["ContType"]?.ToString(),
                            Country = reader["Country"]?.ToString(),
                            DefCheck = reader["DefCheck"] != DBNull.Value && Convert.ToBoolean(reader["DefCheck"])
                        };
                    }
                }
            }

            return null; // Not found
        }

        //Get Auto Tech Notes by Equip Type
        public async Task<List<AutoTechNotesByEquipTypeDto>> GetAutoTechNotesAsync(string callNbr, int equipId, string equipType)
        {
            var results = new List<AutoTechNotesByEquipTypeDto>();

            using (var connection = new SqlConnection(_connectionString))
            using (var command = new SqlCommand("dbo.GetAutoTechNotesByEquipType", connection))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@CallNbr", callNbr);
                command.Parameters.AddWithValue("@EquipID", equipId);
                command.Parameters.AddWithValue("@EquipType", equipType);

                await connection.OpenAsync();
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        results.Add(new AutoTechNotesByEquipTypeDto
                        {
                            EquipNo = reader["EquipNo"]?.ToString(),
                            BatteryID = reader["BatteryID"] != DBNull.Value ? Convert.ToInt32(reader["BatteryID"]) : 0,
                            ColumnName = reader["ColumnName"]?.ToString(),
                            Deficiency = reader["Deficiency"]?.ToString(),
                            Action = reader["Action"]?.ToString(),
                            Status = reader["Status"]?.ToString(),
                            ColumnSection = reader["ColumnSection"]?.ToString(),
                            Tag = reader["Tag"]?.ToString(),
                            Location = reader["Location"]?.ToString(),
                            SerialNo = reader["SerialNo"]?.ToString()
                        });
                    }
                }
            }

            return results;
        }

        //3. Get Deficiency Notes

        public async Task<DeficiencyNoteDto> GetDeficiencyNoteAsync(string callNbr)
        {
            var result = new DeficiencyNoteDto();

            using (var connection = new SqlConnection(_connectionString))
            using (var command = new SqlCommand("dbo.GetDeficiencyNotes", connection))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@CallNbr", callNbr);

                await connection.OpenAsync();
                var reader = await command.ExecuteReaderAsync();

                if (await reader.ReadAsync())
                {
                    result.Notes = reader.GetString(0);
                }
            }

            return result;
        }


        //4. Update Job Information
        public async Task<bool> UpdateJobInfoAsync(JobInformationDto dto)
        {
            using (var connection = new SqlConnection(_connectionString))
            using (var command = new SqlCommand("dbo.UpdateJobInformation", connection))
            {
                command.CommandType = CommandType.StoredProcedure;

                command.Parameters.AddWithValue("@CallNbr", dto.CallNbr);
                command.Parameters.AddWithValue("@TechName", dto.TechName);
                command.Parameters.AddWithValue("@Pmvisualnotes", dto.PmVisualNotes ?? (object)DBNull.Value);
                // command.Parameters.AddWithValue("@SvcDescr", dto.SvcDescr ?? (object)DBNull.Value); // if needed
                command.Parameters.AddWithValue("@QtePriority", dto.QtePriority ?? (object)DBNull.Value);
                //command.Parameters.AddWithValue("@chkNotes", dto.ChkNotes);
                //command.Parameters.AddWithValue("@LastModifiedBy", dto.LastModifiedBy ?? (object)DBNull.Value);

                await connection.OpenAsync();
                var rows = await command.ExecuteNonQueryAsync();

                return rows > 0;
            }
        }
    }
}
