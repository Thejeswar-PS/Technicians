using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query.Internal;
using Microsoft.Extensions.Configuration;
using System.Data;
using System.Globalization;
using System.Xml.Linq;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class PartsDataRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public PartsDataRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
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

        


        //8. Update Parts Received
        public async Task UpdatePartsReceivedAsync(TechPartsReceivedDto request)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();

                var command = new SqlCommand("dbo.UpdateTechPartsRecieved", connection)
                {
                    CommandType = CommandType.StoredProcedure
                };

                command.Parameters.AddWithValue("@Service_Call_ID", request.ServiceCallId);
                command.Parameters.AddWithValue("@SCID_Inc", string.Join(",", request.ScidIncList));
                command.Parameters.AddWithValue("@Maint_Auth_ID", request.MaintAuthId);

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

