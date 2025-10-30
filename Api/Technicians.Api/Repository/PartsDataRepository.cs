using Dapper;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query.Internal;
using Microsoft.Extensions.Configuration;
using System.Data;
using System.Globalization;
using System.Management.Automation;
using System.Xml.Linq;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class PartsDataRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;
        private readonly string _gpconnectionString;

        public PartsDataRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
            _gpconnectionString = _configuration.GetConnectionString("ETechGreatPlainsConnString");
        }

        //1. Get PartsInfo
        public async Task<List<PartsDataDto>> GetJobPartsInfoAsync(string callNbr)
        {
            using var conn = new SqlConnection(_connectionString);
            var results = await conn.QueryAsync<PartsDataDto>(
                "GetPartsData",
                new { CallNbr = callNbr },
                commandType: CommandType.StoredProcedure
            );
            return results.AsList();
        }

        //2. Get Parts Req Data by Call Number and SCID_Inc
        public async Task<IEnumerable<PartsReqDataDto>> GetPartsRequestsAsync(string callNbr, int scidInc)
        {
            using var conn = new SqlConnection(_connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@CallNbr", callNbr, DbType.String);
            parameters.Add("@SCID_Inc", scidInc, DbType.Int32);

            var result = await conn.QueryAsync<PartsReqDataDto>(
                "GetPartsReqData",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return result;
        }

        //3.Get Shipping Info
        public async Task<IEnumerable<PartsShippingDataDto>> GetShippingPartsAsync(string callNbr, int? scidInc = 0)
        {
            using var conn = new SqlConnection(_connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@CallNbr", callNbr, DbType.String);
            parameters.Add("@SCID_Inc", scidInc ?? 0, DbType.Int32);

            await conn.OpenAsync();
            var rows = await conn.QueryAsync(sql: "GetShippingData", param: parameters, commandType: CommandType.StoredProcedure, commandTimeout: 60);

            // map each dynamic row to DTO using helper parsers (handles DBNull, empty strings, bad data)
            var list = rows.Select(row =>
            {
                var dict = (IDictionary<string, object>)row;
                return new PartsShippingDataDto
                {
                    Service_Call_ID = Get<string>(dict, "Service_Call_ID"),
                    SCID_Inc = Get<int>(dict, "SCID_Inc"),
                    Part_Num = Get<string>(dict, "Part_Num"),
                    DC_Part_Num = Get<string>(dict, "DC_Part_Num"),
                    Description = Get<string>(dict, "Description"),
                    Shipping_Company = Get<string>(dict, "Shipping_Company"),
                    Tracking_Num = Get<string>(dict, "Tracking_Num"),
                    Courier = Get<string>(dict, "Courier"),
                    Destination = Get<string>(dict, "Destination"),
                    Ship_Date = Get<DateTime?>(dict, "Ship_Date"),
                    Qty = Get<int?>(dict, "Qty"),
                    Shipment_Type = Get<string>(dict, "Shipment_Type"),
                    Shipping_Cost = Get<decimal?>(dict, "Shipping_Cost"),
                    Courier_Cost = Get<decimal?>(dict, "Courier_Cost"),
                    ETA = Get<DateTime?>(dict, "ETA"),
                    Shipped_from = Get<string>(dict, "Shipped_from"),
                    Create_Date = Get<DateTime?>(dict, "Create_Date"),
                    LastModified = Get<DateTime?>(dict, "LastModified"),
                    BackOrder = Get<bool>(dict, "BackOrder"),
                    Maint_Auth_ID = Get<string>(dict, "Maint_Auth_ID")
                };
            }).ToList();

            return list;
        }

        //4. Get Tech Parts Req Data by Call Number and SCID_Inc
        public async Task<List<TechPartDto>> GetTechPartsDataAsync(string callNbr, int scidInc)
        {
            var results = new List<TechPartDto>();
            using var conn = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand("GetTechPartsData", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            cmd.Parameters.AddWithValue("@CallNbr", callNbr);
            cmd.Parameters.AddWithValue("@SCID_Inc", scidInc);

            await conn.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                results.Add(new TechPartDto
                {
                    Service_Call_ID = reader["Service_Call_ID"].ToString(),
                    SCID_INC = Convert.ToInt32(reader["SCID_INC"]),
                    PART_NUM = reader["PART_NUM"].ToString(),
                    DC_PART_NUM = reader["DC_PART_NUM"].ToString(),
                    TotalQty = Convert.ToInt32(reader["TotalQty"]),
                    DESCRIPTION = reader["DESCRIPTION"].ToString(),
                    InstalledParts = Convert.ToInt32(reader["InstalledParts"]),
                    UNUSEDPARTS = Convert.ToInt32(reader["UNUSEDPARTS"]),
                    FAULTYPARTS = Convert.ToInt32(reader["FAULTYPARTS"]),
                    UNUSED_DESC = reader["UNUSED_DESC"].ToString(),
                    FAULTY_DESC = reader["FAULTY_DESC"].ToString(),
                    MANUFACTURER = reader["MANUFACTURER"].ToString(),
                    MODELNO = reader["MODELNO"].ToString(),
                    PARTSOURCE = reader["PARTSOURCE"].ToString(),
                    CREATE_DATE = reader["CREATE_DATE"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["CREATE_DATE"]),
                    LASTMODIFIED = reader["LASTMODIFIED"] == DBNull.Value ? DateTime.MinValue : Convert.ToDateTime(reader["LASTMODIFIED"]),
                    LastModifiedBy = reader["LastModifiedBy"] == DBNull.Value ? string.Empty : reader["LastModifiedBy"].ToString(),
                    ISRECEIVED = reader["ISRECEIVED"].ToString(),
                    ISBRANDNEW = reader["ISBRANDNEW"].ToString(),
                    IsPartsLeft = reader["IsPartsLeft"].ToString(),
                    TrackingInfo = reader["TrackingInfo"] == DBNull.Value ? string.Empty : reader["TrackingInfo"].ToString()
                });
            }

            return results;
        }

        //5. Get Parts Equip Info by Call Number
        public async Task<IEnumerable<PartsEquipInfoDto>> GetPartsEquipInfoAsync(string callNbr)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();
                var parameters = new DynamicParameters();
                parameters.Add("@CallNbr", callNbr, DbType.String, ParameterDirection.Input);

                return await connection.QueryAsync<PartsEquipInfoDto>(
                    "[dbo].[GetPartsEquipInfo]",
                    parameters,
                    commandType: CommandType.StoredProcedure
                );
            }
        }

        //6. Get Tech Return Parts by Call Number
        public async Task<TechReturnPartsDto?> GetTechReturnPartsAsync(string callNbr)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                var result = await conn.QueryFirstOrDefaultAsync<TechReturnPartsDto>(
                    "[dbo].[GetTechReturnPartsData]",
                    new { CallNbr = callNbr },
                    commandType: CommandType.StoredProcedure
                );

                // If not found, QueryFirstOrDefault returns null, so handle this:
                if (result == null)
                {
                    // SP will return { UnUsedSentBack = "9999" }, so it's covered
                    return new TechReturnPartsDto { UnUsedSentBack = "9999" };
                }
                return result;
            }
        }

        //7. Save or Update Shipping Info
        public async Task<int> UpdateJobPartsInfoAsync(ShippingInfoDto request, string empId)
        {
            using var connection = new SqlConnection(_connectionString);
            using var command = new SqlCommand("SaveUpdateShippingInfo", connection)
            {
                CommandType = CommandType.StoredProcedure
            };

            command.Parameters.AddWithValue("@Service_Call_ID", (object)request.CallNbr ?? DBNull.Value);
            command.Parameters.AddWithValue("@TechID", (object)request.TechID ?? DBNull.Value);
            command.Parameters.AddWithValue("@Technician", (object)request.TechName ?? DBNull.Value);
            command.Parameters.AddWithValue("@ContactName", (object)request.ContactName ?? DBNull.Value);
            command.Parameters.AddWithValue("@ContactPh", (object)request.ContactPh ?? DBNull.Value);
            command.Parameters.AddWithValue("@VerifyPh", request.VerifyPh);
            command.Parameters.AddWithValue("@ReqNotes", (object)request.Notes ?? DBNull.Value);
            command.Parameters.AddWithValue("@ShipNotes", (object)request.ShippingNotes ?? DBNull.Value);
            command.Parameters.AddWithValue("@Status", (object)request.ShippingStatus ?? DBNull.Value);
            command.Parameters.AddWithValue("@Source", request.Source);
            command.Parameters.AddWithValue("@Maint_Auth_ID", empId); // same as legacy

            await connection.OpenAsync();
            int rows = await command.ExecuteNonQueryAsync();
            return rows;
        }

        //8. Save or Update Parts Equip Info
        public async Task SaveOrUpdatePartsEquipInfoAsync(SavePartsEquipInfoDto request, String empId)
        {
            using var connection = new SqlConnection(_connectionString);
            using var command = new SqlCommand("dbo.SaveUpdatePartsEquipInfo", connection)
            {
                CommandType = CommandType.StoredProcedure
            };

            command.Parameters.AddWithValue("@Service_Call_ID", (object)request.CallNbr ?? DBNull.Value);
            command.Parameters.AddWithValue("@TechID", (object)request.TechID ?? DBNull.Value);
            command.Parameters.AddWithValue("@Technician", (object)request.TechName ?? DBNull.Value);

            command.Parameters.AddWithValue("@EquipNo", (object)request.EquipNo ?? DBNull.Value);
            command.Parameters.AddWithValue("@Make", (object)request.Make ?? DBNull.Value);
            command.Parameters.AddWithValue("@Model", (object)request.Model ?? DBNull.Value);
            command.Parameters.AddWithValue("@KVA", (object)request.KVA ?? DBNull.Value);
            command.Parameters.AddWithValue("@IPVoltage", (object)request.IPVolt ?? DBNull.Value);
            command.Parameters.AddWithValue("@OPVoltage", (object)request.OPVolt ?? DBNull.Value);
            command.Parameters.AddWithValue("@AddInfo", (object)request.AddInfo ?? DBNull.Value);

            command.Parameters.AddWithValue("@EquipNo1", (object)request.EquipNo1 ?? DBNull.Value);
            command.Parameters.AddWithValue("@Make1", (object)request.Make1 ?? DBNull.Value);
            command.Parameters.AddWithValue("@Model1", (object)request.Model1 ?? DBNull.Value);
            command.Parameters.AddWithValue("@KVA1", (object)request.KVA1 ?? DBNull.Value);
            command.Parameters.AddWithValue("@IPVoltage1", (object)request.IPVolt1 ?? DBNull.Value);
            command.Parameters.AddWithValue("@OPVoltage1", (object)request.OPVolt1 ?? DBNull.Value);
            command.Parameters.AddWithValue("@AddInfo1", (object)request.AddInfo1 ?? DBNull.Value);

            command.Parameters.AddWithValue("@EmgNotes", (object)request.EmgNotes ?? DBNull.Value);
            command.Parameters.AddWithValue("@Maint_Auth_ID", empId);

            await connection.OpenAsync();
            await command.ExecuteNonQueryAsync();
        }

        //9. Update Parts Received
        public async Task<bool> UpdateTechPartsReceivedAsync(string callNbr, string scidIncs, string empId)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("dbo.UpdateTechPartsRecieved", connection))
                {
                    command.CommandType = CommandType.StoredProcedure;
                    command.Parameters.AddWithValue("@Service_Call_ID", callNbr);
                    command.Parameters.AddWithValue("@SCID_Inc", scidIncs);
                    command.Parameters.AddWithValue("@Maint_Auth_ID", empId);

                    await connection.OpenAsync();
                    await command.ExecuteNonQueryAsync();
                    return true;
                }
            }
            catch (Exception ex)
            {
                // optionally log ex
                return false;
            }
        }

        //10. IsUPSTaskedForJob
        public async Task<int> IsUPSTaskedForJobAsync(string callNbr)
        {
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                using (var command = new SqlCommand("SELECT dbo.IsUPSTaskedForJob(@CallNbr)", connection))
                {
                    command.Parameters.AddWithValue("@CallNbr", callNbr?.Trim() ?? (object)DBNull.Value);

                    await connection.OpenAsync();
                    var result = await command.ExecuteScalarAsync();

                    // Ensure proper int conversion (like legacy Convert.ToInt32)
                    return result != null && int.TryParse(result.ToString(), out int val) ? val : 0;
                }
            }
            catch
            {
                // Return 0 on any failure (consistent with legacy)
                return 0;
            }
        }


        //11. Check Inventory Item and return it's description
        public async Task<InventoryItemCheckDto> CheckInventoryItemAsync(string itemNbr)
        {
            var dto = new InventoryItemCheckDto();

            using (var connection = new SqlConnection(_gpconnectionString))
            {
                await connection.OpenAsync();

                // --- Check if part exists ---
                using (var existsCmd = new SqlCommand("SELECT dbo.aafnInvItemExist(@PartNbr)", connection))
                {
                    existsCmd.Parameters.AddWithValue("@PartNbr", itemNbr);
                    var existsResult = await existsCmd.ExecuteScalarAsync();
                    dto.Exists = Convert.ToInt32(existsResult) == 1;
                }

                // --- Get item description only if part exists ---
                if (dto.Exists)
                {
                    using (var descCmd = new SqlCommand("SELECT dbo.aafnInvGetItemDesc(@PartNbr)", connection))
                    {
                        descCmd.Parameters.AddWithValue("@PartNbr", itemNbr);
                        var descResult = await descCmd.ExecuteScalarAsync();
                        dto.Description = descResult?.ToString() ?? "Not Found";
                    }
                }
                else
                {
                    dto.Description = "Not Found";
                }
            }

            return dto;
        }

        //12. Parts Req Exists or not
        public async Task<bool> CheckPartRequestExistsAsync(string callNbr, string partNbr)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();

                using (var command = new SqlCommand("SELECT dbo.aaReqPartsExist(@CallNbr, @DCGPartNo)", connection))
                {
                    command.Parameters.AddWithValue("@CallNbr", callNbr);
                    command.Parameters.AddWithValue("@DCGPartNo", partNbr);

                    var result = await command.ExecuteScalarAsync();
                    return Convert.ToInt32(result) == 1;
                }
            }
        }

        //13. Check if Equip Info in Parts Req
        public async Task<string> GetEquipInfoInPartReqAsync(string callNbr)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();

                using (var command = new SqlCommand("SELECT dbo.IsEquipInfoInPartReq(@CallNbr)", connection))
                {
                    command.Parameters.AddWithValue("@CallNbr", callNbr);

                    var result = await command.ExecuteScalarAsync();
                    return result?.ToString() ?? string.Empty;
                }
            }
        }

        //14. Check if all parts rae received
        public async Task<int> IsAllPartsReceivedByWHAsync(string callNbr)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();

                using (var command = new SqlCommand("SELECT dbo.ISAllPartsReceivedbyWH(@CallNbr)", connection))
                {
                    command.Parameters.AddWithValue("@CallNbr", callNbr);

                    var result = await command.ExecuteScalarAsync();
                    return result != null ? Convert.ToInt32(result) : 0;
                }
            }
        }

        //15. Save/Update Part
        public async Task SaveOrUpdatePartsRequestAsync(PartsRequestDto request, String empId)
        {
            using (var connection = new SqlConnection(_connectionString))
            using (var command = new SqlCommand("SaveUpdatePartsReq", connection))
            {
                command.CommandType = CommandType.StoredProcedure;

                command.Parameters.AddWithValue("@Service_Call_ID", request.ServiceCallID);
                command.Parameters.AddWithValue("@SCID_Inc", request.ScidInc);
                command.Parameters.AddWithValue("@Qty", request.Qty);
                command.Parameters.AddWithValue("@Part_Num", request.PartNum);
                command.Parameters.AddWithValue("@DC_Part_Num", request.DcPartNum);
                command.Parameters.AddWithValue("@Description", request.Description);
                command.Parameters.AddWithValue("@Destination", request.Destination);
                command.Parameters.AddWithValue("@Required_Date", request.RequiredDate);
                command.Parameters.AddWithValue("@Required_Time", request.RequiredDate); // same date, or adjust if separate
                command.Parameters.AddWithValue("@BackOrder", request.BackOrder);
                command.Parameters.AddWithValue("@Urgent", request.Urgent);
                command.Parameters.AddWithValue("@Shipping_Method", request.ShippingMethod);
                command.Parameters.AddWithValue("@Maint_Auth_ID", empId);
                command.Parameters.AddWithValue("@TechName", request.TechName);
                command.Parameters.AddWithValue("@Location", request.Location);

                await connection.OpenAsync();
                await command.ExecuteNonQueryAsync();

                //using (var updateCommand = new SqlCommand(@"UPDATE Parts_Ship_Log_Part SET BackOrder = @BackOrder 
                //        WHERE Service_Call_ID = @Service_Call_ID AND SCID_Inc = @RowID", connection))
                //{
                //    updateCommand.Parameters.AddWithValue("@BackOrder", request.BackOrder ? 1 : 0);
                //    updateCommand.Parameters.AddWithValue("@Service_Call_ID", request.ServiceCallID?.Trim() ?? (object)DBNull.Value);
                //    updateCommand.Parameters.AddWithValue("@RowID", request.ScidInc);

                //    await updateCommand.ExecuteNonQueryAsync();
                //}
            }
        }

        //16. Save/Update Shipping
        public bool SaveShippingPart(ShippingPartDto shipPart, string empId, out string errorMsg)
        {
            errorMsg = string.Empty;
            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    connection.Open();
                    using (SqlCommand cmd = new SqlCommand("SaveUpdatePartsShip", connection))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;

                        cmd.Parameters.AddWithValue("@Service_Call_ID", shipPart.ServiceCallID);
                        cmd.Parameters.AddWithValue("@SCID_Inc", shipPart.ScidInc);
                        cmd.Parameters.AddWithValue("@Part_Num", shipPart.PartNum);
                        cmd.Parameters.AddWithValue("@DC_Part_Num", shipPart.DcPartNum);
                        cmd.Parameters.AddWithValue("@Description", shipPart.Description);
                        cmd.Parameters.AddWithValue("@Shipping_Company", shipPart.ShippingCompany);
                        cmd.Parameters.AddWithValue("@Tracking_Num", shipPart.TrackingNum);
                        cmd.Parameters.AddWithValue("@Courier", empId); // using empId as courier field
                        cmd.Parameters.AddWithValue("@Destination", shipPart.Destination);
                        cmd.Parameters.AddWithValue("@Ship_Date", shipPart.ShipDate);
                        cmd.Parameters.AddWithValue("@Qty", shipPart.Qty);
                        cmd.Parameters.AddWithValue("@Shipment_Type", shipPart.ShipmentType);
                        cmd.Parameters.AddWithValue("@Shipping_Cost", shipPart.ShippingCost);
                        cmd.Parameters.AddWithValue("@Courier_Cost", shipPart.CourierCost);
                        cmd.Parameters.AddWithValue("@ETA", shipPart.Eta);
                        cmd.Parameters.AddWithValue("@Shipped_from", shipPart.ShippedFrom);
                        cmd.Parameters.AddWithValue("@Maint_Auth_ID", empId); // legacy: getUID()
                        cmd.Parameters.AddWithValue("@BackOrder", shipPart.BackOrder);

                        cmd.ExecuteNonQuery();
                    }
                }
                return true;
            }
            catch (Exception ex)
            {
                errorMsg = ex.Message;
                return false;
            }
        }

        //17. Save/Update Tech Part
        public bool SaveTechPart(TechPartsDto techPart, string empId, string source, out string errorMsg)
        {
            errorMsg = string.Empty;

            try
            {
                using (var connection = new SqlConnection(_connectionString))
                {
                    connection.Open();
                    using (var cmd = new SqlCommand("SaveUpdatePartsTech", connection))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;

                        cmd.Parameters.AddWithValue("@Service_Call_ID", techPart.ServiceCallID?.Trim());
                        cmd.Parameters.AddWithValue("@SCID_Inc", techPart.ScidInc);
                        cmd.Parameters.AddWithValue("@Part_Num", techPart.PartNum);
                        cmd.Parameters.AddWithValue("@DC_Part_Num", techPart.DcPartNum);
                        cmd.Parameters.AddWithValue("@TotalQty", techPart.TotalQty);
                        cmd.Parameters.AddWithValue("@Description", techPart.Description);
                        cmd.Parameters.AddWithValue("@InstalledParts", techPart.InstalledParts);
                        cmd.Parameters.AddWithValue("@UnusedParts", techPart.UnusedParts);
                        cmd.Parameters.AddWithValue("@FaultyParts", techPart.FaultyParts);
                        cmd.Parameters.AddWithValue("@Unused_Desc", techPart.UnusedDesc ?? string.Empty);
                        cmd.Parameters.AddWithValue("@Faulty_Desc", techPart.FaultyDesc ?? string.Empty);
                        cmd.Parameters.AddWithValue("@Manufacturer", techPart.Manufacturer ?? string.Empty);
                        cmd.Parameters.AddWithValue("@ModelNo", techPart.ModelNo ?? string.Empty);
                        cmd.Parameters.Add("@PartSource", SqlDbType.Int).Value =
                            int.TryParse(techPart.PartSource.ToString(), out var ps) ? ps : 0;
                        cmd.Parameters.AddWithValue("@Maint_Auth_ID", empId);
                        cmd.Parameters.AddWithValue("@IsReceived", techPart.IsReceived);
                        cmd.Parameters.AddWithValue("@IsBrandNew", techPart.BrandNew);
                        cmd.Parameters.AddWithValue("@SaveSource", source);
                        cmd.Parameters.AddWithValue("@IsPartsLeft", techPart.PartsLeft);
                        cmd.Parameters.AddWithValue("@TrackingInfo", techPart.TrackingInfo ?? string.Empty);

                        cmd.ExecuteNonQuery();
                    }
                }
                return true;
            }
            catch (Exception ex)
            {
                errorMsg = ex.Message;
                return false;
            }
        }


        //18. Delete Part
        public string DeletePart(DeletePartRequest request)
        {
            string errMsg = string.Empty;

            using (SqlConnection con = new SqlConnection(_connectionString))
            {
                try
                {
                    con.Open();
                    using (SqlCommand cmd = new SqlCommand("DeleteParts", con))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@CallNbr", request.CallNbr);
                        cmd.Parameters.AddWithValue("@SCID_Inc", request.ScidInc);
                        cmd.Parameters.AddWithValue("@Source", request.Display);
                        cmd.Parameters.AddWithValue("@ModifiedBy", request.EmpId ?? "System"); // fallback if null

                        int result = cmd.ExecuteNonQuery();
                    }
                }
                catch (Exception ex)
                {
                    errMsg = ex.Message;
                }
            }

            return errMsg;
        }






        //6. Save or Update Tech Returned Parts
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

        


        


        //9. Upload Job to GP_WOW
        public async Task<int> UploadJobToGPAsync(UploadJobToGP_WowDto request)
        {
            using (var connection = new SqlConnection(_connectionString))
            using (var command = new SqlCommand("dbo.UploadJobToGP_Wow", connection))
            {
                command.CommandType = CommandType.StoredProcedure;
                command.Parameters.AddWithValue("@CallNbr", request.CallNumber);
                command.Parameters.AddWithValue("@strUser", request.UserName);

                await connection.OpenAsync();

                var result = await command.ExecuteScalarAsync();
                return Convert.ToInt32(result); // the SP returns @myERROR
            }
        }

        


        //Helper method
        private static T Get<T>(IDictionary<string, object> dict, string key)
        {
            // match keys case-insensitively
            var kv = dict.FirstOrDefault(k => string.Equals(k.Key, key, StringComparison.OrdinalIgnoreCase));
            if (kv.Key == null) return default!;

            var val = kv.Value;
            if (val == null || val == DBNull.Value) return default!;

            var targetType = typeof(T);
            var nullableUnderlying = Nullable.GetUnderlyingType(targetType);
            var isNullable = nullableUnderlying != null || !targetType.IsValueType;
            var effectiveType = nullableUnderlying ?? targetType;

            var s = val as string;
            if (s != null)
            {
                if (string.IsNullOrWhiteSpace(s))
                {
                    return default!;
                }

                if (effectiveType == typeof(int))
                {
                    return (T)(object)(int.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var i) ? i : default(int));
                }
                if (effectiveType == typeof(decimal))
                {
                    return (T)(object)(decimal.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var d) ? d : default(decimal));
                }
                if (effectiveType == typeof(double))
                {
                    return (T)(object)(double.TryParse(s, NumberStyles.Any, CultureInfo.InvariantCulture, out var dd) ? dd : default(double));
                }
                if (effectiveType == typeof(DateTime))
                {
                    return (T)(object?)(DateTime.TryParse(s, CultureInfo.InvariantCulture, DateTimeStyles.AssumeLocal, out var dt) ? dt : (DateTime?)null);
                }
                if (effectiveType == typeof(bool))
                {
                    if (bool.TryParse(s, out var b)) return (T)(object)b;
                    if (s == "0") return (T)(object)false;
                    if (s == "1") return (T)(object)true;
                }
                // fallback string->object conversions
                try
                {
                    var converted = Convert.ChangeType(s, effectiveType, CultureInfo.InvariantCulture);
                    return (T)converted!;
                }
                catch
                {
                    return default!;
                }
            }

            try
            {
                // if val is already the correct type or convertible
                if (effectiveType.IsInstanceOfType(val)) return (T)val!;
                var converted = Convert.ChangeType(val, effectiveType, CultureInfo.InvariantCulture);
                return (T)converted!;
            }
            catch
            {
                return default!;
            }
        }
    }
}

