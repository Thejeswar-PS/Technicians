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

        //16b. EditEquipInfo
        public async Task<EditEquipInfoDto> EditEquipInfoAsync(string callNbr, int equipId)
        {
            using var connection = new SqlConnection(_connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@CallNbr", callNbr);
            parameters.Add("@EquipId", equipId);
            parameters.Add("@EquipNo", "");

            await connection.OpenAsync();

            using var multi = await connection.QueryMultipleAsync(
                "EditEquipmentDetails",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            var equipInfo = (await multi.ReadAsync<EditEquipInfoDto>()).FirstOrDefault();
            var batteryInfo = (await multi.ReadAsync<EditEquipInfoDto>()).FirstOrDefault();

            if (equipInfo != null && batteryInfo != null)
            {
                // Merge battery info into equipInfo
                equipInfo.BatteryHousing = batteryInfo.BatteryHousing;
                equipInfo.BatteryType = batteryInfo.BatteryType;
                equipInfo.FloatVoltV = batteryInfo.FloatVoltV;
                equipInfo.FloatVoltS = batteryInfo.FloatVoltS;
                equipInfo.DCCapsYear = batteryInfo.DCCapsYear;
                equipInfo.ACInputCapsYear = batteryInfo.ACInputCapsYear;
                equipInfo.DCCommCapsYear = batteryInfo.DCCommCapsYear;
                equipInfo.ACOutputCapsYear = batteryInfo.ACOutputCapsYear;
            }

            return equipInfo;
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

        // 18. InsertOrUpdateEquipment
        public async Task<int> InsertOrUpdateEquipmentAsync(EquipmentInsertUpdateDto dto)
        {
            try
            {
                await using var conn = new SqlConnection(_connectionString);
                var parameters = new DynamicParameters(dto);
                await conn.OpenAsync();
                var rows = await conn.ExecuteAsync("spEquipmentInsertUpdate", parameters, commandType: CommandType.StoredProcedure);
                return rows;
            }
            catch (Exception)
            {
                return 0;
            }
        }

        // 19. DeleteEquipment
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
                return 0; // indicate failure
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
                // Do not swallow exception - let caller (controller) handle and log it for debugging
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
    }
 }

