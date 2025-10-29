using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System.Data;
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
                    Make = reader["Make"].ToString(),
                    MakeCorrect = reader["MakeCorrect"].ToString(),
                    ActMake = reader["ActMake"].ToString(),

                    Model = reader["Model"].ToString(),
                    ModelCorrect = reader["ModelCorrect"].ToString(),
                    ActModel = reader["ActModel"].ToString(),

                    SerialNo = reader["SerialNo"].ToString(),
                    SerialNoCorrect = reader["SerialNoCorrect"].ToString(),
                    ActSerialNo = reader["ActSerialNo"].ToString(),

                    KVA = reader["KVA"].ToString(),
                    KVACorrect = reader["KVACorrect"].ToString(),
                    ActKVA = reader["ActKVA"].ToString(),

                    ASCStringsNo = Convert.ToInt32(reader["ASCStringsNo"]),
                    ASCStringsCorrect = reader["ASCStringsCorrect"].ToString(),
                    ActASCStringNo = Convert.ToInt32(reader["ActASCStringNo"]),

                    BattPerString = Convert.ToInt32(reader["BattPerString"]),
                    BattPerStringCorrect = reader["BattPerStringCorrect"].ToString(),
                    ActBattPerString = Convert.ToInt32(reader["ActBattPerString"]),

                    TotalEquips = Convert.ToInt32(reader["TotalEquips"]),
                    TotalEquipsCorrect = reader["TotalEquipsCorrect"].ToString(),
                    ActTotalEquips = Convert.ToInt32(reader["ActTotalEquips"]),

                    NewEquipment = reader["NewEquipment"].ToString(),
                    EquipmentNotes = reader["EquipmentNotes"].ToString(),
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
    }
}
