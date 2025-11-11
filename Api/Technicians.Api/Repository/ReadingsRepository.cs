using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Text;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class ReadingsRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;
        private readonly string _gpconnectionString;

        public ReadingsRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
            _gpconnectionString = _configuration.GetConnectionString("ETechGreatPlainsConnString");
        }

        public async Task<IEnumerable<ManufacturerDto>> GetManufacturerNamesAsync()
        {
            const string sql = @"
            SELECT DISTINCT 
                RTRIM(ManufID) AS ManufId,
                RTRIM(ManufName) AS ManufName
            FROM Manufacturer
            ORDER BY ManufName";

            using (var connection = new SqlConnection(_connectionString))
            {
                return await connection.QueryAsync<ManufacturerDto>(sql);
            }
        }

        public async Task<IEnumerable<BatteryInfo>> GetBatteryInfoAsync(string callNbr, int equipId, string batteryStringId)
        {
            const string storedProc = "GetBatteryInfo";

            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@strBattId", batteryStringId, DbType.String);
                parameters.Add("@EquipId", equipId, DbType.Int32);
                parameters.Add("@CallNbr", callNbr, DbType.String);

                var result = await connection.QueryAsync<BatteryInfo>(
                    storedProc,
                    parameters,
                    commandType: CommandType.StoredProcedure
                );

                return result;
            }
        }

        public async Task<BatteryStringInfo> GetBatteryStringReadingsInfoAsync(string callNbr, int equipId, string batStrId)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var parameters = new DynamicParameters();
                parameters.Add("@CallNbr", callNbr);
                parameters.Add("@EquipId", equipId);
                parameters.Add("@strBattId", batStrId);

                // Call stored procedure
                var result = await connection.QueryFirstOrDefaultAsync<BatteryStringInfo>(
                    "GetBatteryStringReadings",
                    parameters,
                    commandType: CommandType.StoredProcedure
                );

                // If SP returned a row but EquipStatus is null/empty, get fallback
                if (result != null && string.IsNullOrWhiteSpace(result.EquipStatus))
                {
                    result.EquipStatus = await GetEquipStatusAsync(callNbr, equipId);
                }

                return result;
            }
        }

        private async Task<string> GetEquipStatusAsync(string callNbr, int equipId)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                const string sql = @"
                SELECT CODEEQUIPMENTSTATUS
                FROM ETECHEQUIPMENTINFO
                WHERE CALLNBR = @CallNbr AND EQUIPID = @EquipId";

                var status = await connection.ExecuteScalarAsync<string>(sql, new { CallNbr = callNbr, EquipId = equipId });

                return string.IsNullOrWhiteSpace(status) ? string.Empty : status.Trim();
            }
        }

        public async Task<IEnumerable<BatteryTypeValue>> GetBatteryTypeValuesAsync(string type, string battType, string floatVoltS, int floatVoltV)
        {
            var result = new List<BatteryTypeValue>();

            using (var con = new SqlConnection(_connectionString))
            using (var cmd = new SqlCommand("GetBatteryTypeValues", con))
            {
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@Type", type);
                cmd.Parameters.AddWithValue("@BattType", battType);
                cmd.Parameters.AddWithValue("@FloatVoltS", floatVoltS);
                cmd.Parameters.AddWithValue("@FloatVoltV", floatVoltV);

                try
                {
                    await con.OpenAsync();
                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            result.Add(new BatteryTypeValue
                            {
                                MonitorStrt = reader["MonitorStrt"]?.ToString(),
                                MonitorEnd = reader["MonitorEnd"]?.ToString(),
                                Replace = reader["Replace"]?.ToString(),
                                BatteryAge = reader["BatteryAge"] != DBNull.Value
                                    ? Convert.ToInt32(reader["BatteryAge"])
                                    : 0
                            });
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error in GetBatteryTypeValuesAsync: {ex.Message}");
                }
            }

            return result;
        }


        public async Task<IEnumerable<Dictionary<string, object>>> SaveOrGetReferenceValuesAsync(
            int equipId,
            string type,
            string midType,
            string makeModel,
            decimal value,
            decimal resValue)
        {
            var result = new List<Dictionary<string, object>>();

            using var con = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand("SaveUpdateRefValues", con);
            cmd.CommandType = CommandType.StoredProcedure;

            cmd.Parameters.AddWithValue("@EquipID", equipId);
            cmd.Parameters.AddWithValue("@Type", type);
            cmd.Parameters.AddWithValue("@MidType", midType);
            cmd.Parameters.AddWithValue("@MakeModel", makeModel);
            cmd.Parameters.AddWithValue("@Value", value);
            cmd.Parameters.AddWithValue("@Resistnace", resValue);

            await con.OpenAsync();

            if (type == "G")
            {
                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    var row = new Dictionary<string, object>();
                    for (int i = 0; i < reader.FieldCount; i++)
                    {
                        row[reader.GetName(i)] = reader.IsDBNull(i) ? null : reader.GetValue(i);
                    }
                    result.Add(row);
                }
            }
            else
            {
                await cmd.ExecuteNonQueryAsync();
            }

            return result;
        }

        public async Task SaveOrUpdateBatteryStringReadingsAsync(BatteryStringInfo binfo)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var parameters = new DynamicParameters();

                parameters.Add("@CallNo", binfo.CallNbr);
                parameters.Add("@EquipId", binfo.EquipId);
                parameters.Add("@BatteryStringId", binfo.BatteryStringId);
                parameters.Add("@Manufacturer", binfo.Manufacturer);
                parameters.Add("@BatteryHousing", binfo.BatteryHousing);
                parameters.Add("@ModelNo", binfo.ModelNo);
                parameters.Add("@SerialNo", binfo.SerialNo);
                parameters.Add("@BatteryType", binfo.BatteryType);
                parameters.Add("@Active", binfo.EquipStatus);
                parameters.Add("@DateCodeMonth", binfo.BatteryDateCodeMonth);
                parameters.Add("@DateCodeYear", binfo.BatteryDateCodeYear);
                parameters.Add("@Comments_Used", binfo.Comments_Used);
                parameters.Add("@Bulged_Check", binfo.Bulged_Check);
                parameters.Add("@Bulged_PF", binfo.Bulged_PF);
                parameters.Add("@Cracked_Check", binfo.Cracked_Check);
                parameters.Add("@Cracked_PF", binfo.Cracked_PF);
                parameters.Add("@Debris_Check", binfo.Debris_Check);
                parameters.Add("@Debris_PF", binfo.Debris_PF);
                parameters.Add("@Rotten", binfo.Rotten);
                parameters.Add("@VerifySaftey", binfo.VerifySaftey);
                parameters.Add("@ContainerComments", binfo.ContainerComments);
                parameters.Add("@EnvironmentComments", binfo.EnvironmentComments);

                parameters.Add("@BatteryVoltage", binfo.BatteryVoltage);
                parameters.Add("@PlusTerminal", binfo.PlusTerminalToGround);
                parameters.Add("@MinusTerminal", binfo.MinusTerminalToGround);
                parameters.Add("@DCCharge", binfo.DCChargingCurrent);
                parameters.Add("@ACRippleCurrent", binfo.ACRippleCurrent);
                parameters.Add("@ACRippleVolt", binfo.ACRipple);

                parameters.Add("@Voltage_PF", binfo.BatVoltage_PF);
                parameters.Add("@PlusTerm_PF", binfo.PlusTerminal_PF);
                parameters.Add("@MinusTerm_PF", binfo.MinusTerminal_PF);
                parameters.Add("@DCCharging_PF", binfo.DCCharging_PF);
                parameters.Add("@ACRipple_PF", binfo.ACRipple_PF);
                parameters.Add("@ACRippleCurrent_PF", binfo.ACRipple_PF); // matching legacy typo

                parameters.Add("@InterCell_PF", binfo.Resistance_PF);
                parameters.Add("@Torque_PF", binfo.CodeTorque_PF);

                parameters.Add("@Feedback", binfo.Comment);
                parameters.Add("@PlusWrapped", binfo.PlusWrapped_PF);
                parameters.Add("@PlusWrapped_Check", binfo.PlusWrapped_Check);
                parameters.Add("@PlusSulfated_Check", binfo.PlusSulfated_Check);
                parameters.Add("@PlusMisPos_Check", binfo.PlusMisPos_Check);
                parameters.Add("@Missing_Check", binfo.Missing_Check);
                parameters.Add("@Missing_PF", binfo.Missing_PF);
                parameters.Add("@Broken_Check", binfo.Broken_Check);
                parameters.Add("@NeedsCleaning_Check", binfo.NeedsCleaning_Check);
                parameters.Add("@PlatesComments", binfo.PlatesComments);
                parameters.Add("@WaterLevel_T", binfo.WaterLevel_T);
                parameters.Add("@WaterLevel_PF", binfo.WaterLevel_PF);
                parameters.Add("@ElectrolytesComments", binfo.ElectrolytesComments);
                parameters.Add("@BatteryTemp_PF", binfo.BatteryTemp_PF);
                parameters.Add("@Temp", binfo.Temp);
                parameters.Add("@Quantity_Used", binfo.Quantity_Used);
                parameters.Add("@TobeMonitored", binfo.TobeMonitored);
                parameters.Add("@Reason_Replace", binfo.Reason_Replace);
                parameters.Add("@FloatVoltS", binfo.FloatVoltS);
                parameters.Add("@FloatVoltV", binfo.FloatVoltV);
                parameters.Add("@IntercellConnector", binfo.IntercellConnector);
                parameters.Add("@ReplaceWholeString", binfo.ReplaceWholeString);
                parameters.Add("@MaintAuth", binfo.Maint_Auth_Id);
                parameters.Add("@RepMonCalc", binfo.RepMonCalc);
                parameters.Add("@BatteryPackCount", binfo.BatteryPackCount);
                parameters.Add("@IndBattDisconnect", binfo.IndBattDisconnect);
                parameters.Add("@IndBattInterconnect", binfo.IndBattInterConn);
                parameters.Add("@RackIntegrity", binfo.RackIntegrity);
                parameters.Add("@VFOperation", binfo.VFOperation);
                parameters.Add("@Location", binfo.Location);
                parameters.Add("@ReadingType", binfo.ReadingType);
                parameters.Add("@StringType", binfo.StringType);
                parameters.Add("@SaveAsDraft", binfo.SaveAsDraft);
                parameters.Add("@chkmVAC", binfo.chkmVAC);
                parameters.Add("@chkStrap", binfo.chkStrap);
                parameters.Add("@BattTemp", binfo.BattTemp);
                parameters.Add("@BattTemp_PF", binfo.BattTemp_PF);
                parameters.Add("@BatteryTypeName", binfo.BatteryTypeName);
                parameters.Add("@BatteryTerminalS", binfo.BattTerminalS);
                parameters.Add("@BatteryTerminalT", binfo.BattTerminalT);
                parameters.Add("@BatteryTerminalType", binfo.BattTypeTerminal);
                parameters.Add("@ReadingMethod", binfo.ReadingMethod);
                parameters.Add("@chkGraph", binfo.chkGraph);


                await connection.ExecuteAsync(
                    "SaveUpdateBatteryStringReadings",
                    parameters,
                    commandType: CommandType.StoredProcedure
                );
            }
        }


        public async Task<bool> SaveBatteryDataAsync(List<BatteryReadingDto> batteries)
        {
            if (batteries == null || batteries.Count == 0)
                return false;

            var first = batteries[0];
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();

            using var tran = con.BeginTransaction();
            try
            {
                // 1️⃣ Delete existing battery data for the same callNbr/equipId/batteryStringId
                using (var delCmd = new SqlCommand(@"DELETE FROM Battery 
                    WHERE CallNbr = @CallNbr AND EquipID = @EquipID AND BatteryStringID = @BatteryStringID", con, tran))
                {
                    delCmd.Parameters.AddWithValue("@CallNbr", first.CallNbr);
                    delCmd.Parameters.AddWithValue("@EquipID", first.EquipId);
                    delCmd.Parameters.AddWithValue("@BatteryStringID", first.BatteryStringId);
                    await delCmd.ExecuteNonQueryAsync();
                }

                // 2️⃣ Insert new rows
                var sb = new StringBuilder();
                sb.AppendLine("INSERT INTO Battery (CallNbr, EquipID, BatteryStringID, BatteryID, Temp, VDC, MHOS, Strap1, Strap2, SPGravity, VAC, Cracks, ReplacementNeeded, MonitoringBattery, ActionPlan, LastModified, Maint_Auth_ID)");

                int index = 0;
                foreach (var b in batteries)
                {
                    decimal mhosVal = b.Mhos;
                    if (mhosVal > 0)
                        mhosVal = 1000 / mhosVal;

                    sb.Append("SELECT ");
                    sb.AppendFormat("'{0}', {1}, '{2}', {3}, {4}, {5}, {6}, {7}, {8}, {9}, {10}, '{11}', '{12}', '{13}', '{14}', GETDATE(), '{15}'",
                        b.CallNbr,
                        b.EquipId,
                        b.BatteryStringId.Replace("'", "''"),
                        b.BatteryId,
                        b.Temp,
                        b.Vdc,
                        mhosVal,
                        b.Strap1,
                        b.Strap2,
                        b.SpGravity,
                        b.Vac,
                        b.Cracks,
                        b.ReplacementNeeded,
                        b.MonitoringBattery,
                        b.ActionPlan?.Replace("'", "''") ?? "",
                        b.MaintAuthId);

                    if (++index < batteries.Count)
                        sb.AppendLine(" UNION ALL");
                }

                using (var insertCmd = new SqlCommand(sb.ToString(), con, tran))
                {
                    await insertCmd.ExecuteNonQueryAsync();
                }

                await tran.CommitAsync();
                return true;
            }
            catch
            {
                await tran.RollbackAsync();
                throw;
            }
        }


        public DataSet EditEquipInfo(string callNbr, int equipId)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                SqlCommand cmd = new SqlCommand("[dbo].[EditEquipmentDetails]", conn);
                cmd.CommandType = CommandType.StoredProcedure;
                cmd.Parameters.AddWithValue("@CallNbr", callNbr);
                cmd.Parameters.AddWithValue("@EquipId", equipId);
                cmd.Parameters.AddWithValue("@EquipNo", "");

                SqlDataAdapter adapter = new SqlDataAdapter(cmd);
                DataSet ds = new DataSet();
                adapter.Fill(ds);
                return ds;
            }
        }

        public bool UpdateBatteryInfo(string callNbr, int equipId, string equipNo, int i,
                                      int? batteriesPerString, int? batteriesPerPack, string readingType)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                conn.Open();
                string sql;

                if (i == 2)
                {
                    sql = @"UPDATE ETechEquipmentInfo
                            SET BatteriesPerString = @BatteriesPerString,
                                BatteriesPerPack = @BatteriesPerPack
                            WHERE CallNbr = @CallNbr AND EquipId = @EquipId AND EquipNo = @EquipNo";
                }
                else
                {
                    sql = @"UPDATE ETechEquipmentInfo
                            SET ReadingType = @ReadingType
                            WHERE CallNbr = @CallNbr AND EquipId = @EquipId AND EquipNo = @EquipNo";
                }

                using (SqlCommand cmd = new SqlCommand(sql, conn))
                {
                    cmd.Parameters.AddWithValue("@CallNbr", callNbr);
                    cmd.Parameters.AddWithValue("@EquipId", equipId);
                    cmd.Parameters.AddWithValue("@EquipNo", equipNo);
                    cmd.Parameters.AddWithValue("@BatteriesPerString", (object)batteriesPerString ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@BatteriesPerPack", (object)batteriesPerPack ?? DBNull.Value);
                    cmd.Parameters.AddWithValue("@ReadingType", (object)readingType ?? DBNull.Value);

                    return cmd.ExecuteNonQuery() > 0;
                }
            }
        }

        public bool DeleteBattery(string callNbr, int equipId, string batStrId)
        {
            using (SqlConnection con = new SqlConnection(_connectionString))
            {
                try
                {
                    con.Open();
                    using (SqlCommand cmd = new SqlCommand("DeleteBattery", con))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;
                        cmd.Parameters.AddWithValue("@CallNbr", callNbr);
                        cmd.Parameters.AddWithValue("@strBattId", batStrId);
                        cmd.Parameters.AddWithValue("@EquipId", equipId);

                        int rowsAffected = cmd.ExecuteNonQuery();
                        return rowsAffected > 0;
                    }
                }
                catch (Exception)
                {
                    // Optionally log exception here
                    return false;
                }
                finally
                {
                    if (con.State == ConnectionState.Open)
                        con.Close();
                }
            }
        }

        public async Task<BatteryStringInfo> GetBatteryStringReadingsInfoTempAsync(string callNbr, int equipId, string batStrId)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var parameters = new DynamicParameters();
                parameters.Add("@CallNbr", callNbr);
                parameters.Add("@EquipId", equipId);
                parameters.Add("@strBattId", batStrId);

                // Call stored procedure
                var result = await connection.QueryFirstOrDefaultAsync<BatteryStringInfo>(
                    "GetBatteryStringReadingsTemp",
                    parameters,
                    commandType: CommandType.StoredProcedure
                );

                // If SP returned a row but EquipStatus is null/empty, get fallback
                if (result != null && string.IsNullOrWhiteSpace(result.EquipStatus))
                {
                    result.EquipStatus = await GetEquipStatusAsync(callNbr, equipId);
                }

                return result;
            }
        }

        public async Task<IEnumerable<BatteryInfo>> GetBatteryInfoTempAsync(string callNbr, int equipId, string batteryStringId)
        {
            const string storedProc = "GetBatteryInfoTemp";

            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();

                var parameters = new DynamicParameters();
                parameters.Add("@strBattId", batteryStringId, DbType.String);
                parameters.Add("@EquipId", equipId, DbType.Int32);
                parameters.Add("@CallNbr", callNbr, DbType.String);

                var result = await connection.QueryAsync<BatteryInfo>(
                    storedProc,
                    parameters,
                    commandType: CommandType.StoredProcedure
                );

                return result;
            }
        }
    }
}
