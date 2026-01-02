using Dapper;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using System.Data;
using Technicians.Api.Models;

namespace Technicians.Api.Repository
{
    public class TechToolsRepository
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;
        private readonly string _gpconnectionString;

        public TechToolsRepository(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("DefaultConnection");
            _gpconnectionString = _configuration.GetConnectionString("ETechGreatPlainsConnString");
        }

        public async Task<TechToolsResponseDto?> GetTechToolsMiscKitAsync(string techId)
        {
            await using var connection = new SqlConnection(_connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@TechID", techId, DbType.String, size: 21);

            await connection.OpenAsync();

            using var multi = await connection.QueryMultipleAsync(
                "GetTechToolsMiscKitByTechID",
                parameters,
                commandType: CommandType.StoredProcedure);

            var tools = (await multi.ReadAsync<TechToolDto>()).AsList();
            var techInfo = await multi.ReadFirstOrDefaultAsync<TechInfoDto>();

            if (!tools.Any() && techInfo == null)
                return null;

            return new TechToolsResponseDto
            {
                Tools = tools,
                TechInfo = techInfo
            };
        }

        public async Task<TechToolsPpeMetersDto?> GetByTechIdAsync(string techId)
        {
            await using var connection = new SqlConnection(_connectionString);

            var parameters = new DynamicParameters();
            parameters.Add("@TechID", techId, DbType.String, size: 31);

            await connection.OpenAsync();

            return await connection.QuerySingleOrDefaultAsync<TechToolsPpeMetersDto>(
                "GetTechToolsPPEMeterMisc",
                parameters,
                commandType: CommandType.StoredProcedure
            );
        }

        public async Task SaveUpdateTechToolsPPEMETERSAsync(TechToolsPpeMetersDto ppe)
        {
            await using var connection = new SqlConnection(_connectionString);

            var parameters = new DynamicParameters();

            parameters.Add("@TechID", ppe.TechID);
            parameters.Add("@RapidGate", ppe.RapidGate);

            parameters.Add("@TWIC", DateNormalizer.Normalize(ppe.TWIC));
            parameters.Add("@MineSafety", DateNormalizer.Normalize(ppe.MineSafety));
            parameters.Add("@CPRFAAED", DateNormalizer.Normalize(ppe.CPRFAAED));
            parameters.Add("@OSHA10", DateNormalizer.Normalize(ppe.OSHA10));
            parameters.Add("@SWAC", DateNormalizer.Normalize(ppe.SWAC));

            parameters.Add("@ArcFlashSuitSize", ppe.ArcFlashSuitSize);
            parameters.Add("@ArcFlashSuitDate", DateNormalizer.Normalize(ppe.ArcFlashSuitDate));
            parameters.Add("@Arc40FlashSize", ppe.Arc40FlashSize);
            parameters.Add("@Arc40FlashDate", DateNormalizer.Normalize(ppe.Arc40FlashDate));

            parameters.Add("@GloveSize", ppe.GloveSize);
            parameters.Add("@GloveRecDate", DateNormalizer.Normalize(ppe.GloveRecDate));
            parameters.Add("@ChFrJacket", ppe.ChFrJacket);
            parameters.Add("@ChFrJacketDate", DateNormalizer.Normalize(ppe.ChFrJacketDate));

            parameters.Add("@KleinProTechBP", ppe.KleinProTechBP);
            parameters.Add("@Cal12IUSoftHood", ppe.Cal12IUSoftHood);

            parameters.Add("@LinemansSleeves", ppe.LinemansSleeves);
            parameters.Add("@LinemannSlStraps", ppe.LinemannSlStraps);
            parameters.Add("@NitrileGloves", ppe.NitrileGloves);
            parameters.Add("@HardHatFaceSh", ppe.HardHatFaceSh);
            parameters.Add("@RubberGloves", ppe.RubberGloves);

            parameters.Add("@AcidApron", ppe.AcidApron);
            parameters.Add("@AcidFaceShield", ppe.AcidFaceShield);
            parameters.Add("@AcidFSHeadGear", ppe.AcidFSHeadGear);
            parameters.Add("@AcidSleeves", ppe.AcidSleeves);
            parameters.Add("@BagForGloves", ppe.BagForGloves);
            parameters.Add("@BagForFaceSh", ppe.BagForFaceSh);

            parameters.Add("@ClampMeter", ppe.ClampMeter);
            parameters.Add("@ClampMeterDt", DateNormalizer.Normalize(ppe.ClampMeterDt));
            parameters.Add("@Multimeter", ppe.Multimeter);
            parameters.Add("@MultimeterDt", DateNormalizer.Normalize(ppe.MultimeterDt));
            parameters.Add("@TorqueWrench", ppe.TorqueWrench);
            parameters.Add("@TorqueWrenchDt", DateNormalizer.Normalize(ppe.TorqueWrenchDt));
            parameters.Add("@IRGun", ppe.IRGun);
            parameters.Add("@IRGunDt", DateNormalizer.Normalize(ppe.IRGunDt));

            parameters.Add("@Midtronics6000", ppe.Midtronics6000);
            parameters.Add("@Midtronics6000Dt", DateNormalizer.Normalize(ppe.Midtronics6000Dt));

            parameters.Add("@PhSeqTester", ppe.PhSeqTester);
            parameters.Add("@PhSeqRecvdDt", DateNormalizer.Normalize(ppe.PhSeqRecvdDt));

            parameters.Add("@TSALocks", ppe.TSALocks);
            parameters.Add("@DCGCarMagnet", ppe.DCGCarMagnet);
            parameters.Add("@ChickenWire", ppe.ChickenWire);
            parameters.Add("@Potentiometer", ppe.Potentiometer);
            parameters.Add("@DEWALT", ppe.DEWALT);
            parameters.Add("@TechToolBox", ppe.TechToolBox);
            parameters.Add("@MeterHKit", ppe.MeterHKit);
            parameters.Add("@Fluke225", ppe.Fluke225);
            parameters.Add("@FuseKit", ppe.FuseKit);

            parameters.Add("@PanduitLockout", ppe.PanduitLockout);
            parameters.Add("@NeikoToolSet", ppe.NeikoToolSet);
            parameters.Add("@USBCamera", ppe.USBCamera);
            parameters.Add("@Vacuum", ppe.Vacuum);
            parameters.Add("@LockoutKit", ppe.LockoutKit);
            parameters.Add("@BatterySpillKit", ppe.BatterySpillKit);

            parameters.Add("@HeatSinkPaste", ppe.HeatSinkPaste);
            parameters.Add("@GFCICord", ppe.GFCICord);
            parameters.Add("@MiniGrabber2", ppe.MiniGrabber2);
            parameters.Add("@MiniGrabber4", ppe.MiniGrabber4);
            parameters.Add("@CompactFAKit", ppe.CompactFAKit);
            parameters.Add("@InsMagnTool", ppe.InsMagnTool);
            parameters.Add("@MattedFloorMat", ppe.MattedFloorMat);

            parameters.Add("@Notes", ppe.Notes);
            parameters.Add("@ModifiedBy", ppe.ModifiedBy);

            await connection.ExecuteAsync(
                "SaveUpdateTechToolsPPEMeterMisc",
                parameters,
                commandType: CommandType.StoredProcedure
            );
        }
        public async Task<int> GetTechToolsMiscCountAsync(string techId)
        {
            await using var connection = new SqlConnection(_connectionString);

            return await connection.ExecuteScalarAsync<int>(
                "GetTechToolsCount",
                new { TechID = techId },
                commandType: CommandType.StoredProcedure
            );
        }

        public async Task DeleteReplaceToolsMiscAsync(string techId, List<TechToolItemDto> items, string modifiedBy)
        {
            await using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            using var transaction = connection.BeginTransaction();

            try
            {
                // 1️⃣ Delete existing rows
                await connection.ExecuteAsync(
                    "DeleteTechToolsMisc",
                    new { TechID = techId },
                    transaction,
                    commandType: CommandType.StoredProcedure
                );

                // 2️⃣ Insert rows (parameterized, SAFE)
                const string insertSql = @"
            INSERT INTO dbo.TechToolsMiscKitPNo
            (
                ToolKitPNMisc,
                Description,
                TechValue,
                TechID,
                ModifiedOn,
                ModifiedBy,
                ColumnOrder
            )
            VALUES
            (
                @ToolKitPNMisc,
                @Description,
                @TechValue,
                @TechID,
                CURRENT_TIMESTAMP,
                @ModifiedBy,
                @ColumnOrder
            )";

                foreach (var item in items)
                {
                    await connection.ExecuteAsync(
                        insertSql,
                        new
                        {
                            item.ToolKitPNMisc,
                            item.Description,
                            item.TechValue,
                            TechID = techId,
                            ModifiedBy = modifiedBy,
                            item.ColumnOrder
                        },
                        transaction
                    );
                }

                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }



        public static class DateNormalizer
        {
            public static DateTime Normalize(DateTime value)
            {
                return value == default || value.Year < 1901
                    ? new DateTime(1900, 1, 1)
                    : value;
            }
        }


    }
}
