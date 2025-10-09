using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using Technicians.Api.Models;


namespace Technicians.Api.Repository
{
    public class EquipmentDetailsRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public EquipmentDetailsRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }


        public List<EquipmentDetailsDto> GetEquipmentDetails(string callNbr)
        {
            using (var con = new SqlConnection(_connectionString))
            {
                var parameters = new DynamicParameters();
                parameters.Add("@CallNbr", callNbr);

                return con.Query<EquipmentDetailsDto>(
                    "GetEquipmentDetails",
                    parameters,
                    commandType: CommandType.StoredProcedure).ToList();


            }

        }

        // 2. GetUploadedInfo
        public async Task<List<UploadedInfoDto>> GetUploadedInfoAsync(string callNbr, string techId)
        {
            using var connection = new SqlConnection(_connectionString);
            var parameters = new DynamicParameters();
            parameters.Add("@CallNbr", callNbr);
            parameters.Add("@TechID", techId);

            var result = await connection.QueryAsync<UploadedInfoDto>(
                "GetUploadedInfo",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return result.ToList();
        }

        // 3. GetEmployeeStatusForJobList
        public async Task<EmployeeStatusForJobListDto> GetEmployeeStatusForJobListAsync(string adUserId)
        {
            using var connection = new SqlConnection(_connectionString);
            using var command = new SqlCommand("GetEmployeeStatusForJobList", connection)
            {
                CommandType = CommandType.StoredProcedure
            };
            command.Parameters.AddWithValue("@ADUserID", adUserId);

            await connection.OpenAsync();

            using var reader = await command.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new EmployeeStatusForJobListDto
                {
                    EmpID = reader["EmpID"].ToString(),
                    Status = reader["Status"].ToString()
                };
            }
            return null;
        }

        // 4. UploadJobToGP
        public async Task<int> UploadJobToGPAsync(string callNbr, string strUser, string loggedInUser)
        {
            using var conn = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand("UploadJobToGP", conn)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@CallNbr", callNbr ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@strUser", strUser ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@LoggedInUser", loggedInUser ?? (object)DBNull.Value);

            await conn.OpenAsync();
            var result = await cmd.ExecuteScalarAsync(); // Or ExecuteNonQueryAsync if no return value
            return result != null ? Convert.ToInt32(result) : 0;
        }

        // 5. UploadExpenses
        public async Task<int> UploadExpensesAsync(EtechUploadExpensesDto request)
        {
            using var conn = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand("EtechUploadExpenses", conn)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@CallNbr", request.CallNumber);
            cmd.Parameters.AddWithValue("@strUser", request.User);

            await conn.OpenAsync();
            var result = await cmd.ExecuteNonQueryAsync();
            return result;
        }

        // 6. CheckExpUploadElgibility
        public async Task<string> CheckExpUploadElgibilityAsync(string callNbr)
        {
            using var conn = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand("CheckExpUploadElgibility", conn)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@CallNbr", callNbr ?? (object)DBNull.Value);

            await conn.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return reader["Result"]?.ToString() ?? "No result found.";
            }
            return "No result found.";
        }

        // 7. CheckDuplicateHours
        public async Task<string> CheckDuplicateHoursAsync(string callNbr, string techName)
        {
            using var conn = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand("CheckDuplicateHours", conn)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@CallNbr", callNbr ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@TechName", techName ?? (object)DBNull.Value);

            await conn.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return reader[0]?.ToString() ?? "None";
            }
            return "None";
        }

        // 8. GetEtechNotes
        public async Task<IEnumerable<etechNotesDto>> GetEtechNotesAsync(string callId, string techName)
        {
            using var connection = new SqlConnection(_connectionString);
            var parameters = new { CallId = callId, TechName = techName };
            var result = await connection.QueryAsync<etechNotesDto>(
                "dbo.etechNotes", parameters, commandType: CommandType.StoredProcedure);
            return result;
        }

        // 9. GetReconciliationEmailNotes
        public async Task<IEnumerable<ReconciliationEmailNoteDto>> GetReconciliationEmailNotesAsync(string callNbr)
        {
            var sql = "EXEC dbo.GetReconciliationEmailNotes @CallNbr";
            using var connection = new SqlConnection(_connectionString);
            return await connection.QueryAsync<ReconciliationEmailNoteDto>(sql, new { CallNbr = callNbr });
        }

        // 10. InsertOrUpdateDeficiencyNote
        public async Task InsertOrUpdateDeficiencyNoteAsync(DeficiencyNoteRequestDto noteRequest)
        {
            using var connection = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand("InsertDeficiencyNotes", connection)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@CallNbr", noteRequest.CallNbr);
            cmd.Parameters.AddWithValue("@TechName", noteRequest.TechName);
            cmd.Parameters.AddWithValue("@SystemNotes", noteRequest.SystemNotes);
            cmd.Parameters.AddWithValue("@NotesType", noteRequest.NotesType);

            await connection.OpenAsync();
            await cmd.ExecuteNonQueryAsync();
        }

        // 11. CheckSaveAsDraftEquip
        public async Task<string> CheckSaveAsDraftEquipAsync(string callNbr)
        {
            using var connection = new SqlConnection(_connectionString);
            var parameters = new DynamicParameters();
            parameters.Add("@CallNbr", callNbr, DbType.String, ParameterDirection.Input);
            var result = await connection.ExecuteScalarAsync<string>(
                "[dbo].[CheckSaveAsDraftEquip]",
                parameters,
                commandType: CommandType.StoredProcedure);
            return result;
        }
    }
}

