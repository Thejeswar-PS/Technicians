using System.Data;
using Microsoft.Data.SqlClient;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class JobInfoRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public JobInfoRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<List<JobInformationDto>> GetJobInformationAsync(string callNbr, string techName)
        {
            var jobList = new List<JobInformationDto>();

            using var conn = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand("etechJobInfo", conn)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@CallId", callNbr);
            cmd.Parameters.AddWithValue("@TechName", techName);

            await conn.OpenAsync();

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                jobList.Add(new JobInformationDto
                {
                    CallNbr = reader["CallNbr"].ToString(),
                    Status = reader["Status"].ToString(),
                    CustNmbr = reader["CustNmbr"].ToString(),
                    Ponumber = reader["Ponumber"].ToString(),
                    TechName = reader["TechName"].ToString(),
                    CustName = reader["CustName"].ToString(),
                    Addr1 = reader["Addr1"].ToString(),
                    TechCell = reader["TechCell"].ToString(),
                    TechPhone = reader["TechPhone"].ToString(),
                    Contact = reader["Contact"].ToString(),
                    TechEmail = reader["TechEmail"].ToString(),
                    ContactPhone = reader["ContactPhone"].ToString(),
                    AccMgr = reader["AccMgr"].ToString(),
                    StrtDate = reader["StrtDate"] == DBNull.Value ? null : (DateTime?)reader["StrtDate"],
                    StrtTime = reader["StrtTime"] == DBNull.Value ? null : (DateTime?)reader["StrtTime"],
                    SvcDescr = reader["SvcDescr"].ToString(),
                    RecordNotes = reader["Record_Notes"].ToString(),
                    PmVisualNotes = reader["PmVisualNotes"].ToString(),
                    QtePriority = reader["QtePriority"].ToString(),
                    ContType = reader["ContType"].ToString(),
                    Country = reader["COUNTRY"].ToString(),
                    DefCheck = Convert.ToInt32(reader["DefCheck"])
                });
            }

            return jobList;
        }

        public async Task<string> GetDeficiencyNotesAsync(string callNbr)
        {
            string defNotes = string.Empty;

            using var conn = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand("GetDeficiencyNotes", conn)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@CallNbr", callNbr);

            await conn.OpenAsync();

            var result = await cmd.ExecuteScalarAsync();
            if (result != null && result != DBNull.Value)
                defNotes = result.ToString();

            return defNotes;
        }

        public async Task<List<string>> GetDistinctTechsAsync(string callNbr, string techName)
        {
            var techs = new List<string>();

            var query = @"SELECT DISTINCT TechName 
                  FROM ETechJobList 
                  WHERE TechName <> @TechName AND CallNbr = @CallNbr";

            using var conn = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@CallNbr", callNbr);
            cmd.Parameters.AddWithValue("@TechName", techName);

            await conn.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                techs.Add(reader["TechName"].ToString());
            }

            return techs;
        }

        public async Task<(bool Success, string Message)> SaveUpdateJobReconciliationInfoAsync(EquipReconciliationInfo info, string modifiedBy)
        {
            try
            {
                using var conn = new SqlConnection(_connectionString);
                using var cmd = new SqlCommand("SaveUpdateJobReconciliation", conn)
                {
                    CommandType = CommandType.StoredProcedure
                };

                cmd.Parameters.AddWithValue("@CallNbr", info.CallNbr ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@EquipID", info.EquipID);
                cmd.Parameters.AddWithValue("@NewEquipment", info.NewEquipment ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@EquipmentNotes", info.EquipmentNotes ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ModifiedBy", modifiedBy ?? "System");

                await conn.OpenAsync();
                await cmd.ExecuteNonQueryAsync();

                return (true, "Job reconciliation info updated successfully.");
            }
            catch (Exception ex)
            {
                return (false, ex.Message);
            }
        }

        public async Task<List<AutoTechNoteDto>> GetAutoTechNotesByEquipTypeAsync(string callNbr, int equipId, string equipType)
        {
            var results = new List<AutoTechNoteDto>();

            try
            {
                using var conn = new SqlConnection(_connectionString);
                using var cmd = new SqlCommand("GetAutoTechNotesByEquipType", conn)
                {
                    CommandType = CommandType.StoredProcedure
                };

                cmd.Parameters.AddWithValue("@CallNbr", callNbr);
                cmd.Parameters.AddWithValue("@EquipID", equipId);
                cmd.Parameters.AddWithValue("@EquipType", equipType);

                await conn.OpenAsync();

                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    results.Add(new AutoTechNoteDto
                    {
                        Counter = reader["Counter"] != DBNull.Value ? Convert.ToInt32(reader["Counter"]) : 0,
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
            catch (Exception ex)
            {
                // Log ex.Message if needed
                return new List<AutoTechNoteDto>();
            }

            return results;
        }

        public async Task<(bool Success, string Message)> UpdateJobInformationAsync(UpdateJobRequest jobInfo, String empId)
        {
            try
            {
                using var conn = new SqlConnection(_connectionString);
                using var cmd = new SqlCommand("UpdateJobInformation", conn)
                {
                    CommandType = CommandType.StoredProcedure
                };

                cmd.Parameters.AddWithValue("@CallNbr", jobInfo.CallNbr ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Pmvisualnotes", jobInfo.Pmvisualnotes ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@SvcDescr", jobInfo.SvcDescr ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@techname", jobInfo.TechName ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@QtePriority", jobInfo.QtePriority ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@chkNotes", jobInfo.ChkNotes);
                cmd.Parameters.AddWithValue("@LastModifiedBy", empId);

                await conn.OpenAsync();
                await cmd.ExecuteNonQueryAsync();

                return (true, "Job information updated successfully.");
            }
            catch (Exception ex)
            {
                return (false, $"Error updating job information: {ex.Message}");
            }
        }

        public async Task<(bool Success, string Message)> InsertDeficiencyNotesAsync(InsertDeficiencyNotesRequest request)
        {
            try
            {
                using var conn = new SqlConnection(_connectionString);
                using var cmd = new SqlCommand("InsertDeficiencyNotes", conn)
                {
                    CommandType = CommandType.StoredProcedure
                };

                cmd.Parameters.AddWithValue("@CallNbr", request.CallNbr ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@TechName", request.TechName ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@SystemNotes", request.Notes ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@NotesType", request.NoteType ?? (object)DBNull.Value);

                await conn.OpenAsync();
                await cmd.ExecuteNonQueryAsync();

                return (true, "Deficiency notes inserted or updated successfully.");
            }
            catch (Exception ex)
            {
                return (false, $"Error inserting deficiency notes: {ex.Message}");
            }
        }

        public async Task<DataTable?> GetEquipInfoAsync(string callNbr)
        {
            try
            {
                using var conn = new SqlConnection(_connectionString);
                using var cmd = new SqlCommand("GetEquipmentDetails", conn)
                {
                    CommandType = CommandType.StoredProcedure
                };
                cmd.Parameters.AddWithValue("@CallNbr", callNbr);

                await conn.OpenAsync();

                var dt = new DataTable();
                using var reader = await cmd.ExecuteReaderAsync();
                dt.Load(reader);

                return dt;
            }
            catch (Exception)
            {
                // optional: log the error
                return null;
            }
        }

    }
}
