using Dapper;
using Microsoft.Data.SqlClient;
using System.Data;
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

    }
}
