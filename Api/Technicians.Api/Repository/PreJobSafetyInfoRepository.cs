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
    public class PreJobSafetyInfoRepository
    {
        private readonly string _connectionString;

        public PreJobSafetyInfoRepository(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<bool> SaveOrUpdatePreJobSafetyInfoAsync(PreJobSafetyInfoDto dto)
        {
            using var conn = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand("SaveUpdatePreJobSafetyInfo", conn)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@CallNbr", dto.CallNbr ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@RespReviewed", dto.RespReviewed ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@WPRequired", dto.WPRequired ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@SlipTripFail", dto.SlipTripFail ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@NoiseHazard", dto.NoiseHazard ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@EyeInjury", dto.EyeInjury ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@DustMistFume", dto.DustMistFume ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@TempHazard", dto.TempHazard ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@FireHazard", dto.FireHazard ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@FireExtHazard", dto.FireExtHazard ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@ElectricHazard", dto.ElectricHazard ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@WorkingOverhead", dto.WorkingOverhead ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@TrafficHazard", dto.TrafficHazard ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@DCGIsolated", dto.DCGIsolated ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@BarricadeReqd", dto.BarricadeReqd ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@LockoutReqd", dto.LockoutReqd ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@LockProcReqd", dto.LockProcReqd ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@ChemicalHazard", dto.ChemicalHazard ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@ChemIdentified", dto.ChemIdentified ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@MSDSReviewed", dto.MSDSReviewed ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@HealthHazard", dto.HealthHazard ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@SafetyShower", dto.SafetyShower ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@HazardousWaste", dto.HazardousWaste ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@SpaceRequired", dto.SpaceRequired ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@SpaceProcReqd", dto.SpaceProcReqd ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@CustJobProcedure", dto.CustJobProcedure ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@SafetyProcRevewed", dto.SafetyProcRevewed ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@SpecialEquipReqd", dto.SpecialEquipReqd ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@ToolsInspected", dto.ToolsInspected ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@ApprLockouts", dto.ApprLockouts ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@ProtEquipReqd", dto.ProtEquipReqd ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@OtherContractors", dto.OtherContractors ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@AnyOtherHazards", dto.AnyOtherHazards ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Comments", dto.Comments ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@LastModifiedBy", dto.LastModifiedBy ?? (object)DBNull.Value);

            await conn.OpenAsync();
            await cmd.ExecuteNonQueryAsync();
            return true;
        }

        public async Task<List<PreJobSafetyInfoDto>> GetPreJobSafetyListInfoAsync(string callNbr)
        {
            var result = new List<PreJobSafetyInfoDto>();
            using var conn = new SqlConnection(_connectionString);
            using var cmd = new SqlCommand("GetPreJobSafetyListInfo", conn)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@CallNbr", callNbr ?? (object)DBNull.Value);

            await conn.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                var dto = new PreJobSafetyInfoDto
                {
                    CallNbr = reader["CallNbr"]?.ToString(),
                };
                result.Add(dto);
            }
            return result;
        }
    }
}
            
       


