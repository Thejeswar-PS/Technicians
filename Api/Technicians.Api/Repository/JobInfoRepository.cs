using System.Data;
using Microsoft.Data.SqlClient;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class JobInfoRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;
        private readonly ErrorLogRepository _errorLog;
        private readonly ILogger<JobInfoRepository> _logger;

        private const string LoggerName = "Technicians.JobInfoRepository";

        public JobInfoRepository(
            IConfiguration configuration,
            ErrorLogRepository errorLog,
            ILogger<JobInfoRepository> logger)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
            _errorLog = errorLog;
            _logger = logger;
        }

        public async Task<List<JobInformationDto>> GetJobInformationAsync(string callNbr, string techName)
        {
            var jobList = new List<JobInformationDto>();

            try
            {
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

                _logger.LogInformation("Retrieved {Count} job information records for CallNbr: {CallNbr}, TechName: {TechName}", 
                    jobList.Count, callNbr, techName);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetJobInformationAsync", $"{callNbr}|{techName}");
                _logger.LogError(ex, "Error retrieving job information for CallNbr: {CallNbr}, TechName: {TechName}", callNbr, techName);
                throw;
            }

            return jobList;
        }

        public async Task<string> GetDeficiencyNotesAsync(string callNbr)
        {
            string defNotes = string.Empty;

            try
            {
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

                _logger.LogInformation("Retrieved deficiency notes for CallNbr: {CallNbr}", callNbr);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetDeficiencyNotesAsync", callNbr);
                _logger.LogError(ex, "Error retrieving deficiency notes for CallNbr: {CallNbr}", callNbr);
                throw;
            }

            return defNotes;
        }

        public async Task<List<string>> GetDistinctTechsAsync(string callNbr, string techName)
        {
            var techs = new List<string>();

            try
            {
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

                _logger.LogInformation("Retrieved {Count} distinct techs for CallNbr: {CallNbr}, excluding TechName: {TechName}", 
                    techs.Count, callNbr, techName);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetDistinctTechsAsync", $"{callNbr}|{techName}");
                _logger.LogError(ex, "Error retrieving distinct techs for CallNbr: {CallNbr}, TechName: {TechName}", callNbr, techName);
                throw;
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

                _logger.LogInformation("Successfully saved job reconciliation info for CallNbr: {CallNbr}, EquipID: {EquipID}", 
                    info.CallNbr, info.EquipID);
                return (true, "Job reconciliation info updated successfully.");
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "SaveUpdateJobReconciliationInfoAsync", $"{info.CallNbr}|{info.EquipID}");
                _logger.LogError(ex, "Error saving job reconciliation info for CallNbr: {CallNbr}, EquipID: {EquipID}", 
                    info.CallNbr, info.EquipID);
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

                _logger.LogInformation("Retrieved {Count} auto tech notes for CallNbr: {CallNbr}, EquipID: {EquipID}, EquipType: {EquipType}", 
                    results.Count, callNbr, equipId, equipType);
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetAutoTechNotesByEquipTypeAsync", $"{callNbr}|{equipId}|{equipType}");
                _logger.LogError(ex, "Error retrieving auto tech notes for CallNbr: {CallNbr}, EquipID: {EquipID}, EquipType: {EquipType}", 
                    callNbr, equipId, equipType);
                // Return empty list on error instead of throwing
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

                _logger.LogInformation("Successfully updated job information for CallNbr: {CallNbr}, TechName: {TechName}", 
                    jobInfo.CallNbr, jobInfo.TechName);
                return (true, "Job information updated successfully.");
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "UpdateJobInformationAsync", $"{jobInfo.CallNbr}|{jobInfo.TechName}");
                _logger.LogError(ex, "Error updating job information for CallNbr: {CallNbr}, TechName: {TechName}", 
                    jobInfo.CallNbr, jobInfo.TechName);
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

                _logger.LogInformation("Successfully inserted deficiency notes for CallNbr: {CallNbr}, TechName: {TechName}", 
                    request.CallNbr, request.TechName);
                return (true, "Deficiency notes inserted or updated successfully.");
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "InsertDeficiencyNotesAsync", $"{request.CallNbr}|{request.TechName}");
                _logger.LogError(ex, "Error inserting deficiency notes for CallNbr: {CallNbr}, TechName: {TechName}", 
                    request.CallNbr, request.TechName);
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

                _logger.LogInformation("Retrieved equipment details DataTable with {RowCount} rows for CallNbr: {CallNbr}", 
                    dt.Rows.Count, callNbr);
                return dt;
            }
            catch (Exception ex)
            {
                await _errorLog.LogErrorAsync(LoggerName, ex, "GetEquipInfoAsync", callNbr);
                _logger.LogError(ex, "Error retrieving equipment details for CallNbr: {CallNbr}", callNbr);
                return null;
            }
        }
    }
}
