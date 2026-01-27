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
                parameters.Add("@ReplaceWholeString", (bool)binfo.ReplaceWholeString);
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

        public async Task SaveOrUpdateBatteryStringReadingsTempAsync(BatteryStringInfo binfo)
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


                await connection.ExecuteAsync(
                    "SaveUpdateBatteryStringReadingsTemp",
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

        public async Task<bool> SaveBatteryDataTempAsync(List<BatteryReadingDto> batteries)
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
                using (var delCmd = new SqlCommand(@"DELETE FROM BatteryTemp 
                    WHERE CallNbr = @CallNbr AND EquipID = @EquipID AND BatteryStringID = @BatteryStringID", con, tran))
                {
                    delCmd.Parameters.AddWithValue("@CallNbr", first.CallNbr);
                    delCmd.Parameters.AddWithValue("@EquipID", first.EquipId);
                    delCmd.Parameters.AddWithValue("@BatteryStringID", first.BatteryStringId);
                    await delCmd.ExecuteNonQueryAsync();
                }

                // 2️⃣ Insert new rows
                var sb = new StringBuilder();
                sb.AppendLine("INSERT INTO BatteryTemp (CallNbr, EquipID, BatteryStringID, BatteryID, Temp, VDC, MHOS, Strap1, Strap2, SPGravity, VAC, Cracks, ReplacementNeeded, MonitoringBattery, ActionPlan, LastModified, Maint_Auth_ID)");

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

        public bool DeleteBatteryTemp(string callNbr, int equipId, string batStrId)
        {
            using (SqlConnection con = new SqlConnection(_connectionString))
            {
                try
                {
                    con.Open();
                    using (SqlCommand cmd = new SqlCommand("DeleteBatteryTemp", con))
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


        public async Task<aaETechPDU> GetPDUAsync(string callNbr, int equipId, string pduId)
        {
            aaETechPDU data = new aaETechPDU();
            string errorMessage = "";

            using var con = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand("GetaaETechPDU", con);

            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@CallNbr", callNbr);
            cmd.Parameters.AddWithValue("@EquipId", equipId);
            cmd.Parameters.AddWithValue("@PDUId", pduId);

            try
            {
                await con.OpenAsync();
                var dr = await cmd.ExecuteReaderAsync();

                if (dr.HasRows)
                {
                    while (await dr.ReadAsync())
                    {
                        data.CallNbr = callNbr;
                        data.EquipId = equipId;
                        data.PDUId = pduId;

                        data.Manufacturer = dr.IsDBNull(3) ? null : dr.GetString(3);
                        data.ModelNo = dr.IsDBNull(4) ? null : dr.GetString(4);
                        data.SerialNo = dr.IsDBNull(5) ? null : dr.GetString(5);
                        data.Temp = dr.IsDBNull(6) ? 0 : Convert.ToInt32(dr.GetValue(6));
                        data.Status = dr.IsDBNull(7) ? null : dr.GetString(7);
                        data.Busswork = dr.IsDBNull(8) ? null : dr.GetString(8);
                        data.Transformers = dr.IsDBNull(9) ? null : dr.GetString(9);
                        data.PowerConn = dr.IsDBNull(10) ? null : dr.GetString(10);
                        data.MainCirBreaks = dr.IsDBNull(11) ? null : dr.GetString(11);
                        data.SubfeedCirBreaks = dr.IsDBNull(12) ? null : dr.GetString(12);
                        data.CurrentCTs = dr.IsDBNull(13) ? null : dr.GetString(13);
                        data.CircuitBoards = dr.IsDBNull(14) ? null : dr.GetString(14);
                        data.FilterCapacitors = dr.IsDBNull(15) ? null : dr.GetString(15);
                        data.EPOConn = dr.IsDBNull(16) ? null : dr.GetString(16);
                        data.WiringConn = dr.IsDBNull(17) ? null : dr.GetString(17);
                        data.RibbonCables = dr.IsDBNull(18) ? null : dr.GetString(18);
                        data.CompAirClean = dr.IsDBNull(19) ? null : dr.GetString(19);
                        data.StaticSwitch = dr.IsDBNull(20) ? null : dr.GetString(20);
                        data.FrontPanel = dr.IsDBNull(21) ? null : dr.GetString(21);
                        data.InternalPower = dr.IsDBNull(22) ? null : dr.GetString(22);
                        data.LocalMonitoring = dr.IsDBNull(23) ? null : dr.GetString(23);
                        data.LocalEPO = dr.IsDBNull(24) ? null : dr.GetString(24);
                        data.KVA = dr.IsDBNull(25) ? null : dr.GetString(25);
                        data.StatusNotes = dr.IsDBNull(26) ? null : dr.GetString(26);
                        data.Comments = dr.IsDBNull(27) ? null : dr.GetString(27);
                        data.Comments1 = dr.IsDBNull(28) ? null : dr.GetString(28);
                        data.Comments5 = dr.IsDBNull(29) ? null : dr.GetString(29);
                        data.Input = dr.IsDBNull(30) ? null : dr.GetString(30);

                        data.InputVoltA_T = dr.IsDBNull(31) ? 0 : Convert.ToDouble(dr.GetValue(31));
                        data.InputVoltA_PF = dr.IsDBNull(32) ? null : dr.GetString(32);
                        data.InputVoltB_T = dr.IsDBNull(33) ? 0 : Convert.ToDouble(dr.GetValue(33));
                        data.InputVoltB_PF = dr.IsDBNull(34) ? null : dr.GetString(34);
                        data.InputVoltC_T = dr.IsDBNull(35) ? 0 : Convert.ToDouble(dr.GetValue(35));
                        data.InputVoltC_PF = dr.IsDBNull(36) ? null : dr.GetString(36);

                        data.InputCurrA_T = dr.IsDBNull(37) ? 0 : Convert.ToDouble(dr.GetValue(37));
                        data.InputCurrA_PF = dr.IsDBNull(38) ? null : dr.GetString(38);
                        data.InputCurrB_T = dr.IsDBNull(39) ? 0 : Convert.ToDouble(dr.GetValue(39));
                        data.InputCurrB_PF = dr.IsDBNull(40) ? null : dr.GetString(40);
                        data.InputCurrC_T = dr.IsDBNull(41) ? 0 : Convert.ToDouble(dr.GetValue(41));
                        data.InputCurrC_PF = dr.IsDBNull(42) ? null : dr.GetString(42);

                        data.InputFreq_T = dr.IsDBNull(43) ? 0 : Convert.ToDouble(dr.GetValue(43));
                        data.InputFreq_PF = dr.IsDBNull(44) ? null : dr.GetString(44);

                        data.Output = dr.IsDBNull(45) ? null : dr.GetString(45);

                        data.OutputVoltA_T = dr.IsDBNull(46) ? 0 : Convert.ToDouble(dr.GetValue(46));
                        data.OutputVoltA_PF = dr.IsDBNull(47) ? null : dr.GetString(47);
                        data.OutputVoltB_T = dr.IsDBNull(48) ? 0 : Convert.ToDouble(dr.GetValue(48));
                        data.OutputVoltB_PF = dr.IsDBNull(49) ? null : dr.GetString(49);
                        data.OutputVoltC_T = dr.IsDBNull(50) ? 0 : Convert.ToDouble(dr.GetValue(50));
                        data.OutputVoltC_PF = dr.IsDBNull(51) ? null : dr.GetString(51);

                        data.OutputCurrA_T = dr.IsDBNull(52) ? 0 : Convert.ToDouble(dr.GetValue(52));
                        data.OutputCurrA_PF = dr.IsDBNull(53) ? null : dr.GetString(53);
                        data.OutputCurrB_T = dr.IsDBNull(54) ? 0 : Convert.ToDouble(dr.GetValue(54));
                        data.OutputCurrB_PF = dr.IsDBNull(55) ? null : dr.GetString(55);
                        data.OutputCurrC_T = dr.IsDBNull(56) ? 0 : Convert.ToDouble(dr.GetValue(56));
                        data.OutputCurrC_PF = dr.IsDBNull(57) ? null : dr.GetString(57);

                        data.OutputFreq_T = dr.IsDBNull(58) ? 0 : Convert.ToDouble(dr.GetValue(58));
                        data.OutputFreq_PF = dr.IsDBNull(59) ? null : dr.GetString(59);

                        data.OutputLoadA = dr.IsDBNull(60) ? 0 : Convert.ToDouble(dr.GetValue(60));
                        data.OutputLoadB = dr.IsDBNull(61) ? 0 : Convert.ToDouble(dr.GetValue(61));
                        data.OutputLoadC = dr.IsDBNull(62) ? 0 : Convert.ToDouble(dr.GetValue(62));
                        data.TotalLoad = dr.IsDBNull(63) ? 0 : Convert.ToDouble(dr.GetValue(63));

                        data.Neutral_T = dr.IsDBNull(64) ? 0 : Convert.ToDouble(dr.GetValue(64));
                        data.Ground_T = dr.IsDBNull(65) ? 0 : Convert.ToDouble(dr.GetValue(65));

                        data.OutputLoadA_PF = dr.IsDBNull(66) ? null : dr.GetString(66);
                        data.OutputLoadB_PF = dr.IsDBNull(67) ? null : dr.GetString(67);
                        data.OutputLoadC_PF = dr.IsDBNull(68) ? null : dr.GetString(68);

                        data.Location = dr.IsDBNull(72) ? null : dr.GetString(72);
                        data.Month = dr.IsDBNull(73) ? null : dr.GetString(73);
                        data.Year = dr.IsDBNull(74) ? 0 : Convert.ToInt32(dr.GetValue(74));
                    }
                }
                else
                {
                    errorMessage = "No Readings Found";
                }
            }
            catch (Exception ex)
            {
                errorMessage = ex.Message;
            }

            // If no status returned from SP → Get from equipment table
            if (string.IsNullOrEmpty(data.Status))
            {
                data.Status = await GetPDUEquipStatusAsync(callNbr, equipId);
            }

            return data;
        }

        // -------------------------
        // Helper: get equipment status
        // -------------------------
        private async Task<string> GetPDUEquipStatusAsync(string callNbr, int equipId)
        {
            using var con = new SqlConnection(_connectionString);
            string sql = @"SELECT CODEEQUIPMENTSTATUS 
                           FROM ETECHEQUIPMENTINFO 
                           WHERE CALLNBR = @CallNbr AND EQUIPID = @EquipID";

            using var cmd = new SqlCommand(sql, con);
            cmd.Parameters.AddWithValue("@CallNbr", callNbr);
            cmd.Parameters.AddWithValue("@EquipID", equipId);

            try
            {
                await con.OpenAsync();
                var result = await cmd.ExecuteScalarAsync();
                return result?.ToString()?.Trim();
            }
            catch
            {
                return null;
            }
        }


        public bool SaveUpdateAaETechPDU(aaETechPDU AEP, out string ErrMsg)
        {
            ErrMsg = string.Empty;

            using var con = new SqlConnection(_connectionString);
            {
                try
                {
                    con.Open();

                    using (SqlCommand cmd = new SqlCommand("SaveUpdateaaETechPDU", con))
                    {
                        cmd.CommandType = CommandType.StoredProcedure;

                        cmd.Parameters.AddWithValue("@CallNbr", AEP.CallNbr);
                        cmd.Parameters.AddWithValue("@EquipId", AEP.EquipId);
                        cmd.Parameters.AddWithValue("@PDUId", AEP.PDUId);
                        cmd.Parameters.AddWithValue("@Manufacturer", AEP.Manufacturer);
                        cmd.Parameters.AddWithValue("@ModelNo", AEP.ModelNo);
                        cmd.Parameters.AddWithValue("@SerialNo", AEP.SerialNo);
                        cmd.Parameters.AddWithValue("@Location", AEP.Location);
                        cmd.Parameters.AddWithValue("@Month", AEP.Month);
                        cmd.Parameters.AddWithValue("@Year", AEP.Year);
                        cmd.Parameters.AddWithValue("@Temp", AEP.Temp);
                        cmd.Parameters.AddWithValue("@Status", AEP.Status);
                        cmd.Parameters.AddWithValue("@Busswork", AEP.Busswork);
                        cmd.Parameters.AddWithValue("@Transformers", AEP.Transformers);
                        cmd.Parameters.AddWithValue("@PowerConn", AEP.PowerConn);
                        cmd.Parameters.AddWithValue("@MainCirBreaks", AEP.MainCirBreaks);
                        cmd.Parameters.AddWithValue("@SubfeedCirBreaks", AEP.SubfeedCirBreaks);
                        cmd.Parameters.AddWithValue("@CurrentCTs", AEP.CurrentCTs);
                        cmd.Parameters.AddWithValue("@CircuitBoards", AEP.CircuitBoards);
                        cmd.Parameters.AddWithValue("@FilterCapacitors", AEP.FilterCapacitors);
                        cmd.Parameters.AddWithValue("@EPOConn", AEP.EPOConn);
                        cmd.Parameters.AddWithValue("@WiringConn", AEP.WiringConn);
                        cmd.Parameters.AddWithValue("@RibbonCables", AEP.RibbonCables);
                        cmd.Parameters.AddWithValue("@CompAirClean", AEP.CompAirClean);
                        cmd.Parameters.AddWithValue("@StaticSwitch", AEP.StaticSwitch);
                        cmd.Parameters.AddWithValue("@FrontPanel", AEP.FrontPanel);
                        cmd.Parameters.AddWithValue("@InternalPower", AEP.InternalPower);
                        cmd.Parameters.AddWithValue("@LocalMonitoring", AEP.LocalMonitoring);
                        cmd.Parameters.AddWithValue("@LocalEPO", AEP.LocalEPO);
                        cmd.Parameters.AddWithValue("@KVA", AEP.KVA);
                        cmd.Parameters.AddWithValue("@StatusNotes", AEP.StatusNotes);
                        cmd.Parameters.AddWithValue("@Comments", AEP.Comments);
                        cmd.Parameters.AddWithValue("@Comments1", AEP.Comments1);
                        cmd.Parameters.AddWithValue("@Comments5", AEP.Comments5);
                        cmd.Parameters.AddWithValue("@Input", AEP.Input);
                        cmd.Parameters.AddWithValue("@InputVoltA_T", AEP.InputVoltA_T);
                        cmd.Parameters.AddWithValue("@InputVoltA_PF", AEP.InputVoltA_PF);
                        cmd.Parameters.AddWithValue("@InputVoltB_T", AEP.InputVoltB_T);
                        cmd.Parameters.AddWithValue("@InputVoltB_PF", AEP.InputVoltB_PF);
                        cmd.Parameters.AddWithValue("@InputVoltC_T", AEP.InputVoltC_T);
                        cmd.Parameters.AddWithValue("@InputVoltC_PF", AEP.InputVoltC_PF);
                        cmd.Parameters.AddWithValue("@InputCurrA_T", AEP.InputCurrA_T);
                        cmd.Parameters.AddWithValue("@InputCurrA_PF", AEP.InputCurrA_PF);
                        cmd.Parameters.AddWithValue("@InputCurrB_T", AEP.InputCurrB_T);
                        cmd.Parameters.AddWithValue("@InputCurrB_PF", AEP.InputCurrB_PF);
                        cmd.Parameters.AddWithValue("@InputCurrC_T", AEP.InputCurrC_T);
                        cmd.Parameters.AddWithValue("@InputCurrC_PF", AEP.InputCurrC_PF);
                        cmd.Parameters.AddWithValue("@InputFreq_T", AEP.InputFreq_T);
                        cmd.Parameters.AddWithValue("@InputFreq_PF", AEP.InputFreq_PF);
                        cmd.Parameters.AddWithValue("@Output", AEP.Output);
                        cmd.Parameters.AddWithValue("@OutputVoltA_T", AEP.OutputVoltA_T);
                        cmd.Parameters.AddWithValue("@OutputVoltA_PF", AEP.OutputVoltA_PF);
                        cmd.Parameters.AddWithValue("@OutputVoltB_T", AEP.OutputVoltB_T);
                        cmd.Parameters.AddWithValue("@OutputVoltB_PF", AEP.OutputVoltB_PF);
                        cmd.Parameters.AddWithValue("@OutputVoltC_T", AEP.OutputVoltC_T);
                        cmd.Parameters.AddWithValue("@OutputVoltC_PF", AEP.OutputVoltC_PF);
                        cmd.Parameters.AddWithValue("@OutputCurrA_T", AEP.OutputCurrA_T);
                        cmd.Parameters.AddWithValue("@OutputCurrA_PF", AEP.OutputCurrA_PF);
                        cmd.Parameters.AddWithValue("@OutputCurrB_T", AEP.OutputCurrB_T);
                        cmd.Parameters.AddWithValue("@OutputCurrB_PF", AEP.OutputCurrB_PF);
                        cmd.Parameters.AddWithValue("@OutputCurrC_T", AEP.OutputCurrC_T);
                        cmd.Parameters.AddWithValue("@OutputCurrC_PF", AEP.OutputCurrC_PF);
                        cmd.Parameters.AddWithValue("@OutputFreq_T", AEP.OutputFreq_T);
                        cmd.Parameters.AddWithValue("@OutputFreq_PF", AEP.OutputFreq_PF);
                        cmd.Parameters.AddWithValue("@OutputLoadA", AEP.OutputLoadA);
                        cmd.Parameters.AddWithValue("@OutputLoadB", AEP.OutputLoadB);
                        cmd.Parameters.AddWithValue("@OutputLoadC", AEP.OutputLoadC);
                        cmd.Parameters.AddWithValue("@TotalLoad", AEP.TotalLoad);
                        cmd.Parameters.AddWithValue("@Neutral_T", AEP.Neutral_T);
                        cmd.Parameters.AddWithValue("@Ground_T", AEP.Ground_T);
                        cmd.Parameters.AddWithValue("@OutputLoadA_PF", AEP.OutputLoadA_PF);
                        cmd.Parameters.AddWithValue("@OutputLoadB_PF", AEP.OutputLoadB_PF);
                        cmd.Parameters.AddWithValue("@OutputLoadC_PF", AEP.OutputLoadC_PF);
                        cmd.Parameters.AddWithValue("@Maint_Auth_ID", AEP.Maint_Auth_Id);
                        cmd.Parameters.AddWithValue("@SaveAsDraft", AEP.SaveAsDraft);

                        cmd.ExecuteNonQuery();
                    }

                    return true;
                }
                catch (Exception ex)
                {
                    ErrMsg = ex.Message;
                    return false;
                }
            }
        }

        public async Task<ATSInfo?> GetATSInfoAsync(string callNbr, string equipNo, int equipId)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var parameters = new DynamicParameters();
                parameters.Add("@CallNbr", callNbr);
                parameters.Add("@ATSId", equipNo);   // Your CodeId → ATSId
                //parameters.Add("@EquipId", equipId); // You had commented this before

                var result = await connection.QueryFirstOrDefaultAsync<ATSInfo>(
                    "GetATSInfo",
                    parameters,
                    commandType: CommandType.StoredProcedure
                );

                return result;
            }
        }

        public async Task<bool> SaveOrUpdateATSAsync(ATSInfo dto)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                var parameters = new DynamicParameters();

                parameters.Add("@CallNbr", dto.CallNbr);
                parameters.Add("@EquipId", dto.EquipId);
                parameters.Add("@ATSId", dto.ATSId);

                parameters.Add("@Manufacturer", dto.Manufacturer);
                parameters.Add("@ModelNo", dto.ModelNo);
                parameters.Add("@SerialNo", dto.SerialNo);
                parameters.Add("@Temp", dto.Temp);
                parameters.Add("@Status", dto.Status);
                parameters.Add("@Voltage", dto.Voltage);
                parameters.Add("@Amps", dto.Amps);

                parameters.Add("@Poles", dto.Poles);
                parameters.Add("@Manuals", dto.Manuals);
                parameters.Add("@Clean", dto.Clean);
                parameters.Add("@Inspect", dto.Inspect);
                parameters.Add("@CheckContact", dto.CheckContact);
                parameters.Add("@InspectARC", dto.InspectARC);
                parameters.Add("@TransferSwitch", dto.TransferSwitch);
                parameters.Add("@TestSwitch", dto.TestSwitch);
                parameters.Add("@Comments1", dto.Comments1);

                parameters.Add("@EngineStart", dto.EngineStart);
                parameters.Add("@TransferEmergency", dto.TransferEmergency);
                parameters.Add("@ReTransferNormal", dto.ReTransferNormal);
                parameters.Add("@GensetCooldown", dto.GensetCooldown);
                parameters.Add("@ClockTime", dto.ClockTime);

                parameters.Add("@PickupVoltA", dto.PickupVoltA);
                parameters.Add("@PickupVoltB", dto.PickupVoltB);
                parameters.Add("@PickupVoltC", dto.PickupVoltC);

                parameters.Add("@DropoutVoltA", dto.DropoutVoltA);
                parameters.Add("@DropoutVoltB", dto.DropoutVoltB);
                parameters.Add("@DropoutVoltC", dto.DropoutVoltC);

                parameters.Add("@EmVoltPickup", dto.EmVoltPickup);
                parameters.Add("@EmVoltDropout", dto.EmVoltDropout);

                parameters.Add("@FreqPick", dto.FreqPick);
                parameters.Add("@FreDropout", dto.FreqDropout);

                parameters.Add("@Comments2", dto.Comments2);
                parameters.Add("@StatusNotes", dto.StatusNotes);

                parameters.Add("@Maint_Auth_ID", dto.Maint_Auth_ID);

                await connection.ExecuteAsync(
                    "SaveUpdateATS",
                    parameters,
                    commandType: CommandType.StoredProcedure
                );

                return true;
            }
        }

        public async Task<AaETechSTS?> GetStsInfoAsync(
        string callNbr,
        int equipId,
        string stsId)
        {
            using var connection = new SqlConnection(_connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@CallNbr", callNbr);
            parameters.Add("@STSId", stsId);
            parameters.Add("@EquipId", equipId);

            var result = await connection.QueryFirstOrDefaultAsync<AaETechSTS>(
                "GetaaETechSTS",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return result;
        }

        public async Task SaveOrUpdateStsAsync(AaETechSTS sts)
        {
            using var connection = new SqlConnection(_connectionString);

            var p = new DynamicParameters();

            p.Add("@CallNbr", sts.CallNbr);
            p.Add("@EquipId", sts.EquipId);
            p.Add("@STSId", sts.STSId);
            p.Add("@Manufacturer", sts.Manufacturer);
            p.Add("@ModelNo", sts.ModelNo);
            p.Add("@SerialNo", sts.SerialNo);
            p.Add("@Location", sts.Location);
            p.Add("@Month", sts.Month);
            p.Add("@Year", sts.Year);
            p.Add("@Temp", sts.Temp);
            p.Add("@Status", sts.Status);

            p.Add("@Busswork", sts.Busswork);
            p.Add("@Transformers", sts.Transformers);
            p.Add("@PowerConn", sts.PowerConn);
            p.Add("@MainCirBreaks", sts.MainCirBreaks);
            p.Add("@SubfeedCirBreaks", sts.SubfeedCirBreaks);
            p.Add("@CurrentCTs", sts.CurrentCTs);
            p.Add("@CircuitBoards", sts.CircuitBoards);
            p.Add("@FanCapacitors", sts.FanCapacitors);
            p.Add("@EPOConn", sts.EPOConn);
            p.Add("@WiringConn", sts.WiringConn);
            p.Add("@RibbonCables", sts.RibbonCables);
            p.Add("@CompAirClean", sts.CompAirClean);
            p.Add("@FrontPanel", sts.FrontPanel);
            p.Add("@InternalPower", sts.InternalPower);
            p.Add("@LocalMonitoring", sts.LocalMonitoring);
            p.Add("@LocalEPO", sts.LocalEPO);

            p.Add("@KVA", sts.KVA);
            p.Add("@StatusNotes", sts.StatusNotes);
            p.Add("@Comments", sts.Comments);
            p.Add("@Comments5", sts.Comments5);

            // INPUT
            p.Add("@Input", sts.Input);
            p.Add("@InputVoltA_T", sts.InputVoltA_T);
            p.Add("@InputVoltA_PF", sts.InputVoltA_PF);
            p.Add("@InputVoltB_T", sts.InputVoltB_T);
            p.Add("@InputVoltB_PF", sts.InputVoltB_PF);
            p.Add("@InputVoltC_T", sts.InputVoltC_T);
            p.Add("@InputVoltC_PF", sts.InputVoltC_PF);
            p.Add("@InputCurrA_T", sts.InputCurrA_T);
            p.Add("@InputCurrA_PF", sts.InputCurrA_PF);
            p.Add("@InputCurrB_T", sts.InputCurrB_T);
            p.Add("@InputCurrB_PF", sts.InputCurrB_PF);
            p.Add("@InputCurrC_T", sts.InputCurrC_T);
            p.Add("@InputCurrC_PF", sts.InputCurrC_PF);
            p.Add("@InputFreq_T", sts.InputFreq_T);
            p.Add("@InputFreq_PF", sts.InputFreq_PF);

            // OUTPUT
            p.Add("@Output", sts.Output);
            p.Add("@OutputVoltA_T", sts.OutputVoltA_T);
            p.Add("@OutputVoltA_PF", sts.OutputVoltA_PF);
            p.Add("@OutputVoltB_T", sts.OutputVoltB_T);
            p.Add("@OutputVoltB_PF", sts.OutputVoltB_PF);
            p.Add("@OutputVoltC_T", sts.OutputVoltC_T);
            p.Add("@OutputVoltC_PF", sts.OutputVoltC_PF);
            p.Add("@OutputCurrA_T", sts.OutputCurrA_T);
            p.Add("@OutputCurrA_PF", sts.OutputCurrA_PF);
            p.Add("@OutputCurrB_T", sts.OutputCurrB_T);
            p.Add("@OutputCurrB_PF", sts.OutputCurrB_PF);
            p.Add("@OutputCurrC_T", sts.OutputCurrC_T);
            p.Add("@OutputCurrC_PF", sts.OutputCurrC_PF);
            p.Add("@OutputFreq_T", sts.OutputFreq_T);
            p.Add("@OutputFreq_PF", sts.OutputFreq_PF);
            p.Add("@OutputLoadA", sts.OutputLoadA);
            p.Add("@OutputLoadB", sts.OutputLoadB);
            p.Add("@OutputLoadC", sts.OutputLoadC);
            p.Add("@TotalLoad", sts.TotalLoad);
            p.Add("@OutputLoadA_PF", sts.OutputLoadA_PF);
            p.Add("@OutputLoadB_PF", sts.OutputLoadB_PF);
            p.Add("@OutputLoadC_PF", sts.OutputLoadC_PF);

            // SRC TWO
            p.Add("@SrcTwo", sts.SrcTwo);
            p.Add("@SrcTwoVoltA_T", sts.SrcTwoVoltA_T);
            p.Add("@SrcTwoVoltA_PF", sts.SrcTwoVoltA_PF);
            p.Add("@SrcTwoVoltB_T", sts.SrcTwoVoltB_T);
            p.Add("@SrcTwoVoltB_PF", sts.SrcTwoVoltB_PF);
            p.Add("@SrcTwoVoltC_T", sts.SrcTwoVoltC_T);
            p.Add("@SrcTwoVoltC_PF", sts.SrcTwoVoltC_PF);
            p.Add("@SrcTwoCurrA_T", sts.SrcTwoCurrA_T);
            p.Add("@SrcTwoCurrA_PF", sts.SrcTwoCurrA_PF);
            p.Add("@SrcTwoCurrB_T", sts.SrcTwoCurrB_T);
            p.Add("@SrcTwoCurrB_PF", sts.SrcTwoCurrB_PF);
            p.Add("@SrcTwoCurrC_T", sts.SrcTwoCurrC_T);
            p.Add("@SrcTwoCurrC_PF", sts.SrcTwoCurrC_PF);
            p.Add("@SrcTwoFreq_T", sts.SrcTwoFreq_T);
            p.Add("@SrcTwoFreq_PF", sts.SrcTwoFreq_PF);

            // VERIFICATION
            p.Add("@TVerification", sts.TVerification);
            p.Add("@PrefAlter", sts.PrefAlter);
            p.Add("@TransByPass", sts.TransByPass);
            p.Add("@STSByPass", sts.STSByPass);
            p.Add("@VerifyAlarm", sts.VerifyAlarm);

            p.Add("@SaveAsDraft", sts.SaveAsDraft);
            p.Add("@ModifiedBy", sts.Maint_Auth_Id); // replace with auth user later

            await connection.ExecuteAsync(
                "SaveUpdateaaETechSTS",
                p,
                commandType: CommandType.StoredProcedure
            );
        }

        public async Task<RectifierVerification> GetRectifierVerificationAsync(string callNbr, string rectifierId)
        {
            using var connection = new SqlConnection(_connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@CallNbr", callNbr);
            parameters.Add("@RectifierId", rectifierId);

            var result = await connection.QueryFirstOrDefaultAsync<RectifierVerification>(
                "GetRectifier_Verification",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            if (result == null)
            {
                throw new KeyNotFoundException("No Rectifier Verification data found.");
            }

            return result;
        }

        public async Task SaveOrUpdateRectifierVerificationAsync(RectifierVerification rcv)
        {
            using SqlConnection con = new SqlConnection(_connectionString);
            using SqlCommand cmd = new SqlCommand("SaveUpdateRectifierVerification", con);

            cmd.CommandType = CommandType.StoredProcedure;

            cmd.Parameters.AddWithValue("@CallNbr", rcv.CallNbr);
            cmd.Parameters.AddWithValue("@EquipId", rcv.EquipId);
            cmd.Parameters.AddWithValue("@RectifierId", rcv.RectifierId);

            cmd.Parameters.AddWithValue("@Manufacturer", rcv.Manufacturer);
            cmd.Parameters.AddWithValue("@ModelNo", rcv.ModelNo);
            cmd.Parameters.AddWithValue("@SerialNo", rcv.SerialNo);
            cmd.Parameters.AddWithValue("@Temp", rcv.Temp);
            cmd.Parameters.AddWithValue("@Status", rcv.Status);

            cmd.Parameters.AddWithValue("@DCBus_Make", rcv.DCBus_Make);
            cmd.Parameters.AddWithValue("@DCBus_Quantity", rcv.DCBus_Quantity);
            cmd.Parameters.AddWithValue("@DCBus_Age", rcv.DCBus_Age);

            cmd.Parameters.AddWithValue("@Input_Make", rcv.Input_Make);
            cmd.Parameters.AddWithValue("@Input_Quantity", rcv.Input_Quantity);
            cmd.Parameters.AddWithValue("@Input_Age", rcv.Input_Age);

            cmd.Parameters.AddWithValue("@Comm_Make", rcv.Comm_Make);
            cmd.Parameters.AddWithValue("@Comm_Quantity", rcv.Comm_Quantity);
            cmd.Parameters.AddWithValue("@Comm_Age", rcv.Comm_Age);

            cmd.Parameters.AddWithValue("@CurrLimitAlarms", rcv.CurrLimitAlarms);
            cmd.Parameters.AddWithValue("@HiVoltAlarm", rcv.HiVoltAlarm);
            cmd.Parameters.AddWithValue("@ShutdownAlarm", rcv.ShutdownAlarm);
            cmd.Parameters.AddWithValue("@LowCurrAlarm", rcv.LowCurrAlarm);
            cmd.Parameters.AddWithValue("@LoadSharing", rcv.LoadSharing);
            cmd.Parameters.AddWithValue("@VisualInspection", rcv.VisualInspection);
            cmd.Parameters.AddWithValue("@Comments", rcv.Comments);

            cmd.Parameters.AddWithValue("@Input208AVoltAtoB_T", rcv.Input208AVoltAtoB_T);
            cmd.Parameters.AddWithValue("@Input208AVoltAtoB_PF", rcv.Input208AVoltAtoB_PF);
            cmd.Parameters.AddWithValue("@Input208CurrA_T", rcv.Input208CurrA_T);
            cmd.Parameters.AddWithValue("@Input208CurrA_PF", rcv.Input208CurrA_PF);

            cmd.Parameters.AddWithValue("@Input208AVoltBtoC_T", rcv.Input208AVoltBtoC_T);
            cmd.Parameters.AddWithValue("@Input208AVoltBtoC_PF", rcv.Input208AVoltBtoC_PF ?? (object)DBNull.Value);

            cmd.Parameters.AddWithValue("@Input208CurrB_T", rcv.Input208CurrB_T);
            cmd.Parameters.AddWithValue("@Input208CurrB_PF", rcv.Input208CurrB_PF ?? (object)DBNull.Value);

            cmd.Parameters.AddWithValue("@Input208AVoltCtoA_T", rcv.Input208AVoltCtoA_T);
            cmd.Parameters.AddWithValue("@Input208AVoltCtoA_PF", rcv.Input208AVoltCtoA_PF ?? (object)DBNull.Value);

            cmd.Parameters.AddWithValue("@Input208CurrC_T", rcv.Input208CurrC_T);
            cmd.Parameters.AddWithValue("@Input208CurrC_PF", rcv.Input208CurrC_PF ?? (object)DBNull.Value);

            cmd.Parameters.AddWithValue("@FilterCurrent_T", rcv.FilterCurrent_T);
            cmd.Parameters.AddWithValue("@FilterCurrent_PF", rcv.FilterCurrent_PF ?? (object)DBNull.Value);

            cmd.Parameters.AddWithValue("@FloatVoltage_T", rcv.FloatVoltage_T);
            cmd.Parameters.AddWithValue("@FloatVoltage_PF", rcv.FloatVoltage_PF ?? (object)DBNull.Value);

            cmd.Parameters.AddWithValue("@LoadCurrent_T", rcv.LoadCurrent_T);
            cmd.Parameters.AddWithValue("@LoadCurrent_PF", rcv.LoadCurrent_PF ?? (object)DBNull.Value);


            cmd.Parameters.AddWithValue("@Frequency_T", rcv.Frequency_T);
            cmd.Parameters.AddWithValue("@Frequency_PF", rcv.Frequency_PF);

            cmd.Parameters.AddWithValue("@EqVoltage_T", rcv.EqVoltage_T);
            cmd.Parameters.AddWithValue("@EqVoltage_PF", rcv.EqVoltage_PF);

            cmd.Parameters.AddWithValue("@Used_PartsInstalled", rcv.Used_PartsInstalled);
            cmd.Parameters.AddWithValue("@Used_PartsShipped", rcv.Used_PartsShipped);
            cmd.Parameters.AddWithValue("@Used_FaultyCircuits", rcv.Used_FaultyCircuits);

            cmd.Parameters.AddWithValue("@Add_Type", rcv.Add_Type);
            cmd.Parameters.AddWithValue("@Add_Manuf", rcv.Add_Manuf);
            cmd.Parameters.AddWithValue("@Add_Quantity", rcv.Add_Quantity);
            cmd.Parameters.AddWithValue("@Add_ImmedAction", rcv.Add_ImmedAction);
            cmd.Parameters.AddWithValue("@UpgNonCritical", rcv.UpgNonCritical);

            cmd.Parameters.AddWithValue("@Comments1", rcv.Comments1);
            cmd.Parameters.AddWithValue("@Maint_Auth_ID", rcv.Maint_Auth_Id);
            cmd.Parameters.AddWithValue("@StatusNotes", rcv.StatusNotes);

            await con.OpenAsync();
            await cmd.ExecuteNonQueryAsync();
        }

        public async Task<SCCDto> GetSccInfoAsync(string callNbr, string rectifierId)
        {
            using var connection = new SqlConnection(_connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@CallNbr", callNbr);
            parameters.Add("@SCCId", rectifierId);

            var result = await connection.QueryFirstOrDefaultAsync<SCCDto>(
                "GetSCCInfo",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            //if (result == null)
            //{
            //    throw new KeyNotFoundException("No SCC data found.");
            //}

            return result;
        }

        public async Task SaveUpdateSccAsync(SCCDto scc)
        {
            using var con = new SqlConnection(_connectionString);
            await con.OpenAsync();

            using var cmd = new SqlCommand(
                scc.SprocName == "SaveUpdateSCC" ? "SaveUpdateSCC" : "SaveUpdateOther",
                con)
            {
                CommandType = CommandType.StoredProcedure
            };

            // Common params
            cmd.Parameters.AddWithValue("@CallNbr", scc.CallNbr);
            cmd.Parameters.AddWithValue("@EquipId", scc.EquipId);
            cmd.Parameters.AddWithValue("@SCCId", scc.SCCId);
            cmd.Parameters.AddWithValue("@Manufacturer", scc.Manufacturer ?? "");
            cmd.Parameters.AddWithValue("@ModelNo", scc.ModelNo ?? "");
            cmd.Parameters.AddWithValue("@SerialNo", scc.SerialNo ?? "");
            cmd.Parameters.AddWithValue("@Status", scc.Status ?? "");
            cmd.Parameters.AddWithValue("@Comments", scc.Comments ?? "");
            cmd.Parameters.AddWithValue("@Maint_Auth_ID", scc.Maint_Auth_ID);
            cmd.Parameters.AddWithValue("@StatusNotes", scc.StatusNotes ?? "");

            if (scc.SprocName == "SaveUpdateSCC")
            {
                cmd.Parameters.AddWithValue("@Temp", scc.Temp);

                cmd.Parameters.AddWithValue("@BypassVoltA", scc.BypassVoltA ?? "");
                cmd.Parameters.AddWithValue("@BypassVoltB", scc.BypassVoltB ?? "");
                cmd.Parameters.AddWithValue("@BypassVoltC", scc.BypassVoltC ?? "");

                cmd.Parameters.AddWithValue("@SupplyVoltA", scc.SupplyVoltA ?? "");
                cmd.Parameters.AddWithValue("@SupplyVoltB", scc.SupplyVoltB ?? "");
                cmd.Parameters.AddWithValue("@SupplyVoltC", scc.SupplyVoltC ?? "");

                cmd.Parameters.AddWithValue("@OutputVoltA", scc.OutputVoltA ?? "");
                cmd.Parameters.AddWithValue("@OutputVoltB", scc.OutputVoltB ?? "");
                cmd.Parameters.AddWithValue("@OutputVoltC", scc.OutputVoltC ?? "");

                cmd.Parameters.AddWithValue("@FirmwareVersion", scc.FirmwareVersion ?? "");
                cmd.Parameters.AddWithValue("@PhaseError", scc.PhaseError ?? "");
                cmd.Parameters.AddWithValue("@PartNos", scc.PartNos ?? "");
                cmd.Parameters.AddWithValue("@LoadCurrent", scc.LoadCurrent ?? "");
            }

            await cmd.ExecuteNonQueryAsync();
        }

        public async Task<List<BatteryReadingGraphDto>> GetBatteryReadingsGraphData(string callNbr,string equipNo)
        {
            var result = new List<BatteryReadingGraphDto>();

            await using var connection = new SqlConnection(_connectionString);
            await using var command = new SqlCommand("BatteryReadingsGraph", connection)
            {
                CommandType = CommandType.StoredProcedure
            };

            command.Parameters.Add("@CallNbr", SqlDbType.VarChar, 21).Value = callNbr;
            command.Parameters.Add("@EquipNo", SqlDbType.VarChar, 21).Value = equipNo;

            await connection.OpenAsync();

            await using var reader = await command.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                result.Add(new BatteryReadingGraphDto
                {
                    EquipID = reader.GetInt32(reader.GetOrdinal("EquipID")),
                    BatteryId = reader.GetInt32(reader.GetOrdinal("BatteryId")),
                    CallNbr = reader.GetString(reader.GetOrdinal("CallNbr")),

                    Status1 = reader["Status1"] as string,
                    Status2 = reader["Status2"] as string,

                    ErrorVDC = reader["ErrorVDC"] as decimal?,
                    LowErrorVDC = reader["LowErrorVDC"] as decimal?,
                    WarningVDC = reader["WarningVDC"] as decimal?,
                    LowWarningVDC = reader["LowWarningVDC"] as decimal?,

                    VDC = reader["VDC"] as decimal?,
                    NVDC = reader["NVDC"] as decimal?,

                    RefValue = reader["RefValue"] as decimal?,
                    RefPercent = reader["RefPercent"] as decimal?,
                    WarRef = reader["WarRef"] as decimal?,
                    ErrorRef = reader["ErrorRef"] as decimal?,

                    ReplacementNeeded = reader["ReplacementNeeded"] as string,
                    MonitoringBattery = reader["MonitoringBattery"] as string,
                    Cracks = reader["Cracks"] as string,

                    SpGravity = reader["SpGravity"] as decimal?,
                    Strap1 = reader["Strap1"] as decimal?,
                    Strap2 = reader["Strap2"] as decimal?,

                    ActionPlan = reader["ActionPlan"] as string,
                    ReadingType = reader["ReadingType"] is DBNull ? 0 : Convert.ToInt32(reader["ReadingType"]),
                    FloatVoltS = reader["FloatVoltS"] as string,

                    BatteryTypeName = reader["BatteryTypeName"] as string,
                    ChkmVAC = reader["chkmVAC"] as string,
                    ChkStrap = reader["chkStrap"] as string
                });
            }

            return result;
        }

        public async Task<GeneratorInfoDto> GetGeneratorInfoAsync(string callNbr, string equipNo, int equipId)
        {
            await using var connection = new SqlConnection(_connectionString);
            await using var command = new SqlCommand("etechGeneratorForm", connection)
            {
                CommandType = CommandType.StoredProcedure
            };

            var parameters = new DynamicParameters();
            parameters.Add("@CallId", callNbr);
            parameters.Add("@EquipId", equipId);
            parameters.Add("CodeId", equipNo);

            var result = await connection.QueryFirstOrDefaultAsync<GeneratorInfoDto>(
                "etechGeneratorForm",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            if (result == null)
            {
                throw new KeyNotFoundException("No SCC data found.");
            }

            return result;
        }

    }
}
