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

        public async Task<bool> SaveOrUpdatePreJobSafetyInfoAsync(PreJobSafetyInfoDto pjs, String empId)
        {
            try
            {
                using var conn = new SqlConnection(_connectionString);
                using var cmd = new SqlCommand("SaveUpdatePreJobSafetyInfo", conn)
                {
                    CommandType = CommandType.StoredProcedure
                };

                cmd.Parameters.AddWithValue("@CallNbr", pjs.CallNbr ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@RespReviewed", pjs.RespReviewed ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@WPRequired", pjs.WPRequired ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@SlipTripFail", pjs.SlipTripFail ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@NoiseHazard", pjs.NoiseHazard ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@EyeInjury", pjs.EyeInjury ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@DustMistFume", pjs.DustMistFume ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@TempHazard", pjs.TempHazard ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@FireHazard", pjs.FireHazard ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@FireExtHazard", pjs.FireExtHazard ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ElectricHazard", pjs.ElectricHazard ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@WorkingOverhead", pjs.WorkingOverhead ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@TrafficHazard", pjs.TrafficHazard ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@DCGIsolated", pjs.DCGIsolated ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@BarricadeReqd", pjs.BarricadeReqd ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@LockoutReqd", pjs.LockoutReqd ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@LockProcReqd", pjs.LockProcReqd ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ChemicalHazard", pjs.ChemicalHazard ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ChemIdentified", pjs.ChemIdentified ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@MSDSReviewed", pjs.MSDSReviewed ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@HealthHazard", pjs.HealthHazard ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@SafetyShower", pjs.SafetyShower ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@HazardousWaste", pjs.HazardousWaste ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@SpaceRequired", pjs.SpaceRequired ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@SpaceProcReqd", pjs.SpaceProcReqd ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@CustJobProcedure", pjs.CustJobProcedure ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@SafetyProcRevewed", pjs.SafetyProcRevewed ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@SpecialEquipReqd", pjs.SpecialEquipReqd ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ToolsInspected", pjs.ToolsInspected ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ApprLockouts", pjs.ApprLockouts ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ProtEquipReqd", pjs.ProtEquipReqd ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@OtherContractors", pjs.OtherContractors ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@AnyOtherHazards", pjs.AnyOtherHazards ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@Comments", pjs.Comments ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@LastModifiedBy", empId); // or replace with current user if available

                await conn.OpenAsync();
                await cmd.ExecuteNonQueryAsync();
                return true;
            }
            catch (Exception ex)
            {
                // optional: log exception
                return false;
            }
        }

    }
}
            
       


