using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Query.Internal;
using Microsoft.Extensions.Configuration;
using System.Data;
using System.Xml.Linq;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class PreJobSafetyListInfoRepository
    {
        private readonly string _connectionString;

        public PreJobSafetyListInfoRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<PreJobSafetyInfoDto?> GetPreJobSafetyInfoAsync(string callNbr)
        {
            PreJobSafetyInfoDto? dto = null;

            using var conn = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand("GetPreJobSafetyListInfo", conn)
            {
                CommandType = CommandType.StoredProcedure
            };

            cmd.Parameters.AddWithValue("@CallNbr", callNbr ?? (object)DBNull.Value);

            await conn.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                dto = new PreJobSafetyInfoDto
                {
                    CallNbr = callNbr,
                    RespReviewed = reader.GetValue(1)?.ToString(),
                    WPRequired = reader.GetValue(2)?.ToString(),
                    SlipTripFail = reader.GetValue(3)?.ToString(),
                    NoiseHazard = reader.GetValue(4)?.ToString(),
                    EyeInjury = reader.GetValue(5)?.ToString(),
                    DustMistFume = reader.GetValue(6)?.ToString(),
                    TempHazard = reader.GetValue(7)?.ToString(),
                    FireHazard = reader.GetValue(8)?.ToString(),
                    FireExtHazard = reader.GetValue(9)?.ToString(),
                    ElectricHazard = reader.GetValue(10)?.ToString(),
                    WorkingOverhead = reader.GetValue(11)?.ToString(),
                    TrafficHazard = reader.GetValue(12)?.ToString(),
                    DCGIsolated = reader.GetValue(13)?.ToString(),
                    BarricadeReqd = reader.GetValue(14)?.ToString(),
                    LockoutReqd = reader.GetValue(15)?.ToString(),
                    LockProcReqd = reader.GetValue(16)?.ToString(),
                    ChemicalHazard = reader.GetValue(17)?.ToString(),
                    ChemIdentified = reader.GetValue(18)?.ToString(),
                    MSDSReviewed = reader.GetValue(19)?.ToString(),
                    HealthHazard = reader.GetValue(20)?.ToString(),
                    SafetyShower = reader.GetValue(21)?.ToString(),
                    HazardousWaste = reader.GetValue(22)?.ToString(),
                    SpaceRequired = reader.GetValue(23)?.ToString(),
                    SpaceProcReqd = reader.GetValue(24)?.ToString(),
                    CustJobProcedure = reader.GetValue(25)?.ToString(),
                    SafetyProcRevewed = reader.GetValue(26)?.ToString(),
                    SpecialEquipReqd = reader.GetValue(27)?.ToString(),
                    ToolsInspected = reader.GetValue(28)?.ToString(),
                    ApprLockouts = reader.GetValue(29)?.ToString(),
                    ProtEquipReqd = reader.GetValue(30)?.ToString(),
                    OtherContractors = reader.GetValue(31)?.ToString(),
                    AnyOtherHazards = reader.GetValue(32)?.ToString(),
                    Comments = reader.GetValue(33)?.ToString()
                };
            }

            return dto;
        }


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

    }
}
