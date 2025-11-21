using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Data;
using System.Globalization;
using System.Text;
using Technicians.Api.Models;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory.Database;

namespace Technicians.Api.Repository
{
    public class EquipmentDetailsRepository
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EquipmentDetailsRepository> _logger;
        private readonly string _connectionString;

        public EquipmentDetailsRepository(IConfiguration configuration, ILogger<EquipmentDetailsRepository> logger)
        {
            _configuration = configuration;
            _logger = logger;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
        }


        // 1. GetEquipmentDetails
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
            try
            {
                await using var connection = new SqlConnection(_connectionString);
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
            catch (Exception)
            {
                return new List<UploadedInfoDto>(); // return empty list on error
            }
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

        // 4. UploadExpenses
        public async Task<int> UploadExpensesAsync(EtechUploadExpensesDto request)
        {
            await using var conn = new SqlConnection(_connectionString);
            await using var cmd = new SqlCommand("EtechUploadExpenses", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            cmd.Parameters.AddWithValue("@CallNbr", request.CallNbr);
            cmd.Parameters.AddWithValue("@strUser", request.TechName); // aligns with legacy getUID()

            await conn.OpenAsync();
            var result = await cmd.ExecuteNonQueryAsync();
            return result;
        }

        // 5. GetEtechNotes
        public async Task<IEnumerable<etechNotesDto>> GetEtechNotesAsync(string callNbr, string techName)
        {
            using var connection = new SqlConnection(_connectionString);
            var parameters = new { CallId = callNbr, TechName = techName };
            var result = await connection.QueryAsync<etechNotesDto>(
                "dbo.etechNotes", parameters, commandType: CommandType.StoredProcedure);
            return result;
        }

        // 6. GetReconciliationEmailNotes
        public async Task<IEnumerable<ReconciliationEmailNoteDto>> GetReconciliationEmailNotesAsync(string callNbr)
        {
            var sql = "EXEC dbo.GetReconciliationEmailNotes @CallNbr";
            using var connection = new SqlConnection(_connectionString);
            return await connection.QueryAsync<ReconciliationEmailNoteDto>(sql, new { CallNbr = callNbr });
        }

        // 7. InsertOrUpdateDeficiencyNote
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

        // 8. CheckSaveAsDraftEquip
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

        //9. IsPreJobSafetyDone
        public async Task<int> IsPreJobSafetyDone(string callNbr)
        {
            const string query = "SELECT dbo.IsPreJobSafetyDone(@CallNbr)";

            try
            {
                await using var conn = new SqlConnection(_connectionString);
                await conn.OpenAsync();

                await using var cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@CallNbr", callNbr);

                var result = await cmd.ExecuteScalarAsync();
                return Convert.ToInt32(result);
            }
            catch (Exception)
            {
                return 0;
            }
        }

        //10. CheckCapsPartsInfo
        public async Task<int> CheckCapsPartsInfoAsync(string callNbr, int equipId)
        {
            const string query = "SELECT dbo.aaCapPartsExist(@CallNbr, @EquipID)";

            try
            {
                await using var conn = new SqlConnection(_connectionString);
                await conn.OpenAsync();

                await using var cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@CallNbr", callNbr);
                cmd.Parameters.AddWithValue("@EquipID", equipId);

                var result = await cmd.ExecuteScalarAsync();
                return Convert.ToInt32(result);
            }
            catch (Exception)
            {
                return 0;
            }
        }

        //11. ReadingsExist
        public async Task<int> ReadingsExistAsync(string callNbr, int equipId, string equipType)
        {
            const string query = "SELECT dbo.aaReadingsExist(@CallNbr, @EquipID, @EquipType)";

            try
            {
                await using var conn = new SqlConnection(_connectionString);
                await conn.OpenAsync();

                await using var cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@CallNbr", callNbr);
                cmd.Parameters.AddWithValue("@EquipID", equipId);
                cmd.Parameters.AddWithValue("@EquipType", equipType);

                var result = await cmd.ExecuteScalarAsync();
                return Convert.ToInt32(result);
            }
            catch (Exception)
            {
                return 0;
            }
        }

        //12. IsPartsReturnedByTech
        public async Task<int> IsPartsReturnedByTechAsync(string callNbr)
        {
            const string query = "SELECT dbo.PartsReturnInfobyTech(@CallNbr)";

            try
            {
                await using var conn = new SqlConnection(_connectionString);
                await conn.OpenAsync();

                await using var cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@CallNbr", callNbr);

                var result = await cmd.ExecuteScalarAsync();
                return Convert.ToInt32(result);
            }
            catch (Exception)
            {
                return 0;
            }
        }

        //13. CheckDuplicateHours
        public async Task<string> CheckDuplicateHoursAsync(string callNbr, string techName)
        {
            try
            {
                await using var conn = new SqlConnection(_connectionString);
                await conn.OpenAsync();

                await using var cmd = new SqlCommand("CheckDuplicateHours", conn)
                {
                    CommandType = CommandType.StoredProcedure
                };

                cmd.Parameters.AddWithValue("@CallNbr", callNbr);
                cmd.Parameters.AddWithValue("@TechName", techName);

                var result = await cmd.ExecuteScalarAsync();
                return result?.ToString() ?? "None";
            }
            catch (Exception)
            {
                return "None";
            }
        }

        //14. UploadJobToGP
        public async Task<string> UploadJobToGPAsync(string callNbr, string techId, string loggedInUser)
        {
            try
            {
                await using var conn = new SqlConnection(_connectionString);
                await conn.OpenAsync();

                await using var cmd = new SqlCommand("UploadJobToGP", conn)
                {
                    CommandType = CommandType.StoredProcedure
                };

                cmd.Parameters.AddWithValue("@CallNbr", callNbr);
                cmd.Parameters.AddWithValue("@strUser", techId);
                cmd.Parameters.AddWithValue("@LoggedInUser", loggedInUser);

                await cmd.ExecuteNonQueryAsync();

                return "Job uploaded successfully.";
            }
            catch (Exception ex)
            {
                return $"Error uploading job: {ex.Message}";
            }
        }

        //15. ValidateExpenseUpload
        public async Task<string> ValidateExpenseUploadAsync(string callNbr)
        {
            try
            {
                await using var conn = new SqlConnection(_connectionString);
                await using var cmd = new SqlCommand("CheckExpUploadElgibility", conn)
                {
                    CommandType = CommandType.StoredProcedure
                };
                cmd.Parameters.AddWithValue("@CallNbr", callNbr);

                await conn.OpenAsync();
                var result = await cmd.ExecuteScalarAsync();
                return result?.ToString() ?? "No result returned.";
            }
            catch (Exception ex)
            {
                return ex.Message;
            }
        }


        // 16. UPS SPs
        public async Task<List<ManufacturerDto>> GetManufacturerNamesAsync()
        {
            const string query = "SELECT DISTINCT RTRIM(ManufID) AS ManufID, RTRIM(ManufName) AS ManufName FROM [Manufacturer] ORDER BY MANUFNAME";

            try
            {
                await using var conn = new SqlConnection(_connectionString);
                await conn.OpenAsync();

                await using var cmd = new SqlCommand(query, conn);
                await using var reader = await cmd.ExecuteReaderAsync();

                var result = new List<ManufacturerDto>();
                while (await reader.ReadAsync())
                {
                    result.Add(new ManufacturerDto
                    {
                        ManufID = reader["ManufID"].ToString(),
                        ManufName = reader["ManufName"].ToString()
                    });
                }

                return result;
            }
            catch (Exception)
            {
                return new List<ManufacturerDto>(); // return empty list on error
            }
        }

        //16a. GetUPSReadings
        public async Task<aaETechUPS?> GetUPSReadingsAsync(string callNbr, int equipId, string upsId)
        {
            using var connection = new SqlConnection(_connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@CallNbr", callNbr);
            parameters.Add("@EquipId", equipId);
            parameters.Add("@UPSId", upsId);

            // Map query to DTO
            var result = await connection.QueryFirstOrDefaultAsync<aaETechUPS>(
                "GetaaETechUPS",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return result;
        }

        //16b. EditEquipInfo - Hybrid approach using both stored procedures
        public async Task<EditEquipInfoDto> EditEquipInfoAsync(string callNbr, int equipId)
        {
            using var connection = new SqlConnection(_connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@CallNbr", callNbr);
            parameters.Add("@EquipId", equipId);
            parameters.Add("@EquipNo", ""); // Required parameter for _New SP

            await connection.OpenAsync();

            try
            {
                // First try the new stored procedure (which handles both modified and legacy data)
                var result = await connection.QueryFirstOrDefaultAsync<EditEquipInfoDto>(
                    "EditEquipmentDetails_New",
                    parameters,
                    commandType: CommandType.StoredProcedure
                );

                // If no result from new SP, fallback to original SP for legacy data compatibility
                if (result == null)
                {
                    // Use QueryMultiple for the original SP that returns 2 result sets
                    using var multi = await connection.QueryMultipleAsync(
                        "EditEquipmentDetails",
                        parameters,
                        commandType: CommandType.StoredProcedure
                    );

                    var equipInfo = (await multi.ReadAsync<EditEquipInfoDto>()).FirstOrDefault();
                    var batteryInfo = (await multi.ReadAsync<dynamic>()).FirstOrDefault(); // Use dynamic to access legacy field names

                    if (equipInfo != null && batteryInfo != null)
                    {
                        // Merge battery info into equipInfo (legacy approach)
                        equipInfo.BatteryHousing = batteryInfo.BatteryHousing;
                        equipInfo.BatteryType = batteryInfo.BatteryType;
                        equipInfo.FloatVoltV = batteryInfo.FloatVoltV;
                        equipInfo.FloatVoltS = batteryInfo.FloatVoltS;
                        
                        // Map legacy field names to new DTO structure using dynamic object
                        equipInfo.DCFCapsYear = batteryInfo.DCCapsYear;
                        equipInfo.ACFIPYear = batteryInfo.ACInputCapsYear;
                        equipInfo.DCCommCapsYear = batteryInfo.DCCommCapsYear;
                        equipInfo.ACFOPYear = batteryInfo.ACOutputCapsYear;
                    }
                    
                    result = equipInfo;
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error in EditEquipInfoAsync for CallNbr={callNbr}, EquipId={equipId}");
                throw;
            }
        }

        //16c. GetEquipReconciliationInfo
        public async Task<EquipReconciliationInfoDto> GetEquipReconciliationInfoAsync(string callNbr, int equipId)
        {
            using var conn = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand("GetEquipReconciliationInfo", conn)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@CallNbr", callNbr);
            cmd.Parameters.AddWithValue("@EquipID", equipId);

            await conn.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                return new EquipReconciliationInfoDto
                {
                    CallNbr = callNbr,
                    EquipID = equipId,
                    Make = reader["Make"]?.ToString() ?? string.Empty,
                    MakeCorrect = reader["MakeCorrect"]?.ToString() ?? string.Empty,
                    ActMake = reader["ActMake"]?.ToString() ?? string.Empty,

                    Model = reader["Model"]?.ToString() ?? string.Empty,
                    ModelCorrect = reader["ModelCorrect"]?.ToString() ?? string.Empty,
                    ActModel = reader["ActModel"]?.ToString() ?? string.Empty,

                    SerialNo = reader["SerialNo"]?.ToString() ?? string.Empty,
                    SerialNoCorrect = reader["SerialNoCorrect"]?.ToString() ?? string.Empty,
                    ActSerialNo = reader["ActSerialNo"]?.ToString() ?? string.Empty,

                    KVA = reader["KVA"]?.ToString() ?? "0",
                    KVACorrect = reader["KVACorrect"]?.ToString() ?? string.Empty,
                    ActKVA = reader["ActKVA"]?.ToString() ?? "0",

                    ASCStringsNo = Convert.ToInt32(reader["ASCStringsNo"]),
                    ASCStringsCorrect = reader["ASCStringsCorrect"]?.ToString() ?? string.Empty,
                    ActASCStringNo = Convert.ToInt32(reader["ActASCStringNo"]),

                    BattPerString = Convert.ToInt32(reader["BattPerString"]),
                    BattPerStringCorrect = reader["BattPerStringCorrect"]?.ToString() ?? string.Empty,
                    ActBattPerString = Convert.ToInt32(reader["ActBattPerString"]),

                    TotalEquips = Convert.ToInt32(reader["TotalEquips"]),
                    TotalEquipsCorrect = reader["TotalEquipsCorrect"]?.ToString() ?? string.Empty,
                    ActTotalEquips = Convert.ToInt32(reader["ActTotalEquips"]),

                    NewEquipment = reader["NewEquipment"]?.ToString() ?? string.Empty,
                    EquipmentNotes = reader["EquipmentNotes"]?.ToString() ?? string.Empty,
                    Verified = Convert.ToBoolean(reader["Verified"])
                };
            }

            return null;
        }

        //17 GetEquipBoardInfo
        public async Task<IEnumerable<EquipBoardInfoDto>> GetEquipBoardInfoAsync(string equipNo, int equipId)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);

                var parameters = new DynamicParameters();
                parameters.Add("@EquipNo", equipNo);
                parameters.Add("@EquipId", equipId);



                var result = await connection.QueryAsync<EquipBoardInfoDto>(
                   "GetEquipBoardInfo",
                    parameters,
                    commandType: CommandType.StoredProcedure 
                );

                return result.ToList();
            }
            catch (Exception)
            {
                return new List<EquipBoardInfoDto>(); // return empty list on error
            }

        }

        // 18. InsertOrUpdateEquipment - Completely rewritten based on SP logic

        public async Task InsertOrUpdateEquipmentAsync(EquipmentInsertUpdateDto equipment)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    await connection.OpenAsync();

                    using (var command = new SqlCommand("dbo.spEquipmentInsertUpdate", connection))
                    {
                        command.CommandType = System.Data.CommandType.StoredProcedure;

                        // Add parameters
                        command.Parameters.AddWithValue("@CallNbr", equipment.CallNbr);
                        command.Parameters.AddWithValue("@EquipId", equipment.EquipId);
                        command.Parameters.AddWithValue("@EquipNo", equipment.EquipNo);
                        command.Parameters.AddWithValue("@VendorId", equipment.VendorId);
                        command.Parameters.AddWithValue("@EquipType", equipment.EquipType);
                        command.Parameters.AddWithValue("@Version", equipment.Version ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@SerialID", equipment.SerialID ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@SVC_Asset_Tag", equipment.SVC_Asset_Tag ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@Location", equipment.Location ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@ReadingType", equipment.ReadingType ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@Contract", equipment.Contract ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@TaskDesc", equipment.TaskDesc ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@BatPerStr", equipment.BatPerStr);
                        command.Parameters.AddWithValue("@EquipStatus", equipment.EquipStatus ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@MaintAuth", equipment.MaintAuth ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@KVA", equipment.KVA ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@EquipMonth", equipment.EquipMonth ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@EquipYear", equipment.EquipYear);
                        command.Parameters.AddWithValue("@DCFCapsPartNo", equipment.DCFCapsPartNo ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@ACFIPCapsPartNo", equipment.ACFIPCapsPartNo ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@DCFQty", equipment.DCFQty);
                        command.Parameters.AddWithValue("@ACFIPQty", equipment.ACFIPQty);
                        command.Parameters.AddWithValue("@DCFCapsMonthName", equipment.DCFCapsMonthName ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@ACFIPCapsMonthName", equipment.ACFIPCapsMonthName ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@DCFCapsYear", equipment.DCFCapsYear);
                        command.Parameters.AddWithValue("@ACFIPYear", equipment.ACFIPYear);
                        command.Parameters.AddWithValue("@DCCommCapsPartNo", equipment.DCCommCapsPartNo ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@ACFOPCapsPartNo", equipment.ACFOPCapsPartNo ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@DCCommQty", equipment.DCCommQty);
                        command.Parameters.AddWithValue("@ACFOPQty", equipment.ACFOPQty);
                        command.Parameters.AddWithValue("@DCCommCapsMonthName", equipment.DCCommCapsMonthName ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@ACFOPCapsMonthName", equipment.ACFOPCapsMonthName ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@DCCommCapsYear", equipment.DCCommCapsYear);
                        command.Parameters.AddWithValue("@ACFOPYear", equipment.ACFOPYear);
                        command.Parameters.AddWithValue("@BatteriesPerPack", equipment.BatteriesPerPack);
                        command.Parameters.AddWithValue("@VFSelection", equipment.VFSelection ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@FansPartNo", equipment.FansPartNo ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@FansQty", equipment.FansQty);
                        command.Parameters.AddWithValue("@FansMonth", equipment.FansMonth ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@FansYear", equipment.FansYear);
                        command.Parameters.AddWithValue("@BlowersPartNo", equipment.BlowersPartNo ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@BlowersQty", equipment.BlowersQty);
                        command.Parameters.AddWithValue("@BlowersMonth", equipment.BlowersMonth ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@BlowersYear", equipment.BlowersYear);
                        command.Parameters.AddWithValue("@MiscPartNo", equipment.MiscPartNo ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@MiscQty", equipment.MiscQty);
                        command.Parameters.AddWithValue("@MiscMonth", equipment.MiscMonth ?? (object)DBNull.Value);
                        command.Parameters.AddWithValue("@MiscYear", equipment.MiscYear);
                        command.Parameters.AddWithValue("@Comments", equipment.Comments ?? (object)DBNull.Value);

                        await command.ExecuteNonQueryAsync();
                    }
                }
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "Database error while executing spEquipmentInsertUpdate for EquipId: {EquipId}", equipment.EquipId);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while executing spEquipmentInsertUpdate for EquipId: {EquipId}", equipment.EquipId);
                throw;
            }
        }

        public async Task<int> DeleteEquipmentAsync(string callNbr, string equipNo, int equipId)
        {
            try
            {
                await using var conn = new SqlConnection(_connectionString);
                await using var cmd = new SqlCommand("DeleteEquipment", conn)
                {
                    CommandType = CommandType.StoredProcedure
                };

                cmd.Parameters.AddWithValue("@CallNbr", callNbr);
                cmd.Parameters.AddWithValue("@EquipNo", equipNo);
                cmd.Parameters.AddWithValue("@EquipId", equipId);

                await conn.OpenAsync();
                var rows = await cmd.ExecuteNonQueryAsync();
                return rows;
            }
            catch (Exception)
            {
                return 0; 
            }
        }

        // 20. InsertGetEquipmentImages
        public async Task<int> InsertGetEquipmentImagesAsync(EquipmentImageUploadDto dto)
        {
            // Validate incoming dto
            if (dto == null) throw new ArgumentNullException(nameof(dto));

            try
            {
                await using var conn = new SqlConnection(_connectionString);

                await using var cmd = new SqlCommand("InsertGetEquipmentImages", conn)
                {
                    CommandType = CommandType.StoredProcedure
                };

                cmd.Parameters.AddWithValue("@CallNbr", dto.CallNbr ?? string.Empty);
                cmd.Parameters.AddWithValue("@EquipID", dto.EquipID);
                cmd.Parameters.AddWithValue("@EquipNo", dto.EquipNo ?? string.Empty);
                cmd.Parameters.AddWithValue("@TechName", dto.TechName ?? string.Empty);
                cmd.Parameters.AddWithValue("@TechID", dto.TechID ?? string.Empty);
                cmd.Parameters.AddWithValue("@Img_Title", dto.Img_Title ?? string.Empty);

                // Ensure Img_Type is set; prefer the uploaded file ContentType when available
                var imgType = string.IsNullOrWhiteSpace(dto.Img_Type) ? dto.ImgFile?.ContentType ?? string.Empty : dto.Img_Type;
                cmd.Parameters.AddWithValue("@Img_Type", imgType);

                // If file provided, send as varbinary(max)
                if (dto.ImgFile != null && dto.ImgFile.Length > 0)
                {
                    using var ms = new MemoryStream();
                    await dto.ImgFile.CopyToAsync(ms);
                    var bytes = ms.ToArray();

                    // Use VarBinary (max) instead of deprecated Image type
                    var imgParam = new SqlParameter("@Img_Stream", SqlDbType.VarBinary, -1)
                    {
                        Value = bytes
                    };
                    cmd.Parameters.Add(imgParam);
                }
                else
                {
                    cmd.Parameters.AddWithValue("@Img_Stream", DBNull.Value);
                }

                // Execute and assume success if no exception is thrown
                await conn.OpenAsync();
                await cmd.ExecuteNonQueryAsync();

                // Since stored procedure does not use explicit RETURN statements in this environment,
                // assume success and return 1 when execution completes without error.
                return 1;
            }
            catch
            {
                throw;
            }
        }

        // 21. DeleteEquipmentImage - deletes from current DB or fallback archive DB based on existence
        public async Task<int> DeleteEquipmentImageAsync(int imgId)
        {
            try
            {
                await using var conn = new SqlConnection(_connectionString);
                await using var cmd = new SqlCommand("DeleteEquipmentImage", conn)
                {
                    CommandType = CommandType.StoredProcedure
                };

                cmd.Parameters.AddWithValue("@Img_ID", imgId);

                await conn.OpenAsync();

                // Execute stored procedure
                await cmd.ExecuteNonQueryAsync();

                // Assume success if execution completed without exception
                return 1;
            }
            catch (SqlException sqlEx)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        // 22. GetEquipmentImages wrapper for SP GetEquipmentImages
        // If Img_ID is supplied and EquipID == 0, SP returns Img_stream (single column)
        // If EquipID > 0, SP returns full rows from EquipmentImages table
        public async Task<IEnumerable<EquipmentImageDto>> GetEquipmentImagesAsync(int equipId, int imgId)
        {
            try
            {
                await using var conn = new SqlConnection(_connectionString);
                await using var cmd = new SqlCommand("GetEquipmentImages", conn) // Or your SP name
                {
                    CommandType = CommandType.StoredProcedure
                };

                cmd.Parameters.AddWithValue("@EquipID", equipId);
                cmd.Parameters.AddWithValue("@Img_ID", imgId);

                await conn.OpenAsync();
                var images = new List<EquipmentImageDto>();

                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var image = new EquipmentImageDto
                    {
                        Img_ID = reader.GetInt32("Img_ID"),
                        EquipID = reader.GetInt32("EquipID"),
                        EquipNo = reader.GetString("EquipNo"),
                        CallNbr = reader.GetString("CallNbr"),
                        TechID = reader.GetString("TechID"),
                        TechName = reader.GetString("TechName"),
                        Img_Title = reader.GetString("Img_Title"),
                        Img_Type = reader.GetString("Img_Type"),
                        CreatedOn = reader.GetDateTime("CreatedOn"),
                        Img_stream = reader.IsDBNull("Img_Stream") ? null : (byte[])reader["Img_Stream"]
                    };
                    images.Add(image);
                }

                return images;
            }
            catch (Exception ex)
            {
                throw;
            }
        }

        // 23. InsertEquipmentFiles - calls your stored procedure
        public async Task<(bool Success, string Message)> InsertEquipmentFileAsync(EquipmentFileDto fileDto)
        {
            try
            {
                using var connection = new SqlConnection(_connectionString);
                using var command = new SqlCommand("InsertEquipmentFiles", connection)
                {
                    CommandType = CommandType.StoredProcedure
                };

                // Add parameters matching your SP exactly
                command.Parameters.AddWithValue("@EquipID", fileDto.EquipID);
                command.Parameters.AddWithValue("@TechID", fileDto.TechID ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@Img_Title", fileDto.Img_Title ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@Img_Type", fileDto.Img_Type ?? (object)DBNull.Value);
                command.Parameters.AddWithValue("@CreatedBy", fileDto.CreatedBy ?? (object)DBNull.Value);

                // Handle file data as Image type (matching your SP)
                if (fileDto.ImgFile != null && fileDto.ImgFile.Length > 0)
                {
                    using var memoryStream = new MemoryStream();
                    await fileDto.ImgFile.CopyToAsync(memoryStream);
                    var fileBytes = memoryStream.ToArray();

                    var imgStreamParam = new SqlParameter("@Img_Stream", SqlDbType.Image)
                    {
                        Value = fileBytes
                    };
                    command.Parameters.Add(imgStreamParam);
                }
                else
                {
                    command.Parameters.AddWithValue("@Img_Stream", DBNull.Value);
                }

                await connection.OpenAsync();
                await command.ExecuteNonQueryAsync();

                return (true, "Equipment file inserted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error inserting equipment file for EquipID: {EquipID}", fileDto.EquipID);
                return (false, $"Error inserting equipment file: {ex.Message}");
            }
        }

        // 24. GetEquipmentFiles - calls your stored procedure
        public async Task<List<EquipmentFileResponseDto>> GetEquipmentFilesAsync(int equipId)
        {
            var files = new List<EquipmentFileResponseDto>();

            try
            {
                using var connection = new SqlConnection(_connectionString);
                using var command = new SqlCommand("GetEquipmentFiles", connection)
                {
                    CommandType = CommandType.StoredProcedure
                };

                command.Parameters.AddWithValue("@EquipID", equipId);

                await connection.OpenAsync();
                using var reader = await command.ExecuteReaderAsync();

                int recordCount = 0;
                while (await reader.ReadAsync())
                {
                    recordCount++;

                    files.Add(new EquipmentFileResponseDto
                    {
                        // Based on SP results, the table doesn't have a FileID column
                        // Use a generated ID or remove this field from DTO
                        //FileID = recordCount, // Temporary solution - or remove if not needed
                        EquipID = reader.GetInt32("EquipID"),
                        TechID = reader.IsDBNull("TechID") ? null : reader.GetString("TechID"),
                        FileName = reader.IsDBNull("FileName") ? null : reader.GetString("FileName"),
                        ContentType = reader.IsDBNull("ContentType") ? null : reader.GetString("ContentType"),
                        CreatedBy = reader.IsDBNull("CreatedBy") ? null : reader.GetString("CreatedBy"),
                        CreatedOn = reader.GetDateTime("CreatedOn"),
                        Data = reader.IsDBNull("Data") ? null : (byte[])reader["Data"]
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving equipment files for EquipID: {EquipID}", equipId);
            }

            return files;   
        }

        // 11. UpdateEquipBoardInfo - Simple SQL approach like other methods
        public async Task<int> UpdateEquipBoardInfoAsync(string equipNo, int equipId, List<EquipBoardRow> rows)
        {
            if (string.IsNullOrWhiteSpace(equipNo) || equipId <= 0 || rows == null)
                return 0;

            try
            {
                await using var conn = new SqlConnection(_connectionString);
                await conn.OpenAsync();

                // Step 1: Delete existing rows
                const string deleteQuery = "DELETE FROM dbo.EquipBoardDetails WHERE EquipNo = @EquipNo AND EquipID = @EquipID";
                
                await using var deleteCmd = new SqlCommand(deleteQuery, conn);
                deleteCmd.Parameters.AddWithValue("@EquipNo", equipNo);
                deleteCmd.Parameters.AddWithValue("@EquipID", equipId);
                await deleteCmd.ExecuteNonQueryAsync();

                // Step 2: Insert new rows if any
                if (rows.Count > 0)
                {
                    const string insertQuery = @"
                        INSERT INTO dbo.EquipBoardDetails 
                        (EquipNo, EquipID, RowID, PartNo, Description, Qty, Comments, LastModifiedOn, LastModifiedBy)
                        VALUES (@EquipNo, @EquipID, @RowID, @PartNo, @Description, @Qty, @Comments, CURRENT_TIMESTAMP, SUSER_NAME())";

                    for (int i = 0; i < rows.Count; i++)
                    {
                        var row = rows[i];
                        
                        await using var insertCmd = new SqlCommand(insertQuery, conn);
                        insertCmd.Parameters.AddWithValue("@EquipNo", equipNo);
                        insertCmd.Parameters.AddWithValue("@EquipID", equipId);
                        insertCmd.Parameters.AddWithValue("@RowID", i + 1);
                        insertCmd.Parameters.AddWithValue("@PartNo", row.PartNo ?? string.Empty);
                        insertCmd.Parameters.AddWithValue("@Description", row.Description ?? string.Empty);
                        insertCmd.Parameters.AddWithValue("@Qty", row.Qty);
                        insertCmd.Parameters.AddWithValue("@Comments", row.Comments ?? string.Empty);

                        await insertCmd.ExecuteNonQueryAsync();
                    }
                }

                return rows.Count;
            }
            catch (Exception)
            {
                return 0;
            }
        }

        //25. UpdateEquipStatus - Updates equipment status across multiple related tables
        public async Task<int> UpdateEquipStatusAsync(UpdateEquipStatusDto request)
        {
            try
            {
                await using var conn = new SqlConnection(_connectionString);
                await using var cmd = new SqlCommand("UpdateEquipStatus", conn)
                {
                    CommandType = CommandType.StoredProcedure
                };

                // Add all parameters matching the stored procedure signature
                cmd.Parameters.AddWithValue("@CallNbr", request.CallNbr);
                cmd.Parameters.AddWithValue("@EquipId", request.EquipId);
                cmd.Parameters.AddWithValue("@Status", request.Status);
                cmd.Parameters.AddWithValue("@Notes", request.Notes ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@TableName", request.TableName);
                cmd.Parameters.AddWithValue("@Manufacturer", request.Manufacturer ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ModelNo", request.ModelNo ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@SerialNo", request.SerialNo ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Location", request.Location ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Maint_Auth_ID", request.MaintAuthID ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@MonthName", request.MonthName ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Year", request.Year);
                cmd.Parameters.AddWithValue("@ReadingType", request.ReadingType ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@BatteriesPerString", request.BatteriesPerString);
                cmd.Parameters.AddWithValue("@BatteriesPerPack", request.BatteriesPerPack);
                cmd.Parameters.AddWithValue("@VFSelection", request.VFSelection ?? (object)DBNull.Value);

                await conn.OpenAsync();
                var result = await cmd.ExecuteNonQueryAsync();
                
                _logger.LogInformation("UpdateEquipStatus completed for CallNbr={CallNbr}, EquipId={EquipId}, Status={Status}", 
                    request.CallNbr, request.EquipId, request.Status);
                
                return result;
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "SQL error in UpdateEquipStatusAsync for CallNbr={CallNbr}, EquipId={EquipId}", 
                    request.CallNbr, request.EquipId);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in UpdateEquipStatusAsync for CallNbr={CallNbr}, EquipId={EquipId}", 
                    request.CallNbr, request.EquipId);
                throw;
            }
        }

        //26. GetEquipFilterCurrents - Get equipment filter currents data
        public async Task<EquipFilterCurrentsDto> GetEquipFilterCurrentsAsync(string callNbr, int equipId)
        {
            try
            {
                await using var conn = new SqlConnection(_connectionString);
                await using var cmd = new SqlCommand("usp_GetEquipFilterCurrents", conn)
                {
                    CommandType = CommandType.StoredProcedure
                };

                cmd.Parameters.AddWithValue("@CallNbr", callNbr);
                cmd.Parameters.AddWithValue("@EquipID", equipId);

                await conn.OpenAsync();
                using var reader = await cmd.ExecuteReaderAsync();

                if (await reader.ReadAsync())
                {
                    return new EquipFilterCurrentsDto
                    {
                        CallNbr = reader.GetString("CallNbr"),
                        EquipID = reader.GetInt32("EquipID"),
                        ChkIPFilter = reader.IsDBNull("chkIPFilter") ? null : reader.GetBoolean("chkIPFilter"),
                        ChkIPTHD = reader.IsDBNull("chkIPTHD") ? null : reader.GetBoolean("chkIPTHD"),
                        IPFilterCurrA_T = reader.IsDBNull("IPFilterCurrA_T") ? null : reader.GetDecimal("IPFilterCurrA_T"),
                        IPFilterCurrA_PF = reader.IsDBNull("IPFilterCurrA_PF") ? null : reader.GetString("IPFilterCurrA_PF"),
                        IPFilterCurrB_T = reader.IsDBNull("IPFilterCurrB_T") ? null : reader.GetDecimal("IPFilterCurrB_T"),
                        IPFilterCurrB_PF = reader.IsDBNull("IPFilterCurrB_PF") ? null : reader.GetString("IPFilterCurrB_PF"),
                        IPFilterCurrC_T = reader.IsDBNull("IPFilterCurrC_T") ? null : reader.GetDecimal("IPFilterCurrC_T"),
                        IPFilterCurrC_PF = reader.IsDBNull("IPFilterCurrC_PF") ? null : reader.GetString("IPFilterCurrC_PF"),
                        IPFilterTHDA_T = reader.IsDBNull("IPFilterTHDA_T") ? null : reader.GetDecimal("IPFilterTHDA_T"),
                        IPFilterTHDA_PF = reader.IsDBNull("IPFilterTHDA_PF") ? null : reader.GetString("IPFilterTHDA_PF"),
                        IPFilterTHDB_T = reader.IsDBNull("IPFilterTHDB_T") ? null : reader.GetDecimal("IPFilterTHDB_T"),
                        IPFilterTHDB_PF = reader.IsDBNull("IPFilterTHDB_PF") ? null : reader.GetString("IPFilterTHDB_PF"),
                        IPFilterTHDC_T = reader.IsDBNull("IPFilterTHDC_T") ? null : reader.GetDecimal("IPFilterTHDC_T"),
                        IPFilterTHDC_PF = reader.IsDBNull("IPFilterTHDC_PF") ? null : reader.GetString("IPFilterTHDC_PF"),
                        ChkOPFilter = reader.IsDBNull("chkOPFilter") ? null : reader.GetBoolean("chkOPFilter"),
                        ChkOPTHD = reader.IsDBNull("chkOPTHD") ? null : reader.GetBoolean("chkOPTHD"),
                        OPFilterCurrA_T = reader.IsDBNull("OPFilterCurrA_T") ? null : reader.GetDecimal("OPFilterCurrA_T"),
                        OPFilterCurrA_PF = reader.IsDBNull("OPFilterCurrA_PF") ? null : reader.GetString("OPFilterCurrA_PF"),
                        OPFilterCurrB_T = reader.IsDBNull("OPFilterCurrB_T") ? null : reader.GetDecimal("OPFilterCurrB_T"),
                        OPFilterCurrB_PF = reader.IsDBNull("OPFilterCurrB_PF") ? null : reader.GetString("OPFilterCurrB_PF"),
                        OPFilterCurrC_T = reader.IsDBNull("OPFilterCurrC_T") ? null : reader.GetDecimal("OPFilterCurrC_T"),
                        OPFilterCurrC_PF = reader.IsDBNull("OPFilterCurrC_PF") ? null : reader.GetString("OPFilterCurrC_PF"),
                        OPFilterTHDA_T = reader.IsDBNull("OPFilterTHDA_T") ? null : reader.GetDecimal("OPFilterTHDA_T"),
                        OPFilterTHDA_PF = reader.IsDBNull("OPFilterTHDA_PF") ? null : reader.GetString("OPFilterTHDA_PF"),
                        OPFilterTHDB_T = reader.IsDBNull("OPFilterTHDB_T") ? null : reader.GetDecimal("OPFilterTHDB_T"),
                        OPFilterTHDB_PF = reader.IsDBNull("OPFilterTHDB_PF") ? null : reader.GetString("OPFilterTHDB_PF"),
                        OPFilterTHDC_T = reader.IsDBNull("OPFilterTHDC_T") ? null : reader.GetDecimal("OPFilterTHDC_T"),
                        OPFilterTHDC_PF = reader.IsDBNull("OPFilterTHDC_PF") ? null : reader.GetString("OPFilterTHDC_PF")
                    };
                }

                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving equipment filter currents for CallNbr={CallNbr}, EquipID={EquipID}", callNbr, equipId);
                throw;
            }
        }

        //27. SaveUpdateEquipFilterCurrents - Save or update equipment filter currents data
        public async Task<int> SaveUpdateEquipFilterCurrentsAsync(EquipFilterCurrentsDto request)
        {
            try
            {
                await using var conn = new SqlConnection(_connectionString);
                await using var cmd = new SqlCommand("SaveUpdateEquipFilterCurrents", conn)
                {
                    CommandType = CommandType.StoredProcedure
                };

                // Add all parameters matching the stored procedure signature
                cmd.Parameters.AddWithValue("@CallNbr", request.CallNbr);
                cmd.Parameters.AddWithValue("@EquipID", request.EquipID);
                cmd.Parameters.AddWithValue("@chkIPFilter", request.ChkIPFilter ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@chkIPTHD", request.ChkIPTHD ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@IPFilterCurrA_T", request.IPFilterCurrA_T ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@IPFilterCurrA_PF", request.IPFilterCurrA_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@IPFilterCurrB_T", request.IPFilterCurrB_T ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@IPFilterCurrB_PF", request.IPFilterCurrB_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@IPFilterCurrC_T", request.IPFilterCurrC_T ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@IPFilterCurrC_PF", request.IPFilterCurrC_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@IPFilterTHDA_T", request.IPFilterTHDA_T ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@IPFilterTHDA_PF", request.IPFilterTHDA_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@IPFilterTHDB_T", request.IPFilterTHDB_T ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@IPFilterTHDB_PF", request.IPFilterTHDB_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@IPFilterTHDC_T", request.IPFilterTHDC_T ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@IPFilterTHDC_PF", request.IPFilterTHDC_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@chkOPFilter", request.ChkOPFilter ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@chkOPTHD", request.ChkOPTHD ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OPFilterCurrA_T", request.OPFilterCurrA_T ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OPFilterCurrA_PF", request.OPFilterCurrA_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OPFilterCurrB_T", request.OPFilterCurrB_T ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OPFilterCurrB_PF", request.OPFilterCurrB_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OPFilterCurrC_T", request.OPFilterCurrC_T ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OPFilterCurrC_PF", request.OPFilterCurrC_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OPFilterTHDA_T", request.OPFilterTHDA_T ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OPFilterTHDA_PF", request.OPFilterTHDA_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OPFilterTHDB_T", request.OPFilterTHDB_T ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OPFilterTHDB_PF", request.OPFilterTHDB_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OPFilterTHDC_T", request.OPFilterTHDC_T ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OPFilterTHDC_PF", request.OPFilterTHDC_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ModifiedBy", request.ModifiedBy ?? (object)DBNull.Value);

                await conn.OpenAsync();
                var result = await cmd.ExecuteNonQueryAsync();

                _logger.LogInformation("SaveUpdateEquipFilterCurrents completed for CallNbr={CallNbr}, EquipID={EquipID}", 
                    request.CallNbr, request.EquipID);

                return result;
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "SQL error in SaveUpdateEquipFilterCurrentsAsync for CallNbr={CallNbr}, EquipID={EquipID}", 
                    request.CallNbr, request.EquipID);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in SaveUpdateEquipFilterCurrentsAsync for CallNbr={CallNbr}, EquipID={EquipID}", 
                    request.CallNbr, request.EquipID);
                throw;
            }
        }



        //29. SaveUpdateEquipReconciliation - Save or update equipment reconciliation data
        public async Task<int> SaveUpdateEquipReconciliationAsync(SaveUpdateEquipReconciliationDto request)
        {
            try
            {
                await using var conn = new SqlConnection(_connectionString);
                await using var cmd = new SqlCommand("SaveUpdateEquipReconciliation", conn)
                {
                    CommandType = CommandType.StoredProcedure
                };

                // Add all parameters matching the stored procedure signature
                cmd.Parameters.AddWithValue("@CallNbr", request.CallNbr ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@EquipID", request.EquipID);
                cmd.Parameters.AddWithValue("@Make", request.Make ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@MakeCorrect", request.MakeCorrect ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ActMake", request.ActMake ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Model", request.Model ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ModelCorrect", request.ModelCorrect ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ActModel", request.ActModel ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@SerialNo", request.SerialNo ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@SerialNoCorrect", request.SerialNoCorrect ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ActSerialNo", request.ActSerialNo ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@KVA", request.KVA ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@KVACorrect", request.KVACorrect ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ActKVA", request.ActKVA ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ASCStringsNo", request.ASCStringsNo);
                cmd.Parameters.AddWithValue("@ASCStringsCorrect", request.ASCStringsCorrect ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ActASCStringNo", request.ActASCStringNo);
                cmd.Parameters.AddWithValue("@BattPerString", request.BattPerString);
                cmd.Parameters.AddWithValue("@BattPerStringCorrect", request.BattPerStringCorrect ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ActBattPerString", request.ActBattPerString);
                cmd.Parameters.AddWithValue("@TotalEquips", request.TotalEquips);
                cmd.Parameters.AddWithValue("@TotalEquipsCorrect", request.TotalEquipsCorrect ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ActTotalEquips", request.ActTotalEquips);
                cmd.Parameters.AddWithValue("@Verified", request.Verified);
                cmd.Parameters.AddWithValue("@ModifiedBy", request.ModifiedBy ?? "SYSTEM");

                await conn.OpenAsync();
                var result = await cmd.ExecuteNonQueryAsync();

                _logger.LogInformation("SaveUpdateEquipReconciliation completed for CallNbr={CallNbr}, EquipID={EquipID}. Rows affected: {RowsAffected}",
                    request.CallNbr, request.EquipID, result);

                return result;
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "SQL error in SaveUpdateEquipReconciliationAsync for CallNbr={CallNbr}, EquipID={EquipID}",
                    request.CallNbr, request.EquipID);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in SaveUpdateEquipReconciliationAsync for CallNbr={CallNbr}, EquipID={EquipID}",
                    request.CallNbr, request.EquipID);
                throw;
            }
        }
    


//29. GetJobSummarySample - Get job summary sample data based on equipment type
public async Task<JobSummarySampleResponseDto> GetJobSummarySampleAsync(JobSummarySampleRequestDto request)
        {
            try
            {
                await using var conn = new SqlConnection(_connectionString);
                await using var cmd = new SqlCommand("GetJobSummarySample", conn)
                {
                    CommandType = CommandType.StoredProcedure
                };

                cmd.Parameters.AddWithValue("@CallNbr", request.CallNbr);
                cmd.Parameters.AddWithValue("@EquipID", request.EquipID);
                cmd.Parameters.AddWithValue("@EquipType", request.EquipType);
                cmd.Parameters.AddWithValue("@Scheduled", request.Scheduled);

                await conn.OpenAsync();

                var response = new JobSummarySampleResponseDto
                {
                    EquipType = request.EquipType,
                    HasSecondaryData = false
                };

                // Handle different equipment types and their specific data structures
                switch (request.EquipType.ToUpper())
                {
                    case "BATTERY":
                        await using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            // First result set: aaEtechBatteryString data
                            var primaryData = new List<BatteryStringDto>();
                            while (await reader.ReadAsync())
                            {
                                primaryData.Add(new BatteryStringDto
                                {
                                    CallNbr = reader["CALLNBR"]?.ToString(),
                                    EquipId = Convert.ToInt32(reader["EQUIPID"]),
                                    StringId = reader["StringId"] != DBNull.Value ? Convert.ToInt32(reader["StringId"]) : 0,
                                    BattPerString = reader["BattPerString"] != DBNull.Value ? Convert.ToInt32(reader["BattPerString"]) : 0,
                                    VoltageV = reader["VoltageV"] != DBNull.Value ? Convert.ToDecimal(reader["VoltageV"]) : null,
                                    VoltageS = reader["VoltageS"] != DBNull.Value ? Convert.ToDecimal(reader["VoltageS"]) : null,
                                    FloatVoltV = reader["FloatVoltV"] != DBNull.Value ? Convert.ToDecimal(reader["FloatVoltV"]) : null,
                                    FloatVoltS = reader["FloatVoltS"] != DBNull.Value ? Convert.ToDecimal(reader["FloatVoltS"]) : null,
                                    Discharge = reader["Discharge"]?.ToString(),
                                    DischargeTime = reader["DischargeTime"]?.ToString(),
                                    Condition = reader["Condition"]?.ToString(),
                                    Notes = reader["Notes"]?.ToString(),
                                    TargetVoltage = reader["TargetVoltage"] != DBNull.Value ? Convert.ToDecimal(reader["TargetVoltage"]) : null,
                                    BatteryType = reader["BatteryType"]?.ToString(),
                                    BatteryHousing = reader["BatteryHousing"]?.ToString(),
                                    Created = reader["Created"] != DBNull.Value ? Convert.ToDateTime(reader["Created"]) : null,
                                    MaintAuthID = reader["Maint_Auth_ID"]?.ToString()
                                });
                            }
                            response.PrimaryData = primaryData;

                            // Second result set: Battery details with filtering conditions
                            if (await reader.NextResultAsync())
                            {
                                var secondaryData = new List<BatteryDetailsDto>();
                                while (await reader.ReadAsync())
                                {
                                    secondaryData.Add(new BatteryDetailsDto
                                    {
                                        CallNbr = reader["CALLNBR"]?.ToString(),
                                        EquipId = Convert.ToInt32(reader["EQUIPID"]),
                                        StringId = reader["StringId"] != DBNull.Value ? Convert.ToInt32(reader["StringId"]) : 0,
                                        BatteryNo = reader["BatteryNo"] != DBNull.Value ? Convert.ToInt32(reader["BatteryNo"]) : 0,
                                        VoltageV = reader["VoltageV"] != DBNull.Value ? Convert.ToDecimal(reader["VoltageV"]) : null,
                                        VoltageS = reader["VoltageS"] != DBNull.Value ? Convert.ToDecimal(reader["VoltageS"]) : null,
                                        Condition = reader["Condition"]?.ToString(),
                                        ReplacementNeeded = reader["ReplacementNeeded"]?.ToString(),
                                        MonitoringBattery = reader["MonitoringBattery"]?.ToString(),
                                        Cracks = reader["Cracks"]?.ToString(),
                                        Notes = reader["Notes"]?.ToString(),
                                        Created = reader["Created"] != DBNull.Value ? Convert.ToDateTime(reader["Created"]) : null
                                    });
                                }
                                response.SecondaryData = secondaryData;
                                response.HasSecondaryData = secondaryData.Any();
                            }
                        }
                        break;

                    default:
                        // For all other equipment types (UPS, ATS, PDU, RECTIFIER, GENERATOR, HVAC, SCC, STATIC SWITCH, STS)
                        // Return dynamic data since each table has different schemas
                        await using (var reader = await cmd.ExecuteReaderAsync())
                        {
                            var dynamicData = new List<Dictionary<string, object>>();

                            while (await reader.ReadAsync())
                            {
                                var row = new Dictionary<string, object>();
                                for (int i = 0; i < reader.FieldCount; i++)
                                {
                                    var columnName = reader.GetName(i);
                                    var value = reader.IsDBNull(i) ? null : reader.GetValue(i);
                                    row[columnName] = value;
                                }
                                dynamicData.Add(row);
                            }
                            response.PrimaryData = dynamicData;
                        }
                        break;
                }

                _logger.LogInformation("GetJobSummarySample completed for CallNbr={CallNbr}, EquipID={EquipID}, EquipType={EquipType}",
                    request.CallNbr, request.EquipID, request.EquipType);

                return response;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetJobSummarySampleAsync for CallNbr={CallNbr}, EquipID={EquipID}, EquipType={EquipType}",
                    request.CallNbr, request.EquipID, request.EquipType);
                throw;
            }
        }

        //30. GetStatusDescription - Get status descriptions for equipment type (no DTO approach)
        public async Task<List<Dictionary<string, object>>> GetStatusDescriptionAsync(string equipType)
        {
            const string query = "SELECT * FROM STATUSDESCRIPTION WHERE EQUIPTYPE = @EquipType ORDER BY StatusType";

            try
            {
                await using var conn = new SqlConnection(_connectionString);
                await conn.OpenAsync();

                await using var cmd = new SqlCommand(query, conn);
                cmd.Parameters.AddWithValue("@EquipType", equipType ?? string.Empty);

                await using var reader = await cmd.ExecuteReaderAsync();

                var results = new List<Dictionary<string, object>>();
                while (await reader.ReadAsync())
                {
                    var row = new Dictionary<string, object>();
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        var columnName = reader.GetName(i);
                        var value = reader.IsDBNull(i) ? null : reader.GetValue(i);
                        row[columnName] = value;
                    }
                    results.Add(row);
                }

                _logger.LogInformation("GetStatusDescription completed for EquipType={EquipType}. Found {Count} records",
                    equipType, results.Count);

                return results;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetStatusDescriptionAsync for EquipType={EquipType}", equipType);
                throw;
            }
        }

        //28. SaveUpdateaaETechUPS - Save or update UPS data using the stored procedure
        public async Task<int> SaveUpdateaaETechUPSAsync(SaveUpdateaaETechUPSDto request)
        {
            try
            {
                await using var conn = new SqlConnection(_connectionString);
                await using var cmd = new SqlCommand("SaveUpdateaaETechUPS", conn)
                {
                    CommandType = CommandType.StoredProcedure
                };

                // ✅ 1. Defensive validation for Month and Year
                string ValidateAndFormatMonth(string month)
                {
                    if (string.IsNullOrWhiteSpace(month) || month.Equals("Invalid Date", StringComparison.OrdinalIgnoreCase))
                        return DateTime.Now.ToString("MMMM"); // fallback: current month
                    try
                    {
                        // Try to parse full month name, e.g., "January"
                        DateTime test = DateTime.ParseExact(month.Trim(), "MMMM", CultureInfo.InvariantCulture);
                        return test.ToString("MMMM");
                    }
                    catch
                    {
                        return DateTime.Now.ToString("MMMM");
                    }
                }

                int ValidateAndFormatYear(int year)
                {
                    if (year < 1900 || year > DateTime.Now.Year + 1)
                        return DateTime.Now.Year;
                    return year;
                }

                // ✅ 2. Determine the correct month and year to use
                string finalMonth;
                int finalYear;

                // Use UPS-specific date fields if available, otherwise fallback to legacy or current date
                if (!string.IsNullOrEmpty(request.UpsDateCodeMonth) && request.UpsDateCodeYear > 0)
                {
                    finalMonth = ValidateAndFormatMonth(request.UpsDateCodeMonth);
                    finalYear = ValidateAndFormatYear(request.UpsDateCodeYear);
                }
                else if (!string.IsNullOrEmpty(request.DateCodeMonth) && request.DateCodeYear > 0)
                {
                    finalMonth = ValidateAndFormatMonth(request.DateCodeMonth);
                    finalYear = ValidateAndFormatYear(request.DateCodeYear);
                }
                else
                {
                    finalMonth = DateTime.Now.ToString("MMMM");
                    finalYear = DateTime.Now.Year;
                    _logger.LogWarning("No valid date code provided, defaulted to current: {Month} {Year}", finalMonth, finalYear);
                }

                // ✅ 3. Optional: Ensure it's a parseable combination before sending to SQL
                if (!DateTime.TryParse($"{finalMonth} 1, {finalYear}", out _))
                {
                    _logger.LogWarning("Invalid month/year combination detected, resetting to current date.");
                    finalMonth = DateTime.Now.ToString("MMMM");
                    finalYear = DateTime.Now.Year;
                }

                // Add all parameters matching the stored procedure signature
                cmd.Parameters.AddWithValue("@CallNbr", request.CallNbr);
                cmd.Parameters.AddWithValue("@EquipId", request.EquipId);
                cmd.Parameters.AddWithValue("@UpsId", request.UpsId);
                cmd.Parameters.AddWithValue("@Manufacturer", request.Manufacturer ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@KVA", request.KVA ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@MultiModule", request.MultiModule ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@MaintByPass", request.MaintByPass ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Other", request.Other ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ModelNo", request.ModelNo ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@SerialNo", request.SerialNo ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Status", request.Status ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ParallelCabinet", request.ParallelCabinet ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Measure_Input", request.Measure_Input ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Measure_LCD", request.Measure_LCD ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Measure_Load", request.Measure_Load ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Measure_3Phase", request.Measure_3Phase ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Measure_KVA", request.Measure_KVA ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Measure_Normal", request.Measure_Normal ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Measure_Caliberation", request.Measure_Caliberation ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Measure_EOL", request.Measure_EOL ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Visual_NoAlarms", request.Visual_NoAlarms ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Visual_Tightness", request.Visual_Tightness ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Visual_Broken", request.Visual_Broken ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Visual_Vaccum", request.Visual_Vaccum ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Visual_EPO", request.Visual_EPO ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Visual_Noise", request.Visual_Noise ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Visual_FansAge", request.Visual_FansAge ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Visual_ReplaceFilters", request.Visual_ReplaceFilters ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Environment_RoomTemp", request.Environment_RoomTemp ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Environment_Saftey", request.Environment_Saftey ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Environment_Clean", request.Environment_Clean ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Environment_Space", request.Environment_Space ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Environment_Circuit", request.Environment_Circuit ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Transfer_Major", request.Transfer_Major ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Transfer_Static", request.Transfer_Static ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Transfer_ByPass", request.Transfer_ByPass ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Transfer_Wave", request.Transfer_Wave ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Transfer_Normal", request.Transfer_Normal ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Transfer_Alarm", request.Transfer_Alarm ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Comments1", request.Comments1 ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Comments2", request.Comments2 ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Comments3", request.Comments3 ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Comments4", request.Comments4 ?? (object)DBNull.Value);

                // Use the validated and final date code fields - only send one set
                cmd.Parameters.AddWithValue("@DateCodeMonth", finalMonth);
                cmd.Parameters.AddWithValue("@DateCodeYear", finalYear);

                cmd.Parameters.AddWithValue("@StatusReason", request.StatusReason ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@chkDCBreak", request.chkDCBreak);
                cmd.Parameters.AddWithValue("@chkOverLoad", request.chkOverLoad);
                cmd.Parameters.AddWithValue("@chkTransfer", request.chkTransfer);
                cmd.Parameters.AddWithValue("@chkFault", request.chkFault);
                cmd.Parameters.AddWithValue("@BatteryStringID", request.BatteryStringID);
                cmd.Parameters.AddWithValue("@AFLength", request.AFLength);
                cmd.Parameters.AddWithValue("@AFWidth", request.AFWidth);
                cmd.Parameters.AddWithValue("@AFThickness", request.AFThickness);
                cmd.Parameters.AddWithValue("@AFQty", request.AFQty);
                cmd.Parameters.AddWithValue("@AFLength1", request.AFLength1);
                cmd.Parameters.AddWithValue("@AFWidth1", request.AFWidth1);
                cmd.Parameters.AddWithValue("@AFThickness1", request.AFThickness1);
                cmd.Parameters.AddWithValue("@AFQty1", request.AFQty1);

                // Ensure Maint_Auth_ID is never null - use default if empty
                var maintAuthId = string.IsNullOrWhiteSpace(request.Maint_Auth_ID) ? "SYSTEM" : request.Maint_Auth_ID;
                cmd.Parameters.AddWithValue("@Maint_Auth_ID", maintAuthId);

                cmd.Parameters.AddWithValue("@Input", request.Input ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@InputVoltA_T", request.InputVoltA_T);
                cmd.Parameters.AddWithValue("@InputVoltA_PF", request.InputVoltA_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@InputVoltB_T", request.InputVoltB_T);
                cmd.Parameters.AddWithValue("@InputVoltB_PF", request.InputVoltB_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@InputVoltC_T", request.InputVoltC_T);
                cmd.Parameters.AddWithValue("@InputVoltC_PF", request.InputVoltC_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@InputCurrA_T", request.InputCurrA_T);
                cmd.Parameters.AddWithValue("@InputCurrA_PF", request.InputCurrA_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@InputCurrB_T", request.InputCurrB_T);
                cmd.Parameters.AddWithValue("@InputCurrB_PF", request.InputCurrB_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@InputCurrC_T", request.InputCurrC_T);
                cmd.Parameters.AddWithValue("@InputCurrC_PF", request.InputCurrC_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@InputFreq_T", request.InputFreq_T);
                cmd.Parameters.AddWithValue("@InputFreq_PF", request.InputFreq_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Bypass", request.Bypass ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@BypassVoltA_T", request.BypassVoltA_T);
                cmd.Parameters.AddWithValue("@BypassVoltA_PF", request.BypassVoltA_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@BypassVoltB_T", request.BypassVoltB_T);
                cmd.Parameters.AddWithValue("@BypassVoltB_PF", request.BypassVoltB_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@BypassVoltC_T", request.BypassVoltC_T);
                cmd.Parameters.AddWithValue("@BypassVoltC_PF", request.BypassVoltC_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@BypassCurrA_T", request.BypassCurrA_T);
                cmd.Parameters.AddWithValue("@BypassCurrA_PF", request.BypassCurrA_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@BypassCurrB_T", request.BypassCurrB_T);
                cmd.Parameters.AddWithValue("@BypassCurrB_PF", request.BypassCurrB_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@BypassCurrC_T", request.BypassCurrC_T);
                cmd.Parameters.AddWithValue("@BypassCurrC_PF", request.BypassCurrC_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@BypassFreq_T", request.BypassFreq_T);
                cmd.Parameters.AddWithValue("@BypassFreq_PF", request.BypassFreq_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Output", request.Output ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OutputVoltA_T", request.OutputVoltA_T);
                cmd.Parameters.AddWithValue("@OutputVoltA_PF", request.OutputVoltA_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OutputVoltB_T", request.OutputVoltB_T);
                cmd.Parameters.AddWithValue("@OutputVoltB_PF", request.OutputVoltB_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OutputVoltC_T", request.OutputVoltC_T);
                cmd.Parameters.AddWithValue("@OutputVoltC_PF", request.OutputVoltC_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OutputCurrA_T", request.OutputCurrA_T);
                cmd.Parameters.AddWithValue("@OutputCurrA_PF", request.OutputCurrA_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OutputCurrB_T", request.OutputCurrB_T);
                cmd.Parameters.AddWithValue("@OutputCurrB_PF", request.OutputCurrB_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OutputCurrC_T", request.OutputCurrC_T);
                cmd.Parameters.AddWithValue("@OutputCurrC_PF", request.OutputCurrC_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OutputFreq_T", request.OutputFreq_T);
                cmd.Parameters.AddWithValue("@OutputFreq_PF", request.OutputFreq_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OutputLoadA", request.OutputLoadA);
                cmd.Parameters.AddWithValue("@OutputLoadB", request.OutputLoadB);
                cmd.Parameters.AddWithValue("@OutputLoadC", request.OutputLoadC);
                cmd.Parameters.AddWithValue("@TotalLoad", request.TotalLoad);
                cmd.Parameters.AddWithValue("@RectFloatVolt_PF", request.RectFloatVolt_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@DCVoltage_T", request.DCVoltage_T);
                cmd.Parameters.AddWithValue("@DCVoltage_PF", request.DCVoltage_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ACRipple_T", request.ACRipple_T);
                cmd.Parameters.AddWithValue("@ACRipple_PF", request.ACRipple_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@DCCurrent_T", request.DCCurrent_T);
                cmd.Parameters.AddWithValue("@DCCurrent_PF", request.DCCurrent_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ACRippleVolt_T", request.ACRippleVolt_T);
                cmd.Parameters.AddWithValue("@ACRippleVolt_PF", request.ACRippleVolt_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@POStoGND_T", request.POStoGND_T);
                cmd.Parameters.AddWithValue("@POStoGND_PF", request.POStoGND_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ACRippleCurr_T", request.ACRippleCurr_T);
                cmd.Parameters.AddWithValue("@ACRippleCurr_PF", request.ACRippleCurr_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@NEGtoGND_T", request.NEGtoGND_T);
                cmd.Parameters.AddWithValue("@NEGtoGND_PF", request.NEGtoGND_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OutputLoadA_PF", request.OutputLoadA_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OutputLoadB_PF", request.OutputLoadB_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OutputLoadC_PF", request.OutputLoadC_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Comments5", request.Comments5 ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@DCCapsLeak_PF", request.DCCapsLeak_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@DCCapsAge_PF", request.DCCapsAge_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ACInputCapsLeak_PF", request.ACInputCapsLeak_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ACInputCapsAge_PF", request.ACInputCapsAge_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ACOutputCapsLeak_PF", request.ACOutputCapsLeak_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ACOutputCapsAge_PF", request.ACOutputCapsAge_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@CommCapsLeak_PF", request.CommCapsLeak_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@CommCapsAge_PF", request.CommCapsAge_PF ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@DCGAction1", request.DCGAction1 ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@CustAction1", request.CustAction1 ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ManufSpecification", request.ManufSpecification ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@DCGAction2", request.DCGAction2 ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@CustAction2", request.CustAction2 ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@DCCapsYear", request.DCCapsYear);
                cmd.Parameters.AddWithValue("@ACInputCapsYear", request.ACInputCapsYear);
                cmd.Parameters.AddWithValue("@ACOutputCapsYear", request.ACOutputCapsYear);
                cmd.Parameters.AddWithValue("@CommCapsYear", request.CommCapsYear);
                cmd.Parameters.AddWithValue("@FansYear", request.FansYear);
                cmd.Parameters.AddWithValue("@Location", request.Location ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@SNMPPresent", request.SNMPPresent ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@SaveAsDraft", request.SaveAsDraft);
                cmd.Parameters.AddWithValue("@ModularUPS", request.ModularUPS ?? (object)DBNull.Value);

                await conn.OpenAsync();
                var result = await cmd.ExecuteNonQueryAsync();

                _logger.LogInformation("SaveUpdateaaETechUPS completed for CallNbr={CallNbr}, EquipId={EquipId}, UpsId={UpsId}",
                    request.CallNbr, request.EquipId, request.UpsId);

                return result;
            }
            catch (SqlException ex)
            {
                _logger.LogError(ex, "SQL error in SaveUpdateaaETechUPSAsync for CallNbr={CallNbr}, EquipId={EquipId}, UpsId={UpsId}",
                    request.CallNbr, request.EquipId, request.UpsId);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error in SaveUpdateaaETechUPSAsync for CallNbr={CallNbr}, EquipId={EquipId}, UpsId={UpsId}",
                    request.CallNbr, request.EquipId, request.UpsId);
                throw;
            }
        }
    }

}

